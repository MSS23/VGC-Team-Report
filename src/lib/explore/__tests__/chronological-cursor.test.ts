import { describe, expect, it } from "vitest";
import {
  parseChronologicalCursor,
  serializeChronologicalCursor,
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
});
