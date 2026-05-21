import type { MetadataRoute } from "next";

import { toPublicUrl, withBasePath } from "@/lib/base-path";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          withBasePath("/"),
          withBasePath("/docs"),
          withBasePath("/llm.txt"),
          withBasePath("/llms.txt"),
          withBasePath("/opengraph-image"),
        ],
        disallow: [
          withBasePath("/api"),
          withBasePath("/__openai"),
          withBasePath("/_next"),
        ],
      },
      {
        userAgent: "OAI-SearchBot",
        allow: [
          withBasePath("/"),
          withBasePath("/docs"),
          withBasePath("/llm.txt"),
          withBasePath("/llms.txt"),
        ],
        disallow: [
          withBasePath("/api"),
          withBasePath("/__openai"),
          withBasePath("/_next"),
        ],
      },
      {
        userAgent: "GPTBot",
        allow: [
          withBasePath("/"),
          withBasePath("/docs"),
          withBasePath("/llm.txt"),
          withBasePath("/llms.txt"),
        ],
        disallow: [
          withBasePath("/api"),
          withBasePath("/__openai"),
          withBasePath("/_next"),
        ],
      },
    ],
    sitemap: toPublicUrl("/sitemap.xml"),
  };
}
