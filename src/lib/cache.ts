import { Redis } from "@upstash/redis";
import type { ZodType } from "zod";

/**
 * Upstash Redis cache layer.
 * Falls back gracefully to no-cache when UPSTASH_REDIS_REST_URL is not set.
 */

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

/**
 * Get a cached value. Returns null on miss or if Redis is unavailable.
 *
 * Pass a Zod schema to validate the cached payload at runtime — stale
 * entries that no longer match the current shape will be returned as null
 * (cache miss) rather than silently propagating the wrong type. Without
 * a schema, the value is returned as-is and the generic is just an
 * unchecked cast (VGC-146).
 */
export async function cacheGet<T>(key: string, schema?: ZodType<T>): Promise<T | null> {
  try {
    const r = getRedis();
    if (!r) return null;
    const raw = await r.get<unknown>(key);
    if (raw === null || raw === undefined) return null;
    if (!schema) return raw as T;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with TTL in seconds.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    await r.set(key, value, { ex: ttlSeconds });
  } catch {
    // Cache write failure is non-fatal
  }
}

/**
 * Outcome of an atomic set-if-absent. The error case is explicit because
 * "the key already existed" and "I could not reach Redis to find out" are
 * different facts and some callers must not conflate them.
 *
 * - `"acquired"` — the key was set (first call within the TTL window), or
 *   Redis is not configured (no env vars, e.g. local dev) so the caller's
 *   side-effect should still run.
 * - `"exists"` — the key was already there: a genuine dedup hit.
 * - `"error"` — Redis threw / timed out / rate-limited. Duplicate-ness is
 *   UNKNOWN. The caller decides which direction is safe for it.
 */
export type SetIfAbsentResult = "acquired" | "exists" | "error";

/**
 * Atomic set-if-absent with TTL, reporting the error case separately. Used
 * for cross-Lambda dedup (view-count rate limiting per session, webhook
 * idempotency keys) without keeping a serverless function warm via
 * setInterval.
 */
export async function cacheSetIfAbsentResult(
  key: string,
  ttlSeconds: number,
): Promise<SetIfAbsentResult> {
  try {
    const r = getRedis();
    if (!r) return "acquired";
    const res = await r.set(key, 1, { ex: ttlSeconds, nx: true });
    return res === "OK" ? "acquired" : "exists";
  } catch (e) {
    // Namespace only: the rest of the key can carry a session id or a webhook
    // delivery id, and this line lands in shared logs. The prefix plus the
    // error message is enough to recognise an Upstash outage.
    console.error("cacheSetIfAbsent failed — Redis unavailable, dedup state unknown", {
      keyPrefix: key.split(":")[0],
      error: e instanceof Error ? e.message : String(e),
    });
    return "error";
  }
}

/**
 * Fail-CLOSED boolean wrapper over {@link cacheSetIfAbsentResult}: `true`
 * only when the key was genuinely acquired, so a Redis error suppresses the
 * caller's side-effect.
 *
 * Use this only where suppression is the safe direction — view-count dedup
 * and the og-image render lock — because failing open there would turn an
 * Upstash outage into one dedup-free DB write per pageview on the hottest
 * path (the share_versions incident shape). Any caller whose side-effect must
 * NOT be silently dropped (webhook idempotency guards) must call
 * `cacheSetIfAbsentResult` and handle `"error"` deliberately.
 */
export async function cacheSetIfAbsent(key: string, ttlSeconds: number): Promise<boolean> {
  return (await cacheSetIfAbsentResult(key, ttlSeconds)) === "acquired";
}

/**
 * Delete a cached key (invalidation).
 */
export async function cacheDel(key: string): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    await r.del(key);
  } catch {
    // Cache delete failure is non-fatal
  }
}

/**
 * Delete all keys matching a prefix pattern.
 */
export async function cacheInvalidatePrefix(prefix: string): Promise<void> {
  try {
    const r = getRedis();
    if (!r) return;
    let cursor = 0;
    do {
      const result = await r.scan(cursor, { match: `${prefix}*`, count: 100 });
      cursor = Number(result[0]);
      const keys = result[1] as string[];
      if (keys.length > 0) {
        await r.del(...keys);
      }
    } while (cursor !== 0);
  } catch {
    // Non-fatal
  }
}

// ── Cache key builders ─────────────────────────────────────────────

export const CacheKeys = {
  explore: (params: string) => `explore:${params}`,
  share: (id: string) => `share:${id}`,
  spotlight: () => "spotlight",
  topPokemon: () => "top-pokemon",
} as const;

// ── TTLs (seconds) ─────────────────────────────────────────────────

export const CacheTTL = {
  EXPLORE_LIST: 60,         // 1 minute — explore page results
  SHARE_PUBLIC: 300,        // 5 minutes — individual public shares
  SPOTLIGHT: 300,           // 5 minutes — spotlight/featured
  TOP_POKEMON: 600,         // 10 minutes — usage stats
} as const;
