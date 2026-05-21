import type { Metadata, Viewport } from "next";
import { getRootClassName } from "@gravity-ui/uikit/server";
import "@gravity-ui/uikit/styles/fonts.css";
import "@gravity-ui/uikit/styles/styles.css";
import "@/styles/globals.scss";

import { Providers } from "@/app/Providers";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

const THEME = "dark" as const;

export const viewport: Viewport = {
  themeColor: "#151617",
};

export const metadata: Metadata = {
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s - ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const rootClassName = getRootClassName({ theme: THEME });

  return (
    <html lang="en">
      <body className={rootClassName}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
