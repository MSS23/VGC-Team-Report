# Linear Webhook Investigation — 2026-06-11

## Handler audit (src/app/api/webhooks/linear/route.ts) — current source

✅ All previously identified fixes are now present in source code (merged in May 2026 release 5.22 / 5.20):

- Raw body via `await request.text()` BEFORE JSON parse
- Secret read from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` (legacy `LINEAR_WEBHOOK_SECRET` accepted as fallback)
- HMAC-SHA256 of raw body, hex-encoded
- Constant-time comparison via `crypto.timingSafeEqual`
- Header reads `linear-signature` (and `x-linear-signature` fallback)
- Returns 401 on missing/invalid signature; 400 on missing header; 200 otherwise
- `export const dynamic = "force-dynamic"` and `export const runtime = "nodejs"`
- Returns 200 in catch block so Linear does not auto-disable on transient errors
- Empty body handled with 200 (setup ping)
- No hardcoded secrets

## Verdict

**Handler code is correct and complete — no code change required this run.**

If webhook delivery is still failing in production, the remaining failure modes are operational:
1. Env-var mismatch — `LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production differs from the secret configured in Linear's webhook settings.
2. Webhook is auto-disabled in Linear settings (must be re-enabled manually after env fix).
3. Vercel Production has not deployed the latest main commit (handler fix must be live).

## Vercel MCP availability

Vercel MCP tools not loaded in this session — cannot programmatically confirm env-var or latest deployed commit. Surfacing as P0 ticket for human verification.

## Action this run

- No webhook code commit needed (already fixed in source).
- File P0 Linear ticket: `[INFRA] Verify Linear webhook delivery — check Vercel env var and Linear webhook re-enable status`.
- Surface in PR body and Discord notification.
