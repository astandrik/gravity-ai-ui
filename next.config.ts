import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath =
  configuredBasePath && configuredBasePath !== "/"
    ? `/${configuredBasePath.replace(/^\/+|\/+$/g, "")}`
    : undefined;
const linkBasePath = basePath ?? "";

function linkPath(path: string): string {
  return `${linkBasePath}${path}`;
}

const discoveryLinkHeader = [
  `<${linkPath("/sitemap.xml")}>; rel="sitemap"`,
  `<${linkPath("/llms.txt")}>; rel="service-desc"; type="text/plain"`,
  `<${linkPath("/index.md")}>; rel="alternate"; type="text/markdown"`,
  `<${linkPath("/openapi.json")}>; rel="service-desc"; type="application/openapi+json"`,
  `<${linkPath("/.well-known/agent.json")}>; rel="service-desc"; type="application/json"`,
  `<${linkPath("/.well-known/mcp/server-card.json")}>; rel="service-desc"; type="application/json"`,
].join(", ");

const nextConfig: NextConfig = {
  basePath,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value: discoveryLinkHeader,
          },
        ],
      },
    ];
  },
  turbopack: {
    root,
  },
};

export default nextConfig;
