# Linear Webhook Investigation — 2026-06-14

## Handler audit: ALL CHECKS PASS

File: `src/app/api/webhooks/linear/route.ts`

| Check | Status |
|---|---|
| Reads signing secret from env (`LINEAR_WEBHOOK_SIGNING_SECRET` or legacy `LINEAR_WEBHOOK_SECRET`) | PASS |
| Reads raw body via `await request.text()` before JSON parse | PASS |
| Verifies `linear-signature` header with `crypto.createHmac('sha256', secret)` | PASS |
| Uses `timingSafeEqual` for constant-time comparison | PASS |
| Returns 200 on valid, 401 on invalid sig, 400 on missing sig | PASS |
| Returns 200 for unknown event types | PASS |
| Handles empty-body setup ping (line 28-30) | PASS |
| No raw secret / signature / PII in logs | PASS |
| `export const dynamic = "force-dynamic"` set | PASS |
| `export const runtime = "nodejs"` (required for `crypto`) | PASS |
| Exports POST and GET (GET returns 405) | PASS |

## Conclusion

The handler code is correct. The webhook failure is **not in the code**.

## Likely root cause: env-var configuration mismatch

Since the handler is correct, the failure is one of:
1. `LINEAR_WEBHOOK_SIGNING_SECRET` is not set in Vercel Production environment.
2. The secret stored in Vercel does not match the secret stored in Linear's webhook configuration (rotation drift).
3. The webhook URL configured in Linear points at a stale Vercel deployment alias.

## Action required (HUMAN ONLY)

This swarm run **CANNOT fix env-var issues** — Vercel env vars must be set via the Vercel dashboard by a human. Filing a P0 Linear ticket and surfacing in PR body.

Steps for the human:
1. Open Vercel dashboard → Project Settings → Environment Variables.
2. Confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists for the Production environment with a real (non-placeholder) value.
3. Open Linear → Settings → API → Webhooks.
4. Verify the signing secret shown there matches what's in Vercel.
5. If a mismatch, rotate one side and update the other. Redeploy.
6. Send a test webhook from Linear's webhook config UI and confirm it returns 200 in Vercel logs.

## What I cannot check from this swarm

- Vercel env-var presence/values (no Vercel MCP available in this environment).
- Vercel function logs for `/api/webhooks/linear` invocations (no Vercel MCP available).
- Linear's webhook configuration (no Linear API key set in `.env.local`).
