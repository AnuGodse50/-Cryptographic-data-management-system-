import Link from "next/link"
import { AlertTriangle, FileCheck2, FolderKanban, ScanSearch } from "lucide-react"
import { MOCK_CASES, MOCK_SESSION } from "@/components/quantumshield/mocks"
import { PageHeader } from "@/components/quantumshield/page-header"
import { StatusBadge } from "@/components/quantumshield/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
export default function DashboardPage() {
  const total = MOCK_CASES.items.reduce((sum, item) => sum + item.documentCount, 0)
  const verified = MOCK_CASES.items.reduce((sum, item) => sum + item.integrity.VERIFIED, 0)
  const tampered = MOCK_CASES.items.reduce((sum, item) => sum + item.integrity.TAMPERED, 0)
  const metrics = [{ label: "Accessible cases", value: MOCK_CASES.items.length, icon: FolderKanban }, { label: "Evidence records", value: total, icon: FileCheck2 }, { label: "Integrity alerts", value: tampered, icon: AlertTriangle }]
  return <div className="page-grid"><PageHeader eyebrow="Operational overview" title={`Good morning, ${MOCK_SESSION.user.name.split(" ")[0]}`} description="Only cases permitted by your role, assignment and jurisdiction appear here." action={<Button asChild><Link href="/cases">Open cases</Link></Button>}/><div className="grid gap-4 sm:grid-cols-3">{metrics.map(({label,value,icon:Icon}) => <Card key={label}><CardHeader><CardTitle className="flex items-center justify-between">{label}<Icon className="size-4 text-primary"/></CardTitle></CardHeader><CardContent><p className="text-3xl font-semibold">{value}</p></CardContent></Card>)}</div><Card><CardHeader><CardTitle>Cases requiring attention</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>FIR</TableHead><TableHead>Station</TableHead><TableHead>Documents</TableHead><TableHead>Integrity</TableHead></TableRow></TableHeader><TableBody>{MOCK_CASES.items.map(item => <TableRow key={item.id}><TableCell><Link className="font-medium text-primary hover:underline" href={`/cases/${item.id}`}>{item.firNo}</Link></TableCell><TableCell>{item.station}</TableCell><TableCell>{item.documentCount}</TableCell><TableCell><StatusBadge status={item.integrity.TAMPERED ? "TAMPERED" : "VERIFIED"}/></TableCell></TableRow>)}</TableBody></Table></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><ScanSearch className="size-4"/>{verified} verified record{verified === 1 ? "" : "s"}; status comes from completed checks.</div></CardContent></Card></div>
}
