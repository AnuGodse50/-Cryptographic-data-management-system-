import { Cloud, Database, ExternalLink, Fingerprint, HardDrive, KeyRound, LockKeyhole } from "lucide-react"
import { MOCK_CHAIN } from "@/components/quantumshield/mocks"
const items = [
  { label: "Cognito", detail: "Identity", icon: Fingerprint }, { label: "RDS + RLS", detail: "Case access", icon: Database },
  { label: "S3 Object Lock", detail: "Retained ciphertext", icon: HardDrive }, { label: "AWS KMS", detail: "Key protection", icon: KeyRound },
  { label: "EC2 + CloudFront", detail: "HTTPS delivery", icon: Cloud },
]
export function TrustStrip() {
  return <footer className="border-t border-border bg-sidebar px-4 py-4 lg:px-8"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-3 text-xs"><div className="flex items-center gap-2 font-semibold"><LockKeyhole className="size-4 text-primary"/>Protection architecture</div>{items.map(({label,detail,icon:Icon}) => <div key={label} className="flex items-center gap-2 text-muted-foreground"><Icon className="size-3.5"/><span><b className="font-medium text-foreground">{label}</b> · {detail}</span></div>)}<div className="ml-auto flex items-center gap-1 text-muted-foreground"><ExternalLink className="size-3.5"/>{MOCK_CHAIN.network === "local" ? "Polygon local dev chain" : `Polygon ${MOCK_CHAIN.network}`}</div><p className="basis-full text-[11px] leading-4 text-muted-foreground">ML-DSA-65 signatures are verified off-chain by our backend verifier. Polygon stores hashes and the verifier’s attestation; it does not verify post-quantum signatures.</p></div></footer>
}
