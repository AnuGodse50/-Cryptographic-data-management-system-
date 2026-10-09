import type { AuditChainResult, AuditEntry, BatchSummary, CaseDetail, CaseSummary, ChainInfo, DocumentDetail, DocumentSummary, Page, ScanDetail, Session, VerifyResult } from "@/types/api"

const HASH_A = "0123456789abcdef".repeat(4)
const HASH_B = "abcdef0123456789".repeat(4)
const HASH_C = "1234567890abcdef".repeat(4)
const ROOT = `0x${HASH_A}`
const TX = `0x${HASH_B}`

export const MOCK_SESSION: Session = {
  user: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Inspector Aditi Patil", email: "aditi.patil@demo.invalid", role: "POLICE", station: "Gangapur Police Station", clearance: 4 },
  canCreateCase: true, allowedUploadTypes: ["FIR", "WITNESS_STATEMENT"], assistantEnabled: false,
}

const counts = (verified: number, tampered = 0) => ({ VERIFIED: verified, TAMPERED: tampered, PENDING_ANCHOR: 0, UNANCHORED: 0, ERROR: 0, unchecked: 0 })
export const MOCK_CASES: Page<CaseSummary> = { items: [
  { id: "11111111-1111-4111-8111-111111111111", firNo: "NSK/2026/0142", station: "Gangapur Police Station", stage: "INVESTIGATION", status: "OPEN", createdAt: "2026-10-10T04:40:00Z", documentCount: 2, integrity: counts(1, 1) },
  { id: "22222222-2222-4222-8222-222222222222", firNo: "NSK/2026/0187", station: "Panchavati Police Station", stage: "FORENSIC_ANALYSIS", status: "OPEN", createdAt: "2026-10-09T13:20:00Z", documentCount: 1, integrity: counts(1) },
], nextCursor: null }

export const MOCK_CASE: CaseDetail = { ...MOCK_CASES.items[0], allowedUploadTypes: ["FIR", "WITNESS_STATEMENT"], canUpload: true, assignments: [
  { userName: "Inspector Aditi Patil", role: "POLICE" }, { userName: "Dr. Neha Kulkarni", role: "FORENSIC_LAB" }, { userName: "Adv. Rohan Deshmukh", role: "PUBLIC_PROSECUTOR" },
], manifest: null, canAssemble: false, canRequestDocuments: false }

const documentBase: DocumentSummary = {
  id: "33333333-3333-4333-8333-333333333333", caseId: MOCK_CASE.id, filename: "FIR_0142.txt", type: "FIR", version: 1, parentId: null, sizeBytes: 16_384, mimeType: "text/plain", uploaderName: "Inspector Aditi Patil", createdAt: "2026-10-10T05:00:00Z", sha256: HASH_A, chunkRoot: HASH_B, chunkCount: 4, partCount: 1, verificationStatus: "TAMPERED", verifiedAt: "2026-10-10T05:03:00Z",
}
const report: DocumentSummary = { ...documentBase, id: "44444444-4444-4444-8444-444444444444", filename: "Forensic_Report_0142.pdf", type: "FORENSIC_REPORT", sizeBytes: 188_416, mimeType: "application/pdf", uploaderName: "Dr. Neha Kulkarni", createdAt: "2026-10-10T05:01:00Z", sha256: HASH_C, chunkCount: 46, verificationStatus: "VERIFIED", verifiedAt: "2026-10-10T05:03:00Z" }
export const MOCK_DOCUMENTS: Page<DocumentSummary> = { items: [documentBase, report], nextCursor: null }
export const MOCK_DOCUMENT: DocumentDetail = { ...documentBase, versions: [documentBase], signature: { algorithm: "ML-DSA-65", signerName: "Inspector Aditi Patil", publicKeyHash: HASH_C }, canPreview: false, canDownload: false, canAddVersion: true, canRestore: true, access: { via: "ROLE" } }

export const MOCK_TAMPERED_RESULT: VerifyResult = {
  status: "TAMPERED", checks: { decrypt: "pass", plaintextHash: "fail", chunkRoot: "fail", signature: "pass", merkleProof: "pass", onChainRoot: "pass" },
  tamperRanges: [{ chunkIndex: 2, byteStart: 8192, byteEnd: 12287, kind: "modified" }],
  anchor: { batchId: 42, root: ROOT, txHash: TX, explorerUrl: null, status: "confirmed" },
  lastAccessors: [
    { actorName: "Inspector Aditi Patil", role: "POLICE", action: "UPLOAD", at: "2026-10-10T05:00:00Z" },
    { actorName: "Adv. Rohan Deshmukh", role: "PUBLIC_PROSECUTOR", action: "VIEW", at: "2026-10-10T05:02:00Z" },
  ], originalVersionAvailable: true,
}
export const MOCK_VERIFIED_RESULT: VerifyResult = { ...MOCK_TAMPERED_RESULT, status: "VERIFIED", checks: { decrypt: "pass", plaintextHash: "pass", chunkRoot: "pass", signature: "pass", merkleProof: "pass", onChainRoot: "pass" }, tamperRanges: [], originalVersionAvailable: false }

export const MOCK_SCAN: ScanDetail = { id: "55555555-5555-4555-8555-555555555555", status: "completed", checked: 2, total: 2, startedAt: "2026-10-10T05:03:00Z", completedAt: "2026-10-10T05:03:03Z", results: [{ document: documentBase, verification: MOCK_TAMPERED_RESULT }, { document: report, verification: MOCK_VERIFIED_RESULT }] }

export const MOCK_AUDIT: Page<AuditEntry> = { items: [
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
