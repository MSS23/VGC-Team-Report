"use client";

import { useMemo, useEffect, useRef, useCallback } from "react";
import { useTeamReport } from "@/hooks/useTeamReport";
import { useCreatorMode } from "@/hooks/useCreatorMode";
import { usePresentationMode } from "@/hooks/usePresentationMode";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useSlideNavigation } from "@/hooks/useSlideNavigation";
import { usePokemonNotes } from "@/hooks/usePokemonNotes";
import { useDamageCalcs } from "@/hooks/useDamageCalcs";
import { useMatchupPlans } from "@/hooks/useMatchupPlans";
import { useTeamMeta } from "@/hooks/useTeamMeta";
import { useShareUrl } from "@/hooks/useShareUrl";
import { useExportSlide } from "@/hooks/useExportSlide";
import { useSpriteSettings } from "@/hooks/useSpriteSettings";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { PasteInput } from "@/components/input/PasteInput";
import { TeamReport } from "@/components/report/TeamReport";
import { SlideNavControls } from "@/components/report/SlideNavControls";
import { WalkthroughOverlay } from "@/components/ui/WalkthroughOverlay";
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
  const { darkMode, setDarkMode } = useDarkMode(false);
  const { isSharedView, sharedState, copyShareUrl, shareStatus, urlWarning } = useShareUrl();
  const { slideRef, exportAsPng } = useExportSlide();
  const {
    isActive: walkthroughActive,
    currentStep: walkthroughStep,
    currentStepIndex: walkthroughStepIndex,
    totalSteps: walkthroughTotalSteps,
    next: walkthroughNext,
    skip: walkthroughSkip,
    start: startWalkthrough,
  } = useWalkthrough({ enabled: !!analysis && !isSharedView && !presentationMode });

  const isReadOnly = isSharedView || presentationMode || !creatorMode;
  const isPresentationStyle = presentationMode;

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
    roles, summary, tournamentName, placement, record, mvpIndex,
    setRole, setSummary, setTournamentName, setPlacement, setRecord, setMvpIndex, setMetaFull,
  } = useTeamMeta(speciesKeys, !isSharedView);
  const {
    plans,
    addPlan,
    removePlan,
    addGamePlan,
    removeGamePlan,
    updateGamePlanNotes,
    updateGamePlanReplays,
    updateGamePlanBring,
    reorderGamePlanBring,
    updateGamePlanResult,
    togglePlanSlide,
    reorderPlans,
    setPlansFull,
  } = useMatchupPlans(speciesKeys, !isSharedView);

  // Sprite shiny/animated defaults from parsed data
  const spriteDefaults = useMemo(() => {
    if (!analysis) return {};
    const d: Record<string, { shiny: boolean }> = {};
    analysis.pokemon.forEach((mon, i) => {
      d[speciesKeys[i]] = { shiny: mon.parsed.shiny };
    });
    return d;
  }, [analysis, speciesKeys]);
  const {
    getConfig: getSpriteConfig,
    toggleShiny,
    toggleAnimated,
    setSettingsFull: setSpriteSettingsFull,
  } = useSpriteSettings(speciesKeys, spriteDefaults, !isSharedView);

  // Individual matchup slides only shown in creator mode (not shared view)
  const showMatchupSlides = creatorMode && !isSharedView;
  // Plans that have their own dedicated slide (showSlide defaults to true)
  const visibleSlidePlans = plans.filter((p) => p.showSlide !== false);

  // Total slides: Overview + 6 Pokemon + (N visible matchup plans if creator) + 1 matchup sheet
  const totalSlides = analysis
    ? analysis.pokemon.length + 1 + (showMatchupSlides ? visibleSlidePlans.length : 0) + 1
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

  // Effect 2: Hydrate notes, calcs, roles, summary, and plans once analysis is ready
  useEffect(() => {
    if (!sharedState || !analysis || hasHydrated.current) return;
    hasHydrated.current = true;
    setNotesFull(sharedState.notes);
    if (sharedState.calcs) setCalcsFull(sharedState.calcs);
    setMetaFull({
      roles: sharedState.roles ?? {},
      summary: sharedState.teamSummary ?? "",
      tournamentName: sharedState.tournamentName,
      placement: sharedState.placement,
      record: sharedState.record,
      mvpIndex: sharedState.mvpIndex ?? null,
    });
    setPlansFull(
      sharedState.matchupPlans.map((p) => ({
        id: crypto.randomUUID(),
        ...p,
        gamePlans: p.gamePlans?.map((gp) => ({
          ...gp,
          id: crypto.randomUUID(),
          replays: gp.replays ?? [],
        })),
      }))
    );
    if (sharedState.spriteSettings) {
      // Merge shared sprite settings with defaults (animated defaults to true)
      const merged: Record<string, { shiny: boolean; animated: boolean }> = {};
      for (const key of speciesKeys) {
        const shared = sharedState.spriteSettings[key];
        merged[key] = {
          shiny: shared?.shiny ?? false,
          animated: shared?.animated ?? true,
        };
      }
      setSpriteSettingsFull(merged);
    }
  }, [sharedState, analysis, speciesKeys, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setSpriteSettingsFull]);

  // Build slide labels for nav dots
  const slideLabels = useMemo(() => {
    if (!analysis) return [];
    const labels = [
      "Overview",
      ...analysis.pokemon.map((mon) => mon.parsed.species),
      ...(showMatchupSlides ? visibleSlidePlans.map((p) => `vs. ${p.opponentLabel}`) : []),
      "Matchups",
    ];
    return labels;
  }, [analysis, visibleSlidePlans, showMatchupSlides]);

  const handleAnalyze = (directPaste?: string) => {
    parseTeam(directPaste ?? paste);
  };

  const handleShare = useCallback(() => {
    if (!analysis) return;
    // Only include non-default sprite settings (shiny=true or animated=false)
    const spriteOverrides: Record<string, { shiny?: boolean; animated?: boolean }> = {};
    for (const key of speciesKeys) {
      const cfg = getSpriteConfig(key);
      const entry: { shiny?: boolean; animated?: boolean } = {};
      if (cfg.shiny) entry.shiny = true;
      if (!cfg.animated) entry.animated = false;
      if (Object.keys(entry).length > 0) spriteOverrides[key] = entry;
    }

    copyShareUrl({
      paste,
      notes,
      calcs,
      roles,
      teamSummary: summary,
      tournamentName: tournamentName || undefined,
      placement: placement || undefined,
      record: record || undefined,
      mvpIndex: mvpIndex ?? undefined,
      matchupPlans: plans.map((p) => ({
        opponentPaste: p.opponentPaste,
        opponentLabel: p.opponentLabel,
        showSlide: p.showSlide === false ? false : undefined,
        gamePlans: p.gamePlans.map((gp) => ({
          bring: gp.bring,
          notes: gp.notes,
          replays: gp.replays.length > 0 ? gp.replays : undefined,
          result: gp.result ?? undefined,
        })),
      })),
      spriteSettings: Object.keys(spriteOverrides).length > 0 ? spriteOverrides : undefined,
    });
  }, [analysis, paste, notes, calcs, roles, summary, tournamentName, placement, record, mvpIndex, plans, speciesKeys, getSpriteConfig, copyShareUrl]);

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
    <main className="min-h-screen bg-background overflow-y-auto">
      {/* Header bar */}
      <header
        className={`sticky top-0 z-10 backdrop-blur-xl border-b transition-all duration-300 ${
          isPresentationStyle
            ? "bg-transparent border-transparent"
            : "bg-surface/90 border-border shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
        }`}
      >
        {isPresentationStyle ? (
          /* Presentation mode: minimal header */
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {tournamentName && (
                <>
                  <span className="font-bold text-text-primary">{tournamentName}</span>
                  {placement && (
                    <span className="text-xs font-semibold text-accent bg-accent-surface px-2 py-0.5 rounded-full">
                      {placement}
                    </span>
                  )}
                  {record && (
                    <span className="text-text-tertiary">({record})</span>
                  )}
                  <span className="text-text-tertiary">&middot;</span>
                </>
              )}
              <span className="font-medium text-text-primary">
                {slideLabels[currentSlide]}
              </span>
              <span className="text-text-tertiary tabular-nums">
                &middot; {currentSlide + 1} / {totalSlides}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Toggle
                checked={darkMode}
                onChange={setDarkMode}
                label={darkMode ? "Dark" : "Light"}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPresentationMode(false)}
                className="text-text-tertiary hover:text-text-primary"
              >
                Exit
              </Button>
            </div>
          </div>
        ) : isSharedView ? (
          /* Shared view: clean read-only header */
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-text-secondary min-w-0">
              {tournamentName && (
                <>
                  <span className="font-bold text-text-primary truncate">{tournamentName}</span>
                  {placement && (
                    <span className="text-xs font-semibold text-accent bg-accent-surface px-2 py-0.5 rounded-full flex-shrink-0">
                      {placement}
                    </span>
                  )}
                  {record && (
                    <span className="text-text-tertiary flex-shrink-0">({record})</span>
                  )}
                  <span className="text-text-tertiary hidden sm:inline">&middot;</span>
                </>
              )}
              <span className="font-medium text-text-primary hidden sm:inline">
                {slideLabels[currentSlide]}
              </span>
              <span className="text-text-tertiary tabular-nums hidden sm:inline">
                &middot; {currentSlide + 1} / {totalSlides}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Toggle
                checked={darkMode}
                onChange={setDarkMode}
                label={darkMode ? "Dark" : "Light"}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.location.href =
                    window.location.origin + window.location.pathname;
                }}
              >
                <span className="sm:hidden">New</span>
                <span className="hidden sm:inline">Build Your Own</span>
              </Button>
            </div>
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
              {tournamentName && (
                <>
                  <span className="font-bold text-text-primary">{tournamentName}</span>
                  {placement && (
                    <span className="text-xs font-semibold text-accent bg-accent-surface px-2 py-0.5 rounded-full">
                      {placement}
                    </span>
                  )}
                  <span className="text-text-tertiary">&middot;</span>
                </>
              )}
              <span className="font-medium text-text-primary">
                {slideLabels[currentSlide]}
              </span>
              <span className="text-text-tertiary">
                &middot; {currentSlide + 1} / {totalSlides}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 creator:gap-6 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShare}
                disabled={shareStatus === "copying"}
                data-walkthrough="share-button"
              >
                {shareButtonText}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportAsPng(`slide-${currentSlide + 1}.png`)}
                title="Export slide as image"
                className="text-text-secondary hover:text-text-primary hidden sm:inline-flex"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </Button>
              <button
                onClick={startWalkthrough}
                title="Help & walkthrough"
                className="w-7 h-7 items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors text-sm font-medium hidden sm:flex"
              >
                ?
              </button>

              {/* Creator toggle: full Toggle on sm+, compact button on mobile */}
              <div data-walkthrough="creator-toggle">
                <div className="hidden sm:block">
                  <Toggle
                    checked={creatorMode}
                    onChange={setCreatorMode}
                    label="Creator"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCreatorMode(!creatorMode)}
                  title={creatorMode ? "Creator Mode on" : "Creator Mode off"}
                  className={`sm:hidden p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    creatorMode
                      ? "bg-accent/15 text-accent border-accent/30"
                      : "bg-surface-alt text-text-tertiary border-border-subtle"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPresentationMode(true)}
                data-walkthrough="present-button"
              >
                <span className="hidden sm:inline">Present</span>
                <span className="sm:hidden">▶</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* URL length warning */}
      {urlWarning && (
        <div className="max-w-7xl mx-auto px-4 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{urlWarning}</span>
          </div>
        </div>
      )}

      {/* Report content */}
      <div
        ref={slideRef}
        className={`max-w-7xl mx-auto pb-48 slide-content ${
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
          roles={roles}
          onRoleChange={setRole}
          teamSummary={summary}
          onTeamSummaryChange={setSummary}
          tournamentName={tournamentName}
          onTournamentNameChange={setTournamentName}
          placement={placement}
          onPlacementChange={setPlacement}
          record={record}
          onRecordChange={setRecord}
          mvpIndex={mvpIndex}
          onMvpIndexChange={setMvpIndex}
          isReadOnly={isReadOnly}
          isPresentationMode={isPresentationStyle}
          plans={plans}
          onGamePlanNotesChange={updateGamePlanNotes}
          onGamePlanReplaysChange={updateGamePlanReplays}
          onGamePlanBringChange={updateGamePlanBring}
          onReorderGamePlanBring={reorderGamePlanBring}
          onGamePlanResultChange={updateGamePlanResult}
          onReorderPlans={reorderPlans}
          onAddGamePlan={addGamePlan}
          onRemoveGamePlan={removeGamePlan}
          onRemovePlan={removePlan}
          onAddPlan={addPlan}
          onTogglePlanSlide={togglePlanSlide}
          getSpriteConfig={getSpriteConfig}
          onToggleShiny={toggleShiny}
          onToggleAnimated={toggleAnimated}
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
        autoHide={presentationMode}
      />

      {/* Walkthrough overlay */}
      {walkthroughActive && walkthroughStep && (
        <WalkthroughOverlay
          step={walkthroughStep}
          stepIndex={walkthroughStepIndex}
          totalSteps={walkthroughTotalSteps}
          onNext={walkthroughNext}
          onSkip={walkthroughSkip}
        />
      )}
    </main>
  );
}
