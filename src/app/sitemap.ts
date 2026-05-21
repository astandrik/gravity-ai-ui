import type { MetadataRoute } from "next";

import { toPublicUrl } from "@/lib/base-path";

export default function sitemap(): MetadataRoute.Sitemap {
  const generatedAt = new Date();

  return [
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
      url: toPublicUrl("/opengraph-image"),
      lastModified: generatedAt,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];
}
