import { buildA2aAgentCard } from "@/lib/agent-discovery";

export const runtime = "nodejs";

export function GET(): Response {
  return Response.json(buildA2aAgentCard(), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
