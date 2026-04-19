/**
 * Auto-detect the competitive regulation from a parsed team.
 *
 * Current scope: only Reg M-A (Champions / Pokemon Champions) is reliably
 * auto-detected because it's the only regulation with an unambiguous,
 * self-contained signal — Mega Stones and Primal Reversion Orbs. Other
 * regulations (Reg A–I, Reg G, etc.) overlap heavily in their species
 * pools, and detecting them would require per-regulation dex data plus
 * meta heuristics we don't currently ship.
 *
 * When no confident signal is present this returns null so the caller
 * leaves the regulation tag unset and the user can pick manually.
 *
 * Authoritative references:
 * - Mega species list: src/lib/data/mega-pokemon.ts (13 Megas eligible
 *   for Pokemon Champions — source: serebii.net/pokemonchampions).
 * - Champions dex: src/lib/data/champions-dex.ts (lists every species
 *   legal in Reg M-A, also sourced from serebii.net/pokemonchampions).
 * - Primal Reversion items: Red Orb (Groudon) and Blue Orb (Kyogre) are
 *   the only two items that trigger Primal Reversion in-game, so they
 *   are a hard Mega-format signal.
 */

import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect";

const PRIMAL_ORB_ITEMS = new Set(["red orb", "blue orb"]);

/**
 * Returns "Reg M-A" when the team contains any Mega Evolution or Primal
 * Reversion signal, otherwise null.
 *
 * Signals checked:
 *   1. Already-evolved species name matches the Mega list
 *      (e.g. "Kangaskhan-Mega", "Charizard-Mega-Y").
 *   2. Base form + matching Mega Stone held item
 *      (e.g. "Kangaskhan @ Kangaskhanite"). This catches pastes the
 *      parser hasn't resolved to a Mega species yet.
 *   3. Primal Reversion item held by any Pokemon
 *      (Red Orb → Primal Groudon, Blue Orb → Primal Kyogre).
 *   4. Already-Primal species name (e.g. "Groudon-Primal").
 */
export function detectRegulation(pokemon: AnalyzedPokemon[]): string | null {
  if (pokemon.length === 0) return null;

  for (const p of pokemon) {
    const species = p.parsed.species;
    const item = p.parsed.item;

    // 1. Species is already a Mega form in the authoritative list
    if (isMegaForm(species)) return "Reg M-A";

    // 2. Base species + a Mega Stone that matches it
    if (detectMegaFromItem(item, species)) return "Reg M-A";

    // 3. Primal Reversion orb
    if (item && PRIMAL_ORB_ITEMS.has(item.toLowerCase())) return "Reg M-A";

    // 4. Already-Primal species name
    if (/-primal$/i.test(species)) return "Reg M-A";
  }

  return null;
}
