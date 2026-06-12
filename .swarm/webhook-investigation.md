# Linear Webhook Investigation — 12-06-2026

## Handler review: src/app/api/webhooks/linear/route.ts

**Code health: ✅ HEALTHY** — the handler matches all Step 0C requirements:

- Reads `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy `LINEAR_WEBHOOK_SECRET` fallback) — line 32-34
- Reads raw body via `await request.text()` BEFORE JSON parsing — line 25
- HMAC computed over raw bytes — line 49-51
- Uses `timingSafeEqual` (constant-time compare) — line 56
- Returns 200 on valid, 401 on invalid signature, 400 on missing signature header
- Returns 200 for empty-body Linear setup ping — line 28-30
- Returns 200 for unknown event types — line 67
- Handles `url_verification` event — line 63-65
- Wraps everything in try/catch that returns 200 (to prevent Linear auto-disable on transient errors)
- Does NOT log secrets, signatures, or PII
- Exports POST + GET (405), has `export const dynamic = "force-dynamic"` and `runtime = "nodejs"`

## Historical context

Prior swarm runs (May 22 → June 11) progressively hardened this handler. All previously identified code-level issues have already been fixed and merged. The current handler is the corrected version.

## Conclusion

The handler code is correct. If Linear is still reporting delivery failures, the root cause is one of:

1. **Vercel env var `LINEAR_WEBHOOK_SIGNING_SECRET` is missing, empty, or doesn't match Linear's webhook secret** (most likely).
2. The signing secret in Linear's webhook settings was rotated and Vercel is out of date.
3. A transient deployment issue (resolved by next deploy).

## Swarm action

Per Step 0C guardrails: env-var changes require human action via the Vercel dashboard and are NEVER attempted from the swarm. No code fix lands tonight.

A P0 Linear ticket will be drafted (see `.swarm/drafts/p0-webhook-env-mismatch.md`) so the human can verify Vercel env vars match Linear's webhook config immediately on waking. Surfaced in PR body, Discord notification, and final report.

## Vercel/PostHog log access

Vercel MCP not available in this session. PostHog credentials not in environment. Cannot pull recent invocation logs to confirm the failure mode (401 vs 500 vs 400). Human should check Vercel dashboard → Functions → `/api/webhooks/linear` logs.
