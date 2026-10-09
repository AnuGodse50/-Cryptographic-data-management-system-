// SERVER-ONLY. Tells a defence advocate which documents in a case are worth requesting, and on what legal basis.
// Built from the title-only request catalog: nothing is decrypted, so this never leaks content the court has not granted.
import { CASE_STAGES, type AdvocateSuggestion, type AdvocateSuggestions, type DocType, type RequestStatus } from "@/types/api";
import { listRequests, lookupCatalog } from "../requests";
import type { SessionUser } from "../session";
import { legal } from "./knowledge";

const AFTER_REPORT = "BNSS 2023 s.230 (supply to the accused of the police report and the documents relied on)";
const BEFORE_REPORT = "BNSS 2023 s.230, to be supplied once the police report is filed; early access sought from the court for the stated reason";

const WHY: Record<DocType, { priority: AdvocateSuggestion["priority"]; why: string; legal: string[] }> = {
  FIR: { priority: "HIGH", legal: ["IN-BNSS-173"],
    why: "The first recorded version of events. Compare its time, place and the names it gives with every later statement." },
  WITNESS_STATEMENT: { priority: "HIGH", legal: ["IN-BNSS-180", "IN-BNSS-181"],
    why: "Statements recorded by police can be used to contradict the witness at trial, so you need the exact text." },
  CHARGE_SHEET: { priority: "HIGH", legal: ["IN-BNSS-193"],
    why: "The police report sets out what the prosecution will rely on and lists the documents annexed to it." },
  FORENSIC_REPORT: { priority: "MEDIUM", legal: ["IN-BNSS-176", "CTRL-CHAIN-OF-CUSTODY"],
    why: "Check how and when samples were collected and handled; gaps in custody go to the weight of the report." },
};

export async function advocateSuggestions(user: SessionUser, firNo: string): Promise<AdvocateSuggestions> {
  const catalog = await lookupCatalog(user, firNo); // enforces advocate/court and audits refusals
  const reportFiled = CASE_STAGES.indexOf(catalog.stage) >= CASE_STAGES.indexOf("CHARGE_SHEET_FILED");

  // this advocate's own requests on the case (RLS), newest first, so the first match per document is the current one
  const mine = user.role === "DEFENCE_ADVOCATE" ? (await listRequests(user, { caseId: catalog.caseId }, { limit: 100, offset: 0 })).items : [];
  const statusOf = (docId: string): RequestStatus | null => mine.find((r) => r.documentIds.includes(docId))?.status ?? null;

  // the catalog lists every version; the newest version of each document type + filename is the one to ask for first
  const newest = new Map<string, number>();
  for (const d of catalog.documents) newest.set(`${d.type}|${d.filename}`, Math.max(newest.get(`${d.type}|${d.filename}`) ?? 0, d.version));

  const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
  const items = catalog.documents.map((d): AdvocateSuggestion => {
    const rule = WHY[d.type];
    const latest = newest.get(`${d.type}|${d.filename}`) === d.version;
    return {
      documentId: d.id, type: d.type, filename: d.filename, version: d.version, latest,
      priority: latest ? rule.priority : "LOW",
      why: latest ? rule.why : `An earlier version (v${d.version}). Ask for it only if you need to show what changed between versions.`,
      basisCode: "STATUTORY_DISCLOSURE",
      citation: reportFiled ? AFTER_REPORT : BEFORE_REPORT,
      legal: legal(...rule.legal),
      requestStatus: statusOf(d.id),
    };
  }).sort((a, b) => rank[a.priority] - rank[b.priority] || a.type.localeCompare(b.type) || b.version - a.version);

  return { caseId: catalog.caseId, firNo: catalog.firNo, stage: catalog.stage, items };
}
