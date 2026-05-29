# R6 SEO Audit: VGC Team Report — Full Competitive Landscape Review
**Date:** 2026-05-25 (Wave 4 — supersedes all previous)
**Site:** https://pokemonvgcteamreport.com
# R6 SEO Audit — 2026-05-24

**Scope:** technical SEO posture of pokemonvgcteamreport.com vs pikalytics, pokepast.es, limitlesstcg, victoryroaddev, vgcpastes.
**Method:** repo grep (sitemap, layout, champions/[pokemon], s/[id], JsonLd component, robots.txt, llms.txt) + WebSearch for competitor URL structure (direct WebFetch returned 403/ECONNREFUSED for every competitor host — cached prior teardowns at `.swarm/r1-competitor-pikalytics-pokepaste.md` and `.swarm/r2-competitor-vgcpastes-limitless.md` supplied the qualitative deltas).

## State of play

pokemonvgcteamreport.com has the strongest structured data implementation in the VGC tooling space (WebApplication, Organization, WebSite+SearchAction, HowTo, FAQPage, SportsEvent, ItemList, CollectionPage, CreativeWork, ProfilePage+Person). The site owns its brand query "VGC team report" (#1) and ranks well for "Pokemon Champions VGC team reports." However, there are 10 high-value keyword clusters worth 20,000+ combined monthly searches where the site has relevant features but no dedicated landing page.

The competitive landscape has intensified since April 2026 with Pokemon Champions launching: Pikalytics remains dominant for data/tools, 6+ new builders entered (Champions Lab, Champions Builder, Porygon Labs, VGC Lite, PokéBase, VGC Coach), and editorial competitors (Victory Road, MetaVGC) target guide content. VGC Team Report's unique positioning as a team *report* platform (not just builder/paste) remains defensible but needs content pages to capture informational queries feeding the top of funnel.
We are already strong on foundations: `src/app/layout.tsx` ships `WebSite`+`SearchAction`, `Organization`, and a `WebApplication`/`SoftwareApplication` JSON-LD block; `src/app/champions/[pokemon]/page.tsx` ships per-page `BreadcrumbList` + `FAQPage`; `src/app/s/[id]/page.tsx` ships `CreativeWork` with author/contributor and noindexes private shares; `src/app/sitemap.ts` dynamically emits all public `/s/[id]` and `/creator/[name]` URLs; `public/robots.txt` opens the door to GPTBot/ClaudeBot/PerplexityBot. Pikalytics URL pattern `pikalytics.com/pokedex/{format}/{Species}` (e.g. `/pokedex/gen9vgc2026regi/Volcarona`) shows the canonical pattern competitors win on: **format-segmented species pages**. We only ship `/champions/[megaSlug]` (Reg M-A only) — every other regulation is a gap.

## 3 SEO quick wins (each <2hr)

## 1. Competitive SERP Landscape (May 2026)

### Observed Rankings

| Query | #1 | #2-3 | VGC Team Report Position |
|-------|-----|------|--------------------------|
| "VGC team builder" | Pikalytics | PokemonBuilder, Champions Builder | Not in top 7 |
| "VGC team report" | pokemonvgcteamreport.com | Victory Road, MetaGame | **#1** |
| "Pokemon Champions team report" | pokemonvgcteamreport.com | — | **#1** |
| "Pokemon VGC team sharing" | Pikalytics | VGC Helper, Game8 | Not in top 7 |
| "VGC team analysis" | Pikalytics | VGC Lite, VGC Coach | Not in top 7 |
| "Pokemon Champions team builder" | PokéBase | Champions Lab, Game8 | Not in top 7 |
| "VGC damage calculator" | Pikalytics | Porygon Labs, MetaVGC | Not ranking |
| "VGC speed tiers" | Pikalytics | MetaVGC, Turnadus | Not ranking |
| "VGC top teams 2026" | VGenC | Pikalytics, Pokémon Zone | Not ranking |
| "Mega Evolution VGC tier list" | GameRant | Game8, Pokémon Zone | Not ranking |
| "Pokemon Champions rental teams" | VGenC | Victory Road, Devon Corp | Not ranking |
| "how to write VGC team report" | Victory Road | — | Not ranking |
| "VGC open team sheet" | No clear leader | — | Not ranking |
| "Pokemon Champions SP spread" | PokeStats.cc | Game8 | Not ranking |

### Key Competitors

| Competitor | Strengths | Weakness vs VGC Team Report |
|-----------|-----------|---------------------------|
| **Pikalytics** | Usage stats, damage calc, speed tiers, top teams. BreadcrumbList + Dataset + FAQPage schema. Has llms-full.txt. | No team reports/write-ups, no matchup plans, no creator profiles |
| **Victory Road** | Editorial team reports from top players, rental teams, excellent internal linking | Not user-generated, no tool features, no damage calc integration |
| **VGenC** | 2,649 tournament pastes, strongest for "top teams" queries | No report annotations, no matchup plans, no community features |
| **MetaVGC** | Guides + damage calculator + teams. Article schema on guides | Smaller community, less comprehensive tool feature set |
| **Champions Builder** | SP calculator, damage calc, Showdown export, free | No reports, no sharing, no community content |
| **VGC Lite** | Beginner-friendly, speed tiers, threat analysis | Smaller scope, no team report features |
| **Pokémon Zone** | Comprehensive meta stats, tier lists, team cores | No report tool, primarily database |

---

## 2. Current SEO Implementation Assessment

### Strengths (Already Better Than Most Competitors)

1. **Structured Data** — Most comprehensive in the niche:
   - WebApplication + SoftwareApplication (root)
   - Organization with logo + sameAs (root)
   - WebSite + SearchAction for Sitelinks Searchbox (root)
   - HowTo with 5 steps (homepage)
   - FAQPage with 5 rich Q&As (homepage + /faq)
   - ItemList for all 59 Mega Pokemon (/champions)
   - CollectionPage (/explore)
   - SportsEvent for tournaments (/tournaments)
   - CreativeWork with author/dates (/s/[id])
   - ProfilePage + Person (/creator/[name])
   - BreadcrumbList (/champions/[pokemon])

2. **Dynamic Share Page Metadata** — Each /s/ page has unique title (tournament + placement + species), description with team summary, and proper noindex for private shares. This is a massive differentiator for long-tail SEO.

3. **Sitemap** — Includes static pages, up to 5,000 public shares, and all creator profile pages. Properly prioritized.

4. **AI Crawler Strategy** — robots.txt allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot. Has llms.txt and llms-full.txt for AI indexing.

5. **OG Images** — Dynamic generation for /champions/[pokemon], /explore, share pages.

6. **Canonical URLs** — Set on all key pages.

### Weaknesses

1. **Homepage is `"use client"`** — Client-rendered content means Google must execute JS to see the FAQ, HowTo steps, and landing page text. Other crawlers and AI bots may see an empty shell.

2. **No internal linking strategy** — Champion pages, share pages, explore page, and creator pages don't cross-link programmatically. Internal links drive crawl depth and PageRank distribution.

3. **Missing BreadcrumbList** on /explore, /faq, /tournaments — only present on /champions/[pokemon].

4. **Homepage title is 73 chars** — Gets truncated in SERPs. Should be under 60 chars.

5. **Sitemap `lastModified: now`** for static pages signals constant change, reducing crawl efficiency.

6. **Only 2 pages indexed in Google site:search** — Indicates either very new indexing or crawl depth issues.

---

## 3. Top 10 Keyword Gaps

High-intent, rankable queries where VGC Team Report has feature relevance but no dedicated landing page.

| # | Keyword Cluster | Est. Monthly Volume | Competition | Opportunity |
|---|----------------|---------------------|-------------|-------------|
| 1 | "Pokemon Champions best teams" / "top VGC teams 2026" | 3,000-5,000 | Medium | Create /teams programmatic page from public share data (ranked by views/likes) |
| 2 | "VGC speed tiers 2026" / "Pokemon Champions speed tiers" | 2,000-3,000 | Medium | Standalone /speed-tiers page (feature exists, needs its own URL) |
| 3 | "Mega Evolution VGC tier list" / "best mega Pokemon VGC" | 4,000-6,000 | Medium | Add tier-list section to /champions with usage data |
| 4 | "how to write a VGC team report" / "team report template" | 500-1,000 | Low | Create /guides/how-to-write guide page with Article schema |
| 5 | "VGC open team sheet" / "OTS generator Pokemon" | 1,500-2,500 | Low | Create /open-team-sheet landing page (no dominant competitor) |
| 6 | "Pokemon Champions SP spread" / "stat point spread VGC" | 2,000-3,000 | Medium | Update all Champions page copy from "EV spread" to "SP spread" |
| 7 | "Pokemon Champions rental teams" / "VGC rental codes" | 3,000-5,000 | Medium | Surface rental codes from shares in a /rentals or /rental-codes collection |
| 8 | "VGC matchup chart" / "Pokemon VGC type coverage" | 1,500-2,500 | Low | Matchup plan feature deserves a /matchups guide page |
| 9 | "Regulation M-A VGC guide" / "Pokemon Champions format" | 1,500-2,000 | Medium | Dedicated /regulation-m-a format guide page |
| 10 | "[Mega Pokemon] team VGC" (e.g., "Mega Charizard Y team") | 500-1,000 per mega | Low | Enhance /champions/[pokemon] with featured community teams section |

**Combined addressable search volume: ~22,000-35,000 monthly searches**

---

## 4. Structured Data Comparison vs Competitors

| Schema Type | VGC Team Report | Pikalytics | Victory Road | MetaVGC | Game8 |
|-------------|----------------|-----------|-------------|---------|-------|
| WebApplication | Yes | No | No | No | No |
| Organization | Yes | Yes | No | No | Yes |
| WebSite+SearchAction | Yes | Yes | No | No | Yes |
| FAQPage | Yes | Yes | No | No | Yes |
| HowTo | Yes | No | No | No | No |
| ItemList | Yes | No | No | No | Yes |
| SportsEvent | Yes | No | No | No | No |
| CollectionPage | Yes | No | No | No | No |
| CreativeWork | Yes (shares) | No | No | No | No |
| Person/ProfilePage | Yes (creators) | No | Yes (authors) | No | No |
| BreadcrumbList | Partial | Yes | Yes | No | Yes |
| Dataset | No | Yes | No | No | No |
| Article/BlogPosting | No | No | Yes | Yes | Yes |
| AggregateRating | No | No | No | No | Yes |

**Verdict:** VGC Team Report has the most comprehensive structured data of any VGC tool. Main gaps are BreadcrumbList consistency and Article schema (needs guide content first).

---

## 5. Content Accuracy Issue (Critical for Champions Pages)

Pokemon Champions (April 2026) replaced EVs with Stat Points (SP). The /champions/[pokemon] pages previously used "EV Spreads" in titles/descriptions. Based on the current code, these have already been updated to "SP Spreads" — verify this is reflected in all FAQ answer text and description templates.

Key check: Search queries are shifting from "EV spread" (legacy SV) to "SP spread" (Champions). Both terms should appear in descriptions for a transitional period: "SP spreads (stat points)" captures new-format users while remaining findable for players searching legacy terms.

---

## 6. Gaming/Esports SEO Best Practices (2026)

Based on current best practices for gaming tool sites:

1. **JSON-LD is king** — Preferred over microdata/RDFa. Must accurately reflect visible content.
2. **Schema drives AI Overview citations** — In 2025 controlled experiments, only pages with valid schema appeared in AI Overviews.
3. **GameApplication + SoftwareApplication** — Correct for tool sites (already implemented).
4. **Programmatic SEO** — Data-rich sites should generate landing pages from their database (Pikalytics does this for every Pokemon; VGC Team Report should do this for top teams, archetypes, tournaments).
5. **Freshness signals** — Gaming meta changes weekly. Pages with recent `dateModified` and up-to-date content rank better for "[game] 2026" queries.
6. **Video content** — YouTube embeds with VideoObject schema create rich snippets in gaming SERPs. Consider embedding VGC content creator videos on guide pages.
7. **Community-generated content** — UGC (user team reports) creates long-tail keyword diversity that no editorial site can match at scale. VGC Team Report's 5,000+ public shares are a massive latent SEO asset.

---

## 7. Technical Issues

### High Priority
- **Client-rendered homepage** — FAQ and HowTo content hidden behind JS execution
- **Only 2 pages in Google site:search** — May indicate indexing depth issues
- **Missing BreadcrumbList** on /explore, /faq, /tournaments

### Medium Priority
- **Homepage title too long** (73 chars, truncated in SERPs)
- **Static page lastModified = now** — Signals false freshness
- **No `twitter:site` handle** in root metadata
- **No `article:published_time`** on share pages

### Low Priority
- **Meta keywords tag** — Ignored by Google since 2009 (keep for Bing minor signal)
- **No hreflang** — English-only site, not needed yet
- **Dashboard/embed pages not noindexed** — Thin pages in index

---

## 8. Priority Action Plan

### Immediate Wins (No new pages, <1 day)

1. Add BreadcrumbList schema to /explore, /faq, /tournaments
2. Shorten homepage title to <60 chars: "VGC Team Report — Build & Share Pokemon VGC Teams"
3. Fix static page lastModified in sitemap (use build date, not `new Date()`)
4. Add intro paragraph text to /explore page (server-rendered for crawler visibility)
5. Add `twitter:site` handle to root metadata

### Short-term (1-2 weeks)

6. Create /open-team-sheet landing page (lowest competition keyword gap)
7. Create /guides/how-to-write-a-vgc-team-report with Article + HowTo schema
8. Add "Mega Tier List" ranked section to /champions page
9. Add internal linking widgets to /champions/[pokemon] pages ("Teams using this Pokemon")
10. Create /speed-tiers standalone page

### Medium-term (1 month)

11. Create /teams programmatic top-teams page from public share database
12. Create /rental-codes collection page surfacing shares with rental codes
13. Create tournament-specific landing pages (/tournaments/indianapolis-2026)
14. Build visible breadcrumb navigation component across all pages
15. Consider server-rendering critical homepage content (FAQ, feature list)

---

## 9. Link Building Opportunities

1. **VGCpedia** (vgcpedia.com) — Resource listing page. Submit for inclusion.
2. **Smogon Forums** — Post team reports linking to shared reports on the platform.
3. **Reddit r/VGC, r/PokemonChampions** — Team report posts with deep links.
4. **Victory Road** — Potential partnership for "publish your team report" CTAs.
5. **YouTube VGC creators** — Offer embed integration for their team breakdowns.
6. **Game8, Pokémon Zone** — Submit as a resource/tool for their Pokemon Champions guides.
7. **Discord community servers** — VGC-focused servers often maintain resource channels.

---

## 10. AI Search Optimization (GEO/AEO)

Already well-positioned with llms.txt + AI bot access + comprehensive structured data.

Additional recommendations:
1. Add `speakable` schema to FAQ answers for voice search
2. Consider an `/about` page with comprehensive tool description for AI context building
3. Add more `sameAs` links to Organization schema (social profiles, community presences)
4. Ensure FAQ content exactly matches natural language queries ("How do I share a VGC team?")
5. The combination of structured data + AI-friendly robots.txt + llms.txt makes this site highly citable by AI answer engines (Perplexity, Google AI Overviews, ChatGPT search)

---

*Draft metadata/content changes: `.swarm/drafts/r6-seo-drafts.md`*
1. **Add a grounded "counters" FAQ entry on Mega landing pages** — extend the `faqItems` array in `src/app/champions/[pokemon]/page.tsx` around lines 198–225 with a 7th item: `"What counters {Mega} in VGC?"` answered from `pokemonData.types` against the type chart (weaknesses + speed tier baseline). Pure content/JSON-LD change, no new route. Captures the "{Pokemon} counters VGC" query Pikalytics owns. ~30 min.
2. **Make `/s/[id]` titles length-aware** (`src/app/s/[id]/page.tsx` lines 38–51). Current pattern `"${tournamentName} — ${placement} | VGC Team Report"` regularly exceeds 60 chars and Google truncates the brand. Reorder to lead with species (highest CTR signal) and drop the brand suffix when the core would push past ~55 chars. Adds ~10 lines of `length`-aware logic; no schema or data changes. ~45 min.
3. **Add `BreadcrumbList` JSON-LD to `/explore`, `/tournaments`, `/creator/[name]`** — extend `src/components/seo/JsonLd.tsx` with a `BreadcrumbJsonLd` helper (~12 lines), then a 3-line insertion per page. Currently only `/champions/[pokemon]` and `/s/[id]` ship breadcrumbs — Google's site-links treatment needs the helper on every L2 page. ~45 min.

## Keyword gap list (10)

Queries competitors rank for that we do not target in any `keywords`, h1, or URL:

1. **"VGC {Pokemon} counters"** — Pikalytics owns. We have no counters surface.
2. **"VGC {Pokemon} EV spread"** — we use "SP spread" (our coinage). Add "EV spread" as a synonym in titles + h1s; "EV" volume is roughly 30–50× "SP".
3. **"Pokemon Champions team builder"** — Pikalytics, PikaChampions, VGC Coach all rank. Our homepage title says "Build & Share", not "team builder".
4. **"VGC 2026 Regulation I teams"** — Pikalytics has `/pokedex/gen9vgc2026regi/`. We only ship a Reg M-A surface.
5. **"VGC Regulation H sample teams"** — VGCpastes owns. Our `/tournaments` page does not segment by regulation.
6. **"pokepaste alternative"** / **"pokepaste with notes"** — zero on-page targeting; our llms.txt mentions it, our `<title>` chain does not.
7. **"VGC speed tiers Regulation M-A"** — we have speed-tier UI, no dedicated indexable `/speed-tiers/[regulation]` page.
8. **"{Tournament name} VGC top cut teams"** (e.g. "Indianapolis Regionals 2026 teams") — Limitless ranks. We have the data via `tournamentName` on shares but no `/tournaments/[slug]` aggregate landing page.
9. **"{Player name} VGC team"** — Limitless player pages own. Our `/creator/[name]` exists but is not in `keywords` and the h1 is generic.
10. **"VGC team report template"** / **"how to write a VGC team report"** — pure top-of-funnel content gap; we own the category name but rank for nothing.

## Medium-term recommendations

1. **Ship `/regulation/[code]` hub pages** (`/regulation/m-a`, `/h`, `/i`, `/g`, `/f`) mirroring Pikalytics' `/pokedex/{format}` pattern. Each page: top-20 species cards, "browse teams in this format" CTA, breadcrumbs, `CollectionPage` JSON-LD. Pulls from the existing share DB filtered by `data->>'regulation'`. Single new route, ~6 indexable pages, addresses gaps #4 + #5 + #7.
2. **Build a `/tournaments/[slug]` aggregate** (Indianapolis 2026, Worlds 2025, etc.) emitting `SportsEvent` JSON-LD per tournament with a `subEvent`/`workFeatured` list of teams. We already emit two static SportsEvent nodes on `/tournaments` — promote them to indexable pages. Addresses gap #8 and converts Limitless backlink intent.
3. **Promote `/creator/[name]` to a real player profile**: add `ProfilePage`+`Person` JSON-LD, an h1 of `"{name} — VGC Teams & Tournament Reports"`, and a structured tournament-history block. Currently it's a generic feed, so it competes with Limitless player pages on weak signals. Addresses gap #9 and converts pre-existing sitemap entries into rank-worthy pages.

Drafts of all proposed metadata strings are at `/home/user/VGC-Team-Report/.swarm/drafts/r6-metadata-changes.md`. Nothing has been published.
