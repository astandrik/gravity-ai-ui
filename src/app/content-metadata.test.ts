import { describe, expect, it, vi } from "vitest";
import { SITE_NAME } from "@/lib/site";

vi.mock("@/components/GravityUI/GravityUI", () => ({
  Container() {
    return null;
  },
  Text() {
    return null;
  },
}));

const metadataRoutes = [
  [
    "best AI UI guide",
    "@/app/best-ai-ui-generator-for-agents/page",
    "/best-ai-ui-generator-for-agents",
  ],
  ["compare hub", "@/app/compare/page", "/compare"],
  [
    "v0 comparison",
    "@/app/compare/gravity-ai-ui-vs-v0/page",
    "/compare/gravity-ai-ui-vs-v0",
  ],
  [
    "Lovable comparison",
    "@/app/compare/gravity-ai-ui-vs-lovable/page",
    "/compare/gravity-ai-ui-vs-lovable",
  ],
  [
    "Figma comparison",
    "@/app/compare/gravity-ai-ui-vs-figma/page",
    "/compare/gravity-ai-ui-vs-figma",
  ],
  [
    "Uizard comparison",
    "@/app/compare/gravity-ai-ui-vs-uizard/page",
    "/compare/gravity-ai-ui-vs-uizard",
  ],
  [
    "A2UI integration guide",
    "@/app/guides/a2ui-openai-gravity-ui/page",
    "/guides/a2ui-openai-gravity-ui",
  ],
  [
    "MCP UI generator guide",
    "@/app/guides/mcp-ui-generator/page",
    "/guides/mcp-ui-generator",
  ],
  [
    "structured UI output guide",
    "@/app/guides/structured-ui-output-vs-jsx/page",
    "/guides/structured-ui-output-vs-jsx",
  ],
] as const;

const titledMetadataRoutes = [
  ["about", "@/app/about/page", "About"],
  ["docs", "@/app/docs/page", "Developer Docs"],
  [
    "best AI UI guide",
    "@/app/best-ai-ui-generator-for-agents/page",
    "Best AI UI Generator for Agents",
  ],
  ["compare hub", "@/app/compare/page", "Compare AI UI Generators"],
  [
    "v0 comparison",
    "@/app/compare/gravity-ai-ui-vs-v0/page",
    "Gravity AI UI vs Vercel v0",
  ],
  [
    "Lovable comparison",
    "@/app/compare/gravity-ai-ui-vs-lovable/page",
    "Gravity AI UI vs Lovable",
  ],
  [
    "Figma comparison",
    "@/app/compare/gravity-ai-ui-vs-figma/page",
    "Gravity AI UI vs Figma",
  ],
  [
    "Uizard comparison",
    "@/app/compare/gravity-ai-ui-vs-uizard/page",
    "Gravity AI UI vs Uizard",
  ],
  [
    "A2UI integration guide",
    "@/app/guides/a2ui-openai-gravity-ui/page",
    "A2UI, OpenAI, and Gravity UI Integration Guide",
  ],
  [
    "MCP UI generator guide",
    "@/app/guides/mcp-ui-generator/page",
    "How to expose an AI UI generator through MCP",
  ],
  [
    "structured UI output guide",
    "@/app/guides/structured-ui-output-vs-jsx/page",
    "Structured UI output vs raw JSX",
  ],
] as const;

describe("content page metadata", () => {
  it.each(metadataRoutes)("sets page-specific canonical for %s", async (
    _name,
    route,
    canonical,
  ) => {
    vi.stubEnv("NEXT_PUBLIC_BASE_PATH", "");
    vi.resetModules();

    const pageModule = await import(route);

    expect(pageModule.metadata.alternates?.canonical).toBe(canonical);
  });

  it.each(titledMetadataRoutes)(
    "sets unsuffixed page title for %s",
    async (_name, route, title) => {
      vi.resetModules();

      const pageModule = await import(route);

      expect(pageModule.metadata.title).toBe(title);
      expect(pageModule.metadata.title).not.toBe(`${title} - ${SITE_NAME}`);
    },
  );
});
