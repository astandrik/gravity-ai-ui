import { buildOAuthAuthorizationServerMetadata } from "@/lib/oauth-metadata";

export const runtime = "nodejs";

export function GET(): Response {
  return Response.json(buildOAuthAuthorizationServerMetadata(), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
