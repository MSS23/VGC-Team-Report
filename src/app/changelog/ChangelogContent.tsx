"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";

const ENTRIES = [
  {
    date: "March 2026",
    version: "3.0",
    title: "Authentication & Dashboard",
    items: [
      { type: "new" as const, text: "Sign in with Discord, Google, or X/Twitter via Clerk" },
      { type: "new" as const, text: "Dashboard — manage all your team reports in one place" },
      { type: "new" as const, text: "Claim reports — link existing reports to your account via edit token" },
      { type: "new" as const, text: "Auto-detect unclaimed reports from your browser localStorage" },
      { type: "new" as const, text: "Save/bookmark reports from other creators" },
      { type: "new" as const, text: "Creator profile editor — set bio, Twitter, Discord, YouTube" },
      { type: "new" as const, text: "Fork Team button — copy any public team and build your own version" },
      { type: "new" as const, text: "Report management — edit, toggle public/private, delete from dashboard" },
      { type: "new" as const, text: "Bulk actions — toggle all reports public or private at once" },
      { type: "new" as const, text: "Dashboard sorting — newest, oldest, most views, by name" },
      { type: "new" as const, text: "Feedback page with Discord webhook notifications" },
      { type: "new" as const, text: "Changelog page with full version history" },
      { type: "improved" as const, text: "Sign-in nudge when editing shared reports without an account" },
      { type: "improved" as const, text: "Dashboard link on all pages when signed in" },
      { type: "improved" as const, text: "Comments disabled indicator — shows message when creator turned off comments" },
      { type: "improved" as const, text: "PWA shortcuts for Explore, Dashboard, and Feedback" },
      { type: "fixed" as const, text: "XSS protection — HTML entities escaped in comments and display names" },
      { type: "fixed" as const, text: "Claim input strips whitespace from pasted edit tokens" },
    ],
  },
  {
    date: "March 2026",
    version: "2.5",
    title: "Technical Upgrade",
    items: [
      { type: "improved" as const, text: "Refactored useHomePage into 3 focused hooks (useShareFlow, useSlideSystem, useExportActions)" },
      { type: "improved" as const, text: "Mobile: IV badges visible, larger move text, wider stat bars, better grids" },
      { type: "improved" as const, text: "Mobile navbar overflow menu for secondary controls" },
      { type: "improved" as const, text: "Touch-friendly swap button for lead/back in matchup game plans" },
      { type: "improved" as const, text: "EV total shown on Pokemon cards (warns if >510)" },
      { type: "improved" as const, text: "Comment success/error notifications" },
      { type: "improved" as const, text: "Spotlight API cached in sessionStorage to reduce lag" },
      { type: "fixed" as const, text: "Reduced-motion support for all animations" },
      { type: "fixed" as const, text: "Keyboard focus rings for accessibility" },
      { type: "fixed" as const, text: "Dot grid background disabled on mobile for performance" },
      { type: "fixed" as const, text: "Dead CSS removed (unused keyframes)" },
    ],
  },
  {
    date: "March 2026",
    version: "2.0",
    title: "Community Update",
    items: [
      { type: "new" as const, text: "Explore gallery — browse public team reports from the community" },
      { type: "new" as const, text: "Reactions — react to reports with emoji (fire, heart, brain, battle, clap)" },
      { type: "new" as const, text: "Comments — leave feedback on public reports (creator-controlled)" },
      { type: "new" as const, text: "Creator profiles — auto-generated pages for every creator" },
      { type: "new" as const, text: "View counts — track engagement on public reports" },
      { type: "new" as const, text: "Verified creator badges with admin verification" },
      { type: "new" as const, text: "YouTube-style visibility — private, unlisted, or public" },
      { type: "new" as const, text: "Spotlight featured team report on landing and explore pages" },
      { type: "new" as const, text: "What's New modal for first-time visitors" },
      { type: "new" as const, text: "Random accent colors on landing page (8 palettes)" },
      { type: "improved" as const, text: "Landing page redesigned to show community features" },
      { type: "improved" as const, text: "Animated GIF sprites across all cards and spotlight" },
      { type: "improved" as const, text: "SEO metadata updated across all pages" },
      { type: "improved" as const, text: "Share button disabled on sample team with tooltip" },
      { type: "improved" as const, text: "Home logo and Build Your Own CTA on shared report views" },
      { type: "fixed" as const, text: "PNG and PDF export now works reliably (html2canvas-pro)" },
      { type: "fixed" as const, text: "Sprite loading for hyphenated Pokemon (Urshifu, Flutter Mane, etc.)" },
    ],
  },
  {
    date: "March 2026",
    version: "1.9",
    title: "Safety & Moderation",
    items: [
      { type: "new" as const, text: "Word filter blocks inappropriate language in comments" },
      { type: "new" as const, text: "Flag/report button on comments with auto-remove at 3 flags" },
      { type: "new" as const, text: "Self-reported label on unverified placements" },
      { type: "improved" as const, text: "Comments off by default — creators opt-in via Share modal" },
      { type: "improved" as const, text: "EV spread total shown on Pokemon cards (warns if >510)" },
      { type: "improved" as const, text: "Mobile navbar overflow menu for secondary controls" },
      { type: "improved" as const, text: "Touch-friendly swap button for lead/back in game plans" },
      { type: "fixed" as const, text: "Performance: spotlight caches in session, view count fires once" },
      { type: "fixed" as const, text: "Dot grid background disabled on mobile for better performance" },
      { type: "fixed" as const, text: "Reduced-motion support for all animations" },
    ],
  },
];

const TYPE_STYLES = {
  new: { label: "New", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  improved: { label: "Improved", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  fixed: { label: "Fixed", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
};

export function ChangelogContent() {
  return (
    <I18nProvider>
      <ChangelogInner />
    </I18nProvider>
  );
}

function ChangelogInner() {
  const { darkMode, setDarkMode } = useDarkMode();
  useEffect(() => { applyRandomAccent(); }, []);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/90 border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-bold text-sm hover:opacity-80 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><polyline points="15 18 9 12 15 6" /></svg>
            <span className="text-text-primary">VGC Team</span>
            <span className="text-accent">Report</span>
          </a>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-all"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Changelog
          </h1>
          <p className="text-sm text-text-secondary mb-10">
            Latest features, improvements, and fixes.
          </p>
        </motion.div>

        <div className="space-y-10">
          {ENTRIES.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
              className="relative"
            >
              {/* Version header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center px-2.5 py-1 text-xs font-extrabold rounded-lg bg-accent-surface text-accent tracking-wide">
                  v{entry.version}
                </span>
                <h2 className="text-lg font-bold text-text-primary">{entry.title}</h2>
                <span className="text-xs text-text-tertiary font-medium">{entry.date}</span>
              </div>

              {/* Items */}
              <div className="space-y-2 pl-1">
                {entry.items.map((item, j) => {
                  const style = TYPE_STYLES[item.type];
                  return (
                    <div key={j} className="flex items-start gap-2.5">
                      <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold rounded border tracking-wider uppercase mt-0.5 ${style.bg}`}>
                        {style.label}
                      </span>
                      <span className="text-sm text-text-secondary">{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
