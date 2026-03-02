"use client";

import { useRef, useCallback, useState } from "react";

type ExportStatus = "idle" | "exporting" | "done" | "error" | "exporting-all";

export function useExportSlide() {
  const slideRef = useRef<HTMLDivElement>(null);
  const [exportStatus, setExportStatus] = useState<ExportStatus>("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });

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

  const exportAllSlides = useCallback(async (
    totalSlides: number,
    goToSlide: (index: number) => void,
    slideLabels: string[],
  ) => {
    if (!slideRef.current) return;

    setExportStatus("exporting-all");
    setExportError(null);
    setExportProgress({ current: 0, total: totalSlides });

    try {
      const { toPng } = await import("html-to-image");
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const bgColor = getComputedStyle(document.documentElement)
        .getPropertyValue("--color-background")
        .trim() || "#ffffff";

      for (let i = 0; i < totalSlides; i++) {
        goToSlide(i);
        setExportProgress({ current: i + 1, total: totalSlides });

        // Wait for the slide to render
        await new Promise((r) => setTimeout(r, 400));

        if (!slideRef.current) continue;

        const dataUrl = await toPng(slideRef.current, {
          pixelRatio: 2,
          backgroundColor: bgColor,
          skipFonts: true,
        });

        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const label = slideLabels[i]?.replace(/[^a-zA-Z0-9]/g, "-") || `slide`;
        zip.file(`${String(i + 1).padStart(2, "0")}-${label}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.download = "team-report.zip";
      link.href = URL.createObjectURL(zipBlob);
      link.click();
      URL.revokeObjectURL(link.href);

      setExportStatus("done");
      setTimeout(() => setExportStatus("idle"), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to export slides";
      setExportError(message);
      setExportStatus("error");
      setTimeout(() => { setExportStatus("idle"); setExportError(null); }, 3000);
    }
  }, []);

  return { slideRef, exportAsPng, exportAllSlides, exportStatus, exportError, exportProgress };
}
