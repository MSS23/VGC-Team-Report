import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { DELETE, POST } from "../route";

const req = (method: string, body: string) => new Request("https://x.test/api/user/follow", { method, body });

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.mocked(auth).mockReset().mockResolvedValue({ userId: "user_1" } as never);
});

describe("POST/DELETE /api/user/follow", () => {
  it.each([["POST", POST], ["DELETE", DELETE]] as const)("%s returns 400 Invalid JSON body for malformed JSON", async (method, handler) => {
    const res = await handler(req(method, "{nope"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("POST returns 401 when signed out", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    expect((await POST(req("POST", JSON.stringify({ creatorName: "Ash" })))).status).toBe(401);
  });

  it("POST inserts the follow for the signed-in user", async () => {
    const sql = vi.fn(async () => []);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const res = await POST(req("POST", JSON.stringify({ creatorName: "Ash" })));
    await expect(res.json()).resolves.toEqual({ followed: true });
    expect(sql.mock.calls[0]).toEqual([expect.arrayContaining([expect.stringContaining("INSERT INTO follows")]), "user_1", "Ash"]);
  });
});
