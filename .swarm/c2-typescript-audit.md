# TypeScript Strictness Audit

**Date:** 2026-05-28
**Scope:** `src/lib/` and `src/app/api/` (prioritized), full `src/` secondary
**tsconfig:** `strict: true` is enabled -- good baseline

---

## Executive Summary

The codebase is generally well-typed with `strict: true` enabled and Zod validation at API boundaries. However, there are systemic patterns that undermine type safety: **55+ unnarrowed `catch (e)` blocks** across API routes, **pervasive `as` assertions on database row fields** (zero runtime validation), and **untyped `fetch().json()` return values** in core library files. The most critical risk area is the database layer, where every query result is accessed via unchecked `as` casts.

---

## Category 1: Explicit `any` Usage

### Finding 1.1 -- `Record<string, any>` in migrate route
- **File:** `src/app/api/migrate/route.ts:50`
- **Code:** `const data = row.data as Record<string, any>;`
- **Severity:** Medium
- **Impact:** The only explicit `any` annotation in production code (has an eslint-disable comment). Data from every share row passes through this unchecked. Should use `Record<string, unknown>` and let `normalizeReportData` narrow the fields, which it already does.
- **Fix:** Change to `Record<string, unknown>` -- `normalizeReportData` already accepts this type.

### Finding 1.2 -- `AnyObject` from `@pkmn/dex` leaking into local code
- **File:** `node_modules/@pkmn/dex/build/index.d.ts`
- **Severity:** Low (third-party, cannot directly fix)
- **Impact:** `@pkmn/dex` internally uses `AnyObject = { [k: string]: any }` in constructors. The typed API surface (`.baseStats`, `.types`, `.abilities`, `.megaStone`) is well-typed, but some properties like `megaStone` on Items have specialized branded types that don't match the project's own types, requiring `as` casts. Not actionable beyond the existing pattern.

---

## Category 2: Unsafe `as` Type Assertions (43+ instances)

### Finding 2.1 -- Database row field casts (CRITICAL, systemic)
- **Files:** Every API route that reads from the database
- **Severity:** High
- **Pattern:** `row.data as Record<string, unknown>`, `row.id as string`, `row.created_at as Date`, `row.view_count as number`, `(data.paste as string)`, etc.
- **Examples:**
  - `src/app/api/user/collaborations/route.ts:33-47` -- 15 casts in one handler
  - `src/app/api/user/feed/route.ts:30-39` -- 10 casts
  - `src/app/api/user/drafts/route.ts:76-104` -- 14 casts
  - `src/app/api/spotlight/route.ts:26-53` -- 10 casts
  - `src/app/api/team-graphic/route.tsx:101-107` -- 7 casts
- **Impact:** The `@neondatabase/serverless` `neon()` tagged template returns rows typed as `Record<string, unknown>`, so every field access requires a cast. The codebase universally uses `as` casts with zero runtime validation. A schema change or migration bug would silently produce wrong data or runtime crashes.
- **Fix:** Define typed row interfaces (e.g., `ShareRow`, `DraftRow`) and create a thin query wrapper that validates row shape, or use Zod schemas for DB row validation. Example:
  ```typescript
  const ShareRowSchema = z.object({
    id: z.string(),
    data: z.record(z.unknown()),
    created_at: z.coerce.date(),
    view_count: z.number(),
    is_public: z.boolean(),
  });
  ```

### Finding 2.2 -- `@pkmn/dex` field casts
- **File:** `src/lib/data/pkmn-dex-fallback.ts`
- **Severity:** Medium
- **Instances:**
  - Line 57: `entry.baseStats as StatSpread` -- `@pkmn/dex` `StatsTable<number>` is structurally identical to `StatSpread`. Safe but brittle.
  - Line 66: `entry.types as PokemonType[]` -- `@pkmn/dex` uses `TypeName` (branded string), project uses `PokemonType` (string union). Structurally compatible but the cast silences potential mismatches.
  - Line 75: `Object.values(entry.abilities) as string[]` -- strips brand. Safe.
  - Lines 111, 119, 130, 157-158: `item.megaStone as Record<string, string>` -- `megaStone` is typed as `{ [megaEvolves: SpeciesName]: SpeciesName }` in `@pkmn/dex`. The cast drops the brand.
- **Fix:** Create a mapping utility `function toPokemonType(t: TypeName): PokemonType | null` that validates membership in the `PokemonType` union.

### Finding 2.3 -- Partial-to-full StatSpread cast
- **File:** `src/lib/analysis/stat-calculator.ts:58,74`
- **Code:** `return result as StatSpread;`
- **Severity:** Medium
- **Impact:** `result` is `Partial<StatSpread>` built by iterating over all 6 stat names. The loop guarantees all keys are set, but TypeScript cannot verify this. Fragile if `StatName` is extended.
- **Fix:** Initialize as full `StatSpread` with zeros, or use `Object.fromEntries`.

### Finding 2.4 -- `bytes.buffer as ArrayBuffer`
- **File:** `src/lib/sharing/url-codec.ts:188`
- **Severity:** Low
- **Impact:** `Uint8Array.buffer` returns `ArrayBufferLike`, not `ArrayBuffer`. Technically unsound but works in all JS engines.

### Finding 2.5 -- `localStorage` value cast
- **File:** `src/lib/i18n/index.ts:53`
- **Code:** `localStorage.getItem(STORAGE_KEY) as LanguageCode | null`
- **Severity:** Medium
- **Impact:** Corrupted localStorage value could crash downstream. Should validate against known language codes.
- **Fix:** `LANGUAGES.find(l => l === raw) ?? DEFAULT_LANGUAGE`

---

## Category 3: Unnarrowed `catch (e)` Blocks (55+ instances)

### Finding 3.1 -- API routes universally use `catch (e)` without narrowing
- **Severity:** Medium-High (systemic)
- **Pattern:** `try { ... } catch (e) { console.error("...", e); return NextResponse.json(...); }`
- **Good example:** `src/app/api/cron/posthog-errors/route.ts:297` -- uses `e instanceof Error ? e.message : "Unknown error"`
- **Impact:** 55+ routes pass raw `unknown` to `console.error` without narrowing. Functionally harmless for basic logging but prevents structured error reporting.
- **Affected:** All 50+ API routes, plus `src/lib/db.ts:12`, `src/lib/email.ts:81,176`, `src/lib/notifications.ts:22,46`
- **Fix:** Create a shared error handler:
  ```typescript
  export function logError(context: string, e: unknown): string {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`${context}:`, e instanceof Error ? e : message);
    return message;
  }
  ```

---

## Category 4: Missing Return Types on Exported Functions

### Finding 4.1 -- Core library functions missing explicit return types
- **Severity:** Medium
- **Instances:**
  - `src/lib/db.ts:3` -- `getDb()` returns inferred neon query function
  - `src/lib/db.ts:9` -- `ensureTable()` returns inferred `Promise<void>`
  - `src/lib/notifications.ts:9,30` -- `createNotification`, `notifyFollowers`
  - `src/lib/discord-webhook.ts:15` -- `postToBuildsChannel`
  - `src/lib/discord-bot.ts:60` -- `postFeedbackEmbed`
  - `src/lib/email.ts:23` -- `sendEmail` returns `Promise<any>` (from `res.json()`)
  - `src/lib/posthog-server.ts:24` -- `captureServerEvent`
- **Impact:** Without explicit return types on exported functions, internal refactors can silently change the public API. `sendEmail` is worst -- returns raw `res.json()` which is `Promise<any>`.

---

## Category 5: Unsound Generic / Schema Gaps

### Finding 5.1 -- `CalcEntrySchema` is `z.unknown()`
- **File:** `src/lib/sharing/url-codec.ts:7`
- **Severity:** Medium
- **Impact:** The `ShareableStateSchema` validates everything except calc entries, which pass through as `unknown`. Malformed calc data in shared URLs is never validated.

### Finding 5.2 -- `cacheGet<T>` unchecked cast path
- **File:** `src/lib/cache.ts:35`
- **Code:** `if (!schema) return raw as T;`
- **Severity:** Medium
- **Impact:** When called without a Zod schema (common case), cached values are returned with an unchecked cast. Stale or corrupted cache entries propagate silently.

---

## Category 6: Missing Null/Undefined Checks

### Finding 6.1 -- `process.env.DATABASE_URL!` non-null assertion
- **File:** `src/lib/db.ts:4`
- **Severity:** Medium
- **Impact:** Only `!` assertion on an env var in the codebase. Every other env var is checked gracefully. Crashes with unhelpful error if unset.

### Finding 6.2 -- `redis!` non-null assertion
- **File:** `src/lib/rate-limit.ts:24`
- **Severity:** Low
- **Impact:** Sound (guarded by `if (redis)` in caller) but non-obvious.

---

## Category 7: Untyped External API Responses

### Finding 7.1 -- `res.json()` returns implicit `any`
- **Files:**
  - `src/lib/linear.ts:32` -- `const data = await res.json();` then `data.data`, `data.errors` accessed untyped
  - `src/lib/discord-bot.ts:33` -- `return res.json();` -- return type is `Promise<any>`
  - `src/lib/email.ts:56` -- `return res.json();` -- return type is `Promise<any>`
  - `src/lib/utils/pokepaste.ts:19,22,44,47` -- accessing `.error`, `.paste`, `.title`, `.url` on untyped response
- **Severity:** Medium
- **Fix:** Define response interfaces and validate or cast at the boundary.

---

## Metrics Summary

| Category | Count | Severity |
|----------|-------|----------|
| Explicit `any` usage | 1 | Medium |
| Unsafe `as` assertions | 43+ | High (DB rows), Medium (others) |
| Unnarrowed `catch (e)` | 55+ | Medium |
| Missing return types (exported) | 10+ | Medium |
| Schema/validation gaps | 2 | Medium |
| Missing null checks | 2 | Medium |
| Untyped API responses | 6+ | Medium |

---

## Top 10 Recommended Fixes (by impact)

1. **Create typed DB row interfaces + validation** -- Eliminates 43+ `as` casts across all API routes. Single highest-impact change.
2. **Shared error handler for catch blocks** -- Eliminates 55+ unnarrowed catch patterns in one utility.
3. **Type the `linearQuery` / `discordFetch` / `sendEmail` return values** -- Stops `any` from `res.json()` propagating through the lib layer.
4. **Add Zod schema to `CalcEntrySchema`** -- Closes the validation gap in shared URL decoding.
5. **Replace `process.env.DATABASE_URL!` with a checked accessor** -- Prevents cryptic runtime crash on missing env var.
6. **Pass Zod schemas to `cacheGet` calls** -- Validates cached data matches expected shape.
7. **Add explicit return types to all exported functions in `src/lib/`** -- Prevents silent API drift.
8. **Validate localStorage values** (`i18n/index.ts`) -- Prevents corrupted stored preference from crashing.
9. **Create `toPokemonType()` bridge for `@pkmn/dex`** -- Type-safe boundary between external and internal type systems.
10. **Change `Record<string, any>` to `Record<string, unknown>` in migrate route** -- Eliminates the only explicit `any` in production code.
