# Competitive Intelligence: VGCpastes, Limitless VGC, Trainer Hill

**Research Date:** May 28, 2026 (full refresh)
**Analyst:** Claude (Competitive Intelligence Agent)
**Subject:** Feature-level teardown of three secondary competitors in the VGC/TCG competitive Pokemon ecosystem
**Note:** Primary domains returned HTTP 403 to automated fetchers. Research sourced from WebSearch, X/@VGCPastes tweet archive, Limitless VGC URL structure analysis, Trainer Hill product pages, Victory Road/VR Pastes announcements, Smogon/VGCpedia/DevonCorp resource pages, Liquipedia, and community linktrees. Multiple independent confirmations obtained per data point.

---

## 1. VGCpastes / Falinks Teambuilder

### What It Is

VGCpastes is the VGC community's de facto team paste repository. It operates as a three-layer project:

- **Google Sheets repository** -- the primary data store, maintained by @CastorbrownVGC and a small volunteer core
- **Sandshrew Bot** -- Discord-native search and retrieval layer
- **Falinks Teambuilder** (`falinks-teambuilder.com/pastes/vgc/`) -- open-source Next.js web browsing layer

As of May 28, 2026: **135+ Replica Teams** for Pokemon Champions Regulation M-A (up from 47 at launch in late April), with the broader repository on VGenC tracking **2,769 tournament pastes** for Reg M-A sourced partly from VGCpastes data. The @VGCPastes X account (37K+ followers) rebranded to "VGC Pokepastes - Champions" for the new generation. Discord server has a dedicated `submit-reg-ma-teams` channel.

### Features

| Feature | Detail |
|---------|--------|
| **Google Sheets Repository** | Columns: Team ID, Player, Event, Placement, 6 Pokemon, Items, Pokepaste URL, EV status, Replica/Rental code, Date, Source link, Video/report links. One sheet per regulation. |
| **Sandshrew Bot (Discord)** | `/search` (filter by Pokemon, item, EV status), `/get rental` (replica code teams only), `/random team` (rerollable paginated results), `/openteam` (convert paste to Open Team Sheet format). Updated for Pokemon Champions Reg M-A. |
| **Falinks Teambuilder** | Real-time collaborative team building (Yjs + SyncedStore). Import/export Showdown paste or PokePaste URL. VGC Pastes browser with filtering. Usage stats aggregation. Tournament OTS parser for 2023+ events. Open source (GitHub: txfs19260817/falinks-teambuilder). |
| **Featured Teams tab** | Curated subset of high-result teams for quick pre-vetted options. |
| **Pokemon Champions adaptation** | Rapid transition to Replica Teams (the Champions equivalent of Rental Codes). Repository launched within days of Champions release with 47 teams, scaling to 135+ by mid-May. |

### Share UX and Community Features

- **Submission:** DM via Twitter/X or Discord. No self-service form or API. A human maintainer (@CastorbrownVGC) manually enters teams into the spreadsheet.
- **Discord community:** 8,371+ members. Active `submit-reg-ma-teams` channel. Sandshrew Bot provides under-30-second team retrieval without leaving Discord.
- **X/Twitter presence:** 37K+ followers. Each team post includes pokepaste link, team image, brief description, and credit to the creator. Posts note whether a team has tournament results or is a creative idea.
- **Sharing format:** Pokepaste URLs + optional Replica Team codes. No embeddable cards, no OG image generation, no native share-to-social feature.
- **Cross-platform coordination:** VGCpastes data is consumed by VGenC (vgenc.net), Falinks Teambuilder, and referenced by Victory Road, Smogon sample team threads, VGCpedia, and DevonCorp resources.

### Monetization

**None.** Fully volunteer community project. Zero advertising, premium tier, or Patreon. Falinks Teambuilder is open-source on personal infrastructure.

### What VGCpastes Does Better Than Us

1. **Raw paste volume per regulation.** 135+ Replica Teams for Reg M-A in weeks, 1,150+ for prior Reg H. Unmatched breadth of "find a team to play right now."
2. **Replica/Rental codes.** Instantly playable teams without building -- VGC Team Report does not surface replica codes.
3. **Discord-native distribution.** Sandshrew Bot meets players in their primary communication habitat. Zero friction: team discovery inside the same Discord window where strategy discussion happens.
4. **Canonical community placement.** Listed on Victory Road resources, VGCpedia, Smogon, DevonCorp, "New To VGC" linktrees. VGC Team Report appears on none of these.
5. **Regulation-partitioned history.** Separate repositories per regulation preserve historical access cleanly.
6. **Speed of adaptation.** VGCpastes had a Champions Replica repository live within days of the game launching, before most competitors.

### Weaknesses We Could Exploit

1. **UX is a spreadsheet.** 15+ columns on Google Sheets via tinyurl. On mobile: effectively unusable for browsing. No card-based UI, no visual team display, no responsive design. VGC Team Report's web-native presentation is categorically better.
2. **No team context or narrative.** Pastes show what a team is -- never why. No EV rationale, no matchup plans, no lead combinations explained, no damage benchmarks. Players get a team without knowledge. This is our core differentiation.
3. **No player profile pages.** Cannot browse "all teams by [player]" or see a creator's history. VGC Team Report can own the "player as author" identity.
4. **No self-service upload.** Submission requires DM to a human. VGC Team Report's self-service authoring is fundamentally more scalable.
5. **No meta analytics.** Zero usage stats, matchup data, or win rates. Pure paste storage.
6. **Passive volunteer maintenance.** Completeness depends on a tiny core team. Coverage is inconsistent for smaller events and early-regulation periods.
7. **Mobile users struggle.** A tweet from VGCpastes acknowledged "Some mobile users are having trouble opening the sheet" -- directing them to Discord as a workaround. This is a structural UX gap we already solve.

---

## 2. Limitless VGC (limitlessvgc.com) / Victory Road (victoryroad.pro)

### What They Are

**Limitless VGC** is the most comprehensive VGC tournament results database in the ecosystem. It covers all major VGC events globally from 2013-2014 through the current Pokemon Champions era, with automatic data ingestion from rk9.gg and playlatam.net. Organized across four subdomains:
- `limitlessvgc.com` -- primary database (tournaments, teams, player rankings, Pokemon usage)
- `standings.limitlessvgc.com` -- deep drill-down standings, pairings, per-player team sheets
- `play.limitlesstcg.com` -- online tournament management (VGC and TCG)
- `labs.limitlesstcg.com` -- experimental analytics (TCG-focused)

**Victory Road** is a VGC coverage and resources hub founded in 2015 (Spanish, expanded to English in 2018). It serves as both a content platform (team reports, articles, common sets) and a tournament organizer. In 2026 it launched:
- **VR Pastes** -- a team-sharing tool updated for Pokemon Champions with new stat system compatibility, actual stat value display, and Mega Evolution form swapping
- **The Champions Arena** -- their first major Pokemon Champions tournament ($12 entry, Swiss + top cut, streamed with commentary)
- **Monthly VR Challenges** -- regular grassroots online tournaments (May 2026 alone had 4+ challenges)

#### Limitless VGC Features

| Feature | Detail |
|---------|--------|
| **Tournament Database** | Filter by season, event type (Regional, International, Worlds, Special Events, National, Players Cup), region. Per-tournament pages: participants, placements, team lists, usage stats. Recent events: Melbourne Regional (291 players, May 23), Utrecht Regional (415 players, May 16), Lima Special Event (77 players, May 23). |
| **Team Browser** | Browse top-placing teams across all tracked events. Filter by year, season, tournament type. |
| **Player Rankings** | Aggregated cross-event performance. Full tournament history per player. Multiple ranking axes: points, top-8 finishes, tournament wins. Time filters from 2011 through 2025-2026. |
| **Pokemon Usage Statistics** | Per-Pokemon breakdowns: usage rates, Tera type distribution, item/ability/move usage. Restricted duo pairing win rates -- unique to Limitless. |
| **Standings Deep Drill-Down** | Per-round pairings, individual team sheets per player, per-Pokemon tournament summaries. Separate subdomain. |
| **Online Tournament Platform** | Swiss pairings, teamlist submission, standings, broadcasts. Hosts community VGC circuits. Creates automatic data pipeline. Recent: ZGG #1 Pokemon Champions VGC $200 Tournament, Grand Champions Festival. |

#### Victory Road Features

| Feature | Detail |
|---------|--------|
| **VR Pastes** | Create open and closed team lists simultaneously. Encrypted password protection for CTS and OTS. Responsive desktop and mobile. 8 in-game languages. Updated for Champions: new stat system, actual stat values, Mega form swapping. |
| **Team Reports** | Player-authored long-form team breakdowns. Written by tournament achievers, compiled by Victory Road editorial. Covers SV and now Champions. Includes 2025 Worlds champion team report. |
| **Replica Teams page** | Curated replica teams for Pokemon Champions with direct in-game codes. |
| **Common Sets** | Tournament-winning and sample sets for damage calculator benchmarking. |
| **Damage Calculator** | Full Pokemon damage calc at calc.victoryroad.pro. |
| **Online Tournaments** | Regular grassroots events. Champions Arena ($12 entry, streamed). Monthly VR Challenges (4+ in May 2026 alone). World Cup of Pokemon VGC (annual). |
| **Event Calendar** | Comprehensive 2026 season calendar for all official and major grassroots events. |

### Share UX and Community Features

**Limitless VGC:**
- No social or community layer. Pure read-only reference database. No comments, team saves, player follows, or sharing-with-context.
- Team data is surfaced via tournament context -- you browse a tournament, then drill down to a player's team. No "share this team" social flow.
- Player profiles exist but are tournament-performance-only. No self-expression or authored content.

**Victory Road:**
- VR Pastes includes shareable URLs with OG-style presentation. Password-protected sharing for tournament use.
- Team reports are shareable articles with full SEO-friendly URLs.
- Active X/Twitter presence with tournament results and team highlights.
- Discord community for tournament sign-ups and discussion.
- Tournament sign-ups via Battlefy (established platform).

### Monetization

**Limitless VGC:**
- Consumer VGC tools: Free (no paywall on any database feature)
- Ad removal: ~$1/month via Patreon (transitioning to native on-site subscriber model)
- Tournament organizer layer: Implied SaaS/commission from organizers using play.limitlesstcg.com
- Display advertising on free tier

**Victory Road:**
- Tournament entry fees: $12 for The Champions Arena ($10 to prizes, $2 to staff/production)
- No Patreon or premium tier identified for the content/tools side
- Likely display advertising (unconfirmed due to 403 blocks)
- YouTube channel with tournament streams and analytical content

### What They Do Better Than Us

1. **Tournament-sourced data authority (Limitless).** Automatic pipeline from rk9.gg/playlatam gives neutral, credible, comprehensive results with no editorial overhead. Irreplaceable.
2. **Restricted duo win rate analytics (Limitless).** Meta analysis showing which legendary/mega pairings overperform -- genuinely useful for teambuilding. Unique feature.
3. **Player profiles with full tournament history (Limitless).** Cross-event player identity browsable by anyone. No VGC tool matches this depth.
4. **Historical data depth (Limitless).** 2013-2026 coverage. Irreplaceable for researchers.
5. **VR Pastes password-protected sharing (Victory Road).** Purpose-built for tournament OTS/CTS workflow -- a specific use case VGC Team Report doesn't address.
6. **Integrated tournament ecosystem (Victory Road).** Running events, streaming them, publishing reports, providing tools -- a complete competitive loop. Creates organic traffic and community trust.
7. **Damage calculator (Victory Road).** calc.victoryroad.pro is a standalone tool we don't offer.
8. **Editorial team reports (Victory Road).** High-quality, player-authored long-form content including the 2025 Worlds champion report. Editorial curation ensures quality.

### Weaknesses We Could Exploit

**Limitless VGC:**
1. **No narrative content.** Shows compositions and results -- never explains team concept, matchup strategy, or EV rationale. Data without voice.
2. **Not self-service for players.** Individual players cannot submit their own teams or content. Data flows only from tournament providers.
3. **Fragmented UX across four subdomains.** New users struggle to navigate between limitlessvgc.com, standings.limitlessvgc.com, play.limitlesstcg.com, and labs.limitlesstcg.com.
4. **No community or social layer.** Read-only database. No comments, saves, follows, or sharing-with-context.
5. **TCG-first development priority.** VGC features develop slower than TCG. Labs is TCG-focused.
6. **Mobile browsing is poor.** Information-dense tables are desktop-optimized. Standings drill-downs suffer on mobile.

**Victory Road:**
1. **Editorial gatekeeping on team reports.** Submission requires DM to Victory Road + editorial approval. Not self-service. This is THE gap VGC Team Report fills -- anyone can publish a report without permission.
2. **No structured authoring tools.** Team reports are traditional blog articles. No guided template, no auto-generated damage calcs, no embedded interactive elements.
3. **Slow publication cadence.** Editorial model means fewer reports per regulation than self-service would produce. Weeks between new reports vs. potentially daily on VGC Team Report.
4. **No player profile aggregation.** A player's reports are scattered across blog archive pages. No unified "this player's body of work" view.
5. **Pokemon Champions content lag.** Team reports for Champions are still ramping up (new game, new mechanics). First-mover advantage is available.

---

## 3. Trainer Hill (trainerhill.com)

### What It Is

Trainer Hill is a **Pokemon Trading Card Game analytics platform** -- not a VGC tool. It is included because its analytics model, monetization structure, and mobile-first tournament-pace UX are directly instructive for VGC product design. It is the most relevant "how to monetize competitive Pokemon tools" case study in the ecosystem.

### Features

| Feature | Detail |
|---------|--------|
| **Meta Analysis (`/meta`)** | Deck tier lists, win rates by archetype, matchup spread charts (deck vs. deck), card usage trends from PTCGL and in-person data. Dynamic updates. |
| **Card Analysis (`/cards`)** | Usage stats, core rankings, staple counts, averages across winning decks. |
| **Battle Journal (free)** | Log match results: deck played, opponent archetype, game outcome, turn order, notes. Basic analytics view. Export reports. |
| **Battle Journal+ ($3/month)** | Faster mobile data entry (under 30 seconds per match). Per-matchup win rates by opponent archetype, custom tags, going-first/second. Cross-device sync: phone at tournament, desktop at home. Advanced filtering across full match history. |
| **Prize Checker** | TCG-specific prize card mapping simulator. |
| **Deck Diff / Venn Diagram** | Compare card overlap between two decklists. |
| **Podcast / YouTube** | Analytical content and TCG coaching. |
| **Patreon community** | Supporters vote on feature prioritization and which games get supported next. |

### Share UX and Community Features

- Patreon community with feature voting -- supporters influence the roadmap directly.
- YouTube channel for content distribution.
- Battle Journal data is private to the user -- no public sharing, no social layer.
- No team/deck sharing features. Analytics only.

### Monetization

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Basic Battle Journal, Meta Analysis, Card Analysis, Prize Checker |
| **Battle Journal+** | $3/month (7-day free trial) | Fast mobile entry, matchup win rates, cross-device sync, advanced filtering |
| **Patreon** | Community tier | Feature voting, roadmap influence |

### What Trainer Hill Does Better (as a Design Template)

1. **Proven $3/month monetization in competitive Pokemon.** Battle Journal+ validates that this audience pays for personal performance analytics. Willingness to pay is confirmed.
2. **Mobile-first tournament-pace UX.** Under-30-second match entry explicitly designed for between-rounds use. This is a design discipline: large touch targets, minimal taps, pre-populated opponent archetypes.
3. **Cross-device sync.** Phone logging at tournament -> desktop analysis at home. The correct competitive player workflow.
4. **Freemium conversion funnel.** Free tools build trust and traffic. Premium captures value from the most engaged users. Clean separation between free and paid.
5. **Community-driven roadmap via Patreon voting.** Simultaneously drives retention and product-market fit.

### Weaknesses We Could Exploit

1. **Not VGC at all.** Zero VGC content. TCG and TCG Pocket only. The entire VGC match-tracking market is unserved.
2. **No team building or sharing.** Analytics only. No content creation layer.
3. **No public/social dimension.** All data is private to the individual user. No profile pages, no community insights, no shared knowledge.
4. **TCG matchup structure is simpler.** ~15 deck archetypes vs. near-infinite VGC team variety. A VGC match tracker requires different design patterns for opponent categorization.
5. **Single-game dependency risk.** If TCG Live or TCG Pocket add native match tracking, Trainer Hill's core value proposition erodes. VGC Team Report's narrative layer is harder to replicate in-game.

---

## Comparative Analysis

| Dimension | VGCpastes | Limitless VGC | Victory Road | Trainer Hill | VGC Team Report |
|-----------|-----------|---------------|--------------|--------------|-----------------|
| **Primary use case** | Paste repository | Tournament database | Coverage + tools + events | TCG match analytics | Team report authoring + sharing |
| **Format** | VGC all regs | VGC all major events | VGC all gens | TCG only | VGC current format |
| **Team narrative / player voice** | None | None | Editorial (gated) | None | **Self-service (sole occupant)** |
| **Replica/Rental codes** | Yes (large) | No | Yes (curated) | N/A | No |
| **Self-service submission** | Via DM | Via tournament orgs | Via DM + editorial | Manual logging | **Yes (paste import)** |
| **Player profiles** | None | Yes (tournament) | None | Match log (private) | Opportunity |
| **Meta usage stats** | None | Yes + duo win rates | Common sets | Yes (TCG) | None |
| **Damage calculator** | None | None | Yes (standalone) | N/A | None |
| **Discord bot** | Yes (Sandshrew) | No | No | No | No |
| **Mobile UX** | Poor (spreadsheet) | Poor (dense tables) | Good (VR Pastes) | Good (tournament-first) | Moderate |
| **Monetization** | None | Ads + Patreon ($1/mo) | Tournament fees | $3/mo Battle Journal+ | None |
| **Community traction** | Very high | Very high | Very high | High (TCG) | Early stage |
| **Pokemon Champions ready** | Yes (135+ replicas) | Yes (May events live) | Yes (VR Pastes + Arena) | N/A | Yes |

---

## Top 5 Actionable Opportunities

### 1. Own the Self-Service Player Voice Layer (Uncontested)

Every competitor shows compositions without player reasoning. VGCpastes shows what. Limitless shows where (tournament context). Victory Road publishes editorial why -- but gates it behind editorial approval with slow cadence. Nobody offers self-service "write and publish your team report in 15 minutes." This is our sole differentiation and highest-leverage position.

**Action:** Make structured report creation easy enough to do at the tournament hotel after Day 1. Template-guided sections (team concept, individual sets, matchup plans, leads) that produce a polished, shareable report.

### 2. Automated Damage Calcs and Speed Tiers on Paste Import

Victory Road has a standalone damage calculator. Reportworm auto-generates calc tables. Neither embeds them into a team report authoring flow.

**Action:** On paste import, auto-generate: (a) speed tier positions, (b) damage taken from key meta threats, (c) damage benchmark highlights. Embed these as interactive tables inside the report. This reduces authoring effort, increases report quality floor, and creates a reason to author on our platform rather than posting a Twitter thread.

### 3. $3-5/Month VGC Match Tracker (Validated by Trainer Hill)

Trainer Hill proves competitive Pokemon players pay $3/month for personal match analytics. No VGC tool offers this. The entire VGC match-tracking market is unserved.

**Action:** Build a VGC match tracker: log opponent leads, your leads, outcome, notes in under 30 seconds. Win rates by opponent archetype, lead pair, game number. Cross-device sync. Link match logs to authored team reports. $3-5/month after 7-day trial.

### 4. Discord Bot for Organic Discovery

VGCpastes' Sandshrew Bot is their distribution moat inside Discord. We have zero Discord presence.

**Action:** Build a lightweight bot: `/report [player]` (embed preview), `/find [Pokemon]` (list reports), `/random` (current-reg report). Get adoption in 10-20 established VGC Discord servers. This puts VGC Team Report in front of the community's core population at the moment they're discussing teams.

### 5. Community Resource Page Backlinks (Non-Feature, Highest Leverage for Traffic)

VGCpastes is listed on Victory Road resources, VGCpedia, Smogon, DevonCorp, "New To VGC" linktrees. Limitless is on all major wikis and Liquipedia. VGC Team Report appears on none of these.

**Action:** Request listing on Victory Road's resources page (highest traffic single acquisition action), VGCpedia, DevonCorp, and Smogon resource threads. Each listing is free and permanent.

---

## Strategic Risk to Monitor

**Limitless adds team write-ups.** If Limitless VGC adds a "player notes" or "team write-up" field to their existing team viewer, they could rapidly own the narrative space given their data moat and traffic. This is the single highest strategic risk. Getting ahead by establishing VGC Team Report as the authored-report destination before Limitless moves is time-sensitive.

**Victory Road accelerates Champions report cadence.** Victory Road has editorial quality and community trust. If they streamline their editorial process or add self-service authoring for Champions, they become a direct competitor rather than an adjacent one.

**Pokemon Champions in-game tools.** Nintendo/TPCi is integrating analytics features into the game client. This threatens casual-tier tools but not authored-report platforms -- competitive hardcore players need richer external tools.

---

*Sources: X/@VGCPastes (37K+ followers), VGCpastes Google Sheets repository (public), limitlessvgc.com/standings.limitlessvgc.com URL structure, play.limitlesstcg.com tournament listings, plus.trainerhill.com product page, trainerhill.com/tools, victoryroad.pro announcements and resources page, VR Pastes X announcement (April 2026), Victory Road Champions Arena Liquipedia page, calc.victoryroad.pro, VGenC.net top teams (2,769 pastes tracked), Smogon VGC Reg M-A threads, VGCpedia resources, DevonCorp VGC resources, game8.co Pokemon Champions replica teams.*
