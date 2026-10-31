import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/web-push", () => ({ pushConfiguration: () => ({ publicKey: "public-only", privateKey: "private-secret" }) }));
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { DELETE, GET, POST } from "../route";
const endpoint = "https://fcm.googleapis.com/fcm/send/test";
const request = (body: unknown) => new Request("https://example.test/api/user/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(auth).mockResolvedValue({ userId: "owner-1" } as never); });
describe("browser subscription authorization", () => {
  it("rejects signed-out reads and mutations before accessing storage", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    for (const handler of [GET, POST, DELETE]) expect((await handler(request({ endpoint }))).status).toBe(401);
    expect(getDb).not.toHaveBeenCalled();
  });
  it("never exposes private VAPID keys and scopes reads to the account", async () => {
    const sql = vi.fn(async () => [{ endpoint }]); vi.mocked(getDb).mockReturnValue(sql as never);
    const response = await GET(request({}));
    expect(await response.json()).toEqual({ publicKey: "public-only", endpoints: [endpoint] });
    expect(sql.mock.calls[0]).toContain("owner-1");
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });
  it("deletes only the authenticated owner's subscription", async () => {
    const sql = vi.fn(async (..._args: unknown[]) => []); vi.mocked(getDb).mockReturnValue(sql as never);
    expect((await DELETE(request({ endpoint, userId: "victim" }))).status).toBe(200);
    expect(sql.mock.calls[0]).toContain("owner-1");
    expect(sql.mock.calls[0]).not.toContain("victim");
    expect((sql.mock.calls[0][0] as unknown as string[]).join("")).toContain("AND user_id =");
  });
  it("rejects non-push endpoints before issuing any query", async () => {
    const sql = vi.fn(async (..._args: unknown[]) => []); vi.mocked(getDb).mockReturnValue(sql as never);
    expect((await POST(request({ endpoint: "https://127.0.0.1/private", keys: { p256dh: "A".repeat(87), auth: "A".repeat(22) } }))).status).toBe(400);
    expect(sql).not.toHaveBeenCalled();
  });
});
