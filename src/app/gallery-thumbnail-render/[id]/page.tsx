import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryThumbnailCapture } from "@/components/InterfaceInspector/GalleryThumbnailCapture";
import { getPublishedDesignById } from "@/lib/feedback/ydbFeedbackStore";

import "./thumbnail.scss";

type GalleryThumbnailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function GalleryThumbnailPage({
  params,
}: GalleryThumbnailPageProps) {
  const { id } = await params;
  const design = await getPublishedDesignById(id).catch(() => null);

  if (!design) {
    notFound();
  }

  return (
    <main className="gallery-thumbnail-render-shell">
      <GalleryThumbnailCapture payload={design.payload} />
    </main>
  );
}
