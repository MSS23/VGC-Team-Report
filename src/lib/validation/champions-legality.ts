/**
 * Champions format (Regulation M-A) legality validator.
 *
 * Validates a parsed team against Reg M-A rules:
 * - Species must be in the Champions dex
 * - Max 2 restricted Pokemon
 * - Any number of Mega Stones allowed on the team (only one Pokemon can
 *   actually Mega Evolve per battle — that's an in-battle constraint, not
 *   a team-construction one)
 * - Species Clause (no duplicates)
 * - Item Clause (no duplicate items)
 * - No Z-Crystals or Dynamax-related items
 * - Stat investment within bounds. Reg M-A uses Stat Points (66 total, 32
 *   per stat). Pastes that already contain SP in the EVs line are validated
 *   as SP; traditional EV spreads are validated against 512/252.
 * - Team size exactly 6
 */

import type { ParsedPokemon } from "@/lib/types/pokemon";
import { getChampionsDex } from "@/lib/data/champions-dex";
import { getSpecies } from "@/lib/data/dex-subset";
import { MEGA_POKEMON_LIST } from "@/lib/data/mega-pokemon";
import { getRegulationLookupKey } from "@/lib/data/gen9-regulation-signals";
import {
  CHAMPIONS_TOTAL_SP,
  CHAMPIONS_MAX_SP_PER_STAT,
  resolveStatForm,
} from "@/lib/analysis/stat-calculator";

// ── Severity levels ─────────────────────────────────────────────────────────

export type LegalitySeverity = "error" | "warning" | "info";

export interface LegalityIssue {
  severity: LegalitySeverity;
  message: string;
  /** Which Pokemon (by species name) the issue relates to, if any */
  pokemon?: string;
}

export interface LegalityResult {
  legal: boolean;
  issues: LegalityIssue[];
}

// ── Restricted Pokemon ──────────────────────────────────────────────────────
// Box legendaries and ultra beasts that are limited to 2 per team.
// Base forms only — forms (Origin, Crowned, etc.) map to the same base.

const RESTRICTED_BASE_NAMES = new Set([
  "mewtwo",
  "lugia",
  "ho-oh",
  "kyogre",
  "groudon",
  "rayquaza",
  "dialga",
  "palkia",
  "giratina",
  "reshiram",
  "zekrom",
  "kyurem",
  "xerneas",
  "yveltal",
  "zygarde",
  "solgaleo",
  "lunala",
  "necrozma",
  "zacian",
  "zamazenta",
  "eternatus",
  "calyrex",
  "koraidon",
  "miraidon",
  "terapagos",
]);

// ── Mega Stones set ─────────────────────────────────────────────────────────

/** Mega Stone (lowercase) → the Mega's dataKey, for per-reg stone legality. */
const MEGA_STONE_TO_KEY = new Map(
  MEGA_POKEMON_LIST.map((m) => [m.megaStone.toLowerCase(), m.dataKey]),
);
const MEGA_STONES = new Set(MEGA_STONE_TO_KEY.keys());

// ── Z-Crystal detection ─────────────────────────────────────────────────────

const Z_CRYSTAL_SUFFIX = "ium z";

function isZCrystal(item: string): boolean {
  return item.toLowerCase().endsWith(Z_CRYSTAL_SUFFIX);
}

// ── Species normalization ───────────────────────────────────────────────────

/**
 * Normalize species to the lowercase-hyphenated key used by CHAMPIONS_DEX.
 * "Kangaskhan-Mega" → "kangaskhan-mega"
 * "Charizard-Mega-Y" → "charizard-mega-y"
 * "Urshifu Rapid Strike" → "urshifu-rapid-strike"
 */
function normalizeSpecies(species: string): string {
  return species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Get the base species name for restricted checks.
 * "Calyrex-Ice" → "calyrex"
 * "Kyogre-Primal" → "kyogre"
 * "Zacian-Crowned" → "zacian"
 * "Dialga-Origin" → "dialga"
 * "Kyurem-White" → "kyurem"
 * "Necrozma-Dusk-Mane" → "necrozma"
 */
function getRestrictedBase(species: string): string {
  // Shares the form-suffix strip list with regulation detection so the two
  // never drift (Zygarde-10, Terapagos-Terastal, etc. collapse to base).
  return getRegulationLookupKey(species);
}

/**
 * Get the base species for Species Clause checks.
 *
 * Species Clause goes by National Dex number, and every form of a species
 * shares one — so Rotom-Wash duplicates Rotom-Heat, Ninetales duplicates
 * Ninetales-Alola, and Urshifu duplicates Urshifu-Rapid-Strike. The dex
 * lookup's baseSpecies collapses all forms; the regex strip is only the
 * fallback for species the dex subset doesn't know.
 */
function getSpeciesClauseKey(species: string): string {
  const entry = getSpecies(species);
  if (entry) return normalizeSpecies(entry.baseSpecies ?? entry.name);
  const key = normalizeSpecies(species);
  return key.replace(/-mega(-[xyz])?$/, "").replace(/-primal$/, "");
}

// ── Main validation ─────────────────────────────────────────────────────────

export function validateChampionsTeam(
  pokemon: ParsedPokemon[],
  regulation: "Reg M-A" | "Reg M-B" | "Reg M-C" = "Reg M-A",
): LegalityResult {
  const issues: LegalityIssue[] = [];

  // Each Champions reg is a superset of the last — same rules, wider pool.
  const dex = getChampionsDex(regulation);
  const regLabel = regulation;

  // Team size
  if (pokemon.length < 6) {
    issues.push({
      severity: "warning",
      message: `Team has ${pokemon.length} Pokemon (need 6 for a full team sheet)`,
    });
  }

  // Species Clause
  const speciesSeen = new Map<string, string>(); // clauseKey → display name
  for (const p of pokemon) {
    const clauseKey = getSpeciesClauseKey(p.species);
    const existing = speciesSeen.get(clauseKey);
    if (existing) {
      issues.push({
        severity: "error",
        message: `Species Clause: ${p.species} duplicates ${existing}`,
        pokemon: p.species,
      });
    } else {
      speciesSeen.set(clauseKey, p.species);
    }
  }

  // Item Clause
  const itemsSeen = new Map<string, string>(); // lowercase item → first species
  for (const p of pokemon) {
    if (!p.item) continue;
    const itemKey = p.item.toLowerCase();
    const existing = itemsSeen.get(itemKey);
    if (existing) {
      issues.push({
        severity: "error",
        message: `Item Clause: ${p.item} is held by both ${existing} and ${p.species}`,
        pokemon: p.species,
      });
    } else {
      itemsSeen.set(itemKey, p.species);
    }
  }

  // Champions dex check — CHAMPIONS_DEX has regular mons + mega forms;
  // restricted legends are allowed (up to 2) even if not explicitly in the set.
  // Base forms are also legal if their mega form is in the dex (e.g.
  // "Salamence" is legal because "salamence-mega" is in the dex).
  for (const p of pokemon) {
    const key = normalizeSpecies(p.species);
    const base = getRestrictedBase(p.species);
    const inDex = dex.has(key);
    const isRestricted = RESTRICTED_BASE_NAMES.has(base);
    // Check if a mega form of this base Pokemon is in the dex
    const megaInDex = dex.has(`${key}-mega`) ||
      dex.has(`${key}-mega-x`) ||
      dex.has(`${key}-mega-y`) ||
      dex.has(`${key}-mega-z`);
    if (!inDex && !isRestricted && !megaInDex) {
      issues.push({
        severity: "error",
        message: `${p.species} is not available in Champions format (${regLabel})`,
        pokemon: p.species,
      });
    }
  }

  // Mega Stones from a later rotation (e.g. Garchompite Z in Reg M-B).
  for (const p of pokemon) {
    const megaKey = p.item ? MEGA_STONE_TO_KEY.get(p.item.toLowerCase()) : undefined;
    if (megaKey && !dex.has(megaKey)) {
      issues.push({
        severity: "error",
        message: `${p.item} is not legal in ${regLabel}`,
        pokemon: p.species,
      });
    }
  }

  // Restricted count (max 2)
  const restrictedFound: string[] = [];
  for (const p of pokemon) {
    const base = getRestrictedBase(p.species);
    if (RESTRICTED_BASE_NAMES.has(base)) {
      restrictedFound.push(p.species);
    }
  }
  if (restrictedFound.length > 2) {
    issues.push({
      severity: "error",
      message: `Too many restricted Pokemon (${restrictedFound.length}/2 max): ${restrictedFound.join(", ")}`,
    });
  }

  // Mega Stone holders — informational only.
  // Teams can pack any number of Mega Stones; only one Pokemon can actually
  // Mega Evolve per battle, which is an in-battle choice, not a
  // team-construction rule.
  const megaStoneHolders: string[] = [];
  for (const p of pokemon) {
    if (p.item && MEGA_STONES.has(p.item.toLowerCase())) {
      megaStoneHolders.push(p.species);
    }
  }

  // Z-Crystal ban
  for (const p of pokemon) {
    if (p.item && isZCrystal(p.item)) {
      issues.push({
        severity: "error",
        message: `${p.species}: Z-Crystals are not allowed in Champions format`,
        pokemon: p.species,
      });
    }
  }

  // Per-Pokemon stat investment validation.
  //
  // Reg M-A is natively an SP (Stat Points) format: 66 total, 32 per stat.
  // Showdown has no "SPs:" line yet, so Champions pastes ship SP values
  // inside the EVs line — a spread whose total ≤ 66 and whose per-stat
  // values are ≤ 32 can only coherently be SP (same detection used by
  // convertToChampionsSp). Validate those as SP.
  //
  // Traditional EV spreads (512 total, 252 per stat) are still accepted
  // because the rest of the app converts them to SP on display, but are
  // validated against the EV budget so obvious typos (e.g. 300 in a stat)
  // still surface.
  for (const p of pokemon) {
    const total = Object.values(p.evs).reduce((a, b) => a + b, 0);
    // The unit comes from the explicit `statForm` the parser recorded
    // (VGC-291), which replaces the fourth copy of the magnitude heuristic
    // that used to live here. `resolveStatForm` falls back to that heuristic
    // only for a ParsedPokemon from before the field existed.
    const isSpSpread = total > 0 && resolveStatForm(p) === "sp";

    if (isSpSpread) {
      // These two checks could never fire while the unit was inferred from
      // magnitude — the old `looksLikeSp` only called a spread SP once it had
      // already proved total ≤ 66 and every stat ≤ 32, so the cap it then
      // "checked" was true by construction (VGC-291). With the unit carried
      // explicitly, an over-cap SP spread is finally reachable.
      for (const [stat, value] of Object.entries(p.evs)) {
        if (value > CHAMPIONS_MAX_SP_PER_STAT) {
          issues.push({
            severity: "error",
            message: `${p.species}: ${stat.toUpperCase()} SP (${value}) exceeds the per-stat maximum of ${CHAMPIONS_MAX_SP_PER_STAT}`,
            pokemon: p.species,
          });
        }
      }
      if (total > CHAMPIONS_TOTAL_SP) {
        issues.push({
          severity: "error",
          message: `${p.species}: SP total ${total} exceeds maximum of ${CHAMPIONS_TOTAL_SP}`,
          pokemon: p.species,
        });
      } else if (total < CHAMPIONS_TOTAL_SP) {
        issues.push({
          severity: "info",
          message: `${p.species}: ${total}/${CHAMPIONS_TOTAL_SP} SP allocated — ${CHAMPIONS_TOTAL_SP - total} more available`,
          pokemon: p.species,
        });
      }
    } else {
      // The game's EV budget is 510, not 512 — the parser already warns at
      // 510, and disagreeing with it here let 512-EV spreads validate clean.
      if (total > 510) {
        issues.push({
          severity: "error",
          message: `${p.species}: EV total ${total} exceeds maximum of 510`,
          pokemon: p.species,
        });
      } else if (total > 0 && total < 510) {
        issues.push({
          severity: "info",
          message: `${p.species}: ${total} EVs allocated — ${510 - total} more available (${regLabel} allows 510 total)`,
          pokemon: p.species,
        });
      }
      for (const [stat, value] of Object.entries(p.evs)) {
        if (value > 252) {
          issues.push({
            severity: "error",
            message: `${p.species}: ${stat.toUpperCase()} EVs (${value}) exceed maximum of 252`,
            pokemon: p.species,
          });
        }
      }
    }
  }

  // Restricted count info (even if legal, useful to know)
  if (restrictedFound.length > 0 && restrictedFound.length <= 2) {
    issues.push({
      severity: "info",
      message: `Restricted Pokemon (${restrictedFound.length}/2): ${restrictedFound.join(", ")}`,
    });
  }

  // Mega Stone info
  if (megaStoneHolders.length === 1) {
    issues.push({
      severity: "info",
      message: `Mega Evolution: ${megaStoneHolders[0]}`,
    });
  } else if (megaStoneHolders.length > 1) {
    issues.push({
      severity: "info",
      message: `Mega Stones held by ${megaStoneHolders.join(", ")} — only one can Mega Evolve per battle`,
    });
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    legal: !hasErrors,
    issues,
  };
}
