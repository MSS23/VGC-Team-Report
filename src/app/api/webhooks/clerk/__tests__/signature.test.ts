import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Webhook } from "standardwebhooks";

// Real Clerk verifyWebhook (svix / standardwebhooks HMAC); only the side effects are mocked.
vi.mock("@/lib/email", () => ({ sendWelcomeEmail: vi.fn(async () => ({ id: "email_1" })) }));
vi.mock("@/lib/cache", () => ({
  cacheSetIfAbsentResult: vi.fn(async () => "acquired"),
  cacheDel: vi.fn(async () => {}),
}));

import { sendWelcomeEmail } from "@/lib/email";
import { cacheSetIfAbsentResult } from "@/lib/cache";
import { POST } from "../route";

const signingSecret = "whsec_" + Buffer.from("clerk-signing-key-for-route-tests").toString("base64");
const otherSecret = "whsec_" + Buffer.from("some-other-signing-key-for-tests").toString("base64");

const USER_CREATED = JSON.stringify({
  type: "user.created",
  data: {
    id: "user_1",
    primary_email_address_id: "idn_1",
    email_addresses: [{ id: "idn_1", email_address: "trainer@example.test" }],
    first_name: "Trainer",
  },
});

function delivery(opts: { secret?: string; body?: string; sentBody?: string; omit?: string } = {}) {
  const body = opts.body ?? USER_CREATED;
  const id = "msg_test_1";
  const now = new Date();
  const headers: Record<string, string> = {
    "svix-id": id,
    "svix-timestamp": String(Math.floor(now.getTime() / 1000)),
    "svix-signature": new Webhook(opts.secret ?? signingSecret).sign(id, now, body),
  };
  if (opts.omit) delete headers[opts.omit];
  return new Request("https://x.test/api/webhooks/clerk", {
    method: "POST",
    headers,
    body: opts.sentBody ?? body,
  }) as never;
}

beforeEach(() => {
  vi.mocked(sendWelcomeEmail).mockClear();
  vi.mocked(cacheSetIfAbsentResult).mockClear();
  vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", signingSecret);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/webhooks/clerk — signature verification", () => {
  it("accepts a correctly signed user.created delivery and sends the welcome email", async () => {
    const res = await POST(delivery());
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(sendWelcomeEmail).toHaveBeenCalledWith({ to: "trainer@example.test", firstName: "Trainer" });
  });

  it("returns 400 Webhook not configured when the signing secret is unset", async () => {
    vi.stubEnv("CLERK_WEBHOOK_SIGNING_SECRET", undefined);
    const res = await POST(delivery());
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Webhook not configured" });
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("returns 400 Invalid signature for a delivery signed with another secret", async () => {
    const res = await POST(delivery({ secret: otherSecret }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
    expect(cacheSetIfAbsentResult).not.toHaveBeenCalled();
  });

  it("returns 400 Invalid signature for a tampered body", async () => {
    const res = await POST(delivery({ sentBody: USER_CREATED.replace("trainer@", "attacker@") }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
    expect(sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("returns 400 Invalid signature when the svix-signature header is missing", async () => {
    const res = await POST(delivery({ omit: "svix-signature" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
  });
});
