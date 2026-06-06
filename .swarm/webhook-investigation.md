# Linear Webhook Investigation — 2026-06-06

## Handler audit: `src/app/api/webhooks/linear/route.ts`

All required checks pass:

- Reads raw body via `await request.text()` BEFORE JSON.parse (line 25)
- Reads signing secret from `LINEAR_WEBHOOK_SIGNING_SECRET` with legacy `LINEAR_WEBHOOK_SECRET` fallback (lines 32-34)
- Verifies `linear-signature` header with `crypto.createHmac('sha256', secret).update(rawBody).digest('hex')` (lines 49-51)
- Uses `crypto.timingSafeEqual` with length check for constant-time comparison (lines 52-57)
- Returns 200 on valid, 401 on invalid signature, 400 on missing header, 401 on missing secret
- Handles empty-body setup ping (lines 27-30)
- Catch-all returns 200 to prevent Linear from auto-disabling on transient errors (lines 68-71)
- Unknown event types fall through to a 200 response (line 67)
- Has `export const dynamic = "force-dynamic"` and `export const runtime = "nodejs"`
- No literal secret in source — only env-var references
- Does not log raw secret, signature, or PII

## Conclusion: handler code is CORRECT

The handler implementation is sound. The webhook delivery failures Linear is
reporting are almost certainly an **environment configuration mismatch** between
the secret stored in Vercel's Production environment and the secret stored in
Linear's webhook configuration. This requires human action via the Vercel
dashboard — the swarm cannot fix env vars from inside the runtime.

## Recommended human action

1. Open Vercel -> vgc-team-report -> Settings -> Environment Variables
2. Locate LINEAR_WEBHOOK_SIGNING_SECRET in Production
3. Open Linear -> Settings -> API -> Webhooks -> vgc-team-report webhook
4. Confirm the signing secret value matches EXACTLY (no trailing whitespace, no truncation)
5. If they differ, copy Linear's signing secret into Vercel and redeploy production
6. After redeploy, re-enable the webhook in Linear if it was auto-disabled
7. Test by editing a Linear issue and checking Vercel function logs

## Backlog ticket to file

Title: [INFRA] Linear webhook signing secret mismatch — verify Vercel env var matches Linear webhook config
Priority: Urgent
Description: See this file. Handler code is verified correct. Action is purely env-var verification + (if mismatched) update.
