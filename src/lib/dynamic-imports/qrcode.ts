/**
 * Singleton dynamic-import wrapper around `qrcode`.
 *
 * Every consumer that calls `getQRCode()` shares the same promise (and
 * therefore the same webpack chunk), so the library only ships once even
 * when multiple components render a QR (OTS modal + team-overview rental code).
 *
 * Without this, each `await import("qrcode")` call at a different source
 * location creates its own async chunk in Next.js's build output.
 */
// The `qrcode` package uses namespace exports (no default export in the
// types), so we keep the whole namespace as the singleton and let consumers
// call `(await getQRCode()).toDataURL(...)`.
let qrcodePromise: Promise<typeof import("qrcode")> | null = null;

export function getQRCode(): Promise<typeof import("qrcode")> {
  if (!qrcodePromise) {
    qrcodePromise = import("qrcode");
  }
  return qrcodePromise;
}
