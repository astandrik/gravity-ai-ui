import type { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";

import { toPublicUrl } from "@/lib/base-path";
import { listPublishedDesignSitemapEntries } from "@/lib/feedback/ydbFeedbackStore";
import {
  SITEMAP_CACHE_TAG,
  SITEMAP_REVALIDATE_SECONDS,
} from "@/lib/sitemap-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const getSitemapSnapshot = unstable_cache(
  async (): Promise<MetadataRoute.Sitemap> => buildSitemap(),
  getSitemapCacheKeyParts(),
  {
    revalidate: SITEMAP_REVALIDATE_SECONDS,
    tags: [SITEMAP_CACHE_TAG],
  },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemapSnapshot();
}

async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const generatedAt = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: toPublicUrl("/"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: toPublicUrl("/docs"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: toPublicUrl("/gallery"),
      lastModified: generatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: toPublicUrl("/about"),
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: toPublicUrl("/compare"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: toPublicUrl("/best-ai-ui-generator-for-agents"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: toPublicUrl("/guides/a2ui-openai-gravity-ui"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: toPublicUrl("/index.md"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: toPublicUrl("/docs.md"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: toPublicUrl("/compare.md"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: toPublicUrl("/guides/a2ui-openai-gravity-ui.md"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: toPublicUrl("/best-ai-ui-generator-for-agents.md"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: toPublicUrl("/openapi.json"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: toPublicUrl("/llms-full.txt"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: toPublicUrl("/developers.md"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.4,
    },
    {
      url: toPublicUrl("/.well-known/agent.json"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.3,
    },
    {
      url: toPublicUrl("/.well-known/mcp.json"),
      lastModified: generatedAt,
      changeFrequency: "weekly",
      priority: 0.3,
    },
    {
      url: toPublicUrl("/opengraph-image"),
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  try {
    const designs = await listPublishedDesignSitemapEntries();

    return [
      ...staticEntries,
      ...designs.map((design) => ({
        url: toPublicUrl(`/gallery/${design.id}`),
        lastModified: new Date(design.createdAtMs),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticEntries;
  }
}

function getSitemapCacheKeyParts() {
  return [
    "gravity-ai-ui-sitemap",
    process.env.YDB_FEEDBACK_TABLE?.trim() || "design_feedback",
    getYdbConnectionCacheKey(),
    process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000",
    process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "",
  ];
}

function getYdbConnectionCacheKey() {
  const connectionString = process.env.YDB_CONNECTION_STRING?.trim();

  if (connectionString) {
    return connectionString;
  }

  const endpoint = process.env.YDB_ENDPOINT || "grpc://localhost:2136";
  const database = process.env.YDB_DATABASE || "/local";
  const separator = database.startsWith("/") ? "" : "/";

  return `${endpoint.replace(/\/$/, "")}${separator}${database}`;
}
