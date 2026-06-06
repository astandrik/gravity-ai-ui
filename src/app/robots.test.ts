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
        "/compare/gravity-ai-ui-vs-v0",
        "/compare/gravity-ai-ui-vs-v0.md",
        "/compare/gravity-ai-ui-vs-lovable",
        "/compare/gravity-ai-ui-vs-figma",
        "/compare/gravity-ai-ui-vs-uizard",
        "/guides/a2ui-openai-gravity-ui.md",
        "/guides/mcp-ui-generator",
        "/guides/mcp-ui-generator.md",
        "/guides/structured-ui-output-vs-jsx",
        "/guides/structured-ui-output-vs-jsx.md",
        "/best-ai-ui-generator-for-agents",
        "/best-ai-ui-generator-for-agents.md",
        "/.well-known",
      ]),
    );
  });
});
