# R7: AI Citation Audit — VGC Team Report
**Date:** 2026-05-25
**Analyst:** AEO/GEO Citation Strategist
**Supersedes:** r7-ai-citation-strategy.md (2026-05-13), r7-aeo-geo.md (2026-05-10)

---

## Executive Summary

VGC Team Report (pokemonvgcteamreport.com) is **well-positioned for branded queries** but **absent from category/discovery queries** that AI engines answer. The site already has strong technical foundations (llms.txt, FAQPage schema, HowTo schema, Organization schema, WebApplication schema), but still lacks the **off-site authority signals** and **schema refinements** that would break it into the AI citation circle for high-volume queries like "best VGC team builder" or "where to find top VGC teams."

### Current Standing: B-

| Dimension | Grade | Rationale |
|-----------|-------|-----------|
| llms.txt presence | A | Both llms.txt and llms-full.txt exist with detailed, well-structured content |
| Schema.org markup | B+ | FAQPage, HowTo, WebSite, Organization, WebApplication, SportsEvent all present; gaps remain in /s/[id] pages and /explore |
| Content citability | B | FAQ answers are direct and AI-extractable; homepage is React app shell |
| Off-site authority | D | Zero presence on VGCpedia, Victory Road /resources, DevonCorp, Nimbasa City Post; no Smogon [Tool] thread |
| AI citation rate | C- | Cited for branded/share queries; absent from all category/discovery queries |

---

## 1. AI Citation Landscape (May 2026)

### Query simulation results

| User Query | Who Gets Cited by AI | VGC Team Report? |
|---|---|---|
| "best VGC team builder" | Pikalytics, PokemonBuilder, VGCGuide, Pokemon Zone, Limitless | **Not cited** |
| "how to share a VGC team" | VGC Team Report, Pikalytics, VGC Helper | **Cited** (secondary) |
| "VGC team report tool" | VGC Team Report, Victory Road, MetaGame VGC, Reportworm | **Cited** (branded) |
| "Pokemon Champions team builder 2026" | Pikalytics (dominant — 6 of top 9 results) | **Not cited** |
| "where to find top VGC tournament teams" | Pikalytics, Limitless VGC, Victory Road | **Not cited** |

### Why competitors dominate

1. **Pikalytics** — 8+ year domain, dedicated VGCpedia page, listed on every resource hub, structured per-Pokemon pages that give AI factual content to cite, has llms-full.txt
2. **Limitless VGC** — Tournament archive with massive depth; every event creates new citable content
3. **Victory Road** — Self-reinforcing resource hub; every "VGC resources" query returns it
4. **PokemonBuilder** — Uses "team builder" explicitly in domain name and H1, data-backed claims (simulations, replays)

### The naming collision problem

Smogon's "Team Reports" forum (smogon.com/forums/forums/team-reports.680/) has 20+ years of indexed content. AI models associate "VGC team report" with the Smogon genre (player-written forum posts), not a web tool. Victory Road also has "Team Reports for VGC" as a section header. This creates active suppression for category queries.

---

## 2. What VGC Team Report Already Has (Technical Strengths)

### llms.txt (Grade: A)
- `/public/llms.txt` — concise 33-line overview with positioning statement, differentiation, key URLs, and key concepts
- `/public/llms-full.txt` — 120-line extended version with FAQ answers, detailed page descriptions, glossary
- Both files follow the emerging standard well: definition-first opening, structured sections, machine-parseable URLs

### Schema.org Markup (Grade: B+)

| Schema Type | Location | Status |
|---|---|---|
| `Organization` | layout.tsx (via OrganizationJsonLd) | Present — `sameAs` has only GitHub; missing Twitter/Discord |
| `WebApplication` + `SoftwareApplication` | layout.tsx | Present — `applicationCategory` is still "GameApplication" (should be "SportsApplication") |
| `WebSite` + `SearchAction` | layout.tsx (via WebSiteSchema) | Present and correct |
| `FAQPage` | page.tsx (homepage) | Present — 5 questions, good content |
| `HowTo` | page.tsx (homepage) | Present — 5 steps |
| `SportsEvent` | /tournaments pages | Present |
| `CreativeWork` on /s/[id] | share pages | Present but weak (should be Article) |
| `BreadcrumbList` | /champions pages only | Missing from /faq, /explore, /s/[id] |
| `ItemList` on /explore | Missing | Not implemented |
| `Dataset` on /explore | Missing | Not implemented |

### Content Citability (Grade: B)
- FAQ answers open with direct, complete answers (AI extraction-friendly)
- llms-full.txt provides explicit comparison content ("Unlike PokePaste... Unlike Pikalytics...")
- Homepage is a React app shell — AI crawlers see minimal semantic HTML on first render
- /faq page has 11 detailed Q&As with structured answers

---

## 3. Critical Gaps

### Gap 1: `applicationCategory` mismatch (layout.tsx)
The `WebApplication` schema still says `"GameApplication"` while the `Organization` schema says `"SportsApplication"`. This inconsistency confuses entity resolution. Both should be `"SportsApplication"` — this is the enumeration that maps to competitive sports tools.

### Gap 2: Organization `sameAs` — only GitHub
Entity recognition requires cross-referencing social graph endpoints. Only having a GitHub link means AI models cannot verify entity identity against Twitter, Discord, or other platforms. Each `sameAs` entry is an entity anchor.

### Gap 3: Share pages (/s/[id]) use `CreativeWork` not `Article`
`CreativeWork` is a generic parent type with weak citation signal. `Article` with `headline`, `author`, `datePublished`, `keywords`, and `genre` turns every public report into a citable document in AI training corpora.

### Gap 4: Zero off-site authority presence
The single biggest gap. No listing on:
- VGCpedia /website/ directory
- Victory Road /resources
- DevonCorp /resources
- Nimbasa City Post /vgc-resources
- Smogon VGC forum (no [Tool] thread)
- "Best VGC Team Builders" roundup articles

AI models rely on these authority directories as ground truth for "what tools exist in the VGC space." Without presence here, VGC Team Report is invisible to category queries.

### Gap 5: No dedicated guide content for instructional queries
No "/how-to-write-a-vgc-team-report" guide page exists to own the instructional query space. Smogon has forum posts but no structured guide. This is an uncontested content gap.

---

## 4. 2026 AEO/GEO Best Practices Applied

### Key research findings (May 2026)

1. **Pages with valid structured data are 2.3x more likely to appear in Google AI Overviews** (Averi.ai 2026 study)
2. **Tables earn 2.5x more AI citations than prose** (81% extraction rate vs 23%)
3. **FAQPage schema pages earn 2.1x citation volume over 90 days** vs equivalent unstructured pages
4. **The five-schema stack (Article + FAQPage + BreadcrumbList + DefinedTerm + HowTo) roughly doubles citation rates** vs Article alone
5. **32,000+ referring domains = 3.5x citation likelihood** over 200 or fewer (ChatGPT specifically)
6. **Perplexity cites at 13% vs ChatGPT at 0.6%** — Perplexity is the fastest growth channel for VGC Team Report because it relies on real-time retrieval over training-data frequency
7. **llms.txt is now near-mainstream** but schema markup remains higher-priority for proven citation impact
8. **AI engines weight recency** — "Last updated" timestamps and refreshed content matter
9. **Definition-first sentences** in the opening 40-60 words of each section are critical for AI extraction
10. **Original data/research** that no competitor has earns AI citation automatically

### How VGC Team Report measures against best practices

| Best Practice | Current Status |
|---|---|
| Definition-first content | Good (llms.txt, FAQ answers) |
| Schema stack (5-type) | 4 of 5 present (missing DefinedTerm) |
| Recency signals | No "Last updated" timestamps on pages |
| Original data | Explore page IS original data but lacks Dataset schema |
| Authority backlinks | Critical gap — near-zero third-party citations |
| Table/list format content | Homepage is app UI, not prose/tables |

---

## 5. Monitoring & Measurement

### Recommended tracking cadence

1. **Weekly:** Run Perplexity queries for 5 target phrases, note whether VGC Team Report appears
2. **Monthly:** Check Google Search Console for /faq impressions from instructional queries
3. **After outreach:** Allow 4-8 weeks for crawl/index cycle before measuring impact
4. **After schema changes:** Allow 2-4 weeks for Google to re-process structured data

### Target KPIs

- Cited in 3/5 target queries by Perplexity within 60 days of outreach
- Appear in Google AI Overviews for "how to share VGC team" within 30 days of schema fix
- Victory Road + VGCpedia listings live within 2 weeks of outreach

---

## Sources

- Live web search results, May 25, 2026
- Frase AEO/GEO Guide: https://www.frase.io/blog/what-is-answer-engine-optimization-the-complete-guide-to-getting-cited-by-ai
- Search Engine Land GEO Guide 2026: https://searchengineland.com/mastering-generative-engine-optimization-in-2026-full-guide-469142
- LLMrefs GEO Guide: https://llmrefs.com/generative-engine-optimization
- Averi.ai Schema Markup Guide: https://www.averi.ai/blog/schema-markup-for-ai-citations-the-technical-implementation-guide
- Presenc.ai State of llms.txt 2026: https://presenc.ai/research/state-of-llms-txt-2026
- llms.txt Architecture Next Steps: https://duaneforresterdecodes.substack.com/p/llmstxt-was-step-one-heres-the-architecture
- Pikalytics: https://www.pikalytics.com/team
- Victory Road: https://victoryroad.pro/sv-reports/
- Limitless VGC: https://limitlessvgc.com/teams
