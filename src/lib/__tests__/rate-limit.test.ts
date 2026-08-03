import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isRateLimitedAsync } from "@/lib/rate-limit";

// No UPSTASH env vars in test/CI, so isRateLimitedAsync exercises the
// in-memory windowing fallback — the logic these tests cover.
describe("isRateLimitedAsync", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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
