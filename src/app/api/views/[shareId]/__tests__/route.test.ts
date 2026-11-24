import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/cache", () => ({ cacheSetIfAbsent: vi.fn(async () => true) }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/instrumentation", () => ({ getLogger: () => ({ emit: vi.fn() }), flushLogs: vi.fn() }));

import { getDb } from "@/lib/db";
import { cacheSetIfAbsent } from "@/lib/cache";
import { POST } from "../route";

const params = { params: Promise.resolve({ shareId: "abc123XYZ" }) };
const req = (body: string) => new Request("https://x.test/api/views/abc123XYZ", { method: "POST", body });

beforeEach(() => vi.mocked(getDb).mockReset());

describe("POST /api/views/[shareId]", () => {
  it("returns 400 Invalid JSON body for malformed JSON without touching cache or DB", async () => {
    const res = await POST(req("{nope"), params);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid JSON body" });
    expect(cacheSetIfAbsent).not.toHaveBeenCalled();
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns viewCount 0 when the first-view increment matches no public share", async () => {
    const sql = vi.fn(async () => []);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const res = await POST(req(JSON.stringify({ sessionId: "s1" })), params);
    await expect(res.json()).resolves.toEqual({ viewCount: 0 });
    expect(cacheSetIfAbsent).toHaveBeenCalledWith("view:abc123XYZ:s1", 600);
    expect((sql.mock.calls[0] as unknown as [string[]])[0].join("?")).toContain("UPDATE shares SET view_count");
  });
});
