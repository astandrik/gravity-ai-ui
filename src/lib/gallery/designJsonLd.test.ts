import { describe, expect, it } from "vitest";

import {
  buildGalleryDesignJsonLd,
  serializeGalleryDesignJsonLd,
} from "@/lib/gallery/designJsonLd";

describe("gallery design JSON-LD", () => {
  it("describes a public gallery interface as crawlable creative work", () => {
    expect(
      buildGalleryDesignJsonLd({
        canonicalUrl: "https://gravity.example/gallery/deployment-review",
        createdAtMs: 1_700_000_000_000,
        imageUrl: "https://gravity.example/gallery/deployment-review/thumbnail.png",
        summary: "Composed tree with 2 nodes: Text x2.",
        title: "Deployment review",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: "Deployment review",
      description: "Composed tree with 2 nodes: Text x2.",
      url: "https://gravity.example/gallery/deployment-review",
      datePublished: "2023-11-14T22:13:20.000Z",
      image: "https://gravity.example/gallery/deployment-review/thumbnail.png",
      isPartOf: {
        "@type": "WebApplication",
        name: "Gravity AI UI",
        url: "http://localhost:3000/",
      },
      about: [
        "AI-generated product interface",
        "A2UI",
        "Gravity UI",
      ],
    });
  });

  it("escapes script-closing sequences when serializing JSON-LD", () => {
    const jsonLd = buildGalleryDesignJsonLd({
      canonicalUrl: "https://gravity.example/gallery/script-breakout",
      createdAtMs: 1_700_000_000_000,
      imageUrl: "https://gravity.example/gallery/script-breakout/thumbnail.png",
      summary: "Summary </script><script>alert(1)</script>",
      title: "Title </script><script>alert(1)</script>",
    });

    const serialized = serializeGalleryDesignJsonLd(jsonLd);

    expect(serialized).not.toContain("</script>");
    expect(serialized).toContain("\\u003c/script>");
    expect(JSON.parse(serialized)).toEqual(jsonLd);
  });
});
