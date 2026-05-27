import { describe, expect, it, vi } from "vitest";

describe("robots", () => {
  it("allows agent discovery and markdown fallback URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { default: robots } = await import("@/app/robots");

    const policy = robots();
    const rules = Array.isArray(policy.rules) ? policy.rules : [policy.rules];
    const allAllowed = rules.flatMap((rule) => {
      const allow = rule.allow ?? [];

      return Array.isArray(allow) ? allow : [allow];
    });

    expect(policy.sitemap).toBe("https://gravity.example/sitemap.xml");
    expect(allAllowed).toEqual(
      expect.arrayContaining([
        "/index.md",
        "/docs.md",
        "/compare.md",
        "/guides/a2ui-openai-gravity-ui.md",
        "/best-ai-ui-generator-for-agents",
        "/best-ai-ui-generator-for-agents.md",
        "/.well-known",
      ]),
    );
  });
});
