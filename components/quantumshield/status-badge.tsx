import { AlertTriangle, CheckCircle2, CircleDashed, Clock3, HelpCircle } from "lucide-react"
import type { VerifyStatus } from "@/types/api"
import { Badge } from "@/components/ui/badge"

const details = {
  VERIFIED: { label: "Verified", icon: CheckCircle2, className: "border-verified/30 bg-verified-surface text-verified" },
  TAMPERED: { label: "Integrity mismatch", icon: AlertTriangle, className: "border-tampered/30 bg-tampered-surface text-tampered" },
  PENDING_ANCHOR: { label: "Pending anchor", icon: Clock3, className: "border-pending/30 bg-pending-surface text-pending" },
  UNANCHORED: { label: "Not anchored", icon: CircleDashed, className: "border-neutral/30 bg-neutral-surface text-neutral" },
  ERROR: { label: "Could not verify", icon: HelpCircle, className: "border-destructive/30 bg-destructive/10 text-destructive" },
} satisfies Record<VerifyStatus, { label: string; icon: typeof CheckCircle2; className: string }>

export function StatusBadge({ status }: { status: VerifyStatus | null }) {
  if (!status) return <Badge variant="outline" className="text-muted-foreground"><CircleDashed /> Not checked</Badge>
  const item = details[status]
  return <Badge variant="outline" className={item.className}><item.icon />{item.label}</Badge>
}
