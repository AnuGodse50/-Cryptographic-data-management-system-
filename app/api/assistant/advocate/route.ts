import { advocateSuggestions } from "@/lib/assistant/advocate";
import { authed, str } from "@/lib/http";

export const runtime = "nodejs";

export const GET = authed(async (request, user) => advocateSuggestions(user, str(new URL(request.url).searchParams.get("firNo"), "firNo", 40)));
