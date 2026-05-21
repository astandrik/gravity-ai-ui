import { toPublicUrl } from "@/lib/base-path";

export const SITE_NAME = "Gravity AI UI";
export const SITE_TAGLINE = "AI-agent interface shell";
export const SITE_TITLE = `${SITE_NAME} - ${SITE_TAGLINE}`;
export const SITE_DESCRIPTION =
  "Generate, preview, inspect, and reuse AI-built product interfaces with A2UI, OpenAI, and Gravity UI.";
export const SITE_IMAGE_ALT =
  "Gravity AI UI interface generation shell preview";

export const SITE_KEYWORDS = [
  "Gravity AI UI",
  "AI agent UI",
  "A2UI",
  "OpenAI",
  "Gravity UI",
  "generated interfaces",
  "React UI",
  "design feedback",
] as const;

export const SOCIAL_IMAGE = {
  path: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: SITE_IMAGE_ALT,
} as const;

export const SITE_STACK = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "A2UI",
  "OpenAI",
  "Gravity UI",
  "SCSS",
] as const;

export function getSiteSocialImageUrl(): string {
  return toPublicUrl(SOCIAL_IMAGE.path);
}

export function getWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    applicationCategory: "DeveloperApplication",
    url: toPublicUrl("/"),
    description: SITE_DESCRIPTION,
    operatingSystem: "Web",
  };
}
