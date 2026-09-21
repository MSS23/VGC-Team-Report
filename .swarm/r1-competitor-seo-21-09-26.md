# Competitor + SEO/AEO Audit — VGC Team Report

Date: 2026-09-21
Method: local repo inspection (production site is proxy-blocked from this container) + WebSearch.
Direct WebFetch to pikalytics.com, pokepast.es, limitlessvgc.com, crob.at was **egress-blocked**, so competitor
detail below comes from search-result snippets and indexed page titles/URLs, not first-party page reads.
That is flagged per claim.

Nothing was posted, submitted, or published. No tracked source file was modified.

---

## 0. Baseline: what the repo actually ships today

Enumerated from `src/app/**`, `src/app/sitemap.ts`, `public/robots.txt`, `public/llms.txt`,
`public/llms-full.txt`, `src/components/seo/JsonLd.tsx`.

### Public, indexable routes

| Route | Own `metadata`? | Canonical | Structured data |
|---|---|---|---|
| `/` (`src/app/page.tsx`, `"use client"`) | **no** — inherits root layout | root layout | `FAQPage`, `HowTo` (+ layout's `Organization`, `WebSite`+`SearchAction`, `WebApplication`/`SoftwareApplication`) |
| `/explore` | yes ("Best VGC Teams 2026 — Explore Top Team Reports") | self | `CollectionPage`, `BreadcrumbList` |
| `/champions` | yes ("Pokemon Champions Format \| Reg M-B & M-A Mega Teams") | self | `ItemList`, `BreadcrumbList` |
| `/champions/[pokemon]` (SSG, 72 Megas w/ sprites) | `generateMetadata` | self | `WebPage`, `BreadcrumbList`, `FAQPage` |
| `/tournaments` | yes | self | `SportsEvent` (graph), `BreadcrumbList` |
| `/faq` (13 Q&A) | yes | self | `FAQPage`, `HowTo`, `BreadcrumbList` |
| `/tools/ev-to-sp` | yes | self | `WebApplication`, `WebSite`, `Offer`, `FAQPage`, `BreadcrumbList` |
| `/s/[id]` | `generateMetadata` | self | `CreativeWork` + `Person` author/contributors |
| `/creator/[name]` | `generateMetadata` | self | `ProfilePage`, `Person`, `BreadcrumbList` |
| `/changelog`, `/support`, `/privacy`, `/terms`, `/feedback` | yes | self | breadcrumbs on `/changelog` |

Noindexed (correctly): `/compare`, `/embed/[id]`, `/notifications`, `/dashboard/**`.

### Already shipped — do NOT re-propose

- **`/tools/ev-to-sp` exists and is complete** (`src/app/tools/ev-to-sp/page.tsx` + `EvToSpConverter.tsx`):
  metadata, 11 keywords, canonical, OG/Twitter, `force-static`, breadcrumb + FAQ + WebApplication JSON-LD,
  a conversion table generated from `evToChampionsSp`, footer link. **VGC-262 looks already delivered** —
  worth closing or re-scoping rather than building.
- **VGC-258 also looks delivered.** `src/app/champions/page.tsx:45` calls `getRegMBMegas()` and
  `ChampionsContent.tsx:63-64` renders a dedicated `CHAMPIONS_REG_MB_ONLY_MEGAS` section. `sitemap.ts`
  maps `getRegMBMegasWithSprites()` (72 URLs, M-B superset). Verify against the ticket before re-doing.
- **VGC-272 delivered.** `public/robots.txt` has a single `User-agent: *` group with the inheritance
  comment; `/compare` is deliberately absent from the sitemap with an explanatory comment.
- Canonical/robots hygiene is clean. Every indexable page self-canonicalises; every private page is
  `index: false`. **Do not propose a canonical audit.**
- OG images: `src/app/opengraph-image.tsx`, plus route-level ones for `/champions`,
  `/champions/[pokemon]`, `/explore`, `/s/[id]`.
- `llms.txt` **and** `llms-full.txt` both exist. `llms.txt`'s SP definition is already correct
  (4 EVs for the first SP, 8 thereafter; 66 total / 32 cap) — so **VGC-266 appears done for `llms.txt`**.
  See §4.1 for the file that is still wrong.

---

## 1. Competitor teardown

> Sourced from search snippets + indexed URLs only; the domains themselves were egress-blocked.

### 1.1 Pikalytics (pikalytics.com)

- **What it does:** usage aggregation. Pokémon usage rankings, movesets, Tera types, EV/SP spreads,
  abilities, items, teammates, across Champions, Reg Set I, BSS, Smogon OU/Ubers.
- **Indexed surface:** `/`, `/champions`, `/team` (team builder), `/team-usage`, `/speed-tiers`,
  `/pokedex/{format}`, `/pokedex/{format}/{Pokemon}`. The per-Pokémon-per-format URL template is the
  engine — it scales to thousands of pages with a real title/H1 each.
- **Sharing/report UX:** "Top Teams Gallery" — browse and copy winning compositions with W/L records
  and event placement. Copy-out, not author-in.
- **Monetization:** "Advertise on Pikalytics" (display ads) + a native mobile app pitched at live-event
  players ("between rounds, unreliable venue Wi-Fi").
- **Does better than a paste-to-report tool:** (a) it answers *"what should I play"*, we answer
  *"here is what I played"* — theirs is the higher-intent, higher-volume query; (b) an offline-capable
  app for the tournament floor; (c) a programmatic URL template that mints a ranking page per
  species per format, automatically, every rotation.
- **Currency:** their homepage title is literally *"Pokemon Champions VGC 2026 Reg M-C"*. See §2.1.

### 1.2 PokePaste (pokepast.es)

- **What it does:** pastebin for Showdown exports. Paste in, get a permanent URL. Plain text, sprites
  minimal, no accounts, no analytics, no social preview image.
- **Monetization:** none visible. It is infrastructure, not a business.
- **Does better:** *ubiquity and trust*. It is the default noun ("send me your paste"). Every tool in
  the space, including ours (`src/app/api/pokepaste/route.ts`), imports from it. Its URL is short,
  permanent, and never breaks. That habit is the moat — a competitor that wins is one that *accepts*
  pokepast.es links rather than asking people to change tools.

### 1.3 crob.at — **the closest direct competitor, and it is not on the brief's list**

This is the single most important competitive find.

- **What it does:** "Visual Pokémon Showdown Team Sharing." Paste Showdown text *or* a pokepast.es URL,
  get a visual page with sprites, item icons, movesets, and an auto-generated social preview image.
  Multi-team support in one link. Free, no login.
- **Indexed surface — a deliberate SEO architecture that maps one-to-one onto our positioning:**
  - `crob.at/pokepaste-alternative` — "Best PokePaste Alternative: Visual Team Sharing"
  - `crob.at/guide/share-showdown-teams` — "How to Share a Pokémon Showdown Team"
  - `crob.at/pokepaste` — importer landing page
  - `crob.at/teams`, `/teams/vgc` ("Reg M-C Teams to Copy & Paste"), `/teams/champions`,
    `/teams/gen9ou`, `/teams/nationaldex` — format hubs
- **Monetization:** none visible.
- **Does better:** it has *named the job* in URL form. When an AI assistant is asked "how do I share a
  VGC team" or "what's a PokePaste alternative", crob.at supplies a page whose title is the literal
  question. We supply `/` and a buried FAQ row. Their step-by-step ("Teambuilder → Import/Export →
  copy → paste → Create Team → copy link") is exactly the extractable answer shape LLMs quote.

### 1.4 VGCPastes (@VGCPastes / Google Sheets)

- **What it does:** a community-curated Google Sheet of tournament pastes, ~195 teams added per major
  batch, contributed by named volunteers, cross-linked to Victory Road for rental codes.
- **Sharing UX:** the spreadsheet *is* the product. Filter by Pokémon/event/regulation, click through
  to pokepast.es.
- **Monetization:** none. Social capital, run through X.
- **Does better:** *distribution and recency*. A tweet announcing "195 new teams from Bologna, Japan
  Nationals, Lima, Mexico City, LA, Santiago" reaches the whole community same-day. They have no SEO
  to speak of (a Sheet does not rank) but they own the *supply* of teams and the community's attention.
  We compete for the same supply and will lose on speed unless we ingest rather than solicit.

### 1.5 Limitless VGC (limitlessvgc.com / play.limitlesstcg.com)

- **What it does:** two things. `play.limitlesstcg.com` is Swiss tournament-running software with
  decklist submission (VGC, TCG, One Piece, Digimon). `limitlessvgc.com` is the results database:
  tournament results, player profiles, usage statistics, teamlists.
- **Monetization:** prize-pool events (e.g. Grand Champions Festival, $10k / top 16), which implies
  sponsorship; platform is free to enter.
- **Does better:** it is **upstream of the data**. Because organisers run events on Limitless, teamlists
  arrive as structured submissions, not scraped text. That yields authoritative, citable,
  player-attributed results that everyone else (including us — `src/data/indy-top-cut.ts` is hand-authored)
  has to copy downstream. Player profile pages also give it a durable entity graph.

### 1.6 Trainer Hill (trainerhill.com)

- **Correction to the brief:** Trainer Hill is a **Pokémon TCG / TCG Pocket** analytics hub —
  meta trends, decklists, matchup win rates, card usage, plus `plus.trainerhill.com` ("Battle Journal+",
  match tracking with going-first/second splits) and `tools.trainerhill.com`. Search surfaced **no VGC
  product**. It is not a competitor for VGC keywords.
- **Worth stealing anyway:** the *Battle Journal+* concept — logged matches → personal win rate vs. the
  meta → "which decks you struggle against." We already have `src/app/api/match-log/route.ts`; this is
  the productised, SEO-visible version of it.

### 1.7 New entrants the brief did not list (all surfaced in "best VGC team builder" results)

`PokeSynergy` (pokesynergy.app — `/teams`, `/speed-tiers`, live meta threats, SP-aware),
`MetaVGC` (metavgc.com — `/regulations/regulationm-c`, usage stats + rental pastes),
`PokemonBuilder` (pokemonbuilder.com — simulation-backed archetype win rates, "8.7M simulations"),
`RotomLabs` (`/champions/stat-converter`), `ChampDex` (`/tools/ev-converter`, `/guides/stat-points`,
`/guides/format-rules`), `ChampsDex`, `ChampCalc`, `VR Pastes`, `VGC Helper`, `vgcdata-speed-tiers`,
`Pokémon Zone` (`/champions/speed-tiers`, `/champions/regulations/m-c`), `Victory Road`, `teamsheet.gg`.

**The Champions-era tool space got crowded fast, and it crowded specifically around SP, speed tiers,
and regulation explainers** — the three things our codebase is uniquely good at and our URL map barely exposes.

---

## 2. Top 10 keyword / content gaps

Every row was grepped before listing. "Verified missing" = confirmed absent from `src/` and `public/`.

### 2.1 — Regulation M-C (the whole format) — **VERIFIED MISSING, and it is the #1 item**

Reg Set M-C runs **8 Sep 2026 → 1 Dec 2026** (pokemon.com). Purely additive over M-B: **24 new Pokémon,
6 new Megas** including three "Z Megas" (Mega Absol Z, Mega Garchomp Z, Mega Lucario Z) plus Mega
Salamence, Mega Golisopod, Mega Baxcalibur.

Repo state — `grep -rn "M-C"` across `src/` and `public/` returns **one hit, and it is a comment**:
`src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts:25` ("so the next rotation (M-C)
can't silently repeat it"). Otherwise:
- `src/lib/data/champions-dex.ts` tops out at `CHAMPIONS_REG_MB_DEX`
- `src/lib/data/mega-pokemon.ts` exports only `CHAMPIONS_REG_MA_MEGAS` / `CHAMPIONS_REG_MB_MEGAS` /
  `getRegMBMegas()` / `getRegMBMegasWithSprites()`
- `src/lib/validation/champions-legality.ts` validates M-A/M-B only
- `src/app/champions/page.tsx:13` title: `"Pokemon Champions Format | Reg M-B & M-A Mega Teams"`
- `public/llms.txt` says "Regulation M-A"; `llms-full.txt` likewise

**Correctness bug, not just SEO:** `src/lib/data/__tests__/champions-dex.test.ts:58` asserts
`CHAMPIONS_DEX.has("salamence") === false`. Mega Salamence is M-C-legal, so the legality validator will
now reject legal teams and `SpeedTierChart.tsx:45` already lists `"salamence-mega"` as a known mega —
the data layers disagree.

Competitors already carrying M-C in indexed titles: Pikalytics `/` ("Reg M-C"), MetaVGC
`/regulations/regulationm-c`, Pokémon Zone `/champions/regulations/m-c` and its speed-tier page
("every Regulation M-C-legal Pokémon"), crob.at `/teams/vgc` ("Reg M-C Teams"), Game8, Victory Road,
Stratadex, TheClick, Vice.

Keywords forfeited: `regulation m-c`, `pokemon champions m-c`, `m-c legal pokemon`, `mega salamence
champions`, `z mega`, `mega garchomp z`, `reg m-c speed tiers`, plus 6 new `/champions/[pokemon]` SSG pages.

### 2.2 — Standalone speed-tier page — **VERIFIED MISSING**

`src/components/report/SpeedTierChart.tsx` exists but only renders inside a report. There is **no**
`src/app/tools/speed-tiers` (verified). Competitors ranking: Pikalytics `/speed-tiers`, PokeSynergy
`/speed-tiers`, Pokémon Zone `/champions/speed-tiers`, `vgcdata-speed-tiers.pages.dev/?reg=m-c`,
GameWith `/pokemon-champions/en/speed-calculator`, plus two Smogon resource threads (M-A, M-B).
Keywords: `vgc speed tiers`, `champions speed tiers`, `regulation m-c speed tiers`,
`speed tier calculator pokemon`, `choice scarf speed vgc`, `tailwind speed tiers`.

### 2.3 — `/tools` hub — **VERIFIED MISSING**

`src/app/tools/page.tsx` does not exist. `/tools/ev-to-sp` is an orphan: its own breadcrumb JSON-LD
(`page.tsx:122-127`) jumps Home → EV to SP Converter, skipping the missing parent. One footer link
(`PageFooter.tsx:17`) is its only internal inbound link. Any second tool makes the hub mandatory.

### 2.4 — Comparison / "alternative" pages — **VERIFIED MISSING**

`grep -ri "pokepaste-alternative"` = 0 hits. No `/vs/` segment. `/compare` is a team-diff tool and is
`robots: { index: false }`. The only comparison content on the whole site is one FAQ row
(`src/app/faq/page.tsx:61`, "How is VGC Team Report different from PokéPaste or VGC.tools?").
crob.at owns `/pokepaste-alternative` outright. Keywords: `pokepaste alternative`, `crob.at alternative`,
`pikalytics alternative`, `best way to share a pokemon team`, `pokepaste vs`.

### 2.5 — How-to / guide route — **VERIFIED MISSING**

No `src/app/guides`, no `src/app/blog` (VGC-227/VGC-90 cover the blog route; a `/guides/` evergreen
tree is a *different* shape and is not in the ticket list). `HowToSchema` exists in
`src/components/seo/JsonLd.tsx` and is already applied to `/` and `/faq` — the schema is built, the
pages to hang it on are not. crob.at `/guide/share-showdown-teams` and ChampDex `/guides/stat-points`,
`/guides/format-rules` are the pages currently answering these.

### 2.6 — Glossary / concept pages — **VERIFIED MISSING**

No `src/app/glossary`. The word "glossary" appears once in the whole repo: a heading inside
`public/llms-full.txt:109`. Terms we define nowhere as indexable pages but explain well internally:
SP, Open Team Sheet (OTS), speed tier, restricted, item clause, species clause, tera, regulation,
rental code, spread, EV, IV, nature, bulk, trick room, redirection.

### 2.7 — Per-species / per-format usage pages — **VERIFIED MISSING (partially ticketed)**

Pikalytics' `/pokedex/{format}/{Pokemon}` template is the highest-leverage programmatic surface in the
category. We have `src/app/api/champions/meta/route.ts` and `src/components/champions/MetaSnapshot.tsx`
— the data exists, it has no URLs. **VGC-217** covers per-species *EV-spread* landing pages; the
per-species *usage/meta* page is adjacent but distinct. Do not duplicate VGC-217.

### 2.8 — Localised surfaces — **VERIFIED MISSING**

`src/lib/i18n/translations/` ships **7 full locales** (en, fr, it, es, ja, ko, zh, per
`LANGUAGES` in `src/lib/i18n/index.ts`). But `I18nProvider` is `"use client"` and persists to
`localStorage` (`STORAGE_KEY = "vgc-report-lang"`); there is **no `[locale]` route segment**
(`find src/app -maxdepth 1 -type d` confirms), **no `alternates.languages`/hreflang anywhere**
(`grep -rn "languages\|hreflang" src/app/` = 0 hits), and the sitemap emits no alternates.
Seven translated UIs with zero crawlable surface. The Japanese, Italian and Spanish VGC communities
are large and comparatively under-served by the English tool cluster.

### 2.9 — Match/result tracking as content — **MISSING as a page**

`src/app/api/match-log/route.ts` exists; no public route surfaces it. Trainer Hill's Battle Journal+
("going first vs second", "which decks you struggle against") shows the content shape.
Keywords: `vgc match log`, `pokemon win rate tracker`, `vgc practice tracker`.

### 2.10 — Rental codes — **VERIFIED MISSING**

`grep -ri "rental"` across `src/` returns nothing. VGCPastes explicitly routes users to Victory Road
"for teams **that have Rental Codes**" — rental code is the field that makes a Champions-era paste
*usable in-game*, and it is the reason traffic leaves the paste ecosystem. Keywords:
`pokemon champions rental codes`, `vgc rental team`, `champions rental team code`.

---

## 3. What the ticket backlog already covers (referenced, not re-proposed)

| Ticket | Repo check |
|---|---|
| VGC-262 standalone EV→SP page | **Appears shipped** — `src/app/tools/ev-to-sp/` is complete. Close or re-scope. |
| VGC-217 per-species EV-spread landings | Verified missing. Complements §2.7; keep them distinct. |
| VGC-227 `/blog/[slug]` + Reg M-A meta post | `src/app/blog` verified missing. Note: the first post should be **M-C**, not M-A (§2.1). |
| VGC-258 `/champions` index missing 14 M-B pages | **Appears shipped** — `getRegMBMegas()` + `CHAMPIONS_REG_MB_ONLY_MEGAS` section. |
| VGC-275 `/s/[id]` thin client redirect | Confirmed a concern: `generateMetadata` is rich but the page body is thin; this is the largest indexed page class in the sitemap (up to 5000 URLs). |
| VGC-266 llms.txt SP definition | `public/llms.txt` is **already correct**. `llms-full.txt` is **not** — see §4.1. |
| VGC-272 robots.txt groups | **Shipped** — single wildcard group with inheritance comment. |
| VGC-90 blog tutorial, VGC-62 archetype guides | Verified missing; overlap with §2.5/§2.6 — scope guides/glossary around them. |

---

## 4. AEO / GEO: who gets cited, and why

### 4.0 Observed citation behaviour

Run against live search (Sept 2026):

| Query | Who surfaces | Do we? |
|---|---|---|
| "best VGC team builder 2026" | Pikalytics `/team`, PokemonBuilder, PokeSynergy, MetaVGC | **Yes** — `pokemonvgcteamreport.com/explore` ranked ~3rd, but summarised last and blandly ("browse and share VGC team reports… and tools") |
| "how to share a VGC team Showdown paste link" | crob.at `/guide/share-showdown-teams`, VR Pastes, pokepast.es | **No** |
| "PokePaste alternative" | crob.at `/pokepaste-alternative`, VR Pastes, VGC Helper | **No** |
| "EV to SP converter 66 budget" | RotomLabs, ChampDex, ChampCalc, ChampsDex, Switchblade | **No** — despite `/tools/ev-to-sp` existing |
| "VGC speed tiers Champions Reg M" | Pikalytics, Pokémon Zone, PokeSynergy, vgcdata, GameWith, Smogon ×2 | **No** |

The pattern is unambiguous. **We get cited exactly where we have a page whose `<title>` is the query
string** (`/explore` → "Best VGC Teams 2026"). We are invisible for every query where the answer lives
inside a component, an FAQ row, or a file the model never reads. AEO here is not a schema problem —
it is a *URL-and-title* problem.

Secondary signal: `/tools/ev-to-sp` exists with correct content and still does not surface. It has one
internal inbound link (the footer) and no parent hub, so it reads as an orphan. Internal linking is the
binding constraint on that page, not its markup.

### 4.1 — `llms-full.txt` states the SP rule **incorrectly**, and it is the file AI crawlers read most

`public/llms-full.txt:91`:

> **SP (Stat Points or Standard Points)** is an alternative notation sometimes used in team reports and
> competitive coaching content — particularly in some international communities — where **1 SP = 1 EV.
> The terms are interchangeable.** If you see a Pokémon listed with "252 SP Atk" it means the same thing
> as "252 EVs in Attack".

Every clause of that is wrong, and it directly contradicts `public/llms.txt`, which is correct
("the first SP in a stat costs 4 EVs and every SP after that costs 8… 66 SP total… max 32 per stat"),
and contradicts the code of record, `evToChampionsSp` in `src/lib/analysis/stat-calculator.ts`.

This is worse than a missing page: it is an authoritative-looking file, on our own domain, feeding an
LLM a definition that makes our own product look wrong. **VGC-266 names `llms.txt` only, and `llms.txt`
is already fixed** — so this is very likely still open and unowned. It also predates M-B/M-C: the file
still describes Champions as "Regulation M-A".

### 4.2 Concrete, shippable AEO changes

Ranked by citation-lift per hour. Each was grepped first.

1. **Fix `llms-full.txt`** (§4.1). ~30 min. Correct the SP entry to match `stat-calculator.ts`, refresh
   the `Updated:` date (currently `2026-05-23` in `llms.txt`), add M-B and M-C, add the new `/tools/ev-to-sp`
   and any new routes to the URL list. Add a vitest that asserts the documented conversion matches
   `evToChampionsSp` so it cannot drift again — the `/tools/ev-to-sp` page already does exactly this with
   its `COMMON_EV_VALUES` table; reuse that pattern.
2. **A page per question, titled as the question.** `/guides/share-a-vgc-team`,
   `/compare/pokepaste-alternative` (or `/vs/pokepaste`), `/tools/speed-tiers`. Each with `HowTo` or
   `FAQPage` JSON-LD — both generators already exist in `src/components/seo/JsonLd.tsx`, unused outside
   `/`, `/faq`, `/champions/[pokemon]` and `/tools/ev-to-sp`.
3. **Answer-first page bodies.** LLMs quote the first extractable block. Lead every new page with a
   numbered procedure or a definition sentence before any UI chrome — crob.at's five-step share
   procedure is the format that is currently being quoted verbatim.
4. **Glossary with `DefinedTerm` / `DefinedTermSet` JSON-LD.** No `DefinedTerm` anywhere in the repo
   (verified). One page, ~15 terms, each an `#anchor` — anchors are what assistants cite.
5. **Internal linking.** Build `/tools` as a hub and link it from `PersistentNavbar`
   (`src/components/layout/PersistentNavbar.tsx` currently has no `/tools` link — only `PageFooter.tsx:17`
   does). Cross-link `/faq` answers to their new dedicated pages.
6. **Structured data we do not emit** (all verified absent): `Dataset` (for `/explore` and any usage
   page — signals "citable data source"), `BlogPosting`/`Article` (needed by VGC-227),
   `DefinedTerm`, `ItemList` on `/explore` results, `alternates.languages`/hreflang.
   `AggregateRating`/`Review` are absent too but should stay absent — no genuine ratings exist.
7. **Do not touch:** robots.txt (VGC-272 done, and the single-group structure already allows GPTBot,
   ClaudeBot, PerplexityBot via the wildcard), canonicals (all clean), OG images (5 route-level
   generators shipped).

---

## 5. Verification ledger

**Verified missing** (grepped `src/` + `public/`, absence confirmed):
`/tools/page.tsx` · `/tools/speed-tiers` · `/tools/damage-calc` · `/glossary` · `/guides` · `/blog` ·
`/vs/*` · `/teams` · `/pokemon/*` · any `M-C` data/dex/legality/metadata · "rental" (0 hits) ·
"pokepaste-alternative" (0 hits) · `hreflang` / `alternates.languages` (0 hits) · `DefinedTerm` (0 hits) ·
`BlogPosting` (0 hits) · `Dataset` schema (0 hits — the string only appears as an unrelated identifier) ·
`AggregateRating` (0 hits) · any `[locale]` route segment.

**Verified present** (so deliberately *not* recommended):
`/tools/ev-to-sp` full build · M-B coverage on `/champions` + sitemap · single-group robots.txt ·
self-canonicals on every indexable route · `index: false` on all private/auth/embed routes ·
5 route-level OG image generators · `FAQPage` / `HowTo` / `BreadcrumbList` / `SportsEvent` /
`CollectionPage` / `ProfilePage` / `CreativeWork` / `ItemList` / `Organization` / `WebSite`+`SearchAction`
/ `WebApplication` JSON-LD · `llms.txt` with a correct SP definition · 7 i18n locale bundles.

**Could not verify** (state clearly as unverified downstream):
- Anything about the live production site — `pokemonvgcteamreport.com` is proxy-blocked from this
  container. All claims above are about the repo at `HEAD` of `claude/loving-sagan-sp9n85`
  (tip `70c4633`), not about what is currently promoted to production.
- First-party competitor page content — pikalytics.com, pokepast.es, limitlessvgc.com and crob.at were
  all `EGRESS_BLOCKED` for WebFetch. Competitor features, URL structures and monetization are inferred
  from search-result titles, URLs and snippets. Treat specific feature claims as ~80% confidence; treat
  the *URL structures* as high confidence (they appear as indexed result URLs).
- Actual search volume, ranking positions and traffic. No Search Console / keyword-tool access here.
  "Gap" means "competitors have an indexed page and we have no page", not a measured volume estimate.
- Whether VGC-262 / VGC-258 / VGC-272 / VGC-266 were closed — Linear MCP is unauthenticated in this
  session. I compared the ticket *titles* in the brief against repo state; confirm in Linear before acting.
- Exact M-C dex contents. The 24 species / 6 Megas figures come from news coverage
  (pokemon.com, Game8, Pokémon Zone, Vice), not from a rules PDF or `@pkmn/dex`. Pull the authoritative
  list from `@pkmn/dex` (already a dependency, per `src/lib/data/mega-pokemon.ts:327`) before encoding it.

---

## Sources

- [Pikalytics](https://www.pikalytics.com/) · [Champions](https://www.pikalytics.com/champions) · [Team builder](https://www.pikalytics.com/team) · [Team usage](https://www.pikalytics.com/team-usage) · [Speed tiers](https://www.pikalytics.com/speed-tiers) · [Pokedex](https://www.pikalytics.com/pokedex/homebsd)
- [crob.at](https://crob.at/) · [PokePaste alternative](https://crob.at/pokepaste-alternative) · [Share guide](https://crob.at/guide/share-showdown-teams) · [Importer](https://crob.at/pokepaste) · [VGC teams](https://crob.at/teams/vgc) · [Champions teams](https://crob.at/teams/champions)
- [Limitless VGC](https://limitlessvgc.com/) · [Limitless tournaments](https://play.limitlesstcg.com/tournaments/?game=VGC)
- [Trainer Hill](https://www.trainerhill.com/) · [About](https://www.trainerhill.com/about) · [Battle Journal+](https://plus.trainerhill.com/)
- [VGCPastes on X](https://x.com/VGCPastes/status/1501920966061932546) · [DevonCorp VGC resources](https://devoncorp.press/short-form-content/up-to-date-vgc-resources)
- [Reg M-C announcement (pokemon.com)](https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions) · [Pokémon Zone M-C](https://www.pokemon-zone.com/champions/regulations/m-c/) · [Game8 M-C roster](https://game8.co/games/Pokemon-Champions/archives/618064) · [Victory Road regulations](https://victoryroad.pro/champions-regulations/)
- [Pokémon Zone speed tiers](https://www.pokemon-zone.com/champions/speed-tiers/) · [VGCData speed tiers](https://vgcdata-speed-tiers.pages.dev/?reg=m-c) · [Smogon Reg M-B speed tiers](https://www.smogon.com/forums/threads/vgc-regulation-m-b-speed-tiers.3784081/)
- [RotomLabs stat converter](https://rotomlabs.net/champions/stat-converter) · [ChampDex EV converter](https://champdex.com/tools/ev-converter) · [ChampDex stat points guide](https://champdex.com/guides/stat-points) · [ChampCalc](https://champ-calc.vercel.app/)
- [PokeSynergy](https://pokesynergy.app/) · [MetaVGC M-C](https://metavgc.com/regulations/regulationm-c) · [PokemonBuilder](https://pokemonbuilder.com/pokemon-vgc-builder) · [VR Pastes](https://www.vrpastes.com/) · [VGC Helper](https://vgchelper.com/)
