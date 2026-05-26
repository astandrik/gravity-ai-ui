import { toPublicUrl } from "@/lib/base-path";
import { SITE_NAME } from "@/lib/site";

export type GalleryDesignJsonLdInput = {
  canonicalUrl: string;
  createdAtMs: number;
  imageUrl: string;
  summary: string;
  title: string;
};

export function buildGalleryDesignJsonLd({
  canonicalUrl,
  createdAtMs,
  imageUrl,
  summary,
  title,
}: GalleryDesignJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: title,
    description: summary,
    url: canonicalUrl,
    datePublished: new Date(createdAtMs).toISOString(),
    image: imageUrl,
    isPartOf: {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: toPublicUrl("/"),
    },
    about: ["AI-generated product interface", "A2UI", "Gravity UI"],
  };
}

export function serializeGalleryDesignJsonLd(
  jsonLd: ReturnType<typeof buildGalleryDesignJsonLd>,
) {
  return JSON.stringify(jsonLd).replace(/</g, "\\u003c");
}
