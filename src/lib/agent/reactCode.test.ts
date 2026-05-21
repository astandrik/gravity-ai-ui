import * as ts from "typescript";
import { describe, expect, it } from "vitest";
import type { RenderInterfaceArguments } from "./fixedInterface";
import { buildReactCode } from "./reactCode";

const payload = {
  sequence: 0,
  surfaceId: "main",
  title: "Incident triage",
  titleIcon: "warning",
  summary: "Review severity and ownership.",
  tone: "warning",
  layout: {
    density: "comfortable",
    sectionDividers: "minimal",
  },
  sections: [
    {
      title: "Current incident",
      icon: "info",
      body: "Service impact is under review.",
      items: ["Status: Open", "Impact: Customer-facing degradation"],
    },
  ],
  fields: [
    {
      id: "owner",
      label: "Owner",
      type: "shortText",
      placeholder: "Primary owner",
      value: "",
      checked: null,
      options: [],
      required: true,
    },
  ],
  actions: [
    {
      label: "Confirm",
      icon: "check",
      action: "confirm",
      variant: "primary",
    },
  ],
  navigation: [
    {
      label: "Triage",
      icon: "list",
      action: "select",
      active: true,
    },
  ],
} satisfies RenderInterfaceArguments;

describe("React code generator", () => {
  it("builds copyable Gravity UI React code from a fixed payload", () => {
    const code = buildReactCode(payload);

    expect(code).toContain('"use client";');
    expect(code).toContain("export function IncidentTriage()");
    expect(code).toContain("TextInput");
    expect(code).toContain("Button");
    expect(code).toContain("ActionBar");
    expect(code).toContain("@gravity-ui/icons");
    expect(code).toContain("handleAction");
    expect(code).not.toContain("Dislike");
  });

  it("emits syntactically valid TSX", () => {
    const result = ts.transpileModule(buildReactCode(payload), {
      compilerOptions: {
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(result.diagnostics ?? []).toHaveLength(0);
  });
});
