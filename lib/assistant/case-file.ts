// SERVER-ONLY. Reads a case file for the assistant: only documents the user can see (RLS), only the latest version of each,
// and only after the same six-check verification the viewer uses. Plaintext stays in memory for the length of one request.
import { extractText, getDocumentProxy } from "unpdf";
import type { ExcludedDoc, VerifyResult } from "@/types/api";
import { writeAudit } from "../audit";
import { getDb, type Row } from "../db";
import { forbidden } from "../errors";
import { basisFor, loadDoc, readerOf, recordVerification, storeOf, verifyLoaded, type EvidenceDeps, type LoadedDoc } from "../evidence";
import type { SessionUser } from "../session";
import { getChain } from "../chain";

export interface CaseText { row: Row; text: string; verification: VerifyResult }
export interface CaseFile {
  caseId: string; firNo: string; stage: string; docs: CaseText[]; excluded: ExcludedDoc[]; checked: number;
  /** docId → whether S3 Object Lock still holds a verifiable original (what a restore would need). */
  originals: Map<string, boolean>;
}

const MAX_DOCS = 40;
const CONCURRENCY = 4;

/** Best-effort text: PDF text layer and plain text. Images and DOCX yield "" (they are still verified and listed). */
export async function textOf(bytes: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "text/plain") return bytes.toString("utf8");
  if (mimeType !== "application/pdf") return "";
  try {
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    return (await extractText(pdf, { mergePages: true })).text;
  } catch {
    return "";
  }
}

/**
 * Verifies every visible latest-version document in the case and returns the text of the ones that pass.
 * `purpose` goes into the audit detail so the custody trail shows the assistant read the document, and for whom.
 */
export async function readCaseFile(user: SessionUser, caseId: string, purpose: string, deps?: EvidenceDeps): Promise<CaseFile> {
  const db = await getDb();
  const store = storeOf(deps);
  const reader = await readerOf(deps);

  const { head, loaded } = await db.withUser(user.id, async (tx) => {
    const head = (await tx.query<{ fir_no: string; stage: string }>("SELECT fir_no, stage FROM cases WHERE id = $1", [caseId])).rows[0];
    if (!head) throw forbidden("You do not have access to this case");
    // latest version only: a document that another document names as its parent has been superseded
    const ids = (await tx.query<{ id: string }>(
      `SELECT d.id FROM documents d WHERE d.case_id = $1
          AND NOT EXISTS (SELECT 1 FROM documents n WHERE n.parent_id = d.id)
        ORDER BY d.created_at, d.id LIMIT ${MAX_DOCS}`, [caseId])).rows;
    const loaded: LoadedDoc[] = [];
    for (const { id } of ids) loaded.push(await loadDoc(tx, id));
    return { head, loaded };
  });

  const outcomes = new Array<{ result: VerifyResult; plaintext: Buffer | null }>(loaded.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, loaded.length) }, async () => {
    for (let i = next++; i < loaded.length; i = next++) outcomes[i] = await verifyLoaded(loaded[i], store, reader);
  }));

  const docs: CaseText[] = [];
  const excluded: ExcludedDoc[] = [];
  const tamperEvents = await db.withUser(user.id, async (tx) => {
    const events = [];
    for (let i = 0; i < loaded.length; i++) {
      const { row } = loaded[i];
      const { result, plaintext } = outcomes[i];
      // an advocate whose grant has lapsed can still see the title row but must not have the content read for them
      const basis = await basisFor(tx, user, row.id).catch(() => null);
      if (!basis) continue;
      const ev = await recordVerification(tx, user, row, result, basis, "assistant");
      if (ev) events.push(ev);
      if (!plaintext || result.status === "TAMPERED" || result.status === "ERROR") {
        excluded.push({ docId: row.id, filename: row.filename, status: result.status,
          reason: "Failed integrity verification, so the assistant did not read it. Restore the locked original before relying on it." });
        continue;
      }
      await writeAudit(tx, { actorId: user.id, action: "VIEW", docId: row.id, caseId, basis, detail: `assistant: ${purpose}` });
      docs.push({ row, text: (await textOf(plaintext, row.mime_type)).replace(/\s+/g, " ").trim(), verification: result });
    }
    return events;
  });

  // a tamper found here is published to the chain exactly as a scan would publish it
  const chain = deps && "chainService" in deps ? deps.chainService ?? null : await getChain();
  if (chain) for (const e of tamperEvents)
    void chain.auditEvent({ subject: { docId: e.docId, caseId: e.caseId }, action: "TAMPER_DETECTED", actorId: user.id, entryHash: e.entryHash, label: `TAMPER DETECTED in ${e.filename}: ${e.ranges}` });

  const originals = new Map(loaded.map((l, i) => [l.row.id as string, outcomes[i].result.originalVersionAvailable]));
  return { caseId, firNo: head.fir_no, stage: head.stage, docs, excluded, checked: loaded.length, originals };
}

/** Splits extracted text into ~500-character passages on sentence boundaries, for ranking and quoting. */
export function passages(text: string, target = 500): string[] {
  const sentences = text.split(/(?<=[.?!])\s+(?=[A-Z0-9"'(])/);
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > target) { out.push(cur); cur = ""; }
    cur = cur ? `${cur} ${s}` : s;
  }
  if (cur.trim()) out.push(cur);
  return out;
}
