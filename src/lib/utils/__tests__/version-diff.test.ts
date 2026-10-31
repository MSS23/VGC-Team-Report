import { describe, expect, it } from "vitest";
import type { ShareableState } from "@/lib/sharing/url-codec";
import {
  computeVersionDiff,
  encodeSectionKey,
  getNavigableChanges,
  parseSectionKey,
  sectionKeyLabel,
  sectionKeySlide,
  summarizeChangedFields,
  type SectionKey,
  type VersionDiff,
} from "../version-diff";

const PASTE_A = `Incineroar @ Assault Vest
Ability: Intimidate
EVs: 252 HP / 4 Atk / 252 Def
- Fake Out

Rillaboom @ Miracle Seed
Ability: Grassy Surge
EVs: 252 HP / 252 Atk / 4 Def
- Fake Out`;

const state = (over: Partial<ShareableState> = {}): ShareableState => ({
  paste: PASTE_A,
  notes: {},
  matchupPlans: [],
  ...over,
});

const SPECIES = ["Incineroar", "Rillaboom"];

const diffOf = (current: ShareableState, old: ShareableState, speciesKeys = SPECIES): VersionDiff =>
  computeVersionDiff(current, old, 1, speciesKeys.length, speciesKeys, 0);

describe("section key round trip", () => {
  const cases: SectionKey[] = [
    { kind: "field", field: "teamSummary" },
    { kind: "field", field: "commonModes" },
    { kind: "field", field: "matchupPlans" },
    { kind: "field", field: "teamComposition" },
    { kind: "field", field: "mvpIndex" },
    { kind: "pokemon", index: 0 },
    { kind: "pokemon", index: 5 },
    { kind: "notes", speciesKey: "Incineroar" },
    { kind: "calcs", speciesKey: "Rillaboom" },
    { kind: "roles", speciesKey: "Urshifu-Rapid-Strike" },
    { kind: "slide", slide: 0 },
    { kind: "slide", slide: 7 },
  ];

  for (const key of cases) {
    it(`round-trips ${encodeSectionKey(key)}`, () => {
      expect(parseSectionKey(encodeSectionKey(key))).toEqual(key);
    });
  }

  it("rejects unknown keys instead of guessing", () => {
    expect(parseSectionKey("nonsense")).toBeNull();
    expect(parseSectionKey("bogus:1")).toBeNull();
    expect(parseSectionKey("pokemon:Incineroar")).toBeNull();
    expect(parseSectionKey("notes:")).toBeNull();
  });

  it("keeps species keys that contain a colon intact (splits on the first colon only)", () => {
    const key: SectionKey = { kind: "notes", speciesKey: "Type: Null" };
    expect(encodeSectionKey(key)).toBe("notes:Type: Null");
    expect(parseSectionKey("notes:Type: Null")).toEqual(key);
    expect(sectionKeyLabel(key)).toBe("Notes (Type: Null)");
    expect(sectionKeySlide(key, { pokemonCount: 2, speciesKeys: ["Type: Null", "Rillaboom"], plansCount: 0 })).toBe(2);
  });
});

describe("VGC-260 — pokemon:<index> is an index, not a species name", () => {
  it("labels a changed set with the real species name, not \"Set (0)\"", () => {
    const changed = PASTE_A.replace("Assault Vest", "Sitrus Berry");
    const diff = diffOf(state({ paste: changed }), state());

    expect(diff.changedFields.has("pokemon:0")).toBe(true);

    const changes = getNavigableChanges(diff, 2, SPECIES, 0);
    const setChange = changes.find((c) => c.field === "pokemon:0");

    expect(setChange?.label).toBe("Set (Incineroar)");
    expect(setChange?.label).not.toBe("Set (0)");
  });

  it("navigates to the changed Pokemon's own slide, not the overview", () => {
    const changed = PASTE_A.replace("Miracle Seed", "Assault Vest");
    const diff = diffOf(state({ paste: changed }), state());

    const changes = getNavigableChanges(diff, 2, SPECIES, 0);
    // Pokemon #1 (index 1) lives at slide index 1 + 2 = 3.
    expect(changes.find((c) => c.field === "pokemon:1")?.slide).toBe(3);
  });

  it("treats index 0 as a real Pokemon, not a missing one", () => {
    const key: SectionKey = { kind: "pokemon", index: 0 };
    const layout = { pokemonCount: 2, speciesKeys: SPECIES, plansCount: 0 };

    expect(sectionKeyLabel(key, SPECIES)).toBe("Set (Incineroar)");
    // Slide 2 is the first Pokemon slide — NOT slide 0 (the overview).
    expect(sectionKeySlide(key, layout)).toBe(2);
  });

  it("summarizes a set change with the species name when species keys are supplied", () => {
    const fields = new Set(["pokemon:0"]);
    expect(summarizeChangedFields(fields, SPECIES)).toContain("Set (Incineroar)");
    // Without the team context it degrades to a 1-based label, never "Set (0)".
    expect(summarizeChangedFields(fields)).toContain("Set (Pokemon 1)");
  });
});

describe("slide resolution", () => {
  const layout = { pokemonCount: 2, speciesKeys: SPECIES, plansCount: 3 };

  it("maps each Pokemon index to index + 2", () => {
    expect(sectionKeySlide({ kind: "pokemon", index: 0 }, layout)).toBe(2);
    expect(sectionKeySlide({ kind: "pokemon", index: 1 }, layout)).toBe(3);
  });

  it("falls back to the overview for an out-of-range index", () => {
    expect(sectionKeySlide({ kind: "pokemon", index: 9 }, layout)).toBe(0);
    expect(sectionKeyLabel({ kind: "pokemon", index: 9 }, SPECIES)).toBe("Set (Pokemon 10)");
  });

  it("falls back to the overview for a species key not on the team", () => {
    expect(sectionKeySlide({ kind: "notes", speciesKey: "Miraidon" }, layout)).toBe(0);
    expect(sectionKeySlide({ kind: "calcs", speciesKey: "Rillaboom" }, layout)).toBe(3);
  });

  it("puts commonModes on slide 1 and matchup plans on the matchup sheet", () => {
    expect(sectionKeySlide({ kind: "field", field: "commonModes" }, layout)).toBe(1);
    expect(sectionKeySlide({ kind: "field", field: "teamSummary" }, layout)).toBe(0);
    // pokemonCount + 5 + plansCount
    expect(sectionKeySlide({ kind: "field", field: "matchupPlans" }, layout)).toBe(10);
  });
});

describe("getNavigableChanges", () => {
  it("labels per-Pokemon fields and skips internal slide markers", () => {
    const diff = diffOf(
      state({ notes: { Incineroar: "Fake Out into Knock Off" }, roles: { Rillaboom: "Support" } }),
      state(),
    );

    expect(diff.changedFields.has("slide:2")).toBe(true);

    const changes = getNavigableChanges(diff, 2, SPECIES, 0);

    expect(changes.some((c) => c.field.startsWith("slide:"))).toBe(false);
    expect(changes).toEqual([
      { field: "notes:Incineroar", label: "Notes (Incineroar)", slide: 2 },
      { field: "roles:Rillaboom", label: "Role (Rillaboom)", slide: 3 },
    ]);
  });

  it("sorts changes by slide order", () => {
    const changed = PASTE_A.replace("Miracle Seed", "Assault Vest");
    const diff = diffOf(
      state({ paste: changed, teamSummary: "New summary", commonModes: { leads: "Incineroar + Rillaboom" } }),
      state(),
    );

    const slides = getNavigableChanges(diff, 2, SPECIES, 0).map((c) => c.slide);
    expect(slides).toEqual([...slides].sort((a, b) => a - b));
    expect(slides[0]).toBe(0); // team summary on the overview
  });
});

describe("summarizeChangedFields", () => {
  it("returns a friendly message when nothing changed", () => {
    expect(summarizeChangedFields(new Set())).toBe("No differences found");
    expect(summarizeChangedFields(new Set(["slide:2"]))).toBe("No differences found");
  });

  it("lists labels and truncates past four entries", () => {
    const fields = new Set([
      "teamSummary",
      "teamName",
      "record",
      "notes:Incineroar",
      "calcs:Rillaboom",
    ]);
    const summary = summarizeChangedFields(fields, SPECIES);
    expect(summary).toContain("Team summary");
    expect(summary).toContain("+1 more");
    expect(summary).toContain("highlighted in blue");
  });
});
