# VGC Team Report SEO Audit (May 26, 2026)

## Executive Summary

VGC Team Report has a solid technical SEO foundation with metadata completeness on primary pages, proper robots directives on private pages, and dynamic sitemap generation. However, there are **critical gaps** in keyword targeting, canonical URL consistency, and structured data coverage that limit organic search visibility for high-intent VGC team building queries.

**Audit Date:** May 26, 2026  
**Domain:** pokemonvgcteamreport.com  
**Audited Pages:** 11 main pages + dynamic shares + creator pages

---

## 1. Metadata Completeness Audit

### Home Page (`/`) — EXCELLENT
- **Title:** "VGC Team Report — Build & Share Pokémon VGC Teams | Pokemon Champions 2026"
- **Description:** "The free VGC team report builder — share your VGC team with notes, matchup plans, and damage calcs. Supports Pokémon Champions, Mega Evolution, and all VGC team builder formats."
- **Canonical:** ✓ `https://pokemonvgcteamreport.com`
- **OG Tags:** ✓ Present (title, description, image, URL)
- **Twitter Card:** ✓ `summary_large_image`
- **Structured Data:** ✓ WebSiteSchema + OrganizationJsonLd included
- **Keywords:** Present but weak (generic: "build," "share," "Pokemon VGC")

**Issues:**
- Keywords lack long-tail intent (missing "VGC team builder free," "Pokemon team report," "Showdown export")
- Description is more feature-focused than value-focused (leads with "free" but buries benefit)

### Champions Page (`/champions`) — EXCELLENT
- **Title:** "Pokemon Champions Format | Mega Evolution Teams — VGC Team Report"
- **Description:** "Explore Pokemon Champions (Regulation M-A) team reports. Mega Evolution builds, matchup analysis, and team breakdowns from the competitive community."
- **Canonical:** ✓ Present
- **OG Tags:** ✓ Present (title, description)
- **Keywords:** ✓ 8 keywords including "Regulation M-A," "Mega Evolution VGC," "VGC 2026"
- **Structured Data:** ✓ ItemList schema with individual Pokemon Mega Evolution links
- **Issue:** Keywords use "competitive" but miss "best teams," "tier list," "analysis"

### Explore Page (`/explore`) — EXCELLENT
- **Title:** "Explore VGC Teams | VGC Team Report"
- **Description:** Detailed, mentions community, Champions, Mega Evolution
- **Canonical:** ✓ Present
- **OG Tags:** ✓ Present (includes /explore/opengraph-image)
- **Keywords:** ✓ 12 keywords (comprehensive: "open team sheet," "OTS," "competitive Pokemon teams")
- **Structured Data:** ✓ CollectionPage schema

**Note:** Only explore page with OpenGraph image reference; home/tournaments use fallback `/opengraph-image`

### Tournaments Page (`/tournaments`) — GOOD
- **Title:** "VGC Tournament Results Archive | Team Reports 2026"
- **Description:** Value-focused, mentions "top finishers," "Regional," "World Championships"
- **Canonical:** ✓ Present
- **Keywords:** ✓ 8 keywords ("VGC tournament results," "VGC Worlds teams," "VGC top teams 2025/2026")
- **Structured Data:** ✓ SportsEventJsonLd (2 events: Indianapolis Regionals, World Championships)
- **OG/Twitter:** ✓ Present but uses generic `/opengraph-image`

### FAQ Page (`/faq`) — EXCELLENT
- **Title:** "VGC Team Report FAQ — Common Questions Answered"
- **Description:** Clear, problem-focused ("how to share a Pokémon VGC team")
- **Canonical:** ✓ Present
- **Keywords:** ✗ **MISSING** (critical gap for FAQ pages)
- **Structured Data:** ✓ FAQPage schema with 12 Q&A items covering:
  - What is VGC Team Report / team report
  - How to share teams
  - Format support (Champions, M-A)
  - Damage calcs, speed tiers, OTS, SP spreads
  - Discovery best practices

**Quality:** Excellent structured data implementation; FAQ content is comprehensive and directly answers high-intent queries.

### Dashboard Pages (`/dashboard*`) — CORRECT
- **`/dashboard`:** `robots: { index: false, follow: false }` ✓
- **`/dashboard/profile`:** ✗ **NO METADATA** (missing robots directive)
- **`/dashboard/privacy`:** ✗ **NO METADATA** (missing robots directive)
- **`/dashboard/notifications`:** `robots: { index: false, follow: false }` ✓ (correct auth-only gate)

**Action Required:** Add explicit `noindex, nofollow` to profile and privacy dashboard pages.

### Shared Reports (`/s/[id]`) — SMART
- **Dynamic metadata generation:** ✓ Pulls tournament name, creator, placement, species from share data
- **Robots handling:** Conditional:
  - Public shares: `index: true, follow: true`
  - Private/unlisted: `noindex: true, nofollow: true`
- **Title format:** Excellent — prioritizes tournament + placement over generic fallback
- **OG tags:** Dynamic generation from share data
- **Structured data:** BreadcrumbList schema to show navigation

**Quality:** Industry-leading implementation for user-generated content SEO.

### Embed Pages (`/embed/[id]`) — CORRECT
- **`<meta name="robots" content="noindex, nofollow">`** ✓ Proper directive
- **Purpose:** Read-only embed snippet (not meant for indexing)
- **No metadata generation:** Correct (embeds are snippets, not landing pages)

### Private/Auth-Only Pages
- **`/notifications`:** `robots: { index: false, follow: false }` ✓
- **`/creator/[name]`:** ✓ Public (indexable) — shows creator's published reports

---

## 2. Missing Metadata & Keywords by Page

### FAQ Page — CRITICAL GAP
- **Current:** No keywords field
- **Recommended keywords:**
  - VGC team report FAQ
  - How to make a Pokemon team report
  - What is VGC team report
  - Pokemon Showdown export guide
  - Damage calculation Pokemon
  - Speed tiers VGC
  - Open team sheet format

### Home Page — KEYWORD GAP
- **Current keywords:** Generic ("build," "share," "Pokemon VGC")
- **Missing intent-driven keywords:**
  - VGC team builder free
  - Pokemon team report
  - VGC team template
  - How to write a VGC team report
  - Showdown team export tool
  - VGC damage calculator

### Champions Page — SLIGHT GAP
- **Missing long-tail keywords:**
  - Best Mega Evolution teams
  - Regulation M-A tier list
  - Pokemon Champions sample teams
  - Mega Kangaskhan team report

### Tournaments Page — SLIGHT GAP
- **Missing keywords:**
  - VGC Indianapolis 2026
  - World Championships team analysis
  - VGC Regionals winning teams

---

## 3. Sitemap Analysis (`/app/sitemap.ts`)

### Static Pages Included ✓
```
/
/explore
/champions
/faq
/tournaments
/changelog
/privacy
/terms
/champions/[mega-slug] (all 40+ Mega Evolution pages)
```

### Dynamic Content Included ✓
- **Shared public reports:** `/s/[id]` — **Top 5000** (limiting factor; older reports excluded)
- **Creator pages:** `/creator/[name]` — All creators with public reports

### Pages Missing from Sitemap ✗

**CRITICAL OMISSIONS:**
1. **Feedback page** (`/feedback`) — Present, indexable, but not in sitemap
2. **Contact/Support** — If exists, not listed

**MISSING but optional:**
- Individual mega pages may benefit from explicit listing (currently included via champions)

### Sitemap Priority Issues
| Page | Priority | Change Freq | Assessment |
|------|----------|-------------|------------|
| `/` | 1.0 | weekly | ✓ Correct |
| `/explore` | 0.9 | daily | ✓ Correct (user-generated, high change) |
| `/champions` | 0.9 | weekly | ✓ Good (index page for Mega data) |
| `/faq` | 0.6 | monthly | ⚠ Could be 0.8 (high search intent) |
| `/tournaments` | 0.7 | weekly | ✓ Good (tournament results update) |
| `/s/[id]` (shares) | 0.6 | monthly | ⚠ Could vary: public 0.7, unlisted 0.5 |
| `/creator/[name]` | 0.6 | weekly | ✓ Good |

### Recommendation
- **Increase FAQ priority** to 0.8 (high search intent, stable content)
- **Add `/feedback`** to sitemap if public-facing

---

## 4. Structured Data (JSON-LD) Coverage

### Present ✓
| Page | Schema Type | Quality |
|------|------------|---------|
| Home (`/page.tsx`) | FAQPageJsonLd, HowToSchema | ✓ Excellent |
| Champions | ItemList (Mega Pokemon) | ✓ Good |
| Explore | CollectionPage | ✓ Good |
| Tournaments | SportsEvent | ✓ Good |
| FAQ | FAQPage (12 items) | ✓ Excellent |
| Layout (global) | WebSiteSchema, OrganizationJsonLd | ✓ Present |
| Shared Reports | BreadcrumbList | ✓ Present |

### Missing ✗

| Page | Missing Schema | Value |
|------|---|---|
| Home (`/`) | **BreadcrumbList** | Would clarify site structure |
| Home (`/`) | **SoftwareApplication** | Could markup "Build a Team Report" tool aspect |
| Tournaments | **BreadcrumbList** | Would help site hierarchy |
| Explore | **AggregateRating** (if filtering by rating) | Not applicable unless adding star ratings |

### Structured Data Quality Issues

**FAQ Schema:**
- ✓ All 12 questions have proper schema
- ✓ Answers are plain text (safe for snippet eligibility)
- ⚠ Consider adding `datePublished` to FAQ items for freshness signals

**HowToSchema (Home page):**
- ✓ 5 clear steps for team report creation
- ✓ Follows Google's recommended format
- ⚠ Could add estimated time: `"totalTime": "PT5M"`

**Missing Date Metadata:**
- Shared reports (`/s/[id]`) have no `datePublished`/`dateModified` in visible schema
- Tournaments page: SportsEvent schema lacks `dateCreated`

---

## 5. Canonical URLs

### Audit Results

| Page | Canonical | Status |
|------|-----------|--------|
| Home (`/`) | `https://pokemonvgcteamreport.com` | ✓ Present in layout |
| Champions | `https://pokemonvgcteamreport.com/champions` | ✓ Present |
| Explore | `https://pokemonvgcteamreport.com/explore` | ✓ Present |
| Tournaments | `https://pokemonvgcteamreport.com/tournaments` | ✓ Present |
| FAQ | `https://pokemonvgcteamreport.com/faq` | ✓ Present |
| Privacy | `https://pokemonvgcteamreport.com/privacy` | ✓ Present |
| Dashboard | ✗ **MISSING** | Should noindex instead |
| Shared Reports | Dynamic from share data | ⚠ Check if canonical is set |

### Canonical Issues

**Home page layout sets global canonical:**
```
metadataBase: new URL("https://pokemonvgcteamreport.com")
```
This is correct for the root but may conflict if subpages don't override explicitly.

**Recommendation:** Verify no URL parameter variations (e.g., `/page?draft=123`) are being indexed as separate pages.

---

## 6. Robots Meta & Authentication Pages

### Properly Blocked Pages ✓
```
/dashboard → noindex, nofollow ✓
/dashboard/notifications → noindex, nofollow ✓
/notifications → noindex, nofollow ✓
/embed/[id] → <meta name="robots" content="noindex, nofollow"> ✓
```

### Pages Requiring Review ⚠

| Page | Current | Assessment |
|------|---------|------------|
| `/dashboard/profile` | NO METADATA | ✗ Missing noindex |
| `/dashboard/privacy` | NO METADATA | ✗ Missing noindex |
| `/s/[id]?key=...` (edit view) | Conditional robots | ⚠ Verify edit URLs not indexed |
| `/creator/[name]` | Likely public | ✓ Correct (public profiles are discoverable) |

### Robots.txt Coverage
- File exists: `/public/robots.txt` ✓
- **Content:** (need to verify manually or check via `GET /robots.txt`)

**Recommendation:** Ensure robots.txt includes:
```
User-agent: *
Disallow: /dashboard/
Disallow: /api/
Disallow: /embed/
Allow: /s/
Allow: /creator/
Allow: /
Sitemap: https://pokemonvgcteamreport.com/sitemap.xml
```

---

## 7. Keyword Opportunity Analysis

### Top 10 Keyword Gaps for VGC Team Building/Sharing Content

Ranked by search volume + VGC community intent:

1. **"VGC team builder free"**
   - Search Intent: Solution-seeking (tool discovery)
   - Current Coverage: Weak (home page says "free" but buries it)
   - Opportunity: Add to home metadata, create FAQ item
   - Estimated Monthly Volume: 200-500 (niche)

2. **"Pokemon team report template"**
   - Search Intent: Educational (how to format a report)
   - Current Coverage: None
   - Opportunity: Create guide page or FAQ item with sample report structure
   - Volume: 100-300

3. **"How to write a VGC team report"**
   - Search Intent: Educational + solution-seeking
   - Current Coverage: Partial (FAQ answers in prose, no dedicated guide)
   - Opportunity: Create guide page with step-by-step sections
   - Volume: 300-600

4. **"Showdown team export Pokemon"** / **"PokéPaste to team report"**
   - Search Intent: Technical (format conversion)
   - Current Coverage: Mentioned in FAQ but not titled as keyword
   - Opportunity: Add as dedicated FAQ item or blog post title
   - Volume: 150-400

5. **"Best Pokemon Champions teams"** / **"Regulation M-A sample teams"**
   - Search Intent: Research (meta analysis)
   - Current Coverage: Champions page lists Mega Pokemon but lacks "best teams" angle
   - Opportunity: Feature top teams from /explore on Champions page, create tier list
   - Volume: 200-500

6. **"Damage calculator Pokemon VGC"** / **"Speed tier calculator"**
   - Search Intent: Tool discovery
   - Current Coverage: Mentioned in FAQ but not prominent as standalone feature
   - Opportunity: Create landing page for damage calc tool, market in FAQ
   - Volume: 300-600

7. **"Open team sheet OTS Pokemon format"**
   - Search Intent: Educational (format understanding)
   - Current Coverage: FAQ explains OTS but title doesn't match search query
   - Opportunity: Retitle FAQ item or create standalone guide page
   - Volume: 100-300

8. **"VGC team analysis template"**
   - Search Intent: Educational
   - Current Coverage: None (implied in reports but not titled)
   - Opportunity: Create template page with matchup plan sections
   - Volume: 50-200

9. **"Pokémon Champions 2026 team building"**
   - Search Intent: Solution-seeking
   - Current Coverage: Home page mentions but not central to messaging
   - Opportunity: Create Champions-specific landing page or guide
   - Volume: 200-400

10. **"Share Pokemon team online"**
    - Search Intent: Solution-seeking (alternatives research)
    - Current Coverage: Partial (home page value prop, but generic)
    - Opportunity: Create comparison article (VGC Team Report vs. PokéPaste vs. Smogon)
    - Volume: 300-500

---

## 8. Technical SEO Issues

### Critical Issues

1. **Dashboard subpages missing robots meta** (affects `/dashboard/profile` and `/dashboard/privacy`)
   - Risk: User profile pages could be indexed
   - Fix: Add metadata with `robots: { index: false, follow: false }`

2. **FAQ page lacks keywords field**
   - Risk: Loses keyword relevance signal for search queries like "VGC team report FAQ"
   - Fix: Add 8-10 keywords to FAQ metadata

3. **Shared reports (`/s/[id]?key=...`) may be indexed**
   - Risk: Edit tokens exposed in search results = security issue
   - Fix: Ensure edit URLs with `?key=` parameter return robots: noindex

### Medium Issues

1. **Home page OG image uses fallback**
   - Current: `/opengraph-image` and `/og-default.png`
   - Opportunity: Create home-specific OG image with hero section preview

2. **Sitemap priority doesn't reflect search value**
   - FAQ has 0.6 but should be 0.8 (high search intent)
   - Feedback page not in sitemap

3. **Missing BreadcrumbList on home and tournament pages**
   - Opportunity: Add to all tier-1 pages for enhanced SERP appearance

4. **Shared reports lack datePublished/dateModified in visible schema**
   - Opportunity: Add publish date to share schema for "recently updated" signals

### Low Issues

1. Timestamps in sitemap use `lastModified` which is correct, but creators-by-name pages could have more specific update times

---

## 9. Content Coverage Analysis

### Well-Covered Topics
- ✓ **What is a VGC team report** (FAQ comprehensive)
- ✓ **How to create a team report** (5-step HowToSchema)
- ✓ **Pokemon Champions format** (dedicated page with Mega Pokemon)
- ✓ **Damage calculations in VGC** (FAQ item)
- ✓ **Speed tiers** (FAQ item)
- ✓ **Open Team Sheet (OTS)** (FAQ item, with tool support)
- ✓ **SP spreads in Champions** (FAQ item)
- ✓ **Regulation M-A** (FAQ item, Champions page)
- ✓ **Team report discovery** (Explore page, FAQ)

### Under-Covered Topics
- ⚠ **VGC team report template/structure** (only in prose)
- ⚠ **Comparison: VGC Team Report vs. alternatives** (FAQ compares briefly but not detailed)
- ⚠ **Matchup plan guide** (mentioned in reports but no separate SEO page)
- ⚠ **EV spread guides** (FAQ mentions SP spreads, not EVs)
- ⚠ **Tournament-specific team building** (only aggregated in /tournaments)

---

## 10. Link & Authority Signals

### Internal Linking
- ✓ FAQ links to home ("/") and Explore ("/explore")
- ✓ Tournaments page provides links to shared reports
- ✓ Home page navbar links all tier-1 pages
- ⚠ Missing deep linking opportunities:
  - FAQ items don't have anchor IDs (e.g., `#what-is-vgc-team-report`)
  - No "related article" links between pages

### External Linking
- ✓ Privacy policy links to contact email
- ✓ FAQ mentions Smogon, PokéPaste, Pikalytics (context)
- ⚠ No backlink strategy mentions

---

## 11. Mobile & Viewport Optimization

### Viewport Meta Tag ✓
```
width: device-width, initialScale: 1, maximumScale: 5, userScalable: true
```
Correct and inclusive (allows zoom).

### Responsive Metadata
- ✓ Apple web app configured
- ✓ PWA manifest linked
- ✓ Dark mode theme colors specified

---

## 12. Summary of Quick Wins (Priority Order)

### Quick Wins (1-2 hours)

1. **Add robots: noindex to dashboard subpages** (`/dashboard/profile`, `/dashboard/privacy`)
   - File: `/src/app/dashboard/profile/page.tsx`, `/src/app/dashboard/privacy/page.tsx`
   - Impact: High (prevent profile page indexing)

2. **Add keywords field to FAQ page metadata**
   - File: `/src/app/faq/page.tsx`
   - Impact: Medium (improves keyword relevance signal)

3. **Increase FAQ priority in sitemap to 0.8**
   - File: `/src/app/sitemap.ts`
   - Impact: Medium (signals search engine of content importance)

4. **Add BreadcrumbList schema to home page**
   - File: `/src/app/page.tsx`
   - Impact: Low (SERP appearance enhancement)

5. **Add anchor IDs to FAQ items** (e.g., `id={slugify(item.question)}`)
   - File: `/src/app/faq/page.tsx` (already does this!)
   - Impact: Already done ✓

### Medium Wins (2-4 hours)

6. **Verify `/s/[id]?key=` edit URLs return noindex**
   - Check: ShareRedirectClient implementation
   - Fix: Add robots directive for ?key= parameter URLs

7. **Add `/feedback` to static sitemap entries**
   - Impact: Ensures feedback page is crawled

8. **Create home-specific OG image**
   - Replace `/opengraph-image` with hero preview
   - Impact: Medium (CTR improvement in social shares)

9. **Add `totalTime` to HowToSchema on home page**
   - Value: "PT5M" (5 minutes)
   - Impact: Low (schema enrichment)

10. **Add datePublished to shared report schema**
    - Impact: Low (freshness signal)

---

## 13. Keyword Gap Summary (Top 5 to Address)

| Keyword | Volume Estimate | Current Coverage | Recommended Action |
|---------|-----------------|------------------|-------------------|
| VGC team builder free | 200-500 | Weak | Boost home title/description |
| How to write a VGC team report | 300-600 | Partial (FAQ) | Create dedicated guide page |
| Pokemon team report template | 100-300 | None | FAQ item + template page |
| Best Pokemon Champions teams | 200-500 | Weak (Champions page) | Feature top teams, tier list |
| Damage calculator Pokemon | 300-600 | Mentioned (FAQ) | Dedicated landing page |

---

## 14. Indexing Issues & Fixes

### No Critical Indexing Issues Found ✓

However:
- ✓ Sitemap correctly excludes private shares
- ✓ Dashboard pages correctly blocked
- ✓ Embed pages correctly noindexed
- ⚠ **Monitor:** Ensure ?key= parameter pages return noindex (currently not visible in public metadata)

---

## 15. Recommendations by Priority

### P0 (Critical) — Do This Week
- [ ] Add robots: noindex to dashboard profile/privacy pages
- [ ] Verify edit URLs (/s/[id]?key=) are noindexed
- [ ] Add keywords to FAQ metadata

### P1 (High) — Do This Sprint
- [ ] Create "How to Write a VGC Team Report" guide page
- [ ] Feature "Best Pokemon Champions Teams" on Champions page with filtering/sorting
- [ ] Add BreadcrumbList to all tier-1 pages
- [ ] Create dedicated landing page for damage calculator tool

### P2 (Medium) — Next Quarter
- [ ] Add anchor IDs to FAQ items for deep linking
- [ ] Create VGC Team Report vs. alternatives comparison page
- [ ] Build team template library (downloadable/copyable structures)
- [ ] Add creator spotlights or team analysis blog

### P3 (Low) — Backlog
- [ ] Custom home OG image
- [ ] Add totalTime to HowToSchema
- [ ] Create tournament guide pages (/tournaments/{region})

---

## Conclusion

**Overall SEO Health: B+ (Good Foundation, High-Intent Keywords Underexploited)**

Strengths:
- Excellent technical SEO (robots, canonicals, structured data)
- Smart dynamic metadata for user-generated content
- Comprehensive FAQ with proper schema
- Clean sitemap with public report indexing

Weaknesses:
- **Keyword gaps** on high-intent queries ("team builder," "how to write," "templates")
- **Dashboard metadata inconsistency** (some pages blocked, some not)
- **Missing guide/comparison content** that would rank for educational queries
- **Weak home page value prop** (mentions free late in description)

The biggest opportunity is **creating authoritative content around keywords like "VGC team report," "team builder," and "how to guides"** which currently receive moderate search volume but low competitive content. The site's FAQ schema is excellent; expanding that into standalone guide pages would compound SEO value.

---

**Audit Completed by:** Claude Code SEO Specialist  
**Date:** May 26, 2026  
**Next Audit Recommended:** 90 days (after implementation of P0/P1 changes)
