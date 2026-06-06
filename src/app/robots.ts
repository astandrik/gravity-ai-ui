import type { MetadataRoute } from "next";

import { COMPARISON_PAGES, GUIDE_PAGES } from "@/lib/ai-visibility-content";
import { toPublicUrl, withBasePath } from "@/lib/base-path";

const publicContentPaths = [
  "/",
  "/gallery",
  "/docs",
  "/compare",
  ...COMPARISON_PAGES.flatMap((page) => [page.path, page.markdownPath]),
  "/best-ai-ui-generator-for-agents",
  "/guides/a2ui-openai-gravity-ui",
  ...GUIDE_PAGES.flatMap((page) => [page.path, page.markdownPath]),
  "/index.md",
  "/docs.md",
  "/compare.md",
  "/best-ai-ui-generator-for-agents.md",
  "/guides/a2ui-openai-gravity-ui.md",
  "/llm.txt",
  "/llms.txt",
  "/llms-full.txt",
  "/developers.md",
  "/auth.md",
  "/webhooks.md",
  "/mcp.md",
  "/openapi.json",
  "/.well-known",
] as const;

const publicAssetPaths = [
  "/sitemap.xml",
  "/favicon.ico",
  "/favicon.svg",
  "/opengraph-image",
] as const;

const disallowedPaths = ["/api", "/gallery-thumbnail-render", "/__openai", "/_next"] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [...publicContentPaths, ...publicAssetPaths].map(withBasePath),
        disallow: disallowedPaths.map(withBasePath),
      },
      {
        userAgent: "OAI-SearchBot",
        allow: publicContentPaths.map(withBasePath),
        disallow: disallowedPaths.map(withBasePath),
      },
      {
        userAgent: "GPTBot",
        allow: publicContentPaths.map(withBasePath),
        disallow: disallowedPaths.map(withBasePath),
      },
    ],
    sitemap: toPublicUrl("/sitemap.xml"),
  };
}
