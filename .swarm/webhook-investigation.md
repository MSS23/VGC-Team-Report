# Linear webhook health check (Step 0C) — swarm 26-10-26

**Verdict: ✅ handler is healthy in code. No fix needed, no commit made.**

Handler: `src/app/api/webhooks/linear/route.ts` (91 lines, App Router).

## Audit against the Step 0C checklist

| Check | Result |
|---|---|
| Secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ line 33 (legacy `LINEAR_WEBHOOK_SECRET` kept as documented fallback) |
| No literal secret in source | ✅ repo-wide scan for `lin_api_`/`lin_wh_`/`sk-`/`ghp_`/`xoxb-` returned nothing |
| Raw body read before JSON parse | ✅ `await request.text()` line 25; `JSON.parse(rawBody)` only after verification (line 61) |
| HMAC-SHA256 hex over raw bytes | ✅ lines 49-51 |
| Constant-time compare | ✅ `timingSafeEqual` line 56, with a length pre-check (line 55) so it cannot throw on unequal buffers |
| `linear-signature` header | ✅ line 40, plus `x-linear-signature` fallback |
| 200 valid / 401 invalid / 400 missing header | ✅ lines 79 / 58 / 43-46 |
| 200 for unknown event types | ✅ falls through to `{ ok: true }` line 79 |
| Setup-time verification ping tolerated | ✅ empty body short-circuits to 200 (lines 28-30); `url_verification` echoes the challenge (lines 75-77) |
| No secret / signature / PII logged | ✅ no logging at all in the handler |
| Exports `POST`, `dynamic = 'force-dynamic'` | ✅ lines 4 and 23; also pins `runtime = "nodejs"` (required — `crypto` is unavailable on edge) |

Beyond the checklist it also implements replay protection via `webhookTimestamp`
(±60s window, lines 68-73), and returns 200 from the catch block specifically so a
transient error cannot cause Linear to auto-disable the webhook.

## Root cause of the historic failures
Already fixed and merged. CLAUDE.md states the Linear-webhook-fix P0 "has been
merged on main since May; don't re-verify it", and the code on `main` bears that out.
The deliveries that triggered Linear's auto-disable warning predate that fix.

## What could NOT be verified, and why
- **Vercel Production env var** (`LINEAR_WEBHOOK_SIGNING_SECRET` present / non-placeholder):
  no `VERCEL_TOKEN` and no Vercel MCP in this container. Unverified, not assumed broken.
- **Last 50 invocations of the route**: same reason — no Vercel log access.
- **PostHog exceptions on `/api/webhooks/linear`**: no PostHog credentials (see
  `posthog-insights.md`).

Because the handler code is correct, the remaining risk is configuration-side only:
a human should confirm the Vercel Production secret matches Linear's webhook config
and re-enable the webhook in Linear settings if it was auto-disabled. That is already
tracked by the existing open tickets **VGC-213**, **VGC-222** and **VGC-236** — no new
P0 was filed, as filing a fourth duplicate of the same request would be board noise.

No env-var change was attempted from the swarm, per guardrail.
