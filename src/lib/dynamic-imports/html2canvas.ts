/**
 * Singleton dynamic-import wrapper around `html2canvas-pro`.
 *
 * Every consumer that calls `getHtml2Canvas()` shares the same promise (and
 * therefore the same webpack chunk), so the ~400 KB raw / ~60 KB gzipped
 * library only ships once even when multiple components export to PNG.
 *
 * Without this, each `await import("html2canvas-pro")` call at a different
 * source location creates its own async chunk in Next.js's build output.
 */
let html2canvasPromise: Promise<typeof import("html2canvas-pro").default> | null = null;

export function getHtml2Canvas(): Promise<typeof import("html2canvas-pro").default> {
  if (!html2canvasPromise) {
    html2canvasPromise = import("html2canvas-pro").then((m) => m.default);
  }
  return html2canvasPromise;
}
