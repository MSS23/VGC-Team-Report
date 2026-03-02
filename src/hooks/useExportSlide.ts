"use client";

import { useRef, useCallback } from "react";
import { toPng } from "html-to-image";

export function useExportSlide() {
  const slideRef = useRef<HTMLDivElement>(null);

  const exportAsPng = useCallback(async (filename: string) => {
    if (!slideRef.current) return;

    try {
      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-background")
        .trim() || "#ffffff";

      const dataUrl = await toPng(slideRef.current, {
        pixelRatio: 2,
        backgroundColor: bgColor,
        skipFonts: true,
      });

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch {
      // Image export can fail due to CORS on external sprites — silently ignore
    }
  }, []);

  return { slideRef, exportAsPng };
}
