import { designFeedbackSchema } from "@/lib/feedback/designFeedback";
import { scheduleGalleryThumbnailGeneration } from "@/lib/feedback/galleryThumbnailGenerator";
import { saveDesignFeedback } from "@/lib/feedback/ydbFeedbackStore";
import { revalidateSitemapCache } from "@/lib/sitemap-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = designFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid design feedback", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const saved = await saveDesignFeedback(parsed.data);

    revalidateSitemapCache();
    void scheduleGalleryThumbnailGeneration(saved.gallerySlug);

    return Response.json({
      feedbackId: saved.feedbackId,
      galleryId: saved.gallerySlug,
      rating: saved.rating,
      createdAtMs: saved.createdAtMs,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save design feedback.",
      },
      { status: 503 },
    );
  }
}
