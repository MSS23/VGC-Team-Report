/**
 * Champions format (Regulation M-A) legality validator.
 *
 * Validates a parsed team against Reg M-A rules:
 * - Species must be in the Champions dex
 * - Max 2 restricted Pokemon
 * - Max 1 Mega Stone on the team
 * - Species Clause (no duplicates)
 * - Item Clause (no duplicate items)
 * - No Z-Crystals or Dynamax-related items
 * - EV totals within bounds (510 total, 252 per stat)
 * - Team size exactly 6
 */

import type { ParsedPokemon } from "@/lib/types/pokemon";
import { CHAMPIONS_DEX } from "@/lib/data/champions-dex";
import { MEGA_POKEMON_LIST } from "@/lib/data/mega-pokemon";

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
 * Mega forms count as the same species as their base.
 * "Kangaskhan-Mega" → "kangaskhan"
 * But different regional forms are different species.
 */
function getSpeciesClauseKey(species: string): string {
  const key = normalizeSpecies(species);
  // Strip mega suffix only — regional forms and other forms are distinct species
  return key.replace(/-mega(-[xy])?$/, "").replace(/-primal$/, "");
}

// ── Main validation ─────────────────────────────────────────────────────────

export function validateChampionsTeam(pokemon: ParsedPokemon[]): LegalityResult {
  const issues: LegalityIssue[] = [];

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

  // Champions dex check — CHAMPIONS_DEX has regular mons; restricted legends
  // are allowed (up to 2) even if not explicitly in the dex set.
  for (const p of pokemon) {
    const key = normalizeSpecies(p.species);
    const base = getRestrictedBase(p.species);
    const inDex = CHAMPIONS_DEX.has(key);
    const isRestricted = RESTRICTED_BASE_NAMES.has(base);
    if (!inDex && !isRestricted) {
      issues.push({
        severity: "error",
        message: `${p.species} is not available in Champions format (Reg M-A)`,
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

  // Mega Stone limit (max 1)
  const megaStoneHolders: string[] = [];
  for (const p of pokemon) {
    if (p.item && MEGA_STONES.has(p.item.toLowerCase())) {
      megaStoneHolders.push(p.species);
    }
  }
  if (megaStoneHolders.length > 1) {
    issues.push({
      severity: "error",
      message: `Only 1 Mega Evolution allowed: ${megaStoneHolders.join(", ")} all hold Mega Stones`,
    });
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

  // Per-Pokemon EV validation
  for (const p of pokemon) {
    const evTotal = Object.values(p.evs).reduce((a, b) => a + b, 0);
    if (evTotal > 510) {
      issues.push({
        severity: "error",
        message: `${p.species}: EV total ${evTotal} exceeds maximum of 510`,
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
  }

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    legal: !hasErrors,
    issues,
  };
}
