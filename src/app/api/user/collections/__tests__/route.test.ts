import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
import { POST } from "../route";

const req = (body: string) => new Request("https://x.test/api/user/collections", { method: "POST", body });

beforeEach(() => {
  vi.mocked(getDb).mockReset().mockReturnValue(vi.fn(async () => []) as never);
  vi.mocked(auth).mockReset().mockResolvedValue({ userId: "user_1" } as never);
});

describe("POST /api/user/collections", () => {
  it("returns 401 when signed out", async () => {
    vi.mocked(auth).mockResolvedValue({ userId: null } as never);
    const res = await POST(req("{}"));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 Invalid JSON body for malformed JSON", async () => {
    const res = await POST(req("{nope"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 500 for a valid JSON null body", async () => {
    // Documents current behaviour: `raw.action` on null throws into the catch-all instead of a 400.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req("null"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed" });
  });
});
