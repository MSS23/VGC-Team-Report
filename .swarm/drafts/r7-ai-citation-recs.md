# R7: AI Citation Recommendations — VGC Team Report
**Date:** 2026-05-25
**Status:** RECOMMENDATIONS — do not implement without user approval
**Priority order:** Highest ROI first

---

## Recommendation 1: Fix `applicationCategory` inconsistency (30 min)
**Impact: High | Effort: Trivial**

### Problem
`layout.tsx` line 120 still has `applicationCategory: "GameApplication"` on the WebApplication schema, while `OrganizationJsonLd` in JsonLd.tsx already uses `"SportsApplication"`. This sends conflicting category signals.

### Fix
Change `layout.tsx` line 120 from:
```
applicationCategory: "GameApplication",
```
to:
```
applicationCategory: "SportsApplication",
```

### Why it matters
AI engines use `applicationCategory` to classify tools for category queries. "GameApplication" maps to casual games/apps; "SportsApplication" maps to competitive sports tools — which is what VGC Team Report actually is.

---

## Recommendation 2: Expand Organization `sameAs` links (30 min)
**Impact: High | Effort: Trivial**

### Problem
The Organization schema only has a GitHub `sameAs` link. AI entity resolution requires multiple cross-platform anchors.

### Fix
In `/src/components/seo/JsonLd.tsx`, expand the `sameAs` array in `OrganizationJsonLd`:
```tsx
sameAs: [
  "https://github.com/MSS23/VGC-Team-Report",
  // Add when available:
  // "https://twitter.com/VGCTeamReport",
  // "https://discord.gg/[invite-code]",
],
```

### Why it matters
Each `sameAs` entry is an entity verification anchor. AI models build entity graphs from these links. More verified social endpoints = stronger entity identity = higher citation probability.

---

## Recommendation 3: Upgrade /s/[id] share pages from CreativeWork to Article (2-3 hours)
**Impact: High | Effort: Medium**

### Problem
Every public team report at /s/[id] currently uses `"@type": "CreativeWork"` — a generic parent type that provides minimal citation signal.

### Proposed change
Upgrade to:
```json
{
  "@type": "Article",
  "headline": "[Team Name or Tournament + Creator]",
  "author": { "@type": "Person", "name": "[creatorName]" },
  "datePublished": "[share creation date]",
  "dateModified": "[last edit date]",
  "keywords": "[species list], [regulation], VGC, team report",
  "genre": "VGC Team Report",
  "inLanguage": "en",
  "isPartOf": {
    "@type": "WebApplication",
    "name": "VGC Team Report",
    "url": "https://pokemonvgcteamreport.com"
  }
}
```

### Why it matters
`Article` schema turns every public report into a citable document that AI training pipelines can index as content (not just app state). With 1000+ public reports, this creates a large corpus of individually-citable structured documents.

---

## Recommendation 4: Get listed on Victory Road /resources (outreach DM)
**Impact: Critical | Effort: 30 minutes**

### Why
Victory Road is the most-linked, most-crawled VGC resource hub. It appears at #1 for every "VGC resources" query. A listing creates:
- A high-DA backlink
- A co-mention cluster with Pikalytics and Showdown (the exact tools AI cites)
- A new data point in AI training corpora associating VGC Team Report with "VGC tools" category

### Outreach
Contact Victory Road via Twitter DM or email. Draft message:

> Hi! I built VGC Team Report (pokemonvgcteamreport.com) — it's a free tool for building and sharing detailed VGC team reports with matchup plans, damage calcs, and speed tiers. It supports Champions Reg M-A and all current formats.
>
> Would you consider adding it to your VGC resources page? It complements the tools already listed — Pikalytics for stats, PokePaste for raw teams, and VGC Team Report for the full writeup and strategy.
>
> Happy to provide any info you need. Thanks!

---

## Recommendation 5: Get a VGCpedia dedicated page
**Impact: Critical | Effort: 20 minutes**

### Why
VGCpedia functions as the VGC encyclopedia — the exact type of authoritative source AI models use as ground truth. Pikalytics, Victory Road, Nimbasa City Post, TrainerTower, and NuggetBridge all have dedicated `/website/` pages. These pages appear for nearly every "VGC [tool name]" search.

### Outreach
Submit via VGCpedia's contribution form or Twitter. Include:
- Tool name: VGC Team Report
- URL: pokemonvgcteamreport.com
- Category: Team Building / Team Sharing
- Description: Free team report builder for VGC — import from Showdown/PokePaste, add strategy notes, matchup plans, damage calcs, share with a link

---

## Recommendation 6: Post a Smogon VGC Forum [Tool] thread
**Impact: High | Effort: 1 hour**

### Why
Smogon is the highest-authority competitive Pokemon forum. A `[Tool] VGC Team Report` thread in the Video Game Championships subforum creates:
- An indexed, high-DA page that AI models will associate with the tool
- Community discussion generating organic backlinks and mentions
- Disambiguation from the "Team Reports" forum genre (explicitly positioned as a tool, not a written report)

### Thread structure
Title: `[Tool] VGC Team Report — Build & Share Detailed Team Reports`
Body: Brief explanation, link, screenshot, feature list, link to Explore page

---

## Recommendation 7: Add Dataset + ItemList schema to /explore page (2 hours)
**Impact: Medium-High | Effort: Medium**

### Why
The Explore page is a unique structured dataset — a browseable collection of public VGC team reports with species, format, tournament, and creator metadata. Adding `Dataset` schema signals to AI engines that this is authoritative structured data worth citing.

### Proposed schema
```json
{
  "@type": "Dataset",
  "name": "VGC Team Reports Collection",
  "description": "Public competitive Pokemon VGC team reports with EV spreads, matchup notes, damage calculations, and tournament results",
  "url": "https://pokemonvgcteamreport.com/explore",
  "creator": {
    "@type": "Organization",
    "name": "VGC Team Report"
  },
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "isAccessibleForFree": true
}
```

---

## Recommendation 8: Publish /guides/how-to-write-a-vgc-team-report (4 hours)
**Impact: High | Effort: High**

### Why
The instructional query "how to write a VGC team report" has no authority page answering it anywhere on the internet. Smogon has forum posts, Victory Road has player reports, but nobody has a structured guide. This is an uncontested content gap.

### Page structure
- 800-1000 words
- HowTo schema (6 steps)
- FAQPage schema (3-5 questions)
- BreadcrumbList schema
- Comparison table (what to include vs. optional content)
- Internal links to Explore page examples

---

## Recommendation 9: Add BreadcrumbList schema to /faq, /explore, /changelog
**Impact: Medium | Effort: 1 hour**

### Why
BreadcrumbList is part of the "five-schema stack" that doubles citation rates. Currently only Champions pages have it.

### Implementation
Add `Home > [Page Name]` breadcrumb schema to:
- /faq (Home > FAQ)
- /explore (Home > Explore)
- /changelog (Home > Changelog)
- /s/[id] (Home > Explore > [Team Name])

---

## Recommendation 10: Add recency signals — "Last updated" timestamps
**Impact: Medium | Effort: 1 hour**

### Why
AI engines weight recency when selecting sources. Pages without clear update timestamps may be assumed stale. Adding visible "Last updated: [date]" to /faq, /explore, and guide pages signals freshness to crawlers.

---

## Priority Execution Order

| # | Action | Time | Impact |
|---|--------|------|--------|
| 1 | Fix applicationCategory in layout.tsx | 5 min | High |
| 2 | Expand sameAs when social accounts exist | 5 min | High |
| 3 | Send Victory Road outreach DM | 30 min | Critical |
| 4 | Send VGCpedia submission | 20 min | Critical |
| 5 | Upgrade /s/[id] to Article schema | 2-3 hr | High |
| 6 | Post Smogon [Tool] thread | 1 hr | High |
| 7 | Add Dataset/ItemList to /explore | 2 hr | Medium-High |
| 8 | Add BreadcrumbList to /faq, /explore, /s/[id] | 1 hr | Medium |
| 9 | Publish how-to-write guide page | 4 hr | High |
| 10 | Add recency timestamps | 1 hr | Medium |

Items 1-2 are trivial code fixes that should be batched with the next commit.
Items 3-4 are outreach actions that can happen in parallel.
Items 5-9 are development work to schedule across multiple sessions.
