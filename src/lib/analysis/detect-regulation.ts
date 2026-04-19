/**
 * Auto-detect the competitive regulation from a parsed team.
 *
 * Detection works on *positive* signals — we only tag a regulation when
 * the team carries a species (or item) whose presence narrows the format
 * to a small, unambiguous set. Absence of a signal is treated as
 * genuinely ambiguous and we return null so the user picks manually.
 *
 * Signal hierarchy (highest priority first):
 *
 *   1. Mega Evolution or Primal Reversion present → "Reg M-A"
 *      Pokémon Champions format (the only regulation where Megas and
 *      Primals can battle). Detected via MEGA_BY_KEY + item map from
 *      lib/utils/mega-detect (authoritative Mega list from Serebii).
 *
 *   2. Restricted Legendary present → "Reg G"
 *      Reg G and Reg I are the only Gen 9 regulations that permit
 *      Restricted Legendaries (Calyrex, Miraidon, etc.). We default to
 *      Reg G because it's the most established "1-restricted-per-team"
 *      reg and the one Showdown still lists as an active competitive
 *      format. Users can manually switch to Reg I if that's their
 *      event's ruleset — the distinction is per-team limit, not
 *      species pool.
 *
 *   3. All-ordinary team + has DLC/HOME species → "Reg H"
 *      Reg H bans every Legendary, Paradox, Sub-Legendary, and Mythical.
 *      If a team is clean of all four categories but runs at least one
 *      species that's NOT in the original Paldea native dex (e.g.
 *      Ursaluna, Archaludon, Incineroar, any Hisuian form), we can
 *      positively distinguish Reg H from Reg A (Reg A is Paldea-only).
 *
 *   4. Paradox without Restricted → no tag (diagnostic only)
 *      Paradox rules out Reg A and Reg H but is legal in C/D/E/F/G/I,
 *      so this is not a unique signal.
 *
 *   5. Otherwise → null
 *      A Paldea-only team with no Legendary/Paradox/Mega/DLC signals
 *      could be Reg A or a Reg H team that happens to be all-native.
 *      No positive signal → user picks.
 *
 * Authoritative sources cross-referenced in
 * lib/data/gen9-regulation-signals.ts.
 */

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect";
import {
  RESTRICTED_LEGENDARIES,
  PARADOX_POKEMON,
  SUB_LEGENDARIES,
  DLC_ERA_SPECIES,
  MYTHICAL_POKEMON,
  getRegulationLookupKey,
} from "@/lib/data/gen9-regulation-signals";

const PRIMAL_ORB_ITEMS = new Set(["red orb", "blue orb"]);

/**
 * Detection result. Callers can use `regulation` for the tag and
 * `signals` for diagnostic display (e.g. "detected because Calyrex is
 * a Restricted Legendary").
 */
export interface RegulationDetection {
  regulation: string | null;
  signals: string[];
}

/**
 * Detect regulation with full signal diagnostics. Most callers only
 * need {@link detectRegulation} which returns the tag string.
 */
export function detectRegulationWithSignals(
  pokemon: AnalyzedPokemon[],
): RegulationDetection {
  if (pokemon.length === 0) {
    return { regulation: null, signals: [] };
  }

  const signals: string[] = [];

  // ── Signal 1: Mega / Primal ─────────────────────────────────────
  // Anything on the team holding a Mega Stone, matching a Mega form,
  // or holding a Primal Orb means we're in the Champions format.
  for (const p of pokemon) {
    const species = p.parsed.species;
    const item = p.parsed.item;

    if (isMegaForm(species)) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} is a Mega Evolution (Reg M-A only)`],
      };
    }
    if (detectMegaFromItem(item, species)) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} holds ${item} (Mega Stone — Reg M-A only)`],
      };
    }
    if (item && PRIMAL_ORB_ITEMS.has(item.toLowerCase())) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} holds ${item} (Primal Reversion — Reg M-A only)`],
      };
    }
    if (/-primal$/i.test(species)) {
      return {
        regulation: "Reg M-A",
        signals: [`${species} is a Primal form (Reg M-A only)`],
      };
    }
  }

  // ── Signal 2: Restricted Legendary ──────────────────────────────
  // Calyrex, Miraidon, Koraidon, etc. are the "cover" legendaries. They
  // are banned in every current Gen 9 regulation EXCEPT Reg G and Reg I.
  // We default to Reg G (the longer-running established format); user
  // can manually override to Reg I when their event uses that ruleset.
  const restrictedHolders: string[] = [];
  for (const p of pokemon) {
    const key = getRegulationLookupKey(p.parsed.species);
    if (RESTRICTED_LEGENDARIES.has(key)) {
      restrictedHolders.push(p.parsed.species);
    }
  }
  if (restrictedHolders.length > 0) {
    signals.push(
      `Restricted Legendary: ${restrictedHolders.join(", ")} (allowed in Reg G / Reg I)`,
    );
    return { regulation: "Reg G", signals };
  }

  // ── Collect disqualifying signals for Reg H detection ───────────
  // Reg H bans Paradox, Sub-Legendary, and Mythical outright. If the
  // team runs any of those we cannot tag Reg H, regardless of DLC
  // species presence. (Restricted Legendaries already short-circuited
  // above into Reg G.)
  const paradoxHolders: string[] = [];
  const subLegendaryHolders: string[] = [];
  const mythicalHolders: string[] = [];
  const dlcEraHolders: string[] = [];
  for (const p of pokemon) {
    const key = getRegulationLookupKey(p.parsed.species);
    if (PARADOX_POKEMON.has(key)) paradoxHolders.push(p.parsed.species);
    if (SUB_LEGENDARIES.has(key)) subLegendaryHolders.push(p.parsed.species);
    if (MYTHICAL_POKEMON.has(key)) mythicalHolders.push(p.parsed.species);
    // DLC lookup intentionally uses the raw normalized key (no form
    // stripping) because entries like "ursaluna-bloodmoon" and
    // "urshifu-rapid-strike" are form-specific and legitimate signals.
    const rawKey = p.parsed.species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (DLC_ERA_SPECIES.has(rawKey) || DLC_ERA_SPECIES.has(key)) {
      dlcEraHolders.push(p.parsed.species);
    }
  }

  // ── Signal 3: Reg H positive detection ──────────────────────────
  // Clean of all Reg-H-banned categories + has a DLC/HOME species that
  // rules out Paldea-only Reg A → confidently Reg H.
  const regHClean =
    paradoxHolders.length === 0 &&
    subLegendaryHolders.length === 0 &&
    mythicalHolders.length === 0;
  if (regHClean && dlcEraHolders.length > 0) {
    return {
      regulation: "Reg H",
      signals: [
        `${dlcEraHolders.join(", ")}: not in Paldea native dex (rules out Reg A)`,
        "No Legendary / Paradox / Mythical on the team (Reg H compatible)",
      ],
    };
  }

  // ── Signal 4: Paradox / Sub-Legendary diagnostics (no tag) ──────
  if (paradoxHolders.length > 0) {
    signals.push(
      `Paradox Pokémon: ${paradoxHolders.join(", ")} (rules out Reg A and Reg H)`,
    );
  }
  if (subLegendaryHolders.length > 0) {
    signals.push(
      `Sub-Legendary: ${subLegendaryHolders.join(", ")} (rules out Reg A and Reg H)`,
    );
  }
  if (mythicalHolders.length > 0) {
    signals.push(
      `Mythical: ${mythicalHolders.join(", ")} (banned in every VGC regulation)`,
    );
  }

  return { regulation: null, signals };
}

/**
 * Convenience wrapper returning just the regulation tag (or null) with
 * no diagnostic info. This is the function the home-page effect calls.
 */
export function detectRegulation(pokemon: AnalyzedPokemon[]): string | null {
  return detectRegulationWithSignals(pokemon).regulation;
}
