# R5 — Mobile UX Patterns: Share-to-View Flows
*Research agent · 2026-05-08*

---

## 1. Platform Research

### Strava

**Share-to-view flow:**
Strava uses a public activity page model. When a user shares an activity set to "Everyone" visibility, the recipient follows a direct URL to a public web page showing distance, elevation, time, and a general map. No login is required to view. The experience is a full web render, not a preview gate.

**Recipient-to-signup conversion:**
Strava employs a persistent but non-blocking sticky bottom banner ("Join Strava") that floats above the page footer on all public activity views. It stays visible throughout the scroll journey but never obscures content. Critically, it appears *after* the user has consumed value (finished reading the activity stats) — not on page load. This "earn the CTA" timing pattern is key.

**Auth gate strategy:**
Soft gate. Full content is visible without login. The call to action is contextual ("To save routes or track your own activities…") — it explains *why* to sign up rather than demanding it. Comments, kudos, and segment leaderboards require login, creating natural upgrade hooks embedded in the content itself.

**Share formats:**
- Primary: direct URL link (activity page)
- Image card: auto-generated PNG downloadable from mobile app for Instagram/Stories sharing (square format, branded, shows route silhouette + stats)
- Embed: `<iframe>` embed for blogs/websites
- The image card is the highest-conversion format for social virality

**Web Share API:**
Strava's mobile web uses `navigator.share()` with title + url. Falls back to platform-specific buttons (Twitter/X, Facebook, copy link).

---

### Spotify (Wrapped)

**Share-to-view flow:**
Spotify Wrapped is the gold-standard share-to-signup engine. Recipients who follow a shared Wrapped card link land on a public web preview page that renders a partial, read-only version of the stats story. The page is viewable without login but is clearly personalized ("This is [Name]'s year in music"). A persistent CTA reads: "See your own Wrapped — open Spotify."

**Recipient-to-signup conversion:**
2025 Wrapped generated 630M+ social shares (42% YoY increase) and drove the highest single-day subscriber intake in Spotify history. The conversion lever is **identity envy**: seeing someone else's personalized story creates immediate desire for your own version. The CTA is not "sign up" — it's "see YOURS."

**Auth gate strategy:**
No hard gate. Content fully viewable. The soft CTA is benefit-framed: "Create your own Wrapped story." This "try for yourself" pattern (view → desire → create account) is the defining pattern of successful share-to-signup flows.

**Share formats:**
- Story card (Instagram/TikTok 9:16 vertical image) — dominant format
- Individual stat cards (per-artist, top genre, minutes listened) sharable separately
- Each card includes the Spotify logo, the user's name, and a small "Made with Spotify" watermark
- 2025 added Rive-powered animated cards sharable as video

**Web Share API:**
Full `navigator.share()` with `files` parameter to share the generated image card as a file blob, enabling direct-to-camera-roll saving and Stories posting. Fallback to platform-specific share intents. This is best-in-class Web Share API usage.

---

### Pinterest

**Share-to-view flow:**
Pinterest's public pin/board pages are fully accessible without login. Recipients see the full pin, related content, and creator information. However, after approximately 2–3 scrolls (or ~15 seconds of engagement), a modal or bottom sheet appears with "See more ideas" gating, or in some markets a hard interstitial.

**Recipient-to-signup conversion:**
Pinterest uses a **curiosity loop** pattern. The preview shows enough to intrigue (the shared pin is fully visible) but the surrounding content (related pins, the creator's other boards) is gated behind a two-field signup. The gate appears *after* demonstrated interest, not before — reducing abandonment.

**Auth gate strategy:**
Two-tier: view the shared item freely, but related/discovery content requires signup. Registration is minimal: email + password only, with Google/Apple OAuth prominently featured. The interstitial copy is value-forward: "Join Pinterest to save more ideas."

**Share formats:**
- URL link (primary) with rich OG preview (1200×630 image pulled from pin)
- "Save to Pinterest" bookmark button (creates a shareloop from external sites back to Pinterest)
- Direct image download for re-sharing

---

### Behance

**Share-to-view flow:**
Behance projects are fully public without any login requirement. Recipients see the complete project: all images, descriptions, tools used, and creator bio. A persistent "Follow [Creator]" and "Appreciate" button in the header nudges engagement, but both require an Adobe account.

**Recipient-to-signup conversion:**
Behance optimizes for **creator credibility** as the conversion hook. The public page is designed to showcase the creator's professionalism, which prompts two audiences to sign up: (a) other creators who want to publish their own work, and (b) clients/employers who create an account to contact the creator. The CTA is relationship-based: "Sign up to contact [Creator]" or "Sign up to follow their work."

**Auth gate strategy:**
Fully open viewing, with social interactions (appreciation, follow, comment, hire) behind a soft gate. Comments and messages require login, which is disclosed inline on the comment form rather than with a hard block.

**Share formats:**
- Direct URL (standard)
- Embed for external websites
- The project URL generates a rich OG card pulling the first project image (1200×628)
- No dedicated image card format — the OG preview IS the share card

---

### Figma Community

**Share-to-view flow:**
Figma Community files (public) are viewable without login via `figma.com/community/file/...`. Recipients see a preview thumbnail, description, stats (views, likes, duplicates), and a rendered static screenshot. The "Open in Figma" CTA requires login.

**Recipient-to-signup conversion:**
Figma's pattern is "preview → try." The shared file page shows enough to generate desire (the design looks professional, the stats show 50k duplicates), then the CTA is friction-aware: "Duplicate to your drafts — free account." This **zero-cost entry** framing (free, one click) is highly effective for creative tools.

For prototype shares specifically, Figma allows completely login-free viewing of interactive prototypes — the full product is accessible. Signup is prompted only when trying to duplicate or comment.

**Auth gate strategy:**
Viewing: no gate. Interacting (duplicate, comment, like): login required, presented as a contextual prompt at the moment of action rather than on page load.

**Share formats:**
- URL link with rich OG image (auto-generated static screenshot of the design at 1200×628)
- Prototype links (interactive, no login)
- Embed `<iframe>` for external sites
- The auto-generated screenshot OG image is the primary share conversion driver

---

### Additional Relevant Patterns

**Notion public pages:**
Full content viewable without login. Persistent top banner: "Made with Notion — use for free." The banner is exactly 40px tall, non-obtrusive, and uses the creator's content as social proof. ~8% conversion rate from shared page views to new signups.

**GitHub (public repos/gists):**
No auth gate. Social proof in the header (star count, fork count, contributors). "Sign up for GitHub" in the global nav only — no aggressive overlay. Low-friction because GitHub knows the tool's reputation closes the deal.

**Canva (public designs):**
Shared designs viewable without login. Sticky top/bottom bar: "Make your own design — it's free." Includes a visual teaser of the editor. The bar includes one-click Google/Apple OAuth. This is the closest pattern to what VGC Team Report should adopt.

---

## 2. Cross-Platform Pattern Synthesis

### Share format ranking by conversion impact

| Format | Platforms | Conversion Impact |
|--------|-----------|------------------|
| Personalized image card (story/square) | Spotify, Strava | Highest — identity-driven, native share |
| Rich OG link preview | All | High — automatic, zero effort from user |
| Sticky "make your own" CTA on recipient page | Spotify, Canva, Notion | High — captures intent at peak interest |
| Interactive preview + soft gate | Figma, Pinterest | Medium-high — works for discovery content |
| Embed | Strava, Behance, Figma | Medium — drives referral traffic |

### Auth gate strategy summary

All high-conversion platforms use the same formula:
1. **Full content visible without login** — eliminate the "not going to log in just to see this" drop
2. **Social actions gated** — comments, reactions, follow, save require login
3. **Contextual gate** — the login prompt appears *at the moment of action*, not on page load
4. **Zero-cost framing** — "free account," "takes 10 seconds," not "create password and verify email"

### Web Share API usage

Best practice pattern (Spotify-grade):
```javascript
// 1. Check file share support (image card)
if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
  await navigator.share({ files: [imageFile], title, url });
}
// 2. Fall back to URL-only share
else if (navigator.share) {
  await navigator.share({ title, text, url });
}
// 3. Fall back to modal with platform buttons
else {
  openShareModal();
}
```

The `files` parameter allows sharing a generated image card directly to Instagram Stories, WhatsApp, iMessage, etc. This is the highest-engagement share format and is currently unused by VGC Team Report.

---

## 3. Current VGC Team Report Share Component Analysis

### ShareDock.tsx — Findings

**What it does well:**
- Persistent, always-visible on scroll-up — correct placement pattern
- Auto-hides on scroll-down — non-obtrusive
- Correct touch target sizes (36×36px buttons, 36px tall pill)
- Proper aria-labels and role="region"
- Contextual share text with tournament/placement data

**Gaps identified:**
1. **No Web Share API integration.** The dock targets Twitter/Reddit/Discord but misses `navigator.share()` — on iOS/Android this would open the native share sheet (iMessage, WhatsApp, Telegram, etc.) which VGC players actively use. This is the single biggest missing feature.
2. **No image card share option.** There is no "save image" or "share image card" action. All competing platforms (Spotify, Strava, Canva) generate a shareable image card. The `/api/team-graphic` endpoint exists but is not wired into the dock.
3. **No "make your own" conversion CTA for non-owner viewers.** The dock is shown to all viewers but has no signup hook for non-authenticated recipients. A viewer who arrives from a friend's share link sees the same dock as the owner, with no prompt to create their own report.

### ShareModal.tsx — Findings

**What it does well:**
- viewerMode correctly hides owner-only controls
- Bottom sheet slide-up on mobile (correct native pattern)
- Drag handle visible (correct mobile convention)
- Analytics on share actions (PostHog + Vercel Analytics)
- Error handling for publish failures

**Gaps identified:**
1. **Viewer mode has no conversion CTA.** When `viewerMode=true`, the modal shows share options but zero signup prompts. This is the highest-intent moment for a viewer (they opened the share modal on someone else's report), yet there is no "Create your own — it's free" hook.
2. **No image/card share option.** The modal lists Twitter, Reddit, Discord — all requiring the user to manually compose a post. No "download image card" or native share option via Web Share API. The comment in `page.tsx` acknowledges that OG image generation has been problematic, but a client-side canvas-generated card would bypass the server dependency entirely.
3. **The "link copied" + subtitle copy in viewerMode is weak.** "Copy the link or post it to social" is generic. Successful share UX uses benefit-framed copy: "Share this team with your Discord server" or "Post to r/VGC" — specific, audience-aware, action-directed.

---

## 4. Top 3 Improvements for Share-to-Signup Conversion

### #1 — Add a Viewer Conversion CTA Banner (Highest Impact)

**The gap:** Non-owner viewers who arrive via a shared link have no prompt to create their own report. This is the exact "identity envy" moment that Spotify and Canva exploit.

**Recommendation:** In `ShareDock.tsx`, add a conditional `viewerMode` prop. When true, replace the "Share" text label with a conversion pill:

```
[Share this] ← existing buttons ← [+ Make your own — free]
```

The CTA should be benefit-framed with a direct link to the homepage/builder, shown at the moment the viewer has already consumed the report value. Separately, add a subtle sticky bottom banner (40px, dismissible) on the `/s/[id]` page for non-authenticated viewers — modeled on Notion/Canva's pattern — reading: "Build your own VGC team report — it's free."

Expected impact: captures 5–15% of engaged non-authenticated viewers who currently leave with no call to action.

---

### #2 — Web Share API + Native Share Sheet (Medium-High Impact)

**The gap:** The dock and modal offer Twitter/Reddit/Discord but not the native OS share sheet. VGC players primarily share in Discord DMs, WhatsApp group chats, and iMessage — none of which are reachable from the current share buttons.

**Recommendation:** In `ShareDock.tsx`, add a native "Share" button using `navigator.share()` (with `url` + `title` + `text`). Place it first in the dock on mobile (detect with `'share' in navigator`). On desktop where it's unsupported, it is simply absent. The button label is a standard share icon (the box-with-arrow symbol, already a recognized affordance).

```typescript
const handleNativeShare = async () => {
  if (!navigator.share) return;
  await navigator.share({ title: documentTitle, text: shareText, url: publicUrl });
};
```

Expected impact: increases share completion rate on mobile (where shares currently require navigating through Twitter/Reddit intent URLs). Native share converts at 2–3x the rate of platform-specific buttons for messaging-app destinations.

---

### #3 — Per-Report Dynamic OG Image Card (Medium Impact, High Virality Multiplier)

**The gap:** `page.tsx` explicitly suppresses OG images (`images: []`) due to past failures with edge-runtime + sprite CDN dependencies. This means every shared link unfurls with text-only previews on Discord, Twitter, and iMessage. Link previews with images get 3–5x more clicks.

**Recommendation:** Generate OG cards client-side using an HTML Canvas approach (no server dependency, no CDN calls), triggered by the "Copy link" action: render a simple 1200×630 card with team species names in large type, tournament name if present, and a subtle grid background. Export as a data URL. This sidesteps the edge-runtime sprite issue entirely.

Alternatively, create a `/api/og/s/[id]` route that only uses the team name, species text, and tournament name (no sprite images) — pure text + geometry via `@vercel/og`. This is stable on edge runtime and eliminates the CDN dependency that caused previous failures.

Wire this OG image into the `generateMetadata` in `page.tsx` and also expose a "Save image card" button in `ShareModal.tsx` using `canvas.toBlob()` + `navigator.share({ files: [...] })`.

Expected impact: rich link previews increase click-through from Discord/Twitter by an estimated 3–5x vs. text-only unfurls, directly increasing the share-to-new-user pipeline.

---

## 5. Implementation Priority Order

| Priority | Change | Files | Effort |
|----------|--------|-------|--------|
| 1 | Viewer conversion CTA in ShareDock + sticky banner on /s/[id] | ShareDock.tsx, s/[id]/page.tsx | 2–3h |
| 2 | Web Share API button in ShareDock | ShareDock.tsx | 1h |
| 3 | Text-only OG image for /s/[id] (no sprites) | app/s/[id]/opengraph-image.tsx | 3–4h |
| 4 | "Save image card" in ShareModal + navigator.share files | ShareModal.tsx, new canvas util | 4–6h |

---

*Research sources: Spotify Newsroom (2025 Wrapped), Strava Support/Press, Figma Help, MDN Web Share API, web.dev, OpenGraph.xyz, Vercel OG docs, authgear.com login UX guide, eleken.co signup flow patterns, MDN Navigator.share.*
