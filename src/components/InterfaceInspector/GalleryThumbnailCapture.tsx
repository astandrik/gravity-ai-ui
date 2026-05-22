"use client";

import { useEffect, useRef } from "react";
import type { ComposedInterfacePayload } from "@/lib/agent/composedInterface";
import { InterfacePreview } from "./InterfaceInspector";

export function GalleryThumbnailCapture({
  payload,
}: {
  payload: ComposedInterfacePayload;
}) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let frames = 0;
    frameRef.current?.removeAttribute("data-gallery-thumbnail-ready");

    const checkReady = () => {
      if (cancelled) {
        return;
      }

      frames += 1;
      const hasSurface = Boolean(
        frameRef.current?.querySelector(".interface-surface"),
      );

      if (hasSurface || frames >= 120) {
        frameRef.current?.setAttribute("data-gallery-thumbnail-ready", "true");
        return;
      }

      requestAnimationFrame(checkReady);
    };

    requestAnimationFrame(checkReady);

    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div
      className="gallery-thumbnail-capture"
      data-gallery-thumbnail-capture
      ref={frameRef}
    >
      <InterfacePreview eagerClientRender payload={payload} />
    </div>
  );
}
