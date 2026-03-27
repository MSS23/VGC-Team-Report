import { Redis } from "@upstash/redis";

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
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis();
    if (!r) return null;
    return await r.get<T>(key);
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
