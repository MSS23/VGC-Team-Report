# Linear Webhook Investigation — 2026-06-05

## Handler location
`src/app/api/webhooks/linear/route.ts`

## Audit results — ALL PASS

- ✅ Reads `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy `LINEAR_WEBHOOK_SECRET` fallback)
- ✅ Reads raw body via `await request.text()` BEFORE parsing JSON
- ✅ HMAC-SHA256 computed over raw bytes
- ✅ `linear-signature` header read (with `x-linear-signature` fallback)
- ✅ Uses `crypto.timingSafeEqual` for constant-time comparison
- ✅ Length-checks buffers before `timingSafeEqual` (which would otherwise throw)
- ✅ Returns 200 on valid signature
- ✅ Returns 401 on invalid signature / missing secret
- ✅ Returns 400 on missing signature header
- ✅ Empty-body setup ping → 200
- ✅ `url_verification` event type returns challenge
- ✅ Unknown event types → 200 (default branch)
- ✅ Catch block returns 200 (so Linear does not auto-disable on transient error)
- ✅ `export const dynamic = "force-dynamic"` set
- ✅ `export const runtime = "nodejs"` set (HMAC needs Node, not Edge)
- ✅ GET returns 405 with Allow header
- ✅ No hardcoded secrets, no PII logging, no secret logging

## Root cause hypothesis

Handler code is healthy. Likely causes:

1. **Env-var mismatch in Vercel Production.** `LINEAR_WEBHOOK_SIGNING_SECRET`
   in Vercel Production may not match the signing secret configured in Linear's
   webhook settings. Produces 401s, which Linear's UI shows as delivery failures.
   REQUIRES HUMAN ACTION — swarm cannot read or modify Vercel env vars.

2. **Stale webhook config.** Secret rotated in Linear but not in Vercel (or vice
   versa).

3. **Catch-block 200 masking real errors.** Transient handler exceptions return
   200 to avoid auto-disable. Check Sentry for any exceptions on
   `/api/webhooks/linear` since Linear last warned.

## Vercel / Sentry data

- Vercel MCP: not available in this environment.
- Sentry: `@sentry/nextjs` installed — any handler crashes should be captured.

## Status

No code fix to land. P0 Linear ticket queued in `.swarm/linear-pending.md`.
