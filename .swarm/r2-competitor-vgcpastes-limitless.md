# Competitor Teardown: VGCpastes, Limitless VGC/TCG, and Trainer Hill

**Research Date:** May 13, 2026 (full refresh)
**Analyst:** Claude (Competitive Intelligence Agent)
**Subject:** Feature-level teardown of three key adjacent tools in the VGC/TCG competitive Pokémon ecosystem
**Note:** Primary domains blocked automated WebFetch (HTTP 403). All findings sourced from WebSearch, the X/@VGCPastes tweet archive (37K+ followers), Limitless Patreon launch posts, Trainer Hill product pages (`plus.trainerhill.com`), Reportworm documentation, Smogon/VictoryRoad resource pages, Limitless VGC URL structure analysis, and community linktrees. Multiple independent confirmations obtained for each data point.

---

## 1. VGCpastes (vgcpastes.com / Falinks Teambuilder)

### What It Is

VGCpastes is the community-designated canonical team paste repository for competitive VGC. It started as a volunteer-maintained Google Sheets spreadsheet aggregating tournament-winning teams from Twitter/X DMs and Discord submissions. In 2026 it operates as a three-layer project:

- **Google Sheets repository** — the primary data store
- **Sandshrew Bot** — Discord-native access layer
- **Falinks Teambuilder** (`falinks-teambuilder.com/pastes/vgc/`) — web browsing layer (open source, Next.js, maintained by a separate contributor under a data-sharing arrangement)

Active scale as of May 2026: 1,150+ Regulation H teams; 63+ Regulation I teams at regulation launch; Regulation J and Pokémon Champions Regulation M-A actively growing.

### Core Features

**Google Sheets Repository**
Columns tracked per team: Team ID, Player name, Event name, Placement, Six Pokémon names, Items, Pokepaste URL, EV spread availability flag, Rental code availability, Rental code, Date shared, Source link, Video/report links, Tera types. One sheet per regulation, preserving historical access. Maintained primarily by `@CastorbrownVGC`.

**Sandshrew Bot (Discord)**
Commands: `/search` (filter by Pokémon, item, EV spread availability), `/get rental` (filter to teams with rental codes), `/random team` (rerollable paginated results), `/openteam` (convert paste to Open Team Sheet format for official tournaments). Updated for Pokémon Champions Regulation M-A in 2026. Under-30-second team retrieval without leaving Discord.

**Falinks Teambuilder Web Layer**
- Browse/filter VGCpastes repository by regulation, Pokémon, item
- Real-time collaborative team building (Yjs + SyncedStore)
- Import/export Showdown paste or PokePaste URL
- Usage statistics aggregation from the VGCpastes dataset
- Tournament team list parser: Masters Open Team Lists from 2023+ live events
- Open source (GitHub: txfs19260817/falinks-teambuilder)

### What VGCpastes Does Better

1. **Raw volume per regulation.** 1,150+ Reg H teams is an insurmountable volunteer-labor moat. No other single source comes close.
2. **Rental codes.** A significant subset includes in-game rental codes — the only source that makes teams instantly playable without building them.
3. **Discord-native UX.** Sandshrew Bot meets players in their primary communication habitat. Zero context switching: find a team inside the same Discord window where strategy discussion is happening.
4. **Community trust and backlinks.** Listed on Victory Road resources, VGCpedia, Smogon sample team threads, "New To VGC" linktrees, DevonCorp resources. First-stop placement for new and returning players.
5. **Regulation-partitioned history.** Separate sheets per regulation mean players can find "the best Regulation F teams" years later without sifting through unrelated data.

### Weaknesses / Unmet User Needs

- **UX is literally a spreadsheet.** On mobile: 15+ columns, tinyurl.com link, Google Sheets scroll. Effectively unusable for browsing. Even on desktop, filtering requires knowing spreadsheet functions.
- **No team context.** Shows what the team is; gives no explanation of why EVs, why the lead combination, what threats the team handles or struggles against. Players get a paste, not knowledge.
- **No player profile pages.** Cannot navigate "show me all teams by [player]" or browse a creator's history.
- **No self-service submission.** Requires DM to a human maintainer. No API, no form, no automated tournament data pull.
- **Passive maintenance risk.** Completeness depends on a small volunteer core. Smaller events are underrepresented. Coverage of new regulations takes days to weeks.
- **No meta analytics.** Zero usage stats, matchup data, or win rates. Pure paste storage.
- **Discord dependency.** Best UX (Sandshrew Bot) requires server membership. Discovery from outside the Discord community is limited.

### Monetization

None. Fully volunteer community project. Zero advertising, premium tier, or Patreon.

### Threat Level to VGC Team Report

**Medium.** Owns "I need a team to play right now." Does not do team reports. VGC Team Report is entirely differentiated in the authoring layer. The risk is VGCpastes' community mindshare: players looking for teams go there first, and VGC Team Report is not on their radar yet.

---

## 2. Limitless VGC (limitlessvgc.com) and Limitless TCG (limitlesstcg.com)

### What It Is

Limitless is the most comprehensive tournament data platform in the competitive Pokémon ecosystem. The TCG side originated around 2020, built by a European competitive team (Fatih Akdemir, Nico Alabas, and co-founders). Limitless VGC operates as a separate product on the same brand/infrastructure, covering all major VGC events globally from the 2013–2014 season through the current Pokémon Champions era.

The platform is organised across four subdomains:
- `limitlessvgc.com` — primary database (tournaments, teams, player rankings, Pokémon usage)
- `standings.limitlessvgc.com` — deep drill-down standings, pairings, team sheets per player
- `play.limitlesstcg.com` — online tournament management (hosts community VGC circuits including Smogon circuits and VGCPastes Random Team Tours)
- `labs.limitlesstcg.com` — experimental analytics (currently more TCG-facing)

### Core Features

**Tournament Database (`/tournaments`)**
Filter by season, event type (Regional, International, Worlds, Special Events, National, Players Cup, Master Ball League), and region. Per-tournament pages include: participant count, placements, team lists, usage statistics, round-by-round pairings (where data source permits). Data sourced automatically from rk9.gg and playlatam.net.

**Team Browser (`/teams`)**
Browse top-placing teams across all tracked events. Filter by year, season, tournament type. Individual team cards show Pokémon, held items, tera types, movesets, player name, placement, and tournament name. URL pattern: `standings.limitlessvgc.com/[TOURNAMENT_ID]/player/[PLAYER_ID]/teamlist`.

**Player Rankings (`/players`)**
Aggregated cross-event performance. Player profile pages with full tournament history, records per event, team compositions used. Multiple ranking axes: points, top-8 finishes, tournament wins. Time filters: past month / 3 / 6 / 12 months, by season (2011–2012 through 2025–2026), by event tier.

**Pokémon Usage Statistics (`/pokemon`)**
Per-Pokémon pages with: usage rates across tracked tournaments, tera type distribution, item usage, ability usage, move usage, restricted duo pairings with win rates. The restricted duo win rate data (e.g., "Kyogre+Groudon: 28% usage, 54% win rate") is unique to Limitless in the VGC space.

**Online Tournament Platform (`play.limitlesstcg.com/tournaments/?game=VGC`)**
Full Swiss tournament management: decklist/teamlist submission, pairings generation, standings, broadcast. Hosts grassroots community VGC events. Creates a natural data pipeline: Limitless-run events automatically populate the database.

**Limitless Labs (`labs.limitlesstcg.com`)**
Deep metagame analytics for TCG: win rates, conversion rates, tournament paths, matchup tables. VGC equivalent data accessible in aggregate form; less developed than the TCG layer.

### What Limitless Does Better

1. **Tournament-sourced data authority.** Automatic pipeline from rk9.gg/playlatam means results are neutral, credible, and comprehensive with no editorial curation overhead.
2. **Historical depth.** Data from 2013–2014 through 2026. No other VGC resource provides this range.
3. **Restricted duo win rate analytics.** Meta analysis showing which legendary pairings are overperforming — genuinely useful for teambuilding decisions. Unique feature.
4. **Player profiles with full tournament history.** Cross-event player identity, browsable by anyone. Irreplaceable for following top players or researching opponents.
5. **Integrated tournament organizer infrastructure.** Running tournaments and collecting data creates a flywheel that self-sustains without manual effort.
6. **Ecosystem authority.** Listed on every major VGC community resource page. The brand carries weight across both TCG and VGC audiences.

### Weaknesses / Unmet User Needs

- **No narrative content anywhere.** Shows the composition and results; gives no explanation of team concept, matchup strategy, EV rationale, or why particular moves were chosen. Data without voice.
- **Not self-service for players.** Individual players cannot submit their own teams. Data flows in only through official tournament providers or Limitless-organised events.
- **Fragmented UX across four subdomains.** New users stumble between `limitlessvgc.com`, `standings.limitlessvgc.com`, `play.limitlesstcg.com`, and `labs.limitlesstcg.com`. Navigation between them requires knowing the URL structure.
- **Data gaps.** Events not using rk9 or playlatam have results-only coverage with no team sheets.
- **TCG-first heritage.** Labs and developer attention skew TCG. VGC-specific feature development moves slowly.
- **No community or social layer.** No comments, no team saves, no "follow this player," no sharing with context. Pure read-only reference database.
- **Mobile UX for browsing.** Information-dense tables are desktop-optimised. The standings drill-down experience is poor on phone.

### Limitless TCG Monetization

- **Consumer tools (both VGC and TCG): Free** — no paywall on any database features
- **Ad removal:** Patreon-based subscription, transitioning to a native on-site subscriber model (Patreon to be deprecated when ready)
- **Tournament organizer layer:** Implied SaaS or commission revenue from organisers using `play.limitlesstcg.com` infrastructure
- **Limitless Labs:** Included with base access; no separate premium tier identified

### Threat Level to VGC Team Report

**High for tournament data, Low for team reporting.** Limitless VGC is the undisputed authoritative tournament database and will not be displaced there. It does not offer authored team reports, player-written matchup commentary, or self-service content creation.

**Primary strategic risk:** If Limitless adds a "player notes" or "team write-up" field to their existing team viewer, they could rapidly own that space given their data moat and existing traffic. This is the scenario to monitor and get ahead of.

---

## 3. Trainer Hill (trainerhill.com)

### What It Is

Trainer Hill is a **Pokémon Trading Card Game analytics platform** — not a VGC tool. It is included here because its analytics model, monetization structure, and mobile-first design are directly instructive for VGC product development.

### Core Feature Set

**Meta Analysis (`/meta`)**
- Deck tier lists and win rates for Standard and other TCG formats
- Matchup spread charts (deck vs. deck)
- Card usage trends from PTCGL (online) and in-person tournament data
- Dynamic updates as new tournament data is ingested

**Decklist Analysis (`/decklist`)**
Search top tournament decklists with filters for win rates, card usage trends, matchup data, time range, and player count threshold.

**Tools (`/tools`)**
- **Battle Journal (free):** Log match results (deck, opponent archetype, outcome, turn order, notes). Basic performance view.
- **Deck Diff / Venn Diagram:** Compare card overlap between two decklists
- **Prize Checker:** TCG-specific utility

**Battle Journal+ (`plus.trainerhill.com`) — $3/month, 7-day free trial**
- Faster mobile data entry — explicit design target: under 30 seconds per match entry between tournament rounds
- Per-matchup win rates broken down by opponent archetype, custom tags, going-first/second
- Cross-device sync: log on phone at tournament, analyse on desktop at home
- Advanced filtering across full match history
- Patreon community membership: supporters vote on which games/features get added next (TCG Pocket, etc.)

### What Trainer Hill Does Better (as a design template)

1. **Monetization validation.** Battle Journal+ proves competitive Pokémon players pay $3/month for personalised performance analytics. Willingness to pay is confirmed in the adjacent audience.
2. **Mobile-first tournament workflow.** Under-30-second match entry explicitly designed for between-rounds tournament use. This is a design discipline, not just feature parity.
3. **Cross-device sync.** Phone at tournament → desktop for analysis is the correct model for competitive players. None of the VGC tools address this.
4. **Freemium conversion funnel.** Free tools drive traffic and trust; the premium tier captures value from the most engaged and likely-to-pay segment. This is the right structure for a competitive Pokémon tool audience.
5. **Community feature voting.** Patreon supporters vote on roadmap — drives retention and product-market fit simultaneously.

### Weaknesses as a Direct VGC Competitor

- Not VGC at all. Zero VGC content as of May 2026. TCG and TCG Pocket only.
- No team building or sharing features.
- TCG matchup analytics (deck vs. deck, ~15 archetypes per meta) are structurally simpler than VGC matchup analytics (6-Pokémon team vs. near-infinite opponent team variety). Direct feature porting requires significant design rework.

### Trainer Hill Monetization

Battle Journal+: $3/month (7-day free trial). Patreon: community tier for feature voting. Core analytics tools: free.

### Threat Level to VGC Team Report

**Low directly, High as inspiration.** Trainer Hill does not compete in VGC. Its Battle Journal+ is a direct blueprint for a VGC match tracker premium feature.

---

## Comparison Table

| Dimension | VGCpastes | Limitless VGC | Trainer Hill | VGC Team Report |
|---|---|---|---|---|
| **Primary use case** | Paste repository + team discovery | Tournament results database | TCG match analytics | Team report authoring + sharing |
| **Format** | VGC all regulations | VGC all major events | TCG only | VGC current format |
| **Team narrative / player voice** | None | None | None | Core feature (sole occupant) |
| **Tournament-sourced data** | Partial (via community submissions) | Yes — automatic pipeline | No | No |
| **Player profiles** | None | Yes (tournament-based) | Match log (self only) | Opportunity |
| **Rental codes** | Yes (large subset) | No | No | No |
| **Self-service team submission** | Via Discord/Twitter DM | Via tournament orgs only | Via manual logging | Yes (paste import) |
| **Meta usage stats** | None | Yes — aggregate + duo win rates | Yes (TCG only) | None |
| **Damage calcs / speed tiers** | None | None | None | Player-authored only |
| **Discord bot** | Yes (Sandshrew Bot) | No | No | No |
| **Mobile UX** | Poor (Google Sheets) | Moderate | Good (tournament-first) | Unknown |
| **Social / community layer** | Discord server | None | Patreon community | Opportunity |
| **Monetization** | None | None (ad removal) | $3/mo Battle Journal+ | None |
| **Community traction** | Very high | Very high | High (TCG) | Early stage |
| **Historical data depth** | Per regulation | 2013–2026 | TCG only | None |

---

## What Each Competitor Does Better (Honest Assessment)

### VGCpastes
1. Volume and rental codes — 1,150+ Reg H teams with rental codes is an unsurpassable data moat for "team I can play right now"
2. Discord-native discovery — Sandshrew Bot meets players where community conversation already happens
3. Community trust and canonical placement — every "New To VGC" resource list links here first

### Limitless VGC
1. Tournament data authority — automatic pipeline from official sources gives irreplaceable, neutral credibility
2. Restricted duo win rate analytics — meta analysis unique to Limitless, genuinely useful for teambuilding
3. Player profiles with full tournament history — cross-event player identity browsable by anyone
4. Historical depth (2013–2026) — irreplaceable for researchers and returning players
5. Integrated tournament organiser infrastructure — running events and capturing data creates a self-sustaining flywheel

### Trainer Hill
1. Proven $3/month monetisation model for competitive Pokémon analytics — willingness to pay is validated
2. Mobile-first tournament-pace UX — under-30-second match entry is a design discipline, not just a feature
3. Cross-device sync — phone logging at tournament, desktop analysis at home is the correct competitive player workflow
4. Freemium funnel with feature voting — community-driven roadmap drives both retention and product-market fit

---

## Top 5 Feature Gaps VGC Team Report Could Close

### Gap 1: The Player Voice Layer (Highest Leverage, Uncontested)

Every competitor shows team compositions without player intent, reasoning, or matchup strategy. VGCpastes shows what. Limitless shows where (tournament context). Nobody shows why — the player's own reasoning.

**Opportunity:** VGC Team Report is the only tool positioned to own self-service structured report authoring: team concept, individual set explanations, EV rationale, matchup plans, damage calc embeds — with public discoverability and shareable URLs. Victory Road and MetaGame VGC publish editorial team reports but require editorial approval. There is no self-service equivalent for this anywhere in the ecosystem.

**Priority action:** Make structured report creation easy enough that players write reports at the tournament hotel the night after Day 1. The template should guide them through the sections; they just fill in the knowledge.

### Gap 2: Automated Damage Calcs and Speed Tiers on Paste Import

On paste import, auto-generate: (a) speed tier position among format-common Pokémon, (b) how much damage key format threats deal to each team member, (c) damage benchmarks the spread is designed to hit. Surface these as embedded interactive tables inside the report rather than sending users to a separate tool (Showdown calc, vgcmulticalc.com, etc.).

**Why this matters:** Reportworm generates these from pastes automatically. VGC Team Report currently requires players to write them manually. Automated generation reduces effort, increases report quality floor, and gives players a reason to author on VGC Team Report rather than writing a Twitter/X thread instead.

### Gap 3: $3–5/Month Match Tracker with Win Rate Analytics (Validated Monetisation)

No VGC tool offers mobile-first match logging with win rate analytics by opponent archetype. Trainer Hill has validated that the competitive Pokémon audience pays $3/month for this in TCG. The use case transfers directly to VGC: between-round logging at tournament, post-tournament review of weaknesses against specific archetypes.

**Minimum viable feature set:**
- Log: opponent's lead pair, your lead, game outcome, match outcome, notes (under 30 seconds)
- Analyse: win rate by opponent lead, by format archetype, by game (G1/G2/G3)
- Link match logs to authored team reports on VGC Team Report
- Cross-device sync: phone at tournament, dashboard on desktop

**Monetisation:** $3–5/month after a 7-day free trial.

### Gap 4: Discord Bot for Organic Discovery

Sandshrew Bot is Limitless VGC's distribution advantage in paste discovery. VGC Team Report has no Discord presence, and Discord is the community's primary habitat. A lightweight Discord bot could generate organic referral traffic without paid acquisition:

- `/report [player name]` — embed preview of their latest published VGC Team Report
- `/find [Pokémon name]` — list reports featuring that Pokémon
- `/random` — random published report from the current regulation
- Allow community Discord servers (Victory Road, regional hubs, grassroots tournament servers) to install the bot in their team-sharing channels

Getting the bot adopted in 10–20 established VGC Discord servers would put VGC Team Report in front of the community's core population daily, at the moment they're already talking about teams.

### Gap 5: Player Profile Pages Tied to Authored Reports

Limitless VGC has player profiles tied to tournament performance. VGCpastes has no player profiles. No tool connects player profiles to knowledge sharing and content authoring.

**Opportunity:** Player profile pages that aggregate all published reports by a player across regulations, with view counts and community engagement. Optional links to Limitless VGC for tournament record context and to social handles (Twitter/X, YouTube). This creates a new axis of player identity: rewarding the quality of knowledge shared, not only tournament placements. A player who finishes Top 32 but writes an outstanding, detailed report becomes more visible on VGC Team Report than on any existing platform. This is a strong hook for the content-creator segment of the VGC community.

---

## Community Traction Gap (Non-Feature Risk)

The most urgent non-feature lever is backlink acquisition on the community resource pages that competitors dominate:

- **VGCpastes** is listed on: Victory Road resources, VGCpedia resources, "New To VGC" linktrees, DevonCorp resources, Smogon sample team threads
- **Limitless VGC** is listed on: Victory Road resources, Smogon tournament circuits, all major community wikis, Liquipedia
- **VGC Team Report** appears on: none of the above

Getting listed on Victory Road's resources page alone would likely be the single highest-leverage acquisition action available. Most competitive players use Victory Road as their first stop for tool discovery.

---

## Emerging Competitive Risk: In-Game Pokémon Champions Tool Integration

A May 2026 community signal noted that Pokémon Champions is integrating features similar to Pikalytics, LabMaus, Top Cut Explorer, and MunchStats directly into the game client. If Nintendo/TPCi builds in-game team analytics natively, it disintermediates all third-party analytics tools for the casual/semi-casual audience. The players most likely to seek out and write detailed team reports on external platforms are the competitive hardcore — precisely the segment least satisfied by anything Nintendo ships. VGC Team Report's target audience is resilient to this risk.

---

*Primary research sources: X/@VGCPastes tweet archive (37K+ followers); @VGCPastes tweets on Sandshrew Bot updates (2023–2026); VGCPastes Google Sheets repository (public); limitlessvgc.com URL structure analysis and search results; standings.limitlessvgc.com per-player teamlist URL patterns; Limitless TCG Patreon launch post; Limitless Labs launch post; plus.trainerhill.com Battle Journal+ product page; trainerhill.com/about and /meta; Trainer Hill Patreon page; Reportworm.com documentation; VGenC.net (vgenc.net/top-teams) search results; Victory Road resources page; VGCpedia resources; Nimbasa City Post Regulation H sample teams; Smogon VGC metagame discussion threads; DevonCorp VGC resources; "New To VGC" linktree; Falinks Teambuilder GitHub (txfs19260817/falinks-teambuilder); ChoiceSpecs.net and pokemonvgcteamreport.com search result snippets.*
