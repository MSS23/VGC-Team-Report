# Code Review — Last 20 Commits (main)

**Date:** 2026-05-07  
**Range:** `main~20..main` (c247fc1 → e5b4bfa)  
**Reviewer:** Claude (automated audit)

---

## Commit Overview

| SHA | Message | Files Changed | Rating |
|-----|---------|--------------|--------|
| e5b4bfa | docs(changelog): v5.9 entry | 1 | Clean |
| ecf9e00 | fix(mega): toggle requires Reg M-A AND Mega Stone | 1 | Clean |
| 3ec0e3d | fix(pokemon-card): always show flip toggle | 1 | Clean |
| e514a8e | fix(analysis): suppress Megas outside Reg M-A | 1 | Clean |
| a2a8cc2 | fix(explore): popular/views feed pagination + fork credits | 3 | Clean |
| 50f3426 | docs(changelog): v5.8 entry | 1 | Clean |
| f701a5c | fix(champions-dex): align base species with Serebii | 1 | Clean |
| 46662e0 | VGC-140/141/142: share viewing + duplicate + team card + publishing | 11 | Large, reviewed |
| 7dd30b4 | VGC-143: rental code filter + Rental badge | 3 | Clean |
| cd8984d | VGC-146: Zod schema validation on share/cache reads | 2 | Good |
| fa2663b | VGC-144: derive CHAMPIONS_DEX megas from canonical list | 1 | Clean |
| 4bb854b | VGC-145: delete dead components/lib/exports | 9 | Clean |
| 506d79b | swarm: nightly improvements 07-05-26 (#14) | 41 | Large, see below |
| ac12688 | Merge: integrate VGC-69/-75/-95/-100/-106/-111/-135/-138/-139 | 9 | Merge |
| ddaca39 | feat(report): SP-only display in Reg M-A | ~10 | Clean |
| 6b8176a | VGC-37: OTS sheet + QR code + PNG download (#9) | 3 | Reviewed |
| bdc6637 | VGC-75: Mega vs base stat delta strip (#10) | ~5 | Clean |
| bdc6637 | VGC-69: one-click try — sample report on landing (#8) | ~5 | Clean |
| c247fc1 | VGC-95: Cypress E2E tests for explore + champions (#11) | 2 | Good |

---

## Findings

### 1. Known Failing Tests Never Fixed — Acknowledged Tech Debt (HIGH)

**Commit:** `46662e0` (VGC-140/141/142)  
**File:** `src/hooks/__tests__/useExploreUrlSync.test.ts`

The commit message explicitly notes:
> "Existing 3 useExploreUrlSync test failures are pre-existing (default sort changed to 'popular' in fc8b08d era; tests were never updated) and reproduce on origin/main."

Confirmed: `DEFAULTS.sort` in `useExploreUrlSync.ts` is `"popular"` (line 38), but the test at line 8 asserts `toBe("newest")`. Across 6 test cases, all "default sort" assertions are stale. Beyond the sort mismatch, running any tests with the project's Jest configuration fails entirely because test files use `vitest` imports (`import { describe, it, expect } from "vitest"`) while the runner invoked by most tooling is Jest — `vitest` is not installed in `node_modules` (only listed as a devDependency). This means `npm test` silently reports 14 failed suites with zero tests run — all green status checks are vacuous.

**Impact:** CI test gate is broken across the entire test suite. Any commit that breaks runtime behaviour would not be caught.

**Recommended ticket:** Fix `useExploreUrlSync` test defaults to match `"popular"`, install `vitest` properly, and verify `npm test` produces green output before the next push.

---

### 2. `opengraph-image.tsx` Duplicates `sprite-slug.ts` Logic — Documented But Untracked (MEDIUM)

**Commit:** `506d79b` (swarm nightly)  
**File:** `src/app/s/[id]/opengraph-image.tsx` lines 8–45

A ~40-entry `SLUG_MAP` constant and `resolveSlug` function are copied verbatim from `src/lib/utils/sprite-slug.ts` with an inline comment:
> "Mirrors the slug logic from src/lib/utils/sprite-slug.ts — duplicated here because edge runtime cannot import from @/lib."

The rationale is valid (edge runtime cannot pull in Node.js-linked modules), but the consequence is that any new Pokemon added to `sprite-slug.ts` must also be added here manually or OG images will silently generate broken sprite URLs. This already caused the `opengraph-image.tsx` to be reverted once in the previous commit window (per the prior review finding on `221da19`).

`src/app/api/team-graphic/route.tsx` correctly imports `resolveSlug` from `@/lib/utils/sprite-slug` because it is a regular Node.js API route — the divergence shows the edge runtime constraint is specific to the OG image file.

**Recommended ticket:** Extract the SLUG_MAP into a separate file with no Node imports (`src/lib/data/sprite-slug-map.ts`), importable from both the edge OG handler and the regular route, eliminating the manual mirror.

---

### 3. `VGC-140/141/142` Bundles Three Tickets in One Commit (MEDIUM)

**Commit:** `46662e0` — 11 files, 633 insertions / 19 deletions

The commit combines three independent features (Duplicate CTA, Spotify-Wrapped PNG card, tiered EV/IV/Nature publishing) in one commit. The commit message acknowledges this:
> "These three changes all reshape the public-share experience and share the same plumbing."

Concerns:
- **No rollback granularity.** If the `redact-paste.ts` tiered publishing logic introduces a regression, reverting `46662e0` also removes the team card download feature and the duplicate CTA — two unrelated features go with it.
- **`redact-paste.ts` has no tests.** The module performs line-by-line Showdown paste surgery (stripping EVs, IVs, Nature, Item on a per-field basis). This is exactly the kind of string-manipulation logic that benefits from unit tests covering edge cases (multi-form Pokemon, nickname `(F)` gender markers, species with `@` in the name). No test file exists.
- **`team-graphic/route.tsx` reaches 526 lines.** The new `isWrapped` branch adds ~280 lines of inline JSX to an already large route file. This is a good candidate for extraction into a dedicated `WrappedCard.tsx` Satori component.

**Recommended ticket:** Add `redact-paste.test.ts` covering all four Showdown line formats; extract the wrapped-card JSX from `route.tsx`.

---

### 4. `swarm` Commit Mixes Research Docs with Production Code Changes (MEDIUM)

**Commit:** `506d79b` — 41 files, 4588 insertions / 72 deletions

The swarm nightly commit bundles:
- 7 `.swarm/` research markdown files (not part of the app)
- Production code changes: `src/app/s/[id]/opengraph-image.tsx` (505 lines, new), `src/components/seo/JsonLd.tsx` (71 lines, new), `src/app/api/cleanup/route.ts`, `src/app/api/discord/route.ts`, `public/manifest.json`, and 9 other app files

Mixing research artifacts with production changes makes it impossible to bisect if the OG image or JSON-LD output introduces a regression. The `.swarm/` directory is read-only research output — it should be committed separately or excluded from production change commits.

**No immediate action needed**, but the pattern should be avoided going forward. Swarm research output and app code changes belong in separate commits.

---

### 5. `PokemonDetailSlide.tsx` at 962 Lines — Compound Component Creep (LOW-MEDIUM)

**File:** `src/components/report/PokemonDetailSlide.tsx` (962 lines after `ac12688` + `bdc6637` additions)

This file has grown across multiple tickets (VGC-75 added the stat delta strip, the mega fixes added the Mega toggle path, the SP-only regulation work added additional conditional branches). At 962 lines it is the largest component in the codebase and handles:
- Stat bar rendering
- Mega vs base toggle with regulation gating
- Speed tier comparison callout
- Stat delta strip (new in VGC-75)
- Move detail panel
- Type badge rendering

There are no `TODO` or `FIXME` comments left behind, and there are no `console.log` statements — the file is clean. However the complexity is high enough that future changes have a meaningful chance of introducing regressions.

**Recommended ticket:** Split `PokemonDetailSlide` into sub-components: `StatBarsPanel`, `MegaToggleHeader`, `MovesPanel`. Reduces per-component line count and makes individual sections independently testable.

---

### 6. `useExploreUrlSync` Test Default Mismatch Is Also a Semantic Bug (LOW)

**File:** `src/hooks/useExploreUrlSync.ts` line 82

```typescript
if (filters.sort !== "popular") params.set("sort", filters.sort);
```

This means `sort=popular` is never written to the URL (treated as the canonical default). But the sort default was changed to `"popular"` at some point — previously `"newest"` was the default. If a user bookmarks a URL with no `sort` param, they expect "popular" results, and that is what they get. However, any external link with an explicit `?sort=popular` query string will also work identically. The asymmetry is harmless but the test file's `"newest"` assertions are a reliable signal that the URL serialization contract changed without a corresponding doc update or test fix.

---

## No Console Statements or Commented-Out Code Found

A full grep across `src/app/`, `src/components/`, `src/hooks/`, and `src/lib/` found:
- **No `console.log` or `console.warn` statements** (only `console.error` in API catch blocks — appropriate)
- **No `TODO` or `FIXME` comments** in source files
- **No commented-out code blocks** in recently modified files

Error handling is consistent across API routes: every route wraps handlers in try/catch and returns structured `NextResponse.json({ error: "..." }, { status: 500 })`. The pattern is uniform.

---

## Churn Summary

| File cluster | Commits touching it |
|---|---|
| `PokemonCard.tsx` / Mega toggle logic | 4 (ecf9e00, 3ec0e3d, e514a8e, ac12688) |
| `champions-dex.ts` / Mega data | 3 (f701a5c, fa2663b, 506d79b) |
| Share/OG pipeline | 3 (46662e0, cd8984d, 506d79b) |
| Explore filters | 2 (a2a8cc2, 7dd30b4) |

---

## Priority Follow-Up Tickets

| Priority | Title |
|---|---|
| P1 | Fix vitest installation + update useExploreUrlSync test defaults to "popular" |
| P1 | Add `redact-paste.test.ts` covering all four Showdown paste line formats |
| P2 | Extract `SLUG_MAP` into `src/lib/data/sprite-slug-map.ts` — eliminate OG image duplication |
| P2 | Split `PokemonDetailSlide.tsx` (962 lines) into StatBarsPanel + MegaToggleHeader + MovesPanel |
| P3 | Extract wrapped-card JSX from `team-graphic/route.tsx` into a `WrappedCard.tsx` Satori component |
| P3 | Separate swarm research commits from production app code commits going forward |
