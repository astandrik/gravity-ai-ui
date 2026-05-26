import type { MetadataRoute } from "next";

import { toPublicUrl, withBasePath } from "@/lib/base-path";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          withBasePath("/"),
          withBasePath("/gallery"),
          withBasePath("/docs"),
          withBasePath("/compare"),
          withBasePath("/guides/a2ui-openai-gravity-ui"),
          withBasePath("/llm.txt"),
          withBasePath("/llms.txt"),
          withBasePath("/llms-full.txt"),
          withBasePath("/developers.md"),
          withBasePath("/auth.md"),
          withBasePath("/webhooks.md"),
          withBasePath("/mcp.md"),
          withBasePath("/openapi.json"),
          withBasePath("/.well-known"),
          withBasePath("/sitemap.xml"),
          withBasePath("/favicon.ico"),
          withBasePath("/favicon.svg"),
          withBasePath("/opengraph-image"),
        ],
        disallow: [
          withBasePath("/api"),
          withBasePath("/gallery-thumbnail-render"),
          withBasePath("/__openai"),
          withBasePath("/_next"),
        ],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: [
          withBasePath("/"),
          withBasePath("/gallery"),
          withBasePath("/docs"),
          withBasePath("/compare"),
          withBasePath("/guides/a2ui-openai-gravity-ui"),
          withBasePath("/llm.txt"),
          withBasePath("/llms.txt"),
          withBasePath("/llms-full.txt"),
          withBasePath("/developers.md"),
          withBasePath("/auth.md"),
          withBasePath("/webhooks.md"),
          withBasePath("/mcp.md"),
          withBasePath("/openapi.json"),
          withBasePath("/.well-known"),
        ],
        disallow: [
          withBasePath("/api"),
          withBasePath("/gallery-thumbnail-render"),
          withBasePath("/__openai"),
          withBasePath("/_next"),
        ],
      },
      {
        userAgent: "GPTBot",
        allow: [
          withBasePath("/"),
          withBasePath("/gallery"),
          withBasePath("/docs"),
          withBasePath("/compare"),
          withBasePath("/guides/a2ui-openai-gravity-ui"),
          withBasePath("/llm.txt"),
          withBasePath("/llms.txt"),
          withBasePath("/llms-full.txt"),
          withBasePath("/developers.md"),
          withBasePath("/auth.md"),
          withBasePath("/webhooks.md"),
          withBasePath("/mcp.md"),
          withBasePath("/openapi.json"),
          withBasePath("/.well-known"),
        ],
        disallow: [
          withBasePath("/api"),
          withBasePath("/gallery-thumbnail-render"),
          withBasePath("/__openai"),
          withBasePath("/_next"),
        ],
      },
    ],
    sitemap: toPublicUrl("/sitemap.xml"),
  };
}
