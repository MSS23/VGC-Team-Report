# R5 — Mobile Share-to-View UX: Pattern Research + Implementation Audit

**Date:** 2026-09-14 · **Mode:** READ-ONLY research (no `src/` edits, no commits, no push)
**Scope:** OG/preview cards · logged-out first-view · Web Share API · copy-link affordances · view → create conversion
**Related ticket:** VGC-207 "Anonymous quick-share: paste-to-URL without login" (P2)

## Caveats and data gaps (read first)

- **PostHog was unavailable for this run.** No funnel, drop-off, share-source or view→signup numbers are quoted anywhere in this document. Every claim below is either (a) sourced from public writing, or (b) grounded in repo source with a file:line reference. Where I would normally cite our own rates, I say so explicitly.
- **The live site was unreachable** (proxy returns 403 CONNECT — policy block, not an outage). No real unfurl was tested against Discord/X/iMessage. The unfurl claims below are derived from the metadata the code emits, not from observed cards.
- **Consequence for prioritisation:** the ranking in §3 is by *expected* impact from mechanism (a missing image on every shared link affects 100% of shares) rather than by measured lift. Anything marked **[needs measurement]** should not be shipped without instrumenting first.

---

## 1. Patterns that convert (sourced)

### 1.1 The preview card is the ad, and a missing image is a silent tax

The `og:image` is usually the first thing a reader's eye lands on in a shared link — ahead of the headline — and a strong one measurably lifts social click-through while a missing or broken one quietly kills it ([Ghostly](https://ghostlyinc.com/en-us/open-graph-images-complete-guide/), [Pixola](https://www.pixola.ai/blog/complete-guide-open-graph-images)). Reported effects: custom preview images on shared links improving CTR by up to ~39% versus no image or a poor auto-generated one, and posts with custom images seeing 2–3× the clicks of default previews ([Krumzi 2026 guide](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2026-guide)). These are vendor-blog figures, not controlled studies — treat the direction as reliable and the magnitude as indicative.

The mechanical requirements are boring and non-negotiable: **1200×630** (≈1.91:1) works across effectively every OG consumer, and X only renders the big card when `twitter:card` is explicitly `summary_large_image` with a `twitter:image` present ([OpenGraph Check](https://opengraph-check.com/en/blog/open-graph-image-size), [Peeksy](https://peeksy.space/blog/open-graph-image-complete-guide)). `summary` (the small square card) is the default and is what you get if you don't say otherwise.

**What the good ones put on the card.** Strava, Spotify Wrapped and Behance all converge on the same content recipe: one identity-carrying headline, a small number of high-contrast visual tokens, and a single unobtrusive wordmark. The design point Wrapped commentary keeps landing on is that **the sharer is not promoting the product — they are expressing identity, and the product is the vehicle** ([Product Artistry](https://www.productartistry.com/p/the-art-of-going-viral-dissecting), [NoGood](https://nogood.io/blog/spotify-wrapped-marketing-strategy/)). Strava's version of this is that every metric is presented in a social-first frame so that even a casual 5K "deserves recognition" ([NoGood on Strava](https://nogood.io/blog/strava-marketing-strategy/)). The transferable rule for us: **the card must lead with the user's achievement (placement, tournament, record), not with our product name.**

### 1.2 The first view for a logged-out visitor must be content, immediately

Pinterest's growth engineering write-up is the clearest public data point: shipping performance improvements cut wait time ~40% and produced a **~15% increase in SEO traffic and a ~15% increase in conversion rate to signup** — and because those multiply, it was one of their largest signup wins ([Pinterest Engineering](https://medium.com/pinterest-engineering/driving-user-growth-with-performance-improvements-cfc50dafadd7)). Note what this implies: for a shared/indexed content page, **latency is a conversion lever, not just a quality lever.**

The structural pattern underneath it is the UGC → index → land → convert loop that Pinterest, Behance and Figma Community all run: user content is server-rendered and indexable, a stranger lands directly on that content, and a fraction convert ([Growth Loops](https://gtm-labs.co/growth-loops)). The loop breaks at the "lands on that content" step if the landing URL bounces, renders a spinner, or needs a client round-trip before showing anything.

### 1.3 The conversion moment is "make this one yours", not "sign up"

Figma Community's loop is explicitly duplicate-driven: each remix is a micro-conversion, and duplicating a template is the action that pulls a new person into an account ([texys](https://texys.substack.com/p/what-figma-taught-the-world-about), [Fishman Afnewsletter on template loops](https://www.fishmanafnewsletter.com/p/the-template-acquisition-loop-canva-figma)). The CTA verb is *Duplicate* / *Open in Figma* / *Remix* — possession of a concrete artifact — not *Sign up*. Canva, Notion, Miro and Airtable run the same template-acquisition loop.

### 1.4 Let people produce something before you ask who they are

Ungated "try before signup" experiences are reported at ~70 signups and ~5.6 paying customers per 1,000 visitors, outperforming gate-first trial models on total conversion volume ([Userpilot](https://userpilot.com/blog/saas-signup-flow/)). The framing that matters: signup is step 3 of a 6-step activation arc sitting *between* the landing page and the first-run experience, so gating before the user has produced anything moves the drop-off earlier rather than removing it. Publisher registration walls show the same shape — deferring the wall until after value delivery produced multiples more registrations than a cold form ([Playwire](https://www.playwire.com/blog/reader-registration-wall-how-publishers-turn-anonymous-traffic-into-ad-revenue)).

This is precisely the thesis behind **VGC-207**.

### 1.5 Web Share API: one tap, native sheet, rich payload

`navigator.share()` requires transient activation (must be fired from a real user gesture), and `navigator.canShare()` should gate the payload — especially for `files`, where support is narrower than for `{title, text, url}` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API), [web.dev](https://web.dev/articles/web-share)). Two practical notes from the guidance:

- Include **`text` as well as `url`**. Targets like WhatsApp, iMessage and Signal compose the message body from `text`; with `title`+`url` only, the recipient gets a bare link with no context ([LogRocket](https://blog.logrocket.com/advanced-guide-web-share-api-navigator-share/)).
- Sharing an **image file** via `navigator.share({files})` is the only reliable route to Instagram/Stories-type destinations from the web; `<a download>` is not a sharing mechanism and is unreliable in in-app webviews ([web.dev share pattern](https://web.dev/patterns/web-apps/share)).
- Firefox still lacks general support, so the native button must be additive, never the only path ([Telerik](https://www.telerik.com/blogs/definitive-guide-using-web-share-api)).

### 1.6 Copy-link affordances

The pattern that wins on mobile is: the URL row *is* the button, it carries a copy icon (not only a text label), it confirms in place with an icon swap plus a live-region announcement, and it degrades to a selectable, fully visible URL when the Clipboard API is unavailable (non-secure context, permission denial, webview). A silent no-op on clipboard failure is the specific failure mode to avoid — the user taps, nothing happens, and there is no recovery path presented.

---

## 2. Our current flow (file-grounded)

### 2.1 What happens when someone opens a shared link

| Step | Where | What actually happens |
|---|---|---|
| Unfurl | `src/app/s/[id]/page.tsx:122-141` | Text-only card. `openGraph.images: []`, `twitter.images: []`, `twitter.card: "summary"`. |
| Request `/s/{id}` | `src/app/s/[id]/page.tsx:148-232` | Server renders **no report content** — only JSON-LD + `<ShareRedirectClient>`. |
| Client boot | `src/app/s/[id]/redirect.tsx:9-11` | `router.replace("/?s={id}")` — navigates off the shared URL to the homepage route. |
| Data fetch | `src/hooks/useShareUrl.ts:179-216` | Client-side `fetch("/api/share/{id}")`, **15 s** abort timeout (`:154-162`, comment cites Neon cold start). |
| URL cleanup | `src/hooks/useShareUrl.ts:213` | `history.replaceState(null, "", "/s/{id}")` puts the URL back. |
| Render | `src/app/page.tsx` | Homepage component tree renders the report from client state. |

`src/app/s/[id]/loading.tsx` contains a genuinely nice 6-sprite skeleton, but it only covers the Suspense boundary of a segment whose sole output is a spinner — the viewer's actual wait happens *after* the redirect, on the homepage route, outside this skeleton's reach.

### 2.2 The OG generator that exists but is switched off

`src/app/s/[id]/opengraph-image.tsx` is a complete, well-built 1200×630 edge card: title priority tournament → placement → species (`:140`), placement-tier colour treatment for 1st/2nd/3rd (`:142`), creator byline, record and regulation chips (`:153-157`), six sprites inlined as base64 data URIs, and a `FallbackCard` (`:94-107`). It already carries the defences its own removal note asks for: a 4 s abort on the share fetch (`:70`), a 2.5 s abort per sprite with an inline pokéball placeholder (`:109-126`), and a full fallback when data is missing (`:132-134`).

It is dead code. `page.tsx:110-121` explains the deliberate suppression ("tried this twice… `images: []` is load-bearing"), and the explicit empty arrays override Next's file-convention inheritance. **Every shared team link on the product currently unfurls without an image.**

### 2.3 oEmbed: built, never discoverable

`src/app/api/oembed/route.ts` is fully implemented — rich type, iframe HTML, `thumbnail_url` → `/api/team-graphic?id={id}&style=wide` at 1200×400, 1 h CDN cache. But a repo-wide grep for `oembed` outside that route returns **nothing**: there is no `<link rel="alternate" type="application/json+oembed" …>` in the `/s/[id]` head. Discord, Slack and every other consumer discover oEmbed endpoints from that link tag, so this endpoint is never called in production.

### 2.4 Share modal

`src/components/ui/ShareModal.tsx` (928 lines) is the strongest part of the flow and gets a lot right: bottom-sheet on mobile with drag handle and `env(safe-area-inset-bottom)` (`:320-339`), focus trap and Escape (`:155-201`), 44×44 targets, an `aria-live` region for copy confirmations (`:334`), native share promoted to a full-width primary button on mobile above everything else (`:481-494`) with the desktop copy demoted into the list (`:604-627`), pre-composed Discord/X/Reddit text built from an `achievementHeadline` (`:233-249`), rental-code block (`:446-479`), and a card preview shown *before* the URL so the sharer sees what they're sending (`:399-412`).

Weak points, all specific:

- `handleNativeShare` (`:306-316`) shares `{ title, url }` only. `achievementHeadline` (`:233-238`) — the good part — is passed to X and Discord but **not** to the native sheet. No `navigator.canShare()` gate; support detection is `"share" in navigator` (`:113`).
- Five clipboard handlers (`:211-223`, `:251-262`, `:264-274`, `:276-287`, `:292-304`) all `catch {}` into a comment-only no-op. When the Clipboard API is unavailable the UI gives no feedback and no manual-copy path.
- The copy row (`:416-430`) is label-text only, no copy icon. For long-fallback URLs `displayUrl` (`:227-229`) renders `domain/...` — truncated to something the user cannot select or read.
- Social buttons are `opacity-40 pointer-events-none` for non-short URLs (`:497`) with no explanation of why they're dead.

### 2.5 The "view → create your own" moment

Two CTAs, both ending at a Clerk modal:

- `src/components/ui/ShareViewCTA.tsx` — floating bar, "Like this team? Duplicate it to your account". Signed-out → `<SignInButton mode="modal">` (`:53-62`). Rendered from `src/app/page.tsx:1643-1668`; dismissal persisted per-share-id in `localStorage`.
- End-of-report CTA, `src/app/page.tsx:1444-1481` — "You've reached the end!" → signed-out gets `<SignUpButton mode="modal">` / "Sign up free".
- Header fork button, `src/app/page.tsx:1377-1417` — public reports only, non-owners; signed-out variant opens sign-in.

The verb "Duplicate" is right (matches §1.3). The wall behind it is the problem: nothing in the product can be produced by an anonymous visitor.

### 2.6 VGC-207 blocker, precisely located

`src/app/api/share/route.ts:112-127` — every POST, create or update, requires a Clerk session:

```
if (!authedUserId) {
  return NextResponse.json(
    { error: "Sign in to save or update a team report." },
    { status: 401 }
  );
}
```

Immediately after, `:134-141` also hard-requires a non-empty `creatorName`. The 401 is deliberate and security-motivated (the comment at `:114-118` explains it: an edit token in localStorage must never grant mutation rights). Any anonymous quick-share design has to satisfy that constraint rather than revert it — e.g. anonymous shares as a distinct, non-editable, unlisted-by-default, TTL-bounded row with no edit token issued, claimable on later sign-in.

### 2.7 Embed and team card

- `src/app/embed/[id]/page.tsx` — ISR 600 s, `noindex`, sprites + summary. Its only outbound CTA is a **10px** "View full report →" link (`:84-91`) — the smallest text on the card, and the only conversion surface on a page designed to be pasted into other people's sites. Gated on `is_public = TRUE` (`:13`), so unlisted reports 404 rather than degrade.
- `src/components/ui/TeamCardExport.tsx:44-48` — html2canvas → `canvas.toDataURL` → synthetic `link.download` click. No `navigator.share({files})` path. On iOS Safari and in-app webviews (X, Discord, Instagram) a programmatic data-URL download is the classic silent failure. This is our Spotify-Wrapped artifact and on mobile it dead-ends at the device rather than reaching a social destination.

### 2.8 Measurement on the receiving side

Sharer-side events are well covered (`ShareModal.tsx` fires `share_link_copied`, `share_native_used`, `share_twitter_clicked`, `share_reddit_clicked`, `share_discord_copied`, `share_paste_copied`, `share_rental_code_copied`, `share_embed_copied`, `team_card_downloaded`). Viewer-side is thin: `report_viewed` (`src/app/page.tsx:685` + server-side in `src/app/api/views/[shareId]/route.ts:52`), `share_view_duplicate_anonymous` (`page.tsx:1651`), `fork_attempted_signed_out` (`page.tsx:776`). There is **no** CTA-impression event, no auth-state property on `report_viewed`, and no share-channel attribution on arrival — so even with PostHog restored, "shared link → viewer → signup" is not currently constructible as a funnel.

---

## 3. Gaps ranked by impact

**G1 — Shared links unfurl with no image, on every channel. (Highest)**
`src/app/s/[id]/page.tsx:122-141`. A finished 1200×630 generator with timeouts, sprite fallbacks and a `FallbackCard` sits unused at `src/app/s/[id]/opengraph-image.tsx`. The card is the entire top of the funnel for a product whose distribution is Discord and X; §1.1 says this is the single highest-leverage preview change available. The historical reason for the suppression was broken renders — the defences that failure demanded are already present in the file. Re-enabling should be staged (static-first card → progressive sprite inclusion) and verified per-platform, not just flipped.

**G2 — `twitter:card` is `summary`, so even the text unfurl is a small square card.**
`src/app/s/[id]/page.tsx:136-141`. `src/app/layout.tsx:54` and `src/app/explore/page.tsx:37` both already use `summary_large_image`; the share route is the inconsistent one. Coupled to G1 — meaningless without an image, mandatory alongside it.

**G3 — The shared URL redirects off itself and renders nothing server-side.**
`page.tsx:229` → `redirect.tsx:9-11` → `useShareUrl.ts:179-216`. Spinner → homepage route → client fetch with a 15 s ceiling on a Neon cold start, before a mobile visitor sees a single Pokémon. Pinterest's result (§1.2) says this costs both SEO traffic and signup conversion multiplicatively. The DB read the metadata layer already performs (`page.tsx:166-169`) fetches the same row the client then re-fetches over the network.

**G4 — Anonymous visitors cannot produce anything (VGC-207).**
`src/app/api/share/route.ts:122-127`, plus the Clerk gate on both CTAs (`ShareViewCTA.tsx:53-62`, `page.tsx:1464-1478`). §1.4's ungated-first evidence points the other way. Must be designed around the auth invariant at `route.ts:114-118`, not through it.

**G5 — oEmbed endpoint is unreachable for want of one `<link>` tag.**
`src/app/api/oembed/route.ts` exists and is good; nothing advertises it. Discord/Slack rich unfurls with a thumbnail are sitting behind a single head tag. Cheapest item on this list by a wide margin.

**G6 — Native share payload is thin and two taps deep.**
`ShareModal.tsx:306-316` omits `text` (the `achievementHeadline` we already compose at `:233-238`); no `navigator.canShare()`; only reachable after opening the modal. A viewer forwarding someone else's report to a teammate — the highest-frequency mobile share — gets a bare URL in the message body.

**G7 — The team card downloads instead of sharing.**
`TeamCardExport.tsx:44-48`. No `navigator.share({files})`. The identity artifact (§1.1) cannot reach Stories/DMs from mobile web, and the download itself is unreliable in the in-app browsers where most of our shared links are opened.

**G8 — No viewer-side funnel instrumentation. [needs measurement]**
No CTA-impression events, no auth-state property on `report_viewed`, no arrival-channel attribution. This is also why this report quotes no internal numbers. Should land *before* G1/G3/G4 ship, or their effects are unmeasurable.

**G9 — Clipboard failures are silent in five places.**
`ShareModal.tsx:211-223, 251-262, 264-274, 276-287, 292-304`. Plus: no copy icon on the primary URL row (`:416-430`), and the long-URL `displayUrl` (`:227-229`) renders an unusable truncation.

**G10 — The embed is a billboard with a 10px CTA.**
`embed/[id]/page.tsx:84-91`, and unlisted reports hard-404 at `:13`.

---

## 4. Suggested Linear tickets

| Title | Priority | Notes |
|---|---|---|
| VGC-xxx: Re-enable OG image on shared reports (staged, per-platform verified) | **P1** | G1+G2. Ship static-first, add sprites behind a flag; verify X/Discord/iMessage/Slack before full rollout. Third attempt — needs a rollback trigger defined up front. |
| VGC-xxx: Set `twitter:card` to `summary_large_image` on `/s/[id]` | **P1** | G2. Ships with the above, not before. |
| VGC-xxx: Server-render the shared report at `/s/[id]` instead of client-redirecting to `/?s=` | **P1** | G3. Largest UX change on this list; touches `page.tsx`, `redirect.tsx`, `useShareUrl.ts`. Feature-branch candidate. |
| VGC-xxx: Add oEmbed discovery `<link>` to `/s/[id]` head | **P2** | G5. Smallest diff, immediate Discord/Slack benefit. |
| VGC-207 (existing): Anonymous quick-share — design around the auth invariant | **P2** | G4. Proposal to evaluate: anonymous share = unlisted, no edit token, TTL-bounded, claimable on sign-in. |
| VGC-xxx: Instrument the share→view→convert funnel (CTA impressions, viewer auth state, arrival channel) | **P2** | G8. Argue for doing this first. |
| VGC-xxx: Enrich Web Share payload with `text` + `canShare()` gate; add one-tap share on the report header | **P2** | G6. |
| VGC-xxx: Share team card via `navigator.share({files})` with download fallback | **P2** | G7. |
| VGC-xxx: Clipboard fallback UI + copy icon on share URL row | **P3** | G9. Route through `ui-checklist-reviewer`. |
| VGC-xxx: Strengthen embed CTA; allow unlisted embeds to degrade rather than 404 | **P3** | G10. |

---

## 5. Sources

- [web.dev — Integrate with the OS sharing UI with the Web Share API](https://web.dev/articles/web-share)
- [web.dev — Help users share the website they are on](https://web.dev/patterns/web-apps/share)
- [MDN — Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API)
- [LogRocket — An advanced guide to the Web Share API and navigator.share()](https://blog.logrocket.com/advanced-guide-web-share-api-navigator-share/)
- [Telerik — A Definitive Guide to Using the Web Share API](https://www.telerik.com/blogs/definitive-guide-using-web-share-api)
- [Krumzi — OG Image Sizes 2026: Facebook, X, LinkedIn](https://www.krumzi.com/blog/open-graph-image-sizes-for-social-media-the-complete-2026-guide)
- [OpenGraph Check — Open Graph Image Size Guide (2026)](https://opengraph-check.com/en/blog/open-graph-image-size)
- [Peeksy — The Complete Guide to Open Graph Images in 2026](https://peeksy.space/blog/open-graph-image-complete-guide)
- [Pixola — The Complete Guide to Open Graph Images (2026)](https://www.pixola.ai/blog/complete-guide-open-graph-images)
- [Ghostly — Open Graph Images Guide: Build Better Link Previews](https://ghostlyinc.com/en-us/open-graph-images-complete-guide/)
- [Pinterest Engineering — Driving user growth with performance improvements](https://medium.com/pinterest-engineering/driving-user-growth-with-performance-improvements-cfc50dafadd7)
- [Pinterest Engineering — Redesigning the Pinterest Homepage](https://medium.com/pinterest-engineering/redesigning-the-pinterest-homepage-b269dbd97692)
- [GTM Labs — Growth Loops · 4 Types With Real Examples](https://gtm-labs.co/growth-loops)
- [texys — What Figma Taught the World About Community-Led Growth](https://texys.substack.com/p/what-figma-taught-the-world-about)
- [Fishman AF Newsletter — The Template Acquisition Loop (Canva, Figma)](https://www.fishmanafnewsletter.com/p/the-template-acquisition-loop-canva-figma)
- [Figma Help — Duplicate Community files](https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files)
- [Userpilot — SaaS Signup Flow in 2026: Why Activation Starts Before Signup](https://userpilot.com/blog/saas-signup-flow/)
- [Playwire — Reader Registration Wall](https://www.playwire.com/blog/reader-registration-wall-how-publishers-turn-anonymous-traffic-into-ad-revenue)
- [Product Artistry — Dissecting Spotify Wrapped's Product Marketing Mastery](https://www.productartistry.com/p/the-art-of-going-viral-dissecting)
- [NoGood — Spotify Wrapped Marketing Strategy](https://nogood.io/blog/spotify-wrapped-marketing-strategy/)
- [NoGood — Strava Marketing Strategy: Culture + Community](https://nogood.io/blog/strava-marketing-strategy/)
