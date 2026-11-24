import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisSet = vi.hoisted(() => vi.fn());

vi.mock("@upstash/redis", () => ({
  Redis: class {
    set = redisSet;
  },
}));

/** cache.ts memoises its Redis client, so each case gets a fresh module. */
async function loadCache() {
  vi.resetModules();
  return await import("@/lib/cache");
}

beforeEach(() => {
  redisSet.mockReset();
  process.env.UPSTASH_REDIS_REST_URL = "https://upstash.test";
  process.env.UPSTASH_REDIS_REST_TOKEN = "token-not-a-real-one";
});

afterEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  vi.restoreAllMocks();
});

describe("cacheSetIfAbsentResult", () => {
  it("reports 'acquired' when SET NX takes the key", async () => {
    redisSet.mockResolvedValue("OK");
    const { cacheSetIfAbsentResult } = await loadCache();
    await expect(cacheSetIfAbsentResult("clerk:svix:msg_1", 300)).resolves.toBe("acquired");
    expect(redisSet).toHaveBeenCalledWith("clerk:svix:msg_1", 1, { ex: 300, nx: true });
  });

  it("reports 'exists' when the key is already held", async () => {
    redisSet.mockResolvedValue(null);
    const { cacheSetIfAbsentResult } = await loadCache();
    await expect(cacheSetIfAbsentResult("clerk:svix:msg_1", 300)).resolves.toBe("exists");
  });

  it("reports 'error' — NOT 'exists' — when Redis throws, so callers can tell a blip from a duplicate", async () => {
    redisSet.mockRejectedValue(new Error("upstash unavailable"));
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    const { cacheSetIfAbsentResult } = await loadCache();
    await expect(cacheSetIfAbsentResult("clerk:svix:msg_1", 300)).resolves.toBe("error");
    expect(warn).toHaveBeenCalled();
    // Diagnosable (namespace + cause) without logging the delivery id itself.
    const logged = JSON.stringify(warn.mock.calls);
    expect(logged).toContain("clerk");
    expect(logged).toContain("upstash unavailable");
    expect(logged).not.toContain("msg_1");
  });

  it("reports 'acquired' when Redis is not configured, so local dev still runs the side-effect", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { cacheSetIfAbsentResult } = await loadCache();
    await expect(cacheSetIfAbsentResult("view:abc:sess", 600)).resolves.toBe("acquired");
    expect(redisSet).not.toHaveBeenCalled();
  });
});

describe("cacheSetIfAbsent (fail-closed boolean wrapper)", () => {
  it("is true only when the key was acquired", async () => {
    const { cacheSetIfAbsent } = await loadCache();
    redisSet.mockResolvedValue("OK");
    await expect(cacheSetIfAbsent("view:abc:sess", 600)).resolves.toBe(true);
    redisSet.mockResolvedValue(null);
    await expect(cacheSetIfAbsent("view:abc:sess", 600)).resolves.toBe(false);
  });

  it("stays fail-closed on a Redis error (view counts must not stampede the DB)", async () => {
    redisSet.mockRejectedValue(new Error("upstash unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { cacheSetIfAbsent } = await loadCache();
    await expect(cacheSetIfAbsent("view:abc:sess", 600)).resolves.toBe(false);
  });
});
