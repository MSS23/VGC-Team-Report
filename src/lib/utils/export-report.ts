import { getHtml2Canvas } from "@/lib/dynamic-imports/html2canvas";

/** Resolve the actual background color, respecting dark mode */
function resolveBackground(element: HTMLElement): string {
  // Try the element's own background first
  const elBg = getComputedStyle(element).backgroundColor;
  if (elBg && elBg !== "transparent" && elBg !== "rgba(0, 0, 0, 0)") {
    return elBg;
  }
  // Fall back to the CSS variable --background (set on :root by theme)
  const cssVar = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
  if (cssVar) return cssVar;
  // Final fallback: detect dark mode from class
  const isDark = document.documentElement.classList.contains("dark");
  return isDark ? "#0B0B1A" : "#FAF9F6";
}

/** Shared options for html2canvas capture */
function captureOptions(element: HTMLElement) {
  return {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: resolveBackground(element),
    logging: false,
    removeContainer: true,
    ignoreElements: (node: Element) => {
      if (node instanceof HTMLElement) {
        const tag = node.getAttribute?.("data-walkthrough");
        if (tag) return true;
        if (node.classList?.contains("slide-nav-controls")) return true;
        if (node.getAttribute?.("role") === "navigation") return true;
      }
      return false;
    },
  };
}

/**
 * Capture with retries — first pass can sometimes produce a blank canvas
 * while images are still being fetched. A second attempt usually succeeds.
 */
async function captureWithRetry(
  element: HTMLElement,
  retries = 2,
): Promise<HTMLCanvasElement> {
  const html2canvas = await getHtml2Canvas();
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const canvas = await html2canvas(element, captureOptions(element));
      // Sanity-check: a blank capture has very few non-zero pixels
      const ctx = canvas.getContext("2d");
      if (ctx && canvas.width > 10 && canvas.height > 10) {
        const sample = ctx.getImageData(0, 0, Math.min(canvas.width, 50), Math.min(canvas.height, 50));
        const hasContent = sample.data.some((v, i) => i % 4 !== 3 && v !== 0 && v !== 255);
        if (hasContent) return canvas;
      }
    } catch (err) {
      lastError = err;
    }
    // Brief pause to let images settle
    if (i < retries) await new Promise((r) => setTimeout(r, 500));
  }
  // Final attempt — let it throw if it still fails
  if (lastError) throw lastError;
  return html2canvas(element, captureOptions(element));
}

/**
 * Export a DOM element as a PNG image and trigger download.
 */
export async function exportAsImage(
  element: HTMLElement,
  filename: string = "vgc-team-report"
): Promise<void> {
  const canvas = await captureWithRetry(element);
  const dataUrl = canvas.toDataURL("image/png", 0.95);

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

