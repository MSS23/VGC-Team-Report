# C5 — Commit Review (last 20 commits on origin/main)

Run date: 2026-06-09
Reviewer: C5 (overnight swarm)
Range: `git log origin/main -20` → 8eb39cc..8021723
HEAD on origin/main: `8eb39cc Redesign report bottom nav: segmented section tabs + cleanup + PWA`

Conflict-risk files explicitly skipped: `public/sw.js`, `src/app/globals.css`, `src/app/page.tsx`, `src/components/report/SlideNavControls.tsx`, `src/components/ui/SwipeHint.tsx`, `src/hooks/useHomePage.ts`.

No `TODO`/`FIXME`/`XXX`/`HACK` comments found in `src/`.

---

## Findings

### 1. Dead code: `DisplayTogglePill` + `useGlobalDisplayPrefs` orphaned by 8eb39cc

- **Commit**: 8eb39cc (the bottom-nav redesign)
- **Files**:
  - `/home/user/VGC-Team-Report/src/components/display/DisplayTogglePill.tsx`
  - `/home/user/VGC-Team-Report/src/lib/hooks/useGlobalDisplayPrefs.ts`
- **Issue**: 8eb39cc removed the only call site (page.tsx) for `DisplayTogglePill` and `useGlobalDisplayPrefs` (Mega toggle moved into the bottom-nav overflow sheet). `grep -r` finds zero importers anywhere in `src/` except the files that define them. The commit message even calls this out (`Remove the standing DisplayTogglePill floating dock from the report`) but the files were not deleted.
- **Fix**: `git rm src/components/display/DisplayTogglePill.tsx src/lib/hooks/useGlobalDisplayPrefs.ts`; check that the `src/components/display/` directory isn't left empty and remove if so. Run `npx tsc --noEmit && npm run build`.
- **Scope**: Tiny. Two file deletions, build verification. ~5 min.
- **Risk**: None — verified zero remaining importers in the workspace.

---

### 2. Dead unused constants in `ExploreFilters.tsx`

- **Commit**: 484fa50 (swarm 25-05-26, "Wire ExploreFilters CATEGORIES/SORT_OPTIONS/PLACEMENTS through i18n translation keys")
- **File**: `/home/user/VGC-Team-Report/src/components/explore/ExploreFilters.tsx`
- **Lines**: 62-67 (`CATEGORY_I18N`), 70-75 (`SORT_I18N`), 78-83 (`PLACEMENT_I18N`)
- **Issue**: The refactor added three i18n-key map constants alongside the existing `catLabel`/`sortLabel`/`placementLabel` maps that are built inside the component. `CATEGORY_I18N`/`SORT_I18N`/`PLACEMENT_I18N` are never referenced — only declared. Net result: two parallel patterns for the same translation lookup, one of which is unused. `grep` confirms zero references.
- **Fix**: Delete the three orphan constants. (Or, for consistency, refactor `catLabel`/`sortLabel`/`placementLabel` to read from them — but that's a wider change. For tonight, just delete.)
- **Scope**: Trivial — delete ~22 lines from one file. ~3 min.

---

### 3. Linear webhook `catch` block swallows errors without telemetry

- **Commit**: 1d6c3de (swarm 26-05-26 — "harden Linear webhook" rewrite)
- **File**: `/home/user/VGC-Team-Report/src/app/api/webhooks/linear/route.ts`
- **Lines**: 68-71
  ```ts
  } catch {
    // Return 200 so Linear does not auto-disable the webhook on a transient error.
    return NextResponse.json({ ok: true });
  }
  ```
- **Issue**: The `catch` binding is omitted, so any JSON.parse failure / unexpected throw downstream returns 200 with zero telemetry. The previous-run audit logs (.swarm/c5-commit-review-23-05-26.md and 22-05-26.md) already flag this pattern; the historical reason the Linear webhook went silently broken for weeks was an identical bare `catch`. There IS a fix on a parallel branch (commit 10d2740 on swarm-nightly-2026-06-09), but it has NOT been merged to origin/main yet.
- **Fix**: Add `(e)` binding and `console.error("Linear webhook handler error:", e)` before the 200 return. Same pattern as `webhooks/clerk/route.ts` line 69 and `webhooks/posthog/route.ts` line 307.
- **Scope**: 2 lines. ~2 min. Verify the same pattern doesn't recur elsewhere.
- **Risk**: None — log-only change.

---

### 4. Inconsistent webhook error semantics (200 + ok:false with no status)

- **Commit**: 1d6c3de (swarm 26-05-26)
- **Files**:
  - `/home/user/VGC-Team-Report/src/app/api/webhooks/clerk/route.ts` line 73
    ```ts
    return NextResponse.json({ ok: false, error: "handler_error" }, { status: 200 });
    ```
  - `/home/user/VGC-Team-Report/src/app/api/webhooks/posthog/route.ts` lines 221, 255, 266, 310
- **Issue**: Three webhook handlers now return 200 on internal failure to avoid platform-side auto-disable. Reasonable, but they differ in shape — `clerk` and `posthog` use `{ status: 200 }` explicitly with `ok:false`, while `linear` returns `{ ok: true }` (silently dropping the failure flag). A consistent shape (`{ ok: false, error: <code> }, { status: 200 }`) across all three would make Vercel log filtering and downstream observability uniform.
- **Fix**: Make `linear/route.ts` line 70 return `{ ok: false, error: "internal" }` to match. Pairs naturally with finding #3.
- **Scope**: 1 line edit. ~2 min.

---

### 5. `weekly-digest` send-loop swallows individual email errors

- **Commit**: 767ef07 (swarm 20-05-26, weekly-digest engagement-stats rewrite)
- **File**: `/home/user/VGC-Team-Report/src/app/api/cron/weekly-digest/route.ts`
- **Line**: 366
  ```ts
  const results = await Promise.all(chunk.map((job) => sendEmail(job).catch(() => null)));
  ```
- **Issue**: Per-recipient send failures are silently mapped to `null` and counted as an error, but the actual exception is never logged. If Resend starts returning 4xx for a specific recipient (bounce, blocklist, malformed address) we lose all telemetry — `errors++` goes up but root cause is invisible. The same loop logs preparation errors with `console.error` at line 357, so the pattern is inconsistent within the same function.
- **Fix**: Replace `.catch(() => null)` with `.catch((e) => { console.error("[weekly-digest] sendEmail failed:", e); return null; })`. Keeps return-shape compatibility, restores observability.
- **Scope**: 1 line change. ~2 min.

---

### 6. PostHog webhook does not check `linearRawRes.ok` before `.json()`

- **Commit**: 1d6c3de (swarm 26-05-26 / earlier — pattern predates window but `force-dynamic` change touched the file)
- **File**: `/home/user/VGC-Team-Report/src/app/api/webhooks/posthog/route.ts`
- **Line**: 262
  ```ts
  const linearRes = await linearRawRes.json();
  ```
- **Issue**: After the AbortError handling at lines 252-260, `linearRawRes` is non-null but might be a 5xx response with a non-JSON body. Calling `.json()` on a non-OK Linear response can throw and propagates to the outer catch (which now masks all errors as 200/internal — see finding #3 pattern). Add a `linearRawRes.ok` check.
- **Fix**: Insert at line 261-262:
  ```ts
  if (!linearRawRes.ok) {
    console.error("PostHog webhook: Linear non-2xx", linearRawRes.status);
    return NextResponse.json({ ok: false, error: "linear_http_error" }, { status: 200 });
  }
  ```
- **Scope**: ~5 lines. ~5 min.
- **Risk**: Low. Improves observability of Linear API failures.

---

## Not flagged (already covered or out-of-scope)

- **`extractSpecies` removal from /api/share** (commit 6981f23, VGC-218): clean removal, migration SQL committed. No follow-up.
- **`scripts/build-dex-subset.mjs` regeneration workflow**: documented in `src/lib/data/dex-subset.ts` header. No drift.
- **Webhook env var fallback** (`LINEAR_WEBHOOK_SIGNING_SECRET ?? LINEAR_WEBHOOK_SECRET`): intentional legacy support, documented inline.
- **`console.log` in weekly-digest line 373**: legitimate cron observability output, leave.
- **Conflict-risk files** (`SlideNavControls.tsx`, `page.tsx`, `useHomePage.ts`, `sw.js`, `globals.css`, `SwipeHint.tsx`): not edited per instructions, but noted that `sectionProgress` math in `SlideNavControls.tsx` is correctly wired (lines 121-122 → 446/458).

## Test coverage gap (low priority for tonight)

- `src/lib/auth/verify-bearer.ts` had no test coverage in the window (added on the swarm-nightly branch at commit `de92e1f` but not on origin/main). When/if that branch merges, no action needed; otherwise consider porting the 9 vitest cases over directly.

## Summary

Six findings, all small. Most worth doing tonight: #1 (dead component cleanup, removes orphans introduced by the latest non-swarm commit), #3 + #4 (webhook telemetry — the historical pain point that caused weeks of silent Linear webhook breakage), #5 (weekly-digest email error visibility), then #2 (dead constants in ExploreFilters) and #6 (PostHog/Linear response handling).
