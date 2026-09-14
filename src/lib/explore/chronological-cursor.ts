/**
 * Cursor codecs for the explore feed's keyset pagination.
 *
 * The explore feed paginates with keyset ("seek") cursors rather than OFFSET.
 * For that to be correct, three things must line up:
 *
 *   1. The cursor must carry the FULL sort key of the last row on the page,
 *      including a unique tiebreaker (the share id).
 *   2. The SQL filter expression must be IDENTICAL to the ORDER BY expression.
 *   3. The cursor timestamp must be byte-for-byte the value Postgres sorts on.
 *
 * (3) is why timestamps travel as opaque strings produced by Postgres
 * (`to_char(... 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`, microsecond precision) and
 * are never round-tripped through a JS `Date`. A JS `Date` only holds
 * milliseconds, so normalising through one silently truncates the cursor to a
 * lower precision than the column being compared, which drops or duplicates
 * every row that shares a millisecond with the cursor row.
 */

export interface ChronologicalCursor {
  timestamp: string;
  /** Unique tiebreaker. `null` only for legacy cursors issued before ids were included. */
  id: string | null;
}

/** Cursor for the metric-ordered feeds (popular = like count, views = view count). */
export interface CompositeCursor {
  value: number;
  timestamp: string;
  /** Unique tiebreaker. `null` for legacy cursors issued before ids were included. */
  id: string | null;
}

const CURSOR_SEPARATOR = "~";
const VALUE_SEPARATOR = ":";

/**
 * ISO-8601 UTC with an optional fractional part of any length. Timestamps that
 * already match are passed through verbatim so microsecond precision survives.
 */
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

/**
 * Normalise a timestamp for embedding in a cursor.
 *
 * Strings that are already ISO-8601 UTC are returned untouched — this is the
 * load-bearing case, because Postgres hands us microsecond precision and
 * `new Date(s).toISOString()` would quietly round it down to milliseconds.
 */
function toCursorTimestamp(timestamp: Date | string): string {
  if (typeof timestamp === "string") {
    return ISO_UTC.test(timestamp) ? timestamp : new Date(timestamp).toISOString();
  }
  return timestamp.toISOString();
}

function isValidTimestamp(timestamp: string): boolean {
  return timestamp.length > 0 && !Number.isNaN(Date.parse(timestamp));
}

export function parseChronologicalCursor(raw: string | null): ChronologicalCursor | null {
  if (!raw) return null;

  const separatorIndex = raw.lastIndexOf(CURSOR_SEPARATOR);
  const timestamp = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : raw;
  const id = separatorIndex >= 0 ? raw.slice(separatorIndex + 1) : null;

  if (!isValidTimestamp(timestamp)) return null;
  return { timestamp, id: id || null };
}

export function serializeChronologicalCursor(timestamp: Date | string, id: string): string {
  return `${toCursorTimestamp(timestamp)}${CURSOR_SEPARATOR}${id}`;
}

/**
 * Parse a `<value>:<iso timestamp>~<id>` cursor for the popular / views feeds.
 *
 * Two older formats are still accepted so cursors already held by a browser
 * keep working instead of erroring or paging from a wrong position:
 *   - `<value>:<iso timestamp>` (no id) — degrades to a two-column comparison,
 *     which is exactly how those cursors behaved when they were issued.
 *   - `<value>` alone — an ancient value-only cursor; anchored at the epoch so
 *     it walks past the whole tied block rather than repeating it.
 *
 * Anything unparseable returns `null`, which the route treats as "no cursor"
 * (first page) rather than passing garbage into a `::timestamptz` cast.
 */
export function parseCompositeCursor(raw: string | null): CompositeCursor | null {
  if (!raw) return null;

  const valueEnd = raw.indexOf(VALUE_SEPARATOR);
  if (valueEnd < 0) {
    const legacyValue = parseInt(raw, 10);
    if (!Number.isFinite(legacyValue)) return null;
    return { value: legacyValue, timestamp: new Date(0).toISOString(), id: null };
  }

  const value = parseInt(raw.slice(0, valueEnd), 10);
  if (!Number.isFinite(value)) return null;

  const rest = raw.slice(valueEnd + 1);
  // The id separator is `~`; share ids are alphanumeric and ISO timestamps
  // contain no `~`, so the last `~` unambiguously splits timestamp from id.
  const idStart = rest.lastIndexOf(CURSOR_SEPARATOR);
  const timestamp = idStart >= 0 ? rest.slice(0, idStart) : rest;
  const id = idStart >= 0 ? rest.slice(idStart + 1) : null;

  if (!isValidTimestamp(timestamp)) return null;
  return { value, timestamp, id: id || null };
}

export function serializeCompositeCursor(
  value: number,
  timestamp: Date | string,
  id: string,
): string {
  return `${Math.trunc(value)}${VALUE_SEPARATOR}${toCursorTimestamp(timestamp)}${CURSOR_SEPARATOR}${id}`;
}
