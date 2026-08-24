# R5 — Mobile Share→View UX Research

**Date:** 2026-08-24
**Agent:** R5 (read-only UX research)
**Scope:** Share→view conversion for first-time, logged-out mobile visitors arriving from a shared link.
**Repo:** `/home/user/VGC-Team-Report`

---

## 0. Data caveat (read first)

**No PostHog credentials were available this run.** There is no funnel, drop-off, session-replay, or
conversion data backing anything below. Every claim about *this product's* behaviour is derived from
reading source code, not from measurement. Every claim about *other products* is either (a) sourced
from a citation below or (b) explicitly labelled as pattern knowledge.

I have invented no numbers. Where a number appears it is cited. The one place I would normally lead
with data — "what % of `/s/` arrivals bounce before the report paints" — is unanswerable right now
and is itself the top instrumentation gap (see §6, Opportunity 5).

`pokemonvgcteamreport.com` is egress-blocked from this container, so I could not test the live
unfurl, live TTI, or the live logged-out view. Findings are static-analysis only.

---

## 1. Executive summary

The **outbound** half of this product's sharing is excellent. `ShareModal.tsx` is genuinely
best-in-class mobile share UX — bottom sheet, drag handle, native `navigator.share()` promoted to the
primary action, focus trap, `aria-live` copy confirmations, 44×44 targets, `env(safe-area-inset-bottom)`
padding. It would not look out of place in Strava or Pinterest.

The **inbound** half — what a stranger sees when they tap that link in Discord on a phone — is where
the funnel leaks, in three compounding ways:

1. **The link preview is text-only.** A fully-built, well-designed 1200×630 OG card exists at
   `src/app/s/[id]/opengraph-image.tsx` and is **dead code**: `generateMetadata` in `page.tsx` sets
   `openGraph.images: []` and `twitter.card: "summary"`, which override the file-convention image.
   Meanwhile `/api/team-graphic?style=wide` — a *different*, DB-direct, CDN-cached image generator —
   already works and is used only for oEmbed thumbnails, and oEmbed is itself undiscoverable.
2. **The first screen is a spinner, then a skeleton, then content.** `/s/[id]` server-renders a
   spinner and a client-side `router.replace()` to `/?s=<id>`, which boots a 1833-line client
   component, which fetches `/api/share/<id>`, which then `history.replaceState`s the URL back to
   `/s/<id>`. Three hops before the first pixel of actual team data.
3. **There is no low-commitment "save this."** The only conversion affordance for a logged-out
   viewer is "Duplicate", and `canSave` in `Navbar.tsx` is hard-gated on `isSignedIn` — a
   logged-out visitor sees no bookmark control at all, not even one that prompts signup.

There is **no signup wall**, which is the right call and is worth defending. The problem is not too
much friction; it's too little *pull*.

---

## 2. External pattern research

### 2.1 Strava — "the shared activity is the ad"

Strava's public-activity link is the closest analogue to a shared team report: a single artefact,
authored by one person, shared into a group chat, viewed mostly by people who don't have the app.

**First screen.** A logged-out visitor to a public activity gets the *actual activity* — map, distance,
pace, elevation, kudos count — server-rendered, immediately. Strava's privacy model gates this at the
*creator's* setting (Activities privacy → "Everyone" plus Profile Page Privacy → "Everyone" makes
activities visible while logged out), not at the *viewer's* auth state. Once the creator has opted in,
the viewer's experience is unauthenticated-first.
[Source](https://communityhub.strava.com/insider-journal-9/how-do-your-profile-and-activities-appear-when-logged-out-1525)

**Signup wall.** None on the artefact. Strava withholds *depth*, not the artefact: the full profile
requires an account ("to see the full profile, the viewer will need to be logged into a Strava
account"), as do social actions (kudos, comment, follow), segment leaderboards, and comparison views.
The pattern is **artefact free, social graph gated**.
[Source](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)

**Why it converts.** The signup ask is always attached to an action the visitor is already trying to
take — they tap "kudos" because they want to give kudos, and *that* raises the auth modal. Intent is
established before the ask. Contrast: a banner that says "sign up to save" before the visitor has
decided they want the thing.

**Embed.** Strava ships a first-party embed (`/articles/216918527`) for blogs and race reports, which
turns every embed into a branded impression. This project has `/embed/[id]` + `/api/oembed` built
and effectively unshipped (§3.4).

### 2.2 Pinterest — "Save" as the signup trigger

Pinterest is the canonical study for logged-out→signup on mobile web, and the numbers are public.

Pinterest's *old* mobile web converted **1% of unauthenticated users** into signups, logins, or app
installs. The rebuild (React/Redux/webpack PWA) targeted exactly this: a fast, fully-usable
logged-out experience with the signup ask deferred.
[Source](https://medium.com/dev-channel/a-pinterest-progressive-web-app-performance-case-study-3bd6ed2e6154)

Separately, adding Google One Tap produced a **47% increase in signups** on web and mobile web and a
**16% increase in sign-ins**, with new-account users **2× more likely** to use One Tap than a
multi-step option.
[Source](https://developers.google.com/identity/sign-in/case-studies/pinterest)

**The design lesson that transfers.** Pinterest's primary conversion verb is **Save**, not
**Duplicate** or **Sign up**. Save is:
- *reversible* — no consequence to the visitor;
- *selfish* — it's for them, not for the creator;
- *cheap* — one tap, no naming, no editing, no commitment;
- *and it requires an account* — so it is the auth trigger, but the auth modal appears **after** the
  tap, with the pin already visually "saved" behind it.

The Duplicate/Fork verb this product uses is Pinterest's *second*-tier action. It implies "I'm going
to edit this and make it mine", which is a much larger commitment than "I want to look at this again
later." Asking a first-time visitor to fork is asking them to become an author before they've become
a reader.

**Interstitial.** Pinterest does run a full-screen app-install interstitial on mobile web, but it is
dismissible and appears *after* the pin is rendered, not before. The pin is never hidden behind it.

### 2.3 Behance — attribution-first, gated depth

Behance projects are fully viewable logged-out: hero image, full project scroll, project description,
and — critically — a persistent, prominent **owner attribution block** (avatar, name, follow button)
that travels with the content. Appreciations, comments, following, and "Save to collection" all raise
auth.

**The lesson that transfers.** Behance makes the *author* a first-class part of the shared artefact,
above the fold, with a follow affordance. This matters enormously for a VGC audience, where the
social currency is "whose team is this" (a known player's name is the reason the link gets clicked).
This repo does have `CreatorLink.tsx` / `CreatorProfile.tsx` / `FollowButton.tsx` — the question is
whether the creator's identity is above the fold on a phone at first paint. Given the render path in
§3.2, at first paint nothing is.

### 2.4 Figma Community — "Open in browser" vs "Duplicate"

Figma Community files split the two verbs cleanly:
- **View/open** — anyone can look at the file page and preview.
- **Duplicate** — "You need a Figma account to duplicate Community files."
  [Source](https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files)

The friction Figma is *notorious* for is the one this project has correctly avoided: shared *design
file* links that force a login for logged-out viewers, which generates a steady stream of user
complaints
([1](https://forum.figma.com/ask-the-community-7/sharing-a-prototype-without-having-user-required-to-sign-in-to-figma-4274),
[2](https://forum.figma.com/report-a-problem-6/unlogged-viewers-get-error-you-don-t-have-access-to-this-file-48263)).
This is the cautionary half of the research: **do not add a signup wall to `/s/[id]`.** The forum
threads are a multi-year record of what that costs.

**What transfers.** Figma's Community file page puts the *duplicate count* and *like count* next to
the button. Social proof on the CTA ("Duplicated 240 times") converts materially better than a bare
verb, because it reframes duplication as normal behaviour rather than commitment. This repo already
tracks views (`/api/views/[shareId]`), reactions (`/api/reactions`), and forks (`forked_from_id`) —
the counts exist, they're just not on the CTA.

### 2.5 Spotify shareable cards — the image *is* the product

Spotify's share sheet generates a portrait card (album art, title, artist, scannable code) sized for
Instagram Stories, and hands it directly to the OS share sheet — the user never downloads a file and
re-uploads it.

This repo's `TeamCardCTA.tsx` builds exactly the right asset (1080×1920 "wrapped" style via
`/api/team-graphic?style=wrapped`) but ships it through the wrong pipe: it `fetch`es a blob, creates
an object URL, and triggers an `<a download>`. On mobile Safari and in-app browsers that either
silently fails, dumps the file into Files with no confirmation, or opens a blob view the user has to
long-press out of. The user then has to leave, find the file, open Instagram, and upload it. Spotify's
whole insight is that this multi-step handoff is where sharing dies.

The fix is `navigator.share({ files: [new File([blob], ...)] })` with the download as fallback —
`ShareModal.tsx:306` already proves the codebase knows the Web Share API. Files support (`canShare({files})`)
is available in Safari iOS 15+ and Chrome Android.

---

## 3. This repo's actual share flow (grounded read)

### 3.1 The outbound sheet — already strong, don't touch much

`/home/user/VGC-Team-Report/src/components/ui/ShareModal.tsx` (928 lines)

What it gets right, and what should be treated as the house standard:

| Line | Pattern |
|---|---|
| `320` | `flex items-end sm:items-center` — bottom sheet on mobile, centred dialog on desktop |
| `330` | `rounded-t-2xl sm:rounded-2xl`, `animate-[sheet-up_0.3s_ease-out]`, `max-h-[90vh]` |
| `331` | `paddingBottom: env(safe-area-inset-bottom)` — correct iOS home-indicator handling |
| `337` | Drag-handle affordance, `sm:hidden` |
| `334` | `aria-live="polite"` region announcing copy confirmations |
| `163–176` | Real focus trap with Tab cycling and Escape |
| `482–494` | Native `navigator.share()` promoted to **primary, full-width, first** on mobile |
| `500` | "Or share to:" demotes the per-network buttons below native share — correct hierarchy |
| `399–412` | Team-card preview rendered **first**, so the sharer sees what they're sending |
| `449–479` | Rental code surfaced above social actions — correct read of VGC-specific virality |
| `347–354`, `464–475` | `min-w-[44px] min-h-[44px]` throughout |

Two small gaps:
- **Drag handle is decorative.** There's a visual handle at `:337` but no drag-to-dismiss gesture.
  On iOS, users *will* try to swipe it down. `usePullToRefresh`/`useSwipeNavigation` hooks already
  exist in `src/hooks/` — the gesture vocabulary is in the codebase.
- **i18n holes.** `shareModalTitleViewer` and `shareModalSubtitleViewer` are empty strings in
  `src/lib/i18n/translations/es.ts:307,309` and `zh.ts:307,309`. A Spanish or Chinese viewer opening
  the reshare sheet gets a blank header. Spanish-speaking VGC (LATAM/Spain) is a large segment.

### 3.2 The inbound first screen — the core problem

**The render path a Discord tap actually takes on a phone:**

```
tap /s/abc12345
  → server: generateMetadata (2 parallel Neon queries)          [DB roundtrip]
  → server: SharePage (2 more parallel Neon queries for JSON-LD) [DB roundtrip]
  → HTML delivered = a spinner + sr-only <h1>                   ← FIRST PAINT
  → hydrate ShareRedirectClient
  → router.replace("/?s=abc12345")                              [client nav]
  → boot src/app/page.tsx (1833 lines, "use client", many dynamic imports)
  → useShareUrl: fetch("/api/share/abc12345")                   [3rd DB roundtrip]
  → render skeleton + "Loading shared team…"                    ← SECOND PAINT
  → history.replaceState(null, "", "/s/abc12345")               [URL restored]
  → render report                                               ← CONTENT
```

Files: `src/app/s/[id]/page.tsx:148–232`, `src/app/s/[id]/redirect.tsx:9–11`,
`src/hooks/useShareUrl.ts:184–214`, `src/app/page.tsx:846–909`.

Four separate problems fall out of this:

**(a) Four DB roundtrips for one page view.** `generateMetadata` runs two queries
(`page.tsx:25–28`), the page body runs two more (`page.tsx:166–169`) fetching *the same row*, then
the client fetches `/api/share/[id]`. Next.js dedupes `fetch` but not raw `sql` template calls.

**(b) Nothing meaningful is server-rendered.** The initial HTML contains a spinner and an `sr-only`
`<h1>`. On a cold Neon connection over mobile data, the visitor stares at a spinner, then a skeleton.
The comment at `useShareUrl.ts:163` is the tell: *"5s was too aggressive for Neon cold start + edge
miss on slow networks"* — the timeout was raised to **15 seconds**. A 15-second worst case before
the "corrupt link" error screen is a bounce, not an error state.

**(c) The redirect is architecturally unnecessary.** `/embed/[id]/page.tsx` already proves the right
pattern exists in this codebase — a server component that queries Neon directly, sets
`export const revalidate = 600`, and renders complete markup with sprites and team data. `/s/[id]`
could server-render the same above-the-fold block (title, placement, creator, six sprites, summary)
into the HTML and let the interactive report hydrate over it. The visitor would see the team
instantly; the redirect could stay as a progressive enhancement or be replaced by rendering
`HomeContent` in place.

**(d) SEO/crawl cost.** Crawlers see a spinner, a client redirect to `/?s=`, then a `replaceState`
back to `/s/`. Not my lane — flagging for R6 — but it's the same root cause.

### 3.3 The link preview — a good OG card exists and is disabled

`src/app/s/[id]/opengraph-image.tsx` is 174 lines of well-designed OG card: gradient background,
placement-coloured badge (gold/silver/bronze), creator byline, regulation tag, six sprites in
individual cards, domain watermark. **It never renders.**

`src/app/s/[id]/page.tsx:126–141`:
```ts
openGraph: { title, description, type: "website", siteName: "VGC Team Report", images: [] },
twitter:   { card: "summary", title, description, images: [] },
```

The comment at `page.tsx:110–121` explains the history honestly — two attempts, both produced
"image failed to load" unfurls, so the team fell back to text-only and used `images: []` explicitly
to block inheritance from the root `/opengraph-image.tsx`. That reasoning is sound *given what was
tried*. But the diagnosis stopped one step short.

**Why the previous attempts failed — the timing budget doesn't fit:**

Discord's unfurler allows roughly **5 seconds for the HTML fetch and 5 seconds for the image**;
og:image must be an absolute URL, ≥300px wide, reachable without login, and ideally under 2MB.
Dynamic OG generation on serverless cold start and large uncompressed images are the two named causes
of timeout failures, and the named fix is **caching generated OG images at the CDN edge**.
[Source](https://ogfixer.com/blog/og-image-not-showing-on-discord) ·
[Source](https://previewog.com/discord-link-preview/)

Now measure `opengraph-image.tsx` against that budget:

| Step | Cost |
|---|---|
| Edge function cold start | unbounded |
| `fetchShareData` → **self-`fetch` of `/api/share/{id}` on its own domain** (`:67–72`) | up to **4000ms** (own `AbortController` timeout) |
| 6× `fetchSprite` from `play.pokemonshowdown.com`, parallel (`:111–126`, `:138`) | up to **2500ms** |
| Satori render + PNG encode of 6 base64-inlined sprites | hundreds of ms |
| **Cache headers** | **none — no `revalidate`, no `Cache-Control`** |

Worst case ≈ 6.5s of self-imposed timeout on top of cold start, **on every single unfurl**, because
nothing is cached. That is the failure. It is not "unrealistic", as the comment concludes — it's a
fixable timing bug with three specific causes.

**And the replacement already exists and is already correct.** `src/app/api/team-graphic/route.tsx`:

- queries Neon **directly** (`:95–96`) — no self-HTTP hop;
- serves `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`
  (`:369`, `:522`) — exactly the CDN-edge caching the fix calls for;
- already supports `style=wide` (1200×400) and `style=wrapped` (1080×1920);
- is visually richer than the dead OG file (type badges, archetype/regulation tags, placement styling).

Two blockers before it can be pointed at `og:image`:

1. **`apiGuard(request, { rateLimit: { key: "graphic", max: 10 } })` at `:83`.** A rate-limited
   unfurler gets a JSON error body where a PNG should be — the exact "image failed to load"
   symptom already observed. Unfurler traffic arrives in bursts from shared IP ranges. Either exempt
   this route, key the limit on `shareId` rather than IP, or add a separate uncapped
   `/api/og/[id]` that reuses the same renderer.
2. **No visibility check.** `:96` selects `WHERE id = ... AND deleted_at IS NULL` — it does **not**
   check `is_public` / `is_unlisted`. `generateMetadata` in `page.tsx:35–37` is careful to withhold
   even the *title* of a private report; `/api/team-graphic` will render a private team's full
   six-Pokémon graphic to anyone who knows the 8-char ID. That is a genuine (if low-severity)
   inconsistency with the documented privacy model, independent of the OG question. Compare
   `/api/oembed/route.ts:23` and `/embed/[id]/page.tsx:13`, both of which correctly require
   `is_public = TRUE`.

**Also missing: `twitter:card` is `summary`, not `summary_large_image`.** Even once an image is
supplied, `summary` renders a small thumbnail. And there is no `og:image:width`/`height`, which
several unfurlers use to lay out before the image loads.

### 3.4 oEmbed is built and undiscoverable

`src/app/api/oembed/route.ts` is complete and correct: `is_public` gated, 1-hour CDN cache, returns
an iframe pointing at `/embed/{id}` plus a `thumbnail_url` of `/api/team-graphic?id=...&style=wide`.

A repo-wide grep for `oembed` outside that file returns **nothing**. There is no
`<link rel="alternate" type="application/json+oembed" href="...">` in `/s/[id]`'s `<head>`, and no
`other:` key in `generateMetadata`. **No consumer can ever discover this endpoint.** Discord, Slack,
Reddit, WordPress, Notion and Ghost all support oEmbed discovery — and it's a one-line addition to
the `metadata` object.

Note the irony: the oEmbed payload's `thumbnail_url` is the very team-graphic image that the
`og:image` refuses to use.

### 3.5 "Save this" — the missing verb

`src/components/layout/Navbar.tsx:217`:
```ts
const canSave = isSharedView && !isOwner && isSignedIn && !!activeShareId;
```

The save/bookmark control (`:760–781`) renders **only when signed in**, and even then it lives inside
the overflow `…` menu (`:630`), behind a tap, at `min-w-[240px]` in a dropdown.

So for the exact user this task is about — first-time, logged-out, on a phone — the save affordance
does not exist. Not greyed out, not prompting signup. Absent.

This inverts the Pinterest playbook. Pinterest's Save button is *always* visible to logged-out users;
tapping it is what raises the auth modal, with intent already established. Here, the only visible
conversion surface is `ShareViewCTA` and its only verb is **Duplicate** — Pinterest's second-tier,
high-commitment action — which asks a stranger to become an author before they've finished being a
reader.

Supporting detail: the comment at `Navbar.tsx:208–211` explains the save toggle was consolidated into
the overflow menu because a duplicate control was firing `/api/user/saved` twice. That was the right
bug fix; consolidating into the *overflow menu* rather than into a primary surface was the wrong
resting place.

### 3.6 `ShareViewCTA` — good component, wrong verb, lost intent

`src/components/ui/ShareViewCTA.tsx` is a clean Notion-style duplicate bar: fixed bottom, safe-area
aware, `max-w-5xl`, 44×44 dismiss, per-share dismissal persisted to `localStorage`
(`page.tsx:1655–1663`). Rendered at `page.tsx:1645` under
`isSharedView && !isEditingUnlocked && !isPresentationStyle && !shareCtaDismissed && !isOwner`.

Three issues:

**(a) Intent is dropped across the auth boundary.** `page.tsx:772–778`:
```ts
if (!isSignedIn) {
  posthog?.capture("fork_attempted_signed_out", { source_id: activeShareId });
  return;
}
```
with the comment *"After sign-in the user can click Fork again."* The Clerk modal opens (the button
is wrapped in `<SignInButton mode="modal">` at `ShareViewCTA.tsx:54`), the user signs up, lands back
— and must locate and re-tap Duplicate. Every product in §2 auto-completes the pending action after
auth. This is the single cheapest fix in the report: stash the pending fork intent (ref or
`sessionStorage`), and fire it in an effect when `isSignedIn` flips true. The effect at
`page.tsx:764` already depends on `isSignedIn`.

**(b) No social proof on the CTA.** Views, reactions and forks are all tracked
(`/api/views/[shareId]`, `/api/reactions/[shareId]`, `forked_from_id`). Figma Community puts these
counts on the button. "Duplicated 31 times" reframes the ask.

**(c) It competes for the same real estate as everything else.** It sits at
`bottom-[calc(3.5rem+env(safe-area-inset-bottom))]`, above a persistent navbar, on a phone that also
has browser chrome and (per `SwipeHint.tsx`, `ShortcutHintOverlay.tsx`, `InstallPrompt.tsx`,
`WalkthroughOverlay.tsx`, `CookieBanner.tsx`) up to five other overlay candidates. For a first-time
visitor, several of these can be eligible at once. Nothing in the code arbitrates priority between
them. Worth an explicit "one overlay at a time, and on a first `/s/` visit that overlay is the CTA"
rule.

### 3.7 The Instagram-story card takes the download path, not the share path

`src/components/report/TeamCardCTA.tsx:22–44` — `fetch` → `blob` → `URL.createObjectURL` →
synthetic `<a download>` → `.click()`. On iOS Safari and Discord/Twitter in-app browsers this is the
weakest link in the chain (see §2.5). `alert()` on failure (`:40`) is also the only non-toast error
surface in the share flow.

The asset is right (1080×1920, `style=wrapped`, CDN-cached). The delivery is wrong.

### 3.8 Where a signup wall does and doesn't appear — current state

For the record, since the task asks specifically:

| Surface | Logged-out behaviour | Verdict |
|---|---|---|
| `/s/[id]` public/unlisted report | Fully viewable, no wall | ✅ correct — keep |
| Report depth (all slides, calcs, matchups) | Fully viewable | ✅ correct |
| Reshare (`onViewerShare`, `Navbar.tsx:542`) | Available to logged-out viewers | ✅ excellent — viral loop is open |
| Duplicate / fork | Clerk modal, intent then lost | ⚠️ right gate, broken continuation |
| Save / bookmark | **Control not rendered at all** | ❌ biggest gap |
| Comment / react | Auth-gated (`page.tsx:1379–1416`) | ✅ correct — Strava's model |
| Legacy `?key=` edit link | Sign-in explanation screen (`page.tsx:814–832`) | ✅ correct |

There is no wall to remove. The work is adding *pull*, not removing friction.

---

## 4. What NOT to do

Explicitly, because these are the tempting moves:

- **Do not add a signup wall or a "sign up to see the rest" gate to `/s/[id]`.** The Figma forum
  threads in §2.4 are a multi-year record of what this costs a link-shared product. The current
  no-wall posture is a genuine competitive advantage over tools that require accounts.
- **Do not add an app-install / PWA interstitial before first paint.** `InstallPrompt.tsx` already
  gates on an engagement timer (`:53`) and a dismissal key — keep it that way, and add `/s/` first
  visit to its suppression conditions.
- **Do not add DB writes for view-tracking granularity.** Per `CLAUDE.md`, Neon is on the 512MB free
  tier and `share_versions` snapshots already cost 447MB once. Funnel instrumentation belongs in
  PostHog, not Postgres.

---

## 5. File-level recommendations

Concrete, grouped by file. Read-only run — nothing below has been applied.

**`src/app/s/[id]/page.tsx`**
- `:126–141` — replace `images: []` with the team-graphic URL; switch `twitter.card` to
  `summary_large_image`; add `og:image:width` / `og:image:height`. Update the `:110–121` comment
  block to record the actual root cause (self-fetch + uncached + 6.5s timeout budget vs Discord's 5s)
  rather than "unrealistic for now".
- Add `other: { "application/json+oembed": "https://pokemonvgcteamreport.com/api/oembed?url=..." }`
  to the returned metadata so `/api/oembed` becomes reachable.
- `:25–28` + `:166–169` — collapse four Neon queries into one shared fetch (a `cache()`-wrapped
  loader consumed by both `generateMetadata` and the page body).
- `:224–231` — server-render an above-the-fold block (title, placement badge, creator, six sprites,
  summary) instead of returning only `<ShareRedirectClient>`. `/embed/[id]/page.tsx` is the working
  template for exactly this, `revalidate` included.

**`src/app/s/[id]/opengraph-image.tsx`**
- Either delete it (dead code — `images: []` overrides it) or repair and re-enable it: replace
  `fetchShareData`'s self-`fetch` (`:67–72`) with a direct `getDb()` query as
  `/api/team-graphic/route.tsx:95` does, drop `runtime = "edge"` if the Neon driver requires it,
  add `export const revalidate`, and cut the 4000ms + 2500ms timeouts to fit inside 5s.
  Recommendation: **delete, and point `og:image` at `/api/team-graphic`** — one renderer, already
  cached, visually better. Two OG generators is the reason this got confusing.

**`src/app/api/team-graphic/route.tsx`**
- `:83` — the `max: 10` rate limit will break unfurls. Exempt, re-key on `shareId`, or split an
  uncapped `/api/og/[id]` off the same renderer.
- `:96` — add `is_public`/`is_unlisted` gating to match `/api/oembed/route.ts:23` and
  `/embed/[id]/page.tsx:13`. Private team graphics are currently generatable by ID.

**`src/components/layout/Navbar.tsx`**
- `:217` — drop `isSignedIn` from `canSave`; render the control for everyone and have the logged-out
  path open the Clerk modal (Pinterest's model), then complete the save post-auth.
- `:760` — promote save out of the overflow menu to a primary, always-visible control on
  `isSharedView`. It is the lowest-commitment conversion verb available and it is currently the
  most buried.

**`src/app/page.tsx`**
- `:772–778` — persist pending fork intent across the Clerk auth boundary and auto-complete it when
  `isSignedIn` flips. Same for a new pending-save intent.
- `:1645` — add a view/fork count to the `ShareViewCTA` props for social proof.
- `:846–909` — once `/s/[id]` server-renders content, this skeleton path becomes the fallback rather
  than the default.

**`src/components/ui/ShareViewCTA.tsx`**
- `:36–41` — reconsider the verb. Lead with the low-commitment action ("Save") and demote Duplicate
  to secondary; surface a count.
- `:44–63` — surface fork errors inline; `forkStatus === "error"` currently resolves to a silent
  3-second reset (`page.tsx:786–788`).

**`src/components/report/TeamCardCTA.tsx`**
- `:22–44` — try `navigator.share({ files: [...] })` when `navigator.canShare({ files })` is true,
  falling back to the current download. `ShareModal.tsx:306–316` is the reference implementation.
- `:40` — replace `alert()` with the app's inline error pattern.

**`src/components/ui/ShareModal.tsx`**
- `:337` — wire the drag handle to a real dismiss gesture (`useSwipeNavigation` / `usePullToRefresh`
  already exist in `src/hooks/`).

**`src/lib/i18n/translations/es.ts:307,309` and `zh.ts:307,309`**
- `shareModalTitleViewer` / `shareModalSubtitleViewer` are empty strings — blank sheet header for
  ES/ZH viewers.

**Overlay arbitration (cross-file)**
- `ShareViewCTA`, `InstallPrompt`, `SwipeHint`, `ShortcutHintOverlay`, `WalkthroughOverlay`,
  `CookieBanner` can all be eligible simultaneously on a first `/s/` visit. No priority arbiter
  exists. Establish one; on a first shared-report visit the CTA wins and the rest are suppressed.

---

## 6. Five opportunities, ranked by impact × ease

Ranked by expected conversion impact divided by effort. Effort: **S** ≤ half a day, **M** ~1–2 days,
**L** ~3+ days.

---

### 1. Ship a real link preview — point `og:image` at `/api/team-graphic` + enable oEmbed discovery
**Impact: very high · Ease: high · Effort: S**

Every share of this product currently unfurls in Discord — the primary VGC distribution channel — as
a text-only card. The card that should be there is already built, already CDN-cached
(`s-maxage=86400`), already DB-direct, and already prettier than the dead `opengraph-image.tsx`.

This is the highest-leverage change in the report because it operates *before* the click: it raises
the click-through rate on every link already being shared, rather than converting the visitors who
already arrived.

- Swap `images: []` → team-graphic URL and `twitter.card` → `summary_large_image`
  (`s/[id]/page.tsx:126–141`).
- Fix the two blockers: rate limit (`team-graphic/route.tsx:83`) and `is_public` gating (`:96`).
- Add the `application/json+oembed` discovery link — one line, unlocks a fully-built endpoint.
- Delete `s/[id]/opengraph-image.tsx` so there's one OG renderer, not two.
- Verify with Discord's embed debugger and Twitter's card validator. **Budget: <5s total.**

Why this succeeds where two prior attempts failed: both previous attempts used a renderer that
self-`fetch`ed its own API with a 4s timeout, fetched six external sprites with a 2.5s timeout, and
set no cache headers. `/api/team-graphic` does none of those things.

---

### 2. Add "Save" as the logged-out conversion verb
**Impact: high · Ease: high · Effort: S–M**

Pinterest's entire logged-out→signup funnel runs on Save, and their rebuild was motivated by a 1%
conversion baseline. This product currently shows a logged-out visitor **no save control at all**
(`Navbar.tsx:217`), and its only conversion verb is Duplicate — a much larger commitment.

- Drop `isSignedIn` from `canSave`; logged-out tap opens Clerk.
- Promote the control out of the overflow menu to a primary shared-view surface.
- Complete the pending save automatically after auth.
- Optimistic UI is already implemented (`Navbar.tsx:239–258`) — reuse it.

**S** for the gate + promotion; **M** if bundled with post-auth intent restoration (which
Opportunity 3 needs anyway, so bundle them).

---

### 3. Preserve intent across the auth boundary
**Impact: high · Ease: high · Effort: S**

`page.tsx:772–778` explicitly abandons the fork when a signed-out user taps Duplicate — *"After
sign-in the user can click Fork again."* Every product studied in §2 auto-completes the pending
action post-auth. Someone who signed up *specifically to duplicate this team* is the highest-intent
visitor the funnel will ever see, and they're dropped at the finish line.

Stash pending intent (`useRef` or `sessionStorage` keyed on share ID); fire it in an effect on the
`isSignedIn` transition. The effect at `page.tsx:764` already has the dependency.

Smallest change in the report, on the highest-intent cohort.

---

### 4. Server-render the shared report's above-the-fold
**Impact: very high · Ease: low · Effort: L**

The largest *absolute* impact and the largest effort — hence rank 4, not 1. Today a Discord tap
yields spinner → skeleton → content, across three navigations, four DB roundtrips, and a client
bundle boot, with a 15s failure timeout that `useShareUrl.ts:163` documents as *necessary* for Neon
cold starts on mobile networks. On the median VGC-Discord phone, this is where arrivals are lost.

- Render title, placement badge, creator, six sprites and summary server-side in `s/[id]/page.tsx`;
  hydrate the interactive report over it. `/embed/[id]/page.tsx` is the working template.
- Collapse the four Neon queries into one `cache()`d loader.
- Remove or demote `ShareRedirectClient` to a fallback.

Do this only after 1–3, which are cheap and independent. It touches the app's most complex file
(`page.tsx`, 1833 lines) and shifts a client-rendered path to server-rendered — per `CLAUDE.md` this
is a feature-branch-sized change, and it needs Cypress coverage on the `/s/` path before starting.

---

### 5. Instrument the share→view funnel (and share the card via the OS share sheet)
**Impact: medium (compounding) · Ease: high · Effort: S**

**This report could not answer its own core question** — where logged-out `/s/` arrivals actually
drop — because no PostHog access exists this run *and* because the events needed may not exist. What
does exist is scattered and outbound-biased: `share_native_used` (`ShareModal.tsx:312`),
`share_twitter_clicked` (`:508`), `team_card_download_clicked` (`TeamCardCTA.tsx:25`),
`share_view_duplicate_anonymous` (`page.tsx:1652`), `fork_attempted_signed_out` (`page.tsx:776`),
`report_fork_clicked` (`page.tsx:779`).

The inbound funnel needs: `share_view_started` → `share_view_content_painted` (with elapsed ms) →
`share_view_scrolled` → `share_view_cta_seen` → action. Without `content_painted`, Opportunity 4
cannot be justified or measured, and nobody can tell a slow report from an abandoned one.

Bundle the §3.7 fix here since it's the same area and the same size: make `TeamCardCTA` use
`navigator.share({ files })` when available, falling back to download. It converts the
Spotify-style asset from a five-step file-management chore into one tap into Instagram Stories.

Keep all of this in PostHog. No new Postgres writes (`CLAUDE.md`: 512MB free tier, `share_versions`
already cost 447MB).

---

## Sources

- [Strava — How Do Your Profile and Activities Appear When Logged Out?](https://communityhub.strava.com/insider-journal-9/how-do-your-profile-and-activities-appear-when-logged-out-1525)
- [Strava — Sharing Your Strava Activities](https://support.strava.com/hc/en-us/articles/221089587-Sharing-Your-Strava-Activities)
- [Strava — Sharing Your Activities and Routes With a Strava Embed](https://support.strava.com/hc/en-us/articles/216918527-Sharing-Your-Activities-and-Routes-With-a-Strava-Embed)
- [Addy Osmani — A Pinterest Progressive Web App Performance Case Study](https://medium.com/dev-channel/a-pinterest-progressive-web-app-performance-case-study-3bd6ed2e6154)
- [Google Identity — Pinterest case study (One Tap)](https://developers.google.com/identity/sign-in/case-studies/pinterest)
- [Figma — Duplicate Community files](https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files)
- [Figma Forum — Sharing a prototype without requiring sign-in](https://forum.figma.com/ask-the-community-7/sharing-a-prototype-without-having-user-required-to-sign-in-to-figma-4274)
- [Figma Forum — Unlogged viewers get "you don't have access to this file"](https://forum.figma.com/report-a-problem-6/unlogged-viewers-get-error-you-don-t-have-access-to-this-file-48263)
- [OG Fixer — OG Image Not Showing on Discord? 7 Fixes That Work](https://ogfixer.com/blog/og-image-not-showing-on-discord)
- [PreviewOG — Discord Link Preview: How Embeds Work & Troubleshooting](https://previewog.com/discord-link-preview/)
- [DEV — URL Unfurling: How Slack, Discord and Twitter Generate Link Previews](https://dev.to/eatyou_eatyou_d79d27e5622/url-unfurling-how-slack-discord-and-twitter-generate-link-previews-5hgb)
