import { describe, expect, it, vi } from "vitest";

describe("agent discovery routes", () => {
  it("publishes a generic agent discovery file", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/.well-known/agent.json/route");

    const response = GET();
    const body = await response.json();

    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(body).toMatchObject({
      name: "Gravity AI UI",
      description: expect.stringContaining("AI-built product interfaces"),
      url: "https://gravity.example/",
      openapi: "https://gravity.example/openapi.json",
      mcp: {
        serverUrl: "https://gravity.example/mcp",
        serverCard: "https://gravity.example/.well-known/mcp/server-card.json",
      },
    });
    expect(body.capabilities).toEqual(
      expect.arrayContaining([
        "AI UI generator",
        "A2UI component tree generation",
        "Streamable HTTP MCP server",
      ]),
    );
  });

  it("publishes an A2A agent card", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/.well-known/agent-card.json/route");

    const body = await GET().json();

    expect(body).toMatchObject({
      name: "Gravity AI UI",
      description: expect.stringContaining("AI-powered UI generator"),
      url: "https://gravity.example/mcp",
      version: "1.0.0",
      documentationUrl: "https://gravity.example/docs",
    });
    expect(body.defaultInputModes).toContain("text/plain");
    expect(body.defaultOutputModes).toContain("application/json");
    expect(body.skills.map((skill: { id: string }) => skill.id)).toEqual([
      "search_interfaces",
      "get_interface",
      "generate_interface",
      "refine_interface",
    ]);
  });

  it("publishes an MCP well-known compatibility document", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/.well-known/mcp.json/route");

    const body = await GET().json();

    expect(body).toMatchObject({
      name: "tech.ydb-qdrant/gravity-ai-ui",
      title: "Gravity AI UI",
      serverUrl: "https://gravity.example/mcp",
      transport: "streamable-http",
      serverCard: "https://gravity.example/.well-known/mcp/server-card.json",
      openapi: "https://gravity.example/openapi.json",
    });
    expect(body.tools).toHaveLength(4);
  });
});
