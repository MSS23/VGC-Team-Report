# TypeScript Strictness Audit — 2026-05-31

**Branch:** swarm-nightly-2026-05-31 (cut from main 1a30839)
**Prior audit:** `.swarm/c2-typescript-22-05-26.md`
**Status:** 10 NEW implicit-any parameter violations + 1 double-cast pattern. All low-to-medium severity. No regressions to prior fixes.

## Executive summary

Codebase maintains strong TS strictness overall. No new explicit `: any`, no new `as any`, no new `@ts-ignore`. Prior fixes to `db.ts` catch handler, `useAutoDraft.ts` analysis type, and `migrate/route.ts` body type all confirmed in place. The new finds are all implicit-any parameter types (TS7006) in recently-changed files — mostly trivial annotations.

## Top 5 P0/P1 findings

### 1. Clerk webhook double-cast — P1
- File: `src/app/api/webhooks/clerk/route.ts:46`
- Code: `const data = event.data as unknown as ClerkUserCreatedData;`
- Issue: `as unknown as X` defeats discriminated-union narrowing; webhook input not validated at runtime
- Severity: P1 (type bypass in security boundary)
- Proposal: Replace with Zod `safeParse()` or use proper Clerk SDK type after a type guard
- Effort: Small
- recently_changed: Yes

### 2. User search implicit-any — P1
- File: `src/app/api/user/search/route.ts:27-28`
- Code: `.filter((u) => u.id !== userId).map((u) => ({...}))`
- Issue: `u` implicitly `any`
- Severity: P1 (shape changes could slip through)
- Proposal: `(u: typeof result.data[number]) =>` or extract ClerkUser type
- Effort: Trivial
- recently_changed: Yes

### 3. page.tsx callback implicit-any — P2
- File: `src/app/page.tsx:1599`
- Code: `onToggleComments={(v) => { ... }}`
- Proposal: `(v: boolean) =>`
- Effort: Trivial
- recently_changed: Yes (high conflict risk — 1881 LOC magnet)

### 4. export-report map implicit-any — P2
- File: `src/lib/utils/export-report.ts:62`
- Code: `.map((v, i) => { ... })`
- Proposal: `(v: T, i: number) =>`
- Effort: Trivial
- recently_changed: Yes

### 5. cleanup route map implicit-any — P2
- File: `src/app/api/cleanup/route.ts:33`
- Code: `.map((r) => { ... })`
- Proposal: Add row type annotation
- Effort: Trivial
- recently_changed: Yes

## Full table

| # | File | Line(s) | Issue | Severity | Effort | recently_changed |
|---|------|---------|-------|----------|--------|------------------|
| 1 | api/webhooks/clerk/route.ts | 46 | Double-cast `as unknown as X` | P1 | Small | Yes |
| 2 | api/user/search/route.ts | 27-28 | Implicit-any params | P1 | Trivial | Yes |
| 3 | app/page.tsx | 1599 | Implicit-any callback | P2 | Trivial | Yes |
| 4 | lib/utils/export-report.ts | 62 | Implicit-any map params | P2 | Trivial | Yes |
| 5 | api/cleanup/route.ts | 33 | Implicit-any param | P2 | Trivial | Yes |
| 6 | components/report/PokemonCard.tsx | 552 | Implicit-any callback | P2 | Trivial | Yes |
| 7 | components/providers/PostHogProvider.tsx | 123, 144 | Implicit-any params | P2 | Trivial | No |
| 8 | api/changelog/[shareId]/route.ts | 62 | `catch (e)` implicit | P2 | Trivial | Yes |
| 9 | api/comments/[shareId]/route.ts | 58 | Reduce callback implicit | P2 | Trivial | Yes |
| 10 | api/creator/[name]/route.ts | 58, 64, 94 | Reduce/map params implicit | P2 | Small | Yes |

## Recommended Wave 2 action

Single sweep commit "VGC-TS: fix implicit-any in recently-changed files" — items 2, 3, 4, 5, 6, 8, 9, 10 are all trivial annotations. Items 1 (Clerk double-cast) and 7 (PostHog types) deserve separate effort.

Effort: ~15 minutes for all trivial items.
