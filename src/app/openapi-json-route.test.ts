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
    expect(body.paths["/.well-known/agent.json"].get.operationId).toBe(
      "getAgentDiscovery",
    );
    expect(body.paths["/.well-known/agent-card.json"]).toBeUndefined();
    expect(body.paths["/.well-known/mcp.json"].get.operationId).toBe(
      "getMcpWellKnownDocument",
    );
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
    const mcpGetResponses = body.paths["/mcp"].get.responses;
    const mcpDeleteResponses = body.paths["/mcp"].delete.responses;
    const wellKnownMcp = body.paths["/.well-known/mcp"];

    expect(agentResponses["400"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/ProblemDetails",
    );
    expect(agentResponses["400"].headers["RateLimit-Limit"]).toBeDefined();
    expect(agentResponses["400"].headers["API-Version"]).toBeDefined();
    expect(agentResponses["503"]).toBeUndefined();
    expect(
      feedbackResponses["400"].content["application/json"].schema.$ref,
    ).toBe("#/components/schemas/ProblemDetails");
    expect(
      feedbackResponses["503"].content["application/json"].schema.$ref,
    ).toBe("#/components/schemas/ProblemDetails");
    expect(feedbackResponses["200"].headers["API-Version"]).toBeDefined();
    expect(
      wellKnownMcp.get.responses["200"].content["application/json"].schema.$ref,
    ).toBe("#/components/schemas/McpServerCard");
    expect(wellKnownMcp.post.operationId).toBe("callWellKnownMcpServer");
    expect(mcpResponses["403"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/JsonRpcResponse",
    );
    expect(mcpResponses["405"]).toBeUndefined();
    expect(mcpGetResponses["405"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/JsonRpcResponse",
    );
    expect(
      mcpDeleteResponses["405"].content["application/json"].schema.$ref,
    ).toBe(
      "#/components/schemas/JsonRpcResponse",
    );
    expect(mcpResponses["500"].content["application/json"].schema.$ref).toBe(
      "#/components/schemas/JsonRpcResponse",
    );
    expect(mcpResponses["200"].headers["API-Version"]).toBeDefined();
  });

  it("documents OAuth discovery and disabled OAuth endpoints", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/openapi.json/route");

    const body = await GET().json();
    const authorizationServerProperties =
      body.components.schemas.OAuthAuthorizationServerMetadata.properties;

    expect(authorizationServerProperties).toMatchObject({
      jwks_uri: { type: "string", format: "uri" },
      token_endpoint_auth_methods_supported: {
        type: "array",
        items: { type: "string" },
      },
      service_documentation: { type: "string", format: "uri" },
    });
    expect(
      body.paths["/.well-known/openid-configuration"].get.operationId,
    ).toBe("getOpenIdConfiguration");
    expect(body.paths["/oauth/authorize"].get.responses["501"].content[
      "application/json"
    ].schema.$ref).toBe("#/components/schemas/ProblemDetails");
    expect(
      body.paths["/oauth/authorize"].get.responses["501"].headers,
    ).toBeUndefined();
    expect(body.paths["/oauth/token"].post.responses["501"].content[
      "application/json"
    ].schema.$ref).toBe("#/components/schemas/ProblemDetails");
    expect(
      body.paths["/oauth/token"].post.responses["501"].headers,
    ).toBeUndefined();
    expect(body.paths["/oauth/token"].get.responses["405"].content[
      "application/json"
    ].schema.$ref).toBe("#/components/schemas/ProblemDetails");
    expect(
      body.paths["/oauth/token"].get.responses["405"].headers,
    ).toBeUndefined();
    expect(body.paths["/oauth/userinfo"].get.responses["501"].content[
      "application/json"
    ].schema.$ref).toBe("#/components/schemas/ProblemDetails");
    expect(
      body.paths["/oauth/userinfo"].get.responses["501"].headers,
    ).toBeUndefined();
    expect(body.paths["/oauth/userinfo"].post.responses["501"].content[
      "application/json"
    ].schema.$ref).toBe("#/components/schemas/ProblemDetails");
    expect(
      body.paths["/oauth/userinfo"].post.responses["501"].headers,
    ).toBeUndefined();
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
