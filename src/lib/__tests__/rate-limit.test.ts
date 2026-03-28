import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows first request", () => {
    expect(isRateLimited("test-unique-1", 3, 60000)).toBe(false);
  });

  it("allows requests up to the limit", () => {
    const key = "test-unique-2";
    expect(isRateLimited(key, 3, 60000)).toBe(false); // 1
    expect(isRateLimited(key, 3, 60000)).toBe(false); // 2
    expect(isRateLimited(key, 3, 60000)).toBe(false); // 3
  });

  it("blocks requests over the limit", () => {
    const key = "test-unique-3";
    isRateLimited(key, 2, 60000); // 1
    isRateLimited(key, 2, 60000); // 2
    expect(isRateLimited(key, 2, 60000)).toBe(true); // 3 -> blocked
  });

  it("resets after window expires", () => {
    const key = "test-unique-4";
    isRateLimited(key, 1, 1000); // 1 - allowed
    expect(isRateLimited(key, 1, 1000)).toBe(true); // 2 - blocked

    vi.advanceTimersByTime(1001);
    expect(isRateLimited(key, 1, 1000)).toBe(false); // reset - allowed
  });

  it("tracks different keys independently", () => {
    expect(isRateLimited("key-a", 1, 60000)).toBe(false);
    expect(isRateLimited("key-b", 1, 60000)).toBe(false);
    expect(isRateLimited("key-a", 1, 60000)).toBe(true); // key-a blocked
    expect(isRateLimited("key-b", 1, 60000)).toBe(true); // key-b blocked
  });
});
