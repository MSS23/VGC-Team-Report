import { describe, expect, it } from "vitest";
import { migrateCalcEntries, normalizeReportData } from "../normalize-report";
import { CALC_CATEGORIES, toCalcCategory } from "../calc-category";

/**
 * Regression: a stored calc whose `category` was not one of
 * "offensive" | "defensive" | "speed" used to pass straight through
 * `migrateCalcEntries` (declared as `category: string`, then laundered into
 * `CalcCategory` by the ShareableState casts). The report groups calcs with
 * three `category === ...` filters, so such an entry matched none of them and
 * the user's saved calc rendered in no group at all.
 */
describe("migrateCalcEntries — invalid category is no longer silently lost", () => {
  /** The grouping the report does: PokemonDetail CalcsPanel filters per category. */
  function groupLikeTheReport(entries: Array<{ text: string; category: string }>) {
    return CALC_CATEGORIES.map((category) => entries.filter((e) => e.category === category));
  }

  it("coerces an unrecognised category instead of dropping the calc", () => {
    const result = migrateCalcEntries({
      Miraidon: [
        { text: "Electro Drift vs Flutter Mane: 112%", category: "Offensive" },
        { text: "Ogerpon Ivy Cudgel vs Miraidon: 48%", category: "defence" },
        { text: "Outspeeds Chi-Yu", category: "" },
      ],
    });

    expect(result.Miraidon.map((e) => e.category)).toEqual([
      "offensive",
      "offensive",
      "offensive",
    ]);
    // Text is preserved verbatim — no entry is thrown away.
    expect(result.Miraidon.map((e) => e.text)).toEqual([
      "Electro Drift vs Flutter Mane: 112%",
      "Ogerpon Ivy Cudgel vs Miraidon: 48%",
      "Outspeeds Chi-Yu",
    ]);
  });

  it("leaves no calc unmatched by the report's three category filters", () => {
    const result = migrateCalcEntries({
      Miraidon: [
        { text: "a", category: "Offensive" },
        { text: "b", category: "speed " },
        { text: "c", category: 7 },
        { text: "d", category: null },
        { text: "e" },
        { text: "f", category: "defensive" },
        "legacy string calc",
      ],
    });

    const grouped = groupLikeTheReport(result.Miraidon);
    const rendered = grouped.flat().length;
    expect(rendered).toBe(result.Miraidon.length);
    expect(rendered).toBe(7);
  });

  it("shares one validator with the client hook's migration", () => {
    // `useDamageCalcs` migrates through the same `toCalcCategory`, so the two
    // paths cannot disagree about what a category is.
    expect(toCalcCategory("Offensive")).toBe("offensive");
    expect(toCalcCategory("speed")).toBe("speed");
    expect(toCalcCategory(undefined)).toBe("offensive");
    expect(CALC_CATEGORIES).toEqual(["offensive", "defensive", "speed"]);
  });
});

describe("migrateCalcEntries — stored data that renders today is unchanged", () => {
  it("preserves valid entries exactly", () => {
    const stored = {
      Miraidon: [
        { text: "Electro Drift vs Flutter Mane: 112%", category: "offensive" },
        { text: "Flutter Mane Moonblast vs Miraidon: 61%", category: "defensive" },
        { text: "Outspeeds +1 Dragonite", category: "speed" },
      ],
      Rillaboom: [{ text: "Grassy Glide vs Urshifu: 84%", category: "offensive" }],
    };

    expect(migrateCalcEntries(stored)).toEqual(stored);
  });

  it("still migrates the legacy shapes", () => {
    expect(migrateCalcEntries({ "0": ["Electro Drift vs Flutter Mane: 112%"] })).toEqual({
      "0": [{ text: "Electro Drift vs Flutter Mane: 112%", category: "offensive" }],
    });
    // Missing category defaults; non-array and non-object inputs stay tolerant.
    expect(migrateCalcEntries({ Miraidon: [{ text: "x" }] })).toEqual({
      Miraidon: [{ text: "x", category: "offensive" }],
    });
    expect(migrateCalcEntries({ Miraidon: "not an array" })).toEqual({});
    expect(migrateCalcEntries(null)).toEqual({});
    expect(migrateCalcEntries(undefined)).toEqual({});
  });
});

describe("normalizeReportData — a valid stored report round-trips unchanged", () => {
  const validReport = {
    paste: "Miraidon @ Choice Specs\nAbility: Hadron Engine\n- Electro Drift",
    notes: { Miraidon: "Lead vs Calyrex" },
    calcs: {
      Miraidon: [
        { text: "Electro Drift vs Flutter Mane: 112%", category: "offensive" },
        { text: "Moonblast vs Miraidon: 61%", category: "defensive" },
      ],
    },
    roles: { Miraidon: "Special attacker" },
    teamSummary: "Miraidon balance",
    teamName: "Hadron",
    tournamentName: "Regional",
    placement: "1st",
    record: "8-1",
    mvpIndex: 0,
    rentalCode: "ABC123",
    creatorName: "player",
    matchupPlans: [
      {
        opponentPaste: "Calyrex-Shadow @ Focus Sash",
        opponentLabel: "Calyrex-Shadow",
        showSlide: true,
        gamePlans: [{ bring: [0, 1, 2, 3], notes: "Lead Miraidon", result: undefined }],
      },
    ],
    spriteSettings: undefined,
    hiddenSlides: [2],
    allowComments: false,
    tags: ["restricted"],
    templateId: undefined,
  };

  it("preserves every field, including calcs", () => {
    const normalized = normalizeReportData({ ...validReport });
    expect(normalized).toEqual(validReport);
    expect(normalized.calcs).toEqual(validReport.calcs);
  });

  it("only coerces the category of a calc that would otherwise render nowhere", () => {
    const normalized = normalizeReportData({
      ...validReport,
      calcs: {
        Miraidon: [
          { text: "Electro Drift vs Flutter Mane: 112%", category: "offensive" },
          { text: "Moonblast vs Miraidon: 61%", category: "Defensive" },
        ],
      },
    });

    expect(normalized.calcs).toEqual({
      Miraidon: [
        { text: "Electro Drift vs Flutter Mane: 112%", category: "offensive" },
        { text: "Moonblast vs Miraidon: 61%", category: "offensive" },
      ],
    });
  });
});
