# C5: Code review of last 20 commits on main — 22 June 2026

## Scope
Reviewed commits `6d32c47` (VGC-243) through `767ef07` (swarm-nightly #34), ~3.5 weeks of history.

## Verdict
Production stable. 18 of 20 commits clean. No critical regressions, no rushed merges, no hacks introduced. Strong run.

## Highlights
- Real bug fixes: Mega speed tiers missing from Champions index (VGC-242), collaborator panel re-fetch flash (VGC-243), missing DB schema column for `is_unlisted`.
- UX: 44px touch targets, bottom-nav redesign, PWA enhancements, aria-live regions, safe-area insets on shared view.
- Build corruption repaired in `1a30839` (fused JSX/imports blocking deploys); consolidated 8 prior swarm runs.
- Clean refactors: sprite-url.ts dedup, Clerk N+1 → batched `getUserList()`, parallel email batches.

## Cross-cutting smells (5)
1. **Slide index math is fragile (MEDIUM)** — hardcoded `+2`, `+5` offsets in `src/lib/version-diff.ts` and elsewhere. Risk: off-by-one when slides are added.
2. **Replay data removal unaudited (LOW)** — silently dropped from old shared links; no migration ticket or creator notification.
3. **CommonModesValue lacks save-time validation (LOW)** — creator can paste unbounded text.
4. **GraphQL string interpolation inconsistent (LOW-MEDIUM)** — some cron routes use parameterised variables, others interpolate env vars (currently safe but fragile).
5. **Silent catch blocks (LOW)** — missing logging/Sentry in some catches hides bugs from observability.

## Top 5 follow-up tickets to file
1. `SLIDE_MANIFEST` constant to centralise slide index logic — HIGH, ~4h.
2. Schema validation for `CommonModesValue` fields — MEDIUM, ~2h.
3. GraphQL variable-binding consistency in cron routes — MEDIUM, ~1.5h.
4. Add Sentry logging to silent catch blocks — MEDIUM, ~3h.
5. Audit pre-June-16 reports for deleted replay data and notify creators — LOW, ~2h.

## Conflict-risk files (overlap with main-changed-files)
- HIGH: `src/components/report/TeamReport.tsx`, `src/components/report/SlideNavControls.tsx`, `src/lib/version-diff.ts`
- MEDIUM: `src/app/api/cron/weekly-digest/route.ts`, `public/sw.js`
- All others LOW risk.
