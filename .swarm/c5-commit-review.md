# C5 Commit Review — last 20 commits on origin/main (29-05-26)

**Window:** `1a30839` → `9c644f5` (mostly nightly-swarm PRs #46/#47/#48/#49, three feature commits, plus the 1a30839 corruption-repair merge).
**Cross-ref:** `.swarm/main-changed-files.md` — files repeatedly touched listed at end.

## Concerning patterns

- **Re-proposed fix loop.** The Linear-webhook patch (`linear-signature` header + env-var rename) was re-applied in PRs #35, #36, #37, #46, #47 and finally squashed in `1a30839`. Merge body says "8 consecutive runs without landing". This is real engineering waste.
- **Pre-existing main corruption.** `1a30839` repaired fused doc/JSX blocks and duplicate imports in `cleanup/route.ts`, `JsonLd.tsx`, `explore/page.tsx`, `tournaments/page.tsx` — files that didn't compile yet had been on `main`. A pre-push `tsc` gate would have caught all four.
- **Silent error-swallowing for webhook health.** Linear/PostHog/Clerk all now return 200 in catch blocks. Good for avoiding auto-disable, bad for observability — none of them log the error first.
- **Legacy fallbacks accumulating.** `LINEAR_WEBHOOK_SIGNING_SECRET ?? LINEAR_WEBHOOK_SECRET` and `linear-signature ?? x-linear-signature` are explicitly TODO'd in commit bodies but no ticket exists.

## Follow-up tickets to file in Backlog

1. **VGC-WEBHOOK-CLEANUP: drop legacy `LINEAR_WEBHOOK_SECRET` + `x-linear-signature` fallbacks** (P2). `src/app/api/webhooks/linear/route.ts:32-41` carries `??` fallbacks every nightly commit body flags as follow-up. Standardise the Vercel env var name and delete both legacy lookups in one PR.

2. **VGC-WEBHOOK-OBSERVABILITY: log before returning 200 from webhook catch blocks** (P1). `linear/route.ts:68-71`, `posthog/route.ts`, `clerk/route.ts` all swallow exceptions silently. Add `console.error` with sanitised context — keeps the auto-disable protection but restores visibility into real bugs.

3. **VGC-NIGHTLY-GUARD: pre-flight diff against `main` in swarm runs** (P1). Five+ nightly PRs re-shipped the same Linear webhook diff. Before opening a PR, the swarm should check whether the proposed change already exists on `main` and skip. Also recommend a mandatory `npx tsc --noEmit` on the resulting branch before push — would have prevented the 4 corrupted files repaired in `1a30839`.

4. **VGC-SAVE-PROBE-ENDPOINT: avoid fetching full saved list to derive one boolean** (P2). `Navbar.tsx` (commit 850e91c) `GET /api/user/saved` then scans `reports[].id` for the current shareId. Adds latency + N×bandwidth on every shared view. Replace with `HEAD /api/user/saved/:shareId` or accept a `?shareId=` filter.

5. **VGC-MIGRATION-DOWN: add rollback for `drop-species-column.sql`** (P3). VGC-218 dropped the column + GIN index `CONCURRENTLY` with no down-migration. If Champions meta later needs the column back, the recreate path is undocumented. Pair every destructive migration with a `.down.sql`.

6. **VGC-DOCK-TELEMETRY-CLEAN: prune analytics events from deleted docks** (P3). `ShareDock` / `FloatingReactionDock` / `useTouchIdleHide` deleted in 850e91c. PostHog dashboards likely still reference `floating_dock_*` events. Audit + delete stale dashboards.

7. **VGC-LINEAR-EVENT-HANDLER: Linear webhook accepts signature then no-ops** (P2). `linear/route.ts:67` returns 200 with no actual event handling for non-`url_verification` types. Either implement the handler (issue→Discord, comment→nudge) or document explicitly that this endpoint exists purely for signature validation.

## Top immediate safe fix (< 1 hour)

**Add `console.error(e)` to the Linear webhook catch block** at `/home/user/VGC-Team-Report/src/app/api/webhooks/linear/route.ts:68-71`. Currently `catch { return NextResponse.json({ ok: true }); }` — swap to `catch (e) { console.error("Linear webhook error:", e); return NextResponse.json({ ok: true }); }`. One-line change, no behaviour shift, regains observability. Same fix applies to `posthog/route.ts` and `clerk/route.ts` if scope allows. Ships in 5 minutes.

## High-conflict-risk files (per main-changed-files.md)

`src/app/api/webhooks/linear/route.ts`, `src/lib/email.ts`, `src/app/api/share/route.ts`, `src/app/api/cleanup/route.ts`, `src/components/seo/JsonLd.tsx`, `src/components/layout/Navbar.tsx`, `src/app/page.tsx`, `src/components/ui/InstallPrompt.tsx` — all touched by 3+ of the last 20 commits. Any new swarm run modifying these should rebase + tsc-check first.
