import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isRateLimitedAsync } from "@/lib/rate-limit";

/**
 * These tests cover the in-memory sliding-window fallback in rate-limit.ts.
 *
 * They used to call the synchronous `isRateLimited`, which had no production
 * callers left — every route uses `isRateLimitedAsync`. Deleting the dead
 * export would have silently deleted the only coverage of the window logic, so
 * the tests were retargeted onto the async path first (VGC-273).
 *
 * `isRateLimitedAsync` only reaches Upstash when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set. They are not set under vitest, so `redis`
 * is null at module load and these exercise exactly the same
 * `isRateLimitedInMemory` code the old tests did — now via the path production
 * actually takes.
 */
describe("isRateLimitedAsync (in-memory fallback)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not use Upstash when the env vars are absent", () => {
    // Guards the premise of every test below: if Upstash were configured, these
    // would be hitting the network instead of the in-memory window.
    expect(process.env.UPSTASH_REDIS_REST_URL).toBeFalsy();
    expect(process.env.UPSTASH_REDIS_REST_TOKEN).toBeFalsy();
  });

  it("allows first request", async () => {
    expect(await isRateLimitedAsync("test-unique-1", 3, 60000)).toBe(false);
  });

  it("allows requests up to the limit", async () => {
    const key = "test-unique-2";
    expect(await isRateLimitedAsync(key, 3, 60000)).toBe(false); // 1
    expect(await isRateLimitedAsync(key, 3, 60000)).toBe(false); // 2
    expect(await isRateLimitedAsync(key, 3, 60000)).toBe(false); // 3
  });

  it("blocks requests over the limit", async () => {
    const key = "test-unique-3";
    await isRateLimitedAsync(key, 2, 60000); // 1
    await isRateLimitedAsync(key, 2, 60000); // 2
    expect(await isRateLimitedAsync(key, 2, 60000)).toBe(true); // 3 -> blocked
  });

  it("resets after window expires", async () => {
    const key = "test-unique-4";
    await isRateLimitedAsync(key, 1, 1000); // 1 - allowed
    expect(await isRateLimitedAsync(key, 1, 1000)).toBe(true); // 2 - blocked

    vi.advanceTimersByTime(1001);
    expect(await isRateLimitedAsync(key, 1, 1000)).toBe(false); // reset - allowed
  });

  it("tracks different keys independently", async () => {
    expect(await isRateLimitedAsync("key-a", 1, 60000)).toBe(false);
    expect(await isRateLimitedAsync("key-b", 1, 60000)).toBe(false);
    expect(await isRateLimitedAsync("key-a", 1, 60000)).toBe(true); // key-a blocked
    expect(await isRateLimitedAsync("key-b", 1, 60000)).toBe(true); // key-b blocked
  });
});
