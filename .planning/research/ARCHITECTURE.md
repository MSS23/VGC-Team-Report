# Architecture Research

**Domain:** Smart discovery & meta intelligence layer on existing VGC team-sharing platform
**Researched:** 2026-04-03
**Confidence:** HIGH (based on direct codebase inspection)

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React 19)                           │
├──────────────────────┬──────────────────────┬───────────────────────┤
│  ExploreContent      │  MetaBar             │  InspirationFeed      │
│  (filter state hub)  │  (top Pokemon/cores) │  (novelty-ranked)     │
├──────────────────────┴──────────────────────┴───────────────────────┤
│                       Next.js App Router                            │
│  /api/explore  /api/meta  /api/counter  /api/inspiration            │
├──────────────────────────────────────────────────────────────────────┤
│                         Upstash Redis                                │
│  explore:* (60s)   meta:snapshot (1h)   counter:* (5m)              │
├──────────────────────────────────────────────────────────────────────┤
│                         Neon Postgres                                │
│  shares (JSONB)    meta_snapshots       pokemon_usage_history        │
│  reactions         (pre-aggregated)     (trend source)               │
└──────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Notes |
|-----------|----------------|-------|
| `ExploreContent` | Owns all filter/sort state, fetches `/api/explore`, orchestrates child renders | Existing; add `counterTarget`, `inspiration`, `trendWindow` params |
| `ExploreFilters` | Renders filter UI, emits filter changes upward | Existing; add counter-query and meta-badge filter chips |
| `ReportCard` | Renders a single team card | Existing; add trend badge slot and meta score overlay |
| `MetaBar` | NEW — horizontal stats strip above results grid showing top 6 Pokemon, top archetype, regulation distribution | New component |
| `InspirationFeed` | NEW — toggle-mode result set sorted by diversity/novelty score | New component, lives below standard grid |
| `TrendBadge` | NEW — small inline indicator (rising/falling arrow + pct) for a Pokemon or archetype | New atomic component |
| `/api/explore` | Filtered paginated team list | Existing; extend with `counterTarget`, `inspirationMode` params |
| `/api/meta` | Serves pre-aggregated snapshot from Redis/Postgres | New route |
| `/api/counter` | Accepts a Pokemon name or archetype; returns teams that contain known counters | New route (or query mode on `/api/explore`) |
| `meta_snapshots` | Postgres table holding one row of aggregated stats per regulation per time window | New table |
| `pokemon_usage_history` | Postgres table — one row per (pokemon, regulation, week); source for trend deltas | New table |
| Cron: `daily-ops` | Existing; extend to call meta aggregation as a sub-task | Modified |

---

## New Database Tables

### `meta_snapshots`

Pre-computed aggregates. Refreshed by cron; served from Redis with 1h TTL.

```sql
CREATE TABLE meta_snapshots (
  id          SERIAL PRIMARY KEY,
  regulation  TEXT NOT NULL,          -- 'Reg H', 'Reg I', etc. NULL = all-regs
  window_days INTEGER NOT NULL,       -- 7, 30, 90
  snapshot    JSONB NOT NULL,         -- shape described below
  report_count INTEGER NOT NULL,      -- how many public reports this covers
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meta_snapshots_lookup
  ON meta_snapshots(regulation, window_days, computed_at DESC);
```

`snapshot` JSONB shape:
```json
{
  "topPokemon": [
    { "name": "Flutter Mane", "count": 142, "pct": 0.41 }
  ],
  "topCores": [
    { "pokemon": ["Flutter Mane", "Urshifu"], "count": 38 }
  ],
  "archetypeDistribution": {
    "Rain": 0.28, "Trick Room": 0.19
  },
  "topItems": [
    { "name": "Choice Specs", "count": 89 }
  ],
  "topMoves": [
    { "name": "Protect", "count": 210 }
  ]
}
```

### `pokemon_usage_history`

Weekly usage samples. Appended by cron; queried to compute trend deltas.

```sql
CREATE TABLE pokemon_usage_history (
  id          SERIAL PRIMARY KEY,
  pokemon     TEXT NOT NULL,
  regulation  TEXT NOT NULL,
  week_start  DATE NOT NULL,
  count       INTEGER NOT NULL,
  total_reports INTEGER NOT NULL,     -- denominator for usage pct
  usage_pct   NUMERIC(5,4) NOT NULL,
  UNIQUE (pokemon, regulation, week_start)
);

CREATE INDEX idx_usage_history_lookup
  ON pokemon_usage_history(pokemon, regulation, week_start DESC);
```

---

## Aggregation Strategy: Cron-Based (Not On-Demand)

**Why:** Vercel Hobby has a 10-second serverless timeout. Aggregating over potentially thousands of public reports at request time will exceed this as data grows. Pre-aggregation is the only viable path.

**How it works:**

1. The existing `daily-ops` cron at 9am is extended with a `runMetaAggregation()` sub-task.
2. The aggregation function runs the following queries against `shares WHERE is_public = TRUE AND deleted_at IS NULL`:

```
For each (regulation, window_days) pair in [(all, 7), (all, 30), (Reg H, 7), (Reg H, 30), ...]:
  a. Parse paste text for all matching reports → extract species, items, moves
  b. Count occurrences → top Pokemon, top items, top moves
  c. Count 2-Pokemon co-occurrences → top cores
  d. Read archetype tags → archetype distribution
  e. Upsert into meta_snapshots
  f. Append a row to pokemon_usage_history for each top-30 Pokemon
  g. Invalidate Redis key meta:* for this regulation
```

3. Client calls `/api/meta?regulation=Reg+H&window=7` → Redis hit (1h TTL) → Postgres fallback.

**Computational concern:** Parsing JSONB paste strings for every report is expensive. Mitigate by:
- Limiting to the most recent `window_days` rather than full history
- Using PostgreSQL string functions to extract species names server-side (JSONB `->>'paste'` with `regexp_matches`) rather than loading all pastes into Node
- Capping aggregation at 2,000 most-recent public reports per window (covers practical usage; revisit when dataset grows)

---

## Architectural Patterns

### Pattern 1: Snapshot + TTL Cache for Aggregates

**What:** Cron computes expensive aggregates and writes to a `meta_snapshots` table. API routes read the latest snapshot and cache in Redis with a 1h TTL. No aggregation happens at request time.

**When to use:** Any stat that requires scanning many rows. Top Pokemon, archetype distribution, trend deltas, core pairs.

**Trade-offs:** Data is up to 25 hours stale (cron runs once/day + 1h Redis TTL). Acceptable for meta stats; unacceptable for individual report data (which stays live).

```typescript
// /api/meta route skeleton
export async function GET(request: Request) {
  const { regulation, window } = parseParams(request);
  const cacheKey = `meta:${regulation}:${window}`;

  const cached = await cacheGet<MetaSnapshot>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const sql = getDb();
  const [row] = await sql`
    SELECT snapshot, report_count, computed_at
    FROM meta_snapshots
    WHERE regulation = ${regulation} AND window_days = ${window}
    ORDER BY computed_at DESC
    LIMIT 1
  `;

  if (!row) return NextResponse.json({ available: false });

  await cacheSet(cacheKey, row, 3600); // 1h
  return NextResponse.json(row);
}
```

### Pattern 2: Trend Delta from Usage History

**What:** Trend direction (rising/falling) for a Pokemon is computed as the delta between this week's usage pct and last week's. Stored in `pokemon_usage_history`; queried when building the meta snapshot.

**When to use:** Any "trending" indicator. Same pattern applies to archetypes.

**Trade-offs:** Requires at least 2 weeks of data before trends are meaningful. Display gracefully with "not enough data" state.

```typescript
// Inside aggregation function
const delta = thisWeekPct - lastWeekPct;
const trend = delta > 0.02 ? "rising" : delta < -0.02 ? "falling" : "stable";
```

### Pattern 3: Counter Query as Extended Explore Filter

**What:** "Find teams that counter X" is implemented as an additional filter mode on `/api/explore`. A lookup table (hardcoded or config-driven) maps threats to their typical counters, then the explore query adds `AND s.data->>'paste' ILIKE ANY(counterSpecies)` conditions.

**When to use:** Counter-team discovery feature. Keeps the API surface minimal (one enhanced explore endpoint vs a separate counter endpoint).

**Trade-offs:** Counter mappings must be maintained. Start with a curated list of ~20 meta threats → their 2-3 primary counters. Accuracy is "good enough for discovery" not tournament-grade.

```typescript
// Counter lookup map (lib/data/counter-map.ts)
export const COUNTER_MAP: Record<string, string[]> = {
  "Flutter Mane":  ["Incineroar", "Ting-Lu", "Kingambit"],
  "Urshifu":       ["Togekiss", "Rillaboom", "Amoonguss"],
  "Calyrex-Shadow":["Kingambit", "Ting-Lu", "Incineroar"],
  // ...
};

// In /api/explore route
if (counterTarget) {
  const counters = COUNTER_MAP[counterTarget] ?? [];
  if (counters.length > 0) {
    // Find teams containing at least 2 of the counter species
    conditions.push(sql`(
      ${counters.map(c => sql`s.data->>'paste' ILIKE ${'%' + c + '%'}`).reduce(...)}
    )`);
  }
}
```

### Pattern 4: Inspiration Score via Diversity Heuristic

**What:** "Novel/creative" teams are scored by how different their species composition is from the meta snapshot's top Pokemon. Score = fraction of team members NOT in top-10 meta Pokemon. Computed at explore query time for the current result set, not pre-aggregated.

**When to use:** Inspiration feed sort mode. Feasible at request time because score only needs the top-10 list (small, cached) and the species array already extracted per report.

**Trade-offs:** Not a deep creative-quality signal, but an inexpensive proxy. Users understand "uses fewer meta Pokemon = more creative."

```typescript
// In /api/explore when sort=inspiration
const metaTopPokemon = await getTopPokemonCached(regulation); // from Redis
const scored = reports.map(r => ({
  ...r,
  inspirationScore: r.species.filter(s => !metaTopPokemon.includes(s)).length / 6,
}));
return scored.sort((a, b) => b.inspirationScore - a.inspirationScore);
```

---

## Data Flow

### Meta Bar Load

```
ExploreContent mounts
    ↓
fetch /api/meta?regulation=current&window=7
    ↓
Redis hit (TTL 1h) → return snapshot
Redis miss → query meta_snapshots → cache → return
    ↓
MetaBar renders top 6 Pokemon sprites + archetype pills
TrendBadge reads delta from snapshot for each Pokemon
```

### Counter Discovery Flow

```
User selects "Counter This: Flutter Mane" in ExploreFilters
    ↓
ExploreContent sets counterTarget state
    ↓
fetch /api/explore?counterTarget=Flutter+Mane&...existing filters
    ↓
Route loads COUNTER_MAP["Flutter Mane"] → ["Incineroar", "Ting-Lu", "Kingambit"]
Adds ILIKE conditions: paste contains at least one counter species
    ↓
Results filtered, cached with counterTarget in cache key (60s TTL)
    ↓
ReportCard renders normally; MetaBar hides (not relevant in counter mode)
```

### Daily Aggregation Flow

```
Vercel cron fires: /api/cron/daily-ops (9am UTC)
    ↓
runMetaAggregation() called alongside existing health/seo/db checks
    ↓
For each (regulation, window) pair:
  Query shares (public, non-deleted, within window)
  Parse paste → extract species, items, moves via SQL regexp_matches
  Count occurrences → build snapshot JSON
  Query pokemon_usage_history for prior week → compute trend deltas
  Upsert meta_snapshots
  Append pokemon_usage_history rows
  cacheInvalidatePrefix("meta:")
    ↓
Discord #builds notified with stats count (e.g. "Meta aggregated: 312 public reports")
```

---

## Component Structure Changes

### New Files

```
src/
├── app/api/
│   ├── meta/
│   │   └── route.ts              # Serves meta_snapshots from Redis/Postgres
│   └── explore/
│       └── route.ts              # MODIFIED — add counterTarget, inspirationMode params
├── components/explore/
│   ├── MetaBar.tsx               # NEW — top Pokemon + archetype strip above grid
│   ├── TrendBadge.tsx            # NEW — rising/falling indicator atom
│   ├── InspirationToggle.tsx     # NEW — toggle switch for inspiration feed mode
│   └── ReportCard.tsx            # MODIFIED — accepts optional trendData prop
├── lib/
│   ├── data/
│   │   └── counter-map.ts        # NEW — threat → counter species mapping
│   └── meta/
│       └── aggregation.ts        # NEW — runMetaAggregation() used by cron
```

### Modified Files

```
src/
├── lib/
│   └── cache.ts                  # Add CacheKeys.meta(), CacheTTL.META_SNAPSHOT (3600s)
├── lib/
│   └── db.ts                     # Add meta_snapshots and pokemon_usage_history table creation
├── app/api/cron/
│   └── daily-ops/route.ts        # Add runMetaAggregation() call in parallel
└── components/explore/
    ├── ExploreContent.tsx         # Add counterTarget, inspirationMode, metaData state
    └── ExploreFilters.tsx         # Add counter-query chip + inspiration toggle
```

---

## API Route Structure

### `/api/meta` (NEW)

```
GET /api/meta?regulation=Reg+H&window=7

Response:
{
  "topPokemon": [{ "name": "Flutter Mane", "count": 142, "pct": 0.41, "trend": "rising" }],
  "topCores": [{ "pokemon": ["Flutter Mane", "Urshifu"], "count": 38 }],
  "archetypeDistribution": { "Rain": 0.28 },
  "reportCount": 312,
  "computedAt": "2026-04-03T09:00:00Z"
}
```

### `/api/explore` (MODIFIED — backward-compatible additions)

New optional params:
- `counterTarget=Flutter+Mane` — filter to teams containing counter species
- `sort=inspiration` — sort by diversity/novelty score (new sort mode)
- `trendWindow=7` — attach trend data to results (default: omit for perf)

Existing params unchanged. All new params are opt-in, no breaking changes.

---

## Client-Side State Changes

`ExploreContent` gains two new state fields:

```typescript
// NEW state in ExploreContent
const [counterTarget, setCounterTarget] = useState<string>("");
const [inspirationMode, setInspirationMode] = useState(false);
const [metaSnapshot, setMetaSnapshot] = useState<MetaSnapshot | null>(null);

// MetaBar data loaded once on mount (not on every filter change)
useEffect(() => {
  fetch(`/api/meta?regulation=${regulation || "all"}&window=7`)
    .then(r => r.json())
    .then(setMetaSnapshot)
    .catch(() => {});
}, [regulation]);
```

MetaBar is rendered above the filters strip — always visible, not re-fetched on filter changes. Only re-fetches when regulation filter changes.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Neon Postgres | Add two tables via `ensureTable()` in `db.ts` | Same `getDb()` pattern; add CREATE TABLE IF NOT EXISTS blocks |
| Upstash Redis | Extend `CacheKeys` and `CacheTTL` in `cache.ts` | No structural changes; new key prefixes only |
| Vercel Cron | Add `runMetaAggregation` to existing `daily-ops` | Stays within Hobby 1 cron/day limit; runs in parallel with existing checks |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `daily-ops` cron ↔ `lib/meta/aggregation.ts` | Direct import + function call | Keep aggregation logic in `lib/` not inline in route handler |
| `/api/meta` ↔ `MetaBar` component | Fetch on mount, no polling | Separate from explore fetch to avoid coupling |
| `/api/explore` ↔ `lib/data/counter-map.ts` | Direct import | Counter map is static config, not a DB lookup |
| `MetaBar` ↔ `ReportCard` | No direct coupling | MetaBar passes `trendData` map via ExploreContent prop drilling or React context |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| < 1k public reports | Current approach works; cron aggregation completes in under 1s |
| 1k–10k public reports | Paste parsing in SQL (regexp_matches) stays fast; snapshot upsert is a single write |
| 10k–50k public reports | Add LIMIT on per-window queries (e.g. most recent 5,000 reports); trend data stays accurate |
| 50k+ public reports | Move aggregation to a separate background job (Vercel Pro or external worker); daily-ops cron just triggers it |

### Scaling Priorities

1. **First bottleneck:** Cron aggregation time (paste parsing over large dataset). Fix: SQL-side extraction with indexed `created_at` range filter rather than loading all JSONB into Node.
2. **Second bottleneck:** `/api/explore` counter queries with ILIKE on large `paste` text. Fix: add a pre-computed `species_array` column (TEXT[]) populated on insert, then use `@>` array containment operator instead of ILIKE string matching.

---

## Anti-Patterns

### Anti-Pattern 1: On-Demand Aggregation

**What people do:** Run `SELECT ... GROUP BY` across all public reports inside the `/api/explore` or `/api/meta` request handler.

**Why it's wrong:** Vercel serverless has a 10s timeout. With thousands of reports this will time out. Even if it doesn't, it creates load spikes on every explore page visit.

**Do this instead:** Pre-aggregate in the daily cron; serve from the snapshot + Redis cache at request time.

### Anti-Pattern 2: Separate `/meta` Page

**What people do:** Build a standalone meta page with its own routing and state.

**Why it's wrong:** Fragments the user journey. Players want to see meta context while browsing teams, not navigate away. Also splits SEO surface area.

**Do this instead:** Surface meta intelligence inline on `/explore` via the MetaBar and TrendBadge components. This is also explicitly in scope per PROJECT.md.

### Anti-Pattern 3: Counter Map in Database

**What people do:** Store the threat → counter relationships in a `counter_map` table to allow admin editing.

**Why it's wrong:** Over-engineered for v5.0. Counter relationships are game-knowledge (stable within a regulation), not user data. DB adds a query round-trip and migration overhead.

**Do this instead:** Hardcode in `lib/data/counter-map.ts` as a TypeScript constant. It's versioned with the code, trivially updated, and zero query cost.

### Anti-Pattern 4: Fetching Meta on Every Filter Change

**What people do:** Include meta snapshot data in the `/api/explore` response so it always updates with filters.

**Why it's wrong:** The meta snapshot represents the broad meta, not the filtered subset. Including it in every explore response doubles response payload size and the snapshot doesn't change per filter.

**Do this instead:** Fetch `/api/meta` once on mount (when regulation changes). Keep it decoupled from the paginated explore fetch.

---

## Build Order

The architecture has clear dependency tiers. Build in this order:

**Tier 1 — Data Foundation (no UI yet)**
1. `db.ts` — add `meta_snapshots` and `pokemon_usage_history` table creation
2. `lib/meta/aggregation.ts` — write and test `runMetaAggregation()`
3. `daily-ops/route.ts` — wire in aggregation as parallel sub-task
4. `cache.ts` — add `CacheKeys.meta()` and `CacheTTL.META_SNAPSHOT`

**Tier 2 — API Routes**
5. `/api/meta/route.ts` — snapshot serve route
6. `/api/explore/route.ts` — extend with `counterTarget` + `inspirationMode` params
7. `lib/data/counter-map.ts` — static counter lookup data

**Tier 3 — UI Components**
8. `TrendBadge.tsx` — atomic component (no data dependency beyond prop)
9. `MetaBar.tsx` — consumes `/api/meta` directly
10. `ReportCard.tsx` — accept optional trend data prop, render TrendBadge
11. `ExploreFilters.tsx` — add counter-query chip and inspiration toggle
12. `ExploreContent.tsx` — wire MetaBar, new filter state, updated fetch params
13. `InspirationToggle.tsx` — can be built inline with ExploreFilters

---

## Sources

- Direct inspection of `src/app/api/explore/route.ts` (JSONB query patterns, filter implementation)
- Direct inspection of `src/lib/cache.ts` (Redis key structure, TTL values)
- Direct inspection of `src/lib/db.ts` (existing table schema, 15 tables)
- Direct inspection of `src/app/api/cron/daily-ops/route.ts` (parallel sub-task pattern)
- Direct inspection of `src/components/explore/` (ExploreContent state management, component tree)
- `vercel.json` — confirms Hobby cron schedule constraints (4 daily crons, fits Hobby limit)
- `src/lib/data/tags.ts` — confirms ARCHETYPES, REGULATIONS, EVENT_TYPES constants
- `src/lib/analysis/detect-archetype.ts` — confirms archetype detection runs client-side on full AnalyzedPokemon data (not on explore page; tags stored in `data.tags` JSONB)

---

*Architecture research for: VGC Team Report v5.0 Smart Discovery & Meta Intelligence*
*Researched: 2026-04-03*
