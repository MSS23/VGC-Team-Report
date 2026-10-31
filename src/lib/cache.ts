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
 * Atomic set-if-absent with TTL. Returns true if the key was set (first
 * call within the window), false if it already existed. Used for cross-
 * Lambda dedup (e.g. view-count rate limiting per session) without keeping
 * a serverless function warm via setInterval.
 *
 * Unconfigured Redis (no env vars, e.g. local dev) returns true so the
 * caller's side-effect still runs. A Redis ERROR returns false — failing
 * open there would turn an Upstash outage into one dedup-free DB write per
 * pageview on the hottest path (the share_versions incident shape).
 */
export async function cacheSetIfAbsent(key: string, ttlSeconds: number): Promise<boolean> {
  try {
    const r = getRedis();
    if (!r) return true;
    const res = await r.set(key, 1, { ex: ttlSeconds, nx: true });
    return res === "OK";
  } catch {
    return false;
  }
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
