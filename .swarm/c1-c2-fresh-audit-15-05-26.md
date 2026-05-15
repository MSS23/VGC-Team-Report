# Fresh Dead Code + TypeScript Strictness Audit
**Run date:** 2026-05-15  
**Scope:** Files modified since 2026-05-13 (43 files, 15 TS/TSX targets after filtering noise)  
**Previously fixed (skip):** VGC-177, VGC-178, VGC-179, VGC-180

---

## Section 1: Dead Exports to Remove

### 1a. `isDiscordBotConfigured` — zero import sites

| | |
|---|---|
| **File** | `src/lib/discord-bot.ts:151` |
| **Symbol** | `export function isDiscordBotConfigured(): boolean` |
| **Import sites** | 0 (grep-confirmed across entire `src/`) |
| **Action** | Remove `export` keyword — the check belongs as a module-private guard, or remove the function entirely if the caller was `postBuildNotification` (removed in `ac039fe`). |

### 1b. `isValidIp` — exported but only used internally

| | |
|---|---|
| **File** | `src/lib/security/input-validation.ts:6` |
| **Symbol** | `export function isValidIp(ip: string): boolean` |
| **Import sites** | 0 external (only used on line 27 within the same file by `getClientIp`) |
| **Action** | Remove `export` — it's an implementation detail of `getClientIp`. Exposing it widens the public API surface for no benefit. |

---

## Section 2: TypeScript `any` / Unsound Types

### 2a. Implicit `any` in API route row-mapping callbacks — 9 errors across 3 files

**Root cause:** `getDb()` returns the result of `neon()` whose template-literal tag returns `NeonQueryResult` — inferred as `any[]` without explicit generic typing. Every `.map((r) => ...)` on sql results therefore has `r: any`.

#### `src/app/api/bot/route.ts` — 4 errors (lines 150, 204×2, 228)

```
(150,36): Parameter 'r' implicitly has an 'any' type.  -- recent.map((r) => ({...}))
(204,34): Parameter 'r' implicitly has an 'any' type.  -- popular.map((r, i) => ...)
(204,37): Parameter 'i' implicitly has an 'any' type.
(228,31): Parameter 'r' implicitly has an 'any' type.  -- bugs.map((r) => {...})
```

**Fix pattern:** Define row shapes as local interfaces and type the sql result:
```typescript
interface FeedbackRow { type: string; title: string; count: number; submitter_name: string | null; created_at: string; }
const recent = await sql`...` as FeedbackRow[];
```

#### `src/app/api/match-log/route.ts` — 4 errors (lines 122, 152, 153, 154)

```
(122,28): Parameter 'r' implicitly has an 'any' type.  -- rows.map((r) => ({...}))
(152,36): Parameter 'l' implicitly has an 'any' type.  -- logs.filter((l) => l.result === "win")
(153,38): Parameter 'l' implicitly has an 'any' type.
(154,36): Parameter 'l' implicitly has an 'any' type.
```

Note: lines 152–154 derive from line 122 — once `rows.map((r) => ...)` is typed, `logs` gets a proper type and the filter callbacks resolve automatically.

**Fix:** Type the `rows` result:
```typescript
interface MatchLogRow { id: string; opponent_archetype: string; result: "win"|"loss"|"tie"; game_count: number; notes: string|null; tournament_name: string|null; share_id: string|null; logged_at: Date; }
const rows = await sql`...` as MatchLogRow[];
```

#### `src/app/api/pokepaste/route.ts` — 1 error (line 13)

```
(13,4): Parameter 'val' implicitly has an 'any' type.
```

`val` is the refine callback parameter in:
```typescript
const PokePasteUrlSchema = z.string().url().refine(
  (val) => { ... }  // val should be string, but tsc can't infer it
```

**Fix (1 char):** Add explicit type annotation:
```typescript
  (val: string) => {
```

### 2b. `AnyRecord = Record<string, any>` in normalize-report.ts

| | |
|---|---|
| **File** | `src/lib/utils/normalize-report.ts:8` |
| **Line** | `type AnyRecord = Record<string, any>;` |
| **Scope** | Used at lines 14, 29, 36, 77, 79 |
| **Risk** | Medium — `normalizeReportData` is an exported function whose signature is `(data: AnyRecord): AnyRecord`, meaning callers get `any`-typed return values. |

**Fix:** The legitimate use case is parsing raw unknown DB payloads. Replace `AnyRecord` with `Record<string, unknown>` and use the existing narrowing pattern (same as `diff-state.ts` after VGC-179 fixed it):
```typescript
type UnknownRecord = Record<string, unknown>;
// Then replace `plan.gamePlans` etc. with `asArray(plan.gamePlans)` narrowing helpers
```
This is a moderate refactor — `migratePlan` needs narrowing helpers like the ones added to `diff-state.ts`.

### 2c. `as unknown as` double-cast — PostHogProvider stub (KNOWN, NOT YET FIXED)

| | |
|---|---|
| **File** | `src/components/providers/PostHogProvider.tsx:14` |
| **Line** | `let _usePostHog: typeof usePostHogType = () => undefined as unknown as ReturnType<typeof usePostHogType>;` |
| **Status** | Was flagged in previous audit `C2-typescript-strictness.md §1a` and in VGC-179 scope, but VGC-179 commit `dab858f` did NOT touch PostHogProvider.tsx. **Still unfixed.** |

**Fix (documented in previous audit):**
```typescript
let _usePostHog: () => ReturnType<typeof usePostHogType> | undefined = () => undefined;
export function usePostHog(): ReturnType<typeof usePostHogType> | undefined {
  return _usePostHog();
}
```
Callers all guard with `if (!posthog)` already, so adding `| undefined` propagates safely.

---

## Section 3: Quick Wins Implementable Tonight (< 30 min each)

| # | File | Change | Effort |
|---|------|--------|--------|
| **QW-1** | `src/app/api/pokepaste/route.ts:13` | Add `: string` to refine callback `(val: string) =>` | **2 min** |
| **QW-2** | `src/lib/security/input-validation.ts:6` | Remove `export` from `isValidIp` | **1 min** |
| **QW-3** | `src/lib/discord-bot.ts:151` | Remove `export` from `isDiscordBotConfigured` (or delete if dead) | **2 min** |
| **QW-4** | `src/components/providers/PostHogProvider.tsx:14` | Replace double-cast with `| undefined` return type (exact fix in §2c) | **10 min** |
| **QW-5** | `src/app/api/match-log/route.ts:107–122` | Add `MatchLogRow` interface + `as MatchLogRow[]` cast — fixes 4 implicit-any errors at once | **15 min** |
| **QW-6** | `src/app/api/bot/route.ts:87–97, 195, 220` | Add `FeedbackRow` / `BugRow` interfaces for the 3 distinct query shapes | **20 min** |

QW-1 through QW-4 are trivially safe with zero runtime risk. QW-5 and QW-6 add `as T[]` assertion casts which are still technically unsafe but make the types explicit and auditable — and match the existing pattern used in `match-log/route.ts:122` for `r.result as "win"|"loss"|"tie"`.

### NOT a quick win (> 30 min)
- `normalize-report.ts` `AnyRecord` → `Record<string, unknown>`: requires refactoring `migratePlan` to use narrowing helpers. Estimate ~45 min. Good candidate for a dedicated VGC ticket following the diff-state.ts pattern.

---

## Coverage Summary

| Category | Count | Files |
|----------|-------|-------|
| Dead exports (zero external import sites) | 2 | `discord-bot.ts`, `input-validation.ts` |
| Implicit `any` (TS7006) in modified files | 9 | `bot/route.ts` (4), `match-log/route.ts` (4), `pokepaste/route.ts` (1) |
| `any` in type alias | 1 | `normalize-report.ts` |
| `as unknown as` double-cast (unfixed from VGC-179) | 1 | `PostHogProvider.tsx` |
| Missing return types on exported functions | 0 | All checked exports have return types |
| Unused imports | 0 | No unused imports detected in modified files |
