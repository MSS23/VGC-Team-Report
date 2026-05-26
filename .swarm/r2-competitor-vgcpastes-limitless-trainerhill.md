# Competitor Teardown: VGCpastes, Limitless VGC, and Trainer Hill

**Research Date:** May 26, 2026
**Analyst:** Claude (Trend Researcher)
**Method:** WebSearch + WebFetch (all primary domains returned HTTP 403; research sourced from search results, X/Twitter posts, GitHub repos, Patreon pages, Bulbapedia, Smogon forums, and community references)

---

## 1. VGCpastes / Falinks Teambuilder

### Features
- **Core product:** Community-curated Google Sheets spreadsheet of competitive VGC team pastes with 15+ columns (player, event, placement, Pokemon, items, Pokepaste link, EV status, rental codes, Tera types, source links, videos)
- **Regulation M-A / Pokemon Champions:** Actively collecting teams; 2,649+ pastes aggregated across VGCpastes + VGenC integration
- **Sandshrew Discord Bot:** `/search` (filter by Pokemon/item/EV status), `/get rental` (rental code teams), `/random team`, `/openteam` (open-team-sheet format). Updated May 2026 with paginated scrolling and reroll buttons for Reg M-A
- **Featured Teams tab:** Curated high-result subset for quick picks
- **Discord server:** 8,371+ members
- **X/Twitter:** @VGCPastes, 37,000+ followers; rebrands per regulation
- **Falinks Teambuilder (web layer):** Real-time collaborative team builder (Yjs + SyncedStore), import/export Showdown paste or PokePaste, filterable VGC pastes browser, usage stats aggregation, parsed Open Team Lists from 2023+ live events, companion userscript for Showdown/PokePaste integration
- **Falinks open-source:** GitHub 19 stars, 6 forks, WTFPL license, Next.js + TypeScript + PostgreSQL/Prisma, last release June 2023 (v1.2.6) — appears maintenance-mode

### Share UX
- **Primary sharing:** Tinyurl link to Google Sheets spreadsheet (no deep-linking to individual teams)
- **Pokepaste links:** Each team entry has a pokepast.es URL — the de facto plain-text sharing standard
- **Falinks URLs:** falinks-teambuilder.com/pastes/vgc/ for browsing; individual team rooms have shareable URLs with real-time collaboration
- **No OG embeds:** Pokepaste links render as plain text in Discord/Twitter with no preview image. VGCpastes relies on screenshot images posted manually to X
- **Discord-native:** Sandshrew Bot output is Discord-native rich embeds — the best sharing UX in the ecosystem, but only within Discord
- **No social integration:** No "share to Twitter" button, no generated team images, no embed cards

### Monetization
- **Completely free.** No ads, no Patreon, no premium tier, no sponsorships visible
- Falinks Teambuilder runs on personal/community infrastructure (Vercel free tier)
- Sustained entirely by volunteer labor (primarily @CastorbrownVGC and a small maintainer team)

### What They Do Better
- **Volume:** Unmatched raw paste quantity per regulation — 1,150+ Reg H teams, growing Reg M-A collection
- **Rental codes:** Immediately actionable for players who want to copy a team in-game without building it themselves
- **Discord-native UX:** Sandshrew Bot meets players where the community already lives — zero friction
- **Community trust and referral placement:** Listed on Victory Road resources, Smogon sample team threads, VGCpedia, DevonCorp, "New To VGC" linktrees. It IS the canonical "find a team" resource
- **Regulation consistency:** Distinct repositories per regulation with historical access preserved

### Weaknesses
- **UX is a Google Spreadsheet:** 15+ columns, unusable on mobile. No card UI, no visual team display, no web-native filtering beyond Sheets native
- **No team context or narrative:** Shows what a team IS but never why it was built, what matchups it targets, or what EV spreads benchmark
- **No self-service upload:** Submission via DM only. No form, no API, no automated tournament result ingestion
- **No player profiles:** Cannot browse by creator to see their body of work
- **No meta analytics:** No usage stats, matchup data, or win rates — pure paste storage
- **Falinks stagnation:** Last GitHub release was June 2023. The web layer is not actively developed
- **VGenC emerging threat:** vgenc.net now hosts 2,649+ Reg M-A pastes with AI-assisted EV filling, better filtering, and a more modern web UX — directly threatening VGCpastes' core niche

---

## 2. Limitless VGC (limitlessvgc.com)

### Features
- **Tournament database** (limitlessvgc.com/tournaments): All major VGC events globally — Regionals, Internationals, Worlds, Special Events. Filter by season, tournament type, region. Data from 2013-2014 season through current Pokemon Champions era
- **Team browser** (limitlessvgc.com/teams): Browse teams across all tracked tournaments, filter by year/season/tournament type
- **Player rankings** (limitlessvgc.com/players): Aggregated player performance, full tournament history, championship-point-adjacent ranking
- **Pokemon usage statistics** (limitlessvgc.com/pokemon): Usage rates, Tera type usage, item usage, ability usage, move usage, restricted Pokemon duo win rates
- **Standings deep-dive** (standings.limitlessvgc.com): Round-by-round pairings, individual team sheets per player, per-Pokemon tournament summaries. Data sourced from rk9.gg and playlatam.net
- **Limitless Labs** (labs.limitlesstcg.com): Experimental data exploration — metagame analysis, tournament paths, conversion rates, matchup stats combinable across tournaments. Currently more TCG-facing but VGC data accessible
- **Online tournament platform** (play.limitlesstcg.com): Full Swiss tournament management — pairings, bracket generation, team sheet submission, standings. Hosts VGC community circuits (Smogon circuits, VGCPastes Random Team Tours). Also supports TCG, TCG Pocket, and Bandai card games
- **Metagame page** (play.limitlesstcg.com/decks?game=VGC): Usage and win rates, top team lists, matchup stats from online tournaments

### Share UX
- **Clean URL scheme:** `limitlessvgc.com/tournaments/[id]`, `limitlessvgc.com/teams`, `limitlessvgc.com/players/[name]` — all linkable
- **Team sheets viewable per player per tournament** on standings subdomain
- **No social embed optimization visible:** Links shared to Discord/Twitter appear as generic page titles without rich team preview images
- **Tournament registration URLs:** `play.limitlesstcg.com/tournament/[id]/details` — shareable for event promotion
- **No "copy paste" or "export to Showdown" button** on team pages — data is read-only and display-focused

### Monetization
- **VGC tools:** Completely free, no paywall
- **Patreon (Supporter tier):** $2/month — removes ads across all Limitless sites, shout-out on homepage. Actively transitioning to native on-site subscription system (Patreon to be deprecated)
- **Display advertising:** Primary revenue source across all Limitless properties
- **No premium data tier:** All analytics, standings, and Labs tools are free. Ads are the only monetization barrier
- **Tournament platform:** Implied infrastructure model for organizers; no visible organizer fees

### What They Do Better
- **Data depth and authority:** No VGC tool matches the breadth of tournament-sourced data — player records, team compositions, pairings, round-by-round results all searchable. Data pipeline from rk9.gg/playlatam.net is automatic and credible
- **Historical coverage:** Data back to 2013-2014 season. Irreplaceable for historical research
- **Duo win rate analytics:** Restricted Pokemon pairing win rates are unique to Limitless in VGC and genuinely useful for teambuilding decisions
- **Player profiles:** Full tournament history per player — unique in VGC
- **Ecosystem referrals:** Listed on Victory Road, Smogon tournament circuits, all major community wikis, Liquipedia
- **Cross-format authority:** Same brand covers TCG + VGC, creating broad community trust

### Weaknesses
- **No narrative content:** Shows what a team is and where it placed — never why it was built or how it performs in specific matchups. No player-written explanations
- **Not self-service for players:** Data flows from tournament providers only. Players cannot submit teams independently
- **Fragmented UX across 4+ subdomains:** limitlessvgc.com, standings.limitlessvgc.com, play.limitlesstcg.com, labs.limitlesstcg.com — confusing navigation for new users
- **Data gaps:** Coverage depends on whether rk9 or playlatam was used. Some events are results-only with no team sheets
- **TCG-first heritage:** Labs and feature development skew TCG. VGC features feel secondary
- **No export functionality:** Teams are display-only with no copy-paste, Showdown export, or Pokepaste generation
- **Mobile experience:** Functional but not optimized. Information-dense standings pages are desktop-suited
- **Pokemon Champions coverage lag:** The 2026 transition may cause slower data ingestion compared to faster-updating tools like VGenC

### Strategic Threat
**HIGH for tournament data, LOW for team reporting.** If Limitless adds a "player notes" or "team write-up" field to their existing team viewer, they could quickly own that space given their data moat and traffic. This is the #1 threat to monitor.

---

## 3. Trainer Hill (trainerhill.com)

### Features
**Important context: Trainer Hill is a Pokemon TCG analytics platform, NOT a VGC tool.** It covers TCG and TCG Pocket only. Included here because its analytics model and monetization are directly instructive for VGC product design.

- **Meta Analysis** (trainerhill.com/meta): TCG meta tier lists, win rates by deck archetype, matchup spread charts, card usage trends from online and in-person tournaments
- **Decklist Analysis** (trainerhill.com/decklist): Search top TCG and TCG Pocket decklists with filters, win rates, card usage trends, matchup data, tournament results
- **Deck Diff tools:** Table comparison (card counts, averages, staples, tech choices) and Venn diagram comparison (overlaps, tech choices, card count differences)
- **Prize Checker:** TCG-specific practice tool for prize mapping
- **Tier List Builder:** Build and publish TCG tier lists with tournament data
- **Battle Journal (free tier):** Basic match logging — deck, opponent archetype, result, turn order, notes
- **Battle Journal+ ($3/month premium):** Advanced match tracking optimized for tournament pace:
  - Log matches in under 30 seconds between rounds
  - Track deck, opponent archetype, game outcomes, turn order, notes
  - Per-matchup win rates and opponent archetype breakdowns
  - Custom tags and performance analysis
  - Cross-device sync (phone at tournament, desktop at home)
  - Mobile-first UX designed for tournament conditions
- **YouTube channel:** Analytical content, TCG coaching
- **Patreon community:** Supporters vote on feature priorities (which games/features get added next)
- **TCG Pocket support:** Meta analysis and decklist tracking for Pokemon TCG Pocket

### Share UX
- **Clean tool URLs:** trainerhill.com/tools/[tool-name], trainerhill.com/meta
- **Tier list publishing:** Build and share rankings for events
- **Deck diff shareable:** Compare decklists and share analysis
- **No social embed optimization visible** beyond standard OG tags
- **Battle Journal data is private:** No public sharing of match logs or analytics

### Monetization
- **Free tools:** Meta analysis, prize checker, tier list builder, deck diff, basic battle journal — all free
- **Battle Journal+ at $3/month:** 7-day free trial, cancel anytime. The core premium offering
- **Patreon:** Supporters at $1/month+ get community access and feature voting rights
- **No visible advertising** on the tools themselves
- **Validated willingness-to-pay:** Battle Journal+ proves competitive Pokemon players pay $3/month for personalized match analytics

### What They Do Better
- **Mobile-first tournament UX:** Under-30-second match entry designed for between-rounds use. Best mobile UX in the competitive Pokemon tool ecosystem
- **Freemium conversion funnel:** Free tools build trust and traffic; premium captures value from the most engaged users
- **Cross-device sync model:** Phone at tournament, desktop for analysis — the correct UX pattern for competitive players
- **Data-driven analytics:** Real match data powering actionable insights, not just display
- **TCG Pocket expansion:** Riding the massive TCG Pocket growth wave (2024-2026)

### Weaknesses
- **Zero VGC content:** Operates exclusively in TCG and TCG Pocket as of May 2026
- **No team building or sharing:** Analytics only; no content creation or report features
- **TCG mechanics differ structurally from VGC:** TCG has ~15 deck archetypes per meta vs VGC's near-infinite team variety. Direct feature porting requires significant design adaptation
- **Small premium user base:** Niche tool in a niche market; unclear total subscriber count
- **No community/social features:** Match data is private with no leaderboards, sharing, or community engagement layer

### Strategic Relevance
**LOW as direct competitor, HIGH as monetization blueprint.** Trainer Hill validates that competitive Pokemon players will pay $3/month for match tracking with analytics. This is a proven, adjacent-audience model that VGC Team Report could adapt.

---

## Competitive Landscape Matrix

| Dimension | VGCpastes | Limitless VGC | Trainer Hill | VGC Team Report |
|-----------|-----------|---------------|--------------|-----------------|
| **Primary use case** | Paste repository | Tournament database | TCG match analytics | Team report authoring |
| **VGC coverage** | All regulations | All major events (2013+) | None (TCG only) | Current format |
| **Team narrative/context** | None | None | N/A | Core feature |
| **Player profiles** | None | Tournament-based | Match log (self) | Opportunity |
| **Self-service submission** | Via DM only | Via tournament orgs | Via logging | Yes (paste import) |
| **Mobile UX** | Poor (spreadsheet) | Moderate | Good (mobile-first) | TBD |
| **Monetization** | None (volunteer) | Ads + $2/mo Patreon | $3/mo premium tier | None |
| **Discord presence** | Sandshrew Bot (strong) | None | None | None |
| **Social sharing UX** | Manual screenshots | Generic links | Private data | TBD |
| **Community traction** | Very high (37K X, 8K Discord) | Very high (ecosystem authority) | High (TCG niche) | Early stage |
| **Open source** | Yes (Falinks) | No | GitHub presence | No |
| **Usage/meta stats** | Via Falinks (basic) | Yes (deep, with duo win rates) | Yes (TCG deck win rates) | None |
| **Damage calcs** | None | None | N/A | Player-authored only |

---

## Key Gaps No Competitor Fills

1. **Player voice / team narrative:** Every competitor shows WHAT a team is. Nobody shows WHY it was built. No self-service platform exists for players to explain their choices, matchup plans, and EV rationale
2. **Visual team sharing with social embeds:** Pokepaste links are plain text with no preview images. No tool generates rich Discord/Twitter embeds with Pokemon sprites and team composition at a glance
3. **VGC match tracking:** Trainer Hill proved the model in TCG. Zero VGC tools offer mobile-first match logging with win rate analytics
4. **Player identity for knowledge sharing:** Limitless profiles are tournament-result-based. No platform rewards or tracks knowledge contribution (reports written, views earned, community engagement)
5. **Integrated team analysis:** Auto-generated damage calcs, speed tiers, and meta context embedded in the team authoring flow (Reportworm does some of this but not in a shareable report format)

---

## Top Actionable Takeaways

### 1. Own "the why" — nobody else does
Every competitor answers "what team did they use?" — VGC Team Report is uniquely positioned to answer "why did they build it that way?" This is the strategic moat.

### 2. Rich social embeds are an uncontested UX win
Generate OG images with Pokemon sprites + team composition for every published report. When shared on Discord/Twitter, VGC Team Report links should be visually distinctive. crob.at/pokepaste has proven this approach works but only for plain pastes, not authored reports.

### 3. $3/month VGC match tracker is a validated revenue path
Trainer Hill proved competitive Pokemon players pay for match analytics. Build a VGC-specific version: log opponent's leads, track win rates by archetype, link match logs to authored team reports. Phone-first, under 30 seconds per entry.

### 4. Discord bot for organic discovery
Sandshrew Bot demonstrates that Discord-native access drives usage without requiring website visits. A `/report [player]` or `/find [Pokemon]` bot deployed to VGC Discord servers would be the highest-leverage organic acquisition channel.

### 5. Get listed on Victory Road resources
VGCpastes and Limitless are listed on every major community resource page. VGC Team Report is listed on none. A single backlink on Victory Road's resources page would likely be the highest-ROI acquisition action available.

### 6. Monitor Limitless for narrative features
If Limitless adds a "team write-up" or "player notes" field to their existing team viewer, their data moat + traffic could quickly commoditize VGC Team Report's core value proposition. This is the #1 strategic risk.

---

*Sources: X/@VGCPastes tweet archive, GitHub txfs19260817/falinks-teambuilder, Discord App Directory (Sandshrew Bot), Limitless Patreon membership page, Limitless Patreon blog posts (2025 Q1), Limitless Labs and VGC standings pages, plus.trainerhill.com, Trainer Hill about/tools/Patreon pages, Bulbapedia (Limitless TCG entry), Smogon VGC forums, Victory Road resources, VGCpedia, DevonCorp, VGenC.net, crob.at/pokepaste, Reportworm documentation, Pikalytics, Pokemon-zone.com.*
