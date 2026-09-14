import { describe, expect, it } from "vitest";
import {
  parseChronologicalCursor,
  parseCompositeCursor,
  serializeChronologicalCursor,
  serializeCompositeCursor,
} from "@/lib/explore/chronological-cursor";

describe("chronological explore cursors", () => {
  it("round-trips a timestamp and report ID", () => {
    const cursor = serializeChronologicalCursor("2026-07-17T09:30:00.000Z", "teamABC1");
    expect(parseChronologicalCursor(cursor)).toEqual({
      timestamp: "2026-07-17T09:30:00.000Z",
      id: "teamABC1",
    });
  });

  it("accepts legacy timestamp-only cursors", () => {
    expect(parseChronologicalCursor("2026-07-17T09:30:00.000Z")).toEqual({
      timestamp: "2026-07-17T09:30:00.000Z",
      id: null,
    });
  });

  it("rejects malformed cursors", () => {
    expect(parseChronologicalCursor("not-a-date~teamABC1")).toBeNull();
    expect(parseChronologicalCursor(null)).toBeNull();
  });

  // The bug: a JS Date only holds milliseconds, so normalising the cursor
  // through one truncated it below the precision of the timestamptz column it
  // is compared against — dropping every row sharing that millisecond.
  it("preserves microsecond precision from Postgres verbatim", () => {
    const cursor = serializeChronologicalCursor("2026-07-17T09:30:00.500123Z", "teamABC1");
    expect(cursor).toBe("2026-07-17T09:30:00.500123Z~teamABC1");
    expect(parseChronologicalCursor(cursor)?.timestamp).toBe("2026-07-17T09:30:00.500123Z");
  });

  it("still normalises a Date to ISO", () => {
    const cursor = serializeChronologicalCursor(new Date("2026-07-17T09:30:00.500Z"), "teamABC1");
    expect(cursor).toBe("2026-07-17T09:30:00.500Z~teamABC1");
  });
});

describe("composite explore cursors (popular / views)", () => {
  it("round-trips metric, microsecond timestamp and report ID", () => {
    const cursor = serializeCompositeCursor(12, "2026-07-17T09:30:00.500123Z", "teamABC1");
    expect(cursor).toBe("12:2026-07-17T09:30:00.500123Z~teamABC1");
    expect(parseCompositeCursor(cursor)).toEqual({
      value: 12,
      timestamp: "2026-07-17T09:30:00.500123Z",
      id: "teamABC1",
    });
  });

  it("handles a zero metric, the most common tied block", () => {
    const cursor = serializeCompositeCursor(0, "2026-07-17T09:30:00.000001Z", "aaaaaaa1");
    expect(parseCompositeCursor(cursor)).toEqual({
      value: 0,
      timestamp: "2026-07-17T09:30:00.000001Z",
      id: "aaaaaaa1",
    });
  });

  it("accepts the previous `<value>:<iso>` format with no id", () => {
    expect(parseCompositeCursor("7:2026-07-17T09:30:00.500Z")).toEqual({
      value: 7,
      timestamp: "2026-07-17T09:30:00.500Z",
      id: null,
    });
  });

  it("accepts an ancient value-only cursor by anchoring at the epoch", () => {
    expect(parseCompositeCursor("7")).toEqual({
      value: 7,
      timestamp: new Date(0).toISOString(),
      id: null,
    });
  });

  it("returns null for junk so the route falls back to the first page", () => {
    expect(parseCompositeCursor(null)).toBeNull();
    expect(parseCompositeCursor("")).toBeNull();
    expect(parseCompositeCursor("abc")).toBeNull();
    expect(parseCompositeCursor("7:not-a-date")).toBeNull();
    expect(parseCompositeCursor("7:not-a-date~teamABC1")).toBeNull();
    expect(parseCompositeCursor(":2026-07-17T09:30:00.500Z~teamABC1")).toBeNull();
  });

  it("does not let the ISO timestamp's own colons confuse the value split", () => {
    const parsed = parseCompositeCursor("103:2026-07-17T09:30:00.500123Z~teamABC1");
    expect(parsed?.value).toBe(103);
    expect(parsed?.timestamp).toBe("2026-07-17T09:30:00.500123Z");
    expect(parsed?.id).toBe("teamABC1");
  });
});
