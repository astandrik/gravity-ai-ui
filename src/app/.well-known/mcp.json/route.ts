import { buildMcpWellKnownDocument } from "@/lib/agent-discovery";

export const runtime = "nodejs";

export function GET(): Response {
  return Response.json(buildMcpWellKnownDocument(), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
