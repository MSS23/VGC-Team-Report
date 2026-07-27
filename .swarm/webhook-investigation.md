# Webhook Investigation — 2026-07-27

## Handler location
`src/app/api/webhooks/linear/route.ts` — exists and is well-formed.

## Audit checklist (all pass)
- ✅ Reads signing secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with `LINEAR_WEBHOOK_SECRET` legacy fallback).
- ✅ No hardcoded secret in source.
- ✅ Reads raw body via `await request.text()` BEFORE JSON parsing — HMAC computed over raw bytes.
- ✅ Verifies `linear-signature` header (with `x-linear-signature` fallback).
- ✅ HMAC-SHA256, hex encoded, compared with `crypto.timingSafeEqual` (constant time).
- ✅ Returns 200 for empty body (Linear setup ping).
- ✅ Returns 401 for missing secret or invalid signature.
- ✅ Returns 400 for missing signature header.
- ✅ Wraps in try/catch returning 200 on unhandled errors — prevents Linear from auto-disabling on transient failures.
- ✅ Handles `url_verification` challenge event.
- ✅ Returns 405 on GET with proper `Allow` header.
- ✅ Exports `dynamic = "force-dynamic"` and `runtime = "nodejs"` (Node crypto available).
- ✅ Returns 200 for unknown event types (falls through to `{ ok: true }`).

## Diagnosis
The handler code is correct. If Linear is reporting delivery failures, the root cause is one of:

1. **Env-var mismatch (most likely):** `LINEAR_WEBHOOK_SIGNING_SECRET` (or `LINEAR_WEBHOOK_SECRET`) in Vercel Production does not match the secret configured in Linear's webhook settings. Every request returns 401 and Linear counts them as failures. **Requires human action** — cannot be fixed from the swarm.

2. **Env-var missing:** If neither `LINEAR_WEBHOOK_SIGNING_SECRET` nor `LINEAR_WEBHOOK_SECRET` is set in Vercel Production, every request returns 401. **Requires human action.**

3. **Header casing:** Linear may be sending signature under a different header name than `linear-signature` / `x-linear-signature`. Unlikely — the handler already covers both.

## Access limitations this run
- Cannot query Vercel MCP (unavailable in this session).
- Cannot query PostHog for webhook route errors (POSTHOG_API_KEY not in env).
- Cannot verify actual delivery status from Linear (Linear MCP not authenticated).

## Recommended action for human
1. Log into Vercel Production → Settings → Environment Variables. Verify `LINEAR_WEBHOOK_SIGNING_SECRET` exists and is non-empty.
2. Log into Linear → Settings → API → Webhooks → the failing webhook. Copy the signing secret shown there.
3. Compare: they must match exactly (no leading/trailing whitespace, no rotated secret drift).
4. If mismatched, either update Vercel env var to match Linear, or regenerate the Linear secret and update Vercel.
5. Redeploy Vercel to pick up any env-var change.
6. Trigger a test event in Linear → verify Vercel logs show 200.
7. Re-enable the webhook in Linear settings if it was auto-disabled.
