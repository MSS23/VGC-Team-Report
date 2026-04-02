import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isCronAuthorized } from "@/lib/cron-auth";

describe("isCronAuthorized", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects Vercel cron user-agent without CRON_SECRET", () => {
    delete process.env.CRON_SECRET;
    const req = new Request("http://localhost/api/cron/test", {
      headers: { "user-agent": "vercel-cron/1.0" },
    });
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("allows valid CRON_SECRET bearer token", () => {
    process.env.CRON_SECRET = "my-secret";
    const req = new Request("http://localhost/api/cron/test", {
      headers: { authorization: "Bearer my-secret" },
    });
    expect(isCronAuthorized(req)).toBe(true);
  });

  it("rejects requests without auth", () => {
    process.env.CRON_SECRET = "my-secret";
    const req = new Request("http://localhost/api/cron/test");
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("rejects wrong bearer token", () => {
    process.env.CRON_SECRET = "my-secret";
    const req = new Request("http://localhost/api/cron/test", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    expect(isCronAuthorized(req)).toBe(false);
  });

  it("rejects when CRON_SECRET is not set and no vercel-cron agent", () => {
    delete process.env.CRON_SECRET;
    const req = new Request("http://localhost/api/cron/test", {
      headers: { authorization: "Bearer anything" },
    });
    expect(isCronAuthorized(req)).toBe(false);
  });
});
