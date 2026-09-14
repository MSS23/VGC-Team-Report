import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseChronologicalCursor,
  parseCompositeCursor,
  serializeChronologicalCursor,
  serializeCompositeCursor,
} from "@/lib/explore/chronological-cursor";

/**
 * Regression tests for the explore feed's keyset pagination.
 *
 * The bug: commit 82f9210 tried to fix a "same-millisecond skip" by wrapping
 * the cursor comparison in `date_trunc('milliseconds', …)`.
 *
 *  - On the popular / views paths that was a mathematical no-op. The cursor
 *    timestamp came from a JS `Date`, so it was already millisecond-aligned,
 *    and for an aligned `t`, `date_trunc('ms', x) < t` is equivalent to
 *    `x < t`. Rows sharing a millisecond with the cursor row stayed dropped.
 *  - On the chronological path it was worse than a no-op: the filter used
 *    `date_trunc('milliseconds', col)` while the ORDER BY still used the raw
 *    column, so rows in the same millisecond could be duplicated or skipped
 *    depending on how their ids sorted.
 *
 * These tests cover both halves of the fix: the SQL invariant (filter
 * expression == ORDER BY expression, ending in a unique column) and the cursor
 * codec semantics (full precision, unique tiebreaker, graceful legacy decode).
 *
 * There is no database in the unit-test environment, so the SQL itself is
 * checked structurally against the route source rather than executed.
 */

const ROUTE_PATH = path.resolve(__dirname, "../route.ts");
const routeSource = readFileSync(ROUTE_PATH, "utf8");
/** Route source minus whole-line `//` comments, so prose about the bug isn't matched as code. */
const routeCode = routeSource
  .split("\n")
  .filter((line) => !line.trim().startsWith("//"))
  .join("\n");

/** Split a SQL expression list on top-level commas (so COALESCE(a, 0) stays whole). */
function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of list) {
    if (char === "(") depth++;
    else if (char === ")") depth--;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function stripOuterParens(expr: string): string {
  const trimmed = expr.trim();
  if (!trimmed.startsWith("(")) return trimmed;
  let depth = 0;
  for (let i = 0; i < trimmed.length; i++) {
    if (trimmed[i] === "(") depth++;
    else if (trimmed[i] === ")") {
      depth--;
      // The opening paren closes before the end, so it isn't an outer wrapper.
      if (depth === 0) return i === trimmed.length - 1 ? trimmed.slice(1, -1) : trimmed;
    }
  }
  return trimmed;
}

interface SortPath {
  /** Cursor filter left-hand sides, in source order, shortest-to-longest irrelevant. */
  filters: string[][];
  /** ORDER BY expressions with the DESC/ASC direction stripped. */
  orderBy: string[];
}

/**
 * Walk the route source and pair every cursor filter with the ORDER BY that
 * follows it, giving one entry per sort path (popular, views, chronological).
 */
function extractSortPaths(source: string): SortPath[] {
  const paths: SortPath[] = [];
  let pending: string[][] = [];

  for (const rawLine of source.split("\n")) {
    const line = rawLine.trim();

    const filterMatch = /sql`AND (.+?) < /.exec(line);
    if (filterMatch) {
      pending.push(splitTopLevel(stripOuterParens(filterMatch[1])));
      continue;
    }

    const orderMatch = /^ORDER BY (.+)$/.exec(line);
    if (orderMatch) {
      const orderBy = splitTopLevel(orderMatch[1]).map((e) =>
        e.replace(/\s+(DESC|ASC)$/i, "").trim(),
      );
      paths.push({ filters: pending, orderBy });
      pending = [];
    }
  }

  return paths;
}

describe("explore route SQL: cursor filter must match ORDER BY", () => {
  const sortPaths = extractSortPaths(routeCode);

  it("finds all three sort paths", () => {
    expect(sortPaths).toHaveLength(3);
    for (const p of sortPaths) {
      expect(p.filters.length).toBeGreaterThan(0);
      expect(p.orderBy.length).toBeGreaterThan(0);
    }
  });

  it("never filters on date_trunc — that was the no-op/mismatched fix", () => {
    expect(routeCode).not.toContain("date_trunc");
  });

  it("ends every ORDER BY with the unique id tiebreaker", () => {
    for (const { orderBy } of sortPaths) {
      expect(orderBy[orderBy.length - 1]).toBe("s.id");
    }
  });

  it("uses the ORDER BY expressions verbatim in the full cursor filter", () => {
    for (const { filters, orderBy } of sortPaths) {
      const fullCursorFilter = filters.reduce((a, b) => (b.length >= a.length ? b : a));
      expect(fullCursorFilter).toEqual(orderBy);
    }
  });

  it("keeps legacy (shorter) cursor filters a strict prefix of the ORDER BY", () => {
    for (const { filters, orderBy } of sortPaths) {
      for (const filter of filters) {
        expect(filter).toEqual(orderBy.slice(0, filter.length));
      }
    }
  });
});

// ── Pagination semantics ────────────────────────────────────────────────────
// The SQL is structurally verified above; here the sort key + cursor codec are
// exercised end-to-end by walking pages over a deliberately tie-heavy dataset.

interface Row {
  id: string;
  metric: number;
  /** Microsecond-precision ISO, exactly what `to_char(..., '…US"Z"')` emits. */
  ts: string;
}

/**
 * Compare ISO timestamps the way Postgres compares timestamptz — by value, not
 * as strings. Lexicographic string comparison is only valid when both sides
 * carry the same number of fractional digits, which is exactly the assumption
 * the old millisecond-truncated cursor violated.
 */
function toMicros(iso: string): number {
  const m = /^(.*T\d{2}:\d{2}:\d{2})(?:\.(\d+))?Z$/.exec(iso);
  if (!m) throw new Error(`not an ISO UTC timestamp: ${iso}`);
  const frac = (m[2] ?? "").padEnd(6, "0").slice(0, 6);
  return Date.parse(`${m[1]}Z`) * 1000 + Number(frac);
}

/** DESC ordering on (metric, ts, id) — the ORDER BY the route issues. */
function compareDesc(a: Row, b: Row): number {
  if (a.metric !== b.metric) return b.metric - a.metric;
  const at = toMicros(a.ts);
  const bt = toMicros(b.ts);
  if (at !== bt) return bt - at;
  return b.id < a.id ? -1 : 1;
}

/** `(metric, ts, id) < (cursor…)` — the cursor filter the route issues. */
function isAfterCursor(row: Row, cursor: { value: number; timestamp: string; id: string | null }): boolean {
  if (row.metric !== cursor.value) return row.metric < cursor.value;
  const rowTs = toMicros(row.ts);
  const curTs = toMicros(cursor.timestamp);
  if (cursor.id === null) return rowTs < curTs;
  if (rowTs !== curTs) return rowTs < curTs;
  return row.id < cursor.id;
}

function paginateComposite(rows: Row[], pageSize: number, firstCursor: string | null = null) {
  const ordered = [...rows].sort(compareDesc);
  const pages: Row[][] = [];
  let cursor = firstCursor;

  for (let guard = 0; guard < 50; guard++) {
    const parsed = parseCompositeCursor(cursor);
    const candidates = parsed ? ordered.filter((r) => isAfterCursor(r, parsed)) : ordered;
    const fetched = candidates.slice(0, pageSize + 1);
    const hasMore = fetched.length > pageSize;
    const page = hasMore ? fetched.slice(0, pageSize) : fetched;
    if (page.length === 0) break;
    pages.push(page);
    if (!hasMore) break;
    const last = page[page.length - 1];
    cursor = serializeCompositeCursor(last.metric, last.ts, last.id);
  }

  return { ordered, pages, seen: pages.flat() };
}

/** Same walk for the chronological feed, whose sort key is just (ts, id). */
function paginateChronological(rows: Row[], pageSize: number) {
  const ordered = [...rows].sort(compareDesc);
  const pages: Row[][] = [];
  let cursor: string | null = null;

  for (let guard = 0; guard < 50; guard++) {
    const parsed = parseChronologicalCursor(cursor);
    const candidates = parsed
      ? ordered.filter((r) => {
          const rowTs = toMicros(r.ts);
          const curTs = toMicros(parsed.timestamp);
          if (parsed.id === null) return rowTs < curTs;
          if (rowTs !== curTs) return rowTs < curTs;
          return r.id < parsed.id;
        })
      : ordered;
    const fetched = candidates.slice(0, pageSize + 1);
    const hasMore = fetched.length > pageSize;
    const page = hasMore ? fetched.slice(0, pageSize) : fetched;
    if (page.length === 0) break;
    pages.push(page);
    if (!hasMore) break;
    const last = page[page.length - 1];
    cursor = serializeChronologicalCursor(last.ts, last.id);
  }

  return { ordered, pages, seen: pages.flat() };
}

/**
 * Rows that all share a like count AND a millisecond, differing only in
 * microseconds — precisely the shape the old cursor could not walk.
 */
const SAME_MILLISECOND: Row[] = [
  { id: "aaaaaaa1", metric: 0, ts: "2026-07-17T09:30:00.500999Z" },
  { id: "bbbbbbb2", metric: 0, ts: "2026-07-17T09:30:00.500123Z" },
  { id: "ccccccc3", metric: 0, ts: "2026-07-17T09:30:00.500001Z" },
  { id: "ddddddd4", metric: 0, ts: "2026-07-17T09:30:00.500777Z" },
  { id: "eeeeeee5", metric: 0, ts: "2026-07-17T09:30:00.500042Z" },
];

/** Rows identical down to the microsecond — only the id can separate them. */
const IDENTICAL_TIMESTAMP: Row[] = [
  { id: "zzzzzzz1", metric: 3, ts: "2026-07-17T09:30:00.250000Z" },
  { id: "mmmmmmm2", metric: 3, ts: "2026-07-17T09:30:00.250000Z" },
  { id: "aaaaaaa3", metric: 3, ts: "2026-07-17T09:30:00.250000Z" },
  { id: "qqqqqqq4", metric: 3, ts: "2026-07-17T09:30:00.250000Z" },
];

describe("explore pagination: rows sharing a sort key appear exactly once", () => {
  it("walks a block of same-millisecond rows without dropping any (popular/views)", () => {
    const { ordered, seen } = paginateComposite(SAME_MILLISECOND, 2);
    expect(seen.map((r) => r.id)).toEqual(ordered.map((r) => r.id));
  });

  it("walks rows with an identical microsecond timestamp using the id tiebreaker", () => {
    const { ordered, seen } = paginateComposite(IDENTICAL_TIMESTAMP, 1);
    expect(seen.map((r) => r.id)).toEqual(ordered.map((r) => r.id));
  });

  it("emits no duplicates and skips nothing across a tie-heavy mixed feed", () => {
    const rows: Row[] = [];
    // 4 like-count buckets x 6 rows, all inside one millisecond per bucket.
    for (let metric = 0; metric < 4; metric++) {
      for (let i = 0; i < 6; i++) {
        rows.push({
          id: `id${metric}${i}${String.fromCharCode(97 + i)}`,
          metric,
          ts: `2026-07-17T09:30:0${metric}.100${String(i * 111).padStart(3, "0")}Z`,
        });
      }
    }

    for (const pageSize of [1, 2, 3, 5, 7]) {
      const { ordered, seen } = paginateComposite(rows, pageSize);
      const ids = seen.map((r) => r.id);
      expect(new Set(ids).size, `duplicates at pageSize ${pageSize}`).toBe(ids.length);
      expect(ids, `skips at pageSize ${pageSize}`).toEqual(ordered.map((r) => r.id));
    }
  });

  it("walks the chronological feed without duplicates or skips", () => {
    for (const pageSize of [1, 2, 3]) {
      const { ordered, seen } = paginateChronological(
        [...SAME_MILLISECOND, ...IDENTICAL_TIMESTAMP.map((r) => ({ ...r, metric: 0 }))],
        pageSize,
      );
      const ids = seen.map((r) => r.id);
      expect(new Set(ids).size, `duplicates at pageSize ${pageSize}`).toBe(ids.length);
      expect(ids, `skips at pageSize ${pageSize}`).toEqual(ordered.map((r) => r.id));
    }
  });

  it("would drop rows if the cursor were truncated to milliseconds (guards the fix's sensitivity)", () => {
    // Reproduces the original bug: build the cursor from a JS Date, which only
    // holds milliseconds. `date_trunc('ms', x) < t` for a millisecond-aligned
    // `t` is just `x < t`, so the whole tied tail becomes unreachable.
    const ordered = [...SAME_MILLISECOND].sort(compareDesc);
    const last = ordered[1];
    const truncated = new Date(last.ts).toISOString(); // .500999Z -> .500Z
    expect(truncated).not.toBe(last.ts);

    const dropped = ordered.filter((r) =>
      isAfterCursor(r, { value: last.metric, timestamp: truncated, id: null }),
    );
    // Every remaining row shares the millisecond, so a truncated cursor
    // returns nothing — three reports silently vanish from the feed.
    expect(dropped).toEqual([]);
    expect(ordered.slice(2).length).toBe(3);
  });

  it("degrades a legacy id-less cursor to the old prefix behaviour instead of erroring", () => {
    // Pre-fix cursors were `<value>:<millisecond ISO>`. They must still decode,
    // page forward, and never repeat the rows already shown.
    const legacy = `0:2026-07-17T09:30:00.500Z`;
    expect(parseCompositeCursor(legacy)).toEqual({
      value: 0,
      timestamp: "2026-07-17T09:30:00.500Z",
      id: null,
    });

    const { seen } = paginateComposite(SAME_MILLISECOND, 2, legacy);
    const ids = seen.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Everything it does return still belongs strictly after the cursor.
    for (const row of seen) {
      expect(toMicros(row.ts)).toBeLessThan(toMicros("2026-07-17T09:30:00.500Z"));
    }
  });
});
