import { describe, it, expect } from "vitest";
import { apiGuard } from "@/lib/security/api-guard";

// ---------------------------------------------------------------------------
// apiGuard (VGC-6.1 security guards). No Upstash env vars are set in the test
// environment, so the rate limiter transparently uses its in-memory fallback —
// no mocking required. The in-memory hit map is module-global and keyed by
// "<key>:<ip>", so each test uses a UNIQUE client IP to stay isolated.
// ---------------------------------------------------------------------------

let ipCounter = 0;
/** Fresh, valid, unique client IP per call so rate-limit buckets don't collide. */
function uniqueIp(): string {
  ipCounter += 1;
  const a = 10 + Math.floor(ipCounter / 256);
  const b = ipCounter % 256;
  return `10.${a}.${b}.1`;
}

function makeRequest(opts: {
  ip?: string;
  method?: string;
  contentType?: string;
  contentLength?: number;
} = {}): Request {
  const headers: Record<string, string> = {};
  headers["x-forwarded-for"] = opts.ip ?? uniqueIp();
  if (opts.contentType) headers["content-type"] = opts.contentType;
  if (opts.contentLength !== undefined) headers["content-length"] = String(opts.contentLength);
  return new Request("http://localhost/api/thing", {
    method: opts.method ?? "GET",
    headers,
  });
}

describe("apiGuard", () => {
  describe("rate limiting", () => {
    it("returns null (passes) while under the limit", async () => {
      const ip = uniqueIp();
      const opts = { rateLimit: { key: "share", max: 3 } };
      expect(await apiGuard(makeRequest({ ip }), opts)).toBeNull();
      expect(await apiGuard(makeRequest({ ip }), opts)).toBeNull();
      expect(await apiGuard(makeRequest({ ip }), opts)).toBeNull();
    });

    it("returns a 429 response once the limit is exceeded", async () => {
      const ip = uniqueIp();
      const opts = { rateLimit: { key: "share", max: 2 } };
      await apiGuard(makeRequest({ ip }), opts); // 1
      await apiGuard(makeRequest({ ip }), opts); // 2
      const blocked = await apiGuard(makeRequest({ ip }), opts); // 3 -> blocked

      expect(blocked).not.toBeNull();
      expect(blocked!.status).toBe(429);
      expect(blocked!.headers.get("Retry-After")).toBe("60");
      const body = await blocked!.json();
      expect(body).toEqual({ error: "Too many requests. Please try again later." });
    });

    it("isolates buckets per client IP", async () => {
      const opts = { rateLimit: { key: "share", max: 1 } };
      const ipA = uniqueIp();
      const ipB = uniqueIp();
      expect(await apiGuard(makeRequest({ ip: ipA }), opts)).toBeNull(); // A: 1
      expect(await apiGuard(makeRequest({ ip: ipB }), opts)).toBeNull(); // B: 1 (independent)
      expect((await apiGuard(makeRequest({ ip: ipA }), opts))!.status).toBe(429); // A blocked
    });

    it("namespaces buckets by rate-limit key for the same IP", async () => {
      const ip = uniqueIp();
      expect(await apiGuard(makeRequest({ ip }), { rateLimit: { key: "read", max: 1 } })).toBeNull();
      // Different key => different bucket, so this is still the first hit.
      expect(await apiGuard(makeRequest({ ip }), { rateLimit: { key: "write", max: 1 } })).toBeNull();
    });
  });

  describe("content-type enforcement", () => {
    it("rejects POST without application/json when requireContentType is set", async () => {
      const res = await apiGuard(
        makeRequest({ method: "POST", contentType: "text/plain" }),
        { requireContentType: true },
      );
      expect(res).not.toBeNull();
      expect(res!.status).toBe(415);
      expect((await res!.json()).error).toBe("Content-Type must be application/json");
    });

    it("passes POST with application/json", async () => {
      const res = await apiGuard(
        makeRequest({ method: "POST", contentType: "application/json" }),
        { requireContentType: true },
      );
      expect(res).toBeNull();
    });

    it("does not enforce content-type on GET requests", async () => {
      const res = await apiGuard(makeRequest({ method: "GET" }), { requireContentType: true });
      expect(res).toBeNull();
    });
  });

  describe("body size limit", () => {
    it("returns 413 when content-length exceeds maxBodySize", async () => {
      const res = await apiGuard(
        makeRequest({ method: "POST", contentType: "application/json", contentLength: 5000 }),
        { maxBodySize: 1000 },
      );
      expect(res).not.toBeNull();
      expect(res!.status).toBe(413);
      expect((await res!.json()).error).toBe("Request too large");
    });

    it("passes when content-length is within maxBodySize", async () => {
      const res = await apiGuard(
        makeRequest({ method: "POST", contentType: "application/json", contentLength: 100 }),
        { maxBodySize: 1000 },
      );
      expect(res).toBeNull();
    });
  });

  it("returns null when no guard options are triggered", async () => {
    expect(await apiGuard(makeRequest(), {})).toBeNull();
  });
});
