export interface ChronologicalCursor {
  timestamp: string;
  id: string | null;
}

const CURSOR_SEPARATOR = "~";

export function parseChronologicalCursor(raw: string | null): ChronologicalCursor | null {
  if (!raw) return null;

  const separatorIndex = raw.lastIndexOf(CURSOR_SEPARATOR);
  const timestamp = separatorIndex >= 0 ? raw.slice(0, separatorIndex) : raw;
  const id = separatorIndex >= 0 ? raw.slice(separatorIndex + 1) : null;

  if (!timestamp || Number.isNaN(Date.parse(timestamp))) return null;
  return { timestamp, id: id || null };
}

export function serializeChronologicalCursor(timestamp: Date | string, id: string): string {
  const isoTimestamp = timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString();
  return `${isoTimestamp}${CURSOR_SEPARATOR}${id}`;
}
