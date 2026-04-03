# Pitfalls Research

**Domain:** Meta intelligence & smart discovery on a competitive gaming platform (small dataset)
**Researched:** 2026-04-03
**Confidence:** HIGH — based on existing codebase analysis + verified patterns from Neon/Vercel/Postgres/Upstash documentation

---

## Critical Pitfalls

### Pitfall 1: Showing Meta Stats Before You Have Enough Data (Cold Start Credibility Collapse)

**What goes wrong:**
You display "Top Pokemon This Week: Incineroar 100%" because 3 reports were posted, all using Incineroar. Users see this, distrust the entire feature, and never come back to check it. The feature is live but broken in terms of credibility from day one.

**Why it happens:**
Developers ship the aggregation pipeline and UI together. There is no threshold check — if the query returns data, it renders. Early-stage apps always have sparse data but the UI is designed for steady-state.

**How to avoid:**
- Define a minimum corpus threshold before showing any "meta" label. Suggested minimums: 20+ public reports for a regulation before showing archetype distribution; 50+ for trend indicators; 10+ for "Counter This" recommendations.
- Gate the UI explicitly: show a "Not enough data yet for [Reg G] meta" placeholder rather than misleading percentages.
- Implement a `data_confidence` field in the aggregation result that the UI reads before rendering badges.
- Seed the feature with the existing corpus — audit the current share count per regulation before shipping.

**Warning signs:**
- Percentages showing a single Pokemon at 100% usage
- Trend arrows showing "rising" on day 1 of a new regulation
- "Counter This" returning 0 or 1 results and showing them as authoritative

**Phase to address:**
Meta aggregation engine phase — build the minimum threshold check before building the UI layer. Do not ship UI before defining and enforcing corpus minimums.

---

### Pitfall 2: JSONB Aggregation Without Extracted Columns (Query Performance Cliff)

**What goes wrong:**
Aggregation queries scan all `shares` rows extracting `data->>'paste'` or `data->'tags'->>'regulation'` via JSONB operators. At 500 rows this is fast enough. At 2,000+ rows with multiple concurrent explore requests, query time climbs over 1-2 seconds. Neon's serverless HTTP driver has no persistent connection overhead, but the query itself degrades. Combined with Vercel Hobby's 10s function timeout, a complex aggregation that hits TOAST decompression on large paste blobs becomes a real failure risk.

**Why it happens:**
All VGC team data lives in the `data JSONB` column. Tags, archetype, regulation, species — all are JSONB paths. Aggregation via `GROUP BY data->'tags'->>'regulation'` cannot use the existing GIN index (GIN is for containment/existence, not GROUP BY). The planner does a sequential scan every time.

**How to avoid:**
- Extract the top aggregation keys (regulation, archetype array, placement tier) as real computed columns with B-tree indexes: `ALTER TABLE shares ADD COLUMN regulation TEXT GENERATED ALWAYS AS (data->'tags'->>'regulation') STORED`.
- For species/Pokemon frequency aggregation, do NOT run `jsonb_each` in real-time per request. Pre-compute via the daily cron and store results in a dedicated `meta_snapshots` table or Upstash Redis key.
- Species counting from the paste text requires string parsing — keep this in the pre-compute step, never inline in the explore API.
- The existing `idx_shares_public_updated` partial index is good for explore ordering. Add a similar partial index on the extracted `regulation` column immediately when adding it.

**Warning signs:**
- Explore page response time > 500ms when aggregation is added
- Neon slow query logs showing sequential scans on `shares` with JSONB operator conditions
- Aggregation route approaching or timing out under 10s Vercel limit

**Phase to address:**
Database schema phase — extracted columns must be added before writing any aggregation queries. Retrofitting indexes after the feature is live requires a migration with `CONCURRENTLY` and a maintenance window.

---

### Pitfall 3: Stale Trend Indicators Showing Outdated Meta (TTL Mismatch)

**What goes wrong:**
A Pokemon gets banned mid-regulation or a new dominant strategy emerges. The "Rising" badge on Koraidon persists for hours because the trend cache TTL is set to 6+ hours. Players see contradictory information — the community knows the meta shifted but the app shows yesterday's trend arrows. Trust in the feature erodes.

**Why it happens:**
Trend data is expensive to compute so developers set long TTLs. But VGC meta can shift materially within 24-48 hours after a major tournament posts results. The existing explore cache uses 60s TTL (reasonable for pagination). Trend data naturally gets a longer TTL as a "heavier" computation but the cost of staleness is higher than the cost of recomputation for a small dataset.

**How to avoid:**
- Separate TTL tiers by data type: explore pagination (60s), individual report cards (5 min), trend indicators (15-30 min), archetype distribution snapshot (1-6 hours depending on regulation age).
- Add a `computed_at` timestamp to every aggregation result so the UI can show "Updated 45 minutes ago" rather than displaying numbers as if they are live.
- Invalidate trend cache on new public report creation (the share creation webhook should call `cacheDel(CacheKeys.trendSnapshot(regulation))`) — this keeps data near-live during active posting periods.
- Do NOT tie trend cache invalidation to the explore list cache invalidation — they have different staleness tolerances.

**Warning signs:**
- Meta badge showing a Pokemon as "Rising" when it was recently used less or banned
- Cache TTL set uniformly across all aggregation types
- No `computed_at` or `last_updated` timestamp on trend data returned from the API

**Phase to address:**
Cache architecture phase — define the TTL matrix before implementing any aggregation. The Upstash Redis key namespace should encode the cache tier (e.g., `meta:trend:regG:v1` vs `meta:arch:regG:v1`).

---

### Pitfall 4: Small Sample Size Percentages Displayed as Authoritative (Statistical Misleading)

**What goes wrong:**
The meta panel shows "Trick Room: 67%" — but there are only 6 Regulation G reports and 4 of them happen to be TR. This misleads players who trust the platform's aggregated data as representative of the actual competitive meta. It is worse than showing nothing because it looks authoritative.

**Why it happens:**
Percentage calculations are trivially easy to implement and look good in UI. Developers naturally compute `count / total * 100` without attaching sample size or confidence context. The VGC ecosystem itself has this problem — external tools like Pikalytics use 182-371 teams as their sample and still qualify their data. At app scale, especially early, the sample will frequently be under 20 per regulation.

**How to avoid:**
- Always co-render the sample size with any percentage: "Trick Room 67% (n=6)" not "Trick Room 67%".
- Use confidence-adjusted display: show exact count for n<10, show percentage + n for 10-50, show percentage with confidence band for 50+.
- Suppress trend arrows entirely when the rolling window has fewer than 15 data points.
- For "Counter This" results, show the count of matching teams found, not just the teams themselves: "4 teams found that run Rain + Incineroar counter cores."
- Do NOT display normalized percentages from small samples on report cards as meta badges — these travel far and get screenshotted without the sample size context.

**Warning signs:**
- Any percentage display that does not include n= sample size
- Trend arrows appearing on regulations that were published less than 2 weeks ago
- "Top 5 Pokemon" list that only includes 5 unique Pokemon because there are only 5 reports

**Phase to address:**
UI/UX phase for all meta-displaying components. Add a `sampleSize` field to every aggregation API response and make it mandatory in the TypeScript type — failing to pass it should be a type error, not a UI decision.

---

### Pitfall 5: Breaking Existing Explore UX with Filter Proliferation

**What goes wrong:**
The existing filter bar has 7 parameters (query, sort, searchCategory, regulation, eventType, archetype, species, placement). Adding counter-archetype query, include/exclude Pokemon, meta badge filter, tournament tier, inspiration mode, and trend filter pushes the visible controls past 12-15 fields. The filter UI becomes unusable on mobile, the URL becomes 400+ characters long, and users stop filtering entirely.

**Why it happens:**
Each new feature in v5.0 naturally wants its own filter. Developers add them incrementally — each individual addition seems reasonable. The cumulative effect is catastrophic to the UX. The existing `ExploreFilters.tsx` component already has 15 props.

**How to avoid:**
- Enforce a "one primary filter bar, one advanced drawer" rule from day one. The visible filter bar stays at its current 8 slots maximum. Every new filter for v5.0 goes into a collapsible "Advanced / Meta Filters" drawer.
- New meta-specific filters (trend badge, counter-archetype mode, inspiration feed) should be implemented as distinct UI modes or tabs, not additional filter inputs — e.g., "Discovery Mode: [Browse | Trending | Counter | Inspiration]" as a mode switcher, not 4 extra dropdowns.
- Before adding any filter parameter to the explore API, audit whether it can be expressed through existing parameters (e.g., "meta badge" filter can be expressed as a sort + threshold, not a new param).
- The URL should remain shareable: test every filter combination as a URL string — if it exceeds 200 characters under common usage, the filter design is wrong.

**Warning signs:**
- `ExploreFilters.tsx` prop interface grows beyond 20 props
- Mobile filter bar requires 3+ rows to display all controls
- Users report "how do I reset filters" confusion
- URL query strings over 300 characters in normal usage

**Phase to address:**
Explore UX phase — define the filter taxonomy (primary vs. advanced vs. mode) before implementing any feature. Do not add a single new filter parameter without first auditing the full parameter list.

---

### Pitfall 6: Real-Time Aggregation on Every Explore Request (Vercel Timeout Bomb)

**What goes wrong:**
The `/api/explore` route or a new `/api/meta` route runs a full-table aggregation on every request — counting Pokemon, computing archetype distributions, computing trend deltas. At 200 concurrent users, this generates 200 simultaneous `GROUP BY` queries against Neon. Neon's connection pool (via PgBouncer in transaction mode) gets saturated, p99 query times spike, and the Vercel Hobby 10s timeout kills requests. The explore page shows errors to users.

**Why it happens:**
It works in development where the dataset is small and there is no concurrency. Developers ship without load testing the aggregation query path. The Neon serverless driver creates a new HTTP connection per invocation — the connection overhead alone adds 20-50ms per request, multiplied by aggregation complexity.

**How to avoid:**
- Never put aggregation queries on the hot explore request path. All meta aggregation must happen in the cron pipeline and be stored as pre-computed snapshots.
- Implement the aggregation result as a write-through cache: cron runs aggregation → stores result in `meta_snapshots` table AND Upstash Redis → explore/meta endpoints read from Redis only.
- The existing `CacheTTL.TOP_POKEMON = 600` (10 min) key already exists in `cache.ts` — use this pattern as the blueprint. Aggregation writes to cache, explore reads from cache, never runs aggregation inline.
- If you need sub-10-minute freshness for any aggregation, use Upstash Redis and invalidate on new public share creation, not on every read.
- The daily cron already runs — extend it to refresh meta snapshots rather than building a separate scheduled endpoint.

**Warning signs:**
- Any `GROUP BY` or `COUNT(DISTINCT)` on `shares` without first checking a cache result
- Aggregation query inside the same serverless function that handles explore pagination
- Meta endpoint response time > 500ms under normal conditions

**Phase to address:**
Aggregation engine phase — the cron pipeline must be built before any meta UI component is built. If the UI can be built without a cron, the architecture is wrong.

---

### Pitfall 7: Counter-Team Discovery Returning Semantically Incorrect Results

**What goes wrong:**
A player asks "find teams that counter Rain" — the feature returns teams that include Incineroar (a Rain check) but the teams are actually Rain teams themselves (they happen to run Incineroar as a flex slot). The user trusts the result, copies the team structure, and shows up to a tournament with a Rain team they thought was a Rain counter.

**Why it happens:**
"Counter This" is implemented as a filter inclusion query: find teams that include common Rain counters (Incineroar, Torkoal, etc.). But a Rain team also runs Incineroar. The presence of a counter Pokemon does not mean the team counters the archetype. Without archetype exclusion logic, the results are polluted.

**How to avoid:**
- "Counter This [Archetype]" must combine: (1) includes known counter Pokemon for that archetype AND (2) NOT tagged as the same archetype itself.
- Use the existing `detectArchetypes` function output (stored in `data->'tags'->'archetype'`) for the exclusion filter — this is already computed at report creation time.
- Add a confidence score to counter-team results based on: number of counter Pokemon present, how highly placed the report is, how recently it was shared.
- In the UI, label results clearly as "Teams with [Archetype] counters" not "Teams that beat [Archetype]" — the distinction is critical in a game where 6 Pokemon must cover multiple threats.
- For the initial phase, limit "Counter This" to archetypes with 5+ known counter Pokemon in the VGC pool and 10+ tagged teams in the corpus.

**Warning signs:**
- Counter results include teams tagged as the same archetype being queried against
- Zero exclusion logic in the counter query (pure inclusion-only filter)
- UI copy uses absolute language ("beats", "counters") rather than qualified language ("includes checks to")

**Phase to address:**
Counter discovery phase — write the counter logic specification (archetype + counter Pokemon map + exclusion rules) before writing any SQL. The archetype exclusion is the difference between useful and misleading.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline aggregation on explore route | No new infrastructure | Timeout at scale, cannot cache independently | Never — use cron pre-compute always |
| No minimum corpus threshold | Feature ships immediately | Credibility collapse on sparse data | Never — threshold is 1 constant |
| Single cache TTL for all meta data | Simpler cache logic | Trend data goes stale fast, snapshot data wastes compute | Only for MVP if clearly documented and short-lived |
| JSONB path expressions in GROUP BY | No schema migration needed | Full table sequential scan, degrades linearly | OK for n<100 reports during development only |
| Percentage display without sample size | Cleaner UI | Misleads users, screenshots spread bad info | Never on public-facing meta surfaces |
| Adding all new filters to the primary filter bar | Fastest to implement | UX collapse, filter bar unusable on mobile | Never — use advanced drawer pattern from start |
| Hard-coding counter Pokemon lists | Ships faster than DB-driven approach | Wrong when Pokemon are added/removed from regulation | Acceptable in Phase 1 with a clear replacement plan |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Neon + Vercel serverless | Running aggregation queries inline on hot path; each invocation creates a new HTTP connection adding 20-50ms overhead | Pre-compute in cron, read pre-computed result from Redis on hot path; use `neon()` driver (HTTP, not TCP) |
| Upstash Redis | Using pattern-based `SCAN` to invalidate all explore cache keys after a new report is created | Use namespaced key groups; invalidate the specific trend snapshot key, leave explore pagination cache intact |
| Upstash Redis | Storing large aggregation objects (species counts for all regulations) as a single Redis key | Namespace by regulation + format: `meta:pokemon:regG:v1` so individual regulation data can be independently refreshed |
| Vercel cron (Hobby) | Writing aggregation logic that takes >10s when corpus grows | Batch the aggregation: run per-regulation in separate cron invocations, not one mega-query for all regulations |
| Neon JSONB + GIN index | Expecting GIN index to accelerate GROUP BY aggregation on JSONB paths | GIN only accelerates containment/existence checks (`@>`, `?`). GROUP BY on JSONB paths requires extracted columns with B-tree indexes |
| `extractSpecies()` utility | Calling it per-row inside the explore API response builder for aggregation purposes | It's fine per-row for display; never loop-call it to build frequency counts — that belongs in the pre-compute step |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `data->>'paste' ILIKE '%pokemon%'` for species filtering (already in prod) | Acceptable today; degrades as corpus grows | Acceptable for pagination; never use for aggregation counting | ~500 rows under concurrent load |
| Real-time trend delta calculation (compare last 7 days vs prior 7 days) | Works in dev; 2+ seconds in prod | Pre-compute trend delta in cron, store delta direction as `+1/0/-1` in snapshot | ~200 public reports |
| JSONB `jsonb_each_text()` to count species per regulation | Correct result but full table scan | Pre-extract species counts in cron into normalized `meta_pokemon_usage` table | ~300 reports |
| Cursor pagination + aggregation in same query | One slow query blocks the page load | Separate pagination query from aggregation fetch; aggregate is a sidebar widget, not part of the list query | From day one of adding aggregation |
| Showing explore results + meta panel in a single API response | Simplifies frontend state | Aggregation failure blocks explore list | Never — keep them as independent fetches |
| Caching explore results with meta data embedded | Simpler to implement | Changing meta TTL requires changing explore cache TTL | Never — cache them under separate keys |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing raw species frequency counts keyed by share ID | Reveals which reports are driving meta trends; privacy concern for private-adjacent patterns | Aggregate only, never expose per-share breakdown in meta API |
| Counter-team query accepting arbitrary Pokemon name as input | SQL injection via unvalidated species name in JSONB ILIKE filter (already partially exists in species filter) | Validate Pokemon names against a known allowlist (all ~1,000 valid species names) before using in query |
| Meta snapshot endpoint without rate limiting | Aggregation endpoint abused as a scraping tool | Apply the existing `isRateLimited` pattern to any new `/api/meta` route |
| Trend data that implicitly reveals posting velocity | If trend shows "7 new Rain teams this hour", an attacker can infer site activity patterns | Coarsen trend time windows to day-level, not hour-level |
| Inspiration feed surfacing private-intent reports | A report marked public but submitted with a note "draft, not for sharing" gets surfaced as an "inspiration" pick | Respect `is_public` flag strictly; consider adding a `discoverable` flag separate from `is_public` for future opt-in discovery |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing trend arrows with no baseline explanation | "Rising since when? Compared to what?" — users don't know how to interpret the indicator | Add tooltip on hover: "Usage up 12% vs last 14 days (n=43 reports)" |
| Meta panel that updates on every filter change | Confusing — the "current meta" changes when you filter by a tournament tier | Meta panel shows global meta; make it clear it is independent of active filters |
| "Counter This" placed in the filter bar | Looks like a filter but it is a discovery mode — users get confused when results look like normal explore results | Implement as a separate "Counter Mode" view state, not a filter parameter |
| Inspiration feed mixed with regular explore results | Creative/novel builds look like they have lower engagement (they do — they're new) | Separate inspiration feed as an explicit tab or mode, not a sort option |
| Trend badge on every report card | Visual noise; badges lose meaning when everything has one | Only badge reports where the team's usage is statistically meaningful: top 5 Pokemon AND the team is in the top-used archetype |
| Displaying meta badges to logged-out users without explanation | "Meta" and "Rising" labels are meaningless to casual visitors | Add brief explainer tooltip for first-time visitors; consider gating meta badges to logged-in users |
| Filter count badge showing "7 filters active" | Users forget what they filtered on; explore results look empty and they don't know why | Show active filter chips/pills inline, each dismissible individually |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Meta aggregation engine:** Often missing minimum corpus threshold enforcement — verify that the API returns a `sampleSize` field and the UI reads it before rendering percentages or badges.
- [ ] **Trend indicators:** Often missing the time-window baseline — verify that "rising" is computed against a defined prior window (e.g., prior 14 days) not just "has any data".
- [ ] **Counter This discovery:** Often missing archetype exclusion filter — verify that Rain teams do NOT appear in "Counter Rain" results by testing with known Rain-tagged reports.
- [ ] **Pre-computed snapshots:** Often missing the cron registration in `vercel.json` — verify that the aggregation cron is listed in `vercel.json` `crons` array and has a tested auth path.
- [ ] **JSONB aggregation query:** Often missing extracted column indexes — verify that `EXPLAIN ANALYZE` on the aggregation query shows an Index Scan, not a Seq Scan.
- [ ] **Inspiration feed diversity scoring:** Often missing normalization against report age — a "diverse" team from 6 months ago with an outdated regulation is not useful inspiration.
- [ ] **Cache invalidation on new report:** Often missing the `cacheDel(trendCacheKey)` call in the share-creation flow — verify by creating a report and checking whether trend data refreshes within 1 minute.
- [ ] **Mobile filter UX:** Often missing a "clear all filters" affordance — verify that the filter bar on mobile has a visible reset path that does not require clearing each filter individually.

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cold start credibility collapse (bad meta shown) | LOW | Add threshold check constant, deploy, misleading badges disappear immediately without data migration |
| JSONB aggregation timeout in production | MEDIUM | Disable the meta endpoint immediately (feature flag or env var), add extracted columns migration, re-enable after migration lands |
| Stale trend data visible for hours | LOW | Shorten TTL constant in `CacheTTL`, trigger manual `cacheDel` on trend keys via a one-off API call or Redis CLI |
| Counter discovery returning wrong results | MEDIUM | Add archetype exclusion clause to counter query + deploy; wrong results disappear; existing cached results expire within TTL |
| Filter proliferation breaking mobile UX | HIGH | Requires component refactor — moving filters to drawer is a UI rebuild not a config change; plan the drawer pattern from day one to avoid this |
| Explore page timeout from inline aggregation | HIGH | Requires architectural change: extract aggregation to cron, remove from request path; this is a 2-4 hour fix but requires data pipeline work |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Cold start credibility collapse | Phase 1: Aggregation engine (define minimums first) | Unit test: aggregation returns `confidence: "low"` when `sampleSize < 20` |
| JSONB aggregation performance cliff | Phase 1: Database schema (extracted columns before queries) | `EXPLAIN ANALYZE` shows Index Scan on extracted column |
| Stale trend TTL mismatch | Phase 1: Cache architecture (TTL matrix before any caching) | Integration test: new report creation triggers trend cache invalidation within 1 minute |
| Small sample misleading percentages | Phase 2: UI components (sampleSize is typed required field) | TypeScript compile error if component renders percentage without sampleSize prop |
| Filter proliferation breaking UX | Phase 2: Explore UX (filter taxonomy defined before new filters added) | Mobile viewport test: filter bar fits in one row without scrolling |
| Real-time aggregation timeout bomb | Phase 1: Aggregation engine (cron-only aggregation from start) | Load test: 50 concurrent explore requests with meta panel do not exceed 1s p99 |
| Counter-team wrong results | Phase 3: Counter discovery (spec written before SQL) | E2E test: Rain-tagged report never appears in "Counter Rain" results |
| Inspiration feed surfacing stale content | Phase 3: Inspiration feed (recency weight defined in scoring) | Manual test: reports from outdated regulations do not appear in inspiration feed |

---

## Sources

- Neon serverless driver documentation: https://neon.com/docs/serverless/serverless-driver
- Neon connection pooling: https://neon.com/docs/connect/connection-pooling
- Vercel Hobby plan function limits: https://vercel.com/docs/plans/hobby
- Vercel function duration configuration: https://vercel.com/docs/functions/configuring-functions/duration
- Postgres GIN index behavior: https://pganalyze.com/blog/gin-index
- JSONB TOAST performance cliff: https://pganalyze.com/blog/5mins-postgres-jsonb-toast
- JSONB planner selectivity estimation bugs: https://pganalyze.com/blog/5mins-postgres-planner-jsonb-selectivity
- Postgres materialized views strategy: https://stormatics.tech/blogs/postgresql-materialized-views-when-caching-your-query-results-makes-sense
- VGC Data sample sizes (182-371 teams per update): https://x.com/VGCdata
- Upstash Redis cache invalidation strategies: https://dohost.us/index.php/2026/03/12/cache-invalidation-strategies-keeping-your-data-fresh-in-redis/
- Filter UX: Baymard Institute product list best practices: https://baymard.com/blog/current-state-product-list-and-filtering
- Smashing Magazine filter patterns: https://www.smashingmagazine.com/2021/07/frustrating-design-patterns-broken-frozen-filters/
- Existing codebase: `src/app/api/explore/route.ts`, `src/lib/cache.ts`, `src/lib/db.ts`, `src/lib/analysis/detect-archetype.ts`

---
*Pitfalls research for: Meta intelligence & smart discovery — VGC Team Report v5.0*
*Researched: 2026-04-03*
