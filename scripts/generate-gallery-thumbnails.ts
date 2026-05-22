import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

const DEFAULT_LIMIT = 100;

async function main() {
  loadLocalEnv();

  const [thumbnailModule, feedbackStoreModule] = await Promise.all([
    import("../src/lib/feedback/galleryThumbnailGenerator"),
    import("../src/lib/feedback/ydbFeedbackStore"),
  ]);
  const {generateAndStoreGalleryThumbnail} = unwrapModule(thumbnailModule);
  const {
    backfillPublishedDesignSlugs,
    listPublishedDesignsMissingThumbnails,
  } = unwrapModule(feedbackStoreModule);

  const slugBackfill = await backfillPublishedDesignSlugs();
  console.info(`gallery-slugs:upserted:${slugBackfill.upserted}`);

  const limit = readLimit();
  const designs = await listPublishedDesignsMissingThumbnails(limit);

  console.info(`gallery-thumbnails:found:${designs.length}`);

  for (const design of designs) {
    console.info(`gallery-thumbnails:start:${design.id}`);
    const result = await generateAndStoreGalleryThumbnail(design.id);

    if (result.status === "stored") {
      console.info(`gallery-thumbnails:stored:${design.id}`);
    } else {
      console.warn(`gallery-thumbnails:failed:${design.id}:${result.error}`);
    }
  }
}

function readLimit() {
  const rawLimit = process.env.GALLERY_THUMBNAIL_BACKFILL_LIMIT;

  if (!rawLimit) {
    return DEFAULT_LIMIT;
  }

  const limit = Number(rawLimit);

  if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error("GALLERY_THUMBNAIL_BACKFILL_LIMIT must be 1..500.");
  }

  return limit;
}

function loadLocalEnv() {
  if (existsSync(".env.local")) {
    loadEnvFile(".env.local");
  }
}

function unwrapModule<T extends object>(module: T) {
  return (module as {default?: T}).default ?? module;
}

main().then(
  () => {
    process.exit(0);
  },
  (error: unknown) => {
    console.error(
      error instanceof Error
        ? error.message
        : "Gallery thumbnail backfill failed.",
    );
    process.exit(1);
  },
);
