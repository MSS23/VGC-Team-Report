# Linear Webhook Health Check — 2026-05-31

## Status

**Handler code is fully fixed and merged.** All five root causes identified in prior runs (env var name, header name, force-dynamic, 200-on-error, empty-body ping) are present in `src/app/api/webhooks/linear/route.ts` on `main` today. Verified by inline audit below.

## Handler audit (`src/app/api/webhooks/linear/route.ts`)

| Check | Status | Line |
|---|---|---|
| Reads `LINEAR_WEBHOOK_SIGNING_SECRET` env var (with legacy fallback) | ✅ | 32-34 |
| No hardcoded secret in source | ✅ | grep clean |
| Reads raw body via `request.text()` before JSON parse | ✅ | 25 |
| HMAC computed over raw bytes | ✅ | 49-51 |
| `timingSafeEqual` constant-time compare | ✅ | 56 |
| Accepts both `linear-signature` and `x-linear-signature` headers | ✅ | 40-41 |
| Returns 200 on valid signature | ✅ | 67 |
| Returns 401 on invalid signature / missing secret | ✅ | 36, 58 |
| Returns 400 on missing signature header | ✅ | 42-46 |
| Returns 200 on unknown event types | ✅ | falls through |
| Handles setup-time empty-body ping | ✅ | 28-30 |
| Catch-all returns 200 (no auto-disable on transient) | ✅ | 68-71 |
| `export const dynamic = "force-dynamic"` | ✅ | 4 |
| `runtime = "nodejs"` (HMAC needs Node, not Edge) | ✅ | 6 |
| No secret/signature/PII in logs | ✅ | no `console.log` |

## Verdict

**No code fix required tonight.** Root cause of any remaining delivery failures must be env-var configuration:

- `LINEAR_WEBHOOK_SIGNING_SECRET` missing from Vercel Production env → handler returns 401 on every delivery
- OR value in Vercel does not match the secret in Linear's webhook settings → signature mismatch → 401

Either case looks identical from Linear's side: 401 → retry → auto-disable threshold reached.

## Action required (human, via Vercel/Linear dashboards)

1. Vercel → VGC Team Report → Settings → Environment Variables → confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists for **Production**.
2. Linear → Settings → API → Webhooks → VGC webhook → copy signing secret.
3. Verify the two values match exactly (no whitespace).
4. If env var was changed: trigger a redeploy (Vercel does not redeploy on env-var-only change).
5. Re-enable the webhook in Linear if it was auto-disabled.
6. Test by triggering an issue event in Linear and watching Vercel function logs for a 200.

## Vercel introspection

Vercel MCP unavailable in this run. Cannot pull runtime logs to confirm which 401 variant occurred. The fix path is identical either way → ticket below.

## Ticket to file

Draft P0 ticket added to `.swarm/new-tickets-to-file.md` under "INFRA / webhook env-var verification". No code commit on the nightly branch (no code fix needed); this is human-action-only.
