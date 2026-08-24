import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

// Mock every boundary the handler touches. The Ed25519 verify is mocked
// because the route pins Discord's real application public key, so no test
// can produce a genuinely valid signature for it — what we're asserting here
// is the freshness/rate-limit logic that wraps the verify, not nacl itself.
const verify = vi.fn(() => true);
vi.mock("tweetnacl", () => ({
  default: { sign: { detached: { verify: (...args: unknown[]) => verify(...(args as [])) } } },
}));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/fetch-with-timeout", () => ({ fetchWithTimeout: vi.fn() }));

import { apiGuard } from "@/lib/security/api-guard";
import { POST } from "@/app/api/discord/route";
import type { NextRequest } from "next/server";

const SIGNATURE = "a".repeat(128);

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

/** Discord signs `timestamp + rawBody` and sends the timestamp as a header. */
function request(
  payload: Record<string, unknown>,
  timestamp: string | number = nowSeconds(),
  signature: string | null = SIGNATURE,
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-signature-timestamp": String(timestamp),
  };
  if (signature !== null) headers["x-signature-ed25519"] = signature;
  return new Request("https://x.test/api/discord", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  verify.mockReturnValue(true);
  vi.mocked(apiGuard).mockResolvedValue(null);
});

/**
 * Regression: "/api/discord has no replay protection".
 * Discord signs `timestamp + body`, but the timestamp was never checked for
 * freshness — so a captured interaction (a proxy log, a leaked HAR) replayed
 * forever, and a replayed admin `/approve` re-authorised itself because the
 * invoker id is read out of the replayed body.
 */
describe("POST /api/discord — replay protection", () => {
  it("rejects a captured interaction replayed outside the window", async () => {
    const stale = nowSeconds() - 3600;
    const res = await POST(request({ type: 2, data: { name: "approve" } }, stale));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Stale request" });
  });

  it("rejects a timestamp from the future beyond the window", async () => {
    const res = await POST(request({ type: 1 }, nowSeconds() + 3600));
    expect(res.status).toBe(401);
  });

  it("rejects a non-numeric or empty timestamp", async () => {
    for (const ts of ["not-a-timestamp", ""]) {
      const res = await POST(request({ type: 1 }, ts));
      expect(res.status).toBe(401);
    }
  });

  it("does not spend a signature verification on a stale request", async () => {
    await POST(request({ type: 1 }, nowSeconds() - 3600));
    expect(verify).not.toHaveBeenCalled();
  });

  it("still answers Discord's PING verification handshake with a PONG", async () => {
    // The endpoint-registration handshake MUST keep working — an over-tight
    // window that rejects real Discord traffic is worse than the replay bug.
    const res = await POST(request({ type: 1 }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ type: 1 });
  });

  it("accepts a legitimate interaction with a fresh timestamp", async () => {
    const res = await POST(request({ type: 2, data: { name: "not-a-command" } }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      data: { content: "Unknown command." },
    });
  });

  it("tolerates a couple of minutes of clock skew in either direction", async () => {
    for (const skew of [-120, 120]) {
      const res = await POST(request({ type: 1 }, nowSeconds() + skew));
      expect(res.status).toBe(200);
    }
  });

  it("keeps rejecting a fresh request whose signature does not verify", async () => {
    verify.mockReturnValue(false);
    const res = await POST(request({ type: 1 }));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Invalid signature" });
  });

  it("keeps rejecting a request with no signature header", async () => {
    const res = await POST(request({ type: 1 }, nowSeconds(), null));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ error: "Missing signature" });
  });
});

/**
 * Regression: "/api/discord has no rate limit". The route is exempt from all
 * middleware (src/proxy.ts), so it must rate limit itself.
 */
describe("POST /api/discord — rate limiting", () => {
  it("runs apiGuard with a discord-keyed rate limit", async () => {
    await POST(request({ type: 1 }));
    expect(apiGuard).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ rateLimit: expect.objectContaining({ key: "discord" }) }),
    );
  });

  it("returns the guard's 429 without verifying or handling the interaction", async () => {
    vi.mocked(apiGuard).mockResolvedValue(
      NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 }),
    );
    const res = await POST(request({ type: 2, data: { name: "approve" } }));
    expect(res.status).toBe(429);
    expect(verify).not.toHaveBeenCalled();
  });
});
