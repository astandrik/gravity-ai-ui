import { jsonProblem, readAgentRateLimitKey } from "@/lib/api-response";

export function apiNotFound(request?: Request): Response {
  return jsonProblem(
    "not_found",
    "API route not found.",
    { status: 404 },
    request ? { rateLimitKey: readAgentRateLimitKey(request) } : undefined,
  );
}
