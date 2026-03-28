import { describe, it, expect, vi, afterEach } from "vitest";
import { relativeTime } from "@/lib/utils/relative-time";

describe("relativeTime", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for very recent timestamps', () => {
    const now = new Date().toISOString();
    expect(relativeTime(now)).toBe("Just now");
  });

  it("returns minutes ago", () => {
    vi.useFakeTimers();
    const base = new Date("2026-01-01T12:00:00Z");
    vi.setSystemTime(base);

    const fiveMinAgo = new Date("2026-01-01T11:55:00Z").toISOString();
    expect(relativeTime(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T15:00:00Z"));

    const threeHoursAgo = new Date("2026-01-01T12:00:00Z").toISOString();
    expect(relativeTime(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-10T12:00:00Z"));

    const fiveDaysAgo = new Date("2026-01-05T12:00:00Z").toISOString();
    expect(relativeTime(fiveDaysAgo)).toBe("5d ago");
  });

  it("returns months ago for 30+ days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T12:00:00Z"));

    const twoMonthsAgo = new Date("2026-01-15T12:00:00Z").toISOString();
    expect(relativeTime(twoMonthsAgo)).toBe("2mo ago");
  });
});
