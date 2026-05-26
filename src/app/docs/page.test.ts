import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import DocsPage from "./page";

vi.mock("@/components/GravityUI/GravityUI", () => ({
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

    expect(html).toContain("Remote MCP");
    expect(html).toContain("https://gravity-ai.ydb-qdrant.tech/mcp");
    expect(html).toContain(
      "codex mcp add gravityAiUi --url https://gravity-ai.ydb-qdrant.tech/mcp",
    );
    expect(html).toContain("search_interfaces");
    expect(html).toContain("get_interface");
    expect(html).toContain("generate_interface");
    expect(html).toContain("refine_interface");
  });
});
