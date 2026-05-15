# VGC-182: SQL Aggregation Refactor Plan
_Date: 2026-05-15_

---

## 1. Current Code Flow

```
GET /api/champions/meta
  │
  ├─ Cache hit? → return cached ChampionsMetaResult
  │
  ├─ SQL: SELECT data->>'paste' AS paste FROM shares
  │        WHERE is_public = TRUE AND deleted_at IS NULL
  │          AND (regulation ILIKE '%champion%' OR '%reg-m%' ...)
  │        ORDER BY created_at DESC LIMIT 500
  │
  ├─ JS loop over up to 500 rows:
  │    extractSpecies(paste) → parse Showdown paste text per block
  │      - split on /\n\s*\n/   (blank-line block separator)
  │      - take first line of each block
  │      - strip "@ Item", gender suffix "(M)"/"(F)"
  │      - detect "Nickname (Species)" vs bare species name
  │      - return up to 6 species per paste
  │
  ├─ Aggregate species into Map<string, count>
  │    (de-duped per team via Set before counting)
  │
  └─ Sort, slice top 20, compute percentages → cache + respond
```

### Key Data Shape

The `shares` table stores the entire app state as a single JSONB column `data`. Species information is **not pre-extracted** anywhere. The only path to species names is:

```
data->>'paste'   →  raw Showdown paste text (string)
```

The paste is standard Pokémon Showdown export format, e.g.:

```
Pikachu @ Light Ball
Ability: Static
...

Charizard @ Leftovers
...
```

Blank lines separate each Pokémon block. Species is the first token on line 1 of each block, following the parsing rules in `extractSpecies()`.

There is **no pre-structured species array** stored in the JSONB. The `data` object has fields like `paste`, `notes`, `calcs`, `roles`, `teamSummary`, `matchupPlans`, `tags`, but species are always derived from the raw paste text at query time.

---

## 2. What PostgreSQL Can Do Here

### 2a. `regexp_split_to_table` + regex extraction

PostgreSQL 14+ (Neon runs PG 16) supports:

```sql
regexp_split_to_table(text, pattern)
regexp_replace(text, pattern, replacement, flags)
```

We can split the paste on blank lines and extract the species name from the first line of each block.

The JS logic in full:
1. Split on `/\n\s*\n/` → blocks
2. Take `block.trim().split('\n')[0].trim()` → first line
3. Strip `@ Item` suffix
4. Strip trailing ` (M)` or ` (F)` gender marker
5. If first line matches `Anything (Species)` → species = inner match; else species = whole thing
6. Take up to 6 per paste

A PostgreSQL equivalent using a single CTE per row is feasible but **complex**:

```sql
-- Pseudocode: extract species from one block's first line
WITH block_first_lines AS (
  SELECT
    id,
    -- split paste into blocks on blank line, get first line of each block
    regexp_split_to_table(data->>'paste', E'\\n[\\t ]*\\n') AS block
  FROM shares
  WHERE is_public = TRUE AND deleted_at IS NULL
    AND (
      data->>'regulation' ILIKE '%champion%'
      OR data->>'regulation' ILIKE '%reg-m%'
      OR data->'tags'->>'regulation' ILIKE '%champion%'
      OR data->'tags'->>'regulation' ILIKE '%reg-m%'
    )
  ORDER BY created_at DESC
  LIMIT 500  -- keep same row cap during transition
),
block_lines AS (
  SELECT
    id,
    -- first line of each block
    trim(split_part(trim(block), E'\\n', 1)) AS first_line
  FROM block_first_lines
  WHERE trim(block) <> ''
),
species_raw AS (
  SELECT
    id,
    -- strip "@ Item" suffix
    trim(split_part(first_line, ' @ ', 1)) AS name_part
  FROM block_lines
),
species_extracted AS (
  SELECT
    id,
    CASE
      -- "Nickname (Species) (M)/(F)" or "Nickname (Species)"
      -- strip trailing gender marker first
      WHEN trim(regexp_replace(name_part, E'\\s+\\([MF]\\)\\s*$', '')) ~ E'^.+\\((.+)\\)$'
        THEN trim(regexp_replace(
               regexp_replace(trim(regexp_replace(name_part, E'\\s+\\([MF]\\)\\s*$', '')), E'^.+\\(', ''),
               '\\)$', ''))
      ELSE trim(regexp_replace(name_part, E'\\s+\\([MF]\\)\\s*$', ''))
    END AS species
  FROM species_raw
),
-- cap at 6 per share (team size limit), de-dup within team
numbered AS (
  SELECT
    id,
    species,
    row_number() OVER (PARTITION BY id ORDER BY ctid) AS rn
  FROM species_extracted
  WHERE species <> ''
),
per_team_deduped AS (
  SELECT DISTINCT id, species
  FROM numbered
  WHERE rn <= 6
),
-- final aggregation
counts AS (
  SELECT species, count(*) AS usage_count
  FROM per_team_deduped
  GROUP BY species
)
SELECT
  species AS name,
  usage_count AS count,
  round(usage_count * 100.0 / (SELECT count(DISTINCT id) FROM per_team_deduped)) AS percentage
FROM counts
ORDER BY usage_count DESC
LIMIT 20;
```

### 2b. Why the regex CTE is tricky

| Challenge | Detail |
|-----------|--------|
| Blank-line split | `regexp_split_to_table(paste, E'\\n[\\t ]*\\n')` handles it but empty blocks slip through and need filtering |
| Nested parens (species match) | The JS regex `^.+\((.+)\)$` is greedy; in SQL `regexp_replace` + `regexp_match` can replicate it but the composition is verbose |
| `ctid` for ordering | Row number within `regexp_split_to_table` output is undefined order — we rely on `ctid` or a window ordering hack which is fragile |
| Unicode whitespace | The JS parser normalises ` ` etc.; SQL `trim()` only strips ASCII space by default |
| No `LIMIT 6 per group` in one pass | Requires the numbered CTE + filter, adding another pass |

### 2c. JSONB path: no shortcut exists

There is no pre-extracted species array in `data`. The `data->'tags'` object only has `regulation`, `eventType`, `archetype` (archetype is a free-text tag, not a species list). `data->'roles'` is a `Record<species, role>` but it is user-annotated and may be empty. It is **not** reliable as a species source.

---

## 3. Gotchas

### 3.1  Paste quality variance
Real user pastes may have:
- Trailing/leading whitespace within blocks
- Non-standard line endings (`\r\n`)
- Unicode non-breaking spaces (the JS parser handles ` `; SQL `trim` does not)
- Empty pastes (saved reports with no Pokémon)
- Pastes with only 1–5 Pokémon (legitimate partial teams)

The JS `extractSpecies` already handles all of these. A SQL rewrite must replicate each edge case.

### 3.2  Row limit still applies
Even a pure-SQL aggregation needs a row cap. The `LIMIT 500` at the top level prevents unbounded table scans. The existing `created_at DESC` ordering means recent data is always used. This should be kept regardless of approach.

### 3.3  Neon serverless query cost
Neon charges on compute time. A single aggregate query replacing 500 rows of data transfer + JS computation will likely be faster wall-clock (no JS parse loop) but the SQL plan is complex. A simpler query over fewer rows is always cheaper. An index on `(created_at DESC) WHERE is_public = TRUE AND deleted_at IS NULL` already exists (`idx_shares_public_updated`) — the filter + sort is already efficient; the bottleneck is data volume shipped to the serverless function.

### 3.4  `ctid` ordering is not stable
Using `ctid` to order blocks within `regexp_split_to_table` output is technically correct for a single statement but is not guaranteed by the SQL standard. A better approach is to unnest with `WITH ORDINALITY`:

```sql
regexp_split_to_table(paste, E'\\n[\\t ]*\\n') WITH ORDINALITY AS t(block, block_num)
```

This gives stable block ordering.

### 3.5  `regulation` filter lives in two places
The current filter checks both `data->>'regulation'` and `data->'tags'->>'regulation'`. This dual-path lookup suggests the schema evolved. Both paths must be preserved in any SQL rewrite.

---

## 4. Recommendation: Hybrid Approach

**Push the row selection and species extraction into SQL; keep aggregation in SQL; but validate with a safe intermediate step.**

### Phase 1 (Recommended for VGC-182): Pure SQL aggregation

Replace the current JS loop with a single SQL query that returns already-aggregated `(species, count)` pairs. This is achievable and will:
- Eliminate transferring 500 paste blobs to the serverless function (each paste can be 2–10 KB → up to 5 MB of text per request)
- Remove the JS parse loop entirely
- Return only 20 rows to the function

The SQL complexity is justified by the bandwidth and latency savings. Use `WITH ORDINALITY` for stable block ordering and a chain of CTEs to replicate the JS logic step by step.

### What stays in JS
- The `totalReports` count (easily added as a second column in the CTE: `SELECT count(DISTINCT id)`)
- `hasEnoughData` guard (compare `totalReports >= 5` in JS on the returned count)
- Percentage calculation (can also be done in SQL with the count CTE, but JS is fine too)
- Cache read/write (unchanged)

### Phase 2 (Future, not VGC-182): Materialized column
If the dataset grows beyond 500 rows frequently (the warning at line 67–71 already fires), add a generated/indexed `species text[]` column populated on write via the share POST route, then aggregate directly on the array column. This requires a schema migration and changes to `src/app/api/share/route.ts`.

### Final SQL (production-ready)

```sql
WITH filtered AS (
  SELECT id, data->>'paste' AS paste
  FROM shares
  WHERE is_public = TRUE
    AND deleted_at IS NULL
    AND (
      data->>'regulation' ILIKE '%champion%'
      OR data->>'regulation' ILIKE '%reg-m%'
      OR data->'tags'->>'regulation' ILIKE '%champion%'
      OR data->'tags'->>'regulation' ILIKE '%reg-m%'
    )
  ORDER BY created_at DESC
  LIMIT 500
),
blocks AS (
  SELECT
    f.id,
    t.block_num,
    trim(split_part(trim(t.block), E'\n', 1)) AS first_line
  FROM filtered f,
  LATERAL regexp_split_to_table(
    regexp_replace(f.paste, E'\r\n', E'\n', 'g'), -- normalise CRLF
    E'\n[ \t]*\n'
  ) WITH ORDINALITY AS t(block, block_num)
  WHERE trim(t.block) <> ''
),
name_parts AS (
  SELECT
    id,
    block_num,
    -- strip "@ Item" suffix
    trim(split_part(first_line, ' @ ', 1)) AS name_part
  FROM blocks
  WHERE first_line <> ''
),
gender_stripped AS (
  SELECT
    id,
    block_num,
    -- strip trailing (M) or (F) gender marker
    trim(regexp_replace(name_part, E'\\s+\\([MF]\\)\\s*$', '')) AS stripped
  FROM name_parts
),
species_extracted AS (
  SELECT
    id,
    block_num,
    CASE
      -- "Nickname (Species)" pattern — extract last parenthesised group
      WHEN stripped ~ E'^.+\\s+\\([^)]+\\)$'
        THEN trim(regexp_replace(stripped, E'^.*\\(([^)]+)\\)$', E'\\1'))
      ELSE stripped
    END AS species
  FROM gender_stripped
),
per_team AS (
  -- cap at first 6 blocks, de-dup species within a team
  SELECT DISTINCT id, species
  FROM species_extracted
  WHERE block_num <= 6 AND species <> ''
),
total AS (
  SELECT count(DISTINCT id) AS total_reports FROM per_team
),
counts AS (
  SELECT species, count(*) AS usage_count
  FROM per_team
  GROUP BY species
)
SELECT
  c.species AS name,
  c.usage_count AS count,
  (SELECT total_reports FROM total) AS total_reports
FROM counts c
ORDER BY c.usage_count DESC
LIMIT 20;
```

This single query replaces the entire JS aggregation loop and returns at most 20 rows to the function, with `total_reports` embedded for the `hasEnoughData` check.

---

## 5. Summary Table

| Approach | Pros | Cons |
|----------|------|------|
| **Current (JS loop)** | Simple, easy to debug | Ships ~5 MB paste text per cold request; O(n) JS parse; at cap risk |
| **Hybrid SQL CTEs** (recommended) | Eliminates data transfer; single DB round-trip; stays in Neon compute | Regex CTE is verbose; must replicate edge-cases from JS |
| **Materialized species column** | Fastest reads; trivial aggregate query | Schema migration; write-path changes; out of scope for VGC-182 |

**Decision: Implement the hybrid SQL CTE query for VGC-182.** It is the highest-impact change achievable within the ticket scope, requires no schema changes, and directly addresses both the performance concern (500-row data transfer) and the correctness concern (dataset growth warning in the existing code).
