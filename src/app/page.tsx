"use client";

import { Suspense, useMemo, useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { useTeamReport } from "@/hooks/useTeamReport";
import { useCreatorMode } from "@/hooks/useCreatorMode";
import { usePresentationMode } from "@/hooks/usePresentationMode";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useSlideNavigation } from "@/hooks/useSlideNavigation";
import { usePokemonNotes } from "@/hooks/usePokemonNotes";
import { useDamageCalcs } from "@/hooks/useDamageCalcs";
import { useMatchupPlans } from "@/hooks/useMatchupPlans";
import { useHiddenSlides } from "@/hooks/useHiddenSlides";
import { useTeamMeta } from "@/hooks/useTeamMeta";
import { useShareUrl } from "@/hooks/useShareUrl";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useTheme } from "@/hooks/useTheme";
import { PasteInput, SAMPLE_PASTE } from "@/components/input/PasteInput";
import { TeamReport } from "@/components/report/TeamReport";
import { SlideNavControls } from "@/components/report/SlideNavControls";
import { WalkthroughOverlay } from "@/components/ui/WalkthroughOverlay";
import { ShortcutHintOverlay } from "@/components/ui/ShortcutHintOverlay";
import { Navbar } from "@/components/layout/Navbar";
import { I18nProvider, useTranslation } from "@/lib/i18n";
import type { SpriteConfig } from "@/lib/types/sprites";

export default function Home() {
  return (
    <I18nProvider>
      <Suspense>
        <HomeContent />
      </Suspense>
    </I18nProvider>
  );
}

function HomeContent() {
  const { t } = useTranslation();
  const [isSampleTeam, setIsSampleTeam] = useState(false);

  const {
    paste,
    setPaste,
    analysis,
    parseTeam,
    reset,
    warnings,
  } = useTeamReport(!isSampleTeam);

  const { creatorMode, setCreatorMode } = useCreatorMode();
  const { presentationMode, setPresentationMode } = usePresentationMode();
  const { darkMode, setDarkMode } = useDarkMode(false);
  const { genTheme, setGenTheme } = useTheme();
  const { isSharedView, isSharePending, sharedState, copyShareUrl, freshShare, autoSave, shareStatus, urlWarning, decodeFailed, exitSharedView, isEditingUnlocked, lastShareResult, getEditUrl, hasExistingShare, clearStoredShare } = useShareUrl();
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const [showEditUrl, setShowEditUrl] = useState(false);
  const [editLinkCopied, setEditLinkCopied] = useState(false);
  const creatorModeBeforePresent = useRef(creatorMode);

  // Auto-lock editing when entering presentation, restore on exit
  // useLayoutEffect prevents a brief flash of non-creator layout on exit
  useLayoutEffect(() => {
    if (presentationMode) {
      creatorModeBeforePresent.current = creatorMode;
      if (creatorMode) setCreatorMode(false);
    } else {
      if (creatorModeBeforePresent.current) setCreatorMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationMode]);

  const isReadOnly = (isSharedView && !isEditingUnlocked) || presentationMode || !creatorMode;
  const isPresentationStyle = presentationMode;

  // Autosave indicator — flashes "Saved" after user edits
  const [saveFlash, setSaveFlash] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

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

  const shouldPersist = !isSharedView && !isSampleTeam;
  const { notes, setNote, setNotesFull } = usePokemonNotes(speciesKeys, shouldPersist);
  const { calcs, addCalc, removeCalc, editCalc, setCalcsFull } = useDamageCalcs(speciesKeys, shouldPersist);
  const {
    roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName,
    setRole, setSummary, setTournamentName, setPlacement, setRecord, setMvpIndex, setRentalCode, setCreatorName, setMetaFull,
  } = useTeamMeta(speciesKeys, shouldPersist);
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
  } = useMatchupPlans(speciesKeys, shouldPersist);

  // Sprite config from parsed data — shiny from paste, always animated
  const getSpriteConfig = useCallback(
    (key: string): SpriteConfig => {
      if (!analysis) return { shiny: false, animated: true };
      const idx = speciesKeys.indexOf(key);
      const shiny = idx >= 0 ? analysis.pokemon[idx]?.parsed.shiny ?? false : false;
      return { shiny, animated: true };
    },
    [analysis, speciesKeys]
  );

  const { hiddenSlides, toggleSlide, isHidden, setHiddenFull } = useHiddenSlides(speciesKeys, shouldPersist);

  // Flash "Saved" indicator when user data changes (skip initial load)
  useEffect(() => {
    if (!analysis || isSharedView) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSaveFlash(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveFlash(false), 1500);
  }, [notes, calcs, roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides, analysis, isSharedView]);

  // Build ALL slide keys and labels (including all plans, visibility handled at nav level)
  const { allSlideKeys, allSlideLabels } = useMemo(() => {
    if (!analysis) return { allSlideKeys: [] as string[], allSlideLabels: [] as string[] };
    const keys: string[] = [
      "overview",
      ...speciesKeys,
      "speed-tiers",
      ...plans.map((p) => `matchup-${p.id}`),
      "matchup-sheet",
    ];
    const labels: string[] = [
      t.overview,
      ...analysis.pokemon.map((mon) => mon.parsed.species),
      t.teamAnalysisLabel,
      ...plans.map((p) => `vs. ${p.opponentLabel}`),
      t.matchupsLabel,
    ];
    return { allSlideKeys: keys, allSlideLabels: labels };
  }, [analysis, speciesKeys, plans]);

  // Check if a physical slide index is hidden
  const isSlideHiddenAt = useCallback((physicalIndex: number) => {
    const key = allSlideKeys[physicalIndex];
    if (!key) return false;
    if (key.startsWith("matchup-") && key !== "matchup-sheet") {
      const planId = key.slice("matchup-".length);
      const plan = plans.find((p) => p.id === planId);
      return plan?.showSlide === false;
    }
    return isHidden(key);
  }, [allSlideKeys, plans, isHidden]);

  // Creator sees all slides; non-creator only sees visible ones
  const visibleIndices = useMemo(() => {
    const all = allSlideKeys.map((_, i) => i);
    if (creatorMode && !presentationMode) return all;
    return all.filter((i) => !isSlideHiddenAt(i));
  }, [allSlideKeys, creatorMode, presentationMode, isSlideHiddenAt]);

  const totalSlides = visibleIndices.length;

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  }, []);

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
    onEscape: presentationMode ? () => setPresentationMode(false) : undefined,
    onToggleDarkMode: () => setDarkMode(!darkMode),
    onToggleFullscreen: toggleFullscreen,
    onShowHelp: () => setShowShortcutHint((v) => !v),
    onTogglePresentation: () => setPresentationMode(!presentationMode),
  });

  const pokemonNames = useMemo(
    () => analysis?.pokemon.map((p) => p.parsed.species) ?? [],
    [analysis]
  );

  const {
    isActive: walkthroughActive,
    currentStep: walkthroughStep,
    currentStepIndex: walkthroughStepIndex,
    totalSteps: walkthroughTotalSteps,
    next: walkthroughNext,
    skip: walkthroughSkip,
    start: startWalkthrough,
    guidePokemon: walkthroughGuidePokemon,
  } = useWalkthrough({
    enabled: !!analysis && !presentationMode,
    pokemonNames,
    goToSlide,
    pokemonCount: analysis?.pokemon.length ?? 0,
    totalSlides,
    isSharedView,
    physicalToVirtual: useCallback((physical: number) => {
      const idx = visibleIndices.indexOf(physical);
      return idx === -1 ? null : idx;
    }, [visibleIndices]),
  });

  // Map virtual currentSlide → physical slide for TeamReport
  const physicalSlide = visibleIndices[currentSlide] ?? 0;

  // Preserve physical slide position when visibleIndices changes (e.g. lock/unlock toggle)
  const prevVisibleRef = useRef(visibleIndices);
  useLayoutEffect(() => {
    const prevVisible = prevVisibleRef.current;
    prevVisibleRef.current = visibleIndices;

    if (prevVisible === visibleIndices) return;

    // Find the physical slide we were on using the old mapping
    const oldPhysical = prevVisible[currentSlide] ?? 0;
    const newVirtual = visibleIndices.indexOf(oldPhysical);

    if (newVirtual >= 0 && newVirtual !== currentSlide) {
      goToSlide(newVirtual);
    } else if (newVirtual < 0) {
      // Old slide is now hidden — go to nearest visible slide
      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < visibleIndices.length; i++) {
        const dist = Math.abs(visibleIndices[i] - oldPhysical);
        if (dist < minDist) { minDist = dist; closest = i; }
      }
      goToSlide(closest);
    }
  }, [visibleIndices, currentSlide, goToSlide]);

  // Slide labels and hidden states derived from visible indices
  const slideLabels = useMemo(() => {
    return visibleIndices.map((i) => allSlideLabels[i]);
  }, [visibleIndices, allSlideLabels]);

  const slideHiddenStates = useMemo(() => {
    return visibleIndices.map((i) => isSlideHiddenAt(i));
  }, [visibleIndices, isSlideHiddenAt]);

  // Handle hide toggle for current slide
  const handleToggleCurrentSlide = useCallback(() => {
    const physIdx = visibleIndices[currentSlide];
    if (physIdx === undefined) return;
    const key = allSlideKeys[physIdx];
    if (!key) return;
    if (key.startsWith("matchup-") && key !== "matchup-sheet") {
      const planId = key.slice("matchup-".length);
      togglePlanSlide(planId);
    } else {
      toggleSlide(key);
    }
  }, [currentSlide, visibleIndices, allSlideKeys, togglePlanSlide, toggleSlide]);

  // Hydration for shared view
  const hasHydrated = useRef(false);

  // Effect 1: Load paste from shared state and disable creator mode
  useEffect(() => {
    if (!sharedState) return;
    setCreatorMode(false);
    setPaste(sharedState.paste);
    parseTeam(sharedState.paste);
  }, [sharedState, setPaste, parseTeam, setCreatorMode]);

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
      rentalCode: sharedState.rentalCode,
      creatorName: sharedState.creatorName,
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
    if (sharedState.hiddenSlides) {
      setHiddenFull(sharedState.hiddenSlides);
    }
  }, [sharedState, analysis, speciesKeys, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setHiddenFull]);


  const handleAnalyze = (directPaste?: string) => {
    const teamPaste = directPaste ?? paste;
    setIsSampleTeam(teamPaste.trim() === SAMPLE_PASTE.trim());
    parseTeam(teamPaste);
  };

  const buildShareState = useCallback(() => ({
    paste,
    notes,
    calcs,
    roles,
    teamSummary: summary,
    tournamentName: tournamentName || undefined,
    placement: placement || undefined,
    record: record || undefined,
    mvpIndex: mvpIndex ?? undefined,
    rentalCode: rentalCode || undefined,
    creatorName: creatorName || undefined,
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
    hiddenSlides: hiddenSlides.size > 0 ? [...hiddenSlides] : undefined,
  }), [paste, notes, calcs, roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides]);

  const handleShareClick = useCallback(() => {
    if (!analysis) return;
    copyShareUrl(buildShareState());
    setShowEditUrl(true);
  }, [analysis, copyShareUrl, buildShareState]);

  const handleReshare = useCallback(() => {
    if (!analysis) return;
    copyShareUrl(buildShareState());
  }, [analysis, copyShareUrl, buildShareState]);

  /** Copy the stored edit link to clipboard (same browser recovery). */
  const handleCopyEditLink = useCallback(() => {
    const url = getEditUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setEditLinkCopied(true);
    setTimeout(() => setEditLinkCopied(false), 2000);
  }, [getEditUrl]);

  /** Force a fresh share — new ID + new edit token (old edit link stops working). */
  const handleFreshReshare = useCallback(() => {
    if (!analysis) return;
    freshShare(buildShareState());
    setShowEditUrl(true);
  }, [analysis, freshShare, buildShareState]);

  // Auto-save: debounce pushes to server only when editing an unlocked shared view
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!analysis || !isEditingUnlocked) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave(buildShareState());
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [analysis, isEditingUnlocked, buildShareState, autoSave]);

  const shareButtonText =
    shareStatus === "copying"
      ? t.copying
      : shareStatus === "copied"
        ? lastShareResult?.updated
          ? t.updated
          : t.copied
        : shareStatus === "error"
          ? t.failed
          : t.share;

  // Show paste input if no analysis and not loading shared view
  if (!analysis && !sharedState && !isSharePending) {
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

  // Loading / error state for shared view
  if (!analysis && (sharedState || isSharePending || decodeFailed)) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        {decodeFailed ? (
          <div className="flex flex-col items-center gap-4 animate-fade-in text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-text-primary font-semibold">{t.failedToLoadShared}</p>
            <p className="text-text-secondary text-sm max-w-xs">{t.sharedLinkCorrupt}</p>
            <button
              onClick={() => { reset(); clearStoredShare(); window.location.href = window.location.origin; }}
              className="mt-2 px-5 py-2 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              {t.buildYourOwn}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-7xl animate-fade-in px-4">
            {/* Skeleton: Tournament info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="skeleton h-7 w-48" />
              <div className="skeleton h-6 w-20" />
              <div className="skeleton h-6 w-16" />
            </div>
            {/* Skeleton: Team summary */}
            <div className="skeleton h-32 w-full mb-8 rounded-xl" />
            {/* Skeleton: Pokemon grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border p-5 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="skeleton w-[76px] h-[76px] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-5 w-28" />
                      <div className="flex gap-1">
                        <div className="skeleton h-5 w-14 rounded-full" />
                        <div className="skeleton h-5 w-14 rounded-full" />
                      </div>
                      <div className="skeleton h-4 w-36" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="skeleton h-9 rounded-lg" />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="skeleton h-3 w-8" />
                        <div className="skeleton h-2.5 flex-1 rounded-full" />
                        <div className="skeleton h-3 w-8" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center text-text-tertiary text-sm mt-6">Loading shared team...</p>
          </div>
        )}
      </main>
    );
  }

  // Show report
  return (
    <main className={`bg-background ${isPresentationStyle ? "h-screen overflow-y-auto" : "min-h-screen"}`}>
      <Navbar
        isPresentationStyle={isPresentationStyle}
        isSharedView={isSharedView}
        isEditingUnlocked={isEditingUnlocked}
        creatorMode={creatorMode}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        slideLabels={slideLabels}
        tournamentName={tournamentName}
        placement={placement}
        record={record}
        darkMode={darkMode}
        onDarkModeChange={setDarkMode}
        genTheme={genTheme}
        onGenThemeChange={setGenTheme}
        warnings={warnings}
        saveFlash={saveFlash}
        shareStatus={shareStatus}
        shareButtonText={shareButtonText}
        lastShareResult={lastShareResult}
        onShareClick={handleShareClick}
        onReshare={handleReshare}
        hasExistingShare={hasExistingShare()}
        editLinkCopied={editLinkCopied}
        onCopyEditLink={handleCopyEditLink}
        onStartTour={startWalkthrough}
        onShowShortcuts={setShowShortcutHint}
        onSetCreatorMode={setCreatorMode}
        onSetPresentationMode={setPresentationMode}
        onReset={() => { reset(); clearStoredShare(); setIsSampleTeam(false); }}
        onExitSharedView={exitSharedView}
      />

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
        className={`max-w-7xl mx-auto pb-24 sm:pb-20 slide-content ${
          isPresentationStyle
            ? "px-3 sm:px-8 py-3 sm:py-6"
            : "px-3 sm:px-4 py-3 sm:py-6 creator:px-8 creator:py-8"
        }`}
        key={physicalSlide}
        style={{ viewTransitionName: "slide" }}
      >
        {/* Hidden slide banner for creator */}
        {creatorMode && isSlideHiddenAt(physicalSlide) && (
          <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-amber-500/8 border border-amber-500/25 rounded-2xl animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t.thisSlideIsHidden}</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5" dangerouslySetInnerHTML={{ __html: t.hiddenSlideDescription }} />
            </div>
            <button
              type="button"
              onClick={handleToggleCurrentSlide}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors border border-amber-500/20"
            >
              {t.showSlide}
            </button>
          </div>
        )}
        <TeamReport
          analysis={analysis!}
          creatorMode={creatorMode}
          currentSlide={physicalSlide}
          notes={notes}
          onNoteChange={setNote}
          calcs={calcs}
          onAddCalc={addCalc}
          onRemoveCalc={removeCalc}
          onEditCalc={editCalc}
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
          rentalCode={rentalCode}
          onRentalCodeChange={setRentalCode}
          creatorName={creatorName}
          onCreatorNameChange={setCreatorName}
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
          getSpriteConfig={getSpriteConfig}
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
        hiddenStates={creatorMode ? slideHiddenStates : undefined}
        onToggleHide={creatorMode ? handleToggleCurrentSlide : undefined}
        isCurrentHidden={creatorMode ? isSlideHiddenAt(physicalSlide) : false}
        onShowShortcuts={() => setShowShortcutHint(true)}
        onStartTour={!presentationMode ? startWalkthrough : undefined}
      />

      {/* Walkthrough overlay */}
      {walkthroughActive && walkthroughStep && (
        <WalkthroughOverlay
          step={walkthroughStep}
          stepIndex={walkthroughStepIndex}
          totalSteps={walkthroughTotalSteps}
          onNext={walkthroughNext}
          onSkip={walkthroughSkip}
          guidePokemon={walkthroughGuidePokemon}
        />
      )}

      {/* Keyboard shortcut hint overlay (presentation mode) */}
      <ShortcutHintOverlay
        visible={showShortcutHint}
        onDismiss={() => setShowShortcutHint(false)}
        isPresentationMode={isPresentationStyle}
      />

      {/* Edit URL toast — shown after sharing */}
      {showEditUrl && lastShareResult?.editUrl && (
        <div className="fixed bottom-20 sm:bottom-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in max-w-md w-full px-4">
          <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-sm font-bold text-text-primary">{t.publicLinkCopied}</h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  {t.saveEditLink}
                </p>
              </div>
              <button
                onClick={() => setShowEditUrl(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0 cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-surface-alt border border-border-subtle rounded-lg px-3 py-2 text-text-secondary truncate font-mono">
                {lastShareResult.editUrl}
              </code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(lastShareResult.editUrl!);
                }}
                className="flex-shrink-0 px-3 py-2 bg-accent text-white rounded-lg text-xs font-semibold hover:bg-accent/85 transition-colors cursor-pointer"
              >
                {t.copyEditLink}
              </button>
            </div>
            <p className="text-[10px] text-text-tertiary mt-2.5">
              {t.lostEditLink}{" "}
              <button
                onClick={handleFreshReshare}
                className="text-accent hover:underline font-medium cursor-pointer"
              >
                {t.generateNewEditLink}
              </button>
              {" "}{t.oldEditLinkStops}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
