export const ASK_AI_PRODUCT_NAME = "gravity-ai-ui";

export const ASK_AI_PRODUCT_EVALUATION = {
  label: "Ask AI about Gravity AI UI",
  helperText: "Open an AI assistant with a product evaluation prompt.",
  promptVariant: "product_eval_v1",
  prompt:
    "Act as a product engineer evaluating AI UI generation tools. Using current information from https://gravity-ai.ydb-qdrant.tech/, explain what Gravity AI UI does, how it uses A2UI, OpenAI, and Gravity UI, what the generator and gallery are for, what kind of product interfaces it can produce, what a developer or designer can reuse from it, and what limitations or trade-offs I should consider before trying it.",
} as const;

export const ASK_AI_GALLERY_DETAIL = {
  label: "Ask AI about this interface",
  helperText:
    "Ask an AI assistant to explain, critique, or adapt this generated UI.",
  page: "gallery_detail",
  promptVariant: "gallery_adapt_v1",
} as const;

export function buildGalleryAskAIPrompt(pageUrl: string): string {
  return `Using this Gravity AI UI gallery page, explain what interface was generated, what workflow it supports, what the visible UI structure implies, how the original prompt could be improved, and how I could adapt this UI for a real product. Use current information from the page URL: ${pageUrl}.`;
}
