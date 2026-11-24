import { describe, it, expect } from "vitest";
import { buildSpeciesKeys, shareStateToMeta } from "@/hooks/home-page-helpers";
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { ShareableState } from "@/lib/sharing/url-codec";

const team = (...species: string[]) =>
  species.map((s) => ({ parsed: { species: s } })) as unknown as TeamAnalysis["pokemon"];

describe("buildSpeciesKeys", () => {
  it("suffixes repeated species by occurrence so keys stay unique", () => {
    expect(buildSpeciesKeys(team("Incineroar", "Amoonguss", "Incineroar", "Incineroar"))).toEqual([
      "Incineroar",
      "Amoonguss",
      "Incineroar-2",
      "Incineroar-3",
    ]);
  });
});

describe("shareStateToMeta", () => {
  it("fills the same defaults the inline hydration blocks used", () => {
    expect(shareStateToMeta({ paste: "x" } as ShareableState)).toEqual({
      roles: {},
      summary: "",
      commonModes: undefined,
      teamName: undefined,
      tournamentName: undefined,
      placement: undefined,
      record: undefined,
      mvpIndex: null,
      rentalCode: undefined,
      creatorName: undefined,
      tags: undefined,
      templateId: undefined,
      privateFields: undefined,
    });
  });
});
