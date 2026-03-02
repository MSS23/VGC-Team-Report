"use client";

import type { TeamAnalysis } from "@/lib/types/analysis";
import type { MatchupPlan, GameResult } from "@/hooks/useMatchupPlans";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
import type { SpriteConfig } from "@/hooks/useSpriteSettings";
import { TeamOverview } from "./TeamOverview";
import { MatchupSheet } from "./MatchupSheet";
import { PokemonDetailSlide } from "./PokemonDetailSlide";
import { MatchupPlanSlide } from "./MatchupPlanSlide";
import { SpeedTierChart } from "./SpeedTierChart";

interface TeamReportProps {
  analysis: TeamAnalysis;
  creatorMode: boolean;
  currentSlide: number;
  notes: Record<string, string>;
  onNoteChange: (species: string, text: string) => void;
  calcs: Record<string, CalcEntry[]>;
  onAddCalc: (species: string, text: string, category: CalcCategory) => void;
  onRemoveCalc: (species: string, index: number) => void;
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
  mvpIndex?: number | null;
  onMvpIndexChange?: (index: number | null) => void;
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
  onTogglePlanSlide?: (id: string) => void;
  getSpriteConfig?: (key: string) => SpriteConfig;
  onToggleShiny?: (key: string) => void;
  onToggleAnimated?: (key: string) => void;
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
  mvpIndex,
  onMvpIndexChange,
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
  onTogglePlanSlide,
  getSpriteConfig,
  onToggleShiny,
  onToggleAnimated,
}: TeamReportProps) {
  const pokemonCount = analysis.pokemon.length;
  // Individual matchup slides only in creator mode
  const showMatchupSlides = creatorMode && !isReadOnly;
  // Only plans with showSlide !== false get their own slide
  const visibleSlidePlans = plans.filter((p) => p.showSlide !== false);

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
        mvpIndex={mvpIndex ?? null}
        onMvpIndexChange={onMvpIndexChange}
        isReadOnly={isReadOnly}
        getSpriteConfig={getSpriteConfig}
        onToggleShiny={onToggleShiny}
        onToggleAnimated={onToggleAnimated}
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
        slideNumber={currentSlide}
        isReadOnly={isReadOnly}
        isPresentationMode={isPresentationMode}
        shiny={getSpriteConfig?.(key)?.shiny}
        animated={getSpriteConfig?.(key)?.animated}
        onToggleShiny={onToggleShiny ? () => onToggleShiny(key) : undefined}
        onToggleAnimated={onToggleAnimated ? () => onToggleAnimated(key) : undefined}
      />
    );
  }

  // Speed tier chart slide (after all Pokemon, before matchups)
  if (currentSlide === pokemonCount + 1) {
    return (
      <SpeedTierChart
        pokemon={analysis.pokemon}
        speciesKeys={speciesKeys}
        getSpriteConfig={getSpriteConfig}
        isPresentationMode={isPresentationMode}
      />
    );
  }

  // Per-matchup plan slides (only in creator mode, only visible plans)
  if (showMatchupSlides) {
    const matchupSlideIndex = currentSlide - pokemonCount - 2;

    if (visibleSlidePlans.length > 0 && matchupSlideIndex >= 0 && matchupSlideIndex < visibleSlidePlans.length) {
      const plan = visibleSlidePlans[matchupSlideIndex];
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
  const matchupSlidesCount = showMatchupSlides ? visibleSlidePlans.length : 0;
  const matchupSheetSlide = pokemonCount + 2 + matchupSlidesCount;
  if (currentSlide === matchupSheetSlide) {
    return (
      <MatchupSheet
        plans={plans}
        yourPokemon={analysis.pokemon}
        isReadOnly={isReadOnly}
        onGamePlanNotesChange={onGamePlanNotesChange ?? (() => {})}
        onGamePlanReplaysChange={onGamePlanReplaysChange ?? (() => {})}
        onGamePlanBringChange={onGamePlanBringChange ?? (() => {})}
        onReorderGamePlanBring={onReorderGamePlanBring ?? (() => {})}
        onGamePlanResultChange={onGamePlanResultChange ?? (() => {})}
        onReorderPlans={onReorderPlans ?? (() => {})}
        onAddGamePlan={onAddGamePlan ?? (() => {})}
        onRemoveGamePlan={onRemoveGamePlan ?? (() => {})}
        onRemovePlan={onRemovePlan ?? (() => {})}
        onAddPlan={onAddPlan ?? (() => {})}
        onTogglePlanSlide={onTogglePlanSlide}
      />
    );
  }

  return null;
}
