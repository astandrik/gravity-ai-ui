import { describe, expect, it, vi } from "vitest";

const feedbackStoreMocks = vi.hoisted(() => ({
  saveDesignFeedback: vi.fn(),
}));

const sitemapCacheMocks = vi.hoisted(() => ({
  revalidateSitemapCache: vi.fn(),
}));

const thumbnailGeneratorMocks = vi.hoisted(() => ({
  scheduleGalleryThumbnailGeneration: vi.fn(),
}));

vi.mock("@/lib/feedback/ydbFeedbackStore", () => ({
  saveDesignFeedback: feedbackStoreMocks.saveDesignFeedback,
}));

vi.mock("@/lib/feedback/galleryThumbnailGenerator", () => ({
  scheduleGalleryThumbnailGeneration:
    thumbnailGeneratorMocks.scheduleGalleryThumbnailGeneration,
}));

vi.mock("@/lib/sitemap-cache", () => ({
  revalidateSitemapCache: sitemapCacheMocks.revalidateSitemapCache,
}));

import { POST } from "./route";

const payload = {
  sequence: 0,
  surfaceId: "main",
  dataModel: {},
  root: {
    component: "Column",
    props: {
      align: "stretch",
      gap: "normal",
    },
  },
  nodes: [
    {
      id: "title",
      parentId: "root",
      order: 0,
      component: "Text",
      props: {
        text: "Deployment review",
        variant: "h2",
      },
    },
  ],
};

describe("design feedback route", () => {
  it("revalidates the sitemap cache after publishing feedback", async () => {
    feedbackStoreMocks.saveDesignFeedback.mockResolvedValueOnce({
      conversationId: "conversation-1",
      turnId: "assistant-1",
      rating: 1,
      publish: true,
      payload,
      messages: [],
      feedbackId: "feedback-1",
      gallerySlug: "deployment-review-123e4567e89b",
      createdAtMs: 1_700_000_000_000,
    });

    const response = await POST(
      new Request("http://localhost/api/design-feedback", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "conversation-1",
          turnId: "assistant-1",
          rating: 1,
          publish: true,
          payload,
          messages: [],
          conversationContext: {
            history: [
              {
                role: "user",
                text: "Build a deployment review",
              },
              {
                role: "assistant",
                text: "Deployment review\nComponents: 1 (Text x1)",
                surfaceId: "main",
              },
            ],
          },
        }),
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      galleryId: "deployment-review-123e4567e89b",
    });
    expect(response.status).toBe(200);
    expect(sitemapCacheMocks.revalidateSitemapCache).toHaveBeenCalledTimes(1);
    expect(feedbackStoreMocks.saveDesignFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationContext: {
          history: [
            {
              role: "user",
              text: "Build a deployment review",
            },
            {
              role: "assistant",
              text: "Deployment review\nComponents: 1 (Text x1)",
              surfaceId: "main",
            },
          ],
        },
      }),
    );
    expect(
      thumbnailGeneratorMocks.scheduleGalleryThumbnailGeneration,
    ).toHaveBeenCalledWith("deployment-review-123e4567e89b");
  });
});
