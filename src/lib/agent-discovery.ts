import { toPublicUrl } from "@/lib/base-path";
import {
  MCP_REGISTRY_SERVER_DESCRIPTION,
  MCP_REGISTRY_SERVER_NAME,
  MCP_REGISTRY_SERVER_TITLE,
  MCP_REGISTRY_SERVER_VERSION,
  MCP_TOOL_CATALOG,
} from "@/lib/mcp/registry";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const CAPABILITIES = [
  "AI UI generator",
  "AI-powered UI generator for product interfaces",
  "A2UI component tree generation",
  "OpenAI structured interface generation",
  "Trusted Gravity UI rendering",
  "Streamable HTTP MCP server",
] as const;

export function buildAgentDiscovery() {
  return {
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: toPublicUrl("/"),
    documentation: toPublicUrl("/docs"),
    openapi: toPublicUrl("/openapi.json"),
    llms: toPublicUrl("/llms.txt"),
    markdown: toPublicUrl("/index.md"),
    oauth: {
      authorizationServer: toPublicUrl("/.well-known/oauth-authorization-server"),
      protectedResource: toPublicUrl("/.well-known/oauth-protected-resource"),
    },
    mcp: {
      serverUrl: toPublicUrl("/mcp"),
      discovery: toPublicUrl("/.well-known/mcp"),
      serverCard: toPublicUrl("/.well-known/mcp/server-card.json"),
      manifest: toPublicUrl("/.well-known/mcp.json"),
    },
    capabilities: [...CAPABILITIES],
  };
}

export function buildMcpWellKnownDocument() {
  const tools = MCP_TOOL_CATALOG.map((tool) => ({ ...tool }));

  return {
    name: MCP_REGISTRY_SERVER_NAME,
    title: MCP_REGISTRY_SERVER_TITLE,
    description: MCP_REGISTRY_SERVER_DESCRIPTION,
    version: MCP_REGISTRY_SERVER_VERSION,
    websiteUrl: toPublicUrl("/"),
    serverUrl: toPublicUrl("/mcp"),
    serverCard: toPublicUrl("/.well-known/mcp/server-card.json"),
    openapi: toPublicUrl("/openapi.json"),
    transport: "streamable-http",
    tools,
    servers: [
      {
        name: MCP_REGISTRY_SERVER_NAME,
        title: MCP_REGISTRY_SERVER_TITLE,
        description: MCP_REGISTRY_SERVER_DESCRIPTION,
        url: toPublicUrl("/mcp"),
        transport: "streamable-http",
        tools,
      },
    ],
  };
}
