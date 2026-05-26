import { describe, expect, it } from "vitest";

import {
  buildGalleryItemEventParams,
  buildGalleryItemOpenedParams,
  buildGeneratedCodeCopiedParams,
  buildPromptSubmittedParams,
} from "@/lib/metrics/events";

describe("analytics event payload helpers", () => {
  it("builds prompt submitted alias params", () => {
    expect(
      buildPromptSubmittedParams({
        historyTurns: 3,
        promptLength: 42,
        source: "manual",
      }),
    ).toEqual({
      product: "gravity-ai-ui",
      source: "manual",
      prompt_length: 42,
      history_turns: 3,
    });
  });

  it("builds gallery item params with optional surface metadata", () => {
    expect(
      buildGalleryItemEventParams({
        galleryItemId: "deployment-review-abc123",
        surfaceId: "main",
      }),
    ).toEqual({
      product: "gravity-ai-ui",
      gallery_item_id: "deployment-review-abc123",
      surface_id: "main",
    });
  });

  it("builds gallery item opened params", () => {
    expect(
      buildGalleryItemOpenedParams("deployment-review-abc123"),
    ).toEqual({
      product: "gravity-ai-ui",
      gallery_item_id: "deployment-review-abc123",
    });
  });

  it("builds generated code copied params", () => {
    expect(buildGeneratedCodeCopiedParams(120)).toEqual({
      product: "gravity-ai-ui",
      code_length: 120,
    });
  });
});
