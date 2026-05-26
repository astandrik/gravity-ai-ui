import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComposedInterfacePayload } from "@/lib/agent/composedInterface";

const feedbackMocks = vi.hoisted(() => ({
  getPublishedDesignById: vi.fn(),
  listPublishedDesigns: vi.fn(),
}));

const agentMocks = vi.hoisted(() => ({
  streamAgentResponse: vi.fn(),
}));

vi.mock("@/lib/feedback/ydbFeedbackStore", () => ({
  getPublishedDesignById: feedbackMocks.getPublishedDesignById,
  listPublishedDesigns: feedbackMocks.listPublishedDesigns,
}));

vi.mock("@/lib/agent/openaiAgent", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/lib/agent/openaiAgent")>();

  return {
    ...original,
    streamAgentResponse: agentMocks.streamAgentResponse,
  };
});

const payload = {
  sequence: 0,
  surfaceId: "main",
  dataModel: {
    title: "Deployment review",
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
  ],
} satisfies ComposedInterfacePayload;

const publishedDesign = {
  id: "deployment-review-123e4567e89b",
  title: "Deployment review",
  summary: "Composed tree with 1 node: Text x1.",
  payload,
  surfaceId: "main",
  createdAtMs: 1_700_000_000_000,
  thumbnail: {
    width: 1200,
    height: 900,
    generatedAtMs: 1_700_000_000_100,
    webpPath: "/gallery/deployment-review-123e4567e89b/thumbnail.webp",
    pngPath: "/gallery/deployment-review-123e4567e89b/thumbnail.png",
  },
};

describe("POST /mcp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.unstubAllEnvs();
    process.env.NEXT_PUBLIC_APP_URL = "https://gravity.example";
  });

  it("handles initialize", async () => {
    const body = await callMcp({
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: {
          name: "vitest",
          version: "0.0.0",
        },
      },
    });

    expect(body.result.serverInfo).toMatchObject({
      name: "gravity-ai-ui",
      version: "1.0.0",
    });
  });

  it("lists gallery and generation tools with expected annotations", async () => {
    const body = await callMcp({
      id: 2,
      method: "tools/list",
    });
    const tools = body.result.tools as Array<{
      name: string;
      annotations: {
        readOnlyHint: boolean;
        destructiveHint: boolean;
        idempotentHint: boolean;
        openWorldHint: boolean;
      };
    }>;

    expect(tools.map((tool) => tool.name)).toEqual([
      "search_interfaces",
      "get_interface",
      "generate_interface",
      "refine_interface",
    ]);
    expect(tools.find((tool) => tool.name === "search_interfaces")?.annotations)
      .toMatchObject({
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      });
    expect(tools.find((tool) => tool.name === "generate_interface")?.annotations)
      .toMatchObject({
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      });
  });

  it("searches published interfaces without exposing private fields", async () => {
    feedbackMocks.listPublishedDesigns.mockResolvedValueOnce([
      publishedDesign,
      {
        ...publishedDesign,
        id: "billing-dashboard-123e4567e89b",
        title: "Billing dashboard",
        summary: "Usage, invoices, and limits.",
      },
    ]);

    const body = await callMcp({
      id: 3,
      method: "tools/call",
      params: {
        name: "search_interfaces",
        arguments: {
          query: "deployment",
          limit: 5,
        },
      },
    });

    expect(body.result.isError).toBeUndefined();
    expect(body.result.structuredContent.total).toBe(1);
    expect(body.result.structuredContent.interfaces[0]).toMatchObject({
      id: "deployment-review-123e4567e89b",
      title: "Deployment review",
      url: "https://gravity.example/gallery/deployment-review-123e4567e89b",
    });
    expect(feedbackMocks.listPublishedDesigns).toHaveBeenCalledWith(5000);
    expect(JSON.stringify(body.result.structuredContent)).not.toContain(
      "prompt",
    );
    expect(JSON.stringify(body.result.structuredContent)).not.toContain(
      "history",
    );
  });

  it("returns an interface with payload and React code", async () => {
    feedbackMocks.getPublishedDesignById.mockResolvedValueOnce(publishedDesign);

    const body = await callMcp({
      id: 4,
      method: "tools/call",
      params: {
        name: "get_interface",
        arguments: {
          id: "deployment-review-123e4567e89b",
        },
      },
    });

    expect(body.result.isError).toBeUndefined();
    expect(body.result.structuredContent.interface).toMatchObject({
      id: "deployment-review-123e4567e89b",
      title: "Deployment review",
      payload,
    });
    expect(body.result.structuredContent.interface.reactCode).toContain(
      "export function DeploymentReview",
    );
    expect(body.result.structuredContent.interface.thumbnail).toMatchObject({
      webpUrl:
        "https://gravity.example/gallery/deployment-review-123e4567e89b/thumbnail.webp",
      pngUrl:
        "https://gravity.example/gallery/deployment-review-123e4567e89b/thumbnail.png",
    });
  });

  it("generates an interface through the existing agent flow", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    agentMocks.streamAgentResponse.mockImplementationOnce(async ({ onEvent }) => {
      await onEvent({ type: "status", message: "Composing interface" });
      await onEvent({ type: "payload", payload });
      await onEvent({ type: "done" });
    });

    const body = await callMcp({
      id: 5,
      method: "tools/call",
      params: {
        name: "generate_interface",
        arguments: {
          prompt: "Build a deployment review",
          conversationId: "mcp-conversation",
        },
      },
    });

    expect(body.result.isError).toBeUndefined();
    expect(body.result.structuredContent.interface).toMatchObject({
      title: "Deployment review",
      summary: "Composed tree with 1 nodes: Text x1.",
      payload,
    });
    expect(body.result.structuredContent.interface.reactCode).toContain(
      "DeploymentReview",
    );
    expect(agentMocks.streamAgentResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "test-key",
        signal: expect.any(AbortSignal),
        request: expect.objectContaining({
          kind: "prompt",
          conversationId: "mcp-conversation",
          prompt: "Build a deployment review",
        }),
      }),
    );
  });

  it("refines an interface by passing the previous payload as conversation context", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    agentMocks.streamAgentResponse.mockImplementationOnce(async ({ onEvent }) => {
      await onEvent({ type: "payload", payload });
    });

    const body = await callMcp({
      id: 6,
      method: "tools/call",
      params: {
        name: "refine_interface",
        arguments: {
          instruction: "Add launch blockers",
          payload,
          dataModel: {
            title: "Deployment review",
          },
          history: [{ role: "user", text: "Build a deployment review" }],
        },
      },
    });

    expect(body.result.isError).toBeUndefined();
    expect(agentMocks.streamAgentResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        signal: expect.any(AbortSignal),
        request: expect.objectContaining({
          kind: "prompt",
          prompt: "Add launch blockers",
          conversationContext: expect.objectContaining({
            latestPayload: payload,
            latestDataModel: {
              title: "Deployment review",
            },
            history: [{ role: "user", text: "Build a deployment review" }],
          }),
        }),
      }),
    );
  });

  it("returns a structured error when generation is not configured", async () => {
    delete process.env.OPENAI_API_KEY;

    const body = await callMcp({
      id: 7,
      method: "tools/call",
      params: {
        name: "generate_interface",
        arguments: {
          prompt: "Build a status panel",
        },
      },
    });

    expect(body.result.isError).toBe(true);
    expect(body.result.structuredContent).toEqual({
      error: {
        code: "not_configured",
        message: "OPENAI_API_KEY is not configured.",
      },
    });
  });

  it("rejects forbidden origins before MCP handling", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { POST } = await import("@/app/mcp/route");

    const response = await POST(
      mcpRequest(
        {
          id: 8,
          method: "tools/list",
        },
        {
          origin: "https://evil.example",
        },
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error.message).toBe("Forbidden origin.");
  });
});

describe("GET /mcp", () => {
  it("returns a JSON-RPC 405 error", async () => {
    const { GET } = await import("@/app/mcp/route");

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(body).toEqual({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    });
  });
});

async function callMcp(message: {
  id: number;
  method: string;
  params?: Record<string, unknown>;
}) {
  const { POST } = await import("@/app/mcp/route");
  const response = await POST(mcpRequest(message));
  expect(response.status).toBe(200);
  return response.json();
}

function mcpRequest(
  message: {
    id: number;
    method: string;
    params?: Record<string, unknown>;
  },
  headers: Record<string, string> = {},
): Request {
  return new Request("https://gravity.example/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      ...message,
    }),
  });
}
