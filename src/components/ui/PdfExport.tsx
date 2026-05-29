"use client";

import type { TeamAnalysis } from "@/lib/types/analysis";
import type { MatchupPlan } from "@/hooks/useMatchupPlans";
import type { CalcEntry } from "@/hooks/useDamageCalcs";
import type { SpriteConfig } from "@/lib/types/sprites";
import type { ReportTags } from "@/lib/data/tags";
// Re-export the lightweight context so existing imports from this file continue to work.
export { PrintContext, useIsPrintMode } from "@/components/ui/print-context";
import { PrintContext } from "@/components/ui/print-context";
import { TeamOverview } from "@/components/report/TeamOverview";
import { PokemonDetailSlide } from "@/components/report/PokemonDetailSlide";
import { SpeedTierChart } from "@/components/report/SpeedTierChart";
import { MatchupPlanSlide } from "@/components/report/MatchupPlanSlide";
import { MatchupSheet } from "@/components/report/MatchupSheet";
import { PrintableTournamentMode } from "@/components/report/TournamentMode";
import type { StatView } from "@/components/report/TournamentMode";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export type ExportMode = "all-slides" | "tournament-evs" | "tournament-stats";

export interface PdfExportProps {
  analysis: TeamAnalysis;
  notes: Record<string, string>;
  calcs: Record<string, CalcEntry[]>;
  roles: Record<string, string>;
  speciesKeys: string[];
  teamSummary: string;
  tournamentName?: string;
  placement?: string;
  record?: string;
  rentalCode?: string;
  creatorName?: string;
  mvpIndex?: number | null;
  tags?: ReportTags;
  plans: MatchupPlan[];
  getSpriteConfig?: (key: string) => SpriteConfig;
  exportMode?: ExportMode;
}

/* ------------------------------------------------------------------ */
/*  PrintableReport – renders every slide in sequence                  */
/* ------------------------------------------------------------------ */

export function PrintableReport({
  analysis,
  notes,
  calcs,
  roles,
  speciesKeys,
  teamSummary,
  tournamentName,
  placement,
  record,
  rentalCode,
  creatorName,
  mvpIndex,
  tags,
  plans,
  getSpriteConfig,
  exportMode = "all-slides",
}: PdfExportProps) {
  const noop = () => {};

  // Tournament mode export
  if (exportMode === "tournament-evs" || exportMode === "tournament-stats") {
    const statView: StatView = exportMode === "tournament-stats" ? "stats" : "evs";
    return (
      <PrintContext.Provider value={true}>
        <div className="print-slide">
          <PrintableTournamentMode
            analysis={analysis}
            speciesKeys={speciesKeys}
            getSpriteConfig={getSpriteConfig}
            statView={statView}
            regulation={tags?.regulation}
          />
        </div>
      </PrintContext.Provider>
    );
  }

  return (
    <PrintContext.Provider value={true}>
      {/* Slide 1: Team Overview */}
      <div className="print-slide">
        <TeamOverview
          pokemon={analysis.pokemon}
          creatorMode={false}
          speciesKeys={speciesKeys}
          roles={roles}
          onRoleChange={noop}
          summary={teamSummary}
          onSummaryChange={noop}
          tournamentName={tournamentName}
          placement={placement}
          record={record}
          rentalCode={rentalCode}
          creatorName={creatorName}
          mvpIndex={mvpIndex ?? null}
          tags={tags}
          isReadOnly={true}
          getSpriteConfig={getSpriteConfig}
        />
      </div>

      {/* Slides 2..N: Pokemon details */}
      {analysis.pokemon.map((pokemon, i) => {
        const key = speciesKeys[i];
        return (
          <div className="print-slide" key={`pokemon-${key}`}>
            <PokemonDetailSlide
              pokemon={pokemon}
              note={notes[key] ?? ""}
              onNoteChange={noop}
              calcs={calcs[key] ?? []}
              onAddCalc={noop}
              onRemoveCalc={noop}
              isReadOnly={true}
              isPresentationMode={true}
              shiny={getSpriteConfig?.(key)?.shiny}
              animated={getSpriteConfig?.(key)?.animated}
              speciesKey={key}
              pokemonIndex={i}
            />
          </div>
        );
      })}

      {/* Speed Tier Chart */}
      <div className="print-slide">
        <SpeedTierChart
          pokemon={analysis.pokemon}
          speciesKeys={speciesKeys}
          getSpriteConfig={getSpriteConfig}
          isPresentationMode={true}
        />
      </div>

      {/* Matchup Plan Slides */}
      {plans.map((plan) => (
        <div className="print-slide" key={`plan-${plan.id}`}>
          <MatchupPlanSlide
            plan={plan}
            yourPokemon={analysis.pokemon}
            isReadOnly={true}
            onGamePlanNotesChange={noop}
            onGamePlanReplaysChange={noop}
            onGamePlanBringChange={noop}
            onReorderGamePlanBring={noop}
            onGamePlanResultChange={noop}
            onAddGamePlan={noop}
            onRemoveGamePlan={noop}
            onRemove={noop}
          />
        </div>
      ))}

      {/* Matchup Sheet */}
      {plans.length > 0 && (
        <div className="print-slide">
          <MatchupSheet
            plans={plans}
            yourPokemon={analysis.pokemon}
            isReadOnly={true}
            onReorderPlans={noop}
            onRemovePlan={noop}
            onAddPlan={noop}
          />
        </div>
      )}
    </PrintContext.Provider>
  );
}

