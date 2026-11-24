"use client";
import { matchupSectionKey } from "@/lib/sharing/collaboration";
import { LimitlessImport } from "@/components/input/LimitlessImport";

import { type ReactNode, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useHomePage } from "@/hooks/useHomePage";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { CHAMPIONS_SAMPLE_TEAMS } from "@/data/champions-sample-teams";
import { PasteInput } from "@/components/input/PasteInput";
// Report-view components never render on the initial paste screen — lazy-load
// them so first paint doesn't pay for the full report bundle.
const TeamReport = dynamic(() => import("@/components/report/TeamReport").then(m => ({ default: m.TeamReport })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-xl h-64 max-w-5xl mx-auto" />,
});
const TeamCardCTA = dynamic(() => import("@/components/report/TeamCardCTA").then(m => ({ default: m.TeamCardCTA })));
const TournamentMode = dynamic(() => import("@/components/report/TournamentMode").then(m => ({ default: m.TournamentMode })));
const SlideNavControls = dynamic(() => import("@/components/report/SlideNavControls").then(m => ({ default: m.SlideNavControls })));
import { isChampionsFormat } from "@/lib/data/tags";
import { WalkthroughOverlay } from "@/components/ui/WalkthroughOverlay";
import { ShortcutHintOverlay } from "@/components/ui/ShortcutHintOverlay";
import { ShareViewCTA } from "@/components/ui/ShareViewCTA";
import { SwipeHint } from "@/components/ui/SwipeHint";
import { EditFab } from "@/components/ui/EditFab";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { Navbar } from "@/components/layout/Navbar";
import { UsersIcon } from "@/components/ui/icons";
import {
  WelcomeBackBanner,
  SignedOutDraftBanner,
  UrlWarningBanner,
  NoVersionDiffToast,
  ForkAttributionBanner,
  HiddenSlideBanner,
  TourOfferPrompt,
  PokepasteErrorToast,
} from "@/components/home/ReportNotices";
import { SharedReportActions, EndOfReportCta, CommentsDisabledNotice } from "@/components/home/SharedReportSocial";
import { ExportThemePickerModal } from "@/components/home/ExportThemePickerModal";
import { SharedReportSkeletonCards } from "@/components/home/SharedReportSkeletonCards";
import { printContainerStyle } from "@/components/home/print-container-style";
const DoubleTapLikeOverlay = dynamic(() => import("@/components/social/DoubleTapLikeOverlay").then(m => ({ default: m.DoubleTapLikeOverlay })), { ssr: false });
const CollaborationWorkspace = dynamic(() => import("@/components/social/CollaborationWorkspace").then(m => ({ default: m.CollaborationWorkspace })));
const CollaborationConflict = dynamic(() => import("@/components/social/CollaborationConflict").then(m => ({ default: m.CollaborationConflict })));
const EditChangelog = dynamic(() => import("@/components/social/EditChangelog").then(m => ({ default: m.EditChangelog })));
const CollaboratorPanel = dynamic(() => import("@/components/social/CollaboratorPanel").then(m => ({ default: m.CollaboratorPanel })));
import { getSessionId } from "@/lib/utils/session-id";
import { readStorage, writeStorage, STORAGE_KEY_BUILDERS } from "@/lib/utils/safe-storage";
import { clearRandomAccent } from "@/lib/utils/random-accent";
import { setViewOverrideTheme, reapplyCurrentTheme, type GenTheme } from "@/hooks/useTheme";
import { teamToShowdown, teamToOpenSheet } from "@/lib/utils/export-paste";
import { createPokePaste } from "@/lib/utils/pokepaste";
import { replacePokemonSpecies, replacePokemonSpread } from "@/lib/utils/paste-edit";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { VersionDiffProvider } from "@/lib/contexts/VersionDiffContext";
import { computeVersionDiff, getNavigableChanges, type VersionDiff, type DiffChange } from "@/lib/utils/version-diff";
const DiffNavigator = dynamic(() => import("@/components/ui/DiffNavigator").then(m => ({ default: m.DiffNavigator })));
import type { ShareableState } from "@/lib/sharing/url-codec";
import { usePostHog } from "@/components/providers/PostHogProvider";

// Lazy-load heavy modal and social components (only rendered conditionally)
const ShareModal = dynamic(() => import("@/components/ui/ShareModal").then(m => ({ default: m.ShareModal })));
const CommentSection = dynamic(() => import("@/components/social/CommentSection").then(m => ({ default: m.CommentSection })), {
  loading: () => <div className="animate-pulse bg-surface-alt rounded-xl h-32" />,
});
const PrintableReport = dynamic(() => import("@/components/ui/PdfExport").then(m => ({ default: m.PrintableReport })));
import type { ExportMode } from "@/components/ui/PdfExport";
const OTSSheetModal = dynamic(() => import("@/components/ui/OTSSheetModal").then(m => ({ default: m.OTSSheetModal })), { ssr: false });

export default function HomePageClient({ sprites, steps, feedback }: { sprites: ReactNode; steps: ReactNode; feedback: ReactNode }) {
  const posthog = usePostHog();
  const {
    t,
    buildShareState,
    paste,
    setPaste,
    analysis,
    warnings,
    reorderPokemon,
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
    isSharedView,
    isSharePending,
    sharedState,
    shareStatus,
    urlWarning,
    decodeFailed,
    isEditingUnlocked,
    isOwner,
    sharedRedactedFields,
    lastShareResult,
    openShareSheetForUrl,
    shareButtonText,
    handleShareClick,
    handleReshare,
    isPublic,
    handleSetPublic,
    isUnlisted,
    handleSetVisibility,
    publishError,
    clearPublishError,
    creatorRequired,
    allowComments,
    setAllowComments,
    autoSaveStatus,
    draftSaveStatus,
    draftSaveError,
    saveDraft,
    collaboratorNames,
    collaborators,
    syncStatus,
    collaborationConflict, resolveCollaborationConflict,
    activeShareId,
    sessionShareId,
    editKeyFromUrl,
    saveFlash,
    showShortcutHint,
    setShowShortcutHint,
    speciesKeys,
    wasRestored,
    dismissRestoreBanner,
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
    commonModes,
    setCommonModes,
    teamName,
    setTeamName,
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
    tags,
    setTags,
    privateFields,
    setPrivateFields,
    toggleMega,
    globalMegaDefault,
    setGlobalMegaDefaultAndReset,
    effectiveMega,
    plans,
    addPlan,
    removePlan,
    addGamePlan,
    removeGamePlan,
    updateGamePlanNotes,
    updateGamePlanBring,
    reorderGamePlanBring,
    updateGamePlanResult,
    reorderPlans,
    getSpriteConfig,
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
    visibleIndices,
    allSlideKeys,
    walkthroughActive,
    walkthroughStep,
    walkthroughStepIndex,
    walkthroughTotalSteps,
    walkthroughNext,
    walkthroughPrev,
    walkthroughSkip,
    startWalkthrough,
    walkthroughGuidePokemon,
    walkthroughIsFirstTime,
    dismissWalkthroughPrompt,
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    pendingTemplateId,
    setPendingTemplateId,
    handleAnalyze,
    loadDraft,
    importTeam,
    isSampleTeam,
    handleReset,
    handleDecodeFailed,
    forkedFrom,
    forkReport,
  } = useHomePage();

  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showOTSSheet, setShowOTSSheet] = useState(false);
  const [tournamentMode, setTournamentMode] = useState(false);
  // Tracks whether the shared-view "Duplicate this team" CTA has been
  // dismissed. Hoisted here (instead of inside ShareViewCTA) so the
  // floating Display pill can react to it and drop its lift offset the
  // moment the CTA disappears, rather than staying artificially raised.
  //
  // Dismissal is persisted in localStorage per share-id under the
  // SHARE_CTA_DISMISSED_KEY namespace, so a viewer who dismisses the
  // CTA once never sees it again on subsequent visits to that report.
  // Per-id keying matters: dismissing one team's CTA should NOT also
  // dismiss the next team you click through to.
  const [shareCtaDismissed, setShareCtaDismissed] = useState(false);
  // Tracks whether the end-of-report contextual CTA (shown on the last slide)
  // has been dismissed by the viewer.
  const [endOfReportCtaDismissed, setEndOfReportCtaDismissed] = useState(false);

  // Resolve effective Mega state for every Pokemon index up front so the
  // existing TeamReport / TeamOverview / PokemonCard chain doesn't need
  // to know about the new override-vs-default split. Per-card explicit
  // values still win — that logic lives inside `effectiveMega`.
  const resolvedMegaStates = useMemo(() => {
    if (!analysis) return undefined;
    const out: Record<number, boolean> = {};
    for (let i = 0; i < analysis.pokemon.length; i++) {
      out[i] = effectiveMega(i);
    }
    return out;
  }, [analysis, effectiveMega]);

  // Whether the team contains at least one Mega-capable Pokemon, used
  // to decide if the Form segment of the floating display pill should
  // appear. Already-Mega imports (Kangaskhan-Mega, etc.) don't count
  // because they can't be flipped to base form via this control.
  // State + lazy import rather than a memo: mega-detect pulls the dex subset
  // (~130KB raw), which must stay out of the homepage's initial bundle.
  const [hasMegaCapable, setHasMegaCapable] = useState(false);
  useEffect(() => {
    // Mega Evolutions only exist in the Champions format (Reg M-A). When
    // an explicit non-M-A regulation is set (Reg F/G/H/I etc.) Megas can't
    // be used, so we hide the global Display pill and any Mega controls
    // entirely. Undefined regulation falls through to the content check
    // so legacy reports without a regulation tag don't lose Mega support.
    if (!analysis || (tags?.regulation && !isChampionsFormat(tags.regulation))) {
      setHasMegaCapable(false);
      return;
    }
    let cancelled = false;
    void import("@/lib/utils/mega-detect").then(({ detectMegaFromItem }) => {
      // The pill drives the per-card Mega flip — which itself requires an
      // actual Mega Stone equipped. An already-Mega species name without
      // its Stone (e.g. `Kangaskhan-Mega @ Sitrus Berry`) can't flip in
      // battle, so we don't surface the toggle for it here either.
      if (!cancelled) {
        setHasMegaCapable(
          analysis.pokemon.some((p) => !!detectMegaFromItem(p.parsed.item, p.parsed.species)),
        );
      }
    });
    return () => {
      cancelled = true;
    };
  }, [analysis, tags?.regulation]);

  // ── Load draft from ?draft=ID ─────────────────────────────────────
  const draftLoaded = useRef(false);
  useEffect(() => {
    if (draftLoaded.current || analysis || isSharePending) return;
    const params = new URLSearchParams(window.location.search);
    const draftId = params.get("draft");
    if (!draftId) return;
    draftLoaded.current = true;
    fetch(`/api/user/drafts?id=${draftId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const draft = data?.drafts?.[0];
        if (draft?.data?.paste) {
          // Remove ?draft= from URL
          const url = new URL(window.location.href);
          url.searchParams.delete("draft");
          window.history.replaceState({}, "", url.pathname + url.search);
          // loadDraft restores the full draft state (paste + teamName +
          // tournamentName + summary + notes + calcs + plans + tags + …),
          // not just the paste like the old handleAnalyze path did.
          loadDraft(draft.data as import("@/lib/sharing/url-codec").ShareableState, draft.id);
        }
      })
      .catch(() => {});
  }, [analysis, isSharePending, loadDraft]);

  // ── Load Champions sample team from ?sample=ID ────────────────────
  // Triggered by "Try this team" buttons on the /champions page.
  // Loads the pre-built paste directly — no server round-trip needed.
  const sampleLoaded = useRef(false);
  useEffect(() => {
    if (sampleLoaded.current || analysis || isSharePending) return;
    const params = new URLSearchParams(window.location.search);
    const sampleId = params.get("sample");
    if (!sampleId) return;
    sampleLoaded.current = true;
    const sampleTeam = CHAMPIONS_SAMPLE_TEAMS.find((t) => t.id === sampleId);
    if (!sampleTeam) return;
    // Remove ?sample= from URL so the paste can be freely edited
    const url = new URL(window.location.href);
    url.searchParams.delete("sample");
    window.history.replaceState({}, "", url.pathname + url.search);
    // Load the paste — marks it as a sample team so it doesn't persist
    // to localStorage or auto-draft (same flag as the SAMPLE_PASTE path).
    setPaste(sampleTeam.paste);
    handleAnalyze(sampleTeam.paste);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis, isSharePending]);

  // ── Version comparison state ────────────────────────────────────
  const [versionDiff, setVersionDiff] = useState<VersionDiff | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const comparingVersion = versionDiff?.version ?? null;

  const handleCompareVersion = useCallback(async (version: number) => {
    const shareId = activeShareId || sessionShareId;
    if (!shareId) return;

    setCompareLoading(true);
    try {
      const res = await fetch(`/api/share/${shareId}/versions/${version}`);
      if (!res.ok) { setCompareLoading(false); return; }
      const { data: oldData, editorName: versionEditor } = await res.json() as { data: ShareableState; editorName?: string | null };

      // Build current state for comparison using the single canonical
      // buildShareState() from the hook. Hand-rolling it here (as before) drifted
      // from the source of truth and omitted hiddenSlides/templateId/privateFields/
      // genTheme, producing inaccurate version diffs (Finding 5.3).
      const currentState: ShareableState = buildShareState();

      const diff = computeVersionDiff(
        currentState,
        oldData,
        version,
        analysis?.pokemon.length ?? 0,
        speciesKeys,
        plans.length,
        versionEditor
      );
      setVersionDiff(diff);
    } catch {
      // ignore
    } finally {
      setCompareLoading(false);
    }
  }, [activeShareId, sessionShareId, buildShareState, plans, analysis, speciesKeys]);

  const handleClearCompare = useCallback(() => {
    setVersionDiff(null);
  }, []);

  // ── PDF Export state ─────────────────────────────────────────
  const [isPdfPrinting, setIsPdfPrinting] = useState(false);
  const [exportMode, setExportMode] = useState<ExportMode>("all-slides");
  const [exportTheme, setExportTheme] = useState<"light" | "dark">(darkMode ? "dark" : "light");
  const [showExportThemePicker, setShowExportThemePicker] = useState(false);
  const [pendingExportMode, setPendingExportMode] = useState<ExportMode | null>(null);
  const exportThemeDialogRef = useRef<HTMLDivElement>(null);

  // Move focus into the export theme modal when it opens so keyboard users
  // and screen readers start inside the dialog (WCAG 2.1 AA — focus management).
  useEffect(() => {
    if (!showExportThemePicker) return;
    const dialog = exportThemeDialogRef.current;
    if (!dialog) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
    const frame = requestAnimationFrame(() => focusable()[0]?.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowExportThemePicker(false);
        return;
      }
      if (event.key !== "Tab") return;

      const controls = focusable();
      if (controls.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      dialog.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [showExportThemePicker]);

  const handleExportTeam = useCallback(() => {
    if (!analysis) return;
    const pasteText = teamToShowdown(analysis.pokemon.map((p) => p.parsed));
    navigator.clipboard.writeText(pasteText);
  }, [analysis]);

  // ── PokéPaste creation: OTS (Open Team Sheet, no EVs/IVs/nature) and
  //    CTS (Closed Team Sheet, full spread). Both upload to pokepast.es
  //    via our API proxy and return a shareable URL.
  const [pokepasteCreating, setPokepasteCreating] = useState<null | "ots" | "cts">(null);
  const [pokepasteError, setPokepasteError] = useState<string | null>(null);

  const handleCreatePokepaste = useCallback(
    async (mode: "ots" | "cts") => {
      if (!analysis || pokepasteCreating) return;
      setPokepasteCreating(mode);
      setPokepasteError(null);
      try {
        const parsed = analysis.pokemon.map((p) => p.parsed);
        const pasteText =
          mode === "ots" ? teamToOpenSheet(parsed) : teamToShowdown(parsed);
        const baseTitle = tournamentName || teamName || "VGC Team";
        const title = mode === "ots" ? `${baseTitle} (Open Team Sheet)` : baseTitle;
        const url = await createPokePaste({
          paste: pasteText,
          title,
          author: creatorName || undefined,
        });
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // Clipboard may be unavailable (iframe, insecure ctx) — still open tab
        }
        window.open(url, "_blank", "noopener,noreferrer");
      } catch (err) {
        setPokepasteError(
          err instanceof Error ? err.message : "Failed to create PokéPaste",
        );
      } finally {
        setPokepasteCreating(null);
      }
    },
    [analysis, tournamentName, teamName, creatorName, pokepasteCreating],
  );

  const handleExportPdf = useCallback((mode: ExportMode = "all-slides") => {
    // Tournament exports get a theme picker; all-slides uses current theme
    if (mode === "tournament-evs" || mode === "tournament-stats") {
      setPendingExportMode(mode);
      setExportTheme(darkMode ? "dark" : "light");
      setShowExportThemePicker(true);
      return;
    }
    setExportMode(mode);
    setIsPdfPrinting(true);
  }, [darkMode]);

  const confirmExportTheme = useCallback(() => {
    if (!pendingExportMode) return;
    setExportMode(pendingExportMode);
    setShowExportThemePicker(false);
    setPendingExportMode(null);
    setIsPdfPrinting(true);
  }, [pendingExportMode]);

  useEffect(() => {
    if (!isPdfPrinting) return;
    // Wait for the print container to render, then either trigger the
    // browser print dialog (all-slides → PDF via window.print) or capture
    // the container as a PNG (tournament-evs / tournament-stats).
    let cancelled = false;

    const finish = async () => {
      if (cancelled) return;
      const container = document.getElementById("print-container");
      const mode = exportMode;
      if (mode === "tournament-evs" || mode === "tournament-stats") {
        try {
          if (container) {
            const { exportAsImage } = await import("@/lib/utils/export-report");
            const stem = tournamentName || teamName || "vgc-team";
            const suffix = mode === "tournament-stats" ? "team-sheet-stats" : "team-sheet-evs";
            await exportAsImage(container, `${stem}-${suffix}`);
          }
        } catch (err) {
          console.error("Failed to export tournament sheet as PNG", err);
        } finally {
          if (!cancelled) setIsPdfPrinting(false);
        }
      } else {
        window.print();
        if (!cancelled) setIsPdfPrinting(false);
      }
    };

    const waitForContent = () => {
      const container = document.getElementById("print-container");
      if (!cancelled && container && container.children.length > 0) {
        // Content rendered — wait for all images to finish loading
        const images = Array.from(container.querySelectorAll("img"));
        const unloaded = images.filter((img) => !img.complete);
        if (unloaded.length > 0) {
          // Wait for remaining images
          let loaded = 0;
          const checkDone = () => {
            loaded++;
            if (!cancelled && loaded >= unloaded.length) {
              setTimeout(() => { if (!cancelled) finish(); }, 200);
            }
          };
          unloaded.forEach((img) => {
            img.addEventListener("load", checkDone, { once: true });
            img.addEventListener("error", checkDone, { once: true });
          });
          // Safety timeout — finish anyway after 3s even if images fail
          setTimeout(() => { if (!cancelled) finish(); }, 3000);
        } else {
          // All images already loaded
          setTimeout(() => { if (!cancelled) finish(); }, 200);
        }
      } else if (!cancelled) {
        requestAnimationFrame(waitForContent);
      }
    };
    requestAnimationFrame(waitForContent);
    return () => { cancelled = true; };
  }, [isPdfPrinting, exportMode, tournamentName, teamName]);

  const versionDiffContextValue = useMemo(() => ({
    diff: versionDiff,
    loading: compareLoading,
    clearDiff: handleClearCompare,
  }), [versionDiff, compareLoading, handleClearCompare]);

  const diffChanges = useMemo(() => {
    if (!versionDiff || versionDiff.changedFields.size === 0) return [];
    const pCount = analysis?.pokemon.length ?? 0;
    return getNavigableChanges(versionDiff, pCount, speciesKeys, plans.length);
  }, [versionDiff, analysis, speciesKeys, plans.length]);

  const handleDiffNavigate = useCallback((change: DiffChange) => {
    goToSlide(change.slide);
  }, [goToSlide]);

  // Long-press a Pokemon card in overview → jump to its detail slide.
  // Logical layout (nothing hidden): 0 overview · 1 common-modes ·
  // 2.. pokemon, so pokemon #index lives at logical index + 2.
  const handlePokemonLongPress = useCallback((index: number) => goToSlide(index + 2), [goToSlide]);

  // Re-import: replace team paste and re-analyze
  const handleUpdatePaste = useCallback((newPaste: string) => {
    setPaste(newPaste);
    handleAnalyze(newPaste);
  }, [setPaste, handleAnalyze]);

  // Inline replace: swap a single Pokemon's species in-place (preserves
  // moves / item / EVs / IVs / nature on that block) so users can fix a
  // typo or change one slot without re-pasting the whole team.
  const handleReplacePokemon = useCallback((index: number, newSpecies: string) => {
    const next = replacePokemonSpecies(paste, index, newSpecies);
    if (next === paste) return;
    setPaste(next);
    handleAnalyze(next);
  }, [paste, setPaste, handleAnalyze]);

  // Swipe navigation for mobile
  const swipeRef = useSwipeNavigation({
    onSwipeLeft: nextSlide,
    onSwipeRight: prevSlide,
    onDoubleTap: nextSlide,
    enabled: !!analysis,
  });

  // Restore the correct accent theme once a team is loaded. The random
  // landing-page accent and the creator-provided shared theme both get
  // reconciled here so the viewer sees the report in the appearance the
  // creator built it in — not whatever random color happened to apply
  // during the paste screen.
  useEffect(() => {
    if (!analysis) return;
    // On shared views, pin to the creator's gen theme (if saved into the
    // share). On own-view, release any prior override so the viewer's own
    // theme takes over.
    if (isSharedView && sharedState?.genTheme) {
      setViewOverrideTheme(sharedState.genTheme as GenTheme);
    } else {
      setViewOverrideTheme(null);
    }
    // Wipe inline random-accent styles from the landing page, then
    // re-apply the effective theme (creator's override or viewer's own).
    // Without this reapply the inline wipe falls through to raw CSS
    // defaults and ignores the viewer/creator theme entirely.
    clearRandomAccent();
    reapplyCurrentTheme();
  }, [analysis, isSharedView, sharedState?.genTheme]);

  // Release the theme override when the viewer leaves the shared view
  // so their own stored theme comes back.
  useEffect(() => {
    if (!isSharedView) {
      setViewOverrideTheme(null);
    }
    return () => setViewOverrideTheme(null);
  }, [isSharedView]);

  // Restore the "duplicate CTA dismissed" flag for the current share so a
  // viewer who closed the banner once never sees it again on the same
  // report. Resets when navigating to a different share id (or away from
  // a shared view) so the next team gets a fresh chance to prompt.
  useEffect(() => {
    if (!isSharedView || !activeShareId) {
      setShareCtaDismissed(false);
      return;
    }
    // localStorage may be blocked — readStorage returns null, so this falls back to in-session state.
    setShareCtaDismissed(readStorage(STORAGE_KEY_BUILDERS.shareCtaDismissed(activeShareId)) === "1");
  }, [isSharedView, activeShareId]);

  const [viewCount, setViewCount] = useState(0);
  const viewTracked = useRef(false);

  // Track view count for shared public reports (once only)
  useEffect(() => {
    if (!isSharedView || !activeShareId || viewTracked.current) return;
    viewTracked.current = true;
    posthog?.capture("report_viewed", { share_id: activeShareId });
    const sessionId = getSessionId();
    if (!sessionId) return;
    fetch(`/api/views/${activeShareId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.viewCount) setViewCount(data.viewCount); })
      .catch(() => {});
  }, [isSharedView, activeShareId]);

  // Open share modal when a share completes with a public URL
  const prevShareStatus = useRef(shareStatus);
  useEffect(() => {
    if (prevShareStatus.current === "copying" && shareStatus === "copied" && lastShareResult?.publicUrl) {
      setShowShareModal(true);
    }
    prevShareStatus.current = shareStatus;
  }, [shareStatus, lastShareResult]);

  // Read-only viewers (guests or logged-in non-owners) can open the share sheet
  // for someone else's report without hitting the server. The URL comes from
  // the active share ID — no state is modified on the server.
  const isViewerOnly = isSharedView && !isEditingUnlocked;
  const handleViewerShare = useCallback(() => {
    if (!activeShareId) return;
    const url = `${window.location.origin}/s/${activeShareId}`;
    openShareSheetForUrl(url);
    setShowShareModal(true);
  }, [activeShareId, openShareSheetForUrl]);

  const teamSpecies = analysis?.pokemon.map((p) => p.parsed.species) ?? [];

  // Slide reorder logic — determine if current slide is a reorderable Pokemon or matchup plan
  const pokemonCount = analysis?.pokemon.length ?? 0;
  const plansCount = plans.length;
  // Physical slide layout (after inserting Common Modes at index 1):
  //   0 overview · 1 common-modes · 2..pokemonCount+1 pokemon ·
  //   pokemonCount+2 speed · +3 offensive · +4 defensive ·
  //   pokemonCount+5..+plans matchup plans · last matchup sheet
  const firstPokemonPhys = 2;
  const lastPokemonPhys = pokemonCount + 1;
  const firstMatchupPhys = pokemonCount + 5;
  const isPokemonSlide = physicalSlide >= firstPokemonPhys && physicalSlide <= lastPokemonPhys;
  const isMatchupPlanSlide = physicalSlide >= firstMatchupPhys && physicalSlide < firstMatchupPhys + plansCount;

  const canMoveSlideUp = creatorMode && (
    (isPokemonSlide && physicalSlide > firstPokemonPhys) ||
    (isMatchupPlanSlide && physicalSlide > firstMatchupPhys)
  );
  const canMoveSlideDown = creatorMode && (
    (isPokemonSlide && physicalSlide < lastPokemonPhys) ||
    (isMatchupPlanSlide && physicalSlide < firstMatchupPhys + plansCount - 1)
  );

  const handleMoveSlideUp = useCallback(() => {
    if (isPokemonSlide) {
      const pokemonIdx = physicalSlide - firstPokemonPhys;
      reorderPokemon(pokemonIdx, pokemonIdx - 1);
    } else if (isMatchupPlanSlide) {
      const planIdx = physicalSlide - firstMatchupPhys;
      reorderPlans(planIdx, planIdx - 1);
    }
  }, [isPokemonSlide, isMatchupPlanSlide, physicalSlide, firstPokemonPhys, firstMatchupPhys, reorderPokemon, reorderPlans]);

  const handleMoveSlideDown = useCallback(() => {
    if (isPokemonSlide) {
      const pokemonIdx = physicalSlide - firstPokemonPhys;
      reorderPokemon(pokemonIdx, pokemonIdx + 1);
    } else if (isMatchupPlanSlide) {
      const planIdx = physicalSlide - firstMatchupPhys;
      reorderPlans(planIdx, planIdx + 1);
    }
  }, [isPokemonSlide, isMatchupPlanSlide, physicalSlide, firstPokemonPhys, firstMatchupPhys, reorderPokemon, reorderPlans]);

  // Scroll to top of slide content when navigating between slides
  // Skip during walkthrough — the overlay handles its own scroll positioning
  useEffect(() => {
    if (walkthroughActive) return;
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [physicalSlide, walkthroughActive]);

  // Fork: server-side copy linked back to the original via forked_from_id
  const [forkStatus, setForkStatus] = useState<"idle" | "forking" | "error">("idle");
  const handleForkReport = useCallback(async () => {
    if (!activeShareId || forkStatus === "forking") return;
    if (!isSignedIn) {
      // Route to sign-in flow; Clerk modal will handle the rest.
      // After sign-in the user can click Fork again.
      posthog?.capture("fork_attempted_signed_out", { source_id: activeShareId });
      return;
    }
    setForkStatus("forking");
    posthog?.capture("report_fork_clicked", { source_id: activeShareId });
    try {
      const result = await forkReport(activeShareId);
      if (!result) {
        setForkStatus("error");
        setTimeout(() => setForkStatus("idle"), 3000);
        return;
      }
      // Account ownership is sufficient; never put edit credentials in URLs.
      // Use a full navigation so useShareUrl re-runs cleanly against the new id.
      window.location.href = `/s/${result.id}`;
    } catch {
      setForkStatus("error");
      setTimeout(() => setForkStatus("idle"), 3000);
    }
  }, [activeShareId, forkStatus, isSignedIn, forkReport]);

  // Show paste input if no analysis and not loading shared view
  if (!analysis && !sharedState && !isSharePending) {
    return (
      <main className="min-h-screen">
        <PasteInput
          sprites={sprites}
          steps={steps}
          feedback={feedback}
          paste={paste}
          onPasteChange={setPaste}
          onAnalyze={handleAnalyze}
          selectedTemplate={pendingTemplateId}
          onTemplateSelect={setPendingTemplateId}
        />
        <LimitlessImport onImport={importTeam} />
      </main>
    );
  }

  // Legacy collaboration links no longer authorize access. Prompt the visitor
  // to use the account that owns the report or has accepted an invitation.
  if (!analysis && isSharePending && editKeyFromUrl && authLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-5 animate-fade-in text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
            <UsersIcon width="28" height="28" className="text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">Sign in to continue</h2>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
              Use the account that owns this report or has accepted a collaborator invitation. A link alone never grants edit access.
            </p>
          </div>
          <SignUpButton mode="modal">
            <button className="w-full px-6 py-2.5 bg-accent text-accent-foreground text-sm font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-md shadow-accent/25">
              Sign up to collaborate
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="text-sm font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer">
              Already have an account? Sign in
            </button>
          </SignInButton>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- shared reports render on "/?s=…", so going home needs a full load to reset the report state */}
          <a href="/" className="inline-flex min-h-11 items-center text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors mt-1">
            or go to home page
          </a>
        </div>
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
              onClick={handleDecodeFailed}
              className="mt-2 px-5 py-2 bg-accent text-accent-foreground rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors"
            >
              {t.buildYourOwn}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-5xl animate-fade-in px-4">
            {/* Skeleton: Tournament info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="skeleton h-7 w-48" />
              <div className="skeleton h-6 w-20" />
              <div className="skeleton h-6 w-16" />
            </div>
            {/* Skeleton: Team summary */}
            <div className="skeleton h-32 w-full mb-8 rounded-xl" />
            {/* Skeleton: Pokemon grid */}
            <SharedReportSkeletonCards />
            <p className="text-center text-text-tertiary text-sm mt-6">{t.loadingSharedTeam}</p>
          </div>
        )}
      </main>
    );
  }

  const collaborationSections = [
    { key: "overview", label: "Team overview" },
    ...speciesKeys.map((key, index) => ({ key: `pokemon:${key}`, label: analysis?.pokemon[index]?.parsed.species ?? key })),
    ...plans.map((plan, index) => ({ key: matchupSectionKey(plan.opponentPaste), label: `Matchup: ${plan.opponentLabel || index + 1}` })),
  ].filter((item, index, items) => items.findIndex((other) => other.key === item.key) === index);
  const activeCollaborationSection = isPokemonSlide ? `pokemon:${speciesKeys[physicalSlide - firstPokemonPhys]}`
    : isMatchupPlanSlide ? matchupSectionKey(plans[physicalSlide - firstMatchupPhys].opponentPaste) : "overview";

  // Show report
  return (
    <>
    <main className={`bg-background ${isPresentationStyle ? "h-dvh h-screen overflow-y-auto" : "min-h-dvh min-h-screen"}`} style={{ scrollPaddingTop: "var(--nav-height)" }}>
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
        autoSaveStatus={autoSaveStatus}
        draftSaveStatus={draftSaveStatus}
        draftSaveError={draftSaveError}
        onSaveDraft={saveDraft}
        collaborators={collaborators}
        syncStatus={syncStatus}
        isSampleTeam={isSampleTeam}
        shareStatus={shareStatus}
        shareButtonText={shareButtonText}
        lastShareResult={lastShareResult}
        onShareClick={handleShareClick}
        onReshare={handleReshare}
        onViewerShare={handleViewerShare}
        creatorRequired={creatorRequired}
        isOwner={isOwner}
        activeShareId={activeShareId}
        sessionShareId={sessionShareId}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        comparingVersion={comparingVersion}
        onCompareVersion={handleCompareVersion}
        onClearCompareVersion={handleClearCompare}
        compareLoading={compareLoading}
        onExportPdf={analysis ? handleExportPdf : undefined}
        onExportPokepaste={analysis ? handleExportTeam : undefined}
        onCreatePokepaste={analysis ? handleCreatePokepaste : undefined}
        pokepasteCreating={pokepasteCreating}
        onOpenOTSSheet={analysis ? () => setShowOTSSheet(true) : undefined}
        tournamentMode={tournamentMode}
        onSetTournamentMode={analysis ? setTournamentMode : undefined}
        onShowShortcuts={setShowShortcutHint}
        onSetCreatorMode={setCreatorMode}
        onSetPresentationMode={setPresentationMode}
        onEditPresentation={() => {
          // Owner pencil: leave presentation mode AND turn editing on in one
          // gesture. Without explicitly setting creator mode here, the
          // useLayoutEffect that restores creatorMode on present-exit only
          // does so when it was true before entering — but on auto-present
          // owners enter presentation before owner-edit could engage, so the
          // captured value is false. Forcing it true here is the contract.
          setPresentationMode(false);
          setCreatorMode(true);
        }}
        onReset={handleReset}
        onStartTour={!presentationMode ? startWalkthrough : undefined}
      />

      {/* Welcome-back banner — shown when paste was restored from localStorage.
          Signed-in only: its "Get my link" CTA calls handleShareClick, which
          hard-requires an account — for guests the button silently failed AND
          dismissed the banner, while the logged-out banner below simultaneously
          said publishing needs sign-in. Guests get that banner instead. */}
      {wasRestored && !isSharedView && analysis && isSignedIn && (
        <WelcomeBackBanner onShare={handleShareClick} onDismiss={dismissRestoreBanner} />
      )}

      {/* Logged-out banner — draft is local-only, signing in is required to publish.
          Shown whenever there's an analysis but no authenticated user. Distinct
          from the restore banner so the messaging is explicit about the local
          nature of the draft and what sign-in unlocks. */}
      {authLoaded && !isSignedIn && analysis && !isSharedView && (
        <SignedOutDraftBanner />
      )}

      {/* URL length warning */}
      {urlWarning && (
        <UrlWarningBanner message={urlWarning} />
      )}

      {/* Version comparison floating navigator */}
      {versionDiff && diffChanges.length > 0 && (
        <DiffNavigator
          changes={diffChanges}
          onNavigate={handleDiffNavigate}
          onDismiss={handleClearCompare}
          version={versionDiff.version}
          editorName={versionDiff.editorName}
        />
      )}
      {versionDiff && diffChanges.length === 0 && (
        <NoVersionDiffToast version={versionDiff.version} onDismiss={handleClearCompare} />
      )}

      {/* Report content */}
      <VersionDiffProvider value={versionDiffContextValue}>
      <div
        ref={swipeRef}
        role="region"
        aria-roledescription="report slide"
        aria-label={`${slideLabels[currentSlide] ?? "Team report"}, slide ${currentSlide + 1} of ${totalSlides}`}
        aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
        className={`max-w-5xl mx-auto slide-content overflow-x-hidden min-h-[calc(100dvh-var(--nav-height)-var(--bottom-nav-height,3.5rem))] sm:min-h-0 sm:h-[calc(100dvh-var(--nav-height)-var(--bottom-nav-height,3.5rem))] sm:overflow-y-auto sm:scrollbar-thin pb-[calc(7rem+env(safe-area-inset-bottom,0px))] sm:pb-16 ${
          isPresentationStyle
            ? "px-3 sm:px-8 py-2 sm:py-4"
            : "px-2 sm:px-6 lg:px-8 py-2 sm:py-6 creator:px-8 creator:py-6"
        }`}
        key={tournamentMode ? "tournament" : physicalSlide}
        style={tournamentMode ? undefined : { viewTransitionName: "slide" }}
      >
        {/*
          VGC-259: every slide needs an <h1>. TeamOverview owns the visible h1 on
          slide 0 (read-only view), so this sr-only heading covers every other
          slide — and tournament mode, which replaces the slide body entirely.
          Visually hidden on purpose: the slides already render their own visible
          titles, so a visible h1 would duplicate them on screen.
        */}
        {(tournamentMode || physicalSlide !== 0) && (
          <h1 className="sr-only">
            {`${tournamentMode ? "Tournament Mode" : (slideLabels[currentSlide] ?? "Team report")}${teamName ? ` — ${teamName}` : ""}`}
          </h1>
        )}
        {tournamentMode ? (
          <TournamentMode
            analysis={analysis!}
            speciesKeys={speciesKeys}
            getSpriteConfig={getSpriteConfig}
            regulation={tags?.regulation}
          />
        ) : (
        <>
        {/* Fork attribution banner — shown on any report that was forked from another */}
        {isSharedView && forkedFrom && (
          <ForkAttributionBanner forkedFrom={forkedFrom} />
        )}
        {/* Hidden slide banner for creator */}
        {creatorMode && isSlideHiddenAt(physicalSlide) && (
          <HiddenSlideBanner
            title={t.thisSlideIsHidden}
            description={t.hiddenSlideDescription}
            showLabel={t.showSlide}
            onShow={handleToggleCurrentSlide}
          />
        )}
        {isEditingUnlocked && activeShareId && <CollaborationWorkspace shareId={activeShareId} activeSection={activeCollaborationSection} sections={collaborationSections} />}
        {collaborationConflict && <CollaborationConflict local={{ ...buildShareState(), allowComments }} remote={collaborationConflict.state} onResolve={resolveCollaborationConflict} />}
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
          commonModes={commonModes}
          onCommonModesChange={isReadOnly ? undefined : setCommonModes}
          teamName={teamName}
          onTeamNameChange={setTeamName}
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
          tags={tags}
          onTagsChange={setTags}
          isReadOnly={isReadOnly}
          isPresentationMode={isPresentationStyle}
          plans={plans}
          onGamePlanNotesChange={updateGamePlanNotes}
          onGamePlanBringChange={updateGamePlanBring}
          onReorderGamePlanBring={reorderGamePlanBring}
          onGamePlanResultChange={updateGamePlanResult}
          onReorderPlans={reorderPlans}
          onAddGamePlan={addGamePlan}
          onRemoveGamePlan={removeGamePlan}
          onRemovePlan={removePlan}
          onAddPlan={addPlan}
          getSpriteConfig={getSpriteConfig}
          onReorderPokemon={isReadOnly ? undefined : reorderPokemon}
          onPokemonLongPress={handlePokemonLongPress}
          onUpdatePaste={isReadOnly ? undefined : handleUpdatePaste}
          onUpdateSpread={isReadOnly ? undefined : (index, spread, reasoning) => {
            handleUpdatePaste(replacePokemonSpread(paste, index, spread));
            const key = speciesKeys[index];
            setNote(key, [notes[key], reasoning].filter(Boolean).join("\n\n"));
          }}
          onReplacePokemon={isReadOnly ? undefined : handleReplacePokemon}
          megaStates={resolvedMegaStates}
          onToggleMega={isReadOnly ? undefined : toggleMega}
          privateFields={privateFields}
          onPrivateFieldsChange={isReadOnly ? undefined : setPrivateFields}
          redactedFields={isSharedView && !isOwner ? sharedRedactedFields : undefined}
        />
        </>
        )}

      {/* Social engagement section for public shared reports — inside scroll container so desktop users can reach it */}
      {isSharedView && !isEditingUnlocked && !isPresentationStyle && activeShareId && (
        <div className="relative z-40 max-w-5xl mx-auto px-2 sm:px-4 py-6 mb-24 sm:mb-16 space-y-4">
          {/* Creator info + secondary actions */}
          <SharedReportActions
            creatorName={creatorName}
            collaboratorNames={collaboratorNames}
            viewCount={viewCount}
            isOwner={isOwner}
            isPublic={isPublic}
            isUnlisted={isUnlisted}
            warnings={warnings}
            onSetVisibility={handleSetVisibility}
            isSignedIn={isSignedIn}
            forkStatus={forkStatus}
            onFork={handleForkReport}
          />
          {allowComments ? (
            <CommentSection shareId={activeShareId} canModerate={isEditingUnlocked} />
          ) : (
            <CommentsDisabledNotice />
          )}

          {/* End-of-report: downloadable Spotify-Wrapped style team card.
              Placed at the emotional peak (after the team has been seen)
              rather than mid-scroll. (VGC-141) */}
          <TeamCardCTA shareId={activeShareId} hasTournament={!!(placement || tournamentName)} />

          {/* End-of-report conversion CTA — fires after the user has seen all
              slides (isLast) so they've already consumed the value. Only shown
              to non-owner guests; owners see the creator toolbar instead. */}
          {isLast && !isOwner && !endOfReportCtaDismissed && (
            <EndOfReportCta isSignedIn={isSignedIn} onDismiss={() => setEndOfReportCtaDismissed(true)} />
          )}
        </div>
      )}

      </div>
      </VersionDiffProvider>

      {/* Slide navigation — hidden in tournament mode */}
      {!tournamentMode && (
        <SlideNavControls
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          isFirst={isFirst}
          isLast={isLast}
          onPrev={prevSlide}
          onNext={nextSlide}
          onGoTo={goToSlide}
          slideLabels={slideLabels}
          // Bottom nav stays locked + visible at all times (even in
          // presentation mode). Report navigation is non-obvious, so the tab
          // bar must always be discoverable — and the old hover-to-reveal
          // auto-hide was unusable on touch devices anyway (no hover to bring
          // it back). Keeping it pinned is the safer, clearer default.
          autoHide={false}
          hiddenStates={creatorMode ? slideHiddenStates : undefined}
          onToggleHide={creatorMode ? handleToggleCurrentSlide : undefined}
          isCurrentHidden={creatorMode ? isSlideHiddenAt(physicalSlide) : false}
          onShowShortcuts={() => setShowShortcutHint(true)}
          canMoveUp={canMoveSlideUp}
          canMoveDown={canMoveSlideDown}
          onMoveUp={handleMoveSlideUp}
          onMoveDown={handleMoveSlideDown}
          changedSlides={versionDiff?.changedSlides}
          visibleIndices={visibleIndices}
          allSlideKeys={allSlideKeys}
          // Mega (Base/Mega) display toggle now lives inside the bottom-nav
          // overflow sheet instead of a standing floating pill, so shared
          // (/s/) views carry zero permanent overlays. Only surfaced when the
          // team has a Mega-capable Pokemon and we're not in a focused mode.
          displayToggle={
            hasMegaCapable && !isPresentationStyle && !tournamentMode && !isPdfPrinting
              ? {
                  hasMega: true,
                  mode: (globalMegaDefault ?? true) ? "mega" : "base",
                  onChange: (m) => setGlobalMegaDefaultAndReset(m === "mega"),
                }
              : undefined
          }
        />
      )}

      {/* Edit mode FAB for mobile (shared views with edit access) */}
      <EditFab
        creatorMode={creatorMode}
        onToggle={() => setCreatorMode(!creatorMode)}
        visible={isSharedView && isEditingUnlocked && !isPresentationStyle}
      />

      {/* Pull-to-refresh for PWA shared views */}
      <PullToRefresh
        enabled={isSharedView && !isPresentationStyle}
        onRefresh={async () => {
          // Trigger a re-fetch by reloading the page in shared views
          window.location.reload();
        }}
      />

      {/* Swipe hint for mobile (one-time) */}
      <SwipeHint />

      {/* Collaborator management (owner only) + Edit changelog (all editors) */}
      {isSharedView && isEditingUnlocked && activeShareId && (
        <div className="max-w-5xl mx-auto px-2 sm:px-4">
          {isOwner && <CollaboratorPanel shareId={activeShareId} />}
          <EditChangelog shareId={activeShareId} />
        </div>
      )}

      {/* First-visit tour offer — non-blocking, clears the slide nav and swipe hint */}
      {walkthroughIsFirstTime && (
        <TourOfferPrompt onStart={startWalkthrough} onDismiss={dismissWalkthroughPrompt} />
      )}

      {/* Walkthrough overlay */}
      {walkthroughActive && walkthroughStep && (
        <WalkthroughOverlay
          step={walkthroughStep}
          stepIndex={walkthroughStepIndex}
          totalSteps={walkthroughTotalSteps}
          onNext={walkthroughNext}
          onPrev={walkthroughPrev}
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

      {/* Share modal — social share options */}
      {showShareModal && lastShareResult?.publicUrl && (
        <ShareModal
          publicUrl={lastShareResult.publicUrl}
          reportId={activeShareId ?? sessionShareId ?? undefined}
          teamSpecies={teamSpecies}
          showdownPaste={analysis ? teamToShowdown(analysis.pokemon.map((p) => p.parsed)) : undefined}
          rentalCode={rentalCode}
          teamName={teamName}
          tournamentName={tournamentName}
          creatorName={creatorName}
          placement={placement}
          isPublic={isPublic}
          isUnlisted={isUnlisted}
          isOwner={isOwner}
          viewerMode={isViewerOnly}
          onTogglePublic={handleSetPublic}
          onSetVisibility={handleSetVisibility}
          allowComments={allowComments}
          onToggleComments={(v) => {
            setAllowComments(v);
            handleSetPublic(isPublic); // trigger save to persist allowComments
          }}
          onClose={() => setShowShareModal(false)}
          tags={tags}
          warnings={warnings}
          publishError={publishError}
          onClearPublishError={clearPublishError}
        />
      )}

      {/* Visual OTS Sheet modal */}
      {showOTSSheet && analysis && (
        <OTSSheetModal
          pokemon={analysis.pokemon.map((p) => p.parsed)}
          shareUrl={activeShareId ? `${typeof window !== "undefined" ? window.location.origin : "https://pokemonvgcteamreport.com"}/s/${activeShareId}` : undefined}
          tournamentName={tournamentName}
          teamName={teamName}
          regulation={tags?.regulation}
          eventType={tags?.eventType}
          onClose={() => setShowOTSSheet(false)}
        />
      )}

      {/* Outside presentation mode, double-tap keeps the social "like"
          gesture. Presentation reserves double-tap for advancing the deck,
          so the two mobile interactions never fire together. */}
      {isSharedView && activeShareId && (
        <DoubleTapLikeOverlay
          shareId={activeShareId}
          isOwner={isOwner}
          enabled={!!analysis && !isPresentationStyle}
        />
      )}

      {/* CTA banner for shared views (read-only viewers) — Notion-style
          "Duplicate this team" prompt. Anonymous viewers see a sign-in
          modal; signed-in viewers fork directly. (VGC-140) */}
      {isSharedView && !isEditingUnlocked && !isPresentationStyle && !shareCtaDismissed && !isOwner && (
        <ShareViewCTA
          isSignedIn={!!isSignedIn}
          onDuplicate={handleForkReport}
          onAnonymousIntent={() => {
            if (activeShareId) {
              posthog?.capture("share_view_duplicate_anonymous", { source_id: activeShareId });
            }
          }}
          onDismiss={() => {
            setShareCtaDismissed(true);
            if (activeShareId) {
              // Storage may be blocked (private browsing, full disk, etc.);
              // dismissal still applies in-session via React state.
              writeStorage(STORAGE_KEY_BUILDERS.shareCtaDismissed(activeShareId), "1");
            }
          }}
          busy={forkStatus === "forking"}
        />
      )}

    </main>

    {/* Export theme picker modal for tournament exports */}
    {showExportThemePicker && (
      <ExportThemePickerModal
        dialogRef={exportThemeDialogRef}
        exportTheme={exportTheme}
        onSelectTheme={setExportTheme}
        pendingExportMode={pendingExportMode}
        onConfirm={confirmExportTheme}
        onClose={() => setShowExportThemePicker(false)}
      />
    )}

    {/* PokéPaste creation error toast */}
    {pokepasteError && (
      <PokepasteErrorToast message={pokepasteError} onDismiss={() => setPokepasteError(null)} />
    )}

    {/* Portal print container to body so CSS selector body > *:not(#print-container) works */}
    {isPdfPrinting && analysis && createPortal(
      <div
        id="print-container"
        className="fixed left-[-9999px] top-0 w-[210mm] print:static print:left-auto print:w-auto"
        aria-hidden="true"
        data-export-theme={exportTheme}
        style={printContainerStyle(exportMode, exportTheme)}
      >
        <PrintableReport
          analysis={analysis}
          notes={notes}
          calcs={calcs}
          roles={roles}
          speciesKeys={speciesKeys}
          teamSummary={summary}
          tournamentName={tournamentName}
          placement={placement}
          record={record}
          rentalCode={rentalCode}
          creatorName={creatorName}
          mvpIndex={mvpIndex}
          tags={tags}
          plans={plans}
          getSpriteConfig={getSpriteConfig}
          exportMode={exportMode}
        />
      </div>,
      document.body
    )}
    </>
  );
}
