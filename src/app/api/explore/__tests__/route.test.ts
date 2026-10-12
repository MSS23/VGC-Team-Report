import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn(async () => ({ userId: null })) }));
vi.mock("@/lib/security/api-guard", () => ({ apiGuard: vi.fn(async () => null) }));
vi.mock("@/lib/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/posthog-server", () => ({ captureServerEvent: vi.fn() }));
vi.mock("@/lib/cache", () => ({
  cacheGet: vi.fn(async () => null),
  cacheSet: vi.fn(async () => undefined),
  CacheKeys: { explore: (k: string) => `explore:${k}` },
  CacheTTL: { EXPLORE_LIST: 60 },
}));

import { getDb } from "@/lib/db";
import { parseChronologicalCursor } from "@/lib/explore/chronological-cursor";
import { GET } from "../route";

// ───────────────────────────────────────────────────────────────────────────────
// A deliberately small Postgres stand-in. It renders the tagged-template query
// the route builds (fragments and all), then evaluates the ORDER BY and the
// keyset predicate through ONE shared expression mapper. That shared mapper is
// the point: if the route compares on a different expression than it sorts on —
// the VGC-295 bug, where the WHERE clause truncated to milliseconds and the
// ORDER BY did not — the fake reproduces Postgres' skipped/duplicated rows
// instead of hiding them.
// ───────────────────────────────────────────────────────────────────────────────

interface FakeRow {
  id: string;
  createdAt: string; // microsecond ISO
  updatedAt: string; // microsecond ISO
  viewCount: number;
  likeCount: number;
}

interface Fragment {
  __fragment: true;
  strings: readonly string[];
  values: unknown[];
}

const isFragment = (v: unknown): v is Fragment =>
  typeof v === "object" && v !== null && (v as Fragment).__fragment === true;

function render(strings: readonly string[], values: unknown[], params: unknown[]): string {
  let out = "";
  strings.forEach((chunk, i) => {
    out += chunk;
    if (i < values.length) {
      const value = values[i];
      if (isFragment(value)) out += render(value.strings, value.values, params);
      else {
        params.push(value);
        out += `$${params.length}`;
      }
    }
  });
  return out;
}

function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inString = false;
  let current = "";
  for (const ch of text) {
    if (ch === "'") {
      inString = !inString;
      current += ch;
      continue;
    }
    if (!inString) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if (ch === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Exact microseconds since the epoch, so a millisecond ISO cursor and a
 *  microsecond ISO column compare the way Postgres compares them. */
function micros(iso: string): number {
  const m = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z$/.exec(iso);
  if (!m) throw new Error(`unsupported timestamp literal: ${iso}`);
  const fraction = (m[2] ?? "").padEnd(6, "0").slice(0, 6);
  return Date.parse(`${m[1]}Z`) * 1000 + Number(fraction);
}

type Key = number | string;

/** The one mapper used for both ORDER BY terms and keyset comparison terms. */
function expressionReader(expr: string): (row: FakeRow) => Key {
  const normalized = expr.replace(/\s+/g, " ").trim();
  const trunc = /^date_trunc\('milliseconds', s\.(created_at|updated_at)\)$/.exec(normalized);
  if (trunc) {
    const col = trunc[1] === "updated_at" ? "updatedAt" : "createdAt";
    return (row) => Math.floor(micros(row[col]) / 1000) * 1000;
  }
  if (normalized === "s.created_at") return (row) => micros(row.createdAt);
  if (normalized === "s.updated_at") return (row) => micros(row.updatedAt);
  if (normalized === "s.id") return (row) => row.id;
  if (normalized === "COALESCE(s.view_count, 0)") return (row) => row.viewCount;
  if (normalized === "COALESCE(rc.like_count, 0)") return (row) => row.likeCount;
  throw new Error(`unsupported SQL expression: ${normalized}`);
}

function literalKey(token: string, params: unknown[]): Key {
  const raw = token.replace(/::timestamptz$/, "").trim();
  const ref = /^\$(\d+)$/.exec(raw);
  const value = ref ? params[Number(ref[1]) - 1] : raw;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    return /^\d{4}-\d{2}-\d{2}T/.test(value) ? micros(value) : value;
  }
  throw new Error(`unsupported SQL literal: ${token}`);
}

function orderByTerms(text: string): string[] {
  const m = /ORDER BY ([\s\S]*?)\s+LIMIT/.exec(text);
  if (!m) throw new Error("query has no ORDER BY");
  return splitTopLevel(m[1]).map((t) => t.replace(/\s+(ASC|DESC)$/i, "").trim());
}

/** The `(a, b, …) < ($1, $2, …)` or `a < $1` keyset boundary, if present. */
function keysetPredicate(text: string): { left: string[]; right: string[] } | null {
  const tupleAt = text.indexOf(") < (");
  if (tupleAt >= 0) {
    let depth = 1;
    let i = tupleAt - 1;
    for (; i >= 0 && depth > 0; i--) {
      if (text[i] === ")") depth++;
      else if (text[i] === "(") depth--;
    }
    const left = text.slice(i + 2, tupleAt);
    let close = tupleAt + 5;
    depth = 1;
    for (; close < text.length && depth > 0; close++) {
      if (text[close] === "(") depth++;
      else if (text[close] === ")") depth--;
    }
    return { left: splitTopLevel(left), right: splitTopLevel(text.slice(tupleAt + 5, close - 1)) };
  }
  const scalar = /AND (date_trunc\('milliseconds', s\.\w+\)|s\.\w+) < (\$\d+)(?:::timestamptz)?/.exec(text);
  return scalar ? { left: [scalar[1]], right: [scalar[2]] } : null;
}

function compareKeys(a: Key, b: Key): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

function makeSql(rows: FakeRow[]) {
  const queries: string[] = [];
  const sql = (strings: TemplateStringsArray, ...values: unknown[]) => {
    const params: unknown[] = [];
    const text = render(strings, values, params);
    const isExploreQuery = /FROM shares s/.test(text) && /ORDER BY/.test(text);
    if (!isExploreQuery) {
      // Composable fragment (AND …) vs. one of the batched side queries.
      if (!/^\s*SELECT/.test(text)) return { __fragment: true, strings, values } as Fragment;
      return Promise.resolve([] as Array<Record<string, unknown>>);
    }
    queries.push(text);

    const terms = orderByTerms(text).map(expressionReader);
    const ordered = [...rows].sort((a, b) => {
      for (const read of terms) {
        const diff = compareKeys(read(b), read(a)); // every explore sort is DESC
        if (diff !== 0) return diff;
      }
      return 0;
    });

    const keyset = keysetPredicate(text);
    const filtered = keyset
      ? ordered.filter((row) => {
          const left = keyset.left.map((expr) => expressionReader(expr)(row));
          const right = keyset.right.map((token) => literalKey(token, params));
          for (let i = 0; i < left.length; i++) {
            const diff = compareKeys(left[i], right[i]);
            if (diff !== 0) return diff < 0; // row-wise comparison, lexicographic
          }
          return false; // equal tuples: `<` is false
        })
      : ordered;

    const limitMatch = /LIMIT (\$\d+)/.exec(text);
    const limit = Number(literalKey(limitMatch![1], params));
    // cursor_ts, when selected, mirrors to_char(<sort column>) in the route.
    const cursorColumn = /to_char\(s\.updated_at/.test(text) ? "updatedAt" : "createdAt";
    const selectsCursorTs = /as cursor_ts/i.test(text);

    return Promise.resolve(
      filtered.slice(0, limit).map((row) => ({
        id: row.id,
        data: { paste: "Pikachu @ Light Ball", creatorName: "Trainer" },
        created_at: new Date(micros(row.createdAt) / 1000),
        updated_at: new Date(micros(row.updatedAt) / 1000),
        view_count: row.viewCount,
        like_count: row.likeCount,
        ...(selectsCursorTs ? { cursor_ts: row[cursorColumn] } : {}),
      })),
    );
  };
  return { sql, queries };
}

async function fetchPage(sort: string, limit: number, cursor: string | null) {
  const url = new URL("https://x.test/api/explore");
  url.searchParams.set("sort", sort);
  url.searchParams.set("limit", String(limit));
  if (cursor) url.searchParams.set("cursor", cursor);
  const response = await GET(new Request(url));
  expect(response.status).toBe(200);
  return (await response.json()) as {
    reports: Array<{ id: string }>;
    nextCursor: string | null;
  };
}

/** Page all the way through Explore and report every id handed to the client. */
async function pageThrough(sort: string, limit: number) {
  const ids: string[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < 20; page++) {
    const body = await fetchPage(sort, limit, cursor);
    ids.push(...body.reports.map((r) => r.id));
    if (!body.nextCursor) return ids;
    cursor = body.nextCursor;
  }
  throw new Error("pagination did not terminate");
}

const MS = "2026-09-20T12:00:00";

/** Three reports inside one millisecond (.123) plus one outside it. The ids are
 *  arranged so a millisecond-truncated boundary both repeats `aa01` and loses
 *  `yy03` — the two halves of VGC-295. */
const TIED_ROWS: FakeRow[] = [
  { id: "aa01", createdAt: `${MS}.123900Z`, updatedAt: `${MS}.123900Z`, viewCount: 0, likeCount: 0 },
  { id: "mm02", createdAt: `${MS}.123500Z`, updatedAt: `${MS}.123500Z`, viewCount: 0, likeCount: 0 },
  { id: "yy03", createdAt: `${MS}.123100Z`, updatedAt: `${MS}.123100Z`, viewCount: 0, likeCount: 0 },
  { id: "kk04", createdAt: `${MS}.100000Z`, updatedAt: `${MS}.100000Z`, viewCount: 0, likeCount: 0 },
];

const EXPECTED_ORDER = ["aa01", "mm02", "yy03", "kk04"];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/explore — VGC-295 same-millisecond keyset boundaries", () => {
  it.each(["newest", "updated"])(
    "returns every %s report exactly once when a page edge falls inside a shared millisecond",
    async (sort) => {
      vi.mocked(getDb).mockReturnValue(makeSql(TIED_ROWS).sql as never);
      // limit 2 puts the page edge between aa01/mm02 (same millisecond) and
      // leaves yy03 — also in that millisecond — for the next page.
      expect(await pageThrough(sort, 2)).toEqual(EXPECTED_ORDER);
    },
  );

  it.each(["popular", "views"])(
    "returns every %s report exactly once when the metric and the millisecond both tie",
    async (sort) => {
      vi.mocked(getDb).mockReturnValue(makeSql(TIED_ROWS).sql as never);
      expect(await pageThrough(sort, 2)).toEqual(EXPECTED_ORDER);
    },
  );

  it("walks the tie at every page size without skipping or duplicating a row", async () => {
    for (const sort of ["newest", "updated", "popular", "views"]) {
      for (const limit of [1, 2, 3]) {
        vi.mocked(getDb).mockReturnValue(makeSql(TIED_ROWS).sql as never);
        expect(await pageThrough(sort, limit)).toEqual(EXPECTED_ORDER);
      }
    }
  });

  it.each(["newest", "updated", "popular", "views"])(
    "compares %s cursors on the same expressions it sorts on",
    async (sort) => {
      const fake = makeSql(TIED_ROWS);
      vi.mocked(getDb).mockReturnValue(fake.sql as never);
      const first = await fetchPage(sort, 2, null);
      await fetchPage(sort, 2, first.nextCursor);

      const keyset = keysetPredicate(fake.queries[1]);
      expect(keyset).not.toBeNull();
      // The keyset tuple must be a prefix of the ORDER BY key, verbatim —
      // a date_trunc() on only one side is what broke pagination.
      expect(keyset!.left).toEqual(orderByTerms(fake.queries[1]).slice(0, keyset!.left.length));
      expect(fake.queries[1]).not.toContain("date_trunc");
    },
  );

  it("emits a microsecond-precision cursor that still parses as a chronological cursor", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(TIED_ROWS).sql as never);
    const page = await fetchPage("newest", 2, null);
    expect(page.nextCursor).toBe(`${MS}.123500Z~mm02`);
    expect(parseChronologicalCursor(page.nextCursor)).toEqual({
      timestamp: `${MS}.123500Z`,
      id: "mm02",
    });

    vi.mocked(getDb).mockReturnValue(makeSql(TIED_ROWS).sql as never);
    const popular = await fetchPage("popular", 2, null);
    expect(popular.nextCursor).toBe(`0:${MS}.123500Z~mm02`);
  });
});

describe("GET /api/explore — cursors issued before the fix", () => {
  it("still serves millisecond cursors already in the wild", async () => {
    const legacy: Array<string | null> = [
      `${MS}.123Z`, // pre-82f9210 chronological cursor: timestamp only
      `${MS}.123Z~mm02`, // post-82f9210 chronological cursor: millisecond + id
    ];
    for (const cursor of legacy) {
      vi.mocked(getDb).mockReturnValue(makeSql(TIED_ROWS).sql as never);
      const page = await fetchPage("newest", 2, cursor);
      const ids = page.reports.map((r) => r.id);
      expect(ids).toEqual([...new Set(ids)]);
      expect(ids).toContain("kk04");
      if (page.nextCursor) expect(parseChronologicalCursor(page.nextCursor)).not.toBeNull();
    }
  });

  it("still serves legacy popular cursors, with and without a timestamp", async () => {
    for (const cursor of ["0", `0:${MS}.123Z`]) {
      vi.mocked(getDb).mockReturnValue(makeSql(TIED_ROWS).sql as never);
      const page = await fetchPage("popular", 2, cursor);
      const ids = page.reports.map((r) => r.id);
      expect(ids).toEqual([...new Set(ids)]);
    }
  });

  it("ignores a cursor whose timestamp is not a date", async () => {
    vi.mocked(getDb).mockReturnValue(makeSql(TIED_ROWS).sql as never);
    const page = await fetchPage("newest", 2, "not-a-date~mm02");
    expect(page.reports.map((r) => r.id)).toEqual(["aa01", "mm02"]);
  });
});
