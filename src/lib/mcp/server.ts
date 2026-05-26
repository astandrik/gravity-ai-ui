import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod/v4";
import { streamAgentResponse } from "@/lib/agent/openaiAgent";
import type { ComposedInterfacePayload } from "@/lib/agent/composedInterface";
import { composedInterfaceArgumentsSchema } from "@/lib/agent/composedInterface";
import type { AgentRequest } from "@/lib/agent/protocol";
import { buildReactCode } from "@/lib/agent/reactCode";
import { toPublicUrl } from "@/lib/base-path";
import {
  getFeedbackPayloadSummary,
  getFeedbackPayloadTitle,
  type PublishedDesign,
} from "@/lib/feedback/designFeedback";
import {
  getPublishedDesignById,
  listPublishedDesigns,
} from "@/lib/feedback/ydbFeedbackStore";
import { MCP_REGISTRY_SERVER_VERSION } from "@/lib/mcp/registry";

type McpToolResult = {
  structuredContent: Record<string, unknown>;
  content: Array<{ type: "text"; text: string }>;
  isError?: true;
};

const MAX_SEARCH_LIMIT = 48;
const SEARCH_CORPUS_LIMIT = 5000;
const DEFAULT_SEARCH_LIMIT = 10;

const READ_ONLY_TOOL = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

const GENERATION_TOOL = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: true,
} as const;

const searchInputSchema = {
  query: z
    .string()
    .describe("Optional text matched against public interface titles and summaries.")
    .optional(),
  limit: z
    .union([z.number(), z.string()])
    .describe("Optional maximum result count. Defaults to 10 and is clamped to 1-48.")
    .optional(),
};

const interfaceIdInputSchema = {
  id: z.string().describe("Public Gravity AI UI gallery interface id."),
};

const generateInputSchema = {
  prompt: z
    .string()
    .min(1)
    .max(6000)
    .describe("Natural-language prompt for the interface to generate."),
  conversationId: z
    .string()
    .min(1)
    .max(120)
    .describe("Optional stable conversation id for this generation.")
    .optional(),
};

const refineInputSchema = {
  instruction: z
    .string()
    .min(1)
    .max(6000)
    .describe("Natural-language refinement instruction."),
  payload: z.unknown().describe("Previous composed Gravity interface payload."),
  dataModel: z.unknown().describe("Optional latest data model for the previous payload.").optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().min(1).max(2000),
        surfaceId: z.string().min(1).max(80).optional(),
      }),
    )
    .max(12)
    .describe("Optional short conversation history for refinement context.")
    .optional(),
  conversationId: z
    .string()
    .min(1)
    .max(120)
    .describe("Optional stable conversation id for this refinement.")
    .optional(),
};

export function createGravityAiMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: "gravity-ai-ui",
      version: MCP_REGISTRY_SERVER_VERSION,
    },
    {
      instructions:
        "Gravity AI UI exposes public tools for searching liked interface drafts, reading public gallery payloads, and generating or refining validated A2UI + Gravity UI interface payloads. Generated results are returned to the caller and are not saved or published by MCP tools.",
    },
  );

  server.registerTool(
    "search_interfaces",
    {
      title: "Search Gravity AI UI interfaces",
      description:
        "Use to discover public liked Gravity AI UI interface drafts by title, summary, or id. This returns public gallery metadata only. Use get_interface when you need the full payload or React code for a known id.",
      inputSchema: searchInputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (args) => {
      const limit = normalizeLimit(args.limit);
      const query = normalizeQuery(args.query);
      const designs = await listPublishedDesigns(
        query ? SEARCH_CORPUS_LIMIT : MAX_SEARCH_LIMIT,
      );
      const interfaces = designs
        .filter((design) => matchesQuery(design, query))
        .slice(0, limit)
        .map(createPublicInterfaceSummary);

      return toolResult({
        total: interfaces.length,
        limit,
        interfaces,
      });
    },
  );

  server.registerTool(
    "get_interface",
    {
      title: "Get Gravity AI UI interface",
      description:
        "Use when you already have a public Gravity AI UI gallery id and need the sanitized public interface metadata, composed payload, thumbnail URLs, page URL, and copyable React code.",
      inputSchema: interfaceIdInputSchema,
      annotations: READ_ONLY_TOOL,
    },
    async (args) => {
      const id = readSafeInterfaceId(args.id);

      if (!id) {
        return toolError("invalid_argument", "Invalid interface id.");
      }

      const design = await getPublishedDesignById(id);

      if (!design) {
        return toolError("not_found", "Published interface not found.");
      }

      return toolResult({
        interface: createPublicInterfaceDetail(design),
      });
    },
  );

  server.registerTool(
    "generate_interface",
    {
      title: "Generate Gravity AI UI interface",
      description:
        "Use to generate a new Gravity AI UI composed interface from a prompt. This calls the public generator with the server OpenAI configuration and does not save or publish the result.",
      inputSchema: generateInputSchema,
      annotations: GENERATION_TOOL,
    },
    async (args, extra) =>
      generateWithAgent(
        {
          kind: "prompt",
          conversationId: readConversationId(args.conversationId),
          prompt: args.prompt.trim(),
        },
        extra.signal,
      ),
  );

  server.registerTool(
    "refine_interface",
    {
      title: "Refine Gravity AI UI interface",
      description:
        "Use to refine a previously generated Gravity AI UI composed payload with a natural-language instruction. This does not save or publish the result.",
      inputSchema: refineInputSchema,
      annotations: GENERATION_TOOL,
    },
    async (args, extra) => {
      const parsedPayload = composedInterfaceArgumentsSchema.safeParse(args.payload);

      if (!parsedPayload.success) {
        return toolError("invalid_argument", "Invalid composed interface payload.");
      }

      return generateWithAgent(
        {
          kind: "prompt",
          conversationId: readConversationId(args.conversationId),
          prompt: args.instruction.trim(),
          conversationContext: {
            ...(args.history ? { history: args.history } : {}),
            latestSurfaceId: parsedPayload.data.surfaceId,
            latestPayload: parsedPayload.data,
            ...(args.dataModel !== undefined
              ? { latestDataModel: args.dataModel }
              : {}),
          },
        },
        extra.signal,
      );
    },
  );

  return server;
}

function createPublicInterfaceSummary(design: PublishedDesign) {
  return {
    id: design.id,
    title: design.title,
    summary: design.summary,
    surfaceId: design.surfaceId,
    createdAtMs: design.createdAtMs,
    url: toPublicUrl(`/gallery/${design.id}`),
    ...(design.thumbnail
      ? {
          thumbnail: {
            width: design.thumbnail.width,
            height: design.thumbnail.height,
            webpUrl: toPublicUrl(design.thumbnail.webpPath),
            pngUrl: toPublicUrl(design.thumbnail.pngPath),
          },
        }
      : {}),
  };
}

function createPublicInterfaceDetail(design: PublishedDesign) {
  return {
    ...createPublicInterfaceSummary(design),
    payload: design.payload,
    reactCode: buildReactCode(design.payload),
  };
}

function createGeneratedInterface(payload: ComposedInterfacePayload) {
  return {
    title: getFeedbackPayloadTitle(payload),
    summary: getFeedbackPayloadSummary(payload),
    surfaceId: payload.surfaceId,
    payload,
    reactCode: buildReactCode(payload),
  };
}

async function generateWithAgent(
  request: AgentRequest,
  signal: AbortSignal,
): Promise<McpToolResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return toolError("not_configured", "OPENAI_API_KEY is not configured.");
  }

  let latestPayload: ComposedInterfacePayload | null = null;
  let streamError: string | null = null;

  try {
    await streamAgentResponse({
      request,
      apiKey,
      signal,
      onEvent(event) {
        if (event.type === "payload") {
          latestPayload = event.payload;
        }

        if (event.type === "error") {
          streamError = event.message;
        }
      },
    });
  } catch (error) {
    return toolError(
      "generation_failed",
      error instanceof Error ? error.message : "Agent generation failed.",
    );
  }

  if (streamError) {
    return toolError("generation_failed", streamError);
  }

  if (!latestPayload) {
    return toolError(
      "generation_failed",
      "The agent did not emit a valid interface payload.",
    );
  }

  return toolResult({
    interface: createGeneratedInterface(latestPayload),
  });
}

function normalizeLimit(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed)) {
    return DEFAULT_SEARCH_LIMIT;
  }

  return Math.min(MAX_SEARCH_LIMIT, Math.max(1, parsed));
}

function normalizeQuery(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function matchesQuery(design: PublishedDesign, query: string) {
  if (!query) {
    return true;
  }

  return [design.id, design.title, design.summary].some((value) =>
    value.toLowerCase().includes(query),
  );
}

function readSafeInterfaceId(value: unknown) {
  const id = typeof value === "string" ? value.trim() : "";

  if (!id || id.length > 512 || /[\u0000-\u001f/\\]/.test(id)) {
    return null;
  }

  return id;
}

function readConversationId(value: unknown) {
  const id = typeof value === "string" ? value.trim() : "";

  return id || `mcp-${randomUUID()}`;
}

function toolResult(structuredContent: Record<string, unknown>): McpToolResult {
  return {
    structuredContent,
    content: [
      {
        type: "text",
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
  };
}

function toolError(code: string, message: string): McpToolResult {
  const structuredContent = {
    error: {
      code,
      message,
    },
  };

  return {
    isError: true,
    ...toolResult(structuredContent),
  };
}
