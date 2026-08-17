/**
 * Client gate for the lazily-loaded dex fallback (VGC-271).
 *
 * The fallback table now arrives in an on-demand chunk, so a synchronous lookup
 * for an uncommon species answers `null` until that chunk lands. Nothing may
 * render in that window — a card with no name, no types and 0% stat bars is
 * exactly the "Golurk-Mega" breakage the fallback exists to prevent.
 *
 * The fix is to gate on *commit*, not on render: before a freshly parsed team
 * is handed to React state, ask whether anything about it could need the dex.
 * If not (the common, all-meta case) the team commits synchronously and the
 * chunk is never fetched. If so, the caller awaits `loadDexFallback()` first,
 * so the very first render already has complete data.
 *
 * Every condition below is deliberately *sound* rather than merely cheap: it
 * must never answer `false` for a team that would then render incomplete. The
 * cost of a false `true` is only an extra 129 kB fetch on a rare team.
 */

import { lookupPokemon } from "@/lib/data/pokemon";
import { getMegaEntryFromSpecies, detectMegaFromItem } from "@/lib/utils/mega-detect";
import { isDexFallbackReady } from "@/lib/data/pkmn-dex-fallback";

/** The only fields the probe needs — keeps callers free of ParsedPokemon. */
export interface DexProbeTarget {
  species: string;
  item: string | null;
}

/** Showdown writes Mega formes as `<Base>-Mega`, `<Base>-Mega-X`, `<Base>-Mega-Y`. */
const MEGA_FORME_SUFFIX = /-mega(-[xy])?$/;

function normalize(species: string): string {
  return species.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * True when at least one thing this team renders cannot be resolved without the
 * dex subset. Always false once the chunk is loaded — and on the server, where
 * `pkmn-dex-fallback.server` registers the impl at startup.
 */
export function teamNeedsDexFallback(pokemon: readonly DexProbeTarget[]): boolean {
  if (isDexFallbackReady()) return false;

  // Species Clause collapses every forme onto its base species, and only the
  // dex knows that mapping ("Rotom-Wash" and "Rotom-Heat" are both #479). It
  // can only ever matter when two members share a leading name segment, so a
  // team of six unrelated Pokemon skips the chunk.
  const leadingSegments = new Set<string>();

  for (const p of pokemon) {
    const key = normalize(p.species);

    // 1. The card's own base data. `null` here means an empty name, no types
    //    and 0% stat bars — the one truly broken render.
    if (lookupPokemon(p.species) === null) return true;

    // 2. A species pasted as a Mega forme. The Mega/Base toggle and the Mega
    //    stat line both come from the catalogue, with the dex behind it.
    if (MEGA_FORME_SUFFIX.test(key)) {
      const entry = getMegaEntryFromSpecies(p.species);
      if (!entry || lookupPokemon(entry.dataKey) === null) return true;
    }

    // 3. A held Mega stone the static catalogue knows, whose Mega forme's base
    //    stats may live only in the dex. (An entirely unknown stone resolves to
    //    null and simply renders the base form — degraded, never broken, and
    //    the façade warms the chunk for the next parse.)
    const stoneEntry = detectMegaFromItem(p.item, p.species);
    if (stoneEntry && lookupPokemon(stoneEntry.dataKey) === null) return true;

    const leading = key.split("-")[0];
    if (leadingSegments.has(leading)) return true;
    leadingSegments.add(leading);
  }

  return false;
}
