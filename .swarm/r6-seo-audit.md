# SEO Audit: VGC Team Report — Full Competitive Landscape Review
**Date:** 2026-05-28 (Wave 4 — supersedes 2026-05-13 Wave 3)
**Site:** https://pokemonvgcteamreport.com

---

## Executive Summary

Google is indexing only **2 pages** from the entire site (homepage + /champions). This is the single most critical SEO issue. The site has 10+ static pages, ~59 individual Mega Pokemon guides, thousands of public share pages, and creator profile pages — none of which appear in Google's index. The homepage (`page.tsx`) is a `"use client"` component, meaning its H1, FAQPage JSON-LD, and HowTo JSON-LD are only rendered after JavaScript execution — invisible to crawlers that don't execute JS. The previous audit's quick wins (SP spread terminology, homepage title, ItemList, SportsEvent, dashboard noindex, embed noindex) have been implemented. The competitive landscape has intensified: Reportworm, ChampionsMeta, ChampTeams.gg, and PikaChampions are all gaining search visibility. VGC Team Report ranks #1-3 for its branded query "VGC team report" but is absent from all high-volume generic queries.

### Changes Since Last Audit (May 13)
- **FIXED**: Homepage title now includes "Pokemon Champions 2026"
- **FIXED**: `/champions/[pokemon]` titles use "SP Spreads" instead of "EV Spreads"
- **FIXED**: `/champions` has `ItemList` JSON-LD
- **FIXED**: `/tournaments` has `SportsEvent` JSON-LD
- **FIXED**: `/dashboard` has `robots: { index: false }`
- **FIXED**: `/embed/[id]` has `noindex, nofollow`
- **STILL OPEN**: No `twitter:site` handle
- **STILL OPEN**: Homepage is `"use client"` — body content not server-rendered
- **STILL OPEN**: No standalone content pages (speed tiers, Reg M-A guide, how-to guide)
- **STILL OPEN**: No blog/editorial section for content marketing
- **NEW FINDING**: Only 2 pages indexed by Google (critical)
- **NEW FINDING**: Bot detection blocks GPTBot in middleware but robots.txt allows it (contradictory)
- **NEW FINDING**: `/faq` and `/tournaments` missing from middleware public routes (dead code, no impact)
- **NEW FINDING**: Explore page title still lacks "Pokemon Champions 2026"

---

## 1. Google Index Coverage (CRITICAL)

### site:pokemonvgcteamreport.com results (May 28, 2026): **2 pages**

| Page | Indexed? |
|------|----------|
| `/` (homepage) | YES |
| `/champions` (hub) | YES |
| `/champions/mega-aggron` (sample) | YES (1 seen) |
| `/explore` | NO |
| `/faq` | NO |
| `/tournaments` | NO |
| `/compare` | NO |
| `/changelog` | NO |
| `/s/[id]` (share pages) | NO |
| `/creator/[name]` (profiles) | NO |

### Likely Causes

1. **Site age**: Domain is relatively new; Google crawls and indexes new sites slowly.
2. **Thin crawl budget**: With only 2 pages indexed, Googlebot may not be discovering internal links efficiently. The homepage is fully client-rendered — if Googlebot doesn't execute JS (or times out), it sees no internal links.
3. **Client-side homepage**: The homepage (`page.tsx`) is `"use client"` — no server-rendered HTML body. Google's renderer may not be extracting internal links from the SPA shell.
4. **Sitemap discovery**: The sitemap is dynamically generated (`src/app/sitemap.ts`) and may contain thousands of URLs. Need to verify it's accessible to crawlers.
5. **No Google Search Console verified**: Need to submit sitemap manually.

### Recommended Actions

1. **Submit sitemap.xml in Google Search Console** immediately.
2. **Request indexing** for key pages: `/explore`, `/faq`, `/tournaments`, `/champions/[pokemon]`.
3. **Add a server-rendered internal link section** to the homepage layout (not inside the client component) so crawlers can discover all pages without JS.
4. **Move `FAQPageJsonLd` and `HowToSchema` from `page.tsx` to `layout.tsx`** or a server component wrapper — currently they're client-only.

---

## 2. SERP Visibility Snapshot (May 28, 2026)

| Query | VGC Team Report Position | Top Rankers |
|-------|--------------------------|-------------|
| "VGC team report" | **#1** | pokemonvgcteamreport.com, Victory Road, Smogon |
| "pokemon vgc team report" | **#1-2** | pokemonvgcteamreport.com, vgc-team-report.vercel.app |
| "best vgc team builder 2026" | **NOT RANKING** | PokemonBuilder, Pikalytics, VGC Trainer, Champions Lab |
| "pokepaste alternative" | **NOT RANKING** | crob.at, pokepastefix extension |
| "share vgc team" | **NOT RANKING** | Pikalytics, Victory Road |
| "best vgc teams 2026" | **NOT RANKING** | Showdown Tier, VGC Trainer, Pikalytics |
| "vgc damage calculator" | **NOT RANKING** | Porygon Labs, VGC Helper, Pikalytics |
| "vgc speed tiers 2026" | **NOT RANKING** | Turnadus, Pikalytics |
| "pokemon champions regulation MA teams" | **NOT RANKING** | Showdown Tier, Pokemon Zone, ChampTeams.gg, ChampionsMeta |
| "pokemon open team sheet OTS maker" | **NOT RANKING** | VGC OTS extension, Team List Generator |
| "vgc matchup plan builder" | **NOT RANKING** | DevonCorp, PikaChampions |
| "reportworm vgc" | **NOT RANKING** (competitor rising) | reportworm.com |

### Key Observation
VGC Team Report dominates branded queries but has **zero presence** in generic high-intent queries. The site is invisible for the most searched VGC tool queries.

---

## 3. Competitor Landscape Update (May 28, 2026)

### Tier 1 — Dominant Authority
| Site | Keyword Ownership | Threat Level |
|------|-------------------|--------------|
| **Pikalytics** | Usage stats, team builder, damage calc, speed tiers, top teams | HIGH — owns the most high-volume queries |
| **Victory Road** | Team reports (editorial), replica teams, regulations guide | HIGH — direct competitor for "VGC team report" |

### Tier 2 — Growing Fast
| Site | Keyword Ownership | Threat Level |
|------|-------------------|--------------|
| **ChampionsMeta.io** | Reg M-A meta, tournaments, usage rankings | MEDIUM-HIGH — 201 tournaments, 14K teams indexed |
| **ChampTeams.gg** | Tier list, meta cores, team browse | MEDIUM |
| **Reportworm** | Replay analysis, auto-generated team reports | MEDIUM — direct feature overlap |
| **VGC Trainer** | Reg I meta guide, competitive data | MEDIUM |

### Tier 3 — Niche
| Site | Keyword Ownership |
|------|-------------------|
| Porygon Labs | Damage calculator for Champions |
| Champions Lab | Simulator + team builder |
| PikaChampions | Free team builder + matchup analysis |
| Champions Builder | SP calculator + damage calc |
| crob.at | PokePaste alternative with previews |
| VGC.tools | Community team builder + library |
| Showdown Tier | Tier lists, viability rankings |
| NuzTools | Team sheet generator |

### New Since Last Audit
- **ChampionsMeta.io**: Rapidly growing; 201 tournaments tracked, tournament-specific URLs indexed
- **Reportworm Standings**: Separate standings subdomain (standings.reportworm.com) with teamsheets from major events
- **VGC Team Helper** (vgcteamhelper.com): New entrant

---

## 4. Top 10 Keyword Gaps

| # | Keyword Cluster | Monthly Search Intent | Top Rankers | What VGC Team Report Needs |
|---|----------------|----------------------|-------------|---------------------------|
| 1 | `pokepaste alternative` / `pokepaste with sprites` | High — tool query | crob.at, sitelike.org | Dedicated comparison page or FAQ entry targeting this; site IS a PokePaste alternative but doesn't target the query |
| 2 | `VGC speed tiers 2026` / `Pokemon Champions speed tiers` | High | Turnadus, Pikalytics | Standalone `/speed-tiers` page with SSG content |
| 3 | `VGC damage calculator` / `Pokemon Champions damage calc` | Very high | Pikalytics, Porygon Labs, VGC Helper | Feature exists in-app but no SEO-targeting landing page |
| 4 | `Regulation M-A VGC guide` / `Pokemon Champions format guide` | High informational | Pikalytics, ChampionsMeta, Pokemon Zone | No dedicated `/regulation-m-a` guide page |
| 5 | `how to write a VGC team report` / `VGC team report template` | Mid — high-intent, low competition | No clear owner | Obvious authority opportunity; needs a blog/guide page |
| 6 | `best VGC teams 2026` / `top VGC tournament teams` | Very high | Pikalytics, VGC Trainer, ChampionsMeta | `/explore` page targets this but isn't indexed by Google |
| 7 | `VGC matchup plan` / `VGC matchup chart` | Mid | DevonCorp (SPAMS), PikaChampions | Core feature; no standalone page |
| 8 | `Pokemon open team sheet generator` / `OTS generator VGC` | Mid — tool query | VGC OTS extension, Team List Generator, NuzTools | Feature exists; no dedicated landing page |
| 9 | `Indianapolis Regionals 2026 teams` / `VGC Worlds 2026 teams` | High seasonal | Limitless, Bulbagarden, ChampionsMeta | No tournament-specific pages (`/tournaments/indianapolis-2026`) |
| 10 | `Pokemon Champions metagame` / `Regulation M-A tier list` | High | Showdown Tier, ChampionsMeta, Pokemon Zone | No metagame content; entire site is tool-focused |

---

## 5. Current Site Metadata Assessment

### Homepage (`/`)
| Element | Current Value | Status |
|---------|---------------|--------|
| `<title>` | "VGC Team Report — Build & Share Pokemon VGC Teams \| Pokemon Champions 2026" | GOOD (updated since last audit) |
| Meta description | "The free VGC team report builder — share your VGC team with notes, matchup plans, and damage calcs..." | GOOD |
| OG title | "VGC Team Report — Build, Share & Discover Pokemon Teams" | WEAK — doesn't match page title, no "2026" or "Champions" |
| H1 | "VGC Team Report" (client-rendered) | ISSUE — not in initial HTML |
| JSON-LD (layout) | WebApplication + Organization + WebSite (SearchAction) | GOOD — server-rendered |
| JSON-LD (page) | FAQPage + HowTo | ISSUE — client-rendered, invisible to crawlers |
| Canonical | pokemonvgcteamreport.com | GOOD |
| `twitter:site` | NOT SET | MISSING |

### `/explore`
| Element | Current Value | Status |
|---------|---------------|--------|
| Title | "Explore VGC Teams \| VGC Team Report" | WEAK — no "Pokemon Champions", no "2026" |
| Description | Good — mentions Champions, Mega Evolution | OK |
| JSON-LD | CollectionPage | OK |
| Indexing | NOT INDEXED BY GOOGLE | CRITICAL |

### `/champions`
| Element | Current Value | Status |
|---------|---------------|--------|
| Title | "Pokemon Champions Format \| Mega Evolution Teams — VGC Team Report" | GOOD |
| JSON-LD | ItemList (all Megas) | GOOD (added since last audit) |
| Indexing | INDEXED | OK |

### `/champions/[pokemon]`
| Element | Current Value | Status |
|---------|---------------|--------|
| Title | "${displayName} VGC Guide — SP Spreads, Movesets & Teams" | GOOD (SP fixed) |
| JSON-LD | WebPage + BreadcrumbList + FAQ | GOOD |
| Keywords | 15+ per page | OK (Google ignores but consistent) |
| Indexing | Only 1 page seen (mega-aggron) | POOR — 59 pages should be indexed |

### `/s/[id]` share pages
| Element | Current Value | Status |
|---------|---------------|--------|
| Title | Dynamic: tournament + species based | GOOD |
| OG image | Intentionally empty (unfurl issues) | KNOWN LIMITATION |
| JSON-LD | CreativeWork with author | GOOD |
| Canonical | Per-share canonical | GOOD |
| Noindex for private | YES | GOOD |
| Indexing | NONE INDEXED | CRITICAL — thousands of public shares invisible |

### `/faq`
| Element | Current Value | Status |
|---------|---------------|--------|
| Title | "VGC Team Report FAQ — Common Questions Answered" | GOOD |
| FAQPage JSON-LD | 12 questions including SP, Reg M-A, OTS | GOOD |
| Content | Rich, well-written answers | EXCELLENT for featured snippets |
| Indexing | NOT INDEXED | CRITICAL — missing featured snippet opportunity |

### `/tournaments`
| Element | Current Value | Status |
|---------|---------------|--------|
| Title | "VGC Tournament Results Archive \| Team Reports 2026" | GOOD |
| SportsEvent JSON-LD | Indianapolis Regionals + Worlds 2026 | GOOD (added since last audit) |
| Indexing | NOT INDEXED | CRITICAL |

---

## 6. Structured Data Audit

### Currently Implemented (all correct)
| Schema Type | Location | Status |
|-------------|----------|--------|
| WebApplication + SoftwareApplication | Root layout | GOOD |
| WebSite + SearchAction | Root layout | GOOD |
| Organization + logo + sameAs | Root layout | GOOD |
| FAQPage | Root page (client) + /faq (server) | MIXED — /faq is good, root is client-only |
| HowTo (5 steps) | Root page (client) | ISSUE — client-only |
| ItemList (Megas) | /champions | GOOD |
| BreadcrumbList | /champions/[pokemon] | GOOD |
| SportsEvent | /tournaments | GOOD |
| CollectionPage | /explore | GOOD |
| ProfilePage + Person | /creator/[name] | GOOD |
| CreativeWork | /s/[id] | GOOD |

### Missing / Recommended
1. **Move FAQPageJsonLd and HowToSchema to a server component** — currently client-only on homepage
2. **BreadcrumbList on /explore, /tournaments, /faq** — only /champions/[pokemon] has it
3. **Article schema** for any future guide/blog pages
4. **Add `sameAs` social links** to Organization schema (Twitter/X, Discord invite)

---

## 7. Technical SEO Checklist

| Item | Status | Notes |
|------|--------|-------|
| robots.txt | GOOD | Allows all bots, disallows /api/, declares sitemap |
| Sitemap | GOOD (dynamic) | Includes static + share + creator pages |
| Canonical tags | GOOD | All pages have canonical in alternates |
| `lang="en"` | GOOD | On root html element |
| metadataBase | GOOD | Set to pokemonvgcteamreport.com |
| OG image (root) | GOOD | opengraph-image.tsx present |
| Twitter card | GOOD | summary_large_image on most pages |
| `twitter:site` | **MISSING** | Easy fix |
| noindex on private pages | GOOD | Dashboard + embed both noindexed |
| Breadcrumbs | PARTIAL | Only on /champions/[pokemon] |
| Vercel domain redirect | GOOD | 301 from vercel.app to canonical domain |
| Mobile viewport | GOOD | width=device-width, user-scalable=true |
| PWA manifest | GOOD | Comprehensive with screenshots |
| HSTS | GOOD | max-age=63072000 |
| Image lazy loading | GOOD | Sprites use loading="lazy" |
| CSP | GOOD | Comprehensive but not SEO-relevant |
| Homepage rendering | **CRITICAL ISSUE** | `"use client"` — body not server-rendered |
| Core Web Vitals | UNTESTED | Cannot test from codebase; needs PageSpeed Insights |

### Bot Detection Contradiction
- `robots.txt` ALLOWS GPTBot and ClaudeBot
- `bot-detection.ts` BLOCKS GPTBot and anthropic-ai/claude-web at middleware level
- **Result**: AI crawlers are told "you're allowed" by robots.txt but get 403'd by middleware
- **Fix**: Either remove AI bots from robots.txt Allow rules or remove them from BLOCKED_BOT_PATTERNS

---

## 8. Mobile-Friendliness Signals

| Signal | Status | Details |
|--------|--------|---------|
| Viewport meta tag | GOOD | `width=device-width, initialScale=1, maximumScale=5, userScalable=true` |
| Touch targets | GOOD | min 44x44px per UI/UX standards |
| Font sizes | GOOD | Base text readable, responsive scaling |
| PWA support | GOOD | Full manifest, service worker, install prompt |
| Responsive layout | GOOD | Tailwind responsive classes throughout |
| Swipe navigation | GOOD | `useSwipeNavigation` hook for mobile report viewing |
| Skip to content link | GOOD | Accessible keyboard navigation |
| viewportFit: cover | GOOD | Handles notch/safe areas |

---

## 9. Quick-Win SEO Improvements

### Priority 1 — Fix Indexing (HIGHEST IMPACT)

**QW-1: Submit sitemap to Google Search Console (5 min)**
- Log into https://search.google.com/search-console
- Add property for pokemonvgcteamreport.com
- Submit sitemap.xml
- Request indexing for /explore, /faq, /tournaments, /champions/[pokemon] pages
- This is THE most impactful action. Everything else is secondary.

**QW-2: Move client-only JSON-LD to server component (30 min)**
- The `FAQPageJsonLd` and `HowToSchema` components in `src/app/page.tsx` are inside a `"use client"` boundary
- Move them to `layout.tsx` or create a server-component wrapper that renders them in the initial HTML
- Files: `src/app/page.tsx` lines 80-81, `src/app/layout.tsx`

**QW-3: Add server-rendered internal links to layout (20 min)**
- Add a minimal footer or nav section in `layout.tsx` (server component) with links to /explore, /champions, /faq, /tournaments
- Currently the PersistentNavbar may be client-rendered; confirm it renders nav links in initial HTML
- This ensures crawlers discover all pages even without JS execution

### Priority 2 — Metadata Gaps (30 min total)

**QW-4: Update `/explore` title to include "Pokemon Champions 2026" (5 min)**
- Current: `"Explore VGC Teams | VGC Team Report"`
- Proposed: `"Explore VGC Teams | Pokemon Champions 2026 Team Reports"`
- File: `/src/app/explore/page.tsx` line 6

**QW-5: Align OG title with page title on homepage (5 min)**
- Current OG: "VGC Team Report — Build, Share & Discover Pokemon Teams"
- Proposed: "VGC Team Report — Pokemon Champions Team Reports 2026"
- File: `/src/app/layout.tsx` line 46

**QW-6: Add `twitter:site` handle (5 min)**
- Add `twitter: { site: "@VGCTeamReport" }` (or actual handle) to root metadata
- File: `/src/app/layout.tsx`

**QW-7: Fix bot detection / robots.txt contradiction (10 min)**
- Either remove GPTBot/ClaudeBot from `robots.txt` Allow rules
- OR remove `gptbot`, `anthropic-ai`, `claude-web` from `BLOCKED_BOT_PATTERNS` in `src/lib/security/bot-detection.ts`
- Recommended: Keep blocking AI training scrapers at middleware level AND remove the misleading Allow rules from robots.txt
- Files: `public/robots.txt`, `src/lib/security/bot-detection.ts`

### Priority 3 — Content Pages for Keyword Gaps (1-3 days each)

**NP-1: `/speed-tiers` standalone page (HIGHEST ROI content page)**
- Target: "VGC speed tiers 2026", "Pokemon Champions speed tiers"
- Content: Static SSG page with key speed benchmarks for all Mega forms
- Internal links to all `/champions/[pokemon]` pages

**NP-2: `/guides/how-to-write-a-vgc-team-report` editorial guide**
- Target: "how to write a VGC team report", "VGC team report template"
- No competitor owns this — VGC Team Report is the obvious authority

**NP-3: `/regulation-m-a` format guide landing page**
- Target: "Regulation M-A VGC guide", "Pokemon Champions format"
- Content: Legal Pokemon, rules overview, tournament schedule, link to champions hub

**NP-4: Blog section (`/blog/`) for editorial content**
- Tournament recaps, meta analysis, team-building guides
- Captures informational queries that tools alone cannot
- Differentiator vs. pure-tool competitors like Pikalytics

### Priority 4 — Structured Data Additions (15 min each)

**QW-8: Add BreadcrumbList to /explore, /faq, /tournaments**
- Simple Home > PageName breadcrumb
- Enables breadcrumb rich results in SERPs

**QW-9: Add `sameAs` social links to Organization JSON-LD**
- GitHub (already present), Twitter/X, Discord

---

## 10. Competitor Keyword Coverage Matrix (May 28, 2026)

| Keyword | Pikalytics | Victory Road | Limitless | ChampionsMeta | Reportworm | VGC Team Report |
|---------|-----------|-------------|-----------|---------------|------------|----------------|
| VGC 2026 / Pokemon Champions | Y | Y | Y | Y | Y | Y (in title now) |
| team report / write-up | N | Y | N | N | Y (auto) | **Y (core)** |
| SP spread / stat points | Y | N | N | Y | N | Y (fixed) |
| damage calculator | Y | N | N | N | Y | N (feature only) |
| speed tiers | Y | N | N | N | N | N (feature only) |
| Regulation M-A guide | Y | Y | N | Y | N | N |
| Mega Evolution VGC 2026 | Y | Y | N | Y | N | Y (/champions) |
| matchup plan VGC | N | N | N | N | Y | N (feature only) |
| OTS generator VGC | N | N | N | N | N | N (feature only) |
| tournament results VGC | Y | Y | Y | Y | Y | Partial (/tournaments) |
| pokepaste alternative | N | N | N | N | N | N |
| VGC team builder | Y | N | N | Y | N | N |

---

## 11. Backlink Opportunities

1. **Limitless VGC**: Tournament team pages could link to VGC Team Report creator profiles
2. **Reddit r/VGC, r/stunfisk**: Community posts sharing team reports
3. **Smogon Forums**: Team report threads referencing the tool
4. **Victory Road**: Partnership or cross-link opportunity (different product angles)
5. **DevonCorp**: Resource page already lists VGC tools — get listed
6. **VGCGuide.com**: Comprehensive resource list

---

*Content change drafts saved to: `.swarm/drafts/r6-seo-drafts.md`*
