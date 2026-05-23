import { describe, expect, it } from "vitest";
import type { ComposedInterfacePayload } from "@/lib/agent/composedInterface";
import {
  createPublishedDesignSlug,
  decodePublishedDesignId,
  designFeedbackSchema,
  encodePublishedDesignId,
  getFeedbackPayloadSummary,
  getFeedbackPayloadTitle,
  isPublishedDesignSlug,
  toSavedFeedback,
} from "./designFeedback";
import {
  getGallerySlugTableName,
  isConversationContextColumnExistsError,
  isMissingConversationContextColumnError,
  isMissingThumbnailColumnError,
  isThumbnailColumnExistsError,
  rowToPublishedDesign,
  rowToPublishedDesignSlugEntry,
} from "./ydbFeedbackStore";

const payload = {
  sequence: 0,
  surfaceId: "main",
  dataModel: {
    title: "Deployment review",
  },
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
        text: { path: "/title" },
        variant: "h2",
      },
    },
    {
      id: "summary",
      parentId: "root",
      order: 1,
      component: "Text",
      props: {
        text: "Approve the production rollout checklist.",
      },
    },
  ],
} satisfies ComposedInterfacePayload;

describe("design feedback publishing", () => {
  it("creates readable public gallery slugs", () => {
    const feedbackId = "conversation-1:assistant-2:1:123e4567-e89b-12d3-a456-426614174000";
    const slug = createPublishedDesignSlug("Deployment review!", feedbackId);

    expect(slug).toBe("deployment-review-123e4567e89b");
    expect(isPublishedDesignSlug(slug)).toBe(true);
  });

  it("keeps legacy encoded gallery ids decodable", () => {
    const feedbackId = "conversation-1:assistant-2:1:123e4567-e89b-12d3-a456-426614174000";
    const publicId = encodePublishedDesignId(feedbackId);

    expect(publicId).not.toBe(createPublishedDesignSlug("Deployment review", feedbackId));
    expect(publicId).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodePublishedDesignId(publicId)).toBe(feedbackId);
    expect(decodePublishedDesignId("not valid")).toBeNull();
  });

  it("derives fallback title and summary from payloads", () => {
    expect(getFeedbackPayloadTitle(payload)).toBe("Deployment review");
    expect(getFeedbackPayloadSummary(payload)).toBe(
      "Composed tree with 2 nodes: Text x2.",
    );
  });

  it("normalizes oversized feedback message lists", () => {
    const parsed = designFeedbackSchema.parse({
      conversationId: "conversation-1",
      turnId: "assistant-1",
      rating: 1,
      publish: true,
      payload,
      messages: Array.from({ length: 16 }, (_, index) => ({
        sequence: index,
      })),
    });

    expect(parsed.messages).toHaveLength(12);
    expect(parsed.messages[0]).toEqual({ sequence: 4 });
    expect(parsed.messages.at(-1)).toEqual({ sequence: 15 });
  });

  it("defaults omitted feedback messages to an empty list", () => {
    const parsed = designFeedbackSchema.parse({
      conversationId: "conversation-1",
      turnId: "assistant-1",
      rating: 1,
      publish: true,
      payload,
    });

    expect(parsed.messages).toEqual([]);
  });

  it("normalizes private conversation context history", () => {
    const parsed = designFeedbackSchema.parse({
      conversationId: "conversation-1",
      turnId: "assistant-1",
      rating: 1,
      publish: true,
      payload,
      conversationContext: {
        history: Array.from({ length: 50 }, (_, index) => ({
          role: index % 2 === 0 ? "user" : "assistant",
          text:
            index === 49
              ? "x".repeat(6_010)
              : ` Conversation item ${index} `,
          surfaceId: index % 2 === 0 ? undefined : " main ",
        })),
      },
    });

    expect(parsed.conversationContext?.history).toHaveLength(48);
    expect(parsed.conversationContext?.history[0]?.text).toBe(
      "Conversation item 2",
    );
    expect(parsed.conversationContext?.history.at(-1)?.text).toHaveLength(6000);
    expect(parsed.conversationContext?.history.at(-1)?.text.endsWith("...")).toBe(
      true,
    );
    expect(parsed.conversationContext?.history[1]?.surfaceId).toBe("main");
  });

  it("stores a gallery slug with saved feedback", () => {
    const saved = toSavedFeedback(
      designFeedbackSchema.parse({
        conversationId: "conversation-1",
        turnId: "assistant-1",
        rating: 1,
        publish: true,
        payload,
      }),
    );

    expect(saved.gallerySlug).toMatch(/^deployment-review-[a-z0-9]{10,16}$/);
  });

  it("parses liked feedback rows into published designs", () => {
    const [design] = rowToPublishedDesign({
      feedback_id: "conversation-1:assistant-2:1:123",
      gallery_slug: "deployment-review-custom1234",
      published: 1,
      prompt: "Build a deployment review",
      title: "",
      summary: null,
      surface_id: null,
      payload_json: JSON.stringify(payload),
      created_at_ms: BigInt(1_700_000_000_000),
    });

    expect(design).toMatchObject({
      title: "Deployment review",
      summary: "Composed tree with 2 nodes: Text x2.",
      surfaceId: "main",
      createdAtMs: 1_700_000_000_000,
    });
    expect(design).not.toHaveProperty("prompt");
    expect(design.id).toBe("deployment-review-custom1234");
  });

  it("does not expose legacy row prompts on published designs", () => {
    const [design] = rowToPublishedDesign({
      feedback_id: "conversation-1:assistant-2:1:123",
      gallery_slug: "deployment-review-custom1234",
      published: 1,
      prompt: "Move the button a little",
      title: "",
      summary: null,
      surface_id: null,
      payload_json: JSON.stringify(payload),
      created_at_ms: BigInt(1_700_000_000_000),
    });

    expect(design).not.toHaveProperty("prompt");
  });

  it("parses keyed gallery slug entries from published rows", () => {
    expect(
      rowToPublishedDesignSlugEntry({
        feedback_id: "conversation-1:assistant-2:1:123",
        gallery_slug: "deployment-review-custom1234",
        published: 1,
        title: "",
        summary: null,
        payload_json: JSON.stringify(payload),
        created_at_ms: BigInt(1_700_000_000_000),
      }),
    ).toEqual([
      {
        gallerySlug: "deployment-review-custom1234",
        feedbackId: "conversation-1:assistant-2:1:123",
        createdAtMs: 1_700_000_000_000,
      },
    ]);
  });

  it("derives keyed gallery slug entries for legacy published rows", () => {
    expect(
      rowToPublishedDesignSlugEntry({
        feedback_id:
          "conversation-1:assistant-2:1:123e4567-e89b-12d3-a456-426614174000",
        published: 1,
        title: "",
        summary: null,
        payload_json: JSON.stringify(payload),
        created_at_ms: BigInt(1_700_000_000_000),
      }),
    ).toEqual([
      {
        gallerySlug: "deployment-review-123e4567e89b",
        feedbackId:
          "conversation-1:assistant-2:1:123e4567-e89b-12d3-a456-426614174000",
        createdAtMs: 1_700_000_000_000,
      },
    ]);
  });

  it("parses published design thumbnail metadata without image bytes", () => {
    const [design] = rowToPublishedDesign({
      feedback_id: "conversation-1:assistant-2:1:123",
      gallery_slug: "deployment-review-custom1234",
      published: 1,
      prompt: "Build a deployment review",
      title: "",
      summary: null,
      surface_id: null,
      payload_json: JSON.stringify(payload),
      thumbnail_width: 960,
      thumbnail_height: 600,
      thumbnail_generated_at_ms: BigInt(1_700_000_000_111),
      created_at_ms: BigInt(1_700_000_000_000),
    });

    expect(design.thumbnail).toEqual({
      width: 960,
      height: 600,
      generatedAtMs: 1_700_000_000_111,
      webpPath: "/gallery/deployment-review-custom1234/thumbnail.webp",
      pngPath: "/gallery/deployment-review-custom1234/thumbnail.png",
    });
  });

  it("omits malformed thumbnail metadata", () => {
    const [design] = rowToPublishedDesign({
      feedback_id: "conversation-1:assistant-2:1:123",
      gallery_slug: "deployment-review-custom1234",
      published: 1,
      prompt: "Build a deployment review",
      title: "",
      summary: null,
      surface_id: null,
      payload_json: JSON.stringify(payload),
      thumbnail_width: 960,
      thumbnail_height: null,
      thumbnail_generated_at_ms: BigInt(1_700_000_000_111),
      created_at_ms: BigInt(1_700_000_000_000),
    });

    expect(design.thumbnail).toBeUndefined();
  });

  it("recognizes thumbnail column migration errors", () => {
    expect(
      isMissingThumbnailColumnError(
        new Error("Member not found: thumbnail_webp"),
        "thumbnail_webp",
      ),
    ).toBe(true);
    expect(
      isThumbnailColumnExistsError(
        new Error("Column already exists: thumbnail_webp"),
        "thumbnail_webp",
      ),
    ).toBe(true);
  });

  it("recognizes private conversation context column migration errors", () => {
    expect(
      isMissingConversationContextColumnError(
        new Error("Member not found: conversation_context_json"),
      ),
    ).toBe(true);
    expect(
      isConversationContextColumnExistsError(
        new Error("Column already exists: conversation_context_json"),
      ),
    ).toBe(true);
  });

  it("derives the gallery slug lookup table name", () => {
    expect(getGallerySlugTableName("design_feedback")).toBe(
      "design_feedback_gallery_slugs",
    );
  });

  it("derives readable ids for legacy rows without gallery slugs", () => {
    const [design] = rowToPublishedDesign({
      feedback_id: "conversation-1:assistant-2:1:123e4567-e89b-12d3-a456-426614174000",
      published: 1,
      prompt: "Build a deployment review",
      title: "",
      summary: null,
      surface_id: null,
      payload_json: JSON.stringify(payload),
      created_at_ms: BigInt(1_700_000_000_000),
    });

    expect(design.id).toBe("deployment-review-123e4567e89b");
  });

  it("does not publish feedback rows without an explicit marker", () => {
    expect(
      rowToPublishedDesign({
        feedback_id: "conversation-1:assistant-2:1:123",
        prompt: "Build a deployment review",
        payload_json: JSON.stringify(payload),
        created_at_ms: BigInt(1_700_000_000_000),
      }),
    ).toEqual([]);
  });
});
