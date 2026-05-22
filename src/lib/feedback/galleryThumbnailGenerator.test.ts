import { beforeEach, describe, expect, it, vi } from "vitest";

const playwrightMocks = vi.hoisted(() => {
  const screenshot = vi.fn();
  const locator = vi.fn(() => ({ screenshot }));
  const page = {
    goto: vi.fn(),
    locator,
    waitForSelector: vi.fn(),
  };
  const browser = {
    close: vi.fn(),
    newPage: vi.fn(() => page),
  };

  return {
    browser,
    chromium: {
      launch: vi.fn(() => browser),
    },
    locator,
    page,
    screenshot,
  };
});

const sharpMocks = vi.hoisted(() => {
  const pipeline = {
    toBuffer: vi.fn(),
    webp: vi.fn(() => pipeline),
  };

  return {
    pipeline,
    sharp: vi.fn(() => pipeline),
  };
});

const storeMocks = vi.hoisted(() => ({
  savePublishedDesignThumbnail: vi.fn(),
  savePublishedDesignThumbnailError: vi.fn(),
}));

vi.mock("playwright-core", () => ({
  chromium: playwrightMocks.chromium,
}));

vi.mock("sharp", () => ({
  default: sharpMocks.sharp,
}));

vi.mock("./ydbFeedbackStore", () => ({
  savePublishedDesignThumbnail: storeMocks.savePublishedDesignThumbnail,
  savePublishedDesignThumbnailError: storeMocks.savePublishedDesignThumbnailError,
}));

describe("gallery thumbnail generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    playwrightMocks.page.goto.mockResolvedValue({ ok: () => true });
    playwrightMocks.screenshot.mockResolvedValue(Buffer.from("png-bytes"));
    sharpMocks.pipeline.toBuffer.mockResolvedValue(Buffer.from("webp-bytes"));
    storeMocks.savePublishedDesignThumbnail.mockResolvedValue(undefined);
    storeMocks.savePublishedDesignThumbnailError.mockResolvedValue(undefined);
  });

  it("builds internal render URLs with base path", async () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/base");
    vi.stubEnv("PORT", "4333");

    const { buildGalleryThumbnailRenderUrl } = await import(
      "./galleryThumbnailGenerator"
    );

    expect(
      buildGalleryThumbnailRenderUrl("deployment-review-123e4567e89b"),
    ).toBe(
      "http://localhost:4333/base/gallery-thumbnail-render/deployment-review-123e4567e89b",
    );
  });

  it("captures png, converts webp, and stores both formats", async () => {
    const { generateAndStoreGalleryThumbnail } = await import(
      "./galleryThumbnailGenerator"
    );

    const result = await generateAndStoreGalleryThumbnail(
      "deployment-review-123e4567e89b",
    );

    expect(result).toEqual({ status: "stored" });
    expect(playwrightMocks.chromium.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        executablePath: "/usr/bin/chromium",
      }),
    );
    expect(playwrightMocks.page.goto).toHaveBeenCalledWith(
      "http://localhost:3000/gallery-thumbnail-render/deployment-review-123e4567e89b",
      expect.objectContaining({ waitUntil: "domcontentloaded" }),
    );
    expect(playwrightMocks.page.waitForSelector).toHaveBeenCalledWith(
      "[data-gallery-thumbnail-capture]",
      expect.objectContaining({ state: "visible" }),
    );
    expect(playwrightMocks.page.waitForSelector).toHaveBeenCalledWith(
      "[data-gallery-thumbnail-capture] .interface-surface",
      expect.objectContaining({ state: "attached" }),
    );
    expect(sharpMocks.sharp).toHaveBeenCalledWith(Buffer.from("png-bytes"));
    expect(sharpMocks.pipeline.webp).toHaveBeenCalledWith({ quality: 82 });
    expect(storeMocks.savePublishedDesignThumbnail).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "deployment-review-123e4567e89b",
        png: Buffer.from("png-bytes"),
        webp: Buffer.from("webp-bytes"),
        width: 960,
        height: 600,
      }),
    );
  });

  it("stores generation errors without throwing", async () => {
    playwrightMocks.chromium.launch.mockRejectedValueOnce(
      new Error("Chromium missing"),
    );

    const { generateAndStoreGalleryThumbnail } = await import(
      "./galleryThumbnailGenerator"
    );

    const result = await generateAndStoreGalleryThumbnail(
      "deployment-review-123e4567e89b",
    );

    expect(result).toEqual({
      status: "failed",
      error: "Chromium missing",
    });
    expect(storeMocks.savePublishedDesignThumbnailError).toHaveBeenCalledWith(
      "deployment-review-123e4567e89b",
      "Chromium missing",
      expect.any(Number),
    );
  });
});
