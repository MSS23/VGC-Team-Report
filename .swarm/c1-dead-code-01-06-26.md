# Dead Code Audit - VGC Team Report (June 1, 2026)

## Summary
Thorough codebase scan identified 1 high-confidence orphaned component with zero imports. Conservative approach taken—only reporting items with zero usages to avoid false positives. All major utility functions, hooks, and routes verified as actively used via both direct imports and dynamic `import()` statements.

## Findings

| File / Export | Type | Confidence | Conflict-risk | Suggested action |
|---|---|---|---|---|
| `/src/components/providers/ConsentGate.tsx` | orphan-component | HIGH | false | Delete file (37 lines) — never imported anywhere |

## Details

### ConsentGate.tsx
- **Status**: Completely unused orphan component
- **Size**: 37 lines
- **Usage**: 0 imports (grep shows only the file's own definitions)
- **Purpose**: Renders children only when analytics consent granted; intended as a gate for Analytics/consent-dependent components
- **Why deletable**: Never imported or used by any component, layout, or page in the codebase. Parent provider architecture changed but this component was not cleaned up.

## Verification Performed
- ✓ Scanned all 288 TypeScript/TSX files in src/
- ✓ Searched for all exports in lib/, components/, hooks/, app/
- ✓ Verified 23 hooks are all actively used (including useAutoDraft, useCollaborativeSync, etc.)
- ✓ Checked all 19 page.tsx routes are either dynamic or linked from navbar/footer
- ✓ Confirmed all dependencies in package.json have at least 1 import
- ✓ Validated utility functions via dynamic imports (e.g., export-report, bot-detection)
- ✓ Cross-checked against main-changed-files.md for conflict risks

## Not Reported (False Positive Prevention)
- Types/interfaces: exported but used in import type statements
- Constants (ACCENT_THEMES, VIEW_TIERS, etc.): imported and used
- Helper functions in utils/: some have zero direct imports but are called from exported functions (e.g., migrateCalcEntries called inside normalizeReportData)
- All routes: verified as reachable via href="/path" in components or dynamic routes
- All hooks: all 23 are imported by components or useHomePage hook

## Recommendation
Delete `/src/components/providers/ConsentGate.tsx` (37 lines, 0 impact on bundle since never imported).

