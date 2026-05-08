# TypeScript Strictness Audit

_Date: 2026-05-08_

---

## 1. `tsconfig.json` Strictness Settings

**File:** `/home/user/VGC-Team-Report/tsconfig.json`

- `"strict": true` — **enabled**. This activates `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, `strictPropertyInitialization`, etc.
- `"skipLibCheck": true` — skips type-checking of `.d.ts` files from `node_modules`. Acceptable for build speed; does not weaken user-code strictness.
- `"allowJs": true` — allows plain JS files; no `checkJs`, so JS files are unchecked.
- No explicit `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, or `noImplicitReturns` — these are **not** part of `strict: true` and are absent, leaving some gaps.

**Verdict:** Baseline is solid. The three missing options above (especially `noUncheckedIndexedAccess`) could catch real bugs at array/map access sites.

---

## 2. `any` Type Usage

### 2a. Explicit `: any` annotations

| File | Line(s) | Detail |
|------|---------|--------|
| `src/lib/utils/version-diff.ts` | 154, 160 | `normalizePlan = (p: any)` and `p.gamePlans.map((gp: any) => ...)` — both have `// eslint-disable-next-line @typescript-eslint/no-explicit-any` suppressions |
| `src/lib/utils/diff-state.ts` | 87, 90, 94 | `matchupPlansChanged(oldPlans: any[], newPlans: any[])`, `normalize = (p: any)`, `(p.gamePlans ?? []).map((gp: any) => ...)` — all have `eslint-disable` suppressions |

**Root cause:** `MatchupPlan` and `GamePlan` interfaces exist in `src/hooks/useMatchupPlans.ts` (lines 7 and 15) but are **not imported** in these utility files. Both utility functions use `any` as a workaround rather than importing the proper types.

**Fix:** Import `MatchupPlan` and `GamePlan` from `@/hooks/useMatchupPlans` (or move the interfaces to `src/lib/types/analysis.ts`) and replace all four `any` annotations.

### 2b. `as any` casts

None found in `src/` (the one grep hit on line 21 of `DisplayTogglePill.tsx` is a comment, not a cast).

---

## 3. Unsafe Double-Casts (`as unknown as`)

| File | Line | Detail |
|------|------|--------|
| `src/hooks/useHomePage.ts` | 264 | `t as unknown as Record<string, string>` passed to `useShareFlow` |
| `src/hooks/useHomePage.ts` | 437 | `t as unknown as Record<string, string>` passed to `useSlideSystem` |
| `src/hooks/useSlideNavigation.ts` | 46 | `document as unknown as { startViewTransition: ... }` |

**Root cause (lines 264 & 437):** `useTranslation()` returns `{ t: TranslationKeys }` where `TranslationKeys` is the inferred type of the `en` object literal (a deeply-typed record of string keys to string literals). `useShareFlow` and `useSlideSystem` both accept `t: Record<string, string>` — a looser type. The two are structurally compatible but TypeScript rejects the direct assignment because `TranslationKeys` uses literal value types, not the wider `string`. The correct fix is to change the consumer signatures (`useShareFlow`, `useSlideSystem`) to accept `t: TranslationKeys` directly, eliminating the cast.

**Root cause (line 46 in `useSlideNavigation.ts`):** `document.startViewTransition` is not yet in the TypeScript DOM lib for the project's `"target": "ES2017"`. The cast is a reasonable polyfill pattern; the cleanest alternative is a local interface declaration merging into `Document`.

---

## 4. `@ts-ignore` / `@ts-nocheck` Suppressions

**None found** across `src/`. Zero suppressions.

---

## 5. Missing Return Types on Exported Functions

The following exported functions in `src/lib/` lack explicit return type annotations (return type is inferred):

| File | Function | Inferred Return |
|------|----------|----------------|
| `src/lib/notifications.ts` | `createNotification` | `Promise<void>` |
| `src/lib/notifications.ts` | `notifyFollowers` | `Promise<void>` |
| `src/lib/db.ts` | `getDb` | `NeonQueryFunction<...>` (complex) |
| `src/lib/db.ts` | `ensureTable` | `Promise<void>` |
| `src/lib/discord-webhook.ts` | `postToBuildsChannel` | `Promise<void>` |
| `src/lib/discord-webhook.ts` | `postToFeedbackChannel` | `Promise<void>` |
| `src/lib/posthog-server.ts` | `captureServerEvent` | `void` |
| `src/lib/utils/haptics.ts` | `hapticLight`, `hapticMedium`, `hapticSuccess` | `void` |
| `src/lib/utils/export-report.ts` | `exportAsImage`, `exportAsPdf` | `Promise<void>` |
| `src/lib/i18n/index.ts` | `I18nProvider` | `JSX.Element` |
| `src/lib/i18n/index.ts` | `useTranslation` | `I18nContextValue` |

**API route handlers** (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`) across `src/app/api/**` are also missing return types — they should return `Promise<NextResponse>` or `Promise<Response>`. This is a widespread pattern across ~25 route files.

---

## 6. Missing Generic Constraints in `src/lib/`

| File | Function | Issue |
|------|----------|-------|
| `src/lib/cache.ts:22` | `cacheGet<T>(key: string): Promise<T \| null>` | `T` is unconstrained (`T` defaults to `unknown` at call sites without inference). No `extends object` or `extends JsonValue` constraint. Callers could pass `T = Function` or `T = symbol`, which Redis would never actually return. A constraint like `T extends Record<string, unknown> \| string \| number \| boolean \| null` or a `JsonValue` type would make this safer. |

No other unconstrained generics found in `src/lib/`.

---

## Summary by Priority

### High (type safety holes)
1. **`diff-state.ts` + `version-diff.ts`** — Replace 6 `any` annotations with `MatchupPlan`/`GamePlan` types. The interfaces already exist in `useMatchupPlans.ts`; they just need to be imported or relocated to `src/lib/types/`.
2. **`useHomePage.ts` double-casts** — Fix consumer types in `useShareFlow` and `useSlideSystem` to accept `TranslationKeys` instead of `Record<string, string>`, removing two `as unknown as` casts.

### Medium (contract clarity)
3. **Missing return types** — `createNotification`, `notifyFollowers`, `getDb`, `ensureTable`, `captureServerEvent` in `src/lib/` are the highest-value additions. API route handlers are widespread but lower risk since Next.js validates them at runtime.
4. **`cacheGet<T>` unconstrained generic** — Add a `JsonValue`-style constraint to prevent nonsensical type arguments.

### Low (optional hardening)
5. **`tsconfig.json`** — Consider adding `"noUncheckedIndexedAccess": true` and `"noImplicitReturns": true` for deeper coverage. These are breaking changes that will surface real issues across the codebase.
6. **`useSlideNavigation.ts` `as unknown as`** — Low risk; acceptable platform polyfill pattern. Could be cleaned up with interface merging.
