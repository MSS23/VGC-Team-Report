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
  body?: string;
  /** Send the body as a stream with no Content-Length, i.e. Transfer-Encoding: chunked. */
  chunked?: boolean;
} = {}): Request {
  const headers: Record<string, string> = {};
  headers["x-forwarded-for"] = opts.ip ?? uniqueIp();
  if (opts.contentType) headers["content-type"] = opts.contentType;
  if (opts.contentLength !== undefined) headers["content-length"] = String(opts.contentLength);

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    body = opts.chunked
      ? new ReadableStream<Uint8Array>({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(opts.body!));
            controller.close();
          },
        })
      : opts.body;
  }

  // `duplex` is required by undici for stream bodies but is missing from the
  // DOM RequestInit typings.
  const init = {
    method: opts.method ?? "GET",
    headers,
    body,
    duplex: "half",
  } as RequestInit;
  return new Request("http://localhost/api/thing", init);
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

    it("passes a real body that is under the cap", async () => {
      const body = JSON.stringify({ team: "x".repeat(100) });
      const res = await apiGuard(
        makeRequest({
          method: "POST",
          contentType: "application/json",
          contentLength: body.length,
          body,
        }),
        { maxBodySize: 1000 },
      );
      expect(res).toBeNull();
    });

    it("rejects an over-size body with a truthful content-length", async () => {
      const body = "y".repeat(5000);
      const res = await apiGuard(
        makeRequest({
          method: "POST",
          contentType: "application/json",
          contentLength: body.length,
          body,
        }),
        { maxBodySize: 1000 },
      );
      expect(res).not.toBeNull();
      expect(res!.status).toBe(413);
      expect((await res!.json()).error).toBe("Request too large");
    });

    // Regression: chunked-request body-size bypass. A request with
    // Transfer-Encoding: chunked carries no Content-Length, so a guard that
    // trusted the header skipped the cap entirely and let an unbounded body
    // through to /api/share and /api/user/drafts.
    it("rejects an over-size body with NO content-length (chunked bypass)", async () => {
      const res = await apiGuard(
        makeRequest({
          method: "POST",
          contentType: "application/json",
          body: "z".repeat(5000),
          chunked: true,
        }),
        { maxBodySize: 1000 },
      );
      expect(res).not.toBeNull();
      expect(res!.status).toBe(413);
      expect((await res!.json()).error).toBe("Request too large");
    });

    // Regression: the same bypass via a lying header — Content-Length under the
    // cap, actual body far over it.
    it("rejects a body whose content-length lies about being under the cap", async () => {
      const res = await apiGuard(
        makeRequest({
          method: "POST",
          contentType: "application/json",
          contentLength: 10,
          body: "q".repeat(5000),
        }),
        { maxBodySize: 1000 },
      );
      expect(res).not.toBeNull();
      expect(res!.status).toBe(413);
      expect((await res!.json()).error).toBe("Request too large");
    });

    it("leaves the body readable for the route after measuring it", async () => {
      const payload = { team: "Incineroar", sp: 66 };
      const body = JSON.stringify(payload);
      const request = makeRequest({
        method: "POST",
        contentType: "application/json",
        body,
        chunked: true,
      });

      expect(await apiGuard(request, { maxBodySize: 1000 })).toBeNull();
      expect(await request.json()).toEqual(payload);
      // ...and a second accessor still works, as before the guard ran.
      expect(await request.text()).toBe(body);
    });

    it("does not touch the body when no maxBodySize is configured", async () => {
      const body = "a".repeat(5000);
      const request = makeRequest({ method: "POST", contentType: "application/json", body });
      expect(await apiGuard(request, { requireContentType: true })).toBeNull();
      expect(request.bodyUsed).toBe(false);
      expect(await request.text()).toBe(body);
    });
  });

  it("returns null when no guard options are triggered", async () => {
    expect(await apiGuard(makeRequest(), {})).toBeNull();
  });
});
