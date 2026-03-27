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
  loading: () => <div className="animate-pulse bg-surface-alt rounded-2xl h-96" />,
});
const MatchupPlanSlide = dynamic(() => import("./MatchupPlanSlide").then(m => ({ default: m.MatchupPlanSlide })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-2xl h-64" />,
});
const MatchupSheet = dynamic(() => import("./MatchupSheet").then(m => ({ default: m.MatchupSheet })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-2xl h-64" />,
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
  spreadNotes?: Record<string, string>;
  onSpreadNoteChange?: (speciesKey: string, text: string) => void;
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
}

/** Wraps slide content with a highlight border when the slide has version diff changes. */
function DiffHighlight({ slideIndex, children }: { slideIndex: number; children: React.ReactNode }) {
  const { diff } = useVersionDiff();
  const hasChanges = diff?.changedSlides.has(slideIndex) ?? false;

  if (!hasChanges) return <>{children}</>;

  return (
    <div className="version-diff-highlight relative">
      <div className="version-diff-border absolute -inset-2 sm:-inset-3 rounded-2xl pointer-events-none" />
      <div className="version-diff-label absolute -top-2 sm:-top-3 left-3 sm:left-4 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-md shadow-md shadow-blue-500/30 uppercase tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          Changed
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
  spreadNotes = {},
  onSpreadNoteChange,
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
}: TeamReportProps) {
  const pokemonCount = analysis.pokemon.length;

  // Slide 0: Team Overview
  if (currentSlide === 0) {
    return (
      <DiffHighlight slideIndex={0}>
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
        />
      </DiffHighlight>
    );
  }

  // Slides 1 through pokemonCount: Individual Pokemon detail
  if (currentSlide >= 1 && currentSlide <= pokemonCount) {
    const pokemonIndex = currentSlide - 1;
    const pokemon = analysis.pokemon[pokemonIndex];
    const key = speciesKeys[pokemonIndex];

    return (
      <DiffHighlight slideIndex={currentSlide}>
        <PokemonDetailSlide
          pokemon={pokemon}
          note={notes[key] ?? ""}
          onNoteChange={(text) => onNoteChange(key, text)}
          spreadNote={spreadNotes[key] ?? ""}
          onSpreadNoteChange={onSpreadNoteChange ? (text) => onSpreadNoteChange(key, text) : undefined}
          calcs={calcs[key] ?? []}
          onAddCalc={(text, category) => onAddCalc(key, text, category)}
          onRemoveCalc={(index) => onRemoveCalc(key, index)}
          onEditCalc={(index, updates) => onEditCalc(key, index, updates)}
          isReadOnly={isReadOnly}
          isPresentationMode={isPresentationMode}
          shiny={getSpriteConfig?.(key)?.shiny}
          animated={getSpriteConfig?.(key)?.animated}
        />
      </DiffHighlight>
    );
  }

  // Speed tier chart slide (after all Pokemon, before matchups)
  if (currentSlide === pokemonCount + 1) {
    return (
      <DiffHighlight slideIndex={pokemonCount + 1}>
        <SpeedTierChart
          pokemon={analysis.pokemon}
          speciesKeys={speciesKeys}
          getSpriteConfig={getSpriteConfig}
          isPresentationMode={isPresentationMode}
        />
      </DiffHighlight>
    );
  }

  // Per-matchup plan slides (visibility handled by navigation layer)
  if (plans.length > 0) {
    const matchupSlideIndex = currentSlide - pokemonCount - 2;

    if (matchupSlideIndex >= 0 && matchupSlideIndex < plans.length) {
      const plan = plans[matchupSlideIndex];
      return (
        <DiffHighlight slideIndex={currentSlide}>
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
        </DiffHighlight>
      );
    }
  }

  // Last slide: Matchup sheet (always available — expandable rows for game plans)
  const matchupSheetSlide = pokemonCount + 2 + plans.length;
  if (currentSlide === matchupSheetSlide) {
    return (
      <DiffHighlight slideIndex={matchupSheetSlide}>
        <MatchupSheet
          plans={plans}
          yourPokemon={analysis.pokemon}
          isReadOnly={isReadOnly}
          onReorderPlans={onReorderPlans ?? (() => {})}
          onRemovePlan={onRemovePlan ?? (() => {})}
          onAddPlan={onAddPlan ?? (() => {})}
        />
      </DiffHighlight>
    );
  }

  return null;
}
