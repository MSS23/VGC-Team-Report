import { describe, expect, it } from "vitest";
import { reportSummaryFields } from "@/lib/api/report-summary";

describe("reportSummaryFields", () => {
  it("maps id and data to the leading report-card keys, in order", () => {
    const fields = reportSummaryFields({
      id: "AbCd1234",
      data: {
        paste: "Incineroar @ Sitrus Berry\nAbility: Intimidate\n\nAmoonguss @ Rocky Helmet\nAbility: Regenerator",
        tournamentName: "Worlds",
        creatorName: "Ash",
        placement: "Top 8",
      },
    });
    expect(Object.keys(fields)).toEqual(["id", "species", "tournamentName", "creatorName", "placement"]);
    expect(fields).toEqual({
      id: "AbCd1234",
      species: ["Incineroar", "Amoonguss"],
      tournamentName: "Worlds",
      creatorName: "Ash",
      placement: "Top 8",
    });
  });

  it("turns missing or empty strings into undefined, which JSON drops", () => {
    const fields = reportSummaryFields({ id: "AbCd1234", data: { tournamentName: "", creatorName: null } });
    expect(fields).toEqual({ id: "AbCd1234", species: [], tournamentName: undefined, creatorName: undefined, placement: undefined });
    expect(JSON.stringify(fields)).toBe('{"id":"AbCd1234","species":[]}');
  });
});
