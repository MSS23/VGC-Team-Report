# R7: AEO/GEO Citation Audit — VGC Team Report
**Date:** 2026-05-07
**Analyst:** AI Citation Strategist (AEO/GEO)
**Focus:** Why https://vgc-team-report.vercel.app / pokemonvgcteamreport.com is not cited by AI assistants, and what fixes that.

---

## 1. What AI Assistants Currently Recommend

### Query: "best VGC team builder"
AI summaries consistently surface these tools (order reflects citation frequency):
1. **Pikalytics** (pikalytics.com) — highest citation rate; positions itself as the stats/data authority
2. **Pokémon Showdown** — battle sim default; backed by Smogon's domain authority (~DA 70+)
3. **VGC.tools** — community team library with public sharing
4. **Champions Builder** (championsbuilder.com) — actively updated for Pokemon Champions 2026
5. **Champions Lab** (championslab.xyz) — meta + simulator hub
6. **VGC Coach Pro / Poké Team Builder** — AI-angle tools ranking for newer queries
7. **MetaVGC** (metavgc.com/team-builder)

**VGC Team Report does not appear in any "best team builder" AI summaries.**

### Query: "how to share a VGC team"
VGC Team Report **does appear** in search results (pokemonvgcteamreport.com listed), but it competes directly against VGC.tools, PokéPaste, and Pikalytics. AI synthesis would cite the higher-authority properties first. The site's strongest presence is for its exact branded query ("VGC team report"), not category queries.

### Query: "VGC team report tool" / "competitive pokemon team sharing"
VGC Team Report appears alongside Smogon Team Reports forum, Victory Road, Limitless VGC, and Trainer Tower. Presence exists but not in a dominant position.

### Summary
VGC Team Report owns its branded query. It has zero category query visibility with AI engines.

---

## 2. Why VGC Team Report Is Not Being Cited

### 2a. Domain Authority & Age Gap (Root Cause)

The sites AI engines cite all share traits VGC Team Report lacks:

| Signal | Pikalytics | Victory Road | Smogon | VGC Team Report |
|--------|-----------|-------------|--------|-----------------|
| Domain age | 8+ years | 6+ years | 20+ years | ~1–2 years |
| Backlinks from Smogon | Yes | Yes | N/A | None found |
| Reddit mentions (r/VGC, r/pokemon) | Frequent | Frequent | Always | Rare/none indexed |
| Wikipedia/Bulbapedia listing | Indirect | Indirect | Direct | None |
| VGCpedia directory listing | Yes | Yes | Yes | Not found |
| Listed on Victory Road /resources | — | Self | Yes | Not found |
| DevonCorp resources | Likely | Yes | Yes | Not found |

AI models (ChatGPT, Perplexity, Claude, Gemini) draw citation signals primarily from:
1. **Frequency of co-mentions** in trusted, indexed sources (Smogon forums, Reddit, Discord-indexed content)
2. **Structured data / schema markup** — especially FAQPage, HowTo, Organization
3. **Domain authority + backlink profile** from high-DA VGC authority sites
4. **Wikipedia/wiki entity recognition** as a trust anchor
5. **Content that directly answers categorical queries** (the "best X" listicle problem)

### 2b. Schema Markup — Partial Coverage

**What exists:**
- `WebApplication` schema on layout (site-wide) — present but minimal fields
- `BreadcrumbList` on champion pokemon pages — good
- `FAQPage` on champion detail pages — good start

**Critical gaps (each gap = missed citation opportunity):**

| Schema Type | Status | Impact |
|-------------|--------|--------|
| `Organization` with `sameAs` (social/Discord links) | Missing | High — entity recognition for AI |
| `FAQPage` on homepage | Missing | High — #1 schema for AI citation |
| `HowTo` on a guide page | Missing | High — instructional query citations |
| `SoftwareApplication` with `aggregateRating` | Missing | Medium — trust signal |
| `Article` on `/s/[id]` share pages | Missing | Medium — makes reports indexable as content |
| `ItemList` on `/explore` page | Missing | Medium — structured dataset signal |
| `BreadcrumbList` on all pages | Partial (champions only) | Low |

Research finding: Content with proper FAQPage schema shows 30–40% higher visibility in AI-generated answers. `FAQPage` is the single most-cited schema type by AI Overviews and LLM-powered search.

### 2c. Not Listed in Key VGC Tool Directories

These directories are heavily indexed as training data by AI models. VGC Team Report is absent from all of them:

- **victoryroad.pro/resources/** — most-linked VGC resource hub; cited in every "VGC tools" AI answer
- **smogon.com/tiers/vgc/resources** — highest domain authority in competitive Pokémon
- **vgcpedia.com/terminology / resources** — encyclopedia-style, strong entity signal
- **devoncorp.press/resources/up-to-date-vgc-resources** — active, updated community list
- **nimbasacitypost.com/2019/12/vgc-resources.html** — legacy community trust page
- **blog.poketeambuilder.app/best-team-builders-2025** — AI-facing roundup article

**AEO research finding:** 44.2% of all LLM citations come from the first 30% of source documents. A listing in a "resources" page with a brief description → that description becomes the content AI models pull for citations.

### 2d. No Educational Content Answering Category Queries

AI citation strongly favors pages that directly answer "what is the best X" or "how do I do X." VGC Team Report has no:
- Blog or guide content explaining team report methodology
- Comparison page ("VGC team builders compared")
- "How to write a VGC team report" tutorial
- Glossary of VGC terms
- FAQ page answering common user questions

Pikalytics wins citations for "best team builder" because it has usage data pages. Victory Road wins because it has a curated resources list. Both have content that directly answers AI queries. VGC Team Report has an excellent tool but no educational content wrapping it — making it invisible for category queries.

### 2e. Absent Community Co-mentions

For AI engines to cite a source, it must appear in multiple independent contexts. Findings:
- No Reddit threads found recommending VGC Team Report by name
- No Smogon threads linking to it as a community resource
- No YouTube content creator integrations or mentions found
- No tournament coverage outlets linking to team reports built with the tool
- Site appears in search primarily via its own domain, not third-party referrals

AEO research finding: Content formats driving the most AI citations are (1) listicles, (2) how-to guides, (3) community forum posts, (4) review platform profiles. VGC Team Report currently has none of these in indexed third-party locations.

---

## 3. Structured Data Additions That Would Increase Citation Probability

Priority ranked by expected citation impact:

### Priority 1: `Organization` schema on root layout
Establishes entity recognition. AI models use `sameAs` links to connect the domain to known social entities.
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "VGC Team Report",
  "url": "https://pokemonvgcteamreport.com",
  "description": "Free tool to build, share, and discover competitive Pokémon VGC team reports with matchup notes, damage calculations, and speed tiers.",
  "sameAs": [
    "https://twitter.com/[handle]",
    "https://discord.gg/[invite]",
    "https://github.com/[repo]"
  ]
}
```

### Priority 2: `FAQPage` on homepage
10 questions (see FAQ draft file) covering what the tool does, how to share a team, format support. FAQPage schema is the highest-ROI schema type for AI citation.

### Priority 3: `HowTo` on `/how-to-write-a-vgc-team-report` guide page
Steps: paste Showdown export → configure Pokémon details → add matchup notes → add damage calcs → add speed tier → publish → copy share link → embed in Discord. HowTo schema gets cited in instructional AI answers ("how do I...").

### Priority 4: `Article` schema on `/s/[id]` share pages
With `author`, `datePublished`, `about` (tournament name/format), `keywords`. Turns each team report into an indexable article instead of an opaque app state.

### Priority 5: `SoftwareApplication` upgrade on `WebApplication`
Add `applicationCategory`, `operatingSystem: "Web"`, `screenshot`, `creator`, `dateModified`. Link to Product Hunt or similar for future `aggregateRating`.

---

## 4. Content That Would Get VGC Team Report Cited

Ranked by AEO/GEO impact:

### Tier 1: Immediate Citation Potential

1. **`/faq` page with 10+ Q&As** (see draft in `.swarm/drafts/faq-page-draft.md`)
   - Covers: "What is VGC Team Report?", "How do I share a VGC team?", "What is a team report?", "Does it support Pokemon Champions?", "How is this different from PokéPaste?"
   - Add FAQPage JSON-LD to every answer
   - AI models preferentially cite FAQ sections — this is a direct path to citation

2. **`/how-to-write-a-vgc-team-report` guide**
   - 800–1200 word tutorial with the full workflow
   - Add HowTo schema markup
   - Answers the instructional query directly → AI cites it for "how to" prompts

3. **`/glossary` page** (VGC terminology definitions)
   - Cover 30–50 terms: Tailwind, Trick Room, Spread move, Tera Type, Mega Evolution, Regulation M, etc.
   - `DefinedTermSet` schema
   - Bulbapedia, Smogon, VGCpedia all have glossaries — this creates a competitive content asset

### Tier 2: Medium-term Citation Building

4. **Format-specific guide pages** (e.g., `/pokemon-champions-team-report`, `/regulation-m-team-building`)
   - Target current format queries with evergreen content
   - Naturally attract backlinks from VGC community posts

5. **`/compare` page** — "VGC Team Report vs PokéPaste vs VGC.tools"
   - Comparison content is heavily cited by AI for "which tool is best" queries
   - Positions VGC Team Report in the "team reporting/documentation" niche vs "team building" niche

6. **Tournament wrap-up blog posts** (e.g., "Top Teams at Indianapolis Regionals 2026")
   - Seasonal content with high search volume spikes
   - Earn backlinks from community coverage and Discord shares

### Tier 3: Authority-building Content

7. **Detailed team report examples** — published public reports from well-known VGC players or top-cut finishers
   - Incentivizes community sharing; each shared report = organic co-mention
   - Add `Article` schema to each public report

8. **"VGC team report template" downloadable / copyable format**
   - Targets "team report template" query
   - Gets cited in VGC community discussions about how to document teams

---

## 5. Directory & Backlink Targets (AI Training Signal)

Sites to approach for listing (ranked by domain authority / citation signal):

| Target | URL | Priority | Method |
|--------|-----|----------|--------|
| Victory Road Resources | victoryroad.pro/resources/ | **Critical** | Discord/Twitter DM |
| Smogon VGC Resources | smogon.com/tiers/vgc/resources | **Critical** | Forum post by community member |
| VGCpedia Directory | vgcpedia.com | **High** | Twitter/submission |
| DevonCorp Resources | devoncorp.press/resources/ | **High** | Twitter DM |
| Nimbasa City Post | nimbasacitypost.com/2019/12/vgc-resources.html | **Medium** | Twitter DM |
| blog.poketeambuilder.app | blog.poketeambuilder.app/best-team-builders-2025 | **Medium** | Email/DM |
| Product Hunt | producthunt.com | **Medium** | Full launch strategy |
| Limitless VGC | limitlessvgc.com | **Medium** | Team report integration ask |
| Game Rant VGC Resources article | gamerant.com/pokemon-vgc-useful-sites-resources/ | **Low** | Tip submission |

---

## 6. Competitive Landscape Summary

| Competitor | Why AI Cites Them | VGC Team Report Gap |
|-----------|-------------------|---------------------|
| Pikalytics | Usage data, stats, long domain age, multiple format support | No stats/data content; no educational content |
| Victory Road | Curated resources hub, long domain age, community trust | Not listed on VR; no comparable resource hub presence |
| Smogon | Highest DA in competitive Pokémon; team reports forum | No backlink from Smogon; no forum presence |
| VGC.tools | Community library, open team building | Positioned differently (reports vs builder) but no comparative content |
| Limitless VGC | Historical team archive, tournament results | No tournament integration or archive content |
| Champions Builder | Current-format focus, active updates, SEO-optimized pages | VGC Team Report has comparable features but less SEO-optimized |

---

## 7. Priority Action Plan

**Week 1 (highest ROI):**
- [ ] Add `Organization` + `FAQPage` schema to homepage
- [ ] Publish `/faq` page (draft ready in `.swarm/drafts/faq-page-draft.md`)
- [ ] Reach out to Victory Road for resources listing

**Week 2:**
- [ ] Publish `/how-to-write-a-vgc-team-report` guide with HowTo schema
- [ ] Reach out to VGCpedia and Smogon for directory listing
- [ ] Add `Article` schema to `/s/[id]` share pages

**Month 2:**
- [ ] Publish `/glossary` page
- [ ] Product Hunt launch
- [ ] Encourage community Reddit posts with real team report examples
- [ ] DevonCorp + Nimbasa City Post outreach

---

## Sources
- Pikalytics: https://www.pikalytics.com/
- VGC.tools: https://vgc.tools/
- Champions Builder: https://www.championsbuilder.com/
- Victory Road Resources: https://victoryroad.pro/resources/
- Smogon VGC Resources: https://www.smogon.com/tiers/vgc/resources
- VGCpedia: https://www.vgcpedia.com/terminology/
- Limitless VGC Teams: https://limitlessvgc.com/teams
- DevonCorp Resources: https://devoncorp.press/resources/up-to-date-vgc-resources
- Nimbasa City Post VGC Resources: https://www.nimbasacitypost.com/2019/12/vgc-resources.html
- Game Rant VGC Sites: https://gamerant.com/pokemon-vgc-useful-sites-resources/
- VGC Guide: https://www.vgcguide.com/teambuilding
- blog.poketeambuilder.app: https://blog.poketeambuilder.app/best-team-builders-2025
- GEO/AEO guide (Frase): https://www.frase.io/blog/what-is-answer-engine-optimization-the-complete-guide-to-getting-cited-by-ai
- GEO best practices (Firebrand): https://www.firebrand.marketing/2025/12/geo-best-practices-2026/
- GEO citation factors (TripleDart): https://www.tripledart.com/ai-seo/generative-engine-optimization
- AEO strategies 2026 (Brain Buzz): https://www.brainbuzzmarketing.com/13-aeo-in-2026-strategies-to-get-ai-to-recommend-you/
- Conductor AEO/GEO Benchmarks: https://www.conductor.com/academy/aeo-geo-benchmarks-report/
- JSON-LD structured data (Yoast): https://yoast.com/structured-data-schema-ultimate-guide/
- FAQ schema guide: https://seobotai.com/tools/faq-schema-generator/
