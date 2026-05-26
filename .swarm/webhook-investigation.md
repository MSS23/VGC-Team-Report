# Linear Webhook Investigation — 2026-05-26

## Handler location
`src/app/api/webhooks/linear/route.ts`

## Issues found and fixed

### 1. Wrong env var name (CRITICAL)
- **Was:** `process.env.LINEAR_WEBHOOK_SECRET`
- **Fixed to:** `process.env.LINEAR_WEBHOOK_SIGNING_SECRET`
- **Impact:** If the Vercel env var is set as `LINEAR_WEBHOOK_SIGNING_SECRET` (per convention), the handler would always return 401 because it couldn't find the secret.

### 2. Wrong signature header name (CRITICAL)
- **Was:** `x-linear-signature`
- **Fixed to:** `linear-signature`
- **Impact:** Linear sends the HMAC in the `linear-signature` header. The handler was looking for `x-linear-signature`, which would never be present, causing all requests to fail with 401 (missing signature).

### 3. Missing `force-dynamic` export
- **Was:** No dynamic export
- **Fixed to:** `export const dynamic = "force-dynamic"`
- **Impact:** Next.js App Router could potentially cache or statically optimize the route, which would break webhook handling.

### 4. Missing empty body handling
- **Was:** No handling for empty/null body (Linear verification ping)
- **Fixed to:** Returns 200 for empty body requests
- **Impact:** Linear's initial setup ping could have caused a crash.

### 5. Error handling returned 500
- **Was:** catch block returned 500 status
- **Fixed to:** catch block returns 200
- **Impact:** Linear counts 500s as failures. Unknown event types or malformed payloads should acknowledge receipt, not error.

### 6. Missing signature returned wrong status
- **Was:** Missing `linear-signature` header returned 401
- **Fixed to:** Returns 400 (bad request) for missing header, 401 for invalid signature

## Env var verification needed (HUMAN ACTION REQUIRED)
- The handler now reads `LINEAR_WEBHOOK_SIGNING_SECRET` from `process.env`
- **User must verify** in Vercel Dashboard → Settings → Environment Variables that:
  1. `LINEAR_WEBHOOK_SIGNING_SECRET` exists for Production environment
  2. Its value matches the signing secret configured in Linear's webhook settings
- If the old env var name was `LINEAR_WEBHOOK_SECRET`, it should be renamed to `LINEAR_WEBHOOK_SIGNING_SECRET`
- After the code fix is deployed, the user should re-enable the webhook in Linear settings if it was auto-disabled
