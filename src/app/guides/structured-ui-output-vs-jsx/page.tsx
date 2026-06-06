import type { Metadata } from "next";
import { GuideArticle } from "@/components/AiVisibility/GuideArticle";
import { getGuidePage } from "@/lib/ai-visibility-content";
import { withBasePath } from "@/lib/base-path";

const page = getGuidePage("structured-ui-output-vs-jsx");

export const metadata: Metadata = {
  title: page.title,
  description: page.description,
  alternates: {
    canonical: withBasePath(page.path),
  },
};

export default function StructuredUiOutputVsJsxGuidePage() {
  return <GuideArticle slug="structured-ui-output-vs-jsx" />;
}
