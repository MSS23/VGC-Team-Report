# Linear Webhook Investigation — 23 May 2026

## Root Cause Identified
**Header name mismatch.** Linear sends the signature in header `linear-signature` (per [official docs](https://linear.app/developers/webhooks)). The handler at `src/app/api/webhooks/linear/route.ts` was reading `x-linear-signature`. Every Linear request returned 401 "Missing signature".

## Audit Findings vs Step 0C Checklist
| Check | Status |
| --- | --- |
| Raw body read via `await request.text()` | ✅ already correct |
| HMAC over raw body (not re-stringified JSON) | ✅ already correct |
| Constant-time signature comparison | ✅ already correct |
| Signing-secret read from env (no hardcoded secret) | ✅ correct |
| Header name `linear-signature` | ❌ **was `x-linear-signature` — FIXED** |
| Returns 200 on valid sig | ✅ |
| Returns 401 on invalid sig | ✅ |
| Returns 400 on missing body | ❌ was 500 via crash on `JSON.parse('')` — FIXED |
| Returns 200 for unknown event types | ✅ |
| Handles setup-time verification ping | ✅ improved (only returns challenge if non-empty) |
| `export const dynamic = 'force-dynamic'` | ❌ missing — ADDED |
| No secret/PII logging | ✅ |

## Env-Var Note
- Codebase has used `LINEAR_WEBHOOK_SECRET`. Task spec recommends `LINEAR_WEBHOOK_SIGNING_SECRET`.
- Handler now reads `LINEAR_WEBHOOK_SIGNING_SECRET` first and falls back to `LINEAR_WEBHOOK_SECRET` to preserve existing Vercel state.
- Follow-up Linear ticket filed for the human to rename the env var in Vercel and remove the legacy fallback.

## Fix Applied
- Single commit: `VGC-WEBHOOK: read linear-signature header, accept both env var names, harden body parsing`
- Builds and typechecks clean before commit.

## Required Human Action After Merge
1. Re-enable the Linear webhook in Linear settings if Linear auto-disabled it.
2. Trigger a test event from Linear's webhook UI; expect HTTP 200.
3. Confirm Vercel env `LINEAR_WEBHOOK_SECRET` is still set, or migrate to `LINEAR_WEBHOOK_SIGNING_SECRET`.
# Linear Webhook Investigation — 2026-05-21

## Root cause

The handler at `src/app/api/webhooks/linear/route.ts` was reading the
HMAC signature from request header `x-linear-signature`. Linear actually
sends the header as `linear-signature` (no `x-` prefix). Every request
was therefore returning 401 Missing signature, which is what Linear
flagged before threatening to auto-disable the webhook.

## Other issues found in the handler

1. Env var name was `LINEAR_WEBHOOK_SECRET` rather than the canonical
   `LINEAR_WEBHOOK_SIGNING_SECRET`. Likely benign if the human set
   `LINEAR_WEBHOOK_SECRET` on Vercel, but the handler now tries both so
   either configuration works.
2. Missing `export const dynamic = "force-dynamic"` — could allow
   static optimisation on a POST-only route in newer Next.js builds.
3. Returned 500 on missing/empty body and 401 on missing secret config.
   Corrected to 400 for body issues and 500 for unconfigured secret.

## Fix

Single commit (first commit of nightly branch):
- `src/app/api/webhooks/linear/route.ts` rewritten with correct header
  name, dual-env-var lookup, force-dynamic, status-code cleanup.

## Human follow-up required

- Re-enable the webhook in Linear settings if Linear has already
  paused it.
- Verify the env var name on Vercel Production matches one of
  `LINEAR_WEBHOOK_SIGNING_SECRET` (preferred) or `LINEAR_WEBHOOK_SECRET`.
- Confirm a real Linear event reaches the route after deploy (check
  Vercel logs for a 200 response within 24h of merge).

No secret values were observed, logged, or written to any swarm file.
