"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY = "vgc-whats-new-v10";
const RETURNING_KEY = "vgc-has-visited";

const WELCOME_FEATURES = [
  {
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    title: "Paste & Analyze",
    desc: "Paste your Showdown team and get an instant breakdown — stats, coverage, speed tiers, and more.",
  },
  {
    icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
    title: "Share with Your Team",
    desc: "Get a shareable link for your team report. Add notes, damage calcs, and matchup plans your teammates can read.",
  },
  {
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    title: "Explore the Community",
    desc: "Browse team reports shared by other competitive players. Filter by format, tournament, or Pok\u00e9mon.",
  },
  {
    icon: "M13 10V3L4 14h7v7l9-11h-7z",
    title: "Works Offline",
    desc: "Reports you\u2019ve viewed are saved for offline use — perfect for checking your team at tournaments with bad signal.",
  },
];


const WHATS_NEW_FEATURES_V10 = [
  {
    icon: "M4 5a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM13 5a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-5a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zM13 14a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1h-5a1 1 0 01-1-1v-5z",
    title: "Common Combinations",
    desc: "The 'How to Pilot This Team' section now has a visual Leads / Back / Strategy table \u2014 build numbered bring combos from your own six Pok\u00e9mon, just like the Match-Up game plans.",
  },
  {
    icon: "M3 3v18h18M8 17V9M13 17V5M18 17v-7",
    title: "Clearer Speed Tiers",
    desc: "The Mega Forms toggle now tells you when it has nothing to show (and why), and the Meta benchmark list shows exactly which regulation it\u2019s pulled from.",
  },
  {
    icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Readable Stat Bars",
    desc: "Stat bar colors are the standard per-stat palette \u2014 a new caption makes clear the color means the stat type, not a hidden quality ranking.",
  },
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "Faster & More Reliable",
    desc: "Popular pages load quicker, live editing is lighter on the server, and a fix to autosave keeps version history lean \u2014 with tighter security across comments, collections, and sharing.",
  },
];

export function WhatsNewModal() {
  const [show, setShow] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    const hasVisited = localStorage.getItem(RETURNING_KEY);

    // Let first-time visitors reach the builder without an interrupting modal.
    // The homepage already explains the product; release notes are useful on a
    // later visit, when the user has context for what changed.
    if (hasVisited && !seen) {
      setIsNewUser(false);
      setShow(true);
    }

    // Mark that this user has visited (for future "new vs returning" detection)
    localStorage.setItem(RETURNING_KEY, "1");
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  const handleFocusTrap = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [dismiss]
  );

  if (!show) return null;

  const features = isNewUser ? WELCOME_FEATURES : WHATS_NEW_FEATURES_V10;
  const heading = isNewUser
    ? <>Build your <span className="text-accent">team report</span></>
    : <>Ready for <span className="text-accent">tournament day</span></>;
  const subtext = isNewUser
    ? "Create, share, and explore competitive VGC team reports with your community."
    : "Here\u2019s what\u2019s new since your last visit.";
  const ctaLabel = isNewUser ? "Get Started" : "Create a Report";
  const badgeLabel = isNewUser ? "Welcome" : "What\u2019s New";

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
        onKeyDown={handleFocusTrap}
        ref={dialogRef}
        tabIndex={-1}
      >
        <motion.div
          className="relative bg-surface border border-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-2 right-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-surface rounded-full mb-4">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-xs font-extrabold text-accent uppercase tracking-widest">{badgeLabel}</span>
            </div>
            <h2 id="whats-new-title" className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              {heading}
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
              {subtext}
            </p>
          </div>

          {/* Features */}
          <div className="px-6 pb-2 space-y-3">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-surface-alt/50">
                <div className="w-9 h-9 rounded-lg bg-accent-surface flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                    <path d={f.icon} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-text-primary">{f.title}</h3>
                  <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="px-6 py-5 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={dismiss}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              {ctaLabel}
            </button>
            <a
              href="/explore"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-text-secondary hover:text-text-primary bg-surface border-2 border-border hover:border-accent/30 rounded-xl transition-all tracking-wide"
              onClick={() => localStorage.setItem(STORAGE_KEY, "1")}
            >
              Explore Teams
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
