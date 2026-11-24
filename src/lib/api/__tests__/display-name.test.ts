import { describe, expect, it } from "vitest";
import { clerkDisplayName } from "@/lib/api/display-name";

const user = (firstName: string | null, lastName: string | null, username: string | null) => ({ firstName, lastName, username });

describe("clerkDisplayName", () => {
  it("joins first and last name", () => {
    expect(clerkDisplayName(user("Ash", "Ketchum", "ash"), "Unknown")).toBe("Ash Ketchum");
  });

  it("uses first name alone when last name is missing or empty", () => {
    expect(clerkDisplayName(user("Ash", null, "ash"), "Unknown")).toBe("Ash");
    expect(clerkDisplayName(user("Ash", "", "ash"), "Unknown")).toBe("Ash");
  });

  it("ignores last name without a first name", () => {
    expect(clerkDisplayName(user(null, "Ketchum", "ash"), "Unknown")).toBe("ash");
    expect(clerkDisplayName(user("", "Ketchum", "ash"), "Unknown")).toBe("ash");
  });

  it("returns the fallback for a null user or null username", () => {
    expect(clerkDisplayName(null, "Someone")).toBe("Someone");
    expect(clerkDisplayName(undefined, null)).toBeNull();
    expect(clerkDisplayName(user(null, null, null), "Unknown User")).toBe("Unknown User");
  });

  it("keeps an empty username by default (?? semantics)", () => {
    expect(clerkDisplayName(user(null, null, ""), "Unknown")).toBe("");
  });

  it("falls back on an empty username when asked (|| semantics)", () => {
    expect(clerkDisplayName(user(null, null, ""), "Unknown", { emptyUsernameFallsBack: true })).toBe("Unknown");
    expect(clerkDisplayName(user(null, null, "ash"), "Unknown", { emptyUsernameFallsBack: true })).toBe("ash");
  });
});
