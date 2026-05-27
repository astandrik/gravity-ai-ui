import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAgentRateLimitForTests } from "@/lib/api-response";

const feedbackStoreMocks = vi.hoisted(() => ({
  saveDesignFeedback: vi.fn(),
}));

const sitemapCacheMocks = vi.hoisted(() => ({
  revalidateSitemapCache: vi.fn(),
}));

const thumbnailGeneratorMocks = vi.hoisted(() => ({
  scheduleGalleryThumbnailGeneration: vi.fn(),
}));

vi.mock("@/lib/feedback/ydbFeedbackStore", () => ({
  saveDesignFeedback: feedbackStoreMocks.saveDesignFeedback,
}));

vi.mock("@/lib/feedback/galleryThumbnailGenerator", () => ({
  scheduleGalleryThumbnailGeneration:
    thumbnailGeneratorMocks.scheduleGalleryThumbnailGeneration,
}));

vi.mock("@/lib/sitemap-cache", () => ({
  revalidateSitemapCache: sitemapCacheMocks.revalidateSitemapCache,
}));

vi.mock("@/lib/mcp/server", () => ({
  createGravityAiMcpServer: vi.fn(),
}));

describe("agent-facing API response headers and errors", () => {
  beforeEach(() => {
    resetAgentRateLimitForTests();
  });

  it("adds rate-limit and version headers to handled API validation errors", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { POST } = await import("@/app/api/design-feedback/route");

    const response = await POST(
      new Request("https://gravity.example/api/design-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: -1 }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(response.headers.get("RateLimit-Limit")).toBe("60");
    expect(response.headers.get("RateLimit-Remaining")).toBe("59");
    expect(response.headers.get("RateLimit-Reset")).toBe("60");
    expect(response.headers.get("API-Version")).toBe("1");
    expect(body.error.code).toBe("invalid_design_feedback");
  });

  it("adds rate-limit and version headers to MCP method errors", async () => {
    const { GET } = await import("@/app/mcp/route");

    const response = await GET();

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(response.headers.get("RateLimit-Limit")).toBe("60");
    expect(response.headers.get("API-Version")).toBe("1");
  });

  it("returns structured JSON for unknown API routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/api/[...path]/route");

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("RateLimit-Limit")).toBe("60");
    expect(body).toEqual({
      error: {
        code: "not_found",
        message: "API route not found.",
        docs: "https://gravity.example/docs",
      },
    });
  });

  it("returns structured JSON for the unknown API root", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/api/route");

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(response.headers.get("RateLimit-Limit")).toBe("60");
    expect(body.error.message).toBe("API route not found.");
  });
});
