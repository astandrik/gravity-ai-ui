import { designFeedbackSchema } from "@/lib/feedback/designFeedback";
import { jsonProblem, jsonWithAgentHeaders } from "@/lib/api-response";
import { scheduleGalleryThumbnailGeneration } from "@/lib/feedback/galleryThumbnailGenerator";
import { saveDesignFeedback } from "@/lib/feedback/ydbFeedbackStore";
import { revalidateSitemapCache } from "@/lib/sitemap-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = designFeedbackSchema.safeParse(body);

  if (!parsed.success) {
    return jsonProblem("invalid_design_feedback", "Invalid design feedback.", {
      status: 400,
      issues: parsed.error.flatten(),
    });
  }

  try {
    const saved = await saveDesignFeedback(parsed.data);

    revalidateSitemapCache();
    void scheduleGalleryThumbnailGeneration(saved.gallerySlug);

    return jsonWithAgentHeaders({
      feedbackId: saved.feedbackId,
      galleryId: saved.gallerySlug,
      rating: saved.rating,
      createdAtMs: saved.createdAtMs,
    });
  } catch (error) {
    return jsonProblem(
      "feedback_storage_unavailable",
      error instanceof Error ? error.message : "Failed to save design feedback.",
      { status: 503 },
    );
  }
}
