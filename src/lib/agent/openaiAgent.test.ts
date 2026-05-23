import { afterEach, describe, expect, it } from "vitest";
import { GRAVITY_A2UI_CATALOG_ID } from "./a2uiContract";
import {
  buildComposedInterfaceFromPartialJson,
  buildProgressivePlaceholderInterface,
  buildProgressiveStatusUpdate,
  type ComposedInterfacePayload,
} from "./composedInterface";
import {
  buildInput,
  buildInstructions,
  COMPOSE_GRAVITY_INTERFACE_TOOL_NAME,
  createInitializedSurfaceIds,
  getMaxOutputTokens,
  getProgressiveStatusA2uiMessages,
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

const composedPayload = {
  sequence: 0,
  surfaceId: "main",
  dataModel: {
    title: "Deployment review",
    owner: "Ada",
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
      id: "summary",
      parentId: "root",
      order: 1,
      component: "Text",
      props: {
        text: "Review launch readiness before continuing.",
        color: "secondary",
      },
    },
    {
      id: "details",
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
      id: "owner",
      parentId: "details",
      order: 0,
      component: "Text",
      props: {
        text: { path: "/owner" },
      },
    },
    {
      id: "approve",
      parentId: "details",
      order: 1,
      component: "Button",
      props: {
        text: "Approve",
        variant: "primary",
        action: {
          event: {
            name: "confirm",
          },
        },
      },
    },
  ],
} satisfies ComposedInterfacePayload;

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
    expect(
      buildProgressiveStatusUpdate("main", "Composing interface"),
    ).toMatchObject({
      updateDataModel: {
        surfaceId: "main",
        path: "/status",
        value: "Composing interface",
      },
    });
  });

  it("does not create a new surface for action follow-up status", () => {
    const initializedSurfaceIds = createInitializedSurfaceIds({
      kind: "action",
      conversationId: "conversation_1",
      surfaceId: "main",
      action: {
        name: "submit",
        surfaceId: "main",
        sourceComponentId: "submit",
        timestamp: "2026-05-23T00:00:00.000Z",
        context: {},
      },
    });

    expect(initializedSurfaceIds.has("main")).toBe(true);
    expect(
      getProgressiveStatusA2uiMessages({
        createSurfaceIfMissing: false,
        initializedSurfaceIds,
        status: "Contacting OpenAI",
        surfaceId: "main",
      }),
    ).toEqual([]);
  });

  it("creates a progressive placeholder for prompt status", () => {
    const messages = getProgressiveStatusA2uiMessages({
      createSurfaceIfMissing: true,
      initializedSurfaceIds: new Set<string>(),
      status: "Contacting OpenAI",
      surfaceId: "main",
    });

    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createSurface: expect.objectContaining({
            surfaceId: "main",
          }),
        }),
      ]),
    );
  });

  it("builds renderable snapshots from partial composed argument JSON", () => {
    const parsed = buildComposedInterfaceFromPartialJson(
      [
        '{"sequence":0,"surfaceId":"main","dataModel":{"title":"Button styles"},',
        '"root":{"component":"Column","props":{"gap":"normal","align":"stretch"}},',
        '"nodes":[{"id":"title","parentId":"root","order":0,"component":"Text",',
        '"props":{"text":{"path":"/title"},"variant":"h2"}},',
        '{"id":"primary","parentId":"root","order":1,"component":"Button",',
        '"props":{"text":"Primary","variant":"primary","action":{"event":{"name":"noop"}}}}',
      ].join(""),
      "main",
    );

    expect(parsed).toMatchObject({
      payload: {
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: "title" }),
          expect.objectContaining({ id: "primary" }),
        ]),
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

  it("builds canonical A2UI messages from composed interface data", () => {
    expect(
      parseFunctionToolCallItem({
        type: "function_call",
        id: "item_compose",
        call_id: "call_compose",
        name: COMPOSE_GRAVITY_INTERFACE_TOOL_NAME,
        arguments: JSON.stringify(composedPayload),
      }),
    ).toMatchObject({
      sequence: 0,
      payload: {
        surfaceId: "main",
        nodes: expect.arrayContaining([
          expect.objectContaining({ id: "approve", component: "Button" }),
        ]),
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

  it("ignores the retired fixed-schema tool name", () => {
    expect(
      parseFunctionToolCallItem({
        type: "function_call",
        id: "item_render",
        call_id: "call_render",
        name: "render_agent_interface",
        arguments: JSON.stringify({}),
      }),
    ).toBeNull();
  });

  it("deduplicates repeated function output items", () => {
    const processedToolCalls = new Set<string>();
    const item = {
      type: "function_call",
      id: "item_1",
      call_id: "call_1",
      name: COMPOSE_GRAVITY_INTERFACE_TOOL_NAME,
      arguments: JSON.stringify(composedPayload),
    };

    expect(parseFunctionToolCallItem(item, processedToolCalls)).not.toBeNull();
    expect(parseFunctionToolCallItem(item, processedToolCalls)).toBeNull();
  });

  it("does not mark nameless function argument events as processed", () => {
    const processedToolCalls = new Set<string>();
    const argumentsJson = JSON.stringify(composedPayload);

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
          call_id: "call_compose",
          name: COMPOSE_GRAVITY_INTERFACE_TOOL_NAME,
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
            text: "Deployment review\nComponents: Text x2, Button x1",
            surfaceId: "main",
          },
        ],
        latestSurfaceId: "main",
        latestPayload: composedPayload,
        latestDataModel: {
          title: "Deployment review",
          owner: "Ada",
        },
      },
    });
    const text = input[0].content[0].text;

    expect(text).toContain("Previous conversation state follows");
    expect(text).toContain("Build a deployment review card");
    expect(text).toContain("Latest surfaceId: main");
    expect(text).toContain("Latest composed payload");
    expect(text).toContain("Current user request");
    expect(text).toContain("owner field");
  });

  it("does not inject liked design examples into prompt input", () => {
    const input = buildInput({
      kind: "prompt",
      conversationId: "conversation_1",
      prompt: "Build another review screen.",
    });
    const text = input[0].content[0].text;

    expect(text).not.toContain("Previously liked design");
    expect(text).not.toContain("Liked style hints");
    expect(text).toContain("Build another review screen.");
  });

  it("includes composition instructions without fixed page slots", () => {
    const instructions = buildInstructions();
    const guideIndex = instructions.indexOf("Component choice guide:");
    const technicalIndex = instructions.indexOf("Technical props/settings");

    expect(instructions).toContain(COMPOSE_GRAVITY_INTERFACE_TOOL_NAME);
    expect(instructions).toContain("Build a finished interface by composing");
    expect(instructions).toContain("Do not follow a fixed page template");
    expect(instructions).toContain("Only Column, Row, Card, and NavigationBar");
    expect(instructions).toContain("Use HeroBlock only when it is naturally");
    expect(instructions).toContain("Use buttons only for real actions");
    expect(instructions).toContain("Available components");
    expect(instructions).toContain("Curated A2UI node.props guide");
    expect(instructions).toContain("Column(justify?, align?, gap?)");
    expect(instructions).toContain("Row(justify?, align?, gap?)");
    expect(instructions).toContain(
      "Column, Row, Card, and NavigationBar do not accept title or subtitle props",
    );
    expect(instructions).toContain("Generated Gravity UI component catalog");
    expect(guideIndex).toBeGreaterThan(-1);
    expect(technicalIndex).toBeGreaterThan(-1);
    expect(guideIndex).toBeLessThan(technicalIndex);
    expect(instructions).not.toContain("layout.intent");
    expect(instructions).not.toContain("hero + filterBar");
    expect(instructions).not.toContain("liked design");
    expect(instructions).not.toContain("fixed-schema");
  });
});
