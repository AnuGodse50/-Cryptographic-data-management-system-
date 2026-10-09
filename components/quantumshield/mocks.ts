import type { AssemblyReport, AuditChainResult, AuditEntry, BatchSummary, CaseDetail, CaseProgress, CaseSummary, ChainInfo, DocumentDetail, DocumentRequest, DocumentSummary, Page, Role, ScanDetail, Session, VerifyResult } from "@/types/api"

const HASH_A = "0123456789abcdef".repeat(4)
const HASH_B = "abcdef0123456789".repeat(4)
const HASH_C = "1234567890abcdef".repeat(4)
const ROOT = `0x${HASH_A}`
const TX = `0x${HASH_B}`

const MOCK_SESSIONS: Record<Role, Session> = {
  POLICE: { user: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Inspector Aditi Patil", email: "aditi.patil@demo.invalid", role: "POLICE", station: "Gangapur Police Station", clearance: 4 }, canCreateCase: true, allowedUploadTypes: ["FIR", "WITNESS_STATEMENT"], assistantEnabled: false },
  FORENSIC_LAB: { user: { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Dr. Neha Kulkarni", email: "neha.kulkarni@demo.invalid", role: "FORENSIC_LAB", station: "Regional Forensic Science Laboratory", clearance: 4 }, canCreateCase: false, allowedUploadTypes: ["FORENSIC_REPORT"], assistantEnabled: false },
  PUBLIC_PROSECUTOR: { user: { id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", name: "Adv. Rohan Deshmukh", email: "rohan.deshmukh@demo.invalid", role: "PUBLIC_PROSECUTOR", station: "District Prosecution Office", clearance: 4 }, canCreateCase: false, allowedUploadTypes: ["CHARGE_SHEET"], assistantEnabled: false },
  JUDGE: { user: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", name: "Justice Meera Joshi", email: "meera.joshi@demo.invalid", role: "JUDGE", station: "District and Sessions Court", clearance: 5 }, canCreateCase: false, allowedUploadTypes: [], assistantEnabled: false },
  ADMIN: { user: { id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee", name: "Demo Administrator", email: "admin@demo.invalid", role: "ADMIN", station: "QuantumShield Operations", clearance: 5 }, canCreateCase: false, allowedUploadTypes: [], assistantEnabled: false },
  DEFENCE_ADVOCATE: { user: { id: "ffffffff-ffff-4fff-8fff-ffffffffffff", name: "Adv. Kavya Shah", email: "kavya.shah@demo.invalid", role: "DEFENCE_ADVOCATE", station: "Nashik District Bar", clearance: 2 }, canCreateCase: false, allowedUploadTypes: [], assistantEnabled: false },
  COMPLAINANT: { user: { id: "99999999-9999-4999-8999-999999999999", name: "Ananya More", email: "ananya.more@demo.invalid", role: "COMPLAINANT", station: "Gangapur Police Station", clearance: 1 }, canCreateCase: false, allowedUploadTypes: [], assistantEnabled: false },
}
const configuredRole = process.env.NEXT_PUBLIC_DEMO_ROLE as Role | undefined
export const MOCK_SESSION: Session = MOCK_SESSIONS[configuredRole && configuredRole in MOCK_SESSIONS ? configuredRole : "POLICE"]

const counts = (verified: number, tampered = 0) => ({ VERIFIED: verified, TAMPERED: tampered, PENDING_ANCHOR: 0, UNANCHORED: 0, ERROR: 0, unchecked: 0 })
export const MOCK_CASES: Page<CaseSummary> = { items: [
  { id: "11111111-1111-4111-8111-111111111111", firNo: "NSK/2026/0142", station: "Gangapur Police Station", stage: "INVESTIGATION", status: "OPEN", createdAt: "2026-10-10T04:40:00Z", documentCount: 2, integrity: counts(1, 1) },
  { id: "22222222-2222-4222-8222-222222222222", firNo: "NSK/2026/0187", station: "Panchavati Police Station", stage: "FORENSIC_ANALYSIS", status: "OPEN", createdAt: "2026-10-09T13:20:00Z", documentCount: 1, integrity: counts(1) },
], nextCursor: null }

export const MOCK_CASE: CaseDetail = { ...MOCK_CASES.items[0], allowedUploadTypes: ["FIR", "WITNESS_STATEMENT"], canUpload: true, assignments: [
  { userName: "Inspector Aditi Patil", role: "POLICE" }, { userName: "Dr. Neha Kulkarni", role: "FORENSIC_LAB" }, { userName: "Adv. Rohan Deshmukh", role: "PUBLIC_PROSECUTOR" },
], manifest: { version: 2, root: HASH_B, documentCount: 2, sealedAt: "2026-10-10T05:02:00Z", anchor: { txHash: TX, explorerUrl: null, status: "confirmed" } }, canAssemble: true, canRequestDocuments: false }

const documentBase: DocumentSummary = {
  id: "33333333-3333-4333-8333-333333333333", caseId: MOCK_CASE.id, filename: "FIR_0142.txt", type: "FIR", version: 1, parentId: null, sizeBytes: 16_384, mimeType: "text/plain", uploaderName: "Inspector Aditi Patil", createdAt: "2026-10-10T05:00:00Z", sha256: HASH_A, chunkRoot: HASH_B, chunkCount: 4, partCount: 1, verificationStatus: "TAMPERED", verifiedAt: "2026-10-10T05:03:00Z",
}
const report: DocumentSummary = { ...documentBase, id: "44444444-4444-4444-8444-444444444444", filename: "Forensic_Report_0142.pdf", type: "FORENSIC_REPORT", sizeBytes: 188_416, mimeType: "application/pdf", uploaderName: "Dr. Neha Kulkarni", createdAt: "2026-10-10T05:01:00Z", sha256: HASH_C, chunkCount: 46, verificationStatus: "VERIFIED", verifiedAt: "2026-10-10T05:03:00Z" }
export const MOCK_DOCUMENTS: Page<DocumentSummary> = { items: [documentBase, report], nextCursor: null }
export const MOCK_DOCUMENT: DocumentDetail = { ...documentBase, versions: [documentBase], signature: { algorithm: "ML-DSA-65", signerName: "Inspector Aditi Patil", publicKeyHash: HASH_C }, canPreview: false, canDownload: false, canAddVersion: true, canRestore: true, access: { via: "ROLE" } }
export const MOCK_GRANTED_DOCUMENT: DocumentDetail = { ...MOCK_DOCUMENT, id: "77777777-7777-4777-8777-777777777777", filename: "Granted_FIR_0142.txt", verificationStatus: "VERIFIED", canPreview: true, canDownload: true, canAddVersion: false, canRestore: false, access: { via: "GRANT", requestId: "88888888-8888-4888-8888-888888888888", orderRef: "DCC/ORDER/2026/118", expiresAt: "2026-10-17T18:29:59Z" } }

export const MOCK_TAMPERED_RESULT: VerifyResult = {
  status: "TAMPERED", checks: { decrypt: "pass", plaintextHash: "fail", chunkRoot: "fail", signature: "pass", merkleProof: "pass", onChainRoot: "pass" },
  tamperRanges: [{ chunkIndex: 2, byteStart: 8192, byteEnd: 12287, kind: "modified" }], parts: [
    { index: 0, byteStart: 0, byteEnd: 16383, address: HASH_A, status: "fail" },
  ],
  anchor: { batchId: 42, root: ROOT, txHash: TX, explorerUrl: null, status: "confirmed" },
  lastAccessors: [
    { actorName: "Inspector Aditi Patil", role: "POLICE", action: "UPLOAD", at: "2026-10-10T05:00:00Z" },
    { actorName: "Adv. Rohan Deshmukh", role: "PUBLIC_PROSECUTOR", action: "VIEW", at: "2026-10-10T05:02:00Z" },
  ], originalVersionAvailable: true,
}
export const MOCK_VERIFIED_RESULT: VerifyResult = { ...MOCK_TAMPERED_RESULT, status: "VERIFIED", checks: { decrypt: "pass", plaintextHash: "pass", chunkRoot: "pass", signature: "pass", merkleProof: "pass", onChainRoot: "pass" }, tamperRanges: [], parts: [{ index: 0, byteStart: 0, byteEnd: 16383, address: HASH_A, status: "pass" }], originalVersionAvailable: false }

export const MOCK_PROGRESS: CaseProgress = { caseId: MOCK_CASE.id, firNo: MOCK_CASE.firNo, station: MOCK_CASE.station, currentStage: "FORENSIC_ANALYSIS", nextExpectedStage: "CHARGE_SHEET_FILED", milestones: [
  { stage: "FIR_REGISTERED", at: "2026-10-08T06:15:00Z", note: "Your complaint was registered and assigned for investigation.", recordedBy: { name: "Investigating officer", role: "POLICE" } },
  { stage: "INVESTIGATION", at: "2026-10-08T10:30:00Z", note: "Initial statements were recorded.", recordedBy: { name: "Investigating officer", role: "POLICE" } },
  { stage: "FORENSIC_ANALYSIS", at: "2026-10-09T08:00:00Z", note: "Relevant material was sent for technical examination.", recordedBy: { name: "Court officer", role: "JUDGE" } },
] }

export const MOCK_REQUESTS: Page<DocumentRequest> = { items: [
  { id: "88888888-8888-4888-8888-888888888888", caseId: MOCK_CASE.id, firNo: MOCK_CASE.firNo, requester: { id: MOCK_SESSIONS.DEFENCE_ADVOCATE.user.id, name: MOCK_SESSIONS.DEFENCE_ADVOCATE.user.name, role: "DEFENCE_ADVOCATE" }, documentIds: [documentBase.id, report.id], legalBasis: { code: "STATUTORY_DISCLOSURE", citation: "Statutory right to copies — citation pending legal mentor review", orderRef: null }, reason: "Copies requested for preparation of the defence.", status: "PENDING", filedAt: "2026-10-10T05:05:00Z", decision: null },
  { id: "88888888-8888-4888-8888-888888888889", caseId: MOCK_CASE.id, firNo: MOCK_CASE.firNo, requester: { id: MOCK_SESSIONS.DEFENCE_ADVOCATE.user.id, name: MOCK_SESSIONS.DEFENCE_ADVOCATE.user.name, role: "DEFENCE_ADVOCATE" }, documentIds: [documentBase.id], legalBasis: { code: "COURT_ORDER", citation: "Disclosure directed by the District Court", orderRef: "DCC/ORDER/2026/118" }, reason: "Court-directed disclosure.", status: "GRANTED", filedAt: "2026-10-09T05:05:00Z", decision: { by: { id: MOCK_SESSIONS.JUDGE.user.id, name: MOCK_SESSIONS.JUDGE.user.name }, at: "2026-10-09T09:00:00Z", orderRef: "DCC/ORDER/2026/118", note: "FIR copy granted for case preparation.", grantedDocumentIds: [documentBase.id], permission: "VIEW_AND_WATERMARKED_DOWNLOAD", expiresAt: "2026-10-17T18:29:59Z" } },
], nextCursor: null }

export const MOCK_ASSEMBLY: AssemblyReport = { caseId: MOCK_CASE.id, assembledAt: "2026-10-10T05:08:00Z", scope: "FULL_CASE", manifest: { root: HASH_B, version: 2, recomputed: HASH_B, onChain: "pass" }, totals: { documents: 2, parts: 4, partsVerified: 4, tampered: 0 }, documents: [
  { document: { ...documentBase, verificationStatus: "VERIFIED" }, verification: { ...MOCK_VERIFIED_RESULT, parts: [{ index: 0, byteStart: 0, byteEnd: 16383, address: HASH_A, status: "pass" }] } },
  { document: report, verification: { ...MOCK_VERIFIED_RESULT, parts: [{ index: 0, byteStart: 0, byteEnd: 65535, address: HASH_A, status: "pass" }, { index: 1, byteStart: 65536, byteEnd: 131071, address: HASH_B, status: "pass" }, { index: 2, byteStart: 131072, byteEnd: 188415, address: HASH_C, status: "pass" }] } },
], bundle: { downloadPath: "/api/cases/11111111-1111-4111-8111-111111111111/bundle?token=mock-bundle-token", sha256: HASH_C, sizeBytes: 206_848, expiresAt: "2026-10-10T05:23:00Z" } }

export const MOCK_SCAN: ScanDetail = { id: "55555555-5555-4555-8555-555555555555", status: "completed", checked: 2, total: 2, startedAt: "2026-10-10T05:03:00Z", completedAt: "2026-10-10T05:03:03Z", results: [{ document: documentBase, verification: MOCK_TAMPERED_RESULT }, { document: report, verification: MOCK_VERIFIED_RESULT }] }

export const MOCK_AUDIT: Page<AuditEntry> = { items: [
  { id: "66666666-6666-4666-8666-666666666660", seq: 103, actorName: "Adv. Kavya Shah", role: "DEFENCE_ADVOCATE", action: "VIEW", docId: MOCK_GRANTED_DOCUMENT.id, caseId: MOCK_CASE.id, at: "2026-10-10T05:06:00Z", prevHash: HASH_B, entryHash: HASH_C, legalBasis: { code: "COURT_ORDER", citation: "Disclosure directed by the District Court", orderRef: "DCC/ORDER/2026/118" }, detail: "Watermarked court-granted access" },
  { id: "66666666-6666-4666-8666-666666666661", seq: 102, actorName: "Demo attacker harness", role: "ADMIN", action: "TAMPER_DETECTED", docId: documentBase.id, caseId: MOCK_CASE.id, at: "2026-10-10T05:03:00Z", prevHash: HASH_A, entryHash: HASH_B, legalBasis: { code: "SYSTEM_INTEGRITY", citation: null, orderRef: null }, detail: "Integrity scan detected a modified evidence chunk" },
  { id: "66666666-6666-4666-8666-666666666662", seq: 101, actorName: "Dr. Neha Kulkarni", role: "FORENSIC_LAB", action: "DENIED", docId: null, caseId: "22222222-2222-4222-8222-222222222222", at: "2026-10-10T04:59:00Z", prevHash: HASH_C, entryHash: HASH_A, legalBasis: { code: "FORENSIC_ASSIGNMENT", citation: null, orderRef: null }, detail: "User is not assigned to this case" },
  { id: "66666666-6666-4666-8666-666666666663", seq: 100, actorName: "Inspector Aditi Patil", role: "POLICE", action: "UPLOAD", docId: documentBase.id, caseId: MOCK_CASE.id, at: "2026-10-10T05:00:00Z", prevHash: HASH_B, entryHash: HASH_C, legalBasis: { code: "INVESTIGATION", citation: null, orderRef: null }, detail: null },
], nextCursor: null }
export const MOCK_AUDIT_CHAIN: AuditChainResult = { status: "pass", checkedEntries: 103, checkedAt: "2026-10-10T05:04:00Z", firstBrokenEntryId: null, headHash: HASH_B, headAnchored: true }

export const MOCK_BATCHES: Page<BatchSummary> = { items: [
  { batchId: 42, root: ROOT, documentCount: 2, status: "confirmed", txHash: TX, explorerUrl: null, signatureHash: HASH_C, createdAt: "2026-10-10T05:01:30Z", anchoredAt: "2026-10-10T05:02:00Z" },
  { batchId: 43, root: `0x${HASH_C}`, documentCount: 1, status: "pending", txHash: `0x${HASH_A}`, explorerUrl: null, signatureHash: HASH_A, createdAt: "2026-10-10T05:04:00Z", anchoredAt: null },
], nextCursor: null }
export const MOCK_CHAIN: ChainInfo = { network: "local", chainId: 31337, registryAddress: `0x${"12".repeat(20)}`, explorerAddressUrl: null }
