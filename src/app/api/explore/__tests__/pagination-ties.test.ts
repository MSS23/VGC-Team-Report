/**
 * VGC-295 regression: Explore keyset pagination skipped and duplicated teams.
 *
 * `route.ts` carried its own cursor codec that emitted `<value>:<iso>` with no
 * id tiebreaker, and its ORDER BY sorted the RAW timestamp column while the
 * WHERE clause compared a millisecond-truncated one. Most teams have 0 likes
 * and 0 views, so on `popular` / `views` the page boundary almost always falls
 * inside a tie — and a tie with no total order means rows vanish from the feed
 * or show up twice.
 *
 * Real Postgres (PGlite) so the assertions are about Postgres' own ordering,
 * not a mock's. The fixtures deliberately include MICROSECOND timestamps that
 * collide on the millisecond, which is what `NOW()` produces in production.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PGlite } from "@electric-sql/pglite";

vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/cache", () => ({
  cacheGet: vi.fn(async () => null),
  cacheSet: vi.fn(async () => undefined),
  CacheKeys: { explore: (params: string) => `explore:${params}` },
  CacheTTL: { EXPLORE_LIST: 60 },
}));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: null })) }));

import { getDb } from "@/lib/db";
import { GET } from "../route";

const db = new PGlite();

/**
 * Tagged-template stand-in for `@neondatabase/serverless`. Unlike the simpler
 * shims elsewhere in the suite it must flatten NESTED fragments, because the
 * explore route composes its filters and cursor predicates as `sql` fragments.
 * Fragments are lazy — they only hit the database when awaited — so an
 * `AND …` fragment is never executed on its own.
 */
type Fragment = { __chunks: string[]; __params: unknown[] };

function isFragment(value: unknown): value is Fragment {
  return typeof value === "object" && value !== null && "__chunks" in value;
}

function makeSql() {
  const sql = (strings: TemplateStringsArray | readonly string[], ...values: unknown[]) => {
    const chunks: string[] = [""];
    const params: unknown[] = [];
    const absorb = (parts: readonly string[], bound: unknown[]) => {
      parts.forEach((part, i) => {
        chunks[chunks.length - 1] += part;
        if (i >= bound.length) return;
        const value = bound[i];
        if (isFragment(value)) absorb(value.__chunks, value.__params);
        else {
          params.push(value);
          chunks.push("");
        }
      });
    };
    absorb(strings, values);

    const text = chunks.reduce((acc, chunk, i) => acc + (i ? `$${i}` : "") + chunk, "");
    let running: Promise<unknown[]> | undefined;
    const run = () => (running ??= db.query(text, params).then((r) => r.rows as unknown[]));

    return {
      __chunks: chunks,
      __params: params,
      then: (onOk?: never, onErr?: never) => run().then(onOk, onErr),
      catch: (onErr?: never) => run().catch(onErr),
      finally: (onEnd?: never) => run().finally(onEnd),
    };
  };
  return sql;
}

beforeAll(async () => {
  await db.exec(`
    CREATE TABLE shares (id TEXT PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), view_count INTEGER, is_public BOOLEAN, deleted_at TIMESTAMPTZ, forked_from_id TEXT, search_vector TSVECTOR);
    CREATE TABLE reactions (share_id TEXT NOT NULL, reaction_type TEXT, session_id TEXT);
    CREATE TABLE comments (share_id TEXT NOT NULL, body TEXT);
    CREATE TABLE collaborators (share_id TEXT NOT NULL, user_name TEXT, status TEXT);
    CREATE TABLE verified_creators (name TEXT PRIMARY KEY);
    CREATE TABLE follows (user_id TEXT, creator_name TEXT);
  `);
}, 120_000);

afterAll(async () => {
  await db.close();
});

/**
 * Twelve public teams. Nine are tied at 0 likes AND 0 views — the production
 * shape — and their created_at values collide on the millisecond while
 * differing in the microseconds the JS driver cannot carry in a cursor.
 */
const SHARES: Array<{ id: string; created: string; updated: string; views: number; likes: number }> = [
  { id: "tie-aaa", created: "2026-07-17 09:30:00.123456+00", updated: "2026-08-01 10:00:00.500100+00", views: 0, likes: 0 },
  { id: "tie-bbb", created: "2026-07-17 09:30:00.123999+00", updated: "2026-08-01 10:00:00.500900+00", views: 0, likes: 0 },
  { id: "tie-ccc", created: "2026-07-17 09:30:00.123000+00", updated: "2026-08-01 10:00:00.500000+00", views: 0, likes: 0 },
  { id: "tie-ddd", created: "2026-07-17 09:30:00.123500+00", updated: "2026-08-01 10:00:00.500500+00", views: 0, likes: 0 },
  { id: "tie-eee", created: "2026-07-17 09:30:00.456000+00", updated: "2026-08-01 11:00:00.000000+00", views: 0, likes: 0 },
  { id: "tie-fff", created: "2026-07-17 09:30:00.456777+00", updated: "2026-08-01 11:00:00.000001+00", views: 0, likes: 0 },
  { id: "tie-ggg", created: "2026-07-16 08:00:00.000000+00", updated: "2026-07-20 08:00:00.000000+00", views: 0, likes: 0 },
  { id: "tie-hhh", created: "2026-07-16 08:00:00.000400+00", updated: "2026-07-20 08:00:00.000400+00", views: 0, likes: 0 },
  { id: "tie-iii", created: "2026-07-15 07:00:00.000000+00", updated: "2026-07-19 07:00:00.000000+00", views: 0, likes: 0 },
  { id: "pop-jjj", created: "2026-07-14 06:00:00.000000+00", updated: "2026-07-18 06:00:00.000000+00", views: 9, likes: 3 },
  { id: "pop-kkk", created: "2026-07-13 05:00:00.111111+00", updated: "2026-07-17 05:00:00.111111+00", views: 4, likes: 3 },
  { id: "pop-lll", created: "2026-07-13 05:00:00.111888+00", updated: "2026-07-17 05:00:00.111888+00", views: 4, likes: 1 },
];

beforeEach(async () => {
  await db.exec("TRUNCATE shares, reactions, comments, collaborators, verified_creators, follows");
  for (const share of SHARES) {
    await db.query(
      "INSERT INTO shares (id, data, created_at, updated_at, view_count, is_public) VALUES ($1, $2, $3, $4, $5, TRUE)",
      [share.id, JSON.stringify({ paste: "Incineroar @ Safety Goggles", creatorName: "Trainer" }), share.created, share.updated, share.views]
    );
    for (let i = 0; i < share.likes; i++) {
      await db.query("INSERT INTO reactions (share_id, reaction_type, session_id) VALUES ($1, 'fire', $2)", [share.id, `s${i}`]);
    }
  }
  vi.mocked(getDb).mockReturnValue(makeSql() as never);
});

async function explore(params: Record<string, string>) {
  const url = new URL("https://example.test/api/explore");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await GET(new Request(url));
  return { status: response.status, body: (await response.json()) as { reports?: Array<{ id: string }>; nextCursor?: string | null; error?: string } };
}

/** Walks every page at `limit`, returning the ids in the order the reader sees them. */
async function pageThrough(sort: string, limit: number) {
  const seen: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 40; page++) {
    const params: Record<string, string> = { sort, limit: String(limit) };
    if (cursor) params.cursor = cursor;
    const { status, body } = await explore(params);
    expect(status, `page ${page} of ${sort}`).toBe(200);
    seen.push(...(body.reports ?? []).map((r) => r.id));
    cursor = body.nextCursor ?? null;
    if (!cursor) return seen;
  }
  throw new Error(`pagination of ${sort} never terminated`);
}

/** The same ordering in a single oversized page — the ground truth to page against. */
async function singlePage(sort: string) {
  const { status, body } = await explore({ sort, limit: "50" });
  expect(status).toBe(200);
  expect(body.nextCursor ?? null).toBeNull();
  return (body.reports ?? []).map((r) => r.id);
}

describe("VGC-295: Explore pagination must not skip or duplicate teams across page boundaries", () => {
  for (const sort of ["popular", "views"]) {
    it(`walks every team exactly once on ${sort}, where most rows are tied at 0`, async () => {
      const whole = await singlePage(sort);
      expect(whole).toHaveLength(SHARES.length);

      for (const limit of [1, 2, 3, 5]) {
        const paged = await pageThrough(sort, limit);
        expect(new Set(paged).size, `duplicate rows at limit ${limit}`).toBe(paged.length);
        expect([...paged].sort(), `missing rows at limit ${limit}`).toEqual(SHARES.map((s) => s.id).sort());
        expect(paged, `page order diverged from the full ordering at limit ${limit}`).toEqual(whole);
      }
    });
  }

  for (const sort of ["newest", "updated"]) {
    it(`still paginates ${sort} (chronological) over same-millisecond rows`, async () => {
      const whole = await singlePage(sort);
      expect(whole).toHaveLength(SHARES.length);

      for (const limit of [1, 2, 5]) {
        const paged = await pageThrough(sort, limit);
        expect(new Set(paged).size).toBe(paged.length);
        expect(paged).toEqual(whole);
      }
    });
  }

  it("orders popular by likes first, then by the tiebreakers", async () => {
    const order = await singlePage("popular");
    expect(order.slice(0, 3).sort()).toEqual(["pop-jjj", "pop-kkk", "pop-lll"]);
    expect(order.slice(3).every((id) => id.startsWith("tie-"))).toBe(true);
  });

  // Cursors minted before this fix are still in open tabs, in shared URLs and
  // in the response cache (which is keyed on the cursor STRING). They must
  // degrade, not 500.
  it("accepts legacy cursors with no id component instead of crashing", async () => {
    for (const sort of ["popular", "views"]) {
      for (const cursor of ["0", "0:2026-07-17T09:30:00.123Z", "3:2026-07-14T06:00:00.000Z"]) {
        const { status, body } = await explore({ sort, limit: "5", cursor });
        expect(status, `${sort} + legacy cursor ${cursor}`).toBe(200);
        expect(body.error).toBeUndefined();
        expect(Array.isArray(body.reports)).toBe(true);
      }
    }
    for (const cursor of ["2026-07-17T09:30:00.123Z", "garbage"]) {
      const { status, body } = await explore({ sort: "newest", limit: "5", cursor });
      expect(status, `newest + legacy cursor ${cursor}`).toBe(200);
      expect(Array.isArray(body.reports)).toBe(true);
    }
  });
});
