"use client";

import { useMemo, useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { useAuth } from "@clerk/nextjs";
import { SAMPLE_PASTE } from "@/components/input/PasteInput";
import { track } from "@vercel/analytics";
import posthog from "posthog-js";
import { useTranslation } from "@/lib/i18n";
import { getTemplate } from "@/lib/templates";
import type { SpriteConfig } from "@/lib/types/sprites";
import { detectArchetypes } from "@/lib/analysis/detect-archetype";

export function useHomePage() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const [isSampleTeam, setIsSampleTeam] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string>("blank");

  // ── Share context detection ─────────────────────────────────────
  // Detect whether the current URL points at a shared report BEFORE any
  // team-content hook runs. We need this early so we can disable
  // localStorage persistence for every hook below while the user is
  // viewing someone else's report.
  //
  // SECURITY: Without this gate, viewing /s/{id} would auto-write the
  // shared team's paste, notes, calcs, and meta into the viewer's own
  // localStorage (vgc-team-paste, vgc-notes-*, vgc-calcs-*, vgc-team-meta-*).
  // The viewer could then hard-navigate home via the <a href="/"> brand
  // link, the restore effect would read the paste back, and for
  // logged-in users the auto-draft would even persist the stolen team
  // to the viewer's own /api/user/drafts. That looked like unauthorized
  // "edit access" to someone else's report.
  //
  // Belt-and-suspenders: check all three possible signals.
  // 1. ?s= query param (the main path after ShareRedirectClient replaces /s/id → /?s=id)
  // 2. #id= / #data= hash (fallback for legacy inline-data shares)
  // 3. window.location.pathname starting with /s/ — catches the case
  //    where useShareUrl has called history.replaceState back to /s/id
  //    (which does NOT update the Next.js router state that
  //    useSearchParams reads from). Without this check, a router-state
  //    desync could make isInShareContext flip to false while the user
  //    is still viewing a shared report.
  const searchParams = useSearchParams();
  const hashShareId = typeof window !== "undefined" && window.location.hash.startsWith("#id=");
  const hashInlineData = typeof window !== "undefined" && window.location.hash.startsWith("#data=");
  const pathIsShare = typeof window !== "undefined" && window.location.pathname.startsWith("/s/");
  const isInShareContext = !!searchParams.get("s") || hashShareId || hashInlineData || pathIsShare;

  // ── Core team data ───────────────────────────────────────────────
  const {
    paste, setPaste, analysis, parseTeam, reorderPokemon, reset, warnings: rawWarnings,
  } = useTeamReport(!isSampleTeam && !isInShareContext);

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
  // Persist to localStorage only when the user is editing their OWN
  // local draft. Disabled for sample teams and — critically — for any
  // view of someone else's shared report, to prevent the shared team's
  // authored content from leaking into the viewer's own storage and
  // being restored as a "draft" the next time they open the home page.
  const shouldPersist = !isSampleTeam && !isInShareContext;
  const { notes, setNote, setNotesFull } = usePokemonNotes(speciesKeys, shouldPersist);
  const { calcs, addCalc, removeCalc, editCalc, setCalcsFull } = useDamageCalcs(speciesKeys, shouldPersist);
  const {
    roles, summary, teamName, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, tags, templateId, megaStates, globalMegaDefault,
    setRole, setSummary, setTeamName, setTournamentName, setPlacement, setRecord, setMvpIndex, setRentalCode, setCreatorName, setTags, setTemplateId, setMetaFull, toggleMega, setGlobalMegaDefault, resetMegaOverrides,
  } = useTeamMeta(speciesKeys, shouldPersist);

  // Compute the effective Mega-or-base state for a given Pokemon index.
  // Per-card override (megaStates[i]) wins over the team-wide default
  // (globalMegaDefault) which falls back to "auto" (true).
  const effectiveMega = useCallback(
    (index: number): boolean => {
      const explicit = megaStates?.[index];
      if (explicit !== undefined) return explicit;
      return globalMegaDefault ?? true;
    },
    [megaStates, globalMegaDefault],
  );

  const hasMegaOverrides = useMemo(
    () => !!megaStates && Object.keys(megaStates).length > 0,
    [megaStates],
  );
  const {
    plans, addPlan, removePlan, addGamePlan, removeGamePlan,
    updateGamePlanNotes, updateGamePlanReplays, updateGamePlanBring,
    reorderGamePlanBring, updateGamePlanResult, togglePlanSlide, reorderPlans, setPlansFull,
  } = useMatchupPlans(speciesKeys, shouldPersist);

  // Champions uses stat points (66 SP budget) instead of EVs (510 budget),
  // so the EV total > 510 parser warning is irrelevant.
  const warnings = useMemo(() => {
    if (tags?.regulation === "Reg M-A") {
      return rawWarnings.filter(w => !w.includes("EV total") || !w.includes("exceeds"));
    }
    return rawWarnings;
  }, [rawWarnings, tags?.regulation]);
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

  // ── Restore in-progress team from localStorage (guest + signed-in) ──
  // The auto-save in useTeamReport writes `vgc-team-paste` on every change,
  // but nothing ever read it back — so guests who closed the tab lost
  // their work despite it still sitting in their own browser. This effect
  // restores it on first mount and flags the UI so we can show a
  // welcome-back banner.
  const [wasRestored, setWasRestored] = useState(false);
  const restoreAttempted = useRef(false);
  const dismissRestoreBanner = useCallback(() => setWasRestored(false), []);

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
    teamName: teamName || undefined,
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
    // Pin viewers to the creator's accent theme so the report appearance
    // stays consistent across devices / incognito / other users.
    genTheme: genTheme || undefined,
  }), [paste, notes, calcs, roles, summary, teamName, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides, tags, templateId, genTheme]);

  // ── Share flow (extracted) ───────────────────────────────────────
  const share = useShareFlow({ analysis, isSampleTeam, buildShareState, t: t as unknown as Record<string, string> });

  // ── Auto-draft (logged-in users) ─────────────────────────────────
  const { clearDraft } = useAutoDraft({
    isSignedIn: !!isSignedIn,
    analysis,
    isSampleTeam,
    isSharedView: share.isSharedView,
    buildShareState,
  });

  // ── Restore in-progress team from localStorage on first mount ────
  // Runs once after share state has settled. Skipped when entering a
  // shared view (/s/[id]) since that path hydrates from the server.
  //
  // SECURITY: Only restore if the stored paste has the "user" source
  // marker. Legacy data written by the pre-fix code (which leaked
  // shared-report content into the viewer's localStorage) has no marker
  // and must be ignored and evicted, not silently loaded as a
  // "welcome-back draft". Anything without the marker gets wiped on
  // sight so it can't surface on a future visit either.
  useEffect(() => {
    if (restoreAttempted.current) return;
    if (analysis) return; // already have a team loaded
    if (share.isSharedView || share.isSharePending || share.sharedState) return;
    restoreAttempted.current = true;
    try {
      const stored = localStorage.getItem("vgc-team-paste");
      const source = localStorage.getItem("vgc-team-paste-source");
      if (stored && stored.trim() && source === "user") {
        setPaste(stored);
        parseTeam(stored);
        setWasRestored(true);
      } else if (stored) {
        // Unmarked legacy data — evict to prevent it surfacing later.
        localStorage.removeItem("vgc-team-paste");
        localStorage.removeItem("vgc-team-paste-source");
      }
    } catch {
      // localStorage unavailable — nothing to restore
    }
  }, [analysis, share.isSharedView, share.isSharePending, share.sharedState, setPaste, parseTeam]);

  // Dismiss the welcome-back banner once the user grabs a share link.
  useEffect(() => {
    if (wasRestored && share.hasExistingShare()) setWasRestored(false);
  }, [wasRestored, share]);

  // ── beforeunload warning when leaving with unsaved meaningful work ──
  // Fires only when there's a real team on screen and no share link
  // exists yet (so closing the tab would lose the only copy of the
  // link, even though the paste is restored next visit).
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!analysis || isSampleTeam) return;
      if (share.isSharedView) return;
      if (share.hasExistingShare()) return;
      // Only warn if the user has invested meaningful work beyond just pasting
      const hasContent =
        !!summary?.trim() ||
        !!teamName?.trim() ||
        !!tournamentName?.trim() ||
        Object.values(notes).some((n) => n?.trim()) ||
        Object.values(calcs).some((arr) => arr?.length > 0);
      if (!hasContent) return;
      e.preventDefault();
      // Legacy browsers require a returnValue to show the prompt
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [analysis, isSampleTeam, share, summary, teamName, tournamentName, notes, calcs]);

  // ── Real-time collaborative sync (SSE) ──────────────────────────
  const handleRemoteUpdate = useCallback((state: import("@/lib/sharing/url-codec").ShareableState) => {
    setPaste(state.paste);
    parseTeam(state.paste);
    setNotesFull(state.notes ?? {});
    setCalcsFull(state.calcs ?? {});
    setMetaFull({
      roles: state.roles ?? {},
      summary: state.teamSummary ?? "",
      teamName: state.teamName ?? undefined,
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
    setCreatorMode,
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
  }, [notes, calcs, roles, summary, teamName, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides, tags, analysis, share.isSharedView]);

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
    isFirstTime: walkthroughIsFirstTime,
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

  // Reset the hydration guard when leaving a shared view, so re-entering
  // /s/{id} in the same session re-runs the hydration effect below and
  // repopulates calcs/notes/meta from the freshly fetched server state.
  useEffect(() => {
    if (!share.sharedState) {
      hasHydrated.current = false;
    }
  }, [share.sharedState]);

  useEffect(() => {
    if (!share.sharedState) return;
    // Start read-only; creator mode activates once edit access is confirmed
    setCreatorMode(false);
    setPaste(share.sharedState.paste);
    parseTeam(share.sharedState.paste);
  }, [share.sharedState, setPaste, parseTeam, setCreatorMode]);

  // Auto-enable edit mode for owners and explicit edit links (?key=).
  // Other viewers see read-only and can toggle via the navbar button.
  useEffect(() => {
    if (share.isEditingUnlocked && (share.isOwner || share.editKeyFromUrl)) {
      setCreatorMode(true);
    }
  }, [share.isEditingUnlocked, share.isOwner, share.editKeyFromUrl, setCreatorMode]);

  useEffect(() => {
    if (!share.sharedState || !analysis || hasHydrated.current) return;
    hasHydrated.current = true;
    setNotesFull(share.sharedState.notes ?? {});
    setCalcsFull(share.sharedState.calcs ?? {});
    setMetaFull({
      roles: share.sharedState.roles ?? {},
      summary: share.sharedState.teamSummary ?? "",
      teamName: share.sharedState.teamName ?? undefined,
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

  // ── Auto-detect Champions regulation when team has Mega/Primal Pokemon ──
  const regulationDetected = useRef(false);
  useEffect(() => {
    if (!analysis || share.isSharedView || regulationDetected.current) return;
    if (tags?.regulation) return; // user already set regulation
    const hasMega = analysis.pokemon.some((p) =>
      p.parsed.species.includes("-Mega") || p.parsed.species.includes("-Primal")
    );
    if (hasMega) {
      regulationDetected.current = true;
      setTags({ ...tags, regulation: "Reg M-A" });
    }
  }, [analysis, share.isSharedView, tags, setTags]);

  // ── Actions ──────────────────────────────────────────────────────
  const handleAnalyze = (directPaste?: string) => {
    const teamPaste = directPaste ?? paste;
    setIsSampleTeam(teamPaste.trim() === SAMPLE_PASTE.trim());
    templateApplied.current = false; // reset so template applies on next parse
    archetypeDetected.current = false;
    regulationDetected.current = false;
    parseTeam(teamPaste);
    // Track team creation
    const hasMega = teamPaste.includes("-Mega") || teamPaste.includes("-Primal");
    track("team_created", { hasMega: hasMega ? "yes" : "no" });
    posthog.capture("team_created", { has_mega: hasMega, pokemon_count: teamPaste.split(/\n\n+/).filter(Boolean).length });
  };

  const handleReset = useCallback(() => {
    reset();
    share.clearStoredShare();
    clearDraft();
    setIsSampleTeam(false);
  }, [reset, share.clearStoredShare, clearDraft]);

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
    isOwner: share.isOwner,
    sessionShareId: share.sessionShareId,
    lastShareResult: share.lastShareResult,
    openShareSheetForUrl: share.openShareSheetForUrl,
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
    forkedFrom: share.forkedFrom,
    forkReport: share.forkReport,

    // Collaborative sync
    collaborators,
    syncStatus,

    saveFlash,
    showShortcutHint, setShowShortcutHint,
    isSampleTeam,
    speciesKeys,

    // Welcome-back banner (restored from localStorage on reload)
    wasRestored, dismissRestoreBanner,

    // Team content
    notes, setNote, calcs, addCalc, removeCalc, editCalc,
    roles, setRole, summary, setSummary,
    teamName, setTeamName, tournamentName, setTournamentName, placement, setPlacement,
    record, setRecord, mvpIndex, setMvpIndex,
    rentalCode, setRentalCode, creatorName, setCreatorName, tags, setTags, templateId, setTemplateId,
    megaStates, toggleMega,
    globalMegaDefault, setGlobalMegaDefault, resetMegaOverrides,
    effectiveMega, hasMegaOverrides,

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
    startWalkthrough, walkthroughGuidePokemon, walkthroughIsFirstTime,

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

    // Drafts
    clearDraft,
  };
}
