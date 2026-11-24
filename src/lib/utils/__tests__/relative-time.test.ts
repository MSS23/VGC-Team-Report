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

describe("relativeTime with options", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const NOW = "2026-01-20T12:00:00Z";
  const older = (d: Date) => `older:${d.toISOString()}`;

  it("keeps the short labels under 7 days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    expect(relativeTime("2026-01-20T11:59:30Z", { formatOlder: older })).toBe("Just now");
    expect(relativeTime("2026-01-20T11:15:00Z", { formatOlder: older })).toBe("45m ago");
    expect(relativeTime("2026-01-20T01:00:00Z", { formatOlder: older })).toBe("11h ago");
    expect(relativeTime("2026-01-13T12:00:01Z", { formatOlder: older })).toBe("6d ago");
    expect(relativeTime("2026-01-21T12:00:00Z", { formatOlder: older })).toBe("Just now");
  });

  it("hands 7+ day and invalid dates to formatOlder", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    expect(relativeTime("2026-01-13T12:00:00Z", { formatOlder: older })).toBe("older:2026-01-13T12:00:00.000Z");
    expect(relativeTime("2025-06-01T00:00:00Z", { formatOlder: older })).toBe("older:2025-06-01T00:00:00.000Z");
    expect(relativeTime("not a date", { formatOlder: (d) => String(d) })).toBe("Invalid Date");
  });

  it("uses a custom just-now label", () => {
    expect(relativeTime(new Date().toISOString(), { justNow: "just now" })).toBe("just now");
  });

  it("leaves the default output unchanged for invalid and old dates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
    expect(relativeTime("not a date")).toBe("Just now");
    expect(relativeTime("2026-01-10T12:00:00Z")).toBe("10d ago");
  });
});
