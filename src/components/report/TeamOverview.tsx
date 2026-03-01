import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonCard } from "./PokemonCard";

interface TeamOverviewProps {
  pokemon: AnalyzedPokemon[];
  creatorMode: boolean;
}

export function TeamOverview({ pokemon, creatorMode }: TeamOverviewProps) {
  return (
    <div className={`stagger-children grid gap-3 sm:gap-4 creator:gap-6 ${
      creatorMode
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    }`}>
      {pokemon.map((mon, i) => (
        <PokemonCard
          key={`${mon.parsed.species}-${i}`}
          pokemon={mon}
          creatorMode={creatorMode}
        />
      ))}
    </div>
  );
}
