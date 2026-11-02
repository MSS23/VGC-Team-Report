// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookupPokemon } from "@/lib/data/pokemon";
import type { AnalyzedPokemon } from "@/lib/types/analysis";

/**
 * `getEffectiveness` is the hot call inside the derivation — ~540 per build for
 * a full team. Counting it is how these tests prove the memo is real: the count
 * must not move when only the highlight changes.
 */
const { effectivenessCalls } = vi.hoisted(() => ({ effectivenessCalls: vi.fn() }));
vi.mock("@/lib/data/type-chart", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/type-chart")>();
  effectivenessCalls.mockImplementation(actual.getEffectiveness);
  return { ...actual, getEffectiveness: effectivenessCalls };
});

const { OffensiveCoverageChart, buildOffensiveCoverage } = await import("../OffensiveCoverageChart");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function mon(species: string, item: string | null, ability: string, moves: string[]): AnalyzedPokemon {
  return {
    parsed: { species, item, ability, moves } as AnalyzedPokemon["parsed"],
    data: lookupPokemon(species),
    calculatedStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    itemBoost: null,
  };
}

/** A representative Reg-G-shaped team: four attackers, a Mega, and a pure support. */
function team(): AnalyzedPokemon[] {
  return [
    mon("Incineroar", "Safety Goggles", "Intimidate", ["Flare Blitz", "Knock Off", "Fake Out", "Parting Shot"]),
    mon("Flutter Mane", "Focus Sash", "Protosynthesis", ["Moonblast", "Shadow Ball", "Icy Wind", "Protect"]),
    mon("Iron Hands", "Assault Vest", "Quark Drive", ["Drain Punch", "Wild Charge", "Fake Out", "Volt Switch"]),
    mon("Landorus-Therian", "Life Orb", "Intimidate", ["Earthquake", "Rock Slide", "U-turn", "Protect"]),
    mon("Charizard", "Charizardite X", "Blaze", ["Flamethrower", "Dragon Claw", "Tailwind", "Protect"]),
    mon("Amoonguss", "Rocky Helmet", "Regenerator", ["Spore", "Rage Powder", "Protect", "Leech Seed"]),
  ];
}

const KEYS = ["incineroar", "flutter-mane", "iron-hands", "landorus-therian", "charizard", "amoonguss"];
const NO_MEGAS: Record<number, boolean> = {};

/** Pinned Team SE row for `team()` — a memo that goes stale shows up here. */
const TEAM_SE = ["1", "1", "2", "1", "5", "4", "1", "1", "2", "3", "3", "3", "3", "2", "2", "3", "4", "1"];

interface Mounted {
  container: HTMLElement;
  rerender: (props: Parameters<typeof OffensiveCoverageChart>[0]) => void;
  cleanup: () => void;
}

function mount(props: Parameters<typeof OffensiveCoverageChart>[0]): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(OffensiveCoverageChart, props)));
  return {
    container,
    rerender: (next) => act(() => root.render(createElement(OffensiveCoverageChart, next))),
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

/** Text of the team-summary row's 18 type cells, in ALL_TYPES order. */
function teamSeRow(container: HTMLElement): string[] {
  const rows = container.querySelectorAll("tbody tr");
  const cells = rows[rows.length - 1].querySelectorAll("td");
  return Array.from(cells).slice(1).map((td) => td.textContent ?? "");
}

function speciesColumn(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("tbody tr"))
    .slice(0, -1)
    .map((tr) => tr.querySelector("td")?.textContent ?? "");
}

function highlightButton(container: HTMLElement, type: string): HTMLButtonElement {
  return container.querySelector(`thead button[aria-label="Highlight ${type} column"]`) as HTMLButtonElement;
}

beforeEach(() => {
  effectivenessCalls.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildOffensiveCoverage", () => {
  it("derives the team's best coverage per type", () => {
    const { rows, teamSummary } = buildOffensiveCoverage(team(), KEYS, NO_MEGAS);

    expect(rows.map((r) => r.species)).toEqual([
      "Incineroar", "Flutter Mane", "Iron Hands", "Landorus-Therian", "Charizard", "Amoonguss",
    ]);
    expect(teamSummary.map((s) => s.seCount)).toEqual(TEAM_SE.map(Number));

    // Incineroar: Flare Blitz is the pick into Steel, Knock Off into Ghost.
    expect(rows[0].profile.Steel).toEqual({ mult: 2, move: "Flare Blitz", typeConversion: null });
    expect(rows[0].profile.Ghost).toEqual({ mult: 2, move: "Knock Off", typeConversion: null });
    // Amoonguss has no damaging move, so it falls back to its STAB types.
    expect(rows[5].profile.Water).toEqual({ mult: 2, move: null, typeConversion: null });
    expect(rows[5].profile.Steel).toEqual({ mult: 0.5, move: null, typeConversion: null });
  });

  it("reads megaStates — Mega Altaria's Pixilate turns Hyper Voice Fairy", () => {
    const altaria = [mon("Altaria", "Altarianite", "Natural Cure", ["Hyper Voice", "Protect"])];

    const base = buildOffensiveCoverage(altaria, ["altaria"], {});
    const mega = buildOffensiveCoverage(altaria, ["altaria"], { 0: true });

    expect(base.rows[0].profile.Dragon.mult).toBe(1);
    expect(base.rows[0].hasTypeChangingAbility).toBe(false);
    expect(mega.rows[0].profile.Dragon).toEqual({
      mult: 2,
      move: "Hyper Voice",
      typeConversion: "Normal→Fairy via Pixilate",
    });
    expect(mega.rows[0].hasTypeChangingAbility).toBe(true);
  });
});

describe("OffensiveCoverageChart highlighting", () => {
  it("does not recompute coverage when a type is highlighted", () => {
    const { container, cleanup } = mount({ pokemon: team(), speciesKeys: KEYS, megaStates: NO_MEGAS });

    const callsAfterMount = effectivenessCalls.mock.calls.length;
    expect(callsAfterMount).toBeGreaterThan(300); // 306 for this team
    expect(teamSeRow(container)).toEqual(TEAM_SE);

    const steel = highlightButton(container, "Steel");
    act(() => steel.click());

    // The whole point: a highlight tap is presentation only.
    expect(effectivenessCalls.mock.calls.length).toBe(callsAfterMount);
    expect(steel.getAttribute("aria-pressed")).toBe("true");
    expect(teamSeRow(container)).toEqual(TEAM_SE);

    // ...and the highlight still visibly applies.
    expect(highlightButton(container, "Fire").querySelector("span")?.className).toContain("opacity-50");

    // Toggling off, and onto another type, is equally free.
    act(() => steel.click());
    act(() => highlightButton(container, "Fairy").click());
    expect(effectivenessCalls.mock.calls.length).toBe(callsAfterMount);
    expect(teamSeRow(container)).toEqual(TEAM_SE);

    cleanup();
  });

  it("recomputes when the team changes, so the memo can never go stale", () => {
    const { container, rerender, cleanup } = mount({ pokemon: team(), speciesKeys: KEYS, megaStates: NO_MEGAS });

    act(() => highlightButton(container, "Steel").click());
    const callsBefore = effectivenessCalls.mock.calls.length;

    const withoutLandorus = team().filter((_, i) => i !== 3);
    const keysWithoutLandorus = KEYS.filter((_, i) => i !== 3);
    rerender({ pokemon: withoutLandorus, speciesKeys: keysWithoutLandorus, megaStates: NO_MEGAS });

    expect(effectivenessCalls.mock.calls.length).toBeGreaterThan(callsBefore);
    expect(speciesColumn(container)).toEqual([
      "Incineroar", "Flutter Mane", "Iron Hands", "Charizard", "Amoonguss",
    ]);
    // Dropping Landorus loses the team's only Fire/Electric/Poison SE coverage.
    expect(teamSeRow(container)).toEqual(
      ["1", "–", "2", "–", "4", "3", "1", "–", "2", "2", "2", "2", "2", "2", "2", "2", "3", "1"],
    );

    cleanup();
  });

  it("recomputes when the Mega toggle changes", () => {
    const altaria = [mon("Altaria", "Altarianite", "Natural Cure", ["Hyper Voice", "Protect"])];
    const { container, rerender, cleanup } = mount({ pokemon: altaria, speciesKeys: ["altaria"], megaStates: {} });

    expect(teamSeRow(container)[14]).toBe("–"); // Dragon: no SE coverage as base Altaria

    rerender({ pokemon: altaria, speciesKeys: ["altaria"], megaStates: { 0: true } });

    expect(teamSeRow(container)[14]).toBe("1"); // Pixilate'd Hyper Voice now hits Dragon SE

    cleanup();
  });
});
