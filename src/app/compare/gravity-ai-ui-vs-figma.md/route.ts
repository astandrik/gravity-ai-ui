import { buildComparisonPageMarkdown } from "@/lib/agent-docs";
import { markdownResponse } from "@/lib/markdown-response";

export const runtime = "nodejs";

export function GET(): Response {
  return markdownResponse(buildComparisonPageMarkdown("gravity-ai-ui-vs-figma"));
}
