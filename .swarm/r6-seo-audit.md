# SEO Audit — VGC Team Report
**Date:** 2026-05-08
**Scope:** Current site metadata vs. VGC/competitive Pokemon competitive landscape
**Mode:** READ-ONLY research. No changes published.

---

## Executive Summary

VGC Team Report has a solid SEO foundation with correct canonicals, per-page metadata, structured data on key pages, and a dynamic sitemap that includes public share URLs and creator pages. The main gaps are: missing `keywords` metadata on most pages (low-impact but signals topical relevance), no `WebSite` schema with SearchAction (misses Sitelinks Searchbox eligibility), missing `twitter:site` handle, no content targeting high-volume keyword clusters owned by competitors (damage calc, speed tiers, tier lists, replica team codes), and suppressed OG images on shared reports.

---

## 1. Current SEO Posture — Inventory

### Global (`src/app/layout.tsx`)
- **Title template:** `%s | VGC Team Report` ✓
- **Description:** 218 chars, clear value prop, mentions Pokemon Champions and Mega Evolution ✓
- **metadataBase:** `https://pokemonvgcteamreport.com` ✓
- **OpenGraph:** title + description set ✓; no `og:image` wired at layout level (uses opengraph-image.tsx convention) ✓
- **Twitter card:** `summary_large_image` ✓; no `twitter:site` or `twitter:creator` handle ✗
- **Canonical:** set to root ✓
- **robots:** index + follow ✓
- **`keywords` meta tag:** MISSING from layout ✗
- **WebSite schema with SearchAction:** MISSING ✗
- **Structured data type:** `WebApplication` — correct but minimal; missing `SoftwareApplication`/`VideoGame` entity associations

### Pages

| Page | Has canonical | Has OG | Has keywords | Has JsonLd | OG image |
|---|---|---|---|---|---|
| `/` (home) | ✓ | ✓ | ✗ | ✓ WebApplication | ✓ opengraph-image.tsx |
| `/explore` | ✓ | ✓ | ✗ | ✓ CollectionPage | ✓ opengraph-image.tsx |
| `/champions` | ✓ | ✓ | ✓ (8 kw) | ✗ MISSING | ✓ opengraph-image.tsx |
| `/champions/[slug]` | ✓ | ✓ | ✓ (~15 kw) | ✓ WebPage + FAQPage + BreadcrumbList | ✗ no per-slug OG image |
| `/s/[id]` | ✓ | ✓ | ✗ | ✓ CreativeWork | ✗ SUPPRESSED (intentional — OG card broke) |
| `/creator/[name]` | ✓ | ✓ | ✗ | ✓ ProfilePage | ✗ |
| `/changelog` | in sitemap | — | — | — | — |
| `/privacy`, `/terms` | in sitemap (0.1 priority) | — | — | — | — |

### Sitemap (`src/app/sitemap.ts`)
- Static pages: `/`, `/explore`, `/champions`, all `/champions/[slug]` pages ✓
- Dynamic pages: all public shares (up to 5,000) ✓
- Dynamic creator pages ✓
- Revalidation: relies on Next.js ISR (no explicit `revalidate` on sitemap route) — could be slow to reflect new public shares ✗
- `/explore` changeFrequency: `daily` — arguably should be `hourly` given active community ✗

### Robots.txt
- Correct: allows all, disallows `/api/` ✓
- Missing: no explicit disallow for `/dashboard` or `/embed` routes ✗
- No crawl-delay for high-frequency scrapers ✗

### Structured Data Quality
- **FAQPage schema** on `/champions/[slug]`: excellent — 5-6 questions grounded in first-party data, no hallucinated content. High probability of rich snippet eligibility ✓
- **BreadcrumbList** on `/champions/[slug]` only — not on explore or creator pages ✗
- **WebSite SearchAction** (`potentialAction`): completely missing — this is the schema that enables Sitelinks Searchbox in Google results ✗
- **CreativeWork** on `/s/[id]`: good — includes `datePublished`, `dateModified`, `author`, `contributor` ✓
- **CollectionPage** on `/explore`: present but sparse — no `ItemList` to hint at the content within ✗
- **ItemList** for `/champions` index: MISSING — would help Google understand the Mega catalog structure ✗

---

## 2. Competitor Analysis

### Pikalytics (pikalytics.com)
- **Estimated traffic:** ~223K monthly visits (Similarweb Nov 2024); likely higher in 2026 with Pokemon Champions launch
- **Top keyword clusters:** "VGC 2026 stats", "Pokemon Champions usage", "Pokemon Champions damage calc", "VGC top teams", "[Pokemon] VGC moveset/EV spread"
- **SEO strengths:** Data-rich pages with usage stats for every Pokemon, team builder with Showdown export, dedicated damage calculator at `/calc`, tournament top teams at `/topteams`
- **Our gap:** We have no standalone damage calculator or usage-stats page. Our closest equivalent is the damage calcs embedded in team reports — not indexable as standalone content.

### Limitless VGC (limitlessvgc.com)
- **Top keyword clusters:** "VGC tournament results", "VGC top teams", "VGC player profiles", "competitive Pokemon rankings"
- **SEO strengths:** Tournament database is authoritative — Google trusts it for "VGC [tournament name] results" queries. Each team gets a URL with full paste.
- **Our gap:** We don't surface tournament data or real-world results. Our teams are self-reported; we don't aggregate official Play! Pokemon results.

### Victory Road (victoryroad.pro)
- **Estimated traffic:** ~200K monthly (Similarweb vs Pikalytics data)
- **Top keyword clusters:** "VGC team report", "Pokemon VGC team breakdown", "rental team VGC", "VGC analysis", specific tournament reports
- **SEO strengths:** Long-form team reports written by players — rich, topical content. "Replica Teams" section targets high-intent search for team codes.
- **Our gap:** Our team reports are user-generated short-form content. We don't produce editorial long-form breakdowns. The "replica/rental code" keyword cluster is completely absent from our content.

### PokePaste / pokepast.es
- **Top keyword clusters:** "Pokemon paste", "Showdown paste", "competitive Pokemon team paste"
- **SEO strengths:** Deep integration with the Showdown community; every Showdown team can be pasted here
- **Our gap:** We integrate with PokePaste as an export target but don't capture the "paste" search intent ourselves. Users searching "Showdown paste VGC" or "Pokemon paste site" don't land on us.

### VGCCoach.pro / ChampionsBuilder / Porygon Labs / MetaVGC
- Collectively own: "VGC team builder", "Pokemon Champions damage calc", "speed tier VGC", "AI VGC team builder"
- These are newer tools (2025-2026) targeting the Pokemon Champions format specifically
- **Our gap:** We don't appear in "team builder" SERP positions — our UX is report-creation-first, not team-builder-first

---

## 3. Keyword Gap Analysis

### Top 10 Keyword Clusters We're Missing

1. **"Pokemon Champions damage calc"** / "VGC damage calculator"
   - Monthly volume: high (multiple dedicated tools exist)
   - Current owner: Pikalytics `/calc`, Porygon Labs, MetaVGC
   - Our coverage: calcs exist inside reports but are not separately indexable
   - Opportunity: Add a standalone `/calc` or `/damage-calc` page, or ensure the calc feature is surfaced in meta descriptions

2. **"[Pokemon] VGC EV spread"** / "[Pokemon] VGC moveset"
   - E.g. "Garchomp VGC EV spread", "Incineroar VGC moveset"
   - Current owner: Pikalytics, Champions Builder
   - Our coverage: `/champions/[slug]` pages partially cover Mega Pokemon only
   - Opportunity: Non-mega top-meta Pokemon (Incineroar, Garchomp, Sinistcha, etc.) have no dedicated pages

3. **"VGC speed tier"** / "[Pokemon] speed tier VGC"
   - Current owner: MetaVGC, Pikalytics
   - Our coverage: speed tiers appear inside reports, not indexed
   - Opportunity: Add a `/speed-tiers` route or surface speed tier data on champion pages

4. **"Replica team code Pokemon Champions"** / "rental code VGC"
   - High user intent — players want ready-to-use codes
   - Current owner: Victory Road `/champions-replica`, games.gg
   - Our coverage: none
   - Opportunity: Add a "Replica Codes" section to public shared reports, or a dedicated `/replica-teams` page

5. **"VGC team tier list 2026"** / "Pokemon Champions tier list"
   - Current owner: Pokemon-zone.com, showdowntier.com, propelrc.com
   - Our coverage: none
   - Opportunity: Low — requires editorial data maintenance, but a community-voted tier could work

6. **"VGC tournament teams 2026"** / "Pokemon Worlds team 2026"
   - Current owner: Limitless VGC, Pikalytics `/topteams`
   - Our coverage: Explore page has tournament teams, but no dedicated tournament-keyed landing pages
   - Opportunity: Create `/tournaments/[name]` landing pages for major events (Indianapolis Regionals, Worlds 2026)

7. **"competitive Pokemon team builder free"** / "VGC team builder 2026"
   - Current owner: ChampionsBuilder, Pikalytics, VGenC
   - Our coverage: tool exists but not positioned as a "builder" in metadata
   - Opportunity: Home page meta description and title should emphasize the building/sharing UX more prominently

8. **"Mega Evolution VGC guide"** / "how does Mega Evolution work VGC"
   - Current owner: vgcguide.com, vgccoach.pro
   - Our coverage: `/champions` page mentions Mega Evolution but no educational guide content
   - Opportunity: Add a brief guide section to `/champions` page visible to crawlers

9. **"Pokemon paste VGC"** / "Showdown paste import"
   - Current owner: pokepast.es, Falinks teambuilder
   - Our coverage: core feature but not surfaced in metadata or as indexable content
   - Opportunity: Add `/import` landing page or ensure home page description mentions paste import explicitly

10. **"VGC player [name] team report"** / "[Player] VGC teams"
    - Current owner: Victory Road (editorial), Limitless VGC (player profiles)
    - Our coverage: `/creator/[name]` pages exist but thin metadata (no keywords, minimal description)
    - Opportunity: Enrich creator page metadata with keywords, player team count, and tournament context

---

## 4. Technical SEO Issues

### P0 — Missing (high impact, low effort)
1. **No `WebSite` schema with `SearchAction`** — prevents Sitelinks Searchbox eligibility in Google. Single JsonLd block addition to `layout.tsx`.
2. **No `keywords` meta on home, explore, creator, and shared report pages** — minor signal but trivial to add.
3. **No `twitter:site` handle** — prevents Twitter Card attribution. Add `@handle` once confirmed.

### P1 — Missing (medium impact, medium effort)
4. **OG images suppressed on `/s/[id]`** — social shares from Discord/X/Reddit show no preview image. Currently intentional (prior sprite CDN failures). A static template-based OG card (no sprite fetching) would restore social click-through without the CDN dependency.
5. **`/champions` page has no JsonLd** — the index page listing 59 Mega Pokemon has no structured data, missing ItemList schema opportunity.
6. **Per-Mega pages lack OG images** — `/champions/[slug]` generates per-slug pages with FAQPage schema but no per-slug OG image. There is a `/champions/opengraph-image.tsx` but it's page-level generic, not slug-specific.

### P2 — Enhancement (lower priority)
7. **BreadcrumbList only on `/champions/[slug]`** — missing on `/explore`, `/creator/[name]`, `/s/[id]`. Adding breadcrumb schema broadens rich-snippet eligibility.
8. **Sitemap `changeFrequency` for `/explore` is `daily`** — arguably should be `hourly` given new public teams are created continuously.
9. **No `description` on `<html>` element's `lang` complement** — already set to `lang="en"` ✓ but no `hreflang` for international audiences (low priority, English-only content).
10. **`/changelog` page** — low-priority `0.3` in sitemap but could rank for "VGC Team Report changelog" or "what's new" queries. Consider enriching its metadata.

---

## 5. Top 5 Actionable SEO Code Changes

### #1 — Add `WebSite` schema with `SearchAction` to `layout.tsx`
**Files:** `src/app/layout.tsx`
**Impact:** Enables Sitelinks Searchbox eligibility in Google. Signal to Google that `/explore?q=` is the search endpoint. No content changes needed.
**Effort:** 15 minutes — add one `<JsonLd>` block.

### #2 — Add `keywords` metadata to layout + all content pages
**Files:** `src/app/layout.tsx`, `src/app/explore/page.tsx`, `src/app/creator/[name]/page.tsx`
**Impact:** Minor direct ranking signal but improves topical clarity for crawlers and internal linking consistency.
**Effort:** 30 minutes — add `keywords` arrays to 4 pages.

### #3 — Add `ItemList` schema to `/champions` index page
**Files:** `src/app/champions/page.tsx`, `src/app/champions/ChampionsContent.tsx`
**Impact:** Helps Google understand the 59-Mega catalog structure; may trigger site links for the champions hub. Pairs with existing FAQPage schemas on child pages to create a schema hierarchy.
**Effort:** 1–2 hours — generate `ItemList` from `MEGA_POKEMON_LIST` at build time and inject via `<JsonLd>`.

### #4 — Enrich home page description to target "team builder" and "paste import" keywords
**Files:** `src/app/layout.tsx`
**Impact:** Home page currently ranks for "VGC team report" brand terms. Expanding to target "free VGC team builder", "Showdown paste import", and "Pokemon Champions team builder" broadens SERP footprint for non-branded queries.
**Effort:** 5 minutes — update `description` string in metadata.

**Current description (218 chars):**
> "The home for competitive Pokemon VGC team reports — now supporting Pokemon Champions and Mega Evolution. Build detailed team breakdowns with notes, matchup plans, and damage calcs — then share them with the community or present at tournaments."

**Proposed:**
> "Free VGC team builder and report tool for Pokemon Champions. Paste your Showdown team to get a shareable report with EV spreads, damage calcs, speed tiers, and matchup plans — then present it at tournaments or share with the community. Supports Regulation M-A and Mega Evolution."

### #5 — Restore OG images on `/s/[id]` shared reports with a static fallback template
**Files:** `src/app/s/[id]/page.tsx` + new `/api/og/[id]/route.tsx`
**Impact:** Every shared report posted to X/Reddit/Discord currently shows no preview image. A text-only card (no sprites, no CDN dependency) would immediately improve social click-through for all shared reports. This is likely the single highest-traffic-generating change available.
**Effort:** 4–6 hours — build a static OG card route using Next.js `ImageResponse` with team species names as text, not sprites.

---

## 6. Competitive Positioning Summary

| Tool | Primary SEO strength | VGC Team Report overlap |
|---|---|---|
| Pikalytics | Usage stats, damage calc, top teams | Low — different content type |
| Limitless VGC | Tournament database, player profiles | Low — different data source |
| Victory Road | Editorial team reports, rental codes | HIGH — same content category |
| PokePaste | Paste sharing | Medium — we integrate but don't compete |
| ChampionsBuilder | Team builder UX | Medium — same workflow, different positioning |
| MetaVGC | Usage + speed tiers + paste | Low-medium — different content depth |

VGC Team Report's primary SEO moat is: **user-generated, shareable, structured team reports with social features** (comments, reactions, forks, creator profiles). No competitor offers this exact combination. The opportunity is to lean into this positioning in all metadata, description copy, and structured data — emphasizing the "report" and "share" angle rather than chasing the "calculator" or "stats" angle where Pikalytics has years of authority.

---

## Sources

- [Pikalytics](https://www.pikalytics.com/) — VGC 2026 stats, usage, damage calc
- [Pikalytics Similarweb data](https://www.similarweb.com/website/pikalytics.com/competitors/)
- [Limitless VGC](https://limitlessvgc.com/) — tournament database
- [Victory Road](https://victoryroad.pro/) — VGC team reports
- [Victory Road Champions Replica Teams](https://victoryroad.pro/champions-replica/)
- [ChampionsBuilder](https://www.championsbuilder.com/) — team builder
- [MetaVGC](https://metavgc.com/) — usage stats + speed tiers
- [Porygon Labs](https://www.porygonlabs.com/) — damage calc
- [VGCCoach.pro](https://vgccoach.pro/articles/mega-evolution-vgc-pokemon-champions)
- [PokePaste](https://pokepast.es/) — paste sharing
- [PokeStats guides](https://pokestats.cc/guides)
- [Pokemon-zone.com Champions](https://www.pokemon-zone.com/champions/)
- [VGCguide.com](https://www.vgcguide.com/teambuilding)
- [ChampTeams.gg](https://champteams.gg/landing)
- [VGenC AI builder](https://vgenc.net/)
- [games.gg replica teams guide](https://games.gg/pokemon-champions/guides/pokemon-champions-best-replica-teams-codes/)
- [VGC Trainer 2026 guide](https://vgctrainer.com/guide)
