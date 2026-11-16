# Linear webhook health check — 16 Nov 2026 (Step 0C, run inline)

Handler: `src/app/api/webhooks/linear/route.ts` (exists; tests at `__tests__/route.test.ts`)

## Code audit — every Step 0C check PASSES

| Check | Result |
|---|---|
| Secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ (line 34, with legacy `LINEAR_WEBHOOK_SECRET` fallback — VGC-236 tracks removing it) |
| No hardcoded secret in source | ✅ |
| Raw body via `await request.text()` before JSON.parse | ✅ (line 26; parse at line 62) |
| HMAC-SHA256 hex over raw body | ✅ (lines 50–52) |
| Constant-time compare (`timingSafeEqual`) with length guard | ✅ (lines 53–60) |
| 200 valid / 401 invalid / 400 missing header | ✅ |
| 200 for unknown event types | ✅ (line 92 default) |
| Setup-time verification ping / empty body tolerated | ✅ (lines 29–31, and `url_verification` at 88) |
| No secret / signature / PII logging | ✅ (no logging at all) |
| App Router: exports POST + `dynamic = 'force-dynamic'` | ✅ (lines 4, 24) |

Also handles replay protection (60s `webhookTimestamp` window, acknowledged with 200 so Linear
retries don't drive the failure count — the exact mechanism that previously caused auto-disable).

## Verdict: healthy in code. No fix commit needed, no code change made.

This matches `CLAUDE.md`, which states the Linear-webhook-fix P0 is **stale** — merged on main
since May — and says not to re-verify it. Commit `10dfd74` (31 Oct) added VGC-230 webhook
idempotency on top.

## What could NOT be checked, and why

- **Vercel env var `LINEAR_WEBHOOK_SIGNING_SECRET` (Production)**: no `VERCEL_TOKEN` in the
  container and no Vercel MCP server attached this session. Not checkable.
- **Recent invocation logs for the route**: same reason.
- **PostHog cross-reference**: `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` are absent
  (already tracked by VGC-220). Not checkable.

## No new P0 ticket filed — deliberately

Step 0C.6 would have filed `[INFRA] Linear webhook signing secret mismatch`. Not filed, because:
1. The handler code is demonstrably correct, so there is no code-side defect to report.
2. Three equivalent tickets already exist and are open: **VGC-213**, **VGC-222**, **VGC-236**.
   All three are the human-action half of this exact job (verify the Vercel env var, re-enable
   the webhook in Linear settings, then drop the legacy name).
3. `CLAUDE.md` explicitly says this P0 is stale and not to re-verify it.

Filing a fourth would be board noise. Surfaced in the PR body and Discord instead, pointing at
VGC-213 / VGC-222 / VGC-236.
