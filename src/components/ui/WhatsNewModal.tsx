"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

const STORAGE_KEY = "vgc-whats-new-v7";

const FEATURES = [
  {
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    title: "Co-Publishing",
    desc: "Collab reports now appear on every collaborator\u2019s creator page \u2014 YouTube-style co-creation. Co-creator names shown on explore cards and share pages.",
  },
  {
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    title: "Collab Consent",
    desc: "Collaborators must accept invites before getting credit or edit access. No more fake attribution \u2014 you control what appears on your profile.",
  },
  {
    icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
    title: "Dashboard PWA Polish",
    desc: "Compact mobile layout with scrollable tabs, 2-column grid, smaller sprites, and tighter spacing \u2014 everything fits on screen.",
  },
  {
    icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    title: "Auto Ops Tickets",
    desc: "Daily health checks now auto-create Linear tickets when issues are found \u2014 tagged for traceability so nothing falls through the cracks.",
  },
];

export function WhatsNewModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  if (!show) return null;

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
              <span className="text-xs font-extrabold text-accent uppercase tracking-widest">What&apos;s New</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
              Co-create with <span className="text-accent">your team</span>
            </h2>
            <p className="text-sm text-text-secondary mt-2 max-w-sm mx-auto">
              Reports now appear on all collaborators&apos; profiles, consent-based invites, and a polished mobile dashboard.
            </p>
          </div>

          {/* Features */}
          <div className="px-6 pb-2 space-y-3">
            {FEATURES.map((f) => (
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
              Create a Report
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
