import type { AnalyzedPokemon } from "@/lib/types/analysis";
import type { SpriteConfig } from "@/hooks/useSpriteSettings";
import { PokemonCard } from "./PokemonCard";

interface TeamOverviewProps {
  pokemon: AnalyzedPokemon[];
  creatorMode: boolean;
  speciesKeys: string[];
  roles: Record<string, string>;
  onRoleChange: (speciesKey: string, text: string) => void;
  summary: string;
  onSummaryChange: (text: string) => void;
  tournamentName?: string;
  onTournamentNameChange?: (text: string) => void;
  placement?: string;
  onPlacementChange?: (text: string) => void;
  record?: string;
  onRecordChange?: (text: string) => void;
  mvpIndex?: number | null;
  onMvpIndexChange?: (index: number | null) => void;
  isReadOnly: boolean;
  getSpriteConfig?: (key: string) => SpriteConfig;
  onToggleShiny?: (key: string) => void;
  onToggleAnimated?: (key: string) => void;
}

export function TeamOverview({
  pokemon,
  creatorMode,
  speciesKeys,
  roles,
  onRoleChange,
  summary,
  onSummaryChange,
  tournamentName,
  onTournamentNameChange,
  placement,
  onPlacementChange,
  record,
  onRecordChange,
  mvpIndex,
  onMvpIndexChange,
  isReadOnly,
  getSpriteConfig,
  onToggleShiny,
  onToggleAnimated,
}: TeamOverviewProps) {
  const hasTournamentInfo = !!(tournamentName || placement || record);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in">
      {/* Tournament Context */}
      {isReadOnly ? (
        hasTournamentInfo && (
          <div className="flex items-center gap-3 flex-wrap px-1">
            {tournamentName && (
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                {tournamentName}
              </h2>
            )}
            {placement && (
              <span className="text-sm font-bold text-accent bg-accent-surface px-3 py-1 rounded-full border border-accent/20">
                {placement}
              </span>
            )}
            {record && (
              <span className="text-sm text-text-secondary font-medium">({record})</span>
            )}
          </div>
        )
      ) : (
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">
            Tournament Info
          </h3>
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              value={tournamentName ?? ""}
              onChange={(e) => onTournamentNameChange?.(e.target.value)}
              placeholder="Event name (e.g. EUIC 2025)"
              className="flex-1 min-w-[180px] px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
            <input
              type="text"
              value={placement ?? ""}
              onChange={(e) => onPlacementChange?.(e.target.value)}
              placeholder="Placement (e.g. Top 8)"
              className="w-[140px] px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
            <input
              type="text"
              value={record ?? ""}
              onChange={(e) => onRecordChange?.(e.target.value)}
              placeholder="Record (e.g. 7-2)"
              className="w-[120px] px-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-shadow"
            />
          </div>
        </div>
      )}

      {/* Team Summary */}
      <div>
        <h3 className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary mb-3">
          Team Summary
        </h3>
        {isReadOnly ? (
          summary ? (
            <div className="w-full min-h-[6rem] p-4 sm:p-5 bg-surface border border-border rounded-2xl text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
              {summary}
            </div>
          ) : (
            <div className="w-full p-4 sm:p-5 bg-surface-alt/50 border border-border-subtle rounded-2xl text-sm text-text-tertiary italic">
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

      {/* Pokemon Grid */}
      <div className={`stagger-children grid gap-3 sm:gap-4 creator:gap-6 ${
        creatorMode
          ? "grid-cols-1 md:grid-cols-2"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      }`}>
        {pokemon.map((mon, i) => {
          const sc = getSpriteConfig?.(speciesKeys[i]);
          return (
            <PokemonCard
              key={`${mon.parsed.species}-${i}`}
              pokemon={mon}
              creatorMode={creatorMode}
              role={roles[speciesKeys[i]] ?? ""}
              onRoleChange={(text) => onRoleChange(speciesKeys[i], text)}
              isReadOnly={isReadOnly}
              isMvp={mvpIndex === i}
              onToggleMvp={() => onMvpIndexChange?.(mvpIndex === i ? null : i)}
              shiny={sc?.shiny}
              animated={sc?.animated}
              onToggleShiny={onToggleShiny ? () => onToggleShiny(speciesKeys[i]) : undefined}
              onToggleAnimated={onToggleAnimated ? () => onToggleAnimated(speciesKeys[i]) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
