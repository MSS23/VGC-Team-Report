# R7 — AI Citation / AEO / GEO Strategy Report

Date: 2026-06-22
Scope: Read-only research. Wave-2 will implement.
Domain: pokemonvgcteamreport.com

---

## 1. Current LLM Citation Landscape (Who Gets Named, Why)

Tested 5 representative VGC prompts via WebSearch as a proxy for LLM-grounded retrieval (Perplexity, ChatGPT Search, Claude with web, Gemini AI Overviews all draw from the same surface SERP + a thin head of authority sites). Aggregated citation pattern below.

### Prompt: "best Pokemon VGC team builder"
Cited (in order of frequency):
1. **Pikalytics** (`pikalytics.com/team`, `/topteams`, `/champions`, `/pokedex/gen9championsvgc2026regma`) — dominates; cited 4–5x per query
2. **PokemonBuilder** (`pokemonbuilder.com/pokemon-vgc-builder`) — usage stats hook ("10,295 real battles")
3. **ChampTeams.gg** — free + Champions Reg M-B angle
4. **VGC Trainer**, **MetaVGC**, **Pokémon Zone** — tier 2
5. **VGC Team Report — not cited.**

### Prompt: "how to share a VGC team"
Cited:
1. **pokemonvgcteamreport.com** — appears top result organically
2. **VGC Helper**, **VGC Team Helper**, **Reportworm**, **Victory Road**, **Pikalytics**
3. LLM answer summary attributes "build, share, and present with one click" to us — but generically, no explicit brand call-out

### Prompt: "VGC speed tiers calculator"
Cited:
1. **PokeStats.cc** (`/pokedex/speed-calculator`, `/guides/vgc-speed-tiers`) — answers with concrete numbers (Flutter Mane 201, Calyrex-Shadow 222)
2. **PokeTools**, **VGC Lite**, **Pikalytics speed-tiers**
3. **GitHub: AquaDragon/VGC-speed-tier-explorer**
4. **VGC Team Report — not cited.**

### Prompt: "current VGC format teams"
Cited:
1. **VGC Trainer** (Reg I meta guide)
2. **Showdown Tier**, **crob.at**, **Victory Road**, **Pikalytics**
3. **PokeStats VGC Format Guide** — gets cited because it bullet-lists rules and percentages
4. **Pokemon.com tournament handbook PDF** (official)
5. **VGC Team Report — not cited.**

### Prompt: "Pokemon VGC report tool"
1. **pokemonvgcteamreport.com** — direct match on long-tail brand-adjacent term
2. **Reportworm** (`reportworm.com`) — direct competitor on "report" word
3. **VGC Team Helper**, **Victory Road**, **Pikalytics**

---

## 2. Why Competitors Get Cited

### Pikalytics (the runaway leader)
- **Massive entity authority**: ~20+ years of VGC name recognition.
- **Concrete numeric content**: usage % per Pokémon, top-team lists, speed tier numbers — exactly what LLMs love to quote ("Miraidon 28.9%").
- **Heavy interlinking**: dedicated subpages per regulation (`/pokedex/gen9championsvgc2026regma`), per facet (`/speed-tiers`, `/topteams`, `/team`) — LLMs latch onto the slugged URL structure.
- **Tabular data** rendered as HTML (not JS-only) — easy to extract.

### PokeStats.cc (rising fast in AI answers)
- **Guide-style URLs**: `/guides/vgc-speed-tiers`, `/guides/vgc-format-guide` — the slug *is* the query.
- **Embeds concrete benchmark numbers in headings** ("Flutter Mane 201, Calyrex-Shadow 222") — these become quotable atoms.
- **Definitive list format**: "Full Reg I Chart" — LLMs prefer canonical complete lists over partial coverage.

### Victory Road
- **Editorialized team reports written by top finishers** — first-party authority.
- Long-form prose with player attribution — high E-E-A-T signal.

### Reportworm
- Direct semantic overlap with our brand on the word "report." Their `/` page describes "generates stats and calcs for your team based on a Pokepaste and replay links" — that sentence is essentially the AI answer.

### PokePaste / Smogon
- **Inertia**: 15+ years of inbound links and forum citations. Smogon especially benefits from being a *training-set* source — pre-2024 LLMs internalized it.

### Common patterns across all citations
1. Bullet/numbered lists with named entities + numeric stats
2. Definitive scope claims ("full chart", "all Pokémon", "every regulation")
3. URL slugs that mirror the query
4. Plain HTML server-rendered tables (not React-hydrated)
5. Explicit "what makes this different from X" comparison content

---

## 3. Current State of pokemonvgcteamreport.com

**Read-only audit of `/home/user/VGC-Team-Report/` reveals strong foundations:**

### What we already do well
- `public/robots.txt` — explicitly allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot. **No action needed; we are on the allow-list correctly.** (File: `/home/user/VGC-Team-Report/public/robots.txt`)
- `public/llms.txt` + `public/llms-full.txt` — well-curated, comparison-positioned ("Unlike PokePaste...Unlike Pikalytics..."), updated 2026-05-23. This is best-practice (Perplexity has publicly confirmed retrieval; ChatGPT behavior is correlated).
- Root `JsonLd` infrastructure (`src/components/seo/JsonLd.tsx:1-310`): Organization, WebSite+SearchAction, WebApplication, FAQPage, HowTo, BreadcrumbList, SportsEvent, CreativeWork (per-share).
- Home page (`src/app/page.tsx:51-72`) emits HowToSchema with 5 named steps.
- `/faq` page (`src/app/faq/page.tsx`) — 12+ Q&A entries with strong direct answers that cover all the questions tested above.
- Sitemap (`src/app/sitemap.ts`) — includes shares, creators, champions Pokemon pages.
- Per-share CreativeWork JSON-LD (`src/app/s/[id]/page.tsx:185-209`).

### Specific gaps preventing AI citation
1. **No `Dataset` / `ItemList` schema on speed tiers, top teams, or tournament results.** PokeStats and Pikalytics win the "speed tier"/"top teams" prompts because they expose tabular data with semantic structure. We do not have a speed-tiers landing page or schema — only embedded within reports.
2. **FAQ schema in `JsonLd.tsx:DEFAULT_FAQ_ITEMS` (5 items) is stale and weaker than the `/faq` page's 12-item content set.** The default FAQ rendered on the homepage uses the short 5-item set; the home `FAQPageJsonLd` call passes no items, so we leak the rich `/faq` content. Wave-2 should consolidate to a single source-of-truth FAQ array.
3. **Article / TechArticle schema is missing from FAQ and Champions pages** despite being long-form structured content. AEO research (`stackmatix.com`, `digitalapplied.com`) notes Article schema with author entity boosts AI citation ~67%.
4. **No SoftwareApplication schema with `aggregateRating` or `review`.** When LLMs are asked "best VGC team builder," they prefer sources with rating signals. Even a self-reported `aggregateRating` (from internal like/view counts) qualifies.
5. **HowTo schema steps lack `url` deep-links and `image` properties.** Each step in `src/app/page.tsx:51-72` is text-only; adding deep anchors (`#step-1-import`) and step images would convert HowTo from a passive emission into a feature that AI Overviews snippet.
6. **No `WebPage.mainContentOfPage` or `speakable` markup.** Voice/AEO assistants (Gemini AI Overview voice readout) prefer pages with `SpeakableSpecification` blocks pointing to the FAQ answers.
7. **The home page sits on `/` with high authority but only emits FAQPage+HowTo via client component (`"use client"` at top of `src/app/page.tsx`).** JSON-LD inside client components ships in initial HTML via Next.js but is below the auth provider tree — some AI crawlers (especially first-gen GPTBot) prefer server-rendered top-of-document schema. This is a minor concern but worth verifying the SSR output.
8. **No comparison-table content with `Table`/`ComparisonTable` semantic HTML.** The llms.txt does compare us to PokePaste/Pikalytics — but a *visible page* at `/vs/pokepaste` or `/vs/pikalytics` is what gets cited when users prompt "PokePaste alternative" or "Pikalytics vs ...". We have meta keywords for "PokePaste alternative" (in `/faq` metadata) but no dedicated page.

### What is already best-practice — DO NOT regress
- `robots.txt` AI-crawler allow-list
- `llms.txt` + `llms-full.txt` content depth
- Per-share CreativeWork with author/contributor Person entities
- SportsEvent schema on `/tournaments`
- FAQPage schema on `/champions/[pokemon]` per-Mega pages

---

## 4. Recommended Wave-2 Changes (Ranked by Impact / Implementation Cost)

All changes are metadata / schema / tweaks to *existing* pages. No new content pages from thin air per constraint.

### #1 — Consolidate FAQ source-of-truth and emit richer FAQPage schema on `/` (HIGH impact / LOW cost)
- File: `/home/user/VGC-Team-Report/src/components/seo/JsonLd.tsx` (lines ~195-220 — `DEFAULT_FAQ_ITEMS`)
- File: `/home/user/VGC-Team-Report/src/app/faq/page.tsx` (the 12-item `FAQ_ITEMS` const)
- Action: extract the 12-item FAQ from `faq/page.tsx` into a shared module (e.g. `src/data/faq.ts`); import into both `faq/page.tsx` and `JsonLd.tsx` so `DEFAULT_FAQ_ITEMS` becomes the authoritative set. Result: home page's `<FAQPageJsonLd />` (currently in `src/app/page.tsx:77`) ships all 12 Q&As to crawlers, multiplying citation surface 2.4x without writing one new word.
- Citation logic: more Q&A entries = more atomic question:answer pairs that map directly to user prompts.

### #2 — Add `Dataset` + `ItemList` schema on `/explore` for top-teams-by-format (HIGH impact / MEDIUM cost)
- File: `/home/user/VGC-Team-Report/src/app/explore/page.tsx` (currently only `CollectionPage` per line 51)
- Action: alongside the existing CollectionPage, emit:
  - `ItemList` with `itemListOrder: ItemListOrderDescending`, naming each public report's species + tournament + placement
  - `Dataset` block describing the explore feed as "public competitive Pokémon VGC team reports, filterable by format/Pokémon/tournament" with `keywords`, `creator: Organization`, `temporalCoverage`
- Citation logic: this is exactly the schema pattern Pikalytics' top-teams page uses; Dataset schema correlates with ~3.5x more AI references per the research.

### #3 — Add `SoftwareApplication.aggregateRating` to root layout schema (MEDIUM impact / LOW cost)
- File: `/home/user/VGC-Team-Report/src/app/layout.tsx` (lines 111-136, the inline `<JsonLd>` for WebApplication/SoftwareApplication)
- Action: add `aggregateRating: { "@type": "AggregateRating", ratingValue, ratingCount, bestRating: 5 }` driven by stored like-counts / view-counts from the `shares` table (read-only at build time). Also add `applicationSuite`, `softwareVersion`, and `releaseNotes: { url: "/changelog" }`.
- Citation logic: "best X" prompts preferentially cite entries with rating signals. Adding even a modest self-reported AggregateRating (e.g. 4.8/5 from 350 reports) qualifies us to be ranked in "best VGC team builder" answers.

### #4 — Add `SpeakableSpecification` + Article schema to `/faq` and `/champions` pages (MEDIUM impact / LOW cost)
- Files:
  - `/home/user/VGC-Team-Report/src/app/faq/page.tsx`
  - `/home/user/VGC-Team-Report/src/app/champions/ChampionsContent.tsx` (line 41 — currently only WebPage)
- Action: wrap each FAQ answer DOM in `<div id="faq-{slug}">`, then emit `WebPage` schema with `speakable: { "@type": "SpeakableSpecification", cssSelector: [".faq-answer"] }`. Add `Article` schema to `/champions` as the canonical longform write-up on Reg M-A.
- Citation logic: SpeakableSpecification is the explicit signal for voice AI Overviews (Gemini, Alexa). Article schema with `author: Organization` and `datePublished` adds E-E-A-T weight.

### #5 — Enrich HowTo steps with `url` deep-anchors, `image`, and `tool` properties (MEDIUM impact / LOW cost)
- File: `/home/user/VGC-Team-Report/src/app/page.tsx` (lines 51-72, the `HOW_TO_STEPS` constant)
- Also: `/home/user/VGC-Team-Report/src/components/seo/JsonLd.tsx` (`HowToSchema`)
- Action: extend each step to include `url: "https://pokemonvgcteamreport.com/#step-1-import"`, `image: { "@type": "ImageObject", url }`, and a top-level `tool: [{ "@type": "HowToTool", name: "Pokémon Showdown" }, { name: "PokéPaste" }]` + `supply: [{ "@type": "HowToSupply", name: "VGC team export text" }]`. Add anchor `id`s in the page DOM so deep-links resolve.
- Citation logic: Google AI Overview and Perplexity preferentially carousel HowTo schemas that have linkable steps + images. Currently our HowTo is text-only and not eligible for the rich result.

### Bonus #6 (cheap, optional) — Add `mentions` + `about` Thing references to per-share CreativeWork
- File: `/home/user/VGC-Team-Report/src/app/s/[id]/page.tsx` (around lines 185-208)
- Action: add `about: { "@type": "VideoGame", name: "Pokémon Champions" }` and `mentions: [ { "@type": "Thing", name: "Reg M-A" }, ...species list as Thing entities ]`. Tiny diff, but it lets LLMs disambiguate when a user prompts "Champions Reg M-A Calyrex teams."

---

## 5. Things We Should NOT Do
- Do not remove `llms.txt` to chase newer standards — Perplexity confirms retrieval and there is no replacement.
- Do not block any AI crawler. Our `robots.txt` allow-list is a competitive moat; many sites still block GPTBot and we benefit from being open.
- Do not stuff keywords into FAQ answers. AEO research shows over-optimized answers get demoted; current `/faq` voice is correct.
- Do not add `Review` schema with fake reviews — Google AI Overviews penalizes spammed review schema.

---

## 6. Confidence & Caveats
- WebSearch is a proxy for LLM citation; for absolute ground truth Wave-2 should run the 5 prompts directly through ChatGPT Search, Perplexity, Claude (web), and Gemini and log who gets cited. Use Pixelmojo's tracking framework as a model.
- We are likely already cited *internally* (in LLM training data via Reddit, Discord embeds, our own llms.txt) more than WebSearch suggests; the gap is in *grounded* citations (real-time retrieval).
- The biggest unknown: whether Vercel SSG output preserves all JSON-LD scripts inside the React tree for GPTBot. Wave-2 should `curl -A "GPTBot" https://pokemonvgcteamreport.com/` and inspect.

---

## Sources
- [Generative Engine Optimization 2026 Guide — LLMrefs](https://llmrefs.com/generative-engine-optimization)
- [AEO vs SEO vs GEO — Stackmatix](https://www.stackmatix.com/blog/aeo-seo-geo)
- [State of llms.txt 2026 — Presenc AI](https://presenc.ai/research/state-of-llms-txt-2026)
- [Schema Markup for AI Citations — Averi](https://www.averi.ai/blog/schema-markup-for-ai-citations-the-technical-implementation-guide)
- [FAQ Schema 2026: JSON-LD for AI Citations — SEOScore](https://seoscore.tools/blog/faq-schema-markup/)
- [Optimizing FAQ Schema for Google AI Overviews — Stackmatix](https://www.stackmatix.com/blog/optimizing-faq-schema-google-ai-overviews)
- [Structured Data for AI Search Engines — Hashmeta AI](https://www.hashmeta.ai/en/blog/structured-data-for-ai-search-engines-the-complete-guide-to-schema-markup-for-chatgpt-perplexity-google-ai)
- [How to Track AI Citations Across 4 LLMs — Pixelmojo](https://www.pixelmojo.io/blogs/how-to-track-ai-citations-chatgpt-perplexity-claude-gemini)
- [How AI Engines Cite Sources — AIvsRank, Medium](https://medium.com/@aivsrank/how-ai-engines-cite-sources-patterns-across-chatgpt-claude-perplexity-and-sge-8c317777c71d)
- [Allow ChatGPT and Perplexity to Crawl Your Site — Chudi.dev](https://chudi.dev/blog/how-to-optimize-for-perplexity-chatgpt-ai-search)
- [Pikalytics VGC 2026 Team Builder](https://www.pikalytics.com/team)
- [PokeStats VGC Speed Tiers Guide](https://pokestats.cc/guides/vgc-speed-tiers)
- [VGC Trainer Reg I Meta Guide](https://vgctrainer.com/guide)
- [Reportworm](https://reportworm.com/)
- [Victory Road SV Reports](https://victoryroad.pro/sv-reports/)
