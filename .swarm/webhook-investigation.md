# Linear Webhook Health Check — 2026-07-13

## Handler location
`src/app/api/webhooks/linear/route.ts`

## Code audit result: ✅ HANDLER IS CORRECT

Every checklist item passes:

| Check | Status | Notes |
|---|---|---|
| Reads signing secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ | Line 33; also accepts legacy `LINEAR_WEBHOOK_SECRET` as fallback |
| Reads raw request body via `await req.text()` before JSON parse | ✅ | Line 25 |
| Verifies `linear-signature` header (also accepts `x-linear-signature`) | ✅ | Lines 39-41 |
| HMAC-SHA256 hex-encoded computation | ✅ | Lines 49-51 |
| Timing-safe compare via `crypto.timingSafeEqual` | ✅ | Lines 52-57 |
| Returns 200 on valid signature | ✅ | Line 67 |
| Returns 401 on invalid signature | ✅ | Line 58 |
| Returns 400 on missing signature header | ✅ | Line 43 |
| Returns 200 on unknown event types (no throw) | ✅ | Line 67 |
| Handles empty-body setup ping | ✅ | Lines 28-30 |
| Handles Linear url_verification challenge | ✅ | Lines 63-65 |
| Does not log secret, signature, or PII | ✅ | No logging at all |
| `export const dynamic = 'force-dynamic'` set | ✅ | Line 4 |
| `runtime = 'nodejs'` set (needed for `crypto`) | ✅ | Line 6 |
| Catch block returns 200 (prevents auto-disable on transient errors) | ✅ | Lines 68-70 |
| Secret NOT hardcoded anywhere in source | ✅ | Verified via grep |

## Root cause (best guess)
Because the code is fully correct, the persistent delivery failures Linear
is reporting must be an env-var / configuration mismatch:

1. `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production does not match the
   `Signing secret` shown in Linear webhook settings, OR
2. The env var is missing/empty in Vercel Production (handler returns 401
   silently), OR
3. Linear's webhook URL points to the wrong endpoint (e.g. still a stale
   preview deployment)

## Recommended human action
Verify in Vercel dashboard (Production env) that `LINEAR_WEBHOOK_SIGNING_SECRET`
exists and matches the `Signing secret` in Linear → Settings → API → Webhooks
for this workspace. If it doesn't, either:
- rotate in Linear and paste the new value into Vercel, or
- rotate in Vercel and paste the new value into Linear.

Then in Linear, click "Test webhook" — expect 200.

## Cannot fix from swarm
Env-var changes require human action via the Vercel dashboard. Swarm does
not modify Vercel env vars.

## Ticket to file
`[INFRA] Linear webhook signing secret mismatch — verify Vercel env var matches Linear config`
— to be filed manually by human since Linear API is unavailable this run.
