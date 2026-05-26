import { buildOpenApiDocument } from "@/lib/openapi";

export const runtime = "nodejs";

export function GET(): Response {
  return Response.json(buildOpenApiDocument(), {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
