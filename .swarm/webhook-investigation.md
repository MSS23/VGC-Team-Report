# Linear webhook health check — run 2026-11-23

## Verdict: handler code is HEALTHY. No code fix needed this run.

Handler: `src/app/api/webhooks/linear/route.ts` (+ `__tests__/route.test.ts`)

Audited against every item in the Step 0C checklist:

| Check | Result |
|---|---|
| Reads `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ (line 34; legacy `LINEAR_WEBHOOK_SECRET` accepted as documented fallback) |
| No literal secret in source | ✅ nothing hardcoded anywhere in the route or tests |
| Raw body read via `await request.text()` before `JSON.parse` | ✅ line 26, parse at line 62 |
| `linear-signature` header, HMAC-SHA256 hex | ✅ lines 40–52 |
| Constant-time compare via `timingSafeEqual` | ✅ lines 53–60, with the required length guard before the compare |
| 200 valid / 401 invalid / 400 missing header | ✅ |
| 200 (not 500) for unknown event types | ✅ line 92 falls through to `{ ok: true }` |
| Setup-time verification ping / empty body | ✅ lines 28–31, plus `url_verification` challenge at line 88 |
| No secret / signature / PII logging | ✅ no logging at all in the route |
| App Router: exports `POST`, `force-dynamic` | ✅ lines 4, 24 (also `runtime = "nodejs"`, needed for `crypto`) |

Unit tests: the route's own suite passes (see run output above).

## Root cause of the historical failures: already fixed and already ticketed

`src/app/changelog/data.ts` records the fix shipping twice (wrong header name,
wrong env var name, missing `force-dynamic`, empty-body handling). The handler on
`main` today is the fixed version. The replay-window comment (lines 64–86)
documents the second-order fix: stale retries used to answer 401, which drove the
failure count up until Linear auto-disabled the webhook — they now answer 200 and
drop the event.

**What remains is a human action in the Linear dashboard, not code.** Two tickets
already cover it, so this run files NO duplicate:

- **VGC-213** — `[INFRA] Verify Linear webhook delivery + re-enable in Linear settings after handler fix`
- **VGC-222** — `[INFRA] Linear webhook handler header bug fixed — re-enable in Linear settings after deploy`

Related, also already ticketed: **VGC-236** — drop the legacy `LINEAR_WEBHOOK_SECRET` name.

## Not verifiable this run

- **Vercel env var check** — no `VERCEL_TOKEN` in this container, so the Production
  value of `LINEAR_WEBHOOK_SIGNING_SECRET` could not be read. Per CLAUDE.md the
  missing integration is skipped for the whole run rather than retried. Env-var
  changes are human-only anyway.
- **Vercel invocation logs / PostHog exceptions** — same reason (`POSTHOG_API_KEY`
  and `POSTHOG_PROJECT_ID` are both unset). Already ticketed as **VGC-220**.

No secret material was read, echoed, or written anywhere during this check.
