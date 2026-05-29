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
# R2 — Competitor Teardown: VGCPastes, Limitless VGC, Trainer Hill

Date: 2026-05-23
Researcher: Claude (R2)
Target product: VGC Team Report (pokemonvgcteamreport.com)

Methodology note: WebFetch returned 403 on all three competitor domains (likely Cloudflare/bot WAF). Findings are reconstructed from WebSearch result excerpts, the competitors' own X/Twitter posts, official docs (docs.limitlesstcg.com), and Victory Road's resource directory. Where a specific UX detail could not be confirmed from a primary source it is flagged as "inferred."

---

## 1. VGCPastes (vgcpastes.com / tinyurl.com/vgcpastes2026 / @VGCPastes on X)

### Core value prop & persona
- Crowd-curated **archive of successful tournament teams** in PokePaste format, organized by Regulation (G, H, I, J, M-A "Pokemon Champions").
- Persona: intermediate-to-advanced ladder/locals players who want to "net-deck" a proven team without building from scratch. Heavy bias toward team *collectors*, not analysts.
- Reach signal: tens of thousands of followers on X; cited by Victory Road, Falinks, Pikalytics as the canonical paste source.

### Sharing / team-import UX
- **Storage = Google Sheets.** "vgcpastes.com" is functionally a redirect surface; the actual product is a public Google Sheets workbook with one tab per Regulation. Each row links to a Poképaste URL.
- **No login.** Anyone with the link reads. Submission is via DM on Twitter/Discord to maintainers (Castorbrown et al.) — i.e. manual gate.
- **URL structure:** `docs.google.com/spreadsheets/d/<id>` plus tinyurl shorteners (`tinyurl.com/vgcpastes2025`, `…2026`). Individual team URLs are `pokepast.es/<id>` — owned by an unrelated service.
- **Mobile usability: poor.** Google Sheets on phone = pinch-zoom, horizontal scrolling, tiny tap targets, Pokémon sprite columns clipped. The "Sandshrew" Discord bot is the de-facto mobile interface (search by Pokémon/item, EV-spread filter).

### Tournament integration
- Each row is *manually* annotated with placement and event (e.g. "Top 8 OCIC", "Day 2 Indianapolis"). No API ingestion — maintainers transcribe from RK9/Limitless after each event.
- Lag: 1–7 days post-tournament. Replica Repository (47 teams for Pokémon Champions release) shows they also tag whether a team is *legally craftable in-game*.

### What VGCPastes does better than VGC Team Report
- **Breadth of canonical teams.** Hundreds of pastes per regulation vs. our user-submitted long-tail.
- **Brand recognition.** "VGCPastes link" is a verb in the community. SEO + social authority is massive.
- **Discord bot (Sandshrew).** Conversational search ("teams with Calyrex-Shadow + Urshifu-S, EV spreads required") that we don't have.
- **Zero-friction read.** No signup, no JS, opens instantly even on hotel wifi at a Regional.
- **Per-regulation curation.** Tabs are pre-split; users land on exactly today's format.

### What VGCPastes does worse (attack surface)
- **It's a spreadsheet.** No matchup notes, no damage calcs, no spread rationale, no replay links — just import strings. Reports are one level of analysis deeper than what they offer.
- **No structured Pokémon data.** Can't filter "show me all Iron Hands EV spreads >150 HP" without scraping.
- **No author profile / accountability.** Rows are submitted; no per-author page, no follow.
- **Mobile UX is genuinely bad.** Pinch-zoom Sheets on iPhone is a chore.
- **Submission bottleneck.** Two human curators gate everything → coverage of smaller events and ladder peaks is spotty.
- **No analytics surface.** Can't ask "what's the most common Tera type on Flutter Mane this week?"
- **Dependent on Google Sheets uptime/policy.** A TOS change kills them.

### Recent activity / maintenance signal
- Active. April 2026 tweets about Reg I (63 teams) and Pokémon Champions Replica Repo (47 teams). Account renamed to "VGC Pokepastes • Champions". Tinyurl bumped to `vgcpastes2026`. **Maintenance: healthy.**

---

## 2. Limitless VGC (limitlessvgc.com + play.limitlesstcg.com/vgc + standings.limitlessvgc.com)

### Core value prop & persona
- **Tournament infrastructure.** Limitless is the underlying platform that runs *most* online VGC events (ZGG, VGCA Battle Hall, Grand Champions Festival) and the largest IRL-results database (Regionals, Internationals, Worlds back to 2011).
- Persona: serious competitors who track meta movement, TOs running Swiss events, and analysts mining usage stats.

### Sharing / team-import UX
- **Poképaste-format submission** via tournament dashboard. Re-submittable until lists lock. Source: docs.limitlesstcg.com/player/decklists.
- **Login required to submit.** Limitless account (email+password). No login to *view* completed tournaments / standings / open lists.
- **URL structure (clean and shareable):**
  - Tournament: `play.limitlesstcg.com/tournament/<24-char-hex>/details|standings|registrations`
  - Player page: `limitlessvgc.com/players/<slug>`
  - Pokémon: `limitlessvgc.com/pokemon/<slug>/results`
  - Standings micro-site: `standings.limitlessvgc.com/`
- **Mobile usability: average.** Tables are responsive-ish but information-dense; data tables wrap awkwardly. No PWA install.

### Tournament integration
- **Best-in-class.** They *are* the tournament software for a huge slice of online VGC plus the canonical results archive for Play! Pokémon events. Filters by season (2011–2026), region (NA/EU/LATAM/OCE/ASIA), tier (Regional / International / Worlds / Special / Players Cup / Master Ball League), and format.
- "Open lists" feature auto-generates a per-tournament metagame overview that refreshes each round with archetype records and matchup data — uniquely powerful.

### What Limitless does better than VGC Team Report
- **Tournament-of-truth status.** Every paste links back to an authoritative result.
- **Live event metagame view.** Round-by-round archetype performance during Regionals — we have nothing comparable.
- **Player rankings + history.** Per-player tournament history, lifetime CP-style ranking.
- **API/data depth.** Tournament UUIDs, structured standings, per-player records — enables every downstream tool.
- **Decklist submission gate.** TOs trust them; they're already in every player's workflow.

### What Limitless does worse (attack surface)
- **Reports/strategy explanation = zero.** It's a database; there is no place to explain *why* the team worked, matchup plans, sideboard logic, EV justification. Players link a Limitless standing AND a separate report — we can be the report layer.
- **Author voice is absent.** A team is attributed to a player handle; there's no narrative, no replay embeds, no video.
- **Static styling, low warmth.** Functional but visually utilitarian; no design polish, no Pokémon art, no story.
- **Bot-WAF aggression.** Hard to embed/share programmatically (we saw it firsthand: 403 on every WebFetch).
- **Account creation friction.** Requires sign-up to do anything beyond browse.
- **No mobile-first workflow.** Submitting a decklist at a venue on phone is painful.

### Recent activity / maintenance signal
- Extremely active. Tournaments running through Reg M-A (Pokémon Champions) right now; ZGG #1 (Apr 11), #3 (Apr 25), Grand Champions Festival ($10K prize pool) all in 2026. **Maintenance: institutional.**

---

## 3. Trainer Hill (trainerhill.com + plus.trainerhill.com)

### Critical finding
**Trainer Hill is a Pokémon TCG/TCG Pocket analytics product, not a VGC product.** Tagline: "your competitive Pokémon TCG and Pokémon TCG Pocket analytics hub." Coverage explicitly TCG + Digimon TCG. No VGC video-game support visible in any 2026 search result, sitemap entry (`/meta`, `/decklist`, `/tools`, `/analysis/decklists`, `/tools/deck-diff-table`), or Battle Journal+ marketing.

It is **not a direct competitor** to VGC Team Report. It is a *parallel-genre* competitor — they own the same problem (deck-tracking, matchup analytics, journaling) for the card game audience. Treat as a design/feature reference, not a share-stealer.

### Core value prop & persona (TCG)
- Meta rankings, win rates, matchup spreads, card usage trends across online + IRL TCG events.
- Battle Journal+ ($ subscription, inferred): mobile match logging at events → desktop analytics review at home.
- Deck Diff Table: multi-decklist comparison (card counts, averages, staples, tech choices).
- Persona: serious TCG grinder preparing for Regionals.

### Sharing / team-import UX (TCG)
- Decklists ingested from public sources + manual entry. Tools section publishes tier lists and deck comparisons. URL shape: `trainerhill.com/decklist/<id>`, `…/meta`, `…/tools/<tool-name>`.
- Login likely required for Battle Journal+ (subdomain `plus.trainerhill.com` suggests gated SaaS).
- Mobile: explicitly markets a mobile-logging experience for in-venue use — strong design signal.

### Tournament integration (TCG)
- Pulls TCG event results (RK9 + Limitless-TCG-side). No VGC overlap.

### What Trainer Hill does better than VGC Team Report (lessons to steal)
- **In-venue mobile match journal** with desktop review-mode split. This is a killer pattern; no VGC tool ships it well today.
- **Deck Diff Table** — side-by-side comparison view for spotting tech choices and staples. Trivially portable to "Team Diff Table" for VGC pastes.
- **Tier list as a first-class artifact**, not a blog post — auto-updating from event data.
- **Paid tier exists** (Battle Journal+). Confirms there's willingness-to-pay for prep tooling in the Pokémon competitive space.
- **Clean separation of `/meta`, `/decklist`, `/tools`, `/analysis`** in the IA — better than a single feed.

### What Trainer Hill does worse
- **Wrong game.** Zero VGC support. Brand confusion risk if a VGC player lands there.
- **TCG-only audience.** Smaller TAM overlap with our user base.
- **No team-narrative product.** Same blind spot as Limitless — pure analytics, no author voice.

### Recent activity / maintenance signal
- Active across YouTube channel, Bluesky (`@trainerhill.com`), and product subdomains. Paid tier shipping. **Maintenance: healthy.**

---

## Cross-competitor synthesis

| Dimension | VGCPastes | Limitless VGC | Trainer Hill | VGC Team Report |
|---|---|---|---|---|
| Direct VGC competitor? | Yes (sharing) | Yes (results+sharing) | **No** (TCG) | — |
| Login to view | No | No | Partial | No |
| Login to submit | No (DM curator) | Yes | Yes | (verify in app) |
| Storage format | Google Sheet | Postgres-style DB | DB + analytics | DB |
| Per-team narrative | None | None | None (TCG) | **Yes — core moat** |
| Damage calc / spread notes | None | None | N/A | Yes |
| Tournament-result truth | Manual tag | Source of truth | TCG only | Reliant on others |
| Mobile UX | Bad | Average | Strong | (verify) |
| Author profile / follow | No | Player page | Limited | (verify) |
| Discord bot | Yes (Sandshrew) | No | No | (opportunity) |
| Tier-list product | No | Implicit via stats | Yes | No |
| Search/filter teams | Bot only | By Pokémon | By card | (verify) |

**Single biggest strategic gap in the market:** none of these tells the *story* of a team — why these six, why this spread, what the matchup plan is, what to lead vs Calyrex-Shadow. VGCPastes is a list, Limitless is a result, Trainer Hill is the wrong game. The "team report as a structured, shareable artifact with embedded calcs + author voice" is genuinely unoccupied for VGC.

---

## Three concrete <1-week opportunities to take share

### Opportunity A — "Import from VGCPastes link" + auto-attribution
Add a paste-URL importer that accepts `pokepast.es/<id>` (the format every VGCPastes row links to), parses the team, and creates a draft report pre-populated with: team name, Pokémon, sets, and a "Source: VGCPastes — <Event/Placement>" attribution badge. Pull the event/placement from the VGCPastes sheet via a scheduled scrape (Google Sheets has a public JSON endpoint — `gviz/tq?tqx=out:json`). Conversion play: every VGCPastes user landing on a paste suddenly has a one-click "Write the report" path on our domain. SEO bonus: we end up with `…/report/<slug>` pages that rank for "[Player] [Event] team report."
**Effort:** ~3–4 days. Endpoint + parser + scraper cron + UI button.

### Opportunity B — "Team Diff" view (steal from Trainer Hill)
Side-by-side comparison of 2–4 reports/pastes: Pokémon overlap, Tera type variance, item differences, EV delta heatmap. Useful for "what tech did Top 4 add over Top 32 at Seville?" Drop it at `/diff?a=…&b=…&c=…`. Shareable URL. Differentiates from VGCPastes (impossible in Sheets) and Limitless (no UI for this).
**Effort:** ~3 days. React diff component + URL state.

### Opportunity C — Discord bot ("Sandshrew killer") for VGC Team Report
A bot that responds in-channel to `!report <pokepaste-url>` with an embedded preview card (team sprites, regulation, top matchups if author wrote them, link to full report). Also: `!find Calyrex-Shadow + Urshifu-S regI` returns matching reports. Sandshrew already trained the audience on this UX; we ship it for *reports* not pastes. Distribution: the 30+ VGC Discords already running Sandshrew.
**Effort:** ~5 days. discord.js bot + indexer + 2 commands. Hosting fits on existing Vercel/Railway. Cost guardrail: cache + rate limit per guild.

Honorable mention (>1 week, queue for R-next): mobile-first "venue mode" — fast offline-capable paste viewer + match journal, mirroring Trainer Hill's Battle Journal+ pattern. Likely the biggest long-term moat once the import + diff + bot land.

---

## Sources

- https://limitlessvgc.com/ — Limitless VGC homepage
- https://limitlessvgc.com/tournaments — tournament filters, format/region
- https://limitlessvgc.com/players — player rankings
- https://standings.limitlessvgc.com/ — standings micro-site
- https://play.limitlesstcg.com/tournaments/?game=VGC — VGC tournaments list
- https://play.limitlesstcg.com/tournament/69c30ae236f5b5c303dbce1c/details — Grand Champions Festival
- https://docs.limitlesstcg.com/player/decklists — decklist submission docs
- https://x.com/VGCPastes — VGCPastes account, Apr 2026 activity
- https://x.com/VGCPastes/status/1910793869333324057 — Reg I 63 teams (Apr 2026)
- https://x.com/VGCPastes/status/2042106878751338822 — Pokémon Champions Replica Repo (47 teams)
- https://x.com/VGCPastes/status/1781808438978490731 — Sandshrew Bot update
- https://tinyurl.com/vgcpastes2026 — current repository link
- https://www.trainerhill.com/ — TCG analytics hub
- https://www.trainerhill.com/tools, /meta, /decklist, /analysis/decklists, /tools/deck-diff-table
- https://plus.trainerhill.com/ — Battle Journal+ (paid)
- https://pokemonvgcteamreport.com/ — our product, for comparison
