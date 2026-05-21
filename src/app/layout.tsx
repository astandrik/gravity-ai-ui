import type { Metadata, Viewport } from "next";
import { getRootClassName } from "@gravity-ui/uikit/server";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import "@/styles/globals.scss";

import { Providers } from "@/app/Providers";
import YandexMetrika from "@/app/YandexMetrika";
import { getPublicOrigin, withBasePath } from "@/lib/base-path";
import {
  getSiteSocialImageUrl,
  getWebsiteJsonLd,
  SITE_DESCRIPTION,
  SITE_IMAGE_ALT,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SOCIAL_IMAGE,
} from "@/lib/site";

const THEME = "dark" as const;

export const viewport: Viewport = {
  themeColor: "#151617",
};

export const metadata: Metadata = {
  applicationName: SITE_NAME,
  title: {
    default: SITE_TITLE,
    template: `%s - ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [...SITE_KEYWORDS],
  metadataBase: new URL(getPublicOrigin()),
  alternates: {
    canonical: withBasePath("/"),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: withBasePath("/favicon.svg"),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: withBasePath("/"),
    images: [
      {
        url: getSiteSocialImageUrl(),
        secureUrl: getSiteSocialImageUrl(),
        width: SOCIAL_IMAGE.width,
        height: SOCIAL_IMAGE.height,
        alt: SITE_IMAGE_ALT,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: getSiteSocialImageUrl(),
        secureUrl: getSiteSocialImageUrl(),
        alt: SITE_IMAGE_ALT,
        type: "image/png",
        width: SOCIAL_IMAGE.width,
        height: SOCIAL_IMAGE.height,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const rootClassName = getRootClassName({ theme: THEME });
  const websiteJsonLd = getWebsiteJsonLd();

  return (
    <html lang="en">
      <body className={rootClassName}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Providers>{children}</Providers>
        <YandexMetrika />
      </body>
    </html>
  );
}
