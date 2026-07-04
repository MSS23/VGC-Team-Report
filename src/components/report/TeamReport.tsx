"use client";

import { useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { MatchupPlan, GameResult } from "@/hooks/useMatchupPlans";
import type { CalcEntry, CalcCategory } from "@/hooks/useDamageCalcs";
import type { SpriteConfig } from "@/lib/types/sprites";
import type { ReportTags } from "@/lib/data/tags";
import { TeamOverview } from "./TeamOverview";
import { PokemonDetailSlide } from "./PokemonDetailSlide";
import { CommonModesSlide, type CommonModesValue } from "./CommonModesSlide";
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

// Stable empty array so the memoized PokemonDetailSlide sees a referentially
// equal `calcs` prop for slots with no damage calcs (otherwise `?? []` minted a
// fresh array every render and defeated React.memo).
const EMPTY_CALCS: CalcEntry[] = [];

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
  commonModes?: CommonModesValue;
  onCommonModesChange?: (value: CommonModesValue) => void;
  teamName?: string;
  onTeamNameChange?: (text: string) => void;
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
  onReplacePokemon?: (index: number, newSpecies: string) => void;
  megaStates?: Record<number, boolean>;
  onToggleMega?: (index: number) => void;
  /** Tiered publishing (VGC-142) — owner-only privacy toggles. */
  privateFields?: string[];
  onPrivateFieldsChange?: (fields: string[]) => void;
  /** Server-redacted fields for non-owner viewers — drives the "some
   *  fields hidden" banner. Empty when the viewer is the owner or no
   *  fields were marked private. */
  redactedFields?: string[];
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
  commonModes,
  onCommonModesChange,
  teamName,
  onTeamNameChange,
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
  onReplacePokemon,
  megaStates,
  onToggleMega,
  privateFields,
  onPrivateFieldsChange,
  redactedFields,
}: TeamReportProps) {
  const pokemonCount = analysis.pokemon.length;

  // ── Stable per-slide detail callbacks ────────────────────────────
  // The Pokemon detail slide (currentSlide >= 2) is memoized. Passing fresh
  // inline arrows every render (e.g. `(text) => onNoteChange(key, text)`) would
  // change its props on every parent render and defeat the memo. Derive the
  // active slide's key/index up front and wrap the closures in useCallback so
  // they stay referentially stable while the same slide is shown. These hooks
  // must run before any early return to satisfy the rules of hooks.
  const detailIndex = currentSlide - 2;
  const detailKey = speciesKeys[detailIndex];
  const handleDetailNoteChange = useCallback(
    (text: string) => onNoteChange(detailKey, text),
    [onNoteChange, detailKey],
  );
  const handleDetailAddCalc = useCallback(
    (text: string, category: CalcCategory) => onAddCalc(detailKey, text, category),
    [onAddCalc, detailKey],
  );
  const handleDetailRemoveCalc = useCallback(
    (index: number) => onRemoveCalc(detailKey, index),
    [onRemoveCalc, detailKey],
  );
  const handleDetailEditCalc = useCallback(
    (index: number, updates: Partial<CalcEntry>) => onEditCalc(detailKey, index, updates),
    [onEditCalc, detailKey],
  );
  const handleDetailToggleMega = useMemo(
    () => (onToggleMega ? () => onToggleMega(detailIndex) : undefined),
    [onToggleMega, detailIndex],
  );

  const redactedNotice = (redactedFields && redactedFields.length > 0) ? (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 mb-3">
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <p className="text-xs leading-relaxed">
          <span className="font-bold">Some fields hidden by the creator.</span>{" "}
          {redactedFields.includes("evs") && "EV/SP spreads, "}
          {redactedFields.includes("ivs") && "IVs, "}
          {redactedFields.includes("nature") && "nature, "}
          {redactedFields.includes("item") && "held items, "}
          are not shown on this public view.
        </p>
      </div>
    </div>
  ) : null;

  // Slide 0: Team Overview
  if (currentSlide === 0) {
    return (
      <>
        {redactedNotice}
        <TeamOverview
          pokemon={analysis.pokemon}
          creatorMode={creatorMode}
          speciesKeys={speciesKeys}
          roles={roles}
          onRoleChange={onRoleChange}
          summary={teamSummary}
          onSummaryChange={onTeamSummaryChange}
          teamName={teamName}
          onTeamNameChange={onTeamNameChange}
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
          onReplacePokemon={onReplacePokemon}
          megaStates={megaStates}
          onToggleMega={onToggleMega}
          privateFields={privateFields}
          onPrivateFieldsChange={onPrivateFieldsChange}
        />
      </>
    );
  }

  // Slide 1: Common Modes ("How to pilot this team")
  if (currentSlide === 1) {
    return (
      <>
        {redactedNotice}
        <CommonModesSlide
          commonModes={commonModes}
          onChange={onCommonModesChange ?? (() => {})}
          isReadOnly={isReadOnly}
          isPresentationMode={isPresentationMode}
        />
      </>
    );
  }

  // Slides 2 through pokemonCount + 1: Individual Pokemon detail
  if (currentSlide >= 2 && currentSlide <= pokemonCount + 1) {
    const pokemonIndex = currentSlide - 2;
    const pokemon = analysis.pokemon[pokemonIndex];
    const key = speciesKeys[pokemonIndex];

    return (
        <PokemonDetailSlide
          pokemon={pokemon}
          note={notes[key] ?? ""}
          onNoteChange={handleDetailNoteChange}
          calcs={calcs[key] ?? EMPTY_CALCS}
          onAddCalc={handleDetailAddCalc}
          onRemoveCalc={handleDetailRemoveCalc}
          onEditCalc={handleDetailEditCalc}
          isReadOnly={isReadOnly}
          isPresentationMode={isPresentationMode}
          shiny={getSpriteConfig?.(key)?.shiny}
          animated={getSpriteConfig?.(key)?.animated}
          speciesKey={key}
          pokemonIndex={pokemonIndex}
          regulation={tags?.regulation}
          isMega={megaStates?.[pokemonIndex]}
          onToggleMega={handleDetailToggleMega}
        />
    );
  }

  // Speed tier chart slide (after all Pokemon)
  if (currentSlide === pokemonCount + 2) {
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
  if (currentSlide === pokemonCount + 3) {
    return (
        <div className="animate-fade-in">
          <OffensiveCoverageChart pokemon={analysis.pokemon} />
        </div>
    );
  }

  // Defensive coverage slide
  if (currentSlide === pokemonCount + 4) {
    return (
        <div className="animate-fade-in">
          <DefensiveCoverageChart pokemon={analysis.pokemon} />
        </div>
    );
  }

  // Per-matchup plan slides (visibility handled by navigation layer)
  if (plans.length > 0) {
    const matchupSlideIndex = currentSlide - pokemonCount - 5;

    if (matchupSlideIndex >= 0 && matchupSlideIndex < plans.length) {
      const plan = plans[matchupSlideIndex];
      return (
          <MatchupPlanSlide
            plan={plan}
            yourPokemon={analysis.pokemon}
            isReadOnly={isReadOnly}
            onGamePlanNotesChange={onGamePlanNotesChange ?? (() => {})}
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
  const matchupSheetSlide = pokemonCount + 5 + plans.length;
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
