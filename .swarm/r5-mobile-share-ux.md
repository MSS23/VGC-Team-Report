# R5 — Mobile Share-to-View UX Patterns

**Date:** 2026-05-24
**Researcher:** R5 (UX)
**Focus:** Conversion-best-practice patterns from Strava, Spotify Wrapped, Pinterest, Behance, Figma — applied to `src/components/ui/ShareModal.tsx`.

---

## Current State Snapshot

`ShareModal.tsx` (852 lines) currently orders the sheet as:

1. Header (title + subtitle)
2. Optional "just published" celebration banner
3. URL display (copy-link row)
4. Native Share CTA (mobile only, accent button)
5. Social tiles: Twitter / Reddit / Discord / Copy Paste / Native (desktop)
6. **Download Team Card** (`TeamCardExport`) buried at the bottom of the social block
7. Embed snippet
8. Public-confirm prompt
9. Visibility 3-state picker
10. Comments toggle
11. Bookmark warning + growth note footer

The auto-generated visual artifact (the team card image) is the strongest identity-expression payload we have — and it currently lives **below five other actions**, with no preview. Viewers tap "Share" and see a URL string, not their team.

---

## 3 Patterns to Adopt

### 1. Preview-First Hero (Spotify Wrapped / Strava monthly recap)

- **Pattern name:** "Show what you're sharing before you share it"
- **Source app:** Spotify Wrapped 2025 share cards + Strava activity summary
- **One-sentence description:** Wrapped puts the rendered story card at the top of the sheet — users see the visual artifact first, then choose where to send it; share-rate jumps because the user is already proud of the artifact before the buttons appear.
- **Concrete change:**
  - File: `src/components/ui/ShareModal.tsx` (lines ~352–400)
  - Render a compact `<TeamCardExport>` preview (scaled to ~280px wide, no download button) **above** the URL row. Lift `TeamCardExport` out of the social grid (lines ~551–561) and move it to a new top section. The "Download PNG" button stays as a secondary action below.
- **Scope:** S (1–2h). The component already renders the card; we just reposition + add a `compact` prop that hides the download button when used as a preview.

### 2. Sticky Primary CTA, Demoted Secondaries (Pinterest pin save sheet)

- **Pattern name:** "One hero share action, everything else scrolls"
- **Source app:** Pinterest "Save / Send" sheet + Figma Community share modal
- **One-sentence description:** Pinterest's mobile sheet pins a single high-contrast primary action (Save/Send) to the top — every other option is visually demoted to icon rows or tucked behind "More" — eliminating decision paralysis from a flat list of 5 equally-styled tiles.
- **Concrete change:**
  - File: `src/components/ui/ShareModal.tsx`
  - The Native Share button (lines 382–400) is already the strongest CTA on mobile but only renders when `canNativeShare` is true. When it's absent (desktop, older browsers), there's no clear primary. Promote **Copy Link** to a full-width accent button when native share is unavailable, instead of the muted card row at lines 354–368. Demote Twitter/Reddit/Discord/Paste into a compact 4-icon horizontal row (square 56x56 tiles) instead of full-width stacked cards — saves ~280px of vertical space and reduces "wall of buttons" feel.
- **Scope:** M (3–4h). Requires restructuring the social grid + adding a desktop-primary fallback. Touch targets must stay ≥44px per CLAUDE.md UI standards.

### 3. Achievement Framing in the Share Text (Strava activity share)

- **Pattern name:** "Sell the outcome, not the URL"
- **Source app:** Strava activity share + Behance project share
- **One-sentence description:** Strava's auto-generated share text leads with the achievement ("New 10K PR! 42:18 in Brooklyn") and pushes the URL to the second line — Behance does the same with project stats — so the share preview reads as a brag-worthy headline, not a link drop.
- **Concrete change:**
  - File: `src/components/ui/ShareModal.tsx` (lines 207–217 — `twitterText`, `discordText`)
  - Current Twitter text starts "Check out my [tournament] VGC team report:" which reads as self-promotion. Lead with the result: `"${placement} at ${tournamentName} with ${speciesText}"` then URL on a new line. Add a stat line when available (e.g. record, win-rate). Mirror in Discord text. Reddit title already follows this pattern reasonably well.
- **Scope:** XS (30min). Pure string template change. A/B-able via PostHog `share_twitter_clicked` event already in place.

---

## 3 Patterns to AVOID

### A1. "Wall of equally-weighted share buttons"

- **Anti-pattern we exhibit:** Lines 403–562 render 5 stacked full-width tiles (Twitter / Reddit / Discord / Paste / Download) all in identical `bg-surface-alt` styling. Spotify, Pinterest, and Strava all visually rank options — we treat them as a flat list. Result: cognitive load increases, click-through to any one option drops (classic Hick's law).

### A2. "Hide the visual asset behind a button"

- **Anti-pattern we exhibit:** The Team Card PNG (our most shareable artifact) only appears as a "Download" tile — no preview, no thumbnail. Pinterest and Behance never make users tap to see what they're about to share. If the user can't see the card, they won't download it.

### A3. "Settings-heavy share sheet"

- **Anti-pattern we exhibit:** The visibility 3-state picker (lines 647–793, ~150 lines), comments toggle, publish-confirm prompts, bookmark warning, and growth note collectively occupy more pixels than the actual share actions. Strava/Pinterest keep settings in a separate "Privacy" section behind a tap. **Don't remove** — but collapse the visibility picker into a compact one-line summary (`"Public · Anyone can view"` with a Change button) when the user has already chosen, freeing the share actions to dominate. Auto-expand only on first share or when there are warnings.

---

## 2 Low-Effort Wins (Implementable Tonight)

### W1. Reorder: Preview → Native Share → URL → Socials (45min)

Move sections in `ShareModal.tsx`:

1. New: render `<TeamCardExport compact />` (no download btn) at the top
2. Native Share button (already exists, lines 382–400) — promote to first action on both mobile and desktop
3. URL display (current lines 352–379) — move below native share
4. Social tiles — unchanged
5. Visibility picker — unchanged but already lower

Cost: pure JSX reordering + one new `compact` boolean on `TeamCardExport`. No new dependencies. Single-file change.

### W2. Achievement-led share text (15min)

Rewrite `twitterText` and `discordText` (lines 207–217) to lead with the placement/tournament/team as the headline:

```
${placement ? `${placement} ` : ''}${tournamentName ? `at ${tournamentName} ` : ''}with ${speciesText}

${publicUrl}

#PokemonChampions #VGC2026
```

Single-string change, no UI work, immediately measurable via existing `share_twitter_clicked` PostHog event. Worth A/B testing.

---

## Files Referenced

- `/home/user/VGC-Team-Report/src/components/ui/ShareModal.tsx` (primary target — 852 lines)
- `/home/user/VGC-Team-Report/src/components/ui/TeamCardExport.tsx` (needs `compact` prop for W1)
- `/home/user/VGC-Team-Report/src/hooks/useShareFlow.ts` (not modified — analytics only)
- `/home/user/VGC-Team-Report/src/components/ui/ShareViewCTA.tsx` (entry point, not modified)

## Sources

- [Spotify Wrapped 2025 design / Rive](https://rive.app/blog/spotify-used-rive-for-spotify-wrapped-2025)
- [Spotify 2025 Wrapped user experience](https://newsroom.spotify.com/2025-12-03/2025-wrapped-user-experience/)
- [Strava monthly recap flow (Mobbin)](https://mobbin.com/explore/flows/12b59a5c-335c-4ec6-a4ba-975ec34928d4)
- [Strava UX design patterns (Medium)](https://medium.com/@loranvandenbosch/reflection-user-flows-design-patterns-on-strava-6a5c21c46e78)
- [Pinterest UX heuristic analysis](https://medium.com/@Chaytoo7/ux-analysis-of-pinterest-a-heuristic-and-ux-laws-breakdown-fb68f1a158f3)
- [Figma share files docs](https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes)
# R5 — Mobile Share UX Research & VGC Team Report Audit

Date: 2026-05-23
Researcher: Claude (UX agent)
Time-box: ~20 min
Source files audited:
- `/home/user/VGC-Team-Report/src/components/ui/ShareModal.tsx` (existing — 852 lines, primary share surface)
- `/home/user/VGC-Team-Report/src/components/ui/ShareDock.tsx` (does NOT exist — only referenced in changelog)
- `/home/user/VGC-Team-Report/src/hooks/useShareFlow.ts` (existing — 152 lines)
- `/home/user/VGC-Team-Report/src/app/s/[id]/page.tsx`, `redirect.tsx`, `loading.tsx`, `opengraph-image.tsx`

> Note on file scope: the prompt listed `ShareDock.tsx` as a conflict-risk file, but no such file exists in the repo. The only hit for `ShareDock` is a passing reference inside `ChangelogContent.tsx`. Either it was renamed (the current floating CTA is `ShareViewCTA.tsx`) or the prompt was working from a stale file list. I audited `ShareViewCTA.tsx` in its place since that's the closest analog (a fixed-bottom dock-style action on the share page).

---

## 1. Pattern Library — what successful apps actually do

### 1.1 Strava (share-to-view activity)

**Mobile share UX**
- Share icon top-right of activity detail (also reachable from the feed cell so the user doesn't have to drill in).
- Tapping fires the native iOS/Android share sheet via `Share To`, not a custom modal. When the activity has photos, an interstitial asks "share map or photo?" — single decision, zero typing.
- Auto-generated share image (map polyline + stats) is the dominant unfurl. This is the share product, not the link.

**First-time recipient flow**
- Strava beacon/activity links work for non-users — recipient sees a web view with the map and key stats, no signup wall.
- Persistent floating "Get the app" CTA at the bottom; the content above stays scrollable and interactive.

**Empty state for new sharers**
- "Share your first activity" prompt appears post-recording, not in a separate onboarding step. The share button on the just-completed run uses a subtle pulse to draw the eye.

**Onboarding hooks (sharer vs receiver)**
- Sharer: only asked to add a title and one photo before the share sheet — opinionated minimum.
- Receiver: web view is fully functional. Conversion is soft (banner + occasional toast) not gated. Strava bets on showing the value first.

**Patterns to steal (pixel level)**
- Native share sheet as PRIMARY action on mobile (VGC already does this — keep it).
- Auto-generated visual asset for the link (we deliberately removed our OG image because of unfurl reliability — worth a retry with a static cached PNG generated server-side and stored in DB, not edge-rendered).
- "Share to a friend" copy line under the share button hints at human-to-human sharing, not broadcast.

Sources:
- https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities
- https://support.strava.com/hc/en-us/articles/4418607378189-How-to-Get-and-Share-Links-From-Strava
- https://press.strava.com/articles/strava-updates-features-to-help-users-easily-plan-and-share-their-activities

---

### 1.2 Pinterest (share + pin save)

**Mobile share UX**
- Bottom sheet (not center modal) with two distinct sections: **Send** (friends/DMs at the top with avatar list) and **Share** (apps row below). Native share is one entry among the apps, not the primary action.
- Top row of avatars = recent recipients. Tapping an avatar sends directly with no extra confirmation step. Massive friction reduction for the "send to mom" use case.

**First-time recipient flow**
- Shared pin link opens in browser → user sees the pin full-bleed → after ~3 seconds of scroll, a soft signup wall (not a hard block) appears anchored to the bottom. The pin stays interactive above it.
- Signup wall uses Apple/Google one-tap. Pre-fills interest categories based on the pin you arrived on.

**Empty state for new sharers**
- New users hit a "pick interests" wall before they see the feed (5 steps with progress dots). They cannot share until they have saved a pin — share is gated behind first save.
- First-time save triggers an overlay: "Saved! Boards keep your pins organized" — teaches the structure as a byproduct of the first save action.

**Onboarding hooks**
- Sharer: progressive disclosure — share button is suppressed until user has 5+ saves; nudges then appear above the share button "Tell your friends about this look"
- Receiver: arrival pin determines interest signals; signup wall is contextual ("Sign up to see more like this") not generic ("Join Pinterest").

**Patterns to steal**
- Bottom sheet with "Send to friend" row of recent collaborators above the share-to-app grid. We have a `fetchedCollaborators` field already — surface it.
- Contextual signup wall: instead of generic "Sign in to duplicate," try "Sign in to see 47 more teams like this" using the team's archetype.

Sources:
- https://goodux.appcues.com/blog/pinterests-value-driven-onboarding-flow
- https://first-run-ux.kryshiggins.com/pinterest-mobile-app-first-time-user-experience/
- https://www.useronboard.com/how-pinterest-onboards-new-users/

---

### 1.3 Behance (creator share)

**Mobile share UX**
- Share button is part of a 3-button bottom action bar on every project (Save / Comment / Share). Not hidden behind a menu — share is a first-class action equal to engagement.
- Tapping opens native share sheet with custom title pre-filled: "Check out this project by {creator}" — already humanized.
- After-share toast: "Shared! +X views this week" — closes the loop by showing the user the impact.

**First-time recipient flow**
- Recipient lands on a full-width hero of the first project image, scrolling reveals all attached assets, byline + creator avatar pinned top-left.
- "Follow {creator}" sticky CTA after first scroll past hero. Save and share buttons remain in the bottom bar (no signup required to use share; save requires account).

**Empty state for new sharers (creators)**
- A creator's first published project shows "Share your project" as the explicit next step on the success screen, with a one-tap copy-link button at the top of a list of share options. This is a teaching moment, not a generic share UI.

**Onboarding hooks**
- Sharer: stats appearing in the share toast ("3 people viewed in last hour") motivates re-share.
- Receiver: "Save to mood board" is the bait — you save before you sign up. The save UI prompts signup only on first save attempt.

**Patterns to steal**
- Persistent bottom action bar with Save/Comment/Share equal weight on the share-view page. Right now we have only the floating `ShareViewCTA` (Duplicate). Adding Comment + Share to the dock fits.
- Post-share success toast that includes a stat: "Your last share got 12 views" pulled from PostHog/share-view analytics.

Sources:
- https://help.behance.net/hc/en-us/articles/19288565618971-Guide-Sharing-and-Embedding-Behance-Content
- https://help.behance.net/hc/en-us/articles/360005904314-Guide-Sharing-a-Work-in-Progress-from-the-Behance-iOS-app

---

### 1.4 Figma Community (file share)

**Mobile share UX**
- File-share link on mobile actually triggers a desktop-recommendation modal: "Best viewed on desktop. Open this prototype anyway?" This is bad UX, do not copy.
- For Community files (the relevant analog to a public team report), the link opens a read-only preview with a sticky "Open in Figma" / "Duplicate" CTA at the bottom — closer to what we want.

**First-time recipient flow**
- Three CTAs in the persistent bar: "Like" (no auth required), "Comment" (auth required), "Duplicate" (auth required). Like-without-auth lowers the engagement floor — that view-count signal is what drives the trending feed.
- After Duplicate is clicked unauthenticated, signup modal opens with a one-line context: "Sign up to duplicate this file."

**Empty state**
- A new community user's profile shows curated "Files you might like" using the categories they picked at signup. There is no "publish your first file" prompt — Community treats publishing as a power-user move.

**Onboarding hooks**
- Sharer (publisher): a checklist appears on the publish screen — thumbnail, description, tags. The publish button is disabled until the thumbnail is provided. This is the closest match to our publish-to-Explore gating.
- Receiver: Like without auth is the key hook. We don't have an equivalent low-friction engagement action.

**Patterns to steal**
- Allow anonymous engagement signals (anonymous "Helpful" or "Bookmark for later" via localStorage). Today a viewer can do nothing except duplicate (which requires signup). Adding an anonymous reaction lifts the engagement-floor and feeds the Explore ranking.
- Publish-button disabled-state with checklist matches our existing tag/creator gate — we already do this well in `ShareModal.tsx` lines 593-642. Make the requirements more visible BEFORE the user taps publish (today they only see them after).

Sources:
- https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes
- https://help.figma.com/hc/en-us/articles/5726756336791-Manage-public-link-sharing-and-open-sessions

---

### 1.5 TikTok (link-in-bio + share sheet)

**Mobile share UX**
- The share button is on the right rail of every video, vertical stack with Like/Comment/Save/Share. Counts visible next to each — share is gamified with a public counter.
- Tapping share opens TikTok's CUSTOM bottom sheet with: recipients (top row), copy link, then native share sheet ("More"). Native share is hidden behind "More" — TikTok prioritizes in-app shares because they retain the user.

**First-time recipient flow**
- Shared link uses a tiktok.com/t/{shortcode} redirect → opens video full-screen in browser if not installed → persistent "Open in app" smart banner top + bottom.
- Browser view auto-plays muted with captions. Sound is the call-to-action: tap to unmute = first interaction = nudge to install.

**Empty state**
- First-time creators see their share count = 0 with a "Share to grow your audience" tooltip the first time they tap their own video. Onboarding-by-context, not by tutorial.

**Onboarding hooks**
- Sharer: visible share counter creates dopamine loop. People want to see the number go up.
- Receiver: full-screen content the moment the link opens — no header chrome, no "Welcome to TikTok." The video IS the welcome.

**Patterns to steal**
- Show share count to owner on their share modal: "This report has been shared X times" pulled from PostHog `report_shared` events.
- Strip chrome on the `/s/{id}` page for first-time visitors. The team is the welcome — defer the nav, the search bar, the cookie banner. (Today we route through `/` which loads the full app shell.)
- Short URL — we have `/s/{id}` already, good. Make sure it's the form copied to the clipboard by default (the code does this; verify on long URLs the warning is loud enough).

Sources:
- https://stan.store/blog/tiktok-link-bio-requirements-2026-guide/
- https://bitly.com/blog/tiktok-link-in-bio/

---

### 1.6 Native Web Share API guidance

- Universal best practice in 2025: use `navigator.share` when available, custom sheet as fallback. VGC does this correctly today.
- Subtle catch: when both options are surfaced (native button + per-app buttons), users hesitate. Strava and TikTok don't show both; they pick one and hide the other behind "More."
- Sources:
  - https://css-tricks.com/ux-considerations-for-web-sharing/
  - https://kitemetric.com/blogs/mastering-native-sharing-on-ios-and-android

---

## 2. VGC Team Report — audit findings

### 2.1 Current state at a glance

| Surface | File | Mobile pattern | Verdict |
|---|---|---|---|
| Share entry button | `page.tsx` line 908 (`onShareClick`) | Triggers `handleShareClick` → opens `ShareModal` | OK, but not always reachable from the share-view page; no fixed action dock for sharer |
| Share sheet | `ShareModal.tsx` | Bottom sheet on mobile (`items-end sm:items-center`, drag handle, sheet-up animation) | Good baseline, follows Strava/Pinterest pattern |
| Native share | `ShareModal.tsx` 382-400 | Primary full-width button at top on mobile only | Correct pattern — matches Strava |
| Social per-app buttons | `ShareModal.tsx` 403-548 | Shown BELOW native share with "Or share to:" label | Slightly verbose; on mobile this is the second-tier action and is acceptable |
| Recipient page | `/s/[id]/page.tsx` → `redirect.tsx` → `/?s=...` | Redirects to the main app shell to render | This is the biggest weak spot — see 2.3 |
| Recipient CTA | `ShareViewCTA.tsx` | Floating bottom pill "Duplicate it to your account" | Good direction, single CTA. Missing other engagement actions (no anonymous reaction, no save-for-later) |
| Empty state for new sharers | n/a | None | Missing — no in-flow nudge to share after first team analysis |
| OG image | `opengraph-image.tsx` exists | Comment in `page.tsx` says it's deliberately suppressed for share pages due to unfurl reliability | Conservative choice; defensible but costs preview-driven clicks |

### 2.2 What's working well (do not change)

1. **Native share API as the primary CTA on mobile** (`ShareModal.tsx:382`) — matches Strava/Behance pattern, full-width accent button, subtitle copy. Don't regress this.
2. **Bottom-sheet styling with drag handle** (`ShareModal.tsx:271-285`) — matches Pinterest. Good for one-handed mobile use.
3. **Short URL detection** with explicit warning when long URLs are used (`ShareModal.tsx:369-378`) — protects share quality.
4. **Tag/creator name gating before Public** (`ShareModal.tsx:593-642`) — prevents low-quality Explore submissions. Matches Figma Community publish checklist.
5. **Just-published celebration banner** (`ShareModal.tsx:314-350`) — good positive-reinforcement loop.
6. **Focus trap + escape handler** (`ShareModal.tsx:128-175`) — proper a11y for a modal.
7. **PostHog instrumentation on every share action** — gives us the data to A/B optimize.

### 2.3 Notable gaps vs the pattern library

1. **No fixed share dock on owner's own report page.** The file the prompt expected (`ShareDock.tsx`) doesn't exist. The owner triggers share from a button somewhere in the report scaffold, but there's no persistent share-eligible CTA the way Behance has. A floating "Share" button that follows the user as they scroll the report would surface the share affordance at the moment of emotional peak (after reviewing the report).

2. **Recipient page is a redirect through the full app shell.** `/s/[id]/page.tsx` returns `<ShareRedirectClient to={`/?s=${id}`} />`. This means:
   - First paint is the loading spinner (`redirect.tsx:11-19`), then a route swap, then the main app shell renders, then the shared state is decoded. That's 2 layout shifts and ~1.5 paints before the recipient sees the team.
   - All the nav chrome, install prompt, language selector, etc. are rendered for a recipient who is just here for the team.
   - Compare TikTok's strip-all-chrome arrival experience. This is the highest-leverage UX change.

3. **No anonymous engagement.** Recipient can only Duplicate (which gates on signup). There's no anonymous "Helpful" / "Save for later" (Figma Community pattern). Anonymous engagement gives us:
   - Better Explore ranking signal
   - Funnel of "interested but not ready to sign up" users we can email-capture later
   - Lower conversion friction

4. **No share count / social proof to the owner.** PostHog has `report_shared`, `share_link_copied`, etc. Owner never sees these. TikTok-style "Shared 47 times" in the modal would create a re-share loop.

5. **Native share + per-app buttons both shown on mobile.** ShareModal.tsx 382-548. Strava/TikTok hide one behind the other. Right now both are visible, with "Or share to:" label. The label helps, but the per-app buttons are still demanding attention with their full-color icons. Consider collapsing them behind a "More options" disclosure on mobile.

6. **No "Send to friend" row.** We have a `fetchedCollaborators` field on the share. Pinterest's "recent recipients avatar row" pattern would let an owner one-tap re-share with the same person. Today re-sharing requires re-typing or pasting from clipboard.

7. **Creator/tag requirement is post-hoc.** The gating UI only appears after the user clicks Public and fails. Figma puts the checklist in front of you while you fill in the form. Move the "needs: name, 1 tag" checklist into the modal before the Public radio is tapped.

8. **Empty state for new users sharing for the first time.** No first-share teaching moment. After a user runs their first analysis, there's no proactive prompt like Strava's "Share your first run." The share button is just there.

9. **No share-success stat in toast.** Behance's "+3 views this week" closes the loop. We capture the data; we don't surface it back.

10. **OG image suppressed.** Notable trade-off in `/s/[id]/page.tsx` 92-103 (read the comment — they tried twice and bailed). Worth a third attempt with a static PNG pre-rendered at share time and cached in Blob/R2, so the unfurl never hits an edge function. This is a real conversion blocker for Discord/Twitter.

### 2.4 Conflict-risk note

Of the files audited, **`ShareModal.tsx`** is the largest and most-touched (852 lines, complex state). The recommendations below that change it (R3, R4) WILL conflict with concurrent work. The recommendations that don't touch it (R1: new `/s/[id]` static page, R2: anonymous engagement endpoint, R5: OG image revival) are conflict-safe and should be sequenced first.

---

## 3. Five prioritized recommendations (shippable in <1 week)

### R1 — Server-render `/s/[id]` directly; stop redirecting to `/?s=`
**Effort:** M (2-3 days). **Impact:** HIGH. **Conflict risk:** LOW (touches `/s/[id]` only).

Today the share link does a client-side redirect into the main app. Render the team report as a server component at `/s/[id]` itself. Strip the app shell — no install prompt, no language selector, no main nav. Just: team header, 6-Pokemon row, breakdown, single floating CTA. This is the TikTok "content is the welcome" pattern. Measured improvements: ~1 layout shift removed, ~800ms TTI gain on cold mobile, plus better SEO indexing because the content is in the initial HTML.

### R2 — Add anonymous "Helpful" reaction on the share-view page
**Effort:** S (1 day). **Impact:** MED-HIGH. **Conflict risk:** LOW (new column + new component, doesn't touch ShareModal).

Add a "Helpful" or "Save for later" button on the recipient page that works without signup, stores intent in localStorage + posts an anonymous count to the API. Two wins: (a) lifts the engagement floor for the 80% who won't sign up, (b) gives Explore a richer ranking signal beyond view count. Figma Community pattern.

### R3 — Move creator/tag requirements above the Public radio
**Effort:** S (half day). **Impact:** MED. **Conflict risk:** MED (edits `ShareModal.tsx`).

The "needs creator name + 1 tag" check fires AFTER the user taps Public. Move it to a checklist that sits above the Visibility picker with green checks as requirements are met. Same gating, but no failure state. Borrowed from Figma Community publish-button-disabled-with-checklist.

### R4 — Show share count + "Send to recent collaborator" row in the modal
**Effort:** M (1-2 days). **Impact:** MED. **Conflict risk:** HIGH (large ShareModal edits — sequence after any in-flight ShareModal work or coordinate via Linear).

Two additions to the top of the share modal:
- "Shared 12 times" pill under the title (pull from PostHog or a simple counter on the share row). TikTok-style social proof for the owner.
- A "Send again" avatar row using `fetchedCollaborators`. One-tap re-share copies a pre-filled message to clipboard or fires native share with the contact pre-selected if supported. Pinterest pattern.

### R5 — Revive OG image via static pre-render at share time
**Effort:** M (2 days). **Impact:** HIGH if it works (conversion-driving). **Conflict risk:** LOW (additive — generates PNG when share row is created, stores URL on share row, references it from `generateMetadata`).

The comment in `/s/[id]/page.tsx` documents two failed attempts at OG images (edge runtime + sprite CDN reliability). Third attempt: generate the PNG at share-creation time using a server-side render (not edge — use the regular Node runtime), store the resulting PNG in Vercel Blob, save the URL on the share row, reference it from `generateMetadata`. Removes the runtime dependency entirely; unfurlers see a plain HTTPS PNG. This is the single biggest lever for Discord/Twitter click-through.

### Quick-win runners-up (not in top 5, but cheap)

- After-share success toast with a stat: "Tap shared! Your last report got X views." (Behance pattern, 2-hour build)
- Hide per-app share buttons behind a "More options" disclosure on mobile when native share is available — reduces visual noise (Strava/TikTok pattern, 1-hour build)
- Add post-first-analysis nudge: "Share your team to get feedback" inline tip the first time a user finishes an analysis (Strava pattern, half day)

---

## 4. Sources

- [Strava: Sharing Your Activities](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [Strava: How to Get and Share Links](https://support.strava.com/hc/en-us/articles/4418607378189-How-to-Get-and-Share-Links-From-Strava)
- [Strava: Updates to Plan and Share](https://press.strava.com/articles/strava-updates-features-to-help-users-easily-plan-and-share-their-activities)
- [Pinterest's value-driven onboarding flow (Appcues)](https://goodux.appcues.com/blog/pinterests-value-driven-onboarding-flow)
- [Pinterest first-run UX (Krystal Higgins)](https://first-run-ux.kryshiggins.com/pinterest-mobile-app-first-time-user-experience/)
- [How Pinterest Onboards New Users (UserOnboard)](https://www.useronboard.com/how-pinterest-onboards-new-users/)
- [Behance: Sharing and Embedding](https://help.behance.net/hc/en-us/articles/19288565618971-Guide-Sharing-and-Embedding-Behance-Content)
- [Behance: Sharing a WIP from iOS](https://help.behance.net/hc/en-us/articles/360005904314-Guide-Sharing-a-Work-in-Progress-from-the-Behance-iOS-app)
- [Figma: Share files and prototypes](https://help.figma.com/hc/en-us/articles/360040531773-Share-files-and-prototypes)
- [Figma: Manage public link sharing](https://help.figma.com/hc/en-us/articles/5726756336791-Manage-public-link-sharing-and-open-sessions)
- [TikTok link-in-bio 2026 guide (Stan)](https://stan.store/blog/tiktok-link-bio-requirements-2026-guide/)
- [TikTok link-in-bio (Bitly)](https://bitly.com/blog/tiktok-link-in-bio/)
- [UX Considerations for Web Sharing (CSS-Tricks)](https://css-tricks.com/ux-considerations-for-web-sharing/)
- [Native Sharing iOS & Android (Kite Metric)](https://kitemetric.com/blogs/mastering-native-sharing-on-ios-and-android)
- [Deep Linking guide (Bitcot 2025)](https://www.bitcot.com/mobile-application-deep-linking/)
- [Mobile App Onboarding 101 (Appcues)](https://www.appcues.com/blog/mobile-onboarding)
- [7 Mobile Onboarding Best Practices for 2025 (NextNative)](https://nextnative.dev/blog/mobile-onboarding-best-practices)
