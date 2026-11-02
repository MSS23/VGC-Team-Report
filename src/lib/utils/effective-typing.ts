import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonType } from "@/lib/types/pokemon";
import {
  detectMegaFromItem,
  getMegaEntryFromSpecies,
} from "@/lib/utils/mega-detect";
import { resolveSpeedTierForm } from "@/lib/utils/speed-tier-form";

export interface EffectiveTyping {
  /** Types of the form currently being displayed (post-Mega when Mega is on). */
  types: PokemonType[];
  /** Ability of the form currently being displayed (post-Mega when Mega is on). */
  ability: string | null;
  isMega: boolean;
}

/**
 * Resolve the ability of a displayed Mega form, falling back to the pasted
 * ability only when the Mega form has no ability of its own recorded.
 *
 * A paste only ever names ONE ability, and for `Venusaur @ Venusaurite` that
 * ability is Chlorophyll — the BASE form's. Mega Venusaur's ability is Thick
 * Fat, and it cannot have Chlorophyll. Reading `parsed.ability` for a row that
 * is labelled as the Mega is therefore always wrong when the two differ, in
 * both directions: it invented a x2 Chlorophyll boost for Mega Venusaur, and
 * it hid Mega Swampert's own Swift Swim behind base Swampert's Torrent.
 *
 * Accepts either a display species ("Venusaur-Mega") or a POKEMON_DATA key
 * ("venusaur-mega") — both normalise to the same MEGA_BY_KEY entry — so every
 * caller that already knows which Mega it is rendering can share this one
 * resolution instead of growing its own lookup.
 */
export function resolveMegaAbility(
  megaSpecies: string,
  pastedAbility: string | null,
): string | null {
  return getMegaEntryFromSpecies(megaSpecies)?.ability || pastedAbility;
}

/**
 * Resolve the types + ability that defensive/offensive calculations should use
 * for a report row, honouring the report-wide Mega toggle.
 *
 * Mega Evolution can change BOTH halves of a defensive profile: Mega Charizard X
 * becomes Fire/Dragon (no 4x Rock), and Mega Gengar trades Levitate for Shadow
 * Tag (so it is 2x weak to Ground, not immune). Reading `data.types` and
 * `parsed.ability` straight off the paste shows the base form instead.
 *
 * Form resolution is delegated to resolveSpeedTierForm so this can never
 * disagree with the speed-tier chart about which form is on screen.
 *
 * Base form falls back to the pasted ability — a paste only ever tells us one
 * ability, so flipping an already-Mega import back to Base cannot recover the
 * base-form ability.
 */
export function resolveEffectiveTyping(
  pokemon: Pick<AnalyzedPokemon, "parsed" | "data">,
  fallbackSpeciesKey: string,
  showMega: boolean,
): EffectiveTyping {
  const form = resolveSpeedTierForm(pokemon, fallbackSpeciesKey, showMega);
  const megaEntry = getMegaEntryFromSpecies(pokemon.parsed.species)
    ?? detectMegaFromItem(pokemon.parsed.item, pokemon.parsed.species);

  if (form.isMega && megaEntry) {
    return {
      types: form.data?.types ?? megaEntry.types,
      ability: resolveMegaAbility(form.speciesKey, pokemon.parsed.ability),
      isMega: true,
    };
  }

  return {
    types: form.data?.types ?? pokemon.data?.types ?? [],
    ability: pokemon.parsed.ability,
    isMega: false,
  };
}
