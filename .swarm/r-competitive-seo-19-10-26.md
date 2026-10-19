# Competitive / SEO / AEO research — 19 Oct 2026

Read-only run. No source files modified, nothing committed, nothing sent or published.

## Container reachability (read this before trusting Section B)

- **WebFetch: 100% unavailable.** Every attempt failed with `getaddrinfo ENOTFOUND` — not a 403.
  Failing hosts included `victoryroad.pro`, `champdex.com`, and even the product's own
  `pokemonvgcteamreport.com`. DNS does not resolve for *any* external host from this container,
  so the VGC-255 "403 on CONNECT" note understates it: there is no outbound HTTP at all.
  I stopped after three attempts.
- **WebSearch: works.** Every external claim in Section B comes from **search-result snippets
  only**. I never loaded a page. Treat all of Section B as snippet-level evidence: titles, URLs
  and the search tool's own summary of snippets. Confidence ratings below reflect that ceiling —
  nothing in Section B can be rated higher than *medium* on detail, only on existence of a page.
- **Section A is code-sourced** from the local repo and is high confidence.

---

# A. Verified on-page SEO defects in this repo

## A0. Tickets already listed as open that the code shows as FIXED

Check these before filing anything — three of the four named tickets look already done on `main`.

| Ticket | Status in code | Evidence |
|---|---|---|
| **VGC-272** (robots per-bot groups; `/compare` noindex) | **Appears FIXED** | `public/robots.txt` now has a single `User-agent: *` group with `Disallow: /api/` and a comment explaining the no-inheritance trap. `src/app/compare/page.tsx:10` sets `robots: { index: false, follow: true }`, and `src/app/sitemap.ts:20-22` deliberately omits `/compare`. |
| **VGC-258** (`/champions` grid built from Reg M-A megas) | **Appears FIXED** | `src/app/champions/page.tsx:4,47` uses `getRegMCMegas()`; `src/app/champions/ChampionsContent.tsx:65-83` groups M-C-only / M-B-only / M-A; `src/app/champions/[pokemon]/page.tsx:28` prerenders `getRegMCMegasWithSprites()`; `src/app/sitemap.ts:30` sitemaps the same set. Regression test exists at `src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts`. |
| **VGC-298** (hidden structured data on `/faq`) | **Partially fixed** | The *FAQPage* half is fixed: `src/app/faq/page.tsx:141` passes the same `FAQ_ITEMS` array that is rendered visibly at `src/app/faq/page.tsx:170-180`. The *HowTo* half is not — see **A3**. |
| **VGC-275** (`/s/[id]` serves a client redirect) | **CONFIRMED, still broken** | See **A1**. |

Side note from the mega-set audit: `MEGAS_WITH_SPRITES` (`src/lib/data/mega-pokemon.ts:949`) now covers
**every** Reg M-C mega — `getRegMCMegas()` and `getRegMCMegasWithSprites()` return the same set, and
nothing is sprite-less. That makes the "Coming Soon" non-clickable branch in
`ChampionsContent.tsx:247-265` dead code. Harmless, but it is now misleading documentation.

---

## A1. `/s/[id]` renders a spinner, not the report — confirmed, and confirmed *indexed*
**Files:** `src/app/s/[id]/page.tsx:229-236`, `src/app/s/[id]/redirect.tsx:9-23`
**Ticket:** VGC-275 (already filed — do not duplicate)

The server component returns only `<JsonLd/>` + `<ShareRedirectClient/>`. The client component's
entire body is a spinner, a `sr-only` `<h1>`, and `router.replace('/?s=<id>')`. There is no report
text, no Pokémon names, no EV/SP spreads, no notes — nothing a crawler can index.

**New evidence this is live, not theoretical:** a WebSearch for the domain returned
`https://pokemonvgcteamreport.com/s/qiCXZxD1` titled *"Rampardos / Blaziken / Infernape / Porygon2 /
Incineroar / Iron Bundle — VGC Team by g0nZa10"*. So `generateMetadata` is doing its job and these
URLs **are** in search indexes — with a title and description and a zero-content body. ~5,000 of
them are sitemapped (`src/app/sitemap.ts:39-50`). This is the single largest crawl-budget and
thin-content liability in the repo, and it is the reason the product cannot rank for the
long-tail `{species core} VGC team` queries its own titles are optimised for.

**Fix:** server-render the report body at `/s/[id]` (or `permanentRedirect` to a real SSR route).
**Effort:** large — this is an architecture change, not a metadata tweak.

---

## A2. `/embed/[id]` iframes are structurally blocked by global frame headers — NEW, no ticket
**Files:** `next.config.ts:80-82` (`X-Frame-Options: DENY`), `next.config.ts:147`
(`frame-ancestors 'none'`), both applied to `source: "/(.*)"` with **no `/embed` override**

The product advertises iframe embedding in four places:
- `src/components/ui/ShareModal.tsx:206-208` — "Copy embed code" generates `<iframe src=".../embed/{id}">`
- `src/app/api/oembed/route.ts:38` — the oEmbed `html` field is that same iframe
- `src/app/faq/page.tsx` — FAQ answer: *"use the Embed option to copy an iframe snippet for embedding the report in any website, tournament page, or CMS"*
- `public/llms-full.txt:99-109` — a whole "How do I embed a team report?" section

Every one of those iframes will be refused by the browser on any third-party origin. `/embed/[id]`
itself correctly sets `noindex` (`src/app/embed/[id]/page.tsx:29`), so this is not an indexation
bug — it is an **advertised feature that cannot work**, which also means the FAQ and `llms.txt`
are publishing a false capability claim that AI assistants will repeat.

**Fix:** add a `/embed/:path*` entry to `next.config.ts` `headers()` that drops `X-Frame-Options`
and sets `frame-ancestors *` (or an allowlist) for that path only. Keep the global default.
**Effort:** small (one headers block). Verify the oEmbed + ShareModal flow after.

---

## A3. Hidden `HowTo` structured data on `/` and `/faq` — NEW for `/`, overlaps VGC-298 for `/faq`
**Files:** `src/components/home/HomePageServer.tsx:36-37`, `src/app/faq/page.tsx:142`,
`src/components/seo/JsonLd.tsx:41-58`

Three separate problems in one place:

1. **`FAQPageJsonLd` on the homepage emits questions that appear nowhere on the page.**
   `HomePageServer.tsx:36` calls `<FAQPageJsonLd />` with no props, so it falls through to
   `DEFAULT_FAQ_ITEMS` (`JsonLd.tsx:198-224`). I grepped the whole `src/` tree for one of those
   answer strings (`"Is VGC Team Report free to use"`) — the only hit is `JsonLd.tsx` itself.
   None of the five Q&As is rendered in homepage markup. That is hidden structured data on the
   site's most valuable URL, and it is a direct Google structured-data policy violation
   ("content not visible to users"). This is **more severe than the `/faq` case VGC-298 covers**,
   because `/faq` at least renders its items.
2. **Both `/` and `/faq` emit a `HowTo` whose steps are not rendered.** `HOW_TO_STEPS`
   (`HomePageServer.tsx:8-29`) and `SHARE_VGC_TEAM_HOW_TO_STEPS` (`faq/page.tsx:110-133`) are
   schema-only; the homepage renders a different, shorter 3-step strip (`LandingSteps`, lines 68-89)
   whose text does not match the schema.
3. **Both `HowTo` nodes carry the same hardcoded name.** `JsonLd.tsx:47` hardcodes
   `name: "How to Create a VGC Team Report"`, so `/faq` publishes a HowTo *titled* "create" whose
   five steps are about *sharing*, and two different URLs claim the identical HowTo entity.
   (Worth noting: Google retired HowTo rich results in 2023, so the upside here is ~zero while
   the policy risk is real.)

**Fix:** either render the FAQ block on the homepage (it is good content and would help the
`/` page's thin above-the-fold text), or drop `<FAQPageJsonLd />` from the homepage and let `/faq`
own it. Make `HowToSchema` take a `name` prop. Consider deleting the HowTo schemas entirely.
**Effort:** small.

---

## A4. `/tools/ev-to-sp` metadata is pinned to the wrong regulation — NEW, no ticket
**File:** `src/app/tools/ev-to-sp/page.tsx:20` (description), `:34` (keywords)

```
"Free EV to SP converter for Pokémon Champions Regulation M-A. ..."
...
"Regulation M-A SP spread",
```

M-C has been current since 9 Sep 2026. This is the exact failure mode VGC-258 was filed for
(`champions/page.tsx:6-8` has the comment: *"It used to be pinned to Regulation M-A, which went
stale the moment the format rotated... and left the hub page invisible for every Reg M-B query"*)
— the same bug just survived on a different page. It matters more than usual here because
**this is the one page I could confirm actually ranks**: a WebSearch for *"Pokemon Champions stat
points SP vs EV how many stat points"* returned `pokemonvgcteamreport.com/tools/ev-to-sp` in the
top results alongside champdex.com and battlewiseai.com. The page's own body copy is fine
(`FAQ_ITEMS` at `:107` correctly says "Regulation M-A, M-B and M-C"); only the SERP-facing
description and keywords are stale.

**Fix:** s/Regulation M-A/Regulation M-A, M-B and M-C (current)/ in `DESCRIPTION`; add
`"Regulation M-C SP spread"`, `"Reg M-C stat points"` to keywords.
**Effort:** trivial — 2 lines. Highest value-per-minute item in this report.

---

## A5. `public/llms-full.txt` states the SP↔EV conversion *wrong*, contradicting `llms.txt` — NEW, no ticket
**File:** `public/llms-full.txt:91` vs `public/llms.txt:29`

`llms-full.txt:91`:
> **SP (Stat Points or Standard Points)** is an alternative notation sometimes used in team reports
> and competitive coaching content — particularly in some international communities — where
> **1 SP = 1 EV. The terms are interchangeable.** If you see a Pokémon listed with "252 SP Atk" it
> means the same thing as "252 EVs in Attack".

`llms.txt:29` says the opposite, correctly:
> The conversion is not 1:1 — the first SP in a stat costs 4 EVs and every SP after that costs 8
> (so 32 SP = 248+ EVs). The budget is 66 SP total per Pokémon with a maximum of 32 SP per stat.

The `llms-full.txt` text is a pre-Champions paragraph that was never updated. It is also the
**opposite of what the product's own code does** (`convertToChampionsSp` in
`src/lib/analysis/stat-calculator.ts`, and the correct explanation on `/tools/ev-to-sp`).

This is the worst defect in the audit relative to effort. The product's single strongest
differentiator claim is "we understand Champions SP"; the file it serves specifically *for AI
assistants to read* tells those assistants that SP is just a synonym for EVs. Any assistant that
reads `llms-full.txt` and not `llms.txt` will both give users wrong advice and conclude the site
has no Champions-specific value.

Three smaller problems in the same file:
- `:89` says EVs cap at **508** total; `llms.txt:29` says **510**. Pick one (510 is the cap, 508 the usable maximum).
- `:83` and `:113` describe collaborator **edit links** — `src/app/s/[id]/page.tsx:157-159` removed
  them ("Never forward legacy edit tokens into the client URL. Report access is resolved from the
  authenticated account only").
- `:107` claims `/s/[id]` Discord links "automatically generate a rich Open Graph preview showing
  the team's Pokémon" — `src/app/s/[id]/page.tsx:112-133` deliberately suppresses OG images
  (`images: []`, with a comment explaining it was tried twice and reverted).

**Fix:** rewrite the SP section of `llms-full.txt` to match `llms.txt:29`; correct the three stale
claims; bump both `Updated:` dates (currently `2026-05-23`, five months old).
**Effort:** trivial — text only, no code.

---

## A6. `/tools/ev-to-sp` is missing from `llms.txt`'s URL list — NEW, no ticket
**File:** `public/llms.txt:16-23`

The "Main URLs" list covers `/`, `/explore`, `/tournaments`, `/champions`, `/faq`, `/changelog`
and `/s/[id]`. It does **not** list `/tools/ev-to-sp` — the only page I could verify ranks in a
live SERP, and the single most citable asset on the site for the product's differentiating topic.
`llms-full.txt` does not list it either.
**Fix:** add one bullet to each file, with a one-line description naming the 66 SP / 32 per-stat
budget and the 4-then-8 EV cost curve.
**Effort:** trivial.

---

## A7. Duplicate breadcrumb schema components — NEW, minor
**File:** `src/components/seo/JsonLd.tsx:153-169` (`BreadcrumbJsonLd`) and `:175-191` (`BreadcrumbListJsonLd`)

The two functions are byte-identical in behaviour (same `BreadcrumbList` output, same props, two
different JSDoc blocks). `src/app/creator/[name]/page.tsx:57` imports the first; `/champions`,
`/faq`, `/tournaments`, `/changelog` and `/tools/ev-to-sp` all import the second. No output bug
today, but it guarantees a future fix lands on only half the site.
**Fix:** delete `BreadcrumbJsonLd`, re-point `/creator`, keep `BreadcrumbListJsonLd`.
**Effort:** trivial. Good `/dead-code` candidate.

---

## A8. Creator-page sitemap entries are un-normalised user input — NEW, low-medium
**File:** `src/app/sitemap.ts:51-64`, `src/app/creator/[name]/page.tsx:9-11`

The sitemap emits up to 5,000 `/creator/{name}` URLs straight from
`GROUP BY data->>'creatorName'` with no case-folding, trimming or de-duplication, and the route
just `decodeURIComponent`s whatever arrives. `Bob`, `bob` and `Bob ` become three sitemapped URLs
with three self-referencing canonicals and identical content. Combined with the 5,000 `/s/` URLs,
the sitemap can carry ~10,000 entries of which a large share are near-duplicates or thin.
There is also no thin-profile `noindex` — a creator with one unlisted report still gets an
indexable page.
**Fix:** normalise + dedupe creator names in the sitemap query; `noindex` creator pages with zero
public reports.
**Effort:** small.

---

## A9. Things I checked and found healthy

So nobody re-audits them: `metadataBase` is set and the comment at `src/app/layout.tsx:82-85`
shows the site-wide-canonical trap was already hit and fixed. Every indexable static route has an
explicit self-canonical. `/dashboard/**`, `/notifications`, `/q/[id]`, `/embed/[id]` are all
`noindex`. `/s/[id]` correctly `noindex`es private shares and any URL carrying `?key=`
(`page.tsx:22,108-110`) and `notFound()`s deleted IDs instead of soft-404ing. `sitemap.ts` has
`revalidate = 3600`. The canonical-host 301 is in `src/proxy.ts:59-73`. `opengraph-image.tsx`
routes exist for `/`, `/explore`, `/champions`, `/champions/[pokemon]` and `/s/[id]`.
**And importantly for AEO:** `src/lib/security/bot-detection.ts:73-79` explicitly allowlists
`gptbot`, `oai-searchbot`, `anthropic-ai`, `claude-web`, `claudebot`, `perplexitybot` and
`amazonbot` ahead of the blocklist, so the middleware is not shutting AI crawlers out. (Gaps, if
you want them: `Google-Extended`, `meta-externalagent`, `cohere-ai`, `YouBot`, `Diffbot` are
neither allowed nor blocked — they fall through and pass, which is the right outcome by accident.)

---

# B. External / market findings

**Sourcing caveat, repeated:** all of this is from WebSearch result titles, URLs and snippet
summaries. I could not load a single page. I have *not* seen keyword volumes, ranking positions,
backlink data or traffic for anything below — no tool in this container can provide them. Where I
say "ranks", I mean "appeared in a WebSearch result set", which is weaker.

## B1. The competitive set is much larger than the repo believes — **confidence: high (existence), low (relative strength)**

`public/llms-full.txt:8-16` frames the market as PokePaste vs Pikalytics vs us. That framing is
~6 months out of date. Searches surfaced these, none of which appear anywhere in the repo:

| Site | What the snippet claims it does |
|---|---|
| `champteams.gg` | "Reg M-C Team Builder & Damage Calculator", all-in-one hub, speed tiers, type coverage, Showdown import/export. Also publishes Reg M-C tier-list editorial. |
| `championsbuilder.com` | Free Champions builder with an **SP calculator**, damage calc, Showdown export. |
| `pokesynergy.app` | Champions team builder + weakness checks, speed tiers, "Best Pokemon Champions Teams" pages. |
| `pokemonbuilder.com` | VGC builder with a prediction engine and PokePaste import/export. |
| `champdex.com`, `champsdex.com` | Champions *guide* sites. `champdex.com/guides/stat-points` and `/guides/format-rules` are direct competitors for the SP explainer query. |
| `pokemon-zone.com` | Per-species Champions pages (`/champions/pokemon/{slug}/`) with meta builds, win rates, usage scores. |
| `poketools.com` | Per-regulation per-species pages (`/meta/vgc-2026-reg-m-b/garchomp-mega`) with SP spread usage percentages. |
| `pokebase.app` | Champions tournament/team archive (`/pokemon-champions/tournaments/{id}`). |
| `crob.at` | Explicitly SEO-targeting "**Best PokePaste Alternative**" + "PokePaste Importer & Visual Pokémon Team Sharing". The closest positional competitor to this product. |
| `teamsheet.gg`, `metavgc.com`, `rotompicks.com`, `gamewith.ai`, `theclick.gg`, `genpkm.com`, `battlewiseai.com`, `switchbladegaming.com`, `pokestats.cc`, `stratagemvgc.app`, `vgcpedia.com`, `devoncorp.press` | Assorted guide/stat/paste sites that appeared across the Champions and EV-spread queries. |

**Trainer Hill: could not verify from this container.** Two searches returned nothing from it; all
hits were Pikalytics pages for "VGC Trainer School" events, a different thing. I cannot say what
Trainer Hill ranks for.

## B2. Challenge to VGC-217 (per-species EV-spread landing pages) — **confidence: medium**

The repo believes per-species landing pages are its biggest gap. The evidence says that space is
the **most contested** part of this market, not the emptiest.

A search for `"Mega Kangaskhan" OR "Mega Garchomp" Champions "SP spread" best set VGC 2026`
returned, in order: `pokemon-zone.com/champions/pokemon/kangaskhan-mega-kangaskhan/`,
three Pikalytics per-regulation pokedex URLs (`/pokedex/gen9championsvgc2026regma/Kangaskhan-Mega`,
`/pokedex/battledataregmbs3/Garchomp-Mega`, …), and `poketools.com/meta/vgc-2026-reg-m-b/garchomp-mega`.
Every one of them pairs the species with **usage statistics** — snippets quoted "Adamant at about
23.8% as the most-used spread", "Modest with 10 HP / 30 SpA / 26 Spe, at 23.3%", "65.6% win rate
across 5 teams". Note those are already expressed in SP, not EVs.

A separate search for generic `"best EV spread"` guides returned only *tutorial* content
(vgcguide.com, Smogon, stratagemvgc.app, pokestats.cc) — no species database. So:

- **The `{species} best moves / builds / spread` query is owned by whoever has usage data.**
  This product has no ladder or tournament scrape; it has ~5,000 user-authored reports. Spinning
  up ~400 thin non-mega species pages with no usage data to compete with Pikalytics and
  pokemon-zone is the lowest-probability play in this report.
- **The gap that is actually open** is the 81 mega pages the product *already* has
  (`/champions/{slug}`). They have good keyword targeting (`page.tsx:93-107` targets
  `{Pokemon} SP spread`, `{Pokemon} moveset`, `{Pokemon} competitive set`) and a data asset
  nobody else has: real authored team reports with written EV/SP justifications. Deepening those
  81 beats adding 400 new ones.
- **The genuinely uncontested niche** is per-species *SP-budget* content — "what does a 252/252/4
  spread look like in SP for this specific mon", which is a converter output, not a usage stat.
  That is `/tools/ev-to-sp` territory extended per-species.

**My read: VGC-217 is directionally right about long-tail landing pages and wrong about which
ones.** Reframe it as "deepen the 81 existing mega pages with SP-spread content derived from our
own reports" rather than "add per-species pages for the whole dex". I would not re-scope someone
else's ticket from a snippet-only evidence base without a human confirming — flagging, not deciding.

## B3. Validation of VGC-262 (EV→SP converter) — **confidence: high, for this product's own page**

Strongly validated, and it is the one claim in Section B I can support with a direct observation.
`pokemonvgcteamreport.com/tools/ev-to-sp` appeared in the result set for
*"Pokemon Champions stat points SP vs EV how many stat points"*, ranked among champdex.com's
stat-points guide, battlewiseai.com's SP system guide, champsdex.com, switchbladegaming.com and
genpkm.com. For a page shipped in the last cycle, that is real traction.

Two things make it more valuable than the ticket probably assumed:

1. **The community genuinely disagrees about the conversion rule, and this product is on the
   correct side.** The search summary surfaced two competing rules in circulation: a leaked
   Centro-sourced "1 SP = 8 EVs flat" (hence "32 SP = 256 EVs, 528 total") versus the HOME-transfer
   rule "first SP costs 4 EVs, each after costs 8" (hence "252 EVs = 32 SP"). The second is what
   `stat-calculator.ts` implements and what `/tools/ev-to-sp`'s FAQ explains. A third source
   (switchbladegaming.com) describes SP as "1 SP = 1 stat point" and mentions a Victory Point cost
   of 5 VP per point, which is a different axis again. **This is a real, documentable confusion
   with a correct answer the product already holds** — the best AEO opening in the whole report.
   *Confidence on the existence of the disagreement: high. On which rule is canonical: medium —
   two independent snippets back the 4-then-8 rule and it matches the product's code, but I could
   not reach an official source.*
2. **Everyone agrees on the budget**: 66 SP total, max 32 per stat, level 50, 31 IVs (several
   sources say IVs are gone entirely). So the uncontested facts are the ones the product states.

**The counterweight:** `championsbuilder.com` advertises an "SP calculator" and `champdex.com` has
a dedicated `/guides/stat-points` page. This niche is not empty and is being actively entered.
The stale "Regulation M-A" description (A4) and the wrong SP definition in `llms-full.txt` (A5)
are actively surrendering ground here.

## B4. Reg M-C legality demand — **confidence: medium-high on demand, low on volume**

A search for Reg M-C legality returned ten distinct sites all publishing M-C format guides:
`victoryroad.pro/champions-regulations/`, `metavgc.com/regulations/regulationm-c`,
`gamewith.ai`, `playnews.gg`, `rotompicks.com/en/items/` (a "Legal Items — Regulation M-C" page),
`champteams.gg/news/reg-m-c-tier-list-predictions`, `theclick.gg` (two articles), `onemorecatch.site`,
and a Japanese `note.com` deep-dive. Ten sites independently writing the same explainer is a
reasonable proxy for demand.

Notably, **the snippets disagree with each other** on: the number of new Pokémon (35 vs 29 vs 24
vs 26), the dates (Sep 8–Dec 1 vs Sep 9–Dec 2, probably a UTC artefact — the repo uses Sep 9–Dec 2),
and whether Mega Lucario Z / Garchomp Z are legal at all. The repo's `champions-legality.ts` has a
machine-checked per-reg dex, which is a stronger asset than any of these prose guides — but
`/champions` currently presents it as a mega grid, not as an answerable legality question.

*Caveat on live state:* the WebSearch snippet for `/champions` said "all **75** legal Mega
Evolutions". The code computes 81 (59 M-A + 16 M-B-only + 6 M-C-only). 75 = 59 + 16, i.e. the
pre-M-C number. That suggests either production is behind `main` or the snippet is a stale crawl.
Worth a human checking the live page. **Confidence: low** — a single snippet.

## B5. AEO/GEO: who gets cited, and why — **confidence: medium**

**Observed directly:** for *"how to share a VGC team / pokepaste alternative"*, this product **was**
in the result set, described accurately ("click Share to generate a permanent public link",
"private or unlisted, or published to Explore") — alongside `crob.at`, Pikalytics, and paste sites
VR Pastes and PokeBin. For *"best VGC team builder 2026"*, this product **was absent**; the set was
Pikalytics, pokemonbuilder.com, pokesynergy.app, champteams.gg, championsbuilder.com, NuzTools.

That split is the clearest positioning signal in the report: **the product is already citable for
"share / report / write-up" and is invisible for "builder".** `llms.txt:6` leads with "premier team
report builder *and sharing platform*" — the "builder" half is a losing fight against six dedicated
builders, and the "share a finished report" half is a near-open field against only crob.at and the
paste bins. Leaning harder into the sharing/write-up identity is cheaper than contesting "builder".

**What makes a source citable (from 2026 LLM-SEO coverage — note these are vendor/SEO blogs, so
directional at best):** contently.com, getpassionfruit.com, llmpulse.ai, limy.ai, quickseo.ai,
perfectafternoon.com and witscode.com broadly converge on:
- **`llms.txt` does not measurably drive citations.** One cited analysis of ~500M bot-traffic
  events reports GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot and Google-Extended
  overwhelmingly skip the file and crawl HTML. Google states it does not use `llms.txt` for Search,
  and AI Overviews draw on the normal index. Perplexity is listed as a "sometimes" partial
  exception. **Confidence: medium.** Vendor-sourced, but consistent across seven independent write-ups.
- **What does correlate:** URL accessibility, classic search rank, and "fan-out" rank (one cited
  55-experiment analysis). Plus crawlable fast HTML, valid schema, and answer-first content.
- **Third-party platforms** (Reddit, LinkedIn) appear heavily in AI answers — i.e. being *linked
  from community hubs* matters more than anything on your own domain.
- **Schema's effect on citation is unproven**; its confirmed value is Google rich results.

**The operational implication for this repo is uncomfortable:** `llms.txt` / `llms-full.txt` are
probably *not* earning citations, while **classic crawlable HTML is** — which makes **A1
(`/s/[id]` serving a spinner)** simultaneously the biggest SEO defect *and* the biggest AEO defect.
~5,000 URLs that an LLM crawler fetches and finds empty is the opposite of "URL accessibility".
Fixing `llms-full.txt` (A5) is still worth doing because it is 20 minutes and it is currently
*wrong*, but it should not be mistaken for an AEO strategy.

**One competitor tactic worth noting:** Pikalytics serves a parallel `/ai/` URL namespace —
e.g. `pikalytics.com/ai/tournaments/limitless/vgc-trainer-school-champions-m-b-1-bce8bf/Hydreigon`
alongside the normal `/tournaments/...` equivalent. Those `/ai/` URLs appeared *in search results*,
titled with a leading `#` (i.e. markdown-ish, machine-readable). That is a materially different
and more aggressive AEO play than an `llms.txt`: a crawlable, indexable, link-reachable
plain-content mirror of the real pages. **Confidence: medium** — I observed the URLs and their
`#`-prefixed titles in results; I could not fetch one to confirm what it serves.

## B6. Could not verify from this container

- Any keyword volume, difficulty, ranking position, traffic or backlink figure for any domain.
- Whether `public/llms.txt` is actually being fetched by any AI crawler (needs server logs).
- Trainer Hill's existence, content or keyword footprint.
- Community sentiment of any kind. The Reddit-flavoured search returned Wikipedia, a Metacritic
  summary and an eBay listing — zero r/VGC threads. **I am not writing a sentiment section.**
  Prior runs' low-confidence sentiment findings should be treated as unsourced.
- Whether production matches `main` (see the 75-vs-81 note in B4).

---

# Top 5 recommendations worth a new Linear ticket

Excludes VGC-217, VGC-258, VGC-262, VGC-272, VGC-275, VGC-298.

### 1. Fix the SP↔EV definition in `public/llms-full.txt` (+ 3 stale claims, + both `Updated:` dates)
- **Why:** `llms-full.txt:91` tells AI assistants "1 SP = 1 EV, the terms are interchangeable" —
  the exact opposite of `llms.txt:29`, of `stat-calculator.ts`, and of reality. The product's
  single strongest differentiator is actively being disclaimed in the file written for AI readers.
- **Effort:** trivial (~20 min, text only, no code, no build risk).
- **Why it beats the alternatives:** it is the only item here that is *wrong* rather than
  *suboptimal*. Everything else costs opportunity; this costs credibility. Zero risk, no tests needed.

### 2. Un-break `/embed/[id]` iframes: add a per-path headers exception in `next.config.ts`
- **Why:** `X-Frame-Options: DENY` + `frame-ancestors 'none'` on `/(.*)` block the embed feature
  that ShareModal, the oEmbed endpoint, the FAQ and `llms-full.txt` all advertise. An advertised,
  documented, non-functional feature is worse than an absent one — and embeds are the mechanism by
  which this product gets linked from community hubs, which B5 identifies as the thing that
  actually drives AI citation.
- **Effort:** small (one `headers()` entry + manual verification of the oEmbed flow).
- **Why it beats the alternatives:** it is the only item that unlocks *off-site distribution*
  rather than polishing on-site signals. Everything else in this list makes existing pages better;
  this one makes the product embeddable in tournament write-ups and Discord-adjacent sites.

### 3. De-stale `/tools/ev-to-sp` metadata to M-C, and add it to both `llms` files
- **Why:** this is the one page confirmed to appear in a live SERP for the product's core
  differentiating query, and its SERP description still says "Regulation M-A" — the identical bug
  VGC-258 was filed for, on the identical topic, one page over. It is also missing from
  `llms.txt`'s Main URLs list entirely.
- **Effort:** trivial (2 lines of metadata + 2 bullets of text).
- **Why it beats the alternatives:** highest value-per-minute in the report. It defends a position
  the product already holds against `champdex.com/guides/stat-points` and `championsbuilder.com`'s
  SP calculator, which are actively entering this niche.

### 4. Stop emitting hidden `FAQPage` + `HowTo` structured data on `/` and `/faq`
- **Why:** the homepage emits five Q&As (`DEFAULT_FAQ_ITEMS`) that appear nowhere in its markup —
  a Google structured-data policy violation on the site's most valuable URL. Both `/` and `/faq`
  also emit unrendered `HowTo` steps under a hardcoded name that contradicts `/faq`'s own content.
  Google retired HowTo rich results in 2023, so the upside is ~zero and the manual-action risk is not.
- **Effort:** small. Best version: render the FAQ block on the homepage (it fixes the policy issue
  *and* adds indexable above-the-fold text to a page that is currently mostly an input box),
  delete both `HowTo` schemas, add a `name` prop if you keep `HowToSchema`.
- **Why it beats the alternatives:** it is the only item that removes downside risk rather than
  adding upside, and the "render it instead of deleting it" variant does both at once. Also
  distinct enough from VGC-298 (which is about `/faq`) that it will not be a duplicate.

### 5. Reframe the per-species landing-page strategy: deepen the 81 existing `/champions/{slug}` pages instead of adding new ones
- **Why:** B2's evidence is that `{species} best moves/builds/spread` is owned by sites with usage
  data (Pikalytics' per-regulation pokedex, pokemon-zone, poketools — all already publishing SP
  spreads with usage percentages). This product has no usage scrape and cannot win that query. It
  does have 81 well-targeted mega pages and ~5,000 authored reports containing written EV/SP
  justifications that nobody else has. Pull per-species SP-spread content and real report excerpts
  into the pages that already exist.
- **Effort:** medium. Scope it as a spike first — pick 5 high-usage megas, build the enriched
  template, measure, then decide.
- **Why it beats the alternatives:** it is the only item that addresses *strategy* rather than
  defects, and filing it stops a large, low-probability build (≈400 thin species pages) from
  happening on a premise the search evidence contradicts. Flagged as a challenge to VGC-217, not a
  replacement — a human should confirm before re-scoping that ticket, since my evidence base here
  is snippet-only.

**Deliberately not in the top 5:** fixing `/s/[id]` (A1) is the single highest-impact item in this
entire report — ~5,000 indexed URLs with empty bodies, and per B5 it is the biggest AEO defect as
well as the biggest SEO one. It is excluded only because **VGC-275 already covers it.** If anything
in this report should be reprioritised upward, it is that existing ticket, not a new one.

Lower-value items with no ticket, if someone wants cleanup work: A7 (duplicate breadcrumb
components — good `/dead-code` candidate), A8 (un-normalised creator URLs in the sitemap), and the
now-dead "Coming Soon" branch in `ChampionsContent.tsx:247-265`.
