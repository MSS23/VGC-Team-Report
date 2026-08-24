# Competitor Teardown — Pikalytics & PokePaste

**Agent:** R1 (read-only trend/competitor research)
**Date:** 2026-08-24
**Scope:** Core features, share/view UX, monetization, SEO surface, mobile, and what each does *better* than a paste-to-report tool. Ends with 5 implementable opportunities.
**Supersedes/updates:** `.swarm/r1-competitor-pikalytics-pokepaste.md` (2026-05-25). Deltas vs that report are flagged inline.

---

## 0. Research constraints (read this before trusting any claim)

The egress proxy in this container blocked **direct fetches of both target sites** and most analytics/aggregator sites:

| Domain | Status |
|---|---|
| `pikalytics.com` / `www.pikalytics.com` | ❌ EGRESS_BLOCKED |
| `pokepast.es` | ❌ EGRESS_BLOCKED |
| `crob.at` (competitor to both) | ❌ EGRESS_BLOCKED |
| `apps.apple.com` | ❌ EGRESS_BLOCKED |
| `smogon.com`, `similarweb.com`, `grokipedia.com`, `pypi.org` | ❌ EGRESS_BLOCKED |
| `github.com` / `raw.githubusercontent.com` | ✅ fetchable |
| WebSearch (result summaries + page titles) | ✅ works |
| GitHub MCP | ⚠️ scoped to `mss23/vgc-team-report` only — cannot read third-party repos |
| `pokemonvgcteamreport.com` (own domain) | ❌ EGRESS_BLOCKED (per run-meta) |

**What this means for confidence levels:**

- **HIGH confidence** — anything sourced from the PokePaste GitHub repo (README, commit history, issue tracker), which I fetched directly, and anything sourced from our own repo, which I read directly.
- **MEDIUM confidence** — Pikalytics feature/page inventory. Derived from search-result *page titles and meta descriptions* (which are themselves Pikalytics-authored marketing copy) plus WebSearch synthesis. Page URLs are confirmed real (they appear as indexed results); the described behaviour inside them is second-hand.
- **LOW confidence** — traffic numbers, pricing. Aggregator pages were blocked; figures below come from search snippets quoting Similarweb/Semrush at various dates and should be treated as order-of-magnitude only.

Where a claim is marketing copy from a competitor about *another* competitor, I say so explicitly (see §3.4 — crob.at makes a claim about PokePaste that contradicts PokePaste's own README).

---

## 1. Pikalytics — the data incumbent

### 1.1 What it is

The dominant competitive-Pokémon statistics platform. Built by **Griffin Ledingham**, publicly introduced **21 November 2017**, originally to present Pokémon Showdown usage statistics in a more accessible format than Smogon's raw stat dumps. Nearly nine years of brand accumulation in a niche where trust is the product.

It is now the de-facto reference for usage %, EV/SP spreads, movesets, items, Tera preferences and teammate synergy across VGC, Battle Stadium Singles/Doubles, and Smogon tiers — and it has full **Pokémon Champions VGC 2026 Reg M-B** coverage, i.e. it is directly on our format.

### 1.2 Data moat — the actual product

| Source | What it contributes |
|---|---|
| **Pokémon HOME / Battle Stadium** | Official Nintendo ranked ladder data — the only "real game" usage signal |
| **Pokémon Showdown ladder** | High-volume simulator battles; supports **Glicko rating cutoffs** so you can view weighted usage for a specific skill band |
| **RK9 tournament team sheets** | Official VGC event team sheets — the highest-signal, hardest-to-get dataset |
| **Pokémon GO PvP** | Adjacent audience expansion |

**Refresh cadence: monthly, or on major competitive events.**

This is the part a paste-to-report tool structurally cannot copy on a weekend. RK9 sheet ingestion in particular is an operational relationship, not a feature.

### 1.3 Feature inventory (confirmed URLs)

| Surface | URL | Notes |
|---|---|---|
| Champions hub | `/champions` | "Pokemon Champions VGC 2026: Best Moves, Builds & Teams" |
| Per-Pokémon usage pages | `/pokedex/{format}/{Pokemon}` | e.g. `/pokedex/homebsd/Pikachu`, `/pokedex/homebss`, `/pokedex/series5` — **this is the SEO engine**, see §1.6 |
| Format index pages | `/pokedex/homebsd` | "VGC 2026 Regulation Set I Usage Stats" |
| Team builder | `/team` | Suggested moves/items/abilities/natures/**SP spreads** drawn from real tournament usage |
| Damage calculator | `/damage-calculator` | Weather, terrain, Intimidate, spread-move penalties, Mega options, **Stat Point investments**, exact rolls + KO odds |
| Speed tiers | `/speed-tiers` | Base Speed, max investment benchmarks, neutral natures, **Choice Scarf calcs** for the whole Champions roster |
| Champions Mobile landing | `/champions-mobile` | "Release Date, Best Teams & Builds" — pure keyword capture on an upcoming product |
| Top teams / tournament results | `/topteams`, `/results` | Winning comps from recent high-level events with W/L records and event placings |
| Quizzes | `/speed-quiz`, calc quiz, type quiz | Streak-based retention mechanics |
| Articles | — | Beginner onboarding ("Where do I start?", "Planning my team") |
| AEO surface | `/llms.txt`, `/llms-full.txt` | Confirmed live — they are actively courting LLM citation |

Multi-language: reported as **8 locales** (EN/JP/IT/FR/DE/ES/KO/ZH) in the May teardown; I could not re-verify this run (site blocked). Treat as MEDIUM.

### 1.4 Share / view UX

Pikalytics' share model is **export-oriented, not destination-oriented**. The team builder offers:

1. **Save locally** — teams persist in browser storage, **no account required**
2. **Copy team** — clipboard, Showdown format
3. **Share link** — Pikalytics-hosted URL
4. **Export team image** — a visual card explicitly marketed for "tournament reports, Discord, or social media"
5. **Share PokePaste** — a button that pushes your team straight to `pokepast.es`

Point 5 is the strategically interesting one: **the category leader defers to PokePaste for canonical sharing.** Pikalytics does not try to own the share primitive. It owns *analysis* and hands off *distribution*. That is a deliberate, and probably correct, division of labour — and it is precisely the seam VGC Team Report sits in.

### 1.5 Monetization

| Stream | Detail | Confidence |
|---|---|---|
| **Website** | 100% free. No paywalled stats, builder, or calc. | HIGH |
| **Ko-fi patronage** | Membership tiers, member-only posts. Primary funding. | MEDIUM |
| **Paid iOS app** | "Pikalytics: Battle Strategy", dev Griffin Ledingham. Confirmed a **paid** app; exact price not re-verifiable this run (App Store blocked; May teardown said ~$0.99). | Price = LOW |
| **Advertising partnerships** | "Advertise on Pikalytics" footer link; partnership model rather than programmatic ad networks. | MEDIUM |

**The lesson:** access is free, *convenience* is paid. The app sells offline + ad-free, not data. Patronage funds the data. This is a viable model for a community tool where paywalling data would be seen as a betrayal.

### 1.6 SEO surface — their single biggest structural advantage

Pikalytics runs **programmatic SEO at a scale we do not approach.** The pattern is visible in the indexed titles:

```
Pikachu VGC 2026 Regulation Set I Stats | Pokemon Scarlet Violet | Pikalytics
Sneasler VGC 2026 Regulation Set I Stats | Pokemon Scarlet Violet | Pikalytics
Pokemon Champions Speed Tiers VGC 2026 | Pikalytics
Pokemon Champions Damage Calculator VGC 2026 | Pikalytics
Pokemon Champions Mobile - Release Date, Best Teams & Builds | Pikalytics
```

Structure: `{Pokémon} × {format} × {locale}` = thousands of evergreen pages, each targeting a genuinely-searched long-tail query ("is X good in reg M-B"), each auto-refreshed monthly so freshness signals stay green *without editorial effort*. On top of that sit hand-picked head-term landing pages (`speed-tiers`, `damage-calculator`, `champions-mobile`) that capture the high-volume generic queries.

**Our comparison** (read directly from `src/app/sitemap.ts`):

| Surface | Count |
|---|---|
| Static pages | 11 |
| `/champions/{mega}` SSG pages | 72 (Reg M-B Megas with sprites) |
| `/s/{id}` public shares | up to 5000, but user-generated and thin |
| `/creator/{name}` | up to 5000, user-generated |

So our *editorial* SEO surface is ~83 pages against their thousands. Our share/creator pages are numerous but are user-generated duplicates-of-a-template — low individual ranking power, and a thin-content risk at scale.

Also note: `/compare` is deliberately `noindex` and excluded from sitemap (VGC-272) — correct, but it means a genuinely useful tool page earns zero search traffic.

**Parity item — do NOT list this as an opportunity:** we already ship `public/llms.txt` and `public/llms-full.txt`, matching Pikalytics' AEO surface. (Caveat worth knowing: Google's Gary Illyes confirmed in July 2025 that Google does not support `llms.txt` and has no plans to; adoption across 300k domains measured ~10%. It helps with Perplexity/ChatGPT-search citation, not Google rank.)

### 1.7 Mobile experience

Pikalytics' mobile answer is a **paid native iOS app**, positioned with unusual precision:

- **Fully offline** — no network required, "fast, network-free browsing"
- **100% ad-free**
- **Deep Search** — rankings for items, moves, abilities
- **Favorites & Quick-Jump** — "save your core to favorites for lightning-fast access between rounds"
- **Teammate Analytics** — who pairs with whom

The marketing copy names the exact use case: **studying the field between tournament rounds when venue Wi-Fi is unreliable.** They even disclaim it is "not for use during active tournament matches."

That is a very sharp product insight. A competitive Pokémon player's highest-stakes, lowest-connectivity moment is sitting in a convention hall between rounds. Whoever owns that moment owns the habit.

---

## 2. PokePaste — the ecosystem primitive

### 2.1 What it is

A pastebin for Pokémon Showdown export syntax. Live at `pokepast.es`. Author **Felix Phew** (`felixphew`). **BSD-3-Clause** licensed, source at `github.com/felixphew/pokepaste`.

From the README (HIGH confidence — fetched directly):

> a simple pastebin, with a clean interface, that supports highlighting of the syntax created by Pokemon Showdown

It highlights **species names by primary type, moves by move type, and items by associated type**, and shows **image previews for Pokémon and items using art from the Pokémon Global Link**. The README explicitly claims it is "simple, standards-compliant and mobile-friendly."

### 2.2 Technical shape

- **v3 rewritten from the ground up in Go**
- Dependencies: Go standard library + MySQL driver + Blowfish. That's it.
- Self-hostable via a bundled CLI; config by env vars (MySQL DSN + encryption key)
- `/raw` endpoint returns the plain Showdown text of any paste — **this is the interop primitive the whole ecosystem is built on**

### 2.3 Share / view UX — the thing to actually learn from

The entire flow is: **paste text → get a permanent short URL.** No account. No expiry. No ads. Sub-second.

Team-level fields are Title / Author / Notes; per-Pokémon it carries species, item, ability, EVs/nature, Tera type, and moves. Our own `src/app/api/pokepaste/route.ts` confirms this shape — its create schema is exactly `{ paste, title?, author?, notes? }`, and its read path builds `https://pokepast.es{path}/raw`.

**Why it wins:** time-to-shared-link is ~2 seconds and requires **zero decisions**. Every competing tool asks you something first — pick a format, name your team, sign in, choose a template. PokePaste asks nothing. That friction delta is the whole reason it became the lingua franca of VGC, used daily in tournament Discords, on Smogon, on Twitter/X (see @VGCPastes, whose handle currently reads "Champions MB"), and in RK9 team-sheet workflows.

### 2.4 Monetization

**None.** No ads, no accounts, no premium tier, no donation funnel surfaced. It is a volunteer public good.

This is a strength (trust, neutrality, permanence — nobody fears link rot from a monetization pivot) and simultaneously the direct cause of §2.6.

### 2.5 SEO surface

**Effectively zero, by design.** The site's content is user pastes — no landing pages, no editorial content, no per-topic surfaces. The only informational page is `pokepast.es/syntax.html` (a syntax HOWTO). PokePaste captures navigational search for its own name and nothing else. It doesn't need SEO because it is distributed by word-of-mouth inside closed communities.

**Strategic read:** PokePaste is not competing for search traffic. It is not a competitor for our `/champions/*` or tools traffic *at all*. It competes with us for exactly one thing: **the moment a player decides where to put their team.**

### 2.6 Stagnation — the exploitable weakness (HIGH confidence)

Fetched directly from GitHub:

**Commit history on branch `v3` — last commits:**

| Date | Commit |
|---|---|
| 31 Mar 2021 | `data: update pokemon for IoA / CT` |
| 30 Mar 2021 | `Update data.go` / `Add files via upload` |
| 14 Nov 2020 | `Link syntax.html properly` |
| 18 Jul 2020 | `Add misc changes of the past year` |

**The public repo has had no commits since March 2021 — over five years.**

**Repo health:** 124 stars · 27 forks · **163 open issues** · **4 watchers**.

**Top open issues by reactions** — this is a ranked list of what the community wants and is not getting:

| # | Title | Opened | Signal |
|---|---|---|---|
| 226 | New Pokémon images already available | Mar 2024 | Sprites stale for new gens |
| 133 | Missing Sprite for some mons | Sep 2020 | 6 years unfixed |
| 217 | **Push up-to-date code** | Dec 2023 | The deployed site has diverged from the open source — bus-factor risk |
| 257 | **PokePaste API request** | Jan 2025 | **No official API exists** |
| 295 | Uploading RBY teams → "No (or Invalid) Paste" | Sep 2025 | Parser rejects valid formats |
| 5 | Profanity / validity filter | Apr 2017 | Author's own issue, 9 years open |
| 19 | Shiny Pokémon images | Aug 2017 | `enhancement`, `help wanted` |
| 52 | **Allow editing of team?** | Mar 2018 | **You cannot edit a paste. Ever.** |

Four exploitable gaps fall straight out of that list:

1. **No editing** (#52, open since 2018). A typo'd spread means a new URL and a re-share. Our `/api/share/[id]/versions` + fork already beats this outright.
2. **No official API** (#257). Third parties reverse-engineer `/raw` and scrape HTML (there are PyPI scrapers and a PokePaste MCP server doing exactly this). An officially documented interop contract is unclaimed territory.
3. **Stale sprite/dex data** (#226, #133) for new Pokémon — a real problem in a Champions/Mega meta with new forms.
4. **Format-parsing brittleness** (#295) — pastes that Showdown accepts, PokePaste rejects.

### 2.7 Mobile experience

Server-rendered HTML, near-zero JS, tiny payload. It is *excellent* on mobile in the way a plain document is excellent — instant on venue Wi-Fi, readable on any device, no app, no install. No offline story, no PWA, but the pages are so light it barely matters.

---

## 3. Adjacent landscape (context, not primary scope)

### 3.1 crob.at — attacking the share layer directly

A newer entrant explicitly positioning as "the best PokePaste alternative": visual team display with sprites and held-item icons, **social sharing with preview images**, **multi-team support** (export an entire Showdown teambuilder, share all teams in one link), imports `pokepast.es` links directly, no login, free. It claims Champions Reg M-B support.

**This is the most direct threat to our share surface** — closer to us than either primary target, because it competes on visual presentation + social embeds, which is our differentiation.

### 3.2 Porygon Labs

New entrant surfacing in Champions searches: "Pokémon Champions VGC Damage Calculator & Team Builder". Worth a watch item.

### 3.3 Rough scale ordering (LOW confidence — mixed dates, blocked sources)

| Site | Est. monthly visits | Source/date |
|---|---|---|
| pokemonshowdown.com | 20.7M | Semrush, Sep 2025 |
| smogon.com | 4.1M | Similarweb, Nov 2024 |
| richi3f.github.io | 468K | Nov 2024 |
| marriland.com | 428K | Nov 2024 |
| mypokemonteam.com | 344K | Sep 2025 |
| victoryroadvgc.com | 202K | Nov 2024 |
| pokemonteambuilder.net | 60K | Nov 2024 |

Pikalytics' own figure was not obtainable (aggregators blocked), but it was named as a peer of victoryroadvgc in the competitor set — so plausibly low-hundreds-of-thousands.

### 3.4 A caution about competitive claims

crob.at's marketing asserts PokePaste is "text only display (no sprites, no item icons, no visual team preview)." **PokePaste's own README directly contradicts this**, describing "an image preview for mons and items" using Pokémon Global Link art. Treat competitor-authored comparisons as spin. (Charitable reading: crob.at may mean PokePaste shows small inline icons rather than a composed visual team card — a real but much narrower distinction than their copy implies.)

---

## 4. What they do BETTER than a paste-to-report tool

Stated bluntly, because this is the load-bearing section.

**Pikalytics:**

1. **A data moat we cannot replicate.** A report describes *what is on the team*. Pikalytics tells you *whether it's good*. "Your Incineroar runs the 4th-most-common spread" is a sentence we cannot currently write. Their RK9 + HOME + Showdown pipeline is an operational asset, not a feature.
2. **Evergreen programmatic SEO.** Thousands of auto-refreshing pages vs our ~83 editorial pages. They acquire users while sleeping; we acquire users when someone shares a report.
3. **Return-visit loop.** Data changes monthly, so there is a reason to come back. Quizzes (speed/calc/type) manufacture habit. A report is written once and then only *read* — inherently a one-shot for the author.
4. **Breadth in one tab.** Builder + calc + speed tiers + usage, no context switch.
5. **Owning the tournament floor.** Offline native app, explicitly built for between-rounds with no Wi-Fi.

**PokePaste:**

6. **Friction.** ~2 seconds, zero decisions, no account. A report inherently asks for more input, and every field is a place to abandon.
7. **Universality.** It is the interchange format. Pikalytics itself has a "Share PokePaste" button. Every bot, scraper, and rental-code converter speaks it. Being *the* standard is worth more than being *better*.
8. **Permanence and neutrality.** No account means no account deletion, no monetization pivot, no link rot. Nine years of links still resolve.
9. **Trivial cost structure.** Go + MySQL, one box. It can stay free forever. We carry Neon (512MB free tier), Clerk, PostHog, Vercel Pro build minutes.

**The honest positioning:** we are not competing with Pikalytics on data or PokePaste on speed. We occupy the gap neither serves — the *narrative* layer: strategy notes, matchup plans, damage calcs, and a readable artifact worth publishing. Pikalytics' own copy validates this by naming "tournament reports" as a place you'd paste their exported image. The risk is that this gap is narrow, and crob.at is walking into it.

---

## 5. Where we already stand (read from the repo, HIGH confidence)

Worth stating so we don't "discover" opportunities we've already shipped.

**Already shipped:**
- Share (`/s/[id]`), embeds (`/embed/[id]`), **oEmbed** (`/api/oembed`), per-share `opengraph-image`, `/api/team-graphic` — our social/embed story is *ahead* of PokePaste and comparable to crob.at
- Versions, fork, comments, reactions, collections, drafts, collaborators — beats PokePaste #52 outright
- `/champions/[pokemon]` SSG (72 Reg M-B Megas), `/explore`, `/compare` (noindex), `/creator/[name]`, `/tournaments`, `/tools/ev-to-sp`
- **PokePaste import** — `/api/pokepaste` GET proxy (reads `/raw` + HTML title) and POST create
- i18n across 8 locales (`en, es, fr, it, ja, ko, zh, …`)
- **PWA foundation** — `public/sw.js` (`vgc-team-report-v25`, with `SHARE_CACHE` and `API_CACHE`) + `manifest.json`, precaching `/`, `/explore`, `/champions`, `/compare`, `/dashboard`
- `llms.txt` + `llms-full.txt` (AEO parity with Pikalytics)
- **A first-party meta snapshot already exists**: `/api/champions/meta` computes top-20 species usage across our own public reports (`MIN_REPORTS = 5`, `TOP_N = 20`, 5-min cache)
- `SpeedTierChart`, `speed-tier-form.ts`, `CalcInput` (parses calc lines into offensive/defensive/speed categories), `TournamentMode`

**Genuine gaps:**
- No standalone, indexable speed-tiers page — the chart is locked *inside* a report
- No damage calculator (we accept pasted calc text; we don't compute)
- No machine-readable **output** — we import from PokePaste but nothing can import from us
- Editorial SEO surface ~83 pages
- Meta snapshot is computed but, as far as the API shape suggests, not surfaced *on the report itself*

---

## 6. Five opportunities

Effort key: **S** ≈ under a day · **M** ≈ 2–4 days · **L** ≈ 1–2 weeks.

---

### OPP-1 — Public `/s/{id}/raw` and `/s/{id}.json`: be a source, not just a sink · **S**

**Why:** PokePaste's `/raw` is the single reason the ecosystem can build on it — and PokePaste itself has **no official API** (issue #257, open since Jan 2025; third parties are reduced to HTML scraping via PyPI packages and an MCP server). We currently *consume* PokePaste (`/api/pokepaste`) and emit nothing. Every Discord bot, calc site, rental-code converter and crob.at-style tool that wants to read a VGC Team Report has no contract to code against.

**What:** For public, non-deleted shares only, add
- `GET /s/{id}/raw` → `text/plain`, the Showdown paste, honouring the existing `redactPasteFields` / `privateFields` tiered-publishing logic
- `GET /s/{id}.json` → documented JSON: team metadata, per-Pokémon analysis, calcs
- A short `/docs/api` page (which is itself an indexable SEO page)

**Effort: S.** `src/app/api/share/[id]/route.ts` already does the fetch, cache, normalize and redaction work. This is a thin content-negotiation layer plus documentation. Must reuse `applyPrivateFieldRedaction` — do not leak private fields through a new door — and go through `apiGuard` rate limiting like every other route.

**Payoff:** our URLs start appearing inside other people's tools. That is how PokePaste won.

---

### OPP-2 — Standalone, indexable `/speed-tiers` (and a real `/tools` hub) · **S–M**

**Why:** Pikalytics ranks a dedicated page for *"Pokemon Champions Speed Tiers VGC 2026"* — a high-intent head term. We have the entire capability already (`SpeedTierChart.tsx`, `speed-tier-form.ts`, base-stat and nature data in `src/lib/data/`) but it is buried inside a generated report where no crawler will ever reach it. This is unmonetized inventory sitting in our own repo.

**What:** A public `/speed-tiers` page — full Champions/Reg M-B roster, base Speed, max investment, neutral vs +Spe natures, Choice Scarf column, filter by format, sortable. Each row deep-links into the paste flow ("build a team around this"). Add to `sitemap.ts` alongside `/tools/ev-to-sp`. Same play for a `/tools` index that gathers `ev-to-sp`, speed tiers and `/compare` under one indexable roof.

**Effort: S–M.** S if it's a static render of existing data; M with filters, sorting and i18n across our 8 locales.

**Payoff:** top-of-funnel search traffic that arrives *before* someone has a team to paste — the audience we currently cannot reach at all. It also directly answers our biggest structural disadvantage (§1.6) with work we've already paid for.

---

### OPP-3 — A 2-second fast lane: paste → link, everything else optional · **M**

**Why:** This is the one thing PokePaste does better that actually costs us users. Their flow is paste → URL, zero decisions. Every field we ask for before producing a link (tournament name, creator name, format, notes) is an abandonment point. Meanwhile Pikalytics *defers to PokePaste* for sharing precisely because it's frictionless.

**What:** A path where paste → immediate rendered report → shareable link, with **every** metadata field deferred to post-publish editing. We already have `versions`, `fork` and collaborator infrastructure, so "publish now, refine later" is architecturally free — it's a UX sequencing change, not new plumbing. Instrument `time_to_first_share_link` in PostHog and treat it as the headline metric.

**Effort: M.** Mostly reordering the input flow (`src/components/input/`) plus a post-publish edit affordance. Must go through `ui-checklist-reviewer` per CLAUDE.md.

**Payoff:** attacks the only axis on which the incumbent share tool beats us, while keeping the depth that differentiates us. Depth becomes opt-in rather than a toll gate.

---

### OPP-4 — Surface meta context *on the report* ("is this team any good?") · **M** now, **L** for parity

**Why:** The single largest capability gap versus Pikalytics (§4.1). A report currently describes; it doesn't evaluate. But we're closer than the May teardown assumed — **`/api/champions/meta` already computes top-20 species usage across our own public reports.** We compute it and apparently don't show it where it matters.

**What (the M version — first-party data only, ship this):** On each report, add honest, self-sourced context badges:
- "3 of your 6 are in the top 20 most-used on VGC Team Report"
- Per-Pokémon usage-rank badge from the existing snapshot
- Speed-tier percentile against the format roster (free once OPP-2 lands)
- Label the source plainly — *"based on N public reports on this site"* — never imply ladder data we don't have. The route already guards this with `MIN_REPORTS = 5` / `hasEnoughData`; respect it and render nothing rather than a misleading number.

**What (the L version):** ingesting external ladder/tournament data for true Pikalytics-grade usage. Flagged as **L and gated**, with two hard constraints from CLAUDE.md: (a) **Neon is on the 512MB free tier** — store only aggregated rollups, never raw battle logs (cf. the July 2026 `share_versions` incident that ate 447MB); (b) sourcing and attribution need a real decision before any scraping.

**Effort: M for the first-party layer** (component work + wiring an existing API into the report). **L** for external data.

**Payoff:** turns a static artifact into analysis, and creates the return-visit reason we currently lack — the numbers change as the corpus grows. Honest small-sample framing is also a differentiator against tools that quietly overstate their data.

---

### OPP-5 — Tournament-day offline mode: give away what Pikalytics charges for · **M**

**Why:** Pikalytics' clearest product insight is that the decisive moment is *between rounds in a venue with bad Wi-Fi* — and they put it behind a paid app. We already have `public/sw.js` (v25, with `SHARE_CACHE`/`API_CACHE`), `manifest.json`, and a `TournamentMode` component. We're most of the way to matching their premium feature **on the web, for free, with no install.**

**What:** "Pin this report for the event" — explicitly cache a report and its sprites/assets for offline reading; an offline-ready indicator; make `TournamentMode` the default view when offline; verify the `/s/{id}` route is genuinely offline-complete (current `PRECACHE_URLS` covers shell routes like `/`, `/explore`, `/champions` but a *specific* pinned share needs deliberate caching). Prior research already exists at `.swarm/r-pwa-15-05-26.md` — start there.

**Effort: M.** Service-worker cache-strategy work plus a pin affordance; the foundation is built. Bump `CACHE_NAME` on release (the file's own comment says so).

**Payoff:** a genuinely differentiated answer to their paid app, at near-zero marginal cost, aimed at the highest-intent moment in the sport. Also strengthens the case that a *report* — not a spreadsheet of usage stats — is what you actually want to reread between rounds.

---

## 7. Watch items

1. **crob.at** (§3.1) is the closest competitor to our actual position — visual sharing, social preview images, multi-team links, PokePaste import, no login. It is attacking the share layer with our differentiation. Blocked this run; re-teardown when egress allows.
2. **PokePaste bus factor.** Public repo dead 5+ years, deployed code diverged (#217), 4 watchers. If `pokepast.es` ever lapses, the entire VGC sharing ecosystem is orphaned overnight — and whoever can already read and write that format inherits it. OPP-1 is cheap insurance with real upside here.
3. **Porygon Labs** (§3.2) — new Champions calc/builder entrant.
4. **Pikalytics on Champions Mobile.** They've already built a `/champions-mobile` landing page for an unreleased product. They pre-position on keywords months ahead. We should be doing the same for the next regulation set.

---

## 8. Source list

- https://github.com/felixphew/pokepaste — repo, README, stars/forks/issues *(fetched directly)*
- https://raw.githubusercontent.com/felixphew/pokepaste/v3/README — README v3 *(fetched directly)*
- https://github.com/felixphew/pokepaste/commits/v3 — commit history, dormancy *(fetched directly)*
- https://github.com/felixphew/pokepaste/issues — top issues by reactions *(fetched directly)*
- https://pikalytics.com/ , /champions, /team, /damage-calculator, /speed-tiers, /champions-mobile, /pokedex/homebsd, /pokedex/homebss, /pokedex/series5, /llms-full.txt — *(titles + meta descriptions via WebSearch; pages themselves EGRESS_BLOCKED)*
- https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166 — *(via search snippets; blocked)*
- https://crob.at/pokepaste , https://crob.at/pokepaste-alternative — *(via search snippets; blocked; competitor-authored, see §3.4)*
- https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/ — *(blocked)*
- https://pypi.org/project/pokepastes-scraper — evidence of `/raw` scraping *(via snippets; blocked)*
- https://mcp.directory/blog/pokepaste-mcp-complete-guide-2026 — PokePaste MCP server *(via snippets)*
- Similarweb / Semrush figures via search snippets — *(aggregators blocked; LOW confidence)*
- Own repo, read directly: `src/app/sitemap.ts`, `src/app/api/pokepaste/route.ts`, `src/app/api/share/[id]/route.ts`, `src/app/api/champions/meta/route.ts`, `src/app/api/oembed/route.ts`, `public/sw.js`, `public/llms.txt`, `src/components/report/*`
