# SEO Audit: VGC Team Report vs Competitors
**Date:** 2026-05-10 (updated; original 2026-05-07)
**Auditor:** SEO Specialist (Wave 2 refresh)
**Site:** https://pokemonvgcteamreport.com (also vgc-team-report.vercel.app)

---

## 1. Site Metadata Audit

### Root Layout (`/src/app/layout.tsx`)

| Element | Current Value | Assessment |
|---|---|---|
| Default Title | `VGC Team Report — Build & Share Pokémon VGC Teams` | Updated since Wave 1 — now includes a verb phrase. Still missing "Pokemon Champions" and "2026". |
| Title Template | `%s \| VGC Team Report` | OK |
| Meta Description | "Build detailed Pokémon VGC team reports with EV spreads, matchup notes and damage calcs. Share in one link. The richer alternative to PokéPaste." | ~153 chars — within Google's limit. Strong positioning vs PokéPaste. Good. |
| metadataBase | `https://pokemonvgcteamreport.com` | Correct |
| OG Title | `VGC Team Report — Build & Share Pokémon VGC Teams` | Missing "Pokemon Champions" and "2026" signals |
| OG Description | Matches meta description | Consistent; good |
| Twitter Card | `summary_large_image` | Correct type; still no `twitter:site` tag |
| Canonical | `https://pokemonvgcteamreport.com` | Correct |
| robots | `index: true, follow: true` | OK |
| JSON-LD Schema | `WebApplication` + `GameApplication` + `WebSiteSchema` + `OrganizationJsonLd` + `FAQPageJsonLd` | Improved — multiple schema types present. Still missing `sameAs` on WebApplication. |
| `lang` attribute | `en` | Correct |
| OG Image | Not set in root layout | **CRITICAL GAP** — no fallback social share image. Twitter card renders as plain link. |

### Page-Level Metadata

| Route | Title | Status |
|---|---|---|
| `/champions` | "Pokemon Champions VGC Team Builder & Reports" | Good — "team builder" keyword now included |
| `/explore` | "Explore VGC Team Reports" | Weak — no year, no "Pokemon Champions" |
| `/champions/[pokemon]` | `${displayName} VGC Guide — EV Spreads, Movesets & Teams` | Strong long-tail targeting |
| `/s/[id]` | Dynamic: tournament+placement or species-based | Good dynamic generation |
| `/creator/[name]` | `${creator}'s VGC Teams \| VGC Team Report` | Partial — "VGC" present but "team report" missing |
| `/faq` | "VGC Team Report FAQ — Common Questions Answered" | Good — rich FAQ JSON-LD applied |

---

## 2. Sitemap & Robots Analysis

**Sitemap:** Dynamic via `/src/app/sitemap.ts` — served at `https://pokemonvgcteamreport.com/sitemap.xml`

**Coverage:**
- Static: `/`, `/explore`, `/champions`, `/faq`, `/changelog`, `/privacy`
- Dynamic: `/champions/[slug]` for each Reg M-A Mega with confirmed sprites (priority 0.8)
- Dynamic: `/s/[id]` — up to 5,000 public shares (priority 0.6, with `lastModified`)
- Dynamic: `/creator/[name]` — distinct creator pages (priority 0.6)

**Robots.txt:** Well-configured. Disallows `/api/`. Explicitly allows Googlebot, Bingbot, GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot. Sitemap declared.

**Sitemap Gaps:**
- `/faq` is in the sitemap (confirmed in code). Good.
- `/compare` and `/feedback` routes absent — low priority, likely intentional.
- No `<lastmod>` on static pages other than `/s/[id]` shares.
- No `/regulation-m-a` or regulation-specific hub pages exist yet.

---

## 3. Competitor Analysis (Updated May 2026)

### Pikalytics (pikalytics.com)
**Dominant authority in the space.**

Key title patterns observed in SERPs:
- "VGC 2026 Pokemon Champions Competitive Stats | Pikalytics"
- "Pokemon Champions VGC 2026 Stats, Moves, Top Teams & Usage Rankings | Pikalytics"
- "Pokemon Champions VGC 2026 Team Builder | Pikalytics"
- "Pokemon Champions Damage Calculator VGC 2026 | Pikalytics"
- "Pokemon Champions Speed Tiers VGC 2026 | Pikalytics"

**SEO moat:** Year in every title, format-specific feature pages (calc, speed tiers, top teams, team builder), years of content authority, and deep backlink profile.

**Gaps vs VGC Team Report:** Pikalytics doesn't have team *reports* (matchup plans, EV rationale, narrative write-ups) — that's the positioning gap VGC Team Report can own.

---

### Victory Road (victoryroad.pro)
**Primary direct competitor for "VGC team report" keyword.**

- URL structure: `/sv-reports/`, `/champions-replica/`, `/champions-regulations/`, `/category/articles/reports/`
- Rich editorial content with creator bylines — each report is a full article
- Strong backlink profile (Smogon, Reddit, Bulbapedia citations)
- Archives going back to 2018

**What they lack:** User-generated team reports. Victory Road publishes curated editorial content from top players; VGC Team Report enables *any* player to publish a report. This is a meaningful platform differentiation.

---

### Limitless VGC (limitlessvgc.com)
**Tournament database authority.**

- Title: "Limitless VGC - Pokémon Video Game tournament database"
- Rankings for: "VGC tournament results," "top placing teams VGC," "VGC player rankings"
- Tournament result pages generate fresh, high-intent content naturally

**Not a direct competitor** — different value prop. Potential backlink partner (link from their tournament team pages to creator's VGC Team Report).

#### "PokePaste alternative"
**NOT ranking** — top results: VR Pastes, crob.at/pokepaste, Pikalytics. Despite VGC Team Report explicitly integrating PokePaste import/export, this intent is uncaptured.

### New Entrants (Observed May 2026)
Several new tools now rank for "VGC team builder 2026" — increasing competition:
- **Champions Lab** (championslab.xyz) — team builder + simulator + meta analysis
- **PikaChampions** (pikachampions.com) — 263 Pokemon team builder with type coverage
- **Champions Builder** (championsbuilder.com) — SP calculator + damage calc + Showdown export
- **ChampionsMeta** (championsmeta.io) — meta stats + team builder
- **Porygon Labs** (porygonlabs.com) — Champions damage calc + team builder
- **Turnadus** (turnadus.com) — Speed tiers tool with team import

**Threat assessment:** The "VGC team builder" SERP is now highly competitive with 6+ new entrants. VGC Team Report's positioning as a *report* tool (not a builder) is its clearest differentiation — but the site is not clearly articulating this in search results.

---

### VGCpastes / PokePaste Landscape
- PokePaste (pokepast.es) — minimal indexed content; site:search returned only 3 results. Low SEO investment.
- VGCPastes runs as an X (Twitter) account (@VGCPastes), not a competing site.
- **crob.at** now explicitly markets as "PokePaste alternative" and ranks for "pokepaste alternative pokemon team sharing" — relevant since VGC Team Report's meta description uses "richer alternative to PokéPaste."

**QW-2: Explicit OG image URL in root layout**
Add `images: [{url: "https://pokemonvgcteamreport.com/opengraph-image", width: 1200, height: 630, alt: "…"}]` to both `openGraph` and `twitter` blocks. Ensures consistent social unfurls.

## 4. Keyword Gap Analysis (Top 10)

| # | Keyword Cluster | Monthly Intent | Top Ranker | VGC Team Report Gap |
|---|---|---|---|---|
| 1 | `VGC team report` (exact) | High / brand-defining | Victory Road, our site | Ranking, but homepage title lacks exact phrase "VGC team report" |
| 2 | `Pokemon Champions team report` | Growing rapidly | Pikalytics (builder angle) | `/champions` title now includes "team builder"; still no "team report" in H1 |
| 3 | `Mega Evolution VGC 2026` / `best Mega Pokemon VGC` | High volume | Pikalytics, VGC Coach Pro | `/champions` exists but not prominent in SERPs for this cluster |
| 4 | `[Pokemon] EV spread VGC 2026` | High long-tail | Smogon, Pikalytics | `/champions/[pokemon]` pages target this — still building authority (needs backlinks) |
| 5 | `VGC 2026 Regulation M-A guide` | Informational, growing | Pikalytics, VGC Coach | No dedicated regulation landing page |
| 6 | `pokemon VGC damage calculator` | Very high volume | Pikalytics /calc, Porygon Labs | Feature embedded in reports but no standalone landing page or keyword capture |
| 7 | `VGC team builder 2026` | Very high volume | Pikalytics, 6+ new tools | Not targeted; site is correctly a *report* tool, but should clarify the distinction to capture adjacent intent |
| 8 | `pokepaste alternative` / `pokemon team sharing` | Mid volume | crob.at, VR Pastes | Our description says "richer alternative to PokéPaste" — but not a standalone landing page |
| 9 | `VGC [player name] team report` | Long-tail, high CTR | Victory Road (editorial) | `/creator/[name]` pages are thin — description only "View all public VGC team reports by ${creator}." |
| 10 | `VGC speed tier` / `VGC matchup plan` | High utility | Turnadus, Pikalytics, Victory Road | Feature exists in reports but no keyword-targeting content page or H1 for these terms |

**QW-6: Add `lastModified: new Date()` to static sitemap entries**
Enables Google freshness signals on homepage, /explore, /champions.

### Priority 2 — Structured Data (half-day fixes)

### Critical
1. **No default OG image** — `summary_large_image` Twitter card with no image renders as a plain link. Homepage social shares have zero visual preview.
2. **"Pokemon Champions" missing from homepage title** — competitors include "Pokemon Champions" and "2026" in every title tag. Our root title is "VGC Team Report — Build & Share Pokémon VGC Teams" — no format signal.

### Important
3. **`/explore` title weak** — "Explore VGC Team Reports" lacks year and format. Compare to Pikalytics: "Pokemon Champions VGC 2026 Tournament Top Teams." Should be "Explore Pokemon Champions VGC Team Reports 2026."
4. **`/creator/[name]` description too thin** — "View all public VGC team reports by ${creator}." — one sentence, no feature keywords, no VGC context beyond the title.
5. **No regulation-specific landing pages** — `/regulation-m-a` and `/regulation-i` don't exist. Pikalytics and VGC Coach rank for "Regulation M-A VGC" with dedicated pages.
6. **"VGC team builder" keyword gap** — 6+ new tools own this SERP. Site should clearly articulate the report-vs-builder distinction in meta to capture adjacent intent without false positioning.
7. **No `twitter:site` tag** — Minor ranking signal; easy fix.

### Minor
8. **`WebApplication` JSON-LD missing `sameAs`** — social profile links strengthen entity association in Google's Knowledge Graph.
9. **No `Article` or `HowTo` schema on guide content** — the FAQ JSON-LD is strong; extending with `HowTo` on how to build a team report could earn rich snippets.
10. **Inconsistent `keywords` meta tag** — present on `/champions` only; either apply consistently or drop it (Google ignores it for ranking, but it's noise in the audit trail).

**QW-10: /creator pages — enrich title + description**
`"${creator}'s Teams"` → `"${creator} — Pokemon VGC Team Reports"`. Description should list features available on profile.

## 6. Competitor Keyword Coverage Matrix

| Keyword | Pikalytics | Victory Road | Limitless | Champions Lab | VGC Team Report |
|---|---|---|---|---|---|
| VGC 2026 | Y | Y | Y | Y | Partial (not in root title) |
| Pokemon Champions | Y | Y | Y | Y | Y |
| VGC team report | N | Y | N | N | Y |
| team builder | Y | N | N | Y | Y (champions page only) |
| EV spread | Y | Y | N | Y | Y (pokemon pages) |
| damage calculator | Y | N | N | Y | N (feature exists, no page) |
| Mega Evolution VGC | Y | Y | N | Y | Y (champions) |
| matchup plan | N | Y | N | N | N (feature exists, no page) |
| speed tier | Y | Y | N | N | N (feature exists, no page) |
| VGC usage stats | Y | N | Y | Y | N |
| pokepaste alternative | N | N | N | N | Partial (description only) |
| Regulation M-A | Y | Y | N | Y | Y (champions page) |
| VGC tournament results | Y | Y | Y | N | N |

**QW-11: Dedicated `/speed-tiers` page (HIGHEST ROI)**
"VGC speed tiers" is a high-volume, low-competition query. Pikalytics owns it now. A static/SSG page listing Reg M-A speed benchmarks would capture this traffic and provide internal linking to `/champions/[pokemon]` pages. This is the single most valuable SEO opportunity currently uncaptured.

## 7. Top 3 Quick SEO Wins

**Win 1: Add "Pokemon Champions 2026" to the homepage title (15 min)**
Current: `VGC Team Report — Build & Share Pokémon VGC Teams`
Proposed: `VGC Team Report — Pokemon Champions Team Reports 2026`
Impact: Signals current format relevance to Google crawler; matches competitor title patterns. No code change beyond `layout.tsx` metadata.

**Win 2: Add a default OG image to root layout (30 min)**
A 1200×630px branded PNG at `/public/opengraph-image.png` referenced in `openGraph.images`. Every homepage share on Twitter/Discord/Reddit currently shows no preview image — this is a significant CTR loss on social traffic. Static image (no dynamic generation needed).

**Win 3: Update `/explore` and `/creator/[name]` titles and descriptions (15 min)**
- `/explore`: "Explore Pokemon Champions VGC Team Reports 2026" + add "Regulation M-A" to description
- `/creator/[name]`: `${creator} VGC Team Reports — Pokemon Champions` + description expanded to 2 sentences with feature keywords
Both pages are already in the sitemap; improving titles is a direct ranking signal with zero build-time cost.

---

## 8. Technical SEO Notes

| Page | Schema Type | Assessment |
|---|---|---|
| `/` (root) | `WebApplication` + `WebSite` + `Organization` + `FAQPage` | Strong. Missing `sameAs` on WebApplication. |
| `/explore` | `CollectionPage` | Good |
| `/champions` | None | **GAP** — no structured data on the Mega hub page |
| `/champions/[pokemon]` | `WebPage` + `FAQPage` + `BreadcrumbList` | Strong. FAQ schema enables rich snippets. |
| `/s/[id]` | `CreativeWork` with `author`, `datePublished`, `dateModified` | Good |
| `/creator/[name]` | `ProfilePage` + `Person` | Good structure; thin description |
| `/faq` | `FAQPage` | Good — FAQ JSON-LD with 10 rich Q&A items |

---

## 9. Domain & Canonicalization

- Production: `pokemonvgcteamreport.com` (correct in `metadataBase` and all `alternates.canonical`)
- Vercel subdomain `vgc-team-report.vercel.app` returns 403 — expected behavior (Vercel redirects to custom domain). Google indexes canonical domain only. Confirmed: `vgc-team-report.vercel.app` appears in SERPs for "VGC team report," meaning the redirect is working.
- All per-page canonical values point to `pokemonvgcteamreport.com`. No canonicalization issues found.
- No `hreflang` — English-only site, correct.

---

## 10. SERP Visibility Snapshot (May 2026)

| Query | VGC Team Report Ranks? | Top Ranker |
|---|---|---|
| "VGC team report" | Yes (homepage + /champions) | Victory Road (1st), VGC Team Report (2nd-3rd) |
| "Pokemon Champions VGC team report" | Yes (/champions) | VGC Team Report competes well |
| "VGC team builder 2026" | No | Pikalytics, Champions Lab, PikaChampions |
| "pokemon VGC damage calculator" | No | Pikalytics /calc, Porygon Labs |
| "VGC speed tier calculator" | No | Pikalytics, Turnadus, PokeStats |
| "Mega Evolution VGC 2026" | Partial (/champions) | VGC Coach Pro, Pikalytics |
| "[Pokemon] EV spread VGC" | Partial (/champions/[pokemon]) | Smogon, Pikalytics (authority gap) |
| "pokepaste alternative" | No | crob.at, VR Pastes |
| "VGC 2026 Regulation M-A" | No | Pikalytics, VGC Coach Pro |

---

*Metadata change drafts and implementation notes: `.swarm/drafts/seo-recommendations.md`*
