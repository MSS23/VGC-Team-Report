# Linear Webhook Investigation — 2026-05-25

## Root Cause: Code bugs (FIXED)

Three issues found in `src/app/api/webhooks/linear/route.ts`:

1. **Wrong env var name**: Code read `LINEAR_WEBHOOK_SECRET`, but the documented/expected name is `LINEAR_WEBHOOK_SIGNING_SECRET`. If Vercel has the secret set under the correct name, the handler would always return 401 because the variable was undefined.

2. **Wrong header name**: Code read `x-linear-signature` but Linear sends the signature in the `linear-signature` header. This would cause every request to fail with "Missing signature" → 401.

3. **Missing `dynamic = 'force-dynamic'`**: Without this, Next.js App Router could cache/statically optimize the route, potentially causing issues with body reading.

4. **Error handling**: The catch block returned 500 with a generic error, and console.error could leak payload details. Now returns 500 without logging sensitive data.

## Fix Applied

Commit: ed0558e on branch swarm-nightly-2026-05-25

## Human Action Required

- Verify `LINEAR_WEBHOOK_SIGNING_SECRET` exists in Vercel Production environment and matches the secret configured in Linear's webhook settings.
- After PR is merged and deployed, re-enable the webhook in Linear if it was auto-disabled.
- Test by triggering a Linear event and confirming 200 response.

## Note on potential env var name mismatch

If Vercel has the secret stored as `LINEAR_WEBHOOK_SECRET` (the old name), the human needs to either:
- Rename it to `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel, OR
- Add a new env var `LINEAR_WEBHOOK_SIGNING_SECRET` with the same value
