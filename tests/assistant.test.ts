import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { advocateSuggestions } from "../lib/assistant/advocate";
import { askCase } from "../lib/assistant/ask";
import { textOf } from "../lib/assistant/case-file";
import { judgeBrief } from "../lib/assistant/judge";
import { legalCorpus, searchLegal } from "../lib/assistant/knowledge";
import { generateSeeds } from "../lib/crypto/pqc";
import { insiderAttack } from "../lib/demo-attack";
import { createPgliteDatabase, setDbForTests, type Database } from "../lib/db";
import { demoUserByRole } from "../lib/demo-users";
import { ApiError } from "../lib/errors";
import { uploadDocument } from "../lib/evidence";
import { ensureDemoUsers } from "../lib/seed";
import type { SessionUser } from "../lib/session";
import { LocalPartStore } from "../lib/storage/part-store";

let db: Database; let store: LocalPartStore; let dir: string; let caseId: string; let firNo: string;
let firId: string; let statementId: string;
const U = (role: Parameters<typeof demoUserByRole>[0]) => demoUserByRole(role) as SessionUser;
const police = U("POLICE"), judge = U("JUDGE"), advocate = U("DEFENCE_ADVOCATE"), complainant = U("COMPLAINANT");
const deps = () => ({ store, chainService: null });

const FIR = "FIRST INFORMATION REPORT. On 10 June 2026 at 21:15 a gold chain was snatched from the complainant near Gangapur Road. " +
  "CCTV footage from a shop camera shows two men on a black motorcycle. The complainant suspects Rahul More.";
const STATEMENT = "STATEMENT OF WITNESS Manisha Patil. I saw a black motorcycle stop near the temple at about 21:10. " +
  "Rahul More later told me he would confess to the police. The chain was recovered from his house during a search.";

const upload = (filename: string, type: "FIR" | "WITNESS_STATEMENT", body: string) =>
  uploadDocument(police, { caseId, type, filename, mimeType: "text/plain", bytes: Buffer.from(body) }, { store });
const code = async (p: Promise<unknown>) => { try { await p; } catch (e) { return e instanceof ApiError ? e.code : `non-api:${(e as Error).message}`; } return "OK"; };

before(async () => {
  Object.assign(process.env, { ...(() => { const s = generateSeeds(); return { PQC_KEM_SEED: s.kemSeed, PQC_DSA_SEED: s.dsaSeed }; })(), SAKSHYA_ALLOW_ATTACK_IN_TESTS: "1" });
  delete process.env.BEDROCK_CHAT_MODEL_ID;
  dir = await mkdtemp(path.join(tmpdir(), "sakshya-ai-"));
  store = new LocalPartStore(dir);
  db = await createPgliteDatabase(); setDbForTests(db); await ensureDemoUsers(db);
  const c = await db.withUser(police.id, async (tx) => (await tx.query("SELECT case_id, fir_no FROM create_case($1)", [complainant.id])).rows[0]);
  caseId = c.case_id; firNo = c.fir_no;
  firId = (await upload("FIR.txt", "FIR", FIR)).document.id;
  statementId = (await upload("Witness_1.txt", "WITNESS_STATEMENT", STATEMENT)).document.id;
  await db.withAdmin((tx) => tx.query("UPDATE cases SET stage = 'CHARGE_SHEET_FILED' WHERE id = $1", [caseId]));
});
after(async () => { setDbForTests(undefined); await db.close(); await rm(dir, { recursive: true, force: true }); });

describe("text extraction", () => {
  it("reads the text layer of an imported case PDF", async () => {
    const text = await textOf(await readFile(path.join(process.cwd(), "data", "cases", "G01", "FIR.pdf")), "application/pdf");
    assert.match(text, /FIRST INFORMATION REPORT/);
    assert.equal(await textOf(Buffer.from([0x89, 0x50]), "image/png"), "");
  });
});

describe("legal corpus", () => {
  it("loads all 42 curated entries and finds the electronic-evidence section for a CCTV question", () => {
    assert.equal(legalCorpus().length, 42);
    assert.ok(searchLegal("Is the CCTV footage admissible without a certificate?").some((l) => l.id === "IN-BSA-63"));
  });
});

describe("case Q&A", () => {
  it("answers with verbatim quotes from verified documents, plus related law", async () => {
    const a = await askCase(judge, caseId, "What vehicle was seen at the scene?", deps());
    assert.equal(a.mode, "RETRIEVAL");
    assert.equal(a.noAnswer, false);
    assert.ok(a.citations.length > 0);
    for (const c of a.citations) assert.ok([FIR, STATEMENT].some((t) => t.includes(c.quote)), "quote is verbatim");
    assert.ok(a.citations.some((c) => /motorcycle/.test(c.quote)));
    assert.equal(a.excluded.length, 0);
  });

  it("shows nothing to a user who cannot see the case (RLS before retrieval)", async () => {
    assert.notEqual(await code(askCase(advocate, caseId, "Who is the accused?", deps())), "OK");
  });

  it("audits that the assistant read each document", async () => {
    const rows = await db.withAdmin(async (tx) => (await tx.query("SELECT detail FROM audit_log WHERE case_id = $1 AND action = 'VIEW'", [caseId])).rows);
    assert.ok(rows.some((r) => String(r.detail).startsWith("assistant:")));
  });
});

describe("judge brief", () => {
  it("flags the missing charge sheet, the uncertified CCTV, the confession and the unrecorded seizure", async () => {
    const b = await judgeBrief(judge, caseId, deps());
    assert.equal(b.firNo, firNo);
    const kinds = b.suggestions.map((s) => `${s.kind}:${s.priority}`);
    assert.ok(kinds.includes("MISSING_RECORD:ACTION"), "no charge sheet at CHARGE_SHEET_FILED");
    assert.ok(kinds.includes("ELECTRONIC_EVIDENCE:ACTION"), "CCTV without a s.63 certificate");
    assert.ok(kinds.includes("SEARCH_SEIZURE:CHECK"));
    assert.ok(b.suggestions.some((s) => s.kind === "STATEMENTS" && s.priority === "ACTION" && s.docIds.includes(statementId)));
    assert.ok(b.suggestions.every((s) => s.legal.length > 0), "every suggestion cites the corpus");
  });

  it("is refused to non-court roles", async () => {
    assert.equal(await code(judgeBrief(police, caseId, deps())), "FORBIDDEN");
  });

  it("never reads a tampered document and tells the judge not to rely on it", async () => {
    await insiderAttack(firId, 20, store);
    const b = await judgeBrief(judge, caseId, deps());
    assert.deepEqual(b.excluded.map((x) => [x.docId, x.status]), [[firId, "TAMPERED"]]);
    assert.ok(b.suggestions[0].kind === "INTEGRITY" && b.suggestions[0].docIds.includes(firId));
    const a = await askCase(judge, caseId, "What does the CCTV footage show?", deps());
    assert.ok(a.citations.every((c) => c.docId !== firId), "tampered FIR is never quoted");
  });
});

describe("advocate suggestions", () => {
  it("lists requestable documents by priority with a pre-filled statutory basis, from titles only", async () => {
    const s = await advocateSuggestions(advocate, firNo);
    assert.equal(s.caseId, caseId);
    assert.deepEqual(s.items.map((i) => i.type).sort(), ["FIR", "WITNESS_STATEMENT"]);
    assert.ok(s.items.every((i) => i.priority === "HIGH" && i.basisCode === "STATUTORY_DISCLOSURE" && /s\.230/.test(i.citation)));
    assert.ok(s.items.every((i) => i.requestStatus === null));
  });

  it("is refused to police", async () => {
    assert.equal(await code(advocateSuggestions(police, firNo)), "FORBIDDEN");
  });
});
