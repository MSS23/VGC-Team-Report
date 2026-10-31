import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/rate-limit", () => ({ isRateLimitedAsync: vi.fn(async () => false) }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(), currentUser: vi.fn(async () => ({ fullName: "Trainer" })) }));
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { POST } from "../route";
import { POST as claim } from "../[id]/claim/route";
import { hashQuickToken } from "@/lib/sharing/quick-share";
const token = "a".repeat(64);
const id = "b".repeat(32);
const context = { params: Promise.resolve({ id }) };
const req = (cookie = token) => new Request("https://example.test/api/quick-share", { method: "POST", headers: { "Content-Type": "application/json", cookie: `vgc-quick-owner=${cookie}` }, body: JSON.stringify({ paste: "Incineroar\n- Protect" }) });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(auth).mockResolvedValue({ userId: "creator" } as never); });
describe("guest share creation and claims", () => {
  it("creates an expiring share anonymously and keeps claim secrets out of its URL", async () => {
    const sql = vi.fn(async () => [{ expires_at: "2026-10-21" }]);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const response = await POST(req());
    expect(response.status).toBe(201);
    expect((await response.json()).url).toMatch(/^\/q\/[a-f0-9]{32}$/);
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(JSON.stringify(sql.mock.calls)).not.toContain(token);
    expect(auth).not.toHaveBeenCalled();
  });
  it("requires both a signed-in account and the creator cookie", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    expect((await claim(req(), context)).status).toBe(401);
    vi.mocked(auth).mockResolvedValue({ userId: "creator" } as never);
    expect((await claim(req(""), context)).status).toBe(403);
    expect(getDb).not.toHaveBeenCalled();
  });
  it("rejects expired reports and another browser's token", async () => {
    vi.mocked(getDb).mockReturnValue(vi.fn(async () => [{ owner_hash: hashQuickToken(token), expires_at: "2000-01-01" }]) as never);
    expect((await claim(req(), context)).status).toBe(410);
    expect((await claim(req("c".repeat(64)), context)).status).toBe(403);
  });
  it("creates one authenticated report through an atomic claim", async () => {
    const sql = vi.fn(async (strings: TemplateStringsArray) => strings.join("").includes("WITH claimed") ? [{ id: "report12" }] : [{ paste: "Incineroar\n- Protect", owner_hash: hashQuickToken(token), expires_at: "2099-01-01" }]);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const response = await claim(req(), context);
    expect(response.status).toBe(200);
    expect((await response.json()).url).toMatch(/^\/s\/[a-zA-Z0-9]{8}$/);
    expect(sql).toHaveBeenCalledTimes(2);
  });
  it("does not create a second report when two claims race", async () => {
    const sql = vi.fn(async (strings: TemplateStringsArray) => strings.join("").includes("WITH claimed") ? [] : [{ paste: "Incineroar\n- Protect", owner_hash: hashQuickToken(token), expires_at: "2099-01-01" }]);
    vi.mocked(getDb).mockReturnValue(sql as never);
    expect((await claim(req(), context)).status).toBe(409);
  });
});
