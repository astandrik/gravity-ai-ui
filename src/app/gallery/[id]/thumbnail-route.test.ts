import { describe, expect, it, vi } from "vitest";

const feedbackStoreMocks = vi.hoisted(() => ({
  getPublishedDesignThumbnail: vi.fn(),
}));

vi.mock("@/lib/feedback/ydbFeedbackStore", () => ({
  getPublishedDesignThumbnail: feedbackStoreMocks.getPublishedDesignThumbnail,
}));

import { GET as getPngThumbnail } from "./thumbnail.png/route";
import { GET as getWebpThumbnail } from "./thumbnail.webp/route";

describe("gallery thumbnail routes", () => {
  it("returns webp bytes with cache headers", async () => {
    feedbackStoreMocks.getPublishedDesignThumbnail.mockResolvedValueOnce({
      bytes: Buffer.from("webp-bytes"),
      contentType: "image/webp",
      width: 960,
      height: 600,
      generatedAtMs: 1_700_000_000_000,
    });

    const response = await getWebpThumbnail(new Request("http://localhost"), {
      params: Promise.resolve({ id: "deployment-review-123e4567e89b" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/webp");
    expect(response.headers.get("Content-Length")).toBe("10");
    expect(response.headers.get("Cache-Control")).toContain("max-age=3600");
    await expect(response.text()).resolves.toBe("webp-bytes");
  });

  it("returns png bytes", async () => {
    feedbackStoreMocks.getPublishedDesignThumbnail.mockResolvedValueOnce({
      bytes: Buffer.from("png-bytes"),
      contentType: "image/png",
      width: 960,
      height: 600,
      generatedAtMs: 1_700_000_000_000,
    });

    const response = await getPngThumbnail(new Request("http://localhost"), {
      params: Promise.resolve({ id: "deployment-review-123e4567e89b" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
    await expect(response.text()).resolves.toBe("png-bytes");
  });

  it("returns 404 when thumbnail bytes are missing", async () => {
    feedbackStoreMocks.getPublishedDesignThumbnail.mockResolvedValueOnce(null);

    const response = await getWebpThumbnail(new Request("http://localhost"), {
      params: Promise.resolve({ id: "deployment-review-123e4567e89b" }),
    });

    expect(response.status).toBe(404);
  });
});
