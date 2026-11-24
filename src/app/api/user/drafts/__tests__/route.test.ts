import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { DELETE, POST } from "../route";

const req = (body: string) => new NextRequest("https://x.test/api/user/drafts", { method: "POST", body });

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.mocked(auth).mockReset().mockResolvedValue({ userId: "user_1" } as never);
});

describe("POST /api/user/drafts", () => {
  it("returns 401 when signed out", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await POST(req("{}"));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 Invalid JSON body for malformed JSON without touching the DB", async () => {
    const res = await POST(req("{nope"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(getDb).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/user/drafts (regression: unvalidated draftId reached SQL)", () => {
  const del = (body: unknown) =>
    new NextRequest("https://x.test/api/user/drafts", { method: "DELETE", body: JSON.stringify(body) });

  it.each([
    ["an object", { draftId: { $ne: null } }],
    ["an array", { draftId: ["abcd1234"] }],
    ["a number", { draftId: 12345678 }],
    ["the wrong length", { draftId: "abc" }],
    ["illegal characters", { draftId: "abcd-123" }],
  ])("rejects a draftId that is %s without touching the DB", async (_label, body) => {
    const res = await DELETE(del(body));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid draftId" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("keeps the Missing draftId response", async () => {
    const res = await DELETE(del({}));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing draftId" });
  });

  it("deletes a well-formed draft id, scoped to the owner", async () => {
    const sql = vi.fn(async () => []);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const res = await DELETE(del({ draftId: "abcd1234" }));
    expect(res.status).toBe(200);
    expect(sql).toHaveBeenCalledTimes(1);
    expect(sql.mock.calls[0].slice(1)).toEqual(["abcd1234", "user_1"]);
  });
});
