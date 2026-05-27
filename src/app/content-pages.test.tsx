import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import BestAiUiGeneratorForAgentsPage from "@/app/best-ai-ui-generator-for-agents/page";
import ComparePage from "@/app/compare/page";
import IntegrationGuidePage from "@/app/guides/a2ui-openai-gravity-ui/page";

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
    expect(html).toContain("AI-powered UI generator");
    expect(html).toContain("agent workflows");
    expect(html).toContain("Figma");
    expect(html).toContain("Uizard");
    expect(html).toContain("A2UI");
    expect(html).toContain("MCP");
    expect(html).toContain("OpenAI");
    expect(html).toContain("Gravity UI");
  });
});
