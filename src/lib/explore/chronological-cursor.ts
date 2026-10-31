/**
 * Keyset-pagination cursors for the Explore feed.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * VGC-295 IS ONLY HALF-FIXED. DO NOT ASSUME THE BUG IS GONE.
 *
 * The bug: rows sharing a created_at/updated_at millisecond can be skipped
 * or returned twice across a page boundary, because
 * `src/app/api/explore/route.ts` compares a millisecond-truncated timestamp
 * in its WHERE clause while ORDER BY sorts the RAW column — so the filter
 * order and the sort order disagree on ties. The `popular` and `views`
 * branches are worse: they tuple-compare on (metric, created_at) with no id
 * tiebreaker at all, so tied rows have no total order.
 *
 * This module is the cursor half of the fix: every cursor now carries a
 * full `(timestamp, id)` pair, so the route *can* filter unambiguously.
 *
 * STILL OUTSTANDING: the SQL half. The WHERE/ORDER BY mismatch in
 * `route.ts` (~L194-195 popular, ~L208-209 views, ~L217-227 chronological)
 * is UNCHANGED and still mispaginates. The ticket gates that edit on an
 * `EXPLAIN` against a real database — Explore is a hot, cached path and
 * index behaviour matters, so it must not be a blind edit. No DATABASE_URL
 * was available when this landed. Whoever has a database next: run the
 * EXPLAIN, then make WHERE and ORDER BY agree on `(timestamp, id)` using
 * `parseMetricCursor().id` / `parseChronologicalCursor().id`.
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Wire formats (all parsers stay tolerant of the older, shorter forms —
 * `route.ts` keys its response cache on the cursor STRING, so cursors in
 * flight and in cache predate any format change and must still parse):
 *
 *   chronological: `<iso>`                  (legacy, no tiebreaker)
 *                  `<iso>~<id>`             (current)
 *   metric:        `<value>`                (legacy, value only)
 *                  `<value>:<iso>`          (legacy, no id tiebreaker)
 *                  `<value>:<iso>~<id>`     (current)
 */

export interface ChronologicalCursor {
  timestamp: string;
  id: string | null;
}

/**
 * Cursor for the `popular` / `views` orderings: the metric value plus the
 * `(timestamp, id)` pair that breaks the (very common) metric ties.
 */
export interface MetricCursor {
  value: number;
  timestamp: string;
  id: string | null;
}

const CURSOR_SEPARATOR = "~";
const METRIC_SEPARATOR = ":";

function toIso(timestamp: Date | string): string | null {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * Splits `<timestamp>~<id>` into its parts. ISO timestamps never contain
 * `~`, so the FIRST separator is the boundary and everything after it is the
 * id — ids containing `~` survive intact.
 */
function splitTimestampAndId(raw: string): { timestamp: string; id: string | null } {
  const separatorIndex = raw.indexOf(CURSOR_SEPARATOR);
  if (separatorIndex < 0) return { timestamp: raw, id: null };
  return {
    timestamp: raw.slice(0, separatorIndex),
    id: raw.slice(separatorIndex + 1) || null,
  };
}

export function parseChronologicalCursor(raw: string | null): ChronologicalCursor | null {
  if (!raw) return null;

  const { timestamp, id } = splitTimestampAndId(raw);
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return null;
  return { timestamp, id };
}

export function serializeChronologicalCursor(timestamp: Date | string, id: string): string {
  const isoTimestamp = toIso(timestamp);
  if (!isoTimestamp) throw new RangeError(`Invalid cursor timestamp: ${String(timestamp)}`);
  return `${isoTimestamp}${CURSOR_SEPARATOR}${id}`;
}

/**
 * Parses a `popular` / `views` cursor. Tolerant of both legacy forms; the
 * missing halves come back as the epoch / `null` so an old cursor still
 * paginates (imprecisely) rather than 500-ing or silently resetting to
 * page 1.
 */
export function parseMetricCursor(raw: string | null): MetricCursor | null {
  if (!raw) return null;

  const separatorIndex = raw.indexOf(METRIC_SEPARATOR);
  if (separatorIndex < 0) {
    // Legacy value-only cursor — no tiebreaker information at all.
    const value = parseInt(raw, 10);
    if (!Number.isFinite(value)) return null;
    return { value, timestamp: new Date(0).toISOString(), id: null };
  }

  const value = parseInt(raw.slice(0, separatorIndex), 10);
  if (!Number.isFinite(value)) return null;

  const { timestamp, id } = splitTimestampAndId(raw.slice(separatorIndex + 1));
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return null;
  return { value, timestamp, id };
}

export function serializeMetricCursor(value: number, timestamp: Date | string, id: string): string {
  if (!Number.isFinite(value)) throw new RangeError(`Invalid cursor value: ${String(value)}`);
  const isoTimestamp = toIso(timestamp);
  if (!isoTimestamp) throw new RangeError(`Invalid cursor timestamp: ${String(timestamp)}`);
  return `${Math.trunc(value)}${METRIC_SEPARATOR}${isoTimestamp}${CURSOR_SEPARATOR}${id}`;
}
