# Linear Webhook Health Check — 2026-06-08

## Handler location
`src/app/api/webhooks/linear/route.ts` (App Router POST endpoint)

## Code audit results (PASS)

| Check | Status | Notes |
|-------|--------|-------|
| Reads signing secret from env var | ✅ | `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` with legacy `LINEAR_WEBHOOK_SECRET` fallback |
| No hardcoded secrets in source | ✅ | Verified |
| Reads raw body before JSON parse | ✅ | `await request.text()` then `JSON.parse(rawBody)` after verify |
| HMAC-SHA256 over raw body | ✅ | `createHmac('sha256', secret).update(rawBody).digest('hex')` |
| Constant-time compare | ✅ | `timingSafeEqual` with length pre-check |
| Header name | ✅ | `linear-signature` with `x-linear-signature` fallback |
| Status code 401 on bad signature | ✅ | |
| Status code 400 on missing signature | ✅ | |
| Status code 200 on valid signature | ✅ | Including unknown event types |
| Empty-body setup ping handled | ✅ | Returns 200 |
| Exception handling returns 200 | ✅ | Prevents Linear auto-disable on transient errors |
| App Router export POST | ✅ | |
| `force-dynamic` set | ✅ | |
| Runtime nodejs (needed for crypto) | ✅ | |
| No secret leakage in logs | ✅ | Catch block silently returns 200, no console.* with secret/signature |

## Conclusion
**Handler code is healthy.** No fix needed in this run.

If Linear is still reporting delivery failures, the root cause is environmental:
1. `LINEAR_WEBHOOK_SIGNING_SECRET` mismatch between Vercel Production env and Linear webhook config, OR
2. Linear may have already auto-disabled the webhook and a human needs to re-enable + re-verify the secret.

## Recommended human follow-up
1. Check Vercel → Project → Settings → Environment Variables for `LINEAR_WEBHOOK_SIGNING_SECRET` in Production. Confirm it matches the secret shown in Linear → Settings → API → Webhooks.
2. Re-enable the webhook in Linear if it was auto-disabled.
3. Trigger a test event and check Vercel logs at `/api/webhooks/linear`.

## Vercel logs / PostHog signals
Not pulled this run — no credentials available in container.
