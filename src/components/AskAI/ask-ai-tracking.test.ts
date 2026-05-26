import { describe, expect, it } from "vitest";

import { buildAskAITrackingParams } from "@/components/AskAI/ask-ai-tracking";

describe("Ask AI tracking", () => {
  it("builds product click params without gallery item metadata", () => {
    expect(
      buildAskAITrackingParams({
        productName: "gravity-ai-ui",
        page: "docs",
        provider: "chatgpt",
        promptVariant: "product_eval_v1",
      }),
    ).toEqual({
      product: "gravity-ai-ui",
      page: "docs",
      provider: "chatgpt",
      prompt_variant: "product_eval_v1",
    });
  });

  it("builds gallery click params with the gallery item id", () => {
    expect(
      buildAskAITrackingParams({
        productName: "gravity-ai-ui",
        page: "gallery_detail",
        provider: "claude",
        promptVariant: "gallery_adapt_v1",
        contextId: "deployment-review-abc123",
      }),
    ).toEqual({
      product: "gravity-ai-ui",
      page: "gallery_detail",
      provider: "claude",
      prompt_variant: "gallery_adapt_v1",
      gallery_item_id: "deployment-review-abc123",
    });
  });
});
