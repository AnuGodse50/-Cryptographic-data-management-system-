"use client"
import Link from "next/link"
import { useState } from "react"
import { FolderOpen, Plus, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import type { CaseDetail, CaseSummary, VerifyStatus } from "@/types/api"
import { apiFetch, USE_MOCKS } from "@/components/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter,DialogTrigger } from "@/components/ui/dialog"
import { MOCK_CASES,MOCK_CASE,rememberMockCase } from "./mocks"
import { useSession } from "./session"
import { useResource } from "./use-resource"
import { ResourceError } from "./access-state"
import { PageHeader } from "./page-header"
import { SectionCard,DataTable,PageSkeleton,RelativeTime,EmptyState,humanize } from "./design-system"
import { StatusBadge } from "./status-badge"
function caseStatus(c:CaseSummary):VerifyStatus|null { const x=c.integrity;return x.TAMPERED?"TAMPERED":x.ERROR?"ERROR":x.PENDING_ANCHOR?"PENDING_ANCHOR":x.UNANCHORED?"UNANCHORED":c.documentCount>0&&x.VERIFIED===c.documentCount?"VERIFIED":null }
export function CasesView(){const session=useSession();const resource=useResource("GET /api/cases",{mock:MOCK_CASES});const [filter,setFilter]=useState("All cases");
 if(resource.loading)return <PageSkeleton/>;if(resource.error||!resource.data)return <ResourceError error={resource.error||new Error("No cases")} retry={resource.reload}/>
 const rows=resource.data.items.filter(c=>filter==="All cases"||filter==="Needs attention"&&c.integrity.TAMPERED>0||filter==="Open"&&c.status==="OPEN")
 return <div className="page-grid"><PageHeader eyebrow="Workspace / cases" title="Case register" description="Every case, its evidence and the people accountable for it." action={session.canCreateCase&&<CreateCase onCreated={c=>resource.setData(current=>current?{...current,items:[c,...current.items.filter(item=>item.id!==c.id)]}:{items:[c],nextCursor:null})}/>}/><div className="no-print flex flex-wrap gap-2" aria-label="Filter cases">{["All cases","Needs attention","Open"].map(f=><Button key={f} variant={f===filter?"secondary":"ghost"} size="sm" aria-pressed={f===filter} onClick={()=>setFilter(f)}>{f}</Button>)}</div><SectionCard>{resource.data.items.length?<DataTable rows={rows} rowKey={c=>c.id} searchText={c=>c.firNo+" "+c.station} searchLabel="Search FIR or police station" columns={[
 {key:"case",label:"Case reference",sort:c=>c.firNo,render:c=><Link href={"/cases/"+c.id} className="flex items-center gap-3 font-semibold text-primary"><span className="rounded-lg bg-accent p-2"><FolderOpen className="size-4"/></span>{c.firNo}</Link>},
 {key:"station",label:"Station & stage",sort:c=>c.station,render:c=><div><p>{c.station}</p><p className="text-xs text-muted-foreground">{humanize(c.stage)}</p></div>},
 {key:"files",label:"Evidence",sort:c=>c.documentCount,render:c=><span>{c.documentCount} files</span>},
 {key:"status",label:"Integrity",render:c=><StatusBadge status={caseStatus(c)}/>},
 {key:"created",label:"Opened",sort:c=>c.createdAt,render:c=><RelativeTime at={c.createdAt}/>},
 {key:"open",label:"",render:c=><Button asChild variant="ghost" size="icon-sm"><Link href={"/cases/"+c.id} aria-label={"Open case "+c.firNo}><ArrowRight/></Link></Button>}
 ]}/>:<EmptyState title="Your case register is ready" description={session.canCreateCase?"Create a case to begin a traceable evidence record.":"Ask your case administrator to assign your first case."}/>}</SectionCard></div>
}
function CreateCase({onCreated}:{onCreated:(c:CaseDetail)=>void}) {const [open,setOpen]=useState(false);const [fir,setFir]=useState("");const [station,setStation]=useState("");const [error,setError]=useState("");const [busy,setBusy]=useState(false)
 async function submit(){if(!fir.trim()||!station.trim()){setError("Enter both the FIR reference and police station.");return}setBusy(true);try{const c=await apiFetch("POST /api/cases",{body:{firNo:fir.trim(),station:station.trim()},mock:{...MOCK_CASE,id:crypto.randomUUID(),firNo:fir.trim(),station:station.trim(),documentCount:0,manifest:null,integrity:{VERIFIED:0,TAMPERED:0,PENDING_ANCHOR:0,UNANCHORED:0,ERROR:0,unchecked:0},createdAt:new Date().toISOString()}});if(USE_MOCKS)rememberMockCase(c);onCreated(c);setOpen(false);toast.success("Case added to your register")}catch(e){setError(e instanceof Error?e.message:"Could not create case")}finally{setBusy(false)}}
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus/>Create case</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Open a case record</DialogTitle><DialogDescription>Start with the official FIR reference. Evidence can be added next.</DialogDescription></DialogHeader><Label htmlFor="fir">FIR reference</Label><Input id="fir" value={fir} onChange={e=>setFir(e.target.value)} placeholder="NSK/2026/0142"/><Label htmlFor="station">Police station</Label><Input id="station" value={station} onChange={e=>setStation(e.target.value)} placeholder="Station name"/>{error&&<p role="alert" className="text-xs text-tampered">{error}</p>}<DialogFooter><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={busy} onClick={()=>void submit()}>{busy?"Creating…":"Create case"}</Button></DialogFooter></DialogContent></Dialog>
}
