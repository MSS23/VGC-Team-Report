# Linear webhook health check — 2026-06-29

## Handler audit

File: `src/app/api/webhooks/linear/route.ts`

Verified the handler is correctly written:

- [x] Reads `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy `LINEAR_WEBHOOK_SECRET` fallback)
- [x] Reads raw body via `await request.text()` before parsing JSON
- [x] HMAC-SHA256 over raw body
- [x] `timingSafeEqual` constant-time comparison
- [x] 200 OK for empty-body setup ping
- [x] 200 OK for valid signature including unknown event types
- [x] 200 OK in catch block (so Linear does not auto-disable on transient errors)
- [x] 400 for missing `linear-signature` header
- [x] 401 for missing secret env var
- [x] 401 for invalid signature
- [x] `export const dynamic = "force-dynamic"` set
- [x] `export const runtime = "nodejs"` set
- [x] No secrets, signatures, or PII logged

## Verdict

**The handler code is fine. The persistent failure is almost certainly an env-var mismatch between Vercel Production and Linear's webhook config.**

The May 2026 changelog (`src/app/changelog/data.ts`) records this as "8th consecutive fix proposal — please merge!" which indicates prior runs have repeatedly proposed code fixes that did NOT resolve the issue. That is consistent with the root cause being external configuration, not code.

## Action required (human)

1. Open Vercel dashboard → VGC-Team-Report → Settings → Environment Variables.
2. Confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists for the **Production** environment with a non-empty, non-placeholder value.
3. Open Linear → Settings → API → Webhooks → the webhook pointed at `https://pokemonvgcteamreport.com/api/webhooks/linear`.
4. Copy Linear's signing secret. Verify the bytes match exactly what is set in Vercel.
5. If they differ, rotate the secret on both sides and redeploy.
6. After redeploying, send a test event from Linear and confirm a 200 in Vercel logs.

## Vercel access

This swarm has no Vercel MCP / API access, so the env-var state could not be verified in-band.
