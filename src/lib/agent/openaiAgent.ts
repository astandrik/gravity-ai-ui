import OpenAI from "openai";
import type { ResponseFunctionToolCall } from "openai/resources/responses/responses";
import {
  ALLOWED_A2UI_ACTIONS,
  A2UI_VERSION,
} from "./a2uiContract";
import { buildFixedInterfaceFromJson } from "./fixedInterface";
import type { BuiltFixedInterface } from "./fixedInterface";
import type { AgentRequest, AgentSseEvent } from "./protocol";

const RENDER_INTERFACE_TOOL_NAME = "render_agent_interface";
const DEFAULT_MODEL = "gpt-5.5";
const TOOL_NAMES = new Set([RENDER_INTERFACE_TOOL_NAME]);

type StreamAgentOptions = {
  request: AgentRequest;
  apiKey: string;
  signal?: AbortSignal;
  onEvent: (event: AgentSseEvent) => void | Promise<void>;
};

export async function streamAgentResponse({
  request,
  apiKey,
  signal,
  onEvent,
}: StreamAgentOptions) {
  const client = new OpenAI({ apiKey });
  const processedToolCalls = new Set<string>();
  let emittedMessages = 0;
  let streamingStatusSent = false;

  await onEvent({ type: "status", message: "Contacting OpenAI" });

  const stream = await client.responses.create(
    {
      model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
      input: buildInput(request),
      instructions: buildInstructions(),
      tools: [renderInterfaceTool],
      tool_choice: {
        type: "allowed_tools",
        mode: "required",
        tools: [{ type: "function", name: RENDER_INTERFACE_TOOL_NAME }],
      },
      parallel_tool_calls: false,
      stream: true,
      store: false,
      max_output_tokens: 8000,
      safety_identifier: safeIdentifier(request.conversationId),
      stream_options: { include_obfuscation: false },
    },
    { signal },
  );

  for await (const event of stream) {
    if (event.type === "response.created") {
      await onEvent({ type: "status", message: "Planning interface" });
      continue;
    }

    if (event.type === "response.function_call_arguments.delta") {
      if (!streamingStatusSent) {
        await onEvent({ type: "status", message: "Streaming interface" });
        streamingStatusSent = true;
      }

      continue;
    }

    if (event.type === "response.function_call_arguments.done") {
      const parsed = parseFunctionCallArguments({
        id: event.item_id,
        name: event.name,
        argumentsJson: event.arguments,
        processedToolCalls,
      });

      if (!parsed) {
        continue;
      }

      emittedMessages += await emitParsedToolCall(parsed, onEvent);
      continue;
    }

    if (event.type === "response.output_item.done") {
      const parsed = parseFunctionToolCallItem(event.item, processedToolCalls);

      if (!parsed) {
        continue;
      }

      emittedMessages += await emitParsedToolCall(parsed, onEvent);
      continue;
    }

    if (event.type === "response.completed") {
      for (const item of event.response.output) {
        const parsed = parseFunctionToolCallItem(item, processedToolCalls);

        if (parsed) {
          emittedMessages += await emitParsedToolCall(parsed, onEvent);
        }
      }
    }

    if (event.type === "response.failed") {
      await onEvent({
        type: "error",
        message: event.response.error?.message || "OpenAI response failed",
      });
    }
  }

  if (emittedMessages === 0) {
    await onEvent({
      type: "error",
      message: "The agent did not emit a valid A2UI message.",
    });
  }
}

export function parseFunctionToolCallItem(
  item: unknown,
  processedToolCalls = new Set<string>(),
) {
  if (!isResponseFunctionToolCall(item)) {
    return null;
  }

  return parseFunctionCallArguments({
    id: item.id || item.call_id,
    name: item.name,
    argumentsJson: item.arguments,
    processedToolCalls,
  });
}

export function parseFunctionCallArguments({
  argumentsJson,
  id,
  name,
  processedToolCalls,
}: {
  argumentsJson: string;
  id: string;
  name?: string;
  processedToolCalls: Set<string>;
}) {
  if (!name || !TOOL_NAMES.has(name) || processedToolCalls.has(id)) {
    return null;
  }

  try {
    const parsed = buildFixedInterfaceFromJson(argumentsJson);

    if (parsed) {
      processedToolCalls.add(id);
    }

    return parsed;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid A2UI";

    throw new Error(`Rejected generated interface data: ${message}`);
  }
}

function isResponseFunctionToolCall(
  item: unknown,
): item is ResponseFunctionToolCall {
  return (
    item !== null &&
    typeof item === "object" &&
    "type" in item &&
    item.type === "function_call" &&
    "name" in item &&
    typeof item.name === "string" &&
    "arguments" in item &&
    typeof item.arguments === "string" &&
    "call_id" in item &&
    typeof item.call_id === "string"
  );
}

function buildInput(request: AgentRequest) {
  if (request.kind === "prompt") {
    return [
      {
        role: "user" as const,
        content: [
          {
            type: "input_text" as const,
            text: `User request:\n${request.prompt}`,
          },
        ],
      },
    ];
  }

  return [
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: [
            "The user interacted with a rendered A2UI surface.",
            `Surface: ${request.surfaceId}`,
            `Action: ${JSON.stringify(request.action)}`,
            `Context: ${JSON.stringify(request.context ?? null)}`,
            `Data model: ${JSON.stringify(request.dataModel ?? null)}`,
            `Preferred surfaceId: ${request.surfaceId}`,
            "Respond by updating or replacing this fixed-schema interface.",
          ].join("\n"),
        },
      ],
    },
  ];
}

function buildInstructions() {
  return [
    "You are the interface planner for Gravity AI UI.",
    `Always respond only by calling ${RENDER_INTERFACE_TOOL_NAME} exactly once.`,
    "Do not generate A2UI JSON, component JSON, Markdown fences, HTML, or code.",
    `The server will convert your fixed-schema interface data into validated A2UI ${A2UI_VERSION} messages.`,
    'Use surfaceId "main" for a new user prompt unless the prompt names another valid surface.',
    "For action follow-ups, preserve the preferred surfaceId from the user message.",
    "Use sections for readable results, fields only when user input is needed, and actions only for clear next steps.",
    `Allowed action names: ${ALLOWED_A2UI_ACTIONS.join(", ")}.`,
    "Return empty arrays for sections, fields, or actions when they are not needed.",
    "Keep title, summary, labels, and section copy concise and product-interface focused.",
  ].join("\n");
}

async function emitParsedToolCall(
  parsed: BuiltFixedInterface,
  onEvent: (event: AgentSseEvent) => void | Promise<void>,
) {
  for (const message of parsed.messages) {
    await onEvent({ type: "a2ui", message });
  }

  return parsed.messages.length;
}

const renderInterfaceTool = {
  type: "function" as const,
  name: RENDER_INTERFACE_TOOL_NAME,
  strict: true,
  description:
    "Describe one fixed-schema Gravity interface. The server will render it as validated A2UI messages.",
  parameters: {
    type: "object",
    additionalProperties: false,
    properties: {
      sequence: {
        type: "integer",
        minimum: 0,
        description: "Zero-based order for this interface response.",
      },
      surfaceId: {
        type: "string",
        pattern: "^[A-Za-z][A-Za-z0-9_-]*$",
        description: 'Use "main" for initial prompts.',
      },
      title: {
        type: "string",
        maxLength: 240,
      },
      summary: {
        type: "string",
        maxLength: 1600,
      },
      tone: {
        type: "string",
        enum: ["normal", "info", "success", "warning", "danger"],
      },
      sections: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string", maxLength: 240 },
            body: { type: "string", maxLength: 1600 },
            items: {
              type: "array",
              maxItems: 8,
              items: { type: "string", maxLength: 240 },
            },
          },
          required: ["title", "body", "items"],
        },
      },
      fields: {
        type: "array",
        maxItems: 8,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              pattern: "^[A-Za-z][A-Za-z0-9_-]*$",
              maxLength: 48,
            },
            label: { type: "string", maxLength: 240 },
            type: {
              type: "string",
              enum: [
                "shortText",
                "number",
                "email",
                "tel",
                "url",
                "checkbox",
                "singleChoice",
                "multipleChoice",
              ],
            },
            placeholder: { type: ["string", "null"], maxLength: 240 },
            value: { type: ["string", "null"], maxLength: 500 },
            checked: { type: ["boolean", "null"] },
            options: {
              type: "array",
              maxItems: 10,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  label: { type: "string", maxLength: 240 },
                  value: { type: "string", minLength: 1, maxLength: 100 },
                },
                required: ["label", "value"],
              },
            },
            required: { type: "boolean" },
          },
          required: [
            "id",
            "label",
            "type",
            "placeholder",
            "value",
            "checked",
            "options",
            "required",
          ],
        },
      },
      actions: {
        type: "array",
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            label: { type: "string", maxLength: 240 },
            action: {
              type: "string",
              enum: ALLOWED_A2UI_ACTIONS,
            },
            variant: {
              type: "string",
              enum: ["primary", "normal", "outlined", "flat"],
            },
          },
          required: ["label", "action", "variant"],
        },
      },
    },
    required: [
      "sequence",
      "surfaceId",
      "title",
      "summary",
      "tone",
      "sections",
      "fields",
      "actions",
    ],
  },
};

function safeIdentifier(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 64);
}
