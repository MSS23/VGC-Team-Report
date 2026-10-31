import { describe, expect, it } from "vitest";
import { matchupSectionKey, reportFingerprint } from "../collaboration";
describe("collaboration content identity", () => {
  it("ignores JSON key order and empty editor defaults", () => {
    expect(reportFingerprint({ paste: "Pikachu", notes: {}, hiddenSlides: [], allowComments: false }))
      .toBe(reportFingerprint({ notes: undefined, paste: "Pikachu" }));
  });
  it("detects privacy preferences and nested strategy edits", () => {
    expect(reportFingerprint({ matchupPlans: [{ showSlide: false }] })).not.toBe(reportFingerprint({ matchupPlans: [{}] }));
    expect(reportFingerprint({ privateFields: ["notes"] })).not.toBe(reportFingerprint({ privateFields: [] }));
    expect(reportFingerprint({ plans: [{ bring: [null, 1], notes: "A" }] })).not.toBe(reportFingerprint({ plans: [{ bring: [1, null], notes: "A" }] }));
  });
  it("keeps discussion attached to the opponent across line-ending changes", () => {
    expect(matchupSectionKey("Pikachu\r\n- Protect\r\n")).toBe(matchupSectionKey("Pikachu\n- Protect"));
    expect(matchupSectionKey("Pikachu\n- Protect")).not.toBe(matchupSectionKey("Raichu\n- Protect"));
  });
});
