# C1 Dead Code Scan — 2026-06-04

Read-only Explore agent — full transcript captured in agent return. Summary recorded here for the .swarm/ index.

## High-confidence dead code

### ConsentGate component — DELETED this run

- **File:** `src/components/providers/ConsentGate.tsx`
- **Symbol:** `ConsentGate` (exported function)
- **Reason:** No imports anywhere in the codebase. Grep returns only the file's own definition. Cookie consent is driven by `CookieBanner` + `src/lib/consent.ts` helpers, not this wrapper.
- **Status:** ✅ Removed in commit `ea68fd2` (swarm: delete orphan ConsentGate component)

## Medium-confidence (deferred)

Type exports in `ExploreFilters.tsx`, `ReportCard.tsx`, `TournamentMode.tsx` that appear unused externally. These may be referenced only by tests or by future external consumers. Skipped this run.

## Heavy npm dependencies — all verified ACTIVELY USED

- `html2canvas-pro` (29 KB) — used in `src/lib/dynamic-imports/html2canvas.ts` for PDF export
- `jspdf` — used in `src/lib/utils/export-report.ts` for PDF generation
- `qrcode` — used in `OTSSheetModal.tsx` and `TeamOverview.tsx`
- `motion` — used in `WhatsNewModal.tsx`, `CreatorProfile.tsx`, `ExploreFilters.tsx`, and others

No removable dependencies this run.

## TODOs / FIXMEs

None found in the codebase.

## Verdict

Codebase is clean. The single orphan (ConsentGate) was deleted. The deferred MEDIUM items need a deeper check before action (might be consumed by tests or by an upcoming feature).
