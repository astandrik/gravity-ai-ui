import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import BestAiUiGeneratorForAgentsPage from "@/app/best-ai-ui-generator-for-agents/page";
import ComparePage from "@/app/compare/page";
import FigmaComparisonPage from "@/app/compare/gravity-ai-ui-vs-figma/page";
import LovableComparisonPage from "@/app/compare/gravity-ai-ui-vs-lovable/page";
import UizardComparisonPage from "@/app/compare/gravity-ai-ui-vs-uizard/page";
import V0ComparisonPage from "@/app/compare/gravity-ai-ui-vs-v0/page";
import IntegrationGuidePage from "@/app/guides/a2ui-openai-gravity-ui/page";
import McpUiGeneratorGuidePage from "@/app/guides/mcp-ui-generator/page";
import StructuredUiOutputGuidePage from "@/app/guides/structured-ui-output-vs-jsx/page";

vi.mock("@/components/GravityUI/GravityUI", () => ({
  Container({ children }: { children: ReactNode }) {
    return createElement("div", null, children);
  },
  Text({
    as = "span",
    children,
    ...props
  }: {
    as?: string;
    children: ReactNode;
  }) {
    return createElement(as, props, children);
  },
}));

describe("agent-readiness content pages", () => {
  it("renders comparison content for AI UI generator positioning", () => {
    const html = renderToStaticMarkup(createElement(ComparePage));

    expect(html).toContain("Gravity AI UI compared with AI UI generators");
    expect(html).toContain("Vercel v0");
    expect(html).toContain("Lovable");
    expect(html).toContain("Figma");
    expect(html).toContain("Uizard");
    expect(html).toContain("AI-powered UI generator");
    expect(html).toContain("A2UI");
    expect(html).toContain("MCP");
  });

  it("renders an A2UI, OpenAI, and Gravity UI integration guide", () => {
    const html = renderToStaticMarkup(createElement(IntegrationGuidePage));

    expect(html).toContain("A2UI, OpenAI, and Gravity UI integration guide");
    expect(html).toContain("compose_gravity_interface");
    expect(html).toContain("Streamable HTTP MCP");
    expect(html).toContain("trusted Gravity UI components");
  });

  it("renders best AI UI generator content for agent workflows", () => {
    const html = renderToStaticMarkup(
      createElement(BestAiUiGeneratorForAgentsPage),
    );

    expect(html).toContain("Best AI UI generator for agents");
    expect(html).toContain("Last reviewed");
    expect(html).toContain("Agent-readable output");
    expect(html).toContain("React export");
    expect(html).toContain("Vercel v0");
    expect(html).toContain("Lovable");
    expect(html).toContain("AI-powered UI generator");
    expect(html).toContain("agent workflows");
    expect(html).toContain("Figma");
    expect(html).toContain("Uizard");
    expect(html).toContain("A2UI");
    expect(html).toContain("MCP");
    expect(html).toContain("OpenAI");
    expect(html).toContain("Gravity UI");
    expect(html).toContain("/openapi.json");
    expect(html).toContain("/llms.txt");
  });

  it.each([
    ["Vercel v0", V0ComparisonPage],
    ["Lovable", LovableComparisonPage],
    ["Figma", FigmaComparisonPage],
    ["Uizard", UizardComparisonPage],
  ])("renders a focused comparison against %s", (competitor, Page) => {
    const html = renderToStaticMarkup(createElement(Page));

    expect(html).toContain("Gravity AI UI");
    expect(html).toContain(competitor);
    expect(html).toContain("MCP");
    expect(html).toContain("A2UI");
    expect(html).toContain("OpenAPI");
    expect(html).toContain("React export");
    expect(html).toContain("When to choose Gravity AI UI");
    expect(html).toContain("What agents can reuse");
  });

  it("renders an MCP UI generator guide", () => {
    const html = renderToStaticMarkup(createElement(McpUiGeneratorGuidePage));

    expect(html).toContain("How to expose an AI UI generator through MCP");
    expect(html).toContain("Gravity AI UI");
    expect(html).toContain("MCP");
    expect(html).toContain("A2UI");
    expect(html).toContain("OpenAPI");
    expect(html).toContain("React export");
  });

  it("renders a structured UI output guide", () => {
    const html = renderToStaticMarkup(createElement(StructuredUiOutputGuidePage));

    expect(html).toContain("Structured UI output vs raw JSX");
    expect(html).toContain("Gravity AI UI");
    expect(html).toContain("A2UI");
    expect(html).toContain("MCP");
    expect(html).toContain("React export");
    expect(html).toContain("raw JSX");
  });
});
