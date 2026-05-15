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
 * Extract client IP safely with validation.
 * Checks x-forwarded-for, then falls back to "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim() ?? "";
    if (ip && isValidIp(ip)) return ip;
  }
  return "unknown";
}

/** Validate content type matches expected value */
export function hasValidContentType(request: Request, expected: string = "application/json"): boolean {
  const contentType = request.headers.get("content-type") ?? "";
  return contentType.includes(expected);
}
