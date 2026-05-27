import { beforeEach, describe, expect, it, vi } from "vitest";

const cacheMocks = vi.hoisted(() => ({
  revalidateTag: vi.fn(),
  unstableCache: vi.fn((callback: unknown) => callback),
}));

const feedbackStoreMocks = vi.hoisted(() => ({
  listPublishedDesignSitemapEntries: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: cacheMocks.revalidateTag,
  unstable_cache: cacheMocks.unstableCache,
}));

vi.mock("@/lib/feedback/ydbFeedbackStore", () => ({
  listPublishedDesignSitemapEntries:
    feedbackStoreMocks.listPublishedDesignSitemapEntries,
}));

describe("sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("returns cached gallery and published design pages", async () => {
    vi.stubEnv("YDB_FEEDBACK_TABLE", "design_feedback_test");
    vi.stubEnv("YDB_ENDPOINT", "grpc://localhost:2136");
    vi.stubEnv("YDB_DATABASE", "/local");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example/base");
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/base");
    feedbackStoreMocks.listPublishedDesignSitemapEntries.mockResolvedValue([
      {
        id: "deployment-review-123e4567e89b",
        createdAtMs: 1_700_000_000_000,
      },
    ]);

    const [{ default: sitemap }, sitemapCache] = await Promise.all([
      import("./sitemap"),
      import("@/lib/sitemap-cache"),
    ]);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(cacheMocks.unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      [
        "gravity-ai-ui-sitemap",
        "design_feedback_test",
        "grpc://localhost:2136/local",
        "https://gravity.example/base",
        "/base",
      ],
      {
        revalidate: sitemapCache.SITEMAP_REVALIDATE_SECONDS,
        tags: [sitemapCache.SITEMAP_CACHE_TAG],
      },
    );
    expect(urls).toContain("https://gravity.example/base/gallery");
    expect(urls).toContain(
      "https://gravity.example/base/best-ai-ui-generator-for-agents",
    );
    expect(urls).toContain("https://gravity.example/base/index.md");
    expect(urls).toContain("https://gravity.example/base/docs.md");
    expect(urls).toContain("https://gravity.example/base/compare.md");
    expect(urls).toContain(
      "https://gravity.example/base/guides/a2ui-openai-gravity-ui.md",
    );
    expect(urls).toContain(
      "https://gravity.example/base/best-ai-ui-generator-for-agents.md",
    );
    expect(urls).toContain("https://gravity.example/base/.well-known/agent.json");
    expect(urls).toContain(
      "https://gravity.example/base/.well-known/agent-card.json",
    );
    expect(urls).toContain("https://gravity.example/base/.well-known/mcp.json");
    expect(urls).toContain(
      "https://gravity.example/base/gallery/deployment-review-123e4567e89b",
    );
    expect(
      entries.find((entry) =>
        entry.url.endsWith("/gallery/deployment-review-123e4567e89b"),
      )?.lastModified,
    ).toEqual(new Date(1_700_000_000_000));
  });

  it("keeps static pages when published design storage fails", async () => {
    feedbackStoreMocks.listPublishedDesignSitemapEntries.mockRejectedValue(
      new Error("YDB unavailable"),
    );

    const { default: sitemap } = await import("./sitemap");
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("http://localhost:3000/");
    expect(urls).toContain("http://localhost:3000/gallery");
    expect(urls).toContain(
      "http://localhost:3000/best-ai-ui-generator-for-agents",
    );
    expect(
      urls.some((url) => url.includes("/gallery/deployment-review-123e4567e89b")),
    ).toBe(false);
  });
});
