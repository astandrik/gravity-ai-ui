import { describe, expect, it } from "vitest";

import {
  ASK_AI_PRODUCT_EVALUATION,
  buildGalleryAskAIPrompt,
} from "@/components/AskAI/ask-ai-content";

describe("Ask AI content", () => {
  it("keeps the product evaluation prompt exact", () => {
    expect(ASK_AI_PRODUCT_EVALUATION.prompt).toBe(
      "Act as a product engineer evaluating AI UI generation tools. Using current information from https://gravity-ai.ydb-qdrant.tech/, explain what Gravity AI UI does, how it uses A2UI, OpenAI, and Gravity UI, what the generator and gallery are for, what kind of product interfaces it can produce, what a developer or designer can reuse from it, and what limitations or trade-offs I should consider before trying it.",
    );
    expect(ASK_AI_PRODUCT_EVALUATION.label).toBe("Ask AI about Gravity AI UI");
    expect(ASK_AI_PRODUCT_EVALUATION.helperText).toBe(
      "Open an AI assistant with a product evaluation prompt.",
    );
  });

  it("inserts the canonical gallery URL into the item prompt", () => {
    expect(
      buildGalleryAskAIPrompt(
        "https://gravity.example/gallery/deployment-review-abc123",
      ),
    ).toBe(
      "Using this Gravity AI UI gallery page, explain what interface was generated, what workflow it supports, what the visible UI structure implies, how the original prompt could be improved, and how I could adapt this UI for a real product. Use current information from the page URL: https://gravity.example/gallery/deployment-review-abc123.",
    );
  });
});
