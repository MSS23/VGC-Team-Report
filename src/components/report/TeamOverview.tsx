import type { AnalyzedPokemon } from "@/lib/types/analysis";
import { PokemonCard } from "./PokemonCard";

interface TeamOverviewProps {
  pokemon: AnalyzedPokemon[];
  creatorMode: boolean;
  speciesKeys: string[];
  roles: Record<string, string>;
  onRoleChange: (speciesKey: string, text: string) => void;
  summary: string;
  onSummaryChange: (text: string) => void;
  isReadOnly: boolean;
}

export function TeamOverview({
  pokemon,
  creatorMode,
  speciesKeys,
  roles,
  onRoleChange,
  summary,
  onSummaryChange,
  isReadOnly,
}: TeamOverviewProps) {
  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in">
      {/* Pokemon Grid */}
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
            role={roles[speciesKeys[i]] ?? ""}
            onRoleChange={(text) => onRoleChange(speciesKeys[i], text)}
            isReadOnly={isReadOnly}
          />
        ))}
      </div>

      {/* Team Summary */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
          Team Summary
        </h3>
        {isReadOnly ? (
          summary ? (
            <div className="w-full min-h-[6rem] p-4 sm:p-5 bg-surface border border-border rounded-2xl text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
              {summary}
            </div>
          ) : (
            <div className="w-full p-4 sm:p-5 bg-surface border border-border rounded-2xl text-sm text-text-tertiary">
              No team summary.
            </div>
          )
        ) : (
          <textarea
            value={summary}
            onChange={(e) => onSummaryChange(e.target.value)}
            placeholder="Summarize your team's overall strategy, win conditions, and key synergies..."
            className="w-full min-h-[6rem] p-4 sm:p-5 bg-surface border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-tertiary resize-y focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent leading-relaxed transition-shadow"
            spellCheck={false}
          />
        )}
      </div>
    </div>
  );
}
