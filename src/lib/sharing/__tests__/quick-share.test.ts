import { describe, expect, it } from "vitest";
import { hashQuickToken, newQuickToken, ownsQuickShare, quickOwnerToken, validateQuickPaste } from "../quick-share";
describe("guest share ownership and input", () => {
  it("uses an unguessable creator cookie rather than the public URL to claim", () => {
    const token = newQuickToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(ownsQuickShare(token, hashQuickToken(token))).toBe(true);
    expect(ownsQuickShare(newQuickToken(), hashQuickToken(token))).toBe(false);
    expect(ownsQuickShare(null, hashQuickToken(token))).toBe(false);
    expect(ownsQuickShare(token, "bad")).toBe(false);
  });
  it("ignores malformed owner cookies", () => {
    expect(quickOwnerToken(new Request("https://example.test", { headers: { cookie: "vgc-quick-owner=abc" } }))).toBeNull();
  });
  it("rejects oversized, unknown, or moveless teams", () => {
    for (const paste of ["", "a".repeat(16001), "DefinitelyNotAPokemon\n- Protect", "Incineroar"]) expect(() => validateQuickPaste(paste)).toThrow();
    expect(validateQuickPaste("Incineroar\n- Protect")).toBe("Incineroar\n- Protect");
    expect(() => validateQuickPaste(Array(7).fill("Incineroar\n- Protect").join("\n\n"))).toThrow();
  });
});
