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
 *   3. Paradox Pokémon present, no Restricted → no tag
 *      Paradox rules out Reg A and Reg H but is legal in C/D/E/F/G/I,
 *      so this is not a unique signal. Kept as a guard against
 *      incorrectly auto-tagging Reg H on a Paradox team.
 *
 *   4. Otherwise → null
 *      A team of ordinary Pokémon is legal in most regulations (A, C,
 *      D, E, F, G, H, I) so we can't confidently pick one. User picks.
 *
 * Authoritative sources cross-referenced in
 * lib/data/gen9-regulation-signals.ts.
 */

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect";
import {
  RESTRICTED_LEGENDARIES,
  PARADOX_POKEMON,
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

  // ── Signal 3: Paradox (diagnostic only, not a unique signal) ────
  // Recorded so the caller can show "we didn't pick H because your team
  // has Paradox" but not enough to tag a specific reg on its own.
  const paradoxHolders: string[] = [];
  for (const p of pokemon) {
    const key = getRegulationLookupKey(p.parsed.species);
    if (PARADOX_POKEMON.has(key)) {
      paradoxHolders.push(p.parsed.species);
    }
  }
  if (paradoxHolders.length > 0) {
    signals.push(
      `Paradox Pokémon: ${paradoxHolders.join(", ")} (rules out Reg A and Reg H)`,
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
