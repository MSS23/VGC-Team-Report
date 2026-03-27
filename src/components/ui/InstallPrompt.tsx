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

    // Android/Chrome: capture the beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay reveal so it doesn't distract from first interaction
      setTimeout(() => setDismissed(false), 15000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari: show manual instructions after delay
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    if (isIOS && isSafari) {
      const timer = setTimeout(() => {
        setShowIOSPrompt(true);
        setDismissed(false);
      }, 45000);
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

  if (dismissed || (!deferredPrompt && !showIOSPrompt)) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 animate-fade-in">
      <div className="bg-surface border border-border rounded-2xl shadow-2xl p-4">
        <div className="flex items-start gap-3">
          {/* App icon */}
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
                  Get the app
                </p>
                <p className="text-xs text-text-tertiary mt-0.5 leading-relaxed">
                  Install VGC Team Report for offline access and a faster experience.
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={handleInstall}
                    className="px-4 py-1.5 bg-accent text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all cursor-pointer shadow-sm shadow-accent/20"
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
                  {" "}then &ldquo;Add to Home Screen&rdquo; for offline access.
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

          <button
            type="button"
            onClick={handleDismiss}
            className="w-6 h-6 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer flex-shrink-0"
            aria-label="Dismiss"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
