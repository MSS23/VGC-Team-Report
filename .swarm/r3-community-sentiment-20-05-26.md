# VGC Community Sentiment Research — May 20, 2026
**Agent:** R3 UX Research
**Date:** 2026-05-20
**Sources:** Web search (Google), GitHub Issues (pokepaste), Smogon Forums, community tool sites (Reportworm, VGC.tools, crob.at, ChoiceSpecs, Pikalytics, MetaGame VGC, VS Recorder), Twitter/X community signals, App Store reviews, Pokemon.com community forums
**Reddit Access:** Blocked (authentication required). Signals inferred from Google-indexed Reddit content, Smogon, and community tool sites.

---

## Methodology

Direct Reddit fetching was blocked. Research was conducted via:
- 20+ targeted Google searches with site-restricted and keyword-specific queries
- Community tool site analysis (feature gaps inferred from what tools were built)
- GitHub open issues (pokepaste: 155 open issues as of May 2026)
- App Store user review signals
- Pokemon.com community forum threads
- Academic paper signals (VGC-Bench, May 2026)
- Workaround tool analysis (if the community built it, the pain was real enough)

---

## 1. Top 5 Unmet Needs

### 1.1 Unified, Searchable Team Report Archive (CRITICAL)
**Evidence strength: Very High**

Team reports are scattered across at minimum 6 distinct platforms with no cross-platform search:
- Personal blogs (VGC with Hats, DevonCorp Press, Nimbasa City Post)
- Medium (e.g., Aaron Traylor's Regionals reports, EvanSmoakVGC)
- Smogon Forums Team Reports subforum (requires account, culture barrier for new players)
- Victory Road (curated — submission only by DM on Twitter, relationship-gated)
- Discord servers (ephemeral — teams posted post-tournament are unreachable within weeks)
- Twitter/X threads (no permanence, 280-char limit crushes context)
- Google Docs linked from Discord (no indexing, no search, link rot)

The VGC guide explicitly notes: *"Determining what to read, where to learn and who can be trusted is a hard task"* — players have named fragmentation as a barrier to getting better.

**What's missing:** A single, searchable database of team reports indexed by regulation, Pokémon, tournament placement, and player name. No tool currently provides this across the full community output.

---

### 1.2 Context Layer on Top of Raw Pastes (HIGH)
**Evidence strength: High**

A PokePaste URL tells you *what* a team is but not *why*. Community signals confirming this gap:
- Reportworm (reportworm.com) was community-built specifically to auto-generate matchup context from replays — demand for context is strong enough to warrant a dedicated tool
- VGC.tools was built to add annotatable strategy notes to team libraries
- VS Recorder (github.com/Pocolip/vs-recorder) was built to add win rates, lead patterns, move frequency tracking to pastes
- MetaGame VGC (metagamevgc.com/team-reports) launched to publish structured, narrative team reports as a format improvement over raw pastes

**What's missing:** Matchup notes, spread reasoning, lead patterns, and war-story context living in the same URL as the paste itself. Players build workaround tools because the paste alone is not enough.

---

### 1.3 Rental Code + Paste + Report in a Single Share Link (HIGH)
**Evidence strength: High**

The community has clearly identified that the best team sharing combines:
1. The raw pokepaste (build data)
2. A rental code (instant in-game access)
3. Context/report (how to actually play it)

Evidence:
- VGCPastes explicitly tracks the rental code + paste pairing as a key metric
- "Top 5 VGC Rental Teams! Pokepaste Included!" is a confirmed high-engagement YouTube format
- Victory Road hosts a dedicated "Rental Teams" page separate from reports — the split is itself a pain point
- Game8's Team Sharing Board for Pokemon Champions integrates replica team IDs — signals the community wants this pairing

No single tool combines all three in one URL. Players must assemble the three pieces from different sources.

---

### 1.4 Structured Replay + Performance Tracking (MEDIUM-HIGH)
**Evidence strength: Medium-High**

Multiple community-built tools address this gap, confirming the demand:
- **Reportworm**: auto-generates team reports from a pokepaste + Showdown replay URLs, tracks usage stats and matchup data over time
- **VS Recorder** (Pocolip, GitHub): replay analyzer that parses battle logs for win rates, lead patterns, tera usage, matchup spreads, opponent prep
- **Bauerdad's PASRS Tool**: replay-parsing tool for tracking what's working and what's not across test games
- **VGC Stats app** (iOS/Android): queries usage stats from Home, Showdown, Limitless, and Championships

None of these integrate with a team *report* — they generate data but not the full narrative + context layer.

---

### 1.5 Mobile-Optimized Team Building and Sharing (MEDIUM)
**Evidence strength: Medium**

The Pikalytics app (iOS) consistently draws complaints:
- "The app doesn't have the damage calculator, which is one of the best features on the website"
- "The app lacks team building support"
- "Can't see EVs, abilities, or personalities on the paid app that you can see on the free website"
- VGC Helper (iOS) was the most feature-complete VGC mobile app — its last update was April 2024, and community has explicitly noted it's "not relevant to 2025 team building"

Players increasingly browse community content on mobile but most VGC tools are desktop-first or have crippled mobile versions.

---

## 2. Most Requested Features Not in Current Tools

Based on inferred community demand from workaround tools built, feature requests filed, and App Store complaints:

| Feature | Evidence Type | Tools Addressing It Partially |
|---------|--------------|-------------------------------|
| Search teams by Pokémon / move / regulation | Workaround built (VGC.tools, Sandshrew Bot) | VGC.tools, Pikalytics (meta only) |
| Rental code paired with paste | Community curation effort (VGCPastes) | Victory Road (separate page), Game8 |
| Matchup notes / spread reasoning in-paste | Multiple tools built around this gap | Reportworm (auto), VS Recorder |
| Team version history / iteration tracking | Mentioned as missing in pokepaste issues | None |
| Source attribution / creator credit | Mentioned in pokepaste issues | None |
| View analytics (how many copied your team) | Mentioned in pokepaste issues | None |
| Community commenting on published teams | Inferred from RMT patterns (pokemondb, Smogon) | Smogon RMT forum only |
| Damage calc embed within reports | Multiple tools adjacent (Pikalytics calc, Porygon Labs) | None integrated with reports |
| Report templates for new players | VGC guide mentions barrier | None |
| Structured open team sheet (digital, shareable) | OTS Chrome extension built | VGC OTS Chrome extension |

---

## 3. Pain Points with Existing Tools

### 3.1 PokePaste (pokepast.es) — De Facto Standard, Severely Under-Maintained

**155 open GitHub issues as of May 2026.** Single developer, no SLA.

Confirmed pain points:
- **Broken sprites**: Farfetch'd, Silvally formes, Zygarde-10%, Zygarde-Complete, multiple DLC Pokémon missing. Community had to build a Chrome extension ("Pokepastefix", v1.1.1 still actively maintained May 2026) just to see correct images.
- **Paste creation failures**: Issue #313 (Feb 2026) — "Copy and pasting from Pokémon Showdown isn't working." This is the core function of the tool, and it fails. The same bug was filed in Issue #99 (December 2019) and never definitively resolved.
- **Drive storage outage (June 2024)**: Site went down entirely. No status page, no notification. Players discovered via social media.
- **Mobile incompatibility**: Teams shared via web cannot be accessed on the Pokémon Showdown mobile app.
- **Paste export corruption**: Round-trip paste (Showdown → pokepaste → back to Showdown) is unreliable due to empty line handling.
- **No search or discovery**: Pastes are private links only. No browse, no discovery, no community layer.
- **No format tagging**: Cannot manually set a format label; must come from Showdown export.
- **No comments / feedback mechanism**: Drop the link, get nothing back.
- **Feature requests rejected**: "Tickable setting to put true stats in pokepaste upload" — explicitly rejected by maintainer. Feature development is essentially frozen.

---

### 3.2 Pikalytics — Best Meta Stats Tool, but Team Builder and Mobile Are Weak

- Mobile app is significantly behind the website: no damage calculator, no team builder (these are on the web only), outdated data
- No personal team report publishing
- No narrative layer — usage stats and meta data only, no "why this team" context
- Team builder does not generate shareable reports — outputs a pokepaste link only

---

### 3.3 VGCPastes (Twitter/X account) — Community Curation That Doesn't Scale

- Submission requires tagging or DMing on Twitter/Discord — no self-service
- Regulation I repository launched with 63 teams (vs. 1,150+ for Regulation H at equivalent stage) — curation bottleneck is real
- Twitter format means no searchability after a few days (teams from a month ago are effectively lost)
- Notes are tweet-length only — no calcs, no matchup plans, no war story
- No versioning, no creator profiles, no discovery beyond scrolling the feed

---

### 3.4 Victory Road — Curated but Gatekept

- Submission only via Twitter DM — requires knowing the org personally
- No search/filter by Pokémon, strategy, or regulation
- Reports are long-form blog posts, not structured data
- No rental code or pokepaste integration embedded in reports
- Coverage is strong for top-placing players at major events; near-zero for regional players or online tournament results

---

### 3.5 Limitless VGC — Tournament Data Without Context

- Excellent for standings and team listings
- Minimal to no narrative: no matchup notes, no spread explanations, no war stories
- Focused on data, not education
- A player finding a team on Limitless has no idea how to pilot it

---

### 3.6 VGC Helper (iOS) — Best Mobile App, Now Abandoned

- Last update: April 2024
- Community explicitly notes it is "not relevant to 2025 team building"
- 12+ months of stale data in a format that changes every few months
- Leaves a large gap in mobile-first team building with no maintained replacement

---

### 3.7 Open Team Sheet Process — Friction at Tournaments

- Official VGC 2026 rules mandate open team lists at tournaments
- Smaller tournaments require filling out or bringing your own paper team sheet
- Players have intentionally written illegible team sheets to slow opponents
- The Pokemon.com community forum discussion notes: "Pokémon tournaments are one of the only video game events where you need something other than the game and hardware to play" and "when playing a video game, you don't want to have to take your eyes off the screen"
- The VGC OTS Chrome extension was built to display the team sheet within the game UI — demand for integrated digital OTS is confirmed

---

## 4. Emerging Signals (May 2026)

### Pokemon Champions Reset Moment
The transition to Pokemon Champions as a standalone competitive title is creating a tool ecosystem reset:
- VGCPastes has only 63 Regulation I teams vs. 1,150+ for Regulation H
- New players entering via the standalone title have no established resource habits
- Highest-leverage window to establish VGC Team Report as canonical destination

### Academic Interest in VGC Team Data
"VGC-Bench: A Benchmark for Generalizing Across Diverse Team Strategies in Competitive Pokémon" (arxiv.org, May 2026) signals growing academic/AI research interest in VGC team data. Tools that structure team reports become more valuable as AI training datasets. This is a secondary moat for a platform that accumulates well-structured team data.

### crob.at — Visual Paste Layer Growing Fast
crob.at is now the most prominent pokepaste visual alternative. It renders any paste URL or Showdown export into a clean, sprite-rich shareable card. However, it has no context layer — no notes, no calcs, no matchup plans. Confirms market demand for visual presentation, but the report/narrative gap remains open.

### MetaGame VGC — New Competitor in Team Report Space
metagamevgc.com/team-reports is publishing structured VGC team reports as articles. Confirms that there is a market for this content format. Warrants competitive monitoring.

---

## 5. Summary Table

| Pain Point | Severity | Affected Players | Who Feels It Most |
|------------|----------|-----------------|-------------------|
| PokePaste broken sprites | High | All | Everyone sharing teams |
| PokePaste paste creation failures | Critical | All | Active players |
| No searchable team archive | High | All | Players studying meta, new players |
| No context on raw pastes | High | Intermediate/Advanced | Tournament prep players |
| No rental + paste + report bundle | High | All | Players sharing tournament teams |
| VGCPastes curation bottleneck | Medium | Content creators | Players trying to get teams noticed |
| Victory Road gatekeeping | Medium | Intermediate | Players with good teams but no connections |
| Pikalytics mobile gaps | Medium | Mobile users | Casual/on-the-go players |
| OTS digital friction at tournaments | Medium | Competitive players | Day-2 tournament participants |
| VGC Helper staleness | Medium | iOS users | Mobile-first players |

---

## 6. Actionable Opportunities for VGC Team Report

### High-Priority (Evidence-Backed)
1. **Rental code field in every report**: Single most viral sharing mechanic in the community. Add a "Rental Code" field to every team report. One-tap copy. Display prominently. This directly addresses the top community curation pain point.

2. **Pokémon-level search across all published reports**: Allow searching "show me all teams with Calyrex-Shadow + Incineroar in Regulation I." This is the searchable archive the community is missing. VGC.tools does this for raw pastes only; no tool does it for full reports with context.

3. **Structured matchup plan section**: A templated section (not free-form) for matchup plans — each of the 8 most common archetypes, with outcome fields (favorable/unfavorable/50-50). Makes reports machine-readable and community-comparable.

4. **Open Team Sheet export**: Generate a regulation-compliant printable/digital team sheet from any published report. Ties directly to the mandatory OTS format at official events — a daily-use utility.

5. **Report templates for new players**: Lower the barrier for first-time report writers. A fill-in-the-blank structure that scaffolds the sections (lead cores, win conditions, matchup notes, spread notes) rather than a blank page.

### Medium-Priority
6. **Damage calc integration**: Link to Pikalytics/Porygon Labs calcs pre-populated with the team's sets from within the report. Reduces the multi-tab workflow players currently use.

7. **View analytics**: Show report authors how many times their team was viewed, their pokepaste was copied, or their report was shared. Recognition and credit are unmet emotional needs in the community.

8. **Source attribution**: A "Based on [Player's] team from [Event]" field. Credit is a significant community value; tools that enable it will be preferred by ethical players.
