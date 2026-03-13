"use client";

import { Button } from "@/components/ui/Button";
import { LanguageSelector } from "@/components/ui/LanguageSelector";
import { Toggle } from "@/components/ui/Toggle";
import { useTranslation } from "@/lib/i18n";
import { GEN_THEMES } from "@/hooks/useTheme";
import type { GenTheme } from "@/hooks/useTheme";

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

  // Share
  shareStatus: string;
  shareButtonText: string;
  lastShareResult?: { updated?: boolean; editUrl?: string } | null;
  onShareClick: () => void;
  onReshare: () => void;

  // Edit link
  hasExistingShare: boolean;
  editLinkCopied: boolean;
  onCopyEditLink: () => void;

  // Actions
  onStartTour: () => void;
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
    warnings, saveFlash,
    shareStatus, shareButtonText, lastShareResult,
    onShareClick, onReshare,
    hasExistingShare, editLinkCopied, onCopyEditLink,
    onShowShortcuts, onSetCreatorMode, onSetPresentationMode,
    onReset, onExitSharedView,
  } = props;

  const { t } = useTranslation();

  const isLocalDraft = !isSharedView && !isPresentationStyle;

  return (
    <header
      className={`sticky top-0 z-10 backdrop-blur-xl border-b transition-all duration-300 ${
        isPresentationStyle
          ? "bg-transparent border-transparent"
          : "bg-surface/90 border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2">

        {/* -- Left -- */}
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
            </>
          ) : isPresentationStyle ? (
            /* Presentation: show tournament + slide info on left */
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              {tournamentName && (
                <>
                  <span className="font-extrabold text-text-primary truncate tracking-tight">{tournamentName}</span>
                  {placement && (
                    <span className="text-xs font-extrabold text-accent bg-accent-surface px-2.5 py-0.5 rounded-md flex-shrink-0 tracking-wide">{placement}</span>
                  )}
                </>
              )}
              <span className="font-semibold text-text-primary truncate hidden sm:inline">
                {slideLabels[currentSlide]}
              </span>
              <span className="text-text-tertiary font-[family-name:var(--font-mono)] font-bold tabular-nums flex-shrink-0">
                {currentSlide + 1}/{totalSlides}
              </span>
            </div>
          ) : null}
        </div>

        {/* -- Center: slide info (local draft & shared views, not presentation) -- */}
        {!isPresentationStyle && (
          <div className="hidden md:flex items-center gap-2 text-sm text-text-secondary min-w-0">
            {tournamentName && (
              <>
                <span className="font-extrabold text-text-primary truncate tracking-tight">{tournamentName}</span>
                {placement && (
                  <span className="text-xs font-extrabold text-accent bg-accent-surface px-2.5 py-0.5 rounded-md flex-shrink-0 tracking-wide">{placement}</span>
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
          </div>
        )}

        {/* Mobile slide counter (non-presentation) */}
        {!isPresentationStyle && (
          <div className="md:hidden flex items-center gap-1.5 min-w-0 overflow-hidden flex-shrink">
            <span className="text-xs text-text-primary font-semibold truncate max-w-[100px]">
              {slideLabels[currentSlide]}
            </span>
            <span className="text-xs text-text-tertiary font-[family-name:var(--font-mono)] font-bold tabular-nums flex-shrink-0">
              {currentSlide + 1}/{totalSlides}
            </span>
          </div>
        )}

        {/* -- Right: actions -- */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

          {/* Share / Re-share */}
          {isLocalDraft && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onShareClick}
                disabled={shareStatus === "copying"}
                data-walkthrough="share-button"
              >
                {shareButtonText}
              </Button>
              {hasExistingShare && (
                <button
                  onClick={onCopyEditLink}
                  title="Copy your private edit link"
                  aria-label="Copy edit link"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-text-tertiary hover:text-accent hover:bg-accent-surface/60 border border-border-subtle hover:border-accent/30 transition-all cursor-pointer"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 7h3a5 5 0 015 5 5 5 0 01-5 5h-3m-6 0H6a5 5 0 01-5-5 5 5 0 015-5h3" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                  <span className="hidden sm:inline">{editLinkCopied ? t.copied : t.editLink}</span>
                </button>
              )}
            </>
          )}
          {isSharedView && isEditingUnlocked && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onReshare}
              disabled={shareStatus === "copying"}
            >
              {shareStatus === "copying" ? t.saving : shareStatus === "copied" ? (lastShareResult?.updated ? t.savedBang : t.copied) : shareStatus === "error" ? t.failed : t.reshare}
            </Button>
          )}

          {/* Gen theme selector (local draft & shared edit, large screens only) */}
          {!isPresentationStyle && (isLocalDraft || (isSharedView && isEditingUnlocked)) && (
            <div className="hidden lg:flex items-center bg-surface-alt/50 rounded-lg p-1 gap-0.5" title="Generation theme">
              {GEN_THEMES.map((theme) => {
                const isActive = genTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onGenThemeChange(theme.id)}
                    className={`group relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive ? "bg-surface scale-105" : "hover:bg-surface-alt"
                    }`}
                    style={isActive ? { boxShadow: `0 0 0 2px ${theme.badge}60, 0 2px 8px ${theme.badge}25` } : undefined}
                    title={`${theme.label} (${theme.abbr})`}
                    aria-label={`Set theme to ${theme.label}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://play.pokemonshowdown.com/sprites/home/${theme.legendary}.png`}
                      alt={theme.label}
                      width={32}
                      height={32}
                      loading="lazy"
                      className={`object-contain transition-all duration-200 ${
                        isActive
                          ? "scale-110"
                          : "brightness-[0.5] grayscale opacity-60 group-hover:brightness-100 group-hover:grayscale-0 group-hover:opacity-90 group-hover:scale-105"
                      }`}
                      style={{
                        maxWidth: 32,
                        maxHeight: 32,
                        ...(isActive ? { filter: `drop-shadow(0 0 8px ${theme.badge}90)` } : {}),
                      }}
                    />
                    {isActive && (
                      <span className="absolute -bottom-px left-1/2 -translate-x-1/2 h-[2.5px] w-5 rounded-full" style={{ backgroundColor: theme.badge }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Language selector */}
          <LanguageSelector />

          {/* Dark mode toggle */}
          <Toggle
            checked={darkMode}
            onChange={onDarkModeChange}
            label={darkMode ? t.dark : t.light}
          />

          {/* Creator mode lock/unlock (local draft only) */}
          {isLocalDraft && (
            <div data-walkthrough="creator-toggle">
              <button
                type="button"
                onClick={() => onSetCreatorMode(!creatorMode)}
                title={creatorMode ? "Lock editing (read-only)" : "Unlock editing"}
                aria-label={creatorMode ? "Lock editing" : "Unlock editing"}
                className={`flex items-center justify-center gap-1.5 min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 px-2 sm:px-2.5 py-1.5 rounded-lg border-2 text-xs font-bold transition-all duration-200 cursor-pointer ${
                  creatorMode
                    ? "bg-accent/15 text-accent border-accent/40 hover:bg-accent/25"
                    : "bg-surface-alt text-text-secondary border-border hover:text-text-primary hover:border-border"
                }`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  {creatorMode
                    ? <path d="M7 11V7a5 5 0 019.9-1" />
                    : <path d="M7 11V7a5 5 0 0110 0v4" />
                  }
                </svg>
                <span className="hidden sm:inline tracking-wide">{creatorMode ? t.editing : t.locked}</span>
              </button>
            </div>
          )}

          {/* Present button (not in presentation mode) */}
          {!isPresentationStyle && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onSetPresentationMode(true)}
              data-walkthrough="present-button"
              aria-label="Start presentation"
              className="!min-w-[36px] !min-h-[36px] sm:!min-w-0 sm:!min-h-0"
            >
              <span className="hidden sm:inline">{t.present}</span>
              <span className="sm:hidden">&#9654;</span>
            </Button>
          )}

          {/* Presentation mode: shortcuts + exit */}
          {isPresentationStyle && (
            <>
              <button
                onClick={() => onShowShortcuts(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt/60 transition-colors cursor-pointer"
                aria-label="Keyboard shortcuts"
                title="Keyboard shortcuts (?)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10" />
                </svg>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSetPresentationMode(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                {t.exit}
              </Button>
            </>
          )}

          {/* Build Your Own (shared views only, not presentation) */}
          {isSharedView && !isPresentationStyle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onReset();
                onExitSharedView();
                window.location.href = window.location.origin;
              }}
            >
              <span className="sm:hidden">{t.newShort}</span>
              <span className="hidden sm:inline">{t.buildYourOwn}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
