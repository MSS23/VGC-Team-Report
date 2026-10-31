import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";
it("shows generic push copy and only opens the authenticated dashboard", async () => {
  const listeners = new Map<string, (event: unknown) => void>();
  const showNotification = vi.fn(async () => {});
  const openWindow = vi.fn(async () => {});
  runInNewContext(readFileSync(resolve("public/sw.js"), "utf8"), {
    URL, self: { location: { origin: "https://example.test" }, registration: { showNotification }, clients: { matchAll: async () => [], openWindow }, addEventListener: (name: string, callback: (event: unknown) => void) => listeners.set(name, callback) },
  });
  let pending: Promise<unknown> | undefined;
  const waitUntil = (promise: Promise<unknown>) => { pending = promise; };
  listeners.get("push")!({ data: { json: () => ({ body: "private contents", url: "https://evil.test" }) }, waitUntil });
  await pending;
  expect(JSON.stringify(showNotification.mock.calls)).not.toContain("private contents");
  listeners.get("notificationclick")!({ notification: { close: vi.fn(), data: { url: "https://evil.test" } }, waitUntil });
  await pending;
  expect(openWindow).toHaveBeenCalledWith("https://example.test/dashboard");
});
