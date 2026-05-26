import { describe, expect, it, vi } from "vitest";

describe("OpenAPI discovery routes", () => {
  it("serves the canonical Gravity AI UI OpenAPI document", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/openapi.json/route");

    const response = GET();
    const body = await response.json();

    expect(response.headers.get("Content-Type")).toContain("application/json");
    expect(body.openapi).toBe("3.1.0");
    expect(body.info.title).toBe("Gravity AI UI API");
    expect(body.servers).toEqual([{ url: "https://gravity.example" }]);
    expect(body.paths["/api/agent"].post.operationId).toBe(
      "streamGravityInterface",
    );
    expect(body.paths["/api/design-feedback"].post.operationId).toBe(
      "publishDesignFeedback",
    );
    expect(body.paths["/mcp"].post.operationId).toBe("callMcpServer");
    expect(body.components.schemas.ProblemDetails).toMatchObject({
      type: "object",
      required: ["error"],
    });
    expect(body.tags.map((tag: { name: string }) => tag.name)).toContain(
      "Discovery",
    );
  });

  it("documents API and MCP responses according to the implemented routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/openapi.json/route");

    const body = await GET().json();
    const agentResponses = body.paths["/api/agent"].post.responses;
    const feedbackResponses = body.paths["/api/design-feedback"].post.responses;
    const mcpResponses = body.paths["/mcp"].post.responses;
    const wellKnownMcp = body.paths["/.well-known/mcp"];

    expect(agentResponses["400"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/ValidationErrorResponse",
    );
    expect(agentResponses["503"]).toBeUndefined();
    expect(
      feedbackResponses["400"].content["application/json"].schema.$ref,
    ).toBe("#/components/schemas/ValidationErrorResponse");
    expect(
      feedbackResponses["503"].content["application/json"].schema.$ref,
    ).toBe("#/components/schemas/SimpleErrorResponse");
    expect(
      wellKnownMcp.get.responses["200"].content["application/json"].schema.$ref,
    ).toBe("#/components/schemas/McpServerCard");
    expect(wellKnownMcp.post.operationId).toBe("callWellKnownMcpServer");
    expect(mcpResponses["403"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/JsonRpcResponse",
    );
    expect(mcpResponses["405"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/JsonRpcResponse",
    );
    expect(mcpResponses["500"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/JsonRpcResponse",
    );
  });

  it("serves the same OpenAPI document from /api/openapi.json", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const canonical = await import("@/app/openapi.json/route");
    const alias = await import("@/app/api/openapi.json/route");

    await expect(alias.GET().json()).resolves.toEqual(
      await canonical.GET().json(),
    );
  });
});
