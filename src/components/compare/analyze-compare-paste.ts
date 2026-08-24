import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import { lookupPokemon } from "@/lib/data/pokemon";
import {
  calculateAllStats,
  calculateChampionsStat,
  convertToChampionsSp,
  CHAMPIONS_MAX_SP_PER_STAT,
  CHAMPIONS_TOTAL_SP,
} from "@/lib/analysis/stat-calculator";
import { getItemStatBoost } from "@/lib/analysis/item-boosts";
import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { StatSpread } from "@/lib/types/pokemon";

/**
 * Compare-page paste analysis, split out of `CompareContent.tsx` so the heavy
 * Pokémon data tables (pokemon.ts ~243KB + dex-subset.json ~130KB raw, ~73 kB
 * gzip) load as ONE lazy chunk the first time somebody actually compares two
 * teams — the same barrier `@/lib/analysis/analyze-team` provides for the
 * homepage.
 *
 * `/compare` renders a pair of empty textareas on first paint and needs none
 * of this until the user hits "Compare Teams", so nothing on that route's
 * eager render path may import this module statically. Load it with
 * `await import("./analyze-compare-paste")` from an event handler/effect
 * (`CompareContent` memoises that import in `loadCompareAnalyzer`).
 * `__tests__/compare-eager-imports.test.ts` is the tripwire.
 */

export interface CompareAnalyzedPokemon extends AnalyzedPokemon {
  /** Resolved display name (mega name if applicable) */
  displaySpecies: string;
  /** Resolved types (mega types if applicable) */
  displayTypes: string[];
  /** Sprite key (mega data key if applicable) */
  spriteSpecies: string;
}

/**
 * Champions-format detection for a parsed team.
 *
 * The Compare page receives raw pastes without regulation metadata, so we
 * infer the format from the spread shape. Champions (Reg M-A) pastes carry
 * SP values in the EV line — total ≤ 66, no stat > 32 — which is
 * unambiguous vs. Reg G (total up to 508). Applied team-wide so every
 * Pokemon in the same paste is read consistently.
 */
export function looksLikeChampionsTeam(pokemon: { evs: StatSpread }[]): boolean {
  if (pokemon.length === 0) return false;
  for (const p of pokemon) {
    const stats = ["hp", "atk", "def", "spa", "spd", "spe"] as const;
    const total = stats.reduce((sum, s) => sum + p.evs[s], 0);
    if (total === 0) continue; // uninvested — inconclusive
    if (total > CHAMPIONS_TOTAL_SP) return false;
    if (stats.some((s) => p.evs[s] > CHAMPIONS_MAX_SP_PER_STAT)) return false;
  }
  return true;
}

export function analyzePaste(paste: string): CompareAnalyzedPokemon[] | null {
  if (!paste.trim()) return null;
  const parsed = parseShowdownPaste(paste);
  if (parsed.pokemon.length === 0) return null;
  const isChampions = looksLikeChampionsTeam(parsed.pokemon);
  return parsed.pokemon.map((p) => {
    let data = lookupPokemon(p.species);
    let displaySpecies = p.species;
    let spriteSpecies = p.species;
    let displayTypes: string[] = data?.types ?? [];

    // Resolve mega evolution — either already mega or has mega stone
    const alreadyMega = isMegaForm(p.species);
    if (!alreadyMega) {
      const megaEntry = detectMegaFromItem(p.item, p.species);
      if (megaEntry) {
        const megaData = lookupPokemon(megaEntry.dataKey);
        if (megaData) {
          data = megaData;
          displaySpecies = megaEntry.displayName;
          spriteSpecies = megaEntry.dataKey;
          displayTypes = megaData.types;
        }
      }
    }

    let calculatedStats = data
      ? calculateAllStats(data.baseStats, p.ivs, p.evs, p.level, p.nature)
      : { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    if (isChampions && data) {
      const sp = convertToChampionsSp(p.evs);
      calculatedStats = {
        hp: calculateChampionsStat("hp", data.baseStats.hp, sp.hp, p.nature),
        atk: calculateChampionsStat("atk", data.baseStats.atk, sp.atk, p.nature),
        def: calculateChampionsStat("def", data.baseStats.def, sp.def, p.nature),
        spa: calculateChampionsStat("spa", data.baseStats.spa, sp.spa, p.nature),
        spd: calculateChampionsStat("spd", data.baseStats.spd, sp.spd, p.nature),
        spe: calculateChampionsStat("spe", data.baseStats.spe, sp.spe, p.nature),
      };
    }
    const itemBoost = getItemStatBoost(p.item, p.ability, calculatedStats);
    return { parsed: p, data, calculatedStats, itemBoost, displaySpecies, displayTypes, spriteSpecies };
  });
}
