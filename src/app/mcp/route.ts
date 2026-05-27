import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  attachAgentHeaders,
  readAgentRateLimitKey,
  withAgentResponseHeaders,
} from "@/lib/api-response";
import { isAllowedMcpOrigin } from "@/lib/mcp/origin";
import { createGravityAiMcpServer } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const rateLimitKey = readAgentRateLimitKey(request);

  if (!isAllowedMcpOrigin(request.headers.get("origin"))) {
    return jsonRpcError(403, -32000, "Forbidden origin.", {}, rateLimitKey);
  }

  const server = createGravityAiMcpServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    return attachAgentHeaders(await transport.handleRequest(request), {
      rateLimitKey,
    });
  } catch {
    return jsonRpcError(
      500,
      -32603,
      "Internal server error.",
      {},
      rateLimitKey,
    );
  } finally {
    await transport.close();
    await server.close();
  }
}

export async function GET(): Promise<Response> {
  return methodNotAllowed();
}

export async function DELETE(): Promise<Response> {
  return methodNotAllowed();
}

function methodNotAllowed(): Response {
  return jsonRpcError(405, -32000, "Method not allowed.", {
    Allow: "POST",
  });
}

function jsonRpcError(
  status: number,
  code: number,
  message: string,
  headers: HeadersInit = {},
  rateLimitKey?: string,
): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: {
        code,
        message,
      },
      id: null,
    },
    {
      status,
      headers: withAgentResponseHeaders(
        {
          "Content-Type": "application/json",
          ...headers,
        },
        rateLimitKey ? { rateLimitKey } : undefined,
      ),
    },
  );
}
