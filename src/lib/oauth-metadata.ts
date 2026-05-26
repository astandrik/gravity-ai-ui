import { getPublicOrigin, toPublicUrl } from "@/lib/base-path";

const SUPPORTED_SCOPES = ["interface:generate", "interface:read"] as const;

export function buildOAuthAuthorizationServerMetadata() {
  return {
    issuer: getPublicOrigin(),
    authorization_endpoint: toPublicUrl("/oauth/authorize"),
    token_endpoint: toPublicUrl("/oauth/token"),
    jwks_uri: toPublicUrl("/.well-known/jwks.json"),
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: [...SUPPORTED_SCOPES],
    service_documentation: toPublicUrl("/docs"),
  };
}

export function buildOpenIdConfiguration() {
  return {
    ...buildOAuthAuthorizationServerMetadata(),
    userinfo_endpoint: toPublicUrl("/oauth/userinfo"),
    subject_types_supported: ["public"],
    id_token_signing_alg_values_supported: ["RS256"],
    claims_supported: ["sub", "aud", "iss", "exp", "iat", "scope"],
  };
}

export function buildOAuthProtectedResourceMetadata(path = "/") {
  const isMcp = path === "/mcp";

  return {
    resource: toPublicUrl(path),
    authorization_servers: [getPublicOrigin()],
    scopes_supported: [...SUPPORTED_SCOPES],
    bearer_methods_supported: ["header"],
    resource_name: isMcp ? "Gravity AI UI MCP server" : "Gravity AI UI",
    resource_documentation: toPublicUrl(isMcp ? "/mcp.md" : "/auth.md"),
  };
}

export function buildDisabledOAuthError() {
  return {
    error: {
      code: "oauth_not_enabled",
      message:
        "OAuth is currently a metadata-only discovery surface for Gravity AI UI. Token issuance and bearer-token enforcement are not enabled in this public demo.",
      docs: toPublicUrl("/auth.md"),
    },
  };
}
