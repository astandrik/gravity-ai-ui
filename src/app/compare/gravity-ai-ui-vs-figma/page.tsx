import type { Metadata } from "next";
import { ComparisonArticle } from "@/components/AiVisibility/ComparisonArticle";
import { getComparisonPage } from "@/lib/ai-visibility-content";
import { withBasePath } from "@/lib/base-path";

const page = getComparisonPage("gravity-ai-ui-vs-figma");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: withBasePath(page.path),
  },
};

export default function GravityAiUiVsFigmaPage() {
  return <ComparisonArticle slug="gravity-ai-ui-vs-figma" />;
}
