# C2: TypeScript Strictness Audit

## Overall Assessment: A− (Exceptionally Clean)

- Only 1 explicit `any` use (already guarded with eslint-disable)
- 0 `@ts-ignore` / `@ts-expect-error` directives
- Systematic use of `Record<string, unknown>` with runtime narrowing
- Proper error handling and async/await patterns

## Top 5 Highest-Leverage Type Tightenings

### 1. Non-null assertion in sync handler (CRITICAL)
**File:** `src/app/api/sync/[id]/route.ts:26`
**Issue:** `presence.get(shareId)!.set()` could crash on missing key.
**Fix:** Replace with `presence.get(shareId)?.set()` or guard.
**Risk:** HIGH

### 2. Unsafe Clerk webhook cast (MEDIUM RISK)
**File:** `src/app/api/webhooks/clerk/route.ts:46`
**Issue:** `event.data as unknown as ClerkUserCreatedData` needs runtime validation.
**Fix:** Add a type guard to check `email_addresses` before use.
**Risk:** MEDIUM

### 3. Missing return types on critical routes (LOW-MEDIUM RISK)
**Files:** `src/app/api/share/route.ts:62`, `src/app/api/sync/[id]/route.ts:53`
**Fix:** Add explicit `: Promise<NextResponse>` / `: Promise<Response>` annotations.

### 4. Missing return types on lib exports (LOW RISK)
~10 functions in `src/lib/` lack explicit return type annotations.
**Fix:** Add `: void` and `: Promise<void>`.

### 5. Explicit `any` in migrate route (LOW RISK)
**File:** `src/app/api/migrate/route.ts:50`
**Fix:** Change `Record<string, any>` → `Record<string, unknown>`, remove eslint-disable.

## Conflict-Risk Check
None of the top 5 findings are in files listed in `.swarm/main-changed-files.md`.

## Systemic Recommendations (Long-term)
- Extract a `safeJsonParse<T>(raw, fallback): T` helper (consolidates 30+ unguarded JSON.parse call sites)
- Enable ESLint rules: `@typescript-eslint/no-unsafe-assignment` and `no-unsafe-member-access` at warn level
- Create shared response types in `src/lib/api/response-types.ts` for all route handlers
