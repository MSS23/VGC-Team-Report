# Rejected / deferred changes — 2026-06-14

## Build-failed: NONE
No subagent change was rejected at the tsc/build gate this run.

## Findings deferred (not implemented tonight) — surface in PR body / future runs

### High-value but in conflict-risk files (skipped to avoid merge pain)

1. **Lazy-load ExploreFilters in ExploreContent** (C3 perf)
   - File: `src/components/explore/ExploreContent.tsx` — in main-changed-files
   - Estimated impact: ~22KB deferred
   - Action: defer to a swarm run where Explore is quiet

2. **Remove unused `useReducedMotion` import from Navbar** (C3 perf)
   - File: `src/components/layout/Navbar.tsx` — in main-changed-files
   - Estimated impact: ~2KB
   - Action: defer

3. **Lazy-load motion in ExploreFilters** (C3 perf)
   - Files: explore/* — multiple in main-changed-files
   - Estimated impact: ~15KB
   - Action: defer

### Worth filing as Backlog tickets (no Linear API in this env — see Limitations)

4. **ILIKE wildcard injection in /api/explore species filter** (C4 security, LOW)
   - File: `src/app/api/explore/route.ts:108-114`
   - Values are parameterized via Neon tagged template, so classic SQL injection is NOT possible — but user-supplied species containing `%` or `_` would be treated as ILIKE wildcards (pattern broadening / mild DoS risk).
   - Fix: escape `%` and `_` in `sp` before constructing the pattern (~5 lines).

5. **npm audit: 3 high, 11 moderate** (C4)
   - js-cookie prototype hijack, tmp path traversal (GHSA-ph9p-34f9-6g65), cypress dep chain
   - All transitive. `npm audit fix` may resolve some.
   - Action: file a single dependency-update ticket so a human can run audit fix and verify build.

6. **Past data corruption window 17-05-26 to 18-05-26 (C5)**
   - Already remediated in code (commit 1a30839). No further action; flagged for awareness.

### Skipped (false positives on re-verification)

- DisplayTogglePill close button already has `min-w-[44px] min-h-[44px]` (C6 #2 — false positive).
- Several aria-label findings (ShareModal copy button, Button focus indicator) — already compliant on re-read.
