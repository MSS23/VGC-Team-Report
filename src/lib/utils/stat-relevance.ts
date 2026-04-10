import type { StatName } from "@/lib/types/pokemon";
import type { ParsedPokemon } from "@/lib/types/pokemon";
import { MOVES } from "@/lib/data/moves";
import { NATURES } from "@/lib/data/natures";

/**
 * Determines which stats are relevant to display for a Pokemon based on its
 * moveset, EV investment, and nature. A stat is considered relevant if:
 * - It's HP, Def, SpD, or Spe (always relevant)
 * - It's Atk and the Pokemon has at least one Physical attack (or an unknown move)
 * - It's SpA and the Pokemon has at least one Special attack (or an unknown move)
 * - The stat has EV investment (someone intentionally invested in it)
 * - The stat is boosted or reduced by the Pokemon's nature. This ensures
 *   nature arrows always render — e.g. Adamant Scizor with no special
 *   moves should still show the SpA row with its red down arrow, and
 *   Bold Flutter Mane with no physical moves should still show Atk.
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

  // Always show stats the nature affects, so the user can see the
  // green up arrow / red down arrow for Adamant, Bold, Calm, Modest, etc.
  // Neutral natures (Hardy/Docile/Serious/Bashful/Quirky) have null
  // plus/minus and contribute nothing here.
  const natureData = NATURES[parsed.nature];
  if (natureData?.plus) relevant.add(natureData.plus);
  if (natureData?.minus) relevant.add(natureData.minus);

  return relevant;
}
