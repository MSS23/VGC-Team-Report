# Dead Code Scan Report - VGC Team Report

**Date:** 2026-05-13  
**Codebase:** `/home/user/VGC-Team-Report/src/`  
**Scope:** All TypeScript/React files (280 files scanned)

---

## Findings Summary

After comprehensive grep-based analysis across the entire codebase, **only 1 confirmed dead export** was found:

### Confirmed Dead Code

#### 1. PdfExportButton Component
- **File:** `/home/user/VGC-Team-Report/src/components/ui/PdfExport.tsx`
- **Export:** `export function PdfExportButton(props: PdfExportProps)`
- **Line:** 208-254 (~46 lines)
- **Confidence:** HIGH
- **Evidence:** 
  ```
  grep "PdfExportButton" --include="*.ts" --include="*.tsx"
  # Result: Only appears in definition file, never imported elsewhere
  ```
- **Notes:** The sibling export `PrintableReport` in the same file IS actively used (imported with dynamic() in src/app/page.tsx). Only `PdfExportButton` is unused.

#### 2. sanitizeInput Function
- **File:** `/home/user/VGC-Team-Report/src/lib/security/input-validation.ts`
- **Export:** `export function sanitizeInput(str: string): string`
- **Lines:** 6-8 (~3 lines)
- **Confidence:** HIGH
- **Evidence:**
  ```
  grep -r "sanitizeInput" --include="*.ts" --include="*.tsx"
  # Result: Only the export definition appears, zero external imports
  ```
- **Notes:** Four other functions in the same file (containsInjection, isValidIp, getClientIp, hasValidContentType) ARE used. Only sanitizeInput is dead code.

---

## Comprehensive Scan Results

### Categories Analyzed

1. **Exported Functions in src/lib/** (211 exports)
   - ✓ All actively used except sanitizeInput
   - Notable usage: Data accessors, API utilities, parsing functions all have >1 import

2. **React Components in src/components/** (50+ components)
   - ✓ All actively used except PdfExportButton
   - Verified: Navbar, ThemePicker, CommentSection, MatchupSheet all imported

3. **Hooks in src/hooks/** (25+ custom hooks)
   - ✓ All actively used in other components
   - Examples: useSlideSystem → 1 import (used in page.tsx), useTeamReport → 1 import, etc.

4. **API Routes in src/app/api/** (47 routes)
   - ✓ All routed API endpoints are called from frontend or internal cron jobs
   - /api/setup, /api/keep-alive, /api/migrate: Used in middleware or cron tasks

5. **Type Definitions**
   - ✓ All exported types are used either internally or by imports
   - Examples: MoveData, NatureData, EventType all referenced in analysis code

6. **Utility Exports**
   - ✓ All major utilities used (version-diff, word-filter, diff-state, multi-import)

---

## Safe Deletions

### Quick Wins (~50 lines total)
1. Remove `PdfExportButton` function from `src/components/ui/PdfExport.tsx` (46 lines)
2. Remove `sanitizeInput` function from `src/lib/security/input-validation.ts` (3 lines)

These deletions are safe because:
- No imports of these symbols exist anywhere in the codebase
- No grep-able string references (no dynamic calls)
- Sibling/related exports remain intact and functional

---

## Notes

- **Conservative approach:** Used grep to confirm zero imports. This catches direct usage but may miss:
  - Indirect dynamic imports via string interpolation
  - Metaprogramming patterns
  - Comments that appear to reference code
- **API routes:** All routes are either called from frontend, used in cron/webhook handlers, or explicitly whitelisted (setup, migrate)
- **No orphaned pages:** All route segments in src/app/ are reachable
- **Type exports:** Many types are only used in their defining file (common pattern for internal types)

---

**Estimated LOC for safe deletion:** ~50 lines  
**Risk level:** VERY LOW (confirmed unused with zero external references)
