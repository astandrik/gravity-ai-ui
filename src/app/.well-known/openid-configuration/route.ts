import { buildOpenIdConfiguration } from "@/lib/oauth-metadata";

export const runtime = "nodejs";

export function GET(): Response {
  return Response.json(buildOpenIdConfiguration(), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
