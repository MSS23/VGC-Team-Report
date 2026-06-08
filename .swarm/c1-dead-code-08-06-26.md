# Dead Code Audit — VGC Team Report (C1)

**Date:** 2026-06-08
**Scope:** `src/**`, `scripts/`, `public/`, `package.json` (deps); excludes `.swarm/`, `.planning/`, `docs/`, `cypress/`, `*.test.ts`, recently-changed files (`public/sw.js`, `src/app/globals.css`, `src/app/page.tsx`, `src/components/report/SlideNavControls.tsx`, `src/components/ui/SwipeHint.tsx`, `src/hooks/useHomePage.ts`).
**Method:** per-symbol grep across `src/` plus per-file basename grep for orphan detection. Re-verified prior dead-code findings (most have already been deleted). All dynamic-import sites cross-checked.

---

## Confirmed dead code (safe to delete)

### 1. `DisplayTogglePill` component — fully orphaned file
- **File:** `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx`
- **What it is:** A floating "Display" pill (267-line client component) with a Form (Base / Mega) segmented control popover. Was wired into `useHomePage` / `page.tsx` at some point, but every consumer has been removed.
- **Evidence:**
  ```
  grep -rn "DisplayTogglePill" src/
  ```
  Only matches: the export declaration itself (lines 5, 48, 57 of the file), plus a single comment in `src/lib/hooks/useGlobalDisplayPrefs.ts:9` ("Used by the DisplayTogglePill…"). Zero JSX usage anywhere. Zero import sites. Static-only grep also picked up nothing in `src/`, `public/`, `scripts/`.
  Dynamic-import check: `grep -rn "display/DisplayTogglePill"` → 0 hits.
- **Lines saved:** 267 (entire file)
- **Confidence:** HIGH
- **Recently changed?** No (not in `.swarm/main-changed-files.md`).

### 2. `useGlobalDisplayPrefs` hook — fully orphaned file
- **File:** `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts`
- **What it is:** A 51-line hook that tracks the "first-run pulse" state for `DisplayTogglePill` via localStorage (`vgc.display.pillSeen`).
- **Evidence:**
  ```
  grep -rn "useGlobalDisplayPrefs" src/
  ```
  Only match: the export on line 36 of the file itself. Zero callers. The `vgc.display.pillSeen` localStorage key is also not referenced anywhere else.
- **Lines saved:** 51 (entire file)
- **Confidence:** HIGH — paired with finding #1; the hook exists solely to feed the pill.
- **Recently changed?** No.
- **Caveat:** The directory `src/lib/hooks/` contains only this file. Deleting it leaves an empty directory — should remove the directory too.

### 3. `encodeShareState` — REMOVED in earlier audit, please ignore

Verified that the previously-flagged `encodeShareState` in `src/lib/sharing/url-codec.ts` is **already gone** (file now ends with `decodeShareState`). Same for `pokemonToOpenSheet` (already private), `detectRegulationWithSignals` + `RegulationDetection` (already private), and prior orphans `Badge.tsx` + `useScrollHide.ts` (files deleted).

### 4. `pokemonToShowdown` should be `function`, not `export function` (carried over)
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/export-paste.ts:20`
- Still exported. Only used internally by `teamToShowdown` (line 78) in the same file, and by `src/lib/utils/__tests__/export-paste.test.ts` (tests are not production callers).
- **Lines saved:** 0 (just drop `export` keyword)
- **Confidence:** HIGH

### 5. `replaceSpeciesInBlock` should be `function`, not `export function` (carried over)
- **File:** `/home/user/VGC-Team-Report/src/lib/utils/paste-edit.ts:59`
- Only used internally by `replacePokemonSpecies` (line 97) in the same file. No external imports.
- **Lines saved:** 0 (drop `export`)
- **Confidence:** HIGH

### 6. `isDynamicAllowedOrigin` should be `function`, not `export function` (carried over)
- **File:** `/home/user/VGC-Team-Report/src/lib/security/cors.ts:18`
- Only used internally by `getCorsHeaders` (line 27) and `isAllowedOrigin` (line 41) in the same file.
- **Lines saved:** 0 (drop `export`)
- **Confidence:** HIGH

### 7. `generateCsrfToken` should be `function`, not `export function` (carried over)
- **File:** `/home/user/VGC-Team-Report/src/lib/security/csrf.ts:17`
- Only used internally by `setCsrfCookie` (line 49) in the same file.
- **Lines saved:** 0 (drop `export`)
- **Confidence:** MEDIUM — security-adjacent; leaving exported costs nothing. Low priority.

### 8. `migratePlan` should be `function`, not `export { migratePlan }` (new)
- **File:** `/home/user/VGC-Team-Report/src/hooks/useMatchupPlans.ts:93`
  - Declared on line 51 as `function migratePlan(...)`, then re-exported on line 93 via `export { migratePlan };`.
- **Evidence:**
  ```
  grep -rn "migratePlan" src/
  ```
  Production callers outside this file: 0. Internal callers: lines 126 (`parsed.map(migratePlan)`) and 328 (`setPlans(newPlans.map(migratePlan))`). A *different* `migratePlan` exists in `src/lib/utils/normalize-report.ts` but that one is already private and unrelated.
- **Lines saved:** 1 (delete the `export { migratePlan };` line)
- **Confidence:** HIGH

---

## Suspicious but uncertain

### S1. `validateMegaCoverage` lives in a "private" file but is exported
- **File:** `/home/user/VGC-Team-Report/src/lib/data/__validate-mega-coverage.ts`
- The double-underscore filename signals "private/internal". It's referenced exactly once: via dynamic `import("@/lib/data/__validate-mega-coverage")` in `src/instrumentation.ts:14`. **NOT dead** — instrumentation guards prod data drift. Listed here purely so future audits don't re-flag it.

### S2. `useGlobalDisplayPrefs` *might* be wired back later
- Plans in `.planning/phases/15-mega-evolution-support-toggle-auto-detect-showdown-data-m-a-regulation-threats-serebii-legal-list/15-01-PLAN.md` discuss mega/share state but do not reference `DisplayTogglePill` by name in any current/active plan I could find. **Verdict:** delete; it's recoverable from git if a future ticket revives the feature.

### S3. i18n translation files appear orphan by basename-grep
- Files `src/lib/i18n/translations/{fr,it,es,ja,ko,zh}.ts` show 0 importers in static `from "..."` grep, but they are loaded via dynamic `import("./translations/fr")` inside `src/lib/i18n/index.ts`. Confirmed live. **NOT dead** — listed only so future audits don't re-flag.

### S4. `OffensiveCoverageChart`, `DefensiveCoverageChart`, `InlinePokemonEditor`, `CommentSection`, `EditChangelog`, `CollaboratorPanel`, `DoubleTapLikeOverlay`, `DiffNavigator`, `OTSSheetModal`, `ShareModal`, `WhatsNewModal`
- All show 0 static `from ".../X"` importers. Confirmed live via `dynamic(() => import("..."))` in `app/page.tsx` (or `PokemonCard.tsx`, `PasteInput.tsx`, `TeamReport.tsx`). **NOT dead** — re-flagged here only to short-circuit future basename-grep audits.

### S5. `migratePlan` in `normalize-report.ts` (already private)
- Confirmed not exported. Internal helper only. **NOT dead** — listed because prior audits noted it.

### S6. Sentry config files at repo root
- `sentry.client.config.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts` have no in-`src` importers, but they're auto-loaded by `@sentry/nextjs` via convention. **NOT dead.**

---

## Top 5 quick wins

Ranked by `(lines removed) × confidence`:

| Rank | Item | Lines | Confidence | Action |
|---|---|---|---|---|
| 1 | Delete `src/components/display/DisplayTogglePill.tsx` | 267 | HIGH | `rm` the file; then `rmdir src/components/display` (empty after removal) |
| 2 | Delete `src/lib/hooks/useGlobalDisplayPrefs.ts` | 51 | HIGH | `rm` the file; then `rmdir src/lib/hooks` (empty after removal) — note: this is `lib/hooks/`, not `src/hooks/` |
| 3 | Drop `export` keyword on `pokemonToShowdown` in `src/lib/utils/export-paste.ts:20` | 0 file lines, but cuts public-API surface; test must switch to `teamToShowdown([mon])` or be removed | HIGH | One-token change, update test |
| 4 | Drop `export` on `replaceSpeciesInBlock`, `isDynamicAllowedOrigin`, `migratePlan` (3 keywords) | 1 deleted re-export line in `useMatchupPlans.ts` | HIGH | Three trivial diffs in three files |
| 5 | Drop `export` on `generateCsrfToken` (csrf.ts:17) | 0 | MEDIUM | Optional / security-adjacent — safe but low value |

**Combined deletion impact:** ~319 lines of source code removed, 2 whole files removed, 2 empty directories cleaned up, plus 5 functions de-exported (≈ 5 public API symbols off the surface).

---

## Search commands used (reproducibility)

```bash
# Per-symbol production usage
grep -rE "\b<SYMBOL>\b" src/ --include="*.ts" --include="*.tsx"

# Orphan component/file detection
for f in $(find src/components -type f \( -name "*.ts" -o -name "*.tsx" \)); do
  base=$(basename "$f" | sed 's/\.[^.]*$//')
  count=$(grep -rn "from.*['\"].*${base}['\"]" src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "^${f}:" | wc -l)
  echo "$count $f"
done | sort -n

# Dynamic-import audit for orphan-looking files
grep -rn "display/DisplayTogglePill\|useGlobalDisplayPrefs" src/

# npm dependency usage
for dep in <each-package>; do
  grep -rE "from\s+['\"]${dep}(/|['\"])" src/ ; grep -rE "import\(['\"]${dep}" src/
done
```

All commands executed from `/home/user/VGC-Team-Report/`.
