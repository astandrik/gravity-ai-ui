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
      `- [App](${toPublicUrl("/")}): Generate, inspect, like, and copy AI-built interface drafts.`,
      `- [Docs](${toPublicUrl("/docs")}): Project notes and implementation plan for the AI-agent UI shell.`,
      "",
      "## Machine-readable resources",
      "",
      `- [Sitemap](${toPublicUrl("/sitemap.xml")}): XML sitemap with public pages.`,
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
      "- Generated interfaces are session content; durable liked examples are used only as design preference examples.",
    ].join("\n"),
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
        "Content-Type": "text/plain; charset=utf-8",
      },
    },
  );
}
