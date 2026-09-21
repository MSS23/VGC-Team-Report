import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { GET, POST } from "../route";
const preferences = { welcomeSeries: false, weeklyDigest: false, socialActivity: true, productUpdates: false };
const request = (body: unknown) => new Request("https://example.test/api/user/preferences", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never); });
describe("account notification preferences", () => {
  it("rejects signed-out reads and writes before touching storage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    expect((await GET(new Request("https://example.test"))).status).toBe(401);
    expect((await POST(request(preferences))).status).toBe(401);
    expect(getDb).not.toHaveBeenCalled();
  });
  it("returns saved opt-outs with a private no-store response", async () => {
    const sql = vi.fn(async () => [{ preferences }]);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const response = await GET(new Request("https://example.test"));
    expect(await response.json()).toEqual({ preferences, initialized: true });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(sql.mock.calls[0]).toContain("owner-1");
  });
  it("stores choices only for the authenticated account", async () => {
    const sql = vi.fn(async () => []);
    vi.mocked(getDb).mockReturnValue(sql as never);
    expect((await POST(request(preferences))).status).toBe(200);
    expect(sql.mock.calls[0]).toContain("owner-1");
    expect(sql.mock.calls[0]).toContain(JSON.stringify(preferences));
    expect((await POST(request({ ...preferences, userId: "victim" }))).status).toBe(400);
    expect(sql).toHaveBeenCalledTimes(1);
  });
  it("rejects truthy strings and does not report success when storage fails", async () => {
    expect((await POST(request({ ...preferences, weeklyDigest: "false" }))).status).toBe(400);
    vi.mocked(getDb).mockReturnValue(vi.fn(async () => { throw new Error("offline"); }) as never);
    expect((await POST(request(preferences))).status).toBe(503);
  });
  it("keeps existing account opt-outs when a second device migrates legacy preferences", async () => {
    const sql = vi.fn(async (strings: TemplateStringsArray) => strings.join("").includes("SELECT") ? [{ preferences }] : []);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const response = await POST(new Request("https://example.test/api/user/preferences?initialize=true", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...preferences, weeklyDigest: true }),
    }));
    expect((await response.json()).preferences.weeklyDigest).toBe(false);
  });
});
