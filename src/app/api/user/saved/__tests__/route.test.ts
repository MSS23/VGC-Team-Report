import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { POST } from "../route";

const req = (body: string) => new Request("https://x.test/api/user/saved", { method: "POST", body });

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.mocked(auth).mockReset().mockResolvedValue({ userId: "user_1" } as never);
});

describe("POST /api/user/saved", () => {
  it("returns 401 when signed out", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await POST(req(JSON.stringify({ shareId: "abc123" })));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 Invalid JSON body for malformed JSON without touching the DB", async () => {
    const res = await POST(req("{nope"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 404 and saves nothing when the share is not accessible", async () => {
    const sql = vi.fn(async () => []);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const res = await POST(req(JSON.stringify({ shareId: "abc123" })));
    expect(res.status).toBe(404);
    expect(sql).toHaveBeenCalledTimes(1);
  });
});
