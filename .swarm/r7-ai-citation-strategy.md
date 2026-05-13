# R7: AI Citation Strategy — VGC Team Report
**Date:** 2026-05-13
**Analyst:** AEO/GEO Citation Strategist
**Supersedes:** R7-aeo-geo-citations.md (2026-05-07) and r7-aeo-geo.md (2026-05-10)

---

## Executive Summary

VGC Team Report owns its branded query and appears in search results for "how to share a VGC team" — but is completely absent from AI-generated answers for category queries ("best VGC team builder", "Pokemon Champions team analysis tool", "where to find top VGC teams"). The root causes are: (1) zero presence on the five authority VGC directories that AI models use as training/retrieval sources, (2) a semantic naming collision with the Smogon "team reports" forum genre, and (3) incomplete schema markup relative to what 2026 AI citation research shows actually moves the needle.

---

## 1. Citation Gap Analysis

### What gets cited per query type (May 2026 research)

| User Query | Sites Cited by AI | VGC Team Report? |
|---|---|---|
| "best VGC team builder" | Pikalytics, Champions Builder, Champions Lab, PikaChampions, VGC Coach Pro | Not cited |
| "how to share a VGC team" | VGC Team Report (pokemonvgcteamreport.com), Pikalytics, VGC Helper | **Cited once** (for "share" but not dominant) |
| "Pokemon Champions team analysis tool" | Pikalytics, BattleWise AI, Champions Lab, ChampTeamAI, VGC Coach Pro | Not cited |
| "VGC team report generator" | pokemonvgcteamreport.com, Reportworm, VGC Helper, Pikalytics | **Cited** (branded query) |
| "where to find top VGC teams" | Pikalytics Top Teams, Limitless VGC, Pokemon Zone, Victory Road | Not cited |

VGC Team Report is present for its exact branded query and the "share a VGC team" query. It has zero presence in category and discovery queries — the high-volume queries where AI summaries steer user decisions.

### Why competitors get cited

**Pikalytics:** 8+ years of domain age, dedicated VGCpedia encyclopedia page, listed on Victory Road /resources, DevonCorp, Nimbasa City Post. Has structured usage-data content (every Pokemon page = AI-citable factual content). Has `llms-full.txt` (pikalytics.com/llms-full.txt) providing a machine-readable sitemap for LLM crawlers.

**Victory Road:** Self-reinforcing — it IS the resource hub so it appears in every resource roundup. High-DA backlinks from Smogon, Limitless, DevonCorp. Active community trust.

**Champions Lab / Champions Builder / PikaChampions:** Newer entrants that still rank ahead of VGC Team Report for builder queries because they have "team builder" explicitly in their positioning, domain name, or both.

**Limitless VGC:** Tournament-result archive with historical depth. Every tournament creates new citable content.

**The naming collision problem:** Smogon has a "Team Reports" forum section (smogon.com/forums/forums/team-reports.680/) with 20+ years of indexed forum threads. When AI models encounter "VGC team report" as a query, they associate the phrase with the Smogon genre (player-written forum posts) rather than a web tool. This is an active suppression signal.

### Schema audit — current state vs. gap

| Schema Type | Current Status | Gap Assessment |
|---|---|---|
| `Organization` with `sameAs` | Present in layout.tsx — but only `sameAs: [github URL]` | Missing Twitter, Discord links — entity recognition is weak |
| `WebApplication` + `SoftwareApplication` | Present site-wide in layout.tsx | `applicationCategory` is "GameApplication" not "SportsApplication" — suboptimal |
| `WebSite` with `SearchAction` | Present in layout.tsx | Good |
| `FAQPage` on homepage | Present (FAQPageJsonLd in page.tsx) | **5 questions — needs expansion to 8-10; questions don't fully address category queries** |
| `HowTo` on homepage | Present (HowToSchema in page.tsx) | Good — 5 steps exist |
| `FAQPage` on /faq page | Present (11 detailed Q&As) | Good — but /faq needs BreadcrumbList schema |
| `CreativeWork` on /s/[id] share pages | Present | Should be upgraded to `Article` or `BlogPosting` for stronger citation signal |
| `FAQPage` on /champions/[pokemon] pages | Present (per-pokemon FAQ) | Good |
| `WebPage` on /champions/[pokemon] pages | Present | Good |
| `BreadcrumbList` sitewide | Champions pages only | Missing from /faq, /explore, /s/[id] pages |
| `ItemList` on /explore | Missing | Medium priority |
| `Dataset` on /explore or /champions | Missing | Medium priority — AI citation research shows Dataset schema earns authority citations |
| `SoftwareApplication` `aggregateRating` | Missing | Requires external review source first |
| `DefinedTerm` / `DefinedTermSet` | Missing | Would support a glossary page |
| `llms.txt` | Missing | Low priority (no proven citation impact, but signals AI-readiness) |

---

## 2. Why AI Citation Mechanics Favor Competitors

### The authority flywheel
2026 research shows that sites with 32,000+ referring domains are 3.5x more likely to be cited by ChatGPT than sites with 200 or fewer. Pikalytics and Smogon are in that top tier. VGC Team Report is not — and the fastest path to closing this gap is not link-building in the traditional sense, but getting listed on the 4-5 authority VGC directories that collectively drive the citation cluster.

### Platform citation rate differences
A 2026 study of 34,234 AI responses found a 46x difference in citation rates between platforms: Perplexity cites brands at ~13% vs ChatGPT at ~0.6%. This means Perplexity is where VGC Team Report can gain traction fastest — Perplexity relies heavily on real-time retrieval and structured content, where schema and fresh indexed pages have more weight than training-data frequency.

### Table and FAQ extraction rates
Research-backed numbers from 2026:
- Tables earn 2.5x more AI citations than the same information in prose (81% extraction rate vs 23%)
- FAQPage schema pages earn 2.1x the AI citation volume over 90 days vs equivalent unstructured pages
- The five-schema "stack" (Article + FAQPage + BreadcrumbList + DefinedTerm + HowTo) roughly doubles citation rates vs Article alone
- Only 12.4% of websites implement structured data — early mover advantage is real

### The "answer-first" principle
AI systems with real-time retrieval evaluate relevance primarily on the opening 40-60 words of each section. VGC Team Report's homepage is a React app shell — the semantic content AI crawlers see is sparse. The /faq page has strong answer content but lacks the authority signals that would make it the preferred citation source over Smogon or Victory Road.

---

## 3. Top 5 Content/Schema Recommendations

### Recommendation 1: Expand `Organization` schema `sameAs` and fix `applicationCategory`
**Effort: 1 hour | Impact: High**

Current `OrganizationJsonLd` in `/src/components/seo/JsonLd.tsx` only has a GitHub `sameAs` link. Entity recognition by AI models requires cross-referencing known social graph endpoints.

Add Twitter/X, Discord, and any other active social presence to `sameAs`. Change the `WebApplication` / `SoftwareApplication` `applicationCategory` in `layout.tsx` from `"GameApplication"` to `"SportsApplication"` — this is the schema.org enumeration that maps to competitive sports tools and is more precisely what AI engines will match when answering "team builder" category queries.

Also add `featureList` to Organization and verify all `@id` references are consistent across the schema graph so AI entity resolution works as a connected graph, not isolated blocks.

### Recommendation 2: Expand homepage `FAQPage` from 5 to 10 questions targeting category queries
**Effort: 2 hours | Impact: High**

The existing 5 homepage FAQ questions are product-focused. The missing questions are the ones that directly address the AI query space where competitors are winning. Add:
- "What is the best way to share a VGC team online?" (targets "how to share" query)
- "How does VGC Team Report compare to PokéPaste?" (positions against known competitor)
- "What is the difference between a team builder and a team report tool?" (resolves the naming confusion)
- "Where can I find top VGC tournament teams?" (targets discovery query)
- "Does VGC Team Report support Pokemon Champions Regulation M-A?" (targets current format query)

Each answer should open with a direct, complete answer in the first two sentences (AI extraction window). Answers that name-drop specific alternatives ("unlike PokéPaste which only shows...") help AI systems distinguish the tool's category.

### Recommendation 3: Upgrade `/s/[id]` share page schema from `CreativeWork` to `Article` / `BlogPosting`
**Effort: 3 hours | Impact: High**

Current share page schema uses `"@type": "CreativeWork"` — a generic type that provides weak citation signal. `Article` or `BlogPosting` with `headline`, `author`, `datePublished`, `keywords`, `about` (including tournament name and format), and `isPartOf` referencing the WebApplication gives AI systems the structured content metadata they need to extract individual team reports as citable documents.

Key additions:
- `"@type": "Article"` (not just CreativeWork)
- `keywords`: auto-populated from species list + format name
- `about`: structured as a `SportsEvent` or `Event` if tournament data exists
- `genre`: "VGC Team Report"
- `inLanguage`: "en"

This turns every public shared report into a citable article in AI training corpora.

### Recommendation 4: Publish a dedicated `/how-to-write-a-vgc-team-report` guide page
**Effort: 4 hours | Impact: High**

This is the single highest-impact content gap. The instructional query "how to write a VGC team report" has no authority page to answer it — Smogon has forum posts but no structured guide, Victory Road has player reports but no meta-guide. A clean guide page with:
- `HowTo` schema (steps: import paste → add matchup notes → add damage calcs → add speed tiers → share)
- 800-1000 words of explanation per section
- A comparison table showing what to include vs. optional content
- `FAQPage` schema at the bottom (3-5 questions specific to the writing process)

This page would own the instructional query space with no current competition, and AI engines would cite it for every "how do I write a team report" or "VGC team report format" query.

### Recommendation 5: Add `Dataset` schema to `/explore` page + `ItemList` schema
**Effort: 2 hours | Impact: Medium-High**

The `/explore` page is a browseable collection of public team reports — a unique structured dataset in the VGC space. Adding `Dataset` schema signals to AI engines that this is authoritative structured data (not just a UI listing), which earns a distinct citation category separate from the tool itself. `ItemList` schema on the rendered reports creates a machine-readable list format that AI extractors prefer (tables and lists earn 2.5x more citations than prose).

---

## 4. Off-Site Authority Actions (Required for Category Query Citation)

These are not schema/code changes — they are the community authority signals that AI training data requires. Schema alone cannot fix a zero-backlink authority gap.

| Action | Target | Priority | Effort |
|---|---|---|---|
| Victory Road /resources listing | victoryroad.pro/resources/ | Critical | 30 min DM |
| VGCpedia dedicated page | vgcpedia.com/website/vgc-team-report/ | Critical | 20 min submission |
| Smogon VGC forum [Tool] thread | smogon.com/forums/forums/video-game-championships.513/ | High | 1 hour post |
| DevonCorp resources listing | devoncorp.press/resources/ | High | 30 min DM |
| blog.poketeambuilder.app inclusion | "Best Team Builders" roundup article | High | 20 min email |
| Nimbasa City Post resources | nimbasacitypost.com/2019/12/vgc-resources.html | Medium | 20 min DM |
| Product Hunt listing | producthunt.com | Medium | Full launch day |
| Reddit r/VGC seed post | Genuine user team report post | Medium | Community seeding |
| llms.txt implementation | Root of pokemonvgcteamreport.com | Low | 1 hour |

Outreach message drafts are in `.swarm/drafts/r7-ai-citation-drafts.md`.

---

## 5. Effort / Impact Matrix

```
HIGH IMPACT
    |
    |   [VR listing]     [VGCpedia page]
    |   [FAQ expansion]  [/s/[id] Article schema]
    |   [Smogon thread]  [How-to guide page]
    |
    |   [Builder roundup]   [applicationCategory fix]
    |   [Dataset schema]    [Organization sameAs fix]
    |
    |   [DevonCorp/NCP]   [ItemList schema]
    |   [Reddit seeding]  [llms.txt]
    |
    |                        [Product Hunt]
LOW |
    +----------------------------------------------
       LOW EFFORT               HIGH EFFORT
```

Numeric order for batched execution:
1. Fix `applicationCategory` + expand `sameAs` in Organization schema (layout.tsx / JsonLd.tsx) — 1 hour code change
2. Expand homepage FAQPage to 10 questions — 2 hour code change
3. Upgrade /s/[id] to Article schema — 3 hour code change
4. Outreach batch: Victory Road + VGCpedia + DevonCorp + blog.poketeambuilder.app in one session (drafts ready)
5. Post Smogon [Tool] thread
6. Publish /how-to-write-a-vgc-team-report guide page
7. Add Dataset + ItemList schema to /explore
8. Product Hunt launch (separate planning session)

---

## 6. Schema Quick-Reference: Specific Fields to Add/Change

### layout.tsx — WebApplication schema fix
Change `applicationCategory: "GameApplication"` to `applicationCategory: "SportsApplication"`

### JsonLd.tsx — OrganizationJsonLd sameAs expansion
Add Discord and Twitter/X URLs to the `sameAs` array (placeholder values exist, need real handles plugged in)

### /s/[id] page.tsx — CreativeWork → Article upgrade
Change `"@type": "CreativeWork"` to `"@type": "Article"` and add `headline`, `keywords` (species + format), `genre: "VGC Team Report"`, `inLanguage: "en"`

### /faq page.tsx — Add BreadcrumbList schema
Add BreadcrumbList JSON-LD: Home > FAQ

### /explore page — New ItemList + Dataset schema
Dataset: `name: "VGC Team Reports"`, `description: "Public competitive Pokémon VGC team reports with EV spreads, matchup notes, and damage calculations"`, `url`, `creator`

---

## 7. Monitoring

To track citation improvement:
- Run weekly Perplexity queries for the 5 target queries and note citation status
- Monitor Google Search Console for /faq and /how-to-write-a-vgc-team-report pages (impressions → clicks from instructional queries)
- Track whether pokemonvgcteamreport.com appears in ChatGPT browsing citations after the Victory Road and VGCpedia listings go live (typically 4-8 weeks for crawl/index cycle)

---

## Sources

- Live search results, May 2026 (all query simulations performed this session)
- Pikalytics llms-full.txt: https://www.pikalytics.com/llms-full.txt
- VGCpedia Pikalytics page: https://www.vgcpedia.com/website/pikalytics/
- Frase AEO/GEO guide: https://www.frase.io/blog/what-is-answer-engine-optimization-the-complete-guide-to-getting-cited-by-ai
- FAQ schema citation rates: https://www.frase.io/blog/faq-schema-ai-search-geo-aeo
- Averi AI B2B SaaS Citation Benchmarks 2026: https://www.averi.ai/how-to/chatgpt-vs.-perplexity-vs.-google-ai-mode-the-b2b-saas-citation-benchmarks-report-(2026)
- Lumar GEO/AEO technical guide: https://www.lumar.io/blog/best-practice/technical-geo-aeo-guide-for-ai-search-optimization/
- Lumar 4-Pillar GEO framework: https://www.lumar.io/blog/best-practice/4-pillar-geo-strategy-framework-for-ai-search-visibility/
- Stackmatix structured data guide 2026: https://www.stackmatix.com/blog/structured-data-ai-search
- SARVAYA schema markup AI overviews: https://sarvaya.in/blog/schema-markup-ai-overviews-citation-priority
- Schema markup AI citation guide (averi.ai): https://www.averi.ai/blog/schema-markup-for-ai-citations-the-technical-implementation-guide
- llms.txt adoption study: https://codersera.com/blog/llms-txt-complete-guide-2026/
- The authority flywheel (IDX): https://www.idx.inc/newsroom/the-authority-flywheel
- AI-ready schema types (samyakonline): https://www.samyakonline.net/blog/ai-ready-schema-dataset-speakable-creativework/
- VGC Team Report search presence: pokemonvgcteamreport.com (verified in search results)
- Smogon Team Reports forum: https://www.smogon.com/forums/forums/team-reports.680/
- Victory Road: https://victoryroad.pro/resources/
- Limitless VGC: https://limitlessvgc.com/teams
