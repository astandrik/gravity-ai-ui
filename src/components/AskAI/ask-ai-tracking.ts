import type { AskAIProviderId } from "@/components/AskAI/ask-ai-links";

export type AskAITrackingInput = {
  productName: string;
  page: string;
  provider: AskAIProviderId;
  promptVariant: string;
  contextId?: string;
};

export function buildAskAITrackingParams({
  contextId,
  page,
  productName,
  promptVariant,
  provider,
}: AskAITrackingInput) {
  return {
    product: productName,
    page,
    provider,
    prompt_variant: promptVariant,
    ...(contextId ? { gallery_item_id: contextId } : {}),
  };
}
