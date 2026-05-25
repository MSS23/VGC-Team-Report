# Competitor Teardown: VGCpastes, Limitless VGC, Trainer Hill

**Research Date:** May 25, 2026
**Analyst:** Claude (Competitive Intelligence Agent)
**Subject:** Teardown of three competitors/adjacent tools in the VGC/TCG competitive Pokemon ecosystem
**Note:** All primary domains returned HTTP 403 to automated fetchers. Research sourced via WebSearch, X/Twitter posts, GitHub repos, Patreon pages, community references, and cross-validated across multiple independent sources.

---

## 1. VGCpastes (Falinks Teambuilder)

### Overview
VGCpastes is the VGC community's de facto team paste repository. Originally a community-maintained Google Sheets spreadsheet, it now lives primarily on **Falinks Teambuilder** (falinks-teambuilder.com/pastes/vgc/) via a daily automated sync. The @VGCPastes X account rebrands each regulation (currently "VGC Pokepastes - Champions").

### Core Features & UX Flow

| Feature | Description |
|---------|-------------|
| **Google Sheets Repository** | Master spreadsheet with columns for: Team ID, Player, Tournament, Placement, 6 Pokemon, Items, Pokepaste link, EV spread status, Rental/Replica code, Date, Source, Tera types |
| **Falinks Teambuilder Web Layer** | Filterable team browser, interactive team builder, import/export Showdown pastes, usage stats page |
| **Sandshrew Bot (Discord)** | Commands: `/search` (by Pokemon/item/EV status), `/get rental` (teams with rental codes), `/random team`, `/openteam` (convert to open team sheet). Paginated results with reroll button |
| **Replica Codes (Champions era)** | In-game replica teams for Pokemon Champions — 47+ replica codes available at launch |
| **Real-time Collaboration** | Falinks uses Yjs + SyncedStore for collaborative team building across devices |

### How Teams Are Shared/Discovered
- **Submission:** Community members DM via Twitter/X or Discord. Key maintainer (@CastorbrownVGC) handles spreadsheet updates. No self-service form.
- **Discovery paths:** (1) Browse spreadsheet via tinyurl link, (2) Falinks web UI with filters, (3) Sandshrew Bot in Discord, (4) @VGCPastes X posts highlighting new teams
- **Scale:** 2,649+ Reg M-A tournament pastes curated (via VGenC aggregation from VGCpastes + Limitless + Pikalytics); 63+ teams per new regulation at launch; 1,150+ teams for previous regulations

### Monetization Model
**None.** Entirely volunteer-driven community project. No ads, no Patreon, no premium tier. Falinks Teambuilder is open-source (GitHub: txfs19260817/falinks-teambuilder, WTFPL license).

### What They Do Better Than VGC Team Report
1. **Raw team volume** — Unmatched quantity of teams per regulation. "I need a team right now" is fully solved.
2. **Rental/Replica codes** — Immediately actionable for players who want to play without building.
3. **Discord-native UX** — Sandshrew Bot meets players in their primary communication channel without requiring a website visit.
4. **Community trust and referrals** — Listed on Victory Road, VGCpedia, DevonCorp, Smogon, "New To VGC" linktrees. Canonical "find a team" destination.
5. **Collaborative team building** — Real-time Yjs-powered collaboration on Falinks for squad building sessions.

### What VGC Team Report Does Better
1. **Team narrative and context** — VGCpastes shows what a team is; VGC Team Report explains why it was built, matchup plans, and strategy.
2. **Structured reports** — Damage calcs, speed tiers, matchup plans, EV rationale embedded in a readable format.
3. **Self-service authoring UX** — Paste import with guided report building in under a minute. No DM gatekeeping.
4. **Public discoverability** — SEO-friendly pages with metadata, Discord embeds, shareable URLs.
5. **Mobile-friendly web experience** — vs VGCpastes' spreadsheet which is barely functional on mobile.

### Key Differentiators
- VGCpastes = breadth (volume of raw pastes + rental codes)
- VGC Team Report = depth (authored analysis, matchup strategy, player reasoning)
- They are complementary, not directly competitive for the same user intent

---

## 2. Limitless VGC (limitlessvgc.com)

### Overview
Limitless VGC is the most comprehensive VGC tournament results database in the ecosystem. It is the VGC vertical of the broader Limitless platform (which started as Pokemon TCG tournament infrastructure ~2020). Coverage spans from 2013-2014 season through the current 2025-2026 Pokemon Champions era, tracking all major global events.

### Core Features & UX Flow

| Feature | URL | Description |
|---------|-----|-------------|
| **Tournament Database** | limitlessvgc.com/tournaments | All major events filterable by season, type (Regional/IC/Worlds/National/Special/Players Cup), and region |
| **Team Browser** | limitlessvgc.com/teams | Top-placing teams from all tracked tournaments; filter by time period, event type, format, region |
| **Player Rankings** | limitlessvgc.com/players | Aggregated performance, full tournament history, player profiles with team records |
| **Pokemon Usage Stats** | limitlessvgc.com/pokemon | Usage rates, Tera/item/ability/move breakdowns per Pokemon, restricted duo win rates |
| **Standings Deep-Dive** | standings.limitlessvgc.com | Round-by-round pairings, individual team sheets, per-Pokemon tournament analysis |
| **Online Tournament Platform** | play.limitlesstcg.com | Swiss tournament management, team sheet submission, open team lists, automatic metagame tracking |
| **Limitless Labs** | labs.limitlesstcg.com | Experimental data exploration, Championship Points rankings from rk9/playlatam |

### How Teams Are Shared/Discovered
- **Data pipeline:** Automatically sourced from tournament providers (rk9.gg, playlatam.net) and their own online tournament platform
- **Open Team Lists:** Tournament metagame overview auto-generated from submitted team sheets, updated each round with archetype records and matchup data
- **Restricted duo tracking:** Tracks team archetypes via restricted Pokemon combinations with usage % and win rates per matchup
- **No self-service for individual players** — data flows from tournament infrastructure, not user submissions

### Monetization Model
- **VGC tools:** Free, no paywall
- **Patreon ($X/month):** 162 paid members. Benefit: ad removal across all Limitless properties
- **Transitioning to native subscription:** Planning a direct on-site subscription for ad-free browsing; Patreon to be deprecated when live
- **Display advertising:** Standard ads across the free tier
- **Tournament organizer layer:** play.limitlesstcg.com provides infrastructure for community tournament organizers (implied SaaS/commission)
- **No paywalled data:** All tournament data, team lists, and analytics remain free

### What They Do Better Than VGC Team Report
1. **Data depth and breadth** — No other VGC tool matches the breadth of tournament-sourced data: player records, compositions, pairings, round-by-round results.
2. **Historical coverage** — Data back to 2013-2014. Irreplaceable historical archive.
3. **Restricted duo win rate analytics** — Unique meta tool: "Kyogre+Groudon: 28% usage, 54% win rate across 12 Regionals."
4. **Player-level profiles** — Full tournament history per player with all teams used.
5. **Automatic data pipeline** — Runs actual tournaments, capturing data without manual curation.
6. **Cross-format authority** — Same brand covers TCG and VGC, building community-wide trust.

### What VGC Team Report Does Better
1. **Player-authored narratives** — Limitless shows what placed well; VGC Team Report explains the player's reasoning and strategy.
2. **Self-service content creation** — Any player can create a report. Limitless requires tournament participation + data provider coverage.
3. **Structured analysis tools** — Damage calcs, speed tiers, matchup plans integrated into the report flow.
4. **Accessibility to casual players** — Limitless targets data-heavy analysis; VGC Team Report makes team strategy accessible and readable.
5. **SEO for individual teams** — Each report has a unique URL with metadata vs Limitless's database-style team entries.

### Key Differentiators
- Limitless = authoritative neutral data (results, stats, rankings)
- VGC Team Report = authored knowledge (explanations, plans, insights)
- **Strategic threat:** If Limitless adds "player notes" or "team write-up" fields to their team viewer, their data moat + traffic could quickly own that space. Monitor this closely.

---

## 3. Trainer Hill (trainerhill.com)

### Overview
Trainer Hill is a **Pokemon TCG and TCG Pocket analytics platform** — it does NOT cover VGC. Included in this analysis because: (1) its analytics model is directly relevant as a template for VGC product design, (2) its Battle Journal+ monetization proves willingness-to-pay in the competitive Pokemon audience, (3) its mobile-first tournament workflow is instructive for VGC tool design.

### Core Features & UX Flow

| Feature | URL | Description |
|---------|-----|-------------|
| **Meta Analysis** | trainerhill.com/meta | Tier lists, win rates by deck archetype, matchup spread charts, card usage trends |
| **Decklist Search** | trainerhill.com/decklist | Search tournament decklists with filters, win rates, and tournament results |
| **Decklist Analysis** | trainerhill.com/analysis/decklists | Deep analytics on deck composition trends |
| **Battle Journal (Free)** | trainerhill.com/tools | Log match results: deck, opponent archetype, outcome, turn order, notes |
| **Battle Journal+** | plus.trainerhill.com | Premium match tracking — faster entry, better filtering, detailed analytics, cross-device sync |
| **Podcast/YouTube** | youtube.com/TrainerHill | Analytical content, TCG coaching, meta discussion |

### How Teams Are Shared/Discovered
- **Decklist database:** Tournament decklists with filters by archetype, cards, win rate
- **Meta tier lists:** Curated rankings of competitive deck archetypes
- **Community-driven:** Users log matches via Battle Journal which feeds aggregated matchup data
- **Not a sharing platform** — analytics and logging tool, not a content publishing platform

### Monetization Model
- **Battle Journal+ at $3/month** (7-day free trial, cancel anytime):
  - Log complete matches in under 30 seconds between rounds
  - Detailed matchup breakdowns by opponent archetype, deck, custom tags
  - Going first vs. second win rate statistics
  - Cross-device sync: phone at tournament, desktop at home
  - Feature prioritization via Patreon community voting
- **Patreon community** ($3/month): Same price point, same features, supporters vote on roadmap
- **Free tier:** Basic Battle Journal + meta content drives traffic and trust

### What They Do Better Than VGC Team Report
1. **Proven monetization model** — $3/month Battle Journal+ validates that competitive Pokemon players will pay for personalized analytics.
2. **Mobile-first tournament workflow** — Under 30 seconds per match entry, explicitly designed for between-rounds logging at tournaments.
3. **Cross-device sync pattern** — Phone at tournament, full analytics dashboard on desktop. Correct UX model for competitive players.
4. **Data-driven meta analysis** — Win rates, matchup spreads, and trend tracking from real tournament data.
5. **Freemium conversion funnel** — Free tools build trust; premium captures value from engaged users.

### What VGC Team Report Does Better
1. **VGC coverage** — Trainer Hill has zero VGC content. The entire VGC audience is unserved by their model.
2. **Team-level analysis** — Trainer Hill does deck/match analytics; VGC Team Report does holistic team strategy with narrative.
3. **Content publishing** — Trainer Hill is a personal analytics tool; VGC Team Report is a community content platform.
4. **Shareable output** — VGC Team Report creates public, embeddable, discoverable content. Battle Journal+ is private.

### Key Differentiators
- Trainer Hill = personal match analytics tool for TCG players
- VGC Team Report = public team knowledge platform for VGC players
- **Blueprint value:** Battle Journal+ at $3/month is a directly portable monetization model to VGC if VGC Team Report builds match tracking + win rate analytics as a premium feature

---

## Competitive Landscape Matrix

| Dimension | VGCpastes | Limitless VGC | Trainer Hill | VGC Team Report |
|-----------|-----------|---------------|--------------|-----------------|
| **Primary use case** | Paste repository | Tournament database | TCG match analytics | Team report authoring |
| **Format** | VGC (all regs) | VGC (all major events) | TCG only | VGC (current) |
| **Team narrative** | None | None | N/A | Core feature |
| **Player profiles** | None | Tournament-based | Match log (self) | Opportunity |
| **Mobile UX** | Poor (spreadsheet) | Moderate | Excellent | Good |
| **Self-service** | Via DMs | Via tournament orgs | Manual logging | Yes (paste import) |
| **Monetization** | None | Ads + Patreon ad-removal | $3/mo premium | None (opportunity) |
| **Community traction** | Very high | Very high | High (TCG) | Growing |
| **Discord presence** | Sandshrew Bot | Tournament hosting | None | None |
| **Usage stats** | None native | Yes (aggregate) | Yes (TCG) | None |
| **Damage calcs** | None | None | None | Player-authored |

---

## Strategic Opportunities for VGC Team Report

### 1. Own the "Player Voice" Layer (Highest Leverage)
Every competitor shows team compositions without player intent. VGCpastes shows what; Limitless shows where (tournament context); Trainer Hill shows personal stats. Nobody shows why. VGC Team Report is uniquely positioned as the platform for player reasoning, strategy explanation, and knowledge transfer.

### 2. Automated Analysis on Paste Import
Auto-generate speed tiers, key defensive/offensive benchmarks, and format threat calcs when a team is imported. Reduces authoring friction, increases report quality, differentiates from raw pastes.

### 3. $3-5/Month Match Tracker (Validated Model)
Trainer Hill proves the price point works in competitive Pokemon. Build VGC-specific match logging: opponent leads, team selection, outcome, notes. Link to authored team reports. Mobile-first, under 30 seconds per entry.

### 4. Discord Bot for Organic Discovery
`/report [player]`, `/find [Pokemon]`, `/random` — meet players where they live. Sandshrew Bot proves Discord bots drive engagement in VGC Discord servers.

### 5. Community Resource Page Backlinks
VGCpastes and Limitless are listed on Victory Road, VGCpedia, DevonCorp, Smogon, and all major "VGC resources" pages. VGC Team Report has zero community backlinks identified. This is the highest-ROI growth lever available with zero engineering cost.

---

## Threat Assessment Summary

| Competitor | Direct Threat | Strategic Risk |
|------------|--------------|----------------|
| **VGCpastes** | Low — different use case (volume vs depth) | Medium — owns community mindshare and referral placement |
| **Limitless VGC** | Low for reporting, High for data | High — if they add "team write-up" fields, their data moat could subsume the reporting niche |
| **Trainer Hill** | None — TCG only | High as inspiration — validated monetization model directly portable to VGC |

---

## Key Takeaway

VGC Team Report occupies a unique and defensible position: the only self-service platform for authored team strategy content in VGC. Competitors excel at data (Limitless), volume (VGCpastes), and analytics tooling (Trainer Hill in TCG). None provide the "why" behind team decisions. The biggest risks are: (1) Limitless adding narrative features to their existing data moat, and (2) VGC Team Report failing to earn community backlink placement that competitors already dominate. The biggest revenue opportunity is a $3-5/month match tracker following Trainer Hill's proven model.
