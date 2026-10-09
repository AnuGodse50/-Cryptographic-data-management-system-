"use client"
import { FileUp, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ALLOWED_UPLOAD_MIME, MAX_UPLOAD_BYTES, type DocType } from "@/types/api"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const labels: Record<DocType, string> = { FIR: "FIR", WITNESS_STATEMENT: "Witness statement", FORENSIC_REPORT: "Forensic report", CHARGE_SHEET: "Charge sheet" }
export function UploadDialog({ caseId, allowedTypes }: { caseId: string; allowedTypes: DocType[] }) {
  const [type, setType] = useState<DocType | "">(allowedTypes[0] ?? "")
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const submit = async () => {
    if (!file || !type) return setError("Choose a permitted document type and file.")
    if (file.size > MAX_UPLOAD_BYTES) return setError("File exceeds 4 MB.")
    if (!(file.type in ALLOWED_UPLOAD_MIME)) return setError("Use a PDF, DOCX, TXT, PNG or JPG file.")
    setBusy(true); setError(""); await new Promise(resolve => setTimeout(resolve, 800)); setBusy(false)
    toast.success(`Simulated upload received for case ${caseId.slice(0, 8)}…`, { description: "AES-256-GCM encrypted · ML-DSA-65 signed · anchor pending" })
  }
  return <Dialog><DialogTrigger asChild><Button disabled={!allowedTypes.length}><FileUp/>Upload document</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Secure evidence upload</DialogTitle><DialogDescription>Files are append-only. Corrections create a new linked version.</DialogDescription></DialogHeader><div className="grid gap-4"><div className="grid gap-2"><Label>Document type</Label><Select value={type} onValueChange={value => setType(value as DocType)}><SelectTrigger><SelectValue placeholder="Choose a type"/></SelectTrigger><SelectContent>{allowedTypes.map(item => <SelectItem key={item} value={item}>{labels[item]}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="evidence-file">Evidence file</Label><Input id="evidence-file" type="file" accept={Object.values(ALLOWED_UPLOAD_MIME).join(",")} onChange={event => setFile(event.target.files?.[0] ?? null)}/><p className="text-xs text-muted-foreground">PDF, DOCX, TXT, PNG or JPG · maximum 4 MB</p></div>{file ? <div className="rounded-lg border bg-muted/30 p-3 text-xs"><b>{file.name}</b><p className="mt-1 text-muted-foreground">{file.type || "Unknown type"} · {(file.size / 1024).toFixed(1)} KB</p></div> : null}{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}</div><DialogFooter showCloseButton><Button onClick={() => void submit()} disabled={busy}>{busy ? <Loader2 className="animate-spin"/> : <FileUp/>}{busy ? "Protecting evidence…" : "Encrypt and upload"}</Button></DialogFooter></DialogContent></Dialog>
}
