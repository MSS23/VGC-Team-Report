# Stack Research

**Domain:** Smart Discovery & Meta Intelligence — v5.0 additions to VGC Team Report
**Researched:** 2026-04-03
**Confidence:** HIGH (core stack additions) / MEDIUM (trend scoring approach)

---

## Context: What Already Exists (Do Not Re-Introduce)

The following are **in production** and need no new packages:

| Capability | Already Provided By |
|------------|---------------------|
| Database queries | `@neondatabase/serverless` ^1.0.2 + raw SQL |
| Caching | `@upstash/redis` ^1.37.0 with TTL-based `cacheGet`/`cacheSet` |
| Full-text search | Postgres `tsvector` + GIN index on `shares` |
| JSONB querying | Native Postgres on `shares.data` JSONB column |
| Authentication | `@clerk/nextjs` ^7.0.6 |
| Validation | `zod` ^4.3.6 |
| Background jobs | Vercel cron (daily only on Hobby tier) → `/api/cron/daily-ops` + `/api/cron/weekly-report` |

**No new npm packages are required for the core v5.0 features.** All new capability comes from SQL patterns and Redis data structures already available in the stack.

---

## New Capabilities Required

### 1. Meta Aggregation Table (Postgres)

**What:** A dedicated `meta_snapshots` table storing pre-computed aggregation results as JSONB, keyed by `(regulation, snapshot_date)`.

**Why a table over a materialized view:**
- Neon Postgres supports `REFRESH MATERIALIZED VIEW CONCURRENTLY` (requires a UNIQUE index), but `pg_cron` is only available on Neon **paid plans** and requires a support ticket + compute restart to enable.
- A plain table refreshed by the existing `/api/cron/daily-ops` route is simpler, works on the free tier, and fits the existing cron infrastructure.
- The Vercel Hobby cron limit (1x/day max, 2 cron jobs max) is already saturated by `daily-ops` and `weekly-report`. Triggering a `REFRESH MATERIALIZED VIEW` from inside `daily-ops` is viable, but a plain table is easier to partially invalidate and inspect.

**Schema addition (raw SQL migration in `db.ts`):**

```sql
CREATE TABLE IF NOT EXISTS meta_snapshots (
  id SERIAL PRIMARY KEY,
  regulation TEXT NOT NULL,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  window_days INTEGER NOT NULL,           -- 7, 30, 90
  top_pokemon JSONB NOT NULL DEFAULT '[]',
  top_archetypes JSONB NOT NULL DEFAULT '[]',
  popular_cores JSONB NOT NULL DEFAULT '[]',
  total_reports INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(regulation, snapshot_date, window_days)
);
CREATE INDEX IF NOT EXISTS idx_meta_snapshots_lookup
  ON meta_snapshots(regulation, window_days, snapshot_date DESC);
```

**JSONB shape for `top_pokemon`:**
```json
[
  { "species": "Flutter Mane", "count": 142, "usage_pct": 34.2,
    "prev_count": 120, "trend": "rising" }
]
```

The `trend` field is computed at write time (not a separate package) using a simple window comparison: compare current 7-day count to prior 7-day count on the same regulation. A >10% increase = `"rising"`, >10% decrease = `"falling"`, else `"stable"`. This is intentionally simple — no time-series library needed at this scale.

---

### 2. Trend Detection — Pure SQL Window Function

**What:** Compare two adjacent time windows using Postgres window functions to produce a trend label.

**Why no library:** The dataset is small (app's own public reports — likely hundreds to low thousands at any point). A simple percentage delta between `COUNT(*)` for `updated_at >= NOW() - INTERVAL '7 days'` vs the prior 7 days is sufficient and runs in a single aggregation query at cron time. The result is stored in `meta_snapshots.top_pokemon[*].trend`.

**Core query pattern (runs during daily-ops cron, no new dependencies):**

```sql
WITH current_window AS (
  SELECT trim(lower(unnest(string_to_array(data->>'paste', E'\n')))) AS line,
         id
  FROM shares
  WHERE is_public = TRUE AND deleted_at IS NULL
    AND updated_at >= NOW() - INTERVAL '7 days'
    AND data->'tags'->>'regulation' = $1
),
prior_window AS (
  SELECT trim(lower(unnest(string_to_array(data->>'paste', E'\n')))) AS line,
         id
  FROM shares
  WHERE is_public = TRUE AND deleted_at IS NULL
    AND updated_at >= NOW() - INTERVAL '14 days'
    AND updated_at <  NOW() - INTERVAL '7 days'
    AND data->'tags'->>'regulation' = $1
)
-- ... species extraction + count + pct delta → trend label
```

Note: The actual species extraction from paste text is already handled by `extractSpecies()` in `src/lib/utils/extract-species.ts`. For the aggregation query, a SQL-level regex or `string_to_array` approach extracts the first non-blank line of each team block to get species names.

---

### 3. Counter-Archetype Query — Postgres GIN + JSONB

**What:** "Find teams that contain both [species A] and [species B]" or "teams tagged with archetype [X] that also run [species]".

**Why no new library:** The existing explore query already does multi-species `AND` filtering via chained `ILIKE` on `data->>'paste'`. The counter-team discovery query is the same pattern with archetype conditions added from `data->'tags'->'archetype'`.

**Addition needed:** A GIN index on the archetype JSONB array for performance:

```sql
CREATE INDEX IF NOT EXISTS idx_shares_archetype_gin
  ON shares USING GIN ((data->'tags'->'archetype'))
  WHERE is_public = TRUE AND deleted_at IS NULL;
```

The `?|` operator (already used in the explore route) uses this index automatically.

---

### 4. Diversity / Novelty Scoring — Postgres + Redis

**What:** Surface creative/unusual builds for the "Inspiration Feed". Score novelty by how different a team's species composition is from the top-10 most common species in the current regulation.

**Algorithm (pure SQL, no library):**
- Fetch `top_10_species` from today's `meta_snapshots` row.
- For each candidate report, count how many of its 6 species appear in `top_10_species`.
- `novelty_score = 6 - overlap_count` (0 = all meta, 6 = completely off-meta).
- Threshold: score >= 3 surfaces to Inspiration Feed.
- Tie-break by `reactions_count DESC` so popular creative teams rank above obscure ones.

This computation runs in the explore API response (< 1ms per row) using a passed-in array of top species from the cached meta snapshot. No additional library needed.

---

### 5. Redis Sorted Sets — Trend Ranking Cache (Upstash, already installed)

**What:** Cache the pre-computed `top_pokemon` rankings in a Redis sorted set so the explore page can read trend badges without hitting Postgres.

**Why sorted sets over a plain JSON key:** `ZADD` / `ZREVRANGE` on `@upstash/redis` (already in package.json) allows incrementally updating a single species' score without rewriting the entire JSON blob. Useful if a future real-time signal (e.g. new report published) needs to bump a counter.

For v5.0, a **plain cache key** (`CacheKeys.metaSnapshot(regulation, windowDays)`) with a 6-hour TTL is sufficient — sorted sets are the upgrade path if per-event invalidation is needed later.

**Cache key additions to `src/lib/cache.ts` (no new package):**
```typescript
metaSnapshot: (regulation: string, days: number) =>
  `meta:snapshot:${regulation}:${days}d`,
trendBadge: (species: string, regulation: string) =>
  `meta:trend:${species}:${regulation}`,
```

**TTL additions:**
```typescript
META_SNAPSHOT: 6 * 60 * 60,  // 6 hours — refreshed once daily by cron
TREND_BADGE:   6 * 60 * 60,  // 6 hours — same cadence
```

---

## Recommended Stack (Net-New Additions)

### Core Technologies

No new npm packages required.

### Supporting Libraries

No new npm packages required. All patterns use existing `@neondatabase/serverless` + `@upstash/redis`.

### New SQL Artifacts (migrations in `db.ts`)

| Artifact | Type | Purpose |
|----------|------|---------|
| `meta_snapshots` | Table | Pre-aggregated meta stats per regulation + time window |
| `idx_meta_snapshots_lookup` | B-tree index | Fast lookup by regulation + window + date |
| `idx_shares_archetype_gin` | GIN index | Fast `?|` archetype filtering in counter-team queries |

### New Cache Keys (in `src/lib/cache.ts`)

| Key | TTL | Purpose |
|-----|-----|---------|
| `meta:snapshot:{regulation}:{days}d` | 6h | Full meta snapshot JSON |
| `meta:trend:{species}:{regulation}` | 6h | Single-species trend badge |
| `explore:counter:{params}` | 5min | Counter-team query results |
| `explore:inspiration:{regulation}` | 30min | Inspiration feed results |

### Cron Integration

The existing `/api/cron/daily-ops` route absorbs the meta aggregation job. A new `runMetaAggregation()` function is added to that file. **No new cron route needed** — Vercel Hobby is capped at 2 cron jobs and both slots are taken.

---

## Installation

Nothing new to install.

```bash
# No new packages. All capability from existing stack.
# @neondatabase/serverless ^1.0.2  — already installed
# @upstash/redis ^1.37.0           — already installed
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Dedicated `meta_snapshots` table, refreshed by existing cron | Postgres materialized view | `pg_cron` is paid-only on Neon; `REFRESH` from app code works but a plain table is simpler to partially invalidate and inspect |
| Plain SQL window functions for trend | `simple-statistics` or similar npm library | Overkill — the comparison is a single percentage delta; adding a dependency for one formula is waste |
| Postgres JSONB `?|` operator + GIN index for counter queries | Elasticsearch / Algolia for search | tsvector already handles text search; JSONB GIN handles structured array containment; no external service needed at this scale |
| Upstash Redis plain cache key for meta snapshots | Redis sorted sets | Sorted sets add complexity without benefit at daily refresh cadence; revisit if real-time signals are added |
| Novelty scoring via species overlap count (pure SQL) | ML embeddings / cosine similarity | 6-pokemon teams have tiny feature space; simple overlap count is interpretable and fast; ML is premature |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `simple-statistics`, `ml-matrix`, or any stats library | Trend detection is a percentage delta between two counts — one formula, zero library | Plain arithmetic in the cron function |
| Elasticsearch / Meilisearch | tsvector already handles full-text; JSONB handles structured filters; adding a search service adds ops burden and cost | Existing tsvector + GIN index |
| `pg_cron` extension | Paid Neon plans only, requires support ticket + compute restart; Vercel Hobby cron serves the same need | Existing `/api/cron/daily-ops` route |
| Timescale or InfluxDB | VGC meta data changes daily at most; time-series DB is massive overkill for a dataset counted in thousands | Postgres with `snapshot_date` column on `meta_snapshots` |
| Drizzle ORM or Prisma | Existing codebase uses raw SQL with `@neondatabase/serverless` throughout; introducing an ORM mid-project creates dual patterns and type conflicts | Continue raw SQL |
| External API (Pikalytics, Smogon stats) | Out of scope per PROJECT.md; creates external dependency and rate-limit risk | App's own `shares` data only |

---

## Stack Patterns by Variant

**If the dataset grows past ~10K public reports (future concern):**
- Move aggregation from full-table scan to incremental: add `last_aggregated_at` to `meta_snapshots` and only process shares newer than that timestamp.
- Consider Redis sorted sets (`ZINCRBY`) on every new share publish to maintain running counts without full recompute.

**If Vercel Pro is ever adopted:**
- Add a 15-min cron for live trend updates (currently blocked by Hobby daily limit).
- Enable `pg_cron` on Neon for database-side refresh of a materialized view.

**If counter-team queries need ranking by meta-effectiveness (not just presence):**
- Add a `weakness_profile` JSONB column to shares, populated at publish time by the existing `detect-archetype.ts` logic.
- Filter/sort by type overlap in the explore query using JSONB containment operators.

---

## Version Compatibility

All existing. No new version constraints introduced.

| Package | Version in Use | Compatible With |
|---------|---------------|-----------------|
| `@neondatabase/serverless` | ^1.0.2 | Neon Postgres 16+ (all JSONB, GIN, window functions available) |
| `@upstash/redis` | ^1.37.0 | `ZADD`, `ZREVRANGE`, `GET`, `SET EX` — all used patterns supported |

---

## Sources

- [Neon Docs — pg_cron extension](https://neon.com/docs/extensions/pg_cron) — confirmed paid-plan-only, compute must be active (HIGH confidence)
- [Vercel Docs — Cron Jobs Usage & Pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing) — confirmed Hobby = daily max, 2 job limit (HIGH confidence)
- [Neon Guides — Caching with Materialized Views](https://neon.com/guides/caching-with-materialized-views) — `REFRESH MATERIALIZED VIEW CONCURRENTLY` supported, requires UNIQUE index (HIGH confidence)
- [PostgreSQL Docs — Aggregate Functions](https://www.postgresql.org/docs/current/functions-aggregate.html) — `jsonb_agg`, `string_to_array`, window functions (HIGH confidence)
- [Upstash Blog — Redis Sorted Sets for Ranking](https://upstash.com/blog/redis-autocomplete-popularity-ranking) — sorted set patterns with `@upstash/redis` (HIGH confidence)
- [Medium — Views vs Materialized Views vs Rollup Tables](https://stefan-poeltl.medium.com/views-v-s-materialized-views-v-s-rollup-tables-with-postgresql-2b3824b45330) — dedicated aggregation table rationale (MEDIUM confidence)

---

*Stack research for: VGC Team Report v5.0 — Smart Discovery & Meta Intelligence*
*Researched: 2026-04-03*
