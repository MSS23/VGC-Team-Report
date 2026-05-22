"use client";

import { Suspense, useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { useHomePage } from "@/hooks/useHomePage";
import { useSwipeNavigation } from "@/hooks/useSwipeNavigation";
import { CHAMPIONS_SAMPLE_TEAMS } from "@/data/champions-sample-teams";
import { PasteInput } from "@/components/input/PasteInput";
import { TeamReport } from "@/components/report/TeamReport";
import { TeamCardCTA } from "@/components/report/TeamCardCTA";
import { TournamentMode } from "@/components/report/TournamentMode";
import { SlideNavControls } from "@/components/report/SlideNavControls";
import { WalkthroughOverlay } from "@/components/ui/WalkthroughOverlay";
import { ShortcutHintOverlay } from "@/components/ui/ShortcutHintOverlay";
import { ShareViewCTA } from "@/components/ui/ShareViewCTA";
import { SwipeHint } from "@/components/ui/SwipeHint";
import { EditFab } from "@/components/ui/EditFab";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { Navbar } from "@/components/layout/Navbar";
import { SaveButton } from "@/components/social/SaveButton";
const DoubleTapLikeOverlay = dynamic(() => import("@/components/social/DoubleTapLikeOverlay").then(m => ({ default: m.DoubleTapLikeOverlay })), { ssr: false });
import { CreatorLink } from "@/components/social/CreatorLink";
import { ViewCount } from "@/components/social/ViewCount";
const EditChangelog = dynamic(() => import("@/components/social/EditChangelog").then(m => ({ default: m.EditChangelog })));
const CollaboratorPanel = dynamic(() => import("@/components/social/CollaboratorPanel").then(m => ({ default: m.CollaboratorPanel })));
import { getSessionId } from "@/lib/utils/session-id";
import { clearRandomAccent } from "@/lib/utils/random-accent";
import { setViewOverrideTheme, reapplyCurrentTheme, type GenTheme } from "@/hooks/useTheme";
import { teamToShowdown, teamToOpenSheet } from "@/lib/utils/export-paste";
import { createPokePaste } from "@/lib/utils/pokepaste";
import { replacePokemonSpecies } from "@/lib/utils/paste-edit";
import { I18nProvider } from "@/lib/i18n";
import { FAQPageJsonLd, HowToSchema } from "@/components/seo/JsonLd";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { VersionDiffProvider } from "@/lib/contexts/VersionDiffContext";
import { computeVersionDiff, summarizeChangedFields, getNavigableChanges, type VersionDiff, type DiffChange } from "@/lib/utils/version-diff";
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
import { DisplayTogglePill } from "@/components/display/DisplayTogglePill";
import { useGlobalDisplayPrefs } from "@/lib/hooks/useGlobalDisplayPrefs";
import { detectMegaFromItem } from "@/lib/utils/mega-detect";

const HOW_TO_STEPS = [
  {
    name: "Export your team",
    text: "Open Pokémon Showdown or PokéPaste and export your team as a text paste (Showdown format).",
  },
  {
    name: "Paste your team into VGC Team Report",
    text: "Go to pokemonvgcteamreport.com, paste your Showdown export or PokéPaste URL into the input field, and click Analyze.",
  },
  {
    name: "Add notes, damage calcs, and speed tiers",
    text: "Fill in your team overview, per-Pokémon role notes, key damage calculations, and speed tier comparisons using the built-in editor.",
  },
  {
    name: "Add matchup plans",
    text: "Document your matchup plans against common threats and tournament meta picks so viewers understand your game plan.",
  },
  {
    name: "Share your report",
    text: "Click the Share button to generate a permanent public link. Optionally publish it to the Explore page so the community can discover your report.",
  },
];

export default function Home() {
  return (
    <I18nProvider>
      <FAQPageJsonLd />
      <HowToSchema steps={HOW_TO_STEPS} />
      <Suspense>
        <HomeContent />
      </Suspense>
    </I18nProvider>
  );
}

function HomeContent() {
  const posthog = usePostHog();
  const {
    t,
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
    exitSharedView,
    isEditingUnlocked,
    isOwner,
    sharedRedactedFields,
    lastShareResult,
    openShareSheetForUrl,
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
    handleSetPublic,
    isUnlisted,
    handleSetVisibility,
    publishError,
    clearPublishError,
    creatorRequired,
    allowComments,
    setAllowComments,
    autoSaveStatus,
    collaboratorNames,
    collaborators,
    syncStatus,
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
    megaStates,
    toggleMega,
    globalMegaDefault,
    setGlobalMegaDefaultAndReset,
    effectiveMega,
    hasMegaOverrides,
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
    canUndo,
    canRedo,
    handleUndo,
    handleRedo,
    pendingTemplateId,
    setPendingTemplateId,
    handleAnalyze,
    loadDraft,
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

  // ── Global display prefs ─────────────────────────────────────────
  // First-run discovery pulse for the floating Display pill. Mega default
  // lives on the team meta itself so it travels with shared reports.
  const { hasSeenPill, markPillSeen } = useGlobalDisplayPrefs();

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
  const hasMegaCapable = useMemo(() => {
    if (!analysis) return false;
    // Mega Evolutions only exist in the Champions format (Reg M-A). When
    // an explicit non-M-A regulation is set (Reg F/G/H/I etc.) Megas can't
    // be used, so we hide the global Display pill and any Mega controls
    // entirely. Undefined regulation falls through to the content check
    // so legacy reports without a regulation tag don't lose Mega support.
    if (tags?.regulation && tags.regulation !== "Reg M-A") return false;
    // The pill drives the per-card Mega flip — which itself requires an
    // actual Mega Stone equipped. An already-Mega species name without
    // its Stone (e.g. `Kangaskhan-Mega @ Sitrus Berry`) can't flip in
    // battle, so we don't surface the toggle for it here either.
    return analysis.pokemon.some((p) =>
      !!detectMegaFromItem(p.parsed.item, p.parsed.species),
    );
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
          loadDraft(draft.data as import("@/lib/sharing/url-codec").ShareableState);
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

      // Build current state for comparison
      const currentState: ShareableState = {
        paste,
        notes,
        calcs,
        roles,
        teamSummary: summary || undefined,
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
          showSlide: p.showSlide,
          gamePlans: p.gamePlans?.map((gp) => ({
            bring: gp.bring,
            notes: gp.notes,
            replays: gp.replays,
            result: gp.result,
          })),
        })),
        tags: tags && (tags.archetype?.length || tags.regulation || tags.eventType) ? tags : undefined,
      };

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
  }, [activeShareId, sessionShareId, paste, notes, calcs, roles, summary, teamName, tournamentName, placement, record, mvpIndex, rentalCode, creatorName, plans, tags, analysis, speciesKeys]);

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
    const firstFocusable = dialog.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
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

  // Long-press a Pokemon card in overview → jump to its detail slide
  const handlePokemonLongPress = useCallback((index: number) => goToSlide(index + 1), [goToSlide]);

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
    try {
      const stored = localStorage.getItem(`vgc-share-cta-dismissed:${activeShareId}`);
      setShareCtaDismissed(stored === "1");
    } catch {
      // localStorage may be blocked — fall back to in-session state.
      setShareCtaDismissed(false);
    }
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
  const isPokemonSlide = physicalSlide >= 1 && physicalSlide <= pokemonCount;
  const isMatchupPlanSlide = physicalSlide >= pokemonCount + 2 && physicalSlide < pokemonCount + 2 + plansCount;

  const canMoveSlideUp = creatorMode && (
    (isPokemonSlide && physicalSlide > 1) ||
    (isMatchupPlanSlide && physicalSlide > pokemonCount + 2)
  );
  const canMoveSlideDown = creatorMode && (
    (isPokemonSlide && physicalSlide < pokemonCount) ||
    (isMatchupPlanSlide && physicalSlide < pokemonCount + 1 + plansCount)
  );

  const handleMoveSlideUp = useCallback(() => {
    if (isPokemonSlide) {
      const pokemonIdx = physicalSlide - 1;
      reorderPokemon(pokemonIdx, pokemonIdx - 1);
    } else if (isMatchupPlanSlide) {
      const planIdx = physicalSlide - (pokemonCount + 2);
      reorderPlans(planIdx, planIdx - 1);
    }
  }, [isPokemonSlide, isMatchupPlanSlide, physicalSlide, pokemonCount, reorderPokemon, reorderPlans]);

  const handleMoveSlideDown = useCallback(() => {
    if (isPokemonSlide) {
      const pokemonIdx = physicalSlide - 1;
      reorderPokemon(pokemonIdx, pokemonIdx + 1);
    } else if (isMatchupPlanSlide) {
      const planIdx = physicalSlide - (pokemonCount + 2);
      reorderPlans(planIdx, planIdx + 1);
    }
  }, [isPokemonSlide, isMatchupPlanSlide, physicalSlide, pokemonCount, reorderPokemon, reorderPlans]);

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
      // Navigate to the new fork with the edit key so the user lands in edit mode.
      // Use a full navigation so useShareUrl re-runs cleanly against the new id.
      window.location.href = `/s/${result.id}?key=${result.editToken}`;
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
          paste={paste}
          onPasteChange={setPaste}
          onAnalyze={handleAnalyze}
          selectedTemplate={pendingTemplateId}
          onTemplateSelect={setPendingTemplateId}
        />
      </main>
    );
  }

  // Collab link sign-in gate: if ?key= present and user isn't signed in, prompt sign-in
  if (!analysis && isSharePending && editKeyFromUrl && authLoaded && !isSignedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-5 animate-fade-in text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">You&apos;ve been invited to collaborate</h2>
            <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
              Create an account or sign in to edit this team report. Your changes will sync in real time with the owner.
            </p>
          </div>
          <SignUpButton mode="modal">
            <button className="w-full px-6 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 transition-all cursor-pointer shadow-md shadow-accent/25">
              Sign up to collaborate
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="text-sm font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer">
              Already have an account? Sign in
            </button>
          </SignInButton>
          <a href="/" className="text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors mt-1">
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
              className="mt-2 px-5 py-2 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors"
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
            <p className="text-center text-text-tertiary text-sm mt-6">{t.loadingSharedTeam}</p>
          </div>
        )}
      </main>
    );
  }

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
        hasExistingShare={hasExistingShare()}
        editLinkCopied={editLinkCopied}
        onCopyEditLink={handleCopyEditLink}
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
        onExitSharedView={exitSharedView}
        onStartTour={!presentationMode ? startWalkthrough : undefined}
      />

      {/* Welcome-back banner — shown when paste was restored from localStorage */}
      {wasRestored && !isSharedView && analysis && (
        <div className="max-w-5xl mx-auto px-4 pt-2">
          <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-br from-emerald-500/10 via-accent-surface/20 to-accent/5 border border-emerald-500/30 rounded-xl animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-text-primary">
                Welcome back — we restored your team
              </p>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                Your in-progress report is still here. <span className="font-bold text-text-primary">Click Share to get a permanent link</span> so you don&apos;t lose it when you close the tab.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleShareClick();
                    dismissRestoreBanner();
                  }}
                  className="px-3 py-1.5 text-[11px] font-extrabold rounded-lg bg-accent text-white hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-accent/25"
                >
                  Get my link
                </button>
                <button
                  type="button"
                  onClick={dismissRestoreBanner}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-alt transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissRestoreBanner}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer flex-shrink-0"
              aria-label="Dismiss welcome back banner"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Logged-out banner — draft is local-only, signing in is required to publish.
          Shown whenever there's an analysis but no authenticated user. Distinct
          from the restore banner so the messaging is explicit about the local
          nature of the draft and what sign-in unlocks. */}
      {authLoaded && !isSignedIn && analysis && !isSharedView && (
        <div className="max-w-5xl mx-auto px-4 pt-2">
          <div className="flex items-start gap-3 px-4 py-3 bg-gradient-to-br from-accent/10 via-accent-surface/15 to-transparent border border-accent/30 rounded-xl animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-extrabold text-text-primary">
                This draft only lives on this device
              </p>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                Sign in to save your team report and share it with others. Without an account, your edits stay in this browser and can&apos;t be published.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <SignUpButton mode="modal">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-[11px] font-extrabold rounded-lg bg-accent text-white hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-accent/25"
                  >
                    Sign up to save
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-[11px] font-bold rounded-lg text-text-secondary hover:text-accent hover:bg-surface-alt transition-colors cursor-pointer"
                  >
                    Sign in
                  </button>
                </SignInButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* URL length warning */}
      {urlWarning && (
        <div className="max-w-5xl mx-auto px-4 pt-2">
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
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in px-4 w-full max-w-[min(calc(100vw-1rem),28rem)]">
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-1 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-900/40 px-3 py-1.5"
          >
            {/* Info icon */}
            <span className="w-8 h-8 flex items-center justify-center flex-shrink-0" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>

            {/* Label */}
            <div className="flex items-center gap-2 px-1 sm:px-2 min-w-0">
              <span className="text-xs font-semibold truncate">No differences with</span>
              <span className="text-[10px] font-bold opacity-80 whitespace-nowrap tabular-nums">
                v{versionDiff.version}
              </span>
            </div>

            {/* Divider */}
            <span className="w-px h-5 bg-white/25 mx-0.5" aria-hidden />

            {/* Dismiss */}
            <button
              type="button"
              onClick={handleClearCompare}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/15 active:scale-90 transition-all cursor-pointer flex-shrink-0"
              aria-label="Exit version comparison"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Report content */}
      <VersionDiffProvider value={versionDiffContextValue}>
      <div
        ref={swipeRef}
        className={`max-w-5xl mx-auto slide-content safe-bottom overflow-x-hidden sm:h-[calc(100dvh-var(--nav-height)-var(--bottom-nav-height,3rem))] sm:overflow-y-auto sm:scrollbar-thin pb-44 sm:pb-16 ${
          isPresentationStyle
            ? "px-3 sm:px-8 py-2 sm:py-4"
            : "px-2 sm:px-6 lg:px-8 py-2 sm:py-6 creator:px-8 creator:py-6"
        }`}
        key={tournamentMode ? "tournament" : physicalSlide}
        style={tournamentMode ? undefined : { viewTransitionName: "slide" }}
      >
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
          <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-accent/8 border border-accent/25 rounded-2xl animate-fade-in">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="18" r="3" />
                <circle cx="6" cy="6" r="3" />
                <circle cx="18" cy="6" r="3" />
                <path d="M18 9v1a2 2 0 01-2 2H8a2 2 0 01-2-2V9" />
                <line x1="12" y1="12" x2="12" y2="15" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                Forked from{" "}
                {forkedFrom.deleted ? (
                  <span className="text-text-tertiary italic">a deleted report</span>
                ) : (
                  <a
                    href={`/s/${forkedFrom.id}`}
                    className="text-accent hover:underline font-bold"
                  >
                    {forkedFrom.tournamentName
                      || (forkedFrom.creatorName ? `${forkedFrom.creatorName}'s team` : null)
                      || (forkedFrom.species.length > 0 ? forkedFrom.species.slice(0, 3).join(" / ") : "the original report")}
                  </a>
                )}
              </p>
              <p className="text-xs text-text-tertiary mt-0.5 truncate">
                {forkedFrom.deleted
                  ? "The original report is no longer available."
                  : forkedFrom.creatorName
                    ? `Original team by ${forkedFrom.creatorName}${forkedFrom.species.length > 0 ? ` — ${forkedFrom.species.slice(0, 6).join(", ")}` : ""}`
                    : forkedFrom.species.length > 0
                      ? forkedFrom.species.slice(0, 6).join(", ")
                      : "View the original to compare changes."}
              </p>
            </div>
            {!forkedFrom.deleted && (
              <a
                href={`/s/${forkedFrom.id}`}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent/15 text-accent hover:bg-accent/25 transition-colors border border-accent/20"
              >
                View original
              </a>
            )}
          </div>
        )}
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
              <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">{t.hiddenSlideDescription}</p>
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
          onReorderPokemon={isReadOnly ? undefined : reorderPokemon}
          onPokemonLongPress={handlePokemonLongPress}
          onUpdatePaste={isReadOnly ? undefined : handleUpdatePaste}
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
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            {creatorName && (
              <div className="flex items-center gap-1 flex-wrap">
                <CreatorLink name={creatorName} />
                {collaboratorNames && collaboratorNames.length > 0 && (
                  <>
                    <span className="text-xs text-text-tertiary">&amp;</span>
                    {collaboratorNames.map((name, i) => (
                      <span key={name} className="flex items-center gap-1">
                        {i > 0 && <span className="text-xs text-text-tertiary">,</span>}
                        <a
                          href={`/creator/${encodeURIComponent(name)}`}
                          className="text-xs font-semibold text-text-secondary hover:text-accent transition-colors"
                        >
                          {name}
                        </a>
                      </span>
                    ))}
                  </>
                )}
              </div>
            )}
            <ViewCount count={viewCount} />
            {isOwner && (
              <button
                type="button"
                onClick={() => {
                  if (!isPublic && !isUnlisted && warnings.length > 0) return;
                  // Cycle: private → unlisted → public → private
                  if (!isPublic && !isUnlisted) {
                    handleSetVisibility(false, true);
                  } else if (isUnlisted) {
                    if (warnings.length > 0) return;
                    handleSetVisibility(true, false);
                  } else {
                    handleSetVisibility(false, false);
                  }
                }}
                disabled={!isPublic && !isUnlisted && warnings.length > 0}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 transition-all ${
                  !isPublic && !isUnlisted && warnings.length > 0
                    ? "cursor-not-allowed opacity-50 bg-surface border-border text-text-tertiary"
                    : isPublic
                    ? "cursor-pointer bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                    : isUnlisted
                    ? "cursor-pointer bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                    : "cursor-pointer bg-surface border-border text-text-tertiary hover:border-accent/30 hover:text-accent"
                }`}
                title={
                  !isPublic && !isUnlisted && warnings.length > 0
                    ? "Fix team warnings before publishing"
                    : isPublic
                    ? "Public — click to make private"
                    : isUnlisted
                    ? "Unlisted (link only) — click to publish on Explore"
                    : "Private — click to make unlisted"
                }
              >
                {isPublic ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                  </svg>
                ) : isUnlisted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                )}
                {isPublic ? "Public" : isUnlisted ? "Unlisted" : "Private"}
              </button>
            )}
            {/* Fork button — only on public reports, and only for non-owners.
                Unlisted reports cannot be forked: possession of the link grants
                view, not the right to copy the team into a new report. */}
            {isPublic && !isOwner && (
              isSignedIn ? (
                <button
                  type="button"
                  onClick={handleForkReport}
                  disabled={forkStatus === "forking"}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border transition-all ${
                    forkStatus === "forking"
                      ? "opacity-60 cursor-wait text-text-tertiary"
                      : forkStatus === "error"
                        ? "border-rose-500/40 text-rose-500"
                        : "text-text-secondary hover:border-accent/30 hover:text-accent cursor-pointer"
                  }`}
                  title="Fork this report — copy the team, notes, calcs, and matchup plans into a new report you own. The new report will link back to this one."
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="18" r="3" />
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="18" cy="6" r="3" />
                    <path d="M18 9v1a2 2 0 01-2 2H8a2 2 0 01-2-2V9" />
                    <line x1="12" y1="12" x2="12" y2="15" />
                  </svg>
                  {forkStatus === "forking"
                    ? "Forking…"
                    : forkStatus === "error"
                      ? "Fork failed"
                      : "Fork Report"}
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border-2 bg-surface border-border text-text-secondary hover:border-accent/30 hover:text-accent transition-all cursor-pointer"
                    title="Sign in to fork this report into your own editable copy"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="18" r="3" />
                      <circle cx="6" cy="6" r="3" />
                      <circle cx="18" cy="6" r="3" />
                      <path d="M18 9v1a2 2 0 01-2 2H8a2 2 0 01-2-2V9" />
                      <line x1="12" y1="12" x2="12" y2="15" />
                    </svg>
                    Fork Report
                  </button>
                </SignInButton>
              )
            )}
            {!isOwner && <SaveButton shareId={activeShareId} />}
          </div>
          {allowComments ? (
            <CommentSection shareId={activeShareId} editToken={editKeyFromUrl ?? undefined} />
          ) : (
            <div className="flex items-center gap-2 px-4 py-3 bg-surface-alt/50 border border-border rounded-xl text-xs text-text-tertiary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                <line x1="9" y1="9" x2="15" y2="15" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
              <span>Comments are turned off by the creator.</span>
            </div>
          )}

          {/* End-of-report: downloadable Spotify-Wrapped style team card.
              Placed at the emotional peak (after the team has been seen)
              rather than mid-scroll. (VGC-141) */}
          <TeamCardCTA shareId={activeShareId} hasTournament={!!(placement || tournamentName)} />

          {/* End-of-report conversion CTA — fires after the user has seen all
              slides (isLast) so they've already consumed the value. Only shown
              to non-owner guests; owners see the creator toolbar instead. */}
          {isLast && !isOwner && !endOfReportCtaDismissed && (
            <div className="flex items-center justify-between gap-3 px-4 py-3.5 bg-gradient-to-br from-accent/10 via-accent-surface/15 to-transparent border border-accent/25 rounded-2xl animate-fade-in">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary">You&apos;ve reached the end!</p>
                  <p className="text-xs text-text-secondary mt-0.5 hidden sm:block">
                    Build your own team report — add notes, calcs, matchup plans, and share it with the community.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isSignedIn ? (
                  <a
                    href="/"
                    className="px-3.5 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30"
                  >
                    Create yours
                  </a>
                ) : (
                  <SignUpButton mode="modal">
                    <button
                      type="button"
                      className="px-3.5 py-2 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30 cursor-pointer"
                    >
                      Sign up free
                    </button>
                  </SignUpButton>
                )}
                <button
                  type="button"
                  onClick={() => setEndOfReportCtaDismissed(true)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
                  aria-label="Dismiss"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
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
          autoHide={presentationMode}
          hiddenStates={creatorMode ? slideHiddenStates : undefined}
          onToggleHide={creatorMode ? handleToggleCurrentSlide : undefined}
          isCurrentHidden={creatorMode ? isSlideHiddenAt(physicalSlide) : false}
          onShowShortcuts={() => setShowShortcutHint(true)}
          canMoveUp={canMoveSlideUp}
          canMoveDown={canMoveSlideDown}
          onMoveUp={handleMoveSlideUp}
          onMoveDown={handleMoveSlideDown}
          changedSlides={versionDiff?.changedSlides}
        />
      )}

      {/* Floating display options pill — global Mega toggle.
          Visibility gates inside the component itself, but we still skip
          rendering during tournament/print/presentation modes since those
          have their own focused layouts. */}
      <DisplayTogglePill
        hasMegaCapable={hasMegaCapable}
        globalMegaDefault={globalMegaDefault}
        // Use the combined handler so tapping Base/Mega on the pill
        // always normalizes the team by clearing per-card overrides.
        onGlobalMegaChange={setGlobalMegaDefaultAndReset}
        hasMegaOverrides={hasMegaOverrides}
        hasSeenPill={hasSeenPill}
        onMarkSeen={markPillSeen}
        hidden={isPresentationStyle || tournamentMode || isPdfPrinting}
        // Lift above the read-only viewer CTA so the pill doesn't
        // cover the "Create yours" button. Must mirror the exact
        // visibility condition of <ShareViewCTA> above.
        liftAboveCta={
          isSharedView &&
          !isEditingUnlocked &&
          !isPresentationStyle &&
          !shareCtaDismissed
        }
      />

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
          <EditChangelog shareId={activeShareId} editToken={editKeyFromUrl ?? undefined} />
        </div>
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
          onClose={() => setShowOTSSheet(false)}
        />
      )}

      {/* Instagram-style double-tap to like — listens window-wide for two
          quick presses and bursts a heart at the tap location. Active on
          BOTH presentation and non-presentation shared views (so viewers
          can still react while the deck is open). Owners and the landing
          page are filtered out inside the component. */}
      {isSharedView && activeShareId && (
        <DoubleTapLikeOverlay
          shareId={activeShareId}
          isOwner={isOwner}
          enabled={!!analysis}
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
              try {
                localStorage.setItem(`vgc-share-cta-dismissed:${activeShareId}`, "1");
              } catch {
                // Storage may be blocked (private browsing, full disk, etc.);
                // dismissal still applies in-session via React state.
              }
            }
          }}
          busy={forkStatus === "forking"}
        />
      )}

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
                type="button"
                onClick={() => setShowEditUrl(false)}
                aria-label="Dismiss edit link toast"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0 cursor-pointer"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
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

    {/* Export theme picker modal for tournament exports */}
    {showExportThemePicker && (
      /* eslint-disable-next-line jsx-a11y/no-static-element-interactions */
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={() => setShowExportThemePicker(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setShowExportThemePicker(false);
        }}
      >
        <div
          ref={exportThemeDialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-theme-modal-title"
          className="bg-surface border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <h3
              id="export-theme-modal-title"
              className="text-lg font-extrabold text-text-primary"
            >
              Export Theme
            </h3>
            <p className="text-xs text-text-tertiary mt-1">
              Choose how your team sheet looks
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Light option */}
            <button
              type="button"
              onClick={() => setExportTheme("light")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                exportTheme === "light"
                  ? "border-accent bg-accent/5 shadow-md"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <div className="w-14 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <span className="text-sm font-bold text-text-primary">Light</span>
            </button>

            {/* Dark option */}
            <button
              type="button"
              onClick={() => setExportTheme("dark")}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                exportTheme === "dark"
                  ? "border-accent bg-accent/5 shadow-md"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <div className="w-14 h-10 rounded-lg bg-[#0B0B1A] border border-[#2A2A52] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F0EDE6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-text-primary">Dark</span>
            </button>
          </div>

          <button
            type="button"
            onClick={confirmExportTheme}
            className="w-full py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors cursor-pointer"
          >
            Download PNG {pendingExportMode === "tournament-stats" ? "(Stats)" : "(EVs)"}
          </button>
        </div>
      </div>
    )}

    {/* PokéPaste creation error toast */}
    {pokepasteError && (
      <div
        role="alert"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-4 py-3 rounded-xl bg-danger text-white text-sm font-bold shadow-2xl animate-fade-in max-w-sm"
      >
        PokéPaste error: {pokepasteError}
        <button
          type="button"
          onClick={() => setPokepasteError(null)}
          className="ml-3 underline decoration-white/70 decoration-2 underline-offset-2 hover:decoration-white"
        >
          Dismiss
        </button>
      </div>
    )}

    {/* Portal print container to body so CSS selector body > *:not(#print-container) works */}
    {isPdfPrinting && analysis && createPortal(
      <div
        id="print-container"
        className="fixed left-[-9999px] top-0 w-[210mm] print:static print:left-auto print:w-auto"
        aria-hidden="true"
        data-export-theme={exportTheme}
        style={(exportMode === "tournament-evs" || exportMode === "tournament-stats") ? {
          backgroundColor: exportTheme === "dark" ? "#0B0B1A" : "#FAF9F6",
          padding: "16px",
          colorAdjust: "exact",
          WebkitPrintColorAdjust: "exact",
          printColorAdjust: "exact",
          ...exportTheme === "dark" ? {
            "--background": "#0B0B1A", "--foreground": "#F0EDE6",
            "--surface": "#141428", "--surface-alt": "#1C1C38",
            "--border": "#2A2A52", "--border-subtle": "#222244",
            "--text-primary": "#F0EDE6", "--text-secondary": "#C0C0D8", "--text-tertiary": "#9898B8",
            "--accent": "#FB7185", "--accent-light": "#FDA4AF", "--accent-surface": "#3B1525",
            "--color-background": "#0B0B1A", "--color-foreground": "#F0EDE6",
            "--color-surface": "#141428", "--color-surface-alt": "#1C1C38",
            "--color-border": "#2A2A52", "--color-border-subtle": "#222244",
            "--color-text-primary": "#F0EDE6", "--color-text-secondary": "#C0C0D8", "--color-text-tertiary": "#9898B8",
            "--color-accent": "#FB7185", "--color-accent-light": "#FDA4AF", "--color-accent-surface": "#3B1525",
          } as React.CSSProperties : {
            "--background": "#FAF9F6", "--foreground": "#1A1A2E",
            "--surface": "#FFFFFF", "--surface-alt": "#F2F0EB",
            "--border": "#E0DDD5", "--border-subtle": "#F0EDE6",
            "--text-primary": "#1A1A2E", "--text-secondary": "#4A4A68", "--text-tertiary": "#6E6E8A",
            "--accent": "#E11D48", "--accent-light": "#FDA4AF", "--accent-surface": "#FFF1F2",
            "--color-background": "#FAF9F6", "--color-foreground": "#1A1A2E",
            "--color-surface": "#FFFFFF", "--color-surface-alt": "#F2F0EB",
            "--color-border": "#E0DDD5", "--color-border-subtle": "#F0EDE6",
            "--color-text-primary": "#1A1A2E", "--color-text-secondary": "#4A4A68", "--color-text-tertiary": "#6E6E8A",
            "--color-accent": "#E11D48", "--color-accent-light": "#FDA4AF", "--color-accent-surface": "#FFF1F2",
          } as React.CSSProperties,
        } : undefined}
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