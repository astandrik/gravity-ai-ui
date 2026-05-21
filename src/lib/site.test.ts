import { describe, expect, it } from "vitest";
import {
  getWebsiteJsonLd,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_STACK,
  SITE_TITLE,
  SOCIAL_IMAGE,
} from "./site";

describe("site metadata", () => {
  it("defines a named Gravity UI stack", () => {
    expect(SITE_NAME).toBe("Gravity AI UI");
    expect(SITE_TITLE).toContain(SITE_NAME);
    expect(SITE_STACK).toContain("Gravity UI");
    expect(SITE_KEYWORDS).toContain("A2UI");
    expect(SOCIAL_IMAGE.width).toBe(1200);
  });

  it("builds website structured data", () => {
    expect(getWebsiteJsonLd()).toMatchObject({
      "@type": "WebApplication",
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
    });
  });
});
