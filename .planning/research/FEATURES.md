# Feature Research

**Domain:** VGC Meta Intelligence & Smart Discovery (v5.0 milestone)
**Researched:** 2026-04-03
**Confidence:** MEDIUM-HIGH (competitive platform analysis confirmed via live sites; VGC-specific patterns inferred from Pikalytics, LimitlessVGC, VictoryRoad, op.gg, MTGGoldfish, HSReplay)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist because every comparable platform has them. Missing these makes the product feel unfinished compared to Pikalytics, LimitlessVGC, and VictoryRoad.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Usage percentage per Pokemon | Pikalytics shows it as the #1 headline stat (e.g. "46% Usage") — VGC players check this reflexively | LOW | Aggregate `COUNT(species in paste) / total_public_shares` per regulation. Can run as Postgres materialized view or Redis sorted set. |
| Top Pokemon list (ranked by usage) | Every meta platform (Pikalytics, LimitlessVGC) leads with this. Players need to know what to prepare for | LOW | Top 20-30 by regulation and recent time window. Existing `extractSpecies` util already parses paste. |
| Archetype distribution summary | MTGGoldfish's metagame % breakdown per archetype is the model — players expect "what % of the meta is Rain right now" | LOW | Aggregate `tags.archetype` from `shares` table. Already tagged at save time via `detectArchetypes`. |
| Filter by tournament placement | VictoryRoad lists are implicitly filtered to top placers. Players browsing for team inspiration want winners only | LOW | Already exists in explore route as `filterPlacement`. Needs surface-level UI work, not backend work. |
| Sort by regulation | Every VGC platform gates data by format. Reg F and Reg I teams aren't comparable | LOW | Already exists as `filterRegulation`. Needs to be the first visible filter, not buried. |
| Basic trend label ("trending") | Pikalytics uses a fire emoji + "TRENDING" label. Even a simple indicator ("risen this week") meets expectations | MEDIUM | Requires computing delta between two time windows. Pre-aggregate weekly snapshots in a `meta_snapshots` table. |
| Report card shows species sprites | All platforms show Pokemon sprites as the primary visual identifier for a team | LOW | Already implemented via `extractSpecies` + sprite URLs in existing explore cards. |
| Multi-species include filter | Players want "show me teams that use Urshifu + Incineroar together" — core team-building use case | LOW | Already exists as `filterSpecies` (comma-separated). Needs better UI affordance. |

### Differentiators (Competitive Advantage)

Features that set VGC Team Report apart from Pikalytics (usage stats only, no team reports), LimitlessVGC (tournament results only, no meta context on cards), and VictoryRoad (editorial, not dynamic).

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Counter-archetype discovery query | "Show me teams that beat Rain" — no existing platform does this. Players currently browse manually or ask Discord. The app has enough tagged data to power this | HIGH | Requires defining "counters Rain" heuristics: teams with weather-nullifying moves (Defog, Clear Smog, Sunny Day used offensively), specific counter species (Tornadus, Amoonguss w/ Rage Powder), or tag co-occurrence analysis. Two-phase: (1) define counter signatures per archetype, (2) query `shares` for teams matching signatures. |
| Trend badges on explore cards | Inline rising/falling indicators directly on report cards — no platform combines live team reports with trend context | MEDIUM | "Rising" = species appeared in significantly more reports in last 14 days vs prior 14. Badge renders from pre-computed `meta_snapshots` delta. Requires scheduled aggregation (daily cron already exists). |
| Popular cores display | "Urshifu + Incineroar appear together in 38% of top-placing teams" — Pikalytics shows this for individual Pokemon but not in the context of actual shareable reports | MEDIUM | Co-occurrence matrix: for each pair of species in public shares, count joint appearances. Top N pairs per regulation. Store in `meta_snapshots`. Surface on explore page header. |
| Inspiration / novelty feed | Surface teams with unusual species combinations that are still placing well — fills the "rogue pick" discovery gap. Nothing else in the VGC ecosystem does this algorithmically | HIGH | Novelty score = inverse of species popularity-weighted team score. Team score = sum of (1 / usage_rank) for each species. Low score = common team, high score = novel team. Filter to only recently shared or tournament-placed teams to avoid surfacing random jank. |
| Meta badges on report cards | Inline "meta" context on cards: "#1 Rain team this week", "Contains 3 meta picks", "Runs 2 off-meta species" — no platform embeds this metadata on individual team cards | MEDIUM | Computed at explore query time from `meta_snapshots`. Add fields to explore API response: `metaBadge`, `noveltyTier`. Low DB impact if snapshots are pre-computed. |
| Enhanced tournament results browsing | Filter by event type (Regionals vs Worlds vs Online) combined with placement AND regulation AND date range in one cohesive UI — VictoryRoad requires manual navigation, LimitlessVGC lacks report content | MEDIUM | Backend already supports `filterEventType` + `filterPlacement` + `filterRegulation`. Needs UI consolidation: a "Tournament Results" mode with preset filter combinations (e.g. "Top 8 Regionals, Reg I"). |
| Pokemon exclude filter | "Show teams that DON'T use Flutter Mane" — useful for players who own specific Pokemon or want to avoid certain matchups. HSReplay supports card exclusion filters | LOW | SQL: add `NOT (s.data->>'paste' ILIKE '%Flutter Mane%')` conditions. Extend `filterSpecies` param to support `exclude:PokemonName` syntax or add separate `excludeSpecies` param. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| External API integration (Pikalytics, Smogon usage stats) | Users want "real" usage data from millions of Showdown battles | Creates external dependency, ongoing API cost, data freshness mismatch between app data and external source — undermines the data flywheel the app is building. Explicitly out of scope per PROJECT.md | Use app's own data exclusively. As the share count grows, app data becomes authoritative for its own community. Add disclaimer: "Based on X reports shared on this platform." |
| Real-time meta aggregation on every request | Feels more live/accurate | Vercel serverless 10s timeout + growing dataset = aggregation query will time out at scale. Single large GROUP BY over all shares is expensive | Pre-aggregate into `meta_snapshots` table via daily cron (already exists). Serve snapshots from Redis with hourly TTL. |
| Separate /meta page | Logical separation of concerns feels clean | Splits user attention, doubles navigation surface, fragments the discovery experience. PROJECT.md explicitly rejects this | Surface all meta intelligence within /explore as contextual layers (badges, filter presets, header stats bar). |
| Tier list (S/A/B/C rankings) | MTGGoldfish and HSReplay have them | Tier lists require editorial judgment or enough battle outcome data to compute win rates. App has no battle results — only tournament placements from limited events. A bad tier list is worse than no tier list | Show usage rank + trend direction only. Let players draw their own tier conclusions from data. |
| AI-generated team recommendations | Feels futuristic; "what should I run against Rain?" | Requires significant LLM infrastructure, prompt engineering for Pokemon domain, and hallucination risk is high for specific competitive advice | Provide "Counter This" discovery filter grounded in actual community data instead. |
| Win rate by matchup | Op.gg's most-used feature | App has no battle outcome data. Reports include matchup PLANS but not battle results at scale | Expose matchup plan data on reports (already tracked). Aggregate "teams with good Rain matchup" from matchup field rather than battle outcomes. |

---

## Feature Dependencies

```
[Meta Aggregation Engine] (pre-computed meta_snapshots)
    └──required-by──> [Trend Badges on Cards]
    └──required-by──> [Popular Cores Display]
    └──required-by──> [Novelty/Inspiration Feed]
    └──required-by──> [Meta Badges on Report Cards]

[meta_snapshots table + daily cron job]
    └──required-by──> [Meta Aggregation Engine]
    (cron infrastructure already exists at /api/cron/daily-ops)

[Existing filterSpecies param in explore API]
    └──enhanced-by──> [Pokemon Exclude Filter]
    └──enhanced-by──> [Counter-Archetype Discovery]

[Existing filterArchetype + detectArchetypes]
    └──required-by──> [Counter-Archetype Discovery]
    (archetype tags already stored in shares.data.tags.archetype)

[Existing filterEventType + filterPlacement + filterRegulation]
    └──enhanced-by──> [Enhanced Tournament Results Browsing]
    (all three filters already exist in backend; UI consolidation only)

[Counter-Archetype Discovery]
    └──enhances──> [Inspiration Feed]
    (counter teams are a natural subset of the inspiration feed)

[Trend Badges on Cards]
    └──enhances──> [Enhanced Report Cards]

[Meta Badges on Report Cards]
    └──enhances──> [Enhanced Report Cards]
```

### Dependency Notes

- **Meta Aggregation Engine requires `meta_snapshots` table:** A new Postgres table storing pre-computed aggregates (top species, archetype distribution, trending deltas, popular cores) per regulation per time window. Populated by daily cron. This is the single most critical unbuilt piece.
- **Trend badges require two time windows in snapshots:** Must store snapshot at T and T-14d to compute delta. Schema must support time-windowed rows from the start.
- **Counter-archetype discovery requires archetype tags:** Tags are already stored (`tags.archetype` in JSONB), so counter-query heuristics can be applied directly to tagged data. No new data collection needed.
- **Novelty/inspiration feed requires usage rank:** Must compute species usage rank first before scoring team novelty. Therefore meta aggregation engine must run before inspiration feed can function.
- **Tournament results browsing UI requires no backend changes:** All three filters (`filterEventType`, `filterPlacement`, `filterRegulation`) already exist in `src/app/api/explore/route.ts`. This is a UI-only feature.

---

## MVP Definition

### Launch With (v5.0 core)

Minimum set that delivers the "intelligent discovery engine" promise from PROJECT.md.

- [ ] **Meta aggregation engine** — `meta_snapshots` table + daily cron aggregation. Without this, nothing else works. Top species, archetype distribution, trend deltas per regulation.
- [ ] **Top Pokemon stats bar on explore** — Display top 6 Pokemon by usage for active regulation filter. Uses snapshot data. Zero query cost at render time.
- [ ] **Archetype distribution summary** — Show % breakdown of archetypes for active regulation. Answers "what's the meta" in one glance.
- [ ] **Trend badges on explore cards** — Rising/falling indicators on cards using snapshot delta. The most visible differentiator vs other platforms.
- [ ] **Counter-archetype discovery filter** — New filter preset: "Counters [archetype]". High value, grounded in existing tags. Drives the most unique use case.
- [ ] **Enhanced tournament results browsing UI** — Consolidate existing filters into a "Tournament Mode" with preset combinations. Backend already supports it.

### Add After Validation (v5.x)

Add once core meta engine is running and data quality is confirmed.

- [ ] **Popular cores display** — Needs enough data volume for co-occurrence stats to be meaningful. Add after 2+ weeks of snapshot data.
- [ ] **Meta badges on report cards** — "#1 Rain team this week" etc. Adds polish but requires tuning thresholds for badge criteria.
- [ ] **Pokemon exclude filter** — Useful but lower urgency than include filter already present. Small SQL extension.
- [ ] **Smart filter presets** — Saved filter combinations ("Top Placing Reg I Teams", "Rising Tricks", "Beat Sun") surfaced as one-click pills above the filter bar.

### Future Consideration (v6+)

Defer until v5 data flywheel is established and usage patterns are understood.

- [ ] **Novelty/inspiration feed** — Requires calibrating novelty score thresholds against real data. High complexity, high risk of surfacing low-quality "novel" teams. Needs volume.
- [ ] **Matchup plan aggregation** — Aggregate matchup plan data across reports to surface community consensus on archetype matchups. Requires parsing unstructured matchup fields.
- [ ] **Creator meta influence tracking** — "Teams from verified creators that influenced the meta this month." Requires verified creator system maturation.

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Meta aggregation engine (snapshots) | HIGH | MEDIUM | P1 |
| Top Pokemon stats bar | HIGH | LOW | P1 |
| Archetype distribution summary | HIGH | LOW | P1 |
| Trend badges on cards | HIGH | MEDIUM | P1 |
| Counter-archetype discovery filter | HIGH | HIGH | P1 |
| Enhanced tournament results browsing UI | MEDIUM | LOW | P1 |
| Popular cores display | MEDIUM | MEDIUM | P2 |
| Meta badges on report cards | MEDIUM | MEDIUM | P2 |
| Pokemon exclude filter | MEDIUM | LOW | P2 |
| Smart filter presets | MEDIUM | LOW | P2 |
| Novelty / inspiration feed | HIGH | HIGH | P3 |
| Matchup plan aggregation | MEDIUM | HIGH | P3 |

---

## Competitor Feature Analysis

| Feature | Pikalytics | LimitlessVGC | VictoryRoad | MTGGoldfish | Our Approach |
|---------|------------|--------------|-------------|-------------|--------------|
| Usage stats | HIGH — core product, per-Pokemon % | MEDIUM — points-based ranking | LOW — editorial mentions only | HIGH — % metagame share per archetype | Aggregate from own shared reports; lower sample size but community-specific |
| Trend indicators | LOW — fire emoji for trending | NONE | NONE | LOW — 7/14/30/90-day windows | Pre-computed deltas in `meta_snapshots`, badge on each card |
| Counter discovery | NONE | NONE | NONE | NONE — links to "counter" articles | Novel differentiator: filter by counter heuristics against existing archetype tags |
| Team report content | NONE — stats only, no full reports | LOW — team list with link | HIGH — full written reports but static/editorial | NONE | Core product advantage: meta intelligence ON top of actual shareable team reports |
| Filter sophistication | MEDIUM — format, rating cutoff | HIGH — date range, event type, region, ranking method | LOW — regulation only | MEDIUM — format, timeframe | Already competitive on filter depth; needs UI polish and counter filter |
| Novelty / rogue builds | NONE | NONE | NONE | NONE — "rogue" tier exists but manually curated | Algorithmic novelty score is a genuine gap in the ecosystem |
| Cores / synergy display | HIGH — top 3/4-mon cores | NONE | NONE | NONE | Co-occurrence from own data; less data than Pikalytics but tied to actual reports |

---

## VGC-Specific Considerations

These factors distinguish VGC meta intelligence from LoL/Hearthstone platforms and must shape implementation:

1. **6-Pokemon teams, 4 brought to battle.** Usage stats must distinguish "on the team" from "brought to battle" — the app only has team data, not battle bring data. Be explicit about this distinction in UI copy.

2. **Restricted legendaries dominate Reg I/F.** The restricted core (e.g. Kyogre + Miraidon) is often the most important filter dimension. The top Pokemon list will be dominated by restricted legendaries — consider surfacing restricted cores separately from support Pokemon.

3. **Archetype tags are multi-valued.** A single team can be "Trick Room + Rain". Counter discovery must handle OR logic for archetypes (a team counters Rain if it has at least one rain-counter signature, even if it also runs TR).

4. **Data volume per regulation varies.** Older regulations have fewer active reports. Meta snapshots must only surface stats for regulations with enough data (minimum threshold, e.g. 50+ reports) to avoid misleading small-sample statistics.

5. **Format changes invalidate trends.** When a new regulation drops, trending data from the previous regulation is irrelevant. Snapshots must be regulation-scoped. Trend badges should only show within the same regulation.

6. **VGC players value placement provenance.** "This team placed top 4 at NAIC" carries more weight than 500 views. Meta badges and trend indicators should weight tournament-placed reports more heavily than casually shared reports.

---

## Sources

- [Pikalytics — VGC 2026 Regulation F Stats](https://www.pikalytics.com/) — usage percentage display, trending label, teammate co-occurrence
- [LimitlessVGC Pokemon Rankings](https://limitlessvgc.com/pokemon/) — tournament-grounded usage ranking, multi-dimensional filters
- [VictoryRoad SV Team Reports](https://victoryroad.pro/sv-reports/) — editorial team report format, tournament provenance display
- [MTGGoldfish Standard Metagame](https://www.mtggoldfish.com/metagame/standard) — archetype distribution %, timeframe filtering (7/14/30/90 days), meta % per archetype
- [HSReplay Meta Tier List](https://hsreplay.net/meta/) — archetype matchup analysis, tier-based meta snapshot
- [op.gg Champion Trends](https://op.gg/lol/champions/sylas/trends/mid) — win rate / pick rate trend visualization per champion
- Existing codebase: `src/app/api/explore/route.ts`, `src/lib/analysis/detect-archetype.ts`, `src/lib/data/tags.ts`

---
*Feature research for: VGC Meta Intelligence & Smart Discovery (v5.0)*
*Researched: 2026-04-03*
