import { describe, it, expect } from "vitest";
import {
  CHAMPIONS_REGULATIONS,
  REGULATIONS,
  isChampionsFormat,
  toChampionsRegulation,
  usesRegMbPool,
} from "../tags";

// VGC-41: Pokémon Champions Regulation M-C went live 8 Sept 2026 and the app
// knew nothing about it — `REGULATIONS` stopped at "Reg M-B" and
// `isChampionsFormat` returned false for "Reg M-C", so every M-C report
// silently degraded to classic EV mode (losing the 66/32 SP budget, Mega
// handling and the IV lock). These tests name that bug.
describe("Champions regulation tags (VGC-41)", () => {
  it("lists Reg M-C as a selectable regulation, right after Reg M-B", () => {
    expect(REGULATIONS).toContain("Reg M-C");
    expect(REGULATIONS.indexOf("Reg M-C")).toBe(
      REGULATIONS.indexOf("Reg M-B") + 1,
    );
  });

  it("treats Reg M-C as a Champions format", () => {
    expect(isChampionsFormat("Reg M-C")).toBe(true);
  });

  it("still treats the older Champions regs as Champions formats", () => {
    expect(isChampionsFormat("Reg M-A")).toBe(true);
    expect(isChampionsFormat("Reg M-B")).toBe(true);
  });

  it("does not treat standard SV regs, Custom, or a missing tag as Champions", () => {
    for (const reg of ["Reg G", "Reg H", "Reg I", "Custom", "", "Reg M", "Reg M-D"]) {
      expect(isChampionsFormat(reg), `${reg} must not be Champions`).toBe(false);
    }
    expect(isChampionsFormat(undefined)).toBe(false);
    expect(isChampionsFormat(null)).toBe(false);
  });

  it("keeps CHAMPIONS_REGULATIONS and isChampionsFormat in sync", () => {
    for (const reg of CHAMPIONS_REGULATIONS) {
      expect(isChampionsFormat(reg), `${reg} must be Champions`).toBe(true);
      expect(REGULATIONS as readonly string[]).toContain(reg);
    }
  });

  it("narrows a Champions tag to itself and anything else to Reg M-A", () => {
    expect(toChampionsRegulation("Reg M-C")).toBe("Reg M-C");
    expect(toChampionsRegulation("Reg M-B")).toBe("Reg M-B");
    expect(toChampionsRegulation("Reg M-A")).toBe("Reg M-A");
    expect(toChampionsRegulation("Reg G")).toBe("Reg M-A");
    expect(toChampionsRegulation(undefined)).toBe("Reg M-A");
  });

  it("routes Reg M-C through the Reg M-B species pool", () => {
    // M-C is additive over M-B, and its own dex is not verified yet — it must
    // inherit the wider pool rather than fall back to the narrow M-A one.
    expect(usesRegMbPool("Reg M-C")).toBe(true);
    expect(usesRegMbPool("Reg M-B")).toBe(true);
    expect(usesRegMbPool("Reg M-A")).toBe(false);
    expect(usesRegMbPool("Reg H")).toBe(false);
  });
});
