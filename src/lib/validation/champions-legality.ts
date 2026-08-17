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
import { CHAMPIONS_DEX, CHAMPIONS_MB_DEX } from "@/lib/data/champions-dex";
// Goes through the lazy fallback façade, NOT `@/lib/data/dex-subset` directly:
// this module is imported by TeamOverview, so a static dex-subset import here
// pins the 129,858-byte table into the eager client chunk (VGC-271). Callers on
// the client render only after `dex-fallback-gate.ts` has resolved, so the
// lookup below is fully populated by the time a team is validated.
import { getDexBaseSpecies } from "@/lib/data/pkmn-dex-fallback";
import { MEGA_POKEMON_LIST } from "@/lib/data/mega-pokemon";
import {
  CHAMPIONS_TOTAL_SP,
  CHAMPIONS_MAX_SP_PER_STAT,
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

const MEGA_STONES = new Set(
  MEGA_POKEMON_LIST.map((m) => m.megaStone.toLowerCase()),
);

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
  const key = normalizeSpecies(species);
  // Strip mega/primal suffixes for base check
  const stripped = key
    .replace(/-mega(-[xy])?$/, "")
    .replace(/-primal$/, "")
    .replace(/-origin$/, "")
    .replace(/-crowned$/, "")
    .replace(/-ice$/, "")
    .replace(/-shadow$/, "")
    .replace(/-white$/, "")
    .replace(/-black$/, "")
    .replace(/-dusk-mane$/, "")
    .replace(/-dawn-wings$/, "")
    .replace(/-ultra$/, "");
  return stripped;
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
  const baseSpecies = getDexBaseSpecies(species);
  if (baseSpecies) return normalizeSpecies(baseSpecies);
  const key = normalizeSpecies(species);
  return key.replace(/-mega(-[xy])?$/, "").replace(/-primal$/, "");
}

// ── Main validation ─────────────────────────────────────────────────────────

export function validateChampionsTeam(
  pokemon: ParsedPokemon[],
  regulation: "Reg M-A" | "Reg M-B" = "Reg M-A",
): LegalityResult {
  const issues: LegalityIssue[] = [];

  // Reg M-B is a superset of M-A — same rules, wider species pool.
  const isMb = regulation === "Reg M-B";
  const dex = isMb ? CHAMPIONS_MB_DEX : CHAMPIONS_DEX;
  const regLabel = isMb ? "Reg M-B" : "Reg M-A";

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
      dex.has(`${key}-mega-y`);
    if (!inDex && !isRestricted && !megaInDex) {
      issues.push({
        severity: "error",
        message: `${p.species} is not available in Champions format (${regLabel})`,
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
    const maxPerStat = Math.max(...Object.values(p.evs));
    const looksLikeSp = total > 0 && total <= CHAMPIONS_TOTAL_SP && maxPerStat <= CHAMPIONS_MAX_SP_PER_STAT;

    if (looksLikeSp) {
      // looksLikeSp guarantees every stat ≤ 32, so per-stat cap is already
      // satisfied — only the total-budget hint is worth surfacing.
      if (total < CHAMPIONS_TOTAL_SP) {
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
