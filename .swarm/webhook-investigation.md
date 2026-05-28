# Linear Webhook Investigation — 2026-05-28

## Root causes found (same as prior 7 runs — no PR has been merged):

1. **Wrong env var name**: `LINEAR_WEBHOOK_SECRET` → should be `LINEAR_WEBHOOK_SIGNING_SECRET`
   - Fix: accept both via `??` fallback for backward compat
2. **Wrong signature header**: `x-linear-signature` → Linear sends `linear-signature`
   - Fix: check `linear-signature` first, fall back to `x-linear-signature`
3. **Missing `force-dynamic`**: Next.js App Router may cache/static-optimize the route
   - Fix: added `export const dynamic = "force-dynamic"`
4. **500 on errors**: catch block returned 500, which causes Linear to retry and eventually auto-disable
   - Fix: return 200 in catch block — acknowledge receipt even if processing fails
5. **No empty body handling**: Linear setup ping may send empty body
   - Fix: return 200 immediately for empty bodies

## Env var status:
- No `.env.local` in this container — cannot verify Vercel Production has the correct secret
- **Human action required**: verify `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production matches Linear webhook config
- After merge + deploy: re-enable webhook in Linear settings if auto-disabled

## Note:
This is the 8th consecutive nightly run proposing this fix. None of the previous PRs (35-48) have been merged.
