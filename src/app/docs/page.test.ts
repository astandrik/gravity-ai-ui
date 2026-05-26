import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import DocsPage from "./page";

vi.mock("@/components/GravityUI/GravityUI", () => ({
  Card({
    children,
  }: {
    children: ReactNode;
  }) {
    return createElement("div", null, children);
  },
  Container({
    children,
  }: {
    children: ReactNode;
  }) {
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

describe("DocsPage", () => {
  it("documents the public MCP connection details", () => {
    const html = renderToStaticMarkup(createElement(DocsPage));

    expect(html).toContain("Gravity AI UI Developer Docs");
    expect(html).toContain("OpenAPI spec");
    expect(html).toContain("OAuth");
    expect(html).toContain("MCP server");
    expect(html).toContain("webhooks");
    expect(html).toContain("Remote MCP");
    expect(html).toContain("https://gravity-ai.ydb-qdrant.tech/mcp");
    expect(html).toContain("https://gravity-ai.ydb-qdrant.tech/openapi.json");
    expect(html).toContain(
      "codex mcp add gravityAiUi --url https://gravity-ai.ydb-qdrant.tech/mcp",
    );
    expect(html).toContain("search_interfaces");
    expect(html).toContain("get_interface");
    expect(html).toContain("generate_interface");
    expect(html).toContain("refine_interface");
  });

  it("renders product-level Ask AI provider links", () => {
    const html = renderToStaticMarkup(createElement(DocsPage));

    expect(html).toContain("Ask AI about Gravity AI UI");
    expect(html).toContain("Open an AI assistant with a product evaluation prompt.");
    expect(html).toContain("Ask ChatGPT about Gravity AI UI");
    expect(html).toContain("https://chat.openai.com/?q=");
    expect(html).toContain("https://www.perplexity.ai/search/new?q=");
    expect(html).toContain("https://claude.ai/new?q=");
    expect(html).toContain("https://www.google.com/search?udm=50&amp;aep=11&amp;q=");
    expect(html).toContain("https://grok.com/?q=");
  });
});
