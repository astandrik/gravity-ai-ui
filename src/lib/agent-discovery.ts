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

export function buildA2aAgentCard() {
  return {
    name: SITE_NAME,
    description:
      "Gravity AI UI is an AI-powered UI generator for agent workflows, A2UI component trees, OpenAI generation, and trusted Gravity UI product interfaces.",
    url: toPublicUrl("/mcp"),
    version: MCP_REGISTRY_SERVER_VERSION,
    documentationUrl: toPublicUrl("/docs"),
    provider: {
      organization: "Gravity AI UI",
      url: toPublicUrl("/"),
    },
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ["text/plain", "application/json"],
    defaultOutputModes: ["application/json", "text/plain"],
    skills: MCP_TOOL_CATALOG.map((tool) => ({
      id: tool.name,
      name: tool.title,
      description: tool.description,
      tags: ["ai-ui-generator", "a2ui", "gravity-ui", "mcp"],
      examples: [tool.description],
      inputModes: ["text/plain", "application/json"],
      outputModes: ["application/json", "text/plain"],
    })),
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
