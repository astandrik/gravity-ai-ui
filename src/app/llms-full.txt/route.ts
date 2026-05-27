import { buildLlmsFullTxt } from "@/lib/agent-docs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
