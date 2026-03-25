"use client";

import { useMemo, useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { useTeamReport } from "@/hooks/useTeamReport";
import { useCreatorMode } from "@/hooks/useCreatorMode";
import { usePresentationMode } from "@/hooks/usePresentationMode";
import { useDarkMode } from "@/hooks/useDarkMode";
import { usePokemonNotes } from "@/hooks/usePokemonNotes";
import { useDamageCalcs } from "@/hooks/useDamageCalcs";
import { useMatchupPlans } from "@/hooks/useMatchupPlans";
import { useHiddenSlides } from "@/hooks/useHiddenSlides";
import { useTeamMeta } from "@/hooks/useTeamMeta";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useTheme } from "@/hooks/useTheme";
import { useShareFlow } from "@/hooks/useShareFlow";
import { useSlideSystem } from "@/hooks/useSlideSystem";
import { useExportActions } from "@/hooks/useExportActions";
import { SAMPLE_PASTE } from "@/components/input/PasteInput";
import { useTranslation } from "@/lib/i18n";
import type { SpriteConfig } from "@/lib/types/sprites";

export function useHomePage() {
  const { t } = useTranslation();
  const [isSampleTeam, setIsSampleTeam] = useState(false);

  // ── Core team data ───────────────────────────────────────────────
  const {
    paste, setPaste, analysis, parseTeam, reorderPokemon, reset, warnings,
  } = useTeamReport(!isSampleTeam);

  // ── Mode toggles ─────────────────────────────────────────────────
  const { creatorMode, setCreatorMode } = useCreatorMode();
  const { presentationMode, setPresentationMode } = usePresentationMode();
  const { darkMode, setDarkMode } = useDarkMode(false);
  const { genTheme, setGenTheme } = useTheme();
  const [showShortcutHint, setShowShortcutHint] = useState(false);
  const creatorModeBeforePresent = useRef(creatorMode);

  // Auto-lock editing in presentation mode
  useLayoutEffect(() => {
    if (presentationMode) {
      creatorModeBeforePresent.current = creatorMode;
      if (creatorMode) setCreatorMode(false);
    } else {
      if (creatorModeBeforePresent.current) setCreatorMode(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presentationMode]);

  // ── Species keys ─────────────────────────────────────────────────
  const speciesKeys = useMemo(() => {
    if (!analysis) return [];
    const counts: Record<string, number> = {};
    return analysis.pokemon.map((mon) => {
      const species = mon.parsed.species;
      counts[species] = (counts[species] ?? 0) + 1;
      return counts[species] > 1 ? `${species}-${counts[species]}` : species;
    });
  }, [analysis]);

  // ── Team content hooks ───────────────────────────────────────────
  const shouldPersist = !false && !isSampleTeam; // updated after share flow
  const { notes, setNote, setNotesFull } = usePokemonNotes(speciesKeys, shouldPersist);
  const { calcs, addCalc, removeCalc, editCalc, setCalcsFull } = useDamageCalcs(speciesKeys, shouldPersist);
  const {
    roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName,
    setRole, setSummary, setTournamentName, setPlacement, setRecord, setMvpIndex, setRentalCode, setCreatorName, setMetaFull,
  } = useTeamMeta(speciesKeys, shouldPersist);
  const {
    plans, addPlan, removePlan, addGamePlan, removeGamePlan,
    updateGamePlanNotes, updateGamePlanReplays, updateGamePlanBring,
    reorderGamePlanBring, updateGamePlanResult, togglePlanSlide, reorderPlans, setPlansFull,
  } = useMatchupPlans(speciesKeys, shouldPersist);
  const { hiddenSlides, toggleSlide, isHidden, setHiddenFull } = useHiddenSlides(speciesKeys, shouldPersist);

  // ── Sprite config ────────────────────────────────────────────────
  const getSpriteConfig = useCallback(
    (key: string): SpriteConfig => {
      if (!analysis) return { shiny: false, animated: true };
      const idx = speciesKeys.indexOf(key);
      const shiny = idx >= 0 ? analysis.pokemon[idx]?.parsed.shiny ?? false : false;
      return { shiny, animated: true };
    },
    [analysis, speciesKeys],
  );

  // ── Undo / redo ──────────────────────────────────────────────────
  const undoRedo = useUndoRedo();
  const snapshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!analysis || undoRedo.isRestoring()) return;
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = setTimeout(() => {
      undoRedo.pushSnapshot({
        notes, calcs, roles, summary,
        plans: plans.map((p) => ({ ...p, gamePlans: p.gamePlans.map((gp) => ({ ...gp })) })),
      });
    }, 500);
    return () => { if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current); };
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

  // ── Save flash indicator ─────────────────────────────────────────
  const [saveFlash, setSaveFlash] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  // ── Build share state ────────────────────────────────────────────
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

  // ── Share flow (extracted) ───────────────────────────────────────
  const share = useShareFlow({ analysis, isSampleTeam, buildShareState, t: t as unknown as Record<string, string> });

  // ── Slide system (extracted) ─────────────────────────────────────
  const slides = useSlideSystem({
    analysis, speciesKeys, plans, hiddenSlides, isHidden,
    toggleSlide, togglePlanSlide, creatorMode, presentationMode, paste,
    darkMode, setDarkMode, setPresentationMode,
    setShowShortcutHint: setShowShortcutHint as (fn: (v: boolean) => boolean) => void,
    handleUndo, handleRedo,
    t: t as unknown as Record<string, string>,
  });

  // ── Export actions (extracted) ───────────────────────────────────
  const exports = useExportActions({
    analysis,
    tournamentName,
    physicalSlide: slides.physicalSlide,
  });

  const isReadOnly = (share.isSharedView && !share.isEditingUnlocked) || presentationMode || !creatorMode;
  const isPresentationStyle = presentationMode;

  // Flash "Saved" when user data changes
  useEffect(() => {
    if (!analysis || share.isSharedView) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSaveFlash(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveFlash(false), 1500);
  }, [notes, calcs, roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides, analysis, share.isSharedView]);

  // ── Walkthrough ──────────────────────────────────────────────────
  const pokemonNames = useMemo(
    () => analysis?.pokemon.map((p) => p.parsed.species) ?? [],
    [analysis],
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
    goToSlide: slides.goToSlide,
    pokemonCount: analysis?.pokemon.length ?? 0,
    totalPhysicalSlides: slides.allSlideKeys.length,
    isSharedView: share.isSharedView,
    physicalToVirtual: useCallback((physical: number) => {
      const idx = slides.visibleIndices.indexOf(physical);
      return idx === -1 ? null : idx;
    }, [slides.visibleIndices]),
  });

  // ── Shared view hydration ────────────────────────────────────────
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (!share.sharedState) return;
    setCreatorMode(false);
    setPaste(share.sharedState.paste);
    parseTeam(share.sharedState.paste);
  }, [share.sharedState, setPaste, parseTeam, setCreatorMode]);

  useEffect(() => {
    if (!share.sharedState || !analysis || hasHydrated.current) return;
    hasHydrated.current = true;
    setNotesFull(share.sharedState.notes);
    if (share.sharedState.calcs) setCalcsFull(share.sharedState.calcs);
    setMetaFull({
      roles: share.sharedState.roles ?? {},
      summary: share.sharedState.teamSummary ?? "",
      tournamentName: share.sharedState.tournamentName,
      placement: share.sharedState.placement,
      record: share.sharedState.record,
      mvpIndex: share.sharedState.mvpIndex ?? null,
      rentalCode: share.sharedState.rentalCode,
      creatorName: share.sharedState.creatorName,
    });
    setPlansFull(
      share.sharedState.matchupPlans.map((p) => ({
        id: crypto.randomUUID(),
        ...p,
        gamePlans: p.gamePlans?.map((gp) => ({
          ...gp,
          id: crypto.randomUUID(),
          replays: gp.replays ?? [],
        })),
      })),
    );
    if (share.sharedState.hiddenSlides) setHiddenFull(share.sharedState.hiddenSlides);
    if (share.sharedState.allowComments) share.setAllowComments(true);
  }, [share.sharedState, analysis, speciesKeys, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setHiddenFull]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleAnalyze = (directPaste?: string) => {
    const teamPaste = directPaste ?? paste;
    setIsSampleTeam(teamPaste.trim() === SAMPLE_PASTE.trim());
    parseTeam(teamPaste);
  };

  const handleReset = useCallback(() => {
    reset();
    share.clearStoredShare();
    setIsSampleTeam(false);
  }, [reset, share.clearStoredShare]);

  const handleDecodeFailed = useCallback(() => {
    reset();
    share.clearStoredShare();
    window.location.href = window.location.origin;
  }, [reset, share.clearStoredShare]);

  // ── Return (same API as before) ──────────────────────────────────
  return {
    t,
    paste, setPaste, analysis, warnings, reorderPokemon,
    creatorMode, setCreatorMode, presentationMode, setPresentationMode,
    darkMode, setDarkMode, genTheme, setGenTheme,
    isReadOnly, isPresentationStyle,

    // Share flow
    isSharedView: share.isSharedView,
    isSharePending: share.isSharePending,
    sharedState: share.sharedState,
    activeShareId: share.activeShareId,
    editKeyFromUrl: share.editKeyFromUrl,
    shareStatus: share.shareStatus,
    urlWarning: share.urlWarning,
    decodeFailed: share.decodeFailed,
    exitSharedView: share.exitSharedView,
    isEditingUnlocked: share.isEditingUnlocked,
    lastShareResult: share.lastShareResult,
    hasExistingShare: share.hasExistingShare,
    showEditUrl: share.showEditUrl,
    setShowEditUrl: share.setShowEditUrl,
    editLinkCopied: share.editLinkCopied,
    shareButtonText: share.shareButtonText,
    handleShareClick: share.handleShareClick,
    handleReshare: share.handleReshare,
    handleCopyEditLink: share.handleCopyEditLink,
    handleFreshReshare: share.handleFreshReshare,
    isPublic: share.isPublic,
    setIsPublic: share.setIsPublic,
    handleSetPublic: share.handleSetPublic,
    allowComments: share.allowComments,
    setAllowComments: share.setAllowComments,

    saveFlash,
    showShortcutHint, setShowShortcutHint,
    isSampleTeam,
    speciesKeys,

    // Team content
    notes, setNote, calcs, addCalc, removeCalc, editCalc,
    roles, setRole, summary, setSummary,
    tournamentName, setTournamentName, placement, setPlacement,
    record, setRecord, mvpIndex, setMvpIndex,
    rentalCode, setRentalCode, creatorName, setCreatorName,

    plans, addPlan, removePlan, addGamePlan, removeGamePlan,
    updateGamePlanNotes, updateGamePlanReplays, updateGamePlanBring,
    reorderGamePlanBring, updateGamePlanResult, reorderPlans,

    getSpriteConfig,

    // Slides
    currentSlide: slides.currentSlide,
    goToSlide: slides.goToSlide,
    nextSlide: slides.nextSlide,
    prevSlide: slides.prevSlide,
    isFirst: slides.isFirst,
    isLast: slides.isLast,
    totalSlides: slides.totalSlides,
    physicalSlide: slides.physicalSlide,
    slideLabels: slides.slideLabels,
    slideHiddenStates: slides.slideHiddenStates,
    isSlideHiddenAt: slides.isSlideHiddenAt,
    handleToggleCurrentSlide: slides.handleToggleCurrentSlide,

    // Walkthrough
    walkthroughActive, walkthroughStep, walkthroughStepIndex,
    walkthroughTotalSteps, walkthroughNext, walkthroughSkip,
    startWalkthrough, walkthroughGuidePokemon,

    // Undo / redo
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
    handleUndo, handleRedo,

    // Actions
    handleAnalyze,
    handleExportTeam: exports.handleExportTeam,
    handleReset,
    handleDecodeFailed,

    // Export
    slideContentRef: exports.slideContentRef,
    handleExportImage: exports.handleExportImage,
    handleExportPdf: exports.handleExportPdf,
  };
}
