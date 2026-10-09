import Link from "next/link"
export function Brand({ href = "/dashboard" }: { href?: string }) {
 return <Link href={href} aria-label="Sakshya home" className="flex shrink-0 items-center gap-2.5 rounded-md"><svg width="34" height="38" viewBox="0 0 34 38" fill="none" aria-hidden="true"><path d="M17 2 31 8v12c0 8-9 14-14 16C12 34 3 28 3 20V8Z" className="fill-primary"/><path d="m10 18 5 5 10-11" stroke="var(--primary-foreground)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg><span><span className="block text-[17px] font-bold tracking-[-.6px]">Sakshya</span><span className="block text-[9px] font-semibold uppercase tracking-[.2em] text-muted-foreground">Evidence. Accountable.</span></span></Link>
}
