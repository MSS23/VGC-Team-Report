// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { lookupPokemon } from "@/lib/data/pokemon";
import type { AnalyzedPokemon } from "@/lib/types/analysis";

/**
 * One `getDefensiveProfile` call per Pokemon per build (18 type lookups each).
 * Counting it is how these tests prove the memo is real: the count must not
 * move when only the highlight changes.
 */
const { profileCalls } = vi.hoisted(() => ({ profileCalls: vi.fn() }));
vi.mock("@/lib/data/type-chart", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/data/type-chart")>();
  profileCalls.mockImplementation(actual.getDefensiveProfile);
  return { ...actual, getDefensiveProfile: profileCalls };
});

const { DefensiveCoverageChart, buildDefensiveCoverage } = await import("../DefensiveCoverageChart");

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
const DASH = "–";

/** Pinned Team Weak row for `team()` — a memo that goes stale shows up here. */
const TEAM_WEAK = [DASH, "1", "3", "1", DASH, "2", "1", DASH, "2", "1", "2", DASH, "2", "1", DASH, DASH, "1", "1"];
/** Same team with Charizard Mega-Evolved: Fire/Dragon trades Rock and Water for Ground and Dragon. */
const TEAM_WEAK_MEGA = [DASH, "1", "2", DASH, DASH, "2", "1", DASH, "3", "1", "2", DASH, "2", "1", "1", DASH, "1", "1"];

interface Mounted {
  container: HTMLElement;
  rerender: (props: Parameters<typeof DefensiveCoverageChart>[0]) => void;
  cleanup: () => void;
}

function mount(props: Parameters<typeof DefensiveCoverageChart>[0]): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(DefensiveCoverageChart, props)));
  return {
    container,
    rerender: (next) => act(() => root.render(createElement(DefensiveCoverageChart, next))),
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

/** Text of the team-summary row's 18 type cells, in ALL_TYPES order. */
function teamWeakRow(container: HTMLElement): string[] {
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
  profileCalls.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildDefensiveCoverage", () => {
  it("derives each Pokemon's weaknesses and the team summary", () => {
    const { rows, teamSummary } = buildDefensiveCoverage(team(), KEYS, NO_MEGAS);

    expect(rows.map((r) => r.species)).toEqual([
      "Incineroar", "Flutter Mane", "Iron Hands", "Landorus-Therian", "Charizard", "Amoonguss",
    ]);
    expect(teamSummary.map((s) => (s.weakCount > 0 ? String(s.weakCount) : DASH))).toEqual(TEAM_WEAK);
    expect(teamSummary[2]).toEqual({ type: "Water", weakCount: 3, resistCount: 1, immuneCount: 0 });
    expect(teamSummary[11]).toEqual({ type: "Bug", weakCount: 0, resistCount: 4, immuneCount: 0 });

    // Landorus-Therian's 4x Ice and its Ground/Flying Electric immunity.
    expect(rows[3].profile.Ice).toBe(4);
    expect(rows[3].profile.Electric).toBe(0);
    // Flutter Mane's Ghost immunities.
    expect(rows[1].profile.Normal).toBe(0);
    expect(rows[1].profile.Fighting).toBe(0);
  });

  it("reads megaStates — Mega Charizard X is Fire/Dragon, so Rock drops to 2x", () => {
    const base = buildDefensiveCoverage(team(), KEYS, {});
    const mega = buildDefensiveCoverage(team(), KEYS, { 4: true });

    expect(base.rows[4].types).toEqual(["Fire", "Flying"]);
    expect(base.rows[4].profile.Rock).toBe(4);
    expect(mega.rows[4].types).toEqual(["Fire", "Dragon"]);
    expect(mega.rows[4].profile.Rock).toBe(2);
    expect(mega.teamSummary.map((s) => (s.weakCount > 0 ? String(s.weakCount) : DASH))).toEqual(TEAM_WEAK_MEGA);
  });
});

describe("DefensiveCoverageChart highlighting", () => {
  it("does not recompute coverage when a type is highlighted", () => {
    const { container, cleanup } = mount({ pokemon: team(), speciesKeys: KEYS, megaStates: NO_MEGAS });

    expect(profileCalls.mock.calls.length).toBe(6); // one per Pokemon, once
    expect(teamWeakRow(container)).toEqual(TEAM_WEAK);

    const ice = highlightButton(container, "Ice");
    act(() => ice.click());

    // The whole point: a highlight tap is presentation only.
    expect(profileCalls.mock.calls.length).toBe(6);
    expect(ice.getAttribute("aria-pressed")).toBe("true");
    expect(teamWeakRow(container)).toEqual(TEAM_WEAK);

    // ...and the highlight still visibly applies.
    expect(highlightButton(container, "Rock").querySelector("span")?.className).toContain("opacity-50");

    // Toggling off, and onto another type, is equally free.
    act(() => ice.click());
    act(() => highlightButton(container, "Water").click());
    expect(profileCalls.mock.calls.length).toBe(6);
    expect(teamWeakRow(container)).toEqual(TEAM_WEAK);

    cleanup();
  });

  it("recomputes when the Mega toggle changes, so the memo can never go stale", () => {
    const pokemon = team();
    const { container, rerender, cleanup } = mount({ pokemon, speciesKeys: KEYS, megaStates: NO_MEGAS });

    act(() => highlightButton(container, "Ice").click());
    expect(profileCalls.mock.calls.length).toBe(6);
    expect(teamWeakRow(container)).toEqual(TEAM_WEAK);

    rerender({ pokemon, speciesKeys: KEYS, megaStates: { 4: true } });

    expect(profileCalls.mock.calls.length).toBe(12);
    expect(teamWeakRow(container)).toEqual(TEAM_WEAK_MEGA);

    cleanup();
  });

  it("recomputes when the team changes", () => {
    const { container, rerender, cleanup } = mount({ pokemon: team(), speciesKeys: KEYS, megaStates: NO_MEGAS });

    const withoutLandorus = team().filter((_, i) => i !== 3);
    const keysWithoutLandorus = KEYS.filter((_, i) => i !== 3);
    rerender({ pokemon: withoutLandorus, speciesKeys: keysWithoutLandorus, megaStates: NO_MEGAS });

    expect(profileCalls.mock.calls.length).toBe(11); // 6 + 5
    expect(speciesColumn(container)).toEqual([
      "Incineroar", "Flutter Mane", "Iron Hands", "Charizard", "Amoonguss",
    ]);
    // Landorus was the team's only 4x Ice liability and one of its three Water weaknesses.
    expect(teamWeakRow(container)[2]).toBe("2"); // Water: 3 -> 2
    expect(teamWeakRow(container)[5]).toBe("1"); // Ice: 2 -> 1

    cleanup();
  });
});
