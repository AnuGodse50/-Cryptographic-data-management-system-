// SERVER-ONLY. The judge's case brief: rule-based observations over the VERIFIED text of the case file, each tied to the
// legal-corpus entries it rests on. The rules point at what to check; they never conclude guilt, admissibility or truth.
import { CASE_STAGES, type CaseStage, type DocType, type JudgeBrief, type Suggestion } from "@/types/api";
import { logDenied } from "../audit";
import { forbidden } from "../errors";
import type { EvidenceDeps } from "../evidence";
import { isCourt } from "../policy";
import type { SessionUser } from "../session";
import { readCaseFile, type CaseText } from "./case-file";
import { legal } from "./knowledge";

const ELECTRONIC = /\b(cctv|footage|video|dvr|mobile phone|cell ?phone|smartphone|call detail|cdr|whatsapp|e-?mail|pen ?drive|hard ?disk|laptop|computer|screenshot|electronic record|digital)\b/i;
const CERTIFICATE = /\b(section 63|s\.? ?63|65 ?-?b|certificate)\b/i;
const SEIZURE = /\b(seiz\w*|recover\w*|panchnama|search(ed)? (of|at) )/i;
const RECORDED_ON_VIDEO = /\b(videograph\w*|audio-?video|recorded on (video|camera)|body ?cam\w*)\b/i;
const CONFESSION = /\bconfess\w*/i;

const atOrPast = (stage: string, mark: CaseStage) => CASE_STAGES.indexOf(stage as CaseStage) >= CASE_STAGES.indexOf(mark);
const ofType = (docs: CaseText[], t: DocType) => docs.filter((d) => d.row.type === t);
const matching = (docs: CaseText[], re: RegExp) => docs.filter((d) => re.test(d.text));
const names = (docs: CaseText[]) => docs.map((d) => d.row.filename).join(", ");

export function briefRules(stage: string, docs: CaseText[], excluded: JudgeBrief["excluded"], originalAvailable: (id: string) => boolean): Suggestion[] {
  const out: Suggestion[] = [];

  for (const x of excluded) out.push({
    kind: "INTEGRITY", priority: "ACTION", title: `Do not rely on ${x.filename}`, docIds: [x.docId],
    detail: `The stored copy no longer matches its signed original, so it was left out of this brief. ${originalAvailable(x.docId)
      ? "A locked original is retained: direct a restore and ask for an explanation of the change."
      : "No locked original is available: call for the source copy and an explanation."}`,
    legal: legal("CTRL-CHAIN-OF-CUSTODY", "CTRL-INCIDENT-RESPONSE", "IN-BSA-63"),
  });
  const unanchored = docs.filter((d) => d.verification.status !== "VERIFIED");
  if (unanchored.length) out.push({
    kind: "INTEGRITY", priority: "CHECK", title: "Not yet anchored on-chain", docIds: unanchored.map((d) => d.row.id),
    detail: `${names(unanchored)} passed the content and signature checks but are not yet sealed on-chain. Re-verify before final reliance.`,
    legal: legal("CTRL-APPEND-ONLY-AUDIT"),
  });

  if (atOrPast(stage, "CHARGE_SHEET_FILED") && !ofType(docs, "CHARGE_SHEET").length) out.push({
    kind: "MISSING_RECORD", priority: "ACTION", title: "No police report (charge sheet) on file", docIds: [],
    detail: "The case is at or past the charge-sheet stage, but no verified charge sheet is in the file. Call for the final report and its annexures.",
    legal: legal("IN-BNSS-193"),
  });
  if (atOrPast(stage, "CHARGE_SHEET_FILED") && !ofType(docs, "FORENSIC_REPORT").length) out.push({
    kind: "MISSING_RECORD", priority: "CHECK", title: "No forensic report on file", docIds: [],
    detail: "No verified forensic report is in the file. Confirm whether one was sought, and whether the prosecution relies on any scientific evidence.",
    legal: legal("IN-BNSS-176", "CTRL-CHAIN-OF-CUSTODY"),
  });

  const electronic = matching(docs, ELECTRONIC);
  if (electronic.length) {
    const certified = matching(docs, CERTIFICATE).length > 0;
    out.push({
      kind: "ELECTRONIC_EVIDENCE", priority: certified ? "CHECK" : "ACTION", docIds: electronic.map((d) => d.row.id),
      title: certified ? "Electronic evidence: check the section 63 certificate" : "Electronic evidence without a section 63 certificate",
      detail: `${names(electronic)} refer to electronic records (CCTV, phone, digital media). ${certified
        ? "A certificate is mentioned in the file; check that it carries the particulars and signatories the statute requires."
        : "No certificate is mentioned anywhere in the verified file. A hash or this system's signature is not that certificate."}`,
      legal: legal("IN-BSA-63", "CTRL-CERTIFICATE-SECTION63", "IN-BSA-61"),
    });
  }

  const seized = matching(docs, SEIZURE);
  if (seized.length && !matching(seized, RECORDED_ON_VIDEO).length) out.push({
    kind: "SEARCH_SEIZURE", priority: "CHECK", title: "Search or seizure without a recorded video", docIds: seized.map((d) => d.row.id),
    detail: `${names(seized)} describe a search, seizure or recovery, but the verified text does not mention audio-video recording of it.`,
    legal: legal("IN-BNSS-105", "CTRL-CHAIN-OF-CUSTODY"),
  });

  const confession = matching(docs, CONFESSION);
  if (confession.length) out.push({
    kind: "STATEMENTS", priority: "ACTION", title: "A confession is mentioned", docIds: confession.map((d) => d.row.id),
    detail: `${names(confession)} mention a confession. Check whether it was recorded by a Magistrate with the statutory safeguards; a statement made to police is not the same thing.`,
    legal: legal("IN-BNSS-183", "IN-BNSS-181", "IN-CONST-20-3"),
  });
  const statements = ofType(docs, "WITNESS_STATEMENT");
  if (statements.length) out.push({
    kind: "STATEMENTS", priority: "CHECK", title: `${statements.length} witness statement${statements.length > 1 ? "s" : ""} recorded by police`, docIds: statements.map((d) => d.row.id),
    detail: "Statements recorded by police during investigation have limited use at trial. Compare them with the FIR and with each other for inconsistencies.",
    legal: legal("IN-BNSS-180", "IN-BNSS-181"),
  });

  return out.sort((a, b) => (a.priority === b.priority ? 0 : a.priority === "ACTION" ? -1 : 1));
}

export async function judgeBrief(user: SessionUser, caseId: string, deps?: EvidenceDeps): Promise<JudgeBrief> {
  if (!isCourt(user.role)) {
    await logDenied(user.id, "case brief refused: court roles only", { caseId });
    throw forbidden("Only the court can generate a case brief");
  }
  const file = await readCaseFile(user, caseId, "judge case brief", deps);
  return {
    caseId, firNo: file.firNo, stage: file.stage as CaseStage, generatedAt: new Date().toISOString(), documentsChecked: file.checked,
    suggestions: briefRules(file.stage, file.docs, file.excluded, (id) => file.originals.get(id) ?? false),
    excluded: file.excluded,
  };
}
