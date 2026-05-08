# Reddit Sentiment Research: VGC Team Building & Sharing Tools
**Research Agent:** R3 (Reddit Sentiment)
**Date:** 2026-05-08
**Scope:** r/VGC, r/stunfisk, broader competitive Pokémon community

---

## Research Method & Limitations

Web search queries were run targeting r/VGC and r/stunfisk specifically with the `site:reddit.com` operator. Reddit's content is largely not indexed well by search engines at the thread/comment level in 2025–2026, so many findings were inferred from:
- Forum mirrors and Reddit aggregators (lr.mint.lgbt, libreddit)
- Smogon Forums discussions that reference Reddit sentiment
- Tool developer notes citing r/stunfisk as a feedback source
- X/Twitter community reactions from VGC players
- Direct tool documentation and community resources that surface pain points

The most usable signal came from indirect sources. Direct Reddit thread content was largely not surfaced by search indexing.

---

## 1. Complaints About Existing Tools

### 1a. PokePaste (pokepast.es)
PokePaste is the de facto standard for sharing Pokémon teams, but community feedback reveals several frustrations:

- **No visual team overview.** PokePaste shows sprites, but provides no matchup analysis, coverage maps, speed tiers, or weakness breakdown. It is a raw text dump with visual polish.
- **Broken image support.** Missing sprites/renders for several Pokémon forms. Community noted inconsistency between old-style sprites and official HOME renders. The Smogon PokePaste thread (page 2) specifically tracks this.
- **URL handling bugs.** URLs placed in the notes field cannot be selected without using browser developer tools.
- **Emoji in nicknames breaks parsing.** A known issue causing "incorrect string value" errors.
- **No format-specific validation.** Pastes don't warn players if a Pokémon is illegal in a specific regulation.
- **Showdown teambuilder rewrite threat (April 2025).** The Showdown developer team proposed changes to the teambuilder that would break PokePaste, Pokebin, and other paste sites. This generated significant community backlash, with community member @aboxoftimbits (Olivia) posting that the changes would "screw over VGC players with little to no care." Showdex (a third-party Showdown extension) eventually added dual-format support (old + new syntax), but the fragility of the ecosystem was exposed.
- **Import friction.** A GitHub feature request (Issue #5758 on the Showdown repo) requested direct import from PokePaste URL instead of requiring users to copy-paste the entire text block. This request has existed for years with no implementation.

### 1b. Pokémon Showdown Teambuilder
- **Mobile experience is poor.** Community members noted VGC Helper actually handles mobile stat-spread viewing better than Showdown.
- **No damage calc integration in the builder.** Players need to juggle multiple tools simultaneously.
- **No matchup planning.** The teambuilder has no way to document strategy or plan leads for known archetypes.
- **VGC-specific features absent.** No built-in speed tier comparisons, no priority notation, no team preview simulation.

### 1c. VGC Helper App
- **Abandoned.** The last update was April 2024 — over a year before this research. Users specifically flagged this as a "major issue." For a competitive game with regulation changes every few months, a stale tool quickly becomes unusable.
- **iOS only.** Android players are excluded.

### 1d. Team Report Ecosystem (General)
- **Fragmented.** Team reports live across: Victory Road, Nimbasa City Post, DevonCorp, Medium posts, Smogon forums, individual player blogs (VGC with Hats), and now VGC Team Report itself. There is no single discoverable archive.
- **No search by Pokémon/archetype.** If a player wants all Miraidon team reports from Regionals 2025, there is no tool that makes this query easy.
- **Desktop-only.** Reportworm explicitly states its "main focus is desktop and laptop screens." Players using phones to prep between rounds at events are underserved.
- **No community team rating.** The sample team threads on Smogon/r/stunfisk have no upvote/rating mechanic tied to tournament results.

---

## 2. Feature Requests People Keep Asking For

Synthesized from tool documentation, GitHub issues, community tool feature lists, and implicit demand gaps:

### High Signal
1. **Direct PokePaste URL import into Showdown** — explicit GitHub issue open for years
2. **Mobile-optimized team view** — VGC Helper was praised specifically for this vs. Showdown
3. **Speed tier comparison across a full team** — explicitly listed as a headline feature by VGC Helper, Reportworm, VGC Trainer (signaling demand)
4. **Built-in damage calc alongside the team sheet** — every serious tool (Porygon Labs, Reportworm, VGC Team Report, ChampTeams.gg) has converged on bundling this
5. **Matchup planning notes** — the "prep doc" concept is referenced across multiple top-player resources; tools that support freeform notes per matchup are considered premium

### Medium Signal
6. **Team discovery by Pokémon/move/item** — VGC.tools and MetaVGC both built filter-by-Pokémon as a headline feature, implying community demand
7. **Regulation-aware validation** — the landscape changes every ~3 months; players want tools that auto-update and flag illegal sets
8. **Public team library with tournament context** — players want to know not just "what's the team" but "where did it place and when"
9. **Rental/replica code alongside paste** — Victory Road and Game8's Team Sharing Board both emphasize rental codes alongside pastes; players want one-stop-shop
10. **Dark mode** — mentioned in VGC Helper's App Store listing as a user request

### Lower Signal
11. **Export to multiple formats simultaneously** — some tools offer Showdown export OR PokePaste but not both in one click
12. **Team versioning** — the VGC with Hats team report ("iterative teambuilding" post from Vancouver Top 4) described evolving a team across 3 tournaments; no tool captures this history

---

## 3. Tools People Recommend and Why

### Pikalytics
- Recommended for **meta data**: usage stats, top team compositions, tournament top teams
- Trusted because it's data-driven from actual ladder/tournament play
- New team builder launched for Pokémon Champions 2026 with Pokedex-first UX

### VGC.tools
- Recommended for **browsable community team library**
- Filter by type, move, ability — closest thing to "Google for VGC teams"
- Supports both Pokémon Champions and Showdown export

### Victory Road
- Recommended for **curated tournament-proven teams with rental codes**
- High trust because teams are sourced from verified tournament results
- Has rental codes ready to use — reduces friction for in-game use

### Reportworm
- Recommended for **automated team analysis from a paste or replay**
- Free, produces offensive/defensive calcs and speed tiers instantly
- Desktop-first limitation noted

### VGC Team Report (pokemonvgcteamreport.com)
- Recommended for **writing and publishing structured team reports**
- Supports Pokémon Champions (Reg M-A), Mega Evolution, damage calcs, matchup plans
- Share link, embed in Discord — reduces friction for content creators

### ChampTeams.gg
- Recommended as **all-in-one free tool**: damage calc + speed tiers + type coverage + Showdown import/export + community teams

### Porygon Labs
- Recommended specifically for **Pokémon Champions Regulation M-A** with Stat Points and Mega Evolution support

---

## 4. Pain Points in the Team-Sharing Workflow

The current workflow for a competitive VGC player who wants to share their team is fragmented and multi-step:

```
Build in Showdown → Export text → Paste to PokePaste → Share URL
     ↓                                  ↓
(No damage calc)               (No matchup notes, no speed tiers,
                                no tournament context)
```

Key friction points identified:

1. **No single destination.** Players spread teams across PokePaste, Google Docs, Discord messages, Twitter/X, Smogon posts, and personal blogs. Teams are hard to find after the fact.
2. **No standardized report format.** Every player writes their report differently. New players don't know what sections to include. Tools that enforce a structure (like VGC Team Report) reduce this friction.
3. **Showdown teambuilder is the chokepoint.** Everything flows through it, but it has no native sharing infrastructure — PokePaste was a third-party fix to a missing feature, not a designed solution.
4. **Regulation churn.** With regulation changes every 3 months, teams become "stale" quickly. Tools that don't update with regulation data become liabilities. VGC Helper's abandonment is the clearest example.
5. **Mobile-last design.** Players often prepare for tournaments on phones. Almost no tool is designed mobile-first. Reportworm explicitly deprioritizes mobile. This is a gap.
6. **No social layer.** Unlike platforms like Game8's Team Sharing Board (which has upvoting and showcasing), most VGC tools have no engagement mechanic. Teams sit in a library with no signal of quality or popularity.

---

## 5. Content Formats That Get the Most Engagement

### What drives engagement based on community evidence:

**High engagement:**
- **Tournament result reports** (war stories with team + narrative) — Medium posts, DevonCorp, VGC with Hats all publish these and drive links/shares
- **Sample teams threads** (Smogon) — thousands of views, referenced constantly as entry points for new players
- **Rental team posts with codes** — Victory Road rental teams, Game8 team board; actionable content (one-click use) gets the most practical engagement
- **Usage stat breakdowns** — Pikalytics content is shared heavily on Twitter/X after tournament weekends

**Medium engagement:**
- **Deep-dive single Pokémon analyses** — featured in metagame discussion threads
- **"X teams to try" listicles** — DevonCorp regularly publishes these (38 teams for Reg M-A, 25 teams for Reg G) and they drive significant traffic
- **Matchup/lead analysis** — VGC guide's team preview and opponent analysis pages are consistently linked

**Lower engagement:**
- **Raw text pastes without context** — a bare PokePaste URL generates minimal discussion
- **EV spread theory without tournament proof** — community is skeptical without placement context
- **Casual RMT posts** — Team Bazaar Tuesday on r/stunfisk is specifically described as "casual setting" relative to RMT; suggests lower stakes / lower engagement

### Platform-specific patterns:
- **Twitter/X:** Short tournament results + team image → high retweets during event weekends
- **Smogon Forums:** Long structured posts with EV justifications + replays → sustained engagement over weeks
- **Discord:** Rapid paste sharing, inline rendering matters a lot
- **Reddit (r/stunfisk, r/VGC):** Team Bazaar Tuesday posts, metagame discussion threads — community prefers well-formatted posts with visual team preview over raw paste links

---

## 6. Competitive Landscape Map

| Tool | Primary Use Case | Gaps |
|------|-----------------|------|
| PokePaste | Share team text | No analysis, no context, no notes |
| Showdown Teambuilder | Build teams | No sharing, no calcs, no notes |
| Pikalytics | Meta stats, top teams | No player-written reports |
| VGC.tools | Browse community teams | No matchup notes, no damage calcs |
| Reportworm | Auto-analysis from paste | Desktop only, no narrative |
| Victory Road | Curated top teams | Manual curation, slow |
| VGC Helper | Mobile helper app | Abandoned, iOS only |
| ChampTeams.gg | All-in-one builder | Community library is newer/smaller |
| VGC Team Report | Write + share reports | Newer; discovery/SEO still building |

---

## 7. Key Opportunities for VGC Team Report

Based on the gap analysis above, the clearest unmet needs that VGC Team Report is positioned to address:

1. **Become the canonical search destination** — filter by Pokémon, move, regulation, placement. No tool does this well today.
2. **Mobile-first report viewing** — almost every competitor is desktop-first. Tournament players prep on phones.
3. **Structured report format with enforced sections** — reduces friction for writers, improves consistency for readers.
4. **Social/quality signals** — upvotes, "used this at Regionals" badges, placement tags.
5. **Rental code + PokePaste + written report in one place** — players currently visit 3+ sites to get all this.
6. **Regulation-aware validation** — flag illegal sets, auto-update when regulations change.

---

## Sources

- [PokePaste: a Pokemon Pastebin | Smogon Forums](https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/)
- [Showdown teambuilder breaking PokePaste (X/Twitter, April 2025)](https://x.com/aboxoftimbits/status/1916546352521138229)
- [Feature Request: Import team from PokePaste URL | GitHub](https://github.com/smogon/pokemon-showdown/issues/5758)
- [VGC.tools — Community Team Library](https://vgc.tools/)
- [Reportworm -- VGC Team and Replay Analysis](https://reportworm.com/)
- [VGC Helper (iOS)](https://vgchelper.com/)
- [ChampTeams.gg](https://champteams.gg/landing)
- [Porygon Labs](https://www.porygonlabs.com/)
- [MetaVGC](https://metavgc.com/)
- [Victory Road Team Reports](https://victoryroad.pro/sv-reports/)
- [Pikalytics](https://www.pikalytics.com/)
- [VGC Team Report](https://pokemonvgcteamreport.com)
- [crob.at — Share Teams](https://crob.at)
- [VGCPastes Twitter](https://x.com/VGCPastes)
- [Team Bazaar Tuesday | r/stunfisk (via mirror)](https://lr.mint.lgbt/r/stunfisk/comments/vmdwyb/team_bazaar_tuesday_post_the_teams_youve_had/)
- [VGC Trainer](https://www.vgctrainer.com/)
- [r/stunfisk Subreddit Stats](https://gummysearch.com/r/stunfisk/)
- [Best Pokemon Team Builders 2025](https://blog.poketeambuilder.app/best-team-builders-2025)
- [Showdex dual-format support](https://github.com/doshidak/showdex/releases)
