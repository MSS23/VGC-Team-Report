import type { CSSProperties } from "react";
import type { ExportMode } from "@/components/ui/PdfExport";

/**
 * Inline style for the off-screen #print-container, moved verbatim out of
 * HomePageClient.tsx. Tournament sheet exports pin the chosen theme's colour
 * tokens on the container so the PNG matches it regardless of the page theme;
 * all-slides PDF export uses the page's own styles (undefined).
 */
export function printContainerStyle(exportMode: ExportMode, exportTheme: "light" | "dark"): CSSProperties | undefined {
  return (exportMode === "tournament-evs" || exportMode === "tournament-stats") ? {
    backgroundColor: exportTheme === "dark" ? "#0B0B1A" : "#FAF9F6",
    padding: "16px",
    colorAdjust: "exact",
    WebkitPrintColorAdjust: "exact",
    printColorAdjust: "exact",
    ...exportTheme === "dark" ? {
      "--background": "#0B0B1A", "--foreground": "#F0EDE6",
      "--surface": "#141428", "--surface-alt": "#1C1C38",
      "--border": "#2A2A52", "--border-subtle": "#222244",
      "--text-primary": "#F0EDE6", "--text-secondary": "#C0C0D8", "--text-tertiary": "#9898B8",
      "--accent": "#FB7185", "--accent-light": "#FDA4AF", "--accent-surface": "#3B1525",
      "--accent-foreground": "#0B0B1A",
      "--color-background": "#0B0B1A", "--color-foreground": "#F0EDE6",
      "--color-surface": "#141428", "--color-surface-alt": "#1C1C38",
      "--color-border": "#2A2A52", "--color-border-subtle": "#222244",
      "--color-text-primary": "#F0EDE6", "--color-text-secondary": "#C0C0D8", "--color-text-tertiary": "#9898B8",
      "--color-accent": "#FB7185", "--color-accent-light": "#FDA4AF", "--color-accent-surface": "#3B1525",
      "--color-accent-foreground": "#0B0B1A",
    } as CSSProperties : {
      "--background": "#FAF9F6", "--foreground": "#1A1A2E",
      "--surface": "#FFFFFF", "--surface-alt": "#F2F0EB",
      "--border": "#E0DDD5", "--border-subtle": "#F0EDE6",
      "--text-primary": "#1A1A2E", "--text-secondary": "#4A4A68", "--text-tertiary": "#6E6E8A",
      "--accent": "#DF1D47", "--accent-light": "#FDA4AF", "--accent-surface": "#FFF1F2",
      "--accent-foreground": "#FFFFFF",
      "--color-background": "#FAF9F6", "--color-foreground": "#1A1A2E",
      "--color-surface": "#FFFFFF", "--color-surface-alt": "#F2F0EB",
      "--color-border": "#E0DDD5", "--color-border-subtle": "#F0EDE6",
      "--color-text-primary": "#1A1A2E", "--color-text-secondary": "#4A4A68", "--color-text-tertiary": "#6E6E8A",
      "--color-accent": "#DF1D47", "--color-accent-light": "#FDA4AF", "--color-accent-surface": "#FFF1F2",
      "--color-accent-foreground": "#FFFFFF",
    } as CSSProperties,
  } : undefined;
}
