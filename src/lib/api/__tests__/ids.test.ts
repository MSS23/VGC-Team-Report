import { describe, expect, it } from "vitest";
import {
  generateAlphanumericId,
  generateEditToken,
  LOOSE_SHARE_ID_RE,
  SHARE_URL_ID_RE,
  ShareIdSchema,
  STRICT_SHARE_ID_RE,
} from "@/lib/api/ids";

describe("generateAlphanumericId", () => {
  it.each([8, 10])("returns %i alphanumeric chars", (length) => {
    for (let i = 0; i < 50; i++) expect(generateAlphanumericId(length)).toMatch(new RegExp(`^[A-Za-z0-9]{${length}}$`));
  });

  it("produces ids the strict share pattern accepts", () => {
    expect(STRICT_SHARE_ID_RE.test(generateAlphanumericId(8))).toBe(true);
  });

  it("does not repeat", () => {
    expect(new Set(Array.from({ length: 200 }, () => generateAlphanumericId(8))).size).toBe(200);
  });
});

describe("generateEditToken", () => {
  it("returns 64 lowercase hex chars", () => {
    expect(generateEditToken()).toMatch(/^[0-9a-f]{64}$/);
    expect(generateEditToken()).not.toBe(generateEditToken());
  });
});

describe("share id patterns", () => {
  it("STRICT accepts exactly 8 alphanumerics", () => {
    expect(STRICT_SHARE_ID_RE.test("abcD1234")).toBe(true);
    expect(STRICT_SHARE_ID_RE.test("abcD123")).toBe(false);
    expect(STRICT_SHARE_ID_RE.test("abcD12345")).toBe(false);
    expect(STRICT_SHARE_ID_RE.test("abc_1234")).toBe(false);
  });

  it("LOOSE accepts 6-16 chars including _ and -", () => {
    expect(LOOSE_SHARE_ID_RE.test("abc_-1")).toBe(true);
    expect(LOOSE_SHARE_ID_RE.test("a".repeat(16))).toBe(true);
    expect(LOOSE_SHARE_ID_RE.test("abc12")).toBe(false);
    expect(LOOSE_SHARE_ID_RE.test("a".repeat(17))).toBe(false);
  });

  it("SHARE_URL captures the id from a /s/ path", () => {
    expect("https://x.test/s/abcD1234?x=1".match(SHARE_URL_ID_RE)?.[1]).toBe("abcD1234");
    expect("https://x.test/s/abc".match(SHARE_URL_ID_RE)).toBeNull();
  });

  it("ShareIdSchema keeps the routes' error message", () => {
    expect(ShareIdSchema.safeParse("abcD1234").success).toBe(true);
    const bad = ShareIdSchema.safeParse("nope");
    expect(bad.success).toBe(false);
    expect(bad.error?.issues[0].message).toBe("Invalid share ID");
  });
});
