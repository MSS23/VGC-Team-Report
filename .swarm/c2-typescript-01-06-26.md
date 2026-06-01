# C2: TypeScript Strictness Audit — 01/06/26

**Scope:** `src/lib/**` and `src/app/api/**` | **tsconfig:** `strict: true` enabled  
**Method:** grep-based pattern matching + targeted file reads (read-only)  
**Conflict Risk:** Checked against `.swarm/main-changed-files.md`

---

## Top 12 Issues

### 1. **Unsafe `as unknown as T` cast in dex-subset lookup**
- **File:** `src/lib/data/dex-subset.ts:62`
- **Issue:** `const subset = rawSubset as unknown as DexSubset;`
- **Risk:** JSON import bypasses all type checking. If schema changes, runtime data access can fail silently.
- **Severity:** Medium (runtime contract violation)
- **Fix:** Use `zod` to validate the JSON structure before casting, or keep the "cast once" pattern but document the schema contract clearly.
- **Conflict Risk:** No

### 2. **Unsafe `as unknown as` cast in i18n fallback proxy**
- **File:** `src/lib/i18n/index.ts:83`
- **Issue:** `return (en as unknown as Record<string, string>)[prop];`
- **Risk:** Proxy fallback assumes all translation keys are strings; `undefined` keys not validated.
- **Severity:** Low (UI renders fallback, but no type safety)
- **Fix:** Add explicit `.get()` method to the Proxy handler with a type guard; validate key exists before fallback.
- **Conflict Risk:** No

### 3. **Unsafe type assertion cascade in API routes (batch example)**
- **File:** `src/app/api/spotlight/route.ts:26–59` (multiple)
- **Issue:** Multiple `as` assertions without guards: `row.data as Record<string, unknown>` → `data.paste as string` → `(row.created_at as Date).toISOString()`
- **Lines:** 26, 27, 30, 42, 49–59
- **Risk:** No runtime validation between database layer and response. If schema drifts (e.g., missing paste field), crashes at serialization.
- **Severity:** High (API boundary risk)
- **Fix:** Add runtime validation with Zod schema at DB result entry point; use a single `.parse()` to normalize row shape.
- **Conflict Risk:** No (spotlight is not in changed files)

### 4. **Batch `as` assertions in user/drafts and collaborations routes**
- **File:** `src/app/api/user/drafts/route.ts:76–104` and `src/app/api/user/collaborations/route.ts:38–54`
- **Issue:** Same pattern as #3: cascading `as Record<string, unknown>` + field assertions
- **Lines:** user/drafts 94–104, user/collaborations 39–54
- **Risk:** Silent failures if database schema changes or returns null/undefined
- **Severity:** High (API contract)
- **Fix:** Introduce a single validation schema in each route that parses the full row object. Example: `z.object({ id: z.string(), data: z.record(...), created_at: z.coerce.date() })`
- **Conflict Risk:** **Yes** — `src/app/api/user/collaborations/route.ts` is in changed files

### 5. **Untyped option callback in discord/route.ts**
- **File:** `src/app/api/discord/route.ts:68`
- **Issue:** `const getOption = (name: string) => options.find((o: { name: string }) => o.name === name)?.value as string | undefined;`
- **Risk:** The lambda `o` param is inline-typed, but `options` array is untyped (`const options = body.data?.options ?? []`). Assertion `as string | undefined` trusts untrusted Discord payload.
- **Severity:** High (security boundary)
- **Fix:** Add Zod schema for Discord interaction payload; validate `options` array shape before accessing.
- **Conflict Risk:** No

### 6. **Unsanitized `z.unknown()` in state schema (share route)**
- **File:** `src/app/api/share/route.ts:16–28`
- **Issue:** `matchupPlans: z.array(z.unknown()).optional().default([])`, `notes: z.record(z.string(), z.unknown()).optional()`, etc.
- **Risk:** Zod will accept any shape. Downstream code casts these to specific types without validation (e.g., line 103: `state.creatorName as string`).
- **Severity:** Medium (Zod should narrow, not trust)
- **Fix:** Define explicit shape schemas: `matchupPlans: z.array(z.object({ ... }))`, `notes: z.record(z.object({ ... }))`. Even if you can't enumerate all fields, use `z.record(z.string(), z.any())` with a comment explaining why.
- **Conflict Risk:** **Yes** — `src/app/api/share/route.ts` is in changed files

### 7. **Missing return type on getJsPDF() helper**
- **File:** `src/lib/utils/export-report.ts:4`
- **Issue:** `async function getJsPDF() { ... }` — no explicit return type annotation
- **Severity:** Low (not exported, but part of utility chain)
- **Fix:** Add explicit `Promise<typeof import("jspdf").jsPDF>` return type.
- **Conflict Risk:** No

### 8. **Type assertion without guard in pkmn-dex-fallback.ts**
- **File:** `src/lib/data/pkmn-dex-fallback.ts:68, 77, 133`
- **Issue:** Multiple `as StatSpread` and `as PokemonType[]` casts without length/content checks
- **Lines:** 68 (`as StatSpread`), 77 (`as PokemonType[]`), 133 (`as PokemonType[]`)
- **Risk:** Assumes the dex subset's shape always matches; if schema changes, casting silently produces wrong data
- **Severity:** Medium (fallback path, but affects rendering)
- **Fix:** Validate base stats have required keys; use a type predicate for the types array.
- **Conflict Risk:** No

### 9. **Broad `Record<string, unknown>` return types in API responses**
- **File:** Multiple API routes (user/drafts, collaborations, spotlight, discord)
- **Issue:** Returns like `{ reports: Record<string, unknown>[] }` or untyped data objects in responses
- **Severity:** Medium (client-side type safety lost)
- **Fix:** Define explicit response type schemas; export from a `types/api.ts` file so clients can import and trust the shape.
- **Conflict Risk:** Yes (several routes in changed files)

### 10. **Implicit `any` from unvalidated JSON parse in discord/route.ts**
- **File:** `src/app/api/discord/route.ts:55`
- **Issue:** `const body = JSON.parse(rawBody);` — no schema validation before access
- **Risk:** `body.type`, `body.data`, `body.data.name` access without type checks
- **Severity:** High (security/correctness)
- **Fix:** Add Zod schema for the Discord interaction envelope; use `schema.parse(body)` immediately after JSON.parse().
- **Conflict Risk:** No

### 11. **Callback parameter implicitly typed in Proxy handler**
- **File:** `src/lib/i18n/index.ts:80`
- **Issue:** `get(target, prop: string) { ... }` — parameter `target` is untyped (implicit `this` context). In Proxy handlers, TypeScript needs explicit annotation for handler.
- **Severity:** Low (type system, not runtime)
- **Fix:** Explicitly type the Proxy handler: `const handler: ProxyHandler<Record<string, string>> = { get(target, prop) { ... } }`
- **Conflict Risk:** No

### 12. **SQL result assumption without runtime guard**
- **File:** `src/app/api/share/route.ts:127`
- **Issue:** `const oldState = oldRows.length > 0 ? (oldRows[0].data as Record<string, unknown>) : null;`
- **Risk:** If `.data` column is `NULL` in DB, the cast produces `null` which is then treated as an object (line 128).
- **Severity:** Medium (logic error)
- **Fix:** Add explicit null check and validate the shape with Zod before destructuring.
- **Conflict Risk:** **Yes** — `src/app/api/share/route.ts` in changed files

---

## Summary by Severity

| Severity | Count | Root Cause |
|----------|-------|-----------|
| High     | 4     | Unvalidated JSON/DB schema, missing payload validation |
| Medium   | 6     | Type assertions without guards, broad `unknown` types |
| Low      | 2     | Missing return types, implicit Proxy handler types |

---

## Recommended Priorities

1. **Fix #6 (share route z.unknown())** — reused by frontend team, contract must be solid
2. **Fix #4 (user/collaborations, user/drafts)** — both in changed files
3. **Fix #3 & #10 (DB/JSON result validation)** — affects all API routes, risk of silent failures
4. **Fix #2 (i18n fallback)** — low risk, but affects all translated UIs

---

## Patterns to Avoid Going Forward

- ✗ `z.unknown()` without a comment explaining why
- ✗ `as Record<string, unknown>` without validating keys match expected shape
- ✗ `JSON.parse()` without Zod `.parse()` immediately after
- ✗ Database results treated as correctly-typed without schema assertion
- ✓ Use Zod at every boundary (JSON input, DB output, inter-module calls)
- ✓ Explicit return types on all exported functions
- ✓ Never chain `as` assertions; validate once and destructure

