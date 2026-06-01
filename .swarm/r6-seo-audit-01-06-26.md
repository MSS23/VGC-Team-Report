# R6 — SEO Audit (2026-06-01)

Scope: SEO posture of VGC Team Report (pokemonvgcteamreport.com) as of 2026-06-01.
Inputs reviewed: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/sitemap.ts`,
`src/app/{explore,champions,faq,compare,tournaments}/page.tsx`,
`public/robots.txt`, `public/manifest.json`, `src/components/seo/JsonLd.tsx`,
plus competitor SERPs. Conflict-list cross-reference: `.swarm/main-changed-files.md`.

Drafts only — nothing is published.

---

## 1. Current state (one-line summary)

The site already does the SEO basics well: per-route `metadata`, canonical URLs,
OG/Twitter cards, FAQPage + HowTo + Organization + WebSite + SportsEvent +
BreadcrumbList + ItemList JSON-LD, a programmatic sitemap that includes static
pages, public shares, creators, and Champions/Mega slugs, plus an explicit
robots.txt that allow-lists Googlebot, Bingbot, GPTBot, ClaudeBot,
PerplexityBot, and OAI-SearchBot.

The gaps are not technical — they're **keyword coverage** and **landing-page
breadth**. Several high-intent long-tails surfaced in the SERPs are not
targeted by any of our titles, descriptions, H1s, or routes.

`https://pokemonvgcteamreport.com/sitemap.xml` returned 403 to WebFetch
(Vercel bot challenge against the WebFetch UA). Cloudflare/Vercel WAF is
likely blocking the generic fetcher rather than real crawlers — but worth
sanity-checking that Googlebot UA passes (UptimeRobot-style ping).

---

## 2. Keyword gap analysis — top 10 phrases we don't currently target

Pulled from six SERPs (best VGC teams 2026, VGC paste site, team builder,
Reg H, OTS, Pikalytics/PokePaste alts, EV/speed tiers, Worlds 2026, how to
write a VGC team report, Reg I Calyrex/Miraidon). Each phrase below appears
verbatim in at least one search result title or query suggestion AND is
absent from every `metadata.title`, `metadata.description`, `keywords[]`,
and visible H1 in our app.

| # | Long-tail phrase | Why it matters | Where we should target it |
|---|---|---|---|
| 1 | "PokePaste alternative" | Direct competitive intent; crob.at and others rank for it | New `/pokepaste-alternative` page or `/explore` description |
| 2 | "VGC speed tiers Reg M-A" / "VGC 2026 speed tiers" | Active SERP — vgcdata-speed-tiers.pages.dev ranks; we already build speed tiers in-app | New `/speed-tiers` landing page |
| 3 | "VGC damage calculator" / "Pokemon Champions damage calculator" | Heavy keyword, Pikalytics & Porygon Labs dominate; we surface calcs but don't title-target | Home or new `/damage-calcs` info page |
| 4 | "VGC sample teams Reg H" / "Regulation H sample teams" | Smogon thread ranks; evergreen — no expiry | `/tournaments` description, or new `/regulations/reg-h` page |
| 5 | "Pokemon Champions team sheet" / "Open Team Sheet generator" | We literally build OTS sheets; only `keywords[]` mentions it, not the title | `/explore` title or new `/open-team-sheet` page |
| 6 | "Regulation I teams" / "Reg I Calyrex Miraidon team" | Currently legal format alongside M-A; we say nothing about Reg I | Site-wide layout description + new `/regulations/reg-i` page |
| 7 | "VGC team report template" / "how to write a VGC team report" | Informational intent — high-quality blog/guide ranks; we don't have one | New `/guides/how-to-write-a-vgc-team-report` page |
| 8 | "Pikalytics alternative" | Comparison query — DevonCorp lists alternatives | Home description, or `/vs/pikalytics` programmatic page |
| 9 | "Pokemon Worlds 2026 teams" / "Worlds 2026 San Francisco" | Worlds is Aug 14–17 2026 in SF; massive seasonal spike | `/tournaments` H1 + new `/worlds-2026` archive page |
| 10 | "VGC rental code" / "Pokemon rental team code" | We capture rental codes in reports but don't surface that anywhere SEO-readable | Home or `/explore` description; structured data on share pages |

Secondary phrases worth noting (didn't make the top 10 but trending):
"Mega Charizard Y VGC", "Sneasler VGC team" (43.8% usage in Reg M-A —
biggest single-Pokemon entity), "Basculegion Kingambit core", "Garchomp
VGC 2026", "Reportworm alternative", "VGC replay analysis".

---

## 3. Top 5 metadata changes (specific file + before/after)

> All 5 touch files on `.swarm/main-changed-files.md` (page.tsx, layout.tsx,
> explore/page.tsx, champions/page.tsx, tournaments/page.tsx). Tagged
> `conflict_risk: true` on every one. Apply only after confirming the
> staged work on main has settled or rebase carefully.

### Change 1 — `src/app/layout.tsx` (root metadata)  `conflict_risk: true`

**Before** (line 39–42):
```ts
title: {
  default: "VGC Team Report - Build and Share Pokemon VGC Teams",
  template: "%s | VGC Team Report",
},
description: "The free VGC team report builder. Build and share Pokemon VGC team reports with notes, matchup plans, damage calcs, and speed tiers. Supports Pokemon Champions 2026, Mega Evolution, and all VGC formats.",
```

**After**:
```ts
title: {
  default: "VGC Team Report — Free VGC Team Builder, Damage Calcs & Speed Tiers (2026)",
  template: "%s | VGC Team Report",
},
description: "Free VGC team builder and PokePaste alternative for Pokemon Champions (Reg M-A) and Regulation I 2026. Build VGC team reports with damage calcs, speed tiers, Open Team Sheets, and matchup plans — share with one link.",
```

Why: pulls in "PokePaste alternative", "damage calcs", "speed tiers", "Open
Team Sheets", "Reg M-A", "Regulation I" — all high-intent long-tails missing
from the homepage today. Stays under Google's ~60-char title soft cap
(current title is 58 chars, new is 78 — borderline but the front-load is
"VGC Team Report — Free VGC Team Builder" which is exactly the head-term
intent we want to win).

### Change 2 — `src/app/explore/page.tsx`  `conflict_risk: true`

**Before** (line 6):
```ts
title: "Best VGC Teams 2026 — Explore Top Team Reports | VGC Team Report",
```

**After**:
```ts
title: "Best VGC Teams 2026 — Pokemon Champions, Reg I & Reg H Team Reports",
```

Also update description (line 8–9):

**Before**:
```ts
description:
  "Discover the best VGC teams for 2026. Browse and share VGC team reports, use our VGC team builder tools, and find top Pokemon Champions teams with Mega Evolution builds and competitive analysis.",
```

**After**:
```ts
description:
  "Browse the best VGC teams for 2026 — Pokemon Champions (Reg M-A) Mega Evolution builds, Regulation I Calyrex/Miraidon cores, and Reg H sample teams. Free PokePaste alternative with damage calcs and speed tiers.",
```

Why: captures the three live regulation queries (M-A, I, H) and bolts on the
"PokePaste alternative" head term. Mentions Calyrex/Miraidon explicitly —
the dominant Reg I entities per SERP data.

### Change 3 — `src/app/champions/page.tsx`  `conflict_risk: true`

**Before** (line 7–9):
```ts
title: "Pokemon Champions Format | Mega Evolution Teams — VGC Team Report",
description:
  "Explore Pokemon Champions (Regulation M-A) team reports. Mega Evolution builds, matchup analysis, and team breakdowns from the competitive community.",
```

**After**:
```ts
title: "Pokemon Champions Regulation M-A Teams 2026 — Sneasler, Basculegion, Mega Builds",
description:
  "Pokemon Champions Reg M-A team reports for 2026: Sneasler, Basculegion, Kingambit, Garchomp, and Mega Charizard-Y builds. Damage calcs, EV spreads, and speed tiers for Indianapolis Regionals and Worlds 2026.",
```

Why: top-usage Pokemon names (Sneasler 43.8%, Basculegion, Kingambit,
Garchomp, Mega Charizard-Y) are themselves long-tail queries. Adding
"Indianapolis Regionals" + "Worlds 2026" couples the page to live event
search.

### Change 4 — `src/app/tournaments/page.tsx`  `conflict_risk: true`

**Before** (line 6–8):
```ts
title: "VGC Tournament Results Archive | Team Reports 2026",
description:
  "Find team reports from top finishers at VGC Regionals, Internationals, and World Championships. Browse winning strategies and Pokémon usage from every major competitive event.",
```

**After**:
```ts
title: "VGC Tournament Results 2026 — Regionals, Internationals & Worlds San Francisco",
description:
  "VGC tournament results and team reports from 2026 Regionals, Internationals (Paul Chua EUIC winner), and Worlds 2026 in San Francisco (Aug 14–17). Top-finishing Pokemon Champions Reg M-A and Reg I teams with full breakdowns.",
```

Why: "Worlds 2026 San Francisco" is a date-specific spike. "EUIC winner
Paul Chua" is a fresh ranking opportunity — currently dominated by
bulbagarden thread.

### Change 5 — `src/app/page.tsx` (home, JSON-LD WebApplication)  `conflict_risk: true`

The current root layout already emits a `WebApplication` schema with a
`featureList`. Add three feature entries that match unmet queries.

**Before** (layout.tsx line 121–128):
```ts
featureList: [
  "PokePaste Import",
  "VGC Speed Tiers",
  "SP Spread Builder",
  "Matchup Plans",
  "Team Sharing",
  "Champions Format Support",
],
```

**After**:
```ts
featureList: [
  "PokePaste Alternative",
  "VGC Damage Calculator",
  "VGC Speed Tiers (Reg M-A & Reg I)",
  "Open Team Sheet (OTS) Generator",
  "SP Spread Builder",
  "Matchup Plans",
  "Rental Code Sharing",
  "Team Sharing",
  "Pokemon Champions Format Support",
  "Mega Evolution Detection",
],
```

Why: feature-list values feed Google's structured-data understanding of
what the app does. Free wins because the JSON-LD is already on every page
via root layout — no new render cost.

---

## 4. Three net-new pages worth creating

Each is a route that targets one of the top-10 gap phrases with full
metadata + JSON-LD + canonical. None of the target paths exist in
`src/app/` today (verified). None on the conflict list.

### Page A — `/speed-tiers`

- **Title**: "VGC Speed Tiers 2026 — Pokemon Champions Reg M-A & Reg I Benchmarks"
- **Description**: "Interactive VGC speed tier calculator for Pokemon Champions 2026. Compare Sneasler, Flutter Mane, Miraidon, Incineroar, and every Reg M-A/Reg I Pokemon at +0/+1/+2 stages with EV/IV/nature presets. Free, no login."
- **H1**: "VGC Speed Tiers — Reg M-A & Reg I (2026)"
- Implementation: pull the in-app speed tier engine onto its own SEO page;
  pre-render a sortable table for Googlebot, hydrate the interactive
  picker client-side. Targets keyword #2 from the gap list.

### Page B — `/guides/how-to-write-a-vgc-team-report`

- **Title**: "How to Write a VGC Team Report — 2026 Template & Examples"
- **Description**: "Step-by-step guide to writing a competitive Pokemon VGC team report: overview, EV spreads, damage calcs, speed tiers, matchup plans, and tournament context. Free template — used by Regional finishers."
- **H1**: "How to Write a VGC Team Report (2026 Guide)"
- Implementation: long-form (1500+ words), reuse our existing `HOW_TO_STEPS`
  HowTo JSON-LD from `page.tsx`. Targets keyword #7. Pure content,
  zero infra cost, big informational-intent funnel into the builder.

### Page C — `/regulations/reg-i`

- **Title**: "VGC Regulation I Teams 2026 — Calyrex Miraidon & Restricted Cores"
- **Description**: "Best Pokemon VGC Regulation I teams for 2026: Calyrex-Shadow + Miraidon, Calyrex-Ice + Urshifu, and Incineroar support cores. Top usage, sample team reports, and damage calcs from the live Reg I meta."
- **H1**: "VGC Regulation I — 2026 Teams & Meta"
- Implementation: companion to existing `/champions` Reg M-A page. Pull
  shared reports tagged `regulation: "Reg I"` (the tag already exists in
  the data model — see `tags?.regulation` checks in `page.tsx` line 281).
  Targets keyword #6, plus secondary "Calyrex Miraidon team" intent.

A reg-h sibling page (`/regulations/reg-h`) is the obvious 4th if we want
to capture the evergreen Smogon-thread traffic — same template, different
data filter.

---

## 5. Other findings worth noting (not in top 5)

- **`/compare` is `robots: { index: false }`** (line 10). Correct — empty
  comparison page has no SEO value. Leave as-is.
- **`/changelog`** ships with priority 0.3 in the sitemap; no `metadata`
  audit done here but it has JSON-LD per grep — fine for now.
- **Sitemap entry for `/compare` is duplicated** (lines 16 and 18 in
  `src/app/sitemap.ts`). Harmless but messy — pure dedup, no SEO impact.
  `conflict_risk: true` (file is on the changed list).
- **`metadataBase` is set** on the root, so relative OG image URLs work.
- **No `og:locale`, `og:locale:alternate`** — site is English-only, fine
  to skip until i18n ships (R-i18n research file already noted).
- **No `lastmod` on Mega champion entries in sitemap** (line 21–25, missing
  `lastModified`). Cheap fix — add `lastModified: now`.
- **JSON-LD `Organization.sameAs`** only lists GitHub. Add Discord invite,
  Twitter/X handle (if any) once those exist publicly — boosts entity
  reconciliation.
- **No `<link rel="alternate" type="application/rss+xml">`** — not a hot
  SEO lever for this site, skip.
- **AI crawler allow-list in robots.txt is good.** Already explicitly
  permitting GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot. R7 (AEO) will
  appreciate.
- **WebFetch hit 403 on the live sitemap, Pikalytics, Limitless, Victory
  Road, crob.at, pokemon-zone.** Suggests aggressive bot-challenge stack
  across the competitive Pokemon web — confirm our own site lets
  Googlebot UA through (a quick `curl -A "Googlebot" …` test would
  validate; out of scope for this draft).

---

## Conflict map vs `.swarm/main-changed-files.md`

| Recommendation | Files touched | conflict_risk |
|---|---|---|
| Change 1 (root metadata) | `src/app/layout.tsx` | **true** |
| Change 2 (explore) | `src/app/explore/page.tsx` | **true** |
| Change 3 (champions) | `src/app/champions/page.tsx` | **true** |
| Change 4 (tournaments) | `src/app/tournaments/page.tsx` | **true** |
| Change 5 (WebApplication featureList) | `src/app/layout.tsx` | **true** |
| Sitemap dedup + lastmod | `src/app/sitemap.ts` | **true** |
| New `/speed-tiers` | new file, no conflict | false |
| New `/guides/how-to-write-a-vgc-team-report` | new file, no conflict | false |
| New `/regulations/reg-i` | new file, no conflict | false |
| Add `JsonLd` Org `sameAs` Discord/X | `src/components/seo/JsonLd.tsx` | **true** |

Every metadata edit collides with at least one already-in-flight change.
Recommend landing the new-page work first (Pages A/B/C — zero conflict),
then rebasing metadata edits onto whatever ships from the conflict list.
