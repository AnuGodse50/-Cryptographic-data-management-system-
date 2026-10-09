"use client"
import { Check, CircleHelp, Clipboard, ExternalLink, RotateCcw, ShieldAlert, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import type { CheckStatus, VerifyResult } from "@/types/api"
import { formatIST, roleLabel, shortHash } from "@/components/quantumshield/format"
import { StatusBadge } from "@/components/quantumshield/status-badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const checks: { key: keyof VerifyResult["checks"]; label: string; help: string }[] = [
  { key: "decrypt", label: "Authenticated decryption", help: "AES-256-GCM ciphertext and authentication tag" },
  { key: "plaintextHash", label: "Plaintext SHA-256", help: "Recomputed content vs signed original hash" },
  { key: "chunkRoot", label: "Document chunk root", help: "4,096-byte chunk hashes vs original chunk tree" },
  { key: "signature", label: "ML-DSA-65 signature", help: "Verified off-chain by our backend verifier" },
  { key: "merkleProof", label: "Batch inclusion proof", help: "Document commitment belongs to the batch root" },
  { key: "onChainRoot", label: "Polygon root", help: "Batch commitment matches the on-chain root" },
]
const checkView: Record<CheckStatus, { label: string; icon: typeof Check; className: string }> = {
  pass: { label: "Pass", icon: Check, className: "border-verified/30 bg-verified-surface text-verified" },
  fail: { label: "Fail", icon: X, className: "border-tampered/30 bg-tampered-surface text-tampered" },
  skip: { label: "Not checked", icon: CircleHelp, className: "border-neutral/30 bg-neutral-surface text-neutral" },
}

export function IntegrityPanel({ result, canRestore = true }: { result: VerifyResult; canRestore?: boolean }) {
  const [reason, setReason] = useState("")
  const [restoring, setRestoring] = useState(false)
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); toast.success("Copied to clipboard") }
  const restore = async () => { setRestoring(true); await new Promise(resolve => setTimeout(resolve, 700)); setRestoring(false); toast.success("Mock restore created a new pending version") }
  const noRanges = result.status === "TAMPERED" ? (result.checks.decrypt === "fail" ? "Content could not be decrypted; affected chunk unavailable." : "Tampering detected; range unavailable.") : "No chunk mismatch reported."

  return <Card className={result.status === "TAMPERED" ? "ring-tampered/50" : result.status === "VERIFIED" ? "ring-verified/30" : ""}>
    <CardHeader className="border-b"><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-primary"/>Integrity verification</CardTitle><CardDescription className="mt-1">Six independent checks from the backend verifier</CardDescription></div><StatusBadge status={result.status}/></div></CardHeader>
    <CardContent className="space-y-6">
      <TooltipProvider><div className="divide-y rounded-lg border">{checks.map(item => { const state = checkView[result.checks[item.key]]; return <div key={item.key} className="flex min-h-12 items-center justify-between gap-3 px-3"><div className="flex items-center gap-2 text-sm"><span>{item.label}</span><Tooltip><TooltipTrigger aria-label={`About ${item.label}`}><CircleHelp className="size-3.5 text-muted-foreground"/></TooltipTrigger><TooltipContent>{item.help}</TooltipContent></Tooltip></div><Badge variant="outline" className={state.className}><state.icon/>{state.label}</Badge></div> })}</div></TooltipProvider>

      {result.parts ? <section><div className="mb-2 flex items-end justify-between gap-3"><div><h3 className="text-sm font-semibold">Encrypted storage parts</h3><p className="text-xs text-muted-foreground">Address match and authenticated decryption per 64 KiB part</p></div><span className="text-xs text-muted-foreground">{result.parts.filter(part => part.status === "pass").length}/{result.parts.length} parts verified</span></div><TooltipProvider><div className="grid grid-cols-6 gap-2 sm:grid-cols-10">{result.parts.map(part => <Tooltip key={part.index}><TooltipTrigger asChild><button aria-label={`Part ${part.index}: ${checkView[part.status].label}`} className={`aspect-square min-h-8 rounded-md border text-xs font-semibold ${checkView[part.status].className}`}>{part.index}</button></TooltipTrigger><TooltipContent className="max-w-sm"><p>Part {part.index} · bytes {part.byteStart}–{part.byteEnd}</p><p className="mt-1 break-all font-mono text-[10px]">{part.address}</p></TooltipContent></Tooltip>)}</div></TooltipProvider></section> : null}

      <section><h3 className="mb-2 text-sm font-semibold">Tamper localization</h3>{result.tamperRanges.length ? <div className="space-y-2">{result.tamperRanges.map(range => <Alert key={`${range.chunkIndex}-${range.byteStart}`} className="border-tampered/30 bg-tampered-surface/60"><ShieldAlert className="text-tampered"/><AlertTitle>chunk {range.chunkIndex}, bytes {range.byteStart}–{range.byteEnd}</AlertTitle><AlertDescription className="capitalize">{range.kind}</AlertDescription></Alert>)}</div> : <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{noRanges}</p>}<p className="mt-2 text-xs text-muted-foreground">Zero-based indices; byte range is the affected chunk, not the exact changed byte.</p></section>

      <section><h3 className="mb-2 text-sm font-semibold">Recent accessors</h3>{result.lastAccessors.length ? <div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>Actor</TableHead><TableHead>Role</TableHead><TableHead>Action</TableHead><TableHead>At</TableHead></TableRow></TableHeader><TableBody>{result.lastAccessors.map((actor, index) => <TableRow key={`${actor.actorName}-${actor.at}-${index}`}><TableCell className="font-medium">{actor.actorName}</TableCell><TableCell>{roleLabel(actor.role)}</TableCell><TableCell>{actor.action}</TableCell><TableCell className="whitespace-nowrap">{formatIST(actor.at)}</TableCell></TableRow>)}</TableBody></Table></div> : <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No accessor details available.</p>}<p className="mt-2 text-xs text-muted-foreground">Recent access is investigative context, not proof of responsibility.</p></section>

      <section><h3 className="mb-2 text-sm font-semibold">Anchor receipt</h3>{result.anchor ? <div className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-2"><div><span className="text-muted-foreground">Batch</span><p className="font-medium">#{result.anchor.batchId} · {result.anchor.status}</p></div><div><span className="text-muted-foreground">Network</span><p className="font-medium">{result.anchor.explorerUrl ? "Polygon Amoy" : "Local dev chain"}</p></div><div><span className="text-muted-foreground">Root</span><button className="mt-1 flex items-center gap-2 font-mono text-xs" onClick={() => copy(result.anchor!.root)}>{shortHash(result.anchor.root)}<Clipboard className="size-3"/></button></div><div><span className="text-muted-foreground">Transaction</span><button className="mt-1 flex items-center gap-2 font-mono text-xs" onClick={() => copy(result.anchor!.txHash)}>{shortHash(result.anchor.txHash)}<Clipboard className="size-3"/></button></div>{result.anchor.explorerUrl ? <Button asChild variant="outline" size="sm" className="sm:col-span-2"><a href={result.anchor.explorerUrl} target="_blank" rel="noreferrer">View on Polygon Amoy<ExternalLink/></a></Button> : null}</div> : <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">No anchor receipt available.</p>}</section>

      <Alert><CircleHelp/><AlertTitle>Trust boundary</AlertTitle><AlertDescription>ML-DSA-65 signatures are verified off-chain by our backend verifier. Polygon stores hashes and the verifier&apos;s attestation; it does not verify post-quantum signatures.</AlertDescription></Alert>

      {result.originalVersionAvailable ? <div className="rounded-lg border border-pending/30 bg-pending-surface/40 p-3"><AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={!canRestore}><RotateCcw/>Restore original (S3 Object Lock)</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Create a new version from the locked original?</AlertDialogTitle><AlertDialogDescription>The damaged version and audit history remain. Recovery appends a new version and must be verified again.</AlertDialogDescription></AlertDialogHeader><div className="grid gap-2"><Label htmlFor="restore-reason">Recovery reason</Label><Input id="restore-reason" value={reason} onChange={event => setReason(event.target.value)} placeholder="Describe the integrity incident"/></div><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction disabled={!reason.trim() || restoring} onClick={event => { event.preventDefault(); void restore() }}>{restoring ? "Restoring…" : "Create restored version"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>{!canRestore ? <p className="mt-2 text-xs text-muted-foreground">An authorized document contributor must restore.</p> : <p className="mt-2 text-xs text-muted-foreground">Creates an append-only version; the damaged version remains visible.</p>}</div> : null}
    </CardContent>
  </Card>
}
