/**
 * PERF-SSG-DB-FANOUT regression: the Mega guide featured-teams fetch lived
 * inside `src/app/champions/[pokemon]/page.tsx` and ran once per statically
 * generated page — 81 sprited Reg M-C Megas means 81 Neon round-trips on every
 * build (and 81 "No database connection string" lines when there is no
 * `DATABASE_URL`).
 *
 * The assertions worth having are therefore:
 *   1. N callers cause ONE batched query (plus its one like-count query).
 *   2. The rows each Mega gets are identical to the old per-Mega query — this
 *      is a data-fetching change, not a product change.
 *   3. With no `DATABASE_URL`, nothing is queried and exactly one warning is
 *      logged no matter how many pages render.
 *
 * Real Postgres (PGlite) so `unnest(...) CROSS JOIN LATERAL` and the ILIKE
 * patterns are checked by Postgres itself, not by a mock that agrees with me.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));

import { getDb } from "@/lib/db";
import { getFeaturedTeamsForMega, __resetFeaturedTeamsBatch } from "@/lib/data/featured-teams";
import { __resetDatabaseUnavailableWarning } from "@/lib/db-availability";
import { getRegMCMegasWithSprites } from "@/lib/data/mega-pokemon";

const db = new PGlite();

/** Every `sql` tagged-template call that reached Postgres this test. */
let queries: string[] = [];

function sqlTag() {
  return (async (strings: TemplateStringsArray, ...values: unknown[]) => {
    const query = strings.reduce((acc, fragment, i) => acc + (i ? `$${i}` : "") + fragment, "");
    queries.push(query);
    return (await db.query(query, values)).rows;
  }) as never;
}

async function seed(rows: Array<{ id: string; paste: string; updatedAt: string }>) {
  for (const r of rows) {
    await db.query(
      "INSERT INTO shares (id, data, created_at, updated_at, view_count, is_public) VALUES ($1, $2, $3, $3, 0, TRUE)",
      [r.id, JSON.stringify({ paste: r.paste }), r.updatedAt],
    );
  }
}

/** The query this module replaced, run verbatim, as the equivalence oracle. */
async function legacyFetch(dataKey: string, megaStone: string): Promise<string[]> {
  const megaSpeciesForm = dataKey
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("-");
  const res = await db.query<{ id: string }>(
    `SELECT s.id FROM shares s
     WHERE s.is_public = TRUE AND s.deleted_at IS NULL
       AND (s.data->>'paste' ILIKE $1 OR s.data->>'paste' ILIKE $2)
     ORDER BY s.updated_at DESC LIMIT 9`,
    [`%${megaStone}%`, `%${megaSpeciesForm}%`],
  );
  return res.rows.map((r) => r.id);
}

beforeAll(async () => {
  await db.exec(`
    CREATE TABLE shares (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), view_count INTEGER, is_public BOOLEAN, deleted_at TIMESTAMPTZ);
    CREATE TABLE reactions (id SERIAL PRIMARY KEY, share_id TEXT NOT NULL, reaction_type TEXT, session_id TEXT);
  `);
}, 30_000);

beforeEach(async () => {
  await db.exec("TRUNCATE shares, reactions");
  queries = [];
  __resetFeaturedTeamsBatch();
  __resetDatabaseUnavailableWarning();
  process.env.DATABASE_URL = "postgres://pglite/test";
  vi.mocked(getDb).mockClear();
  vi.mocked(getDb).mockReturnValue(sqlTag());
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  await db.close();
});

describe("getFeaturedTeamsForMega", () => {
  it("fetches once for many callers instead of once per Mega guide page", async () => {
    await seed([
      { id: "a", paste: "Scizor-Mega @ Scizorite", updatedAt: "2026-10-01T00:00:00Z" },
      { id: "b", paste: "Charizard-Mega-Y @ Charizardite Y", updatedAt: "2026-10-02T00:00:00Z" },
    ]);

    const megas = getRegMCMegasWithSprites();
    expect(megas.length).toBeGreaterThan(50); // the fan-out this guards against

    // Every statically generated page, exactly as the build renders them.
    const results = await Promise.all(
      megas.map((m) => getFeaturedTeamsForMega(m.dataKey, m.megaStone)),
    );
    // ...and again sequentially, which is how the build actually interleaves
    // them across workers.
    for (const m of megas) await getFeaturedTeamsForMega(m.dataKey, m.megaStone);

    expect(results).toHaveLength(megas.length);
    // One batched teams query + one batched like-count query. Not 81 of each.
    expect(queries).toHaveLength(2);
    expect(queries.filter((q) => q.includes("CROSS JOIN LATERAL"))).toHaveLength(1);
    expect(getDb).toHaveBeenCalledTimes(1);
  });

  it("returns the same rows, in the same order, as the old per-Mega query", async () => {
    // Charizardite X/Y and the exact Mega form names are the case that broke
    // before (VGC: "Charizard-Mega" is an ILIKE prefix of "Charizard-Mega-X").
    await seed([
      { id: "scizor-1", paste: "Scizor-Mega @ Scizorite", updatedAt: "2026-10-01T00:00:00Z" },
      { id: "scizor-2", paste: "Scizor @ Scizorite", updatedAt: "2026-10-05T00:00:00Z" },
      { id: "zard-x", paste: "Charizard-Mega-X @ Charizardite X", updatedAt: "2026-10-03T00:00:00Z" },
      { id: "zard-y", paste: "Charizard-Mega-Y @ Charizardite Y", updatedAt: "2026-10-04T00:00:00Z" },
      { id: "unrelated", paste: "Flutter Mane @ Booster Energy", updatedAt: "2026-10-06T00:00:00Z" },
    ]);

    const cases: Array<[string, string]> = [
      ["scizor-mega", "Scizorite"],
      ["charizard-mega-x", "Charizardite X"],
      ["charizard-mega-y", "Charizardite Y"],
      ["kangaskhan-mega", "Kangaskhanite"],
    ];
    for (const [dataKey, stone] of cases) {
      const batched = (await getFeaturedTeamsForMega(dataKey, stone)).map((t) => t.id);
      expect(batched).toEqual(await legacyFetch(dataKey, stone));
    }

    // Sanity: the Y page must not pick up the X paste, and vice versa.
    const y = (await getFeaturedTeamsForMega("charizard-mega-y", "Charizardite Y")).map((t) => t.id);
    expect(y).toEqual(["zard-y"]);
  });

  it("carries like counts through the batch", async () => {
    await seed([{ id: "liked", paste: "Scizor-Mega @ Scizorite", updatedAt: "2026-10-01T00:00:00Z" }]);
    await db.exec(
      "INSERT INTO reactions (share_id, reaction_type, session_id) VALUES ('liked','like','s1'),('liked','like','s2')",
    );
    const teams = await getFeaturedTeamsForMega("scizor-mega", "Scizorite");
    expect(teams.map((t) => [t.id, t.likeCount])).toEqual([["liked", 2]]);
  });

  it("warns once and renders empty for every page when DATABASE_URL is absent", async () => {
    delete process.env.DATABASE_URL;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    const megas = getRegMCMegasWithSprites();
    const results = await Promise.all(
      megas.map((m) => getFeaturedTeamsForMega(m.dataKey, m.megaStone)),
    );

    expect(results.every((r) => r.length === 0)).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1); // not once per page
    expect(error).not.toHaveBeenCalled();
    expect(getDb).not.toHaveBeenCalled(); // nothing even tried to connect
  });

  it("falls back to a single query for an on-demand Mega outside the batch", async () => {
    await seed([{ id: "gone", paste: "Froslass-Mega @ Froslassite", updatedAt: "2026-10-01T00:00:00Z" }]);
    const batchKeys = new Set(getRegMCMegasWithSprites().map((m) => m.dataKey));
    expect(batchKeys.has("not-a-real-mega")).toBe(false);

    const teams = await getFeaturedTeamsForMega("froslass-mega-notprerendered", "Froslassite");
    expect(teams.map((t) => t.id)).toEqual(["gone"]);
    // batch + batch likes + the one-off query (+ its likes)
    expect(queries.filter((q) => q.includes("CROSS JOIN LATERAL"))).toHaveLength(1);
  });
});
