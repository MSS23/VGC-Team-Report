# Step 0C — Linear webhook health check (static audit only)

**Verdict: ✅ handler code is correct. No P0 fix required. No commit made.**

CLAUDE.md states the Linear-webhook-fix P0 is stale and was merged on main back in
May; this audit confirms that from the source. `git log` also shows the most recent
hardening landed as `a099f97 VGC-274: Linear webhook replay window + drop CORS
Allow-Credentials`.

## Audit of `src/app/api/webhooks/linear/route.ts` against the Step 0C checklist

| Check | Result |
|---|---|
| Secret read from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ (with a documented legacy `LINEAR_WEBHOOK_SECRET` fallback) |
| No literal secret in source | ✅ none anywhere in the repo (verified by grep, see `.swarm/c4-security.md`) |
| Raw body read via `await request.text()` before any JSON parse | ✅ HMAC is computed over the raw string, `JSON.parse` happens after verification |
| HMAC-SHA256 + `crypto.timingSafeEqual` constant-time compare | ✅ with an explicit length guard first (`timingSafeEqual` throws on length mismatch) |
| `linear-signature` header | ✅ (plus an `x-linear-signature` alias) |
| 200 valid / 401 invalid / 400 missing header | ✅ exactly as specified |
| 200 (not 500) for unknown event types | ✅ falls through to `{ ok: true }` |
| Setup-time verification ping tolerated | ✅ empty body short-circuits to 200; `url_verification` echoes the challenge |
| No secret / signature / PII logging | ✅ the handler logs nothing at all |
| App Router: exports `POST`, `dynamic = 'force-dynamic'` | ✅ both, plus `runtime = 'nodejs'` (required — `crypto` is unavailable on edge) |

It also adds replay protection beyond the checklist: a ±60s `webhookTimestamp`
window, with an honest in-code note that there is no delivery-id dedupe.

## Could not verify (integrations unavailable this run)

- **Vercel env var state** — no Vercel MCP and no `VERCEL_TOKEN`, so whether
  `LINEAR_WEBHOOK_SIGNING_SECRET` is actually populated in Production is unknown.
- **Recent invocation logs** — same reason; no 401/500 pattern analysis possible.
- **PostHog cross-reference** — `POSTHOG_API_KEY` unset, skipped for the whole run.

Because the code is correct, a *delivery* failure (if one is still occurring) can
only be env-var configuration, which the swarm must never touch. Pre-existing
tickets already cover this exact human action — **VGC-213**, **VGC-222** and
**VGC-236** are all open in Backlog. No new duplicate ticket was filed.

## Finding: VGC-236 is blocked, not implementable tonight

VGC-236 asks to drop the legacy `LINEAR_WEBHOOK_SECRET` fallback and standardise on
`LINEAR_WEBHOOK_SIGNING_SECRET`. **This run deliberately did not implement it.**
Removing the fallback is only safe once someone has confirmed which name is
actually set in Vercel Production. With no Vercel access, shipping that change
could silently break webhook delivery — the precise failure the ticket exists to
prevent. Commented on the ticket with this blocker instead.

## Observation (not acted on): the catch-all swallows real crashes

The outer `catch { return 200 }` is a sound anti-auto-disable measure, but it
discards the error entirely, so a genuine handler crash is indistinguishable from
success in both Vercel logs and PostHog. Worth a `console.error` before the 200 —
left alone this run because it touches the hot path of a webhook that has a
history of being fragile, and the value is observability rather than correctness.
Filed as a low-priority Backlog ticket.
