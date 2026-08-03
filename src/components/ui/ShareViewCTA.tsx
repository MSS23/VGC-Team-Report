"use client";

import { SignInButton } from "@clerk/nextjs";

interface ShareViewCTAProps {
  /** Signed-in viewers fork directly. Signed-out viewers see a SignIn modal first. */
  isSignedIn: boolean;
  /** Fork this team into the viewer's account. Only invoked for signed-in users. */
  onDuplicate: () => void;
  /** Fired when a signed-out viewer clicks Duplicate, before the sign-in modal opens.
   *  Used to track the anonymous-view → signup funnel (VGC-140). */
  onAnonymousIntent?: () => void;
  /** Dismiss callback — parent owns the dismissed state so sibling
   *  components (e.g. the floating Display pill) can react to it and
   *  drop their collision-avoidance offset when the CTA goes away. */
  onDismiss: () => void;
  /** Disable while a fork is in flight. */
  busy?: boolean;
}

export function ShareViewCTA({
  isSignedIn,
  onDuplicate,
  onAnonymousIntent,
  onDismiss,
  busy,
}: ShareViewCTAProps) {
  const buttonClasses =
    "px-3.5 py-2 sm:px-5 sm:py-2.5 bg-accent text-accent-on text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:brightness-110 active:scale-[0.97] transition-all shadow-md shadow-accent/30 cursor-pointer disabled:opacity-60 disabled:cursor-wait";

  return (
    <div className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(3rem+env(safe-area-inset-bottom,0px))] inset-x-0 z-30 pointer-events-none">
      <div className="max-w-5xl mx-auto px-2 sm:px-4 pb-1.5 sm:pb-2">
        <div className="pointer-events-auto bg-surface/95 backdrop-blur-xl border border-border rounded-xl sm:rounded-2xl shadow-2xl px-3 py-2.5 sm:px-5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-3 animate-fade-in">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-text-primary tracking-tight">
              Like this team? Duplicate it to your account
            </p>
            <p className="text-xs text-text-tertiary mt-0.5 hidden sm:block">
              You&apos;ll get an editable copy — change spreads, add notes, share your version with the community.
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {isSignedIn ? (
              <button
                type="button"
                onClick={onDuplicate}
                disabled={busy}
                className={buttonClasses}
              >
                {busy ? "Duplicating…" : "Duplicate"}
              </button>
            ) : (
              <SignInButton mode="modal">
                <button
                  type="button"
                  onClick={onAnonymousIntent}
                  className={buttonClasses}
                >
                  Duplicate
                </button>
              </SignInButton>
            )}
            <button
              type="button"
              onClick={onDismiss}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
