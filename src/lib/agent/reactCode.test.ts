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
  alerts: [
    {
      title: "Escalation window",
      message: "Notify the incident owner before changing severity.",
      tone: "warning",
    },
  ],
  metrics: [
    {
      label: "Signals",
      value: "14",
      description: "Open alerts",
      tone: "info",
      icon: "bell",
    },
  ],
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
      min: null,
      max: null,
      step: null,
      required: true,
    },
    {
      id: "notify",
      label: "Notify responders",
      type: "switch",
      placeholder: null,
      value: null,
      checked: true,
      options: [],
      min: null,
      max: null,
      step: null,
      required: false,
    },
    {
      id: "severity",
      label: "Severity",
      type: "select",
      placeholder: "Choose severity",
      value: "sev2",
      checked: null,
      options: [
        { label: "SEV-1", value: "sev1" },
        { label: "SEV-2", value: "sev2" },
      ],
      min: null,
      max: null,
      step: null,
      required: true,
    },
    {
      id: "confidence",
      label: "Confidence",
      type: "slider",
      placeholder: null,
      value: "70",
      checked: null,
      options: [],
      min: 0,
      max: 100,
      step: 5,
      required: false,
    },
  ],
  tables: [
    {
      title: "Owners",
      columns: [
        { id: "team", label: "Team", align: "start" },
        { id: "status", label: "Status", align: "end" },
      ],
      rows: [{ cells: ["Platform", "On call"] }],
      emptyMessage: "No owners",
    },
  ],
  progress: [
    {
      label: "Triage progress",
      value: 45,
      text: "45%",
      tone: "warning",
    },
  ],
  descriptions: [
    {
      title: "Incident details",
      items: [
        { label: "Region", value: "us-east" },
        { label: "Duration", value: "18 min" },
      ],
    },
  ],
  links: [
    {
      label: "Status page",
      href: "/status",
      description: "Customer-facing updates",
    },
  ],
  users: [
    {
      name: "Grace Hopper",
      description: "Incident commander",
      tone: "success",
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
    expect(code).toContain("Alert");
    expect(code).toContain("Button");
    expect(code).toContain("DefinitionList");
    expect(code).toContain("Progress");
    expect(code).toContain("Select");
    expect(code).toContain("Slider");
    expect(code).toContain("Switch");
    expect(code).toContain("Table");
    expect(code).toContain("User");
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
