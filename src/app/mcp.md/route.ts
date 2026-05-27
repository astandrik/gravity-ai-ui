import { buildMcpMarkdown } from "@/lib/agent-docs";

export const runtime = "nodejs";

export function GET(): Response {
  return new Response(buildMcpMarkdown(), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
