/** Browser push services only: never let a stored endpoint become an SSRF proxy. */
export function isAllowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname;
    return url.protocol === "https:" && !url.port && !url.username && !url.password && (
      host === "fcm.googleapis.com" || host === "web.push.apple.com" ||
      host.endsWith(".push.services.mozilla.com") || host.endsWith(".notify.windows.com")
    );
  } catch { return false; }
}
