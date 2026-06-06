import type { Metadata } from "next";
import { GuideArticle } from "@/components/AiVisibility/GuideArticle";
import { getGuidePage } from "@/lib/ai-visibility-content";
import { withBasePath } from "@/lib/base-path";

const page = getGuidePage("mcp-ui-generator");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: withBasePath(page.path),
  },
};

export default function McpUiGeneratorGuidePage() {
  return <GuideArticle slug="mcp-ui-generator" />;
}
