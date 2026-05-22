import { chromium } from "playwright-core";
import sharp from "sharp";
import { withBasePath } from "@/lib/base-path";
import {
  savePublishedDesignThumbnail,
  savePublishedDesignThumbnailError,
} from "./ydbFeedbackStore";

export const GALLERY_THUMBNAIL_WIDTH = 960;
export const GALLERY_THUMBNAIL_HEIGHT = 600;
const THUMBNAIL_WEBP_QUALITY = 82;
const THUMBNAIL_CAPTURE_SELECTOR = "[data-gallery-thumbnail-capture]";
const THUMBNAIL_RENDERED_SELECTOR = `${THUMBNAIL_CAPTURE_SELECTOR} .interface-surface`;

let generationQueue = Promise.resolve();

export function scheduleGalleryThumbnailGeneration(id: string) {
  generationQueue = generationQueue
    .catch(() => undefined)
    .then(() => generateAndStoreGalleryThumbnail(id))
    .then((result) => {
      if (result.status === "failed") {
        console.warn("[gallery-thumbnail]", {
          id,
          error: result.error,
        });
      }
    });

  return generationQueue;
}

export async function generateAndStoreGalleryThumbnail(id: string) {
  const attemptedAtMs = Date.now();

  try {
    const png = await captureGalleryThumbnailPng(id);
    const webp = await sharp(png)
      .webp({ quality: THUMBNAIL_WEBP_QUALITY })
      .toBuffer();

    await savePublishedDesignThumbnail({
      id,
      png,
      webp,
      width: GALLERY_THUMBNAIL_WIDTH,
      height: GALLERY_THUMBNAIL_HEIGHT,
      generatedAtMs: Date.now(),
    });

    return { status: "stored" as const };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Thumbnail generation failed.";

    await savePublishedDesignThumbnailError(id, message, attemptedAtMs).catch(
      (storeError: unknown) => {
        console.warn("[gallery-thumbnail][store-error]", {
          id,
          error:
            storeError instanceof Error ? storeError.message : String(storeError),
        });
      },
    );

    return { status: "failed" as const, error: message };
  }
}

export async function captureGalleryThumbnailPng(id: string) {
  const browser = await chromium.launch({
    executablePath: getChromiumExecutablePath(),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage({
      viewport: {
        width: GALLERY_THUMBNAIL_WIDTH,
        height: GALLERY_THUMBNAIL_HEIGHT,
      },
      deviceScaleFactor: 1,
    });
    const url = buildGalleryThumbnailRenderUrl(id);
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    if (!response?.ok()) {
      throw new Error(
        `Thumbnail render page failed with status ${response?.status() ?? "unknown"}.`,
      );
    }

    await page.waitForSelector(THUMBNAIL_CAPTURE_SELECTOR, {
      state: "visible",
      timeout: 15_000,
    });
    await page.waitForSelector(THUMBNAIL_RENDERED_SELECTOR, {
      state: "attached",
      timeout: 15_000,
    });

    const capture = page.locator(THUMBNAIL_CAPTURE_SELECTOR);
    const png = await capture.screenshot({
      type: "png",
      timeout: 15_000,
    });

    return Buffer.from(png);
  } finally {
    await browser.close();
  }
}

export function buildGalleryThumbnailRenderUrl(id: string) {
  return `${getThumbnailInternalOrigin()}${withBasePath(
    `/gallery-thumbnail-render/${id}`,
  )}`;
}

function getThumbnailInternalOrigin() {
  const configured = process.env.THUMBNAIL_INTERNAL_ORIGIN?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return `http://localhost:${process.env.PORT || "3000"}`;
}

function getChromiumExecutablePath() {
  return process.env.THUMBNAIL_CHROMIUM_PATH?.trim() || "/usr/bin/chromium";
}
