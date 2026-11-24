import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: null })), clerkClient: vi.fn() }));
vi.mock("@/lib/notifications", () => ({ createNotification: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendCommentNotificationEmail: vi.fn() }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));

import { getDb } from "@/lib/db";
import { POST } from "../route";

const params = { params: Promise.resolve({ shareId: "abc123XYZ" }) };
const req = (body: string) => new Request("https://x.test/api/comments/abc123XYZ", { method: "POST", body });

beforeEach(() => vi.mocked(getDb).mockReset());

describe("POST /api/comments/[shareId]", () => {
  it("returns 400 Invalid JSON body for malformed JSON without touching the DB", async () => {
    const res = await POST(req("{nope"), params);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 404 and inserts nothing when the share is not public", async () => {
    const sql = vi.fn(async () => []);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const res = await POST(req(JSON.stringify({ body: "gg", sessionId: "s1" })), params);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Report not found or not public" });
    expect(sql).toHaveBeenCalledTimes(1);
  });
});
