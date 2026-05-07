# SEO Audit: VGC Team Report vs Competitors
**Date:** 2026-05-07
**Auditor:** SEO Specialist (Wave 1)
**Site:** https://pokemonvgcteamreport.com (deployed at vgc-team-report.vercel.app)

---

## 1. Site Metadata Audit

### Root Layout (`/src/app/layout.tsx`)

| Element | Current Value | Assessment |
|---|---|---|
| Default Title | `VGC Team Report` | Weak — no keywords in brand-only title |
| Title Template | `%s \| VGC Team Report` | OK |
| Meta Description | "The home for competitive Pokemon VGC team reports — now supporting Pokemon Champions and Mega Evolution. Build detailed team breakdowns with notes, matchup plans, and damage calcs — then share them with the community or present at tournaments." | Long (190 chars) — Google truncates at ~155. The first sentence contains strong keywords but the second is cut off. |
| metadataBase | `https://pokemonvgcteamreport.com` | Correct |
| OG Title | "VGC Team Report — Build, Share & Discover Pokemon Teams" | OK but no "2026" or "Pokemon Champions" signal |
| OG Description | "The home for competitive Pokemon VGC team reports. Build, share, and explore team breakdowns from players around the world." | Generic — no regulation or feature differentiation |
| Twitter Card | `summary_large_image` | Correct type, but no `twitter:site` or `twitter:creator` tags |
| Canonical | `https://pokemonvgcteamreport.com` | Correct |
| robots | `index: true, follow: true` | OK |
| JSON-LD Schema | `WebApplication` with `GameApplication` category | Correct type; missing `sameAs` links to social profiles |
| `lang` attribute | `en` | Correct |
| OG Image | Not set in root layout (no default OG image) | **GAP** — no fallback social share image for the homepage |

### Page-Level Metadata

| Route | Title | Notes |
|---|---|---|
| `/champions` | "Pokemon Champions VGC Team Reports" | Good — keywords present |
| `/explore` | "Explore VGC Teams" | Weak — no brand or year signal |
| `/champions/[pokemon]` | `${displayName} VGC Guide — EV Spreads, Movesets & Teams` | Strong — long-tail targeting is correct |
| `/s/[id]` | Dynamic — tournament+placement or species-based | Good dynamic generation |
| `/creator/[name]` | `${creator}'s Teams` | Weak — no brand, no "VGC" keyword |

---

## 2. Sitemap Analysis

**File:** `/src/app/sitemap.ts`
**Generation:** Dynamic via Next.js — pulls from DB (public shares + creator pages) and static routes.

**Coverage:**
- Static pages: `/`, `/explore`, `/champions`, `/changelog`, `/privacy`
- Dynamic: `/champions/[slug]` for each legal Mega (priority 0.8)
- Dynamic: `/s/[id]` up to 5,000 public shares (priority 0.6)
- Dynamic: `/creator/[name]` for distinct creators

**Issues:**
- The sitemap is generated server-side and served at `https://pokemonvgcteamreport.com/sitemap.xml` (confirmed by code). The Vercel deployment URL (`vgc-team-report.vercel.app`) returned 403 — this is likely a redirect/Vercel protection layer, not a missing sitemap. The canonical domain should be crawled fine.
- `/compare` and `/feedback` routes exist but are not in the sitemap (low-priority; probably intentional).
- `changeFrequency: "weekly"` on `/champions` static page is appropriate given new Mega support rolling out.
- No `<lastmod>` on static pages — this is a minor signal loss for Google.

---

## 3. Competitor Analysis

### Pikalytics (pikalytics.com)

**Keyword strategy:** Dominant use of "VGC 2026," "Pokemon Champions," regulation names, "stats," "top teams," "usage rankings," "team builder," "damage calculator" throughout titles and URLs.

**Key title patterns:**
- "VGC 2026 Pokemon Champions Competitive Stats | Pikalytics"
- "Pokemon Champions VGC 2026 Stats, Moves, Top Teams & Usage Rankings | Pikalytics"
- "Pokemon Champions VGC 2026 Team Builder | Pikalytics"
- "Pokemon Champions Damage Calculator VGC 2026 | Pikalytics"

**SEO strengths:** Year in title (2026), format name ("Pokemon Champions"), feature-specific pages (calc, team, topteams), high DA from years of content.

**Keywords VGC Team Report does NOT target that Pikalytics does:**
- "VGC usage stats" / "usage rankings"
- "top teams VGC 2026"
- "damage calculator VGC"
- "VGC 2026 Regulation I / M-A stats"

---

### Victory Road (victoryroad.pro)

**Keyword strategy:** "Team Reports for VGC" as primary category. Individual reports use tournament name + placement + year.

**Key URL patterns:**
- `/sv-reports/` — aggregation page for Scarlet & Violet era reports
- `/champions-replica/` — new replica teams page
- `/champions-regulations/` — regulations hub

**SEO strengths:** Rich editorial content; each team report is a full article with a creator byline, which generates unique textual content. Strong backlink profile from Smogon/Reddit/Bulbapedia citations.

**What they have that VGC Team Report lacks:**
- Editorial-style landing pages (articles, strategy guides)
- Named regulation hub pages (`/champions-regulations/`)
- Content longevity — archived reports going back to 2018

---

### Limitless VGC (limitlessvgc.com)

**Keyword strategy:** "Pokémon Video Game tournament database" — data-heavy, tournament-result-first.

**Key title:** "Limitless VGC - Pokémon Video Game tournament database"

**SEO strengths:** Tournament results data → naturally generates fresh content (player rankings, standings, team lists). Each tournament result page is a unique, high-intent URL.

**What they rank for that VGC Team Report doesn't:**
- "VGC tournament results"
- "top placing teams VGC"
- "VGC player rankings"

---

### VGC Coach Pro (vgccoach.pro)

**Keyword strategy:** Article-heavy content site targeting long-tail keyword clusters.

**Key pages visible in search:**
- "Mega Evolution in Pokemon Champions VGC"
- "Best Mega Pokemon VGC 2026 — Ranked by Usage & Power"
- "Best Pokemon VGC Teams 2026 — Regulation M Builds & Tier List"
- "VGC Guides & Articles 2026"
- "Pokemon Champions VGC Guide 2026 — Regulation M..."

**SEO strengths:** Aggressive article/guide content targeting exactly the long-tail keywords the champion/[pokemon] pages could own (e.g. "Best Mega Pokemon VGC 2026," "Mega Evolution VGC"). Already competing directly in the space VGC Team Report's `/champions/[pokemon]` pages are trying to capture.

**Threat level:** HIGH — they have an article-based SEO moat on the exact Mega Evolution + VGC 2026 keyword cluster.

---

### MetaVGC (metavgc.com)

**Keyword strategy:** "Pokemon VGC Usage Stats, Top Teams & Showdown Pastes"

**Visible strength:** Usage stats + Showdown pastes — a direct adjacent tool to the team report format.

---

## 4. Keyword Gap Analysis

### Top 10 Keyword Gaps

| # | Keyword / Cluster | Est. Intent | Competitor Owning It | VGC Team Report Gap |
|---|---|---|---|---|
| 1 | `VGC team report` (exact match) | High-intent, brand-adjacent | Victory Road (category) | Site ranks for it but the homepage title lacks this phrase |
| 2 | `Pokemon Champions team report` / `Pokemon Champions team builder` | High-intent, new format | Pikalytics (team builder angle) | `/champions` page lacks "team builder" in title/H1 |
| 3 | `Mega Evolution VGC 2026` / `best Mega Pokemon VGC` | High volume, high intent | VGC Coach Pro, Pikalytics | `/champions/[pokemon]` pages exist but index page `/champions` doesn't rank for "Mega Evolution" as H1 |
| 4 | `VGC 2026 [Pokemon name] EV spread` / `[Pokemon name] EV spread competitive` | High long-tail volume | Smogon, Pikalytics, VGC Coach | `/champions/[pokemon]` pages ARE targeting this — opportunity to expand to non-Mega (Reg I) Pokemon |
| 5 | `VGC 2026 Regulation M-A guide` / `Regulation I guide` | Informational, growing | Pikalytics, VGC Coach | No dedicated regulation guide/landing page exists |
| 6 | `pokemon VGC damage calculator` | High volume, utility | Pikalytics /calc, VGC Multi Calc | Site has calcs embedded in reports but no standalone calc landing page |
| 7 | `VGC team builder` | Very high volume | Pikalytics, Champions Builder | Site builds reports but doesn't market itself as a "team builder" — missing this keyword entirely |
| 8 | `competitive pokemon team paste` / `pokemon showdown team paste VGC` | Mid volume | pokepast.es, VGCpastes | VGC Team Report accepts paste input but doesn't target these discovery queries |
| 9 | `VGC [player name] team report` | Long-tail, high CTR | Victory Road (editorial) | `/creator/[name]` pages are thin — generic title `${creator}'s Teams` with no "VGC" |
| 10 | `pokemon VGC matchup guide` / `VGC matchup plan` | Informational | Reddit, Smogon, Victory Road | VGC Team Report has matchup plans built-in but no public-facing content targeting this query |

---

## 5. Technical SEO Issues

### Critical
1. **No default OG image on root/homepage** — social shares from the homepage have no preview image. Twitter card `summary_large_image` with no image renders as a plain link on most platforms.
2. **Root meta description too long** — 190 characters; Google truncates at ~155. Second value proposition sentence ("Build detailed team breakdowns...") is cut off in SERPs.

### Important
3. **"VGC team builder" missing from site vocabulary** — Pikalytics and Champions Builder both own this high-volume phrase. VGC Team Report builds team-report documents (distinct from a true team builder) but adding this keyword in meta/H1 could capture related intent.
4. **`/explore` page title "Explore VGC Teams" is weak** — compare to competitor: "Browse Pokemon VGC team reports shared by competitive players." The title tag should include "2026" and "competitive" to differentiate from generic Pokemon fan pages.
5. **`/creator/[name]` pages lack "VGC" in title** — `${creator}'s Teams` title misses the keyword. Should be `${creator}'s VGC Team Reports`.
6. **No regulation-specific landing pages** — no `/regulation-m-a` or `/regulation-i` hub pages. VGC Coach Pro and Pikalytics own these terms with dedicated pages. Given the site already segments by regulation tag in team data, a static landing page would be low-effort/high-return.
7. **`/champions` page `keywords` array** — while Google doesn't use meta keywords for ranking, it's currently the only page with this tag. The `keywords` tag is inconsistently applied across pages (present on `/champions`, absent everywhere else).
8. **No `twitter:site` tag** — the Twitter card spec recommends `@username` of the site. Minor signal.

### Minor
9. **`WebApplication` JSON-LD on root lacks `sameAs` links** — pointing to Twitter/Discord/GitHub would strengthen entity association.
10. **No `Article` or `HowTo` schema** — given the FAQ schema already on `/champions/[pokemon]`, extending with `HowTo` schema for "how to build a VGC team report" could earn rich snippets.

---

## 6. Competitor Keyword Matrix

| Keyword | Pikalytics | Victory Road | Limitless VGC | VGC Coach | VGC Team Report |
|---|---|---|---|---|---|
| VGC 2026 | Y | Y | Y | Y | Partial |
| Pokemon Champions | Y | Y | Y | Y | Y |
| VGC team report | N | Y | N | N | Y |
| team builder | Y | N | N | Y | N |
| EV spread | Y | Y | N | Y | Y (pokemon pages) |
| damage calculator | Y | N | N | N | N (feature exists) |
| Mega Evolution VGC | Y | Y | N | Y | Y (champions index) |
| matchup plan/guide | N | Y | N | Y | N (feature exists) |
| VGC usage stats | Y | N | Y | N | N |
| tournament results | Y | Y | Y | N | Partial (via tags) |
| Regulation M-A | Y | Y | N | Y | Y (champions page) |

---

## 7. Quick Win Opportunities

1. **Homepage title: add "Pokemon Champions" and "2026"** — current: "VGC Team Report." Proposed: "VGC Team Report — Pokemon Champions Team Reports & Builder 2026" (59 chars, under limit)
2. **Trim root meta description to 155 chars** — keep the first sentence, cut the second; add "2026" and "Regulation M-A" to signal freshness.
3. **`/explore` page title** — update to "Explore VGC Teams 2026 — Pokemon Champions Team Reports"
4. **`/creator/[name]` title** — `${creator} VGC Teams — Pokemon Team Reports` adds the critical keyword
5. **Add "Mega Evolution" and "team builder" to root OG title** — these are zero-ranking on the homepage but are high-volume
6. **Add a default OG image** to root layout to fix blank social previews
7. **Add `twitter:site` to layout metadata**
8. **Regulation landing pages** — thin static pages at `/regulation-m-a` and `/regulation-i` with description, legal Pokemon list, and links to teams tagged with that regulation — each is a crawlable keyword target
9. **Damage calc keyword capture** — the inline calc feature could be surfaced on the `/champions/[pokemon]` pages with a heading like "Damage Calculations for [Pokemon] in VGC 2026" — capturing the calc-intent long-tail without building a separate tool
10. **"VGC matchup plan" content** — a help/guide page explaining the matchup plan feature captures the informational query and provides a natural internal link hub

---

## 8. Schema / Structured Data Summary

| Page | Schema Type | Assessment |
|---|---|---|
| `/` (root) | `WebApplication` | Present; add `sameAs`, `featureList` |
| `/explore` | `CollectionPage` | Good |
| `/champions/[pokemon]` | `WebPage` + `FAQPage` + `BreadcrumbList` | Strong — FAQ schema is a correct rich-snippet strategy |
| `/s/[id]` | `CreativeWork` with `author` | Good; `datePublished` and `dateModified` are present |
| `/creator/[name]` | `ProfilePage` + `Person` | Good |
| `/champions` | None | GAP — no schema on the Mega Champions hub page |

---

## 9. Domain & Canonicalization Notes

- Production domain is `pokemonvgcteamreport.com` (set in `metadataBase` and all canonicals).
- Vercel subdomain `vgc-team-report.vercel.app` returns 403 for direct access — this is correct behavior (Vercel's custom domain redirect), and means Google will index the canonical domain only.
- All per-page `alternates.canonical` values correctly point to `pokemonvgcteamreport.com`.
- No `hreflang` tags — site is English-only, which is fine for the current audience.

---

## 10. Summary Rankings Visibility

Based on search result appearances observed during this audit:
- `pokemonvgcteamreport.com` appears in SERPs for "VGC team report" (homepage + champions page)
- `pokemonvgcteamreport.com/champions` appears for "Pokemon Champions VGC team report" queries
- The site does NOT appear for: "VGC team builder," "damage calculator VGC," "VGC 2026 usage stats," "Mega Evolution VGC 2026 [Pokemon]" (dominated by VGC Coach Pro)
- Individual `/champions/[pokemon]` pages are indexed but not yet visible in searches for "{Pokemon} EV spread VGC" — likely too new / needs backlinks

---

*All change recommendations are documented in `.swarm/drafts/r6-seo-metadata-drafts.md`*
