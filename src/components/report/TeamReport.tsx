"use client";

import type { TeamAnalysis } from "@/lib/types/analysis";
import type { MatchupPlan } from "@/hooks/useMatchupPlans";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
import { TeamOverview } from "./TeamOverview";
import { MatchupSheet } from "./MatchupSheet";
import { PokemonDetailSlide } from "./PokemonDetailSlide";
import { MatchupPlanSlide } from "./MatchupPlanSlide";

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
  isReadOnly?: boolean;
  isPresentationMode?: boolean;
  plans?: MatchupPlan[];
  onGamePlanNotesChange?: (matchupId: string, gamePlanId: string, notes: string) => void;
  onGamePlanBringChange?: (
    matchupId: string,
    gamePlanId: string,
    bringIndex: 0 | 1 | 2 | 3,
    pokemonIndex: number | null
  ) => void;
  onAddGamePlan?: (matchupId: string) => void;
  onRemoveGamePlan?: (matchupId: string, gamePlanId: string) => void;
  onReorderGamePlanBring?: (matchupId: string, gamePlanId: string, fromIndex: 0 | 1 | 2 | 3, toIndex: 0 | 1 | 2 | 3) => void;
  onRemovePlan?: (id: string) => void;
  onAddPlan?: (paste: string, label: string) => void;
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
  isReadOnly = false,
  isPresentationMode = false,
  plans = [],
  onGamePlanNotesChange,
  onGamePlanBringChange,
  onAddGamePlan,
  onRemoveGamePlan,
  onReorderGamePlanBring,
  onRemovePlan,
  onAddPlan,
}: TeamReportProps) {
  const pokemonCount = analysis.pokemon.length;
  // Individual matchup slides only in creator mode
  const showMatchupSlides = creatorMode && !isReadOnly;

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
        isReadOnly={isReadOnly}
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
      />
    );
  }

  // Per-matchup plan slides (only in creator mode)
  if (showMatchupSlides) {
    const matchupSlideIndex = currentSlide - pokemonCount - 1;

    if (plans.length > 0 && matchupSlideIndex >= 0 && matchupSlideIndex < plans.length) {
      const plan = plans[matchupSlideIndex];
      return (
        <MatchupPlanSlide
          plan={plan}
          yourPokemon={analysis.pokemon}
          isReadOnly={isReadOnly}
          onGamePlanNotesChange={onGamePlanNotesChange ?? (() => {})}
          onGamePlanBringChange={onGamePlanBringChange ?? (() => {})}
          onReorderGamePlanBring={onReorderGamePlanBring ?? (() => {})}
          onAddGamePlan={onAddGamePlan ?? (() => {})}
          onRemoveGamePlan={onRemoveGamePlan ?? (() => {})}
          onRemove={onRemovePlan ?? (() => {})}
        />
      );
    }
  }

  // Last slide: Matchup sheet (always available — expandable rows for game plans)
  const matchupSlidesCount = showMatchupSlides ? plans.length : 0;
  const matchupSheetSlide = pokemonCount + 1 + matchupSlidesCount;
  if (currentSlide === matchupSheetSlide) {
    return (
      <MatchupSheet
        plans={plans}
        yourPokemon={analysis.pokemon}
        isReadOnly={isReadOnly}
        onGamePlanNotesChange={onGamePlanNotesChange ?? (() => {})}
        onGamePlanBringChange={onGamePlanBringChange ?? (() => {})}
        onReorderGamePlanBring={onReorderGamePlanBring ?? (() => {})}
        onAddGamePlan={onAddGamePlan ?? (() => {})}
        onRemoveGamePlan={onRemoveGamePlan ?? (() => {})}
        onRemovePlan={onRemovePlan ?? (() => {})}
        onAddPlan={onAddPlan ?? (() => {})}
      />
    );
  }

  return null;
}
