# TypeScript Strictness Audit Report
**VGC Team Report Codebase**
**Audit Date:** 2026-05-26

---

## Executive Summary

The codebase has **low explicit `any` usage** (only 1 instance) but relies heavily on **type assertions (`as`)** to bridge untyped database rows, third-party library outputs, and JSON payloads. The biggest systemic issue is the lack of typed database row shapes -- every Neon SQL query returns untyped rows that are manually cast field-by-field with `as`. API routes contain ~300 type assertions collectively, most of which could be eliminated with shared row-type interfaces.

---

## 1. Uses of `any`

### Explicit `any` (Critical)

| File | Line | Code | Fix |
|------|------|------|-----|
| `src/app/api/migrate/route.ts` | 50 | `row.data as Record<string, any>` | Replace with `Record<string, unknown>` (already used elsewhere). Has an `eslint-disable` comment acknowledging it. |

**Total: 1 explicit `any`.** This is excellent -- the codebase has largely avoided `any`.

---

## 2. Type Assertions (`as`) -- Systemic Issues

### 2a. Untyped Database Rows (HIGH IMPACT, ~80 instances across API routes)

The Neon serverless driver returns `Record<string, unknown>[]`. Every API route manually casts each field:

```typescript
// src/app/api/spotlight/route.ts (lines 26-59) -- representative pattern
const data = row.data as Record<string, unknown>;
const paste = (data.paste as string) ?? "";
const creatorName = (data.creatorName as string) || undefined;
row.id as string
row.created_at as Date
row.view_count as number
```

**Affected files (heaviest):**
- `src/app/api/spotlight/route.ts` -- 12 assertions
- `src/app/api/user/reports/route.ts` -- 15+ assertions
- `src/app/api/user/collaborations/route.ts` -- 15+ assertions
- `src/app/api/team-graphic/route.tsx` -- 8 assertions
- `src/app/api/discord/route.ts` -- 5 assertions
- `src/app/api/user/follow/route.ts` -- 1 assertion

**Recommendation:** Create shared row types in `src/lib/types/db.ts`:
```typescript
interface ShareRow {
  id: string;
  data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  view_count: number;
  is_public: boolean;
  // ...
}
```
Then use a typed query helper. **Medium effort, high payoff.**

### 2b. JSONB `data` Column Casting (HIGH IMPACT)

The `shares.data` JSONB column is the core data type but has no runtime validation at read time. Every route manually casts nested fields:
```typescript
(data.tournamentName as string) || undefined
(data.placement as string) || undefined
(data.tags as Record<string, unknown>) || undefined
```

**Recommendation:** Run `ShareableStateSchema.safeParse(data)` at read time (already defined in `url-codec.ts`). This would eliminate ~50 assertions and add runtime safety.

### 2c. `as unknown as X` Double Assertion (MEDIUM IMPACT)

| File | Line | Code | Risk |
|------|------|------|------|
| `src/app/api/webhooks/clerk/route.ts` | 46 | `event.data as unknown as ClerkUserCreatedData` | Bypasses type checker entirely. The Clerk SDK's `verifyWebhook` return type may not match. |

**Recommendation:** Use a Zod schema to validate `event.data` shape at runtime.

### 2d. Third-Party Library Casts (LOW-MEDIUM IMPACT)

| File | Line | Code | Notes |
|------|------|------|-------|
| `src/lib/data/pkmn-dex-fallback.ts` | 57, 66, 75, 111, 119, 130, 157-158 | Multiple `as StatSpread`, `as PokemonType[]`, `as Record<string, string>` | @pkmn/dex returns loosely typed data. Assertions are reasonable but risky if library changes shape. |
| `src/lib/cache.ts` | 35 | `raw as T` | Unchecked generic cast -- mitigated by optional Zod schema parameter. |
| `src/lib/cache.ts` | 99 | `result[1] as string[]` | Upstash Redis SCAN return type. |
| `src/lib/sharing/url-codec.ts` | 188 | `bytes.buffer as ArrayBuffer` | TypedArray.buffer is `ArrayBufferLike`, not `ArrayBuffer`. Safe in practice. |
| `src/lib/sharing/url-codec.ts` | 215 | `result2.data as ShareableState` | Zod `.safeParse()` already narrows this -- assertion is redundant. |

### 2e. Parser Assertions (LOW IMPACT, safe)

| File | Line | Code | Notes |
|------|------|------|-------|
| `src/lib/parser/showdown-parser.ts` | 80 | `genderMatch[1] as "M" \| "F"` | Regex guarantees M or F. Safe. |
| `src/lib/parser/showdown-parser.ts` | 114-115 | `tt as PokemonType` | Guarded by `.includes()` check on line 114. Safe. |

### 2f. Component Assertions (LOW IMPACT)

| File | Line | Code | Notes |
|------|------|------|-------|
| `src/components/report/MatchupPlanSlide.tsx` | 499, 617-618 | `fromIdx as 0 \| 1 \| 2 \| 3` | Narrowing `number` to literal union. Could validate with a guard function. |
| `src/components/report/PokemonDetailSlide.tsx` | 537 | `(e as CustomEvent).detail as MobileTab` | CustomEvent typing. Use `addEventListener<CustomEvent>` generic. |
| `src/components/report/OffensiveCoverageChart.tsx` | 69 | `{} as Record<PokemonType, MoveCoverageResult>` | Empty-object-as-type pattern. All keys filled in loop below. Acceptable. |
| `src/components/social/ReactionBar.tsx` | 46 | `c as number` | Untyped API response. Should type the fetch result. |
| `src/components/ui/ShareModal.tsx` | 74 | `}) as typeof en` | Translation object coercion. Safe but fragile. |
| `src/components/ui/LanguageSelector.tsx` | 56 | `lang.code as LanguageCode` | Static LANGUAGES array already typed. Redundant. |

---

## 3. Missing Return Type Annotations

### `src/lib/` -- Exported Functions Without Return Types (HIGH PRIORITY)

| File | Function | Recommended Type |
|------|----------|-----------------|
| `src/lib/db.ts:3` | `getDb()` | `NeonQueryFunction` |
| `src/lib/db.ts:9` | `ensureTable()` | `Promise<void>` |
| `src/lib/email.ts:23` | `sendEmail(...)` | `Promise<unknown \| null>` (should narrow) |
| `src/lib/email.ts:66` | `sendCommentNotificationEmail(...)` | `Promise<void>` |
| `src/lib/email.ts:164` | `sendWelcomeEmail(...)` | `Promise<void>` |
| `src/lib/email.ts:303` | `buildWeeklySummaryHtml(...)` | `string` |
| `src/lib/notifications.ts:9` | `createNotification(...)` | `Promise<void>` |
| `src/lib/notifications.ts:30` | `notifyFollowers(...)` | `Promise<void>` |
| `src/lib/discord-webhook.ts:15` | `postToBuildsChannel(...)` | `Promise<void>` |
| `src/lib/linear.ts:84` | `createLinearIssue(...)` | Already has return type -- OK |
| `src/lib/posthog-server.ts:24` | `captureServerEvent(...)` | `void` |
| `src/lib/utils/version-diff.ts:41` | `computeVersionDiff(...)` | Should annotate |
| `src/lib/utils/version-diff.ts:203` | `getNavigableChanges(...)` | Should annotate |
| `src/lib/utils/mega-detect.ts:20` | `detectMegaFromItem(...)` | Should annotate |
| `src/lib/analysis/item-boosts.ts:19` | `getItemStatBoost(...)` | Should annotate |
| `src/lib/analysis/detect-regulation.ts:71` | `detectRegulationWithSignals(...)` | Should annotate |

### `src/app/api/` -- API Route Handlers (MEDIUM PRIORITY)

Next.js API route handlers (GET/POST/PUT/DELETE/PATCH) have an implicit `Promise<Response>` return type from the framework. However, **none of the ~50+ route handlers** have explicit return type annotations. Adding `Promise<NextResponse>` would catch accidental non-Response returns.

Top-priority routes (user-facing, complex logic):
- `src/app/api/share/[id]/route.ts` -- GET
- `src/app/api/user/reports/route.ts` -- GET
- `src/app/api/explore/route.ts` -- GET
- `src/app/api/migrate/route.ts` -- POST

### `src/components/` -- 84 exported components without return types

This is expected for React components (JSX.Element is inferred). Low priority.

---

## 4. Non-null Assertions (`!`)

| File | Line | Code | Risk |
|------|------|------|------|
| `src/lib/db.ts` | 4 | `process.env.DATABASE_URL!` | **HIGH** -- if env var missing, runtime crash with no descriptive error. Should throw a clear error message. |
| `src/lib/rate-limit.ts` | 24 | `redis!` | **MEDIUM** -- `redis` is checked to be non-null on line 8-13 before this code path runs, but the assertion is in a lazy-init branch that assumes the outer guard ran. Safe in practice, brittle to refactoring. |

Only 2 non-null assertions found. Very clean.

---

## 5. Unsound Generics

| File | Function | Issue |
|------|----------|-------|
| `src/lib/cache.ts:29` | `cacheGet<T>(key, schema?)` | When `schema` is omitted, `T` is unconstrained and `raw as T` is an unchecked cast. The function documents this as intentional (VGC-146 comment) and encourages passing a Zod schema. Acceptable trade-off. |

No other unsound generics found. The codebase uses generics sparingly and correctly.

---

## 6. Conflict-Risk Files

These files were recently changed on `main` and have higher merge conflict risk. Recommendations touching them should be deferred or carefully coordinated:

| File | Issues Found | Recommendation |
|------|-------------|----------------|
| `src/lib/email.ts` | 4 exported functions missing return types | **DEFER** -- low impact, high conflict risk |
| `src/lib/analysis/stat-calculator.ts` | 2 `as StatSpread` casts (lines 58, 74) on `Partial<StatSpread>` built via loop | **DEFER** -- casts are safe (all 6 stat keys assigned in loop), change is cosmetic |
| `src/lib/i18n/translations/*.ts` | No type safety issues found | N/A -- no changes needed |
| `src/lib/utils/multi-import.ts` | Clean -- no issues | N/A -- no changes needed |

---

## 7. Prioritized Fix Plan

### Tier 1: High Impact, Low Effort (do first)

1. **Create `src/lib/types/db.ts` with row interfaces** for `ShareRow`, `FeedbackRow`, `CommentRow`, etc. Eliminates ~80 field-level `as` casts across API routes. Effort: ~1 hour.

2. **Fix `src/lib/db.ts` non-null assertion** -- replace `process.env.DATABASE_URL!` with:
   ```typescript
   const url = process.env.DATABASE_URL;
   if (!url) throw new Error("DATABASE_URL environment variable is required");
   ```
   Effort: 2 minutes.

3. **Remove redundant `as ShareableState`** in `url-codec.ts:215` -- Zod's `.safeParse()` already produces the correct type. Effort: 1 minute.

4. **Replace `Record<string, any>` with `Record<string, unknown>`** in `migrate/route.ts:50`. Effort: 1 minute.

### Tier 2: Medium Impact, Medium Effort

5. **Add return types to exported `src/lib/` functions** (15 functions listed above). Effort: 30 minutes.

6. **Type the Clerk webhook** with Zod validation instead of `as unknown as ClerkUserCreatedData`. Effort: 15 minutes.

7. **Validate JSONB `data` column** at read time using `ShareableStateSchema.safeParse()` in a shared helper. Eliminates ~50 nested field casts. Effort: 1-2 hours.

### Tier 3: Low Impact, Higher Effort (backlog)

8. **Type the `@pkmn/dex` boundary** -- create adapter types for the library's loose return shapes. 7 assertions in `pkmn-dex-fallback.ts`.

9. **Add explicit `Promise<NextResponse>` return types** to all ~50 API route handlers.

10. **Type the Discord bot command options** -- the `options.find(...)?.value as string` pattern in `discord/route.ts` should use a typed command schema.

---

## Metrics Summary

| Category | Count | Severity |
|----------|-------|----------|
| Explicit `any` | 1 | Low |
| Type assertions (`as`) | ~120 (lib + API) | Medium-High |
| `as unknown as X` | 1 | Medium |
| Missing return types (lib) | 15 | Medium |
| Missing return types (API) | 50+ | Low (framework-inferred) |
| Non-null assertions | 2 | Medium |
| Unsound generics | 1 (documented) | Low |

**Overall TypeScript strictness: B+** -- very low `any` usage, but heavy reliance on `as` assertions for database and JSON boundaries. The Tier 1 fixes would move this to an A-.
