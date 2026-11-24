"use client";

// Banners, toasts and prompts moved verbatim out of HomePageClient.tsx.
// Each is still conditionally rendered at its original spot there.
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { CloseIcon, EyeOffIcon, ForkIcon, WarningTriangleIcon } from "@/components/ui/icons";
import type { ForkedFromMeta } from "@/hooks/useShareUrl";

/** Welcome-back banner — shown when the paste was restored from localStorage (signed-in only). */
export function WelcomeBackBanner({ onShare, onDismiss }: { onShare: () => void; onDismiss: () => void }) {
  return (
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
            Your in-progress report is still here and auto-saves to your drafts. <span className="font-bold text-text-primary">Click Share to get a permanent link</span> you can send to others.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                onShare();
                onDismiss();
              }}
              className="px-3 py-1.5 text-[11px] font-extrabold rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-accent/25"
            >
              Get my link
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 text-[11px] font-bold rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface-alt transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer flex-shrink-0"
          aria-label="Dismiss welcome back banner"
        >
          <CloseIcon
            width="14"
            height="14"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}

/** Logged-out banner — the draft is local-only; signing in is required to publish. */
export function SignedOutDraftBanner() {
  return (
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
                className="px-3 py-1.5 text-[11px] font-extrabold rounded-lg bg-accent text-accent-foreground hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-accent/25"
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
  );
}

/** URL length warning. */
export function UrlWarningBanner({ message }: { message: string }) {
  return (
    <div className="max-w-5xl mx-auto px-4 pt-2">
      <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-600 dark:text-amber-400">
        <WarningTriangleIcon width="14" height="14" className="flex-shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}

/** Version comparison found no differences. */
export function NoVersionDiffToast({ version, onDismiss }: { version: number; onDismiss: () => void }) {
  return (
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
            v{version}
          </span>
        </div>

        {/* Divider */}
        <span className="w-px h-5 bg-white/25 mx-0.5" aria-hidden />

        {/* Dismiss */}
        <button
          type="button"
          onClick={onDismiss}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-white/15 active:scale-90 transition-all cursor-pointer flex-shrink-0"
          aria-label="Exit version comparison"
        >
          <CloseIcon width="12" height="12" strokeWidth="2.5" />
        </button>
      </div>
    </div>
  );
}

/** Fork attribution banner — shown on any report that was forked from another. */
export function ForkAttributionBanner({ forkedFrom }: { forkedFrom: ForkedFromMeta }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-accent/8 border border-accent/25 rounded-2xl animate-fade-in">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent">
        <ForkIcon width="18" height="18" aria-hidden="true" />
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
  );
}

/** Hidden slide banner for the creator. */
export function HiddenSlideBanner({ title, description, showLabel, onShow }: { title: string; description: string; showLabel: string; onShow: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-5 bg-amber-500/8 border border-amber-500/25 rounded-2xl animate-fade-in">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
        <EyeOffIcon width="16" height="16" className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{title}</p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onShow}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 transition-colors border border-amber-500/20"
      >
        {showLabel}
      </button>
    </div>
  );
}

/** First-visit tour offer — non-blocking, clears the slide nav and swipe hint. */
export function TourOfferPrompt({ onStart, onDismiss }: { onStart: () => void; onDismiss: () => void }) {
  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(10rem+env(safe-area-inset-bottom))] sm:bottom-20 z-50 flex items-center gap-1 rounded-full border border-border bg-surface shadow-lg pl-4 pr-1 py-1"
    >
      <span className="text-sm text-text-secondary whitespace-nowrap">New here?</span>
      <button
        type="button"
        onClick={onStart}
        className="min-h-11 px-3 text-sm font-semibold text-accent rounded-full hover:bg-accent-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer whitespace-nowrap"
      >
        Take the tour
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss tour offer"
        className="min-h-11 min-w-11 flex items-center justify-center rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

/** PokéPaste creation error toast. */
export function PokepasteErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] px-4 py-3 rounded-xl bg-danger text-white text-sm font-bold shadow-2xl animate-fade-in max-w-sm"
    >
      PokéPaste error: {message}
      <button
        type="button"
        onClick={onDismiss}
        className="ml-3 underline decoration-white/70 decoration-2 underline-offset-2 hover:decoration-white"
      >
        Dismiss
      </button>
    </div>
  );
}
