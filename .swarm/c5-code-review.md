# Code Review — Last 20 Commits on main

**Reviewed:** 2026-05-08  
**Commits examined:** `8ab0ce9`..`1cde01a` (20 commits)  
**Deep-dived:** `03eba0b`, `560c206`, `f8617f1`, `5cab66b`, `221eb9a`

---

## Finding 1 — Duplicate tag-validation logic in share API (copy-paste)

**Severity:** Medium  
**Commit:** n/a (pre-existing, untouched in reviewed window)  
**File:** `src/app/api/share/route.ts` lines 182–189 and 249–257

The "require at least one tag to publish" guard is written identically twice: once for the "update → going public" path and once for the "create new public share" path. Both blocks define `hasRegulation`, `hasEventType`, `hasArchetype` and emit the same 400 response.

```ts
// lines 182-189 (update path)
const hasRegulation = !!tags.regulation;
const hasEventType = !!tags.eventType;
const hasArchetype = Array.isArray(tags.archetype) && tags.archetype.length > 0;
if (!hasRegulation && !hasEventType && !hasArchetype) { ... }

// lines 249-257 (create path) — identical
const hasRegulation = !!tags.regulation;
const hasEventType = !!tags.eventType;
const hasArchetype = Array.isArray(tags.archetype) && tags.archetype.length > 0;
if (!hasRegulation && !hasEventType && !hasArchetype) { ... }
```

**Cleanup:** extract `function requiresPublishTags(tags)` and call it from both branches.

---

## Finding 2 — Four `auth()` calls in one request handler; `authedUserId` already captured at line 85

**Severity:** Medium  
**Commit:** incremental drift — most recent context `8391625`  
**File:** `src/app/api/share/route.ts` lines 85, 134, 162, 210

`auth()` is called once at the top of the handler (line 85) and the result stored in `authedUserId`. However the handler calls `auth()` three more times further down (lines 134, 162, 210) for the version snapshot, the owner-change guard, and the changelog entry. The first three all happen within the same Clerk request context, so `authedUserId` is already available and verified. The repeated calls add latency and are a logic smell — if Clerk's middleware ever changes its session behaviour the four calls could theoretically disagree.

Lines 162–165 re-check `callerId !== oldRows[0].owner_id` even though `authedUserId` was already confirmed equal to the owner earlier in the same path (the `existingId && editToken` branch only runs after the auth gate at line 88).

**Cleanup:** thread `authedUserId` through all three inner call sites rather than re-calling `auth()`.

---

## Finding 3 — Unvalidated cursor in explore API (NaN risk on `popular`/`views` sorts)

**Severity:** Medium  
**Commit:** not in reviewed window (pre-existing)  
**File:** `src/app/api/explore/route.ts` lines 154, 167

```ts
cursor ? sql`AND COALESCE(rc.like_count, 0) < ${parseInt(cursor, 10)}` : sql``
cursor ? sql`AND COALESCE(s.view_count, 0) < ${parseInt(cursor, 10)}` : sql``
```

`parseInt('anything-non-numeric', 10)` returns `NaN`. Passing `NaN` to a Postgres integer comparison via the `postgres` driver throws a runtime error (the driver rejects `NaN` as a bind parameter). The client can tamper the `cursor` query param with any string; the catch block at line 301 catches and returns a 500, but the error leaks stack traces to the server log and could be abused for amplified 500 noise.

The `newest`/`updated` sort branches use `cursor` as a timestamp string directly in SQL without ISO-8601 validation either (line 181) — a malformed value causes a Postgres parse error with the same 500 outcome.

**Cleanup:** validate `parseInt` result with `isNaN()` and return 400, or use Zod on the query params at the top of the handler.

---

## Finding 4 — `searchSpecies` early-break cuts off `contains` results

**Severity:** Low-Medium  
**Commit:** `560c206`  
**File:** `src/components/report/InlinePokemonEditor.tsx` lines 54–62

```ts
for (const s of index) {
  const lower = s.name.toLowerCase();
  if (lower.startsWith(q)) prefix.push(s);
  else if (lower.includes(q)) contains.push(s);
  if (prefix.length >= 16) break;   // ← exits the loop early
}
return [...prefix, ...contains].slice(0, 8);
```

The loop breaks as soon as 16 prefix matches are found, abandoning the rest of the ~1200-entry index. Any `contains` (mid-name) match that lives in the unvisited portion of the array is silently dropped. For common prefixes like "char" or "iron" the 16-prefix threshold is hit quickly (~gen-1/2 ordering), so users searching for "ferro" (contains "iron") or unusual forms may get no mid-name results even though they exist.

Fix: collect prefix and contains in separate passes, or use a higher cap (e.g., scan all entries but cap each bucket independently), then merge.

---

## Finding 5 — `CHAMPIONS_DEX` and `CHAMPIONS_REG_MA_MEGAS` are parallel hand-maintained sets (drift risk)

**Severity:** Low-Medium  
**Commit:** `03eba0b`, `5cab66b`  
**Files:** `src/lib/data/champions-dex.ts`, `src/lib/data/mega-pokemon.ts`

`CHAMPIONS_DEX` (line 1 of champions-dex.ts) lists Mega slugs inline as raw strings. `CHAMPIONS_REG_MA_MEGAS` in mega-pokemon.ts lists the same 57 Mega `dataKey` values. As of this review they are in sync (verified by script), but the comment in `champions-dex.ts` line 188 explicitly says *"updates there should be mirrored here"* — a manual process that already caused a bug once (the Salamence/Metagross/Mawile incident fixed by `03eba0b`).

There is no automated enforcement that the two sets stay in sync. A future format update touching only `mega-pokemon.ts` will silently leave `CHAMPIONS_DEX` stale, causing `SpeedTierChart` to show meta threats that don't match the legal-Mega landing pages.

**Cleanup:** derive the Mega section of `CHAMPIONS_DEX` from `CHAMPIONS_REG_MA_MEGAS` at module load time rather than maintaining it by hand. This is a 3-line change and eliminates the manual mirror requirement.

---

## Finding 6 — 29 SEO description stubs in `mega-pokemon.ts`

**Severity:** Low (content debt, not a code bug)  
**Commit:** `03eba0b`  
**File:** `src/lib/data/mega-pokemon.ts` (29 entries)

All 29 newly-added Reg M-A Megas have the identical placeholder description:
> "Mega X is a legal Mega Evolution in Pokemon Champions Regulation M-A."

The commit message calls these "SEO stubs to be expanded as competitive analysis emerges." However these strings are likely being rendered as `<meta description>` content on `/champions/[pokemon]` landing pages (and indexed by Google). Duplicate boilerplate meta-descriptions are a known SEO negative signal; Google typically ignores them in favour of body text, but they reduce click-through rate.

Only 45 of the 59 Megas get landing pages (sprite-gated), so 16 of the 29 stubs that *do* have sprites are live in production with duplicate descriptions.

**Cleanup:** file a content task to write competitive-analysis descriptions for the 16 live pages (the 14 sprite-less ones can wait).

---

## Finding 7 — `replaceSpeciesInBlock` exported but never imported outside the module

**Severity:** Low  
**Commit:** `560c206`  
**File:** `src/lib/utils/paste-edit.ts` line 59

`replaceSpeciesInBlock` is exported from paste-edit.ts but has no import site in the codebase — only `replacePokemonSpecies` (the public-facing wrapper) is used. This is consistent with "exported for testing" intent (the function is the natural unit-test target), but no test file imports it either. If the function is only an internal implementation detail it should be unexported to keep the module surface clean.

---

## Finding 8 — `state.creatorName` is triple-cast as `string` despite Zod already typing it

**Severity:** Low  
**Commit:** n/a (pre-existing)  
**File:** `src/app/api/share/route.ts` lines 101, 112, 341

`ShareBodySchema` types `creatorName` as `z.string().optional()`, so after `safeParse`, `state.creatorName` is `string | undefined`. All three downstream usages cast it again with `(state.creatorName as string)`. The casts at lines 112 and 341 are both wrong in a subtle way: they suppress the `undefined` case, making the nullish-coalescing `?? ""` on line 112 unreachable and the `as string` on line 341 potentially passing `undefined` to `notifyFollowers`. The guard at line 340 (`if (isPublic && state.creatorName)`) correctly guards line 341, but the cast makes it look like no guard is needed.

**Cleanup:** use `state.creatorName ?? ""` directly (no cast) and trust the Zod types.

---

## Summary Table

| # | File | Lines | Severity | Category |
|---|------|-------|----------|----------|
| 1 | `api/share/route.ts` | 182–189, 249–257 | Medium | Duplicate code |
| 2 | `api/share/route.ts` | 85, 134, 162, 210 | Medium | Redundant auth() calls |
| 3 | `api/explore/route.ts` | 154, 167, 181 | Medium | Missing input validation |
| 4 | `InlinePokemonEditor.tsx` | 54–62 | Low-Med | Logic bug in search |
| 5 | `champions-dex.ts` / `mega-pokemon.ts` | 188+, 649+ | Low-Med | Parallel hand-maintained sets |
| 6 | `mega-pokemon.ts` | 29 entries | Low | Content / SEO debt |
| 7 | `paste-edit.ts` | 59 | Low | Dead export |
| 8 | `api/share/route.ts` | 101, 112, 341 | Low | Unnecessary type casts |
