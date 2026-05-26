import { toPublicUrl } from "@/lib/base-path";
import { SITE_NAME } from "@/lib/site";

export const MCP_REGISTRY_SCHEMA_URL =
  "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json";
export const MCP_REGISTRY_SERVER_NAME = "tech.ydb-qdrant/gravity-ai-ui";
export const MCP_REGISTRY_SERVER_TITLE = SITE_NAME;
export const MCP_REGISTRY_SERVER_DESCRIPTION =
  "Search public Gravity AI UI drafts and generate Gravity UI interface payloads.";
export const MCP_REGISTRY_SERVER_VERSION = "1.0.0";

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
