# Linear Webhook Investigation — 27 May 2026

## Handler location
`src/app/api/webhooks/linear/route.ts`

## Bugs found and fixed

1. **Wrong env var name**: `LINEAR_WEBHOOK_SECRET` → now tries `LINEAR_WEBHOOK_SIGNING_SECRET` first, falls back to legacy `LINEAR_WEBHOOK_SECRET`
2. **Wrong header name**: `x-linear-signature` → corrected to `linear-signature` (Linear's actual header)
3. **500 on errors**: catch block returned HTTP 500, which causes Linear to mark webhook as failing → now returns 200 to prevent auto-disable
4. **Missing `force-dynamic`**: Next.js App Router could statically optimize the route → added `export const dynamic = "force-dynamic"`
5. **No empty body handling**: Linear setup pings may send empty body → now returns 200
6. **No GET handler**: Added GET → 405 with Allow header

## Root cause of Linear's delivery failures
The header name mismatch (`x-linear-signature` vs `linear-signature`) caused every delivery to return 401. Linear's retry policy eventually flagged the webhook for auto-disable.

## Human action required
- Verify `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production env matches the secret configured in Linear's webhook settings
- Re-enable the webhook in Linear settings if it was auto-disabled
- This has been the P0 fix in the last 6 nightly runs (PRs #35-#47) but none were merged
