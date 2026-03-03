"use client";

import { useMemo, useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
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
import { useTheme, GEN_THEMES } from "@/hooks/useTheme";
import { PasteInput } from "@/components/input/PasteInput";
import { TeamReport } from "@/components/report/TeamReport";
import { SlideNavControls } from "@/components/report/SlideNavControls";
import { WalkthroughOverlay } from "@/components/ui/WalkthroughOverlay";
import { ShortcutHintOverlay } from "@/components/ui/ShortcutHintOverlay";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { PasscodeModal } from "@/components/ui/PasscodeModal";
import { hashPasscode, verifyPasscode } from "@/lib/sharing/passcode";
import type { SpriteConfig } from "@/lib/types/sprites";

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
  const { genTheme, setGenTheme } = useTheme();
  const { isSharedView, sharedState, copyShareUrl, shareStatus, urlWarning, decodeFailed, exitSharedView, isEditingUnlocked, hasPasscode, passcodeHash, unlockEditing } = useShareUrl();
  const {
    isActive: walkthroughActive,
    currentStep: walkthroughStep,
    currentStepIndex: walkthroughStepIndex,
    totalSteps: walkthroughTotalSteps,
    next: walkthroughNext,
    skip: walkthroughSkip,
    start: startWalkthrough,
  } = useWalkthrough({ enabled: !!analysis && !isSharedView && !presentationMode });

  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState<"set" | "unlock" | null>(null);
  const [passcodeError, setPasscodeError] = useState<string | null>(null);
  const creatorModeBeforePresent = useRef(creatorMode);

  // Auto-lock editing when entering presentation, restore on exit
  useEffect(() => {
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

  const { notes, setNote, setNotesFull } = usePokemonNotes(speciesKeys, !isSharedView);
  const { calcs, addCalc, removeCalc, editCalc, setCalcsFull } = useDamageCalcs(speciesKeys, !isSharedView);
  const {
    roles, summary, tournamentName, placement, record, mvpIndex, rentalCode,
    setRole, setSummary, setTournamentName, setPlacement, setRecord, setMvpIndex, setRentalCode, setMetaFull,
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

  const { hiddenSlides, toggleSlide, isHidden, setHiddenFull } = useHiddenSlides(speciesKeys, !isSharedView);

  // Flash "Saved" indicator when user data changes (skip initial load)
  useEffect(() => {
    if (!analysis || isSharedView) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSaveFlash(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveFlash(false), 1500);
  }, [notes, calcs, roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, plans, hiddenSlides, analysis, isSharedView]);

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
      "Overview",
      ...analysis.pokemon.map((mon) => mon.parsed.species),
      "Team Analysis",
      ...plans.map((p) => `vs. ${p.opponentLabel}`),
      "Matchups",
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
    onToggleDarkMode: presentationMode ? () => setDarkMode(!darkMode) : undefined,
    onToggleFullscreen: presentationMode ? toggleFullscreen : undefined,
    onShowHelp: presentationMode ? () => setShowShortcutHint(true) : undefined,
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
    parseTeam(directPaste ?? paste);
  };

  const buildShareState = useCallback((extraPasscodeHash?: string) => ({
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
    passcodeHash: extraPasscodeHash || undefined,
  }), [paste, notes, calcs, roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, plans, hiddenSlides]);

  const handleShareClick = useCallback(() => {
    if (!analysis) return;
    setShowPasscodeModal("set");
    setPasscodeError(null);
  }, [analysis]);

  const handleShareWithPasscode = useCallback(async (passcode: string) => {
    const hash = await hashPasscode(passcode);
    copyShareUrl(buildShareState(hash));
    setShowPasscodeModal(null);
  }, [copyShareUrl, buildShareState]);

  const handleShareNoPasscode = useCallback(() => {
    copyShareUrl(buildShareState());
    setShowPasscodeModal(null);
  }, [copyShareUrl, buildShareState]);

  const handleReshare = useCallback(() => {
    if (!analysis) return;
    copyShareUrl(buildShareState(passcodeHash ?? undefined));
  }, [analysis, copyShareUrl, buildShareState, passcodeHash]);

  const handleUnlockAttempt = useCallback(async (attempt: string) => {
    if (!passcodeHash) return;
    const valid = await verifyPasscode(attempt, passcodeHash);
    if (valid) {
      unlockEditing();
      setCreatorMode(true);
      setShowPasscodeModal(null);
      setPasscodeError(null);
    } else {
      setPasscodeError("Incorrect passcode. Try again.");
    }
  }, [passcodeHash, unlockEditing, setCreatorMode]);

  // Share completeness check: require team summary and notes for every Pokemon
  const missingForShare = useMemo(() => {
    if (!analysis) return [];
    const missing: string[] = [];
    if (!summary.trim()) missing.push("Add a team summary");
    const emptyNotes = speciesKeys.filter((k) => !notes[k]?.trim());
    if (emptyNotes.length > 0) missing.push(`Add notes for ${emptyNotes.length} Pokemon`);
    return missing;
  }, [analysis, summary, notes, speciesKeys]);

  const canShare = missingForShare.length === 0;

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

  // Loading / error state for shared view
  if (!analysis && (sharedState || decodeFailed)) {
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
            <p className="text-text-primary font-semibold">Failed to load shared team</p>
            <p className="text-text-secondary text-sm max-w-xs">The link may be corrupted or expired. Ask the creator for a new link.</p>
            <button
              onClick={() => { window.location.href = window.location.origin + window.location.pathname; }}
              className="mt-2 px-5 py-2 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              Build Your Own
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-text-secondary text-sm">Loading shared team...</p>
          </div>
        )}
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
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2">
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
              <span className="font-medium text-text-primary truncate hidden sm:inline">
                {slideLabels[currentSlide]}
              </span>
              <span className="text-text-tertiary tabular-nums flex-shrink-0">
                {currentSlide + 1}/{totalSlides}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Toggle
                checked={darkMode}
                onChange={setDarkMode}
                label={darkMode ? "Dark" : "Light"}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPresentationMode(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                Exit
              </Button>
            </div>
          </div>
        ) : isSharedView && isEditingUnlocked ? (
          /* Shared view: editing unlocked header */
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
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                Editing Unlocked
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Toggle
                checked={darkMode}
                onChange={setDarkMode}
                label={darkMode ? "Dark" : "Light"}
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReshare}
                disabled={shareStatus === "copying"}
              >
                {shareStatus === "copying" ? "Copying..." : shareStatus === "copied" ? "Copied!" : shareStatus === "error" ? "Failed" : "Re-share"}
              </Button>
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
        ) : isSharedView ? (
          /* Shared view: read-only header */
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
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <Toggle
                checked={darkMode}
                onChange={setDarkMode}
                label={darkMode ? "Dark" : "Light"}
              />
              {hasPasscode && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setShowPasscodeModal("unlock");
                    setPasscodeError(null);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <span className="hidden sm:inline">Unlock Editing</span>
                  <span className="sm:hidden">Unlock</span>
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  exitSharedView();
                  setCreatorMode(true);
                }}
                title="Fork this team into an editable copy"
              >
                <span className="sm:hidden">Fork</span>
                <span className="hidden sm:inline">Fork & Edit</span>
              </Button>
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
              <span className={`text-xs text-emerald-500 hidden sm:inline transition-opacity duration-300 ${saveFlash ? "opacity-100" : "opacity-0"}`}>
                Saved
              </span>
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
            <div className="flex items-center gap-1.5 sm:gap-2 creator:gap-4 flex-shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleShareClick}
                disabled={!canShare || shareStatus === "copying"}
                data-walkthrough="share-button"
                title={!canShare ? missingForShare.join(" · ") : undefined}
              >
                {shareButtonText}
              </Button>
              {/* Help button */}
              <button
                onClick={startWalkthrough}
                title="Help & walkthrough"
                aria-label="Help and walkthrough"
                className="flex w-7 h-7 items-center justify-center rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors text-sm font-bold border border-border-subtle hover:border-border"
              >
                ?
              </button>

              {/* Generation theme selector */}
              <div className="hidden lg:flex items-center bg-surface-alt/50 rounded-xl p-1 gap-0.5" title="Generation theme">
                {GEN_THEMES.map((t) => {
                  const isActive = genTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setGenTheme(t.id)}
                      className={`group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer ${
                        isActive ? "bg-surface scale-105" : "hover:bg-surface-alt"
                      }`}
                      style={isActive ? {
                        boxShadow: `0 0 0 1.5px ${t.badge}50, 0 2px 8px ${t.badge}25`,
                      } : undefined}
                      title={`${t.label} (${t.abbr})`}
                      aria-label={`Set theme to ${t.label}`}
                    >
                      <img
                        src={`https://play.pokemonshowdown.com/sprites/home/${t.legendary}.png`}
                        alt={t.label}
                        width={32}
                        height={32}
                        loading="lazy"
                        className={`object-contain transition-all duration-200 ${
                          isActive
                            ? "scale-110"
                            : "brightness-[0.5] grayscale opacity-60 group-hover:brightness-100 group-hover:grayscale-0 group-hover:opacity-90 group-hover:scale-105"
                        }`}
                        style={{
                          maxWidth: 32,
                          maxHeight: 32,
                          ...(isActive ? { filter: `drop-shadow(0 0 6px ${t.badge}80)` } : {}),
                        }}
                      />
                      {isActive && (
                        <span
                          className="absolute -bottom-px left-1/2 -translate-x-1/2 h-[2px] w-5 rounded-full"
                          style={{ backgroundColor: t.badge }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Lock/unlock editing button */}
              <div data-walkthrough="creator-toggle">
                <button
                  type="button"
                  onClick={() => setCreatorMode(!creatorMode)}
                  title={creatorMode ? "Lock editing (read-only)" : "Unlock editing"}
                  aria-label={creatorMode ? "Lock editing" : "Unlock editing"}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                    creatorMode
                      ? "bg-accent/15 text-accent border-accent/30 hover:bg-accent/25"
                      : "bg-surface-alt text-text-secondary border-border hover:text-text-primary hover:border-border"
                  }`}
                >
                  {creatorMode ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 019.9-1" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0110 0v4" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{creatorMode ? "Editing" : "Locked"}</span>
                </button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPresentationMode(true)}
                data-walkthrough="present-button"
                aria-label="Start presentation"
              >
                <span className="hidden sm:inline">Present</span>
                <span className="sm:hidden">&#9654;</span>
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
        className={`max-w-7xl mx-auto pb-20 slide-content ${
          isPresentationStyle
            ? "px-4 sm:px-8 py-4 sm:py-6"
            : "px-3 sm:px-4 py-4 sm:py-6 creator:px-8 creator:py-8"
        }`}
        key={physicalSlide}
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
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">This slide is hidden</p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                Viewers won&apos;t see it when you share or present. Click <strong>Hidden</strong> below to show it again.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleCurrentSlide}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors border border-amber-500/20"
            >
              Show slide
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

      {/* Keyboard shortcut hint overlay (presentation mode) */}
      <ShortcutHintOverlay
        visible={showShortcutHint}
        onDismiss={() => setShowShortcutHint(false)}
      />

      {/* Passcode modal */}
      {showPasscodeModal && (
        <PasscodeModal
          mode={showPasscodeModal}
          error={passcodeError}
          onShareWithPasscode={handleShareWithPasscode}
          onShareWithout={handleShareNoPasscode}
          onUnlock={handleUnlockAttempt}
          onCancel={() => {
            setShowPasscodeModal(null);
            setPasscodeError(null);
          }}
        />
      )}
    </main>
  );
}
