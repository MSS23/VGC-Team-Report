# R5 — Mobile Share-to-View UX: Patterns + Repo Audit

**Date:** 2026-09-07
**Agent:** R5 (read-only UX research)
**Scope:** Share-to-view conversion patterns (Strava / Pinterest / Behance / Figma Community / Spotify) mapped against the actual `/s/[id]` path in this repo.
**Prior reports consulted:** `.swarm/r5-mobile-share-ux.md`, `.swarm/r5-mobile-ux-sharing-20-05-26.md`, `.swarm/r5-mobile-ux-patterns.md`, `.swarm/r5-mobile-ux-share-patterns.md`, `.swarm/r5-mobile-ux-sharing.md`

Every finding is tagged **NEW** or **KNOWN** relative to those.

---

## Part 1 — Reference patterns

### 1.1 The five patterns that actually move share→signup

| # | Pattern | Canonical example | Mechanism |
|---|---------|-------------------|-----------|
| P1 | **Content first, app shell second** | Strava activity link, Behance project page | The shared URL server-renders the *content* (map + stats / the project images) at first paint. Chrome — nav, auth, editor — arrives after, or never. No redirect hop, no spinner, no "loading shared team…". |
| P2 | **Rich, content-derived OG card** | Strava (route map + pace), Pinterest (the pin image itself), Spotify (album art + track) | The unfurl *is* the ad. It tells the story before the click. Pinterest's card is the pin with zero chrome; Strava's is a generated map thumbnail. Both are content-specific, never a generic logo. |
| P3 | **Deferred auth on a single verb** | Figma Community "Open in Figma"/duplicate, Behance "Save", Pinterest "Save" | 100% of content is free to read. Exactly one action is gated, and that action is *acquisitive* (it creates the viewer's own copy). Auth is asked at the moment of intent, not on arrival. |
| P4 | **Share the artifact, not just the URL** | Spotify share card, Strava sticker overlay, Pinterest board video | Users get a rendered image they can drop into Stories/Discord. On mobile the delivery is `navigator.share({ files: [...] })` — the OS sheet — not a `<a download>`, which is unreliable on iOS Safari and lands in Files, not the camera roll. |
| P5 | **One CTA at a time, ranked by intent** | All of the above | A shared-link viewer sees the content CTA. App-install / newsletter / cookie asks are suppressed or deferred until *after* the content CTA is resolved. Competing bottom sheets kill both. |

### 1.2 Supporting numbers found in research

- Pages with no `og:image` receive roughly **18% fewer clicks** from X and Slack unfurls; custom branded OG images lift shares meaningfully vs. missing/stock images. Better previews are cited at **~30–40% CTR lift**. ([env.dev OG guide](https://env.dev/guides/opengraph), [imghero OG guide](https://img-hero.com/blog/open-graph-images-complete-guide/))
- Unfurler priority order is `og:*` → `twitter:*` → bare HTML, across X, Slack, Discord, iMessage, WhatsApp, Bluesky, Reddit. A single tag set covers all of them. ([DEV: URL unfurling](https://dev.to/eatyou_eatyou_d79d27e5622/url-unfurling-how-slack-discord-and-twitter-generate-link-previews-5hgb))
- Strava's own conversion learning: routing link-clickers into a **logged-out mobile-web surface** substantially depresses conversion vs. landing them on content they can act on. ([Branch: Strava deep links](https://www.branch.io/resources/blog/how-strava-unifies-in-app-experiences-with-deep-links-mobile-user-acquisition-engagement/))

---

## Part 2 — Repo audit

### 2.0 The actual first-view waterfall on `/s/{id}` (mobile, cold)

Traced from source:

1. `GET /s/{id}` → `src/app/s/[id]/page.tsx:148` server component. Runs **2 DB queries** (`page.tsx:166-169`) plus **2 more** in `generateMetadata` (`page.tsx:25-28`) — 4 Neon reads per view, no `revalidate`, no `dynamic` export, so uncached.
2. HTML returned contains only `<JsonLd>` + `<ShareRedirectClient>` (`page.tsx:224-231`) — i.e. a spinner and an `sr-only` `<h1>` (`redirect.tsx:14-23`). **Zero report content.**
3. Full root layout hydrates: `ClerkProvider`, `PostHogProvider`, `ClarityProvider`, `PersistentNavbar`, `DeferredLayoutExtras` (`layout.tsx:106-144`) — Clerk auth JS loads for an anonymous viewer who will never sign in.
4. `useEffect` fires `router.replace("/?s={id}")` (`redirect.tsx:9-11`) → **second full client navigation** into `src/app/page.tsx` (1833 lines).
5. `useShareUrl.ts:184-186` fetches `/api/share/{id}` with a **15 s** timeout (`useShareUrl.ts:162`).
6. `useShareUrl.ts:213` calls `history.replaceState(null, "", "/s/{id}")` to put the URL back.
7. Only now does report content paint.

**Two document loads + one API roundtrip + Clerk + PostHog + Clarity before a single Pokémon sprite appears.** This is the exact inverse of P1.

### 2.1 VGC-275 / VGC-228 — **CONFIRMED STILL TRUE** (KNOWN, re-verified 2026-09-07)

> VGC-275: `/s/[id]` serves a client redirect rather than the report.

Verified. `src/app/s/[id]/page.tsx:229` renders `<ShareRedirectClient to={"/?s=" + id} />` and nothing else. `src/app/s/[id]/redirect.tsx:6-11` is `"use client"` with `router.replace(to)` in a `useEffect`. There is **no** `<noscript>` fallback and **no** server-rendered report markup.

The blast radius is real: `src/app/sitemap.ts:40-47` emits up to **5000** `/s/{id}` URLs. Every one of them serves a spinner as its server HTML. `public/robots.txt` allows all of them. Google will render the JS eventually, but it sees a 2-hop client nav into a route (`/?s=`) that then rewrites its own URL — thin, slow, and it wastes crawl budget across 5000 URLs.

`loading.tsx` (80 lines of report-shaped skeleton) exists and is well-built, but it is a Suspense fallback for the *redirect shell*, not for real content — it makes the empty state look convincing rather than fixing it.

VGC-228's proposal (server-render `/s/[id]` without the app shell) is still the correct fix and is still unimplemented.

**Gap → P1. File: `src/app/s/[id]/page.tsx:224-231` + delete/retire `src/app/s/[id]/redirect.tsx`. Size: L.**

### 2.2 The OG card is fully built, deployed, and unreachable — **NEW nuance on a KNOWN issue**

`src/app/s/[id]/opengraph-image.tsx` is 174 lines of finished work: sprite fetch with 2.5 s timeout and pokéball fallback (`:111-126`), share fetch with 4 s timeout (`:67-92`), placement-tier colour ramp (`:142`), gradient card, regulation badge, branded footer. It builds — `.next/server/app-paths-manifest.json` contains `"/s/[id]/opengraph-image/route"`, and `.next/server/app/s/[id]/opengraph-image` exists on disk.

But `generateMetadata` sets `openGraph.images: []` and `twitter.images: []` (`page.tsx:131`, `page.tsx:140`). **An explicit `openGraph.images` value in `generateMetadata` takes precedence over the `opengraph-image` file convention** ([Next.js metadata docs](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image), [generateMetadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)). So the route is live but no `<meta property="og:image">` ever points at it.

Net effect: **every one of ~5000 share links unfurls as a text-only `summary` card in Discord, X, iMessage, and WhatsApp** (`twitter.card: "summary"`, `page.tsx:137` — the small-square variant, not `summary_large_image`). Discord is where this product's links actually circulate.

**NEW, and this is the important part:** the code comment at `page.tsx:110-121` justifies the suppression on the grounds that dynamic OG generation produced broken unfurls (edge runtime + sprite CDN + unfurler timeout). That reasoning no longer forces `[]`. Since May 2026 a **static, CDN-served `public/og-default.png`** (1200×630, branded) exists and is already wired into the root layout as a second image (`layout.tsx:50`, `layout.tsx:59`). A static PNG has none of the timeout risk the comment describes.

So there are three ladder rungs, none of which requires accepting the old risk:

- **Rung 1 (S, near-zero risk):** replace `images: []` with `images: ["https://pokemonvgcteamreport.com/og-default.png"]` on both OG and Twitter, and switch `twitter.card` to `summary_large_image`. Branded card instead of a bare text row; recovers most of the ~18% missing-image click penalty with a static asset.
- **Rung 2 (M):** point OG at `/api/team-graphic?id={id}` (already exists — used by `TeamCardCTA.tsx:27`) with a cached response, so the card is content-derived.
- **Rung 3 (M):** re-enable the file convention by deleting `images: []` entirely, after adding a long `Cache-Control` on the OG route so unfurlers hit a cached PNG rather than a cold edge render. The sprite fetch already degrades to a pokéball placeholder, so worst case is a card with grey pokéballs — still infinitely better than no card.

**Gap → P2. File: `src/app/s/[id]/page.tsx:126-141`. Size: S (rung 1) / M (rungs 2–3).**

### 2.3 Install prompt hijacks the share-conversion moment — **NEW**

`InstallPrompt` is mounted globally via `DeferredLayoutExtras` in the root layout (`layout.tsx:143`, `DeferredLayoutExtras.tsx:27`). It has **no awareness of shared-view context**. Its gates are 60 s dwell + 200 px scroll (`InstallPrompt.tsx:53-64`) — which is *exactly* the profile of an engaged first-time viewer reading someone's shared team report.

When it fires it renders a full-viewport scrim at `z-[60]` and a bottom sheet at `z-[61]` (`InstallPrompt.tsx:116`, `:122`).

`ShareViewCTA` — the actual conversion CTA, "Like this team? Duplicate it to your account" — sits at `z-30` (`ShareViewCTA.tsx:32`).

So the install sheet **covers and blocks the duplicate CTA** at the precise moment the viewer is most likely to convert. It also asks the wrong question: a first-time viewer who has never used the product is being asked to install an app, before being asked to make an account. That inverts P5 and P3.

Fix: gate `InstallPrompt` on `!isSharedView` (or on a returning-visitor signal), so first-touch share viewers see only the duplicate CTA.

**Gap → P5. Files: `src/components/ui/InstallPrompt.tsx:18-91` (add a suppression condition) or `src/components/ui/DeferredLayoutExtras.tsx:27` (conditional mount). Size: S.**

### 2.4 Team card is download-only — no `navigator.share({ files })` — **NEW**

`ShareModal` correctly detects and uses the Web Share API for the **URL** (`ShareModal.tsx:112-114`, `:306-316`, primary full-width mobile button at `:482-494`). That part is good and matches Strava.

But `TeamCardExport` — the rendered PNG, which is the P4 artifact — only ever does a synthetic `link.download` after an html2canvas render (`TeamCardExport.tsx:39-46`). There is no `navigator.share` and no `files:` anywhere in the file (grep returns nothing). On iOS Safari an `<a download>` on a canvas blob is unreliable and, when it works, drops the PNG into Files rather than Photos — so the user cannot post it to a Story or drop it into Discord without extra steps.

Spotify/Strava both hand the rendered image straight to the OS share sheet. Adding `navigator.share({ files: [new File([blob], name, {type:"image/png"})] })` with a feature check (`navigator.canShare?.({files})`) and falling back to the existing download is a contained change inside the existing export handler.

**Gap → P4. File: `src/components/ui/TeamCardExport.tsx:39-46`. Size: S.**

### 2.5 Four uncached Neon reads per share view — **NEW**

`generateMetadata` runs two queries (`page.tsx:26-27`) and the page body runs two more (`page.tsx:167-168`) — the *same* `shares` row and the *same* `collaborators` rows, fetched twice per request. The route declares neither `revalidate` nor `dynamic`, so nothing is cached at the framework level. By contrast `/embed/[id]` sets `revalidate = 600` (`embed/[id]/page.tsx:5`) and the API sets `s-maxage=30` (`api/share/[id]/route.ts:259-261`).

With 5000 sitemap URLs and a free-tier 512 MB Neon instance, crawl traffic multiplies by 4. Whoever implements VGC-228 should collapse these into one query (or a cached loader) as part of the same change, and add a `revalidate`.

**Gap → P1 (implementation detail). File: `src/app/s/[id]/page.tsx:25-28` + `:166-169`. Size: S, but do it inside the VGC-228 change.**

### 2.6 What is already good — do not regress it

| Pattern | Status |
|---|---|
| P3 deferred auth | **Correct.** `ShareViewCTA.tsx:44-62` — content is fully readable, exactly one gated verb ("Duplicate"), sign-in modal only on intent, anonymous intent tracked (`page.tsx:1647-1652`). Textbook Figma Community. |
| P4 preview-first sheet | **Implemented since the May report.** `ShareModal.tsx:399-412` renders a `compact` `TeamCardExport` above the URL row — the exact change recommended in `.swarm/r5-mobile-share-ux.md`. Closed. |
| Native share as mobile primary | **Correct.** `ShareModal.tsx:482-494`, full-width accent button above all platform tiles, desktop variant demoted into the list at `:605-627`. |
| Copy-link affordance | **Strong.** Whole row is the target (`ShareModal.tsx:416-430`), 44 px min height, keyboard-operable, `aria-live` region announces every copy (`:334`, `:104`), per-action PostHog events. |
| Channel-native copy | **Strong.** Pre-formatted Discord bold-headline text (`:246`), Reddit `[Team Report]` title (`:242-244`), X intent with hashtags (`:240`), rental code surfaced above all social actions (`:449-479`) — that last one is genuinely VGC-native and better than anything the reference apps do. |
| Embed | `/embed/[id]` server-renders real content with sprites and a "View full report" backlink (`embed/[id]/page.tsx:59-91`), `revalidate = 600`, `noindex`. **Ironically the embed route already does what `/s/[id]` should do.** It is the working proof that VGC-228 is straightforward. |

---

## Part 3 — Ranked gaps

| # | Gap | Pattern | File(s) | Size |
|---|-----|---------|---------|------|
| 1 | `/s/[id]` server-renders a client-redirect spinner, not the report (VGC-275 confirmed). 5000 sitemap URLs affected. | P1 | `src/app/s/[id]/page.tsx:224-231`; retire `redirect.tsx` | **L** |
| 2 | Finished OG card route is built but unreachable — `images: []` overrides the file convention; all links unfurl text-only as small `summary` cards | P2 | `src/app/s/[id]/page.tsx:126-141` | **S** (static fallback) → M (dynamic) |
| 3 | `InstallPrompt` (z-61 + scrim) covers `ShareViewCTA` (z-30) at the conversion moment, for viewers who have never used the product | P5 | `src/components/ui/InstallPrompt.tsx:18-91` | **S** |
| 4 | Team card PNG is `<a download>` only — no `navigator.share({files})`, so it's unusable for Stories/Discord on iOS | P4 | `src/components/ui/TeamCardExport.tsx:39-46` | **S** |
| 5 | 4 uncached Neon reads per share view (duplicate queries across `generateMetadata` and page body), no `revalidate` | P1 | `src/app/s/[id]/page.tsx:25-28`, `:166-169` | **S** |

**Sequencing note:** #2, #3, #4 are all S and independent of #1 — they can ship before the VGC-228 rewrite and each recovers conversion on its own. #5 should ride along inside #1.

---

## Sources

- [Metadata Files: opengraph-image and twitter-image — Next.js](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Functions: generateMetadata — Next.js](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Open Graph Protocol: Complete Social Sharing Guide (2026) — env.dev](https://env.dev/guides/opengraph)
- [Open Graph Images: The Complete Guide (2026) — imghero](https://img-hero.com/blog/open-graph-images-complete-guide/)
- [URL Unfurling: How Slack, Discord and Twitter Generate Link Previews — DEV](https://dev.to/eatyou_eatyou_d79d27e5622/url-unfurling-how-slack-discord-and-twitter-generate-link-previews-5hgb)
- [How Strava Unifies In-App Experiences with Deep Links — Branch](https://www.branch.io/resources/blog/how-strava-unifies-in-app-experiences-with-deep-links-mobile-user-acquisition-engagement/)
- [How to Get and Share Links From Strava — Strava Help Center](https://support.strava.com/en-us/articles/15401717-how-to-get-and-share-links-from-strava)
- [Figma Community — remix/duplicate model](https://www.figma.com/community)
