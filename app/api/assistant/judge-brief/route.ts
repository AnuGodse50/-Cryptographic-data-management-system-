import { judgeBrief } from "@/lib/assistant/judge";
import { authed, requireUuid } from "@/lib/http";

export const runtime = "nodejs";

export const GET = authed(async (request, user) => judgeBrief(user, requireUuid(new URL(request.url).searchParams.get("caseId"), "caseId")));
