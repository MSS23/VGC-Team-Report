"use client";

import { useRef, useCallback, useState } from "react";

type ExportStatus = "idle" | "exporting" | "done" | "error";

export function useExportSlide() {
  const slideRef = useRef<HTMLDivElement>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [exportError, setExportError] = useState<string | null>(null);

  const exportAsPng = useCallback(async (filename: string) => {
    if (!slideRef.current) return;

    setExportStatus("exporting");
    setExportError(null);

    try {
      const { toPng } = await import("html-to-image");

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

      setExportStatus("done");
      setTimeout(() => setExportStatus("idle"), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export image";
      setExportError(message);
      setExportStatus("error");
      setTimeout(() => { setExportStatus("idle"); setExportError(null); }, 3000);
    }
  }, []);

  return { slideRef, exportAsPng, exportStatus, exportError };
}
