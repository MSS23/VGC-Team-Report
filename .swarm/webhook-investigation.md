# Linear webhook health check — 22 June 2026

## Handler location
`src/app/api/webhooks/linear/route.ts`

## Code audit — all checks PASS
- ✅ Reads `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (with legacy `LINEAR_WEBHOOK_SECRET` fallback)
- ✅ Reads raw request body via `await request.text()` BEFORE JSON parse
- ✅ HMAC-SHA256 over raw bytes
- ✅ Uses `crypto.timingSafeEqual` for constant-time comparison
- ✅ Returns 200 on valid signature, 401 on invalid, 400 on missing header
- ✅ Returns 200 in catch block (so transient errors don't trigger Linear auto-disable)
- ✅ Handles empty-body setup ping (returns `{ ok: true }`)
- ✅ Has `export const dynamic = "force-dynamic"`
- ✅ Has `export const runtime = "nodejs"`
- ✅ No hardcoded secrets in source
- ✅ Reads `linear-signature` header (with legacy `x-linear-signature` fallback)
- ✅ Handles `url_verification` event type

## Verdict
Handler code is correct as of this run. The prior 8 swarm runs already corrected:
- Wrong env var name (`LINEAR_WEBHOOK_SECRET` → `LINEAR_WEBHOOK_SIGNING_SECRET`, with fallback)
- Wrong signature header (`x-linear-signature` → `linear-signature`, with fallback)
- Missing `force-dynamic`
- Empty body / setup ping crash

If Linear is still reporting failures, the root cause is environment configuration on Vercel, NOT code. The swarm cannot fix env vars from inside Vercel — human action required.

## Recommended human actions
1. Verify `LINEAR_WEBHOOK_SIGNING_SECRET` is set in Vercel Production environment.
2. Verify it exactly matches the signing secret configured in Linear's webhook settings for `https://pokemonvgcteamreport.com/api/webhooks/linear`.
3. Check Vercel function logs for the webhook route — 401 = wrong secret, 400 = missing signature header, 500 = uncaught handler crash (catch block should prevent).
4. After verification, re-enable the webhook in Linear settings.
5. **Merge prior nightly PRs.** The webhook fix has shipped 8 times in code but the PRs were not merged to main — verify `swarm-nightly-2026-06-22` (and prior) PRs get merged so the fix actually deploys.

## PostHog cross-reference
Skipped — no `POSTHOG_API_KEY` in this swarm environment.

## Budget impact
0 subagent dispatches used (audit run inline).
