# Linear Webhook Handler Investigation

## File
src/app/api/webhooks/linear/route.ts

## Findings

### Issue 1: Wrong signature header name (CRITICAL — almost certainly the cause)
- Code reads `request.headers.get("x-linear-signature")`
- Linear actually sends the header as `linear-signature` (no `x-` prefix)
- Result: header is null → return 401 "Missing signature"
- This alone explains the failures Linear is reporting.

### Issue 2: Env var name mismatch (possible secondary issue)
- Code reads `process.env.LINEAR_WEBHOOK_SECRET`
- Task spec / convention expects `LINEAR_WEBHOOK_SIGNING_SECRET`
- Without Vercel MCP access we cannot verify what is actually set on Production.
- If Vercel only has `LINEAR_WEBHOOK_SIGNING_SECRET`, code returns 401 because secret is undefined.
- If Vercel only has `LINEAR_WEBHOOK_SECRET`, renaming would break it.
- Decision: Support BOTH env var names (read SIGNING_SECRET first, fall back to legacy SECRET) to make the fix safe regardless of Vercel state. File a follow-up ticket for the user to standardise to a single name.

### Issue 3: Missing `dynamic = 'force-dynamic'`
- Without it, Next.js App Router may statically optimise the route.
- Adding it ensures the body is always read at request time.

### Issue 4: Returns 500 (not 200) on unknown event types
- `body.type === "url_verification"` is the ONLY recognised type
- Any other event type returns `{ ok: true }` which is fine
- The catch block returns 500 on any throw — Linear may retry these
- Current behaviour is acceptable; not changing.

### Issue 5: Logs the error object via `console.error`
- Acceptable; the body isn't logged. No PII leak.

## Fix plan (code-only — env var verification is human action)
1. Change header name: `x-linear-signature` → `linear-signature`.
2. Read `LINEAR_WEBHOOK_SIGNING_SECRET` (preferred) with fallback to `LINEAR_WEBHOOK_SECRET` (legacy).
3. Add `export const dynamic = 'force-dynamic';`
4. File P0 Linear ticket: `[INFRA] Standardise Linear webhook signing secret env var to LINEAR_WEBHOOK_SIGNING_SECRET` so the user verifies Vercel + Linear settings line up and removes the legacy fallback later.
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
