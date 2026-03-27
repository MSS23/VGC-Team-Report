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
import { useCollaborativeSync } from "@/hooks/useCollaborativeSync";
import { useSlideSystem } from "@/hooks/useSlideSystem";
import { SAMPLE_PASTE } from "@/components/input/PasteInput";
import { track } from "@vercel/analytics";
import { useTranslation } from "@/lib/i18n";
import { getTemplate } from "@/lib/templates";
import type { SpriteConfig } from "@/lib/types/sprites";
import { detectArchetypes } from "@/lib/analysis/detect-archetype";

export function useHomePage() {
  const { t } = useTranslation();
  const [isSampleTeam, setIsSampleTeam] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string>("blank");

  // ── Core team data ───────────────────────────────────────────────
  const {
    paste, setPaste, analysis, parseTeam, reorderPokemon, reset, warnings,
  } = useTeamReport(!isSampleTeam);

  // ── Mode toggles ─────────────────────────────────────────────────
  const { creatorMode, setCreatorMode } = useCreatorMode();
  const { presentationMode, setPresentationMode } = usePresentationMode();
  const { darkMode, setDarkMode } = useDarkMode();
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
    roles, spreadNotes, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, tags, templateId,
    setRole, setSpreadNote, setSummary, setTournamentName, setPlacement, setRecord, setMvpIndex, setRentalCode, setCreatorName, setTags, setTemplateId, setMetaFull,
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
    setMetaFull({ roles: snapshot.roles, spreadNotes: {}, summary: snapshot.summary });
    setPlansFull(snapshot.plans);
    undoRedo.doneRestoring();
  }, [undoRedo, setNotesFull, setCalcsFull, setMetaFull, setPlansFull]);

  const handleRedo = useCallback(() => {
    const snapshot = undoRedo.redo();
    if (!snapshot) return;
    setNotesFull(snapshot.notes);
    setCalcsFull(snapshot.calcs);
    setMetaFull({ roles: snapshot.roles, spreadNotes: {}, summary: snapshot.summary });
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
    spreadNotes: Object.keys(spreadNotes).length > 0 ? spreadNotes : undefined,
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
    tags: tags && (tags.archetype?.length || tags.regulation || tags.eventType) ? tags : undefined,
    templateId: templateId || undefined,
  }), [paste, notes, calcs, roles, spreadNotes, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides, tags, templateId]);

  // ── Share flow (extracted) ───────────────────────────────────────
  const share = useShareFlow({ analysis, isSampleTeam, buildShareState, t: t as unknown as Record<string, string> });

  // ── Real-time collaborative sync (SSE) ──────────────────────────
  const handleRemoteUpdate = useCallback((state: import("@/lib/sharing/url-codec").ShareableState) => {
    setPaste(state.paste);
    parseTeam(state.paste);
    setNotesFull(state.notes ?? {});
    setCalcsFull(state.calcs ?? {});
    setMetaFull({
      roles: state.roles ?? {},
      spreadNotes: state.spreadNotes ?? {},
      summary: state.teamSummary ?? "",
      tournamentName: state.tournamentName ?? undefined,
      placement: state.placement ?? undefined,
      record: state.record ?? undefined,
      mvpIndex: state.mvpIndex ?? null,
      rentalCode: state.rentalCode ?? undefined,
      creatorName: state.creatorName ?? undefined,
      tags: state.tags ?? undefined,
      templateId: state.templateId ?? undefined,
    });
    const rawPlans = Array.isArray(state.matchupPlans) ? state.matchupPlans : [];
    setPlansFull(
      rawPlans.map((p) => ({
        id: crypto.randomUUID(),
        ...p,
        gamePlans: (p.gamePlans ?? []).map((gp) => ({
          ...gp,
          id: crypto.randomUUID(),
          bring: gp.bring ?? [null, null, null, null],
          notes: gp.notes ?? "",
          replays: gp.replays ?? [],
        })),
      })),
    );
    if (Array.isArray(state.hiddenSlides)) setHiddenFull(state.hiddenSlides);
  }, [setPaste, parseTeam, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setHiddenFull]);

  const { collaborators, syncStatus } = useCollaborativeSync({
    shareId: share.activeShareId,
    editKey: share.editKeyFromUrl,
    enabled: share.isEditingUnlocked,
    onRemoteUpdate: handleRemoteUpdate,
  });

  // ── Slide system (extracted) ─────────────────────────────────────
  const slides = useSlideSystem({
    analysis, speciesKeys, plans, hiddenSlides, isHidden,
    toggleSlide, togglePlanSlide, creatorMode, presentationMode, paste,
    darkMode, setDarkMode, setPresentationMode,
    setShowShortcutHint: setShowShortcutHint as (fn: (v: boolean) => boolean) => void,
    handleUndo, handleRedo,
    t: t as unknown as Record<string, string>,
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
  }, [notes, calcs, roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides, tags, analysis, share.isSharedView]);

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
    prev: walkthroughPrev,
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
    onCreatorModeChange: setCreatorMode,
    creatorMode,
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
    setNotesFull(share.sharedState.notes ?? {});
    setCalcsFull(share.sharedState.calcs ?? {});
    setMetaFull({
      roles: share.sharedState.roles ?? {},
      spreadNotes: share.sharedState.spreadNotes ?? {},
      summary: share.sharedState.teamSummary ?? "",
      tournamentName: share.sharedState.tournamentName ?? undefined,
      placement: share.sharedState.placement ?? undefined,
      record: share.sharedState.record ?? undefined,
      mvpIndex: share.sharedState.mvpIndex ?? null,
      rentalCode: share.sharedState.rentalCode ?? undefined,
      creatorName: share.sharedState.creatorName ?? undefined,
      tags: share.sharedState.tags ?? undefined,
      templateId: share.sharedState.templateId ?? undefined,
    });
    const rawPlans = Array.isArray(share.sharedState.matchupPlans) ? share.sharedState.matchupPlans : [];
    setPlansFull(
      rawPlans.map((p) => ({
        id: crypto.randomUUID(),
        ...p,
        gamePlans: (p.gamePlans ?? []).map((gp) => ({
          ...gp,
          id: crypto.randomUUID(),
          bring: gp.bring ?? [null, null, null, null],
          notes: gp.notes ?? "",
          replays: gp.replays ?? [],
        })),
      })),
    );
    if (Array.isArray(share.sharedState.hiddenSlides)) setHiddenFull(share.sharedState.hiddenSlides);
    if (share.sharedState.allowComments) share.setAllowComments(true);
  }, [share.sharedState, analysis, speciesKeys, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setHiddenFull]);

  // ── Apply template defaults when analysis first appears (non-shared) ──
  const templateApplied = useRef(false);
  useEffect(() => {
    if (!analysis || share.isSharedView || templateApplied.current) return;
    templateApplied.current = true;
    const tmpl = getTemplate(pendingTemplateId);
    if (!tmpl || tmpl.id === "blank") return;
    setTemplateId(tmpl.id);

    // Apply template-specific placeholder summary if summary is empty
    if (!summary && tmpl.defaults.summaryPlaceholder) {
      setSummary(tmpl.defaults.summaryPlaceholder);
    }
  }, [analysis, share.isSharedView, pendingTemplateId, setTemplateId, summary, setSummary]);

  // ── Auto-detect archetypes when analysis appears (if no tags set) ──
  const archetypeDetected = useRef(false);
  useEffect(() => {
    if (!analysis || share.isSharedView || archetypeDetected.current) return;
    if (tags?.archetype && tags.archetype.length > 0) return; // user already set tags
    archetypeDetected.current = true;
    const detected = detectArchetypes(analysis.pokemon);
    if (detected.length > 0) {
      setTags({ ...tags, archetype: detected });
    }
  }, [analysis, share.isSharedView, tags, setTags]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleAnalyze = (directPaste?: string) => {
    const teamPaste = directPaste ?? paste;
    setIsSampleTeam(teamPaste.trim() === SAMPLE_PASTE.trim());
    templateApplied.current = false; // reset so template applies on next parse
    parseTeam(teamPaste);
    // Track team creation
    const hasMega = teamPaste.includes("-Mega") || teamPaste.includes("-Primal");
    track("team_created", { hasMega: hasMega ? "yes" : "no" });
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
    autoSaveStatus: share.autoSaveStatus,

    // Collaborative sync
    collaborators,
    syncStatus,

    saveFlash,
    showShortcutHint, setShowShortcutHint,
    isSampleTeam,
    speciesKeys,

    // Team content
    notes, setNote, calcs, addCalc, removeCalc, editCalc,
    roles, setRole, spreadNotes, setSpreadNote, summary, setSummary,
    tournamentName, setTournamentName, placement, setPlacement,
    record, setRecord, mvpIndex, setMvpIndex,
    rentalCode, setRentalCode, creatorName, setCreatorName, tags, setTags, templateId, setTemplateId,

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
    walkthroughTotalSteps, walkthroughNext, walkthroughPrev, walkthroughSkip,
    startWalkthrough, walkthroughGuidePokemon,

    // Undo / redo
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,
    handleUndo, handleRedo,

    // Templates
    pendingTemplateId, setPendingTemplateId,

    // Actions
    handleAnalyze,
    handleReset,
    handleDecodeFailed,
  };
}
