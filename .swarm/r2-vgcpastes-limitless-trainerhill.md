# Competitive Intelligence: VGCpastes, Limitless VGC, and Trainer Hill

**Research Date:** May 7, 2026 (refreshed)
**Analyst:** Claude (Competitive Intelligence Agent)  
**Subject:** Tear-down analysis of three key adjacent tools in the VGC ecosystem  
**Note:** All three primary domains returned HTTP 403 to automated fetchers — research sourced from WebSearch, X/@VGCPastes tweet thread, Limitless docs, Smogon/VictoryRoad references, Bulbapedia, and Discord App Directory. Findings validated across multiple independent sources.

---

## 1. VGCpastes (vgcpastes.com)

### What It Is
VGCpastes is the VGC community's de facto team repository. It originated as a Google Sheets spreadsheet and has grown into a large community-maintained project collecting competitive team pastes from tournaments, social media, and Discord submissions. As of May 2026, they maintain 1,150+ teams for Regulation H, 63+ teams for Regulation I, and growing collections for Regulation J and Regulation M-A (Pokémon Champions era). Their Twitter/X account has rebranded through each regulation (@VGCPastes, previously "Regulation H/J," now "Champions").

### How It Works
- **Primary artifact:** Google Sheets spreadsheet (linked via tinyurl redirects). The "website" at vgcpastes.com appears to route back to the spreadsheet — no interactive web app with server-side search was found to be publicly accessible at scale.
- **Submission process:** Community members DM the team on Twitter/X or submit through their Discord server. A key contributor (@CastorbrownVGC) maintains spreadsheet updates. There is no self-service submit form.
- **Sandshrew Bot:** A Discord bot embedded in their server with `search`, `get rental`, and `random team` commands. Updated to support Regulation M-A in 2026. Users can search by specific Pokémon, item, or filter for teams with EV spreads. A 2026 update replaced the old txt-file dump system with paginated in-message scrolling and a "reroll" button to cycle through teams without re-entering commands. The `/openteam` command can convert a standard pokepaste into open-team-sheet format automatically.
- **Discord server size:** 8,371+ members as of 2024 (growing).
- **Featured Teams:** A separate sheet tab for "Featured Teams" — curated high-result teams for players who want pre-vetted options rather than the full raw repository.

### Strengths
- **Volume:** 1,150+ Reg H teams. No other platform comes close to raw paste quantity for a given regulation.
- **Rental codes:** A significant portion of teams include in-game rental codes — immediately actionable for players who don't want to build.
- **Discord community:** Sandshrew Bot makes discovery interactive and accessible without leaving Discord. The September 2026 bot update shows active, ongoing development.
- **Community trust:** Referenced as a primary resource on Victory Road's resource page, Smogon's sample teams threads, DevonCorp, VGCpedia, and the "New to VGC" linktree. It is the go-to for raw volume.
- **Cross-org collaboration:** Works directly with Victory Road — VGCPastes handles breadth (almost every paste), while VR curates quality (rental codes + proven results).

### Weaknesses
- **UX is a spreadsheet:** The core artifact is a Google Sheet. No web-native filtering, card UI, or search. The experience degrades badly on mobile. Discoverability depends on Sandshrew Bot (Discord-only) or manually scrolling thousands of rows.
- **No team context:** Pastes are listed but there is no narrative, matchup notes, EV spread rationale, or usage context. A player gets the team but not the knowledge behind it.
- **No player attribution pages:** There is no "player profile" — teams are attributed but you can't navigate by creator or see a creator's body of work.
- **No search on the website:** The website returns 403 to scrapers and it is unclear whether a modern web UI exists. Community access flows through Discord bot or spreadsheet link.
- **Passive submission:** Submission requires reaching out to the team. There is no API, no automated pickup from tournament results, and no self-service upload.
- **No analytics:** No usage stats, no meta trend data, no matchup information. Pure paste storage.

### Mobile Experience
Poor. The core experience is a Google Sheets spreadsheet accessed via a tinyurl link. On mobile, navigating a spreadsheet with dozens of columns (Team ID, Description, Full Name, 6 Pokémon, Items, Pokepaste link, EVs status, Rental Status, Date, Event, Rank, Source link, Reports/Videos, Owner) is barely functional. The Sandshrew Bot experience is better on mobile since Discord's own mobile app is well-designed, but it still requires being inside a Discord server to use.

### Monetization
None identified. VGCpastes operates as a volunteer community project with no advertising, premium tier, or Patreon visible in research. Its companion website at falinks-teambuilder.com/pastes/vgc/ (synced daily) is also free and appears to run on community infrastructure.

### Threat Level to VGC Team Report
**Medium.** VGCpastes does not do team reports — it does paste storage. It competes for mindshare as a "reference" tool but does not address the "why" or "how" behind a team. VGC Team Report's team report authoring and presentation angle is entirely differentiated from this. However, VGCpastes owns the "where do I find a team?" use case completely.

---

## 2. Limitless VGC (limitlessvgc.com)

### What It Is
Limitless VGC is the most comprehensive tournament database in the VGC ecosystem. It is the VGC vertical of the broader Limitless platform (which originated as a TCG tournament management and results platform). Limitless VGC covers major Pokemon VGC events globally — Regionals, Internationals, Worlds — with player data, team lists, standings, pairing histories, and usage statistics.

### Core Feature Set

#### Tournament Database (limitlessvgc.com/tournaments)
- Full list of all major VGC tournaments from 2013-2014 through the current 2025-2026 season (Pokémon Champions era)
- Filter by: season, tournament type (Regional, International, Worlds, Special Events, National, Players Cup, Master Ball League), and region
- Each tournament page shows: participants, placements, team lists for top players, and statistics

#### Team Viewer (limitlessvgc.com/teams)
- Browse tournament teams across all tracked events
- Filter by year, season, tournament type
- Individual team pages link to paste and show the team in context of the player's placement

#### Player Rankings (limitlessvgc.com/players)
- Aggregated player performance across tournaments
- Implied championship point tracking and historical record
- Click-through to individual player profiles with full tournament history and team records

#### Pokémon Usage Stats (limitlessvgc.com/pokemon)
- Usage rankings across tournament field
- Per-Pokémon breakdowns across the tracked event pool

#### Per-Tournament Statistics
- For events with rk9.gg or playlatam.net data available: full standings, all pairings, per-round team sheet access
- Usage stats at the tournament level
- Duo/restricted Pokémon pairing usage with win rates by matchup — the "restricted duo meta" view is particularly valuable for teambuilders

#### Limitless VGC Standings (standings.limitlessvgc.com)
- Separate subdomain with deep drill-down: full round-by-round pairings, individual team sheets, per-Pokémon performance within a tournament
- Per-Pokémon pages within a tournament (e.g., "Gyarados at Stuttgart Regionals")

#### Limitless Labs (labs.limitlesstcg.com)
- Experimental / in-depth data exploration. Primarily TCG-facing currently, but VGC equivalent features exist. Tracks duo win rates, matchup data, and conversion rates in a more analytical UI.

#### Online Tournament Platform (play.limitlesstcg.com)
- Full tournament management software — Swiss pairings, bracket generation, decklist/teamsheet submission, standings, pairings broadcasts
- Runs VGC community circuits including Smogon VGC circuits
- Hosts VGCPastes Random Team Tours

### Strengths
- **Data depth:** No other VGC tool matches the breadth and depth of tournament-sourced data. Player records, team compositions, pairings, and round-by-round results are all searchable.
- **Historical coverage:** Data extends back to 2013-2014. Legacy researchers and nostalgic players have unique value here.
- **Matchup-level analytics:** Restricted Pokémon duo win rates and matchup data are unique to Limitless. This is genuinely useful for competitive teambuilding decisions.
- **Trusted infrastructure:** Limitless hosts actual tournaments (they are the infrastructure layer). This creates a natural data pipeline — they run the event, they capture the data automatically.
- **Player-level profiles:** Aggregated player history is something VGCpastes and VGC Team Report don't offer.
- **Cross-format authority:** The same brand covers TCG and VGC, creating cross-community trust.
- **Community standing:** Referenced by Smogon, Victory Road, and in resources pages across the ecosystem.

### Mobile Experience
Moderate. Limitless play.limitlesstcg.com was designed with tournament organizers and players submitting pastes in mind — the form-based flows (registration, team submission) work adequately on mobile. The tournament-watching and data-browsing experience on limitlessvgc.com is functional but not mobile-optimized. Standings drill-downs and team sheet views on standings.limitlessvgc.com are information-dense and better suited for desktop.

### Weaknesses
- **No narrative content:** Like VGCpastes, Limitless shows what a team is but not why. There are no player-written explanations, matchup plans, or EV spread rationale.
- **Not self-service for players:** Players cannot submit teams directly. Data flows in from tournament providers (rk9, playlatam). Community tournament data through play.limitlesstcg.com is the exception.
- **UI complexity and fragmentation:** Four separate subdomains (limitlessvgc.com, standings.limitlessvgc.com, play.limitlesstcg.com, labs.limitlesstcg.com) create a fragmented experience. New users struggle to find what they want.
- **Data gaps:** Not all tournaments have full standing/pairing data — depends on whether rk9 or playlatam was used. Some events are result-only with no team sheets.
- **TCG-first heritage:** The Labs and some features skew TCG. VGC-specific features feel like a port rather than native design.
- **Pokémon Champions coverage lag:** The 2026 transition to Pokémon Champions is new; Limitless VGC's data pipeline (dependent on official event providers) may lag grassroots/online tournament data, where community tools like VGenC.net are faster to update.

### Monetization
None visible on the consumer-facing VGC tools. Limitless monetizes the tournament organizer side (hosting software), not end-user tools. The Limitless Labs for TCG appears to be a premium or patron-adjacent feature for TCG, but VGC features appear free.

### Threat Level to VGC Team Report
**High for tournament data, Low for team reporting.** Limitless is the authoritative tournament results database and will never be unseated there. However, it does not provide authored team reports, matchup write-ups, or player-curated content. VGC Team Report can position itself as the "after the tournament" layer — where players go to explain and present their teams — while Limitless is the "during/results" layer.

The key competitive risk: if Limitless VGC ever added a "player notes" or "team write-up" field to their team viewer, they could quickly own that space given their existing data moat and traffic.

---

## 3. Trainer Hill (trainerhill.com)

### What It Is
Trainer Hill is a **Pokémon TCG analytics platform**, not a VGC tool. It is a competitive intelligence hub specifically for the Trading Card Game side of competitive Pokémon. It is included in this analysis because:
1. The name creates search/brand confusion with VGC tools ("Trainer Hill" vs "Trainer Tower" vs VGC venues)
2. Its analytics model is directly relevant as a template for what a VGC analytics product could look like
3. Its monetization via Battle Journal+ is a proven model for the competitive Pokémon audience

### Core Feature Set

#### Meta Analysis (trainerhill.com/meta)
- Meta tier lists for Standard and other TCG formats
- Win rates by deck archetype
- Matchup spread charts
- Card usage trends from online (PTCGL) and in-person tournament data
- Updated dynamically as new tournament data comes in

#### Decklists
- Curated competitive decklists by archetype
- Format filtering

#### Tools (trainerhill.com/tools)
- **Battle Journal** (free): Log match results against opponents. Track deck, opponent archetype, outcome, turn order, notes.
- **Prize Checker**: A TCG utility tool
- **Tier Lists**: Manually curated deck rankings
- **Deck Comparisons**: Head-to-head deck analysis

#### Podcast / Content Layer
- Trainer Hill maintains a content and coaching presence beyond pure data tools. YouTube channel with analytical content.

### Monetization: Battle Journal+ (plus.trainerhill.com)
This is the most sophisticated monetization model found in this competitive sweep:

- **Free tier:** Basic Battle Journal logging
- **Paid tier (Battle Journal+):** $3/month after a 7-day free trial, cancel anytime
  - Faster data entry optimized for between-rounds tournament logging
  - Better filtering and analytics on your match history
  - Per-matchup win rates, deck performance breakdowns by archetype and custom tags
  - Cross-device sync (log on phone at tournament, analyze on desktop at home)
  - Mobile-first UX designed for tournament pace (under 30 seconds per match entry)
- **Patreon integration:** Community members vote on which games get added next to the platform

### Strengths (as a template for VGC)
- **Match tracking is a solved problem for TCG:** Battle Journal+ proves the VGC player audience will pay for personalized match analytics at $3/month
- **Mobile-first tournament workflow:** Logging between rounds is a genuine user need that is unaddressed in VGC tools
- **Clean analytics UX:** Win rate by matchup archetype is directly translatable to VGC matchup tracking
- **Freemium model works:** Free tools drive traffic; premium tools capture value from the most engaged players

### Weaknesses (from a VGC Team Report perspective)
- **Not VGC at all:** Trainer Hill has zero VGC content as of May 2026. The brand operates exclusively in TCG.
- **No team building or sharing:** Analytics only; no content creation or team report features
- **TCG mechanics differ:** TCG matchup stats (deck vs deck) are cleaner than VGC matchup stats (6-mon team vs many teams), making direct feature porting non-trivial

### Threat Level to VGC Team Report
**Low directly, High as inspiration.** Trainer Hill does not compete in VGC. However, its Battle Journal+ model is a direct blueprint for a VGC match tracker premium offering. If VGC Team Report builds match tracking + win rate analytics as a paid feature at $3-5/month, it follows an already-validated monetization path in the adjacent competitive Pokémon audience.

---

## Competitive Landscape Summary Table

| Dimension | VGCpastes | Limitless VGC | Trainer Hill | VGC Team Report |
|-----------|-----------|---------------|--------------|-----------------|
| **Primary use case** | Team paste repository | Tournament database | TCG match analytics | Team report authoring + sharing |
| **Format coverage** | VGC (all regs) | VGC (all major events) | TCG only | VGC (current format) |
| **Team count** | 1,150+ (Reg H) | All top-cut teams | N/A | User-generated |
| **Narrative/context** | None | None | None | Core feature |
| **Player profiles** | None | Yes (tournament-based) | Match log (self) | None (opportunity) |
| **Mobile UX** | Poor (spreadsheet) | Moderate | Good (tournament mode) | Unknown |
| **Self-service submission** | Via Discord/Twitter | Via tournament orgs | Via manual logging | Yes (paste import) |
| **Monetization** | None | None | $3/mo (Battle Journal+) | None |
| **Community traction** | Very high | Very high | High (TCG) | Early stage |
| **Discord bot** | Yes (Sandshrew) | No | No | No |
| **Matchup data** | None | Aggregate (restricted duos) | Per-deck win rates | Player-authored |

---

## Key Differentiators: What Competitors Do Better

### 1. Volume and rental codes (VGCpastes wins)
VGCpastes owns "I need a team to play right now." 1,150+ Reg H teams with rental codes is an insurmountable data moat for a community project. VGC Team Report should not compete here; it should link to VGCpastes as a companion resource.

### 2. Tournament-sourced data authority (Limitless VGC wins)
Limitless's data pipeline from official tournament providers gives it automatic, credible, neutral data. No content team, no editorial — results are results. VGC Team Report cannot replicate this without becoming a tournament organizer.

### 3. Duo/pairing win rate analytics (Limitless VGC wins)
The restricted duo metagame tracking (e.g., "Kyogre+Groudon at 28% usage, 54% win rate across 12 Regionals") is genuinely unique and used by competitive players for teambuilding decisions. This is the kind of insight VGC Team Report could present in team reports but cannot aggregate across the whole meta.

### 4. Freemium match tracking (Trainer Hill wins in TCG)
No VGC tool offers match logging with win rate analytics. This is an open market opportunity. Trainer Hill proves the model works for competitive Pokémon audiences.

### 5. Discord-native access (VGCpastes wins)
Sandshrew Bot meets players in Discord — where the community actually lives — rather than requiring them to visit a website. VGC Team Report has no Discord presence.

---

## Opportunities for VGC Team Report

Based on this analysis, the clearest differentiated positions for VGC Team Report:

1. **Own the "player voice" layer:** Limitless and VGCpastes both show team compositions without player intent, reasoning, or matchup strategy. VGC Team Report is the only tool where a player explains their choices. This is the "after the tournament" or "here's why I built this" use case — no competitor owns it.

2. **Structured report format:** Unlike Victory Road's text-heavy editorial team reports, VGC Team Report can offer structured templates (EV benchmarks, matchup grades, damage calcs embedded) that are reproducible and searchable.

3. **Match logging as a premium feature:** Build a mobile-optimized match tracker ($3-5/month) — Trainer Hill proves this revenue model works in the adjacent TCG community. VGC matchup tracking tied to a player's actual team reports is unique.

4. **Discord bot for discovery:** A Sandshrew Bot competitor — or an integration — would bring VGC Team Report into the community's native habitat. Even a simple `/report [team-name]` that returns a team report card would drive organic traffic.

5. **Rental code + team report bundle:** Partner with or link to VGCpastes. If players can find a team's rental code AND read its full report in one place, VGC Team Report becomes the richer destination without having to compete on raw volume.

6. **Player profile pages:** Limitless has player profiles tied to tournament performance. VGC Team Report could create player profiles tied to their authored reports — a different axis of player identity that rewards writing and knowledge sharing, not just results.

---

## Community Traction Signals

- VGCpastes is listed on: Victory Road resources, VGCpedia resources, New To VGC linktree, DevonCorp resources, Smogon sample teams threads
- Limitless VGC is listed on: Victory Road resources, Smogon tournament circuits, all major community wikis
- VGC Team Report is listed on: Its own search results (vgc-team-report.vercel.app and pokemonvgcteamreport.com) — community backlinks appear minimal vs competitors
- Trainer Hill: Strong TCG community presence; no VGC crossover found

The gap in community referral links vs competitors is the largest growth lever available to VGC Team Report beyond feature development.

---

*Sources: X/@VGCPastes tweets, limitlessvgc.com metadata, standings.limitlessvgc.com, plus.trainerhill.com, trainerhill.com/about, Smogon VGC forums, Victory Road resources page, VGCpedia resources, DevonCorp VGC resources, reportworm.com feature descriptions, metagamevgc.com team reports section, Sandshrew Bot Discord App Directory listing.*
