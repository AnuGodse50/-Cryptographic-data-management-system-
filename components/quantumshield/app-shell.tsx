"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpenCheck, Boxes, FileCheck2, Gavel, LayoutDashboard, LogOut, Menu, ScanSearch, ShieldCheck, Sparkles } from "lucide-react"
import type { ReactNode } from "react"
import { USE_MOCKS } from "@/components/api-client"
import { MOCK_SESSION } from "@/components/quantumshield/mocks"
import { roleLabel } from "@/components/quantumshield/format"
import { TrustStrip } from "@/components/quantumshield/trust-strip"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const nav = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard }, { href: "/cases", label: "Cases", icon: Gavel },
  { href: "/integrity", label: "Integrity", icon: ScanSearch }, { href: "/audit", label: "Audit trail", icon: BookOpenCheck },
  { href: "/batches", label: "Merkle batches", icon: Boxes }, { href: "/assistant", label: "Case assistant", icon: Sparkles },
]
function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname()
  return <nav className="grid gap-1" aria-label="Primary">{nav.map(({href,label,icon:Icon}) => { const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`)); return <Link key={href} href={href} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}><Icon className="size-4"/>{label}{mobile && active ? <span className="sr-only">Current page</span> : null}</Link> })}</nav>
}
function Brand() { return <Link href="/dashboard" className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground"><ShieldCheck className="size-5"/></span><span><b className="block text-sm">QuantumShield</b><span className="text-xs text-muted-foreground">Evidence integrity</span></span></Link> }
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background"><aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border bg-sidebar p-4 lg:flex lg:flex-col"><Brand/><div className="mt-8"><Navigation/></div><div className="mt-auto rounded-lg border border-sidebar-border bg-background/30 p-3 text-xs"><p className="font-medium">{MOCK_SESSION.user.name}</p><p className="mt-1 text-muted-foreground">{roleLabel(MOCK_SESSION.user.role)}</p><p className="text-muted-foreground">{MOCK_SESSION.user.station}</p></div></aside><div className="flex min-h-dvh flex-col lg:pl-60"><header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-8"><Sheet><SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden"><Menu/><span className="sr-only">Open navigation</span></Button></SheetTrigger><SheetContent side="left" className="w-72 p-4"><SheetHeader className="sr-only"><SheetTitle>Navigation</SheetTitle><SheetDescription>QuantumShield sections</SheetDescription></SheetHeader><Brand/><div className="mt-8"><Navigation mobile/></div></SheetContent></Sheet><div className="lg:hidden"><Brand/></div><div className="ml-auto hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><FileCheck2 className="size-4 text-verified"/>Zero-trust session · {roleLabel(MOCK_SESSION.user.role)}</div><Button variant="ghost" size="sm" asChild><Link href="/login"><LogOut/>Sign out</Link></Button></header>{USE_MOCKS ? <div role="status" className="border-b border-pending/25 bg-pending-surface px-4 py-2 text-center text-xs font-medium text-pending">Demo data — simulated results</div> : null}<main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-6 lg:p-8">{children}</main><TrustStrip/></div></div>
}
