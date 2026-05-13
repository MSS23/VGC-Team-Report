# SEO Audit: VGC Team Report — Full Competitive Landscape Review
**Date:** 2026-05-13 (Wave 3 — supersedes previous)
**Site:** https://pokemonvgcteamreport.com

---

## Executive Summary

VGC Team Report is well-positioned for branded and long-tail Mega Pokemon queries, but is leaving substantial organic traffic on the table across five high-value keyword clusters: SP spread guides, speed tiers, Regulation M-A landing page, damage calculator landing page, and "how to write a VGC team report." The homepage title lacks the critical signals "Pokemon Champions" and "2026" that every major competitor includes. A new competitive wave of 6+ Pokemon Champions tools (Champions Lab, PikaChampions, Champions Builder, ChampTeams.gg, Porygon Labs) entered the market post-April 2026, making differentiation urgency high. The EV-spread terminology in page descriptions is now factually misleading: Pokemon Champions uses SP (Stat Points), not EVs — this is a content accuracy and trust issue in addition to a keyword one.

---

## 1. Competitor Keyword Map

### Pikalytics (pikalytics.com) — dominant authority
Title formulas observed:
- "VGC 2026 Pokemon Champions Competitive Stats | Pikalytics"
- "Pokemon Champions VGC 2026 Stats, Moves, Top Teams & Usage Rankings | Pikalytics"
- "Pokemon Champions VGC 2026 Team Builder | Pikalytics"
- "Pokemon Champions Damage Calculator VGC 2026 | Pikalytics"
- "Pokemon Champions VGC 2026 Tournament Top Teams | Pikalytics"

Pikalytics owns: usage stats, damage calculator, team builder, top teams, speed tiers. Does NOT own: team reports/write-ups, matchup plans, OTS generator.

### Victory Road (victoryroad.pro) — direct editorial competitor for "VGC team report"
- URL pattern: `/category/articles/reports/` for team write-ups
- Curated editorial reports from top players (not user-generated)
- Own: "VGC team report" editorial; "Pokemon Champions team report template"
- Lack: user-gen UGC platform, damage calc integration, OTS generator, creator profiles

### Limitless VGC (limitlessvgc.com) — tournament database
- Own: tournament results, player rankings, top-placing teams
- Backlink opportunity: Limitless team pages can link to VGC Team Report creator profiles

### PokePaste / VGCPastes
- PokePaste (pokepast.es): minimal SEO investment, site:search returns only ~3 pages
- VGCPastes: operates as an X/Twitter account only; no indexable web presence
- "pokepaste alternative" SERP: owned by crob.at and VR Pastes — gap for VGC Team Report

### New 2026 Entrants (threat: growing)
| Site | Primary focus | Keyword they own |
|---|---|---|
| championslab.xyz | Builder + simulator + meta | "Pokemon Champions simulator" |
| pikachampions.com | Free team builder 263 mons | "Pokemon Champions team builder free" |
| championsbuilder.com | SP calc + damage calc | "SP calculator Pokemon Champions" |
| champteams.gg | All-in-one builder + calc | "Pokemon Champions damage calculator" |
| porygonlabs.com | Damage calc + builder | "Pokemon Champions damage calc" |
| turnadus.com | Speed tiers | "VGC speed tiers" |

---

## 2. Current Site Metadata Assessment

### Homepage (`/`)
| Element | Current | Gap |
|---|---|---|
| Default title | "VGC Team Report — Build, Share & Analyse Your Pokémon VGC Team" | Missing "Pokemon Champions" and "2026" — every competitor includes these |
| Meta description | "The free VGC team report builder — share your VGC team with notes, matchup plans, and damage calcs. Supports Pokémon Champions, Mega Evolution, and all VGC team builder formats." | Good keyword coverage; "damage calcs" and "Mega Evolution" well-placed |
| OG title | "VGC Team Report — Build, Share & Discover Pokemon Teams" | Mismatched with title; no format signal |
| OG image | Set: `/opengraph-image` (1200×630) | Confirmed in layout.tsx; OK |
| Twitter card | `summary_large_image` | Good; no `twitter:site` handle |
| JSON-LD types | WebApplication + SoftwareApplication + Organization + WebSite + HowTo + FAQPage | Strong. Missing `sameAs` with social profile URLs |
| Lang | `en` | Correct |
| Canonical | pokemonvgcteamreport.com | Correct |
| robots | index + follow | OK |

### `/champions` page
| Element | Current | Gap |
|---|---|---|
| Title | "Pokemon Champions VGC Team Builder & Reports" | Good; "team builder" + "reports" both present |
| Description | "Build, share, and discover competitive Pokemon Champions VGC team reports. Create detailed Regulation M-A team breakdowns with Mega Evolution support, matchup plans, damage calcs, and speed tiers." | Strong — covers target keywords |
| JSON-LD | None | **GAP** — no structured data on hub page |
| H1 | Not confirmed (client component) | Needs audit of ChampionsContent.tsx |

### `/champions/[pokemon]` pages
| Element | Current | Gap |
|---|---|---|
| Title template | "${displayName} VGC Guide — EV Spreads, Movesets & Teams" | **"EV Spreads" is factually wrong for Pokemon Champions** — the game uses SP (Stat Points), not EVs. This creates a trust issue when users land expecting SP guidance. |
| Description | "Complete ${displayName} VGC guide for Pokemon Champions Regulation M-A: best EV spreads, movesets, damage calcs, and top competitive teams." | Same "EV spreads" accuracy issue |
| JSON-LD | WebPage + FAQPage + BreadcrumbList | Strong — FAQ schema earns rich snippets |
| Keywords meta | 15 tags per page | Google ignores keywords meta; consistent presence OK |
| FAQ items | 5-6 per pokemon including type, stone, ability, stats, legality | Good. Missing: SP spread FAQ item, team composition FAQ |

### `/explore` page
| Element | Current | Gap |
|---|---|---|
| Title | "Browse VGC Team Reports | Top Pokémon VGC Teams" | Weak — no year, no "Pokemon Champions" |
| Description | Strong with OTS, M-A references | Good keyword density |
| JSON-LD | CollectionPage | OK |

### `/tournaments` page
| Element | Current | Gap |
|---|---|---|
| Title | "VGC Tournament Results Archive | Team Reports 2026" | Good — "2026" present |
| Description | Mentions Regionals, Internationals, Worlds | Good |
| JSON-LD | None | GAP — no structured data |

### `/s/[id]` share pages
| Element | Current | Gap |
|---|---|---|
| Title | Dynamic: tournament/placement or species-based | Strong logic |
| OG image | `images: []` (intentionally empty) | Documented: OG image generation was unreliable. Text-only unfurl is intentional. |
| JSON-LD | CreativeWork with author, dates | Good |
| robots | noindex for private; index for public | Correct |

### `/creator/[name]` pages
| Element | Current | Gap |
|---|---|---|
| Title | "${creator}'s VGC Team Reports | VGC Team Report" | Acceptable |
| Description | "View ${creator}'s VGC competitive team reports, open team sheets (OTS), matchup analysis, and tournament results. Browse all public Pokemon VGC 2026 team builds shared by ${creator}." | Good feature keywords |
| JSON-LD | ProfilePage + Person | OK |

### `/dashboard` page
| Element | Current | Issue |
|---|---|---|
| Title | "Dashboard" | **No `robots: noindex`** — user-facing private page should be noindexed |
| Description | "Manage your VGC team reports, saved teams, and account." | |

### `/embed/[id]` page
| Element | Current | Issue |
|---|---|---|
| robots | None set | **No `robots: noindex`** — embed pages are iframes for embedding, not indexable content |

---

## 3. Top 10 Keyword Gaps

| # | Keyword Cluster | Monthly Intent Level | Top Ranker | Site Gap |
|---|---|---|---|---|
| 1 | `Pokemon Champions SP spread` / `stat point spread VGC 2026` | High + growing rapidly (new format) | PokeStats.cc, GenPkm, Game8 | Site uses "EV spread" throughout — factually wrong for Champions format; missing all SP-based search intent |
| 2 | `how to write a VGC team report` / `VGC team report template` | Mid — high-intent, low competition | None owns it clearly | No guide/blog content; VGC Team Report is the obvious authority but has no dedicated page |
| 3 | `VGC speed tiers 2026` / `Pokemon Champions speed tiers` | High volume | Turnadus, Pikalytics | Speed tier feature exists inside reports but no standalone SEO page capturing this query |
| 4 | `Regulation M-A VGC guide` / `Pokemon Champions format guide` | High informational | Pikalytics, VGC Coach Pro, PokeStats.cc | No dedicated regulation landing page at `/regulation-m-a` or similar |
| 5 | `VGC damage calculator` / `Pokemon Champions damage calculator` | Very high | Pikalytics /calc, Porygon Labs, ChampTeams.gg | Damage calc is embedded in reports but no keyword-targeting page — missing the intent entirely |
| 6 | `Pokemon Champions [Pokemon] guide` / `best [Pokemon] set Champions` | High long-tail (per pokemon) | Game8, Pikalytics, Pokemon-Zone.com | `/champions/[pokemon]` pages target this but use "EV spread" instead of "SP spread" — wrong format terminology losing the exact-match intent |
| 7 | `VGC open team sheet` / `OTS generator VGC` | Mid — high-intent tool query | No clear leader | OTS generator exists in app but no dedicated landing page or meta keywords on a standalone URL |
| 8 | `VGC team builder` (adjacent intent) | Very high | Pikalytics, 6+ new tools | Site correctly positioned as report tool, not builder — but `/champions` still uses "team builder" in title; should clarify distinction explicitly |
| 9 | `Indianapolis Regionals 2026 top teams` / `VGC 2026 Worlds teams` | High seasonal | Limitless VGC, Bulbagarden, Victory Road | `/tournaments` page exists but no tournament-specific landing pages (e.g., `/tournaments/indianapolis-2026`) |
| 10 | `Pokemon VGC 2026 metagame` / `Regulation M-A tier list` | High | Showdown Tier, Pikalytics, Pokemon-Zone.com | No metagame overview content page — entire site is tool-focused with no editorial landing content |

---

## 4. Structured Data Opportunities

### Currently implemented
- `WebApplication` + `SoftwareApplication` — root layout
- `WebSite` with `SearchAction` (Sitelinks Searchbox) — root layout
- `Organization` — root layout
- `FAQPage` — root `/faq` page, individual `/champions/[pokemon]` pages, and root layout inline
- `HowTo` — root layout (5-step guide)
- `WebPage` + `BreadcrumbList` — `/champions/[pokemon]`
- `CreativeWork` with `author`, `datePublished`, `dateModified` — `/s/[id]` share pages
- `CollectionPage` — `/explore`
- `ProfilePage` + `Person` — `/creator/[name]`

### Missing / recommended additions

**HIGH PRIORITY**

1. **`ItemList` schema on `/champions` hub page**
   The Mega hub page lists all legal Mega Pokemon in Reg M-A. Wrapping these in an `ItemList` JSON-LD would allow Google to potentially show these as rich results in SERPs for "best Mega Pokemon VGC 2026" queries.
   ```json
   {
     "@type": "ItemList",
     "name": "Legal Mega Pokemon — VGC 2026 Regulation M-A",
     "itemListElement": [{ "@type": "ListItem", "position": 1, "url": "...", "name": "Mega Kangaskhan" }, ...]
   }
   ```

2. **`TechArticle` or `Article` schema on future guide/blog pages**
   If any `/guides/` or `/regulation-m-a/` pages are added, `Article` schema with `author`, `datePublished`, `dateModified`, and `keywords` would enable news-rich snippets and article carousels.

3. **`SportsEvent` schema on `/tournaments` page and individual event pages**
   Indianapolis Regionals, VGC Worlds 2026 — these are indexable sporting events. `SportsEvent` with `startDate`, `endDate`, `location`, `organizer`, `url` creates event rich results.
   ```json
   {
     "@type": "SportsEvent",
     "name": "2026 Indianapolis Pokemon VGC Regional Championships",
     "startDate": "2026-05-29",
     "endDate": "2026-05-31",
     "location": { "@type": "Place", "name": "Indianapolis, IN" },
     "url": "https://pokemonvgcteamreport.com/tournaments/indianapolis-2026"
   }
   ```

4. **`VideoObject` schema if any YouTube embeds or guides are added**
   VGC team report tutorials would benefit from VideoObject markup if video walkthroughs are embedded.

**MEDIUM PRIORITY**

5. **Add `sameAs` to `Organization` and `WebApplication` JSON-LD**
   Link to GitHub, Twitter/X account (if exists) to strengthen entity association in Google's Knowledge Graph. Currently the Organization schema only has the GitHub sameAs but WebApplication has none.

6. **`HowTo` schema on a dedicated `/how-to-write-a-vgc-team-report` page (new content)**
   The existing HowTo in root layout targets the tool steps (paste → add notes → share), but a dedicated guide page with richer HowTo markup could capture "how to write a VGC team report" as a featured snippet.

7. **`FAQPage` additions for SP spread content**
   The existing `/faq` has 10 items. Missing FAQ items (with rich-snippet potential):
   - "What are SP spreads in Pokemon Champions?"
   - "How do SP spreads differ from EV spreads?"
   - "What is the best SP spread for Mega Kangaskhan?"
   - "What is the best SP spread for Mega Charizard Y?"

**LOW PRIORITY**

8. **`BreadcrumbList` on `/explore` and `/tournaments`**
   `/champions/[pokemon]` has this; adding it to other secondary pages ensures consistent breadcrumb display in SERPs.

9. **`WebPage` schema on `/faq` in addition to `FAQPage`**
   Google recommends nesting `FAQPage` inside a `WebPage` for richer signals on FAQ-only pages.

---

## 5. Quick-Win Fixes (Implementation Priority)

### Priority 1 — Metadata fixes (15-30 min each, zero build-cost)

**QW-1: Fix homepage title to include format and year (15 min)**
- Current: `"VGC Team Report — Build, Share & Analyse Your Pokémon VGC Team"`
- Proposed: `"VGC Team Report — Pokemon Champions Team Reports 2026"`
- File: `/src/app/layout.tsx` line 40
- Rationale: Every top competitor includes "Pokemon Champions" and "2026" in root title. Google title display shows first ~60 chars.

**QW-2: Add `twitter:site` handle (5 min)**
- Add `twitter: { site: "@VGCTeamReport" }` (or correct handle) to root metadata
- File: `/src/app/layout.tsx`

**QW-3: Add `robots: { index: false }` to `/dashboard` (10 min)**
- File: `/src/app/dashboard/page.tsx`
- Dashboard is a private authenticated page; indexing it provides no SEO value and surfaces a thin page

**QW-4: Add `robots: { index: false }` to `/embed/[id]` (10 min)**
- File: `/src/app/embed/[id]/page.tsx`
- Embed pages are iframes not meant for direct Google indexing

**QW-5: Fix "EV spreads" → "SP spreads / Stat Points" in Champions page descriptions (20 min)**
- Files: `/src/app/champions/[pokemon]/page.tsx` (lines 39, 62, 70, 222)
- Pokemon Champions uses SP (Stat Points), not EVs — this is factually incorrect and losing search intent for the new format's terminology
- Proposed title: `${mega.displayName} VGC Guide — SP Spreads, Movesets & Teams`
- Proposed description: `Complete ${mega.displayName} VGC guide for Pokemon Champions Regulation M-A: best SP spreads, movesets, damage calcs, and top competitive teams.`

**QW-6: Update `/explore` title to include "Pokemon Champions" and "2026" (10 min)**
- Current: `"Browse VGC Team Reports | Top Pokémon VGC Teams"`
- Proposed: `"Browse Pokemon Champions VGC Team Reports 2026 | Regulation M-A"`
- File: `/src/app/explore/page.tsx`

**QW-7: Add `ItemList` JSON-LD to `/champions` page (30 min)**
- File: `/src/app/champions/page.tsx`
- Adds structured data for the hub listing all legal Mega Pokemon
- Can source the list from `MEGA_POKEMON_LIST` already imported in sitemap.ts

**QW-8: Add `SportsEvent` JSON-LD to `/tournaments` page (45 min)**
- File: `/src/app/tournaments/page.tsx`
- Add known upcoming events: Indianapolis Regionals (May 29-31), VGC Worlds San Francisco (Aug 28-30)
- Enables event rich results in Google search

**QW-9: Add SP/stat-point FAQ items to `/faq` page (20 min)**
- File: `/src/app/faq/page.tsx`
- Add 3-4 new FAQ items covering the SP system, how it differs from EVs, and how to use VGC Team Report with Champions format
- Also add to `FAQPageJsonLd` component in `/src/components/seo/JsonLd.tsx`

### Priority 2 — New content pages (1-3 days development)

**NP-1: `/regulation-m-a` — Regulation M-A format guide landing page**
- Target: "Regulation M-A VGC guide", "Pokemon Champions Reg M-A", "what is Regulation M-A"
- Content: format overview, legal Pokemon list (59 Mega forms), tournament schedule, SP spread basics
- Link internally to all `/champions/[pokemon]` pages

**NP-2: `/guides/how-to-write-a-vgc-team-report` — editorial guide**
- Target: "how to write a VGC team report", "VGC team report template", "team report guide"
- Content: what sections a team report should have, how to document damage calcs, matchup plan templates
- This keyword cluster has no clear owner — VGC Team Report is the most logical authority
- Include `HowTo` + `Article` JSON-LD

**NP-3: `/speed-tiers` — Regulation M-A speed tier reference page (HIGHEST ROI)**
- Target: "VGC speed tiers 2026", "Pokemon Champions speed tiers", "Regulation M-A speed tier calculator"
- Currently owned by Turnadus and Pikalytics; no clear wiki or guide authority
- Static/SSG page listing key speed benchmarks for all 59 Mega forms
- Provides dense internal links to `/champions/[pokemon]` pages
- Very low competition for the guide-format angle

---

## 6. Sitemap Gaps

| URL | In Sitemap | Priority | Action |
|---|---|---|---|
| `/regulation-m-a` (new) | N | High | Add when page is created |
| `/speed-tiers` (new) | N | High | Add when page is created |
| `/compare` | N | Low | Add at priority 0.4 |
| `/dashboard` | N | Do NOT add | Private authenticated page |
| `/embed/[id]` | N | Do NOT add | Embed-only pages |
| `/changelog` | Y (priority 0.3) | OK | — |

The sitemap currently has no `lastModified` on any static pages except share pages. Adding `lastModified: now` to static entries helps Google freshness signals — already handled for `/s/[id]` but not for `/`, `/explore`, `/champions`.

---

## 7. Technical SEO Checklist

| Item | Status | Notes |
|---|---|---|
| robots.txt | PASS | Correct disallow /api/, explicit AI bot allowances, sitemap declared |
| Canonical tags | PASS | All pages have canonical in alternates |
| `lang="en"` | PASS | On root html element |
| metadataBase | PASS | Set to pokemonvgcteamreport.com |
| OG image (root) | PASS | opengraph-image.tsx present |
| Twitter card | PASS | summary_large_image on most pages |
| `twitter:site` | FAIL | Not set anywhere — minor but easy fix |
| noindex on private pages | PARTIAL | `/s/[id]` private shares are noindexed; `/dashboard` and `/embed/[id]` are not |
| Breadcrumbs | PARTIAL | Present on `/champions/[pokemon]`; absent on other secondary pages |
| Core Web Vitals | N/A | Not testable from codebase audit; test in PageSpeed Insights |
| hreflang | N/A | English-only — correct to omit |
| Duplicate content | LOW RISK | Vercel subdomain redirects to canonical domain |

---

## 8. Content Accuracy Issue (Critical)

**The use of "EV spreads" throughout Champions-facing pages is factually incorrect.**

Pokemon Champions (launched April 2026) replaced Effort Values with Stat Points (SP). Players get 66 SP total, max 32 per stat. "EV spread" queries exist for legacy Scarlet & Violet Regulation I content, but for Pokemon Champions specifically, search queries are shifting to "SP spread", "stat point spread", "SP training", "stat points" — and those are the queries growing fastest post-April 2026.

Affected files:
- `/src/app/champions/[pokemon]/page.tsx` — title and description templates
- `/src/app/champions/[pokemon]/page.tsx` — FAQ answer text
- `/src/components/seo/JsonLd.tsx` — FAQPageJsonLd component (references "EV spreads" in answers)

Recommended fix: dual-mention in descriptions ("SP spreads / stat points") to capture both legacy EV terminology (legacy users searching) and new SP terminology (current Champions players). Full pivot to SP terminology should happen as Champions becomes established.

---

## 9. Competitor Keyword Coverage Matrix (May 2026)

| Keyword | Pikalytics | Victory Road | Limitless | ChampTeams.gg | PokeStats.cc | VGC Team Report |
|---|---|---|---|---|---|---|
| VGC 2026 / Pokemon Champions | Y | Y | Y | Y | Y | Partial (not in root title) |
| team report / write-up | N | Y | N | N | N | Y (core product) |
| SP spread / stat points | Y | N | N | Y | Y | **NO** — uses "EV spread" |
| damage calculator | Y | N | N | Y | N | N (feature, no page) |
| speed tiers | Y | N | N | N | Y | N (feature, no page) |
| Regulation M-A guide | Y | Y | N | N | Y | N (no landing page) |
| Mega Evolution VGC 2026 | Y | Y | N | Y | N | Y (/champions hub) |
| matchup plan VGC | N | Y | N | N | N | N (feature, no page) |
| OTS generator VGC | N | N | N | N | N | N (feature, no page) |
| tournament results VGC | Y | Y | Y | N | N | Partial (/tournaments) |
| pokepaste alternative | N | N | N | N | N | Partial (description only) |
| VGC team builder | Y | N | N | Y | N | Partial (/champions title) |

---

## 10. SERP Visibility Snapshot (May 2026)

| Query | VGC Team Report position | Top ranker |
|---|---|---|
| "VGC team report" | 2nd-3rd (strong) | Victory Road |
| "Pokemon Champions VGC team report" | Top 5 | VGC Team Report |
| "VGC team builder 2026" | Not ranking | Pikalytics, 6+ new tools |
| "Pokemon Champions SP spread" | Not ranking | PokeStats.cc, GenPkm, Game8 |
| "VGC speed tiers 2026" | Not ranking | Turnadus, Pikalytics |
| "Regulation M-A VGC guide" | Not ranking | Pikalytics, VGC Coach Pro |
| "Pokemon damage calculator Champions" | Not ranking | Pikalytics, ChampTeams.gg |
| "Mega Kangaskhan VGC guide" | Partial (/champions/mega-kangaskhan) | Limitless, Pikalytics, The Game Haus |
| "OTS generator Pokemon" | Not ranking | No clear leader — opportunity |
| "VGC team report template" | Not ranking | Victory Road, Scribd |
| "pokepaste alternative" | Not ranking | crob.at, VR Pastes |

---

*Content change drafts: `.swarm/drafts/r6-seo-content-drafts.md`*
