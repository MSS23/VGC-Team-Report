/**
 * Enhanced input validation utilities for API security.
 */

/** Validate IP address format */
function isValidIp(ip: string): boolean {
  // IPv4
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)) {
    return ip.split(".").every((octet) => {
      const n = parseInt(octet, 10);
      return n >= 0 && n <= 255;
    });
  }
  // IPv6 (simplified check)
  if (/^[0-9a-fA-F:]+$/.test(ip) && ip.includes(":")) return true;
  return false;
}

/**
 * Strip surrounding brackets and a trailing port from a raw header value so
 * common proxy encodings normalize to a bare address:
 *   "[::1]:8080"  -> "::1"   (bracketed IPv6 with port)
 *   "1.2.3.4:8080" -> "1.2.3.4" (IPv4 with port)
 * A plain IPv6 (multiple colons, no brackets) is left untouched.
 */
function normalizeIp(raw: string): string {
  const ip = raw.trim();
  if (!ip) return "";
  if (ip.startsWith("[")) {
    const end = ip.indexOf("]");
    if (end !== -1) return ip.slice(1, end);
  }
  // IPv4 with a port has exactly one colon; strip it. IPv6 has 2+ colons.
  if (ip.includes(".") && ip.split(":").length === 2) {
    return ip.split(":")[0] ?? ip;
  }
  return ip;
}

/**
 * Extract a client identifier for rate limiting.
 *
 * Prefers a validated IP from x-forwarded-for (left-most = originating
 * client), then x-real-ip. When no valid IP is present, falls back to a
 * coarse fingerprint built from other request headers so unrelated clients
 * don't all share a single bucket.
 *
 * NOTE: as a last resort this still returns the literal "unknown", and every
 * client that presents no usable identifying header collapses into that one
 * bucket. Sensitive routes should therefore treat an "unknown" identifier as
 * always rate-limited rather than trusting it to isolate a single caller.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    for (const part of forwarded.split(",")) {
      const ip = normalizeIp(part);
      if (ip && isValidIp(ip)) return ip;
    }
  }

  const realIp = normalizeIp(request.headers.get("x-real-ip") ?? "");
  if (realIp && isValidIp(realIp)) return realIp;

  // No valid IP — derive a granular-ish identifier from available headers so
  // callers behind a stripped/missing x-forwarded-for don't collapse into one
  // bucket. Not spoof-proof, but strictly better than a single shared key.
  const fingerprint = [
    request.headers.get("user-agent"),
    request.headers.get("accept-language"),
    request.headers.get("sec-ch-ua"),
  ]
    .filter(Boolean)
    .join("|");
  if (fingerprint) return `fp:${fingerprint}`;

  return "unknown";
}

/** Validate content type matches expected value */
export function hasValidContentType(request: Request, expected: string = "application/json"): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes(expected);
}
