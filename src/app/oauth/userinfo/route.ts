import { buildDisabledOAuthError } from "@/lib/oauth-metadata";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return disabledUserInfoResponse();
}

export async function POST(): Promise<Response> {
  return disabledUserInfoResponse();
}

function disabledUserInfoResponse(): Response {
  return Response.json(buildDisabledOAuthError(), {
    status: 501,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
