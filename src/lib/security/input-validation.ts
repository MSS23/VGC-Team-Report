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
 * Extract a client identifier for rate limiting and anti-abuse dedupe.
 *
 * SECURITY — read before changing the header order below.
 *
 * `X-Forwarded-For` is append-only: each proxy appends the peer address it
 * actually observed to whatever the client already sent. The LEFT-most entry
 * is therefore pure, unverified client input — a caller can put any value
 * there — while the RIGHT-most entry is the one appended by the proxy closest
 * to us (on Vercel, Vercel's own edge). This app is deployed behind exactly
 * one trusted proxy, so the right-most entry is the only trustworthy one.
 *
 * Trusting the left-most entry (the behaviour this function used to have) let
 * an unauthenticated caller mint an unlimited number of distinct identities by
 * rotating a forged header, which:
 *   - defeated `comment_flags`' UNIQUE(comment_id, session_id) dedupe, so three
 *     requests could push any comment past FLAG_THRESHOLD and delete it; and
 *   - voided every rate limit, since `apiGuard` keys its buckets on this value.
 * See the regression tests in `__tests__/input-validation.test.ts`.
 *
 * Order of preference:
 *   1. `x-vercel-forwarded-for` / `x-real-ip` — set (and overwritten) by the
 *      Vercel proxy itself, so a client-supplied value never survives to here.
 *   2. The right-most `x-forwarded-for` entry — and ONLY the right-most. We do
 *      not scan leftwards for the first parseable address: that would let a
 *      caller reinstate the spoof by appending junk, and it would amount to
 *      trusting an arbitrary number of hops we don't control.
 *   3. A coarse header fingerprint, so clients behind a stripped
 *      x-forwarded-for don't all collapse into one bucket.
 *
 * NOTE: as a last resort this still returns the literal "unknown", and every
 * client that presents no usable identifying header collapses into that one
 * bucket. Sensitive routes should therefore treat an "unknown" identifier as
 * always rate-limited rather than trusting it to isolate a single caller.
 */
export function getClientIp(request: Request): string {
  // 1. Platform-set headers — not client-controllable behind Vercel's proxy.
  for (const header of ["x-vercel-forwarded-for", "x-real-ip"]) {
    const ip = normalizeIp(request.headers.get(header) ?? "");
    if (ip && isValidIp(ip)) return ip;
  }

  // 2. Right-most x-forwarded-for entry = appended by the nearest trusted proxy.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    const ip = normalizeIp(parts[parts.length - 1] ?? "");
    if (ip && isValidIp(ip)) return ip;
  }

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
