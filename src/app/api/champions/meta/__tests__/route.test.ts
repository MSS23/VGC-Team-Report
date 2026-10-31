import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/cache", () => ({ cacheGet: vi.fn(), cacheSet: vi.fn() }));

import { getDb } from "@/lib/db";
import { cacheGet } from "@/lib/cache";
import { GET } from "../route";

beforeEach(() => vi.resetAllMocks());

describe("Champions usage snapshot", () => {
  it("includes the Reg M-A, M-B and M-C labels saved by the report editor", async () => {
    const sql = vi.fn(async () => [
      { name: "Incineroar", count: "4", total_reports: "5" },
    ]);
    vi.mocked(getDb).mockReturnValue(sql as never);
    const response = await GET(new Request("https://example.test/api/champions/meta"));
    // Guard the database filter, where the old '%reg-m%' pattern silently
    // excluded every report with the editor's space-separated format labels.
    const query = (sql.mock.calls[0] as unknown as [TemplateStringsArray])[0].join("?");
    expect(query).toContain("data->>'regulation' IN ('Reg M-A', 'Reg M-B', 'Reg M-C')");
    expect(query).toContain("data->'tags'->>'regulation' IN ('Reg M-A', 'Reg M-B', 'Reg M-C')");
    expect(query).toContain("is_public = TRUE");
    expect(query).toContain("deleted_at IS NULL");
    await expect(response.json()).resolves.toEqual({
      entries: [{ name: "Incineroar", count: 4, percentage: 80 }],
      totalReports: 5,
      hasEnoughData: true,
    });
  });

  it("withholds usage percentages until five reports are available", async () => {
    vi.mocked(getDb).mockReturnValue(vi.fn(async () => [
      { name: "Incineroar", count: "2", total_reports: "3" },
    ]) as never);
    const response = await GET(new Request("https://example.test/api/champions/meta"));
    await expect(response.json()).resolves.toEqual({ entries: [], totalReports: 3, hasEnoughData: false });
  });

  it("reuses cached results without querying the database", async () => {
    const cached = { entries: [], totalReports: 0, hasEnoughData: false };
    vi.mocked(cacheGet).mockResolvedValue(cached);
    const response = await GET(new Request("https://example.test/api/champions/meta"));
    await expect(response.json()).resolves.toEqual(cached);
    expect(getDb).not.toHaveBeenCalled();
  });
});
