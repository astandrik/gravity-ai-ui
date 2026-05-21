import { describe, expect, it } from "vitest";
import { GRAVITY_A2UI_CATALOG_ID } from "./a2uiContract";
import type { RenderInterfaceArguments } from "./fixedInterface";
import {
  buildInput,
  buildInstructions,
  parseFunctionCallArguments,
  parseFunctionToolCallItem,
} from "./openaiAgent";

const interfaceArgs = {
  sequence: 0,
  surfaceId: "main",
  title: "Deployment review",
  titleIcon: "rocket",
  summary: "Review the generated checklist before continuing.",
  tone: "info",
  layout: {
    density: "comfortable",
    sectionDividers: "minimal",
  },
  alerts: [
    {
      title: "Risk noted",
      message: "Production deploy requires an approver.",
      tone: "warning",
    },
  ],
  metrics: [
    {
      label: "Readiness",
      value: "82%",
      description: "Automated checks completed",
      tone: "success",
      icon: "check",
    },
  ],
  sections: [
    {
      title: "Checklist",
      icon: "list",
      body: "The shell will render this from fixed interface data.",
      items: ["Validate config", "Run checks"],
    },
  ],
  fields: [
    {
      id: "approver",
      label: "Approver",
      type: "shortText",
      placeholder: "Name",
      value: "",
      checked: null,
      options: [],
      min: null,
      max: null,
      step: null,
      required: true,
    },
  ],
  tables: [
    {
      title: "Open checks",
      columns: [
        { id: "name", label: "Check", align: "start" },
        { id: "status", label: "Status", align: "end" },
      ],
      rows: [
        { cells: ["Config", "Ready"] },
        { cells: ["Rollback", "Pending"] },
      ],
      emptyMessage: "No checks",
    },
  ],
  progress: [
    {
      label: "Deployment preparation",
      value: 65,
      text: "65%",
      tone: "info",
    },
  ],
  descriptions: [
    {
      title: "Metadata",
      items: [
        { label: "Environment", value: "Production" },
        { label: "Window", value: "Today" },
      ],
    },
  ],
  links: [
    {
      label: "Runbook",
      href: "/runbook",
      description: "Operational steps",
    },
  ],
  users: [
    {
      name: "Ada Lovelace",
      description: "Primary approver",
      tone: "info",
    },
  ],
  actions: [
    {
      label: "Continue",
      icon: "arrowRight",
      action: "next",
      variant: "primary",
    },
  ],
  navigation: [
    {
      label: "Overview",
      icon: "home",
      action: "select",
      active: true,
    },
  ],
} satisfies RenderInterfaceArguments;

describe("OpenAI agent stream parsing", () => {
  it("builds canonical A2UI messages from fixed interface data", () => {
    expect(
      parseFunctionToolCallItem({
        type: "function_call",
        id: "item_render",
        call_id: "call_render",
        name: "render_agent_interface",
        arguments: JSON.stringify(interfaceArgs),
      }),
    ).toMatchObject({
      sequence: 0,
      payload: {
        surfaceId: "main",
        title: "Deployment review",
      },
      messages: [
        {
          version: "v0.9",
          createSurface: {
            surfaceId: "main",
            catalogId: GRAVITY_A2UI_CATALOG_ID,
            sendDataModel: true,
          },
        },
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "main",
          },
        },
        {
          version: "v0.9",
          updateDataModel: {
            surfaceId: "main",
            path: "/",
          },
        },
      ],
    });
  });

  it("keeps the generated component tree valid and rooted", () => {
    const parsed = parseFunctionToolCallItem({
      type: "function_call",
      id: "item_render",
      call_id: "call_render",
      name: "render_agent_interface",
      arguments: JSON.stringify(interfaceArgs),
    });

    expect(parsed?.messages[1]).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "root",
            component: "Column",
          }),
          expect.objectContaining({
            id: "field_approver",
            component: "TextField",
          }),
          expect.objectContaining({
            id: "action_0",
            component: "Button",
          }),
          expect.objectContaining({
            id: "metrics",
            component: "MetricGrid",
          }),
          expect.objectContaining({
            id: "table_0",
            component: "DataTable",
          }),
        ]),
      },
    });
  });

  it("accepts the largest fixed-schema surface the builder can create", () => {
    const sections = Array.from({ length: 6 }, (_, sectionIndex) => ({
      title: `Section ${sectionIndex + 1}`,
      icon: "info" as const,
      body: `Body ${sectionIndex + 1}`,
      items: Array.from(
        { length: 8 },
        (_, itemIndex) => `Item ${sectionIndex + 1}.${itemIndex + 1}`,
      ),
    }));
    const fields = Array.from({ length: 8 }, (_, fieldIndex) => ({
      id: `field_${fieldIndex + 1}`,
      label: `Field ${fieldIndex + 1}`,
      type: "shortText" as const,
      placeholder: null,
      value: "",
      checked: null,
      options: [],
      min: null,
      max: null,
      step: null,
      required: false,
    }));
    const actions = Array.from({ length: 4 }, (_, actionIndex) => ({
      label: `Action ${actionIndex + 1}`,
      icon: "arrowRight" as const,
      action: "next" as const,
      variant: actionIndex === 0 ? ("primary" as const) : ("normal" as const),
    }));
    const navigation = Array.from({ length: 8 }, (_, itemIndex) => ({
      label: `Nav ${itemIndex + 1}`,
      icon: "list" as const,
      action: "select" as const,
      active: itemIndex === 0,
    }));
    const parsed = parseFunctionToolCallItem({
      type: "function_call",
      id: "item_large_render",
      call_id: "call_large_render",
      name: "render_agent_interface",
      arguments: JSON.stringify({
        ...interfaceArgs,
        layout: {
          density: "comfortable",
          sectionDividers: "betweenSections",
        },
        sections,
        fields,
        actions,
        navigation,
      } satisfies RenderInterfaceArguments),
    });

    const updateComponents = parsed?.messages.find(
      (message) => "updateComponents" in message,
    );

    expect(updateComponents).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "content",
            component: "Column",
          }),
        ]),
      },
    });
  });

  it("deduplicates repeated function output items", () => {
    const processedToolCalls = new Set<string>();
    const item = {
      type: "function_call",
      id: "item_1",
      call_id: "call_1",
      name: "render_agent_interface",
      arguments: JSON.stringify(interfaceArgs),
    };

    expect(parseFunctionToolCallItem(item, processedToolCalls)).not.toBeNull();
    expect(parseFunctionToolCallItem(item, processedToolCalls)).toBeNull();
  });

  it("does not mark nameless function argument events as processed", () => {
    const processedToolCalls = new Set<string>();
    const argumentsJson = JSON.stringify(interfaceArgs);

    expect(
      parseFunctionCallArguments({
        id: "item_without_name",
        argumentsJson,
        processedToolCalls,
      }),
    ).toBeNull();
    expect(processedToolCalls.has("item_without_name")).toBe(false);

    expect(
      parseFunctionToolCallItem(
        {
          type: "function_call",
          id: "item_without_name",
          call_id: "call_render",
          name: "render_agent_interface",
          arguments: argumentsJson,
        },
        processedToolCalls,
      ),
    ).toMatchObject({
      sequence: 0,
      messages: expect.arrayContaining([
        expect.objectContaining({
          version: "v0.9",
          createSurface: {
            surfaceId: "main",
            catalogId: GRAVITY_A2UI_CATALOG_ID,
            sendDataModel: true,
          },
        }),
      ]),
    });
  });

  it("includes compact conversation context in prompt input", () => {
    const input = buildInput({
      kind: "prompt",
      conversationId: "conversation_1",
      prompt: "Keep the same structure but add an owner field.",
      conversationContext: {
        history: [
          {
            role: "user",
            text: "Build a deployment review card",
          },
          {
            role: "assistant",
            text: "Deployment review\nReview the generated checklist.",
            surfaceId: "main",
          },
        ],
        latestSurfaceId: "main",
        latestPayload: interfaceArgs,
        latestDataModel: {
          title: "Deployment review",
          fields: {
            approver: "",
          },
        },
      },
    });
    const text = input[0].content[0].text;

    expect(text).toContain("Previous conversation state follows");
    expect(text).toContain("Build a deployment review card");
    expect(text).toContain("Latest surfaceId: main");
    expect(text).toContain("Current user request");
    expect(text).toContain("owner field");
  });

  it("includes liked design examples in prompt input", () => {
    const input = buildInput(
      {
        kind: "prompt",
        conversationId: "conversation_1",
        prompt: "Build another review screen.",
      },
      [
        {
          title: "Deployment review",
          summary: "Review the generated checklist before continuing.",
          prompt: "Create a deployment review card.",
          payload: interfaceArgs,
        },
      ],
    );
    const text = input[0].content[0].text;

    expect(text).toContain("Previously liked design examples");
    expect(text).toContain("Deployment review");
    expect(text).toContain('"density":"comfortable"');
  });

  it("includes compact design rules in agent instructions", () => {
    const instructions = buildInstructions();

    expect(instructions).toContain("Follow these design rules");
    expect(instructions).toContain("Use one clear primary task per surface");
    expect(instructions).toContain("Use at most one primary action");
    expect(instructions).toContain("Do not rely on color alone");
    expect(instructions).toContain("layout.density");
    expect(instructions).toContain("Allowed icons");
    expect(instructions).toContain("render the actual available controls");
    expect(instructions).toContain("button or button-variant showcases");
    expect(instructions).toContain("Do not represent controls as bullet lists");
  });
});
