import { buildGuidePageMarkdown } from "@/lib/agent-docs";
import { markdownResponse } from "@/lib/markdown-response";

export const runtime = "nodejs";

export function GET(): Response {
  return markdownResponse(buildGuidePageMarkdown("mcp-ui-generator"));
}
