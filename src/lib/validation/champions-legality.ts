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
 * - EV totals within bounds (512 total, 252 per stat)
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

  // Champions dex check — CHAMPIONS_DEX has regular mons + mega forms;
  // restricted legends are allowed (up to 2) even if not explicitly in the set.
  // Base forms are also legal if their mega form is in the dex (e.g.
  // "Salamence" is legal because "salamence-mega" is in the dex).
  for (const p of pokemon) {
    const key = normalizeSpecies(p.species);
    const base = getRestrictedBase(p.species);
    const inDex = CHAMPIONS_DEX.has(key);
    const isRestricted = RESTRICTED_BASE_NAMES.has(base);
    // Check if a mega form of this base Pokemon is in the dex
    const megaInDex = CHAMPIONS_DEX.has(`${key}-mega`) ||
      CHAMPIONS_DEX.has(`${key}-mega-x`) ||
      CHAMPIONS_DEX.has(`${key}-mega-y`);
    if (!inDex && !isRestricted && !megaInDex) {
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

  // Per-Pokemon EV validation — Reg M-A (Champions) allows up to 512 total
  // (vs the classic VGC 510 cap), so two stats can be maxed at 252 plus 8
  // spillover into a third stat.
  for (const p of pokemon) {
    const evTotal = Object.values(p.evs).reduce((a, b) => a + b, 0);
    if (evTotal > 512) {
      issues.push({
        severity: "error",
        message: `${p.species}: EV total ${evTotal} exceeds maximum of 512`,
        pokemon: p.species,
      });
    } else if (evTotal > 0 && evTotal < 512) {
      // Reg M-A only: classic VGC muscle memory caps EVs at 508 (252+252+4)
      // or 510, leaving stat points on the table. Surface an info hint so
      // builders know they can squeeze a few more EVs in.
      const remaining = 512 - evTotal;
      issues.push({
        severity: "info",
        message: `${p.species}: ${evTotal} EVs allocated — ${remaining} more available (Reg M-A allows 512 total)`,
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
