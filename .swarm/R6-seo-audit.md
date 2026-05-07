# SEO Audit — VGC Team Report
**Audit date:** 2026-05-07  
**Primary domain:** https://pokemonvgcteamreport.com  
**Deploy URL:** https://vgc-team-report.vercel.app

---

## 1. Technical SEO Checklist

### Domain & Canonicalization
- **Primary domain:** `pokemonvgcteamreport.com` — correctly set as `metadataBase` and in all canonical tags.
- **Vercel URL vs. custom domain:** The site is served from both `vgc-team-report.vercel.app` and `pokemonvgcteamreport.com`. No redirect was verifiable remotely (live site returned 403 during fetch), but the code emits canonical tags pointing to `pokemonvgcteamreport.com` on all pages — this is correct practice; Google should consolidate crawl equity on the custom domain.
- **robots.txt:** Present at `https://pokemonvgcteamreport.com/robots.txt`. Content is correct:
  ```
  User-agent: *
  Allow: /
  Disallow: /api/
  Sitemap: https://pokemonvgcteamreport.com/sitemap.xml
  ```
  No issues found.

### Sitemap
- **Present:** Yes — dynamically generated via `src/app/sitemap.ts`.
- **Static entries:** `/`, `/explore`, `/champions`, `/changelog`, `/privacy`, plus all `/champions/[slug]` Mega landing pages at priority 0.8.
- **Dynamic entries:** All public `/s/[id]` shares (up to 5,000) and `/creator/[name]` profile pages — both pulled from DB.
- **Issues:**
  - `/compare`, `/dashboard`, `/feedback`, `/terms` are absent from the sitemap. Most are appropriately excluded (auth-gated, legal), but `/compare` and `/feedback` could arguably be included or confirmed excluded intentionally.
  - No `<lastmod>` date on static pages; share pages correctly use `updated_at`.
  - Creator pages have no `lastmod` — minor gap.

### Structured Data (JSON-LD)
- **Root layout:** `WebApplication` schema with name, URL, description, `applicationCategory: "GameApplication"`, and a `price: "0"` Offer. Well formed.
- **Root layout also includes:** `Organization` schema (name, URL, sameAs GitHub) and `FAQPage` schema with 5 Q&A entries covering "What is a VGC team report?", sharing, Reg M-A, PokePaste import, and free tier. All present and accurate.
- **`/explore` page:** `CollectionPage` schema. Good.
- **`/champions/[pokemon]` pages:** No page-level JSON-LD (metadata only — no schema object injected). **Gap: these pages lack a structured data block** that could earn rich results.
- **`/s/[id]` share pages:** No JSON-LD. These are the most-shared URLs; a `SportsEvent` or `CreativeWork` schema here would help.
- **`/creator/[name]`:** `ProfilePage` + `Person` schema. Good.

### Open Graph / Social Meta
- **Root og:title/description:** Present, generic. No og:image defined in the root `metadata` object — but there IS a dynamic `opengraph-image.tsx` at the app root that Next.js maps to `og:image` automatically. Same exists for `/explore` and `/champions` and `/s/[id]`. This is correct usage.
- **Twitter card:** `summary_large_image` on all pages. Correct.
- **`/champions/[pokemon]` pages:** Title and description in metadata but **no og:image** — the `/champions/opengraph-image.tsx` file covers the index but individual pokemon slug pages have no OG image. This means social shares of Mega-specific pages render the generic fallback card rather than a Pokemon-specific image.
- **Creator pages:** No og:image at all; generic fallback applies.

### Page-Speed / Indexability Signals
- Homepage is `"use client"` — SSR is minimal at the root. This means the default paste-input screen has very little crawlable content for Google.
- Share pages (`/s/[id]`) use `generateMetadata` (SSR) — crawlable metadata is generated server-side. Good.
- Champions landing pages use `revalidate = 3600` ISR. Good for freshness.

---

## 2. On-Page Metadata Inventory

| Page | Title | Meta Description | og:image | JSON-LD | Canonical |
|------|-------|-----------------|----------|---------|-----------|
| `/` (homepage) | "VGC Team Report" | 155-char description present | Via `opengraph-image.tsx` | WebApplication + Organization + FAQPage | Yes |
| `/explore` | "Explore VGC Team Reports" | Present | Via `opengraph-image.tsx` | CollectionPage | Yes |
| `/champions` | "Pokemon Champions VGC Team Builder & Reports" | Present | Via `opengraph-image.tsx` | None | Yes |
| `/champions/[slug]` | "{Pokemon} VGC Guide — EV Spreads, Movesets & Teams" | Present | **Missing** (no per-slug OG image) | **Missing** | Yes |
| `/s/[id]` | Dynamic (tournament + species) | Dynamic (placement + species bullets) | Via `opengraph-image.tsx` | **Missing** | Yes |
| `/creator/[name]` | "{name}'s VGC Teams \| VGC Team Report" | Minimal ("View all public...") | **Missing** | ProfilePage + Person | Yes |

---

## 3. Keyword Gap Analysis

### Current Visible Rankings (evidence from search)
The site appears in Google results for branded queries and some long-tail queries:
- "pokemon VGC team report damage calc matchup plan" — ranks (confirmed in SERP)
- "VGC Team Reports Pokemon Champions" — ranks (seen in SERP snapshot)
- "VGC 2026 pokemon champions team builder regulation M-A" — appears in results

### Competitor Landscape
| Competitor | Domain Authority | Key Traffic Sources |
|-----------|-----------------|-------------------|
| pikalytics.com | Very High | "VGC usage stats", "pokemon EV spread", "[Pokemon] moveset VGC", "VGC damage calculator", "VGC speed tiers", "pokemon champions stats" |
| pokepast.es | High | "pokepaste", "pokemon team paste", "share pokemon team" |
| limitlessvgc.com | High | "VGC teams", "VGC tournament results", "top cut teams" |
| victoryroad.pro | High | "VGC team reports", "VGC rental teams", "VGC coverage" |
| crob.at | Medium | "pokepaste alternative", "share pokemon team online" |

### Top 10 Keyword Gaps (High Volume, Not Currently Targeted)

1. **"pokemon VGC team builder"** (est. high volume)
   - Who ranks: Pikalytics (#1), PikaChampions, ChampionsMeta
   - Gap: The site has a team report/analysis tool, but doesn't market itself as a "team builder" in title tags. The word "builder" is in the Champions page title but not the homepage.

2. **"pokepaste alternative"** (est. medium-high volume)
   - Who ranks: crob.at, VGC Helper, Falinks Team Builder
   - Gap: The site imports from pokepast.es and creates PokePaste links — it is functionally a pokepaste alternative with much richer features, but zero on-page copy targets this query.

3. **"VGC team sharing"** (est. medium volume)
   - Who ranks: crob.at, various community posts
   - Gap: The site's core use case is sharing VGC teams; no page title or description directly uses "team sharing."

4. **"pokemon VGC EV spreads"** (est. high volume)
   - Who ranks: Pikalytics, vgcguide.com
   - Gap: EV spreads are displayed in reports but no page is optimized for this keyword. The champions/[pokemon] pages show EV spreads and could rank for "[Pokemon] EV spread VGC" but the description doesn't emphasize the spread lookup use case strongly enough.

5. **"VGC speed tiers 2026"** (est. medium-high volume)
   - Who ranks: Pikalytics speed-tiers page, aquadragon.github.io
   - Gap: Speed tier data is embedded in reports but there is no dedicated /speed-tiers page or any copy targeting this query.

6. **"VGC 2025 teams"** / **"VGC 2026 teams"** (est. high volume)
   - Who ranks: Limitless VGC, Victory Road, Pikalytics top teams
   - Gap: The /explore page hosts these but its title ("Explore VGC Team Reports") doesn't include "2025" or "2026" and has no year-keyed content. Individual share pages are crawlable but the index page isn't optimized for time-qualified queries.

7. **"pokemon VGC damage calculator"** (est. high volume)
   - Who ranks: Pikalytics calc, Porygon Labs, vgcmulticalc.com
   - Gap: The site includes inline damage calcs per team report, but no page targets "VGC damage calculator" directly. This is a high-volume adjacent query.

8. **"VGC tournament team top cut"** (est. medium volume)
   - Who ranks: Victory Road, Limitless VGC, Top Cut Explorer, Bulbagarden
   - Gap: The explore and share pages contain tournament data (placement, tournament name) but no SEO copy surfaces "top cut" terminology.

9. **"VGC team report [regulation]"** — e.g., "VGC Regulation H team report", "Regulation I team report" (est. medium volume)
   - Who ranks: Victory Road
   - Gap: Regulation tags exist in the data model and UI but there are no dedicated /explore?regulation=H landing pages with regulation-keyed metadata. Each regulation set has its own search audience.

10. **"pokemon champions mega evolution team"** (est. medium volume, growing fast)
    - Who ranks: ChampionsMeta, VGCCoach, Porygon Labs
    - Gap: The /champions page targets Reg M-A but the phrase "mega evolution team" appears nowhere in title tags or descriptions on the index. The per-Pokemon slug pages are better positioned but their titles emphasize "guide" rather than team strategy.

---

## 4. Structural SEO Issues (Priority Ordered)

### Critical
1. **Homepage has no crawlable H1.** The root `/` is `"use client"` and renders either a blank paste input or a team report — neither has a static H1 that Google sees on first crawl. Every other page uses SSR/ISR metadata correctly, but the homepage is a JS-only app shell.

2. **No og:image on champion slug pages.** Social shares of `/champions/charizard-mega-x` etc. will show a generic fallback rather than a Pokemon-specific card. These are the highest-SEO-potential pages (long-tail EV/moveset queries) and social sharing is an important traffic driver.

### High Priority
3. **Homepage title is too weak.** "VGC Team Report" — 16 characters — is purely brand. Google truncates at ~60 chars; there's room for "VGC Team Report — Build, Share & Analyze Pokemon Competitive Teams" or similar. The OG title is better ("VGC Team Report — Build, Share & Discover Pokemon Teams") but isn't reflected in the `<title>` default.

4. **Creator page descriptions are bare.** `"View all public VGC team reports by {name}."` has no competitive signal, no keyword density, and no value proposition for a searcher landing on a creator's page.

5. **No regulation-specific landing pages.** Regulation H / I / F users are searching for format-specific content. A `/explore/regulation-h` static route (or at least a crawler-accessible filtered URL) would capture this intent.

### Medium Priority
6. **FAQPage on every page.** The `FAQPageJsonLd` is rendered in the root layout so it appears on every URL including share pages and creator pages. Ideally the FAQ schema should be scoped to the homepage only — Google may treat duplicated FAQ schema as spam.

7. **`/champions` page has no JSON-LD.** The page-level OG image is in `/champions/opengraph-image.tsx` but no structured data schema is added.

8. **Sitemap includes no `<lastmod>` for static routes** — minor but easy to fix.

9. **OG description for /explore** is truncated in Twitter view ("Discover team reports shared by the VGC community." — 55 chars). Better to front-load keywords.

---

## 5. Competitor Advantages Summary

| Factor | pikalytics.com | pokepast.es | VGC Team Report |
|--------|---------------|-------------|-----------------|
| Domain age & authority | Very high | High | New |
| Per-Pokemon stat pages | Yes | No | Partial (Mega only) |
| Damage calculator | Yes | No | Inline (not standalone) |
| Speed tiers | Yes | No | Inline (not standalone) |
| Team sharing | Yes | Yes (paste-only) | Yes (rich reports) |
| Team reports with matchup plans | No | No | Yes (unique differentiator) |
| Tournament context | Yes (top teams) | No | Yes (placement, record) |
| Social sharing cards | Yes | No | Yes |
| Structured data | Partial | None | Good |

**Unique SEO moat for VGC Team Report:** No other tool combines matchup plans + damage calcs + tournament context + social OG cards in one shareable URL. This is the angle to amplify in all title tags and descriptions.
