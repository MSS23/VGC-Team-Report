# SEO Audit — VGC Team Report
**Date:** 2026-05-09
**Auditor:** SEO Agent (r6)
**Mode:** READ-ONLY

---

## 1. Current Metadata Posture

### Root Layout (`src/app/layout.tsx`)
- **Title default:** `"VGC Team Report"` — bare brand name, no value proposition.
- **Title template:** `"%s | VGC Team Report"` — correct pattern.
- **Description:** 209 chars, covers the core value prop but buries key terms like "speed tiers" and "damage calcs" mid-sentence. Does not lead with "Regulation M-A" or "VGC 2026."
- **canonical:** Set to `https://pokemonvgcteamreport.com` — correct.
- **robots:** `index: true, follow: true` — correct.
- **OG title/description:** Present. **No `images` array** — root layout relies on `opengraph-image.tsx` convention without explicit URL in metadata. Social crawler consistency is uncertain.
- **Twitter card:** `summary_large_image` — correct. No `images` array either.
- **keywords:** Not set at root level.
- **hreflang / alternates:** Not set (single-language site, acceptable).

### `/explore` Page
- Title: `"Explore VGC Teams"` — weak, no keywords.
- Description: Adequate but no mention of "VGC 2026" or "Regulation M-A."
- Has `CollectionPage` JSON-LD — good.
- Has OG image via `images: [{url: "/explore/opengraph-image", …}]` — explicit, correct.

### `/champions` Page
- Title: `"Pokemon Champions VGC Team Reports"` — reasonable.
- Has `keywords` array — notable, only page besides `/champions/[pokemon]` to have one.
- No JSON-LD on this page itself (only on the `[pokemon]` sub-pages).
- No OG image explicitly set.

### `/champions/[pokemon]` (Dynamic Mega pages)
- Per-page titles follow pattern: `"{Mega} VGC Guide — EV Spreads, Movesets & Teams"` — well-optimized.
- Per-page descriptions include ability, mega stone, and format — strong.
- `keywords` array: present and thorough.
- **JSON-LD:** `WebPage` + `FAQPage` — strong. FAQ items are factually grounded.
- **BreadcrumbList:** Present — good.
- No `Article` or `SoftwareApplication` schema.

### `/s/[id]` (Shared report pages)
- Dynamic title generation is sophisticated: tournament + placement > tournament > species + creator — good.
- **No robots directive** to noindex private/unlisted shares — thin-content risk.
- `CreativeWork` JSON-LD with author, datePublished, dateModified — good.
- **OG image explicitly suppressed** (`images: []`) — intentional (sprite CDN issues), noted in comments.
- Twitter card downgraded to `summary` (no image) — acceptable given image issues.

### `/creator/[name]`
- Title: `"${creator}'s Teams"` — too terse.
- Description: `"View all public VGC team reports by ${creator}."` — weak, doesn't mention features.
- Has `ProfilePage` JSON-LD with `Person` entity — good.
- No OG image.

### `/compare` Page
- **No metadata** (no `generateMetadata` or `export const metadata`) — a "use client" page.
- **Not in sitemap** — invisible to Googlebot unless crawled from links.

---

## 2. Sitemap Analysis (`src/app/sitemap.ts`)

| Coverage | Status |
|---|---|
| Homepage | Included, priority 1.0 |
| /explore | Included, priority 0.9 |
| /champions | Included, priority 0.9 |
| /champions/[pokemon] | Included for all sprited Megas, priority 0.8 |
| /changelog | Included, priority 0.3 |
| /privacy, /terms | /privacy included; /terms **missing** |
| /compare | **Missing** |
| /dashboard, /feedback, /embed | Missing (acceptable — functional pages) |
| /creator/[name] | Included dynamically (from DB) |
| /s/[id] | Included for public shares (up to 5000) |
| `lastModified` on static pages | **Missing** — static pages have no `lastModified`, reducing freshness signaling |

---

## 3. Robots.txt
```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://pokemonvgcteamreport.com/sitemap.xml
```
Correct and minimal. No issues.

---

## 4. Structured Data / JSON-LD Summary

| Page | Schema Types | Status |
|---|---|---|
| Root layout | `WebApplication` | Minimal — missing `featureList`, `SoftwareApplication` |
| /explore | `CollectionPage` | Good |
| /champions | None | Missing |
| /champions/[pokemon] | `WebPage`, `FAQPage`, `BreadcrumbList` | Strong |
| /s/[id] | `CreativeWork` with author | Good |
| /creator/[name] | `ProfilePage`, `Person` | Good |
| /compare | None | Missing (client component, no SSR) |

Missing schemas with ranking potential:
- `SoftwareApplication` with `featureList` (root) — triggers app-install rich result
- `Article` on `/champions/[pokemon]` — signals editorial content to Google
- `ItemList` / `SiteLinksSearchBox` on homepage or /explore — enhances SERP display

---

## 5. Competitor SERP Analysis

### Queries audited

#### "VGC team report"
VGC Team Report **ranks** (URL appears in results). Competitors in SERPs: Victory Road (`victoryroad.pro/sv-reports/`), Pikalytics (`pikalytics.com/topteams`).

#### "VGC team builder"
**NOT ranking** — top results: Pikalytics `/team`, VGCGuide.com, PikaChampions. VGC Team Report not found for this query despite having team creation functionality.

#### "Pokemon VGC team sharing"
Weak positioning. Top results: Pikalytics, Limitless VGC, PikaChampions. VGC Team Report `/champions` appears but homepage does not.

#### "PokePaste alternative"
**NOT ranking** — top results: VR Pastes, crob.at/pokepaste, Pikalytics. Despite VGC Team Report explicitly integrating PokePaste import/export, this intent is uncaptured.

#### "VGC speed tiers"
**NOT ranking** — top results: Pikalytics `/speed-tiers`, Smogon Forums, GoldenrodPress, GAMES.GG, Insider Gaming. VGC Team Report has speed tier data in-app but no dedicated indexable page.

---

## 6. Top 10 Keyword Gaps

Ranked by estimated search volume and capture feasibility:

| # | Keyword / Query | Competitor Ranking | Gap Type |
|---|---|---|---|
| 1 | **VGC speed tiers** / "Regulation M-A speed tiers" | Pikalytics, Smogon, GoldenrodPress | No dedicated page |
| 2 | **VGC team builder** / "Pokemon Champions team builder" | Pikalytics, PikaChampions, VGCGuide | Functionality exists but no landing page targeting this intent |
| 3 | **PokePaste alternative** / "Pokemon team paste site" | crob.at, VR Pastes | Integration exists, never mentioned in metadata |
| 4 | **VGC damage calculator** / "Pokemon Champions damage calc" | Pikalytics, Porygon Labs | Feature exists inline, no standalone page |
| 5 | **Pokemon Champions team sharing** | Pikalytics, Limitless, PikaChampions | Covered by app but not by a dedicated SEO page |
| 6 | **VGC matchup planning** / "VGC matchup notes" | None strongly rank | Unique feature — no competitor owns this query |
| 7 | **[Pokemon name] VGC guide** (e.g. "Garchomp VGC") | Pikalytics, Smogon, VGCGuide | Partially covered by /champions/[slug] for Megas only — no coverage for non-Megas |
| 8 | **VGC tournament team report** / "worlds team report" | Victory Road (long-form articles) | VGC Team Report is the tool but doesn't rank for this editorial intent |
| 9 | **VGC rental team code** / "Pokemon Champions rental code" | Victory Road, various blogs | Site supports rental codes in reports but no dedicated page |
| 10 | **competitive Pokemon EV spreads** / "VGC EV calculator" | Pikalytics, Porygon Labs, Smogon | Feature in app, not surfaced as a landing page |

---

## 7. Quick-Win SEO Fixes (prioritized)

### Priority 1 — Metadata (1–2 hour fixes)

**QW-1: Root layout default title**
Change from `"VGC Team Report"` to `"VGC Team Report — Build, Share & Discover Pokemon VGC Teams"`. Adds value proposition to homepage SERP entry with zero risk.

**QW-2: Explicit OG image URL in root layout**
Add `images: [{url: "https://pokemonvgcteamreport.com/opengraph-image", width: 1200, height: 630, alt: "…"}]` to both `openGraph` and `twitter` blocks. Ensures consistent social unfurls.

**QW-3: Noindex private/unlisted shares**
In `/s/[id]/page.tsx`, add `robots: { index: false, follow: false }` when `is_public = FALSE`. Prevents thin-content penalties from private shares being indexed.

**QW-4: /compare page metadata**
`/compare` is a client component with no metadata. Wrap or convert to add `export const metadata`. Add to sitemap.

**QW-5: /terms missing from sitemap**
One-line fix in `sitemap.ts`.

**QW-6: Add `lastModified: new Date()` to static sitemap entries**
Enables Google freshness signals on homepage, /explore, /champions.

### Priority 2 — Structured Data (half-day fixes)

**QW-7: Add `SoftwareApplication` + `featureList` to root JSON-LD**
Current schema is `WebApplication` without features. Switch to `SoftwareApplication` and add `featureList` array. Triggers Google app rich result.

**QW-8: Add `Article` schema to /champions/[pokemon] pages**
Alongside existing `FAQPage`. Signals editorial content, can improve ranking for "{Pokemon} VGC guide" queries.

**QW-9: Add JSON-LD to /champions index page**
Currently has no structured data. Add `ItemList` of mega pokemon with links.

**QW-10: /creator pages — enrich title + description**
`"${creator}'s Teams"` → `"${creator} — Pokemon VGC Team Reports"`. Description should list features available on profile.

### Priority 3 — New Content Pages (multi-day, highest ROI)

**QW-11: Dedicated `/speed-tiers` page (HIGHEST ROI)**
"VGC speed tiers" is a high-volume, low-competition query. Pikalytics owns it now. A static/SSG page listing Reg M-A speed benchmarks would capture this traffic and provide internal linking to `/champions/[pokemon]` pages. This is the single most valuable SEO opportunity currently uncaptured.

**QW-12: `/team-builder` or landing page targeting "VGC team builder" intent**
Homepage has team creation but no H1 or title targeting "team builder." A thin landing page (or retitling strategy) would capture this large query cluster.

**QW-13: "PokePaste alternative" targeting**
Add to homepage description or create a `/pokepaste` redirect/landing page. Multiple searches look for PokePaste alternatives and this site is a functional replacement.

---

## 8. Technical SEO Notes

- **`lang="en"`** set on `<html>` — correct.
- **Canonical URLs** consistently set across all dynamic routes — correct.
- **HSTS** configured — good for crawl trust.
- **Service worker** (`/sw.js`) cached with `no-cache` headers — correct, won't confuse crawlers.
- **No `X-Robots-Tag` headers** beyond `robots.txt` — acceptable.
- **`/api/` disallowed in robots.txt** — correct.
- **Sitemap limit:** 5000 share pages — at scale this may need pagination, but not an immediate issue.
- **Home page is `"use client"`** — server-side metadata still exported correctly via Next.js conventions, but the home page cannot render meaningful text content to crawlers since it loads team data client-side. This means the homepage SERP preview relies entirely on metadata, not crawled content.
- **No `<link rel="preconnect">` hints for Google Fonts in `<head>`** — minor performance signal.

---

## 9. Summary Scores

| Area | Score | Notes |
|---|---|---|
| Title/Description optimization | 6/10 | Good on deep pages, weak at root |
| Structured data coverage | 7/10 | Strong on /champions/[pokemon], gaps elsewhere |
| Sitemap completeness | 7/10 | Missing /compare, /terms; no lastModified |
| Robots / crawlability | 9/10 | Clean |
| Keyword targeting (existing pages) | 5/10 | Key queries (speed tiers, team builder) uncaptured |
| Content gap coverage | 4/10 | No standalone speed tier, damage calc, or team builder pages |
| Social / OG coverage | 7/10 | OG images present but root lacks explicit URL |
| Internal linking | 5/10 | No cross-linking strategy visible; no breadcrumbs outside /champions |

**Overall SEO posture: 6/10** — Well-structured technical foundation, strong per-Pokemon pages, significant keyword gap on high-volume VGC utility queries.

---

*All change drafts are in `.swarm/drafts/seo-changes.md`. No changes were applied.*
