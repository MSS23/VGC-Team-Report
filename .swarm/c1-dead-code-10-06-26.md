# C1: Dead Code Audit — Run 2026-06-10

## Top 5 Highest-Confidence Removals

### 1. ConsentGate component (orphan)
**File:** `src/components/providers/ConsentGate.tsx:19`
**Confirmation:** Zero imports; grep "ConsentGate" returns only definition.
**Risk:** low
**Notes:** Fully functional component with no external imports. ~37 lines safe to remove.

### 2. DisplayTogglePill component (orphan)
**File:** `src/components/display/DisplayTogglePill.tsx:48`
**Confirmation:** Zero imports.
**Risk:** low
**Notes:** Well-implemented 267-line component never integrated. Safe removal.

### 3. replaceSpeciesInBlock (internal-only export)
**File:** `src/lib/utils/paste-edit.ts:59`
**Confirmation:** Only used internally by replaceSpeciesInPaste (same file).
**Risk:** low
**Notes:** De-export — don't delete.

### 4. migrateCalcEntries (internal-only export)
**File:** `src/lib/utils/normalize-report.ts:10`
**Confirmation:** Only used internally by normalizeReportData (same file).
**Risk:** low
**Notes:** De-export.

### 5. Type-only exports (cosmetic cleanup)
**Files:**
- `src/lib/data/moves.ts:3-10` — MoveCategory, MoveFlag, MoveData
- `src/lib/data/natures.ts:3` — NatureData
- `src/lib/notifications.ts:3` — NotificationType
- `src/lib/accent-themes.ts:3` — AccentTheme (not exported but worth verifying)
**Confirmation:** All types only used internally.
**Risk:** medium (types may be intended public API)
**Notes:** Safer to leave types in place unless certain. Code-cleaning quick win only.

## npm Dependencies
All dependencies appear used (`html2canvas-pro` via lazy import, `motion` in WhatsNewModal/CreatorProfile, `qrcode` dynamically imported, etc.). No deletable deps identified.

## Conflict-Risk Check
None of the top 5 are in `.swarm/main-changed-files.md` (which lists public/sw.js, src/app/globals.css, src/app/page.tsx, src/components/report/SlideNavControls.tsx, src/components/ui/SwipeHint.tsx, src/hooks/useHomePage.ts).
