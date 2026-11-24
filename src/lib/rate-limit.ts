import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Upstash Redis distributed rate limiter ──────────────────────
// Uses sliding window algorithm for accurate distributed limiting.
// Falls back to in-memory when UPSTASH env vars are not set.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Cache of Ratelimit instances keyed by "max:windowMs"
const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(maxRequests: number, windowMs: number): Ratelimit {
  const key = `${maxRequests}:${windowMs}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSec} s`),
      prefix: "ratelimit",
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// ── In-memory fallback (per-instance on serverless) ─────────────
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimitedInMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;

  if (hits.size > 10_000) {
    for (const [k, e] of hits) {
      if (now > e.resetAt) hits.delete(k);
    }
  }

  return entry.count > maxRequests;
}

// ── Public API (unchanged signature) ────────────────────────────

/**
 * Rate limiter with Upstash Redis for distributed enforcement.
 * Falls back to in-memory when Upstash is not configured.
 * Returns true if the request should be BLOCKED.
 */
export async function isRateLimitedAsync(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000,
): Promise<boolean> {
  if (redis) {
    const limiter = getUpstashLimiter(maxRequests, windowMs);
    const { success } = await limiter.limit(key);
    return !success;
  }
  return isRateLimitedInMemory(key, maxRequests, windowMs);
}

