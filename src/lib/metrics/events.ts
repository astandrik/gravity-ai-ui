export const ANALYTICS_PRODUCT = "gravity-ai-ui";

export type PromptSubmittedParamsInput = {
  source: string;
  promptLength: number;
  historyTurns: number;
};

export type GalleryItemEventParamsInput = {
  galleryItemId?: string;
  surfaceId?: string;
};

export function buildPromptSubmittedParams({
  historyTurns,
  promptLength,
  source,
}: PromptSubmittedParamsInput) {
  return {
    product: ANALYTICS_PRODUCT,
    source,
    prompt_length: promptLength,
    history_turns: historyTurns,
  };
}

export function buildGalleryItemEventParams({
  galleryItemId,
  surfaceId,
}: GalleryItemEventParamsInput = {}) {
  return {
    product: ANALYTICS_PRODUCT,
    ...(galleryItemId ? { gallery_item_id: galleryItemId } : {}),
    ...(surfaceId ? { surface_id: surfaceId } : {}),
  };
}

export function buildGalleryItemOpenedParams(galleryItemId: string) {
  return {
    product: ANALYTICS_PRODUCT,
    gallery_item_id: galleryItemId,
  };
}

export function buildGeneratedCodeCopiedParams(codeLength: number) {
  return {
    product: ANALYTICS_PRODUCT,
    code_length: codeLength,
  };
}
