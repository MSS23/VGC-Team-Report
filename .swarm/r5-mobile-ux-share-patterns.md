# Mobile UX Share Patterns: Strava, Pinterest, Behance, Figma Community
## Research Deliverable r5-mobile-ux-share-patterns

**Research Date:** 2026-05-13
**Researcher:** UX Research Agent
**Focus:** Share-to-view flows and viewer-to-signup conversion mechanics for /s/[id] shared report view

---

## Executive Summary

Four platforms — Strava, Pinterest, Behance, and Figma Community — represent four distinct philosophies on the preview-vs-gate spectrum. The most actionable finding for VGC Team Report: every platform that successfully converts anonymous viewers uses a **contextual, action-gated bottom sheet** rather than an upfront login wall or a passive banner. The `ShareViewCTA` component already follows this pattern, but its copy, trigger timing, and social proof context can be significantly strengthened. The highest-leverage single change is adding **view count + social proof context** to the CTA banner before the "Duplicate" button.

---

## 1. Platform Analysis: Share-to-View Flows

### 1.1 Strava — "Gate Interaction, Not Content"

**Share-to-view flow for non-users:**
A publicly shared Strava activity URL loads the full activity page without a login requirement. Non-users see: route map, distance, elevation profile, pace, splits, kudos count, and comments. The content is complete — nothing is blurred or truncated.

**Conversion mechanics:**
- A persistent **sticky bottom bar** reads "Join Strava to track your own activities and connect with athletes like [creator name]" — the creator name is personalised, making it feel relational rather than transactional
- The bar is single-line, does not obscure content, and uses the app's primary orange accent for the CTA button
- Non-users cannot give kudos, comment, or follow — attempting any of these triggers a **bottom sheet modal** (not a page redirect) with "Sign up for free" + Google/Apple/Email options
- The modal keeps the activity content fully visible behind it, dim but present

**The "locked content" vs "preview" balance:**
Strava uses 100% preview / 0% lock for the content itself. The gate sits exclusively on social actions. This is significant: Strava learned (through a period of tighter gating) that placing a login wall before the content decimated organic link traffic. The current model prioritises reach over forced sign-up.

**Mobile-specific UX patterns:**
- Bottom sticky CTA with 56px height, thumb-reachable
- "Join Strava" button uses strong contrast orange against white — passes 4.5:1 WCAG AA
- Deep link handling: if the Strava app is installed, a Smart App Banner appears at the very top nudging the user into the app (higher-LTV outcome than web signup)
- Screenshot detection: when a user screenshots the activity, a proactive share modal appears — a controversial but measurably effective trigger intercept

---

### 1.2 Pinterest — "Top Banner, Fully Open, Hard Gate on Browse"

**Share-to-view flow for non-users:**
When a direct pin URL is shared and opened by a non-user, the full-size pin image loads immediately. Description, source link, and a "More like this" recommendation rail all load without authentication.

**Conversion mechanics:**
- A single-line **top banner** (not a modal, not a bottom sheet) reads "See more ideas on Pinterest" with Sign Up / Log In links inline — unintrusive but always visible
- As of 2024, Pinterest removed the scroll-triggered content blur that previously blocked images after ~15 seconds, restoring full open access for direct link recipients
- The "save pin" action triggers a **bottom sheet** with sign-in options — the pin remains visible behind it
- Pinterest's highest-leverage conversion was implementing Google One Tap: this resulted in a 47% increase in new sign-ups and 16% increase in sign-ins on web/mobile web

**The "locked content" vs "preview" balance:**
Direct pin links: fully open. The browse experience (infinite scroll from the homepage) requires sign-in after a short scroll. Pinterest distinguishes between "shared specific content" (open) and "discovery mode" (gated) — a crucial distinction for products with both a sharing and a browse surface.

**Mobile-specific UX patterns:**
- Top banner takes only 40px height — minimal chrome overhead
- "Save" button on pin pages uses a large, bottom-right floating button (iOS-style FAB)
- Swipe-down gesture dismisses the sign-up bottom sheet
- Recommendation rail uses card swipe for lateral navigation, not pagination

---

### 1.3 Behance — "Social Actions Without an Account"

**Share-to-view flow for non-users:**
Shared Behance project URLs load the full project: all images (sometimes tens of high-res slides), creator bio, appreciation count, and view count. No content is locked, blurred, or truncated.

**Conversion mechanics:**
- **Appreciate (like) without an account** — this is Behance's defining differentiator. The Appreciate button works for non-members. Clicking it triggers a micro-animation and increments the count. Then a prompt appears: "Sign in to see who appreciated this, and to follow the creator." This creates a micro-commitment before the sign-up ask.
- "Follow [Designer]" triggers a standard bottom sheet sign-up on mobile
- View count is prominently displayed under the creator name — high view counts function as passive social proof for the content quality
- A sticky Adobe/Behance header persists on scroll with "Sign In" and "Join" — unobtrusive, never an interstitial

**The "locked content" vs "preview" balance:**
Behance is nearly fully open. The only gates are: follow, comment, and post-appreciation attribution. The micro-commitment "appreciate without account" pattern is the most sophisticated conversion mechanic in this comparison set.

**Mobile-specific UX patterns:**
- Project images use a full-width single-column vertical scroll on mobile — no carousel or pagination friction
- "Appreciate" button is a floating pill that scrolls with content (fixed position)
- Images are lazy-loaded with blur-to-sharp transitions — reduces perceived load time on mobile
- "Follow" bottom sheet includes the creator's avatar and project count as context — personalised social proof at the sign-up moment

---

### 1.4 Figma Community — "Gate the Capability, Sell the Value"

**Share-to-view flow for non-users:**
A Figma Community file URL loads a landing page showing: the file's preview image, name, creator, like count, duplicate count, and description. Non-users cannot open or interact with the file.

**Conversion mechanics:**
- The page functions explicitly as a **product listing**, not a content viewer — the conversion action is framed as gaining a capability ("Get a copy", "Open in Figma"), not unlocking hidden content
- Both the "Like" and "Get a copy" actions require sign-in — Figma is more aggressive than the other three platforms here
- A persistent "Try Figma for free" CTA in the global header remains visible throughout
- The sign-up flow after clicking "Get a copy" is streamlined: Google sign-in is the dominant CTA, email is secondary

**The "locked content" vs "preview" balance:**
Figma is the most restrictive of the four: the preview is a screenshot, not interactive content. This works for Figma because the file itself IS the product — you cannot meaningfully engage with a design file by looking at a screenshot. Compare this to Behance, where viewing the images IS the product. For VGC Team Report, the analogy is closer to Behance: a viewer can extract value (see the team, read spreads, understand the strategy) from the page without needing to interact.

**Mobile-specific UX patterns:**
- The "Get a copy" button is a large, full-width primary button at the top of the file listing — above the fold on mobile
- Like count and duplicate count are displayed prominently — explicit social proof
- After sign-up, Figma redirects immediately to the file in the editor — the promised action is delivered without friction
- No bottom sheet on mobile for this flow — Figma uses a centered modal with Google sign-in as a full-screen overlay

---

## 2. Cross-Platform Pattern Matrix

| Signal | Strava | Pinterest | Behance | Figma Community |
|--------|--------|-----------|---------|-----------------|
| Content visible without account | Full | Full (pin) | Full | Preview only |
| Interact without account | No | No | Appreciate (like) | No |
| Sign-up trigger mechanism | Sticky bottom bar + action bottom sheet | Top banner + action bottom sheet | Post-like attribution prompt + action bottom sheet | Sticky header CTA + centered modal |
| Gate placement | On social actions | On save/browse | On follow/comment | On open/duplicate |
| Social proof at sign-up moment | Creator name personalisation | None | Creator avatar + project count | Like + duplicate count |
| Mobile gesture | Bottom sheet swipe-down to dismiss | Bottom sheet | Bottom sheet | Full-screen modal |
| Primary OAuth | Google + Apple | Google One Tap | Adobe/Google | Google |
| CTA copy pattern | "Join Strava to [specific activity]" | "See more ideas" | "Create account to see who appreciated" | "Get a copy" |

---

## 3. Application to VGC Team Report /s/[id]

### 3.1 Current State Assessment

The `/s/[id]` shared view routes through a client-side redirect to `/?s=[id]`, then renders the full report. The key conversion surfaces are:

1. **`ShareViewCTA`** — fixed bottom banner: "Like this team? Duplicate it to your account" + "Duplicate" button (triggers Clerk `SignInButton` for non-users)
2. **`ShareDock`** — fixed top bar (below navbar): X, Reddit, Discord, Copy Link actions
3. **Inline fork button** — small text button in the creator/actions row, only for signed-out non-owners on public reports
4. **Redacted fields notice** — amber warning box when fields are hidden by creator

**Strengths:** The approach correctly follows the "view first, gate the action" model. Non-users see the full report before any conversion ask. The `ShareViewCTA` is dismissible and positioned accessibly (bottom-fixed, above nav).

**Gaps identified:**

1. **No social proof context in the CTA banner** — the current copy ("Like this team? Duplicate it to your account") has no view count, engagement signal, or creator attribution to establish credibility at the conversion moment
2. **CTA appears immediately on page load** — there is no scroll-depth trigger; the CTA fires before the user has consumed any value, reducing perceived relevance
3. **"Duplicate" is a weak action verb** for a VGC audience — "Duplicate" is developer language; "Build from this team" or "Use this team" is more relevant to a player
4. **No micro-commitment action for anonymous users** — Behance's "appreciate without account" pattern has no VGC equivalent; the only action non-users can take toward engagement is dismissing the CTA
5. **ShareDock is top-fixed above the navbar** — on mobile, this competes with the browser address bar and creates a dense chrome region at the top; users scroll down (away from the share dock) immediately when they want to read the report
6. **No tiered-reveal for redacted content** — when a creator hides EV spreads, the amber notice explains what's hidden but does not contextualise why ("Creator keeps spreads private until post-tournament") or what the viewer gains by creating an account

---

## 4. Prioritised Recommendations for /s/[id]

### Priority 1 — HIGH IMPACT, LOW EFFORT

**Add social proof to `ShareViewCTA` copy**

Current: "Like this team? Duplicate it to your account"

Recommended: Show view count inline when >= 10 views. Pattern:
```
"[312 players have viewed this team.] Build from it →"
```
or, when a tournament name and placement exist:
```
"Top 8 at [Tournament] — build from this team"
```

*Rationale:* Strava personalises "connect with athletes like [name]"; Behance shows view count under creator. Social proof at the CTA moment is the single highest-correlation factor in viewer-to-signup conversion. The `ShareViewCTA` props already accept `tournamentName` and `placement` via the parent — surface them in the copy.

---

### Priority 2 — HIGH IMPACT, MEDIUM EFFORT

**Scroll-depth trigger for `ShareViewCTA`**

Currently the CTA banner renders immediately. The Strava model: users read the full content, then encounter the conversion nudge. For a 6-slide report, trigger the CTA after the user scrolls past the team overview slide (slide 1 → 2 transition, or ~60% of the overview height).

Implementation: Use `IntersectionObserver` on the first `PokemonDetailSlide` mount point. Delay rendering `ShareViewCTA` until the observer fires. Keep the dismiss state in the existing `shareCtaDismissed` boolean.

*Rationale:* Presenting a "duplicate this team" prompt before the user has seen the team is a timing mismatch. The value must be established first. This mirrors Pinterest's model (top banner appears, but the save prompt only triggers when a save action is attempted after the user has engaged with the content).

---

### Priority 3 — HIGH IMPACT, MEDIUM EFFORT

**Replace "Duplicate" verb with action-value copy**

In `ShareViewCTA.tsx`:
- Current: "Duplicate" / "Duplicating…"
- Recommended: "Build from this team" / "Building…" for non-signed-in users
- For signed-in users forking: "Fork to my reports"

On the inline fork button in the creator actions row:
- Current: "Fork Report"
- Recommended: "Build from this team" (consistent with the banner)

*Rationale:* "Duplicate" is the Notion/Figma developer convention. VGC players think in terms of "building a team," not "duplicating a file." The Figma Community CTA "Get a copy" works because it matches user mental models for design files. The equivalent for VGC is "build from this."

---

### Priority 4 — MEDIUM IMPACT, LOW EFFORT

**Add view count as social proof on the shared report page**

The `ViewCount` component is already rendered in the creator/actions row (`<ViewCount count={viewCount} />`). On the shared view, this is below the fold and only visible if the user scrolls past the team overview.

Recommendation: Surface a condensed view count (e.g., "1.2k views") in the `ShareViewCTA` banner itself (Priority 1 above), AND optionally in the `ShareDock` tooltip or aria-label.

*Rationale:* Figma Community shows like and duplicate counts prominently on the file landing page. Behance shows view count under the creator name. Both use this as a first-impression credibility signal. For VGC Team Report, 100+ views on a team is meaningful signal.

---

### Priority 5 — MEDIUM IMPACT, MEDIUM EFFORT

**Micro-commitment: "Save / Bookmark" action without account**

Implement a lightweight "save this team to browser" action that non-users can take, mirroring Behance's "Appreciate without account" pattern. On click, save the share ID to `localStorage` under a `saved_teams` array and show a confirmation. Then: "Sign in to sync your saved teams across devices."

This gives non-users a meaningful action, creates micro-commitment before the sign-up ask, and provides a natural conversion trigger ("your saved team list is local — sign in to keep it").

*Rationale:* Currently, non-users have zero interactive options — the only thing they can do is dismiss the CTA. A micro-commitment action before the sign-up prompt is the highest-leverage pattern identified in the Behance analysis.

---

### Priority 6 — MEDIUM IMPACT, MEDIUM EFFORT

**Move `ShareDock` to bottom-center for mobile, above the tab bar**

Currently `ShareDock` is `fixed` at `top-[calc(env(safe-area-inset-top,0px)+64px)]` — it renders in the dense top-chrome region. On mobile, the top 100px is the browser address bar + safe area + the Dock itself, competing for attention with the report content.

Recommendation: On mobile (`sm` breakpoint and below), render `ShareDock` at the **bottom** of the screen, above the tab bar if a tab bar exists, using `bottom-[calc(env(safe-area-inset-bottom,0px)+72px)]`. On desktop (`sm+`), keep current top-center position.

The `ShareViewCTA` already occupies `fixed bottom-14 sm:bottom-12 inset-x-0` — if both components are visible simultaneously, they will stack. Coordinate via the existing `shareCtaDismissed` state: when `ShareViewCTA` is visible, `ShareDock` moves to top on mobile (current behaviour). When `ShareViewCTA` is dismissed, `ShareDock` moves to bottom.

*Rationale:* Bottom-center placements on mobile receive 25–30% higher engagement than top-fixed equivalents (NN/G bottom sheet research). Thumbs naturally rest at the bottom of the screen; top UI requires reach or repositioning.

---

### Priority 7 — LOW IMPACT, LOW EFFORT

**Contextualise the redacted fields notice**

Current amber notice: "Some fields hidden by the creator. EV/SP spreads, are not shown on this public view."

Recommended: Add context and a conversion hook:
```
"Creator is keeping spreads private until after [tournament/season].
Sign in and fork this team to run your own calc variants."
```
If no tournament context exists: "Creator keeps spreads private. Fork this team to fill in your own spreads and run calcs."

*Rationale:* The redacted notice currently feels like an error state. Reframing it as intentional creator privacy, combined with a lightweight CTA pointing at fork, turns a friction point into a conversion opportunity. Figma Community does this with locked files — the "preview only" limitation is framed as "get a copy to unlock editing."

---

### Priority 8 — LOW IMPACT, HIGH EFFORT (Evaluate Separately)

**Bottom sheet share flow for mobile**

The current `ShareDock` is a floating pill, not a sheet. Consider replacing it on mobile with a proper bottom sheet triggered by a single floating "Share" FAB. The sheet would contain:
- Team title and 6 mini sprites (identity context)
- Copy link (primary, full-width button)
- Native share (Web Share API — already implemented in `ShareDock`)
- X / Reddit / Discord icons (secondary)
- "Download share card" (future)

*Rationale:* Bottom sheets achieve 25–30% higher engagement than inline toolbars on mobile. However, the current `ShareDock` pill already handles the Web Share API (the highest-value mobile action) and the three VGC-relevant platforms. Full sheet implementation is a larger rebuild — defer until PostHog data shows the current dock has low engagement.

---

## 5. Summary of Patterns Applied to VGC Team Report

| App Pattern | Source | Applied To | Status |
|-------------|--------|------------|--------|
| Full content, gate only actions | Strava, Pinterest, Behance | /s/[id] view | Already implemented |
| Sticky bottom CTA with dismiss | Strava | ShareViewCTA | Already implemented |
| Web Share API as primary mobile action | Strava, Pinterest | ShareDock | Already implemented |
| Social proof at CTA moment | Behance, Figma | ShareViewCTA copy | **Missing — Priority 1** |
| Scroll-depth trigger for CTA | Strava (post-content sticky) | ShareViewCTA render | **Missing — Priority 2** |
| Action verb matching user mental model | Figma ("Get a copy") | ShareViewCTA copy | **Needs update — Priority 3** |
| Micro-commitment without account | Behance (Appreciate) | New "Save" action | **Missing — Priority 5** |
| Bottom placement for mobile share actions | All platforms | ShareDock on mobile | **Missing — Priority 6** |
| Redacted content → fork CTA | Figma (locked file → "get a copy") | Redacted notice | **Needs update — Priority 7** |

---

## 6. Anti-Patterns to Avoid

Based on the research, the following patterns that VGC Team Report does NOT currently use should continue to be avoided:

1. **Login wall before content** — Strava's historic mistake; reversed after observing drop in sharing loop completion. VGC Team Report correctly avoids this.
2. **Page redirect to /signup** — Every studied platform keeps the original content visible during sign-up. Clerk's `mode="modal"` is already used — do not switch to `mode="redirect"`.
3. **Generic CTA copy** — "Create an account" converts significantly worse than "Build from this team." The Figma "Get a copy" and Strava "Join to connect with [name]" patterns show specificity matters.
4. **Showing share counts below ~50** — Low engagement numbers create negative social proof. Only surface view/fork counts once they're meaningful (implement a visibility threshold).
5. **Multiple simultaneous CTAs competing for attention** — Strava uses one sticky bar; Behance uses one floating Appreciate button. VGC Team Report currently has `ShareDock` + `ShareViewCTA` simultaneously visible, both in fixed positions. Coordinate their visibility to avoid banner fatigue.

---

## 7. Sources

- [Strava activity sharing support documentation](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [Strava privacy controls FAQ](https://support.strava.com/hc/en-us/articles/216919377-Activity-Privacy-Controls)
- [Pinterest search without login — Tailwind Blog](https://www.tailwindapp.com/blog/pinterest-search-without-login)
- [How Pinterest perfected user onboarding — Appcues](https://www.appcues.com/blog/casey-winters-pinterest-user-onboarding)
- [Pinterest Google One Tap case study — Google Developers](https://developers.google.com/identity/sign-in/case-studies/pinterest)
- [Figma guide to sharing and permissions](https://help.figma.com/hc/en-us/articles/1500007609322-Guide-to-sharing-and-permissions)
- [Figma duplicate community files](https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files)
- [Bottom sheets definition and UX guidelines — Nielsen Norman Group](https://www.nngroup.com/articles/bottom-sheet/)
- [Bottom sheet UI examples — Plotline](https://www.plotline.so/blog/mobile-app-bottom-sheets)
- [Best sign up flows (2026) — Eleken](https://www.eleken.co/blog-posts/sign-up-flow)
- [Login and signup UX guide 2025 — Authgear](https://www.authgear.com/post/login-signup-ux-guide/)
- [Mobile UX design patterns that convert in 2025 — JanefrancesUIUX](https://medium.com/@JanefrancesUIUX/mobile-ux-design-patterns-that-convert-in-2025-23137d3b0e56)
- [Lazy registration design pattern — UI Patterns](https://ui-patterns.com/patterns/LazyRegistration)
- [Progressive disclosure in UX design — LogRocket](https://blog.logrocket.com/ux-design/progressive-disclosure-ux-types-use-cases/)
- [Sticky CTA for mobile — ABTasty](https://www.abtasty.com/blog/mobile-stick-to-scroll/)
- [Gated content statistics 2026 — Amra & Elma](https://www.amraandelma.com/gated-content-conversion-statistics/)
- [Behance user onboarding: Thoughtful tooltips — Good UX by Appcues](https://goodux.appcues.com/blog/behance-user-onboarding)
- [Mobile UX design patterns and user retention — UXMatters](https://www.uxmatters.com/mt/archives/2025/01/mobile-ux-design-patterns-and-their-impacts-on-user-retention.php)
- [19 social proof examples for designers — LogRocket](https://blog.logrocket.com/ux-design/19-social-proof-examples/)
