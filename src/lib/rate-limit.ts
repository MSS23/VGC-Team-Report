// NOTE: In-memory rate limiting is per-instance on serverless platforms like Vercel.
// It provides basic burst protection within a single warm instance but does not
// guarantee global rate limiting across all concurrent function invocations.
// For stricter enforcement, use Upstash Redis or Vercel's built-in rate limiting.
const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * Returns true if the request should be BLOCKED.
 */
export function isRateLimited(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;

  // Lazy cleanup: remove expired entries when map grows large
  if (hits.size > 10_000) {
    for (const [k, e] of hits) {
      if (now > e.resetAt) hits.delete(k);
    }
  }

  return entry.count > maxRequests;
}
