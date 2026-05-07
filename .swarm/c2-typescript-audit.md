# TypeScript Quality Audit — VGC Team Report

**Audited:** 2026-05-07  
**Scope:** src/lib/, src/app/api/, src/components/report/  
**Files:** 272 TypeScript files in src/  
**tsconfig:** `strict: true`, `skipLibCheck: true`, no `noImplicitReturns`, no `noUncheckedIndexedAccess`, no `exactOptionalPropertyTypes`

---

## 1. `any` Type Usage

No raw `@ts-ignore` or `@ts-expect-error` suppressions found. All `any` usages are explicitly suppressed with `eslint-disable-next-line @typescript-eslint/no-explicit-any`.

### 1a. `Record<string, any>` type aliases (src/lib/)

| File | Line | Issue |
|------|------|-------|
| `src/lib/utils/diff-state.ts` | 7 | `type AnyState = Record<string, any>` — used as both parameter and field access type |
| `src/lib/utils/normalize-report.ts` | 8 | `type AnyRecord = Record<string, any>` — used as parameter AND return type of `normalizeReportData` |

**Problem:** `normalizeReportData(data: AnyRecord): AnyRecord` completely erases all type information from its output. Callers in `src/app/api/share/[id]/route.ts` (lines 127, 168, 215) spread the result directly into API response objects with no further validation. The actual shape is well-known and could be represented as a proper interface.

### 1b. `any[]` parameters in internal functions

| File | Lines | Issue |
|------|-------|-------|
| `src/lib/utils/diff-state.ts` | 87, 90, 94 | `matchupPlansChanged(oldPlans: any[], newPlans: any[])` and `normalize = (p: any)` |
| `src/lib/utils/version-diff.ts` | 154, 160 | `normalizePlan = (p: any)` — but `p` comes from `SerializedMatchupPlan[]` (typed) |

**Worst offender:** `version-diff.ts:154` — `normalizePlan` is called on `currentPlans` which is typed as `SerializedMatchupPlan[]` (from `ShareableState`). The `p: any` annotation is unnecessary and silently permits accessing nonexistent fields. This should be `p: SerializedMatchupPlan`.

### 1c. `as Record<string, any>` cast in API route

| File | Line | Issue |
|------|------|-------|
| `src/app/api/migrate/route.ts` | 50 | `row.data as Record<string, any>` before passing to `normalizeReportData` |

This is partially justified (DB rows are untyped), but the downstream `normalizeReportData` return type is also `AnyRecord`, compounding the loss of type safety.

---

## 2. `as unknown as X` Double Casts (Unsound)

| File | Lines | Issue |
|------|-------|-------|
| `src/hooks/useHomePage.ts` | 264, 437 | `t as unknown as Record<string, string>` |
| `src/hooks/useSlideNavigation.ts` | 46 | `document as unknown as { startViewTransition: ... }` |

### 2a. `t as unknown as Record<string, string>` — structurally unsound

`t` is typed as `TranslationKeys` (which is `{ [K in keyof typeof en]: string }` — a mapped type equivalent to `Record<keyof en, string>`). `useShareFlow` accepts `t: Record<string, string>`, which is a wider type. The double cast bypasses the structural compatibility check. The real fix is to widen `useShareFlow`'s `t` parameter to `Record<string, string>` or use `TranslationKeys` directly, eliminating the need for any cast.

### 2b. `document as unknown as { startViewTransition: ... }` — justified but fragile

This accesses the View Transitions API which TypeScript's DOM lib doesn't yet include. The inline type definition is reasonable, but the cast silently fails if the method signature changes. A declared ambient type or `lib.dom.d.ts` augmentation would be safer.

---

## 3. Missing Return Types on Exported Functions (src/lib/)

Functions where the return type is inferred rather than declared:

| File | Function | Inferred Return |
|------|----------|-----------------|
| `src/lib/db.ts:3` | `getDb()` | Inferred `NeonQueryFunction` (complex type) |
| `src/lib/db.ts:9` | `ensureTable()` | `Promise<void>` (should be explicit) |
| `src/lib/discord-webhook.ts:15` | `postToBuildsChannel(embed)` | `Promise<void>` |
| `src/lib/discord-webhook.ts:31` | `postToFeedbackChannel(embed)` | `Promise<void>` |
| `src/lib/notifications.ts:9` | `createNotification(...)` | `Promise<void>` |
| `src/lib/notifications.ts:30` | `notifyFollowers(...)` | `Promise<void>` |
| `src/lib/posthog-server.ts:24` | `captureServerEvent(...)` | `void` (inferred) |
| `src/lib/contexts/VersionDiffContext.tsx:23` | `useVersionDiff()` | Inferred context value type |
| `src/lib/hooks/useGlobalDisplayPrefs.ts:41` | `useGlobalDisplayPrefs()` | Inferred hook return shape |
| `src/lib/i18n/index.ts:47` | `I18nProvider(...)` | `JSX.Element` |
| `src/lib/i18n/index.ts:82` | `useTranslation()` | Inferred `I18nContextValue` |
| `src/lib/utils/haptics.ts:2,9,16` | `hapticLight/Medium/Success()` | `void` |

**Priority:** `getDb()` is the most impactful — it returns a complex neon SQL function type. Without an explicit return type, callers get no IDE contract and type changes in `@neondatabase/serverless` would silently break at runtime.

**Also missing:** All Next.js API route handlers (`GET`, `POST`, `PUT`, `DELETE`) across `src/app/api/` lack explicit `Promise<NextResponse>` return type annotations (20+ functions). While Next.js infers these, explicit typing would catch incorrect response shape bugs at compile time.

---

## 4. Unsound Generic Usage

### 4a. `cacheGet<T>` — unconstrained T, no runtime validation

```
src/lib/cache.ts:22
export async function cacheGet<T>(key: string): Promise<T | null>
```

`T` is entirely unconstrained. The function returns `r.get<T>(key)` which is Upstash's own generic — also unconstrained. Callers assert the shape without any runtime guard:

- `cacheGet<string>(rateKey)` — `src/app/api/user/export/route.ts:15`
- `cacheGet<Record<string, unknown>>(CacheKeys.share(id))` — `src/app/api/share/[id]/route.ts:196`
- `cacheGet<{ reports: unknown[]; nextCursor: string | null }>(cacheKey)` — `src/app/api/explore/route.ts:38`

If Redis contains stale data from a previous schema, `T` is a lie — the actual value may differ from the asserted type with no runtime error. This is a classic unsound generic pattern: the generic parameter is used only to widen the return, not enforce any constraint.

### 4b. `Partial<StatSpread> as StatSpread` — technically unsound but safe in practice

```
src/lib/analysis/stat-calculator.ts:58, 74
```

`calculateAllStats` and `calculateAllChampionsStats` build a `Partial<StatSpread>`, iterate all 6 stat keys (`["hp", "atk", "def", "spa", "spd", "spe"]`), then cast to `StatSpread`. TypeScript cannot verify that all keys are set; the cast is required to satisfy callers. This is safe in practice since the loop covers all keys, but the type system does not enforce it.

---

## 5. Other Unsafe Patterns

### 5a. `redis!` non-null assertion in rate-limit.ts

```
src/lib/rate-limit.ts:24
redis: redis!,
```

`redis` is `Redis | null`. The `!` assertion is inside `getUpstashLimiter`, which is only called from within the `if (redis)` branch in `isRateLimitedAsync`. However, `getUpstashLimiter` is not itself guarded and could theoretically be called directly with `redis === null`, making the `!` latently unsafe. A safer approach is to pass `redis` explicitly as a parameter.

### 5b. `JSON.parse(...) as ShareableState` without runtime validation

```
src/lib/sharing/url-codec.ts:128
return JSON.parse(json) as ShareableState;
```

URL-decoded state is cast directly to `ShareableState` without schema validation. If the URL is malformed or from an old schema version, this silently produces a structurally invalid object that matches the type only at compile time.

### 5c. `localStorage.getItem(STORAGE_KEY) as LanguageCode | null`

```
src/lib/i18n/index.ts:53
```

Any arbitrary string stored in localStorage is cast to `LanguageCode`. If someone stores an unexpected value, the `as` cast succeeds but `LANGUAGES.find(l => l.code === saved)` will return `undefined`, which is then used to set language state.

### 5d. `row.data as Record<string, unknown>` before `normalizeReportData`

```
src/app/api/share/[id]/route.ts:54, 127, 168, 215
```

DB rows have `data: unknown` from neon; each call site independently casts it to `Record<string, unknown>` before passing to `normalizeReportData`. This is structurally consistent but repeated 4 times with no shared validation helper.

---

## 6. Missing tsconfig Strictness Flags

The following beneficial flags are absent from `tsconfig.json`:

| Flag | Effect |
|------|--------|
| `noImplicitReturns` | Catches functions that don't return on all code paths |
| `noUncheckedIndexedAccess` | `arr[i]` and `obj[key]` return `T | undefined` instead of `T` |
| `exactOptionalPropertyTypes` | Distinguishes `key?: T` from `key: T | undefined` |
| `noUnusedLocals` | Catches dead local variables |
| `noUnusedParameters` | Catches unused function parameters |

`noUncheckedIndexedAccess` would catch the most real bugs given the number of `speciesKeys[i]`, `arr[idx]`, and `Record<string, ...>` index lookups across the codebase.

---

## Summary of Severity

| Severity | Issue |
|----------|-------|
| **High** | `cacheGet<T>` — unconstrained generic with no runtime validation; stale Redis data produces typed lies |
| **High** | `normalizeReportData` returns `AnyRecord` — erases types across 4 API call sites |
| **High** | `version-diff.ts:154` — `normalizePlan: (p: any)` when `p` is `SerializedMatchupPlan` (has a proper type) |
| **Medium** | `t as unknown as Record<string, string>` double cast — `useShareFlow` should accept `TranslationKeys` |
| **Medium** | `getDb()` missing return type — complex inferred type creates invisible contract for callers |
| **Medium** | `JSON.parse(json) as ShareableState` — no runtime schema validation on URL-decoded state |
| **Medium** | Missing `noUncheckedIndexedAccess` in tsconfig — index operations silently return `T` instead of `T | undefined` |
| **Low** | `Partial<StatSpread> as StatSpread` — functionally safe but type assertion papers over compiler limitation |
| **Low** | `redis!` — safe within call graph but assertion is not enforced by structure |
| **Low** | 20+ API route handlers missing `Promise<NextResponse>` return type |
