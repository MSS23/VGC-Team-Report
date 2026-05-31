# C5 — Recent Commits Review (2026-05-31)

**Window:** last 20 commits on `main` through 1a30839.
**Prior review:** `.swarm/c5-commit-review-23-05-26.md`.

## Headline

Significant progress — the v5.22 sweep fixed all four HIGH-severity email-template XSS issues. However, three issues that survived the merge are worth follow-up tickets, plus two infrastructure observations.

## Top 5 follow-up items

### 1. P0 — Linear webhook silent error swallowing
- File: `src/app/api/webhooks/linear/route.ts:68-71`
- Issue: Catch block returns 200 with no logging. JSON.parse failures, HMAC errors, and any future bugs are invisible. We deliberately return 200 so Linear doesn't auto-disable, but we still need observability.
- Fix: `console.error("linear webhook handler error", { errMessage: err instanceof Error ? err.message : String(err) })` (without exposing raw body or signature)
- Effort: 5 min
- Note: This is the exact handler we just verified in Step 0C — but Step 0C's audit accepted the silent catch. Reviewer found a real gap.

### 2. P1 — Weekly digest N+1 risk
- File: `src/app/api/cron/weekly-digest/route.ts:238-258`
- Issue: Loop over 500 users running per-user stats queries. Vercel functions have a 60s ceiling; under load this times out before the loop finishes.
- Fix: Single `GROUP BY owner_id` query pre-aggregating all user stats before the loop. Then mutate emails in parallel batches (v5.19 already did the Clerk getUserList batch fix; this completes the optimization).
- Effort: 30 min

### 3. P2 — InstallPrompt localStorage unguarded
- File: `src/components/ui/InstallPrompt.tsx:21`
- Issue: `localStorage.getItem()` throws in Safari private browsing.
- Fix: Wrap in try/catch returning null.
- Effort: 5 min

### 4. P2 — Changelog text unprofessional
- File: `src/app/changelog/data.ts:26`
- Issue: User-facing changelog contains "8th consecutive fix proposal — please merge!" — meta-text bleed from the swarm process.
- Fix: Rewrite to focus on the actual user-visible improvement.
- Effort: 2 min

### 5. P3 — Add CI gate for tsc + build
- File: `.github/workflows/*.yml`
- Issue: The fact that commit 1a30839 was titled "Merge swarm-nightly PRs + repair corrupted main" indicates main was momentarily broken. CI should block merges where tsc or build fails.
- Fix: Add a workflow running `npx tsc --noEmit && npm run build` on pull_request.
- Effort: 15 min

## Confidence

HIGH on items 1, 3, 4. MEDIUM on item 2 (need to actually trace the query — there might already be a pre-aggregation). MEDIUM on item 5 (workflow file might already exist; verify before adding duplicate).
