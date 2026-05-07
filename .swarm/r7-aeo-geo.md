# R7: AEO/GEO Citation Landscape Report
**Date:** 2026-05-07
**Analyst task:** Determine why VGC Team Report is not cited by AI engines and what changes that.

---

## 1. Current AI Citation Landscape for VGC Queries

### Query: "best VGC team builder"
AI summaries consistently surface:
- **Pikalytics** (pikalytics.com) — most cited; high DA, Pokémon stats authority
- **Pokémon Showdown** — the default battle sim; massive authority from smogon.com links
- **VGC.tools** — community team library
- **Limitless VGC** (limitlessvgc.com) — tournament team archive
- **Victory Road** (victoryroad.pro) — resources hub
- **MetaVGC** (metavgc.com/team-builder)
- **VGC Coach Pro** / **PokéTeamBuilder** / **AITeamBuilder** — newer AI-angle tools

VGC Team Report does NOT appear in any "best team builder" AI summaries. It appears only when queries use the exact phrase "VGC team report" — meaning we own our branded query but not category queries.

### Query: "how to share a VGC team"
VGC Team Report **does appear** in this SERP (pokemonvgcteamreport.com listed as a sharing tool), but it is listed alongside VGC.tools, Pikalytics, and PokéPaste — not in a dominant position. AI synthesis would likely cite the more established properties first.

### Query: "pokemon team report tool"
VGC Team Report appears here as well, alongside Reportworm, Smogon Team Reports forum, Victory Road, and Trainer Tower. The presence is good but not ranked first.

---

## 2. Why VGC Team Report Is Not Being Cited

### 2a. Authority Gap (the core problem)
The sites AI engines cite all share common traits VGC Team Report currently lacks:

| Signal | Pikalytics | Victory Road | VGC Team Report |
|--------|-----------|-------------|-----------------|
| Domain age | 8+ years | 6+ years | ~1-2 years |
| Backlinks from Smogon | Yes | Yes | None found |
| Reddit mentions (r/pokemon, r/VGC) | Frequent | Frequent | Rare/none found |
| Wikipedia/Bulbapedia listing | Indirect | Indirect | None |
| VGCpedia directory listing | Yes | Yes | Not found |
| Twitter/X community presence | Strong | Strong | Unclear |

AI models (ChatGPT, Perplexity, Claude) draw citation signals from:
1. High-frequency co-mentions in trusted sources (Smogon, Reddit, Discord transcripts indexed by web)
2. Structured data / schema markup
3. Domain authority and backlink profile
4. Wikipedia/wiki presence as a strong trust signal

### 2b. Schema Markup — Partial Coverage
The site has JSON-LD structured data, which is good, but coverage is incomplete:

**Implemented:**
- `WebApplication` schema on layout (site-wide) — good
- `BreadcrumbList` on champion pokemon pages — good
- `FAQPage` on champion pages — good (FAQPage is the #1 schema type for AI citation)
- `CollectionPage` on Explore page

**Missing:**
- No `Organization` schema with `sameAs` links to Twitter/X, LinkedIn, Discord
- No `FAQPage` on homepage, explore page, or creator pages
- No `HowTo` schema for the team-building workflow
- No `SoftwareApplication` schema with `aggregateRating` (user reviews)
- No `Article`/`BlogPosting` schema on team report share pages (`/s/[id]`)
- No `Dataset` or `ItemList` schema on the explore/champions listing pages
- The `WebApplication` schema is missing `creator`, `author`, `dateModified`, and `screenshot` fields

### 2c. Not Listed in VGC Tool Directories
Key directories that AI training data heavily indexes:
- **VGCpedia.com** — the VGC encyclopedia that lists tools (Pikalytics, Victory Road, etc.) is not listing VGC Team Report
- **Victory Road /resources** — the most-linked VGC resource hub; VGC Team Report is absent
- **Nimbasa City Post /vgc-resources** — classic community resource page, no mention found
- **Smogon VGC Resources** (smogon.com/tiers/vgc/resources) — no mention found
- **DevonCorp up-to-date VGC resources page** — no mention found

### 2d. No Content That Answers Categorical Queries
AI citation favors pages that directly answer "what is the best X" — meaning listicles, comparison pages, how-to guides. VGC Team Report has no:
- Blog/guide content explaining team report methodology
- "Best VGC team builder" comparison page
- "How to write a VGC team report" tutorial
- Glossary/FAQ page covering VGC terminology

Pikalytics wins because it has usage stats. Victory Road wins because it has a curated resources list. Both have content that directly answers AI queries. VGC Team Report has a tool — but no educational content wrapping it.

### 2e. Weak External Co-mentions
For AI engines to trust and cite a source, it needs to appear in multiple independent contexts. The search results show:
- No Reddit threads recommending VGC Team Report for team sharing
- No Smogon threads linking to it as a resource
- No YouTube or content creator integrations
- The site appears in searches primarily via its own domain — not from third-party referrals

---

## 3. What Schema Markup Would Help

Priority schema additions by impact:

1. **`Organization` with `sameAs`** — on root layout; links to Twitter, GitHub, Discord. This establishes entity recognition for AI models.
2. **`FAQPage` on homepage** — answer "What is VGC Team Report?", "How do I share a VGC team?", "What is a VGC team report?" Questions matching user intent = AI citation.
3. **`HowTo` on a dedicated guide page** — "How to write a VGC team report" with steps. HowTo schema gets cited in instructional AI answers.
4. **`SoftwareApplication` with `aggregateRating`** — needs real review collection (e.g., Product Hunt listing, Chrome Web Store if PWA listed).
5. **`Article` on `/s/[id]` share pages** — with `author`, `datePublished`, `tournament name` as subject. This turns team reports into indexable articles, not just app states.
6. **`ItemList` on `/explore`** — mark the team list as a structured dataset AI can parse.
7. **`BreadcrumbList`** on all pages (currently only on champion pages).

---

## 4. Opportunities for Tool Roundup Inclusion

### High-priority targets:
1. **VGCpedia Resources** (vgcpedia.com/resources/) — encyclopedia-style, heavily indexed; submit for listing
2. **Victory Road Resources** (victoryroad.pro/resources/) — most linked VGC resource hub; getting listed here = backlink + AI co-mention
3. **Smogon VGC Resources page** (smogon.com/tiers/vgc/resources) — highest authority in VGC; a mention here would dramatically lift AI citation probability
4. **Nimbasa City Post VGC Resources** (nimbasacitypost.com/2019/12/vgc-resources.html) — community trust page
5. **DevonCorp Resources** (devoncorp.press/resources/) — active, updated list
6. **blog.poketeambuilder.app** — "Best Pokémon Team Builders 2025" post; reach out for inclusion in next update
7. **Reddit r/VGC and r/stunfisk** — organic posts from users sharing team reports using the tool; encourage community usage

### Medium-priority:
8. **Trainer Tower** — hosts team reports; potential cross-promotion
9. **Nugget Bridge** — legacy authority; any mention helps domain trust
10. **Product Hunt** — listing as a free VGC tool would generate backlinks and potentially an `aggregateRating` source

---

## 5. What Would Actually Change AI Citation Probability

**Ranked by expected impact:**

1. **Get listed on Victory Road /resources** — single highest-ROI action; VR is the most-indexed VGC authority hub
2. **Get listed on Smogon VGC Resources** — highest domain authority in the space; even one mention creates AI training signal
3. **Add `Organization` + `FAQPage` schema to homepage** — immediate structured data signal, 3.2x citation lift documented in studies
4. **Publish a "How to write a VGC team report" guide** — creates content that directly answers AI queries, makes the site citable for instructional prompts
5. **Get VGCpedia listing** — encyclopedia-style listing is strong entity signal for AI models
6. **Encourage Reddit/community mentions** — organic co-mentions in r/VGC posts are training data for AI models
7. **Product Hunt listing** — generates backlinks, ratings schema, and tech community indexing

---

## 6. Competitive Gap Summary

| Factor | VGC Team Report Status | Fix Required |
|--------|----------------------|-------------|
| Schema coverage | Partial (missing FAQ on home, Organization, HowTo, Article) | High priority |
| Directory listings | Nearly absent | High priority |
| Backlink profile | Thin; no major VGC authority links | Medium priority |
| Content for AI queries | None (no blog/guides) | Medium priority |
| Community mentions | Rare/not indexed | Medium priority |
| Branded query visibility | Strong (appears for "VGC team report") | Already done |
| Category query visibility | Zero | Requires all above fixes |

---

## Sources Consulted
- Pikalytics: https://www.pikalytics.com/
- Victory Road Resources: https://victoryroad.pro/resources/
- VGCpedia: https://www.vgcpedia.com/resources/
- VGC.tools: https://vgc.tools/
- Limitless VGC: https://limitlessvgc.com/teams
- Smogon VGC Resources: https://www.smogon.com/tiers/vgc/resources
- DevonCorp Resources: https://devoncorp.press/resources/
- Schema.org FAQPage guidance: https://wpriders.com/schema-markup-for-ai-search-types-that-get-you-cited/
- AEO/GEO guide: https://www.frase.io/blog/what-is-answer-engine-optimization-the-complete-guide-to-getting-cited-by-ai
- FAQPage AI citation study: https://www.amicited.com/blog/faqpage-schema-ai-answers/
- Structured data 3.2x lift: https://www.rankarise.com/blog/schema-markup-for-ai-structured-data-gets-you-cited/
- blog.poketeambuilder.app best team builders: https://blog.poketeambuilder.app/best-team-builders-2025
