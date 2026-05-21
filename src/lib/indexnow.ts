import { getPublicOrigin, toPublicUrl } from "@/lib/base-path";

const INDEXNOW_KEY_PATTERN = /^[A-Za-z0-9-]{8,128}$/;

export function getIndexNowKey(): string | null {
  const key = process.env.INDEXNOW_KEY?.trim();

  if (!key || !INDEXNOW_KEY_PATTERN.test(key)) {
    return null;
  }

  return key;
}

export function getIndexNowKeyFileName(): string | null {
  const key = getIndexNowKey();

  return key ? `${key}.txt` : null;
}

export function getIndexNowKeyLocation(): string | null {
  const fileName = getIndexNowKeyFileName();

  return fileName ? toPublicUrl(`/${fileName}`) : null;
}

export function getIndexNowDeployUrls(): string[] {
  return [
    toPublicUrl("/"),
    toPublicUrl("/docs"),
    toPublicUrl("/sitemap.xml"),
    toPublicUrl("/robots.txt"),
    toPublicUrl("/llms.txt"),
    toPublicUrl("/opengraph-image"),
  ];
}

export function getIndexNowHost(): string {
  return new URL(getPublicOrigin()).host;
}
