import { describe, expect, it, vi } from "vitest";

describe("OAuth discovery metadata", () => {
  it("publishes authorization-server metadata for agent discovery", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import(
      "@/app/.well-known/oauth-authorization-server/route"
    );

    const response = GET();
    const body = await response.json();

    expect(body).toMatchObject({
      issuer: "https://gravity.example",
      authorization_endpoint: "https://gravity.example/oauth/authorize",
      token_endpoint: "https://gravity.example/oauth/token",
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code", "refresh_token"],
      code_challenge_methods_supported: ["S256"],
      service_documentation: "https://gravity.example/docs",
    });
  });

  it("publishes protected-resource metadata for the site and MCP resource", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const rootRoute = await import(
      "@/app/.well-known/oauth-protected-resource/route"
    );
    const mcpRoute = await import(
      "@/app/.well-known/oauth-protected-resource/mcp/route"
    );

    await expect(rootRoute.GET().json()).resolves.toMatchObject({
      resource: "https://gravity.example/",
      authorization_servers: ["https://gravity.example"],
      scopes_supported: ["interface:generate", "interface:read"],
      bearer_methods_supported: ["header"],
    });
    await expect(mcpRoute.GET().json()).resolves.toMatchObject({
      resource: "https://gravity.example/mcp",
      authorization_servers: ["https://gravity.example"],
      resource_name: "Gravity AI UI MCP server",
    });
  });

  it("publishes OpenID provider metadata as an alias for OAuth discovery", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/.well-known/openid-configuration/route");

    const body = await GET().json();

    expect(body).toMatchObject({
      issuer: "https://gravity.example",
      authorization_endpoint: "https://gravity.example/oauth/authorize",
      token_endpoint: "https://gravity.example/oauth/token",
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["RS256"],
    });
  });

  it("returns structured JSON for OAuth endpoints while issuance is disabled", async () => {
    const [{ GET }, tokenRoute] = await Promise.all([
      import("@/app/oauth/authorize/route"),
      import("@/app/oauth/token/route"),
    ]);

    const authorizeResponse = GET();
    const tokenResponse = await tokenRoute.POST();

    await expect(authorizeResponse.json()).resolves.toMatchObject({
      error: {
        code: "oauth_not_enabled",
        message: expect.stringContaining("metadata-only"),
      },
    });
    expect(authorizeResponse.status).toBe(501);
    await expect(tokenResponse.json()).resolves.toMatchObject({
      error: {
        code: "oauth_not_enabled",
      },
    });
    expect(tokenResponse.status).toBe(501);
  });
});
