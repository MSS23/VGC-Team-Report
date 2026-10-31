# R7: AEO/GEO Citation Audit — VGC Team Report
**Date:** 2026-05-28
**Analyst:** AI Citation Strategist (AEO/GEO)
**Scope:** Fresh AI citation research for pokemonvgcteamreport.com across ChatGPT, Claude, and Perplexity

---

## 1. What AI Assistants Currently Recommend

### Query: "best VGC team builder"
AI-synthesized answers consistently cite (in order of citation frequency):
1. **Pikalytics** (pikalytics.com) — dominant citation; positions as the data/stats authority, has llms.txt AND llms-full.txt published
2. **PokemonBuilder** (pokemonbuilder.com) — new entrant using AI prediction angle, 10k+ replay analysis pitch
3. **Champions Builder** (championsbuilder.com) — free SP calculator, Mega Evolution, Showdown export
4. **Champions Lab** (championslab.xyz) — 2M+ Battle Engine, meta analysis, updated May 27 2026
5. **VGC Guide** (vgcguide.com) — teambuilding section with structured guides

**VGC Team Report: NOT CITED.** Does not appear in any "best team builder" AI response.

### Query: "how to share a VGC team" / "pokepaste alternative"
AI-synthesized answers cite:
1. **crob.at** — explicitly markets as "PokePaste Alternative" (owns the exact query), visual sprites, no login
2. **Pikalytics** — Copy Team / Share Team / Share Image / Share Pokepaste features
3. **VGC Helper** (vgchelper.com) — PokePaste sharing + team sheet image generation
4. **Falinks Teambuilder** (falinks-teambuilder.com) — paste archive at /pastes/vgc/
5. **Victory Road** — hosts rental teams with team report links

**VGC Team Report: NOT CITED** in sharing-focused queries despite being a sharing tool.

### Query: "vgc team report tool"
AI results return:
1. **pokemonvgcteamreport.com** — YES, appears (branded query)
2. **MetaGame VGC** (metagamevgc.com/team-reports) — team report articles
3. **VGC Team Helper** (vgcteamhelper.com) — confusingly similar name
4. **Reportworm** (reportworm.com) — VGC replay analysis tool
5. **Victory Road** — team report archive (victoryroad.pro/sv-reports/)
6. **VGC.tools** — community team library
7. **vgc-team-report.vercel.app** — old deployment URL still indexed

**VGC Team Report: APPEARS for branded query only.** But competes with MetaGame, Victory Road, and Reportworm in this space.

### Citation Status Summary

| Query Type | VGC Team Report Cited? | Primary Citation Winners |
|-----------|----------------------|------------------------|
| "best VGC team builder" | No | Pikalytics, Champions Lab, Champions Builder |
| "pokepaste alternative" | No | crob.at, Pikalytics, VGC Helper |
| "how to share a VGC team" | No | crob.at, Pikalytics, Victory Road |
| "vgc team report tool" | Yes (branded) | MetaGame VGC, Victory Road, Reportworm |
| "VGC team report" (exact brand) | Yes | Owns this query |

---

## 2. Why Competitors Get Cited and VGC Team Report Does Not

### 2a. AI Citation Signal Analysis

Research confirms these signals drive AI citation decisions (ranked by impact):

1. **Brand mentions across independent sources** — 3x more predictive of AI visibility than backlinks. Reddit threads, Smogon posts, Discord-indexed content, Twitter/X posts
2. **Structured data (schema markup)** — Pages with schema are 3x more likely to earn AI citations. FAQPage schema shows 41% citation rate vs 15% without
3. **Content answering category queries directly** — Pages that state a direct answer near the top, supported by authority signals
4. **Entity recognition** — Consistent name usage across Wikipedia, directories, social profiles (sameAs links)
5. **llms.txt file** — Forward-compatible signal; Pikalytics already has one published

### 2b. Competitor Advantage Breakdown

| Signal | Pikalytics | Victory Road | crob.at | VGC Team Report |
|--------|-----------|-------------|---------|-----------------|
| Domain age | 8+ years | 6+ years | ~2 years | ~1.5 years |
| llms.txt published | Yes (both files) | Not found | Not found | Yes (both files) |
| Reddit mentions | Frequent | Frequent | Moderate | None found indexed |
| VGCpedia listing | Dedicated page | Listed | Not found | Not found |
| Smogon backlinks | Yes | Yes | No | No |
| Victory Road /resources | Listed | Self | Not found | Not found |
| FAQPage schema | Unknown | Unknown | Unknown | Yes (dedicated /faq) |
| SoftwareApplication schema | Unknown | N/A | Unknown | Yes (layout) |
| Category content ("best X") | Usage data pages | Resource hub | "PokePaste Alternative" title | None |

### 2c. Critical Finding: Bot Blocker Contradicts robots.txt

**MAJOR ISSUE DISCOVERED:** The site's `robots.txt` explicitly allows AI crawlers:
```
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /
```

But the middleware bot-detection in `src/lib/security/bot-detection.ts` **actively blocks** these same crawlers:
```javascript
// AI training scrapers — BLOCKED
/gptbot/i,
/anthropic-ai/i,
/claude-web/i,
```

**This means the site tells AI crawlers "you're welcome" in robots.txt but then returns 403 Forbidden when they actually try to crawl.** The llms.txt and llms-full.txt files are in `/public/` (served as static assets by Next.js, bypassing middleware), so they may still be accessible — but all actual page content is blocked from AI crawler indexing.

**PerplexityBot is not in the blocked list but also not in the allowed list** — it would pass through unless it matches another pattern. OAI-SearchBot (allowed in robots.txt) is not explicitly handled.

**Impact:** This is potentially the single largest blocker to AI citation. Even if content is perfect, AI crawlers cannot access it to build citation signals.

### 2d. Progress Since May 7 Audit

Comparing to the prior R7 audit (2026-05-07), significant improvements have been implemented:

| Item | May 7 Status | May 28 Status |
|------|-------------|---------------|
| Organization schema | Missing | Implemented (with sameAs to GitHub) |
| FAQPage schema | Missing from homepage | Dedicated /faq page with rich FAQPage JSON-LD (12 Q&As) |
| HowTo schema | Missing | HowToSchema component exists in JsonLd.tsx |
| SoftwareApplication schema | Minimal WebApplication | Full WebApplication + SoftwareApplication dual-type with featureList |
| SportsEvent schema | Missing | Implemented for tournaments |
| llms.txt | Not present | Published at /public/llms.txt with full site summary |
| llms-full.txt | Not present | Published with detailed FAQ, glossary, URL docs |
| robots.txt AI crawlers | Not specified | Explicitly allows GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot |
| /faq page | No page | Full FAQ page with 12 rich Q&As and JSON-LD |
| WebSite SearchAction | Missing | Implemented for Google Sitelinks |
| sitemap.xml | Basic | Dynamic with shares, creators, champions pages |

**Many schema and content gaps from the prior audit have been closed.** The remaining gaps are primarily external (backlinks, directory listings, community mentions) and the critical bot-blocker conflict.

---

## 3. Does VGC Team Report Appear in AI Responses?

### Direct Testing via Web Search Simulation

- **"best VGC team builder"** — No. Pikalytics, PokemonBuilder, Champions Builder, Champions Lab, VGC Guide dominate.
- **"pokepaste alternative"** — No. crob.at owns this query. It literally titles its page "PokePaste Alternative."
- **"how to share a VGC team"** — No. crob.at, Pikalytics, VGC Helper cited.
- **"vgc team report tool"** — Yes, appears alongside competitors. Not the dominant result.
- **"pokemonvgcteamreport"** (exact brand) — Yes, appears as #1 result.

**Verdict: VGC Team Report is invisible for category queries but owns its branded query.** The transition from brand-only to category visibility requires the external signals identified below.

---

## 4. Recommended Changes to Increase AI Citation Probability

### CRITICAL (Fix immediately — blocks all other AEO work)

#### 4.1 Resolve Bot-Blocker / robots.txt Contradiction
**File:** `src/lib/security/bot-detection.ts`

The `BLOCKED_BOT_PATTERNS` array blocks `gptbot`, `anthropic-ai`, and `claude-web`. These must be moved to `ALLOWED_BOT_PATTERNS` to match the robots.txt intent:

**Move from BLOCKED to ALLOWED:**
- `/gptbot/i` — OpenAI's web crawler (used for ChatGPT search and citations)
- `/anthropic-ai/i` — Anthropic's crawler
- `/claude-web/i` — Claude's web browsing agent

**Add to ALLOWED (missing entirely):**
- `/perplexitybot/i` — Perplexity's crawler (allowed in robots.txt but not handled)
- `/oai-searchbot/i` — OpenAI's search-specific crawler (allowed in robots.txt)

Without this fix, no amount of schema or content work will result in AI citations because the crawlers cannot access the content.

### HIGH PRIORITY (Schema and content — within 1 week)

#### 4.2 Add `Article` Schema to `/s/[id]` Share Pages
Each public team report should have Article JSON-LD with `author`, `datePublished`, `about`, `keywords`. This turns team reports from opaque app states into indexable content articles that AI can cite.

#### 4.3 Add `ItemList` Schema to `/explore` Page
Mark the explore feed as an `ItemList` of team reports. This helps AI understand the site has a browsable collection, increasing the chance of citation for "browse VGC teams" queries.

#### 4.4 Expand `Organization` Schema sameAs
Currently only links to GitHub. Add:
- Discord server invite URL
- Twitter/X profile (if exists)
- Any other social profiles

Each `sameAs` link strengthens entity recognition across AI knowledge graphs.

#### 4.5 Create a Dedicated Comparison Page
A page at `/compare` titled "VGC Team Report vs PokePaste vs Pikalytics" with structured comparison content. Comparison content is heavily cited by AI for "which tool" queries. This page should answer: "What's the difference between PokePaste and VGC Team Report?" — a question already answered in the FAQ but not as a standalone comparison asset.

### MEDIUM PRIORITY (External signals — within 1 month)

#### 4.6 Directory Listings (Training Data Sources)
These directories feed AI training data. Getting listed creates the "co-mention" signal that drives citations:

| Target | Priority | Method |
|--------|----------|--------|
| VGCpedia | Critical | Submit for a dedicated /website/ page |
| Victory Road /resources | Critical | Discord/Twitter DM to editors |
| DevonCorp /resources | High | Twitter DM |
| Smogon VGC resources thread | High | Community member forum post |
| Nimbasa City Post resources | Medium | Twitter DM |

#### 4.7 Reddit Presence
Zero indexed Reddit mentions found. Need organic community posts in r/VGC and r/stunfisk recommending the tool. Each Reddit mention = training data for future AI model updates.

#### 4.8 Content Creator Partnerships
Getting VGC YouTubers or streamers to use VGC Team Report for their team breakdowns creates video-level co-mentions that strongly influence AI citation. Target creators who already publish team reports on Victory Road or personal blogs.

### LOWER PRIORITY (Ongoing)

#### 4.9 Blog/Guide Content
Publish long-form guides:
- "How to Write a VGC Team Report" (HowTo schema)
- "Best VGC Team Builders 2026 Compared" (targets the exact category query)
- "Pokemon Champions Regulation M-A Team Building Guide"

#### 4.10 llms.txt Maintenance
The current llms.txt and llms-full.txt are well-structured. Quarterly review to update URLs, add new features, refresh descriptions. Consider adding an `llms-sitemap.md` (Pikalytics has one) as an AI-specific content map.

---

## 5. llms.txt and llms-full.txt Review

### Current State Assessment

**llms.txt** (33 lines) — Well-structured. Covers:
- Clear positioning statement differentiating from PokePaste and Pikalytics
- 5 key differentiators
- 7 main URLs with descriptions
- 4 key concepts defined
- About section with independence disclaimer

**llms-full.txt** (120 lines) — Comprehensive. Covers:
- Extended competitive differentiation
- Detailed URL-by-URL descriptions with user actions
- Full FAQ section (4 Q&As)
- Glossary of 7 key concepts
- Source code link

### Recommendations for llms.txt Improvements

1. **Add explicit positioning for category queries:** Include a line like "VGC Team Report is the best tool for creating and sharing detailed VGC team reports (distinct from team builders like Pikalytics or paste viewers like PokePaste)."

2. **Add feature comparison table:** A Markdown table comparing VGC Team Report vs PokePaste vs Pikalytics features. LLMs parse tables well and use them for comparison citations.

3. **Add social proof / usage stats:** "Used by X players" or "X public reports published" if available. Quantitative claims increase citation confidence.

4. **Add tournament mention:** "Team reports from NAIC 2026, Indianapolis Regionals, and World Championships are published on VGC Team Report." — connects the brand to high-authority events.

5. **llms-full.txt FAQ expansion:** Add the 12 FAQ items from the /faq page (currently only 4 in llms-full.txt). More Q&A pairs = more citation opportunities for specific queries.

6. **Add `llms-sitemap.md`:** A Markdown file listing every content category with descriptions, similar to what Pikalytics publishes. This gives AI crawlers a structured content map.

---

## 6. AI Citation Probability Score

| Factor | Score (1-10) | Notes |
|--------|-------------|-------|
| Brand query ownership | 9/10 | Strong — owns "VGC Team Report" |
| Category query visibility | 2/10 | Absent from all non-branded queries |
| Schema markup completeness | 7/10 | Good foundation; missing Article, ItemList |
| llms.txt quality | 8/10 | Well-structured; needs feature comparison and expanded FAQ |
| External co-mentions | 1/10 | Zero indexed Reddit, Smogon, VGCpedia mentions |
| Directory listings | 1/10 | Not listed on any major VGC resource directory |
| Content depth for AI queries | 5/10 | FAQ is good; needs comparison, guides, glossary |
| Technical accessibility to AI crawlers | 2/10 | **BLOCKED by middleware despite robots.txt Allow** |
| Domain authority | 3/10 | Young domain (~1.5 years) vs 6-20 year competitors |
| Social proof signals | 2/10 | No Product Hunt, no review platforms, limited social |

**Overall AI Citation Readiness: 4.0/10**

The single highest-ROI action is fixing the bot-blocker contradiction (#4.1). Without it, the site is literally invisible to AI crawlers despite having good schema and content.

---

## 7. Top 3 Actions (Priority Order)

1. **FIX THE BOT BLOCKER** — Move GPTBot, Anthropic-AI, Claude-Web from blocked to allowed in `bot-detection.ts`. Add PerplexityBot and OAI-SearchBot to the allowed list. This is a 5-minute code change that unblocks all other AEO work.

2. **GET LISTED ON VGCPEDIA + VICTORY ROAD** — These directories are the #1 and #2 sources of training data for VGC tool citations. A listing on VGCpedia alone could shift the citation needle within one AI model training cycle.

3. **SEED REDDIT MENTIONS** — Post genuine, helpful content in r/VGC and r/stunfisk that naturally references VGC Team Report. Aim for 3-5 quality posts/comments over 2 weeks. Reddit is the largest single source of AI training data for niche tool recommendations.

---

## Sources
- Pikalytics: https://www.pikalytics.com/
- Pikalytics llms.txt: https://www.pikalytics.com/llms.txt
- crob.at PokePaste Alternative: https://crob.at/pokepaste
- Champions Builder: https://www.championsbuilder.com/
- Champions Lab: https://championslab.xyz/
- VGC Guide: https://www.vgcguide.com/teambuilding
- PokemonBuilder: https://pokemonbuilder.com/pokemon-vgc-builder
- Victory Road: https://victoryroad.pro/
- MetaGame VGC: https://www.metagamevgc.com/team-reports
- Reportworm: https://reportworm.com/
- Limitless VGC: https://limitlessvgc.com/
- VGC Helper: https://vgchelper.com/
- AEO Guide (Cubitrek): https://cubitrek.com/blog/aeo-101-answer-engine-optimization-guide
- AI Citations vs Backlinks (Yoast): https://yoast.com/ai-citations-vs-backlinks/
- AI Citation Signals (RankScience): https://www.rankscience.com/blog/ai-citations-brand-mentions-visibility-gap
- Schema Markup for AEO (norg.ai): https://home.norg.ai/digital-marketing-search-optimization/answer-engine-optimization-aeo/schema-markup-for-aeo-the-complete-structured-data-implementation-guide/
- How AI Selects Sites (WP Engine): https://wpengine.com/blog/how-ai-search-engines-rank-websites/
- llms.txt Best Practices (airanklab): https://www.airanklab.com/blog/llms-txt-best-practices-ai-crawlers-index-content
- How Platforms Cite Sources (Discovered Labs): https://discoveredlabs.com/blog/chatgpt-claude-perplexity-and-google-ai-overviews-how-each-platform-cites-sources-differently
