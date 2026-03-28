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

  // PDF Export
  onExportPdf?: () => void;

  // Actions
  onShowShortcuts: (v: boolean) => void;
  onSetCreatorMode: (v: boolean) => void;
  onSetPresentationMode: (v: boolean) => void;
  onReset: () => void;
  onExitSharedView: () => void;
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
    onShareClick, onReshare,
    isOwner, activeShareId, sessionShareId,
    hasExistingShare, editLinkCopied, onCopyEditLink,
    onUndo, onRedo, canUndo, canRedo,
    comparingVersion, onCompareVersion, onClearCompareVersion, compareLoading,
    onExportPdf,
    onShowShortcuts, onSetCreatorMode, onSetPresentationMode,
    onReset, onExitSharedView,
  } = props;

  const { t } = useTranslation();
  const { isLoaded, isSignedIn } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [versionPanelOpen, setVersionPanelOpen] = useState(false);
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
      className={`sticky top-0 z-40 sm:backdrop-blur-2xl sm:backdrop-saturate-150 border-b transition-all duration-200 ${
        isPresentationStyle
          ? "bg-transparent border-transparent"
          : scrolled
            ? "bg-surface sm:bg-surface/90 border-border/60 shadow-lg shadow-black/5"
            : "bg-surface sm:bg-surface/80 border-border/60 shadow-[0_1px_12px_rgba(0,0,0,0.04)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between gap-1.5 sm:gap-2">

        {/* ── Left ── */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          {isLocalDraft ? (
            <>
              <Button variant="ghost" size="sm" onClick={onReset}>
                <span className="hidden sm:inline">&larr; {t.newTeam}</span>
                <span className="sm:hidden">&larr;</span>
              </Button>
              {warnings.length > 0 && (
                <span className="text-xs font-bold text-warning hidden sm:inline">
                  {warnings.length} {warnings.length > 1 ? t.warningsPlural : t.warnings}
                </span>
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
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                    title="Undo (Ctrl+Z)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 10h10a5 5 0 015 5v0a5 5 0 01-5 5H8" /><polyline points="7 14 3 10 7 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={onRedo}
                    disabled={canRedo ? !canRedo() : true}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default"
                    title="Redo (Ctrl+Shift+Z)"
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
            <div className="md:hidden flex flex-col items-center min-w-0 overflow-hidden flex-1 justify-center">
              {tournamentName && scrolled && (
                <div className="flex items-center gap-1.5 max-w-full">
                  <span className="text-[10px] font-extrabold text-text-primary truncate leading-none">{tournamentName}</span>
                  {placement && (
                    <span className="text-[9px] font-extrabold text-accent bg-accent-surface px-1.5 py-0.5 rounded flex-shrink-0 leading-none">{placement}</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-primary font-semibold truncate">{slideLabels[currentSlide]}</span>
                <span className="text-xs text-text-tertiary font-[family-name:var(--font-mono)] font-bold tabular-nums flex-shrink-0">{currentSlide + 1}/{totalSlides}</span>
                {isSharedView && isEditingUnlocked && autoSaveStatus === "saving" && (
                  <span className="w-2.5 h-2.5 border-[1.5px] border-text-tertiary/30 border-t-text-tertiary rounded-full animate-spin flex-shrink-0" />
                )}
                {isSharedView && isEditingUnlocked && autoSaveStatus === "saved" && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Right ── */}
        <div className="flex items-center gap-1.5 flex-shrink-0">

          {/* Share / Re-share */}
          {isLocalDraft && (
            <>
              {isSampleTeam ? (
                <Button variant="secondary" size="sm" disabled title="Load your own team to share" data-walkthrough="share-button">
                  {shareButtonText}
                </Button>
              ) : showUser ? (
                <>
                  <Button variant="secondary" size="sm" onClick={onShareClick} disabled={shareStatus === "copying"} data-walkthrough="share-button">
                    {shareButtonText}
                  </Button>
                  {hasExistingShare && isOwner && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onCopyEditLink}
                      title="Copy collab link — anyone with this link who signs in can edit"
                      className="hidden sm:inline-flex"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      <span className="hidden lg:inline">{editLinkCopied ? t.copied : "Collab"}</span>
                    </Button>
                  )}
                </>
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
              {hasExistingShare && isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onCopyEditLink}
                  title="Copy collab link — anyone with this link who signs in can edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <span className="hidden sm:inline">{editLinkCopied ? t.copied : "Collab"}</span>
                </Button>
              )}
              {showSignIn && (
                <SignInButton mode="modal">
                  <button className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-accent bg-accent-surface/60 border border-accent/20 rounded-lg hover:bg-accent-surface transition-all cursor-pointer">
                    Sign in to save
                  </button>
                </SignInButton>
              )}
            </>
          )}

          {/* Creator mode toggle (local draft) */}
          {isLocalDraft && (
            <div data-walkthrough="creator-toggle">
              <Button
                variant={creatorMode ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSetCreatorMode(!creatorMode)}
                title={creatorMode ? "Lock editing" : "Unlock editing"}
                className={creatorMode ? "!bg-accent/15 !text-accent !border-accent/40 hover:!bg-accent/25" : ""}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  {creatorMode ? <path d="M7 11V7a5 5 0 019.9-1" /> : <path d="M7 11V7a5 5 0 0110 0v4" />}
                </svg>
                <span className="hidden sm:inline tracking-wide">{creatorMode ? t.editing : t.locked}</span>
              </Button>
            </div>
          )}

          {/* Present / Exit presentation */}
          {!isPresentationStyle ? (
            <Button variant="primary" size="sm" onClick={() => onSetPresentationMode(true)} data-walkthrough="present-button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:hidden">
                <polygon points="5,3 19,12 5,21" fill="currentColor" stroke="none" />
              </svg>
              <span className="hidden sm:inline">{t.present}</span>
            </Button>
          ) : (
            <>
              <button
                onClick={() => onShowShortcuts(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer"
                title="Keyboard shortcuts (?)"
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

          {/* PDF Export button — hidden on mobile to reduce navbar congestion */}
          {onExportPdf && !isPresentationStyle && (
            <button
              type="button"
              onClick={onExportPdf}
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg text-text-tertiary hover:text-accent hover:bg-surface-alt transition-colors cursor-pointer"
              title="Export as PDF"
              aria-label="Export report as PDF"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          )}

          {/* Version history quick button — hidden on mobile, accessible via overflow menu */}
          {canShowVersionHistory && !isPresentationStyle && (
            <button
              type="button"
              onClick={() => setVersionPanelOpen(true)}
              className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg text-text-tertiary hover:text-accent hover:bg-surface-alt transition-colors cursor-pointer"
              title="Version history"
              aria-label="Open version history"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </button>
          )}

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
                  <Toggle checked={darkMode} onChange={(v) => { onDarkModeChange(v); }} label="" />
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
                              className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-all cursor-pointer ${
                                isActive ? "bg-surface-alt scale-105" : "hover:bg-surface-alt/60 opacity-50 hover:opacity-90"
                              }`}
                              style={isActive ? { boxShadow: `0 0 0 2px ${theme.badge}60` } : undefined}
                              title={theme.label}
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

                {/* PDF Export (mobile — hidden from top bar) */}
                {onExportPdf && !isPresentationStyle && (
                  <>
                    <div className="border-t border-border/50 mx-3 my-1 sm:hidden" />
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); onExportPdf(); }}
                      className="sm:hidden w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-text-secondary hover:text-accent hover:bg-surface-alt/50 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Export as PDF
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
