"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY = "vgc-whats-new-v8";
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

const WHATS_NEW_FEATURES = [
  {
    icon: "M6 3h12l4 6-10 13L2 9z",
    title: "Tournament Day Mode",
    desc: "Tap the trophy icon to see your team as compact battle-ready cards with moves, items, and speed tiers at a glance.",
  },
  {
    icon: "M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z",
    title: "Earnable Color Themes",
    desc: "Your reports now earn color themes as they get views — check your profile page to pick from Ocean Blue, Emerald, Amber, and more.",
  },
  {
    icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    title: "Mega Evolution Hub",
    desc: "Every Mega Evolution now has its own page with stats, community teams, and related picks to explore.",
  },
  {
    icon: "M5 12h14M12 5l7 7-7 7",
    title: "Offline at Tournaments",
    desc: "Previously viewed reports now load from your device when you\u2019re offline. An amber banner lets you know you\u2019re viewing a cached version.",
  },
];

export function WhatsNewModal() {
  const [show, setShow] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    const hasVisited = localStorage.getItem(RETURNING_KEY);

    if (!seen) {
      setIsNewUser(!hasVisited);
      setShow(true);
    }

    // Mark that this user has visited (for future "new vs returning" detection)
    localStorage.setItem(RETURNING_KEY, "1");
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!show) return null;

  const features = isNewUser ? WELCOME_FEATURES : WHATS_NEW_FEATURES;
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
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-alt transition-colors cursor-pointer z-10"
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
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
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
