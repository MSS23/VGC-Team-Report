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
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useTheme } from "@/hooks/useTheme";
import { SAMPLE_PASTE } from "@/components/input/PasteInput";
import { useTranslation } from "@/lib/i18n";
import type { SpriteConfig } from "@/lib/types/sprites";
import { teamToShowdown } from "@/lib/utils/export-paste";
import { exportAsImage, exportAsPdf } from "@/lib/utils/export-report";

export function useHomePage() {
  const { t } = useTranslation();
  const [isSampleTeam, setIsSampleTeam] = useState(false);

  const {
    paste,
    setPaste,
    analysis,
    parseTeam,
    reorderPokemon,
    reset,
    warnings,
  } = useTeamReport(!isSampleTeam);

  const { creatorMode, setCreatorMode } = useCreatorMode();
  const { presentationMode, setPresentationMode } = usePresentationMode();
  const { darkMode, setDarkMode } = useDarkMode(false);
  const { genTheme, setGenTheme } = useTheme();
  const { isSharedView, isSharePending, sharedState, copyShareUrl, freshShare, autoSave, shareStatus, urlWarning, decodeFailed, exitSharedView, isEditingUnlocked, lastShareResult, getEditUrl, hasExistingShare, clearStoredShare } = useShareUrl();
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
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

  // Undo / redo system
  const undoRedo = useUndoRedo();
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoRedoInitialized = useRef(false);

  // Push debounced snapshots when tracked state changes
  useEffect(() => {
    if (!analysis || undoRedo.isRestoring()) return;
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = setTimeout(() => {
      undoRedo.pushSnapshot({
        notes,
        calcs,
        roles,
        summary,
        plans: plans.map((p) => ({ ...p, gamePlans: p.gamePlans.map((gp) => ({ ...gp })) })),
      });
      undoRedoInitialized.current = true;
    }, 500);
    return () => {
      if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, calcs, roles, summary, plans, analysis]);

  const handleUndo = useCallback(() => {
    const snapshot = undoRedo.undo();
    if (!snapshot) return;
    setNotesFull(snapshot.notes);
    setCalcsFull(snapshot.calcs);
    setMetaFull({ roles: snapshot.roles, summary: snapshot.summary });
    setPlansFull(snapshot.plans);
    undoRedo.doneRestoring();
  }, [undoRedo, setNotesFull, setCalcsFull, setMetaFull, setPlansFull]);

  const handleRedo = useCallback(() => {
    const snapshot = undoRedo.redo();
    if (!snapshot) return;
    setNotesFull(snapshot.notes);
    setCalcsFull(snapshot.calcs);
    setMetaFull({ roles: snapshot.roles, summary: snapshot.summary });
    setPlansFull(snapshot.plans);
    undoRedo.doneRestoring();
  }, [undoRedo, setNotesFull, setCalcsFull, setMetaFull, setPlansFull]);

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
  }, [analysis, speciesKeys, plans, t]);

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
    onUndo: handleUndo,
    onRedo: handleRedo,
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
    totalPhysicalSlides: allSlideKeys.length,
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
    copyShareUrl(buildShareState(), isPublic);
    setShowEditUrl(true);
  }, [analysis, copyShareUrl, buildShareState, isPublic]);

  const handleReshare = useCallback(() => {
    if (!analysis) return;
    copyShareUrl(buildShareState(), isPublic);
  }, [analysis, copyShareUrl, buildShareState, isPublic]);

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
    freshShare(buildShareState(), isPublic);
    setShowEditUrl(true);
  }, [analysis, freshShare, buildShareState, isPublic]);

  // Auto-save: debounce pushes to server only when editing an unlocked shared view
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!analysis || !isEditingUnlocked) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      autoSave(buildShareState(), isPublic);
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [analysis, isEditingUnlocked, buildShareState, autoSave, isPublic]);

  // Export team as Showdown paste to clipboard
  const handleExportTeam = useCallback(() => {
    if (!analysis) return;
    const pasteText = teamToShowdown(analysis.pokemon.map((p) => p.parsed));
    navigator.clipboard.writeText(pasteText);
  }, [analysis]);

  // Ref for the slide content element (used for image/PDF export)
  const slideContentRef = useRef<HTMLDivElement>(null);

  const handleExportImage = useCallback(async () => {
    if (!slideContentRef.current || !analysis) return;
    const name = tournamentName
      ? `${tournamentName}-slide-${physicalSlide + 1}`
      : `vgc-report-slide-${physicalSlide + 1}`;
    await exportAsImage(slideContentRef.current, name);
  }, [analysis, tournamentName, physicalSlide]);

  const handleExportPdf = useCallback(async () => {
    if (!slideContentRef.current || !analysis) return;
    const name = tournamentName
      ? `${tournamentName}-slide-${physicalSlide + 1}`
      : `vgc-report-slide-${physicalSlide + 1}`;
    await exportAsPdf(slideContentRef.current, name);
  }, [analysis, tournamentName, physicalSlide]);

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

  const handleReset = useCallback(() => {
    reset();
    clearStoredShare();
    setIsSampleTeam(false);
  }, [reset, clearStoredShare]);

  const handleDecodeFailed = useCallback(() => {
    reset();
    clearStoredShare();
    window.location.href = window.location.origin;
  }, [reset, clearStoredShare]);

  return {
    // Translation
    t,

    // Team report
    paste,
    setPaste,
    analysis,
    warnings,
    reorderPokemon,

    // Modes
    creatorMode,
    setCreatorMode,
    presentationMode,
    setPresentationMode,
    darkMode,
    setDarkMode,
    genTheme,
    setGenTheme,
    isReadOnly,
    isPresentationStyle,

    // Share
    isSharedView,
    isSharePending,
    sharedState,
    shareStatus,
    urlWarning,
    decodeFailed,
    exitSharedView,
    isEditingUnlocked,
    lastShareResult,
    hasExistingShare,
    showEditUrl,
    setShowEditUrl,
    editLinkCopied,
    shareButtonText,
    handleShareClick,
    handleReshare,
    handleCopyEditLink,
    handleFreshReshare,
    isPublic,
    setIsPublic,

    // Save flash
    saveFlash,

    // Shortcuts
    showShortcutHint,
    setShowShortcutHint,

    // Sample team
    isSampleTeam,

    // Species keys
    speciesKeys,

    // Notes, calcs, meta
    notes,
    setNote,
    calcs,
    addCalc,
    removeCalc,
    editCalc,
    roles,
    setRole,
    summary,
    setSummary,
    tournamentName,
    setTournamentName,
    placement,
    setPlacement,
    record,
    setRecord,
    mvpIndex,
    setMvpIndex,
    rentalCode,
    setRentalCode,
    creatorName,
    setCreatorName,

    // Plans
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
    reorderPlans,

    // Sprite config
    getSpriteConfig,

    // Slides
    currentSlide,
    goToSlide,
    nextSlide,
    prevSlide,
    isFirst,
    isLast,
    totalSlides,
    physicalSlide,
    slideLabels,
    slideHiddenStates,
    isSlideHiddenAt,
    handleToggleCurrentSlide,

    // Walkthrough
    walkthroughActive,
    walkthroughStep,
    walkthroughStepIndex,
    walkthroughTotalSteps,
    walkthroughNext,
    walkthroughSkip,
    startWalkthrough,
    walkthroughGuidePokemon,

    // Undo / redo
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
    handleUndo,
    handleRedo,

    // Actions
    handleAnalyze,
    handleExportTeam,
    handleReset,
    handleDecodeFailed,

    // Export as image/PDF
    slideContentRef,
    handleExportImage,
    handleExportPdf,
  };
}
