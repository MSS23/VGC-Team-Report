# C2 TypeScript Strictness Audit

_Audited: 2026-05-14 | Scope: src/ | Focus: VGC-179 + general strictness_

---

## 1. `as unknown as X` Casts (VGC-179) — 4 occurrences

### 1a. `src/components/providers/PostHogProvider.tsx:14`
```ts
let _usePostHog: typeof usePostHogType = () => undefined as unknown as ReturnType<typeof usePostHogType>;
```
**Issue:** Stub initializer silences TS by double-casting `undefined` to `PostHog`.
**Fix:** Type the variable to allow `undefined` for the no-op stub:
```ts
let _usePostHog: () => ReturnType<typeof usePostHogType> | undefined = () => undefined;
export function usePostHog(): ReturnType<typeof usePostHogType> | undefined {
  return _usePostHog();
}
```
Callers already guard with `if (!posthog)`, so adding `| undefined` to the return type propagates safely.

---

### 1b–1c. `src/hooks/useHomePage.ts:265` and `:439`
```ts
t: t as unknown as Record<string, string>
```
**Issue:** `t` is `TranslationKeys` (a typed flat object from `src/lib/i18n/index.ts`). `useShareFlow` and `useSlideSystem` both declare their parameter as `t: Record<string, string>`, forcing a double-cast at every call site.

**Fix:** Widen the consumer interfaces instead of casting at call sites:
```ts
// In useShareFlow.ts and useSlideSystem.ts
import type { TranslationKeys } from "@/lib/i18n/translations/en";

interface ShareFlowOptions {
  // ...
  t: TranslationKeys;
}
```
`TranslationKeys` is a concrete `Record<string, string>`-compatible object literal type. This eliminates both casts with no runtime impact.

---

### 1d. `src/hooks/useSlideNavigation.ts:46`
```ts
const transition = (document as unknown as { startViewTransition: ... }).startViewTransition(update);
```
**Issue:** The View Transitions API is not in the TypeScript DOM lib, so casting `document` is necessary — but the double-cast obscures the intent.
**Fix:** Use a named interface to make a single, readable cast:
```ts
interface DocumentWithViewTransition extends Document {
  startViewTransition(cb: () => void): { ready: Promise<void>; finished: Promise<void> };
}
const transition = (document as DocumentWithViewTransition).startViewTransition(update);
```
Single cast `as DocumentWithViewTransition` is cleaner and the check `"startViewTransition" in document` already guards the call.

---

## 2. `: any` Annotations in `src/lib/` — 5 occurrences

### 2a. `src/lib/utils/version-diff.ts:154`
```ts
const normalizePlan = (p: any) => ({
```
**Issue:** `p` is a `SerializedMatchupPlan` from `url-codec.ts`. The `any` was written before `SerializedMatchupPlan` was exported.
**Fix:**
```ts
import type { SerializedMatchupPlan, SerializedGamePlan } from "@/lib/sharing/url-codec";
const normalizePlan = (p: SerializedMatchupPlan) => ({ ... });
```

### 2b. `src/lib/utils/version-diff.ts:160`
```ts
? p.gamePlans.map((gp: any) => ({
```
Same root cause as 2a. Fixed by the same `SerializedGamePlan` import.

### 2c–2e. `src/lib/utils/diff-state.ts:87,90,94`
```ts
function matchupPlansChanged(oldPlans: any[], newPlans: any[]): boolean {
  const normalize = (p: any) => JSON.stringify({
    gamePlans: (p.gamePlans ?? []).map((gp: any) => ({
```
**Fix:** Same import approach — parameter types become `SerializedMatchupPlan[]` and `SerializedMatchupPlan`/`SerializedGamePlan` respectively.

---

## 3. `as any` Casts in `src/` — 0 occurrences

No `as any` casts found in production source (excluding JSDoc comments). Clean.

---

## 4. VGC-146: JSON.parse Validation in `src/lib/sharing/url-codec.ts` — FIXED

```ts
const parsed: unknown = JSON.parse(json);           // line 208 — typed as unknown ✓
const result2 = ShareableStateSchema.safeParse(parsed);  // line 213 — Zod validated ✓
if (!result2.success) return null;
return result2.data as ShareableState;
```
**Status: Fixed.** `JSON.parse` output is explicitly `unknown`, run through `ShareableStateSchema.safeParse`, and returns `null` on shape mismatch. The only remaining cast (`as ShareableState` on line 215) is safe because it follows a successful `safeParse`. No action required.

---

## 5. `cacheGet<T>` Unsound Generic in `src/lib/cache.ts` — PARTIALLY ADDRESSED

```ts
export async function cacheGet<T>(key: string, schema?: ZodType<T>): Promise<T | null> {
  // ...
  if (!schema) return raw as T;   // line 35 — unsound unchecked cast
```
**Issue:** The `schema` parameter is optional. When omitted, the function performs a bare `raw as T` cast on the Redis value with no runtime shape guarantee. The JSDoc comment at line 27 acknowledges this ("the generic is just an unchecked cast").

**Recommended Fix:** Make the schema required, or use overloads to split paths:
```ts
// Typed, validated path (preferred)
export async function cacheGet<T>(key: string, schema: ZodType<T>): Promise<T | null>;
// Untyped path — caller receives unknown and must narrow
export async function cacheGet(key: string): Promise<unknown | null>;
```
All current call sites that pass a schema continue to work unchanged.

---

## 6. Top 5 Exported Functions Missing Return Type Annotations

| # | File:Line | Function | Missing Return Type |
|---|-----------|----------|---------------------|
| 1 | `src/lib/notifications.ts:9` | `createNotification(...)` | `: Promise<void>` |
| 2 | `src/lib/notifications.ts:30` | `notifyFollowers(...)` | `: Promise<void>` |
| 3 | `src/lib/discord-webhook.ts:15` | `postToBuildsChannel(embed)` | `: Promise<void>` |
| 4 | `src/lib/discord-webhook.ts:31` | `postToFeedbackChannel(embed)` | `: Promise<void>` |
| 5 | `src/lib/db.ts:3` | `getDb()` | `: ReturnType<typeof neon>` |

`ensureTable()` at `src/lib/db.ts:9` also lacks `: Promise<void>`. `getDb` is the highest-impact gap because its return type is consumed by 12+ API routes — making it explicit prevents breakage if the neon version changes.

---

## Summary Table

| Issue Type | Count | Files |
|-----------|-------|-------|
| `as unknown as` casts (VGC-179) | 4 | PostHogProvider.tsx, useHomePage.ts (×2), useSlideNavigation.ts |
| `: any` annotations in src/lib/ | 5 | version-diff.ts (×2), diff-state.ts (×3) |
| `as any` casts | 0 | — clean |
| JSON.parse unvalidated (VGC-146) | 0 | Fixed in url-codec.ts |
| Unsound optional generic (cache.ts) | 1 | cache.ts:35 |
| Missing explicit return types | 5+ | notifications.ts, discord-webhook.ts, db.ts |

**Total actionable issues: 15**

**Priority for VGC-179:** Fix the `t: TranslationKeys` mismatch (issues 1b–1c) first — changing two interface declarations in `useShareFlow.ts` and `useSlideSystem.ts` eliminates two call-site casts with zero runtime risk and no breaking change. The `useSlideNavigation.ts` double-cast (1d) is the next easiest win. The PostHog stub (1a) requires adding `| undefined` to callers, which is a slightly larger change.
