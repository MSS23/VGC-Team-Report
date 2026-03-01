"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import { useTeamReport } from "@/hooks/useTeamReport";
import { useCreatorMode } from "@/hooks/useCreatorMode";
import { usePresentationMode } from "@/hooks/usePresentationMode";
import { useSlideNavigation } from "@/hooks/useSlideNavigation";
import { usePokemonNotes } from "@/hooks/usePokemonNotes";
import { useDamageCalcs } from "@/hooks/useDamageCalcs";
import { useMatchupPlans } from "@/hooks/useMatchupPlans";
import { useShareUrl } from "@/hooks/useShareUrl";
import { PasteInput } from "@/components/input/PasteInput";
import { TeamReport } from "@/components/report/TeamReport";
import { SlideNavControls } from "@/components/report/SlideNavControls";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";

export default function Home() {
  const {
    paste,
    setPaste,
    analysis,
    parseTeam,
    reset,
    warnings,
  } = useTeamReport();

  const { creatorMode, setCreatorMode } = useCreatorMode();
  const { presentationMode, setPresentationMode } = usePresentationMode();
  const { isSharedView, sharedState, copyShareUrl, shareStatus } = useShareUrl();

  const isReadOnly = isSharedView || presentationMode;
  // Shared views look like presentation mode (dark polished theme) without fullscreen
  const isPresentationStyle = presentationMode || isSharedView;

  // Apply presentation styling for shared views (dark theme CSS)
  useEffect(() => {
    if (isSharedView) {
      document.documentElement.setAttribute("data-presentation-mode", "");
    }
  }, [isSharedView]);

  // Build species keys with dedup index for duplicate species
  const speciesKeys = useMemo(() => {
    if (!analysis) return [];
    const counts: Record<string, number> = {};
    return analysis.pokemon.map((mon) => {
      const species = mon.parsed.species;
      counts[species] = (counts[species] ?? 0) + 1;
      return counts[species] > 1 ? `${species}-${counts[species]}` : species;
    });
  }, [analysis]);

  const { notes, setNote, setNotesFull } = usePokemonNotes(speciesKeys, !isSharedView);
  const { calcs, addCalc, removeCalc, setCalcsFull } = useDamageCalcs(speciesKeys, !isSharedView);
  const {
    plans,
    addPlan,
    removePlan,
    addGamePlan,
    removeGamePlan,
    updateGamePlanNotes,
    updateGamePlanBring,
    setPlansFull,
  } = useMatchupPlans(speciesKeys, !isSharedView);

  // Individual matchup slides only shown in creator mode (not shared view)
  const showMatchupSlides = creatorMode && !isSharedView;

  // Total slides: Overview + 6 Pokemon + (N matchup plans if creator) + 1 matchup sheet
  const totalSlides = analysis
    ? analysis.pokemon.length + 1 + (showMatchupSlides ? plans.length : 0) + 1
    : 0;

  const {
    currentSlide,
    goToSlide,
    nextSlide,
    prevSlide,
    isFirst,
    isLast,
  } = useSlideNavigation({
    totalSlides,
    enabled: !!analysis,
    resetKey: paste,
    bypassFocusGuard: presentationMode,
  });

  // Hydration for shared view
  const hasHydrated = useRef(false);

  // Effect 1: Load paste from shared state
  useEffect(() => {
    if (!sharedState) return;
    setPaste(sharedState.paste);
    parseTeam(sharedState.paste);
  }, [sharedState, setPaste, parseTeam]);

  // Effect 2: Hydrate notes, calcs, and plans once analysis is ready
  useEffect(() => {
    if (!sharedState || !analysis || hasHydrated.current) return;
    hasHydrated.current = true;
    setNotesFull(sharedState.notes);
    if (sharedState.calcs) setCalcsFull(sharedState.calcs);
    setPlansFull(
      sharedState.matchupPlans.map((p) => ({
        id: crypto.randomUUID(),
        ...p,
        gamePlans: p.gamePlans?.map((gp) => ({
          ...gp,
          id: crypto.randomUUID(),
        })),
      }))
    );
  }, [sharedState, analysis, setNotesFull, setCalcsFull, setPlansFull]);

  // Build slide labels for nav dots
  const slideLabels = useMemo(() => {
    if (!analysis) return [];
    const labels = [
      "Overview",
      ...analysis.pokemon.map((mon) => mon.parsed.species),
      ...(showMatchupSlides ? plans.map((p) => `vs. ${p.opponentLabel}`) : []),
      "Matchups",
    ];
    return labels;
  }, [analysis, plans, showMatchupSlides]);

  const handleAnalyze = (directPaste?: string) => {
    parseTeam(directPaste ?? paste);
  };

  const handleShare = useCallback(() => {
    if (!analysis) return;
    copyShareUrl({
      paste,
      notes,
      calcs,
      matchupPlans: plans.map((p) => ({
        opponentPaste: p.opponentPaste,
        opponentLabel: p.opponentLabel,
        gamePlans: p.gamePlans.map((gp) => ({
          bring: gp.bring,
          notes: gp.notes,
        })),
      })),
    });
  }, [analysis, paste, notes, calcs, plans, copyShareUrl]);

  const shareButtonText =
    shareStatus === "copying"
      ? "Copying..."
      : shareStatus === "copied"
        ? "Copied!"
        : shareStatus === "error"
          ? "Failed"
          : "Share";

  // Show paste input if no analysis and not loading shared view
  if (!analysis && !sharedState) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 sm:p-6">
        <PasteInput
          paste={paste}
          onPasteChange={setPaste}
          onAnalyze={handleAnalyze}
        />
      </main>
    );
  }

  // Loading state for shared view
  if (!analysis && sharedState) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-sm">Loading shared team...</p>
        </div>
      </main>
    );
  }

  // Show report
  return (
    <main className="min-h-screen bg-background">
      {/* Header bar */}
      <header
        className={`sticky top-0 z-10 backdrop-blur-xl border-b transition-all duration-300 ${
          isPresentationStyle
            ? "bg-transparent border-transparent"
            : "bg-surface/90 border-border shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
        }`}
      >
        {isPresentationStyle ? (
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">
                {slideLabels[currentSlide]}
              </span>
              <span className="text-text-tertiary">
                &middot; {currentSlide + 1} / {totalSlides}
              </span>
            </div>
            {isSharedView ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.location.href =
                    window.location.origin + window.location.pathname;
                }}
                className="text-text-tertiary hover:text-text-primary"
              >
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">Build Your Own</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPresentationMode(false)}
                className="text-text-tertiary hover:text-text-primary"
              >
                Exit
              </Button>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 creator:px-8 creator:py-4 flex items-center justify-between gap-2">
            {/* Left: Back button */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={reset}>
                <span className="hidden sm:inline">&larr; New Team</span>
                <span className="sm:hidden">&larr; New</span>
              </Button>
              {warnings.length > 0 && (
                <span className="text-xs text-warning hidden sm:inline">
                  {warnings.length} warning{warnings.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Center: Slide indicator (hidden on small screens, shown in nav bar instead) */}
            <div className="hidden md:flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">
                {slideLabels[currentSlide]}
              </span>
              <span className="text-text-tertiary">
                &middot; {currentSlide + 1} / {totalSlides}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-4 creator:gap-6 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                disabled={shareStatus === "copying"}
              >
                {shareButtonText}
              </Button>

              <div className="hidden sm:block">
                <Toggle
                  checked={creatorMode}
                  onChange={setCreatorMode}
                  label="Creator"
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPresentationMode(true)}
              >
                <span className="hidden sm:inline">Present</span>
                <span className="sm:hidden">▶</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Report content */}
      <div
        className={`max-w-7xl mx-auto pb-36 slide-content ${
          isPresentationStyle
            ? "px-4 sm:px-8 py-4 sm:py-6"
            : "px-3 sm:px-4 py-4 sm:py-6 creator:px-8 creator:py-8"
        }`}
        key={currentSlide}
      >
        <TeamReport
          analysis={analysis!}
          creatorMode={creatorMode}
          currentSlide={currentSlide}
          notes={notes}
          onNoteChange={setNote}
          calcs={calcs}
          onAddCalc={addCalc}
          onRemoveCalc={removeCalc}
          speciesKeys={speciesKeys}
          isReadOnly={isReadOnly}
          isPresentationMode={isPresentationStyle}
          plans={plans}
          onGamePlanNotesChange={updateGamePlanNotes}
          onGamePlanBringChange={updateGamePlanBring}
          onAddGamePlan={addGamePlan}
          onRemoveGamePlan={removeGamePlan}
          onRemovePlan={removePlan}
          onAddPlan={addPlan}
        />
      </div>

      {/* Slide navigation */}
      <SlideNavControls
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        isFirst={isFirst}
        isLast={isLast}
        onPrev={prevSlide}
        onNext={nextSlide}
        onGoTo={goToSlide}
        slideLabels={slideLabels}
        autoHide={isPresentationStyle}
      />
    </main>
  );
}
