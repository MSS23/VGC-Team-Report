import { lookupPokemon } from "@/lib/data/pokemon";
import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { PokemonData } from "@/lib/types/pokemon";
import {
  detectMegaFromItem,
  getMegaEntryFromSpecies,
} from "@/lib/utils/mega-detect";

export interface SpeedTierForm {
  data: PokemonData | null;
  species: string;
  speciesKey: string;
  isMega: boolean;
  baseSpeciesKey: string;
}

function toSpeciesKey(species: string): string {
  return species
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Resolve the exact Base/Mega form represented by a speed-tier row. */
export function resolveSpeedTierForm(
  pokemon: Pick<AnalyzedPokemon, "parsed" | "data">,
  fallbackSpeciesKey: string,
  showMega: boolean,
): SpeedTierForm {
  const importedMega = getMegaEntryFromSpecies(pokemon.parsed.species);
  const megaEntry = importedMega
    ?? detectMegaFromItem(pokemon.parsed.item, pokemon.parsed.species);
  const baseSpeciesKey = megaEntry
    ? toSpeciesKey(megaEntry.baseName)
    : fallbackSpeciesKey;
  const shouldShowMega = showMega && !!megaEntry;

  if (shouldShowMega && megaEntry) {
    const data = lookupPokemon(megaEntry.dataKey);
    return {
      data,
      species: data?.name ?? megaEntry.displayName,
      speciesKey: megaEntry.dataKey,
      isMega: true,
      baseSpeciesKey,
    };
  }

  const data = importedMega && megaEntry
    ? lookupPokemon(megaEntry.baseName)
    : pokemon.data;

  return {
    data,
    species: data?.name ?? (megaEntry?.baseName ?? pokemon.parsed.species),
    speciesKey: baseSpeciesKey,
    isMega: false,
    baseSpeciesKey,
  };
}
