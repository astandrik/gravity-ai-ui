import { getThumbnailResponse } from "../thumbnailResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  void request;

  return getThumbnailResponse("webp", context);
}
