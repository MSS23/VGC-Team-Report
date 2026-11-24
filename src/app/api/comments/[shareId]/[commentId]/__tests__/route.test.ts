import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: null })) }));
vi.mock("@/lib/collaboration-access", () => ({ hasEditorAccess: vi.fn(async () => false) }));

import { getDb } from "@/lib/db";
import { DELETE } from "../route";

const params = { params: Promise.resolve({ shareId: "abc123XYZ", commentId: "7" }) };
const req = (body: string) => new Request("https://x.test/api/comments/abc123XYZ/7", { method: "DELETE", body });

beforeEach(() => vi.mocked(getDb).mockReset().mockReturnValue(vi.fn(async () => []) as never));

describe("DELETE /api/comments/[shareId]/[commentId]", () => {
  it("returns 400 Invalid JSON body for malformed JSON", async () => {
    const res = await DELETE(req("{nope"), params);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-out caller with no comment session", async () => {
    const res = await DELETE(req("{}"), params);
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "No authorized account or comment session provided" });
  });
});
