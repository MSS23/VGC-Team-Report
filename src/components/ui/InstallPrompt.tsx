"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "vgc-install-dismissed";
const DISMISS_COOLDOWN = 14 * 24 * 60 * 60 * 1000; // 14 days

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(true); // start hidden, reveal after checks

  useEffect(() => {
    // Don't show if already dismissed recently
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_COOLDOWN) return;

    // Don't show if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Engagement gates: both a 60-second dwell AND 200px scroll must be
    // satisfied before the prompt is shown. Whichever gate fires last triggers
    // the reveal — prevents interrupting users mid-task in the first 15s.
    let timerFired = false;
    let scrollFired = false;
    let promptReady = false;
    let isIOSSafari = false;

    const maybeReveal = () => {
      // The engagement timer below treats a short (non-scrolling) page as
      // having satisfied the scroll gate, so this single check works for both
      // Android/Chrome (beforeinstallprompt) and iOS Safari short pages.
      if (timerFired && scrollFired && promptReady) {
        if (isIOSSafari) setShowIOSPrompt(true);
        setDismissed(false);
      }
    };

    const onScroll = () => {
      if (!scrollFired && window.scrollY >= 200) {
        scrollFired = true;
        window.removeEventListener("scroll", onScroll);
        maybeReveal();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const engagementTimer = setTimeout(() => {
      timerFired = true;
      // If the page is too short to scroll 200px (e.g. iPad full-viewport,
      // short content pages), treat the scroll gate as satisfied so the
      // prompt isn't blocked forever on both Android and iOS paths.
      const pageIsShort = document.documentElement.scrollHeight - window.innerHeight < 200;
      if (pageIsShort && !scrollFired) {
        scrollFired = true;
        window.removeEventListener("scroll", onScroll);
      }
      maybeReveal();
    }, 60000);

    // Android/Chrome: capture the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      promptReady = true;
      maybeReveal();
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: show manual instructions after engagement gates.
    // iOS never fires beforeinstallprompt, so we mark promptReady and use
    // setShowIOSPrompt in maybeReveal. The shared engagement timer (above)
    // already handles the pageIsShort bypass for the scroll gate.
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      isIOSSafari = true;
      promptReady = true;
    }

    return () => {
      clearTimeout(engagementTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    handleDismiss();
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIOSPrompt(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (dismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <>
      {/* Scrim overlay */}
      <div
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] animate-fade-in"
        onClick={handleDismiss}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[61] safe-bottom animate-sheet-up">
        <div className="mx-auto max-w-lg">
          <div className="bg-surface rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] border-t border-x border-border/50 px-6 pt-3 pb-6">
            {/* Handle bar */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-start gap-4">
              {/* App icon — larger for sheet context */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/10 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg width="28" height="28" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="15" fill="#E11D48" stroke="#BE123C" strokeWidth="1"/>
                  <rect x="1" y="14.5" width="30" height="3" fill="#BE123C"/>
                  <circle cx="16" cy="16" r="5" fill="white" stroke="#BE123C" strokeWidth="1.5"/>
                  <circle cx="16" cy="16" r="2" fill="#E11D48"/>
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                {deferredPrompt ? (
                  <>
                    <p className="text-base font-bold text-text-primary leading-tight">
                      Install VGC Team Report
                    </p>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                      Get instant access from your home screen with offline support and a faster experience.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-base font-bold text-text-primary leading-tight">
                      Add to Home Screen
                    </p>
                    <p className="text-sm text-text-secondary mt-1 leading-relaxed">
                      Tap{" "}
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-surface-alt border border-border align-middle mx-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                          <polyline points="16 6 12 2 8 6" />
                          <line x1="12" y1="2" x2="12" y2="15" />
                        </svg>
                      </span>
                      {" "}then select <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons — full width on mobile for easy tapping */}
            <div className="mt-5 flex flex-col gap-2.5">
              {deferredPrompt ? (
                <>
                  <button
                    type="button"
                    onClick={handleInstall}
                    className="w-full py-3 bg-accent text-white text-sm font-bold rounded-2xl hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-accent/20"
                  >
                    Install App
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="w-full py-3 text-sm font-semibold text-text-tertiary hover:text-text-primary hover:bg-surface-alt rounded-2xl transition-all cursor-pointer active:scale-[0.98]"
                  >
                    Maybe Later
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="w-full py-3 text-sm font-semibold text-text-secondary hover:text-text-primary bg-surface-alt rounded-2xl transition-all cursor-pointer active:scale-[0.98]"
                >
                  Got it
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
