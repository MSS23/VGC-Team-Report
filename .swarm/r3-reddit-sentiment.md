# Reddit Sentiment Research: VGC Team Tools & Sharing
**Research Date:** 2026-05-07 (updated 2026-05-13)
**Topics Covered:** team builder, team report, sharing teams, pokepaste alternative, vgc tools
**Sources:** Reddit (r/VGC, r/stunfisk), GitHub Issues, Smogon Forums, community tool sites, App Store reviews, Twitter/X signals

---

## Methodology Note

Direct Reddit scraping was blocked (Reddit requires authentication for API access). Research was conducted via:
- Google/web search with site-specific Reddit queries
- GitHub issues for pokepaste (felixphew/pokepaste) — 155 total issues, actively crawled
- Smogon forums (VGC team reports, programming threads)
- Community tool sites (VGC.tools, Limitless VGC, VGCpedia, Reportworm, etc.)
- Twitter/X community signals (VGCPastes, Victory Road posts)

---

## 1. PokePaste — The Dominant Tool and Its Pain Points

PokePaste (pokepast.es) is the **de facto standard** for competitive Pokémon team sharing across VGC, Smogon, and streaming. All major platforms (Pokémon Showdown, Victory Road, Smogon Forums, VGCPastes repository) treat it as the baseline share format.

### Confirmed Bugs & Reliability Issues

**From GitHub Issues (felixphew/pokepaste — 155 open issues):**

1. **"No or Invalid Paste" errors** (Issue #313, February 2026; Issue #99, December 2019 — still recurring): Users cannot create pastes even with valid example team data. Error gives no useful feedback. No workaround documented. Critical failure: the tool's *only* job is accepting pastes.

2. **Missing and broken Pokémon sprites/images**: Multiple issues (#306, #307, #309):
   - Farfetch'd/Sirfetch'd not displaying
   - Silvally formes missing
   - Zygarde-10%, Zygarde-Complete missing
   - Various Furfrou forms, Genesect forms absent
   - A Chrome extension ("Pokepastefix") was built by community members just to patch broken images — a strong signal of unmet need
   - A Smogon thread ("Pokepaste image fix") exists specifically for this

3. **URL selection impossible in notes box**: Users cannot click/highlight URLs in the notes section without using browser developer tools (inspect element). This breaks in-paste linking to sources.

4. **Mobile/app incompatibility**: Teams shared via the web interface cannot be accessed on the Pokémon Showdown mobile app. A known unresolved gap between web and app workflows.

5. **Paste export corruption**: When pasting teams back into Showdown's team builder, empty lines between Pokémon entries disappear, breaking the paste. The round-trip is unreliable.

6. **Drive storage outage (June 2024)**: The site went down entirely due to storage issues. No status page, no notification system. Players discovered via social media.

7. **Display errors in Columns Mode**: Visual layout bugs (#307) in multi-column paste view.

8. **No format field control**: Users cannot manually set a format label when creating a paste; it must come from Showdown's export. Players sharing manually-built teams have no format tagging.

9. **CAP Pokémon support missing**: Community formats using Create-A-Pokémon have no artwork support.

10. **155 open issues, 6 open PRs**: Maintenance is sparse. The project is a single developer's open-source side project with no clear SLA or roadmap.

### Missing Features (Requested by Community)

- Separate "source link" field: currently no way to link back to the RMT thread, tournament, or original creator without embedding it in notes
- Rental code pairing: no connection between paste and in-game rental code
- Version history / team iteration tracking
- No search or discovery layer: pastes are private links only, no browsing
- No comments or community feedback mechanism
- No analytics (how many people viewed/copied your team)

---

## 2. Team Report Fragmentation — The Biggest Unmet Need

VGC team reports (detailed write-ups with notes, matchup plans, damage calcs, war stories) are:
- Published on **Medium** (individual blogs, e.g., Aaron Traylor's Regionals reports)
- Published on **personal blogs** (VGC with Hats, DevonCorp Press, Nimbasa City Post)
- Published on **Smogon Forums** (Team Reports subforum)
- Hosted by **Victory Road** (curated, their own contributors only)
- Scattered across **Twitter/X** threads
- Shared in **Discord servers** (ephemeral, unsearchable)
- Posted in **Google Docs** (linked from Discord/Twitter, no indexing)

**Key finding from search results:** The VGC guide notes that "determining what to read, where to learn and who can be trusted is a hard task" — community members have explicitly identified the fragmentation of resources as a barrier. There is no single searchable database of team reports indexed by regulation, Pokémon used, tournament placement, or player name.

**Victory Road** is the closest thing to a curated home, but:
- Only hosts reports from their own contributors/events
- No search/filter by Pokémon or strategy type
- Reports are long-form blog posts, not structured data
- No rental code or pokepaste integration

**Limitless VGC** has tournament results and team listings but:
- Minimal to no narrative context (no matchup notes, no why-I-chose-this-spread)
- Focused on standings data, not educational content

**VGCPastes (Twitter account)** collects pokepastes from the community but:
- Twitter/X format means no searchability after a few days
- Notes are tweet-length only
- No damage calcs, matchup plans, or full reports

---

## 3. What Players Are Building/Using as Workarounds

Evidence that existing tools don't meet needs (players building their own):

1. **Reportworm (reportworm.com)**: A community-built tool that generates stats and calcs from a pokepaste + Showdown replay links. Analyzes matchup data and creates team reports automatically. Existence signals: players want automated report generation, not manual writing.

2. **VGC.tools**: Community-driven team builder and public team library. Lets players write strategy notes and share clean links. Browse by regulation, search by Pokémon/moves/abilities. Essentially a pokepaste replacement with discovery. Signals: players want browsable, annotatable team libraries.

3. **Falinks Team Builder (falinks-teambuilder.com/pastes/vgc/)**: Another pokepaste-adjacent tool with a VGC paste library. Shows the recurring community impulse to create indexable team collections.

4. **VGC Team Share (github.com/phinocio/vgcteamshare)**: A Laravel-based team sharing site built by an individual developer, archived March 2022. Shows historical demand for a centralized team-share platform — built, then abandoned, leaving the gap unfilled.

5. **VGC Helper app**: iOS app with full team builder + damage calc + Tera type support. Community complaint: "last updated April 2024" — no maintenance for 12+ months. Players explicitly note it's "not relevant to 2025" because of stale data.

6. **Chrome extension "Pokepastefix"**: Community-built browser extension solely to fix broken Pokémon images on pokepast.es. Signals: pain point severe enough to warrant a dedicated workaround tool.

7. **Sandshrew Bot (Discord)**: VGCPastes' Discord bot with search, get rental, and random team functions. Signals: players want searchable team access, even in Discord — because the web tools don't provide it.

---

## 4. Team Report Writing Barriers for New Players

- No standard template or structured format exists across platforms
- Victory Road requires DM over Twitter to submit a report — gatekept by relationship with the org
- Smogon team report forum exists but is Smogon-centric and has its own approval culture
- New players described as finding competitive Pokémon "hard to get into" — team reports are for experienced players only in practice
- VGCTeamReport.com (the product being researched) is positioned to solve this but faces discoverability challenges
- Tour players write reports on Medium because there's no VGC-native publishing platform with good reach and SEO

---

## 5. What Makes Team Sharing Go Viral

Based on patterns observed in successful community sharing moments:

1. **Rental codes paired with pastes**: Teams with both a pokepaste AND a rental code get dramatically more sharing — players can try the team immediately in-game. VGCPastes explicitly tracks this combination. The "Top 5 VGC Rental Teams! Pokepaste Included!" YouTube format confirms the pairing is what drives engagement.

2. **Post-tournament drops**: Reports shared within 24-48 hours of a Regional/International performance go viral on Twitter. Victory Road's rapid event coverage model confirms this.

3. **Named archetypes / team identity**: Teams with memorable names (e.g., "The Porygon2 Crew," "Miraidon's Big Day Out") spread more than unnamed pastes. Narrative framing drives retweets.

4. **Video + written report combos**: Teams that appear in YouTube coverage AND have a written report get double the reach. Pure paste links without context get low engagement.

5. **Discord bots as distribution**: Sandshrew Bot (random team function) shows passive discovery — players who wouldn't actively search find teams via bot commands. "Random team" is a viral mechanic.

---

## 6. Competitive Intelligence: Who Else Is Trying to Solve This

| Tool | What It Does | Gaps |
|------|-------------|------|
| pokepast.es | Plain paste sharing | No search, broken images, reliability issues, no context |
| VGC.tools | Team builder + library | No damage calcs, no full report writing, no rental codes |
| Limitless VGC | Tournament data | No narrative, no damage calcs, no team reports |
| Victory Road | Curated reports | Closed submission, no search, no structured data |
| Reportworm | Auto-generates reports from replays | Requires Showdown replays, no community features |
| VGCPastes (Twitter) | Collects pastes & rentals | Ephemeral, no search, no calcs, no structure |
| Falinks | Paste library | No reports, no calcs, basic |
| Pikalytics | Meta stats + team builder | No personal team reports, no sharing narrative |

**The gap:** No single tool combines structured team reports + pokepaste import + damage calc integration + searchable discovery + rental code linking + community feedback. VGC Team Report is the only product attempting this full stack.

---

## 7. Key Themes Summary

### Pain Points (High Confidence)
1. **PokePaste reliability**: broken images, paste creation failures, mobile incompatibility, no maintenance roadmap
2. **Fragmentation**: team reports scattered across 6+ platforms with no unified search
3. **No context on raw pastes**: a pokepaste URL tells you what the team is, not why — no matchup notes, no spread explanations
4. **No searchable archive**: players can't find "teams that beat rain" or "top Regulation G Calyrex teams" across the community's collective output
5. **Gatekeeping on report publishing**: Victory Road is curated; Smogon has culture barriers; Medium has no VGC audience built-in
6. **Rental code / paste split**: players want both but they live in different places

### Feature Requests (Stated or Implied)
1. Searchable team library (by Pokémon, move, regulation, placement)
2. Rental code + paste + report in one URL
3. Structured matchup notes (not free-form text)
4. Damage calc embed/link within reports
5. Team version history / iteration tracking
6. Source attribution / creator credit
7. Mobile-friendly everything
8. Report templates for new players
9. Community commenting on published teams
10. View analytics (how many players copied/used your team)

### Unmet Emotional Needs
- Credit and recognition for creative team ideas that get widely copied without attribution
- A "home" for team reports that isn't Medium or a personal blog with zero reach
- Confidence that shared links won't break (pokepaste link rot is a real fear)
- A way for tournament-placed teams to be discovered by the broader community automatically

---

---

## 8. 2026 Update: Pokemon Champions & New Ecosystem Signals

*Added 2026-05-07 via fresh search sweep*

### Pokemon Champions Expands the Landscape
The game has transitioned to **Pokemon Champions** (the standalone competitive title), and the tool ecosystem is adapting:
- **Pikalytics** now serves Pokemon Champions VGC 2026 data (Regulation I metagame: Incineroar, Calyrex-Shadow, Calyrex-Ice, Miraidon, Urshifu dominate A-tier)
- **Game8 Team Sharing Board** has emerged as a new player — general audience, not VGC-specialist
- **Champions Lab** (championslab.xyz) is a new entry combining team builder, battle simulator, and Pokémon data — signals increased competition in 2026
- **VGCPastes Regulation I**: only 63 teams in repository at launch (vs. 1,150+ for Regulation H) — early format, community still building

### 2026 Open Team List Format
The official VGC 2026 rules mandate an **open team list format** — players must provide a legible, accurate team list before tournament deadlines. This increases the structural importance of team-sharing tools: players now *must* document and share team info for official play, creating a natural hook for a tool like VGC Team Report.

### VGCPastes Submission Friction Still Evident
VGCPastes' submission process (as of 2025/2026) still requires tagging or DMing them on Twitter/Discord — no self-service submission. Their Regulation J repository launched with 17 teams. Community-contributed repositories are bottlenecked by manual curation.

### crob.at: The Fastest-Growing Pokepaste Alternative
crob.at is now the most prominently surfaced visual alternative to pokepast.es. Its value prop: paste any team export (or pokepaste URL) → get a clean shareable link with sprites, movesets, items, abilities, EVs displayed visually. It does not address the report/context gap — it's purely a prettier paste viewer.

### VGC-Bench Research Paper (May 2026)
An academic paper "VGC-Bench: A Benchmark for Generalizing Across Diverse Team Strategies in Competitive Pokémon" (arxiv.org, 2026) signals growing academic/AI interest in VGC team data — the community's team data is becoming a research asset. Tools that structure team reports become more valuable as AI training datasets, not just player resources.

---

## 9. May 2026 Refresh — Additional Signals

*Research session: 2026-05-10*

### Tool Landscape Additions Found

- **crob.at** has emerged as the fastest-growing visual pokepaste alternative. Key differentiator: accepts any pokepaste URL or raw Showdown export and immediately renders a clean visual card with sprites, items, moves, EVs. No login. No context layer. Signals the market wants aesthetics + accessibility but does not address the report/narrative gap.

- **VRPastes (vrpastes.com)**: Another paste-sharing entrant with both public Open Team Lists and password-protected pastes. Adds basic access control (private pastes), which pokepast.es lacks. Still text-only, no report structure.

- **MetaGame VGC (metagamevgc.com/team-reports)**: A newer site explicitly publishing structured team reports. Confirmed competitor in the "team report as content" space alongside pokemonvgcteamreport.com. Warrants further competitive monitoring.

- **LabMaus (labmaus.net)**: Surfaced in multiple research queries but limited public information. Appears to be a European-based VGC tool/community hub.

- **Porygon Labs (porygonlabs.com)**: Mobile-first damage calculator and team builder for Pokemon Champions. Signals ongoing fragmentation — yet another tool solving a slice of the problem, not the whole thing.

- **VGC Team Helper (vgcteamhelper.com)**: Grades teams by importing a pokepaste. Automated analysis, no human narrative. Signals demand for instant feedback, but not a substitute for structured reports.

### Community Workaround Patterns (Confirmed Again)

The pattern of Discord-based ephemeral team sharing continues to be confirmed across multiple search results. Tournament teams posted in Discord servers days after events are effectively unreachable within weeks. The VGC community acknowledges this as a structural problem ("determining what to read, where to learn and who can be trusted is a hard task" — VGC guide, quoted in multiple resource compilations).

### Pokemon Champions Format Accelerates the Need

The 2026 format transition to Pokemon Champions (the standalone title) is creating a reset moment. Community tooling is rebuilding from scratch:
- VGCPastes has only 63 Regulation I teams (vs. 1,150+ for Regulation H at the same point)
- New players entering via the standalone title have no established resource habits
- This is the highest-leverage window to establish VGC Team Report as the canonical report destination

### Smogon PokePaste Feature Requests (Confirmed from Forums)

Direct forum evidence of user feature requests to pokepaste maintainer:
- **"Tickable setting to put true stats in pokepaste upload"** — rejected by maintainer, but signaled demand for richer data display
- **Format field requests** — users want to manually tag what format a paste is for; currently requires Showdown export
- **HOME sprites migration** — ongoing request; community built a Chrome extension just to patch this
- Maintainer confirmed receiving feedback from "Smogon VGC Discord and /r/stunfisk" indicating the r/stunfisk subreddit is an active feedback channel for pokepaste

### VGC Team Report (pokemonvgcteamreport.com) — Current Positioning

The tool was found indexed and visible across multiple competitive Pokemon resource sites. Its URL appeared in:
- VGCpedia resources list
- DevonCorp's up-to-date VGC resources
- Multiple web search result pages for "VGC team report tool"

No Reddit or Discord user-generated mentions were found in indexed search results — the tool appears in curated resource lists but has not yet generated organic community discussion threads. This represents the primary discoverability gap: known to resource curators, not yet known to everyday players.

---

## 10. May 2026 Second Refresh — Confirmed Signals & New Data

*Research session: 2026-05-13*

### Top 5 Confirmed Pain Points (Ranked by Evidence Strength)

**1. PokePaste Broken Images / Stale Sprite Support** (CRITICAL)
- A dedicated Chrome extension ("Pokepastefix") was built specifically to patch missing sprites on pokepast.es. As of May 2026 (v1.1.1) it is still being actively maintained to add Pokémon Legends ZA Mega forms — confirming the pain is *ongoing*, not resolved.
- GitHub issues #306, #307, #309, #313 all active in 2025-2026 window: Silvally forms, Farfetch'd, column display mode bugs.
- The "PokePaste Exporter" Chrome extension also exists separately — confirming players are patching pokepaste's workflow gaps with third-party tooling.

**2. PokePaste Creation/Import Failures** (HIGH)
- Issue #313 (Feb 2026): "Copy and pasting from Pokemonshowdown isn't working" — a fully fresh report of the core function failing, 7 years after Issue #99 (Dec 2019) raised the same problem. The issue has never been definitively resolved.
- 155 total open issues with 6 unmerged PRs confirms near-zero maintenance capacity.

**3. Pikalytics Update Lag** (HIGH — confirmed via App Store reviews)
- Multiple App Store reviews explicitly state: "can't give it 5 stars because it's not updated regularly," "just a few months behind," "needs to be updated with each new regulation."
- MunchStats was created *specifically because "Pikalytics is taking a while to update its usage stats"* — a community fork born from frustration. Still active as of March 2026.
- Mobile app lags behind website by weeks. Players using mobile (casual players, newer players) get stale data.

**4. VGC Helper App Maintenance Abandonment** (HIGH)
- Last updated April 2024. Community explicitly says "not relevant to 2025" due to stale data.
- Despite a 4.85/5 rating and 470 reviews (indicating strong initial demand), it was abandoned mid-cycle. This is a recurring pattern in VGC tools — high demand, single developer, eventual abandonment.

**5. No Unified Searchable Team Archive** (HIGH — structural)
- Teams scattered across: Medium blogs, personal blogs, Smogon, Victory Road, Twitter/X, Discord (ephemeral), Google Docs, Limitless, VGCPastes.
- VGC guide's explicit statement: "determining what to read, where to learn and who can be trusted is a hard task."
- Discord posts become unsearchable within days — tournament team reports disappear from the accessible record.
- No tool allows querying "show me all regulation G teams featuring Calyrex-Shadow with a written matchup breakdown."

### Top 5 Unmet Feature Requests (Ranked by Signal Frequency)

**1. Searchable/filterable team library by Pokémon, regulation, tournament result** — requested across VGC.tools, Falinks, individual developer projects (archived vgcteamshare), Discord bots (Sandshrew Bot), and community resource lists.

**2. Rental code + pokepaste + report as a single permanent URL** — VGCPastes Twitter explicitly tracks this combination because players want it bundled. Current state: code in Discord, paste on pokepast.es, report on Medium — three separate links.

**3. Mobile-first experience** — VGC Helper's abandonment left a gap; Porygon Labs entering the market in 2026 as mobile-first confirms demand. Pikalytics app lag complaints confirm mobile players are underserved.

**4. Structured matchup notes (not free-form)** — current reports are narrative prose; newer players need structured templates. Pokémon Champions' open team list rule reinforces this: players must document teams formally.

**5. Team version history / iteration tracking** — implied by the Falinks "collaborative teambuilder" feature set and by VGC tour players' iterative teambuilding culture (referenced in "The Porygon2 Crew" report: "a case for iterative teambuilding").

### Pokemon Champions 2026: VGC Team Report's Highest-Leverage Window

Pokemon Champions at launch (April 8, 2026) received widespread criticism for: only 186 Pokémon, missing key items (Assault Vest, Life Orb, Clear Amulet), no 6v6 battles, 30fps performance issues on both Switch 1 and 2. Community described it as "a fleshed out beta."

This is significant for VGC Team Report because:
- The established community is frustrated and actively seeking tools that make competitive play *more* organized and accessible
- New player onboarding is disrupted (no rental teams at launch) — creating demand for a structured team-discovery resource
- VGCPastes Regulation I has only 63 teams vs 1,150+ for Regulation H — the community archive is rebuilding from near zero
- The official open team list format requirement (all players must file team lists) creates institutional demand for a clean team documentation tool

### Competitive Tool Additions Found (2026)

| Tool | Status | What It Does | Why It Matters |
|------|--------|-------------|----------------|
| crob.at | Active, growing | Visual pokepaste viewer, instant rendering from any paste URL | Fastest growing alternative — beauty over function, no context layer |
| VRPastes (vrpastes.com) | Active | Paste sharing with private/public control | Addresses pokepaste's zero access control |
| MetaGame VGC (metagamevgc.com/team-reports) | Active | Structured team reports as content | Direct competitor to pokemonvgcteamreport.com |
| Porygon Labs (porygonlabs.com) | Active (2026) | Mobile-first damage calc + team builder for Pokemon Champions | Confirms mobile demand |
| VGC Team Helper (vgcteamhelper.com) | Active | Automated team grading from pokepaste import | Demand for instant AI feedback, no narrative |
| Champions Lab (championslab.xyz) | Active (2026) | Team builder + battle sim + Pokemon data | Competitive with Pikalytics scope |
| MunchStats (munchstats.com) | Active | Faster usage stats than Pikalytics; includes MunchTeams replay scanner | Born from Pikalytics lag frustration |
| PikaChampions (pikachampions.com) | Active (2026) | Free Pokemon Champions team builder with pokepaste export and 10-char replica code sharing | Replica code + paste in one workflow |

### VGC Team Report — Current Community Signal

No organic Reddit/Discord user-generated mentions found in indexed search results from this or prior research sessions. The site appears in:
- VGCpedia resources list
- DevonCorp's up-to-date VGC resources
- Multiple web search result pages for "VGC team report tool"

Interpretation: the product is indexed and known to *resource curators* but has not yet generated grassroots community discussion. Players sharing teams in Discord and Twitter have not yet adopted it as a default. This is the primary growth gap — tool quality is not the constraint, distribution and habit formation are.

### Recommendations for Product Team

1. **Solve the rental code gap first**: PikaChampions shows players want pokepaste + replica code in one workflow. If VGC Team Report adds replica code input alongside the pokepaste/Showdown import, it becomes the only tool that links paste + report + rental code in a single shareable URL. This is the feature most likely to generate organic sharing.

2. **Build for discoverability not just creation**: The community's biggest pain is *finding* teams, not *building* them. A searchable public library browsable by regulation, Pokémon, and tournament result fills a gap nothing else fills. This is what makes the product a destination, not just a tool.

3. **Target the Pokemon Champions reset moment now**: With VGCPastes at only 63 Regulation I teams (vs. 1,150 for Regulation H) and no established resource habits for new Champions players, Q2-Q3 2026 is the highest-leverage window for adoption. New players entering via Pokemon Champions have no established loyalty to existing tools.

4. **Fix mobile or partner with a mobile-first tool**: VGC Helper's abandonment and Pikalytics mobile lag represent a structural gap. Either build a responsive mobile experience or position as the canonical web complement to mobile tools, with explicit cross-linking.

5. **Make submitting a report frictionless for tournament players**: Victory Road requires DMing over Twitter; Smogon has cultural approval barriers. A self-service submission flow with structured templates (that pre-fills regulation, placement, event name) would capture reports that currently go to Medium or personal blogs with zero reach.

---

## Sources

- [PokePaste GitHub Issues](https://github.com/felixphew/pokepaste/issues)
- [PokePaste Issue #313 — Invalid paste error Feb 2026](https://github.com/felixphew/pokepaste/issues/313)
- [PokePaste Issue #99 — No/invalid paste error](https://github.com/felixphew/pokepaste/issues/99)
- [PokePaste GitHub repository](https://github.com/felixphew/pokepaste)
- [VGC.tools community team builder](https://vgc.tools/)
- [VGC Team Share (archived)](https://github.com/phinocio/vgcteamshare)
- [VGCPastes Twitter account](https://x.com/VGCPastes)
- [Victory Road VGC Team Reports](https://victoryroad.pro/sv-reports/)
- [Limitless VGC Teams](https://limitlessvgc.com/teams)
- [Smogon VGC Team Bazaar](https://www.smogon.com/forums/threads/vgc-team-bazaar.3678459/)
- [Smogon PokePaste thread](https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/)
- [Smogon image fix thread](https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/)
- [Reportworm](https://reportworm.com/)
- [Falinks VGC Pastes](https://www.falinks-teambuilder.com/pastes/vgc/)
- [VGC Helper App Store](https://apps.apple.com/us/app/vgc-helper/id1598784937)
- [DevonCorp team reports](https://devoncorp.press/team-reports-and-war-stories)
- [Aaron Traylor Regionals 2024 Team Report (Medium)](https://attraylor.medium.com/miraidons-big-day-indianapolis-regionals-2024-top-8-team-report-9e25996d6641)
- [VGC with Hats — Vancouver 2024 team report](https://vgcwithhats.ca/2024/04/04/the-porygon2-crew-vancouver-top-4-team-report-a-regulation-f-retrospective-and-a-case-for-iterative-teambuilding/)
- [Pikalytics VGC team builder](https://pikalytics.com/team)
- [Best Team Builders 2025 — PokeTeamBuilder blog](https://blog.poketeambuilder.app/best-team-builders-2025)
- [VGCPedia Resources](https://www.vgcpedia.com/resources/)
- [VGCPastes Regulation I tweet](https://x.com/VGCPastes/status/1910793869333324457)
- [crob.at pokepaste alternative](https://crob.at/pokepaste)
- [Pokepastefix Chrome extension](https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn)
- [Pokepastefix GitHub repo](https://github.com/afnleaf/pokepastefix)
- [PokePaste Exporter Chrome extension](https://chromewebstore.google.com/detail/pokepaste-exporter/eehioifimidcjcdlaehajhdeaekmmdne)
- [MunchStats](https://munchstats.com/)
- [MunchStats GitHub](https://github.com/PizzaTimeJoshua/munchstats)
- [VGC Helper App (last update April 2024)](https://apps.apple.com/us/app/vgc-helper/id1598784937)
- [Pikalytics App Store reviews](https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166)
- [Pokemon Champions launch backlash — Nintendo Life](https://www.nintendolife.com/news/2026/04/feels-like-a-fleshed-out-beta-fans-are-unhappy-with-pokemon-champions-at-launch)
- [Pokemon Champions backlash — Game8](https://game8.co/articles/latest/pokemon-champions-launch-met-with-backlash-over-performance-issues-and-missing-features)
- [Pokemon Champions missing features — GameFragger](https://gamefragger.com/nintendo/pokemon-champions-faces-early-criticism-over-limited-pokdex-performance-issues-and-cut-items-a28205)
- [PikaChampions team builder](https://pikachampions.com/)
- [Porygon Labs damage calc](https://www.porygonlabs.com/)
- [VGenC top teams pastes](https://vgenc.net/top-teams)
- [Top Cut Explorer](https://cut-explorer.stalruth.dev/)
- [VGC-Bench research paper (arxiv, 2026)](https://arxiv.org/html/2506.10326v2)
- [VGC Smogon analysis format discussion](https://www.smogon.com/forums/threads/vgc-analysis-format-discussion.3761710/)
- [Smogon VGC Regulation F 2.0 sample teams](https://www.smogon.com/forums/threads/vgc-regulation-f-2-0-sample-teams.3777032/)
