import { getPublishedDesignThumbnail } from "@/lib/feedback/ydbFeedbackStore";
import type { PublishedDesignThumbnailFormat } from "@/lib/feedback/ydbFeedbackStore";

type ThumbnailRouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const THUMBNAIL_CACHE_CONTROL =
  "public, max-age=3600, stale-while-revalidate=86400";

export async function getThumbnailResponse(
  format: PublishedDesignThumbnailFormat,
  { params }: ThumbnailRouteParams,
) {
  const { id } = await params;
  const thumbnail = await getPublishedDesignThumbnail(id, format);

  if (!thumbnail) {
    return new Response("not found", { status: 404 });
  }

  return new Response(new Uint8Array(thumbnail.bytes), {
    headers: {
      "Cache-Control": THUMBNAIL_CACHE_CONTROL,
      "Content-Length": thumbnail.bytes.byteLength.toString(),
      "Content-Type": thumbnail.contentType,
      "Last-Modified": new Date(thumbnail.generatedAtMs).toUTCString(),
    },
  });
}
