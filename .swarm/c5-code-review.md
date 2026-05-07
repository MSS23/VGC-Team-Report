# Code Review — Last 20 Commits (main)

**Date:** 2026-05-07  
**Range:** `main~20..main` (8ab0ce9 → 1cde01a)  
**Reviewer:** Claude (automated audit)

---

## Commit Overview

| SHA | Message | Rating |
|-----|---------|--------|
| 1cde01a | docs: changelog v5.7 | Clean |
| 8391625 | Claude dev PR (#7) — VGC-100/106/111/135 | Clean |
| 5cab66b | fix(legality): Rotom forms + multi Mega Stones | Clean |
| 0f8dea5 | feat: meta variant duplicates in speed tiers | Clean |
| 873fc41 | feat: collaborators + popular reports rail (#5) | Clean |
| c44ff25 | fix: 13 Megas un-gated from Coming Soon | Good (follow-up probe needed) |
| ef1d7fb | fix: Mega landing 404 via lookupPokemon | Good |
| 2b21c39 | fix: Featured Teams query bug + filler removal | Good |
| 221eb9a | fix: honest UX for sprite-less Megas | Good |
| 5c44626 | fix: graceful sprite fallback to base form | Has issues (see below) |
| c758c64 | fix: correct Mega abilities (18 wrong) | Concerning — 18 bad abilities shipped |
| d396dcb | fix: Champions hero copy | Clean |
| 03eba0b | fix: Champions page shows only Reg M-A Megas | Good refactor |
| 221da19 | revert: remove OG sprite card from unfurls | Documented dead-end |
| 560c206 | feat: in-line Pokemon replace via search picker | Good; minor bugs noted |
| f317d89 | fix: remove duplicate PageNavbar from /compare | Hot-fix for refactor miss |
| ce5b44e | chore: drop darkMode props on PasteInput | Cleanup |
| f8617f1 | refactor: consolidate PageNavbar → PersistentNavbar | Good architecture |
| a13b91a | fix: restore darkMode props on PasteInput | Revert of broken intermediate state |
| 8ab0ce9 | docs: changelog v5.6 | Clean |

---

## Findings

### 1. Churn Hotspot: Champions/Mega Data Layer (HIGH SEVERITY)

**Files:** `src/lib/data/mega-pokemon.ts`, `src/lib/data/champions-dex.ts`, `src/lib/validation/champions-legality.ts`, `src/app/champions/`

**9 of 20 commits** touched this cluster. The root cause is a bootstrapping anti-pattern:

1. `03eba0b` — Hardcoded 8-entry list discovered to contain 3 illegal Megas (Salamence, Metagross, Mawile). Replaced with derived list from `getRegMAMegas()`. Good fix, but should have been data-driven from day one.
2. `c758c64` — **18 of 29 newly-added Mega abilities were wrong** because the bulk-seeding in `03eba0b` pulled abilities from `@pkmn/dex` base-form fallbacks instead of the actual Pokemon Champions canon. Wrong abilities shipped and were visible on live landing pages until this commit corrected them.
3. `ef1d7fb` — 404s on 45 landing pages because `POKEMON_DATA[dataKey]` was used directly instead of `lookupPokemon()`. The `@pkmn/dex` fallback path built elsewhere was not wired in here.
4. `c44ff25` — Sprite probe logic was initially too strict (checked only 2 of 4 CDN paths), silently gating 13 Megas as "Coming Soon" when they had valid sprites.

**Pattern:** Each commit in this cluster is a fire-drill fix for the previous commit's oversight. The underlying problem is that `CHAMPIONS_DEX` (a `Set<string>` in `champions-dex.ts`) must be kept manually in sync with `CHAMPIONS_REG_MA_MEGAS` (a second `Set<string>` in `mega-pokemon.ts`). A comment at line 187 of `champions-dex.ts` says "should be mirrored here" — a manual sync requirement. If these drift, the speed-tier meta comparisons will show different Pokemon than the Champions index.

**Recommended ticket:** Derive `CHAMPIONS_DEX` Mega entries programmatically from `getRegMAMegas()` at module init time so they cannot diverge. Eliminate the manual mirror comment.

---

### 2. Reverted OG Card — Documented Dead-End but No Alternative Path (MEDIUM)

**Commit:** `221da19`

The OG image card for `/s/{id}` was attempted twice (via `opengraph-image.tsx` convention, then via `/api/team-graphic` wiring) and reverted both times. The comment block in `src/app/s/[id]/page.tsx` lines 85–94 now documents "this is the SECOND time we have tried" and explains the constraint: edge runtime + Showdown sprite CDN dependency + unfurler timeout.

**State:** `images: []` is load-bearing — without it Next.js falls back to the root OG image. This is correctly in place.

**Missing:** No ticket exists for the viable alternative — a pre-rendered server-side OG image that avoids external sprite fetches (e.g., server-side Canvas/Satori with bundled sprite assets, or a self-hosted sprite worker). The comment acknowledges this is possible but defers it with no tracking.

**Recommended ticket:** OG image for shared reports using Satori + bundled sprite subset, avoiding CDN dependency during build/render.

---

### 3. Broken Intermediate State Introduced by Refactor (MEDIUM)

**Commits:** `f8617f1` → `a13b91a` → `ce5b44e` → `f317d89`

The `PersistentNavbar` refactor (consolidating per-page `PageNavbar` into a root layout mount) produced two hot-fixes in rapid succession:

- `a13b91a`: Reverted a call-site change in `page.tsx` that was made assuming WIP had already landed. The WIP hadn't shipped — darkMode props were temporarily re-added.
- `f317d89`: `CompareContent` was missed entirely in the refactor — it still mounted its own `<PageNavbar>`, causing a doubled navbar in production.

This suggests the refactor was not tested across all routes before committing. The `/compare` route is reachable in the app but was presumably not checked during the refactor session.

**Recommended ticket:** Add a route smoke-test list to the pre-push checklist, or add a Playwright test that visits `/`, `/compare`, `/champions`, and a `/s/{id}` link to assert exactly one navbar is present.

---

### 4. `InlinePokemonEditor`: Search Logic Bug and Missing Tests (MEDIUM)

**Commit:** `560c206` — `src/components/report/InlinePokemonEditor.tsx`

**Bug — early break on prefix array size only:**

```typescript
for (const s of index) {
  const lower = s.name.toLowerCase();
  if (lower.startsWith(q)) prefix.push(s);
  else if (lower.includes(q)) contains.push(s);
  if (prefix.length >= 16) break;   // ← breaks when prefix hits 16
}
return [...prefix, ...contains].slice(0, 8);
```

The loop breaks when `prefix.length >= 16`, but at that point `contains` may still be empty because the iteration stopped. If a query like "iron" produces 16+ prefix matches, no contains matches are collected. The break was meant as an early-exit optimization but is placed inside the same loop as the `contains` check, so contains results are silently truncated to whatever was collected before the break. For the actual use-case (short queries, non-English Pokemon names), this is unlikely to be visible in practice, but it is a logic bug.

**Module-level mutable singleton:**

```typescript
let SPECIES_INDEX: SpeciesSuggestion[] | null = null;
```

Module-level mutable state in a client component file is fine in a browser context (one module per page load), but in a Next.js app with server-side rendering this can leak between requests if the module is accidentally evaluated on the server. The component is `"use client"` and loaded via `next/dynamic({ ssr: false })` which mitigates this, but the pattern is fragile. If the `ssr: false` guard is ever removed, requests will bleed into each other.

**No unit tests for `paste-edit.ts`:**  
The commit message says "verified by smoke tests" but `src/lib/utils/__tests__/` has no `paste-edit.test.ts`. The round-trip logic for all four Showdown first-line formats (`"Species @ Item"`, `"Species (M) @ Item"`, `"Nickname (Species)"`, `"Nickname (Species) (F) @ Item"`) is complex enough to warrant its own test file. `export function replaceSpeciesInBlock` is exported and testable without mocks.

**Missing sprite-slug fallback test:**  
`src/lib/utils/__tests__/sprite-slug.test.ts` tests `getSpriteUrls` only for `Garchomp` (4 URLs, non-mega). The Mega fallback path added in `5c44626` — appending base-form URLs for `-mega`/`-megax`/`-megay` slugs — has no test. Specifically: `getSpriteUrls("Mega Excadrill")` should return 8 URLs (4 Mega + 4 base), and `getSpriteUrls("Charizard-Mega-X")` should return 8 (4 megax + 4 charizard).

---

### 5. 29 Placeholder Descriptions on Live SEO Pages (LOW-MEDIUM)

**File:** `src/lib/data/mega-pokemon.ts`

Every one of the 29 bulk-added Megas has the same SEO stub description:

```
"Mega X is a legal Mega Evolution in Pokemon Champions Regulation M-A."
```

These descriptions flow directly into:
- `<meta name="description">` on `/champions/[slug]` landing pages (visible to Google)
- JSON-LD `description` field (visible to AI scrapers)
- `<title>` page metadata generation

29 out of 59 landing pages have identical near-duplicate descriptions. This will suppress search ranking for those pages relative to pages with unique content. The commit comment acknowledges these as "SEO stubs to be expanded iteratively" but there is no tracking ticket.

**Recommended ticket:** Write competitive descriptions for the top 10–15 most-played Reg M-A Megas (Kangaskhan, Lucario, Tyranitar, Garchomp, Gengar + newly-added meta picks). Lower-tier Megas can remain as stubs.

---

### 6. Featured Teams Query — No Index on Pattern ILIKE (LOW)

**File:** `src/app/champions/[pokemon]/page.tsx` lines 92–103

```sql
WHERE s.is_public = TRUE
  AND s.deleted_at IS NULL
  AND (
    s.data->>'paste' ILIKE '%Scizorite%'
    OR s.data->>'paste' ILIKE '%Scizor-Mega%'
  )
ORDER BY s.updated_at DESC
LIMIT 9
```

The fix in `2b21c39` corrected the query logic (requiring Mega Stone OR mega species) but both clauses are `ILIKE` pattern matches on a `jsonb` column extracted via `->>`. These cannot use a standard B-tree index. With low share volume this is fine, but as the dataset grows this will table-scan on every Champions landing page load. The page has `revalidate = 3600` (1-hour ISR) which limits the damage, but it is worth tracking for scale.

**Recommended ticket:** Add a GIN index on `(data->>'paste')` or denormalize Mega Stone / species into a separate indexed column, and assess query plan with `EXPLAIN ANALYZE` once share volume exceeds ~10k rows.

---

## Churn Summary

| File cluster | Commits touching it |
|---|---|
| `mega-pokemon.ts` / `champions-dex.ts` / Champions pages | 9 |
| `page.tsx` (home) | 4 |
| `PasteInput` / layout / navbar hooks | 4 |
| Sharing / OG / `s/[id]/page.tsx` | 2 |

`mega-pokemon.ts` is the clear churn hotspot — 719 lines, 4+ distinct passes in this window — driven by the Champions format data being bootstrapped piecemeal rather than seeded correctly from a single authoritative source.

---

## Priority Follow-Up Tickets

| Priority | Title |
|---|---|
| P1 | Derive CHAMPIONS_DEX Mega list from getRegMAMegas() — eliminate manual mirror |
| P1 | Add paste-edit.test.ts with all four Showdown first-line format round-trips |
| P2 | Fix InlinePokemonEditor search loop: break only after both prefix+contains collected |
| P2 | Add sprite-slug test: getSpriteUrls returns 8 URLs for Mega forms with fallback |
| P2 | Add Playwright smoke test: exactly 1 navbar on /, /compare, /champions, /s/{id} |
| P3 | Write unique descriptions for top 15 Reg M-A Megas (SEO) |
| P3 | OG image for shared reports: Satori + bundled sprites, no CDN dependency |
| P4 | Assess ILIKE paste query plan; add GIN index when share volume scales |
