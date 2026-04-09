"use client";

import dynamic from "next/dynamic";
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { MatchupPlan, GameResult } from "@/hooks/useMatchupPlans";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
import type { SpriteConfig } from "@/lib/types/sprites";
import type { ReportTags } from "@/lib/data/tags";
import { TeamOverview } from "./TeamOverview";
import { PokemonDetailSlide } from "./PokemonDetailSlide";
import { useVersionDiff } from "@/lib/contexts/VersionDiffContext";

// Lazy-load heavy analysis and matchup components
const SpeedTierChart = dynamic(() => import("./SpeedTierChart").then(m => ({ default: m.SpeedTierChart })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-2xl h-96" data-walkthrough="speed-tiers" />,
});
const OffensiveCoverageChart = dynamic(() => import("./OffensiveCoverageChart").then(m => ({ default: m.OffensiveCoverageChart })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-xl h-48" />,
});
const DefensiveCoverageChart = dynamic(() => import("./DefensiveCoverageChart").then(m => ({ default: m.DefensiveCoverageChart })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-2xl h-64" />,
});
const MatchupPlanSlide = dynamic(() => import("./MatchupPlanSlide").then(m => ({ default: m.MatchupPlanSlide })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-2xl h-64" />,
});
const MatchupSheet = dynamic(() => import("./MatchupSheet").then(m => ({ default: m.MatchupSheet })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-2xl h-64" data-walkthrough="matchup-sheet" />,
});

interface TeamReportProps {
  analysis: TeamAnalysis;
  creatorMode: boolean;
  currentSlide: number;
  notes: Record<string, string>;
  onNoteChange: (species: string, text: string) => void;
  calcs: Record<string, CalcEntry[]>;
  onAddCalc: (species: string, text: string, category: CalcCategory) => void;
  onRemoveCalc: (species: string, index: number) => void;
  onEditCalc: (species: string, index: number, updates: Partial<import("@/hooks/useDamageCalcs").CalcEntry>) => void;
  speciesKeys: string[];
  roles: Record<string, string>;
  onRoleChange: (speciesKey: string, text: string) => void;
  teamSummary: string;
  onTeamSummaryChange: (text: string) => void;
  tournamentName?: string;
  onTournamentNameChange?: (text: string) => void;
  placement?: string;
  onPlacementChange?: (text: string) => void;
  record?: string;
  onRecordChange?: (text: string) => void;
  rentalCode?: string;
  onRentalCodeChange?: (text: string) => void;
  creatorName?: string;
  onCreatorNameChange?: (text: string) => void;
  mvpIndex?: number | null;
  onMvpIndexChange?: (index: number | null) => void;
  tags?: ReportTags;
  onTagsChange?: (tags: ReportTags) => void;
  isReadOnly?: boolean;
  isPresentationMode?: boolean;
  plans?: MatchupPlan[];
  onGamePlanNotesChange?: (matchupId: string, gamePlanId: string, notes: string) => void;
  onGamePlanReplaysChange?: (matchupId: string, gamePlanId: string, replays: string[]) => void;
  onGamePlanBringChange?: (
    matchupId: string,
    gamePlanId: string,
    bringIndex: 0 | 1 | 2 | 3,
    pokemonIndex: number | null
  ) => void;
  onAddGamePlan?: (matchupId: string) => void;
  onRemoveGamePlan?: (matchupId: string, gamePlanId: string) => void;
  onReorderGamePlanBring?: (matchupId: string, gamePlanId: string, fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => void;
  onGamePlanResultChange?: (matchupId: string, gamePlanId: string, result: GameResult) => void;
  onReorderPlans?: (fromIndex: number, toIndex: number) => void;
  onRemovePlan?: (id: string) => void;
  onAddPlan?: (paste: string, label: string) => void;
  getSpriteConfig?: (key: string) => SpriteConfig;
  onReorderPokemon?: (fromIndex: number, toIndex: number) => void;
  onPokemonLongPress?: (index: number) => void;
  onUpdatePaste?: (paste: string) => void;
  megaStates?: Record<number, boolean>;
  onToggleMega?: (index: number) => void;
}

/**
 * Wraps a specific field/section with a highlight border when that field changed.
 * Unlike the old DiffHighlight which wrapped entire slides, this targets individual fields.
 */
export function FieldDiffHighlight({ field, children, label }: { field: string | string[]; children: React.ReactNode; label?: string }) {
  const { diff } = useVersionDiff();
  const fields = Array.isArray(field) ? field : [field];
  const matchedField = diff ? fields.find((f) => diff.changedFields.has(f)) : undefined;

  if (!matchedField) return <>{children}</>;

  return (
    <div className="version-diff-highlight relative" data-diff-field={matchedField}>
      <div className="version-diff-border absolute -inset-1.5 sm:-inset-2 rounded-xl pointer-events-none" />
      <div className="version-diff-label absolute -top-1.5 sm:-top-2 left-2 sm:left-3 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-md shadow-sm shadow-blue-500/30 uppercase tracking-wider">
          <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
          {label ?? "Changed"}
        </span>
      </div>
      {children}
    </div>
  );
}

export function TeamReport({
  analysis,
  creatorMode,
  currentSlide,
  notes,
  onNoteChange,
  calcs,
  onAddCalc,
  onRemoveCalc,
  onEditCalc,
  speciesKeys,
  roles,
  onRoleChange,
  teamSummary,
  onTeamSummaryChange,
  tournamentName,
  onTournamentNameChange,
  placement,
  onPlacementChange,
  record,
  onRecordChange,
  rentalCode,
  onRentalCodeChange,
  creatorName,
  onCreatorNameChange,
  mvpIndex,
  onMvpIndexChange,
  tags,
  onTagsChange,
  isReadOnly = false,
  isPresentationMode = false,
  plans = [],
  onGamePlanNotesChange,
  onGamePlanReplaysChange,
  onGamePlanBringChange,
  onAddGamePlan,
  onRemoveGamePlan,
  onReorderGamePlanBring,
  onGamePlanResultChange,
  onReorderPlans,
  onRemovePlan,
  onAddPlan,
  getSpriteConfig,
  onReorderPokemon,
  onPokemonLongPress,
  onUpdatePaste,
  megaStates,
  onToggleMega,
}: TeamReportProps) {
  const pokemonCount = analysis.pokemon.length;

  // Slide 0: Team Overview
  if (currentSlide === 0) {
    return (
        <TeamOverview
          pokemon={analysis.pokemon}
          creatorMode={creatorMode}
          speciesKeys={speciesKeys}
          roles={roles}
          onRoleChange={onRoleChange}
          summary={teamSummary}
          onSummaryChange={onTeamSummaryChange}
          tournamentName={tournamentName}
          onTournamentNameChange={onTournamentNameChange}
          placement={placement}
          onPlacementChange={onPlacementChange}
          record={record}
          onRecordChange={onRecordChange}
          rentalCode={rentalCode}
          onRentalCodeChange={onRentalCodeChange}
          creatorName={creatorName}
          onCreatorNameChange={onCreatorNameChange}
          mvpIndex={mvpIndex ?? null}
          onMvpIndexChange={onMvpIndexChange}
          tags={tags}
          onTagsChange={onTagsChange}
          isReadOnly={isReadOnly}
          getSpriteConfig={getSpriteConfig}
          onReorderPokemon={onReorderPokemon}
          onPokemonLongPress={onPokemonLongPress}
          onUpdatePaste={onUpdatePaste}
          megaStates={megaStates}
          onToggleMega={onToggleMega}
        />
    );
  }

  // Slides 1 through pokemonCount: Individual Pokemon detail
  if (currentSlide >= 1 && currentSlide <= pokemonCount) {
    const pokemonIndex = currentSlide - 1;
    const pokemon = analysis.pokemon[pokemonIndex];
    const key = speciesKeys[pokemonIndex];

    return (
        <PokemonDetailSlide
          pokemon={pokemon}
          note={notes[key] ?? ""}
          onNoteChange={(text) => onNoteChange(key, text)}
          calcs={calcs[key] ?? []}
          onAddCalc={(text, category) => onAddCalc(key, text, category)}
          onRemoveCalc={(index) => onRemoveCalc(key, index)}
          onEditCalc={(index, updates) => onEditCalc(key, index, updates)}
          isReadOnly={isReadOnly}
          isPresentationMode={isPresentationMode}
          shiny={getSpriteConfig?.(key)?.shiny}
          animated={getSpriteConfig?.(key)?.animated}
          speciesKey={key}
          pokemonIndex={pokemonIndex}
          regulation={tags?.regulation}
        />
    );
  }

  // Speed tier chart slide (after all Pokemon)
  if (currentSlide === pokemonCount + 1) {
    return (
        <SpeedTierChart
          pokemon={analysis.pokemon}
          speciesKeys={speciesKeys}
          getSpriteConfig={getSpriteConfig}
          isPresentationMode={isPresentationMode}
          regulation={tags?.regulation}
        />
    );
  }

  // Offensive coverage slide
  if (currentSlide === pokemonCount + 2) {
    return (
        <div className="animate-fade-in">
          <OffensiveCoverageChart pokemon={analysis.pokemon} />
        </div>
    );
  }

  // Defensive coverage slide
  if (currentSlide === pokemonCount + 3) {
    return (
        <div className="animate-fade-in">
          <DefensiveCoverageChart pokemon={analysis.pokemon} />
        </div>
    );
  }

  // Per-matchup plan slides (visibility handled by navigation layer)
  if (plans.length > 0) {
    const matchupSlideIndex = currentSlide - pokemonCount - 4;

    if (matchupSlideIndex >= 0 && matchupSlideIndex < plans.length) {
      const plan = plans[matchupSlideIndex];
      return (
          <MatchupPlanSlide
            plan={plan}
            yourPokemon={analysis.pokemon}
            isReadOnly={isReadOnly}
            onGamePlanNotesChange={onGamePlanNotesChange ?? (() => {})}
            onGamePlanReplaysChange={onGamePlanReplaysChange ?? (() => {})}
            onGamePlanBringChange={onGamePlanBringChange ?? (() => {})}
            onReorderGamePlanBring={onReorderGamePlanBring ?? (() => {})}
            onGamePlanResultChange={onGamePlanResultChange ?? (() => {})}
            onAddGamePlan={onAddGamePlan ?? (() => {})}
            onRemoveGamePlan={onRemoveGamePlan ?? (() => {})}
            onRemove={onRemovePlan ?? (() => {})}
          />
      );
    }
  }

  // Last slide: Matchup sheet (always available — expandable rows for game plans)
  const matchupSheetSlide = pokemonCount + 4 + plans.length;
  if (currentSlide === matchupSheetSlide) {
    return (
        <MatchupSheet
          plans={plans}
          yourPokemon={analysis.pokemon}
          isReadOnly={isReadOnly}
          onReorderPlans={onReorderPlans ?? (() => {})}
          onRemovePlan={onRemovePlan ?? (() => {})}
          onAddPlan={onAddPlan ?? (() => {})}
        />
    );
  }

  return null;
}
