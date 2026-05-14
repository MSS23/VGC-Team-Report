"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { Toggle } from "@/components/ui/Toggle";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useTranslation } from "@/lib/i18n";
import { GEN_THEMES } from "@/hooks/useTheme";
import type { GenTheme } from "@/hooks/useTheme";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { VersionHistoryPanel } from "@/components/social/VersionHistoryPanel";
import { hapticLight, hapticMedium } from "@/lib/utils/haptics";

interface NavbarProps {
  // Mode flags
  isPresentationStyle: boolean;
  isSharedView: boolean;
  isEditingUnlocked: boolean;
  creatorMode: boolean;

  // Slide info
  currentSlide: number;
  totalSlides: number;
  slideLabels: string[];

  // Tournament info
  tournamentName?: string;
  placement?: string;
  record?: string;

  // Dark mode
  darkMode: boolean;
  onDarkModeChange: (v: boolean) => void;

  // Theme
  genTheme: GenTheme;
  onGenThemeChange: (id: GenTheme) => void;

  // Warnings / save indicator
  warnings: string[];
  saveFlash: boolean;
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";

  // Collaborative sync
  collaborators?: number;
  syncStatus?: string;

  // Share
  isSampleTeam?: boolean;
  shareStatus: string;
  shareButtonText: string;
  lastShareResult?: { updated?: boolean; editUrl?: string } | null;
  onShareClick: () => void;
  onReshare: () => void;
  onViewerShare?: () => void;
  creatorRequired?: boolean;

  // Ownership
  isOwner: boolean;
  activeShareId?: string | null;
  sessionShareId?: string | null;

  // Edit link
  hasExistingShare: boolean;
  editLinkCopied: boolean;
  onCopyEditLink: () => void;

  // Undo / redo
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: () => boolean;
  canRedo?: () => boolean;

  // Version comparison
  comparingVersion?: number | null;
  onCompareVersion?: (version: number) => void;
  onClearCompareVersion?: () => void;
  compareLoading?: boolean;

  // Export
  onExportPdf?: (mode?: "all-slides" | "tournament-evs" | "tournament-stats") => void;
  onExportPokepaste?: () => void;
  onCreatePokepaste?: (mode: "ots" | "cts") => void;
  pokepasteCreating?: null | "ots" | "cts";
  onOpenOTSSheet?: () => void;

  // Tournament mode
  tournamentMode?: boolean;
  onSetTournamentMode?: (v: boolean) => void;

  // Actions
  onShowShortcuts: (v: boolean) => void;
  onSetCreatorMode: (v: boolean) => void;
  onSetPresentationMode: (v: boolean) => void;
  onReset: () => void;
  onExitSharedView: () => void;

  // Tour
  onStartTour?: () => void;
}

function getWarningFix(warning: string): string {
  if (warning.includes("EV total") && warning.includes("exceeds")) {
    return "Reduce EVs so the total is 508 or less. Each stat only gains from multiples of 4 EVs, so the usable max is 508 (e.g. 252/252/4).";
  }
  if (warning.includes("No moves found")) {
    return "Add moves to this Pokemon in your PokePaste (lines starting with \"- \").";
  }
  if (warning.includes("No ability specified")) {
    return "Add an \"Ability:\" line to this Pokemon in your PokePaste.";
  }
  return "Check your PokePaste for formatting issues.";
}

function WarningPopover({ warnings, label }: { warnings: string[]; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative hidden sm:inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="text-xs font-bold text-warning hover:text-warning/80 cursor-pointer underline decoration-dotted underline-offset-2 transition-colors"
      >
        {label}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-72 rounded-lg border border-border bg-surface shadow-lg p-3 space-y-2.5">
          {warnings.map((w, i) => {
            const fix = getWarningFix(w);
            return (
              <div key={i} className="text-xs">
                <div className="flex items-start gap-1.5">
                  <span className="text-warning shrink-0 mt-px">&#9888;</span>
                  <span className="font-semibold text-text-primary">{w}</span>
                </div>
                <p className="text-text-tertiary mt-0.5 ml-5">{fix}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Navbar(props: NavbarProps) {
  const {
    isPresentationStyle, isSharedView, isEditingUnlocked, creatorMode,
    currentSlide, totalSlides, slideLabels,
    tournamentName, placement, record,
    darkMode, onDarkModeChange,
    genTheme, onGenThemeChange,
    warnings, saveFlash, autoSaveStatus,
    collaborators, syncStatus,
    isSampleTeam,
    shareStatus, shareButtonText, lastShareResult,
    onShareClick, onReshare, onViewerShare, creatorRequired,
    isOwner, activeShareId, sessionShareId,
    hasExistingShare, editLinkCopied, onCopyEditLink,
    onUndo, onRedo, canUndo, canRedo,
    comparingVersion, onCompareVersion, onClearCompareVersion, compareLoading,
    onExportPdf, onExportPokepaste, onCreatePokepaste, pokepasteCreating, onOpenOTSSheet,
    tournamentMode, onSetTournamentMode,
    onShowShortcuts, onSetCreatorMode, onSetPresentationMode,
    onReset, onExitSharedView, onStartTour,
  } = props;

  const { t } = useTranslation();
  const { isLoaded, isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
  const [pasteCopied, setPasteCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Derive the effective share ID for version history
  const versionShareId = (activeShareId && isOwner) ? activeShareId : sessionShareId;
  const canShowVersionHistory = !!versionShareId;

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const isLocalDraft = !isSharedView && !isPresentationStyle;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Wait for Clerk to load before showing auth UI to prevent flash
  const showSignIn = isLoaded && !isSignedIn;
  const showUser = isLoaded && isSignedIn;

  return (
    <>
    <header
      className={`sticky top-0 z-40 backdrop-blur-2xl backdrop-saturate-150 border-b transition-all duration-200 sticky-header-standalone ${
        isPresentationStyle
          ? "bg-transparent border-transparent"
          : scrolled
            ? "bg-surface/90 border-border/60 shadow-lg shadow-black/5"
            : "bg-surface/80 border-border/60 shadow-[0_1px_12px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className="max-w-5xl mx-auto px-2.5 sm:px-6 py-1 sm:py-2.5 flex items-center justify-between gap-1 sm:gap-2">

        {/* ── Left ── */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink-0">
          {isLocalDraft ? (
            <>
              <Button variant="ghost" size="sm" onClick={onReset}>
                <span className="hidden sm:inline">&larr; {t.newTeam}</span>
                <span className="sm:hidden">&larr;</span>
              </Button>
              {warnings.length > 0 && (
                <WarningPopover warnings={warnings} label={`${warnings.length} ${warnings.length > 1 ? t.warningsPlural : t.warnings}`} />
              )}
              <span className={`text-xs font-bold text-emerald-500 hidden sm:inline transition-opacity duration-300 ${saveFlash ? "opacity-100" : "opacity-0"}`}>
                {t.saved}
              </span>
              {creatorMode && onUndo && onRedo && (
                <span className="hidden sm:inline-flex items-center gap-0.5 ml-1">
                  <button
                    type="button"
                    onClick={onUndo}
                    disabled={canUndo ? !canUndo() : true}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                    title="Undo (Ctrl+Z)"
                    aria-label="Undo (Ctrl+Z)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H8" /><polyline points="7 14 3 10 7 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onRedo}
                    disabled={canRedo ? !canRedo() : true}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                    title="Redo (Ctrl+Shift+Z)"
                    aria-label="Redo (Ctrl+Shift+Z)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10H11a5 5 0 00-5 5v0a5 5 0 005 5h5" /><polyline points="17 14 21 10 17 6" />
                    </svg>
                  </button>
                </span>
              )}
            </>
          ) : isSharedView && !isPresentationStyle ? (
            <a href="/" className="flex items-center gap-1 font-bold text-xs sm:text-sm hover:opacity-80 transition-opacity">
              <span className="text-text-primary">VGC</span>
              <span className="text-accent">Report</span>
            </a>
          ) : isPresentationStyle ? (
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {tournamentName && (
                <>
                  <span className="font-extrabold text-text-primary truncate tracking-tight">{tournamentName}</span>
                  {placement && (
                    <span className="text-xs font-extrabold text-accent bg-accent-surface px-2.5 py-0.5 rounded-md flex-shrink-0">{placement}</span>
                  )}
                </>
              )}
              <span className="font-semibold text-text-primary truncate hidden sm:inline">{slideLabels[currentSlide]}</span>
              <span className="text-text-tertiary font-[family-name:var(--font-mono)] font-bold tabular-nums flex-shrink-0">{currentSlide + 1}/{totalSlides}</span>
            </div>
          ) : null}
        </div>

        {/* ── Center: slide info (not presentation) ── */}
        {!isPresentationStyle && (
          <>
            {/* Desktop center */}
            <div className="hidden md:flex items-center gap-2 text-sm text-text-secondary min-w-0">
              {tournamentName && (
                <>
                  <span className="font-extrabold text-text-primary truncate tracking-tight">{tournamentName}</span>
                  {placement && (
                    <span className="text-xs font-extrabold text-accent bg-accent-surface px-2.5 py-0.5 rounded-md flex-shrink-0">{placement}</span>
                  )}
                  {record && (
                    <span className="text-text-tertiary font-semibold flex-shrink-0">({record})</span>
                  )}
                  <span className="text-text-tertiary">&middot;</span>
                </>
              )}
              <span className="font-semibold text-text-primary truncate">{slideLabels[currentSlide]}</span>
              <span className="text-text-tertiary font-[family-name:var(--font-mono)] font-bold tabular-nums">{currentSlide + 1}/{totalSlides}</span>
              {isSharedView && isEditingUnlocked && (
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex-shrink-0 uppercase tracking-wider">
                  {t.editing}
                </span>
              )}
              {isSharedView && isEditingUnlocked && autoSaveStatus && autoSaveStatus !== "idle" && (
                <button
                  type="button"
                  onClick={canShowVersionHistory ? () => setVersionPanelOpen(true) : undefined}
                  className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 transition-colors ${
                    canShowVersionHistory ? "cursor-pointer hover:brightness-110" : ""
                  } ${
                    autoSaveStatus === "saving" ? "text-text-tertiary bg-surface-alt/60"
                      : autoSaveStatus === "saved" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                      : "text-red-500 bg-red-500/10"
                  }`}
                  title={canShowVersionHistory ? "Open version history" : undefined}
                >
                  {autoSaveStatus === "saving" && <span className="w-2.5 h-2.5 border-[1.5px] border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin" />}
                  {autoSaveStatus === "saving" ? "Saving..." : autoSaveStatus === "saved" ? "Saved" : "Save failed"}
                  {autoSaveStatus === "saved" && canShowVersionHistory && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5 opacity-60">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                  )}
                </button>
              )}
              {isSharedView && isEditingUnlocked && collaborators !== undefined && collaborators > 1 && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 text-blue-600 dark:text-blue-400 bg-blue-500/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  {collaborators} editing
                </span>
              )}
            </div>

            {/* Mobile center */}
            <div className="md:hidden flex items-center justify-center min-w-0 overflow-hidden flex-1 gap-1.5">
              <span className="text-[11px] text-text-primary font-semibold truncate max-w-[120px]">{slideLabels[currentSlide]}</span>
              <span className="text-[11px] text-text-tertiary font-[family-name:var(--font-mono)] font-bold tabular-nums flex-shrink-0">{currentSlide + 1}/{totalSlides}</span>
              {isSharedView && isEditingUnlocked && autoSaveStatus === "saving" && (
                <span className="w-2 h-2 border-[1.5px] border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin flex-shrink-0" />
              )}
              {isSharedView && isEditingUnlocked && autoSaveStatus === "saved" && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </>
        )}

        {/* ── Right ── */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">

          {/* Share / Re-share */}
          {isLocalDraft && (
            <>
              {isSampleTeam ? (
                <Button variant="secondary" size="sm" disabled title="Load your own team to share" data-walkthrough="share-button">
                  {shareButtonText}
                </Button>
              ) : showUser ? (
                <div className="relative">
                  <Button variant="secondary" size="sm" onClick={() => { hapticLight(); onShareClick(); }} disabled={shareStatus === "copying"} data-walkthrough="share-button">
                    {shareButtonText}
                  </Button>
                  {creatorRequired && (
                    <div className="absolute top-full right-0 mt-2 w-64 z-50 rounded-xl border border-red-500/30 bg-surface shadow-lg px-3 py-2.5 animate-fade-in">
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Add your name in the &quot;By&quot; field before sharing.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <SignInButton mode="modal">
                  <Button variant="secondary" size="sm" data-walkthrough="share-button">
                    Sign in to share
                  </Button>
                </SignInButton>
              )}
            </>
          )}
          {isSharedView && isEditingUnlocked && (
            <>
              <Button variant="secondary" size="sm" onClick={onReshare} disabled={shareStatus === "copying"}>
                {shareStatus === "copying" ? t.saving : shareStatus === "copied" ? (lastShareResult?.updated ? t.savedBang : t.copied) : shareStatus === "error" ? t.failed : t.reshare}
              </Button>
              {showSignIn && (
                <SignInButton mode="modal">
                  <button className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-accent bg-accent-surface/60 border border-accent/20 rounded-lg hover:bg-accent-surface transition-all cursor-pointer">
                    Sign in to save
                  </button>
                </SignInButton>
              )}
            </>
          )}
          {/* Read-only viewers (guests + non-owner logged-in users) can open
              the share sheet for the current report without hitting the DB. */}
          {isSharedView && !isEditingUnlocked && onViewerShare && (
            <Button variant="secondary" size="sm" onClick={() => { hapticLight(); onViewerShare(); }}>
              {t.share}
            </Button>
          )}

          {/* Creator mode toggle — in overflow menu */}

          {/* Exit presentation (only visible in presentation mode) */}
          {isPresentationStyle && (
            <>
              <button
                onClick={() => onShowShortcuts(true)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer"
                title="Keyboard shortcuts (?)"
                aria-label="Keyboard shortcuts"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                </svg>
              </button>
              <Button variant="ghost" size="sm" onClick={() => onSetPresentationMode(false)}>
                {t.exit}
              </Button>
            </>
          )}

          {/* Build Your Own (shared read-only views) — hidden on mobile, ShareViewCTA handles it */}
          {isSharedView && !isPresentationStyle && !isEditingUnlocked && (
            <a href="/" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-[0.97] shadow-sm shadow-accent/30 transition-all tracking-wide">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              {t.buildYourOwn}
            </a>
          )}

          {/* PDF export, version history, tournament mode — all in overflow menu now */}

          {/* ── Overflow menu (settings, auth, theme) ── */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Settings"
            >
              {showUser ? (
                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                </div>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" />
                </svg>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-surface border border-border rounded-xl shadow-2xl py-2 min-w-[240px] z-50 animate-fade-in">
                {/* Account section */}
                {showUser && (
                  <>
                    <div className="px-4 py-2.5 flex items-center gap-3">
                      <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
                      <div className="flex-1 min-w-0">
                        <a href="/dashboard" className="text-sm font-bold text-text-primary hover:text-accent transition-colors" onClick={() => setMenuOpen(false)}>
                          Dashboard
                        </a>
                      </div>
                      <NotificationBell enabled={true} />
                    </div>
                    <div className="border-t border-border/50 mx-3 my-1" />
                  </>
                )}
                {showSignIn && (
                  <>
                    <div className="px-4 py-2.5">
                      <SignInButton mode="modal">
                        <button
                          className="w-full px-3 py-2 text-sm font-bold text-white bg-accent rounded-lg hover:brightness-110 transition-all cursor-pointer"
                          onClick={() => setMenuOpen(false)}
                        >
                          Sign In
                        </button>
                      </SignInButton>
                    </div>
                    <div className="border-t border-border/50 mx-3 my-1" />
                  </>
                )}

                {/* Dark mode */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-secondary">{darkMode ? t.dark : t.light} mode</span>
                  <Toggle checked={darkMode} onChange={(v) => { onDarkModeChange(v); }} label="Dark mode" />
                </div>

                {/* Language */}
                <div className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-secondary">Language</span>
                  <LanguageSelector />
                </div>

                {/* Gen theme (only for drafts/editing) */}
                {!isPresentationStyle && (isLocalDraft || (isSharedView && isEditingUnlocked)) && (
                  <>
                    <div className="border-t border-border/50 mx-3 my-1" />
                    <div className="px-4 py-2.5">
                      <span className="text-[10px] font-extrabold text-text-tertiary uppercase tracking-widest mb-2 block">Theme</span>
                      <div className="flex items-center gap-1">
                        {GEN_THEMES.map((theme) => {
                          const isActive = genTheme === theme.id;
                          return (
                            <button
                              key={theme.id}
                              type="button"
                              onClick={() => { onGenThemeChange(theme.id); }}
                              className={`relative flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg transition-all cursor-pointer ${
                                isActive ? "bg-surface-alt scale-105" : "hover:bg-surface-alt/60 opacity-50 hover:opacity-90"
                              }`}
                              style={isActive ? { boxShadow: `0 0 0 2px ${theme.badge}60` } : undefined}
                              title={theme.label}
                              aria-label={theme.label}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`https://play.pokemonshowdown.com/sprites/home/${theme.legendary}.png`}
                                alt={theme.label}
                                width={28}
                                height={28}
                                loading="lazy"
                                className={`object-contain ${isActive ? "" : "grayscale"}`}
                                style={{ maxWidth: 28, maxHeight: 28 }}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {/* Creator mode toggle */}
                {isLocalDraft && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onSetCreatorMode(!creatorMode); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={creatorMode ? "text-accent" : ""}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      {creatorMode ? <path d="M7 11V7a5 5 0 019.9-1" /> : <path d="M7 11V7a5 5 0 0110 0v4" />}
                    </svg>
                    {creatorMode ? "Lock Editing" : "Unlock Editing"}
                  </button>
                )}

                {/* Collab link */}
                {hasExistingShare && isOwner && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onCopyEditLink(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    {editLinkCopied ? "Copied!" : "Copy Collab Link"}
                  </button>
                )}

                {/* Present mode */}
                {!isPresentationStyle && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onSetPresentationMode(true); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-accent hover:bg-surface-alt/50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
                    </svg>
                    Present
                  </button>
                )}

                {/* Tournament mode */}
                {onSetTournamentMode && !isPresentationStyle && (
                  <>
                    <div className="border-t border-border/50 mx-3 my-1" />
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onSetTournamentMode(!tournamentMode); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={tournamentMode ? "text-amber-500" : ""}>
                        <path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 22V2h4v20" />
                      </svg>
                      {tournamentMode ? "Exit Tournament Mode" : "Tournament Mode"}
                    </button>
                  </>
                )}

                {/* Version history — opens side panel */}
                {canShowVersionHistory && (
                  <>
                    <div className="border-t border-border/50 mx-3 my-1" />
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setVersionPanelOpen(true); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Version History
                    </button>
                  </>
                )}

                {/* Export Pokepaste */}
                {onExportPokepaste && !isPresentationStyle && (
                  <>
                    <div className="border-t border-border/50 mx-3 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        onExportPokepaste();
                        setPasteCopied(true);
                        setTimeout(() => setPasteCopied(false), 2000);
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      {pasteCopied ? "Copied to Clipboard!" : "Copy Paste"}
                    </button>
                  </>
                )}

                {/* Visual OTS Sheet — sprites + QR code, downloadable as PNG */}
                {onOpenOTSSheet && !isPresentationStyle && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onOpenOTSSheet(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Visual OTS Sheet
                  </button>
                )}

                {/* Create PokéPaste — OTS (Open Team Sheet) & CTS (Closed / full spread) */}
                {onCreatePokepaste && !isPresentationStyle && (
                  <>
                    <button
                      type="button"
                      disabled={pokepasteCreating !== null && pokepasteCreating !== undefined}
                      onClick={() => { setMenuOpen(false); onCreatePokepaste("ots"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                      {pokepasteCreating === "ots" ? "Uploading…" : "Create PokéPaste (OTS)"}
                    </button>
                    <button
                      type="button"
                      disabled={pokepasteCreating !== null && pokepasteCreating !== undefined}
                      onClick={() => { setMenuOpen(false); onCreatePokepaste("cts"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                      {pokepasteCreating === "cts" ? "Uploading…" : "Create PokéPaste (CTS)"}
                    </button>
                  </>
                )}

                {/* PDF Export (mobile — all three options) */}
                {onExportPdf && !isPresentationStyle && (
                  <>
                    <div className="border-t border-border/50 mx-3 my-1" />
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onExportPdf("all-slides"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export All Slides
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onExportPdf("tournament-evs"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 22V2h4v20" /></svg>
                      Export Tournament (EVs)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onExportPdf("tournament-stats"); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5H6" /><path d="M18 9h1.5a2.5 2.5 0 000-5H18" /><path d="M4 22h16" /><path d="M10 22V2h4v20" /></svg>
                      Export Tournament (Stats)
                    </button>
                  </>
                )}

                {/* Tour */}
                {onStartTour && (
                  <>
                    <div className="border-t border-border/50 mx-3 my-1" />
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onStartTour(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      {t.takeATour}
                    </button>
                  </>
                )}

                {/* Links */}
                <div className="border-t border-border/50 mx-3 my-1" />
                <a
                  href="/feedback"
                  className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  </svg>
                  Feedback
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

    {/* Version history side panel */}
    {canShowVersionHistory && (
      <VersionHistoryPanel
        shareId={versionShareId!}
        open={versionPanelOpen}
        onClose={() => setVersionPanelOpen(false)}
        comparingVersion={comparingVersion}
        onCompare={onCompareVersion}
        onClearCompare={onClearCompareVersion}
        compareLoading={compareLoading}
      />
    )}
    </>
  );
}
