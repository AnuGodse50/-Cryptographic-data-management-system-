"use client"
import { AlertTriangle, CheckCircle2, Play, ScanSearch } from "lucide-react"
import { useState } from "react"
import { IntegrityPanel } from "@/components/quantumshield/integrity-panel"
import { MOCK_SCAN } from "@/components/quantumshield/mocks"
import { PageHeader } from "@/components/quantumshield/page-header"
import { StatusBadge } from "@/components/quantumshield/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
export default function IntegrityPage() {
  const [running, setRunning] = useState(false); const [scanned, setScanned] = useState(true)
  const run = () => { setRunning(true); setTimeout(() => { setRunning(false); setScanned(true) }, 900) }
  const tampered = MOCK_SCAN.results.filter(item => item.verification.status === "TAMPERED").length
  return <div className="page-grid"><PageHeader eyebrow="Evidence assurance" title="Integrity scan" description="Decrypt, hash, verify signatures and compare anchored roots across authorized evidence." action={<Button onClick={run} disabled={running}><Play/>{running ? "Scanning…" : "Run integrity scan"}</Button>}/>{running ? <Card><CardContent><div className="mb-2 flex justify-between text-sm"><span>Verifying evidence</span><span>1 / {MOCK_SCAN.total}</span></div><Progress value={50}/></CardContent></Card> : null}<div className="grid gap-4 sm:grid-cols-3"><Metric label="Checked" value={scanned ? MOCK_SCAN.checked : 0} icon={ScanSearch}/><Metric label="Verified" value={scanned ? MOCK_SCAN.checked - tampered : 0} icon={CheckCircle2}/><Metric label="Integrity alerts" value={scanned ? tampered : 0} icon={AlertTriangle}/></div><Card><CardHeader><CardTitle>Latest findings</CardTitle></CardHeader><CardContent>{scanned ? <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Finding</TableHead></TableRow></TableHeader><TableBody>{MOCK_SCAN.results.map(item => <TableRow key={item.document.id}><TableCell className="font-medium">{item.document.filename}</TableCell><TableCell>v{item.document.version}</TableCell><TableCell><StatusBadge status={item.verification.status}/></TableCell><TableCell><Sheet><SheetTrigger asChild><Button variant="outline" size="sm">View checks</Button></SheetTrigger><SheetContent className="w-full overflow-y-auto p-4 sm:max-w-xl"><SheetHeader><SheetTitle>{item.document.filename}</SheetTitle><SheetDescription>Completed verification result</SheetDescription></SheetHeader><div className="mt-4"><IntegrityPanel result={item.verification}/></div></SheetContent></Sheet></TableCell></TableRow>)}</TableBody></Table></div> : <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">No scan has run in this session.</p>}</CardContent></Card></div>
}
function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof ScanSearch }) { return <Card><CardHeader><CardTitle className="flex items-center justify-between">{label}<Icon className="size-4 text-primary"/></CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{value}</p></CardContent></Card> }
