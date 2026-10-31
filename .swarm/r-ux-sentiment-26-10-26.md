# R-UX — User Research & Share-to-View UX
**Date:** 2026-10-26 · **Agent:** R-UX (overnight swarm) · **Mode:** READ-ONLY on repo

---

## Confidence key

| Label | Meaning |
|---|---|
| **CERTAIN** | Read directly from this repo's source. Verifiable by opening the named file. |
| **HIGH** | Code-grounded inference: the mechanism follows necessarily from code I read, though I could not observe it running. |
| **MEDIUM** | Corroborated across two or more independent collection passes (e.g. my WebSearch *and* an earlier swarm run that collected separately). |
| **LOW** | Single-source, or vendor self-description, or a general design pattern I reasoned to rather than observed. Treat as a hypothesis to test. |
| **UNVERIFIED** | Named here only so it is not silently dropped. No evidence gathered this run. |

**I have invented no quotes, usernames or statistics in this document.** Where I had no source, the section says so.

---

## Instrument failures this run (read before trusting any web claim)

**WebFetch is entirely non-functional in this container — not domain-specific.** Every call fails at DNS
(`getaddrinfo ENOTFOUND`), including a control call to `example.com`. So the blocklist in my brief
understates the problem: I could not fetch *any* page, could not verify a single search snippet
against its source, and could not read the competitor tools that search surfaced.

- `example.com` — ENOTFOUND (control; proves DNS, not policy, is the failure)
- `devoncorp.press` — ENOTFOUND
- `draftcentral.gg` — ENOTFOUND
- `chromewebstore.google.com` — ENOTFOUND
- **`pokemonvgcteamreport.com` — 403 on CONNECT via the proxy.** Our own production site is blocked,
  so I could not curl the rendered `<head>` of a live `/s/<id>` to confirm what unfurlers actually see.
- Per brief, presumed unreachable and **not attempted**: reddit.com, twitter/x.com, pikalytics.com,
  victoryroad.pro, rk9.gg, bulbagarden, wikipedia, Limitless domains.

**WebSearch worked** but, as prior runs warned, it is weak for sentiment. It returned substantially
off-topic results for 4 of 8 queries (one "r/VGC complaints" query returned eBay TCG listings and
Pokémon Rumble). It is usable for *existence of artifacts* and *vendor positioning*; it is not usable
for "what players complain about". I have not dressed up its silence as a finding.

**PostHog credentials are absent from this container.** The rage-click / funnel-dropoff
cross-reference this role normally performs **was not possible**. I have no behavioural data on real
users: no drop-off rates, no share-link open counts, no time-on-`/s/`, no rage clicks. Every claim
below about user behaviour is a mechanism argument from code, not an observation. If any single
recommendation here deserves instrumentation before a build, it is #1 — and the instrumentation
already exists in the codebase (`share_view` tracking at `HomePageClient.tsx:653-666`,
`share_view_duplicate_anonymous` at `:1667`), it just needs credentials to read.

**No outbound sending occurred.** No post, DM, email or form submission. The only community-facing
copy I produced is in `.swarm/drafts/r-ux-community-posts.md`, marked DRAFT — NOT POSTED.

---

# Strand 1 — Community sentiment

## What I could and could not establish

I could **not** establish sentiment this run. r/VGC, r/stunfisk and Twitter/X were unreachable by
policy; WebSearch could not substitute. **I am not reporting themes as if I had observed them.**

What I *did* get was structural: multiple independent community style guides that reveal, by what they
ask contributors to supply, where the paste-only workflow falls short.

## 1.1 The paste is structurally insufficient, and communities patch it with prose rules — MEDIUM

Three independently-run community guides surfaced in search all require, in their *posting rules*,
exactly the material a Showdown paste cannot carry:

- A **Pokémon Champions VGC** posting guide asks that non-standard spreads be explained — "if your EV
  spreads are not simple 252 / 252 spreads, please explain any important reasoning", adding "you do
  not need to write a full essay, but relevant context helps people give better advice". It also lists
  wanted details: speed benchmarks, relevant EV tweaks, what the team is trying to do, and the
  matchups you're struggling with.
- A **PokeBeach** RMT rules thread recommends a short opening paragraph on game plan and core, then a
  few lines per Pokémon covering moves, EVs/nature, item and strategy.
- A **Nugget Bridge** tournament team report shows the long-form shape: author background → how the
  team came together → event-by-event performance, with per-member spreads and reasoning.

**Why this matters more than a complaint thread would.** These are *rules*, not grumbles. A community
only writes a rule when the default artifact keeps failing. The rules converge on a fixed anatomy:
**game plan → per-Pokémon (item/nature/EVs/moves/role) → speed benchmarks → bad matchups → results.**
That is a schema, and this product already implements nearly all of it (`TeamOverview.tsx`,
`PokemonDetailSlide.tsx`, `SpeedTierChart.tsx`, `MatchupPlanSlide.tsx`, `CommonModesSlide.tsx`,
plus `tournamentName`/`placement`/`record` fields). The product's thesis is corroborated. **Confidence
MEDIUM** — three separate sources agreeing on the anatomy; but each reached me only as a search
snippet I could not open, and none is a sentiment measurement.

## 1.2 Competitors now advertise exactly the two things our share route disables — MEDIUM

Search surfaced **crob.at**, positioning itself as "Best PokePaste Alternative: Visual Team Sharing",
with three headline selling points: **visual sprites, social previews, and no login required**.

This is vendor self-description and I could not open the site (ENOTFOUND), so as a product claim it is
**LOW**. But it rises to **MEDIUM** on one specific point: crob.at was *also* independently flagged by
the May 2026 swarm run (`.swarm/r3-community-sentiment-20-05-26.md` §4, "crob.at — Visual Paste Layer
Growing Fast"). Two separate collection passes, five months apart, independently surfaced the same
competitor growing in the same niche. That is real signal.

The strategic sting: **"social previews" and "no login required" are the two things this codebase
deliberately turns off on share links** (see Findings 3.2 and 3.4). A competitor is selling our two
self-imposed gaps as features.

Also surfaced, single-source each (**LOW**): **VR Pastes** offers password-protected pastes and public
Open Team Lists that hide EVs/IVs — which validates this repo's existing tiered-publishing redaction
(`src/lib/sharing/redact-paste.ts`, `privateFields`); and **Pikalytics' team builder** offers "export a
team image", another instance of the shareable-artifact pattern.

## 1.3 The "show it to an audience" artifact is a real, contested category — MEDIUM

Independent of each other, search surfaced three tools whose entire purpose is turning a team into a
*displayable* object rather than a readable one:

- **VGC OTS** (Chrome extension, listed version 1.2.6, updated 1 June 2026) keeps the Open Team Sheet
  panel visible above the Showdown chat log. A sibling fork `robsonbittencourt/vgc-ots` exists on GitHub.
- **DraftCentral's team sheet generator** takes a PokéPaste link or Showdown text and outputs a
  tournament team list, a **broadcast graphic**, or a multilingual open team sheet.
- **Pokepaste Exporter** (Chrome extension) adds a button to Showdown and Limitless to view an
  opponent's open team sheet, substituting HOME sprites.

Three tools, three authors, one shared need: *make the team legible to a viewer who is not me.* The
broadcast-graphic output in particular is a creator-facing artifact. **MEDIUM** — multiple independent
artifacts corroborate the category exists; versions/dates are single-source listings I could not open.

## 1.4 Prior-run themes — UNVERIFIED this run, listed so they are not lost

`.swarm/r3-community-sentiment-20-05-26.md` (May 2026) claims five unmet needs: a unified searchable
report archive; a context layer over raw pastes; **rental code + paste + report in one share link**;
replay/performance tracking; mobile-optimised building and sharing. It also claims PokePaste is
under-maintained and that the OTS process has friction at tournaments.

I **could not re-verify any of this** and I am not adopting it as evidence. I flag only that #3
(rental code + paste + report in one link) is cheap to check against our own schema: `rentalCode` is
already a first-class field in `useTeamMeta` (`useHomePage.ts:~128`), so if that need is real the
feature is mostly built and the gap is presentation. Worth one PostHog query when credentials exist.

---

# Strand 2 — Content-creator sentiment

## Honest answer: I have no creator sentiment data, and I will not manufacture it.

My brief asked what Wolfey, Cybertron, James Baek "and that tier" say about team-sharing tools. I
could not find out. Twitter/X is blocked by policy. YouTube transcripts were not reachable. WebSearch
for creator commentary returned, for the Wolfey query, a corporate "Unleash the Wolfpack: Building
High-Performing Agile Teams" page, a Myers-Briggs team-report webinar, and a Yale engineering PDF — a
clean demonstration of the self-contradiction problem the brief warned about. The only on-topic hit was
a Wikipedia entry (blocked domain, not fetched) confirming Wolfe Glick is a competitive player,
streamer and YouTuber known as WolfeyVGC.

**There is no quote, paraphrase or attributed opinion from any named creator in this report.** Anyone
reading this looking for "what Wolfey wants" should treat the question as open.

## 2.1 What can be argued structurally — LOW, reasoning not evidence

The one defensible inference comes from Strand 1.3 rather than from creators themselves. The tools
being built in this space split cleanly in two:

- **Tools for the player:** paste hosting, hover-preview, OTS import for match prep. Optimised for
  *reading density* — get the information into one brain fast.
- **Tools for an audience:** broadcast graphics, multilingual team sheets, an OTS panel pinned above
  chat so *viewers* can see it. Optimised for *display legibility* — one glance, at a distance, often
  at small size.

A tool becomes stream-showable when it survives the second set of constraints: readable when scaled
into a corner of a 1080p canvas, no sign-in interstitial on camera, no spinner during dead air, and
one keypress per beat of narration. This product has the raw material for that (`presentationMode`,
`SlideNavControls.tsx`, `TournamentMode.tsx`, `/api/team-graphic` at 1080×1920) — notably more than any
tool search surfaced. **But this paragraph is design reasoning, not creator research.** Labelled LOW
deliberately. Do not cite it to a stakeholder as "what creators said".

## 2.2 The gap worth naming anyway — LOW

The "tool for me" vs "artifact I can show an audience" split maps onto a concrete asymmetry already in
the code, and this one *is* CERTAIN as code: the product's single most audience-shaped asset — the
1080×1920 Wrapped-style card from `/api/team-graphic?style=wrapped` — is reachable **only** by a
viewer who taps "Download card" in `TeamCardCTA.tsx`, which triggers a **file download**
(`a.download = ...`), not a share. A creator cannot link it, an unfurler never sees it, and on mobile
it lands in the camera roll and dies there. The best artifact in the product is the least shareable
thing in it. See recommendation #3.

---

# Strand 3 — Share-to-view, grounded in our code

This is my highest-confidence material. Everything in this section cites a file I read.

## 3.1 CERTAIN — `/s/<id>` serves no report content. It is a client-side redirect to the homepage.

`src/app/s/[id]/page.tsx` does real server work — it queries Neon, builds the title, description and
JSON-LD — and then renders exactly this (`page.tsx:230-236`):

```tsx
<ShareRedirectClient to={`/${qs}`} heading={heading} />   // qs === `?s=<id>`
```

`src/app/s/[id]/redirect.tsx` is a `"use client"` component whose entire body is a spinner plus an
`sr-only` h1, and an effect that fires `router.replace("/?s=<id>")`.

So a recipient's cold mobile open is: **HTML (spinner only) → download + hydrate the React bundle →
client-side route change to `/` → mount `HomePageClient` (1,849 lines) and `useHomePage` (934 lines) →
`fetch("/api/share/<id>")` → Neon query → render.** Then `useShareUrl.ts` calls
`history.replaceState(null, "", "/s/<id>")` to put the clean URL back.

Four consequences, all following necessarily from the above (**HIGH**):

1. **Time-to-value is bounded below by a full bundle download plus a cold DB round trip.** The
   codebase states its own worst case: `useShareUrl.ts` sets the share-fetch abort at **15 seconds**,
   with the comment *"5s was too aggressive for Neon cold start + edge miss on slow networks"*. A
   recipient on a tournament-venue 4G connection can watch a spinner for many seconds. The share page
   never streams a single Pokémon name.
2. **Zero server-rendered content** for crawlers, LLM retrievers, or any client that doesn't run JS —
   on a route whose own `generateMetadata` sets `alternates.canonical` and emits CreativeWork JSON-LD.
   The SEO scaffolding is immaculate around an empty room.
3. **`loading.tsx` is wasted.** There is a genuinely good 80-line skeleton at
   `src/app/s/[id]/loading.tsx` — team header, six sprite circles, six stat-bar cards. It flashes
   during the server await and is then **replaced by the worse, contentless spinner** in
   `redirect.tsx`. The product already has the right loading UI and throws it away.
4. **Re-sharing is poisoned for a window.** Between `router.replace("/?s=<id>")` and
   `history.replaceState(..., "/s/<id>")`, the address bar reads `/?s=<id>`. A recipient who copies
   the URL to pass along mid-window shares a homepage query string. The viral path — the single most
   valuable action a recipient can take — depends on a race.

## 3.2 CERTAIN — Share links are deliberately downgraded to a text-only unfurl, and a finished OG card sits unused in the repo.

`src/app/s/[id]/opengraph-image.tsx` is **174 lines of working, finished code**: fetches the share,
extracts species, fetches all six sprites in parallel with a 2.5s timeout each and a Pokéball
data-URI fallback, renders placement-coloured badges (gold/silver/bronze), creator byline, record,
regulation pill, and a six-sprite row — plus a branded `FallbackCard()` for the no-data case.

`generateMetadata` in the same directory then blocks it (`page.tsx:116-145`):

```tsx
openGraph: { ..., images: [] },
twitter:   { card: "summary", ..., images: [] },
```

The accompanying comment is explicit and should be respected as hard-won: the team tried this twice
(the convention file, then `/api/team-graphic` wired into `og:image`) and both produced "image failed
to load" unfurls in Discord; `images: []` is called "load-bearing" to stop inheritance from the root
`/opengraph-image.tsx`.

**I am not claiming they were wrong about what they observed.** I am claiming the diagnosis —
"a reliably-rendering OG card is unrealistic for now" — is contradicted by three facts in this same
repo (**HIGH**):

- **The identical stack already works for a user-initiated render.** `/api/team-graphic/route.tsx` is
  `runtime = "edge"`, fetches the same Showdown sprite CDN, and renders 1080×1920 — and it ships
  `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800`
  (`route.tsx:369` and `:522`). The share OG route has **no cache headers at all** and fetches its
  own API with `cache: "no-store"`. The difference between the two is not feasibility, it is caching.
  Every unfurl currently pays full cold cost: a self-referential HTTP hop to `/api/share/<id>`
  (4s budget) plus six sprite fetches (2.5s each). Against a ~5s unfurler budget that is the whole
  failure, and it is a caching bug wearing a feasibility costume.
- **A static fallback already exists and already passes unfurlers.** `public/og-default.png` (3.1 KB)
  is referenced by the root layout. Even pointing share links at a static branded PNG with
  `summary_large_image` would strictly beat today's text-only card at near-zero risk.
- **The root page gets the big card; share pages get the small one.** `src/app/layout.tsx:53` sets
  `twitter: { card: "summary_large_image" }` with two images. The share route overrides to
  `card: "summary"`. For a product whose growth loop *is* the share link, this is backwards: the page
  nobody links gets the rich card, and the page everybody links gets four lines of grey text.

Supporting detail, **MEDIUM** (third-party guides agreeing, primary docs unreachable): 1200×630 is the
right size and matches the existing file; Discord renders embeds at roughly **400px wide on desktop**,
so a six-sprite row at 1200px will be near-illegible and the card should lead with large type and
fewer elements; declaring `og:image:width`/`og:image:height` lets Discord lay out without fetching the
image first. Guides disagree on the file-size cap (8 MB vs 5 MB) — treat sub-1 MB as the target and the
caps as unverified.

## 3.3 CERTAIN — `/api/oembed` is live, correct, and undiscoverable.

`src/app/api/oembed/route.ts` validates the URL, queries for public shares only, and returns a proper
oEmbed `rich` payload pointing at `/embed/<id>`. **Nothing links to it.** A grep for `json+oembed`
across `src/app` returns zero hits, and `layout.tsx` has no `other` entry for it. Without
`<link rel="alternate" type="application/json+oembed" href="...">` in the document head, no consumer
will ever ask. Two endpoints (`/api/oembed`, `/embed/[id]`, the latter correctly cached with
`revalidate = 600`) are built, maintained, and dead. Note that Discord unfurls via Open Graph rather
than oEmbed, so this fixes Notion/WordPress/Slack-class embeds, not Discord — real, but narrower than #2.

## 3.4 CERTAIN — On mobile, the only CTA shown to a recipient is the one that requires an account.

Two CTAs exist for a read-only viewer:

- `src/components/layout/Navbar.tsx:597` — **"Build Your Own"**, a plain `<a href="/">`. Needs no
  account. Class list: `hidden sm:inline-flex`. **Hidden on mobile**, with the comment "hidden on
  mobile, ShareViewCTA handles it".
- `src/components/ui/ShareViewCTA.tsx` — **"Duplicate it to your account"**, pinned bottom, rendered
  from `HomePageClient.tsx:1661`. For a signed-out viewer the button is wrapped in Clerk's
  `<SignInButton mode="modal">`.

So the mobile recipient — the majority case for a link pasted into a Discord channel — is offered
exactly one action, and it opens an auth modal. The free, instant, no-account path to the product's
actual value (paste your own team, get a report) is invisible on the device most recipients are using.

This also mismatches the ask to the moment. "Duplicate *this* team to your account" asks a stranger to
take custody of someone else's team seconds after arriving. It is Notion's pattern, where duplicating
a template *is* the value. Here the value is "a report like this, about *my* team" — and that is
precisely what the hidden CTA offers.

Worth stating clearly, because it changes the shape of the fix: **publishing genuinely does require
auth** and that is correct and deliberate — `src/app/api/share/route.ts:124-133` returns 401 for all
writes, with a sound comment about edit tokens not granting mutation rights. The wall is in the right
place. The problem is not the wall; it is that the wall is the *first* thing a mobile recipient is
shown, and the free path behind it is hidden. Build-and-view is anonymous; only publish is gated.

## 3.5 CERTAIN — The anonymous and authenticated paths have their strengths exactly swapped.

`src/app/q/[id]/page.tsx` (guest quick-share, 30-day TTL) is a **fully server-rendered** page: it
parses the paste on the server and renders sprite cards immediately, no spinner, no hydration wait.
But it is `robots: { index: false }`, has no OG image, and shows only a paste dump per Pokémon — no
speed tiers, no calcs, no matchup plan.

Meanwhile `/s/<id>` holds the entire analysis and renders a spinner.

**The path with nothing to show renders instantly; the path with everything to show renders last.**
Fixing #1 largely collapses this asymmetry.

## 3.6 CERTAIN — The Wrapped card is downloaded, never shared.

`src/components/ui/ShareModal.tsx:311` is the only `navigator.share` call in the codebase, and it
passes `{ title, url }` — link only, no `files`. `TeamCardCTA.tsx` builds a blob from
`/api/team-graphic?style=wrapped` and forces `a.download`. On iOS Safari that is a trip to Files or
Photos and a context switch; the Instagram-story hand-off that the card's 1080×1920 aspect ratio was
explicitly designed for never happens.

Corroborated mechanics for the fix (**MEDIUM**, web.dev and a hands-on write-up agreeing): gate on
`navigator.canShare({ files })` rather than `navigator.share`; requires HTTPS; keep the current
download as the fallback path; swallow `AbortError` so a dismissed sheet isn't logged as failure;
file-share support lands around Chrome 128 / Safari 12.1 with Firefox behind a flag; share targets are
inconsistent about which payload parts they accept, so the card must stand alone if only the image
arrives.

## 3.7 Pattern mapping — LOW on the external products, CERTAIN on our side

I could not verify any of these products' *current* implementations this run (all blocked or
ENOTFOUND), and the May run's descriptions of them are prior-art I did not re-verify. So the left
column is a design pattern, not a measurement. The right column is code.

| Pattern | Our state |
|---|---|
| **Value before the wall** — recipient sees the full artifact un-gated; the ask arrives after engagement | Inverted on mobile: the auth ask (`ShareViewCTA`) is the only CTA; the free path (`Navbar.tsx:597`) is `hidden sm:inline-flex` |
| **The preview tells the story before the click** — a rich card carrying the actual content | Disabled: `twitter: { card: "summary" }`, `images: []`; a finished card sits unused at `s/[id]/opengraph-image.tsx` |
| **Fast cold open** — server-rendered content on first paint | Absent: `/s/<id>` is a client redirect; a good skeleton (`loading.tsx`) is discarded for a spinner |
| **"I could have this for mine"** — the aspirational ask, not a custody transfer | Mismatched: "Duplicate it to your account" rather than "Make one for your team" |
| **The content is the advertisement** — an exportable visual artifact | Built but trapped: 1080×1920 Wrapped card is download-only (`TeamCardCTA.tsx`) |
| **Native share sheet as primary action** | Partial: `ShareModal.tsx:311` shares the link; never the image |

---

# RANKED: the 5 highest-leverage UX changes

Ranked by (recipient impact × confidence) ÷ build size. Sizes are rough and assume the existing
pre-commit gate (tsc + vitest + build) plus `ui-checklist-reviewer` on any `.tsx`.

---

### #1 — Server-render the shared report at `/s/<id>`; delete the client redirect

**User problem.** A recipient tapping a Discord link on a phone gets a spinner for as long as a cold
Neon connection takes — the code's own abort budget is 15 seconds. Nothing of the team appears in the
initial HTML. This is the single widest point of the funnel and the only screen where a stranger
decides whether this product is worth anything.

**Evidence.** CERTAIN: `src/app/s/[id]/page.tsx:230-236` renders `ShareRedirectClient`;
`redirect.tsx` is a spinner plus `router.replace("/?s=<id>")`; `useShareUrl.ts` sets the 15s abort with
the "Neon cold start" comment and then `history.replaceState`s the URL back. HIGH: the resulting
sequence necessarily costs a bundle download plus a client fetch before first content, strands
`loading.tsx`, leaves zero content for non-JS clients, and exposes `/?s=<id>` in the address bar
during the replace window. `/q/[id]` proves server rendering is already viable in this codebase.

**Files/routes.** `src/app/s/[id]/page.tsx` (render the report server-side from the row it already
fetches, instead of handing off); `src/app/s/[id]/redirect.tsx` (delete, or demote to a no-JS
fallback); `src/app/s/[id]/loading.tsx` (keep — it becomes the real skeleton); `src/components/report/TeamReport.tsx`
and `TeamOverview.tsx` (need a server-renderable read-only path); `src/hooks/useShareUrl.ts` and
`src/hooks/useHomePage.ts` (the `?s=` / `pathIsShare` detection and the `shouldPersist` guard both
assume the redirect — the localStorage-leak protection documented at `useHomePage.ts:~55-70` **must
survive this refactor**); `src/components/home/HomePageClient.tsx` (share-view branches).

**Build size.** **Large** — the biggest item here, and the only one that is architectural. Realistically
a dedicated branch (CLAUDE.md's feature-branch threshold applies: 10+ files). Worth staging: ship a
server-rendered read-only view first, keep the client editor on `/?s=` for owners/collaborators, and
converge later. Do not attempt this in the same push as #2–#5.

**Confidence.** CERTAIN on the defect. HIGH that fixing it materially improves cold-open
time-to-value. **No behavioural data** — PostHog is absent, so the size of the win is unmeasured. The
`share_view` events at `HomePageClient.tsx:653-666` already exist; read them before committing to the
large version.

---

### #2 — Re-enable a rich share card: cache the OG route and stop forcing `summary`

**User problem.** Every share link unfurls as four lines of grey text. In the channels where this
product spreads, the card *is* the pitch, and ours says nothing — while a competitor advertises
"social previews" as a headline feature.

**Evidence.** CERTAIN: `s/[id]/opengraph-image.tsx` is 174 lines of finished card code;
`page.tsx:116-145` neutralises it with `images: []` and `twitter: { card: "summary" }`; the root layout
uses `summary_large_image` (`layout.tsx:53`). HIGH on the diagnosis being caching, not feasibility:
`/api/team-graphic/route.tsx` renders heavier output on the same edge runtime from the same sprite CDN
and ships `s-maxage=86400, stale-while-revalidate=604800` (`:369`, `:522`), whereas the OG route has
**no cache headers** and fetches its own API with `cache: "no-store"` — so every unfurl pays a
self-referential HTTP hop (4s budget) plus six sprite fetches (2.5s each) against a ~5s unfurler
budget. MEDIUM: Discord renders embeds ~400px wide, so lead with large type; declare
`og:image:width`/`height`.

**Files/routes.** `src/app/s/[id]/opengraph-image.tsx` (add `revalidate`/cache headers; query Neon
directly via `getDb()` instead of fetching our own API — kills one hop; precompute sprite data-URIs or
inline a small sprite set; simplify for 400px legibility); `src/app/s/[id]/page.tsx` (drop `images: []`,
switch to `summary_large_image`, add explicit width/height); `src/app/layout.tsx` (add the
`json+oembed` discovery link from #3.3 while in here).

**Build size.** **Small–Medium.** The card already exists; this is caching, one query swap, and
metadata. Ship behind a staged check: static `og-default.png` on `summary_large_image` first (near-zero
risk, strictly better than text), then the dynamic card once cached.

**Confidence.** CERTAIN that the card is suppressed and that the root/share asymmetry is backwards.
HIGH that caching addresses the failure the code comment describes. **I could not verify the live
unfurl** — our own domain 403s through this proxy — so **validate with Discord's and X's card
validators before trusting it**, and respect the comment's history: this has failed twice. If it fails
a third time, land the static `summary_large_image` and stop.

---

### #3 — Show the no-account CTA on mobile, and ask for the right thing

**User problem.** A mobile recipient's only offered action opens a sign-in modal, and it asks them to
take custody of a stranger's team. The free path to the product's real value — paste your own team —
is hidden on the device most recipients use.

**Evidence.** CERTAIN: `Navbar.tsx:597` gives "Build Your Own" (`<a href="/">`, no auth) the class
`hidden sm:inline-flex`; `ShareViewCTA.tsx` wraps its only button in `<SignInButton mode="modal">` for
signed-out viewers and is rendered at `HomePageClient.tsx:1661`; `api/share/route.ts:124-133` confirms
only *publishing* needs auth, so build-and-view is genuinely free. MEDIUM: a competitor advertises "no
login required" as a selling point (crob.at, corroborated as a growing competitor by the May run).

**Files/routes.** `src/components/ui/ShareViewCTA.tsx` (two actions: primary "Make one for your team" →
`/`, no auth; secondary "Duplicate" → existing sign-in path. Keep the 44×44 dismiss and the per-share
`vgc-share-cta-dismissed:<id>` localStorage key, both already correct);
`src/components/layout/Navbar.tsx:597` (reconsider `hidden sm:inline-flex` once the CTA carries it);
`src/components/home/HomePageClient.tsx:1661-1683` (wire the second action and a PostHog event beside
the existing `share_view_duplicate_anonymous`).

**Build size.** **Small.** One component, one class, one event. Highest leverage per hour in this list.

**Confidence.** CERTAIN on the code facts. MEDIUM that reordering the CTAs lifts conversion — this is
where the missing PostHog data hurts most. Instrument both actions from day one; the anonymous-intent
event already exists as a baseline to compare against.

---

### #4 — Make the Wrapped card shareable instead of downloadable

**User problem.** The most audience-ready artifact in the product can only be downloaded. On iOS it
lands in Photos and the Instagram-story hand-off its 1080×1920 ratio was designed for never happens.
Creators get a file, not a share.

**Evidence.** CERTAIN: `TeamCardCTA.tsx` forces `a.download`; `ShareModal.tsx:311` is the only
`navigator.share` call and passes `{ title, url }` with no `files`; `/api/team-graphic` already renders
1080×1920 with real cache headers. MEDIUM on mechanics: `navigator.canShare({ files })` is the correct
gate, HTTPS required, keep download as fallback, swallow `AbortError`, ~Chrome 128 / Safari 12.1,
targets inconsistent about payload parts so the image must stand alone. Strand 1.3's broadcast-graphic
tools suggest the category matters.

**Files/routes.** `src/components/report/TeamCardCTA.tsx` (branch on `canShare({files})`: share the blob
as a `File`, else current download); optionally `src/components/ui/ShareModal.tsx` (offer "share image"
beside "share link"). No API change — `/api/team-graphic` is ready.

**Build size.** **Small.** One component, one feature-detect, one fallback branch.

**Confidence.** CERTAIN on the current behaviour. MEDIUM on the API mechanics (web.dev corroborated,
primary docs unfetched). LOW on demand volume — no analytics, though `team_card_download_clicked` is
already captured in `TeamCardCTA.tsx` and would quantify it the moment credentials exist.

---

### #5 — Publish the oEmbed discovery link (and keep `/embed/<id>` honest)

**User problem.** Pasting a report into Notion, WordPress or Slack yields a bare link. A working
embed exists and no consumer can find it.

**Evidence.** CERTAIN: `src/app/api/oembed/route.ts` returns a valid `rich` payload scoped to public
shares; `src/app/embed/[id]/page.tsx` is server-rendered with `revalidate = 600`; a grep for
`json+oembed` across `src/app` returns **zero hits** and `layout.tsx` has no such `other` entry. So the
feature is complete and unreachable.

**Files/routes.** `src/app/s/[id]/page.tsx` or `src/app/layout.tsx` (emit
`<link rel="alternate" type="application/json+oembed" href="https://pokemonvgcteamreport.com/api/oembed?url=...">`
— per-share is the correct placement); `src/app/api/oembed/route.ts` (the hardcoded `height: 200` is
tight for a 6-sprite row plus summary — worth a look); `src/app/embed/[id]/page.tsx` (note it declares
a `<style>` block of classes and then inlines every style anyway — dead CSS, cosmetic only).

**Build size.** **Extra-small.** One `<link>` tag. Ranked fifth only because Discord uses Open Graph,
not oEmbed, so the reach is narrower than #2 — this is Notion/WordPress/Slack-class embeds.

**Confidence.** CERTAIN that the endpoint exists and is undiscoverable. MEDIUM that publishing it
produces rich embeds in those consumers — I could not test a single one from this container.

---

## What I would check first when credentials exist

1. **PostHog, `/s/<id>` funnel:** share-link opens → report rendered → `share_view_duplicate_anonymous`
   → sign-up. `HomePageClient.tsx:653-666` and `:1667` already emit what is needed. This sizes #1 and #3.
2. **Mobile share of `/s/` traffic.** If it is the majority, #3 moves above #2.
3. **Live unfurl check** of a real `/s/<id>` in Discord's and X's validators, from an unblocked network.
   Everything in #2 rests on a diagnosis I could not test against production.
4. **`team_card_download_clicked` volume** — sizes #4 directly.

## Scope honesty

- Strand 1 produced **structural** evidence (what communities *require* contributors to write), not
  sentiment. r/VGC and r/stunfisk were never reached.
- Strand 2 produced **no creator evidence**. The reasoning in 2.1–2.2 is mine, labelled LOW, and should
  not be relayed as creator opinion.
- Strand 3 is code-grounded and is where the five recommendations actually come from.
- **No outbound sending occurred.** Drafts only: `.swarm/drafts/r-ux-community-posts.md`.

## Sources (WebSearch snippets; none fetched — WebFetch had no DNS)

- [VGC Team Building Rules & Posting Guide](https://communityone.io/servers/1457350549216432295/pokemon-champions-vgc/forum/vgc-team-building-rules-posting-guide/)
- [RMT rules — read before you post (PokeBeach)](https://pokebeach.com/forums/threads/rmt-rules-read-before-you-post.124911/)
- [20XX Mence … team report (Nugget Bridge)](https://nuggetbridge.com/reports/20xx-mence-two-time-regional-champion-and-top-32-u-s-nationals-team-report/)
- [Best PokePaste Alternative: Visual Team Sharing (crob.at)](https://crob.at/pokepaste-alternative)
- [crob.at](https://crob.at/)
- [VR Pastes](https://www.vrpastes.com/)
- [Pokemon Champions VGC 2026 Team Builder (Pikalytics)](https://www.pikalytics.com/team)
- [VGC OTS — Chrome Web Store](https://chromewebstore.google.com/detail/vgc-ots/codeajknmgnkbobmhjeenehcmfhmegkf)
- [robsonbittencourt/vgc-ots](https://github.com/robsonbittencourt/vgc-ots)
- [VGC Pokémon Team Sheet Generator (DraftCentral)](https://www.draftcentral.gg/tools/pokemon-team-sheet-generator)
- [Up-to-date VGC Resources (DevonCorp)](https://devoncorp.press/resources/up-to-date-vgc-resources)
- [How to share files (web.dev)](https://web.dev/articles/files/share-files)
- [Integrate with the OS sharing UI with the Web Share API (web.dev)](https://web.dev/web-share/)
- [Testing the Web Share API (Raymond Camden)](https://raymondcamden.com/2023/04/20/testing-the-web-share-api)
- [Open Graph image sizes and dimensions: the complete 2026 guide (DEV)](https://dev.to/grabbit/open-graph-image-sizes-and-dimensions-the-complete-2026-guide-1k16)
- [OG Image Size in 2026 (Screenhance)](https://screenhance.com/blog/og-image-size-guide)
- [OpenGraph cheat sheet (env.dev)](https://env.dev/cheatsheets/opengraph-cheat-sheet)

Prior internal runs referenced as prior art, **not re-verified**:
`.swarm/r3-community-sentiment-20-05-26.md`, `.swarm/r5-mobile-ux-sharing-20-05-26.md`.
