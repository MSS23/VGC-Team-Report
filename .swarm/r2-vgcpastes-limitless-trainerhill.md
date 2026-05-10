# Competitive Intelligence: VGCpastes, Limitless VGC, and Trainer Hill

**Research Date:** May 10, 2026 (full refresh)
**Analyst:** Claude (Competitive Intelligence Agent)
**Subject:** Tear-down analysis of three key adjacent tools in the VGC/TCG competitive Pokémon ecosystem
**Note:** Primary domains (falinks-teambuilder.com, limitlesstcg.com, limitlessvgc.com, trainerhill.com, plus.trainerhill.com, pokepast.es, victoryroad.pro, pokemonvgcteamreport.com) all returned HTTP 403 to automated fetchers. Research sourced from WebSearch, X/@VGCPastes tweet archive, GitHub (falinks-teambuilder repo), Limitless Patreon posts, Smogon/VictoryRoad references, Bulbapedia, Reportworm documentation, and validated across multiple independent sources.

---

## 1. VGCpastes / Falinks Teambuilder

### What VGCpastes Is
VGCpastes is the VGC community's de facto team paste repository. It originated as a community-maintained Google Sheets spreadsheet collecting competitive team pastes from tournaments, social media, and Discord submissions. As of May 2026:
- **1,150+ Regulation H teams** in the repository
- **63+ Regulation I teams** collected at regulation start
- **Regulation J and Pokémon Champions Regulation M-A** collections actively growing
- The @VGCPastes Twitter/X account (37,000+ followers) rebrands with each regulation

The repository migrated its primary "website" layer to **Falinks Teambuilder** (falinks-teambuilder.com/pastes/vgc/), an open-source collaborative team builder built in Next.js + TypeScript. A daily automated sync job keeps VGCpastes data live on Falinks. The two projects are distinct but deeply integrated.

### How VGCpastes Works
- **Core artifact:** Google Sheets spreadsheet with columns for: Team ID, Player name, Tournament event, Placement/rank, Six Pokémon names, Items, Pokepaste link, EV spread status, Rental code availability, Date, Source link, Videos/reports, Tera types
- **Submission process:** Community members DM the team via Twitter/X or Discord. A key maintainer (@CastorbrownVGC) handles spreadsheet updates. No self-service submission form exists.
- **Sandshrew Bot:** A Discord bot embedded in their server. Commands include `/search` (filter by Pokémon, item, EV status), `/get rental` (filter teams with rental codes), `/random team` (get a random paste), `/openteam` (convert paste to open-team-sheet format for tournaments). The bot uses paginated in-message scrolling with a "reroll" button. The bot was updated in 2026 for Regulation M-A / Pokémon Champions.
- **Featured Teams sheet tab:** A curated subset of high-result teams for players who want pre-vetted options over the raw repository.
- **Discord server:** 8,371+ members (growing).

### Falinks Teambuilder Features (the web layer)
- **Real-time collaborative team building** (via Yjs + SyncedStore)
- **Import from Showdown paste or PokePaste link**
- **Export to Showdown importable or new PokePaste link**
- **VGC Pastes browser** (falinks-teambuilder.com/pastes/vgc/) — filterable by regulation, Pokémon, item
- **Usage stats aggregation** (falinks-teambuilder.com/usages/vgc/) — pulls from VGCPastes dataset
- **Tournament page:** Parsed Masters Open Team Lists from 2023+ live events, searchable by composition
- **Companion userscript** (falinks-teambuilder-helper) for enhanced Showdown + PokePaste integration
- **Open source** (GitHub: txfs19260817/falinks-teambuilder, WTFPL license, 388 commits, 21 releases)

### VGCpastes Strengths
- **Volume:** 1,150+ Reg H teams. Unmatched raw paste quantity per regulation.
- **Rental codes:** A significant subset includes in-game rental codes — immediately actionable for players who don't want to build.
- **Discord-native UX:** Sandshrew Bot meets players where the community lives — no website visit required.
- **Community trust:** Referenced on Victory Road resources, Smogon sample team threads, VGCpedia, DevonCorp, "New To VGC" linktrees. It is the canonical "find a team" resource.
- **Cross-org collaboration:** Partners with Falinks Teambuilder for web layer; coordinates with Victory Road (VGCPastes handles breadth, VR curates quality).
- **Regulation consistency:** Maintains distinct repositories per regulation, preserving historical access.

### VGCpastes Weaknesses
- **UX is fundamentally a spreadsheet:** No web-native filtering, card UI, or visual team display. The experience degrades severely on mobile. Column navigation on a Google Sheet with 15+ columns is unusable on phones.
- **No team context:** Pastes list what the team is — not why it was built, what matchups it targets, or what EV spreads are designed to benchmark. Players get the team without the knowledge.
- **No player profile pages:** There is no "creator page" — you cannot navigate by player to see their body of work or history.
- **No self-service upload:** Submission requires reaching out via DM. No API, no automated pull from tournament results, no form.
- **No meta analytics:** No usage stats, no matchup data, no win rates. Pure paste storage.
- **Discord dependency:** The best UX (Sandshrew Bot) requires being in their Discord server. Discovery outside Discord is limited.
- **Passive maintenance:** Repository completeness depends on volunteer labor from a small core team. Coverage is inconsistent for smaller events.

### Mobile Experience
Poor. The core artifact is a Google Sheets spreadsheet accessed via a tinyurl link — on mobile, navigating 15+ columns is barely functional. The Sandshrew Bot experience is better since Discord's mobile app is well-designed, but it requires being in their Discord server. Falinks Teambuilder on mobile has not been independently verified but is built in Next.js so should be more mobile-friendly than the spreadsheet.

### Monetization
None. VGCpastes is a volunteer community project with no advertising, premium tier, or Patreon. Falinks Teambuilder is open-source and appears to run on community/personal infrastructure.

### Threat Level to VGC Team Report
**Medium.** VGCpastes does not do team reports — it does paste storage. It owns the "where do I find a team to play right now?" use case. VGC Team Report's authoring and narrative layer is entirely differentiated. However, VGCpastes owns community mindshare and referral placement that VGC Team Report has not yet earned.

---

## 2. Limitless VGC (limitlessvgc.com)

### What It Is
Limitless VGC is the most comprehensive tournament results database in the VGC ecosystem. It is the VGC vertical of the broader Limitless platform, which originated as a Pokémon TCG tournament management and results platform founded around 2020. Limitless VGC covers all major VGC events globally — Regionals, Internationals, Worlds — with player data, team compositions, standings, pairing histories, and usage statistics. Coverage extends from the 2013-2014 season through the current 2025-2026 Pokémon Champions era.

### Core Features

#### Tournament Database (limitlessvgc.com/tournaments)
- Filter by: season, tournament type (Regional, International, Worlds, Special Events, National, Players Cup, Master Ball League), and region
- Per-tournament pages: participants, placements, team lists, usage statistics
- Round-by-round pairings and team sheets for events using rk9.gg or playlatam.net as the data source

#### Team Browser (limitlessvgc.com/teams)
- Browse teams across all tracked tournaments
- Filter by year, season, tournament type
- Individual team pages show the team composition in context of the player's placement and tournament

#### Player Rankings (limitlessvgc.com/players)
- Aggregated player performance across tracked events
- Player profile pages with full tournament history and team records
- Championship-point-adjacent ranking

#### Pokémon Usage Statistics (limitlessvgc.com/pokemon)
- Usage rates across the tracked tournament pool
- Per-Pokémon breakdowns including Tera type usage, item usage, ability usage, and move usage
- Restricted Pokémon duo usage and win rates — a unique meta tool for teambuilding decisions

#### Limitless VGC Standings (standings.limitlessvgc.com)
- Deep drill-down: per-round pairings, individual team sheets per player, per-Pokémon tournament summaries
- Per-Pokémon tournament pages (e.g., "Kyogre at Stuttgart Regionals 2025")
- Separate subdomain from the main database — adds friction but provides deep analytical value

#### Limitless Labs (labs.limitlesstcg.com)
- Experimental data exploration. Currently more TCG-facing; VGC usage data and duo win rates accessible here for deeper analysis.

#### Online Tournament Platform (play.limitlesstcg.com)
- Full tournament management software: Swiss pairings, bracket generation, teamsheet submission, standings, pairings broadcasts
- Hosts VGC community circuits including Smogon circuits, VGCPastes Random Team Tours
- Creates a natural data pipeline: Limitless runs events, automatically capturing all data

### Limitless TCG Monetization Model (parent platform)
- **Consumer-facing VGC tools:** Free, no paywall
- **TCG consumer:** Patreon-based ad removal ($X/month) — but actively transitioning to a native on-site subscriber system that removes ads without Patreon intermediary (Patreon to be deprecated when this launches)
- **Deck builder (launched early 2024):** Free tool — biggest TCG feature launch since the tournament platform in 2020
- **Tournament organizer layer (play.limitlesstcg.com):** Implied SaaS model or commission; organizers use Limitless infrastructure to run official and community events
- **City League database, Card database (Base Set onward), TCG Pocket database:** All free, supported by Patreon + display advertising

### Strengths
- **Data depth:** No other VGC tool matches the breadth and depth of tournament-sourced data. Player records, team compositions, pairings, and round-by-round results all searchable.
- **Historical coverage:** Data back to 2013-2014. Irreplaceable for historical researchers.
- **Duo win rate analytics:** Restricted Pokémon pairing win rates (e.g., "Kyogre+Groudon: 28% usage, 54% win rate across 12 Regionals") are unique and used by serious teambuilders.
- **Trusted infrastructure:** Limitless runs actual tournaments — natural, automatic data pipeline without manual curation.
- **Player-level profiles:** Full tournament history per player — no competitor offers this in VGC.
- **Cross-format authority:** Same brand covers TCG and VGC, creating community-wide trust.
- **Ecosystem referrals:** Listed on Victory Road resources, Smogon tournament circuits, all major community wikis.

### Mobile Experience
Moderate. Tournament submission flows (registration, team submission on play.limitlesstcg.com) work adequately on mobile. The database-browsing experience on limitlessvgc.com is functional but not mobile-optimized. Standings drill-downs are information-dense and better suited for desktop.

### Weaknesses
- **No narrative content:** Like VGCpastes, Limitless shows what a team is — not why. No player-written explanations, matchup plans, or EV rationale.
- **Not self-service for players:** Players cannot submit teams directly; data flows in through tournament providers (rk9.gg, playlatam.net). Community events via play.limitlesstcg.com are the exception.
- **Fragmented UX across four subdomains:** limitlessvgc.com, standings.limitlessvgc.com, play.limitlesstcg.com, labs.limitlesstcg.com — new users struggle to navigate.
- **Data gaps:** Not all tournaments have full standings/pairing data — depends on whether rk9 or playlatam was used. Some events are results-only with no team sheets.
- **TCG-first heritage:** Labs and some features skew TCG. VGC-specific feature development feels secondary.
- **Pokémon Champions coverage lag:** The 2026 transition to Pokémon Champions may introduce lag for grassroots/online tournament data, where tools like VGenC.net are updating faster.

### Threat Level to VGC Team Report
**High for tournament data, Low for team reporting.** Limitless is the authoritative tournament results database and will not be displaced there. It does not provide authored team reports, matchup write-ups, or player-curated content.

**Key competitive risk:** If Limitless VGC adds a "player notes" or "team write-up" field to their existing team viewer, they could quickly own that space given their existing data moat and traffic. This is the primary strategic threat to monitor.

---

## 3. Trainer Hill (trainerhill.com)

### What It Is
Trainer Hill is a **Pokémon Trading Card Game analytics platform** — not a VGC tool. It is a competitive intelligence hub for the TCG side of competitive Pokémon. It is included in this analysis because:
1. Its analytics model is directly relevant as a template for VGC analytics product design
2. Its Battle Journal+ monetization is a proven model for the competitive Pokémon audience
3. Its mobile-first tournament workflow design is best-in-class and instructive for VGC design

### Core Feature Set

#### Meta Analysis (trainerhill.com/meta)
- Meta tier lists for Standard and other TCG formats
- Win rates by deck archetype
- Matchup spread charts (deck vs. deck)
- Card usage trends from PTCGL (online) and in-person tournament data
- Dynamic updates as new tournament data is captured

#### Tools (trainerhill.com/tools)
- **Battle Journal (free):** Log match results. Track: deck played, opponent archetype, game outcome, turn order (going first/second), notes. Basic analytics.
- **Prize Checker:** TCG-specific utility
- **Tier Lists:** Manually curated deck rankings
- **Deck Comparisons:** Head-to-head deck analysis

#### Podcast and Content Layer
- YouTube channel with analytical content and TCG coaching
- Patreon community where supporters vote on feature prioritization

### Monetization: Battle Journal+ ($3/month)
This is the most sophisticated and most directly instructive monetization model found in this competitive sweep.

- **Free tier:** Basic match logging (deck, opponent, result, notes)
- **Battle Journal+ at $3/month** (7-day free trial, cancel anytime):
  - Faster mobile data entry optimized for between-rounds tournament logging (under 30 seconds per match)
  - Better filtering and analytics on match history
  - Per-matchup win rates broken down by opponent archetype
  - Deck performance breakdowns by archetype, custom tags, and meta calls
  - Cross-device sync: log on phone at a tournament, analyze on desktop at home
  - Mobile-first UX — explicitly designed for tournament pace
- **Patreon community:** Supporters vote on which games/features get added next (TCG Pocket, etc.)

### Strengths (as design template for VGC)
- **Match tracking is validated as a willingness-to-pay category:** Battle Journal+ proves competitive Pokémon players pay $3/month for personalized match analytics
- **Mobile-first tournament workflow:** Logging between rounds is a genuine user need that is entirely unaddressed in VGC tools
- **Cross-device sync:** The phone-at-tournament, desktop-for-analysis pattern is the correct UX model for competitive players
- **Freemium conversion funnel:** Free tools drive traffic and trust; the premium tier captures value from the most engaged and likely-to-pay segment
- **Under-30-second data entry:** Demonstrates that UX optimization for tournament conditions (time-pressured, between rounds) is a design discipline of its own

### Weaknesses (as a direct VGC competitor)
- **Not VGC at all:** Zero VGC content as of May 2026. Operates exclusively in TCG and TCG Pocket.
- **No team building or sharing:** Analytics only; no content creation or team report features.
- **TCG mechanics differ:** TCG matchup stats (deck vs deck, ~15 archetypes per meta) are structurally simpler than VGC matchup stats (6-Pokémon team vs a near-infinite opponent team variety). Direct feature porting requires significant design rework.

### Mobile Experience
Good. Battle Journal+ was designed mobile-first for tournament-pace data entry. Under 30 seconds per match entry, cross-device sync, explicit design for phone logging between rounds. Best mobile UX in this competitive set.

### Threat Level to VGC Team Report
**Low directly, High as inspiration.** Trainer Hill does not compete in VGC. However, its Battle Journal+ model is a direct blueprint for a VGC match tracker premium feature. If VGC Team Report builds match tracking + win rate analytics as a paid feature at $3-5/month, it follows an already-validated monetization path in the adjacent competitive Pokémon audience.

---

## 4. Adjacent Tools: The Broader Competitive Landscape

### Reportworm (reportworm.com)
A newer VGC-specific team and replay analysis tool worth monitoring:
- **Offensive/defensive capability calculations:** Auto-calculates how common attackers damage your team (max investment assumed)
- **Speed tiers:** Shows where each team member falls in the overall speed order for format-relevant Pokémon
- **Replay tracking:** Tracks your W/L record by set and individual game; filter by opponent ELO or Pokémon
- **Encrypted data storage:** All match data stored in encrypted, non-public object storage
- **Format support:** Pokémon Champions and recent SV VGC formats only
- **Tournament data:** Can pull any tournament, any player, team/record data from recent seasons
- **Standings subdomain** (standings.reportworm.com) for tournament viewing

This is the closest existing VGC tool to what VGC Team Report's analysis layer could become. It focuses on the "before the tournament" (team validation) and "after the game" (replay analysis) use cases but does not do authored reports or public sharing.

### LabMaus (labmaus.net)
Positioned as "#1 VGC tournament analysis resource" — usage trends, top teams, meta analysis. Appeared in the same breath as Pikalytics, Top Cut Explorer, and MunchStats as tools integrated into Pokémon Champions in-game features. Limited additional detail available.

### Top Cut Explorer (cut-explorer.stalruth.dev)
- Fine-grained analytical tool for VGC Top Cut teams
- 2025 data available including Toronto Regionals and Worlds
- Open source (GitHub: Stalruth/cut-explorer)
- Tournament-specific deep dives on team compositions that made Top Cut

### VGenC (vgenc.net)
Emerging direct competitor to VGCpastes' niche:
- **1,340+ top tournament teams** for Pokémon Champions Regulation M-A as of April 2026
- Filter by rank tier (Champions, Runner Up, Top cuts), player, and Pokémon
- **AI-assisted EV filling:** Paste a partial team in Showdown format → AI fills EVs, Natures, keeping items/moves/abilities
- Sortable by: most recent, oldest, best placement
- Technically more sophisticated than VGCpastes' spreadsheet approach
- Free; no monetization visible
- Most likely to displace VGCpastes' "raw volume + search" position if it maintains update velocity

### MetaGame VGC (metagamevgc.com) and Victory Road (victoryroad.pro)
- Both publish player-authored team reports as editorial content
- Reports include: full team importable, tournament placement context, player commentary on how the team works and performs
- Submission/publication requires editorial approval from site owners — not self-service
- Victory Road's format includes password-protected team sharing for Open Team Sheets during tournaments
- These are the closest competitors to VGC Team Report's core use case — but require editorial gatekeeping rather than self-service authoring

---

## Competitive Landscape Summary Table

| Dimension | VGCpastes | Limitless VGC | Trainer Hill | Reportworm | VGC Team Report |
|-----------|-----------|---------------|--------------|------------|-----------------|
| **Primary use case** | Paste repository | Tournament database | TCG match analytics | Team validation + replay | Team report authoring + sharing |
| **Format coverage** | VGC (all regs) | VGC (all major events) | TCG only | VGC (current) | VGC (current format) |
| **Team narrative** | None | None | None | None | Core feature |
| **Player profiles** | None | Yes (tournament-based) | Match log (self) | Match log (self) | None (opportunity) |
| **Mobile UX** | Poor (spreadsheet) | Moderate | Good (tournament mode) | Unknown | Unknown |
| **Self-service submission** | Via Discord/Twitter DM | Via tournament orgs | Via manual logging | Via manual logging | Yes (paste import) |
| **Monetization** | None | None (ad removal via Patreon) | $3/mo Battle Journal+ | None visible | None |
| **Community traction** | Very high | Very high | High (TCG) | Growing | Early stage |
| **Discord bot** | Yes (Sandshrew Bot) | No | No | No | No |
| **Damage calcs / speed tiers** | None | None | None | Yes | Player-authored only |
| **Meta usage stats** | None | Yes (aggregate) | Yes (TCG only) | None | None |
| **Matchup win rates** | None | Restricted duo data | Per-deck win rates | Per-team (personal) | Player-authored |

---

## What Competitors Do Better: Honest Assessment

### 1. Volume and rental codes — VGCpastes wins
VGCpastes owns "I need a team to play right now." 1,150+ Reg H teams with rental codes is an insurmountable data moat built by volunteer labor. VGC Team Report should not compete here — it should link to VGCpastes as a companion resource, not a competitor.

### 2. Tournament-sourced data authority — Limitless VGC wins
Limitless's pipeline from official tournament providers gives it automatic, credible, neutral data. No editorial team or curation required — results are results. VGC Team Report cannot replicate this without becoming a tournament organizer.

### 3. Duo/pairing win rate analytics — Limitless VGC wins
Restricted duo metagame tracking ("Kyogre+Groudon: 28% usage, 54% win rate across 12 Regionals") is genuinely useful for teambuilding and unique to Limitless in the VGC space.

### 4. Damage calcs and speed tier automation — Reportworm wins
Automated offensive/defensive calc generation and speed tier analysis from a paste is a technical feature that VGC Team Report does not have. This is a significant gap if VGC Team Report wants to be the definitive team analysis destination.

### 5. Freemium match tracking — Trainer Hill wins (in TCG)
No VGC tool offers match logging with win rate analytics at a price point. This is an open market opportunity validated in the adjacent community.

### 6. Discord-native access — VGCpastes wins
Sandshrew Bot meets players in Discord — the community's native habitat — rather than requiring website visits. VGC Team Report has no Discord presence or bot.

---

## Top 5 Opportunities for VGC Team Report

### Opportunity 1: Own the "Player Voice" Layer (Highest Leverage)
**Gap:** Every competitor shows team compositions without player intent, reasoning, or matchup strategy. VGCpastes shows what; Limitless shows where (tournament context); Reportworm shows how (performance analytics). Nobody shows why — the player's actual reasoning.

**Opportunity:** VGC Team Report is the only tool positioned to be where players explain their choices. This is the "after the tournament" or "coach explaining their thought process" use case. No competitor owns this. Victory Road and MetaGame do editorial versions, but they are gated behind editorial approval and have no self-service authoring.

**Differentiation:** Self-service structured report authoring — team concept, individual set explanations, matchup plans, damage calc embeds — with public discoverability and shareable URLs. Make it easy enough that players write reports at the tournament hotel the night after Day 1.

### Opportunity 2: Automated Damage Calcs and Speed Tiers (Feature Parity with Reportworm)
**Gap:** Reportworm auto-generates offensive/defensive calc tables and speed tiers from a paste. VGC Team Report requires players to write these manually. This creates friction and inconsistency.

**Opportunity:** On paste import, auto-generate: (a) speed tier position among format-common Pokémon, (b) how much damage key format threats deal to each team member, (c) key damage benchmarks the spread is designed to hit. Surface these as embedded, interactive tables within a report — not as a separate tool users must leave the site to use.

**Differentiation:** Automated analytics embedded in the authoring flow reduces the effort to write a complete report, increases report quality, and provides players a reason to create a report on VGC Team Report rather than just posting a paste link.

### Opportunity 3: $3-5/Month Match Tracker with Win Rate Analytics
**Gap:** No VGC tool offers mobile-first match logging with win rate analytics by opponent team archetype. Trainer Hill has proven the willingness-to-pay exists in the competitive Pokémon audience.

**Opportunity:** Build a VGC match tracker as a premium feature:
- Log matches from your phone between tournament rounds (under 30 seconds)
- Track: opponent's key Pokémon, outcome, lead selection, notes
- Analyze: win rates by opponent lead, by format archetype, by game mode (Best of 3)
- Link match logs to your authored team reports (when you're testing a team you wrote a report for)
- Cross-device sync: phone at tournament, dashboard on desktop

**Monetization:** $3/month after free trial. Justifiable as a clear improvement over a spreadsheet or paper log, priced as a snack.

### Opportunity 4: Discord Bot for Organic Discovery
**Gap:** Sandshrew Bot (VGCpastes) meets players in Discord, the community's primary communication channel. VGC Team Report has no Discord presence.

**Opportunity:** Build a Discord bot that allows players to:
- `/report [player name]` — return a card preview of their latest VGC Team Report
- `/find [Pokémon name]` — return reports featuring that Pokémon
- `/random` — return a random published report from the current regulation
- Allow Discord servers to add the bot for their tournament channels

Even a minimal bot drives organic referral traffic without paid acquisition. The best path is to get bot adoption in established VGC Discord servers (Victory Road, Nugget Bridge community, regional Discord hubs).

### Opportunity 5: Player Profile Pages Tied to Authored Reports
**Gap:** Limitless VGC has player profiles tied to tournament performance. VGCpastes has no player profiles. No VGC tool has player profiles tied to knowledge sharing and content authoring.

**Opportunity:** Create player profiles that aggregate:
- All published team reports by the player (across any regulation)
- Total reports published, views received, community engagement
- Optional: link to Limitless VGC for tournament record context
- Optional: social handles (Twitter/X, YouTube)

This creates a new axis of player identity — rewarding knowledge sharing and writing, not just tournament results. A player with a top-16 finish but a detailed, well-written report is more visible on VGC Team Report than on any other platform.

---

## Emerging Competitive Risk: Pokemon Champions In-Game Tool Integration

A tweet from @iWillTheGamer (May 2026) noted that Pokémon Champions itself is integrating features similar to Pikalytics, LabMaus, Top Cut Explorer, and MunchStats directly into the game client. If Nintendo/TPC builds in-game team analytics natively, it could disintermediate all third-party analytics tools for the casual/semi-casual audience. The players most likely to seek out and write detailed team reports on external platforms are the competitive hardcore — who will still want richer tools than anything Nintendo ships. VGC Team Report's audience is precisely this segment, which is the segment least likely to be satisfied by in-game features.

---

## Community Traction Gap

The largest non-feature growth lever available to VGC Team Report is backlink acquisition on the community resource pages that competitors dominate:

- **VGCpastes** is listed on: Victory Road resources, VGCpedia resources, "New To VGC" linktrees, DevonCorp resources, Smogon sample team threads
- **Limitless VGC** is listed on: Victory Road resources, Smogon tournament circuits, all major community wikis, Liquipedia
- **VGC Team Report** is listed on: Its own search results (vgc-team-report.vercel.app, pokemonvgcteamreport.com) — no community resource page backlinks identified

Getting listed on Victory Road's resources page alone would likely be the highest-leverage single acquisition action available, given how many players use it as their first stop for VGC tool discovery.

---

*Research sources: X/@VGCPastes tweet archive, GitHub txfs19260817/falinks-teambuilder, Limitless Patreon posts (2024 Q1, 2024 Recap, 2025 Q1), plus.trainerhill.com feature descriptions, Trainer Hill about/tools pages, Reportworm documentation, Smogon VGC forums, Victory Road resources page, VGCpedia, DevonCorp VGC resources, VGenC.net search results, Limitless Labs references, standings.limitlessvgc.com structural references, cut-explorer.stalruth.dev GitHub, labmaus.net search results, Bulbapedia/Limitless TCG entry, Pokémon Champions rules and format docs.*
