# C2 — TypeScript Strictness Audit

**Date:** 2026-05-07  
**Scope:** `src/lib/`, `src/app/api/`, `src/components/`

---

## 1. tsconfig.json Strictness

`strict: true` is set. This enables the full strict bundle:
- `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `strictPropertyInitialization`, `strictBindCallApply`, `noImplicitThis`, `alwaysStrict`.

No additional strictness flags are missing. The baseline is sound.

---

## 2. `any` Usage

**Total confirmed `any` hits (non-comment, non-test): 8 occurrences across 4 files.**

| File | Lines | Pattern |
|------|-------|---------|
| `src/lib/utils/diff-state.ts` | 7, 87, 90, 94 | `type AnyState = Record<string, any>`, `any[]` params, `(p: any)`, `(gp: any)` |
| `src/lib/utils/normalize-report.ts` | 8 | `type AnyRecord = Record<string, any>` |
| `src/lib/utils/version-diff.ts` | 154, 160 | `(p: any)`, `(gp: any)` |
| `src/app/api/migrate/route.ts` | 50 | `row.data as Record<string, any>` |

All occurrences in `diff-state.ts` and `version-diff.ts` are individually suppressed with `// eslint-disable-next-line @typescript-eslint/no-explicit-any` inline comments, indicating the authors were aware. The `normalize-report.ts` type alias is also suppressed at the type definition line. These are concentrated in report-state diffing logic where the stored JSON blob is genuinely untyped at the DB boundary.

**Zero hits** in `src/components/` (the two matches there were in JSDoc comment text, not code).  
**Zero hits** in `@ts-ignore` / `@ts-nocheck` / `@ts-expect-error` — none found anywhere.

---

## 3. Missing Return Types on Exported Functions

**27 exported functions lack explicit return type annotations** (detected via signature analysis). After manual verification, several multi-line signatures do have return types on the closing line of the parameter list. Confirmed **true missing return types**:

| File | Function | Notes |
|------|----------|-------|
| `src/lib/db.ts` | `getDb()` | Returns inferred `NeonQueryFunction` — complex type |
| `src/lib/db.ts` | `ensureTable()` | Returns `Promise<void>` implicitly |
| `src/lib/email.ts` | `sendEmail(opts)` | Returns `Promise<unknown>` implicitly (returns `null` or fetch result) |
| `src/lib/email.ts` | `sendCommentNotificationEmail(opts)` | Returns `Promise<void>` implicitly |
| `src/lib/email.ts` | `buildWeeklySummaryHtml(data)` | Returns `string` implicitly |
| `src/lib/discord-bot.ts` | `postFeedbackEmbed(opts)` | Returns `Promise<unknown>` implicitly |
| `src/lib/discord-bot.ts` | `postBuildNotification(opts)` | Returns `Promise<void>` implicitly |
| `src/lib/discord-webhook.ts` | `postToBuildsChannel(embed)` | Returns `Promise<void>` implicitly |
| `src/lib/discord-webhook.ts` | `postToFeedbackChannel(embed)` | Returns `Promise<void>` implicitly |
| `src/lib/notifications.ts` | `createNotification(...)` | Returns `Promise<void>` implicitly |
| `src/lib/notifications.ts` | `notifyFollowers(...)` | Returns `Promise<void>` implicitly |
| `src/lib/posthog-server.ts` | `captureServerEvent(...)` | Returns `void` implicitly |
| `src/lib/hooks/useGlobalDisplayPrefs.ts` | `useGlobalDisplayPrefs()` | Returns complex object, inferred |
| `src/lib/i18n/index.ts` | `I18nProvider(...)` | Returns `JSX.Element` implicitly |
| `src/lib/i18n/index.ts` | `useTranslation()` | Returns context object, inferred |
| `src/lib/contexts/VersionDiffContext.tsx` | `useVersionDiff()` | Returns context value, inferred |
| `src/lib/utils/game-plan-helpers.tsx` | `ReplayIcon(...)` | Returns `JSX.Element`, missing `: JSX.Element` |
| `src/lib/utils/game-plan-helpers.tsx` | `ResultBadge(...)` | Returns `JSX.Element \| null` |
| `src/lib/utils/game-plan-helpers.tsx` | `ResultToggle(...)` | Returns `JSX.Element`, missing `: JSX.Element` |
| `src/lib/utils/haptics.ts` | `hapticLight()` | Returns `void` implicitly |
| `src/lib/utils/haptics.ts` | `hapticMedium()` | Returns `void` implicitly |
| `src/lib/utils/haptics.ts` | `hapticSuccess()` | Returns `void` implicitly |
| `src/lib/linear.ts` | `createLinearIssue(opts)` | Has return type — false positive (multi-line) |

> Note: `calculateStat`, `calculateAllStats`, `computeVersionDiff`, `importTeam`, `createLinearIssue`, `isRateLimitedAsync`, `isRateLimited`, `getItemStatBoost` all have return types on the closing `)` line of their multi-line param lists — they are **correctly annotated** and were false positives in the initial grep.

**True missing return types: ~20 functions.**

---

## 4. `@ts-ignore` / `@ts-nocheck`

**0 instances.** No suppression directives found anywhere in `src/lib/`, `src/app/api/`, or `src/components/`.

---

## 5. Unsound Generics

**3 distinct type-level occurrences** (all overlapping with the `any` section above):

| File | Pattern |
|------|---------|
| `src/lib/utils/diff-state.ts:7` | `type AnyState = Record<string, any>` |
| `src/lib/utils/normalize-report.ts:8` | `type AnyRecord = Record<string, any>` |
| `src/app/api/migrate/route.ts:50` | `row.data as Record<string, any>` |

No `Array<any>` or `Promise<any>` found.

---

## Priority Files to Fix

### High priority (broadest impact, structural)
1. **`src/lib/utils/diff-state.ts`** — Replace `AnyState = Record<string, any>` with a typed interface for the report state shape. The `any[]` params in `matchupPlansChanged` and inline `(p: any)` lambdas can be replaced with `MatchupPlan[]`.
2. **`src/lib/utils/normalize-report.ts`** — Replace `AnyRecord = Record<string, any>` with `Record<string, unknown>` and update downstream casts. The function signature `normalizeReportData(data: AnyRecord): AnyRecord` is the API boundary for all DB-sourced data.
3. **`src/lib/utils/version-diff.ts`** — Same `(p: any)` pattern as diff-state.ts; can use the same typed `MatchupPlan` interface.
4. **`src/app/api/migrate/route.ts`** — `row.data as Record<string, any>` should be `Record<string, unknown>` with proper narrowing.

### Medium priority (missing return types on async utility functions)
5. **`src/lib/email.ts`** — `sendEmail`, `sendCommentNotificationEmail`, `buildWeeklySummaryHtml` all missing return types
6. **`src/lib/discord-bot.ts`** and **`src/lib/discord-webhook.ts`** — async webhook functions missing `Promise<void>` return types
7. **`src/lib/notifications.ts`** — `createNotification`, `notifyFollowers` missing `Promise<void>`
8. **`src/lib/db.ts`** — `getDb()` and `ensureTable()` missing return types

### Lower priority (React components / hooks — TypeScript infers these well)
9. **`src/lib/utils/game-plan-helpers.tsx`** — React components missing `: JSX.Element` return types
10. **`src/lib/utils/haptics.ts`** — `void` functions, cosmetic only
11. **`src/lib/hooks/useGlobalDisplayPrefs.ts`**, **`src/lib/i18n/index.ts`**, **`src/lib/contexts/VersionDiffContext.tsx`** — hooks and providers missing explicit return types

---

## Summary Counts

| Category | Count |
|----------|-------|
| `any` usages (non-comment, non-test) | 8 |
| Unsound generics (`Record<string, any>` etc.) | 3 (subset of above) |
| `@ts-ignore` / `@ts-nocheck` | 0 |
| Exported functions missing return types | ~20 |
| `tsconfig.json` strict: true | YES |
| `noImplicitAny` active (via strict) | YES |
