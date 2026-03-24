import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

// 1×1 transparent PNG as placeholder for images that fail to load
const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==";

/** Shared options for html-to-image capture */
function captureOptions(element: HTMLElement) {
  return {
    quality: 0.95,
    pixelRatio: 2,
    cacheBust: true,
    imagePlaceholder: TRANSPARENT_PIXEL,
    backgroundColor: getComputedStyle(element).backgroundColor || "#FAF9F6",
    fetchRequestInit: { cache: "force-cache" as RequestCache },
    filter: (node: HTMLElement) => {
      if (node instanceof HTMLElement) {
        const tag = node.getAttribute?.("data-walkthrough");
        if (tag) return false;
        if (node.classList?.contains("slide-nav-controls")) return false;
        if (node.getAttribute?.("role") === "navigation") return false;
      }
      return true;
    },
  };
}

/**
 * Capture with retries — html-to-image can return blank on the first pass
 * while images are still being fetched & inlined. A second attempt usually
 * succeeds because the images are cached by then.
 */
async function captureWithRetry(
  element: HTMLElement,
  retries = 2,
): Promise<string> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      const dataUrl = await toPng(element, captureOptions(element));
      // Sanity-check: a blank capture is extremely small
      if (dataUrl && dataUrl.length > 1000) return dataUrl;
    } catch (err) {
      lastError = err;
    }
    // Brief pause to let images settle
    if (i < retries) await new Promise((r) => setTimeout(r, 300));
  }
  // Final attempt — let it throw if it still fails
  if (lastError) throw lastError;
  return toPng(element, captureOptions(element));
}

/**
 * Export a DOM element as a PNG image and trigger download.
 */
export async function exportAsImage(
  element: HTMLElement,
  filename: string = "vgc-team-report"
): Promise<void> {
  const dataUrl = await captureWithRetry(element);

  const link = document.createElement("a");
  link.download = `${filename}.png`;
  link.href = dataUrl;
  link.click();
}

/**
 * Export a DOM element as a PDF document and trigger download.
 */
export async function exportAsPdf(
  element: HTMLElement,
  filename: string = "vgc-team-report"
): Promise<void> {
  const dataUrl = await captureWithRetry(element);

  // Load image to get dimensions
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = dataUrl;
  });

  // Calculate PDF dimensions (A4 width, proportional height)
  const pdfWidth = 210; // A4 width in mm
  const pdfHeight = (img.height * pdfWidth) / img.width;

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
}
