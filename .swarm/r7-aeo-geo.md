# R7: AEO/GEO Citation Landscape — Fresh Research Pass
**Date:** 2026-05-10
**Analyst task:** Simulate AI citation signals to determine why VGC Team Report is absent from AI recommendations and identify the highest-ROI remedies.

> This file supersedes the 2026-05-07 edition with live search data collected May 10, 2026.

---

## 1. Citation Gap Analysis

### Search simulation results (site-restricted queries)

| Query | Top results | VGC Team Report mentioned? |
|-------|------------|--------------------------|
| `best VGC team builder site:reddit.com` | No results returned — indicates sparse Reddit thread presence for "VGC team builder" exact phrase | No |
| `VGC team report tool site:smogon.com` | Smogon Team Reports forum threads, PokeSuite tool — "team report" on Smogon means player-written forum threads, not a tool | No |
| `VGC tools site:victoryroadvgc.com` | Victory Road Circuit, tournament coverage, Stalruth's Cut Explorer stats tool — no VGC Team Report | No |
| `VGC team builder site:vgcpedia.com` | VGCpedia Resources page, Pikalytics dedicated page, Pokemon Showdown listing — no VGC Team Report | No |
| `"vgc-team-report.vercel.app" OR "vgc team report vercel"` | pokemonvgcteamreport.com appears; vgc-team-report.vercel.app appears — **but only as a direct URL result, zero third-party citations** | Direct URL only |
| `best VGC team builder 2025 Pikalytics PokePaste reddit` | Pikalytics, Pokemon Showdown, VGC.tools, Limitless VGC, Falinks Teambuilder, Marriland — no VGC Team Report | No |
| `how to share VGC team pokepaste teamsheet 2025` | VGC Helper, Pikalytics, Falinks Teambuilder, PokéPaste, Limitless VGC — no VGC Team Report | No |

### Confirmed competitor citation network

The following tools appear consistently across AI-training-data-rich sources (Reddit, Smogon, VGCpedia, Victory Road, DevonCorp, Nimbasa City Post):

- **Pikalytics** — cited on VGCpedia (dedicated page), Victory Road /resources, DevonCorp, blog.poketeambuilder.app, Smogon threads
- **Pokemon Showdown** — cited everywhere; listed on VGCpedia /resources as the default teambuilder
- **VGC.tools** — active community tool library; appears in "VGC pastes" searches
- **Limitless VGC** — tournament team archive; appears in "how to share VGC team" queries
- **Falinks Teambuilder** — cited by VGCpedia and VGC Pokepastes Twitter as a co-mention alongside Pikalytics
- **Victory Road** — self-reinforcing: it IS a resource hub so it gets cited in resource roundups

---

## 2. Competitor Citation Sources — Why They Get Cited

### What all highly-cited VGC tools have in common:

1. **VGCpedia directory listing with a dedicated page** — VGCpedia gives Pikalytics, Victory Road, Nimbasa City Post, TrainerTower, NuggetBridge each their own `/website/[tool-name]/` page. These pages are crawled and indexed as authoritative encyclopedia entries. VGC Team Report has NO VGCpedia entry.

2. **Victory Road /resources page inclusion** — victoryroad.pro/resources is the single most-linked VGC resource hub. It appears at the top of every resource-related VGC search. Getting listed there creates a high-DA backlink AND a co-mention with Pikalytics/Showdown that AI models treat as a trust cluster.

3. **Active Smogon forum thread presence** — Competitors appear in Smogon VGC Sample Teams threads and tool/resource threads. "PokeSuite" got a dedicated Smogon thread (`[Tool] PokeSuite: A Team Generator with Smogon Tiers & VGC Filters`). VGC Team Report has no Smogon thread.

4. **Twitter/X community co-mentions** — VGCpedia/VGC Pokepastes Twitter regularly tweets "check Victory Road, Falinks Teambuilder, and Pikalytics for stats." These co-mention clusters train AI on which tools belong in the same category.

5. **DevonCorp and Nimbasa City Post resource pages** — Both are actively maintained community resource lists that appear in "VGC resources" searches and are indexed as training data. VGC Team Report does not appear on either.

6. **The "Best Pokémon Team Builders 2025" article on blog.poketeambuilder.app** — This roundup article appears at position 2 for "best VGC team builder" queries. It lists Pikalytics, Showdown, etc. Not listing VGC Team Report means it's invisible to any AI trained on this article.

### Why the "team report" naming creates confusion

The Smogon forums have a "Team Reports" section where players post text reports. AI models trained on Smogon interpret "VGC team report" as a forum genre (player-written posts), not a tool category. This semantic overlap actively hurts discoverability for categorical queries.

---

## 3. Structural Reasons AI Does Not Cite VGC Team Report

### 3a. Zero presence on authority VGC directories
The five highest-authority VGC community resource pages (VGCpedia /resources, Victory Road /resources, Nimbasa City Post /vgc-resources, DevonCorp /resources, Smogon VGC resources) collectively do not mention VGC Team Report. AI models trained on these pages have no signal to associate the tool with the "VGC tools" category.

### 3b. No community-generated co-mentions
No Reddit threads in r/VGC or r/stunfisk were found recommending or discussing VGC Team Report. No Smogon forum posts link to it. AI engines weight independently-published co-mentions heavily — the tool currently has none.

### 3c. Incomplete schema markup
The site has partial structured data (WebApplication, BreadcrumbList on champion pages, FAQPage on champion pages) but is missing:
- `Organization` schema with `sameAs` social links (establishes entity identity for AI)
- `FAQPage` on homepage (direct AI answer-generation signal)
- `HowTo` schema for the team-building workflow
- `Article` schema on `/s/[id]` share pages (makes shared reports indexable as content, not app state)
- `SoftwareApplication` schema with `aggregateRating`

### 3d. Semantic naming collision
"VGC team report" is an established genre term on Smogon. AI models associate the phrase with Smogon forum content, not a web tool. The site needs content and schema that explicitly repositions it as a *tool* — e.g., `"applicationCategory": "Sports"` in SoftwareApplication schema, and FAQs that contrast "what a team report tool is" vs "a forum team report."

### 3e. No content for categorical queries
The site has no blog, guides, or landing pages that answer:
- "How do I share a VGC team?"
- "What is the best way to write a VGC team report?"
- "How do VGC players present their teams?"
These are the queries AI answers — and the site provides no citable content for them.

---

## 4. Top 3 Highest-ROI Actions

### Action 1: Get listed on Victory Road /resources (victoryroad.pro/resources)
**Why:** Victory Road is the most-linked, most-crawled VGC resource hub. It appears at #1 for every VGC resource query. A listing creates: (a) a high-DA backlink, (b) a co-mention cluster with Pikalytics and Showdown — the exact tools AI cites, (c) a new data point in AI training corpora that associates VGC Team Report with the "VGC tools" category. This is a one-email/DM action with potentially the largest citation impact of any single change.

**Effort:** Low (outreach DM). Existing draft is in `.swarm/drafts/r7-aeo-outreach-drafts.md`.

### Action 2: Get a VGCpedia dedicated page (vgcpedia.com/website/vgc-team-report/)
**Why:** VGCpedia functions as a VGC encyclopedia — the exact type of authoritative source AI models use as ground truth. Pikalytics, Victory Road, Nimbasa City Post, TrainerTower, and NuggetBridge all have dedicated `/website/` pages. VGCpedia pages appear for nearly every "VGC [tool name]" search. An encyclopedia-style listing is the highest-trust entity signal available in the VGC space for AI citation purposes.

**Effort:** Low (contact VGCpedia via Twitter or submission form). Existing outreach draft in `.swarm/drafts/r7-aeo-outreach-drafts.md`.

### Action 3: Add Organization + FAQPage schema to homepage
**Why:** Schema markup is the most direct technical signal to AI citation engines. `Organization` with `sameAs` links establishes entity identity (AI models resolve named entities to their schema graph). `FAQPage` on the homepage directly feeds AI answer generation — FAQ schema is documented to produce 3x+ citation rates for tools in their category. The questions should answer "What is VGC Team Report?", "How do I share a VGC team?", "How is VGC Team Report different from PokéPaste?" — exactly the queries where competitors currently get cited.

**Effort:** Medium (code change to layout.tsx and homepage). No outreach required.

---

## 5. Full Priority Stack (beyond top 3)

| Rank | Action | Impact | Effort |
|------|--------|--------|--------|
| 1 | Victory Road /resources listing | Very High | Low |
| 2 | VGCpedia dedicated page | Very High | Low |
| 3 | Organization + FAQPage schema on homepage | High | Medium |
| 4 | Post a [Tool] thread on Smogon VGC forum | High | Low |
| 5 | Get included in blog.poketeambuilder.app "best builders" roundup | High | Low |
| 6 | Add HowTo schema + publish /how-to-write-a-vgc-team-report guide | Medium | Medium |
| 7 | Add Article schema to /s/[id] share pages | Medium | Low (code) |
| 8 | DevonCorp and Nimbasa City Post resource page submissions | Medium | Low |
| 9 | Product Hunt listing (enables aggregateRating schema) | Medium | High |
| 10 | Encourage organic Reddit r/VGC posts by real users | Medium | Low (seed) |

---

## 6. Sources

- VGCpedia Resources: https://www.vgcpedia.com/resources/
- VGCpedia Pikalytics page: https://www.vgcpedia.com/website/pikalytics/
- Victory Road Resources: https://victoryroad.pro/resources/
- Nimbasa City Post Resources: https://www.nimbasacitypost.com/2019/12/vgc-resources.html
- DevonCorp Resources: https://devoncorp.press/short-form-content/up-to-date-vgc-resources
- VGC best team builders roundup: https://blog.poketeambuilder.app/best-team-builders-2025
- Smogon VGC forum: https://www.smogon.com/forums/forums/video-game-championships.513/
- Smogon PokeSuite thread: https://www.smogon.com/forums/threads/tool-pokesuite-a-team-generator-with-smogon-tiers-vgc-filters.3774427/
- Pikalytics: https://www.pikalytics.com/
- Limitless VGC: https://limitlessvgc.com/teams
- Falinks Teambuilder: https://www.falinks-teambuilder.com/pastes/vgc/
- VGC.tools: https://vgc.tools/
- VGC Pokepastes Twitter co-mention: https://x.com/VGCPastes/status/1627129672134987777
- Entity authority + structured data for AI citations: https://almcorp.com/blog/entity-authority-ai-citations-structured-data/
- Structured data 2026 guide: https://www.gwcontent.com/blogs/news/structured-data-for-seo
