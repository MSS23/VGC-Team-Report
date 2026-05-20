# Competitor Teardown: Full Five-Tool Analysis

**Produced:** 2026-05-20
**Analyst:** Claude (Competitive Intelligence Agent)
**Scope:** Pikalytics, PokePaste, VGCpastes, Limitless VGC, and Trainer Hill — feature inventory, UX, monetisation, and gap analysis vs. VGC Team Report (pokemonvgcteamreport.com)
**Method:** WebSearch + cross-referenced community sources, prior research audits from 2026-05-13 (r1-competitor-pikalytics-pokepaste.md, r2-competitor-vgcpastes-limitless.md), and May 2026 update searches. Primary domains return HTTP 403 to automated crawlers — all findings sourced from indexed content, App Store listings, community resource pages, and social media archives.

---

## 1. Pikalytics (pikalytics.com)

### What It Is

The dominant competitive Pokémon statistics and tools platform. Aggregates usage data from Battle Stadium, Pokémon HOME, Pokémon Showdown, and now Pokémon Champions (the 2026 official VGC format). Industry reference for usage rates, EV spread clusters, move distributions, item breakdowns, and teammate synergy. Supports VGC, Smogon OU/Ubers, and GO PvP.

### Feature Inventory

| Feature | Detail |
|---|---|
| **Pokédex / Usage Stats** | Per-Pokémon page: usage %, ability distribution, item distribution, top moves, EV spread clusters, common teammates, counters, Tera type preferences. Filter by regulation and format. Updated monthly from tournament data. |
| **Champions Hub** | Dedicated section for Pokémon Champions 2026 (Regulation M-A): usage rankings, Pokédex, team builder entry, top threats digest. Includes Mega Evolution awareness. |
| **Team Builder** | Build 6-Pokémon teams with suggested sets pulled from meta data. Import/export Showdown paste. Share team via URL or screenshot image. |
| **Meta Calcs (inline)** | Live damage calculator embedded inside Team Builder. Pulls meta-relevant attackers/defenders automatically. Lets users verify spreads without leaving the team-building flow. |
| **Standalone Damage Calculator** | `/calc` — full calc covering weather, terrain, screens, Helping Hand, Intimidate, spread-move split penalties, Mega options. Forked from Smogon calc but Champions-aware. |
| **Top Teams** | Glanceable 6-Pokémon showcase cards from recent tournament results. Expandable to full moveset. Links to Limitless VGC source. Filter by Pokémon or archetype. |
| **Speed Tiers** | `/speed-tiers` — full speed tier reference for current format: base speed, max investment, neutral nature, Choice Scarf. Dedicated Champions-format version added 2026. |
| **Tournament Results** | Historical results viewer with tournament listing. |
| **Gamification / Quizzes** | Three interactive learning tools: **Speed Quiz** (streak-based speed-tier head-to-head), **Calc Quiz** (guess damage bucket from calc string), **Type Quiz** (type matchup mastery including Mega interactions). All log session history. |
| **Articles / Education** | Editorial guides: "Pokemon 101: Where Do I Start?", "Planning My Team", metagame breakdowns. Beginner onboarding pipeline. |
| **Multi-language** | EN, JP, IT, FR, DE, ES, KO, ZH — eight languages. |
| **iOS App** | Paid ($0.99 one-time). 100% ad-free, offline. Usage stats, meta data, team tools, favourites. Android app unpublished August 2024. iOS reviews note feature lag behind website. |

### Monetisation

- **Ko-fi membership** (primary): Monthly tiers. Covers server costs and developer expenses.
- **No paywalled web features**: All stats, team builder, and calc are free.
- **No display ads** on main site (advertise-on-Pikalytics footer link suggests partner deals exist but are not intrusive).
- **iOS app**: $0.99 one-time purchase.

### UX Notes

**Strengths:** Dense data-rich layout power users love. Fast Pokédex → Team Builder → Calc navigation. Meta Calcs integration — live calc with auto-populated meta threats inside the team builder — is the standout feature not replicated anywhere else. Regular monthly data refreshes keyed to regulation changes. Eight languages.

**Weaknesses:** No user accounts or persistent team history on web. No community layer (no comments, ratings, following). Top Teams exit to Limitless, losing the user. Team share is a URL with zero narrative. Mobile app dead on Android. Data updates lag by weeks relative to actual ladder play.

### What Pikalytics Does Better Than VGC Team Report

1. **Meta Calcs inside the team builder.** Seamless loop — build team → verify spreads → adjust → re-check — keeps power users on Pikalytics for hours. VGC Team Report links out to an external calculator.
2. **Authoritative aggregated usage statistics.** Millions of battles aggregated per regulation per format with historical archives to 2017. VGC Team Report has no meta-data layer.
3. **Gamified daily practice loops.** Speed Quiz, Calc Quiz, and Type Quiz are streak-based with session history. Create daily return visits from players practising, not just building. No other VGC tool implements this.

---

## 2. PokePaste (pokepast.es)

### What It Is

Purpose-built pastebin for competitive Pokémon teams. Accepts Pokémon Showdown export format, returns a permanent URL with syntax-highlighted team display. No login required. Open-sourced on GitHub (`felixphew/pokepaste`). Written in Go.

### Feature Inventory

| Feature | Detail |
|---|---|
| **Paste creation** | Paste Showdown export → unique cryptographic URL in seconds. No account needed. |
| **Syntax highlighting** | Pokémon names and moves coloured by type. Items highlighted. |
| **Sprite/image display** | Pokémon sprites and item images per set. Broken for many special forms (Zygarde-10%, newer Galarian/Mega forms). Chrome extension `pokepastefix` maintained by community to patch this. |
| **Notes field** | Freeform text per paste. URLs in notes not clickable without dev tools — known unfixed bug. |
| **Privacy by design** | No public search or browsing by author. URL-only discovery — intentional pre-tournament operational security. |
| **No expiry** | Pastes are permanent. |
| **VGC-aware defaults** | Assumes Level 50 when no level specified — format-correct default. |
| **PokePaste Exporter** | Third-party Firefox/Chrome extension adds export button to Showdown live matches and Limitless team sheets. Supports Mega Pokémon added in Legends Z-A (v1.4.0, April 2026). Multi-team support — exports entire Showdown teambuilder in one link. |
| **Open source** | GitHub: 121 stars, 27 forks. 155+ open issues. Active maintenance in decline. |

### Monetisation

None. Purely a hobby/community project. No ads, no donations page, no subscriptions. Acute sustainability risk: 155 open issues, Chrome extension exists solely to fix sprite bugs, creation failures reported February 2026.

### UX Notes

**Strengths:** Frictionless to the point of invisible. Paste → URL in ~10 seconds with zero cognitive load. De facto community standard — every VGC team shared on Reddit, Discord, Smogon, and tournament systems uses a pokepaste link. Import source for Pikalytics, VGC Team Report, Showdown, and a dozen other tools.

**Weaknesses:** Sprite rot (broken for many forms). No narrative layer — shows *what*, not *why*. No discovery or browsing. Notes field URL bug unfixed for years. No calcs, speed tiers, or meta context. No accounts means no team management or history.

### What PokePaste Does Better Than VGC Team Report

1. **Zero-friction paste-to-URL in under 10 seconds.** No login, no form fields, no decisions. VGC Team Report has measurably higher activation energy for first-time users.
2. **Universal portability and community standardisation.** A pokepaste URL is accepted by every downstream tool. Network-effect moat means players default to it even when better alternatives exist.
3. **Privacy-safe for pre-tournament use.** Cryptographic URL with no public search means teams are safe from opponent discovery. VGC Team Report's public-by-default model is a barrier for players preparing for major events.

---

## 3. VGCpastes (vgcpastes.com / Falinks Teambuilder)

### What It Is

Community-designated canonical team paste repository for VGC. Originated as a volunteer-maintained Google Sheets spreadsheet aggregating tournament-winning teams via Twitter/X DMs and Discord. As of May 2026 operates as a three-layer project:

- **Google Sheets repository** — primary data store, one sheet per regulation
- **Sandshrew Bot** — Discord-native access layer
- **Falinks Teambuilder** (`falinks-teambuilder.com/pastes/vgc/`) — web browsing layer (open-source Next.js)

Active scale May 2026: 1,150+ Regulation H teams; 63+ Regulation I teams at launch; Pokémon Champions Regulation M-A repository now at 135+ replica teams and growing.

### Feature Inventory

**Google Sheets Repository**
Columns per team: Team ID, Player, Event, Placement, Six Pokémon names, Items, Pokepaste URL, EV spread availability flag, Rental code availability, Rental code, Date, Source link, Video/report links, Tera types. Separate sheet per regulation for historical access.

**Sandshrew Bot (Discord)**
- `/search` — filter by Pokémon, item, EV spread availability
- `/get rental` — filter to teams with in-game rental codes
- `/random team` — rerollable paginated results
- `/openteam` — convert paste to Open Team Sheet format for official tournaments
- Under-30-second team retrieval without leaving Discord

**Falinks Teambuilder (Web)**
- Browse/filter repository by regulation, Pokémon, item
- Real-time collaborative team building (Yjs + SyncedStore)
- Import/export Showdown paste or PokePaste URL
- Usage statistics aggregated from the VGCpastes dataset
- Tournament team list parser for Masters Open Team Lists (2023+)

### Monetisation

None. Fully volunteer community project. Zero advertising, premium tier, or Patreon.

### What VGCpastes Does Better Than VGC Team Report

1. **Volume and rental codes.** 1,150+ Regulation H teams with a large subset including in-game rental codes is an unsurpassable data moat for "team I can play right now."
2. **Discord-native discovery.** Sandshrew Bot meets players in their primary communication habitat — zero context switching.
3. **Community trust and canonical placement.** Listed on Victory Road resources, VGCpedia, Smogon sample team threads, every "New To VGC" linktree. First-stop for team discovery for new and returning players.

### Weaknesses (Gaps VGC Team Report Can Exploit)

- UX is literally a spreadsheet. Effectively unusable for mobile browsing.
- No team context: shows what, never why. No matchup strategy, no EV rationale.
- No player profiles. Cannot browse "all teams by [player]."
- No self-service submission — requires DM to a human maintainer.
- No meta analytics — pure paste storage.

---

## 4. Limitless VGC (limitlessvgc.com) + Limitless TCG (limitlesstcg.com)

### What It Is

The most comprehensive tournament data platform in competitive Pokémon. TCG side originated ~2020; VGC side covers all major events from the 2013–2014 season through the current Pokémon Champions era. Operates across four subdomains:

- `limitlessvgc.com` — primary tournament database
- `standings.limitlessvgc.com` — deep standings, pairings, team sheets per player
- `play.limitlesstcg.com` — online tournament management platform (hosts community circuits)
- `labs.limitlesstcg.com` — experimental analytics (TCG-forward)

### Feature Inventory

| Feature | Detail |
|---|---|
| **Tournament Database** | Filter by season, event type (Regional, Intl, Worlds, Special Events, National, Players Cup, MBL), region. Per-tournament: participant count, placements, team lists, usage stats, pairings (where data source permits). Auto-sourced from rk9.gg and playlatam.net. |
| **Team Browser** | Browse top-placing teams across all tracked events. Filter by year, season, tournament type. Cards show: Pokémon, items, Tera types, movesets, player name, placement, event name. |
| **Player Rankings** | Cross-event aggregated performance. Profile pages with full tournament history, records per event, team compositions used. Multiple ranking axes. Time filters by month/season. |
| **Pokémon Usage Statistics** | Usage rates across tracked tournaments, Tera type distribution, item/ability/move usage. **Restricted duo pairings with win rates** (e.g., "Kyogre+Groudon: 28% usage, 54% win rate") — unique in the VGC space. |
| **Online Tournament Platform** | Full Swiss management: teamlist submission, pairings, standings, broadcast. Hosts grassroots community events. Open lists auto-generate metagame overview updated each round. |
| **Circuit Points + Cash Prize Invitational** | Players accumulate circuit points; 400 points earn invitation to Annual VGC Cash-Prize Invitational (~$20K prize pool). "The Grand Champions Festival" featured a $10K prize pool (free to enter). Top 16 series-points finishers advance to Day 2 automatically. |
| **Historical Depth** | Data from 2013–2014 through 2026. No other VGC resource covers this range. |

### Monetisation

- **Consumer tools**: Free — no paywall on any database features
- **Ad removal**: Patreon-based subscription (transitioning to native on-site subscriber model)
- **Tournament organiser layer**: Implied SaaS/commission from organisers using play.limitlesstcg.com infrastructure

### What Limitless Does Better Than VGC Team Report

1. **Tournament data authority.** Automatic pipeline from rk9.gg/playlatam gives neutral, credible, comprehensive results data without editorial overhead.
2. **Restricted duo win rate analytics.** Which legendary pairings are overperforming — unique to Limitless, genuinely useful for teambuilding decisions.
3. **Player profiles with full tournament history.** Cross-event player identity browsable by anyone. Irreplaceable for following top players or researching opponents.
4. **Historical depth (2013–2026).** Irreplaceable for researchers and returning players studying historical formats.
5. **Self-sustaining data flywheel.** Running tournaments automatically populates the database without manual curation effort.

### Weaknesses (Gaps VGC Team Report Can Exploit)

- No narrative content anywhere. Shows composition and results; gives no team concept, matchup strategy, EV rationale, or player voice.
- Not self-service for individual players — data flows only through official tournament providers.
- Fragmented UX across four subdomains.
- No community or social layer — no comments, team saves, following, or sharing with context.
- TCG-first heritage means VGC feature development moves slowly.

**Primary strategic risk from Limitless:** If they add a "player notes" or "team write-up" field to their existing team viewer, they could rapidly own that space given their data moat and existing traffic.

---

## 5. Trainer Hill (trainerhill.com)

### What It Is

A **Pokémon Trading Card Game analytics platform** — not a VGC tool. Zero VGC content as of May 2026. Included because its analytics model, monetisation structure, and mobile-first tournament UX design are directly instructive for VGC product development.

### Feature Inventory

| Feature | Detail |
|---|---|
| **Meta Analysis** | Deck tier lists, win rates for Standard and other TCG formats. Matchup spread charts (deck vs. deck). Card usage trends from PTCGL and in-person tournament data. Dynamic updates as new tournament data ingested. |
| **Decklist Analysis** | Search top tournament decklists with filters for win rates, card usage trends, matchup data, time range, and player count threshold. |
| **Deck Diff / Venn Diagram** | Compare card overlap between two decklists. |
| **Battle Journal (free)** | Log match results: deck, opponent archetype, outcome, turn order, freeform notes. Basic performance view. |
| **Battle Journal+ ($3/month, 7-day free trial)** | Mobile-first fast entry — explicit design target: under 30 seconds per match between rounds. Per-matchup win rates by opponent archetype, custom tags, going-first/second. Cross-device sync. Advanced filtering across full match history. Patreon community: supporters vote on which games and features are added next. |

### Monetisation

- **Core analytics**: Free
- **Battle Journal+**: $3/month after 7-day free trial
- **Patreon community tier**: Feature voting membership

### What Trainer Hill Does Better (as Design Template)

1. **Monetisation validation.** Battle Journal+ proves the competitive Pokémon audience pays $3/month for personalised performance analytics. Willingness to pay confirmed in the adjacent audience.
2. **Mobile-first tournament workflow.** Under-30-second match entry explicitly designed for between-rounds tournament use — a design discipline, not just a feature.
3. **Cross-device sync.** Phone at tournament → desktop for post-tournament analysis is the correct model for competitive players. No VGC tool addresses this.
4. **Freemium conversion funnel.** Free tools drive traffic and trust; premium tier captures value from the most engaged segment. The right structure for this audience.
5. **Community feature voting.** Patreon supporters vote on roadmap — drives retention and product-market fit simultaneously.

---

## Consolidated Comparison Table

| Feature | Pikalytics | PokePaste | VGCpastes | Limitless VGC | Trainer Hill | VGC Team Report |
|---|---|---|---|---|---|---|
| **Core purpose** | Meta analytics + tools | Paste sharing | Curated team repository | Tournament database | TCG match analytics | Team report authoring + sharing |
| **Usage stats (meta data)** | Yes — monthly | No | Partial (from dataset) | Yes — tournament-sourced | Yes (TCG only) | No |
| **Damage calculator** | Yes — inline Meta Calcs | No | No | No | No | No (external link) |
| **Speed tiers reference** | Yes | No | No | No | No | Yes |
| **Player-authored narrative** | No | No (notes, broken URLs) | No | No | No | Yes — core product |
| **Matchup plans / gameplan** | No | No | No | No | No | Yes |
| **EV spread rationale** | No | No | No | No | No | Yes |
| **Team discovery / browsing** | No | No | Yes (filtered) | Yes (tournament teams) | No | Yes — public feed |
| **User accounts** | No | No | No | No | Battle Journal+ only | Yes (Clerk auth) |
| **Social: likes/comments/follow** | No | No | No | No | No | Partial |
| **Fork / clone a team** | No | No | No | No | No | Yes |
| **Rental codes** | No | No | Yes (large subset) | No | No | No |
| **Discord bot** | No | No | Yes (Sandshrew) | No | No | No |
| **Player profiles** | No | No | No | Yes (tournament-based) | Match log (self only) | Opportunity |
| **Mobile app / PWA** | iOS only | No | No | No | iOS/Android | PWA |
| **Multi-language** | Yes — 8 languages | No | No | Partial | No | No |
| **Gamification / quizzes** | Yes — 3 quiz types | No | No | No | No | No |
| **Educational articles** | Yes | No | No | No | No | No |
| **Wrapped / shareable image cards** | Team image share | No | No | No | No | Yes |
| **Tournament data pipeline** | Via Limitless import | No | Community submissions | Automatic (rk9/playlatam) | No | No |
| **Historical data depth** | Yes (2017–) | N/A | Per regulation | Yes (2013–) | TCG only | None |
| **Privacy / pre-tournament mode** | No | Yes — URL-only | No | No | N/A | Public by default |
| **Monetisation** | Ko-fi + iOS $0.99 | None | None | Ad removal (Patreon) | $3/mo premium | None |
| **Community traction** | Very high | Very high | Very high | Very high | High (TCG) | Early stage |

---

## Top 3 Competitor Advantages

### 1. Pikalytics: Meta Calcs + Gamified Retention (Workflow Ownership)

The Meta Calcs feature — live damage calculator with auto-populated meta threats embedded inside the team builder — is the single most powerful retention mechanism in the space. It creates a seamless build → verify → adjust → re-check loop that keeps power users on Pikalytics for hours per session. Combined with three gamified daily quizzes (Speed Quiz, Calc Quiz, Type Quiz), Pikalytics owns the "practice and preparation" session. No competitor replicates either feature.

### 2. VGCpastes + PokePaste: Network Effect Moat on Paste Distribution

PokePaste is the universal interchange format — accepted by Pikalytics, Showdown, Limitless, tournament systems, and VGC Team Report itself. VGCpastes sits on top of this, adding 1,150+ regulation-partitioned teams with rental codes, maintained in a volunteer spreadsheet with Discord-native access (Sandshrew Bot). Together they own the "find a team and start playing immediately" use case with near-zero friction. VGC Team Report requires auth and more steps.

### 3. Limitless VGC: Data Authority + Player Identity Layer

Limitless has the only neutral, automatic tournament-result pipeline (rk9/playlatam), covering every major event from 2013 through 2026. Its player profiles with cross-event tournament history create a credible identity layer no tool can replicate without that data access. The restricted duo win rate feature (e.g., "Kyogre+Groudon: 28% usage, 54% win rate") is unique analytical output unavailable elsewhere. The $20K cash-prize circuit gives it competitive-scene authority VGC Team Report cannot match short-term.

---

## Top 3 Gaps VGC Team Report Can Close

### Gap 1: The Player Voice Layer — Nobody Else Owns This

Every competitor shows *what* a team is. None shows *why*. VGCpastes shows the paste. Limitless shows the tournament result. Pikalytics shows usage data. **No tool hosts self-service structured team reports with matchup plans, EV rationale, damage calc embeds, and player commentary.** Victory Road and MetaGame VGC publish editorial reports but require editorial approval and a writing team. VGC Team Report is the only self-service option in the space.

**Immediate leverage:** Make structured report authoring frictionless enough that players write reports the night after Day 1 at a tournament. The template should guide them through sections — they just fill in the knowledge.

### Gap 2: Zero-Friction Entry + Private Mode

PokePaste's 10-second no-login paste-to-URL is the moat keeping players from switching to richer tools. VGC Team Report's auth-required flow creates measurable activation energy loss. Simultaneously, VGC Team Report's public-by-default model is a dealbreaker for high-level players preparing for events — the exact community influencers who drive adoption.

**Two-sided fix:** (1) Guest/anonymous quick-share — paste Showdown export, get shareable URL with basic report rendering, no login required; auth appears post-share to "save and add notes." (2) Promote unlisted/private report mode prominently in the share flow, not buried in settings.

### Gap 3: Match Tracker + Win Rate Analytics (Validated $3/Month Monetisation)

No VGC tool offers mobile-first match logging with win rate analytics by opponent archetype. Trainer Hill validated that the competitive Pokémon audience pays $3/month for exactly this in TCG. The use case transfers directly: between-round logging at tournament, post-tournament review of weaknesses against specific archetypes.

**Minimum viable:** Log opponent lead pair, your lead, game outcome, match notes (under 30 seconds on mobile). Analyse: win rate by opponent lead and archetype, by game (G1/G2/G3). Link match logs to authored team reports on VGC Team Report. Cross-device sync. This closes the monetisation gap while adding a feature no VGC competitor offers.

---

## 2–3 Actionable Feature Ideas

### Feature Idea 1: Embedded Calc + Auto-Generated Speed/Matchup Tables on Import

**What:** On paste import, automatically generate: (a) speed tier position among format-common Pokémon, (b) damage benchmarks the EV spread is designed to hit/survive, (c) an interactive table embeddable in the report card. Players can then annotate *why* those specific benchmarks were chosen.

**Why now:** Pikalytics' Meta Calcs feature is the primary reason power users don't switch. Closing this gap removes the biggest workflow friction point. Automated generation on import means the report's quality floor rises even for players who don't manually write calcs.

**Effort estimate:** Medium (build on existing Smogon calc fork; auto-population from Champions usage data is the new layer).

### Feature Idea 2: Anonymous Quick-Share → Auth-Gate Upsell

**What:** Add a "quick share" flow — paste a Showdown export, get a shareable VGC Team Report URL with sprite display, stats, and type coverage rendered, with no login required. Show an auth prompt post-share: "Save this to your account to add matchup notes, damage calcs, and publish to the community." 

**Why now:** This directly attacks PokePaste's zero-friction moat. A user who shares a quick-share URL has already seen VGC Team Report's product quality; the auth prompt converts them in the moment of highest intent (they just shared something they're proud of). This is the most direct new-user acquisition lever available.

**Effort estimate:** Low-medium (guest session + report render are largely existing infrastructure; the key change is removing the auth gate from the share entry point).

### Feature Idea 3: VGC Match Tracker (Mobile-First, $3–5/Month Premium)

**What:** In-app match logger designed for between-round tournament use (target: under 30 seconds per entry). Log: opponent lead pair, your lead pair, game outcomes, match outcome, notes. Analyse: win rate by opponent archetype and lead, G1/G2/G3 splits. Link match logs to the authored team report for that tournament. Cross-device sync (phone at tournament → dashboard at home).

**Why now:** Trainer Hill has proven the adjacent TCG audience pays $3/month for this exact feature. No VGC tool offers it. This is simultaneously the clearest monetisation path and a genuine unmet user need. Tying match logs to team reports creates a flywheel: players build a report, use the match tracker at the event, then update their report post-tournament with what they learned. This differentiates VGC Team Report from every competitor in the space.

**Effort estimate:** Medium-high (new data model for match log; mobile UX is the key design constraint; premium billing infrastructure is already justified by user demand data from Trainer Hill).

---

## Community Traction Gap (Non-Feature Risk)

The most urgent non-feature lever is backlink acquisition on community resource pages:

- **VGCpastes** is listed on: Victory Road resources, VGCpedia resources, "New To VGC" linktrees, DevonCorp resources, Smogon sample team threads
- **Limitless VGC** is listed on: Victory Road resources, Smogon tournament circuits, all major community wikis, Liquipedia
- **VGC Team Report** appears on: none of the above (as of May 2026)

Getting listed on Victory Road's resources page is likely the single highest-leverage acquisition action available. Most competitive players use Victory Road as their first stop for tool discovery.

---

## Emerging Risk: In-Game Tool Integration

May 2026 community signals indicate Pokémon Champions is integrating features similar to Pikalytics, LabMaus, Top Cut Explorer, and MunchStats directly into the game client. If Nintendo/TPCi builds in-game analytics natively, it disintermediates third-party analytics tools for the casual/semi-casual audience. VGC Team Report's target audience (players who author detailed reports with matchup notes and EV rationale) is the competitive hardcore — precisely the segment least satisfied by anything Nintendo ships. VGC Team Report's positioning is resilient to this risk.

---

## Sources

- https://www.pikalytics.com/
- https://www.pikalytics.com/champions
- https://www.pikalytics.com/team
- https://www.pikalytics.com/topteams
- https://www.pikalytics.com/calc
- https://www.pikalytics.com/speed-tiers
- https://www.pikalytics.com/speed-quiz
- https://www.pikalytics.com/calc-quiz
- https://www.pikalytics.com/articles
- https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166
- https://pokepast.es/
- https://github.com/felixphew/pokepaste
- https://x.com/VGCPastes/
- https://x.com/VGCPastes/status/1910793869333324057
- https://x.com/VGCPastes/status/2042106878751338822
- https://x.com/VGCPastes/status/2042695109754654984
- https://x.com/VGCPastes/status/2043019220095734204
- https://limitlessvgc.com/
- https://limitlessvgc.com/players
- https://limitlessvgc.com/teams
- https://standings.limitlessvgc.com/
- https://play.limitlesstcg.com/tournaments/?game=VGC
- https://www.trainerhill.com/
- https://plus.trainerhill.com/
- https://champteams.gg/landing
- https://vgenc.net/top-teams
- https://victoryroad.pro/sv-reports/
- https://victoryroad.pro/champions-replica/
- https://pokemonvgcteamreport.com/
- https://addons.mozilla.org/en-US/firefox/addon/showdown-team-sheet-viewer/
- https://chromeextension.google.com/detail/pokepaste-exporter/eehioifimidcjcdlaehajhdeaekmmdne
- https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/
- https://devoncorp.press/resources/up-to-date-vgc-resources
- Prior research: `.swarm/r1-competitor-pikalytics-pokepaste.md` (2026-05-13)
- Prior research: `.swarm/r2-competitor-vgcpastes-limitless.md` (2026-05-13)
