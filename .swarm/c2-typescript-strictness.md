# TypeScript Strictness Audit Report
**VGC Team Report Codebase**  
**Audit Date:** May 2026

---

## Executive Summary

The codebase has **moderate TypeScript hygiene issues**, primarily in state diffing and API response mapping. The worst problems:

1. **Unchecked `any` type usage** in diff-state.ts and version-diff.ts (matching game plans without validation)
2. **Unsafe type assertions** (`as`) in API routes (especially db row mapping) that bypass compile-time checks
3. **`unknown` cast without narrowing** in cache.ts and normalize-report.ts
4. **Per-pokemon field mapping** lacks type safety, relying on string-based indexing

Quick wins: Add explicit type guards in cache layer, replace `any` with proper generic shapes in diff functions, use database type definitions instead of manual casting.

---

## Critical Issues

### 1. **Unsafe `any` in Matchup Plan Diffing**
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/diff-state.ts`
- **Lines:** 6, 87, 90, 94
- **Issue Type:** Type Safety - `any` usage
- **Risk Level:** HIGH
- **Details:**
  ```typescript
  type AnyState = Record<string, any>;  // Line 6
  function matchupPlansChanged(oldPlans: any[], newPlans: any[]): boolean {  // Line 87
    const normalize = (p: any) => JSON.stringify({  // Line 90
      gamePlans: (p.gamePlans ?? []).map((gp: any) => ({...}))  // Line 94
    });
  }
  ```
  The normalization function accepts `any` and manipulates nested `gamePlans` array without type validation. This silently passes malformed data.

- **Recommended Fix:**
  ```typescript
  interface MatchupPlan {
    opponentLabel: string;
    opponentPaste: string;
    gamePlans: GamePlan[];
  }
  function matchupPlansChanged(oldPlans: MatchupPlan[], newPlans: MatchupPlan[]): boolean
  ```

---

### 2. **Unsafe `any` in Version Diff**
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/version-diff.ts`
- **Lines:** 154, 158, 160
- **Issue Type:** Type Safety - `any` usage
- **Risk Level:** HIGH
- **Details:**
  ```typescript
  const normalizePlan = (p: any) => ({  // Line 154
    gamePlans: Array.isArray(p.gamePlans)
      ? p.gamePlans.map((gp: any) => ({...}))  // Line 160
      : [],
  });
  ```
  Same issue as diff-state.ts; defensive array check but no type narrowing. Relies on runtime behavior.

- **Recommended Fix:** Use the proper `MatchupPlan` type from ShareableState definition.

---

### 3. **Unchecked `as` Assertions in API Routes (Multiple)**
- **File:** `/home/user/VGC-Team-Report/src/app/api/user/collaborations/route.ts`
- **Lines:** 33-47
- **Issue Type:** Type Assertions - Unsafe casting
- **Risk Level:** HIGH
- **Details:**
  ```typescript
  const data = row.data as Record<string, unknown>;  // Line 33
  const paste = (data.paste as string) ?? "";        // Line 34
  const createdAt = (row.created_at as Date).toISOString();  // Line 42
  ```
  Database rows are cast without validation. If column types change or nulls slip through, `.toISOString()` will crash at runtime.

- **Recommended Fix:**
  ```typescript
  // Use a Zod schema or proper type guard
  const reportSchema = z.object({
    data: z.record(z.unknown()),
    created_at: z.date(),
  });
  const row = reportSchema.parse(dbRow);
  ```

---

### 4. **Unsafe `as` in Discord API Route**
- **File:** `/home/user/VGC-Team-Report/src/app/api/discord/route.ts`
- **Line:** 68
- **Issue Type:** Type Assertions - Unsafe casting
- **Risk Level:** MEDIUM
- **Details:**
  ```typescript
  const getOption = (name: string) => options.find((o: { name: string }) => o.name === name)?.value as string | undefined;
  ```
  `.find()` returns `T | undefined`, but the chain still casts `?.value as string | undefined`. If the option object lacks a `value` key, this silently becomes undefined without error.

- **Recommended Fix:**
  ```typescript
  const getOption = (name: string): string | undefined => {
    const opt = options.find(o => o.name === name);
    return typeof opt?.value === 'string' ? opt.value : undefined;
  };
  ```

---

### 5. **Unguarded `as T` in Cache Layer**
- **File:** `/home/user/VGC-Team-Report/src/lib/cache.ts`
- **Line:** 35
- **Issue Type:** Type Assertions - Unchecked cast
- **Risk Level:** HIGH (noted as VGC-146)
- **Details:**
  ```typescript
  export async function cacheGet<T>(key: string, schema?: ZodType<T>): Promise<T | null> {
    ...
    if (!schema) return raw as T;  // Line 35 - DANGEROUS
    const parsed = schema.safeParse(raw);
    ...
  }
  ```
  If no schema is provided, `raw` is cast to `T` without validation. Callers relying on this without a schema get no type safety.

- **Recommended Fix:**
  ```typescript
  // Make schema required, or return `unknown` if not provided
  export async function cacheGet<T>(key: string, schema: ZodType<T>): Promise<T | null> {
    ...
    const parsed = schema.safeParse(raw);
    if (!parsed.success) return null;
    return parsed.data;
  }
  ```

---

### 6. **Unsound `any` in Normalize Report**
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/normalize-report.ts`
- **Lines:** 8, 14, 19, 29, 36
- **Issue Type:** Type Safety - `any` and unchecked assertions
- **Risk Level:** MEDIUM
- **Details:**
  ```typescript
  type AnyRecord = Record<string, any>;  // Line 8
  for (const [key, entries] of Object.entries(rawCalcs as AnyRecord)) {  // Line 14
    result[key] = entries.map((entry: unknown) => {
      const e = entry as { text?: string; category?: string };  // Line 19
  ```
  Casts `unknown` to a shape without narrowing. If `entry` is not an object, `.text` access will fail.

- **Recommended Fix:**
  ```typescript
  const entry: unknown = ...;
  if (entry && typeof entry === 'object' && 'text' in entry) {
    const e = entry as { text?: string; category?: string };
    // Safe to access e.text now
  }
  ```

---

### 7. **Type Assertions in Database Dex Fallback**
- **File:** `/home/user/VGC-Team-Report/src/lib/data/pkmn-dex-fallback.ts`
- **Lines:** 57, 66, 75
- **Issue Type:** Type Assertions - Unsafe casting
- **Risk Level:** MEDIUM
- **Details:**
  ```typescript
  const baseStats = entry.baseStats as StatSpread;  // Line 57 - @pkmn/dex is untyped
  const types = entry.types as PokemonType[];       // Line 66
  abilities: Object.values(entry.abilities) as string[],  // Line 75
  ```
  `@pkmn/dex` library is not fully typed, so casts are pragmatic but fragile. If the library changes structure, these fail silently at runtime.

- **Recommended Fix:**
  ```typescript
  // Add type guards for @pkmn/dex results
  const baseStats = entry.baseStats;
  if (!isValidStatSpread(baseStats)) return null;
  ```

---

### 8. **Stat Calculator Returns Unsafe Cast**
- **File:** `/home/user/VGC-Team-Report/src/lib/analysis/stat-calculator.ts`
- **Lines:** 58, 74
- **Issue Type:** Type Assertions - Unsafe casting
- **Risk Level:** MEDIUM
- **Details:**
  ```typescript
  export function calculateAllStats(...): StatSpread {
    const result: Partial<StatSpread> = {};
    for (const stat of stats) {
      result[stat] = calculateStat(...);
    }
    return result as StatSpread;  // Line 58
  }
  ```
  If the loop doesn't populate all 6 stat keys, the cast lies about the object shape. Use `satisfies StatSpread` (TS 4.9+) instead.

- **Recommended Fix:**
  ```typescript
  const result: StatSpread = {
    hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0
  };
  for (const stat of stats) {
    result[stat] = calculateStat(...);
  }
  return result;
  ```

---

### 9. **Type-Unsafe Record Mapping in Spotlight Route**
- **File:** `/home/user/VGC-Team-Report/src/app/api/spotlight/route.ts`
- **Lines:** 26, 27, 30
- **Issue Type:** Type Assertions - Multiple unchecked casts
- **Risk Level:** MEDIUM
- **Details:**
  ```typescript
  const data = row.data as Record<string, unknown>;
  const paste = (data.paste as string) ?? "";
  const creatorName = (data.creatorName as string) || undefined;
  ```
  Same pattern as collaborations route; database columns cast without validation.

- **Recommended Fix:** Centralize database row validation with a Zod schema.

---

### 10. **Unsafe Cast in Notifications**
- **File:** `/home/user/VGC-Team-Report/src/lib/notifications.ts`
- **Line:** 42
- **Issue Type:** Type Assertions
- **Risk Level:** MEDIUM
- **Details:**
  ```typescript
  const uid = row.user_id as string;
  ```
  No null check. If `user_id` is NULL in the database, the cast lies.

- **Recommended Fix:**
  ```typescript
  if (!row.user_id || typeof row.user_id !== 'string') continue;
  const uid = row.user_id;
  ```

---

## Low-Risk Issues

### 11. **localStorage Cast in i18n**
- **File:** `/home/user/VGC-Team-Report/src/lib/i18n/index.ts`
- **Line:** 53
- **Issue Type:** Type Assertion
- **Risk Level:** LOW
- **Details:**
  ```typescript
  const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  ```
  Safe because `getItem` always returns `string | null`, and LanguageCode is a literal union. Cast is correct.

---

### 12. **Parser Gender Cast**
- **File:** `/home/user/VGC-Team-Report/src/lib/parser/showdown-parser.ts`
- **Lines:** 80, 114–115
- **Issue Type:** Type Assertions
- **Risk Level:** LOW
- **Details:**
  ```typescript
  gender = genderMatch[1] as "M" | "F";  // Regex ensures only M or F
  if (POKEMON_TYPES.includes(tt as PokemonType)) {  // Check guards the cast
    teraType = tt as PokemonType;
  }
  ```
  Safe because regex and guard clauses constrain the values. Code is correct.

---

## Summary Table

| File | Line(s) | Issue | Risk | Type |
|------|---------|-------|------|------|
| diff-state.ts | 6, 87, 90, 94 | Unchecked `any` in matchup diffing | HIGH | Logic Error |
| version-diff.ts | 154, 158, 160 | Unchecked `any` in plan normalization | HIGH | Logic Error |
| collaborations/route.ts | 33–47 | Multiple unsafe `as` casts (db rows) | HIGH | Runtime Crash |
| discord/route.ts | 68 | Unsafe cast on `.find()?.value` | MEDIUM | Logic Error |
| cache.ts | 35 | Unvalidated `as T` when schema omitted | HIGH | Logic Error |
| normalize-report.ts | 8, 14, 19, 29, 36 | Mixed `any` and unchecked `as` | MEDIUM | Logic Error |
| pkmn-dex-fallback.ts | 57, 66, 75 | Casts from untyped @pkmn/dex | MEDIUM | Fragility |
| stat-calculator.ts | 58, 74 | Partial<T> cast to T (incomplete init) | MEDIUM | Logic Error |
| spotlight/route.ts | 26, 27, 30 | Unsafe db row casts (same as collaborations) | MEDIUM | Runtime Crash |
| notifications.ts | 42 | Cast without null check | MEDIUM | Logic Error |
| i18n/index.ts | 53 | Safe cast (guarded by API contract) | LOW | — |
| showdown-parser.ts | 80, 114–115 | Safe casts (regex/guard constrained) | LOW | — |

---

## Recommended Actions (Priority Order)

### Tier 1: Must Fix (This Sprint)
1. **Cache layer** — make schema required or return `unknown` by default
2. **API db row mapping** — create centralized Zod schemas for collaborations, spotlight, and other routes
3. **Diff functions** — replace `any` with proper `MatchupPlan` interfaces

### Tier 2: Should Fix (Next Sprint)
4. **normalize-report.ts** — narrow `unknown` before casting
5. **stat-calculator.ts** — initialize all keys upfront instead of casting `Partial<T>`
6. **Notifications** — add null checks before casting

### Tier 3: Nice-to-Have (Refactoring)
7. **Type untyped libraries** — add .d.ts shims for @pkmn/dex or keep local casts documented
8. **Enable stricter tsconfig** — set `noImplicitAny: true` and `noImplicitThis: true` if not already

---

## Quick Wins

- **Replace `type AnyRecord = Record<string, any>`** with explicit shapes (breaks zero code, improves signal)
- **Extract db row schemas** → `/lib/db-schemas.ts` with Zod (eliminates 20+ unsafe casts in 1 file)
- **Remove `as T` from cache** → make schema required (fixes the highest-risk footgun)
- **Add `as const` assertions** to game plan structures to leverage TypeScript's literal type narrowing

---

## Files Needing Review

```
High Priority:
- src/lib/utils/diff-state.ts
- src/lib/utils/version-diff.ts
- src/lib/cache.ts
- src/app/api/user/collaborations/route.ts
- src/app/api/spotlight/route.ts

Medium Priority:
- src/lib/utils/normalize-report.ts
- src/lib/analysis/stat-calculator.ts
- src/lib/notifications.ts
- src/lib/data/pkmn-dex-fallback.ts
- src/app/api/discord/route.ts
```

