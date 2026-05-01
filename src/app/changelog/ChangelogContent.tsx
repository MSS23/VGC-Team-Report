"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { I18nProvider } from "@/lib/i18n";

import { applyRandomAccent } from "@/lib/utils/random-accent";

import { PageFooter } from "@/components/layout/PageFooter";

const ENTRIES = [
  {
    date: "April 2026",
    version: "5.7",
    title: "Champions Reg M-A Honest Cleanup, In-Line Editing & Persistent Navbar",
    emoji: "🧹", // 🧹
    highlight: true,
    items: [
      // ── New features ──
      { type: "new" as const, text: "In-line Pokemon replace — every PokemonCard on the team overview now has a pencil button (visible when the report is editable) that opens a searchable picker to swap a single slot. Backed by @pkmn/dex so every species, every form, every Mega is searchable, with sprite + types + BST shown for each result. Surgically rewrites only the species token in the paste, preserving nickname, item, ability, moves, EVs, IVs, nature, and Tera so all downstream analysis (stats, calcs, threat coverage) stays consistent. No more re-pasting the entire team to fix one slot." },
      { type: "new" as const, text: "Popular reports rail on the homepage — a horizontal scroll strip of 6 trending public reports below the spotlight section, each showing team sprites, tournament/placement info, and creator name. Session-cached so it doesn't refetch on every visit." },
      { type: "new" as const, text: "Collaborator credit on shared reports — co-creator names now appear beside the primary creator on the public read-only view, finally giving collaborators visible credit on the page itself (not just on Explore cards)." },
      { type: "new" as const, text: "Speed tier chart now shows the meta max-speed variant of a Pokemon even when that species is on your team — useful for comparing a bulky/mid-speed build against the standard meta build of the same mon (e.g. your bulky Garchomp vs. the meta Jolly max-speed Garchomp). The duplicate is tagged with a META badge so it's never confused with your build." },
      { type: "new" as const, text: "Home button in the slide nav bar — visible on every slide except the team overview itself. One tap returns to the main team page from any subpage (Pokemon detail, speed tiers, coverage, matchup plans)." },

      // ── Champions Reg M-A cleanup ──
      { type: "fixed" as const, text: "Champions page no longer shows illegal Megas — Mega Salamence, Mega Metagross, and Mega Mawile have been removed (verified against Bulbapedia, Serebii, and Victory Road on 2026-04-20). Their /champions/{slug} landing pages now return 404, which is the correct behaviour for non-format Pokemon." },
      { type: "new" as const, text: "29 missing Reg M-A legal Megas added to the Champions index — Pidgeot, Clefable, Victreebel, Starmie, Dragonite, Meganium, Feraligatr, Skarmory, Medicham, Sharpedo, Camerupt, Banette, Chimecho, Glalie, Froslass, Emboar, Excadrill, Chandelure, Golurk, Chesnaught, Delphox, Greninja, Floette, Meowstic, Hawlucha, Crabominable, Drampa, Scovillain, Glimmora. Stats and abilities pulled from @pkmn/dex." },
      { type: "improved" as const, text: "13 Megas un-gated from “Coming Soon” — earlier sprite probe was too strict (only checked animated frames). Re-probed all four Showdown sprite paths and found these 13 ship static gen5 PNGs: Mega Chimecho, Excadrill, Chandelure, Golurk, Chesnaught, Delphox, Greninja, Floette, Hawlucha, Crabominable, Drampa, Scovillain, Glimmora. Champions index now shows 58 clickable Mega cards (only Mega Meowstic remains genuinely sprite-less)." },
      { type: "fixed" as const, text: "Mega landing pages no longer 404 for species missing from the static dex — pages now resolve through the @pkmn/dex fallback so every Champions-original Mega builds correctly with real stats, types, and abilities (previously hit a hard notFound() on stub entries)." },
      { type: "improved" as const, text: "Mega abilities corrected to match Pokemon Champions canon for Reg M-A — several ability fields disagreed with the in-game data and have been re-sourced." },
      { type: "improved" as const, text: "Champions hero copy refreshed — removed all Primal Reversion mentions (Primal forms are not in Reg M-A) and added the explicit Reg M-A team-construction restrictions so the format rules are clear up-front." },
      { type: "fixed" as const, text: "Featured Teams on Mega landing pages now only show teams that actually run the Mega — previously matched any team whose paste contained the base species name, so plain Scizor with Choice Band would leak into Mega Scizor's Featured Teams. Now requires either the Mega Stone item OR a {baseName}-Mega species token to qualify." },
      { type: "improved" as const, text: "Removed two filler sections from Mega landing pages — the templated “Using {Mega} in VGC” paragraphs and the visible FAQ accordion (both duplicated hero info with zero competitive insight). The FAQPage JSON-LD is still emitted server-side for AI scrapers (ChatGPT, Perplexity, Bing)." },

      // ── Legality validator (Reg M-A) ──
      { type: "fixed" as const, text: "Rotom appliance forms (Wash, Heat, Mow, Fan, Frost) no longer flagged as illegal in Champions — only the base “rotom” key was in the Champions dex, but the parser produces “rotom-wash” etc. All five form keys now match." },
      { type: "fixed" as const, text: "Removed the bogus “max 1 Mega Stone per team” error — Reg M-A teams can pack any number of Mega Stones; only one Pokemon can actually Mega Evolve per battle, which is an in-battle choice, not a team-construction rule. Demoted to an info note listing the stone holders." },
      { type: "improved" as const, text: "Stat-investment validation is now SP-aware — spreads that fit the 66 SP / 32-per-stat envelope validate via the Champions SP path, while the classic 512/252 EV path remains as fallback for traditional formats." },

      // ── SEO / structured data ──
      { type: "improved" as const, text: "JSON-LD on shared reports now separates author from contributor — primary creator is the sole schema.org author, collaborators are listed under contributor, and dateModified is emitted from the report's last-updated timestamp alongside the existing datePublished. Helps Google and AI scrapers attribute work correctly to all credited people." },

      // ── Architecture / polish ──
      { type: "improved" as const, text: "Persistent navbar across all pages — the page-level navbar now mounts once in the root layout instead of remounting on every route, so it no longer flashes or re-renders between client-side navigations. Single source of truth for active-page detection." },
      { type: "fixed" as const, text: "No more accent-color flash on page load — the inline blocking head script now applies BOTH dark mode AND your gen theme accent (--accent / --accent-light / --accent-surface) before first paint. Previously only dark mode was set early; the accent briefly showed default red before switching to your chosen theme." },
      { type: "fixed" as const, text: "Favicon now loads — favicon.ico is back in /public and registered in metadata.icons (was 404ing because the manifest only listed favicon.svg / icon-192.png)." },
      { type: "fixed" as const, text: "/compare page no longer shows a duplicate navbar — a stale inline PageNavbar was rendering on top of the persistent one." },

      // ── Sharing / unfurls ──
      { type: "fixed" as const, text: "Shared report unfurls reverted to text-only after the OG sprite card produced “image failed to load” errors in Discord, Twitter, and Slack — the Showdown sprite CDN dependency under the edge-runtime fetch-timeout budget made a reliably-rendering OG image unrealistic. Title, description, and creator name still appear in the link card; the broken image slot is gone. /api/team-graphic stays in place for in-app downloads, which work fine — the failure mode was specifically third-party unfurlers fetching it under their own timeout." },
    ],
  },
  {
    date: "April 2026",
    version: "5.6",
    title: "Universal Pokemon Coverage, Sharing Reborn & Quieter Errors",
    emoji: "\uD83D\uDCE1", // 📡
    highlight: true,
    items: [
      // ── Universal Pokemon coverage ──
      { type: "new" as const, text: "Every Pokemon, every form, every Mega now resolves automatically — including Champions-exclusive forms like Mega Manectric and Mega Golurk that previously rendered with no spread. Backed by the canonical Pokemon Showdown dataset (@pkmn/dex), so future game patches just work without us shipping data updates." },
      { type: "fixed" as const, text: "Pokemon spread (EVs / Stat Points) is now always visible even when the species isn't in our static dex — the entire stat block was previously hidden when data was missing, swallowing your own EV investment numbers." },
      { type: "improved" as const, text: "Mobile spread view now shows the per-stat investment column (+252 EVs / +252 SP) inline. Previously hidden behind a desktop-only breakpoint, so mobile users only saw final calculated stats." },

      // ── Shared report unfurls ──
      { type: "new" as const, text: "Persistent ShareDock on every shared report — X/Twitter, Reddit, Discord copy and Copy Link are one tap away in a top-anchored pill, no longer buried in the navbar. Auto-hides on scroll-down so it never obscures slide content." },

      // ── Tour / first run ──
      { type: "improved" as const, text: "First-run walkthrough is now skippable from any step — close X, ESC, backdrop tap, and Skip All all work on the very first session. Previously trapped first-time users." },

      // ── Performance ──
      { type: "improved" as const, text: "Cumulative Layout Shift reduced on /dashboard and /explore — loading states now reserve the eventual content height so the page doesn't reflow when fetches resolve." },

      // ── Reliability / silent fixes ──
      { type: "fixed" as const, text: "View Transition aborts during rapid navigation no longer surface as errors. The visual transition is the same; the noise is gone." },
      { type: "fixed" as const, text: "ServiceWorker install hardened — single failed cache.put for the offline page no longer fails the entire install." },
      { type: "fixed" as const, text: "ChunkLoadError after a deploy is now suppressed before being captured — the page already auto-reloads, so the error never needed to surface." },
      { type: "fixed" as const, text: "Third-party SDK loading failures (Clerk CDN blips) are filtered from error tracking — they're not bugs in the app and were polluting the dashboard." },
    ],
  },
  {
    date: "April 2026",
    version: "5.5",
    title: "Forking, Sharing & Champions Polish",
    emoji: "\uD83C\uDF74", // 🍴
    highlight: true,
    items: [
      // ── Fork feature ──
      { type: "new" as const, text: "Fork Report button — signed-in viewers can now fork any public report into a new editable copy they own, preserving the team, notes, calcs, roles, matchup plans, and tags. Forks start private so you can iterate before publishing." },
      { type: "new" as const, text: "Fork attribution banner — every forked report shows a prominent banner at the top with a \"View original\" link back to the source, so lineage is always clear. If the original is deleted the banner degrades gracefully." },
      { type: "improved" as const, text: "Forks clear event-specific fields on creation — creator name, tournament name, placement, record, rental code, and MVP pick are reset so the new owner starts with a clean slate, while all team-building content (paste, EVs, notes, calcs, plans) is preserved." },
      { type: "improved" as const, text: "Fork is restricted to public reports only — unlisted reports stay the owner's. Link possession grants view, not the right to copy the team into a new report." },

      // ── Sharing & publishing ──
      { type: "new" as const, text: "Thank-you banner when publishing — the first time you make a report public, a celebratory banner appears so you know it's live on Explore." },
      { type: "improved" as const, text: "Private reports now act as unlisted — anyone with the /s/{id} link can view, but the report stays off Explore. Edit access still requires ownership or the collaborator link." },
      { type: "improved" as const, text: "Share session state clears when navigating away from /s/{id} — avoids the bug where the next Share click silently overwrote the previous report with the current in-memory state." },
      { type: "improved" as const, text: "Shared report read path is now fault-tolerant to in-flight migrations — the fork-lineage lookup can't break /s/{id} for end users if the column hasn't been added yet." },

      // ── SP/EV system ──
      { type: "improved" as const, text: "SP/EV toggle redesigned as an iOS-style segmented control with symmetric labels and live status dots — instantly see whether your spread is under, over, or exactly at budget in either mode." },
      { type: "improved" as const, text: "Champions meta threats now filter to Reg M-A legal Pokemon only, so speed-tier comparisons against the meta aren't polluted by Pokemon you'll never face in the format." },

      // ── Calcs input ──
      { type: "improved" as const, text: "Bulk paste affordance for notable calcs is now obvious — both Offensive and Defensive calcs show the bulk-paste button with clear hint text so you don't have to guess how to add multiple calcs at once." },
      { type: "improved" as const, text: "Bulk calc paste now splits on HKO boundaries (OHKO / 2HKO / 3HKO / etc.) so multi-target damage rolls from the calc site are parsed into separate entries. The category switcher is always visible, not hidden behind state." },

      // ── Fixes ──
      { type: "fixed" as const, text: "Fixed shared links briefly returning 500 and falling back to the home page after the fork feature rolled out — the new forked_from_id lookup is now isolated behind a try/catch and no longer breaks main share reads." },
      { type: "fixed" as const, text: "EV cap display corrected to 508/508 for traditional formats (the usable maximum — the last 2 EVs in a 252 slot provide no stat gain, so 252/252/4 is the optimized target)." },
      { type: "fixed" as const, text: "Champions (Reg M-A) EV tab no longer shows a misleading /510 comparison — SP (66) is the real cap in this format, and 66 SP can legitimately produce up to 516 EVs depending on distribution. The EV tab now shows the derived total only and its legality dot mirrors the SP status." },
      { type: "improved" as const, text: "Shared report links now use clean text-only unfurls in Discord / Twitter / Slack — the Satori-rendered OG preview image was removed because it kept rendering stale, mismatched, or mid-generation frames under Vercel's edge runtime budget. Link cards still show the title, creator, and team species list, just without a generated image." },
      { type: "fixed" as const, text: "Version-compare \"no diffs\" dismiss button is no longer hidden under the navbar — it now sits above it so you can actually click it." },
      { type: "fixed" as const, text: "Spotlight on the home page now only surfaces public reports — private/unlisted reports no longer leak into the featured carousel." },
      { type: "fixed" as const, text: "Vercel Toolbar now loads in development and preview deploys — the CSP img-src was blocking vercel.live and vercel.com assets." },
    ],
  },
  {
    date: "April 2026",
    version: "5.4",
    title: "Mega Evolutions, Champions Stat Points & Social Features",
    emoji: "\uD83D\uDD25",
    highlight: true,
    items: [
      { type: "new" as const, text: "Mega Evolution support — toggle Mega forms on any capable Pokemon, auto-detect from PokePaste imports, M-A threat coverage, and full Champions DEX integration." },
      { type: "new" as const, text: "Champions Stat Point system — EVs are displayed as stat points matching the Champions format, with unused and wasted stat warnings to help optimize spreads." },
      { type: "new" as const, text: "Auto-convert EV spreads to Champions SP format — traditional 0-252 EV spreads are automatically translated to the Champions stat point display." },
      { type: "new" as const, text: "Interactive hearts on report cards — like reports directly from Explore. Redesigned profile pages with updated layout." },
      { type: "new" as const, text: "Bookmark button for shared reports — non-owner viewers can now bookmark reports they find useful. Compact bookmark icon in the social section." },
      { type: "improved" as const, text: "Explore page filters simplified to a minimal single-row layout — removed the bulky AdvancedFilterDrawer overlay." },
      { type: "improved" as const, text: "Explore page mobile UX — teams are visible without scrolling, sticky header with proper scroll padding." },
      { type: "improved" as const, text: "Compare page now supports Mega Evolutions with correct types and equal grid layout." },
      { type: "improved" as const, text: "M-A Pokemon default to Champions SP display with an EV toggle for switching between formats." },
      { type: "improved" as const, text: "Like button requires sign-in — guests see a sign-in modal instead of a broken state." },
      { type: "fixed" as const, text: "Fixed like persistence and like counts always showing (even when 0) on shared reports." },
      { type: "fixed" as const, text: "Fixed EV-to-SP conversion to match the official Champions table values." },
      { type: "fixed" as const, text: "Fixed speed tier rounding to match the Pokemon game engine calculation." },
      { type: "fixed" as const, text: "Fixed PWA layout issues — navbar no longer covers content, speed tier slide fully visible." },
      { type: "fixed" as const, text: "Blocked sample teams from being saved as drafts or shares." },
      { type: "fixed" as const, text: "Exempted /api/setup from bot detection and CORS checks." },
    ],
  },
  {
    date: "April 2026",
    version: "5.3",
    title: "Slide Layout Overhaul & Professional Polish",
    emoji: "\uD83C\uDFA8",
    highlight: true,
    items: [
      { type: "new" as const, text: "Offensive and Defensive coverage split into separate slides \u2014 each chart gets a dedicated full-viewport slide instead of being crammed together." },
      { type: "new" as const, text: "Notable calcs now stack vertically on desktop \u2014 each category (Offensive/Defensive/Speed Tier) gets full width for readability, with collapsible groups." },
      { type: "new" as const, text: "Right column scrolls independently \u2014 notes and calcs panel has its own scroll area so the Add Calc input is always reachable." },
      { type: "new" as const, text: "Compare Teams prevents duplicate selection \u2014 you can no longer pick the same report for both Team A and Team B." },
      { type: "new" as const, text: "Tag requirement for publishing \u2014 reports must have at least one tag (regulation, event type, or archetype) before they can be listed on Explore." },
      { type: "improved" as const, text: "Game plans layout \u2014 3 plans stack vertically (no more cramped 33% columns), 2 plans go side-by-side only on large screens." },
      { type: "improved" as const, text: "Professional visual polish across all slides \u2014 larger tournament headings, accent-bordered summaries, thicker stat bars with shadow, hover micro-interactions on move tiles and calc entries." },
      { type: "improved" as const, text: "OG share images render at 2x resolution (2400\u00D71260) for crisp Discord and Twitter embeds." },
      { type: "improved" as const, text: "Slide container fits exactly between top navbar and bottom nav \u2014 no more content hidden behind either bar." },
      { type: "improved" as const, text: "Guest viewers see all notable calcs expanded by default." },
      { type: "fixed" as const, text: "Fixed share schema rejecting reports with hidden slides (string keys like \"matchup-sheet\" were rejected by the Zod validator)." },
      { type: "fixed" as const, text: "Fixed tag schema mismatch \u2014 tags are objects not arrays, which was blocking all saves on reports with tags set." },
      { type: "fixed" as const, text: "Explore tournament filter no longer force-opens the advanced filter drawer as a confusing overlay." },
    ],
  },
  {
    date: "April 2026",
    version: "5.2",
    title: "UX Feedback Polish",
    emoji: "\u2728",
    items: [
      { type: "new" as const, text: "Tour auto-shows on first visit \u2014 new visitors (including those arriving via shared Discord links) now see the guided tour automatically without needing to discover it." },
      { type: "new" as const, text: "\"Take a Tour\" in settings menu \u2014 the tour can now be re-triggered anytime from the overflow/settings menu, making it easy to find." },
      { type: "new" as const, text: "Tap to navigate on mobile \u2014 tapping a Pokemon tile on mobile now navigates directly to its detail slide. Long-press still works too." },
      { type: "improved" as const, text: "Progress bar help tooltip \u2014 the ? icon on the navigation bar now explains the bar itself instead of launching the full site tour." },
      { type: "improved" as const, text: "Slide label replaces M/N counter \u2014 the navigation bar now shows the current slide name instead of a numeric \"3/14\" counter that felt like progress tracking." },
      { type: "fixed" as const, text: "Mobile layout shift fixed \u2014 useIsMobile and useMediaQuery now use useSyncExternalStore, eliminating the flash where mobile pages briefly rendered as desktop." },
      { type: "fixed" as const, text: "Cookie consent no longer blocks the page \u2014 the entire site was hidden until cookies were accepted. Analytics are now gated independently while the page always renders." },
    ],
  },
  {
    date: "April 2026",
    version: "4.11",
    title: "Security Hardening & Notes Consolidation",
    emoji: "\uD83D\uDD12",
    items: [
      { type: "improved" as const, text: "EV Rationale merged into Notes \u2014 the separate \"EV Rationale\" section has been removed. All per-Pokemon notes are now in a single Notes field. Existing EV rationale content has been migrated into notes." },
      { type: "fixed" as const, text: "API security hardening \u2014 protected the setup endpoint with bearer token auth, removed spoofable User-Agent cron authentication, and fixed a credential scope issue in the bot route." },
      { type: "fixed" as const, text: "Fixed 6 npm dependency vulnerabilities including a high-severity SSRF in @clerk/backend. Next.js updated to 16.2.2." },
      { type: "improved" as const, text: "Removed dangerouslySetInnerHTML usage \u2014 translation strings now render as plain text instead of raw HTML." },
      { type: "improved" as const, text: "Share route input validation \u2014 the Zod schema now explicitly defines all accepted fields and strips unknown data instead of passing it through." },
      { type: "improved" as const, text: "Deduplicated report normalization \u2014 the share and migrate routes now use a single shared normalizer instead of maintaining two copies." },
      { type: "fixed" as const, text: "Rate limiter no longer uses setInterval on serverless \u2014 replaced with lazy cleanup to avoid cold start issues on Vercel." },
    ],
  },
  {
    date: "March 2026",
    version: "4.10",
    title: "Level 50 Enforcement",
    emoji: "\u2696\uFE0F",
    items: [
      { type: "fixed" as const, text: "All Pokemon are now forced to level 50 \u2014 pasting a level 100 team (or any non-50 level) no longer carries that level through to stat calculations. Stats are always computed at the VGC-standard level 50." },
    ],
  },
  {
    date: "March 2026",
    version: "4.9",
    title: "Mobile UX Overhaul & Responsive Redesign",
    emoji: "\uD83D\uDCF1",
    highlight: true,
    items: [
      { type: "new" as const, text: "Card-based Pokemon detail on mobile \u2014 hero header with tabbed cards (Set, Stats, Notes, Calcs) so each section gets full screen width instead of a cramped single column." },
      { type: "new" as const, text: "Draggable progress bar \u2014 replaces dot indicators on mobile for slide navigation. Tap or drag to scrub through slides with haptic feedback and a floating label tooltip." },
      { type: "new" as const, text: "Team Coverage slide \u2014 offensive and defensive coverage charts are now their own dedicated slide with tabs on mobile, stacked on desktop. No longer buried at the bottom of the speed tier chart." },
      { type: "new" as const, text: "Game plan tabs (G1/G2/G3) \u2014 on mobile, matchup game plans display as swappable tabs instead of a long stacked list." },
      { type: "new" as const, text: "Update Team re-import \u2014 \u201CUpdate Team\u201D button on the overview slide lets you paste a new PokePaste URL, Pikalytics URL, or Showdown export to replace the team without starting over." },
      { type: "new" as const, text: "Edit mode FAB \u2014 floating action button (bottom-right) for toggling edit/view mode. Pencil = editing, eye = viewing. Works on both mobile and desktop." },
      { type: "new" as const, text: "Pull-to-refresh \u2014 custom pull-down gesture for shared reports in PWA standalone mode (where native pull-to-refresh is disabled)." },
      { type: "new" as const, text: "Long-press gesture \u2014 long-press a Pokemon card in the team overview to jump directly to its detail slide." },
      { type: "new" as const, text: "Haptic feedback \u2014 light vibration on tab switches, edit mode toggle, share actions, and progress bar scrubbing for a native app feel." },
      { type: "improved" as const, text: "Opponent team horizontal scroll \u2014 matchup plan opponents display as a swipeable horizontal strip on mobile instead of a cramped 3-column grid." },
      { type: "improved" as const, text: "Coverage chart touch targets \u2014 type effectiveness cells are now 36px on mobile (up from 28px). Tap a type column header to highlight it across all Pokemon." },
      { type: "improved" as const, text: "Tournament mode cards redesigned \u2014 compact layout on mobile with sprite + info row and 2\u00D72 move grid. 3-column grid on large screens." },
      { type: "improved" as const, text: "Navbar decluttered \u2014 moved Tournament mode, PDF export, Version history, Collab link, and Present mode into the settings overflow menu. Navbar now shows only Share/Save + settings gear." },
      { type: "improved" as const, text: "Own reports auto-enter edit mode \u2014 authenticated owners and ?key= edit links go straight to editing. Other viewers see read-only with the FAB to toggle." },
      { type: "improved" as const, text: "Bottom padding increased on mobile PWA \u2014 all slide content now clears the fixed nav bar + safe area inset so calcs, notes, and game plans are fully scrollable." },
      { type: "fixed" as const, text: "Fixed swipe conflict on coverage charts \u2014 horizontal scrolling inside coverage tables no longer triggers slide navigation." },
      { type: "fixed" as const, text: "Fixed duplicate swipe handlers \u2014 removed the window-level touch handler that was fighting with the container-scoped one, causing scroll issues in PWA." },
      { type: "fixed" as const, text: "Fixed hydration flash \u2014 mobile/desktop layouts now use CSS media queries instead of JS detection, eliminating the brief layout shift on page load." },
    ],
  },
  {
    date: "March 2026",
    version: "4.8",
    title: "PDF Export Overhaul",
    emoji: "\uD83D\uDCCE",
    items: [
      { type: "fixed" as const, text: "PDF export now works reliably \u2014 print container uses a React portal to render as a direct child of <body>, fixing the blank page issue." },
      { type: "fixed" as const, text: "PDF always uses light-mode colors \u2014 all CSS variables are forced to light-mode values inside the print container, so exports are readable regardless of dark mode." },
      { type: "improved" as const, text: "All collapsed sections expand automatically in PDF \u2014 damage calc groups (Offensive, Defensive, Speed) and game plan details are forced open during export." },
      { type: "improved" as const, text: "Print styles force readable text, backgrounds, and borders \u2014 surface, text, and border colors are explicitly overridden for white paper." },
    ],
  },
  {
    date: "March 2026",
    version: "4.7",
    title: "Tournament Mode, Themes, Champions SEO & 17 Fixes",
    emoji: "\uD83C\uDFC6",
    highlight: true,
    items: [
      { type: "new" as const, text: "Tournament Day mode \u2014 compact battle assistant activated via the trophy icon in the navbar. Shows condensed Pokemon cards (moves, item, ability, Tera type) and a speed tier quick reference. Works fully offline." },
      { type: "new" as const, text: "Referral reward themes \u2014 unlock accent color themes (Ocean Blue, Emerald, Amber, Violet, Sunset) based on your total report views. Selectable on your profile page with live preview." },
      { type: "new" as const, text: "Champions SEO pages \u2014 32 individual landing pages for every Mega Evolution at /champions/[pokemon] with full stats, teams from explore, related Megas, and JSON-LD structured data." },
      { type: "new" as const, text: "Account privacy controls \u2014 toggle your creator profile between public and private from the profile settings page." },
      { type: "new" as const, text: "Publish to Community prompt \u2014 when sharing a private report, a banner asks if you want to publish it to the Explore page." },
      { type: "new" as const, text: "Email notifications for comments \u2014 report owners receive a branded email via Resend when someone comments on their report." },
      { type: "new" as const, text: "Offline cached reports \u2014 previously viewed reports load from cache at tournaments. An amber banner shows when viewing a cached version offline." },
      { type: "new" as const, text: "Pending invite badge \u2014 the Shared tab shows a purple count badge when you have collab invites waiting." },
      { type: "improved" as const, text: "Social share cards \u2014 richer OG images with gradient backgrounds, context-aware placement badges (gold/silver/bronze), adaptive sprite sizing, and a branded bottom bar." },
      { type: "improved" as const, text: "Dynamic sitemap \u2014 all public reports now included in the sitemap for better search engine indexing." },
      { type: "improved" as const, text: "Collab notifications now include a deep link to /dashboard?tab=collab so users can accept invites directly." },
      { type: "improved" as const, text: "Daily ops deduplication \u2014 the cron no longer creates duplicate Linear tickets for the same recurring issue." },
      { type: "improved" as const, text: "WCAG 2.1 AA accessibility \u2014 improved text contrast, viewport zoom enabled, skip-nav target, form labels, and aria-labels on icon buttons." },
      { type: "improved" as const, text: "Performance \u2014 lazy-loaded html2canvas, jsPDF, qrcode, and social components. Removed unused @smogon/calc dependency (~500KB saved)." },
      { type: "fixed" as const, text: "Fixed share page not loading \u2014 internal API fields were leaking into report state." },
    ],
  },
  {
    date: "March 2026",
    version: "4.6",
    title: "Co-Publishing, Collab Consent & Dashboard Polish",
    emoji: "\uD83E\uDD1D",
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 sm:pb-12">
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
