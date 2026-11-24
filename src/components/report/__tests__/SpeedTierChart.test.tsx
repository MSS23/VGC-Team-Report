// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { lookupPokemon } from "@/lib/data/pokemon";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { SpeedTierChart } from "../SpeedTierChart";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * THE BUG: Mega speed-tier rows used the BASE form's ability.
 *
 * The "Ability x2" toggle threads an `ability` onto every chart entry, but the
 * Mega overlay rows were built with `mon.parsed.ability` — and a paste only
 * ever names one ability, the base form's. So the toggle was wrong in both
 * directions:
 *
 *   - FALSE POSITIVE: `Venusaur @ Venusaurite` with `Ability: Chlorophyll`
 *     doubled the Mega Venusaur row, placing it at 2x its real Speed. Mega
 *     Venusaur's ability is Thick Fat; it cannot have Chlorophyll.
 *   - FALSE NEGATIVE: `Swampert @ Swampertite` never doubled the Mega Swampert
 *     row, even though Mega Swampert has its own Swift Swim. The base form's
 *     Torrent isn't a doubling ability, so the rain sweeper sat still while
 *     every other doubling row moved.
 *
 * Numbers below are pinned at level 50 (VGC is always level 50) in Reg M-C,
 * which uses Champions SP. 252 Spe EVs convert to the 32 SP per-stat cap.
 */

const SPE_ONLY = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 252 };
const ALL_31 = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

function mon(
  species: string,
  item: string | null,
  ability: string,
  nature: string,
): AnalyzedPokemon {
  return {
    parsed: {
      species,
      item,
      ability,
      nature,
      level: 50,
      moves: ["Protect"],
      evs: { ...SPE_ONLY },
      ivs: { ...ALL_31 },
    } as AnalyzedPokemon["parsed"],
    data: lookupPokemon(species),
    calculatedStats: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    itemBoost: null,
  } as AnalyzedPokemon;
}

interface Mounted {
  container: HTMLElement;
  cleanup: () => void;
}

function mount(props: Parameters<typeof SpeedTierChart>[0]): Mounted {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => root.render(createElement(SpeedTierChart, props)));
  return {
    container,
    cleanup: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

/** Every rendered speed row, as { species, speed }, in displayed order. */
function speedRows(container: HTMLElement): Array<{ species: string; speed: number }> {
  return Array.from(container.querySelectorAll("span.truncate")).map((name) => {
    const row = name.parentElement!.parentElement!;
    const value = row.querySelector('span[class*="--font-mono"]');
    return {
      species: name.textContent ?? "",
      speed: Number(value?.textContent ?? NaN),
    };
  });
}

function speedOf(container: HTMLElement, species: string): number | undefined {
  return speedRows(container).find((r) => r.species === species)?.speed;
}

/** The "Mega" badge tooltip for a row — the label half of this bug. */
function megaBadgeTitle(container: HTMLElement, species: string): string | null {
  const name = Array.from(container.querySelectorAll("span.truncate"))
    .find((n) => n.textContent === species);
  const row = name?.parentElement?.parentElement;
  return row?.querySelector('span[title^="Mega-evolved speed"]')?.getAttribute("title") ?? null;
}

/** Clicks the per-side "Ability x2" modifier for the user's own team. */
function enableAbilityDoubling(container: HTMLElement): void {
  const button = container.querySelector(
    'button[title^="Ability ×2 on Your team"]',
  ) as HTMLButtonElement;
  expect(button).toBeTruthy();
  act(() => button.click());
  expect(button.getAttribute("aria-pressed")).toBe("true");
}

const MEGA_SPECIES = {
  venusaur: lookupPokemon("venusaur-mega")!.name,
  swampert: lookupPokemon("swampert-mega")!.name,
};

describe("SpeedTierChart — Mega rows read the Mega's own ability, not the base form's", () => {
  it("Venusaur @ Venusaurite + Chlorophyll: the Mega row does NOT double (Thick Fat)", () => {
    const team = [mon("Venusaur", "Venusaurite", "Chlorophyll", "Timid")];
    const { container, cleanup } = mount({
      pokemon: team,
      speciesKeys: ["venusaur"],
      regulation: "Reg M-C",
      megaStates: {},
    });

    // Base 80 Spe, 32 SP, Timid -> 145. Mega Venusaur shares the base Speed.
    expect(speedOf(container, "Venusaur")).toBe(145);
    expect(speedOf(container, MEGA_SPECIES.venusaur)).toBe(145);

    enableAbilityDoubling(container);

    // Base Venusaur really does have Chlorophyll, so it doubles: 145 -> 290.
    expect(speedOf(container, "Venusaur")).toBe(290);
    // THE BUG: the Mega row doubled to 290 too, 2x its real Speed.
    expect(speedOf(container, MEGA_SPECIES.venusaur)).toBe(145);
    // ...and the label agrees with the number.
    expect(megaBadgeTitle(container, MEGA_SPECIES.venusaur)).toContain("Thick Fat");
    expect(megaBadgeTitle(container, MEGA_SPECIES.venusaur)).not.toContain("Chlorophyll");

    cleanup();
  });

  it("Swampert @ Swampertite: the Mega row DOES double (its own Swift Swim)", () => {
    const team = [mon("Swampert", "Swampertite", "Torrent", "Adamant")];
    const { container, cleanup } = mount({
      pokemon: team,
      speciesKeys: ["swampert"],
      regulation: "Reg M-C",
      megaStates: {},
    });

    // Base 60 Spe -> 112; Mega Swampert's 70 Spe -> 122 (Adamant is neutral).
    expect(speedOf(container, "Swampert")).toBe(112);
    expect(speedOf(container, MEGA_SPECIES.swampert)).toBe(122);

    enableAbilityDoubling(container);

    // Torrent is not a doubling ability, so the base row holds still.
    expect(speedOf(container, "Swampert")).toBe(112);
    // THE BUG: this row stayed at 122 because it was handed Torrent.
    expect(speedOf(container, MEGA_SPECIES.swampert)).toBe(244);
    expect(megaBadgeTitle(container, MEGA_SPECIES.swampert)).toContain("Swift Swim");

    cleanup();
  });

  it("the card's own Mega toggle gets the same treatment (primary row is the Mega)", () => {
    const team = [mon("Venusaur", "Venusaurite", "Chlorophyll", "Timid")];
    const { container, cleanup } = mount({
      pokemon: team,
      speciesKeys: ["venusaur"],
      regulation: "Reg M-C",
      // Mega selected on the card: the primary row IS the Mega, and there is
      // no separate overlay row to carry the fix.
      megaStates: { 0: true },
    });

    expect(speedRows(container).map((r) => r.species)).toEqual([MEGA_SPECIES.venusaur]);

    enableAbilityDoubling(container);

    expect(speedOf(container, MEGA_SPECIES.venusaur)).toBe(145);

    cleanup();
  });

  it("no regression: a non-Mega Chlorophyll Pokemon still doubles", () => {
    const team = [mon("Venusaur", "Life Orb", "Chlorophyll", "Timid")];
    const { container, cleanup } = mount({
      pokemon: team,
      speciesKeys: ["venusaur"],
      regulation: "Reg M-C",
      megaStates: {},
    });

    // No Mega Stone -> no Mega overlay row at all.
    expect(speedRows(container).map((r) => r.species)).toEqual(["Venusaur"]);
    expect(speedOf(container, "Venusaur")).toBe(145);

    enableAbilityDoubling(container);

    expect(speedOf(container, "Venusaur")).toBe(290);

    cleanup();
  });
});
