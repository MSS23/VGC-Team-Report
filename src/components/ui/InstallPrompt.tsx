"use client";

import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "vgc-install-dismissed";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed recently (7 days)
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      setDismissed(true);
      return;
    }

    // Don't show if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setDismissed(true);
      return;
    }

    // Android/Chrome: capture the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      // Delay showing iOS prompt so it doesn't interrupt initial experience
      const timer = setTimeout(() => setShowIOSPrompt(true), 30000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
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

  // Nothing to show
  if (dismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          {/* Pokeball icon */}
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="15" fill="#E11D48" stroke="#BE123C" strokeWidth="1"/>
              <rect x="1" y="14.5" width="30" height="3" fill="#BE123C"/>
              <circle cx="16" cy="16" r="5" fill="white" stroke="#BE123C" strokeWidth="1.5"/>
              <circle cx="16" cy="16" r="2" fill="#E11D48"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            {deferredPrompt ? (
              <>
                <p className="text-sm font-bold text-text-primary">
                  Install VGC Team Report
                </p>
                <p className="text-xs text-text-tertiary mt-0.5">
                  Add to your home screen for quick access
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleInstall}
                    className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer"
                  >
                    Install
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="px-3 py-1.5 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Not now
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-text-primary">
                  Add to Home Screen
                </p>
                <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">
                  Tap{" "}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-0.5">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  {" "}then &ldquo;Add to Home Screen&rdquo; for the full app experience
                </p>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="mt-2 text-xs font-medium text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </>
            )}
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
