/**
 * True while the URL is a shared report (/s/{id}). The persist effects check
 * this as a belt-and-suspenders guard so a shared team is never written into
 * the viewer's own localStorage (see the SECURITY note in useHomePage).
 */
export function isSharePath(): boolean {
  return typeof window !== "undefined" && window.location.pathname.startsWith("/s/");
}
