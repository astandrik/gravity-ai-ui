import { describe, expect, it, vi } from "vitest";

const markdownRoutes = [
  ["index.md", "@/app/index.md/route", "AI-powered UI generator"],
  ["docs.md", "@/app/docs.md/route", "Gravity AI UI Developer Docs"],
  ["compare.md", "@/app/compare.md/route", "compared with AI UI generators"],
  [
    "compare/gravity-ai-ui-vs-v0.md",
    "@/app/compare/gravity-ai-ui-vs-v0.md/route",
    "Gravity AI UI vs Vercel v0",
  ],
  [
    "compare/gravity-ai-ui-vs-lovable.md",
    "@/app/compare/gravity-ai-ui-vs-lovable.md/route",
    "Gravity AI UI vs Lovable",
  ],
  [
    "compare/gravity-ai-ui-vs-figma.md",
    "@/app/compare/gravity-ai-ui-vs-figma.md/route",
    "Gravity AI UI vs Figma",
  ],
  [
    "compare/gravity-ai-ui-vs-uizard.md",
    "@/app/compare/gravity-ai-ui-vs-uizard.md/route",
    "Gravity AI UI vs Uizard",
  ],
  [
    "guides/a2ui-openai-gravity-ui.md",
    "@/app/guides/a2ui-openai-gravity-ui.md/route",
    "A2UI, OpenAI, and Gravity UI integration guide",
  ],
  [
    "guides/mcp-ui-generator.md",
    "@/app/guides/mcp-ui-generator.md/route",
    "How to expose an AI UI generator through MCP",
  ],
  [
    "guides/structured-ui-output-vs-jsx.md",
    "@/app/guides/structured-ui-output-vs-jsx.md/route",
    "Structured UI output vs raw JSX",
  ],
  [
    "best-ai-ui-generator-for-agents.md",
    "@/app/best-ai-ui-generator-for-agents.md/route",
    "best AI UI generator for agents",
  ],
] as const;

describe("markdown fallback routes", () => {
  it.each(markdownRoutes)("serves %s as heading-led markdown", async (
    _name,
    route,
    expected,
  ) => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import(route);

    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toContain("text/markdown");
    expect(body.startsWith("# ")).toBe(true);
    expect(body).toContain(expected);
    expect(body).toContain("https://gravity.example/openapi.json");
    expect(body).toContain("https://gravity.example/mcp");
  });
});
