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
import { isChampionsFormat } from "@/lib/data/tags";
import { useTeamMeta } from "@/hooks/useTeamMeta";
import { useWalkthrough } from "@/hooks/useWalkthrough";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { UndoRedoSnapshot } from "@/hooks/useUndoRedo";
import { useTheme } from "@/hooks/useTheme";
import { useShareFlow } from "@/hooks/useShareFlow";
import { useCollaborativeSync } from "@/hooks/useCollaborativeSync";
import { useSlideSystem } from "@/hooks/useSlideSystem";
import { useAutoDraft } from "@/hooks/useAutoDraft";
import { useAuth } from "@clerk/nextjs";
import { SAMPLE_PASTE } from "@/components/input/PasteInput";
import { usePostHog } from "@/components/providers/PostHogProvider";
import { useTranslation } from "@/lib/i18n";
import { getTemplate } from "@/lib/templates";
import type { SpriteConfig } from "@/lib/types/sprites";
import { detectArchetypes } from "@/lib/analysis/detect-archetype";
import { detectRegulation } from "@/lib/analysis/detect-regulation";

export function useHomePage() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const posthog = usePostHog();
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
    roles, summary, commonModes, teamName, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, tags, templateId, megaStates, globalMegaDefault, privateFields,
    setRole, setSummary, setCommonModes, setTeamName, setTournamentName, setPlacement, setRecord, setMvpIndex, setRentalCode, setCreatorName, setTags, setTemplateId, setMetaFull, toggleMega, setGlobalMegaDefault, resetMegaOverrides, setPrivateFields,
  } = useTeamMeta(speciesKeys, shouldPersist);

  // Compute the effective Mega-or-base state for a given Pokemon index.
  // Per-card override (keyed by speciesKey, not slot index — so it
  // survives reorder/swap) wins over the team-wide default
  // (globalMegaDefault) which falls back to "auto" (true).
  const effectiveMega = useCallback(
    (index: number): boolean => {
      const key = speciesKeys[index];
      const explicit = key ? megaStates?.[key] : undefined;
      if (explicit !== undefined) return explicit;
      return globalMegaDefault ?? true;
    },
    [megaStates, globalMegaDefault, speciesKeys],
  );

  // Only count overrides that actually apply to the current team. Legacy
  // numeric-keyed entries or stale species keys from previous teams are
  // ignored here so the "X per-card overrides" indicator in the pill
  // never shows a phantom count.
  const hasMegaOverrides = useMemo(
    () => !!megaStates && speciesKeys.some((k) => megaStates[k] !== undefined),
    [megaStates, speciesKeys],
  );

  // Combined handler for the floating Display pill: tapping Base/Mega on
  // the team-wide control also clears any per-card overrides, so a single
  // tap always normalizes the whole team to one form. Without this, the
  // pill could silently "miss" overridden cards and leave the UI in a
  // mixed state that didn't match what the user just tapped.
  const setGlobalMegaDefaultAndReset = useCallback(
    (value: boolean | null) => {
      setGlobalMegaDefault(value);
      resetMegaOverrides();
    },
    [setGlobalMegaDefault, resetMegaOverrides],
  );
  const {
    plans, addPlan, removePlan, addGamePlan, removeGamePlan,
    updateGamePlanNotes, updateGamePlanBring,
    reorderGamePlanBring, updateGamePlanResult, togglePlanSlide, reorderPlans, setPlansFull,
  } = useMatchupPlans(speciesKeys, shouldPersist);

  // Champions uses stat points (66 SP budget) instead of EVs (510 budget),
  // so the EV total > 510 parser warning is irrelevant.
  const warnings = useMemo(() => {
    if (isChampionsFormat(tags?.regulation)) {
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

  // The undo history stores the full editable meta set (not just
  // notes/calcs/roles/summary/plans). Previously edits to teamName,
  // tournamentName, placement, record, tags, commonModes, hiddenSlides, etc.
  // couldn't be undone because they were never snapshotted (Finding 4.6).
  // We carry them as extra fields on the snapshot object (preserved at runtime)
  // aligned with the fields in buildShareState.
  type UndoMeta = Parameters<typeof setMetaFull>[0];
  type FullUndoSnapshot = UndoRedoSnapshot & { meta: UndoMeta; hiddenSlides: string[] };

  const restoreSnapshot = useCallback((snapshot: FullUndoSnapshot | null) => {
    if (!snapshot) return;
    setNotesFull(snapshot.notes);
    setCalcsFull(snapshot.calcs);
    setMetaFull({ roles: snapshot.roles, summary: snapshot.summary, ...(snapshot.meta ?? {}) });
    setPlansFull(snapshot.plans);
    if (Array.isArray(snapshot.hiddenSlides)) setHiddenFull(snapshot.hiddenSlides);
    undoRedo.doneRestoring();
  }, [undoRedo, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setHiddenFull]);

  useEffect(() => {
    if (!analysis || undoRedo.isRestoring()) return;
    if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current);
    snapshotTimerRef.current = setTimeout(() => {
      const snapshot: FullUndoSnapshot = {
        notes, calcs, roles, summary,
        plans: plans.map((p) => ({ ...p, gamePlans: p.gamePlans.map((gp) => ({ ...gp })) })),
        meta: {
          commonModes, teamName, tournamentName, placement, record,
          mvpIndex, rentalCode, creatorName, tags, templateId, privateFields,
        },
        hiddenSlides: [...hiddenSlides],
      };
      undoRedo.pushSnapshot(snapshot);
    }, 500);
    return () => { if (snapshotTimerRef.current) clearTimeout(snapshotTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    notes, calcs, roles, summary, plans, analysis,
    commonModes, teamName, tournamentName, placement, record,
    mvpIndex, rentalCode, creatorName, tags, templateId, privateFields, hiddenSlides,
  ]);

  const handleUndo = useCallback(() => {
    restoreSnapshot(undoRedo.undo() as FullUndoSnapshot | null);
  }, [undoRedo, restoreSnapshot]);

  const handleRedo = useCallback(() => {
    restoreSnapshot(undoRedo.redo() as FullUndoSnapshot | null);
  }, [undoRedo, restoreSnapshot]);

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
    commonModes,
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
        result: gp.result ?? undefined,
      })),
    })),
    hiddenSlides: hiddenSlides.size > 0 ? [...hiddenSlides] : undefined,
    tags: tags && (tags.archetype?.length || tags.regulation || tags.eventType) ? tags : undefined,
    templateId: templateId || undefined,
    privateFields: privateFields.length > 0 ? privateFields : undefined,
    // Pin viewers to the creator's accent theme so the report appearance
    // stays consistent across devices / incognito / other users.
    genTheme: genTheme || undefined,
  }), [paste, notes, calcs, roles, summary, commonModes, teamName, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides, tags, templateId, privateFields, genTheme]);

  // ── Self-echo suppression wiring (§1-B) ──────────────────────────
  // useCollaborativeSync (below) exposes markSaving/updateVersion but is
  // instantiated AFTER useShareFlow, which is where saves actually fire.
  // Bridge the two through a ref so the autosave/publish paths can signal
  // the sync layer to ignore the version bump they're about to cause.
  const syncControlsRef = useRef<{ markSaving: () => void; updateVersion: (v?: number) => void } | null>(null);
  const activeDraftIdRef = useRef<string | null>(null);
  const handleSaveStart = useCallback(() => { syncControlsRef.current?.markSaving(); }, []);
  const handleSaveEnd = useCallback(() => { syncControlsRef.current?.updateVersion(); }, []);
  const getActiveDraftId = useCallback(() => activeDraftIdRef.current, []);

  // ── Share flow (extracted) ───────────────────────────────────────
  const share = useShareFlow({
    analysis,
    isSampleTeam,
    buildShareState,
    getActiveDraftId,
    t,
    onSaveStart: handleSaveStart,
    onSaveEnd: handleSaveEnd,
  });

  // ── Auto-draft (logged-in users) ─────────────────────────────────
  const {
    draftId,
    status: draftSaveStatus,
    error: draftSaveError,
    saveDraft,
    setActiveDraft,
    clearDraft,
  } = useAutoDraft({
    isSignedIn: !!isSignedIn,
    analysis,
    isSampleTeam,
    isSharedView: share.isSharedView || !!share.sessionShareId,
    buildShareState,
  });
  activeDraftIdRef.current = draftId;

  // The share endpoint replaces only the active draft. Mirror that successful
  // transition locally so the next new team cannot target its deleted ID.
  useEffect(() => {
    if (share.lastShareResult?.publicUrl && !share.isSharedView) clearDraft();
  }, [clearDraft, share.isSharedView, share.lastShareResult?.publicUrl]);

  // ── Legacy localStorage eviction (one-time, runs on every mount) ──
  // After the 2026-04-10 leak incident, every team-content storage key
  // was version-bumped to a -v2 namespace. The pre-v2 keys could contain
  // leaked content from someone else's shared report — under a "user"
  // marker, even — due to a pre-fix race window. We nuke the entire
  // pre-v2 namespace on mount so legacy state can never resurface.
  // Runs once per mount but is idempotent: subsequent runs find the keys
  // already gone and exit fast.
  const legacyEvicted = useRef(false);
  useEffect(() => {
    if (legacyEvicted.current) return;
    legacyEvicted.current = true;
    try {
      const LEGACY_PREFIXES = [
        "vgc-team-paste",          // exact match: vgc-team-paste, vgc-team-paste-source
        "vgc-notes-",              // species-keyed notes
        "vgc-calcs-",              // species-keyed damage calcs
        "vgc-meta-",               // species-keyed team meta
        "vgc-matchup-plans-",      // species-keyed matchup plans
        "vgc-hidden-slides-",      // species-keyed hidden slides
      ];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        // Skip the new v2 namespace (starts with the prefix but contains "-v2-").
        if (key.includes("-v2") || key.includes("-v2-")) continue;
        for (const prefix of LEGACY_PREFIXES) {
          // Exact match for the paste key + its source marker
          if (prefix === "vgc-team-paste") {
            if (key === "vgc-team-paste" || key === "vgc-team-paste-source") {
              keysToRemove.push(key);
              break;
            }
            continue;
          }
          // Prefix match for species-keyed namespaces
          if (key.startsWith(prefix)) {
            keysToRemove.push(key);
            break;
          }
        }
      }
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch {
      // localStorage unavailable — nothing to evict
    }
  }, []);

  // ── Restore in-progress team from localStorage on first mount ────
  // Runs once after share state has settled. Skipped when entering a
  // shared view (/s/[id]) since that path hydrates from the server.
  //
  // SECURITY: Only restore if the stored paste has the v2 "user" source
  // marker. The v2 namespace did not exist before the 2026-04-10 leak fix,
  // so anything in vgc-team-paste-v2 was definitively written by post-fix
  // code with the source check in place — it cannot contain leaked content.
  useEffect(() => {
    if (restoreAttempted.current) return;
    if (analysis) return; // already have a team loaded
    if (share.isSharedView || share.isSharePending || share.sharedState) return;
    restoreAttempted.current = true;
    try {
      const stored = localStorage.getItem("vgc-team-paste-v2");
      const source = localStorage.getItem("vgc-team-paste-source-v2");
      if (stored && stored.trim() && source === "user") {
        setPaste(stored);
        parseTeam(stored);
        setWasRestored(true);
      } else if (stored) {
        // Defensive eviction in case the marker check fails.
        localStorage.removeItem("vgc-team-paste-v2");
        localStorage.removeItem("vgc-team-paste-source-v2");
      }
    } catch {
      // localStorage unavailable — nothing to restore
    }
  }, [analysis, share.isSharedView, share.isSharePending, share.sharedState, setPaste, parseTeam]);

  // Dismiss the welcome-back banner once the user grabs a share link.
  // Depend on the stable `hasExistingShare` callback, not the freshly-allocated
  // `share` object (which changes identity every render and re-ran this effect
  // continuously — Finding 4.7).
  useEffect(() => {
    if (wasRestored && share.hasExistingShare()) setWasRestored(false);
  }, [wasRestored, share.hasExistingShare]);

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
    // Depend on the specific stable fields used, not the `share` object which
    // is re-allocated every render (Finding 4.7 — the handler was being
    // detached/re-attached on every render).
  }, [analysis, isSampleTeam, share.isSharedView, share.hasExistingShare, summary, teamName, tournamentName, notes, calcs]);

  // ── Real-time collaborative sync (SSE) ──────────────────────────
  const handleRemoteUpdate = useCallback((state: import("@/lib/sharing/url-codec").ShareableState) => {
    setPaste(state.paste);
    parseTeam(state.paste);
    setNotesFull(state.notes ?? {});
    setCalcsFull(state.calcs ?? {});
    setMetaFull({
      roles: state.roles ?? {},
      summary: state.teamSummary ?? "",
      commonModes: state.commonModes ?? undefined,
      teamName: state.teamName ?? undefined,
      tournamentName: state.tournamentName ?? undefined,
      placement: state.placement ?? undefined,
      record: state.record ?? undefined,
      mvpIndex: state.mvpIndex ?? null,
      rentalCode: state.rentalCode ?? undefined,
      creatorName: state.creatorName ?? undefined,
      tags: state.tags ?? undefined,
      templateId: state.templateId ?? undefined,
      privateFields: state.privateFields ?? undefined,
    });
    const rawPlans = Array.isArray(state.matchupPlans) ? state.matchupPlans : [];
    // Reuse existing plan/gamePlan IDs by position instead of minting fresh
    // crypto.randomUUID() values on every remote apply. Regenerating IDs made
    // local state differ from the just-saved state, which retriggered autosave —
    // the amplifier in the §1-B echo loop. Preserving IDs makes applying an
    // unchanged remote state idempotent.
    setPlansFull(
      rawPlans.map((p, i) => {
        const existing = plans[i];
        return {
          id: existing?.id ?? crypto.randomUUID(),
          ...p,
          gamePlans: (p.gamePlans ?? []).map((gp, j) => ({
            ...gp,
            id: existing?.gamePlans?.[j]?.id ?? crypto.randomUUID(),
            bring: gp.bring ?? [null, null, null, null],
            notes: gp.notes ?? "",
          })),
        };
      }),
    );
    if (Array.isArray(state.hiddenSlides)) setHiddenFull(state.hiddenSlides);
  }, [plans, setPaste, parseTeam, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setHiddenFull]);

  const canEditSharedReport = share.isEditingUnlocked && isSignedIn === true;

  const { collaborators, syncStatus, markSaving, updateVersion } = useCollaborativeSync({
    shareId: share.activeShareId,
    enabled: canEditSharedReport,
    onRemoteUpdate: handleRemoteUpdate,
  });
  // markSaving/updateVersion are stable (useCallback []), so this runs once.
  syncControlsRef.current = { markSaving, updateVersion };

  // ── Slide system (extracted) ─────────────────────────────────────
  const slides = useSlideSystem({
    analysis, speciesKeys, plans, hiddenSlides, isHidden,
    toggleSlide, togglePlanSlide, creatorMode, presentationMode, paste,
    darkMode, setDarkMode, setPresentationMode,
    setShowShortcutHint: setShowShortcutHint as (fn: (v: boolean) => boolean) => void,
    handleUndo, handleRedo,
    setCreatorMode,
    t,
  });

  // Shared views (/s/{id}) require an authenticated owner/collaborator to edit.
  // Anonymous visitors cannot mutate a published report even if they hold a
  // stale localStorage edit token or the URL has been tampered with. The home
  // page remains fully editable without auth (it's a local draft) — sign-in is
  // only required to publish/save via the Share flow.
  const isSharedReadOnly = share.isSharedView && !canEditSharedReport;
  const isReadOnly = isSharedReadOnly || presentationMode || !creatorMode;
  const isPresentationStyle = presentationMode;

  // Flash "Saved" when user data changes
  useEffect(() => {
    if (!analysis || share.isSharedView) return;
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setSaveFlash(true);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveFlash(false), 1500);
    // VGC-245: `commonModes` was missing from this list, so editing the
    // "How to Pilot This Team" section never flashed "Saved" on a local
    // draft even though the edit was persisted.
  }, [notes, calcs, roles, summary, commonModes, teamName, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, hiddenSlides, tags, analysis, share.isSharedView]);

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

  // Auto-enable edit mode only after the authenticated account has been
  // confirmed as the owner or an accepted collaborator by the server.
  useEffect(() => {
    if (canEditSharedReport) {
      setCreatorMode(true);
    }
  }, [canEditSharedReport, setCreatorMode]);

  useEffect(() => {
    if (!share.sharedState || !analysis || hasHydrated.current) return;
    hasHydrated.current = true;
    setNotesFull(share.sharedState.notes ?? {});
    setCalcsFull(share.sharedState.calcs ?? {});
    setMetaFull({
      roles: share.sharedState.roles ?? {},
      summary: share.sharedState.teamSummary ?? "",
      commonModes: share.sharedState.commonModes ?? undefined,
      teamName: share.sharedState.teamName ?? undefined,
      tournamentName: share.sharedState.tournamentName ?? undefined,
      placement: share.sharedState.placement ?? undefined,
      record: share.sharedState.record ?? undefined,
      mvpIndex: share.sharedState.mvpIndex ?? null,
      rentalCode: share.sharedState.rentalCode ?? undefined,
      creatorName: share.sharedState.creatorName ?? undefined,
      tags: share.sharedState.tags ?? undefined,
      templateId: share.sharedState.templateId ?? undefined,
      privateFields: share.sharedState.privateFields ?? undefined,
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
        })),
      })),
    );
    if (Array.isArray(share.sharedState.hiddenSlides)) setHiddenFull(share.sharedState.hiddenSlides);
    if (share.sharedState.allowComments) share.setAllowComments(true);
  }, [share.sharedState, analysis, speciesKeys, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setHiddenFull]);

  // Auto-enter presentation mode when a viewer opens a shared team report.
  // The intent is "click a team → drop straight into the deck", same as
  // tapping a slide deck on Apple Keynote on the web. Authenticated editors
  // stay in editing mode. Tracked via a ref so exiting presentation mode
  // mid-view doesn't snap the viewer back in.
  const autoPresentTriggered = useRef(false);
  useEffect(() => {
    if (!share.sharedState || !share.isSharedView) {
      autoPresentTriggered.current = false;
      return;
    }
    if (!analysis || autoPresentTriggered.current) return;
    if (canEditSharedReport) return;
    autoPresentTriggered.current = true;
    setPresentationMode(true);
  }, [share.sharedState, share.isSharedView, canEditSharedReport, analysis, setPresentationMode]);

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

  // ── Auto-detect regulation from the team composition ─────────────
  // Uses the signal-based detector (lib/analysis/detect-regulation.ts)
  // which inspects species, items, and form variants against curated
  // Gen 9 signal sets (Megas, Primals, Restricted, Paradox, Sub-legend,
  // DLC/HOME era species).
  //
  // Every team gets a regulation tag — if no positive signal matches
  // we fall through to "Custom" so viewers see an explicit "we don't
  // recognize this format" state instead of a blank. Detection result
  // is marked regulationAutoDetected:true so the UI can distinguish
  // an auto-tag from a user-claimed one; any manual pick in the tag
  // select flips that flag off.
  const regulationDetected = useRef(false);
  useEffect(() => {
    if (!analysis || share.isSharedView || regulationDetected.current) return;
    if (tags?.regulation) return; // user already set regulation
    regulationDetected.current = true;
    const detected = detectRegulation(analysis.pokemon);
    setTags({
      ...tags,
      regulation: detected ?? "Custom",
      regulationAutoDetected: true,
    });
  }, [analysis, share.isSharedView, tags, setTags]);

  // ── Draft hydration (parallel to shared-view hydration above) ────
  // The /?draft=ID flow used to call only handleAnalyze(paste), which
  // throws away every other field on the saved draft — so reopening a
  // draft from /dashboard wiped teamName, tournamentName, summary,
  // notes, calcs, plans, etc. We mirror the share-hydration pattern:
  // stash the full draft state in a ref, kick off paste parsing, then
  // apply the rest of the fields once `analysis` (and the resulting
  // speciesKeys-keyed hooks) are ready. The order is critical because
  // useTeamMeta loads its own per-team localStorage on speciesKeys
  // change — applying the draft fields BEFORE that load would just
  // get overwritten on the next render.
  const pendingDraftRef = useRef<import("@/lib/sharing/url-codec").ShareableState | null>(null);
  const draftHydrated = useRef(false);

  const loadDraft = useCallback((state: import("@/lib/sharing/url-codec").ShareableState, id?: string) => {
    if (id) setActiveDraft(id);
    pendingDraftRef.current = state;
    draftHydrated.current = false;
    // Skip the auto-template / auto-archetype / auto-regulation effects;
    // a draft already has its own user-authored values for these.
    templateApplied.current = true;
    archetypeDetected.current = true;
    regulationDetected.current = true;
    setIsSampleTeam(false);
    setPaste(state.paste);
    parseTeam(state.paste);
  }, [setActiveDraft, setPaste, parseTeam]);

  useEffect(() => {
    const state = pendingDraftRef.current;
    if (!state || !analysis || draftHydrated.current) return;
    draftHydrated.current = true;
    setNotesFull(state.notes ?? {});
    setCalcsFull(state.calcs ?? {});
    setMetaFull({
      roles: state.roles ?? {},
      summary: state.teamSummary ?? "",
      commonModes: state.commonModes ?? undefined,
      teamName: state.teamName ?? undefined,
      tournamentName: state.tournamentName ?? undefined,
      placement: state.placement ?? undefined,
      record: state.record ?? undefined,
      mvpIndex: state.mvpIndex ?? null,
      rentalCode: state.rentalCode ?? undefined,
      creatorName: state.creatorName ?? undefined,
      tags: state.tags ?? undefined,
      templateId: state.templateId ?? undefined,
      privateFields: state.privateFields ?? undefined,
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
        })),
      })),
    );
    if (Array.isArray(state.hiddenSlides)) setHiddenFull(state.hiddenSlides);
    pendingDraftRef.current = null;
  }, [analysis, setNotesFull, setCalcsFull, setMetaFull, setPlansFull, setHiddenFull]);

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
    posthog?.capture("team_created", { has_mega: hasMega, pokemon_count: teamPaste.split(/\n\n+/).filter(Boolean).length });
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
    buildShareState,
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
    isEditingUnlocked: canEditSharedReport,
    isOwner: share.isOwner,
    sharedRedactedFields: share.redactedFields,
    sessionShareId: share.sessionShareId,
    lastShareResult: share.lastShareResult,
    openShareSheetForUrl: share.openShareSheetForUrl,
    shareButtonText: share.shareButtonText,
    handleShareClick: share.handleShareClick,
    handleReshare: share.handleReshare,
    isPublic: share.isPublic,
    setIsPublic: share.setIsPublic,
    handleSetPublic: share.handleSetPublic,
    isUnlisted: share.isUnlisted,
    setIsUnlisted: share.setIsUnlisted,
    handleSetVisibility: share.handleSetVisibility,
    publishError: share.publishError,
    clearPublishError: share.clearPublishError,
    creatorRequired: share.creatorRequired,
    allowComments: share.allowComments,
    setAllowComments: share.setAllowComments,
    autoSaveStatus: share.autoSaveStatus,
    draftId,
    draftSaveStatus,
    draftSaveError,
    saveDraft,
    collaboratorNames: share.fetchedCollaborators,
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
    roles, setRole, summary, setSummary, commonModes, setCommonModes,
    teamName, setTeamName, tournamentName, setTournamentName, placement, setPlacement,
    record, setRecord, mvpIndex, setMvpIndex,
    rentalCode, setRentalCode, creatorName, setCreatorName, tags, setTags, templateId, setTemplateId,
    privateFields, setPrivateFields,
    megaStates, toggleMega,
    globalMegaDefault, setGlobalMegaDefault, resetMegaOverrides,
    setGlobalMegaDefaultAndReset,
    effectiveMega, hasMegaOverrides,

    plans, addPlan, removePlan, addGamePlan, removeGamePlan,
    updateGamePlanNotes, updateGamePlanBring,
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
    visibleIndices: slides.visibleIndices,
    allSlideKeys: slides.allSlideKeys,

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
    loadDraft,
  };
}
