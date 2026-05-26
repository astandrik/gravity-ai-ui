"use client";

import NextLink from "next/link";
import { Button } from "@/components/GravityUI/GravityUI";
import { buildGalleryItemOpenedParams } from "@/lib/metrics/events";
import { trackGoal } from "@/lib/metrics/yandex";

type GalleryItemOpenOverlayProps = {
  galleryItemId: string;
  href: string;
  title: string;
};

type GalleryItemOpenButtonProps = {
  galleryItemId: string;
  href: string;
};

export function GalleryItemOpenOverlay({
  galleryItemId,
  href,
  title,
}: GalleryItemOpenOverlayProps) {
  return (
    <NextLink
      aria-label={`Open ${title}`}
      className="gallery-card__link"
      href={href}
      onClick={() => trackGalleryItemOpen(galleryItemId)}
    />
  );
}

export function GalleryItemOpenButton({
  galleryItemId,
  href,
}: GalleryItemOpenButtonProps) {
  return (
    <Button
      className="gallery-card__open"
      view="outlined"
      size="s"
      href={href}
      onClick={() => trackGalleryItemOpen(galleryItemId)}
    >
      Open
    </Button>
  );
}

function trackGalleryItemOpen(galleryItemId: string) {
  trackGoal("gallery_item_opened", buildGalleryItemOpenedParams(galleryItemId));
}
