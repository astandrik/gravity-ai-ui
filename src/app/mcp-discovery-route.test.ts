import { describe, expect, it, vi } from "vitest";

describe("MCP discovery routes", () => {
  it("serves pre-connection MCP metadata from /.well-known/mcp", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/.well-known/mcp/route");

    const response = GET();
    const body = await response.json();

    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(body).toMatchObject({
      name: "tech.ydb-qdrant/gravity-ai-ui",
      title: "Gravity AI UI",
      serverUrl: "https://gravity.example/mcp",
      transport: "streamable-http",
    });
    expect(body.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "search_interfaces",
      "get_interface",
      "generate_interface",
      "refine_interface",
    ]);
  });

  it("serves an MCP server card at the standard server-card path", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import(
      "@/app/.well-known/mcp/server-card.json/route"
    );

    const body = await GET().json();

    expect(body).toMatchObject({
      name: "tech.ydb-qdrant/gravity-ai-ui",
      description:
        "Search public Gravity AI UI drafts and generate Gravity UI interface payloads.",
      version: "1.0.0",
      serverUrl: "https://gravity.example/mcp",
    });
    expect(body.tools).toHaveLength(4);
  });

  it("proxies Streamable HTTP MCP calls through /.well-known/mcp", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { POST } = await import("@/app/.well-known/mcp/route");

    const response = await POST(
      new Request("https://gravity.example/.well-known/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
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
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result.instructions).toContain("Gravity AI UI");
    expect(body.result.serverInfo.name).toBe("gravity-ai-ui");
  });
});
