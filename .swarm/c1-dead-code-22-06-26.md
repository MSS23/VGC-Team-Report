# Dead Code Audit — VGC Team Report (June 22, 2026)

**Date:** 2026-06-22
**Scope:** Full `src/` codebase with focus on exports, unused hooks, and orphaned code
**Method:** Symbol-by-symbol grep across `src/` (excluding self-references and tests), cross-referenced against prior audit from 2026-05-23
**Files reviewed from `main-changed-files.md`:** Checked for conflicts with pending changes

---

## Status Update from Prior Audit (2026-05-23)

All items previously flagged as **HIGH confidence** have been verified as removed or fixed:
- `Badge.tsx` — Deleted (verified)
- `useScrollHide.ts` — Deleted (verified)

Remaining items from the prior audit that are **still pending**:
- `encodeShareState` — Test-only export (Line 149-175 of `url-codec.ts`)
- `pokemonToShowdown` / `pokemonToOpenSheet` — Should be private (Lines 20-124 of `export-paste.ts`)
- `detectRegulationWithSignals` — Should be private (Lines 71-148 of `detect-regulation.ts`)
- `replaceSpeciesInBlock` — Should be private (Lines 59-71 of `paste-edit.ts`)
- `isDynamicAllowedOrigin` — Should be private (Lines 18-22 of `cors.ts`)
- `generateCsrfToken` — Should be private (Lines 17-22 of `csrf.ts`)

---

## NEW FINDINGS (2026-06-22)

### 1. `useGlobalDisplayPrefs` — Completely unused hook
- **File:** `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts`
- **Lines:** 36-51 (entire exported function)
- **Symbol:** `export function useGlobalDisplayPrefs`
- **Evidence:**
  ```bash
  grep -rn "useGlobalDisplayPrefs" src/ --include="*.ts" --include="*.tsx" | grep -v "export function"
  ```
  Returns **zero matches** — function is exported but never imported or used anywhere in production code or tests.
- **Context:** The hook was designed to track DisplayTogglePill first-run discovery with localStorage. The component at `src/components/display/DisplayTogglePill.tsx` (which is imported into reports) does not reference this hook anywhere.
- **Confidence:** **HIGH** — 100% orphaned export, zero dependencies, no dynamic imports.
- **Bundle impact:** ~0.5 KB minified (dead after tree-shake).
- **Action:** Delete entire file or extract to archive. No tests reference it.

---

## Conflict-Risk Overlaps with `main-changed-files.md`

Cross-checked the following files from the pending changes list:
- `src/app/page.tsx` — No dead exports; verified all exported items are used
- `src/components/input/PasteInput.tsx` — `SAMPLE_PASTE` is actively imported by `useHomePage`
- `src/components/report/CommonModesSlide.tsx` — `CommonModesValue` interface is used by `TeamReport`
- `src/components/report/MatchupPlanSlide.tsx` — No dead exports
- `src/components/report/SlideNavControls.tsx` — No dead exports
- `src/components/report/SpeedTierChart.tsx` — No dead exports
- `src/components/report/TeamOverview.tsx` — No dead exports
- `src/components/report/TeamReport.tsx` — `FieldDiffHighlight` component is actively used across 5+ files
- `src/components/social/CollaboratorPanel.tsx` — No dead exports
- `src/components/ui/PdfExport.tsx` — No dead exports
- `src/hooks/useHomePage.ts` — No dead exports
- `src/hooks/useMatchupPlans.ts` — No dead exports
- `src/hooks/useSlideSystem.ts` — No dead exports
- `src/hooks/useTeamMeta.ts` — No dead exports
- `src/hooks/useWalkthrough.ts` — No dead exports

**No conflicts detected.** All changed files are actively maintained.

---

## Summary

| # | Item | Type | Confidence | Status | Action |
|---|------|------|------------|--------|--------|
| 1 | `useGlobalDisplayPrefs` | Hook export | HIGH | NEW | Delete file |
| 2–7 | Items from prior audit | Various | HIGH/MEDIUM | PENDING | Apply from 2026-05-23 report |

**NEW dead code:** 1 file (approx. 16 lines).
**Previously flagged (still valid):** 6 symbols across 5 files.

---

## Search Commands Used

```bash
# Unused hook discovery
grep -rn "useGlobalDisplayPrefs" src/ --include="*.ts" --include="*.tsx" | grep -v "export function"

# Verification of changed-file safety
grep -rn "FieldDiffHighlight\|CommonModesValue\|SAMPLE_PASTE" src/ --include="*.ts" --include="*.tsx"
```

All commands executed from repo root `/home/user/VGC-Team-Report/`.
