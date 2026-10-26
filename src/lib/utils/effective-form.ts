import { lookupPokemon } from "@/lib/data/pokemon";
import { detectMegaFromItem, isMegaForm } from "@/lib/utils/mega-detect";
import type { PokemonData } from "@/lib/types/pokemon";

/**
 * The form a Pokemon actually battles as, once Mega Evolution is applied.
 *
 * A Mega Evolution changes types AND ability AND base stats, so all three must
 * be resolved from the same branch. Resolving them separately is what caused
 * VGC-293: the Compare page swapped in the Mega's typing but kept feeding the
 * pasted (base-form) ability into `getDefensiveProfile`, so Gengar @ Gengarite
 * showed the right Ghost/Poison typing but was treated as Ground-immune via
 * Levitate instead of carrying Mega Gengar's Shadow Tag.
 */
export interface EffectiveForm {
  /** Species data for the effective form — Mega data when Mega-resolved. */
  data: PokemonData | null;
  /** Display name — the Mega's display name when Mega-resolved. */
  displaySpecies: string;
  /** POKEMON_DATA key to render a sprite for. */
  spriteSpecies: string;
  /** Types of the effective form. */
  displayTypes: string[];
  /** Ability of the effective form — the Mega's ability when Mega-resolved. */
  displayAbility: string | null;
}

/**
 * Resolve the effective (post-Mega) form for a parsed Pokemon.
 *
 * Mega Evolution is applied when the species is already a Mega form, or when
 * the Pokemon holds the Mega Stone that matches its species. Anything else is
 * returned unchanged.
 */
export function resolveEffectiveForm(pokemon: {
  species: string;
  item: string | null;
  ability: string | null;
}): EffectiveForm {
  const { species, item, ability } = pokemon;
  const data = lookupPokemon(species);

  // Already pasted as a Mega form (e.g. "Gengar-Mega"): `lookupPokemon` has
  // already returned the Mega's data, so its types and stats are correct.
  // Its ability is authoritative too — a Mega has exactly one ability — and
  // beats the pasted one, which carries whatever the base form had.
  if (isMegaForm(species)) {
    return {
      data,
      displaySpecies: species,
      spriteSpecies: species,
      displayTypes: data?.types ?? [],
      displayAbility: data?.abilities[0] ?? ability,
    };
  }

  // Base form holding its matching Mega Stone: swap in the Mega's data.
  const megaEntry = detectMegaFromItem(item, species);
  if (megaEntry) {
    const megaData = lookupPokemon(megaEntry.dataKey);
    if (megaData) {
      return {
        data: megaData,
        displaySpecies: megaEntry.displayName,
        spriteSpecies: megaEntry.dataKey,
        displayTypes: megaData.types,
        displayAbility: megaEntry.ability,
      };
    }
  }

  return {
    data,
    displaySpecies: species,
    spriteSpecies: species,
    displayTypes: data?.types ?? [],
    displayAbility: ability,
  };
}
