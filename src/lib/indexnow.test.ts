import { afterEach, describe, expect, it, vi } from "vitest";

describe("IndexNow helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("skips missing or invalid keys", async () => {
    const { getIndexNowKey, getIndexNowKeyFileName } = await import("./indexnow");

    vi.stubEnv("INDEXNOW_KEY", "");
    expect(getIndexNowKey()).toBeNull();
    expect(getIndexNowKeyFileName()).toBeNull();

    vi.stubEnv("INDEXNOW_KEY", "bad/key");
    expect(getIndexNowKey()).toBeNull();
  });

  it("builds deploy URLs and key location on the public host", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity-ai.ydb-qdrant.tech");
    vi.stubEnv("INDEXNOW_KEY", "indexnow-key-123");

    const {
      getIndexNowDeployUrls,
      getIndexNowHost,
      getIndexNowKeyLocation,
    } = await import("./indexnow");

    expect(getIndexNowHost()).toBe("gravity-ai.ydb-qdrant.tech");
    expect(getIndexNowKeyLocation()).toBe(
      "https://gravity-ai.ydb-qdrant.tech/indexnow-key-123.txt",
    );
    expect(getIndexNowDeployUrls()).toEqual([
      "https://gravity-ai.ydb-qdrant.tech/",
      "https://gravity-ai.ydb-qdrant.tech/docs",
      "https://gravity-ai.ydb-qdrant.tech/sitemap.xml",
      "https://gravity-ai.ydb-qdrant.tech/robots.txt",
      "https://gravity-ai.ydb-qdrant.tech/llms.txt",
      "https://gravity-ai.ydb-qdrant.tech/opengraph-image",
    ]);
  });
});
