import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("web-push", () => ({ default: { sendNotification: vi.fn(async () => ({})) } }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
import webpush from "web-push";
import { getDb } from "@/lib/db";
import { sendSocialPush } from "../web-push";
import { isAllowedPushEndpoint } from "../push-subscription";
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VAPID_PUBLIC_KEY", "public"); vi.stubEnv("VAPID_PRIVATE_KEY", "private"); vi.stubEnv("VAPID_SUBJECT", "https://example.test");
});
afterEach(() => vi.unstubAllEnvs());
describe("browser push safety", () => {
  it("only accepts encrypted endpoints on recognized browser push services", () => {
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/test")).toBe(true);
    expect(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/test")).toBe(true);
    for (const value of ["http://fcm.googleapis.com/test", "https://127.0.0.1/push", "https://fcm.googleapis.com.evil.test/push", "https://user@fcm.googleapis.com/push", "https://fcm.googleapis.com:8443/push"]) expect(isAllowedPushEndpoint(value)).toBe(false);
  });
  it("sends generic content to opted-in subscriptions and removes expired endpoints", async () => {
    const sql = vi.fn(async (strings: TemplateStringsArray) => strings.join("").includes("SELECT") ? [{ endpoint: "https://fcm.googleapis.com/test", p256dh: "key", auth: "auth" }] : []);
    vi.mocked(getDb).mockReturnValue(sql as never);
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 410 });
    await sendSocialPush(["owner"]);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(vi.mocked(webpush.sendNotification).mock.calls[0][1] as string);
    expect(payload.url).toBe("/dashboard");
    expect(payload.body).not.toContain("owner");
    expect(sql).toHaveBeenCalledTimes(2);
  });
  it("does not query subscriptions or send anything without configured keys", async () => {
    vi.stubEnv("VAPID_PRIVATE_KEY", "");
    await sendSocialPush(["owner"]);
    expect(getDb).not.toHaveBeenCalled();
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
});
