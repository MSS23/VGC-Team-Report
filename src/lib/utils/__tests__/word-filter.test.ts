import { describe, it, expect } from "vitest";
import { containsBlockedWords } from "@/lib/utils/word-filter";

describe("containsBlockedWords", () => {
  it("blocks obvious profanity", () => {
    expect(containsBlockedWords("this is shit")).toBe(true);
    expect(containsBlockedWords("what the fuck")).toBe(true);
  });

  it("blocks profanity with variations", () => {
    expect(containsBlockedWords("that's fucking annoying")).toBe(true);
    expect(containsBlockedWords("shitty team")).toBe(true);
  });

  it("blocks slurs", () => {
    expect(containsBlockedWords("you retard")).toBe(true);
  });

  it("blocks self-harm phrases", () => {
    expect(containsBlockedWords("kys")).toBe(true);
    expect(containsBlockedWords("kill yourself")).toBe(true);
  });

  it("allows clean text", () => {
    expect(containsBlockedWords("Great team build!")).toBe(false);
    expect(containsBlockedWords("This Garchomp is amazing")).toBe(false);
  });

  it("allows Pokemon names that could be false positives", () => {
    // "Assault Vest" contains "ass" but as part of a word, not standalone
    expect(containsBlockedWords("Assault Vest")).toBe(false);
  });

  it("handles empty string", () => {
    expect(containsBlockedWords("")).toBe(false);
  });
});
