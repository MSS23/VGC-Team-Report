import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/**
 * Export a DOM element as a PNG image and trigger download.
 */
export async function exportAsImage(
  element: HTMLElement,
  filename: string = "vgc-team-report"
): Promise<void> {
  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio: 2, // High-res export
    backgroundColor: getComputedStyle(element).backgroundColor || "#FAF9F6",
    filter: (node) => {
      // Skip nav controls, walkthrough overlays, and other UI chrome
      if (node instanceof HTMLElement) {
        const tag = node.getAttribute?.("data-walkthrough");
        if (tag) return false;
        if (node.classList?.contains("slide-nav-controls")) return false;
        if (node.getAttribute?.("role") === "navigation") return false;
      }
      return true;
    },
  });

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
  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: getComputedStyle(element).backgroundColor || "#FAF9F6",
    filter: (node) => {
      if (node instanceof HTMLElement) {
        const tag = node.getAttribute?.("data-walkthrough");
        if (tag) return false;
        if (node.classList?.contains("slide-nav-controls")) return false;
        if (node.getAttribute?.("role") === "navigation") return false;
      }
      return true;
    },
  });

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
