import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

it("leaves guest reports network-only so offline caches cannot bypass expiry", () => {
  const listeners = new Map<string, (event: unknown) => void>();
  const cacheOpen = vi.fn();
  runInNewContext(readFileSync(resolve("public/sw.js"), "utf8"), {
    URL,
    self: { location: { origin: "https://example.test" }, addEventListener: (name: string, callback: (event: unknown) => void) => listeners.set(name, callback) },
    caches: { open: cacheOpen },
  });
  const respondWith = vi.fn();
  listeners.get("fetch")!({ request: { method: "GET", url: "https://example.test/q/abcdef", mode: "navigate" }, respondWith });
  expect(respondWith).not.toHaveBeenCalled();
  expect(cacheOpen).not.toHaveBeenCalled();
});
