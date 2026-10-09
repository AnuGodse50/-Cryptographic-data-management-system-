import { askCase } from "@/lib/assistant/ask";
import { authed, jsonBody, requireUuid, str } from "@/lib/http";

export const runtime = "nodejs";

export const POST = authed(async (request, user) => {
  const body = await jsonBody(request);
  return askCase(user, requireUuid(body.caseId, "caseId"), str(body.question, "question", 500));
});
