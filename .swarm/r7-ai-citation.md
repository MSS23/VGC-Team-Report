# R7: AI Citation Audit — Fresh Query Testing (2026-05-27)

## Queries Tested

Five queries searched to simulate what AI assistants (ChatGPT, Perplexity, Google AI Overviews, Claude) would surface.

## 1. Sites Consistently Cited by AI

| Rank | Site | Cited In Queries |
|------|------|-----------------|
| 1 | **Pikalytics** | 5/5 — appears for every VGC query |
| 2 | **crob.at** | 2/5 — owns "pokepaste alternative" niche |
| 3 | **Champions Lab** | 2/5 — team builder + meta hub |
| 4 | **Limitless VGC** | 2/5 — tournament data authority |
| 5 | **VGC Helper** | 2/5 — sharing + team sheets |
| 6 | **Pokestats.gg** | 1/5 — multi-format builder |
| 7 | **Game8** | 1/5 — team sharing board |
| 8 | **DevonCorp** | 2/5 — how-to guides, team lists |

**VGC Team Report** appeared only for its branded query ("VGC team report tool") at position 1. It was absent from all four category queries ("best VGC team builder", "how to share a VGC team", "pokepaste alternative", "pokemon competitive team sharing").

## 2. Why VGC Team Report Is Not Cited

**A. Thin indexed footprint.** Only 2 pages indexed (homepage + /champions). Competitors like Pikalytics have hundreds of indexed stat pages that each match long-tail queries.

**B. No FAQ/HowTo structured data.** AI engines in 2026 pull from FAQPage and HowTo JSON-LD schema at 2.5x the rate of unstructured content (BrightEdge study). VGC Team Report has SoftwareApplication schema but lacks question-answer markup.

**C. No authoritative backlinks.** Not listed on Victory Road /resources, DevonCorp tools page, Smogon forums, or Reddit community wikis. AI models weight co-mention frequency heavily.

**D. No evergreen content pages.** Competitors win category queries with how-to guides ("How to Create a VGC Team"), listicles ("38 Teams to Try"), and regulation guides. VGC Team Report has zero editorial content pages.

## 3. Content Structures That Get Cited

- **How-to guides** with step-by-step structure (DevonCorp, VGC Guide)
- **FAQ pages** with clear Q&A pairs and FAQPage schema
- **Tool comparison listicles** ("best VGC team builders 2026")
- **Data-rich stat pages** with per-Pokemon URLs (Pikalytics model)
- **Tournament recap content** linking tools to real results

## 4. Top Recommendations

1. **Add FAQPage JSON-LD** to homepage and /champions — answer "What is a VGC team report?", "How do I share my VGC team?", "What is a pokepaste alternative?"
2. **Create 3-5 evergreen content pages** targeting category queries: a how-to guide, a regulation guide, a "pokepaste alternative" comparison page
3. **Implement HowTo schema** on any tutorial/guide content
4. **Pursue backlinks** from Victory Road, DevonCorp, Smogon, and Reddit r/VGC wiki
5. **Expand indexed pages** — each champion page, each archetype guide = a new URL for AI to cite
6. **Fix applicationCategory** from "GameApplication" to "SportsApplication" in schema
