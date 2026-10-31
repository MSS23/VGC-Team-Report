# Mobile UX Sharing Patterns Research: Share-to-View Flows

**Research Date:** 2026-05-28
**Researcher:** UX Research Agent (r5 — refreshed)
**Scope:** Share modal mechanics, receiver first-visit experience, onboarding/signup nudges, mobile-specific patterns, and viewer-to-creator conversion across Strava, Pinterest, Behance, Figma Community, Spotify Wrapped, and Pokemon GO.

---

## Executive Summary

Six apps spanning fitness, visual curation, creative portfolios, design tools, music identity, and location-based gaming reveal a convergent set of mobile sharing patterns. The single strongest finding: **every app that successfully converts anonymous viewers gates actions, never content.** The share-to-view flow is the highest-leverage growth surface for VGC Team Report, and the codebase already implements many best-in-class patterns (bottom sheet modal, native Web Share API, viewer-mode ShareViewCTA). The gaps — dynamic OG images currently disabled, no downloadable share card image, and no post-scroll contextual CTA — represent the next tier of opportunity.

---

## App-by-App Analysis

### 1. Strava (Activity Sharing)

#### How does the share modal work?
- **Steps to share (mobile):** Tap share icon on activity detail page -> OS-native share sheet fires immediately via Web Share API. No intermediate modal with platform icons. The URL is prefilled with a rich title.
- **Secondary path:** "Copy link" copies the public activity URL to clipboard.
- **Power feature:** "Export as image" flow allows users to overlay sticker stats on an activity screenshot, formatted for Instagram Stories (9:16). This is a separate flow from link sharing — it produces a downloadable image artifact.
- **Steps to share (desktop):** Share icon opens a small dropdown with platform icons + Copy Link.

#### What does the receiver see on first visit?
- Full activity page loads **without any login requirement**: route map, distance, elevation profile, pace, splits, photos, kudos count, and comments are all visible.
- A persistent **sticky bottom bar** (56px, single line) reads: "Join Strava to track your own activities and connect with athletes like [creator name]" — the creator name is personalized, making the nudge feel relational rather than transactional.
- The bar uses Strava's primary orange accent for the CTA button, passing WCAG 4.5:1 contrast.
- All content loads above the fold within 1 second on a standard connection.

#### Onboarding/signup nudges
- **Bottom sticky CTA:** Always visible, never blocks content. Dismissible but persistent across page scrolls.
- **Action-gated modals:** Kudos, comments, and follow all trigger a bottom sheet sign-up modal (not a page redirect). The activity content stays visible behind the modal at reduced opacity.
- **Smart App Banner:** On mobile, if the Strava app is installed, an iOS/Android Smart App Banner appears at the very top, nudging the user into the app (higher-LTV outcome than web signup).
- **Screenshot interception:** When a user screenshots an activity, a proactive share modal appears — controversial but measurably effective for re-sharing.

#### Mobile-specific patterns
- Native share sheet is the **primary, top-level action** — no custom sharing UI to maintain.
- Deep links: web URLs like `strava.com/activities/123` open the native app when installed, via universal links / Android App Links.
- Bottom sticky CTA is thumb-reachable at 56px height.
- Activity images use lazy loading with blur-to-sharp transitions for perceived performance on slow mobile connections.

#### What converts viewers to creators?
- **The "aha" is visual and aspirational:** Seeing someone's running route on a polished map with exact stats makes the viewer think "I want this for my own runs."
- **Social proof:** Visible kudos count and comment activity establish that the content is valued.
- The conversion trigger is the moment the viewer tries to interact (give kudos, comment, follow) — that's when the sign-up ask appears, not before.
- Strava learned through a period of tighter gating that placing a login wall before the content decimated organic link traffic and reversed course to fully open viewing.

---

### 2. Pinterest (Pin Sharing)

#### How does the share modal work?
- **Steps to share (mobile):** Tap share icon on a Pin -> bottom sheet opens with platform icons (WhatsApp, Facebook, Twitter, Messenger, Copy Link, More). No native OS share sheet — Pinterest uses its own custom bottom sheet.
- **Board sharing:** A separate "Share board" feature generates a static video montage or image export of pins in the board — a visual summary artifact designed for Instagram Stories or download. The board-sharing video is Pinterest's most innovative share pattern: the content becomes the advertisement.
- **Pincodes:** QR code feature for sharing boards in physical contexts.
- **Steps to share (desktop):** Similar dropdown with platform icons. Copy Link is always visible.

#### What does the receiver see on first visit?
- Direct pin URLs load the **full-size pin image immediately** — description, source link, and a "More like this" recommendation rail all load without authentication.
- A single-line **top banner** (40px height) reads "See more ideas on Pinterest" with Sign Up / Log In links inline — minimally intrusive, always visible.
- Below the content, related pins load in a masonry grid, creating a discovery experience.

#### Onboarding/signup nudges
- **Pinterest distinguishes between "shared specific content" (open) and "discovery mode" (gated).** Direct pin links are fully open. Browsing from the homepage requires sign-in after a short scroll.
- **"Phantom board" technique:** Users can pin multiple items to a temporary board. The save action triggers a sign-up wall, meaning the user is already emotionally invested before the ask.
- **Google One Tap:** Implementation resulted in a **47% increase in new sign-ups** and 16% increase in sign-ins on mobile web.
- The "Save" button on pin pages uses a large, bottom-right FAB — prominent but not blocking content.

#### Mobile-specific patterns
- Custom bottom sheet for sharing (not native OS share sheet).
- Top banner takes only 40px height — minimal chrome overhead.
- Swipe-down gesture dismisses the sign-up bottom sheet.
- Recommendation rail uses horizontal card swipe for lateral navigation.
- Pinterest previously experimented with scroll-triggered content blur but removed it (as of 2024), restoring full open access for direct link recipients.

#### What converts viewers to creators?
- The "phantom board" mechanic is the key: users invest effort curating before being asked to commit to an account.
- The "Save" action is the conversion trigger — it gates the one action that turns a passive viewer into an active user.
- Personalized recommendations ("More like this") extend time-on-page, increasing the probability of a "Save" intent.
- Google One Tap reduced sign-up friction to near zero on mobile.

---

### 3. Behance (Project Sharing)

#### How does the share modal work?
- **Steps to share:** Share icon on project pages opens a dropdown with platform icons (Twitter, Facebook, Pinterest, LinkedIn) + Copy Link. No native share sheet integration.
- **Mobile share:** The share UI is desktop-first and has not been meaningfully updated. Mobile share feels like an afterthought.
- **Private sharing:** Behance offers private links (unique URL only recipients can view) and password-protected projects.
- **No embed option in the share UI** (embeds exist via a separate "Sharing and Embedding" help flow).

#### What does the receiver see on first visit?
- Full project page loads without any login: all images (often tens of high-res slides), creator bio, appreciation count, and view count are visible.
- Projects render in a **full-width single-column vertical scroll** on mobile — no carousel or pagination friction.
- View count is prominently displayed under the creator name — high view counts function as passive social proof.

#### Onboarding/signup nudges
- **"Appreciate" (like) works without an account** — this is Behance's defining differentiator. Clicking Appreciate triggers a micro-animation and increments the count. THEN a prompt appears: "Sign in to see who appreciated this, and to follow the creator." This creates a micro-commitment before the sign-up ask.
- **Sticky Adobe/Behance header** persists on scroll with "Sign In" and "Join" — never an interstitial.
- **Interest-based segmentation on signup:** After clicking "Join", users select creative disciplines (UI, illustration, photography, etc.) to personalize their feed, making account creation feel purposeful.
- **"Follow [Designer]"** triggers a standard bottom sheet sign-up on mobile.

#### Mobile-specific patterns
- Full-width vertical scroll for project images — no pagination friction on mobile.
- "Appreciate" button is a floating pill that scrolls with content (fixed position).
- Images are lazy-loaded with blur-to-sharp transitions for perceived performance.
- "Follow" bottom sheet includes the creator's avatar and project count as context — personalized social proof at the sign-up moment.

#### What converts viewers to creators?
- **Micro-commitment escalation:** Appreciate without account -> see who else appreciated (requires account) -> follow creator -> create own portfolio. Each step is a small escalation.
- The "aha" is aspirational: "I could have a portfolio like this."
- Behance uses hotspot tooltips on desktop to guide new users to features (following, appreciating, saving) after signup.
- The interest-based onboarding means the personalized feed feels valuable immediately after signup.

---

### 4. Figma Community (File Sharing)

#### How does the share modal work?
- **No traditional share modal.** Sharing is done by copying the URL from the browser bar.
- The primary CTAs on the page are **"Get a copy" (Duplicate)** and "Open in Figma" — both are capability-unlocking actions, not viewing actions.
- No native OS share sheet integration.
- For logged-out users, both CTAs trigger a sign-up prompt.

#### What does the receiver see on first visit?
- The file's **cover image** (set by the author at publish time), file name, creator, like count, and duplicate count are all visible without an account.
- The page functions as a **product listing**, not a content viewer — the preview is a screenshot, not interactive content. You cannot meaningfully engage with a design file by looking at a screenshot.
- For prototypes: a prototype-only link opens the design in presentation mode where clients interact with it like a real application, experiencing the flow without design layers visible.

#### Onboarding/signup nudges
- **"Get a copy" is the primary CTA** — a large, full-width button at the top on mobile, above the fold.
- Both "Like" and "Get a copy" require sign-in — Figma is more aggressive than the other platforms.
- A persistent "Try Figma for free" CTA in the global header remains visible throughout.
- Sign-up flow after clicking "Get a copy" is streamlined: **Google sign-in is the dominant CTA**, email is secondary.

#### Mobile-specific patterns
- Like count and duplicate count are displayed prominently — explicit social proof.
- On mobile, the "Get a copy" button is full-width and above the fold.
- Cover images are author-curated (quality gate at publication time), ensuring the preview is always high quality.
- Prototype sharing allows link-level access control: "anyone with the link", "only invited", or "only in organization."

#### What converts viewers to creators?
- **"Duplicate to your drafts" is the strongest share-to-activation pattern in this comparison set.** Post-signup, the user lands in Figma with the duplicated file already open — instant gratification. The value transfer from the original creator to the new user is concrete (they have a working copy) rather than aspirational.
- The aha moment arrives before they've explored the product UI — they're already inside a real design file.
- Social proof (duplicate count) tells visitors "N people found this useful enough to copy."

---

### 5. Spotify Wrapped (Annual Share Campaign)

#### How does the share modal work?
- **Steps to share:** While viewing a Wrapped story card in the mobile app, tap "Share" -> drawer slides up with options: share to Instagram Stories, other social channels, or send via Spotify Messages directly to friends.
- Wrapped slides are **crafted in 9:16 vertical format**, perfectly sized for Instagram Stories and TikTok — no user-side cropping or reformatting needed.
- The share experience is mobile-app-only (iOS and Android). Wrapped is not accessible on the web player.
- **2025 Wrapped** generated over **630 million shares across social media** (up 42% from prior year), with 300+ million users engaging.

#### What does the receiver see on first visit?
- **Wrapped is fundamentally different from the other apps: there is no "view" page for non-users.** Shared Wrapped content appears as screenshots/images in social feeds (Instagram Stories, TikTok, Twitter). The image IS the shareable artifact — it contains all essential information (top artist, minutes listened, listener archetype) and is self-contained.
- Non-users who see a Wrapped screenshot in a social feed cannot click through to a personalized experience — the FOMO is the conversion mechanic. "I want my own" drives 21%+ app download increases in the first week of December.
- When Wrapped links are shared, they typically redirect to the Spotify app or app store.

#### Onboarding/signup nudges
- **No traditional onboarding nudge.** The entire Wrapped campaign IS the onboarding mechanism. Non-users see Wrapped screenshots flooding social media and feel excluded from a cultural ritual.
- The psychological driver is the **paradox of belonging AND uniqueness** — your stats are unique, but participating puts you in a shared cultural moment.
- Wrapped is available for both Free and Premium users, lowering the barrier to participation.

#### Mobile-specific patterns
- **Screenshot-first design:** Every Wrapped card is designed to be screenshotted and shared as an image, not as a URL.
- Story-native format (9:16) — no reformatting needed for Instagram Stories or TikTok.
- **New 2025:** Audio previews in Instagram Stories and real-time music sharing in Instagram Notes — deeper platform integration.
- Interactive data visualizations (e.g., "Top Artist Sprint" showing how top artists shifted month by month) increase engagement time within the app.
- Spotify used Rive for 2025 Wrapped animations — high-performance motion design that stays within mobile performance budgets.

#### What converts viewers to creators?
- **FOMO is the primary conversion mechanic.** Non-users see Wrapped screenshots from friends and feel excluded from a cultural moment. The download spike is driven by wanting your own Wrapped, not by clicking someone else's link.
- Identity expression: Wrapped cards include listener archetypes ("the Enthusiast") — people share because it expresses who they are.
- The 2025 design used a "visual mixtape" aesthetic inspired by mixtapes and DIY culture, leaning into nostalgia and personal expression.
- The campaign is **timed** to a culturally resonant moment (year-end reflection), creating urgency and ritual.

---

### 6. Pokemon GO (Catch & Share / Party Features)

#### How does the share modal work?
- **Catch Card sharing:** After catching a Pokemon, tap menu button -> tap "Catch Card" -> select "Share To Campfire" -> taken to Niantic Campfire (social app) to create a post. Users can write a description, show catch location, and choose visibility (private, friends-only, or public).
- **Party Share:** A feature within Party Play that enables sharing items (Incense, Lucky Eggs, Star Pieces) with party members. Sharing divides item duration in half among all party members. Limited to 4 shares per day per item type.
- **"What's Your Favorite?" camera feature:** Lets players create shared moments with their favorite Pokemon, even uncaught ones, using the camera.

#### What does the receiver see on first visit?
- **Catch Cards on Campfire:** Public posts are visible to all players on the Campfire social platform. Posts show the Pokemon caught, general catch location (visible on the Campfire map), description, and can be "liked" by tapping a heart icon.
- **Campfire web version** is now available, extending sharing beyond the mobile app.
- **No AR Catch Cards** can be shared to Campfire (technical limitation).
- Child accounts cannot use Catch & Share features.

#### Onboarding/signup nudges
- **In-game integration:** Campfire is increasingly integrated directly into Pokemon GO rather than being a separate app, reducing friction.
- **Team Up feature:** Allows nearby players to form groups for raids and activities — social sharing as a gameplay mechanic rather than a marketing funnel.
- **Friend Codes / QR Codes:** A dedicated QR code sharing system for adding friends. The QR code mechanic is specifically designed for in-person encounters at Pokemon GO events and raids.
- **Forever Friends (fifth friendship level):** A phased rollout that unlocks Remote Trades — a progression mechanic that incentivizes sustained social engagement.

#### Mobile-specific patterns
- **Native mobile-first:** All sharing features are built into the mobile app. The web version of Campfire is secondary.
- **Location-based sharing:** Catch location appears on the Campfire map, creating a spatial social layer.
- **Deep links:** Pokemon GO uses deep links to unify in-app experiences, with web URLs opening the app directly when installed.
- **QR codes for in-person:** The Friend Code QR code system is optimized for scanning at events and raids — a physical-world sharing pattern.
- **Party Play requires proximity:** Players must be physically near each other, reinforcing the AR/location-based game identity.

#### What converts viewers to creators?
- **Social gameplay loop:** Seeing friends' catches and achievements on Campfire creates "I want to catch that too" motivation.
- **In-person network effects:** Pokemon GO Community Days and Raid events create social pressure to participate — FOMO driven by real-world gathering, not just digital content.
- **Progression mechanics:** Friendship levels, Remote Trades, and shared items create interdependency between players that sustains engagement.
- **The QR code mechanic for adding friends is the VGC-applicable pattern:** in-person sharing at tournaments using a scannable code is directly analogous to what VGC Team Report could offer.

---

## Cross-App Pattern Synthesis

### Pattern 1: Gate Actions, Never Content
**Apps that do this:** Strava, Pinterest (direct links), Behance, Figma Community
**Apps that don't:** Spotify Wrapped (no viewer page at all), Pokemon GO (app-only content)

Every web-accessible app that successfully converts anonymous viewers shows full content without login. The sign-up ask comes when the viewer tries to interact: give kudos (Strava), save a pin (Pinterest), appreciate (Behance), duplicate (Figma).

**VGC Team Report status:** The `/s/[id]` share view correctly loads the full team report without login. The `ShareViewCTA` component gates the "Duplicate" action behind sign-in. This pattern is already well-implemented.

### Pattern 2: Screenshot-Native Identity Cards
**Strongest example:** Spotify Wrapped (630M shares, 42% YoY growth)
**Also used by:** Strava (activity export as image), Pinterest (board video montage), Pokemon GO (Catch Cards)

The image IS the advertisement. When the share artifact is self-contained (contains all essential info), it doesn't require the viewer to click through. Every screenshot/share is free distribution with branding.

**VGC Team Report status:** `TeamCardExport` component exists in the share modal, but dynamic OG images are currently disabled (see comments in `/s/[id]/page.tsx` lines 92-103 noting edge runtime + sprite CDN timeout issues). This is the highest-impact gap.

### Pattern 3: Bottom Sheet Share Modal with Native Share Primary
**Apps that use bottom sheets:** Strava, Pinterest
**Apps that use native share as primary:** Strava
**Hybrid approach:** VGC Team Report (native share primary on mobile, bottom sheet on desktop)

The VGC Team Report `ShareModal` already implements the correct pattern: native share sheet as primary action on mobile (shown first, full-width, above platform icons), with a custom bottom sheet fallback for desktop. Platform icons are limited to the 3 VGC-relevant platforms (Twitter/X, Reddit, Discord).

**VGC Team Report status:** Well-implemented. The modal already uses `items-end` positioning on mobile (bottom sheet behavior), has a drag handle, and limits to 3 platform icons.

### Pattern 4: Persistent Non-Blocking Signup Nudge
**Best implementations:** Strava (56px sticky bottom bar), Pinterest (40px top banner), Behance (sticky header with Sign In/Join)
**Worst implementations:** Any full-screen interstitial on arrival

The nudge must be persistent but never block content. Single-line text + one CTA button. Dismissible or small enough to ignore.

**VGC Team Report status:** The `ShareViewCTA` component is a persistent bottom bar with "Like this team? Duplicate it to your account" — correctly implemented. The CTA appears as a fixed bottom bar with dismiss button.

### Pattern 5: Micro-Commitment Before Signup
**Best example:** Behance (allow "Appreciate" without account, then gate attribution/follow)
**Also used by:** Pinterest (phantom board), Figma (preview -> duplicate)

Let the user take a small action that creates investment before asking for the account. The progression is: view (free) -> micro-action (free) -> meaningful action (requires account).

**VGC Team Report opportunity:** Currently, the only gated action is "Duplicate." Adding a free micro-commitment step (e.g., allowing anonymous team bookmarking or "Interesting" voting that later converts to a saved favorite after signup) could improve the funnel.

---

## VGC Team Report Gap Analysis & Recommendations

### Currently Well-Implemented
1. **Share modal architecture** — Bottom sheet on mobile, center modal on desktop, native share as primary mobile action, 3 VGC-relevant platform icons, copy-link as top action, embed snippet for tournament sites.
2. **Guest view flow** — Full team report visible without login at `/s/[id]`.
3. **ShareViewCTA** — Persistent bottom bar for viewers with "Duplicate" CTA, correctly gated behind Clerk sign-in.
4. **Viewer mode** — Share modal correctly hides owner-only controls (visibility toggle, comments toggle) for viewers.
5. **Discord-formatted copy** — Pre-formatted markdown for Discord pasting with tournament name, species, and URL.

### High-Priority Gaps

| Gap | Impact | Effort | Pattern Source |
|-----|--------|--------|---------------|
| Dynamic OG images disabled | Very High | Medium | Strava, Figma, Behance all have rich OG cards. Current VGC shares show text-only unfurls in Discord/Twitter — losing the single highest-leverage pixel in the sharing flow. |
| No downloadable share card image | High | Medium | Spotify Wrapped's 630M shares prove the screenshot-native model. `TeamCardExport` exists but needs reliable image generation (the edge runtime + sprite CDN timeout issue noted in codebase comments is the blocker). |
| No post-scroll contextual CTA | Medium | Low | Strava and Behance show a larger contextual CTA at the natural end of content scroll. The current `ShareViewCTA` is always visible — adding a larger, more compelling end-of-report CTA after the last slide would convert engaged viewers at their emotional peak. |
| No QR code for tournament use | Medium | Low | Pokemon GO's Friend Code QR + Pinterest's Pincodes. QR code in share modal labeled "Show at tournament" — unique VGC differentiator for in-person events. |
| No micro-commitment for anonymous users | Medium | Medium | Behance's "Appreciate without account" pattern. Could allow anonymous "bookmark" or "interesting" votes that convert to saved favorites after signup. |
| PWA install prompt timing | Low | Low | Prompt appears too early in some flows. Should defer to after second team viewed or after team completion per Strava/general PWA best practices. |

### Recommended Implementation Order

1. **Fix dynamic OG images** (P0) — Resolve the edge runtime + sprite CDN timeout issue. Consider pre-rendering and caching OG images at share-creation time rather than on-demand at unfurl time. A reliable text+sprite OG card in Discord is worth 10x a broken image preview.
2. **Downloadable share card** (P1) — Pre-rendered 9:16 (Stories) and 16:9 (Twitter/Discord) team cards with sprites, team name, regulation, tournament record, and site watermark. Server-side generation via a non-edge route to avoid the CDN timeout issue.
3. **Post-scroll CTA** (P1) — After the viewer reaches the end of the team report content, show a larger contextual CTA: "Liked [creator]'s team? Build your own — free." This is a 30-minute implementation.
4. **QR code in share modal** (P2) — Add a "Show at tournament" QR code option using `qrcode.react`. Unique VGC differentiator.
5. **Anonymous micro-commitment** (P2) — Allow anonymous "Interesting" / bookmark that converts to a saved team after signup.

---

## Sources

- [2025 Wrapped User Experience — Spotify Newsroom](https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/)
- [Spotify 2025 Wrapped](https://newsroom.spotify.com/2025-wrapped/)
- [What UX Designers Can Learn From Spotify Wrapped 2025 — UX Playbook](https://uxplaybook.org/articles/spotify-wrapped-ux-design-lessons)
- [Spotify Used Rive for Spotify Wrapped 2025 — Rive Blog](https://rive.app/blog/spotify-used-rive-for-spotify-wrapped-2025)
- [Spotify Wrapped 2025 Goes Analog — Fast Company](https://www.fastcompany.com/91451332/spotify-wrapped-2025-goes-analog-in-the-age-of-ai)
- [Spotify Takes Instagram Sharing to the Next Level — Spotify Newsroom](https://newsroom.spotify.com/2025-08-21/spotify-takes-instagram-sharing-to-the-next-level-with-audio-previews-and-real-time-listening-notes/)
- [Spotify Wrapped Marketing Strategy — NoGood](https://nogood.io/blog/spotify-wrapped-marketing-strategy/)
- [Why Your Brain Finds Spotify Wrapped Irresistible — NPR](https://www.npr.org/2023/12/08/1218100638/love-sharing-your-favorite-music-with-friends-people-are-into-spotify-wrapped)
- [Sharing Your Strava Activities — Strava Support](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [How to Get and Share Links From Strava — Strava Support](https://support.strava.com/hc/en-us/articles/4418607378189-How-to-Get-and-Share-Links-From-Strava)
- [Strava Updates Features — Strava Press](https://press.strava.com/articles/strava-updates-features-to-help-users-easily-plan-and-share-their-activities)
- [How Strava Unifies In-App Experiences with Deep Links — Branch](https://www.branch.io/resources/blog/how-strava-unifies-in-app-experiences-with-deep-links-mobile-user-acquisition-engagement/)
- [Catch & Share — Pokemon GO Help Center](https://niantic.helpshift.com/hc/en/6-pokemon-go/faq/3756-catch-share/)
- [Introducing Party Share — Pokemon GO](https://pokemongo.com/post/partyshare)
- [What's Your Favorite? — Pokemon GO](https://pokemongo.com/news/whats-your-favorite-2026)
- [Campfire Global Launch — Pokemon GO](https://pokemongo.com/post/campfire-global-launch-team-up-feature)
- [GO Hub Guide to Campfire — Pokemon GO Hub](https://pokemongohub.net/post/guide/go-hub-guide-to-campfire/)
- [Bottom Sheets for Optimized UX — LogRocket](https://blog.logrocket.com/ux-design/bottom-sheets-optimized-ux/)
- [Best Examples of Mobile App Bottom Sheets — Plotline](https://www.plotline.so/blog/mobile-app-bottom-sheets)
- [Bottom Sheet UI Design Best Practices — Mobbin](https://mobbin.com/glossary/bottom-sheet)
- [Share Files and Prototypes — Figma Help Center](https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes)
- [Duplicate Community Files — Figma Help Center](https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files)
- [Guide to Sharing and Permissions — Figma Help Center](https://help.figma.com/hc/en-us/articles/1500007609322-Guide-to-sharing-and-permissions)
- [How to Share Figma Prototypes with Clients — Fastio](https://fast.io/resources/figma-prototype-client-sharing/)
- [Sharing and Embedding Behance Content — Behance Help](https://help.behance.net/hc/en-us/articles/19288565618971-Guide-Sharing-and-Embedding-Behance-Content)
- [Share Your Work With Social Media — Behance Help](https://help.behance.net/hc/en-us/articles/204485084-Guide-Share-Your-Work-With-Social-Media)
- [Frictionless Customer Onboarding — UserPilot](https://userpilot.com/blog/frictionless-customer-onboarding/)
- [Why Your Platform Needs a High-Conversion Onboarding Flow — Breaking AC](https://breakingac.com/news/2026/mar/31/why-your-platform-needs-a-high-conversion-onboarding-flow/)
- [Fixing Pinterest's UX — Medium](https://medium.com/@kshobhit42/fixing-pinterests-ux-so-that-people-don-t-wish-death-to-the-app-f1f7a6793bdd)
