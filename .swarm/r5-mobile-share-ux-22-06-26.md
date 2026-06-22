# Mobile Share-to-View UX Research — VGC Team Report

**Subagent:** R5
**Date:** 2026-06-22
**Scope:** Share modal, recipient first-touch view, mobile vs desktop, PWA install prompts. Reference apps: Strava, Pinterest, Behance, Dribbble, Figma Community, TikTok.
**Status:** DRAFT — Wave 2 implements.

---

## Conflict check (`.swarm/main-changed-files.md`)

Files currently in flight on main include:

- `src/components/input/PasteInput.tsx`
- `src/components/report/{TeamReport,TeamOverview,SlideNavControls,CommonModesSlide,MatchupPlanSlide,SpeedTierChart}.tsx`
- `src/hooks/*` (useHomePage, useMatchupPlans, useSlideSystem, useTeamMeta, useWalkthrough)
- `src/lib/sharing/url-codec.ts`
- `src/components/social/CollaboratorPanel.tsx`
- `src/components/ui/PdfExport.tsx`
- i18n translations
- `src/app/page.tsx`

**Conflicts to flag for Wave 2:**

1. `src/lib/sharing/url-codec.ts` is being modified on main — Wave 2 should treat share-URL generation as a moving target. Any pattern that requires changes to the canonical share URL format must rebase after the in-flight work lands.
2. `src/components/social/CollaboratorPanel.tsx` is in flight — adding share affordances inside the collaborator/social surface (e.g., Pattern 4 below) should coordinate to avoid stepping on the same component.
3. `src/components/ui/PdfExport.tsx` is in flight — Pattern 3 (downloadable shareable artifact) should not duplicate effort if PdfExport is being repurposed.
4. No conflicts with `ShareModal.tsx`, `ShareDock.tsx`, `ShareViewCTA.tsx`, `InstallPrompt.tsx`, `src/app/s/[id]/*`, or `src/app/embed/[id]/page.tsx` — these are the proposed surfaces for the new patterns and they are currently quiet.

---

## Reference App Analysis (Mobile-Focused, June 2026)

### 1. Strava — segments / activities

- **Share modal.** Activity detail → share icon → fires **native OS share sheet directly** on mobile. No intermediate "pick a platform" modal. Desktop shows a small dropdown with copy-link + a few platforms. Order on mobile is the OS's own ranking of "share with apps you actually use."
- **OG image.** Server-generated 1200×630: route map thumbnail + distance/pace/elevation + athlete name + Strava logo. The card tells the story before the click. Discord/iMessage/X all unfurl to large-card format.
- **Recipient first-touch.** Logged-out visitor sees the full activity — map, splits, photos. Persistent bottom banner: "See [athlete]'s full profile — Download the app" on mobile, "Join Strava" on web. Nothing gated. Value first, ask second.
- **Mobile vs desktop.** Mobile = native share sheet front-and-center; desktop = copy-link primary, social icons secondary. Both surfaces emphasize the map card.
- **PWA install / app prompt.** Strava is native-app-first, but the mobile web push is well-timed: it appears after the visitor has scrolled the activity (engagement signal), not on page load.

### 2. Pinterest — pins / boards

- **Share modal.** Pin share = bottom sheet with WhatsApp, Messenger, X, Copy link, More (which is the native share sheet). On a board, a unique action: "Share board" auto-generates a vertical video montage of pin images — a literal shareable artifact designed for Instagram Stories.
- **OG image.** The pin image itself, cropped to 1200×630 with no chrome added. Strongest visual unfurl in the cohort.
- **Recipient first-touch.** Full pin visible. Sticky top banner: "Sign up to see more of what you love" with one-tap Google. **Intent-driven auth**: signup wall fires only when the user taps "Save", "Follow", or "Pin it" — never on mere viewing.
- **Mobile vs desktop.** Identical content surface; mobile gets a deeper bottom sheet (more share targets); desktop emphasizes "Pin it" embed code for bloggers.
- **PWA install.** Pinterest's mobile web actively suppresses the install prompt for first-visit referral traffic — they want users to convert to logged-in app users *before* asking for install. The prompt appears around session 2 or after a "Save" action.

### 3. Behance — shots / projects

- **Share modal.** Desktop-first: project page share icon opens a dropdown with X, Facebook, Pinterest, LinkedIn, Copy. **No native share sheet on mobile** — the mobile share feels like an oversight. This is the cohort's weakest mobile share pattern.
- **OG image.** Project's first image at full quality. Works because Behance is a curated portfolio — the hero shot is intentional.
- **Recipient first-touch.** Full project visible. Top banner promotes signup with **interest-based segmentation** ("pick your disciplines") — makes account creation feel purposeful. Hotspot tooltips guide post-signup users to Follow / Appreciate / Save.
- **Mobile vs desktop.** Same content. Mobile share is poor. Onboarding hotspots are desktop-only.
- **PWA install.** Not a meaningful pattern at Behance; Adobe pushes Creative Cloud installs separately.

### 4. Dribbble — shots

- **Share modal.** Mobile: floating "Share" → native OS share sheet. Desktop: dropdown with X, Facebook, copy link, embed iframe. Order favors copy-link first (designers paste into Slack/Notion).
- **OG image.** Shot's image at native aspect ratio, with creator avatar and shot title overlaid. Strong for X timeline appearances.
- **Recipient first-touch.** Full shot visible. **Soft wall**: Dribbble used to gate at 3 shots per session for logged-out users — current behavior is full visibility but a sticky "Like / Save" pair that triggers the signup modal. Same intent-driven auth pattern as Pinterest.
- **Mobile vs desktop.** Mobile uses native share sheet (better than Behance). Desktop has embed iframe and more analytics for the shot owner.
- **PWA install.** Not prominent.

### 5. Figma Community — files

- **Share modal.** No share modal. Sharing = copy URL from browser bar. The primary CTAs on the page are **Duplicate** (the conversion event) and Open in Figma. Both trigger signup for logged-out users.
- **OG image.** Author-uploaded cover image + file name + author avatar + Figma watermark. Quality-gated at publish time, so OG cards are uniformly polished.
- **Recipient first-touch.** Full file previewable. Sticky **Duplicate** button persists through scroll. Signup overlay only triggers on Duplicate click. **Post-signup, the user lands inside Figma with the file already duplicated** — instant aha, the strongest activation pattern reviewed.
- **Mobile vs desktop.** Mobile preview is read-only (no editor on mobile). Mobile users who click Duplicate get an email "open this on desktop" handoff. Acceptable because the audience is desktop-first.
- **PWA install.** Not a Figma pattern — they push the native app.

### 6. TikTok — videos

- **Share modal.** Mobile in-app: side rail share icon opens a vertically-stacked bottom sheet. **Order**: native OS apps the user actually messages with (rotated personally), then Repost, then Save, then Download, then platform integrations (Snap, IG, WhatsApp), then Copy link, then Report at the bottom. Tap-and-hold on the share icon performs a fast Repost. Power-user shortcut explicitly designed to lower friction.
- **OG image / link preview.** Square thumbnail of the video + creator handle + first-line caption. Discord previews are strong because the thumbnail is the video's first frame, already optimized for thumb-stoppage.
- **Recipient first-touch.** Logged-out web view: video autoplays muted with controls, captions on, creator handle and CTA "Open in app" persistent at top. Below the video: similar-videos feed (still no login required). **Login wall fires only on**: Follow, Like, Comment, or scrolling 3+ similar videos. Pure intent-driven auth, but with a soft-wall escalator (scroll-depth signal) that Pinterest doesn't use.
- **Mobile vs desktop.** Mobile web has aggressive "Open in app" deep links (universal links on iOS, intent: on Android). Desktop is a comfortable browsing surface — TikTok doesn't push downloads there.
- **PWA install.** Not formally a PWA — TikTok pushes the native app. But the "Open in app" deep link pattern with smart fallback to web view is the reference design for any share-to-web flow that has an installable app.

---

## Five Patterns That Consistently Boost Share → View Conversion

Ranked by expected lift for VGC Team Report.

### Pattern 1 — Rich OG image preview (CRITICAL, biggest single lever)

**What it is.** Server-render a 1200×630 OG image with the content's identity: route map (Strava), pin image (Pinterest), shot hero (Dribbble), cover art (Figma), thumbnail (TikTok). Custom OG images lift Discord/X click-through 2–5x vs. text-only previews. Discord webhooks with image embeds see ~40% higher engagement than plain links.

**Evidence.** Mobiforge / SEO-kreativ: 99.8% of mobile users never tap custom share buttons; CSS-Tricks reader poll: 60% never use them. The share count is dominated by users who never see your share UI at all — they see the OG card in a chat surface and click through. **The OG image is the share UI for most users.**

**VGC Team Report application.**
- `src/app/s/[id]/opengraph-image.tsx` is fully built (sprites, placement badges, gradient) but **suppressed** in `src/app/s/[id]/page.tsx` (`openGraph: { images: [] }`) because previous deploys timed out fetching sprites.
- Fix: pre-cache OG image at report-save time (server action), OR switch to bundled local sprite SVGs for the OG generator, OR move generation to a non-edge Vercel Function with 10s budget and a 1-hour CDN cache. The fallback gradient card should always render so no share is ever text-only.
- Conflict check: `src/lib/sharing/url-codec.ts` is in flight — Wave 2 should rebase but the OG generator itself is independent of URL codec changes.

### Pattern 2 — Native share sheet as the primary mobile action

**What it is.** On mobile, the most-tapped share path is the OS share sheet because it surfaces every messaging app the user actually uses, ranked by their personal habits. Strava, Pinterest, Dribbble, TikTok all elevate the native share sheet as the top mobile action. Custom platform buttons are noise on mobile.

**VGC Team Report application.**
- `src/components/ui/ShareModal.tsx`: the native share button (`canNativeShare`) currently appears LAST in the mobile button list, after Twitter / Reddit / Discord / Showdown paste. Mobile users have to scroll past 4 buttons to find the action that matches their intent.
- Wave 2 fix: when `canNativeShare === true` and viewport is mobile, move native share to the TOP of the social section, render it full-width and visually dominant ("Share via [iOS/Android]"). Demote platform-specific buttons into a "Or share to:" collapsed section.
- `src/components/ui/ShareDock.tsx` (if extant — referenced in prior research): native share and copy-link currently have identical accent color; differentiate so native share is primary.
- Linktree research insight (3–7 share targets perform best) confirms collapsing the platform list is a net win, not a loss.

### Pattern 3 — Intent-driven auth with full-content visibility

**What it is.** Show 100% of the content to logged-out visitors. Trigger the signup wall only when the visitor takes an action that REQUIRES an account (Save, Duplicate, Follow, Like, Comment, scroll-3-videos). Figma Community is the gold standard: Duplicate → signup → land in editor with the file already duplicated. TikTok escalates with a scroll-depth soft signal.

**Evidence.** Every reference app except Behance now follows this pattern. The historical "view-gate" walls (Medium, Quora circa 2019) have been abandoned across the industry because they cap viral reach.

**VGC Team Report application.**
- `src/components/ui/ShareViewCTA.tsx`: "Like this team? Duplicate it" already follows the intent-driven pattern. Good. Two gaps:
  1. The extended benefit description is `hidden sm:block` — on mobile the visitor sees one short line. Wave 2: always show the one-liner benefit on mobile (smaller text size if needed).
  2. The CTA fires at page load. Defer until the visitor has scrolled past the first Pokémon slide (genuine engagement signal). Mirror TikTok's scroll-depth escalator.
- The visibility model (Private / Unlisted / Public) in `ShareModal.tsx` already supports the "anyone with link sees the content" stance for unlisted reports — no architectural change needed.

### Pattern 4 — Recipient-side identity context for first-touch viewers

**What it is.** A visitor arriving from a Discord link doesn't know what the app is. Strava's bottom banner ("See [athlete]'s profile on Strava") and TikTok's persistent creator handle + "Open in app" set context without gating content. Behance's interest-segmentation makes the eventual signup feel personal rather than bureaucratic. Linktree's "Made with Linktree" watermark is the lazy version — it works because it's persistent and curiosity-driven.

**VGC Team Report application.**
- For visitors with `document.referrer` external (Discord, X, Reddit) and no auth cookie, show a one-time micro-banner at top of `/s/[id]` view: *"This is a VGC team report — full EVs, damage calcs, matchups below. Built with VGC Team Report."* Dismissible, localStorage-persisted.
- In `ShareViewCTA.tsx`, add a one-line "what is this?" tooltip next to "VGC Team Report" — a small `i` icon that expands. Same intent: convert confused first-touch viewers into intentional signups.
- Conflict check: `src/components/social/CollaboratorPanel.tsx` is in flight. The identity-context micro-banner lives outside the collaborator panel, so no conflict, but Wave 2 should verify the new banner doesn't compete visually with the collaborator UI on mobile.

### Pattern 5 — PWA install prompt: deeply gated, conversion-event-triggered

**What it is.** web.dev's official guidance for 2026: do NOT show the install prompt on first visit. Wait for strong interest signals: second session, signed-in user, completed conversion (e.g., team saved, report shared). Pinterest waits for session 2 OR a Save action. Web.dev: "If the user dismisses your banner, don't show it again unless the user triggers a conversion event."

A 2026 industry trend cited in web.dev follow-ups: AI-timed prompts using engagement features lift install rate ~40% vs. simple time-based heuristics. Time-based heuristics ARE useful as a floor, but conversion-event triggers beat them.

**VGC Team Report application.**
- `src/components/ui/InstallPrompt.tsx` currently uses dual time + scroll engagement gates (60s dwell AND 200px scroll), plus a 14-day dismissal cooldown. **This is already above the median of what apps do.** Good.
- Gaps for Wave 2 to consider:
  1. **Session count gate.** Don't show on first session even if engagement gates pass. Persist a session count in localStorage; require >= 2 sessions OR a meaningful conversion event (report saved, share dock opened, duplicate completed). Current code shows on session 1 if engagement gates pass — that's more aggressive than web.dev recommends.
  2. **Conversion-event triggers.** After a user successfully saves their first report, shares a report, or duplicates someone else's team, mark `vgc-install-eligible` in localStorage and let the next page-view show the prompt regardless of dwell time. This is the highest-conversion moment.
  3. **Suppress for shared-link viewers on first touch.** A user arriving via `/s/[id]` from Discord is by definition a first-touch visitor with no context — the install prompt before they understand what the app does is hostile. Gate the InstallPrompt mount: don't show on `/s/[id]` routes for users with no prior sessions.
  4. **Snackbar over sheet for low-friction visits.** web.dev recommends 4–7s snackbar for the soft promotion, full sheet for the "ready to install" moment. Current implementation jumps straight to bottom sheet — consider a snackbar tier for second-session passive users and the sheet for engaged signed-in users.

---

## Mapping: Pattern → File / Surface

| Pattern | Primary file(s) | Conflict risk |
|---|---|---|
| 1. Rich OG image | `src/app/s/[id]/opengraph-image.tsx`, `src/app/s/[id]/page.tsx` (re-enable `openGraph.images`) | None — quiet files |
| 2. Native share primary | `src/components/ui/ShareModal.tsx`, `src/components/ui/ShareDock.tsx` (if present) | None |
| 3. Intent-driven auth + scroll defer | `src/components/ui/ShareViewCTA.tsx`, `/s/[id]` view scroll observer | None |
| 4. Identity-context banner | New micro-banner in `/s/[id]` shell, OR `ShareViewCTA.tsx` extension | Coordinate with in-flight `CollaboratorPanel.tsx` for mobile stack order |
| 5. PWA install gating | `src/components/ui/InstallPrompt.tsx` + new session/conversion tracker (localStorage) | None |

Embed surface (`src/app/embed/[id]/page.tsx`) is solid as-is — minimal HTML, lazy sprite img tags, click-through CTA. No changes proposed.

---

## Cohort Benchmark Table

| App | Mobile share modal | OG quality | First-touch view | Login wall trigger | PWA / app install |
|---|---|---|---|---|---|
| Strava | Native sheet immediate | Route map + stats | Full visible + bottom banner | Download/Save action | Engagement-triggered |
| Pinterest | Bottom sheet w/ targets | Pin image at 2:3 | Full visible + sticky top banner | Save action | Session 2+ / post-Save |
| Behance | Desktop-first dropdown | Hero shot | Full visible + Follow banner | Follow action | N/A |
| Dribbble | Native sheet | Shot image | Full visible + Like sticky | Like / Save | N/A |
| Figma Community | Browser URL copy | Cover art + author | Full visible + sticky Duplicate | Duplicate action | N/A (native push) |
| TikTok | Tall bottom sheet, OS apps first | Video thumbnail | Full visible + Open in App | Follow / Like / scroll 3+ | Deep link to app |
| **VGC Team Report (current)** | Modal w/ many buttons, native LAST | **Suppressed (text only)** | Full visible + ShareViewCTA | Duplicate action (good) | Time + scroll gated |

---

## Sources

- https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities
- https://support.strava.com/hc/en-us/articles/4418607378189-How-to-Get-and-Share-Links-From-Strava
- https://partners.strava.com/resources/how-to-share-and-reshare-activities
- https://help.pinterest.com/en/article/share-pins-and-boards-to-social-networks
- https://create.pinterest.com/en-in/blog/board-sharing-video-image-social-media/
- https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files
- https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes
- https://goodux.appcues.com/blog/behance-user-onboarding
- https://citrusbits.com/tiktok-an-analysis-on-usability-behavior-and-missed-opportunities/
- https://dribbble.com/resources/agencies/ultimate-dribbble-select-best-shots
- https://web.dev/articles/promote-install
- https://web.dev/learn/pwa/installation-prompt
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/How_to/Trigger_install_prompt
- https://love2dev.com/blog/beforeinstallprompt/
- https://css-tricks.com/ux-considerations-for-web-sharing/
- https://mobiforge.com/design-development/sharing-buttons-and-the-web-share-api
- https://www.seo-kreativ.de/en/blog/social-share-buttons-remove-or-replace/
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API
- https://env.dev/guides/opengraph
- https://ogmagic.dev/blog/complete-guide-open-graph-images
- https://www.agent37.com/blog/embed-maker-discord
