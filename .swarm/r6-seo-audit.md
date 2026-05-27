# SEO Audit — VGC Team Report (2026-05-27)
**Domain:** https://pokemonvgcteamreport.com
**Scope:** Competitive keyword ranking, sitemap coverage, structured data, keyword gaps vs Pikalytics/PokePaste, basic on-page SEO issues.

---

## 1. Search Ranking Snapshot

| Keyword | VGC Team Report | Top Rankers |
|---------|----------------|-------------|
| "vgc team builder" | Not in top 8 | Pikalytics #1, PokemonBuilder #2, ChampionsBuilder #3 |
| "pokemon vgc team report" | #1 (homepage) | VictoryRoad #4, Reportworm #6 |
| "vgc team sharing" | Not in top 8 | Pikalytics #1, VGC Helper #2, VR Pastes #3 |
| "best vgc teams 2026" | Not in top 8 | Pikalytics #1-3, Pokemon-Zone #3, VGenC #5 |
| "pokepaste alternative" | Not in top 8 | crob.at #2, Falinks #5 |
| "vgc speed tiers" | Position ~7 (champions page) | Pikalytics #1, vgcdata #2, VGC Lite #3 |
| "vgc open team sheet generator" | Not in top 8 | dhsufi.github.io #1, VGC OTS Chrome #2 |
| "vgc ev spread calculator" | Not in top 8 | Pikalytics #1, ChampCalc #2, Porygon Labs #3 |

**Only 2 of 8 queries** bring VGC Team Report into visible results. The site owns its brand term but is invisible for high-volume generic VGC keywords.

## 2. Sitemap Analysis

The dynamic `src/app/sitemap.ts` covers:
- 9 static pages (homepage, explore, champions, faq, feedback, tournaments, changelog, privacy, terms)
- All Mega Evolution landing pages (`/champions/[slug]`)
- Up to 5,000 public shares (`/s/[id]`)
- Creator profile pages (`/creator/[name]`)

**Missing from sitemap:** `/compare` page has full metadata and canonical but is absent from sitemap -- minor gap.

## 3. Structured Data (JSON-LD)

Strong coverage across pages:
- **Root layout:** Organization, WebSite (with SearchAction), WebApplication/SoftwareApplication
- **Homepage:** FAQPage (5 Q&As), HowTo (5 steps)
- **Champions index:** ItemList for Mega Pokemon
- **Champions/[pokemon]:** FAQPage + WebPage per Mega
- **Tournaments:** SportsEvent per event
- **Share pages:** Dynamic CreativeWork per report
- **Creator pages:** ProfilePage schema

No critical schema errors in code. `applicationCategory: "SportsApplication"` on Organization is cosmetic mismatch (belongs on SoftwareApplication only).

## 4. Top 10 Keyword Gaps vs Pikalytics & PokePaste

1. **"vgc team builder"** -- Pikalytics owns; no dedicated builder landing page
2. **"vgc usage stats"** -- Pikalytics core; no equivalent content
3. **"vgc damage calculator"** -- Pikalytics, Porygon Labs rank; calcs are in-report only
4. **"pokepaste alternative"** -- crob.at ranks; VGC Team Report doesn't target the term
5. **"best vgc teams 2026"** -- /explore could rank with keyword targeting
6. **"vgc open team sheet" / "OTS generator"** -- has OTS export, no landing page
7. **"vgc speed tiers"** -- Pikalytics, standalone tools rank above; needs standalone page
8. **"pokemon champions teams"** -- MetaVGC, Pikalytics dominate; /champions focuses on Megas
9. **"vgc stat point calculator"** -- ChampCalc, Pikalytics rank; SP builder is in-app only
10. **"vgc matchup chart"** -- no competitors dominate yet; matchup plans are in-app only

## 5. On-Page SEO Issues

| Issue | Pages | Severity |
|-------|-------|----------|
| Missing meta description | `/privacy`, `/terms` | Low |
| Homepage is `"use client"` -- relies on JS for content | `/` | **High** |
| `/compare` missing from sitemap | sitemap.ts | Low |
| Duplicate OG image entries | Root layout | Low |
| Organization schema has wrong applicationCategory | layout.tsx | Low |

**Critical finding:** The homepage (`page.tsx`) is entirely client-rendered. Googlebot eventually hydrates JS, but initial crawl sees no text. FAQPage and HowTo JSON-LD are also injected client-side. This is the single biggest SEO risk -- all competitors serve SSR content for their primary landing pages.

---

*Word count: ~395*
