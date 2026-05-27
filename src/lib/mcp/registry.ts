import { toPublicUrl } from "@/lib/base-path";
import { SITE_NAME } from "@/lib/site";

export const MCP_REGISTRY_SCHEMA_URL =
  "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json";
export const MCP_REGISTRY_SERVER_NAME = "tech.ydb-qdrant/gravity-ai-ui";
export const MCP_REGISTRY_SERVER_TITLE = SITE_NAME;
export const MCP_REGISTRY_SERVER_DESCRIPTION =
  "Search public Gravity AI UI drafts and generate Gravity UI interface payloads.";
export const MCP_REGISTRY_SERVER_VERSION = "1.0.0";

export const MCP_TOOL_CATALOG = [
  {
    name: "search_interfaces",
    title: "Search Gravity AI UI interfaces",
    description:
      "Search public liked Gravity AI UI interface drafts by title, summary, or id.",
    readOnly: true,
  },
  {
    name: "get_interface",
    title: "Get Gravity AI UI interface",
    description:
      "Fetch a public gallery interface with metadata, composed payload, thumbnails, page URL, and React code.",
    readOnly: true,
  },
  {
    name: "generate_interface",
    title: "Generate Gravity AI UI interface",
    description:
      "Generate a new Gravity AI UI composed interface from a natural-language prompt without saving it.",
    readOnly: false,
  },
  {
    name: "refine_interface",
    title: "Refine Gravity AI UI interface",
    description:
      "Refine a supplied composed interface payload with a natural-language instruction without saving it.",
    readOnly: false,
  },
] as const;

export type McpRegistryServerMetadata = {
  $schema: string;
  name: string;
  title: string;
  description: string;
  version: string;
  websiteUrl: string;
  remotes: Array<{
    type: "streamable-http";
    url: string;
  }>;
};

export type McpServerCard = {
  name: string;
  title: string;
  description: string;
  version: string;
  websiteUrl: string;
  serverUrl: string;
  transport: "streamable-http";
  tools: Array<{
    name: string;
    title: string;
    description: string;
    readOnly: boolean;
  }>;
};

export function buildMcpRegistryServerMetadata(): McpRegistryServerMetadata {
  return {
    $schema: MCP_REGISTRY_SCHEMA_URL,
    name: MCP_REGISTRY_SERVER_NAME,
    title: MCP_REGISTRY_SERVER_TITLE,
    description: MCP_REGISTRY_SERVER_DESCRIPTION,
    version: MCP_REGISTRY_SERVER_VERSION,
    websiteUrl: toPublicUrl("/"),
    remotes: [
      {
        type: "streamable-http",
        url: toPublicUrl("/mcp"),
      },
    ],
  };
}

export function buildMcpServerCard(): McpServerCard {
  return {
    name: MCP_REGISTRY_SERVER_NAME,
    title: MCP_REGISTRY_SERVER_TITLE,
    description: MCP_REGISTRY_SERVER_DESCRIPTION,
    version: MCP_REGISTRY_SERVER_VERSION,
    websiteUrl: toPublicUrl("/"),
    serverUrl: toPublicUrl("/mcp"),
    transport: "streamable-http",
    tools: MCP_TOOL_CATALOG.map((tool) => ({ ...tool })),
  };
}
