import { describe, it, expect } from "vitest";
import {
  RESTRICTED_LEGENDARIES,
  getRegulationLookupKey,
} from "@/lib/data/gen9-regulation-signals";

describe("RESTRICTED_LEGENDARIES", () => {
  // Regression: Xerneas/Yveltal/Zygarde were missing, so a Reg G team
  // carrying one was auto-tagged "Reg H" (the no-legendaries format).
  it("includes the Kalos restricted legendaries", () => {
    for (const key of ["xerneas", "yveltal", "zygarde"]) {
      expect(RESTRICTED_LEGENDARIES.has(key), key).toBe(true);
    }
  });
});

describe("getRegulationLookupKey", () => {
  // Regression: Zygarde-10%/50%/Complete and Terapagos-Terastal/Stellar
  // did not collapse to their base species, escaping restricted checks.
  it("collapses Zygarde and Terapagos forms to their base", () => {
    expect(getRegulationLookupKey("Zygarde-10%")).toBe("zygarde");
    expect(getRegulationLookupKey("Zygarde-50%")).toBe("zygarde");
    expect(getRegulationLookupKey("Zygarde-Complete")).toBe("zygarde");
    expect(getRegulationLookupKey("Terapagos-Terastal")).toBe("terapagos");
    expect(getRegulationLookupKey("Terapagos-Stellar")).toBe("terapagos");
  });

  it("still collapses existing forms", () => {
    expect(getRegulationLookupKey("Calyrex-Ice")).toBe("calyrex");
    expect(getRegulationLookupKey("Necrozma-Dusk-Mane")).toBe("necrozma");
    expect(getRegulationLookupKey("Urshifu-Rapid-Strike")).toBe("urshifu");
  });
});
