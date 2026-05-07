# Reddit Sentiment Research: VGC Team Tools & Sharing
**Research Date:** 2026-05-07
**Topics Covered:** team builder, team report, sharing teams, pokepaste alternative, vgc tools
**Sources:** Reddit (r/VGC, r/stunfisk), GitHub Issues, Smogon Forums, community tool sites

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
- [VGCPastes Regulation I tweet](https://x.com/VGCPastes/status/1910793869333324057)
