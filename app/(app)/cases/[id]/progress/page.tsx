import { ProgressTimeline } from "@/components/quantumshield/progress-timeline"
export default async function CaseProgressPage({ params }: PageProps<"/cases/[id]/progress">) { const { id } = await params; return <ProgressTimeline caseId={id}/> }
