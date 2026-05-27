import { apiNotFound } from "@/app/api/api-not-found";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request?: Request): Response {
  return apiNotFound(request);
}

export function POST(request?: Request): Response {
  return apiNotFound(request);
}

export function PUT(request?: Request): Response {
  return apiNotFound(request);
}

export function PATCH(request?: Request): Response {
  return apiNotFound(request);
}

export function DELETE(request?: Request): Response {
  return apiNotFound(request);
}
