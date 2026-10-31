import { describe, expect, it } from "vitest";
import {
  parseChronologicalCursor,
  parseMetricCursor,
  serializeChronologicalCursor,
  serializeMetricCursor,
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

  // VGC-295: two reports sharing a millisecond must still get distinct,
  // totally-ordered cursors — otherwise the page boundary falls inside the
  // tie and a row is skipped or returned twice.
  it("VGC-295: same-millisecond rows produce distinct cursors carrying their id", () => {
    const sharedMs = "2026-07-17T09:30:00.123Z";
    const first = serializeChronologicalCursor(sharedMs, "teamAAA1");
    const second = serializeChronologicalCursor(sharedMs, "teamBBB2");

    expect(first).not.toBe(second);
    expect(parseChronologicalCursor(first)).toEqual({ timestamp: sharedMs, id: "teamAAA1" });
    expect(parseChronologicalCursor(second)).toEqual({ timestamp: sharedMs, id: "teamBBB2" });
  });

  it("VGC-295: preserves sub-second precision rather than truncating to the second", () => {
    const cursor = serializeChronologicalCursor(new Date("2026-07-17T09:30:00.456Z"), "teamABC1");
    expect(parseChronologicalCursor(cursor)?.timestamp).toBe("2026-07-17T09:30:00.456Z");
  });

  it("keeps ids that contain the separator intact", () => {
    const cursor = serializeChronologicalCursor("2026-07-17T09:30:00.000Z", "team~odd");
    expect(parseChronologicalCursor(cursor)).toEqual({
      timestamp: "2026-07-17T09:30:00.000Z",
      id: "team~odd",
    });
  });
});

describe("metric explore cursors (popular / views)", () => {
  it("round-trips a value, timestamp and report ID", () => {
    const cursor = serializeMetricCursor(42, "2026-07-17T09:30:00.000Z", "teamABC1");
    expect(parseMetricCursor(cursor)).toEqual({
      value: 42,
      timestamp: "2026-07-17T09:30:00.000Z",
      id: "teamABC1",
    });
  });

  // VGC-295 compatibility gate: route.ts keys its response cache on the
  // cursor STRING, so cursors minted before this change are still in caches
  // and in flight. They must keep parsing.
  it("VGC-295: tolerates the legacy value:timestamp cursor (no id tiebreaker)", () => {
    expect(parseMetricCursor("7:2026-07-17T09:30:00.000Z")).toEqual({
      value: 7,
      timestamp: "2026-07-17T09:30:00.000Z",
      id: null,
    });
  });

  it("VGC-295: tolerates the legacy value-only cursor", () => {
    expect(parseMetricCursor("7")).toEqual({
      value: 7,
      timestamp: new Date(0).toISOString(),
      id: null,
    });
  });

  it("VGC-295: ties on the metric AND the millisecond still produce distinct cursors", () => {
    const sharedMs = "2026-07-17T09:30:00.123Z";
    const first = serializeMetricCursor(0, sharedMs, "teamAAA1");
    const second = serializeMetricCursor(0, sharedMs, "teamBBB2");

    expect(first).not.toBe(second);
    expect(parseMetricCursor(first)?.id).toBe("teamAAA1");
    expect(parseMetricCursor(second)?.id).toBe("teamBBB2");
  });

  it("rejects malformed cursors safely", () => {
    expect(parseMetricCursor(null)).toBeNull();
    expect(parseMetricCursor("")).toBeNull();
    expect(parseMetricCursor("notanumber")).toBeNull();
    expect(parseMetricCursor("12:not-a-date")).toBeNull();
    expect(parseMetricCursor("12:")).toBeNull();
    expect(parseMetricCursor(":2026-07-17T09:30:00.000Z")).toBeNull();
  });

  it("refuses to serialize an unusable value or timestamp", () => {
    expect(() => serializeMetricCursor(Number.NaN, "2026-07-17T09:30:00.000Z", "a")).toThrow();
    expect(() => serializeMetricCursor(1, "not-a-date", "a")).toThrow();
    expect(() => serializeChronologicalCursor("not-a-date", "a")).toThrow();
  });
});
