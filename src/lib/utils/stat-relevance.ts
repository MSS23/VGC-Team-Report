import type { StatName } from "@/lib/types/pokemon";
import type { ParsedPokemon } from "@/lib/types/pokemon";
import { MOVES } from "@/lib/data/moves";

/**
 * Determines which stats are relevant to display for a Pokemon based on its
 * moveset and EV investment. A stat is considered relevant if:
 * - It's HP, Def, SpD, or Spe (always relevant)
 * - It's Atk and the Pokemon has at least one Physical attack (or an unknown move)
 * - It's SpA and the Pokemon has at least one Special attack (or an unknown move)
 * - The stat has EV investment (someone intentionally invested in it)
 */
export function getRelevantStats(parsed: ParsedPokemon): Set<StatName> {
  const relevant = new Set<StatName>(["hp", "def", "spd", "spe"]);

  let hasPhysical = false;
  let hasSpecial = false;
  let hasUnknown = false;

  for (const move of parsed.moves) {
    const key = move.toLowerCase().replace(/\s+/g, "-");
    const data = MOVES[key];
    if (!data) {
      hasUnknown = true;
      continue;
    }
    if (data.category === "Physical") hasPhysical = true;
    if (data.category === "Special") hasSpecial = true;
  }

  // If we have unknown moves, show both offensive stats to be safe
  if (hasUnknown) {
    relevant.add("atk");
    relevant.add("spa");
  } else {
    if (hasPhysical) relevant.add("atk");
    if (hasSpecial) relevant.add("spa");
  }

  // Always show a stat if EVs are invested in it
  if (parsed.evs.atk > 0) relevant.add("atk");
  if (parsed.evs.spa > 0) relevant.add("spa");

  return relevant;
}
