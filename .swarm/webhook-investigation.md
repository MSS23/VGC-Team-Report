# Linear Webhook Handler Investigation

**File:** `src/app/api/webhooks/linear/route.ts`
**Verdict:** Handler code is correct. Root cause is almost certainly env-var config on Vercel.

## Code audit results

| Check | Status |
|---|---|
| Reads raw body via `request.text()` before parse | ✅ |
| Reads secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ (also accepts legacy `LINEAR_WEBHOOK_SECRET`) |
| HMAC-SHA256 of raw body, hex-encoded | ✅ |
| Constant-time comparison with `timingSafeEqual` | ✅ |
| Equal-length guard before `timingSafeEqual` | ✅ |
| 200 on valid signature | ✅ |
| 401 on invalid signature / missing secret | ✅ |
| 400 on missing `linear-signature` header | ✅ |
| 200 on empty-body setup ping | ✅ |
| Unknown event types return 200 (no throw) | ✅ |
| No raw secret / signature / PII logged | ✅ |
| `export const dynamic = "force-dynamic"` | ✅ |
| `export const runtime = "nodejs"` | ✅ (HMAC needs Node crypto) |

## Likely root cause

Linear is reporting delivery failures. Given the handler is correct:

1. **Most likely: `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production env does not match the secret Linear shows in the webhook configuration.** Linear's webhook page shows the secret; Vercel must hold the identical value.
2. Next most likely: the secret was rotated in Linear but not updated in Vercel.
3. Third: env var name mismatch — the handler accepts both `LINEAR_WEBHOOK_SIGNING_SECRET` (preferred) and `LINEAR_WEBHOOK_SECRET` (legacy), but if neither is set, requests 401.

## Minor code observations (not the root cause, not blocking)

- Lines 63-65 handle a `url_verification` event with `challenge` payload — this is the Slack pattern; Linear does not use this. The branch is dead code but harmless. Cleanup candidate, not a fix.
- The bare `catch {}` returning 200 silently swallows JSON parse errors and any other surprise. Useful to avoid Linear auto-disabling on transient blips, but logging the error (without the raw body) would help future debugging.

## Recommended human action

Verify in Vercel Production environment: `LINEAR_WEBHOOK_SIGNING_SECRET` (or `LINEAR_WEBHOOK_SECRET`) exactly matches the secret displayed on the Linear webhook settings page for the failing webhook. If unsure, regenerate the secret on the Linear side and paste the new value into Vercel, then redeploy.

## Verdict

This is **not** a code bug; this is **env-var configuration**. Filed for human action via the proposed-linear-tickets file. No code commit will be made for the webhook in this run.
