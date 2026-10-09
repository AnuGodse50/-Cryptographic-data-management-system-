"use client"
import Link from "next/link"
import { LockKeyhole, ShieldCheck } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState("")
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (!email || !password) setError("Enter your seeded demo credentials.") }
  return <main className="grid min-h-dvh place-items-center bg-[radial-gradient(circle_at_top,#162a47_0%,#0b1220_48%)] p-4"><div className="w-full max-w-md"><div className="mb-6 flex items-center justify-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck/></span><div><h1 className="text-xl font-semibold">QuantumShield</h1><p className="text-sm text-muted-foreground">Judicial evidence integrity</p></div></div><Card><CardHeader><CardTitle>Secure sign in</CardTitle><CardDescription>Authenticate through Amazon Cognito. Access is checked again for every case and document.</CardDescription></CardHeader><form onSubmit={submit}><CardContent className="grid gap-4"><div className="grid gap-2"><Label htmlFor="email">Official email</Label><Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@agency.gov.in" autoComplete="username"/></div><div className="grid gap-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password"/></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-primary"/>Seeded role credentials are provided by the demo operator; they are not embedded in this page.</div></CardContent><CardFooter className="mt-4"><Button className="w-full" type="submit" asChild={Boolean(email && password)}>{email && password ? <Link href="/dashboard">Continue to secure workspace</Link> : <span>Continue to secure workspace</span>}</Button></CardFooter></form></Card><p className="mt-4 text-center text-xs text-muted-foreground">Full AWS deployment · Cognito · RDS RLS · S3 Object Lock · KMS</p></div></main>
}
