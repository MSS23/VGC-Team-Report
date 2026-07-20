# Linear Webhook Investigation — 20-07-26

## Handler Location
`src/app/api/webhooks/linear/route.ts` (App Router, `export const dynamic = "force-dynamic"`, `runtime = "nodejs"`).

## Code Audit — VERDICT: HEALTHY

All required checks pass:

- ✅ Reads secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` with legacy fallback `LINEAR_WEBHOOK_SECRET`.
- ✅ No hardcoded secrets in source.
- ✅ Reads raw body via `await request.text()` BEFORE any JSON parse — HMAC is computed on raw bytes.
- ✅ Uses `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')`.
- ✅ Constant-time comparison via `timingSafeEqual` with length check.
- ✅ Returns `200` on valid signature and on empty body (setup ping).
- ✅ Returns `400` on missing header, `401` on invalid signature or missing secret.
- ✅ Returns `200` in the outer catch — Linear will not auto-disable on transient errors.
- ✅ Handles unknown event types by returning `200`.
- ✅ Handles `url_verification` challenge event.
- ✅ App Router: exports `POST`, has `export const dynamic = "force-dynamic"`, method-not-allowed on GET.

## Note on Historical Runs
Prior nightly reports (through 2026-05-28) flagged webhook fixes as needing merge. Looking at current code, all five prior root causes are now fixed and merged: env var name, header name, force-dynamic, catch-block 200, empty body handling. The changelog (`data.ts`) confirms version 5.22 shipped these fixes in May 2026.

## Recent Vercel Logs
Not fetchable in this session (Vercel MCP not available).

## PostHog Cross-reference
PostHog credentials not available in this session (no `.env.local`). Cannot correlate.

## Conclusion
Handler code is correct — no code fix needed this run. If Linear is still reporting failures, root cause is env config:
- `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production must match the signing secret in Linear's webhook settings.
- Verify via Vercel dashboard → Project → Settings → Environment Variables → Production.
- If rotated in Linear, mirror in Vercel and redeploy.

## Action
Not a code-fix candidate this run. Surface prominently in PR body and (attempted) Discord notification for human verification.
