import { buildDisabledOAuthError } from "@/lib/oauth-metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<Response> {
  return Response.json(buildDisabledOAuthError(), {
    status: 501,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export function GET(): Response {
  return Response.json(buildDisabledOAuthError(), {
    status: 405,
    headers: {
      Allow: "POST",
      "Cache-Control": "no-store",
    },
  });
}
