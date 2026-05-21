import { describe, expect, it, vi } from "vitest";

describe("base path helpers", () => {
  it("returns the same path when no base path is configured", async () => {
    vi.resetModules();
    vi.unstubAllEnvs();

    const { withBasePath } = await import("@/lib/base-path");
    expect(withBasePath("/")).toBe("/");
    expect(withBasePath("/docs")).toBe("/docs");
  });

  it("prefixes paths when NEXT_PUBLIC_BASE_PATH is set", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "/gravity-ai-ui");

    const { withBasePath } = await import("@/lib/base-path");
    expect(withBasePath("/")).toBe("/gravity-ai-ui");
    expect(withBasePath("/docs")).toBe("/gravity-ai-ui/docs");
    expect(withBasePath("/gravity-ai-ui/docs")).toBe("/gravity-ai-ui/docs");

    vi.unstubAllEnvs();
  });
});
