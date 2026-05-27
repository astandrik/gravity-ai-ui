import { jsonProblem } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return apiNotFound();
}

export function POST(): Response {
  return apiNotFound();
}

export function PUT(): Response {
  return apiNotFound();
}

export function PATCH(): Response {
  return apiNotFound();
}

export function DELETE(): Response {
  return apiNotFound();
}

function apiNotFound(): Response {
  return jsonProblem("not_found", "API route not found.", { status: 404 });
}
