# Linear Webhook Investigation — 2026-06-02

## Handler audit: `src/app/api/webhooks/linear/route.ts`

✅ Reads signing secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy `LINEAR_WEBHOOK_SECRET` fallback for backwards compat)
✅ Reads raw body via `await request.text()` BEFORE JSON parsing
✅ Verifies `linear-signature` header (with `x-linear-signature` fallback) using HMAC-SHA256
✅ Uses `crypto.timingSafeEqual` for constant-time comparison
✅ Has `export const dynamic = "force-dynamic"`
✅ Has `export const runtime = "nodejs"`
✅ Handles empty-body setup ping (returns 200 with `{ok: true}`)
✅ Returns 200 in catch block (deliberate workaround to prevent Linear auto-disable on transient errors)
✅ No hardcoded secrets in source
✅ Does not log raw secret or signature

## Verdict

**Handler code is HEALTHY.** No code-level fix required this run. The pattern matches Linear's documented webhook signature verification (HMAC-SHA256 of raw bytes, hex-encoded, compared timing-safe).

The fix has been in place since changelog 5.20 / 5.22 and remains intact on main (verified via `git log --oneline src/app/api/webhooks/linear/route.ts`).

## If webhook is still failing in production

Root cause is env-config or Linear-side, not code. Possible causes:
- `LINEAR_WEBHOOK_SIGNING_SECRET` env var in Vercel Production does not match the secret in Linear webhook settings
- Linear's webhook configuration was rotated/regenerated and not re-pushed to Vercel
- Vercel deployment is older than the handler fix (cache/stale build)

## Recommended human action

1. Open Vercel dashboard → Project settings → Environment Variables → Production
2. Verify `LINEAR_WEBHOOK_SIGNING_SECRET` exists and matches the secret shown in Linear's webhook configuration UI
3. If mismatch: copy from Linear, paste into Vercel, redeploy
4. After redeploy: in Linear webhook settings, click "Re-enable" if auto-disabled, then click "Send test event" to confirm 200 response

## Swarm action this run

- No code change (handler is correct)
- This investigation file attached
- PR body will include "✅ healthy" with this note
- Discord notification will reflect ✅ healthy
