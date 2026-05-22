import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import type { ComposedInterfacePayload } from "./composedInterface";
import { buildReactCode } from "./reactCode";

const payload = {
  sequence: 0,
  surfaceId: "main",
  dataModel: {
    title: "Seller catalog",
    query: "",
  },
  root: {
    component: "Column",
    props: {
      align: "stretch",
      gap: "normal",
    },
  },
  nodes: [
    {
      id: "title",
      parentId: "root",
      order: 0,
      component: "Text",
      props: {
        text: { path: "/title" },
        variant: "h2",
      },
    },
    {
      id: "filters",
      parentId: "root",
      order: 1,
      component: "FilterBar",
      props: {
        title: "Products",
        searchPlaceholder: "Search products",
        searchValue: { path: "/query" },
        filters: [
          { label: "In stock", value: "stock", active: true },
          { label: "Custom", value: "custom", active: false },
        ],
        sortLabel: "Sort",
        sortValue: "popular",
        sortOptions: [
          { label: "Popular", value: "popular" },
          { label: "Price", value: "price" },
        ],
      },
    },
    {
      id: "summary_card",
      parentId: "root",
      order: 2,
      component: "Card",
      props: {
        theme: "normal",
        view: "filled",
        padding: "comfortable",
      },
    },
    {
      id: "summary_text",
      parentId: "summary_card",
      order: 0,
      component: "Text",
      props: {
        text: "Three products are ready to ship today.",
        color: "secondary",
      },
    },
    {
      id: "owner_field",
      parentId: "summary_card",
      order: 1,
      component: "TextField",
      props: {
        label: "Seller note",
        placeholder: "Internal note",
        value: "",
      },
    },
    {
      id: "products",
      parentId: "root",
      order: 3,
      component: "CardGrid",
      props: {
        title: "Ready to buy",
        description: "Concrete products with price and availability.",
        variant: "product",
        columns: "three",
        items: [
          {
            title: "Linen tote",
            subtitle: "Handmade bag",
            body: "Natural linen tote with reinforced handles.",
            imageLabel: "LT",
            value: "$48",
            meta: "Ships today",
            tone: "success",
            labels: [
              {
                label: "In stock",
                value: null,
                tone: "success",
                type: "default",
              },
            ],
            actions: [
              {
                label: "Buy",
                icon: "refresh",
                action: { event: { name: "confirm" } },
                variant: "primary",
              },
            ],
          },
        ],
      },
    },
    {
      id: "orders",
      parentId: "root",
      order: 4,
      component: "DataTable",
      props: {
        title: "Recent orders",
        columns: [
          { id: "product", label: "Product", align: "start" },
          { id: "status", label: "Status", align: "end" },
        ],
        rows: [{ cells: ["Linen tote", "Ready"] }],
        emptyMessage: "No orders",
      },
    },
  ],
} satisfies ComposedInterfacePayload;

describe("React code generator", () => {
  it("builds copyable Gravity UI React code from a composed tree", () => {
    const code = buildReactCode(payload);

    expect(code).toContain('"use client";');
    expect(code).toContain("export function SellerCatalog()");
    expect(code).toContain("CardGrid");
    expect(code).toContain("DataTable");
    expect(code).toContain("TextInput");
    expect(code).toContain("Button");
    expect(code).toContain("Ready to buy");
    expect(code).toContain("Linen tote");
    expect(code).toContain("handleAction");
    expect(code).toContain("@gravity-ui/icons");
    expect(code).toContain("ArrowRotateRight as RefreshIcon");
    expect(code).toContain('"refresh": RefreshIcon');
    expect(code).not.toContain("Dislike");
  });

  it("emits syntactically valid TSX", () => {
    const code = buildReactCode(payload);
    const sourceFile = ts.createSourceFile(
      "generated.tsx",
      code,
      ts.ScriptTarget.ES2022,
      true,
      ts.ScriptKind.TSX,
    );
    const result = ts.transpileModule(code, {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(
      (result.diagnostics ?? []).map((diagnostic) => {
        const position =
          diagnostic.start === undefined
            ? null
            : ts.getLineAndCharacterOfPosition(sourceFile, diagnostic.start);

        return `${ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          "\n",
        )}${position ? ` at ${position.line + 1}:${position.character + 1}` : ""}`;
      }),
    ).toEqual([]);
  });
});
