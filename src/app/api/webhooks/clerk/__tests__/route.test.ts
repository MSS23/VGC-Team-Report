import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/webhooks", () => ({ verifyWebhook: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendWelcomeEmail: vi.fn(async () => ({ id: "email_1" })) }));
vi.mock("@/lib/cache", () => ({
  cacheSetIfAbsentResult: vi.fn(async () => "acquired"),
  cacheDel: vi.fn(async () => {}),
}));

import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { sendWelcomeEmail } from "@/lib/email";
import { cacheDel, cacheSetIfAbsentResult } from "@/lib/cache";
import { POST } from "../route";

const USER_CREATED = {
  type: "user.created",
  data: {
    id: "user_1",
    primary_email_address_id: "idn_1",
    email_addresses: [{ id: "idn_1", email_address: "trainer@example.test" }],
    first_name: "Trainer",
  },
};

/** A delivery whose signature verification is stubbed out. */
function delivery(svixId = "msg_1") {
  return new Request("https://x.test/api/webhooks/clerk", {
    method: "POST",
    headers: { "svix-id": svixId },
    body: "{}",
  }) as never;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CLERK_WEBHOOK_SIGNING_SECRET = "whsec_test_not_a_real_one";
  vi.mocked(verifyWebhook).mockResolvedValue(USER_CREATED as never);
  vi.mocked(sendWelcomeEmail).mockResolvedValue({ id: "email_1" } as never);
  vi.mocked(cacheSetIfAbsentResult).mockResolvedValue("acquired");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  vi.restoreAllMocks();
});

describe("POST /api/webhooks/clerk — welcome-email idempotency", () => {
  it("sends exactly one welcome email on a first delivery", async () => {
    const res = await POST(delivery());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(sendWelcomeEmail).toHaveBeenCalledWith({
      to: "trainer@example.test",
      firstName: "Trainer",
    });
  });

  it("dedups a genuine duplicate delivery without resending", async () => {
    vi.mocked(cacheSetIfAbsentResult).mockResolvedValue("exists");
    const res = await POST(delivery());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, deduped: true });
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  // Regression: a Redis throw used to come back as `false` from
  // cacheSetIfAbsent, which was indistinguishable from a dedup hit. The
  // handler answered 200 {deduped: true}, Clerk never retried, and the new
  // user's welcome email was lost permanently (BUG-CACHE-DEDUPE-SWALLOW).
  it("does NOT treat a Redis error as already-processed — the welcome email is not silently dropped", async () => {
    vi.mocked(cacheSetIfAbsentResult).mockResolvedValue("error");
    const res = await POST(delivery());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deduped).toBeUndefined();
    expect(body).toEqual({ ok: true });
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1);
    // And the outage is diagnosable from the logs.
    expect(console.error).toHaveBeenCalled();
  });

  it("releases the idempotency key and returns 500 when the send itself fails, so Clerk retries", async () => {
    vi.mocked(sendWelcomeEmail).mockResolvedValue(null as never);
    const res = await POST(delivery());
    expect(res.status).toBe(500);
    expect(cacheDel).toHaveBeenCalledWith("clerk:svix:msg_1");
  });
});
