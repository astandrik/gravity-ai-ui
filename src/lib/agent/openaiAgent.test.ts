import { afterEach, describe, expect, it } from "vitest";
import { GRAVITY_A2UI_CATALOG_ID } from "./a2uiContract";
import {
  buildFixedInterfaceFromPartialJson,
  buildProgressivePlaceholderInterface,
  buildProgressiveStatusUpdate,
  type RenderInterfaceArguments,
} from "./fixedInterface";
import {
  buildInput,
  buildInstructions,
  getMaxOutputTokens,
  getReasoningEffort,
  parseFunctionCallArguments,
  parseFunctionToolCallItem,
} from "./openaiAgent";

const originalOpenAIReasoningEffort = process.env.OPENAI_REASONING_EFFORT;
const originalOpenAIMaxOutputTokens = process.env.OPENAI_MAX_OUTPUT_TOKENS;

afterEach(() => {
  if (originalOpenAIReasoningEffort === undefined) {
    delete process.env.OPENAI_REASONING_EFFORT;
  } else {
    process.env.OPENAI_REASONING_EFFORT = originalOpenAIReasoningEffort;
  }

  if (originalOpenAIMaxOutputTokens === undefined) {
    delete process.env.OPENAI_MAX_OUTPUT_TOKENS;
    return;
  }

  process.env.OPENAI_MAX_OUTPUT_TOKENS = originalOpenAIMaxOutputTokens;
});

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
  labels: [
    {
      label: "Window",
      value: "Today",
      tone: "info",
      type: "default",
    },
  ],
  tabs: [
    {
      title: "Views",
      size: "m",
      items: [
        {
          label: "Summary",
          value: "summary",
          body: "Readiness summary for the current deploy.",
          counter: null,
          tone: "normal",
          active: true,
        },
        {
          label: "Risks",
          value: "risks",
          body: "Production approval is still pending.",
          counter: "1",
          tone: "warning",
          active: false,
        },
      ],
    },
  ],
  emptyStates: [
    {
      title: "No blockers",
      description: "Blocking checks will appear here.",
      icon: "check",
      tone: "success",
      size: "m",
    },
  ],
  loadingStates: [
    {
      label: "Checking deploy health",
      description: "Waiting for the latest probe result.",
      size: "s",
    },
  ],
  breadcrumbs: [
    {
      title: "Location",
      showRoot: true,
      items: [
        { label: "Deployments", href: "/deployments" },
        { label: "Production", href: "/deployments/production" },
        { label: "Review", href: null },
      ],
    },
  ],
  steppers: [
    {
      title: "Deploy flow",
      size: "m",
      items: [
        {
          label: "Plan",
          value: "plan",
          view: "success",
          disabled: false,
          active: false,
        },
        {
          label: "Review",
          value: "review",
          view: "idle",
          disabled: false,
          active: true,
        },
      ],
    },
  ],
  accordions: [
    {
      title: "Details",
      size: "m",
      view: "solid",
      arrowPosition: "end",
      items: [
        {
          title: "Rollback plan",
          body: "Restore the previous release if health checks fail.",
          expanded: true,
          disabled: false,
        },
      ],
    },
  ],
  copyLists: [
    {
      title: "Commands",
      items: [
        {
          label: "Deploy",
          value: "npm run build",
          copyText: "npm run build",
        },
      ],
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
  it("disables reasoning by default", () => {
    delete process.env.OPENAI_REASONING_EFFORT;

    expect(getReasoningEffort()).toBe("none");
  });

  it("allows reasoning effort to be configured", () => {
    process.env.OPENAI_REASONING_EFFORT = "low";

    expect(getReasoningEffort()).toBe("low");
  });

  it("falls back to disabled reasoning for unsupported values", () => {
    process.env.OPENAI_REASONING_EFFORT = "minimal";

    expect(getReasoningEffort()).toBe("none");
  });

  it("uses a bounded max output token budget", () => {
    delete process.env.OPENAI_MAX_OUTPUT_TOKENS;
    expect(getMaxOutputTokens()).toBe(24_000);

    process.env.OPENAI_MAX_OUTPUT_TOKENS = "32000";
    expect(getMaxOutputTokens()).toBe(32_000);

    process.env.OPENAI_MAX_OUTPUT_TOKENS = "1000000";
    expect(getMaxOutputTokens()).toBe(64_000);

    process.env.OPENAI_MAX_OUTPUT_TOKENS = "100";
    expect(getMaxOutputTokens()).toBe(4_000);
  });

  it("builds a progressive placeholder surface before final tool output", () => {
    const messages = buildProgressivePlaceholderInterface({
      surfaceId: "main",
      status: "Contacting OpenAI",
    });

    expect(messages).toHaveLength(3);
    expect(messages[0]).toMatchObject({
      createSurface: {
        surfaceId: "main",
        catalogId: GRAVITY_A2UI_CATALOG_ID,
      },
    });
    expect(messages[1]).toMatchObject({
      updateComponents: {
        surfaceId: "main",
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "status_button",
            component: "Button",
            loading: true,
          }),
          expect.objectContaining({
            id: "status_text",
            component: "Text",
            text: { path: "/status" },
          }),
        ]),
      },
    });
    expect(messages[2]).toMatchObject({
      updateDataModel: {
        surfaceId: "main",
        path: "/",
        value: expect.objectContaining({
          status: "Contacting OpenAI",
        }),
      },
    });
  });

  it("builds progressive status updates for an existing placeholder surface", () => {
    expect(buildProgressiveStatusUpdate("main", "Composing interface")).toMatchObject({
      updateDataModel: {
        surfaceId: "main",
        path: "/status",
        value: "Composing interface",
      },
    });
  });

  it("builds renderable snapshots from partial function argument JSON", () => {
    const parsed = buildFixedInterfaceFromPartialJson(
      [
        '{"sequence":0,"surfaceId":"main","title":"Button styles",',
        '"titleIcon":null,"summary":"Available button variants.",',
        '"tone":"info","layout":{"density":"comfortable","sectionDividers":"minimal"},',
        '"alerts":[],"metrics":[],"sections":[],"fields":[],"tables":[],',
        '"progress":[],"descriptions":[],"links":[],"users":[],',
        '"actions":[{"label":"Primary","icon":null,"action":"noop",',
        '"variant":"primary","disabled":false,"loading":false,"selected":false}]',
      ].join(""),
      "main",
    );

    expect(parsed).toMatchObject({
      payload: {
        title: "Button styles",
        actions: [
          expect.objectContaining({
            label: "Primary",
            variant: "primary",
          }),
        ],
      },
      messages: expect.arrayContaining([
        expect.objectContaining({
          updateComponents: expect.objectContaining({
            surfaceId: "main",
          }),
        }),
      ]),
    });
  });

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
            id: "labels",
            component: "LabelGroup",
          }),
          expect.objectContaining({
            id: "tabs_0",
            component: "TabsBlock",
          }),
          expect.objectContaining({
            id: "empty_states",
            component: "EmptyStateList",
          }),
          expect.objectContaining({
            id: "loading_states",
            component: "LoadingStateList",
          }),
          expect.objectContaining({
            id: "breadcrumbs_0",
            component: "BreadcrumbTrail",
          }),
          expect.objectContaining({
            id: "stepper_0",
            component: "StepperBlock",
          }),
          expect.objectContaining({
            id: "accordion_0",
            component: "AccordionBlock",
          }),
          expect.objectContaining({
            id: "copy_list_0",
            component: "CopyList",
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
    const actionVariants = [
      "primary",
      "normal",
      "outlined",
      "outlined-warning",
      "flat-danger",
      "raised",
      "flat-action",
      "normal-contrast",
    ] as const;
    const actions = actionVariants.map((variant, actionIndex) => ({
      label: `Action ${actionIndex + 1}`,
      icon: "arrowRight" as const,
      action: "next" as const,
      variant,
      disabled: actionIndex === 3,
      loading: actionIndex === 4,
      selected: actionIndex === 5,
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
          expect.objectContaining({
            id: "action_3",
            component: "Button",
            variant: "outlined-warning",
            disabled: true,
          }),
          expect.objectContaining({
            id: "action_4",
            component: "Button",
            variant: "flat-danger",
            loading: true,
          }),
          expect.objectContaining({
            id: "action_5",
            component: "Button",
            variant: "raised",
            selected: true,
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
    const guideIndex = instructions.indexOf("Component choice guide:");
    const technicalIndex = instructions.indexOf("Technical props/settings");

    expect(instructions).toContain("Follow these design rules");
    expect(instructions).toContain("Use one clear primary task per surface");
    expect(instructions).toContain("Use at most one primary action");
    expect(instructions).toContain("Do not rely on color alone");
    expect(instructions).toContain("layout.density");
    expect(instructions).toContain("Render progressively");
    expect(instructions).toContain("2 to 4 snapshots");
    expect(instructions).toContain("Allowed icons");
    expect(instructions).toContain("Available Gravity component capabilities");
    expect(instructions).toContain("labels for compact tags/status chips");
    expect(instructions).toContain("breadcrumbs for hierarchy paths");
    expect(instructions).toContain("steppers for multi-step flows");
    expect(instructions).toContain("tabs for alternate views");
    expect(instructions).toContain("accordions for expandable detail groups");
    expect(instructions).toContain("emptyStates for no-data states");
    expect(instructions).toContain("copyLists for copyable commands or IDs");
    expect(instructions).toContain("Generated Gravity UI component catalog");
    expect(guideIndex).toBeGreaterThan(-1);
    expect(technicalIndex).toBeGreaterThan(-1);
    expect(guideIndex).toBeLessThan(technicalIndex);
    expect(instructions).toContain("Button: Buttons act as a trigger");
    expect(instructions).toContain("Button(");
    expect(instructions).toContain("Text(");
    expect(instructions).toContain("outlined-warning");
    expect(instructions).toContain("loading");
    expect(instructions).toContain("render the actual available controls");
    expect(instructions).toContain("button or button-variant showcases");
    expect(instructions).toContain("Do not represent controls as bullet lists");
  });
});
