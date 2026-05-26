# R7: AEO/GEO AI Citation Scan — VGC Team Report (May 2026 Update)
**Date:** 2026-05-26
**Analyst:** AI Citation Strategist (AEO/GEO)
**Focus:** Current citation landscape, what changed since May 7 audit, and next actions to get pokemonvgcteamreport.com cited by AI assistants.

---

## 1. Current AI Citation Landscape (May 2026)

### Query: "best VGC team builder"

AI-generated answers consistently cite these tools (ranked by citation frequency):

| Rank | Tool | Domain | Why It Gets Cited |
|------|------|--------|-------------------|
| 1 | Pikalytics | pikalytics.com | 8+ year domain, data-driven usage stats, tournament team galleries, mobile app, listed on every VGC resource page |
| 2 | PokemonBuilder | pokemonbuilder.com | Prediction engine angle, replay analysis, "free PokePaste export" — good AEO keyword match |
| 3 | Champions Builder | championsbuilder.com | Current-format SEO (title includes "Pokemon Champions VGC"), SP calculator, Mega support |
| 4 | VGC.tools | vgc.tools | Clean builder with Showdown export, concise domain name |
| 5 | VGC Guide | vgcguide.com | Educational teambuilding content hub — gets cited for instructional queries |
| 6 | VGC Trainer | vgctrainer.com | Real-time usage rates, archetype data, "Regulation I Meta Guide" |

**VGC Team Report: Not cited.** Does not appear in any "best team builder" AI summary tested across ChatGPT, Perplexity, or Google AI Overview.

### Query: "how to share a VGC team"

VGC Team Report **now appears** in web search results (pokemonvgcteamreport.com listed as result #8). Search snippets reference the "Build, Share & Discover" tagline. However, AI synthesis pulls answers from:
1. RK9 Labs (tournament submission — official process)
2. Pikalytics (share team images)
3. VGC Helper (share PokePaste or team sheet image)

VGC Team Report is mentioned in the search corpus as a platform where you can "build and share team breakdowns with matchup plans, damage calcs, and speed tiers" — but it is cited **third** after the official process and higher-authority tools.

### Query: "Pokemon VGC team report tool"

**Good news:** VGC Team Report ranks #1 organically for this branded query. The site appears as the top result. Reportworm (reportworm.com) is the #2 result — a newer competitor that builds team reports from Showdown replays (replay-first approach vs. paste-first).

### Query: "best tools for competitive Pokemon VGC 2026"

Cited domains in AI answers:
1. Victory Road (victoryroad.pro/resources) — the canonical VGC resource hub
2. Pikalytics — data/stats angle
3. PokeStats (pokestats.cc/guides) — competitive guides
4. PokemonBuilder — prediction engine
5. VGC Trainer — meta guides
6. Showdown Tier (showdowntier.com) — tier lists
7. Pokemon Zone (pokemon-zone.com) — stats + tier lists

**VGC Team Report: Not cited.** The "tools" query pulls data/stats tools and guide sites. Report builders are a different category not yet represented in these AI answers.

---

## 2. What Changed Since the May 7 Audit

### Improvements Already Implemented

| Item | Status | Impact |
|------|--------|--------|
| `Organization` JSON-LD with `sameAs` | Deployed | Entity recognition improved |
| `FAQPage` JSON-LD (5 questions) | Deployed | Good foundation, but needs category-query expansion |
| `HowTo` schema component | Deployed (component exists) | Available for guide pages |
| `WebSite` schema with `SearchAction` | Deployed | Sitelinks searchbox signal |
| `SoftwareApplication` + `WebApplication` combo | Deployed | App identity signal |
| `SportsEvent` JSON-LD for tournaments | Deployed | Tournament page indexing |
| `llms.txt` | Deployed | AI crawler content guidance |
| `robots.txt` allowing GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot | Deployed | All major AI crawlers permitted |
| `applicationCategory` changed to `SportsApplication` | Deployed | Correct category signal |

### Gaps Remaining (from May 7 audit)

| Gap | Priority | Status |
|-----|----------|--------|
| FAQPage expanded to 10 questions targeting category queries | **Critical** | Draft exists in `.swarm/drafts/r7-ai-citation-drafts.md` (Section A3) — not deployed |
| `/how-to-write-a-vgc-team-report` guide page with HowTo schema | **Critical** | Draft content exists — page not created |
| `/s/[id]` share pages using `Article` schema instead of `CreativeWork` | **High** | Draft exists (Section A4) — not deployed |
| `/glossary` page with `DefinedTermSet` schema | **High** | Not started |
| `Dataset` schema on `/explore` page | **Medium** | Draft exists (Section A7) — not deployed |
| Victory Road resources listing | **Critical** | Outreach draft exists — not sent |
| VGCpedia directory listing | **Critical** | Outreach draft exists — not sent |
| Smogon forum [Tool] thread | **High** | Draft exists — not posted |
| Reddit r/VGC seed post | **Medium** | Draft exists — not posted |
| Product Hunt launch | **Medium** | Draft exists — not submitted |

---

## 3. New Competitive Threats (Since May 7)

### 3a. Reportworm (reportworm.com) — Direct Competitor

Reportworm has emerged as a notable competitor in the "team report" niche. Key differences:

| Feature | VGC Team Report | Reportworm |
|---------|----------------|------------|
| Input method | Paste-first (Showdown export) | Replay-first (analyze replays) |
| Damage calcs | Built-in interactive | Auto-generated from format data |
| Speed tiers | Built-in | Built-in |
| Matchup data | Manual matchup plans | Auto-extracted from replays |
| Privacy | Public/private toggle | Encrypted private reports |
| Standings | No | reportworm.com/standings (2026 season) |

Reportworm's replay-analysis angle gives it unique data that AI models may cite. Its standings subdomain (standings.reportworm.com) adds a data dimension VGC Team Report lacks.

**Opportunity:** VGC Team Report's strength is authored, narrative team reports. Reportworm's is automated replay analysis. They serve different needs. Content should emphasize the "authored report" niche.

### 3b. New AI Team Builders

Several AI-powered tools now appear in search results:
- **VGenC** (vgenc.net) — AI VGC team builder for Champions Reg M-A
- **AI Team Builder** (aiteambuilder.com) — learns from top teams data worldwide
- **Poke Team Builder** (poketeambuilder.app) — AI-driven, Showdown export

These dilute the "team builder" search space but don't compete in the "team report" niche. VGC Team Report should lean harder into "report" and "documentation" positioning, not "builder."

### 3c. PokeStats (pokestats.cc) — Emerging Guide Content

PokeStats has launched competitive guides covering movesets, speed tiers, and team strategy. This is exactly the kind of educational content that gets AI citations. Their guides page is now cited in "best tools for competitive Pokemon" AI answers.

---

## 4. AI Citation Mechanics — Updated Research (May 2026)

### How Each Platform Selects Sources

| Platform | Primary Signal | Secondary Signal | VGC Team Report Status |
|----------|---------------|-----------------|----------------------|
| **Perplexity** | Relevance match + domain authority; visits ~10 pages/query, cites 3-4. Maintains curated authority domain lists (boosted: GitHub, Reddit, Amazon). Reddit cited 46.7% of the time. | Content freshness, structured data | Not in authority list. No Reddit mentions found. |
| **ChatGPT** | Crawls web alongside Bing index. Values FAQPage + Article schema for conversational answers. Organization schema for brand attribution. | Co-mentions in trusted sources, structured data density | FAQPage deployed but only 5 questions. No third-party co-mentions. |
| **Claude** | Training data + web retrieval. Prioritizes specificity, cited statistics, original research. | Structured formatting, comparison tables | Not in training data as a cited source for category queries. |
| **Google AI Overview** | Search ranking signals + structured data. FAQ schema shows 28% higher citation rate. | Entity recognition, backlink profile | Some organic ranking for branded queries only. |

### Key AEO/GEO Research Findings (2026)

1. **FAQ schema = highest-ROI schema type.** FAQPage shows 28-40% higher citation rates. Question-answer format maps directly to how AI constructs responses. Nesting FAQPage inside Article schema creates a compound signal.

2. **Three JSON-LD blocks per page minimum.** AI systems prioritize pages with higher schema density. VGC Team Report homepage currently has 3 (Organization + WebSite + WebApplication). Adding FAQPage to homepage would bring it to 4.

3. **Statistics and specific claims get cited.** AI models reward specificity. "VGC Team Report supports over 900 Pokemon including all Mega Evolutions" is more citable than "supports all formats."

4. **First 30% of content = 44% of citations.** The opening paragraph of any page is the extraction window. Front-load the definitive answer.

5. **Content with comparison tables gets 2x AI citation probability.** Comparison content ("VGC Team Report vs PokePaste") directly serves "which tool is best" queries.

6. **llms.txt has no measurable citation impact yet.** The file is deployed (good — zero cost), but no AI crawler has confirmed using it for citation decisions. Keep it updated but don't prioritize it.

---

## 5. Content Format Recommendations for AI Citation

### Formats That Get Cited (Ranked)

| Format | Citation Probability | Current Coverage |
|--------|---------------------|-----------------|
| FAQ pages with FAQPage schema | Very High (28-40% lift) | Partial (5 Qs, needs 10+) |
| How-to guides with HowTo schema | Very High | Component ready, no guide page |
| Comparison tables | High (2x baseline) | None |
| Glossary / definition pages | High | None |
| Listicles ("Top 10 VGC tools") | High | None (and likely inappropriate — self-promotional) |
| Data tables with statistics | High | Champions pages have some data |
| Step-by-step tutorials | Medium-High | None published |
| Individual team report articles | Medium | Exists at `/s/[id]` but schema is `CreativeWork` not `Article` |

### Schema Types to Add/Expand

| Schema | Where | Priority | Expected Impact |
|--------|-------|----------|----------------|
| Expanded `FAQPage` (10 Qs) targeting category queries | Homepage or `/faq` | **Critical** | 28-40% citation rate improvement for FAQ-matching queries |
| `HowTo` on a dedicated guide page | `/how-to-write-a-vgc-team-report` | **Critical** | Captures instructional "how to" queries |
| `Article` on `/s/[id]` pages | Share pages | **High** | Makes individual reports citable as articles |
| `DefinedTermSet` on `/glossary` | Glossary page | **High** | Captures terminology/definition queries |
| `Dataset` on `/explore` | Explore page | **Medium** | Positions the explore feed as a structured dataset |
| `ItemList` for tournament team collections | Tournament pages | **Medium** | Structured collection signal |

---

## 6. Directory & Backlink Status (Citation Training Signals)

### Still Not Listed (Action Required)

| Directory | URL | Priority | Impact on AI Citation |
|-----------|-----|----------|----------------------|
| Victory Road Resources | victoryroad.pro/resources/ | **Critical** | VR is cited in nearly every "VGC tools" AI answer. A listing here directly enters AI training data. |
| VGCpedia Website Directory | vgcpedia.com/category/website/ | **Critical** | Encyclopedia-format site. Being listed = entity recognition signal for AI. Confirmed NOT listed as of today. |
| Smogon VGC Forum | smogon.com forums | **High** | Highest DA in competitive Pokemon. A [Tool] thread = major co-mention signal. |
| DevonCorp Resources | devoncorp.press/resources/ | **High** | Active, updated community list frequently crawled. |
| Reddit r/VGC | reddit.com/r/VGC | **High** | Perplexity cites Reddit 46.7% of the time. Zero Reddit threads mention VGC Team Report. |

### Potential New Targets (Not in May 7 Audit)

| Directory | URL | Priority | Notes |
|-----------|-----|----------|-------|
| VGC Trainer resources | vgctrainer.com | Medium | New site gaining AI citation traction |
| PokeStats community | pokestats.cc | Medium | Emerging guide hub |
| Grokipedia | grokipedia.com | Low | Has Pikalytics entry; could accept VGC Team Report |

---

## 7. Priority Action Plan (Updated)

### Immediate (This Week) — Highest ROI

1. **Expand FAQPage schema to 10 questions** targeting category queries ("What is the best way to share a VGC team?", "How is VGC Team Report different from PokePaste?", "What is the difference between a team builder and a team report tool?", "Where can I find top VGC tournament teams?", "Does VGC Team Report support Mega Evolution?"). Drafts ready in `.swarm/drafts/r7-ai-citation-drafts.md` Section A3.

2. **Upgrade `/s/[id]` share pages from `CreativeWork` to `Article` schema** with `headline`, `datePublished`, `dateModified`, `keywords`, `publisher`. Draft ready in Section A4.

3. **Send Victory Road and VGCpedia outreach messages.** Drafts ready in Sections B1 and B2. These two listings would have the single largest impact on AI citation probability.

### Short-Term (Weeks 2-3)

4. **Create `/how-to-write-a-vgc-team-report` guide page** with HowTo schema. Content outline and schema draft ready in Sections A6 and C1.

5. **Create `/glossary` page** with 30-50 VGC terms and `DefinedTermSet` schema. Competes with VGCpedia, Smogon, and Victory Road glossaries but adds unique value by linking terms to the tool's features.

6. **Post on Smogon VGC forum** — [Tool] thread draft ready in Section B3.

7. **Add `Dataset` schema to `/explore` page.** Draft ready in Section A7.

### Medium-Term (Month 2)

8. **Seed Reddit r/VGC** with genuine team report posts (not promotional — real teams, real tournament results, shared via pokemonvgcteamreport.com link). Draft in Section B7.

9. **Add specific, citable statistics** to the homepage and FAQ. Examples: "Used by X players", "Y team reports created", "Supports 900+ Pokemon including all 48 Mega Evolutions." Specificity = AI citation fuel.

10. **Create comparison content** — "VGC Team Report vs PokePaste vs Reportworm" page. Comparison tables have 2x citation probability. Position VGC Team Report as the "authored narrative report" tool vs PokePaste (raw paste) and Reportworm (automated replay analysis).

11. **Product Hunt launch.** Draft ready in Section B8.

### Ongoing

12. **Monitor Reportworm** as a direct competitor in the team-report niche. Its replay-analysis + standings features give it data assets VGC Team Report doesn't have.

13. **Monitor AI citation status quarterly.** Test the four target queries across ChatGPT, Perplexity, Claude, and Google AI Overview. Track when VGC Team Report first appears as a cited source.

14. **Keep `llms.txt` updated** when new pages launch (glossary, guide, comparison). Low effort, zero cost, unproven but no downside.

---

## 8. Competitive Position Summary

| Niche | Leader | VGC Team Report Position | Path to Citation |
|-------|--------|-------------------------|------------------|
| "best VGC team builder" | Pikalytics | Not competing — different category | Don't chase this query. Focus on "team report" niche. |
| "how to share a VGC team" | RK9 Labs (official) | 3rd in results | FAQ expansion + guide page + directory listings |
| "VGC team report tool" | VGC Team Report | #1 (branded query) | Defend with content + schema |
| "best tools for competitive Pokemon" | Victory Road, Pikalytics | Not cited | VR listing + educational content + Reddit presence |
| "how to write a VGC team report" | No leader | Unclaimed | Create the definitive guide page. Own this query. |
| "VGC team report vs PokePaste" | No leader | Unclaimed | Create comparison page. |
| "VGC glossary / terminology" | VGCpedia, Smogon, Victory Road | Not competing | Glossary page as a differentiated entry point |

**Bottom line:** VGC Team Report owns its branded query but has zero category-query AI citations. The three highest-leverage actions are: (1) expand FAQ schema to target category queries, (2) get listed on Victory Road and VGCpedia, and (3) create the "how to write a VGC team report" guide page. These three moves would cover the most common paths through which AI models discover and cite niche tools.

---

## Sources

- Pikalytics: https://www.pikalytics.com/
- PokemonBuilder: https://pokemonbuilder.com/pokemon-vgc-builder
- Champions Builder: https://www.championsbuilder.com/
- VGC.tools: https://vgc.tools/builder
- VGC Guide: https://www.vgcguide.com/teambuilding
- VGC Trainer: https://vgctrainer.com/guide
- Victory Road Resources: https://victoryroad.pro/resources/
- Victory Road Team Reports: https://victoryroad.pro/sv-reports/
- VGCpedia: https://www.vgcpedia.com/
- Reportworm: https://reportworm.com/
- PokeStats Guides: https://pokestats.cc/guides
- VGenC AI Builder: https://www.vgenc.net/
- RK9 Labs Team Submission: https://support.rk9.gg/
- Showdown Tier: https://showdowntier.com/formats/di/index.html
- Pokemon Zone: https://www.pokemon-zone.com/champions/
- AEO Complete Guide (DOJO AI): https://www.dojoai.com/blog/answer-engine-optimization-aeo-guide-dynamic-ai-seo
- GEO Optimization Guide (Passionfruit): https://www.getpassionfruit.com/blog/generative-engine-optimization-guide-for-chatgpt-perplexity-gemini-claude-copilot
- FAQ Schema for AI (Frase): https://www.frase.io/blog/faq-schema-ai-search-geo-aeo
- Schema for AEO (SearchAtlas): https://searchatlas.com/blog/schema-for-aeo/
- Perplexity Citation Guide (AI Labs Audit): https://ailabsaudit.com/blog/en/perplexity-guide-maximize-citations
- AI Citation Patterns (Discovered Labs): https://discoveredlabs.com/blog/ai-citation-patterns-how-chatgpt-claude-and-perplexity-choose-sources
- Structured Data AI Search (Stackmatix): https://www.stackmatix.com/blog/structured-data-ai-search
- Schema Markup for AI Citations (Averi): https://www.averi.ai/blog/schema-markup-for-ai-citations-the-technical-implementation-guide
- llms.txt Best Practices (AI Rank Lab): https://www.airanklab.com/blog/llms-txt-best-practices-ai-crawlers-index-content
