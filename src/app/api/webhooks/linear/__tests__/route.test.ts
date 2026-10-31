import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHmac } from "crypto";

import { POST, GET } from "@/app/api/webhooks/linear/route";

const SECRET = "test-signing-secret-not-a-real-one";

function sign(body: string, secret = SECRET) {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** Builds a POST Request with a correct `linear-signature` for its own body. */
function signedReq(payload: unknown, secret = SECRET) {
  const body = JSON.stringify(payload);
  return new Request("https://x.test/api/webhooks/linear", {
    method: "POST",
    headers: { "linear-signature": sign(body, secret) },
    body,
  });
}

beforeEach(() => {
  process.env.LINEAR_WEBHOOK_SIGNING_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.LINEAR_WEBHOOK_SIGNING_SECRET;
  delete process.env.LINEAR_WEBHOOK_SECRET;
  vi.useRealTimers();
});

describe("POST /api/webhooks/linear — signature verification", () => {
  it("accepts a correctly signed, fresh payload", async () => {
    const res = await POST(
      signedReq({ type: "Issue", action: "create", webhookTimestamp: Date.now() }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("returns 401 for a payload signed with the wrong secret", async () => {
    const res = await POST(
      signedReq({ webhookTimestamp: Date.now() }, "the-wrong-secret"),
    );
    expect(res.status).toBe(401);
  });

  it("returns 400 when the signature header is absent", async () => {
    const res = await POST(
      new Request("https://x.test/api/webhooks/linear", {
        method: "POST",
        body: JSON.stringify({ webhookTimestamp: Date.now() }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 when no signing secret is configured", async () => {
    delete process.env.LINEAR_WEBHOOK_SIGNING_SECRET;
    const res = await POST(signedReq({ webhookTimestamp: Date.now() }));
    expect(res.status).toBe(401);
  });

  it("accepts the empty-body setup ping Linear sends on first configuration", async () => {
    const res = await POST(
      new Request("https://x.test/api/webhooks/linear", { method: "POST" }),
    );
    expect(res.status).toBe(200);
  });

  it("returns 200 for an unknown event type rather than throwing", async () => {
    const res = await POST(
      signedReq({ type: "SomeFutureEntity", action: "wat", webhookTimestamp: Date.now() }),
    );
    expect(res.status).toBe(200);
  });

  it("echoes the challenge for url_verification", async () => {
    const res = await POST(
      signedReq({ type: "url_verification", challenge: "abc123", webhookTimestamp: Date.now() }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ challenge: "abc123" });
  });
});

describe("POST /api/webhooks/linear — stale payloads (regression: VGC-274 401 made every Linear retry fail permanently, auto-disabling the webhook)", () => {
  /**
   * VGC-274 rejected signed-but-stale payloads with 401. Linear retries a failed
   * delivery with backoff, and the retry carries the ORIGINAL webhookTimestamp —
   * so it is always outside the 60s window and always got 401. Each 401 counted
   * as another failure, so one transient blip escalated until Linear
   * auto-disabled the webhook. A stale payload must be acknowledged (200) and
   * dropped, never answered with a retryable failure status.
   */
  it("acknowledges a stale payload with 200 and marks it ignored, NOT 401", async () => {
    const tenMinutesAgo = Date.now() - 10 * 60_000;
    const res = await POST(signedReq({ type: "Issue", webhookTimestamp: tenMinutesAgo }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, ignored: "stale" });
  });

  it("does not process a stale url_verification challenge (dropped, not echoed)", async () => {
    const res = await POST(
      signedReq({
        type: "url_verification",
        challenge: "should-not-be-echoed",
        webhookTimestamp: Date.now() - 10 * 60_000,
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, ignored: "stale" });
  });

  it("still accepts a payload at the edge of the freshness window", async () => {
    const res = await POST(
      signedReq({ type: "Issue", webhookTimestamp: Date.now() - 59_000 }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("tolerates a webhookTimestamp slightly in the future (clock skew)", async () => {
    const res = await POST(
      signedReq({ type: "Issue", webhookTimestamp: Date.now() + 30_000 }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("accepts a payload with no webhookTimestamp at all", async () => {
    const res = await POST(signedReq({ type: "Issue", action: "update" }));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});

describe("POST /api/webhooks/linear — legacy secret env var", () => {
  it("falls back to LINEAR_WEBHOOK_SECRET when the new name is unset", async () => {
    delete process.env.LINEAR_WEBHOOK_SIGNING_SECRET;
    process.env.LINEAR_WEBHOOK_SECRET = SECRET;

    const res = await POST(signedReq({ type: "Issue", webhookTimestamp: Date.now() }));
    expect(res.status).toBe(200);
  });
});

describe("GET /api/webhooks/linear", () => {
  it("returns 405 with an Allow: POST header", () => {
    const res = GET();
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
  });
});
