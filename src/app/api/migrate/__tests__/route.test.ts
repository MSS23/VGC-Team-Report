import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
// Controlled normalizer: `legacy` rows change, `explode` rows throw, everything else is already current.
vi.mock("@/lib/utils/normalize-report", () => ({
  normalizeReportData: (d: Record<string, unknown>) => {
    if (d.explode) throw new Error("bad row");
    return d.legacy ? { migrated: true, creatorName: "Ash" } : d;
  },
}));

import { getDb } from "@/lib/db";
import { POST } from "../route";

const MIGRATE = "migrate-secret-for-tests";
type Call = { q: string; vals: unknown[] };

function makeSql(rows: Record<string, unknown>[]) {
  const calls: Call[] = [];
  let selects = 0;
  const sql = ((strings: TemplateStringsArray, ...vals: unknown[]) => {
    const q = strings.join("?");
    calls.push({ q, vals });
    // weightedSearchVector() builds a nested fragment with this same function; return a marker for it.
    if (q.includes("setweight")) return { fragment: "search_vector" };
    if (q.includes("SELECT id, data, is_public, search_vector")) return Promise.resolve(selects++ === 0 ? rows : []);
    return Promise.resolve([]);
  }) as unknown as ReturnType<typeof getDb>;
  vi.mocked(getDb).mockReturnValue(sql);
  return calls;
}

const req = (auth?: string) =>
  new Request("https://x.test/api/migrate", { method: "POST", headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  vi.mocked(getDb).mockReset();
  vi.stubEnv("MIGRATE_SECRET", MIGRATE);
  vi.stubEnv("CRON_SECRET", "cron-secret-for-tests");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/migrate — auth", () => {
  it.each([
    ["no header", undefined],
    ["wrong secret", "Bearer nope"],
    ["the CRON_SECRET", "Bearer cron-secret-for-tests"],
    ["the secret without the Bearer scheme", MIGRATE],
  ])("returns 401 with %s and touches no DB", async (_l, auth) => {
    const res = await POST(req(auth));
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("returns 401 when MIGRATE_SECRET is unset", async () => {
    vi.stubEnv("MIGRATE_SECRET", undefined);
    expect((await POST(req(`Bearer ${MIGRATE}`))).status).toBe(401);
    expect(getDb).not.toHaveBeenCalled();
  });
});

describe("POST /api/migrate — batch migration", () => {
  it("pages through shares and runs the right UPDATE for each row", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const calls = makeSql([
      { id: "a", data: { legacy: true }, is_public: true, search_vector: null }, // data + vector
      { id: "b", data: { legacy: true }, is_public: false, search_vector: null }, // data only
      { id: "c", data: { ok: 1 }, is_public: true, search_vector: null }, // vector only
      { id: "d", data: { ok: 1 }, is_public: true, search_vector: "tsv" }, // nothing
      { id: "e", data: { explode: true }, is_public: true, search_vector: null }, // error
    ]);

    const res = await POST(req(`Bearer ${MIGRATE}`));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.stats).toEqual({ total: 5, migrated: 2, searchVectorBackfilled: 2, errors: 1 });

    const selects = calls.filter((c) => c.q.includes("SELECT id, data"));
    expect(selects.map((c) => c.vals)).toEqual([[100, 0], [100, 5]]);

    const updates = calls.filter((c) => c.q.includes("UPDATE shares"));
    expect(updates.map((c) => c.vals[c.vals.length - 1])).toEqual(["a", "b", "c"]);
    expect(updates[0].q).toMatch(/SET data = \?::jsonb,\s+search_vector = \?/);
    expect(updates[0].vals[1]).toEqual({ fragment: "search_vector" });
    expect(updates[1].q).not.toContain("search_vector");
    expect(updates[2].q).not.toContain("data =");
  });

  it("returns 500 Migration failed when the database throws", async () => {
    vi.mocked(getDb).mockImplementation(() => { throw new Error("db down"); });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(req(`Bearer ${MIGRATE}`));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Migration failed" });
  });
});
