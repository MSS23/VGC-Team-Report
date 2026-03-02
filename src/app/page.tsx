"use client";

import { useMemo, useEffect, useRef, useCallback, useState } from "react";
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
import { useTheme, GEN_THEMES } from "@/hooks/useTheme";
import { PasteInput } from "@/components/input/PasteInput";
import { TeamReport } from "@/components/report/TeamReport";
import { SlideNavControls } from "@/components/report/SlideNavControls";
import { WalkthroughOverlay } from "@/components/ui/WalkthroughOverlay";
import { ShortcutHintOverlay } from "@/components/ui/ShortcutHintOverlay";
import { QrCodeModal } from "@/components/ui/QrCodeModal";
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
  const { genTheme, setGenTheme } = useTheme();
  const { isSharedView, sharedState, copyShareUrl, shareStatus, urlWarning, decodeFailed, exitSharedView, lastShareUrl, dismissQr } = useShareUrl();
  const { slideRef, exportAsPng, exportAllSlides, exportStatus, exportProgress } = useExportSlide();
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
    toggleAllAnimated,
    allAnimated,
    setSettingsFull: setSpriteSettingsFull,
  } = useSpriteSettings(speciesKeys, spriteDefaults, !isSharedView);

  // Individual matchup slides only shown in creator mode (not shared view)
  const showMatchupSlides = creatorMode && !isSharedView;
  // Plans that have their own dedicated slide (showSlide defaults to true)
  const visibleSlidePlans = plans.filter((p) => p.showSlide !== false);

  // Total slides: Overview + 6 Pokemon + Speed Tiers + (N visible matchup plans if creator) + 1 matchup sheet
  const totalSlides = analysis
    ? analysis.pokemon.length + 2 + (showMatchupSlides ? visibleSlidePlans.length : 0) + 1
    : 0;

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
      "Team Analysis",
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
      spriteSettings: Object.keys(spriteOverrides).length > 0 ? spriteOverrides : undefined,
    });
  }, [analysis, paste, notes, calcs, roles, summary, tournamentName, placement, record, mvpIndex, rentalCode, plans, speciesKeys, getSpriteConfig, copyShareUrl]);

  // Share completeness check: require Creator Mode, team summary, and notes for every Pokemon
  const missingForShare = useMemo(() => {
    if (!analysis) return [];
    const missing: string[] = [];
    if (!creatorMode) missing.push("Enable Creator Mode");
    if (!summary.trim()) missing.push("Add a team summary");
    const emptyNotes = speciesKeys.filter((k) => !notes[k]?.trim());
    if (emptyNotes.length > 0) missing.push(`Add notes for ${emptyNotes.length} Pokemon`);
    return missing;
  }, [analysis, creatorMode, summary, notes, speciesKeys]);

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
              <button
                type="button"
                onClick={toggleAllAnimated}
                title={allAnimated ? "Switch all to static sprites" : "Switch all to animated GIFs"}
                aria-label={allAnimated ? "Switch all to static sprites" : "Switch all to animated GIFs"}
                className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  allAnimated
                    ? "bg-accent/15 text-accent border-accent/30"
                    : "bg-surface-alt text-text-tertiary border-border-subtle hover:text-text-secondary hover:border-border"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span className="hidden sm:inline">GIF</span>
              </button>
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
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={toggleAllAnimated}
                title={allAnimated ? "Switch all to static sprites" : "Switch all to animated GIFs"}
                aria-label={allAnimated ? "Switch all to static sprites" : "Switch all to animated GIFs"}
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg border transition-all duration-200 sm:flex sm:items-center sm:gap-1.5 ${
                  allAnimated
                    ? "bg-accent/15 text-accent border-accent/30"
                    : "bg-surface-alt text-text-tertiary border-border-subtle hover:text-text-secondary hover:border-border"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span className="hidden sm:inline text-xs font-semibold">GIF</span>
              </button>
              <Toggle
                checked={darkMode}
                onChange={setDarkMode}
                label={darkMode ? "Dark" : "Light"}
              />
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
                disabled={!canShare || shareStatus === "copying"}
                data-walkthrough="share-button"
                title={!canShare ? missingForShare.join(" · ") : undefined}
              >
                {shareButtonText}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportAsPng(`slide-${currentSlide + 1}.png`)}
                title="Export slide as image"
                aria-label="Export slide as image"
                className="text-text-secondary hover:text-text-primary hidden sm:inline-flex"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportAllSlides(totalSlides, goToSlide, slideLabels)}
                disabled={exportStatus === "exporting-all"}
                title="Export all slides as ZIP"
                aria-label="Export all slides as ZIP"
                className="text-text-secondary hover:text-text-primary hidden sm:inline-flex"
              >
                {exportStatus === "exporting-all" ? (
                  <span className="text-xs tabular-nums">{exportProgress.current}/{exportProgress.total}</span>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                )}
              </Button>
              <button
                onClick={startWalkthrough}
                title="Help & walkthrough"
                aria-label="Help and walkthrough"
                className="w-7 h-7 items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors text-sm font-medium hidden sm:flex"
              >
                ?
              </button>

              {/* Global GIF toggle: icon-only on mobile, icon+text on sm+ */}
              <button
                type="button"
                onClick={toggleAllAnimated}
                title={allAnimated ? "Switch all to static sprites" : "Switch all to animated GIFs"}
                aria-label={allAnimated ? "Switch all to static sprites" : "Switch all to animated GIFs"}
                className={`sm:hidden p-1.5 rounded-lg border transition-all duration-200 ${
                  allAnimated
                    ? "bg-accent/15 text-accent border-accent/30"
                    : "bg-surface-alt text-text-tertiary border-border-subtle"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
              <button
                type="button"
                onClick={toggleAllAnimated}
                title={allAnimated ? "Switch all to static sprites" : "Switch all to animated GIFs"}
                aria-label={allAnimated ? "Switch all to static sprites" : "Switch all to animated GIFs"}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  allAnimated
                    ? "bg-accent/15 text-accent border-accent/30"
                    : "bg-surface-alt text-text-tertiary border-border-subtle hover:text-text-secondary hover:border-border"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                GIF
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
                            : "brightness-[0.3] grayscale opacity-50 group-hover:brightness-100 group-hover:grayscale-0 group-hover:opacity-80 group-hover:scale-105"
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
                  aria-label={creatorMode ? "Disable Creator Mode" : "Enable Creator Mode"}
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
                aria-label="Start presentation"
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
        className={`max-w-7xl mx-auto pb-20 slide-content ${
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

      {/* Keyboard shortcut hint overlay (presentation mode) */}
      <ShortcutHintOverlay
        visible={showShortcutHint}
        onDismiss={() => setShowShortcutHint(false)}
      />

      {/* QR code modal (after share) */}
      {lastShareUrl && (
        <QrCodeModal url={lastShareUrl} onDismiss={dismissQr} />
      )}
    </main>
  );
}
