import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

/** Shared options for html2canvas capture */
function captureOptions(element: HTMLElement): Parameters<typeof html2canvas>[1] {
  return {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: getComputedStyle(element).backgroundColor || "#FAF9F6",
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

/**
 * Export a DOM element as a PDF document and trigger download.
 */
export async function exportAsPdf(
  element: HTMLElement,
  filename: string = "vgc-team-report"
): Promise<void> {
  const canvas = await captureWithRetry(element);
  const dataUrl = canvas.toDataURL("image/png", 0.95);

  // Calculate PDF dimensions (A4 width, proportional height)
  const pdfWidth = 210; // A4 width in mm
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  const pdf = new jsPDF({
    orientation: pdfHeight > pdfWidth ? "portrait" : "landscape",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
  });

  pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${filename}.pdf`);
}
