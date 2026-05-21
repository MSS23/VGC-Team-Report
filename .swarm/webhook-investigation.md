# Linear Webhook Investigation — 2026-05-21

## Root cause

The handler at `src/app/api/webhooks/linear/route.ts` was reading the
HMAC signature from request header `x-linear-signature`. Linear actually
sends the header as `linear-signature` (no `x-` prefix). Every request
was therefore returning 401 Missing signature, which is what Linear
flagged before threatening to auto-disable the webhook.

## Other issues found in the handler

1. Env var name was `LINEAR_WEBHOOK_SECRET` rather than the canonical
   `LINEAR_WEBHOOK_SIGNING_SECRET`. Likely benign if the human set
   `LINEAR_WEBHOOK_SECRET` on Vercel, but the handler now tries both so
   either configuration works.
2. Missing `export const dynamic = "force-dynamic"` — could allow
   static optimisation on a POST-only route in newer Next.js builds.
3. Returned 500 on missing/empty body and 401 on missing secret config.
   Corrected to 400 for body issues and 500 for unconfigured secret.

## Fix

Single commit (first commit of nightly branch):
- `src/app/api/webhooks/linear/route.ts` rewritten with correct header
  name, dual-env-var lookup, force-dynamic, status-code cleanup.

## Human follow-up required

- Re-enable the webhook in Linear settings if Linear has already
  paused it.
- Verify the env var name on Vercel Production matches one of
  `LINEAR_WEBHOOK_SIGNING_SECRET` (preferred) or `LINEAR_WEBHOOK_SECRET`.
- Confirm a real Linear event reaches the route after deploy (check
  Vercel logs for a 200 response within 24h of merge).

No secret values were observed, logged, or written to any swarm file.
