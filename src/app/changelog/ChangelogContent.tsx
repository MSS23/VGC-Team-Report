"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";
import { useDarkMode } from "@/hooks/useDarkMode";
import { applyRandomAccent } from "@/lib/utils/random-accent";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { PageFooter } from "@/components/layout/PageFooter";

const ENTRIES = [
  {
    date: "March 2026",
    version: "4.6",
    title: "Co-Publishing, Collab Consent & Dashboard Polish",
    emoji: "\uD83E\uDD1D",
    highlight: true,
    items: [
      { type: "new" as const, text: "YouTube-style co-publishing \u2014 collab reports now appear on ALL collaborators\u2019 creator pages, not just the owner\u2019s. Co-creator names shown on explore cards, share pages, and SEO metadata." },
      { type: "new" as const, text: "Collaborator consent flow \u2014 invites start as \u201Cpending\u201D. Collaborators must explicitly accept before getting edit access or public credit. Prevents fake attribution." },
      { type: "new" as const, text: "Accept/Decline UI in dashboard \u2014 pending collab invites appear in the Shared tab with clear Accept and Decline buttons." },
      { type: "new" as const, text: "Auto-create Linear tickets from daily ops \u2014 when the health check detects issues (site down, DB failure, SEO problems), it auto-creates tagged Linear tickets." },
      { type: "improved" as const, text: "Dashboard PWA polish \u2014 tabs scroll horizontally on mobile, 2-column report grid, compact header, smaller sprites, tighter spacing throughout." },
      { type: "improved" as const, text: "Bottom nav bar compacted \u2014 smaller icons/text, gesture bar padding in standalone PWA mode." },
      { type: "improved" as const, text: "ReportCard responsive \u2014 sprites scale down on mobile (32px vs 40px desktop), titles allow 2-line clamp for readability." },
      { type: "improved" as const, text: "Navbar height reduced to 48px on mobile with sticky-header-standalone class for PWA status bar." },
      { type: "improved" as const, text: "CollaboratorPanel shows \u201CPending\u201D badge for unaccepted invites so owners know who hasn\u2019t responded." },
      { type: "improved" as const, text: "Share cache invalidated when collaborators are added or removed \u2014 changes appear immediately." },
      { type: "fixed" as const, text: "Fixed share page not loading \u2014 internal API fields (_version, _collaborators) were leaking into report state and breaking the paste parser." },
      { type: "fixed" as const, text: "Canonical domain redirect \u2014 vgc-team-report.vercel.app now redirects to pokemonvgcteamreport.com." },
    ],
  },
  {
    date: "March 2026",
    version: "4.5",
    title: "PDF Export, Replay Import & Keyboard Shortcuts",
    emoji: "\uD83D\uDCE5",
    highlight: true,
    items: [
      { type: "new" as const, text: "PDF export \u2014 download icon in the navbar renders all slides (overview, Pokemon details, speed tiers, coverage charts, matchup plans) with page breaks via the browser print dialog." },
      { type: "new" as const, text: "Showdown replay import \u2014 paste a replay.pokemonshowdown.com URL, pick which player's team to analyze. Extracts species, moves used, abilities, items, and Tera types from the battle log." },
      { type: "new" as const, text: "Keyboard shortcuts for editing \u2014 press 1-9 to jump to slides, 0 for last slide, E to toggle edit mode, H to hide/show current slide, [ and ] to reorder slides." },
      { type: "improved" as const, text: "Version history only records real changes \u2014 auto-save no longer creates version entries when no data actually changed." },
      { type: "improved" as const, text: "Version diff highlights use high-contrast blue borders with \u201CChanged\u201D labels, readable in both light and dark mode." },
      { type: "improved" as const, text: "Slide nav dots show blue indicators for slides with changes during version comparison." },
      { type: "improved" as const, text: "Shortcut hint overlay (press ?) updated with all new shortcuts." },
    ],
  },
  {
    date: "March 2026",
    version: "4.4",
    title: "Granular Version Diffs, Tour Visibility & Navbar Updates",
    emoji: "\uD83D\uDD0D",
    items: [
      { type: "new" as const, text: "Per-field version diff highlighting \u2014 comparing versions now highlights only the specific sections that changed (e.g. just Notes or Calcs) instead of the entire slide." },
      { type: "new" as const, text: "Descriptive diff banner \u2014 version comparison now lists exactly what changed (e.g. \u201CTeam summary, Notes (Pikachu), Calcs (Urshifu)\u201D) instead of vague slide counts." },
      { type: "new" as const, text: "Feedback link added to desktop navbar \u2014 now visible next to Updates for easy access from any page." },
      { type: "improved" as const, text: "Walkthrough tour spotlight visibility \u2014 accent-colored ring in light mode, white glow ring in dark mode so highlighted areas are always clear." },
      { type: "improved" as const, text: "Diff labels are contextual \u2014 each highlighted section shows what changed: \u201CSet changed\u201D, \u201CNotes changed\u201D, \u201CCalcs changed\u201D, \u201CSummary changed\u201D, etc." },
    ],
  },
  {
    date: "March 2026",
    version: "4.3",
    title: "PWA Mobile Polish & Version History Panel",
    emoji: "\u2728",
    items: [
      { type: "new" as const, text: "Version History side panel \u2014 Google Docs-style slide-out panel with timeline UI, version diffs, and one-click restore to any previous version." },
      { type: "new" as const, text: "Version history for your own reports \u2014 no longer limited to shared views. See and restore past versions from the home page after sharing." },
      { type: "new" as const, text: "Clock icon in the report navbar \u2014 quick-access button to open version history without digging through menus." },
      { type: "new" as const, text: "Clickable \u201CSaved\u201D status \u2014 tap the auto-save badge while editing to open version history instantly." },
      { type: "new" as const, text: "PWA standalone mode styles \u2014 installed app disables rubber-band bounce, adds status bar inset, and feels native." },
      { type: "new" as const, text: "Install prompt redesigned as bottom sheet \u2014 full-width with scrim overlay, handle bar, and large touch targets." },
      { type: "new" as const, text: "Dynamic theme-color \u2014 status bar matches your light/dark mode instead of static red." },
      { type: "improved" as const, text: "Bottom tab bar upgraded \u2014 active pill indicator, icon bubbles, smoother press feedback, and Dashboard tab for signed-in users." },
      { type: "improved" as const, text: "Frosted glass headers \u2014 both navbars now use backdrop-blur-2xl with saturation boost for a polished glass effect." },
      { type: "improved" as const, text: "100dvh viewport \u2014 uses dynamic viewport height so mobile browser chrome doesn\u2019t cause layout jumps." },
      { type: "improved" as const, text: "Safe area coverage \u2014 added safe-top and safe-x utilities for full edge-to-edge support on all devices." },
      { type: "improved" as const, text: "SW update toast \u2014 centered and full-width on mobile with smoother entrance animation." },
      { type: "improved" as const, text: "Revert button always visible on mobile \u2014 no more hover-only reveal on touch devices." },
      { type: "improved" as const, text: "Manifest enhanced \u2014 launch_handler reuses existing window, handle_links opens in PWA, added Create shortcut." },
    ],
  },
  {
    date: "March 2026",
    version: "4.2",
    title: "Collaboration, Version History & Polish",
    emoji: "\uD83D\uDD12",
    items: [
      { type: "new" as const, text: "Version History \u2014 every edit is snapshotted. Browse past versions and revert to any point with one click." },
      { type: "new" as const, text: "Manage Access panel \u2014 Google Docs-style access control. See who has access, add/remove collaborators, revoke collab links." },
      { type: "new" as const, text: "Collab sign-in gate \u2014 collab links now require sign-in. Unauthenticated users see a sign-up prompt." },
      { type: "new" as const, text: "Revoke collab link \u2014 owners can regenerate the edit token to invalidate all existing collab links." },
      { type: "new" as const, text: "Co-ownership \u2014 collaborators are promoted to co-owners with full Collab button access and dashboard visibility." },
      { type: "new" as const, text: "Champions banner on landing page \u2014 dismissible announcement for the new Mega Evolution format." },
      { type: "new" as const, text: "+ Create button in navbar \u2014 clear entry point to build a new team report from any page." },
      { type: "new" as const, text: "PWA update detection \u2014 shows toast when a new version is available with one-click refresh." },
      { type: "improved" as const, text: "Defensive profile heatmap \u2014 4\u00D7 weaknesses now bold white-on-red with ring outline for visibility." },
      { type: "improved" as const, text: "Navbar cleaned up \u2014 auth, theme, language, and settings moved into single overflow menu." },
      { type: "improved" as const, text: "Sign-in button visible immediately on page load (no flash while Clerk loads)." },
      { type: "improved" as const, text: "Language selector added to all page navbars." },
      { type: "improved" as const, text: "All sprite slug resolution consolidated to single source of truth \u2014 fixes broken sprites in OG images, embeds, and team graphics." },
      { type: "improved" as const, text: "48 Mega Evolutions now in the database with full stats, types, and abilities." },
      { type: "improved" as const, text: "Mega Offense and Primal Weather archetypes auto-detected." },
      { type: "fixed" as const, text: "Fixed walkthrough tour breaking after first step (timing race in tooltip positioning)." },
      { type: "fixed" as const, text: "Fixed share URL fallback creating 11KB+ URLs that browsers truncate." },
      { type: "fixed" as const, text: "Fixed service worker intercepting cross-origin sprite requests and returning broken responses." },
      { type: "fixed" as const, text: "Fixed inconsistent navbar width across Feedback, Privacy, and Dashboard pages." },
    ],
  },
  {
    date: "April 2026",
    version: "4.1",
    title: "Collaborators & Share vs Collab",
    emoji: "\uD83D\uDC65",
    items: [
      { type: "new" as const, text: "Collaborator system \u2014 invite signed-in users to co-edit your team reports" },
      { type: "new" as const, text: "Share vs Collab separation: share links are read-only, collaborators get full edit access" },
      { type: "new" as const, text: "Collaborator management panel \u2014 search users by name, add or remove collaborators (owner only)" },
      { type: "new" as const, text: "\"Shared with me\" dashboard tab showing reports you've been invited to collaborate on" },
      { type: "new" as const, text: "Edit History changelog \u2014 see who changed which sections with timestamps and version numbers" },
      { type: "new" as const, text: "Version snapshots \u2014 every edit saves a full snapshot of the previous state for revert capability" },
      { type: "new" as const, text: "Collab invite notifications \u2014 collaborators are notified when invited" },
      { type: "improved" as const, text: "Likes now require sign-in \u2014 anonymous users see the count with a \"Sign in to like\" prompt" },
      { type: "improved" as const, text: "Owners can edit reports without the edit key URL \u2014 auto-detected via authentication" },
      { type: "improved" as const, text: "Creator mode auto-enables when edit access is granted" },
      { type: "fixed" as const, text: "Fixed CSRF middleware blocking same-origin POST requests (share, comments, reactions)" },
      { type: "fixed" as const, text: "Fixed CSP blocking Clerk sign-in modal, fonts, and Pokemon Showdown sprites" },
      { type: "fixed" as const, text: "Fixed old reports without tags crashing when setting tags" },
    ],
  },
  {
    date: "April 2026",
    version: "4.0",
    title: "Pokemon Champions",
    emoji: "\uD83C\uDFC6",
    items: [
      { type: "new" as const, text: "Pokemon Champions support \u2014 Mega Evolution and Primal Reversion parsing, display, and team building" },
      { type: "new" as const, text: "Regulation M-A tag for the official Pokemon Champions competitive format" },
      { type: "new" as const, text: "35+ Mega Evolution and Primal Pokemon added with accurate stats and abilities" },
      { type: "new" as const, text: "Champions landing page with format details, tournament calendar, and SEO optimization" },
      { type: "new" as const, text: "Real-time collaborative editing via Server-Sent Events with live presence indicators" },
      { type: "new" as const, text: "Redis caching layer (Upstash) for faster Explore and Share page loads" },
      { type: "new" as const, text: "Database migration endpoint for batch-updating old reports to latest format" },
      { type: "improved" as const, text: "Lazy-loaded heavy components (SpeedTierChart, MatchupSheet, ShareModal) for faster initial page load" },
      { type: "improved" as const, text: "Consistent PageFooter across all pages (Explore, Dashboard, Privacy, Compare, Creator Profile)" },
      { type: "improved" as const, text: "Backward-compatible data migration for old calc entries and matchup plan formats" },
      { type: "improved" as const, text: "Sample team updated to Champions format featuring Kangaskhan-Mega and Salamence-Mega" },
      { type: "improved" as const, text: "Share text now includes #PokemonChampions #VGC2026 hashtags for organic reach" },
      { type: "improved" as const, text: "Vercel deployment URLs redirect to canonical custom domain" },
    ],
  },
  {
    date: "March 2026",
    version: "3.5",
    title: "Compare, Tags & Notifications",
    emoji: "🔍",
    highlight: true,
    items: [
      { type: "new" as const, text: "Team Comparison page — paste two teams side-by-side to compare type coverage, speed tiers, and shared Pokemon" },
      { type: "new" as const, text: "Tags & Categories — tag reports with archetype (Rain, Trick Room, etc.), regulation, and event type" },
      { type: "new" as const, text: "Explore filters — filter community reports by regulation, event type, and archetype tags" },
      { type: "new" as const, text: "Notifications — get notified when someone comments, reacts, or a creator you follow posts a new report" },
      { type: "new" as const, text: "Notification bell in navbar with unread count badge and dropdown panel" },
      { type: "new" as const, text: "Report Templates — choose Quick Share, Tournament Report, Team Guide, or Blank when creating a report" },
      { type: "new" as const, text: "Rental Code QR — scan QR codes for rental team codes directly from reports" },
      { type: "improved" as const, text: "Tag pills shown on Explore report cards for quick identification" },
      { type: "improved" as const, text: "Tag selector with pill-style archetype multi-select and regulation/event dropdowns in creator mode" },
      { type: "improved" as const, text: "Dark/light mode now persists across sessions via localStorage" },
      { type: "improved" as const, text: "System dark mode preference respected on first visit" },
    ],
  },
  {
    date: "March 2026",
    version: "3.0",
    title: "Authentication & Dashboard",
    emoji: "🔐",
    items: [
      { type: "new" as const, text: "Sign in with Discord, Google, or Twitch via Clerk" },
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
    emoji: "⚡",
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
    emoji: "🌍",
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
      { type: "new" as const, text: "Random accent colours on landing page (8 palettes)" },
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
    emoji: "🛡️",
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
  new: { label: "New", bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" },
  improved: { label: "Improved", bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20", dot: "bg-blue-500" },
  fixed: { label: "Fixed", bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500" },
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

  // Count totals
  const totalNew = ENTRIES.reduce((sum, e) => sum + e.items.filter((i) => i.type === "new").length, 0);
  const totalImproved = ENTRIES.reduce((sum, e) => sum + e.items.filter((i) => i.type === "improved").length, 0);
  const totalFixed = ENTRIES.reduce((sum, e) => sum + e.items.filter((i) => i.type === "fixed").length, 0);

  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(() => new Set([ENTRIES[0].version]));

  const toggleVersion = (version: string) => {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(version)) next.delete(version);
      else next.add(version);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} activePage="changelog" />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 pb-24 sm:pb-14">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent-surface flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Changelog
              </h1>
              <p className="text-sm text-text-secondary">
                What&apos;s new in VGC Team Report
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center gap-2 mt-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {totalNew} new features
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {totalImproved} improvements
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {totalFixed} fixes
            </span>
            <span className="text-xs text-text-tertiary font-medium ml-1">
              across {ENTRIES.length} releases
            </span>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[17px] top-0 bottom-0 w-px bg-border hidden sm:block" />

          <div className="space-y-6">
            {ENTRIES.map((entry, i) => {
              const isExpanded = expandedVersions.has(entry.version);
              const newCount = entry.items.filter((it) => it.type === "new").length;
              const improvedCount = entry.items.filter((it) => it.type === "improved").length;
              const fixedCount = entry.items.filter((it) => it.type === "fixed").length;

              return (
                <motion.div
                  key={entry.version}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, duration: 0.45 }}
                  className="relative sm:pl-12"
                >
                  {/* Timeline dot */}
                  <div className={`hidden sm:flex absolute left-0 top-4 w-[35px] h-[35px] rounded-full items-center justify-center z-10 ${
                    entry.highlight
                      ? "bg-accent text-white shadow-lg shadow-accent/30"
                      : "bg-surface border-2 border-border text-text-tertiary"
                  }`}>
                    <span className="text-sm">{entry.emoji}</span>
                  </div>

                  {/* Card */}
                  <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
                    entry.highlight
                      ? "border-accent/30 bg-accent-surface/20 shadow-sm shadow-accent/10"
                      : "border-border bg-surface hover:border-accent/20"
                  }`}>
                    {/* Header — always visible, clickable */}
                    <button
                      type="button"
                      onClick={() => toggleVersion(entry.version)}
                      className="w-full px-5 py-4 flex items-center gap-3 text-left cursor-pointer group"
                    >
                      <span className="sm:hidden text-lg">{entry.emoji}</span>
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-extrabold rounded-lg tracking-wide flex-shrink-0 ${
                        entry.highlight
                          ? "bg-accent text-white"
                          : "bg-accent-surface text-accent"
                      }`}>
                        v{entry.version}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-accent transition-colors truncate">
                          {entry.title}
                        </h2>
                        <span className="text-[11px] text-text-tertiary font-medium">{entry.date}</span>
                      </div>
                      {/* Mini counts */}
                      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
                        {newCount > 0 && <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center">{newCount}</span>}
                        {improvedCount > 0 && <span className="w-5 h-5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">{improvedCount}</span>}
                        {fixedCount > 0 && <span className="w-5 h-5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center">{fixedCount}</span>}
                      </div>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className={`text-text-tertiary flex-shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {/* Items — collapsible */}
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                      <div className="px-5 pb-5 space-y-2 border-t border-border/50 pt-3">
                        {entry.items.map((item, j) => {
                          const style = TYPE_STYLES[item.type];
                          return (
                            <motion.div
                              key={j}
                              initial={isExpanded ? { opacity: 0, x: -8 } : false}
                              animate={isExpanded ? { opacity: 1, x: 0 } : false}
                              transition={{ delay: j * 0.02, duration: 0.25 }}
                              className="flex items-start gap-2.5"
                            >
                              <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 text-[9px] font-extrabold rounded border tracking-wider uppercase mt-0.5 ${style.bg}`}>
                                {style.label}
                              </span>
                              <span className="text-sm text-text-secondary leading-relaxed">{item.text}</span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="text-center mt-14"
        >
          <p className="text-sm text-text-tertiary mb-4">Have an idea for the next update?</p>
          <a
            href="/feedback"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white text-sm font-bold rounded-xl hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 transition-all tracking-wide"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Send Feedback
          </a>
        </motion.div>
      </main>

      <PageFooter />
    </div>
  );
}
