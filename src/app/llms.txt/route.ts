import { toPublicUrl } from "@/lib/base-path";
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_STACK,
  SITE_TAGLINE,
} from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return new Response(
    [
      `# ${SITE_NAME}`,
      "",
      `> ${SITE_TAGLINE}. ${SITE_DESCRIPTION}`,
      "",
      "Gravity AI UI is a web shell for generating product-interface previews from natural language prompts. It uses A2UI messages, OpenAI Responses, and Gravity UI components.",
      "",
      "## Core pages",
      "",
      `- [App](${toPublicUrl("/")}): Generate, inspect, like, publish, and copy AI-built interface drafts.`,
      `- [Gallery](${toPublicUrl("/gallery")}): Public gallery of liked interface drafts with previews and generated code.`,
      `- [Docs](${toPublicUrl("/docs")}): Project notes and implementation plan for the AI-agent UI shell.`,
      "",
      "## Machine-readable resources",
      "",
      `- [Sitemap](${toPublicUrl("/sitemap.xml")}): Dynamic XML sitemap with public pages and published gallery detail pages.`,
      `- [Robots policy](${toPublicUrl("/robots.txt")}): Crawl policy for search and AI crawlers.`,
      `- [OpenGraph image](${toPublicUrl("/opengraph-image")}): Social preview image.`,
      "",
      "## Stack",
      "",
      SITE_STACK.map((item) => `- ${item}`).join("\n"),
      "",
      "## Notes",
      "",
      "- API routes are operational endpoints and are not intended for public indexing.",
      "- Liked interfaces are public once published; prompts appear only on individual gallery pages.",
    ].join("\n"),
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
