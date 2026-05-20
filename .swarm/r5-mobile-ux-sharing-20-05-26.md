# Mobile UX Sharing Research — VGC Team Report
**Date:** 2026-05-20
**Scope:** Share-to-view flow analysis across Strava, Pinterest, Figma Community, Behance, Linktree + VGC Team Report codebase audit

---

## Reference App Analysis

### 1. Strava

**Share modal / share-sheet UX**
Strava's share flow is triggered from the activity detail page via a share icon. On mobile it fires the native OS share sheet immediately — no intermediate modal with platform icons. Tapping "Share" goes straight to the system share sheet (iOS/Android) with the activity URL prefilled and a rich title. For power users, a secondary "Copy link" path copies the public activity URL. A separate "Export as image" flow (sticker stats overlay) allows users to decorate their activity screenshot for Instagram Stories.

**Link preview / OG image quality**
Strava generates a rich OG image showing a map route thumbnail, key stats (distance, pace, elevation), athlete name, and the Strava logo — all rendered server-side. The preview is distinctive and immediately communicates the activity type. On iMessage/WhatsApp it shows a large-card format; on Twitter it falls back to summary_large_image. Click-through is high because the OG card tells the story before the link is opened: you can see it's a 5K run in a specific city at a specific pace without clicking.

**Copy-link vs native share vs embed**
- Native share is the primary CTA (top-level, tapped immediately)
- Copy link is secondary, surfaced after the native share or in the web version
- Embed iframes available for website embeds (separate settings page, not in share modal)
- No Discord or Reddit-specific formatted text — just the URL

**Onboarding after a shared link is opened by new user**
New users hitting a shared Strava activity URL see the full activity detail — map, stats, photos — but with a persistent bottom banner: "See [athlete]'s full profile on Strava — Download the app" (mobile) or "Join Strava to track your own activities" (web). The activity content is fully visible; nothing is gated. The sign-up ask is frictionless because value is delivered first.

**Aha moment for new users arriving via share**
Seeing the athlete's route on a map with exact pace and elevation in a polished card. The viewer immediately understands "I could have this for my own runs." The aha is visual and aspirational. The call to download is made when the viewer is already emotionally engaged with the content.

---

### 2. Pinterest

**Share modal / share-sheet UX**
Pinterest share is split by surface. On a Pin: the share icon opens a bottom sheet with platform icons (WhatsApp, Facebook, Twitter, Messenger, Copy link, More). On a Board: a separate "Share board" feature generates a static video montage or image export of pins in the board — a visual summary artifact designed for Instagram Stories or download. The board-sharing video is Pinterest's most innovative share pattern: the content becomes the advertisement.

**Link preview / OG image quality**
Pinterest link previews are exceptional. Every Pin URL resolves to an OG image that is the pin image itself (1:1 or 2:3 aspect ratio cropped to 1200×630), with no added chrome. The image dominates. Since pins are inherently visual and curated, the OG image is always high quality. There is no fallback card — if a pin lacks an image, it's not shareable from the share sheet.

**Copy-link vs native share vs embed**
- Share icon → bottom sheet with platform icons (no intermediate modal)
- Pincodes (QR codes) for board sharing in physical contexts
- Embed widget for websites (separate "Get widget" flow)
- No platform-specific formatted text pre-generation

**Onboarding after a shared link is opened by new user**
Logged-out visitors see the full pin or board with all images. A sticky top banner reads "Sign up to see more of what you love" with a Google Sign-In button. Below the content, a second CTA section promotes board creation. Nothing is hidden. The conversion hook is: you've seen one collection, sign up to save boards and discover more like it.

**Aha moment**
The moment of recognizing a curated board matches your exact taste. Conversion happens when the viewer wants to save the pin for later — click "Save" triggers the signup wall, meaning intent-driven auth rather than arbitrary gating.

---

### 3. Figma Community

**Share modal / share-sheet UX**
Figma Community file pages have no share modal. Sharing is done by copying the URL from the browser bar. The primary CTAs on the page itself are "Duplicate" (creates a copy in your drafts) and "Open in Figma". For logged-out users, both CTAs trigger a sign-up prompt.

**Link preview / OG image quality**
Figma Community generates an OG image for every published file showing the file's cover image (set by the author), the file name, the author's name and avatar, and a Figma logo watermark. Cover images are typically a polished screenshot of the design. This is high-fidelity because authors set intentional cover art when publishing — there's a quality gate at publication time. On Twitter/X the image renders at summary_large_image (large card) making it very visually prominent in timelines.

**Copy-link vs native share vs embed**
- URL copy from browser bar (no dedicated share button on most pages)
- "Duplicate to your drafts" is the primary action — turns viewer into user immediately
- No native OS share integration

**Onboarding after a shared link is opened by new user**
The file is fully previewable without an account. A sticky "Duplicate" button in the top right corner persists throughout the scroll. Clicking it opens a minimal sign-up overlay. The pattern: show maximum value first (full file preview), then gate the one action that converts a viewer into an active user (duplicate). Post-signup, the user lands in Figma with the duplicated file already open — instant gratification, the aha moment arrives before they've explored the product UI.

**Aha moment**
The duplicated file opens in the editor. The viewer becomes a creator instantly. This is the strongest share-to-activation pattern reviewed: the value transfer from the original creator to the new user is concrete (they have a working copy) rather than aspirational.

---

### 4. Behance

**Share modal / share-sheet UX**
Behance share is simple: a share icon on project pages opens a dropdown with platform icons (Twitter, Facebook, Pinterest, LinkedIn) plus a "Copy link". No native share sheet integration. The share UI is desktop-first and has not been meaningfully updated in years. Mobile share feels like an afterthought.

**Link preview / OG image quality**
Behance OG images are the project's first image at full resolution. Since Behance projects are creative portfolios, the first image is typically a hero shot at professional quality. OG tags are well-formed with title (project name + " on Behance"), creator, and description. The large image format (1200×630) renders well on all platforms.

**Copy-link vs native share vs embed**
- Copy link + platform icons (no native share)
- No embed option in the share UI

**Onboarding after a shared link is opened by new user**
New visitors see the full project with all images. A top banner promotes signing up: "Create your own portfolio on Behance — Join millions of creatives." A second sign-up CTA appears in a sidebar "Follow" button and in the footer. The key Behance pattern is **interest-based segmentation on signup** — after clicking "Join", users select their creative disciplines (UI, illustration, photography, etc.) to personalize their feed. This reduces friction by making account creation feel purposeful rather than bureaucratic.

**Aha moment**
Behance's aha is the personalized feed after onboarding — but that's one step removed from the share-to-view flow. For visitors arriving via share link, the aha is aspirational: "I could have a portfolio like this." Behance uses hotspot tooltips to guide new users to key features (following, appreciating, saving) after signup, converting passive admiration into active social behavior. The hotspot system (used on desktop) is a rare example of contextual feature discovery tied to the share funnel.

---

### 5. Linktree / bio.link

**Share modal / share-sheet UX**
Linktree is itself the share destination — the shared URL IS the landing page. There's no secondary share modal. The page design is minimal: profile photo, name, and a stack of link buttons. The "share" action from a visitor's perspective is none — they're there to click through to content. Linktree's own share feature (for the profile creator) is accessed from the dashboard and offers a native share sheet, QR code download, and copy link.

**Link preview / OG image quality**
Linktree generates OG images showing the profile photo and name, with the Linktree logo. These are minimally informative — they convey identity but not content value. bio.link similarly shows a profile card. Click-through for Linktree OG images depends almost entirely on who the creator is; the card itself adds little. This is the weakest OG preview strategy in the group.

**Copy-link vs native share vs embed**
- Profile creator: native share + copy link + QR code
- Visitors: no share mechanism — content is destination

**Onboarding after a shared link is opened by new user**
Visitors see the full Linktree page without any account wall. At the bottom of every Linktree page: "Made with Linktree" — a permanent watermark CTA. On some paid plans this watermark can be hidden. The conversion pattern is pure bottom-of-page brand exposure: "I want one of these for myself." No sign-up modal, no sticky CTA, no urgency. Conversion is entirely organic curiosity-driven.

**Aha moment**
For visitors: none — they're not being onboarded to Linktree, they're clicking through to external links. For new Linktree users who clicked "Made with Linktree": the aha is setup speed. Linktree promises and delivers a working page in under 3 minutes with no technical skill required. The contrast to "building a website" is the value prop.

**Linktree's best UX insight: 3–7 links perform best.** Data shows profiles with 3–7 links outperform those with more or fewer in click-through. This is a direct analogy for VGC: don't overwhelm visitors with too many share targets.

---

## VGC Team Report Codebase Audit

### Share Page (`/src/app/s/[id]/page.tsx`)
The `/s/[id]` route is a server-rendered redirect wrapper. It fetches report data to generate rich metadata (title, description) then immediately client-side redirects to `/?s=<id>`. The main page then hydrates the shared report.

**Key finding — OG image is intentionally disabled:**
```typescript
// images: [] is load-bearing: without it, Next.js falls back to the
// root /opengraph-image.tsx, which would show a generic site-wide
// image on every share link.
openGraph: { images: [] }
twitter: { images: [] }
```
The comment explains the decision: previous attempts at OG image generation failed (edge runtime + sprite CDN + unfurler timeouts). So all share links currently render as **text-only previews** in Discord, Twitter, iMessage, etc. The OG image infrastructure exists (`/src/app/s/[id]/opengraph-image.tsx`) and is fully implemented with sprite fetching, gradient cards, and placement badges — but it's been suppressed at the metadata level.

**OG image generator (`/src/app/s/[id]/opengraph-image.tsx`) capability:**
The generator builds a 1200×630 dark-themed card with:
- Tournament name and placement (with color-coded placement badges: gold/silver/bronze)
- Creator name, record, regulation tag
- 6 Pokémon HOME sprites (fetched from `play.pokemonshowdown.com/sprites/home/`)
- A fallback generic VGC card when no data
The sprite fetching has a 2500ms timeout per sprite; the total share data fetch has a 4000ms timeout.

### ShareModal (`/src/components/ui/ShareModal.tsx`)
A comprehensive bottom-sheet modal (slides up on mobile, centered on desktop) with:
- URL display row (monospace font, click-to-copy)
- Long URL fallback warning when DB short URL isn't available
- Social buttons: Twitter, Reddit, Discord (pre-formatted text), Showdown paste copy
- Native share button (Web Share API — conditional on `navigator.share` support, shown last)
- Team card download (visual PNG export)
- Embed iframe snippet
- 3-state visibility picker (Private / Unlisted / Public)
- Comments toggle
- "Just published" celebration banner
- Owner bookmark warning

**Mobile UX gap:** On mobile, the native share button appears at the bottom of a long scrollable list. A first-time mobile user may not scroll past Twitter/Reddit/Discord to discover the native share option — the most natural mobile action is buried. The native share button also lacks size context; it shows only on supported devices but is styled identically to the other buttons without visual hierarchy indicating it's the primary mobile action.

### ShareDock (`/src/components/ui/ShareDock.tsx`)
A floating pill anchored top-center of shared report views (just below the navbar). Provides inline access to Twitter, Reddit, Discord, and Copy Link without opening the modal. Auto-hides on scroll-down, reappears on scroll-up.

**Strengths:** Always visible at page-load, minimal UI, correct auto-hide behavior, native share as the first button on mobile (accent-colored pill).

**Gap identified:** The ShareDock native share button is hidden on desktop (`sm:hidden`), and on mobile it's the first button but competes visually with the Copy Link button (both use accent color). There's no clear visual hierarchy between "share via OS" and "copy link".

### ShareViewCTA (`/src/components/ui/ShareViewCTA.tsx`)
A fixed bottom banner shown to read-only viewers (non-owners) who haven't dismissed it. Prompts "Duplicate" — creating an editable fork in their account. For signed-out users, clicking Duplicate triggers Clerk's sign-in modal.

**Strengths:** Value-first positioning ("Like this team?"), specific benefit copy ("get an editable copy — change spreads"), intent-driven auth (sign-in only triggered on the desired action). Aligns with the Figma Community pattern.

**Gap:** The CTA text "Like this team? Duplicate it to your account" assumes the visitor already understands what VGC Team Report is. A new visitor from Discord or Twitter who has never heard of the app has no context for what "duplicate to your account" means or why they'd want it. The `sm:block` extended description is hidden on mobile — the one line "Like this team? Duplicate it to your account" is all a mobile visitor gets before seeing the Duplicate CTA.

### OG Metadata quality
Title generation is sophisticated — front-loads the most compelling signal:
1. `{tournamentName} — {placement}` (e.g., "NAIC 2026 — 1st Place | VGC Team Report")
2. `{tournamentName} | {speciesLine} VGC Team`
3. `{speciesLine} — VGC Team by {creatorName}`
4. Fallback generic

Description is well-crafted: placement hook + species bullet list + byline + "Full EV spreads, damage calcs, and matchup plans inside." as value prop close.

**But without an OG image, all this good metadata renders as plain text.** Text-only Discord embeds and Twitter cards perform significantly worse than image cards for click-through in niche gaming communities.

---

## Top 3 Improvements for VGC Team Report's Share Flow

### Improvement 1: Re-enable OG Image Generation (Critical)

**The problem:** The OG image generator (`opengraph-image.tsx`) is fully built but suppressed because previous deployments timed out. Every share link renders as text-only in Discord, Twitter, iMessage, and WhatsApp. In VGC communities on Discord, where links are shared constantly, a text-only embed is easy to scroll past. A visual card with Pokémon sprites and a gradient background would be the single highest-leverage improvement.

**Recommended fix:** Instead of fetching sprites at OG generation time (which causes timeouts due to the external sprite CDN + unfurler race), pre-generate or cache the OG image at report-save time, or switch to a static sprite approach using bundled/local sprite assets for the 6 most common Pokémon. Alternatively, move OG generation to a long-timeout Vercel Function (not edge runtime) with a 10-second budget, and add a CDN-level cache with a 1-hour TTL. The fallback card (generic VGC gradient) should always render, even when species data fails — any image is better than no image.

**Pattern borrowed from:** Strava (route map in OG), Figma Community (designer-set cover art), Pinterest (pin image as OG).

**Expected impact:** 2–4x higher click-through on shared links in Discord. Visual previews with Pokémon sprites are instantly recognizable to the VGC audience and communicate the report's content before the click.

---

### Improvement 2: Elevate Native Share as the Primary Mobile CTA

**The problem:** On mobile, the native share button (Web Share API) is positioned last in the ShareModal's button list, after Twitter, Reddit, Discord, and Discord copy — requiring users to scroll. In ShareDock, the native button is the first element (good!) but is styled identically to Copy Link (both use `bg-accent`), creating ambiguity. The most natural mobile action — tapping the OS share sheet — is not clearly the dominant option.

**Recommended fix:**
1. In `ShareModal.tsx`: Move the native share button to the TOP of the social actions section when `canNativeShare` is true. Make it larger (full-width, taller) with explicit label "Share via [iOS Share Sheet / Android Share]" to signal it opens the native OS sheet. Demote the platform-specific buttons (Twitter/Reddit) to a secondary "Or share to:" section below.
2. In `ShareDock.tsx`: Differentiate the native share button from the Copy Link button visually. Native share could use the accent color (current); Copy Link could use a ghost/outline style. This creates clear hierarchy: native share is primary, copy link is secondary.
3. Consider detecting mobile vs desktop at the hook level and auto-triggering the native share sheet on mobile when a user clicks the Share button in the Navbar — skipping the modal entirely for mobile users.

**Pattern borrowed from:** Strava (native share sheet as the first and primary action), Pinterest (bottom sheet with native actions first).

**Expected impact:** Increases share completion rate on mobile. The Web Share API fires the OS share sheet which surfaces every app the user has installed — WhatsApp, iMessage, Instagram Stories, Discord — without the app needing to list them explicitly.

---

### Improvement 3: Context-Aware Viewer Onboarding for New Users

**The problem:** `ShareViewCTA` says "Like this team? Duplicate it to your account" — which assumes the viewer knows what VGC Team Report is. A new user arriving from a Discord link in the r/VGC subreddit or from a tournament recap tweet has never heard of the app. They see a team report but have no obvious way to understand: (a) what this site does, (b) why they'd want an account, or (c) what "duplicate" means in this context.

The extended description on the CTA ("You'll get an editable copy — change spreads, add notes, share your version with the community") is only shown on `sm:block` (desktop). On mobile it's hidden, leaving only the bare CTA.

**Recommended fix:**
1. **Always show the one-line benefit** on mobile too. Change the current `hidden sm:block` description to always render, at a slightly smaller `text-[11px]` size if needed.
2. **Add a "What is this?" micro-tooltip or popover** next to the app name in the CTA, explaining in one sentence: "Build and share professional Pokémon VGC team reports." This costs zero screen space (question mark icon that expands on tap) and converts confused new visitors into intentional sign-ups.
3. **For completely new visitors (no cookies, referrer from external domain):** Show a contextual micro-banner at the TOP of the page (above the ShareDock, dismissible) explaining what they're looking at: "This is a VGC team report — view the full analysis, damage calcs, and matchup plans below." This pattern mirrors Behance's permanent top-of-page awareness banner and Strava's "See this athlete's profile on Strava" call. The banner can be suppressed after first visit via localStorage.
4. **Defer the Duplicate CTA** until the viewer has scrolled past the first Pokémon slide (indicating genuine engagement), rather than showing it immediately at page load when the viewer has seen nothing. Intent-driven auth (Figma/Pinterest pattern) converts better than time-driven auth.

**Pattern borrowed from:** Figma Community (duplicate after value delivery), Behance (interest-based segmentation post-signup, contextual hotspots), Pinterest (intent-driven auth — "Save" triggers signup wall only when the user actively wants to save).

**Expected impact:** Higher signup conversion from shared-link visitors, lower immediate bounce from new users confused about the app's purpose, and more activated users post-signup (they joined because they wanted the duplicate, so they're primed to use it).

---

## Benchmark Summary: Best Pattern Per App

| App | Best Pattern to Steal |
|-----|----------------------|
| **Strava** | Native share sheet as the primary mobile action; OG image that tells the story before the click (route + stats visible in the card) |
| **Pinterest** | Intent-driven auth — gate only the action the user wants (Save), not the content itself; board-to-video export creates a shareable artifact |
| **Figma Community** | "Duplicate" as the share-to-conversion moment; value first, gate only the one action that makes someone a user |
| **Behance** | Interest-based segmentation on signup makes account creation feel purposeful; hotspot tooltips contextually educate new users post-share |
| **Linktree** | 3–7 share targets maximum; more choices reduce conversion; "Made with Linktree" watermark as organic growth flywheel |

---

## VGC Team Report: Current State Assessment

| Component | Strength | Gap |
|-----------|----------|-----|
| `opengraph-image.tsx` | Fully built: sprites, placement badges, gradient | Suppressed — all shares render text-only |
| `ShareModal.tsx` | Rich options, focus trap, i18n, 3-state visibility | Native share buried last; long URL warning prominent but not actionable |
| `ShareDock.tsx` | Persistent, auto-hides, correct placement | Native share and copy link have identical visual weight |
| `ShareViewCTA.tsx` | Intent-driven auth, value-first copy | Mobile shows only one line; no context for new users unfamiliar with app |
| OG metadata | Sophisticated title/description generation | No image = text-only embeds in Discord/Twitter |

---

*Sources used in this research:*
- https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities
- https://support.strava.com/hc/en-us/articles/4418607378189-How-to-Get-and-Share-Links-From-Strava
- https://press.strava.com/articles/strava-updates-features-to-help-users-easily-plan-and-share-their-activities
- https://help.pinterest.com/en/article/share-pins-and-boards-to-social-networks
- https://create.pinterest.com/en-in/blog/board-sharing-video-image-social-media/
- https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes
- https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files
- https://goodux.appcues.com/blog/behance-user-onboarding
- https://linktr.ee/blog/bio-link-tool
- https://userpilot.com/blog/mobile-app-onboarding/
- https://nrewind.com/ux-best-practices-for-mobile-onboarding-flows/
