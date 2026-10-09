"use client"
import { Check, Circle, Plus, TimerReset } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { CASE_STAGES, type CaseStage } from "@/types/api"
import { formatIST } from "@/components/quantumshield/format"
import { MOCK_PROGRESS, MOCK_SESSION } from "@/components/quantumshield/mocks"
import { PageHeader } from "@/components/quantumshield/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const label = (stage: CaseStage) => stage.replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, char => char.toUpperCase())
export function ProgressTimeline({ caseId }: { caseId: string }) {
  const canAdd = MOCK_SESSION.user.role === "POLICE" || MOCK_SESSION.user.role === "JUDGE"
  return <div className="page-grid"><PageHeader eyebrow="Public-safe case update" title={`Progress · ${MOCK_PROGRESS.firNo}`} description={`${MOCK_PROGRESS.station} · updates contain no evidence, documents, hashes, or party identities.`} action={canAdd ? <AddMilestone/> : undefined}/><Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle>Case timeline</CardTitle><CardDescription>Current stage: {label(MOCK_PROGRESS.currentStage)}</CardDescription></div><Badge variant="outline" className="border-primary/30 bg-accent text-primary"><TimerReset/>{MOCK_PROGRESS.nextExpectedStage ? `Next: ${label(MOCK_PROGRESS.nextExpectedStage)}` : "Case closed"}</Badge></div></CardHeader><CardContent><ol className="relative ml-3 border-l border-border">{CASE_STAGES.map(stage => { const milestone = MOCK_PROGRESS.milestones.find(item => item.stage === stage); const current = stage === MOCK_PROGRESS.currentStage; return <li key={stage} className="relative pb-7 pl-7 last:pb-0"><span className={`absolute -left-3 grid size-6 place-items-center rounded-full border ${milestone ? "border-verified/40 bg-verified-surface text-verified" : "border-border bg-background text-muted-foreground"}`}>{milestone ? <Check className="size-3.5"/> : <Circle className="size-3"/>}</span><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{label(stage)}</h2>{current ? <Badge>Current</Badge> : null}</div>{milestone ? <><time className="mt-1 block text-xs text-muted-foreground">{formatIST(milestone.at)}</time>{milestone.note ? <p className="mt-2 max-w-2xl rounded-lg bg-muted/50 p-3 text-sm leading-6">{milestone.note}</p> : null}</> : <p className="mt-1 text-xs text-muted-foreground">Not reached</p>}</li> })}</ol><p className="mt-6 text-xs text-muted-foreground">Case reference: {caseId.slice(0, 8)}… · Contact the investigating station for corrections to public-safe updates.</p></CardContent></Card></div>
}
function AddMilestone() {
  const [stage, setStage] = useState<CaseStage | "">(MOCK_PROGRESS.nextExpectedStage ?? ""); const [note, setNote] = useState("")
  return <Dialog><DialogTrigger asChild><Button><Plus/>Add milestone</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add public-safe milestone</DialogTitle><DialogDescription>This note is visible to the complainant. Do not include evidence, hashes, suspect details, or private identities.</DialogDescription></DialogHeader><div className="grid gap-4"><div className="grid gap-2"><Label>Stage</Label><Select value={stage} onValueChange={value => setStage(value as CaseStage)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{CASE_STAGES.map(item => <SelectItem key={item} value={item}>{label(item)}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label htmlFor="milestone-note">Public-safe note</Label><Textarea id="milestone-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Brief progress update without sensitive details"/></div></div><DialogFooter showCloseButton><Button disabled={!stage} onClick={() => toast.success("Mock milestone added and audited")}>Add milestone</Button></DialogFooter></DialogContent></Dialog>
}
