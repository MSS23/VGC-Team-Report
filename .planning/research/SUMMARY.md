# Project Research Summary

**Project:** VGC Team Report — v5.0 Smart Discovery & Meta Intelligence
**Domain:** Competitive gaming meta analytics layer on an existing team-sharing platform
**Researched:** 2026-04-03
**Confidence:** HIGH

## Executive Summary

VGC Team Report v5.0 adds a meta intelligence and smart discovery layer on top of an already-functional team-sharing platform. The core challenge is not technology selection — no new npm packages are needed — but architectural discipline: all expensive aggregations must be pre-computed in the existing daily cron and served from Redis cache at request time. The Vercel Hobby 10-second serverless timeout and Neon's per-invocation HTTP connection model make on-demand aggregation a reliability time bomb as the dataset grows, even at a few hundred reports.

The recommended approach is a three-tier architecture: (1) a `meta_snapshots` Postgres table and a `pokemon_usage_history` table populated by the existing `daily-ops` cron, (2) a new `/api/meta` route that serves pre-computed snapshots from Redis with a 1-hour TTL, and (3) UI components (`MetaBar`, `TrendBadge`) that fetch snapshot data once on regulation change and render inline on `/explore`. The counter-archetype discovery feature extends `/api/explore` with a static TypeScript counter-map rather than a separate endpoint or database table. This keeps the API surface minimal and the data pipeline entirely within existing infrastructure.

The single largest risk is credibility collapse from showing misleading meta statistics before sufficient data exists. Every percentage displayed must include its sample size, every trend indicator must enforce a minimum corpus threshold (20+ reports for archetypes, 50+ for trend arrows), and the UI must show a "not enough data" state rather than statistically meaningless figures. Secondary risks are filter proliferation (the existing filter bar is already at 8 params; all v5.0 filters must route through an advanced drawer or mode-switcher pattern) and counter-discovery returning semantically incorrect results (Rain teams appearing in "Counter Rain" results because they run Incineroar). Both are architecture decisions that must be locked before any implementation starts.

---

## Key Findings

### Recommended Stack

No new npm packages are required. All v5.0 capability is delivered by extending existing infrastructure: `@neondatabase/serverless` for two new tables, `@upstash/redis` for two new cache key families, and the existing Vercel cron slot for daily aggregation. The critical stack addition is a `meta_snapshots` Postgres table (keyed by `regulation`, `window_days`, `snapshot_date`) and a `pokemon_usage_history` table for trend delta computation. A GIN index on `shares(data->'tags'->'archetype')` accelerates counter-query filtering. All trend scoring is a simple percentage delta between two time windows — no statistics library needed.

**Core technologies (extensions to existing stack):**
- `@neondatabase/serverless` ^1.0.2 — two new tables (`meta_snapshots`, `pokemon_usage_history`) + GIN index on archetype JSONB
- `@upstash/redis` ^1.37.0 — new cache keys: `meta:snapshot:{regulation}:{days}d` (6h TTL), `meta:trend:{species}:{regulation}` (6h TTL)
- Vercel cron (`/api/cron/daily-ops`) — absorbs `runMetaAggregation()` as a parallel sub-task; no new cron route (Hobby is capped at 2)
- Postgres window functions — pure SQL trend delta computation (prior 7-day vs current 7-day counts per regulation)

### Expected Features

The feature dependency tree has one root: the meta aggregation engine. Nothing else ships without it. Counter-archetype discovery, trend badges, popular cores, and the inspiration feed all depend on `meta_snapshots` being populated and accurate.

**Must have (v5.0 core — table stakes and top differentiators):**
- Meta aggregation engine (`meta_snapshots` table + daily cron) — without this nothing else works
- Top Pokemon stats bar on explore — users expect usage % ranked list (Pikalytics shows this as headline stat)
- Archetype distribution summary — "what % of meta is Rain right now" (MTGGoldfish model)
- Trend badges on explore cards — rising/falling indicator; no competing platform combines live reports with trend context
- Counter-archetype discovery filter — "teams that counter Rain"; no existing VGC platform does this
- Enhanced tournament results browsing UI — backend already supports it; UI consolidation only

**Should have (v5.x — add after data validation):**
- Popular cores display — co-occurrence stats need 2+ weeks of snapshot data to be meaningful
- Meta badges on report cards — "#1 Rain team this week" — needs threshold tuning before shipping
- Pokemon exclude filter — small SQL extension to existing filterSpecies param
- Smart filter presets — one-click discovery pills ("Top Placing Reg I Teams", "Rising Tricks")

**Defer (v6+):**
- Novelty/inspiration feed — requires calibrating novelty score against real data volume; high risk of surfacing low-quality teams
- Matchup plan aggregation — requires parsing unstructured matchup fields at scale
- Creator meta influence tracking — requires verified creator system maturation

**Anti-features (never build):**
- External API integration (Pikalytics/Smogon) — creates external dependency, undermines data flywheel
- Separate /meta page — fragments user journey, explicitly rejected per PROJECT.md
- Tier list — no battle outcome data; misleading at app's data scale
- Real-time aggregation on every request — Vercel timeout bomb at scale

### Architecture Approach

The architecture follows a strict separation between data production (daily cron) and data consumption (API routes + UI). The `daily-ops` cron extended with `runMetaAggregation()` is the only place that touches raw `shares` data for aggregation. Every API route reads from `meta_snapshots` via Redis cache. The `/api/meta` route is a new, thin snapshot-serving route. The `/api/explore` route is extended backward-compatibly with three new optional params (`counterTarget`, `sort=inspiration`, `trendWindow`). Counter logic lives in a static TypeScript file (`lib/data/counter-map.ts`), not a database table.

**Major components (build order — Tier 1 before Tier 2 before Tier 3):**

Tier 1 — Data Foundation:
1. `db.ts` — `meta_snapshots` + `pokemon_usage_history` table creation + GIN index
2. `lib/meta/aggregation.ts` — `runMetaAggregation()` (isolated, testable, used by cron)
3. `daily-ops/route.ts` — wire in aggregation as parallel sub-task
4. `cache.ts` — `CacheKeys.meta()` + `CacheTTL.META_SNAPSHOT` (3600s)

Tier 2 — API Routes:
5. `/api/meta/route.ts` — snapshot serve route (Redis TTL → Postgres fallback)
6. `/api/explore/route.ts` — extend with `counterTarget` + `inspirationMode` params
7. `lib/data/counter-map.ts` — static threat → counter species mapping (~20 meta threats)

Tier 3 — UI Components:
8. `TrendBadge.tsx` — atomic rising/falling indicator
9. `MetaBar.tsx` — top 6 Pokemon + archetype distribution strip above explore grid
10. `ReportCard.tsx` — add optional trend data prop + TrendBadge slot
11. `ExploreFilters.tsx` — counter-query chip + inspiration toggle (advanced drawer, not primary bar)
12. `ExploreContent.tsx` — wire MetaBar state, new filter params, `/api/meta` fetch on regulation change

### Critical Pitfalls

1. **Cold start credibility collapse** — Showing misleading stats with sparse data (e.g., "100% Incineroar" from 3 reports). Prevent by: enforce minimum corpus thresholds (20+ reports for archetypes, 50+ for trend arrows) before any meta badge renders; return `data_confidence: "low"` field in aggregation API; show "Not enough data yet for [Reg]" placeholder. This must be built into the aggregation engine before the UI layer, not retrofitted.

2. **Real-time aggregation timeout bomb** — Putting `GROUP BY` / `COUNT` on `shares` in the explore hot path will exceed Vercel's 10s limit as data grows and saturate Neon's connection pool under concurrency. Prevent by: all aggregation runs in the daily cron only; explore and meta routes read exclusively from `meta_snapshots` via Redis cache. Never put a `GROUP BY shares` in an on-demand route.

3. **Counter discovery returning wrong results** — Rain teams appear in "Counter Rain" because they run Incineroar. Prevent by: counter query must combine `includes counter species` AND `NOT tagged as target archetype`; use existing `data->'tags'->'archetype'` JSONB for exclusion filter; label results as "Teams with Rain checks" not "Teams that beat Rain"; write the counter logic spec before writing any SQL.

4. **Small sample percentages displayed as authoritative** — "67% Trick Room" from n=6 is worse than showing nothing; screenshots spread without sample context. Prevent by: always co-render `n=` with any percentage; make `sampleSize` a required TypeScript field in every aggregation API response type; suppress trend arrows for regulations with fewer than 15 data points.

5. **Filter proliferation breaking mobile UX** — The existing filter bar already has 8 params; v5.0 adds counter-archetype, inspiration mode, trend filter, exclude filter. Prevent by: enforce "one primary bar, one advanced drawer" rule before any new filter is added; implement counter/inspiration as mode switchers (not filter inputs); test every filter combination as a shareable URL under 200 characters.

---

## Implications for Roadmap

Based on the dependency tree and pitfall mapping, 3 implementation phases are recommended.

### Phase 1: Data Foundation & Aggregation Engine

**Rationale:** Everything downstream depends on `meta_snapshots` existing and being populated. The cron must run before any API route or UI component can be tested with real data. Schema decisions (extracted columns, index types) must be made before queries are written or they are expensive to retrofit. The TTL matrix must be defined before any caching is added or it will be inconsistent.

**Delivers:** Working daily aggregation pipeline; `meta_snapshots` and `pokemon_usage_history` tables populated; Redis cache keys operational; minimum corpus threshold enforcement in place; `/api/meta` route serving snapshots.

**Addresses:** Meta aggregation engine (P1 feature), top Pokemon stats, archetype distribution.

**Avoids:**
- Real-time aggregation timeout bomb (Pitfall 6) — cron-only aggregation established from day 1
- JSONB aggregation performance cliff (Pitfall 2) — schema + indexes before queries
- Stale trend TTL mismatch (Pitfall 3) — TTL matrix defined at cache layer setup
- Cold start credibility collapse (Pitfall 1) — threshold enforcement built into aggregation output

**Research flag:** Standard patterns — cron extension and Postgres table creation are well-documented within the existing codebase. No additional research phase needed.

---

### Phase 2: Explore UI — MetaBar, Trend Badges & Counter Discovery

**Rationale:** With the data pipeline running, all three visible differentiators can be built in parallel. MetaBar and TrendBadge share the same `/api/meta` data source. Counter discovery is an extension to `/api/explore` (not a new route) and uses the static counter-map config. The filter taxonomy (primary bar vs. advanced drawer vs. mode switcher) must be locked at the start of this phase, not after components are built.

**Delivers:** MetaBar strip above explore grid; trend badges on report cards; "Counter This" mode in ExploreFilters; enhanced tournament results browsing UI (filter consolidation).

**Addresses:** Trend badges (P1 differentiator), counter-archetype discovery (P1 differentiator), enhanced tournament results browsing (P1 low-complexity).

**Avoids:**
- Counter discovery wrong results (Pitfall 7) — counter spec written before SQL; archetype exclusion logic required
- Small sample misleading percentages (Pitfall 4) — `sampleSize` typed as required in component props
- Filter proliferation breaking mobile UX (Pitfall 5) — advanced drawer pattern defined before any new filter is added
- Anti-pattern: separate /meta page — all intelligence surfaces inline on /explore
- Anti-pattern: fetching meta on every filter change — MetaBar fetches once per regulation change only

**Research flag:** Counter-map content (which species counter which threats) is game-knowledge that may need curation. The TypeScript file ships with ~20 top meta threats and their 2-3 primary counters. Accuracy is "good enough for discovery" — this is not a research blocker but should be reviewed by someone with current VGC meta knowledge before shipping.

---

### Phase 3: Polish & v5.x Features

**Rationale:** Popular cores and meta badges on cards require 2+ weeks of snapshot history to have meaningful data. This phase runs after the pipeline has been live long enough to validate data quality. The inspiration feed (novelty scoring) is deferred to v6+ per FEATURES.md recommendation — it requires calibrating thresholds against real data volume and risks surfacing jank teams.

**Delivers:** Popular cores co-occurrence display; meta badges on individual report cards ("#1 Rain team this week"); Pokemon exclude filter; smart filter presets as one-click discovery pills.

**Addresses:** Popular cores (P2), meta badges (P2), Pokemon exclude filter (P2), smart filter presets (P2).

**Avoids:**
- Inspiration feed surfacing stale/low-quality content — deferred until data volume supports calibration
- Meta badge threshold errors — badges only ship after tuning against real snapshot data

**Research flag:** Novelty scoring thresholds for the inspiration feed (v6+ feature) will need a dedicated research or calibration phase once sufficient data exists. No research needed for Phase 3 itself.

---

### Phase Ordering Rationale

- **Data before UI:** The architecture has strict Tier 1 → Tier 2 → Tier 3 dependencies. No UI component can be meaningfully tested without real snapshot data. Building UI against mock data creates false confidence.
- **Engine before badges:** Every visible meta feature (trend badges, MetaBar, counter filter) reads from `meta_snapshots`. If the schema changes after UI is built, components break. Locking schema in Phase 1 protects Phase 2 work.
- **Counter logic spec before SQL:** The counter-discovery feature is the highest semantic risk in the project. Writing the archetype exclusion spec before any implementation eliminates the most credibility-damaging bug (Pitfall 7).
- **Popular cores after data maturity:** Co-occurrence statistics from fewer than 50 reports per regulation produce misleading "cores." Phase 3 timing ensures the feature launches with credible data.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (counter-map content):** The static `COUNTER_MAP` TypeScript file must contain accurate game-knowledge for Regulation I/H. This is VGC domain knowledge, not engineering research — but it must be reviewed before shipping.

Phases with standard patterns (no research-phase needed):
- **Phase 1:** Postgres table creation, cron extension, Redis cache keys — all follow documented patterns already present in the codebase.
- **Phase 3:** All Phase 3 features are extensions of patterns established in Phases 1-2.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new packages; all conclusions based on existing installed versions and verified Neon/Vercel docs confirming constraints (Hobby cron limit, pg_cron paid-only) |
| Features | MEDIUM-HIGH | Competitive analysis from live sites (Pikalytics, LimitlessVGC, VictoryRoad, MTGGoldfish); VGC-specific gaps inferred from platform comparison; table stakes well-established |
| Architecture | HIGH | Based on direct codebase inspection of all relevant files (`explore/route.ts`, `cache.ts`, `db.ts`, `daily-ops/route.ts`, component tree) — not inference |
| Pitfalls | HIGH | Sourced from Neon/Vercel official docs + Postgres internals documentation + Baymard filter UX research; all pitfalls verified against existing codebase patterns |

**Overall confidence:** HIGH

### Gaps to Address

- **Counter-map content accuracy:** The TypeScript counter-map ships with curated species mappings. These must be reviewed against current Regulation I/H meta before the feature launches. This is a content gap, not an engineering gap.
- **Minimum corpus thresholds:** Suggested thresholds (20+ for archetypes, 50+ for trend arrows) are conservative estimates. The actual current share count per regulation should be audited before Phase 1 begins — if most regulations have fewer than 50 reports, the meta features will show "not enough data" placeholders on launch and need a data-seeding strategy or adjusted thresholds.
- **`extractSpecies()` vs SQL-side parsing:** STACK.md notes that `extractSpecies()` (TypeScript utility) handles paste parsing for display, while aggregation should use SQL `regexp_matches`. The aggregation implementation must confirm the SQL approach produces equivalent results before trusting snapshot data.

---

## Sources

### Primary (HIGH confidence)
- Neon Docs — pg_cron extension — confirmed paid-plan-only
- Vercel Docs — Cron Jobs Usage & Pricing — confirmed Hobby = daily max, 2 job limit
- Neon Docs — serverless driver connection model — per-invocation HTTP connection overhead
- PostgreSQL Docs — GIN index behavior (containment/existence only, not GROUP BY)
- Direct codebase inspection: `src/app/api/explore/route.ts`, `src/lib/cache.ts`, `src/lib/db.ts`, `src/app/api/cron/daily-ops/route.ts`, `src/components/explore/`

### Secondary (MEDIUM confidence)
- Pikalytics, LimitlessVGC, VictoryRoad, MTGGoldfish — live competitive platform feature analysis
- VGCdata (Twitter/X) — sample sizes for VGC usage stats (182-371 teams per update cycle)
- Upstash Blog — Redis sorted sets for ranking (sorted set upgrade path rationale)
- Baymard Institute — product list filter UX best practices (advanced drawer pattern)

### Tertiary (LOW confidence)
- Novelty scoring thresholds — inferred from overlap count heuristic; needs calibration against real data
- Counter-map accuracy for Regulation I — based on general VGC knowledge; needs domain expert review

---

*Research completed: 2026-04-03*
*Ready for roadmap: yes*
