import { describe, expect, it, vi } from "vitest";

describe("MCP registry metadata routes", () => {
  it("returns remote server metadata from /server.json", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/server.json/route");

    const response = GET();
    const body = await response.json();

    expect(body).toMatchObject({
      $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
      name: "tech.ydb-qdrant/gravity-ai-ui",
      title: "Gravity AI UI",
      version: "1.0.0",
      websiteUrl: "https://gravity.example/",
      remotes: [
        {
          type: "streamable-http",
          url: "https://gravity.example/mcp",
        },
      ],
    });
    expect(body.description.length).toBeLessThanOrEqual(100);
  });

  it("serves the same metadata from the well-known MCP path", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const rootRoute = await import("@/app/server.json/route");
    const wellKnownRoute = await import(
      "@/app/.well-known/mcp/server.json/route"
    );

    expect(await rootRoute.GET().json()).toEqual(
      await wellKnownRoute.GET().json(),
    );
  });
});
