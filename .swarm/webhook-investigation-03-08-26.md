# Linear webhook health check — 03 Aug 2026 (Step 0C)

## Verdict: ✅ HEALTHY IN CODE — no fix required this run.

`CLAUDE.md` states the Linear-webhook-fix P0 is stale ("merged on main since May; don't
re-verify it"). A code audit of `src/app/api/webhooks/linear/route.ts` confirms this.
Every criterion in the routine's Step 0C audit list passes:

| Check | Result |
|---|---|
| Secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ (line 33, legacy `LINEAR_WEBHOOK_SECRET` accepted as fallback) |
| No literal secret in source | ✅ none found |
| Raw body read via `await request.text()` before JSON parse | ✅ line 25 |
| HMAC-SHA256 over raw bytes, hex | ✅ lines 49–51 |
| Constant-time compare (`timingSafeEqual`, not `===`) | ✅ lines 52–57, with length pre-check (timingSafeEqual throws on length mismatch) |
| 200 on valid signature | ✅ line 67 |
| 401 on invalid signature | ✅ line 58 |
| 400 on missing signature header | ✅ lines 42–47 |
| 200 (not 500) for unknown event types | ✅ line 67 falls through for any `body.type` |
| Setup-time verification ping tolerated | ✅ lines 27–30 (empty body → 200); `url_verification` challenge echoed, line 63 |
| No secret / signature / PII logging | ✅ no logging at all in the handler |
| App Router: exports POST, `dynamic = 'force-dynamic'` | ✅ lines 4, 23 |

Bonus: the catch block returns 200 deliberately so a transient error cannot cause Linear to
auto-disable the webhook. `GET` returns 405 with an `Allow: POST` header.

## Env-var / Vercel status: NOT VERIFIABLE THIS RUN
Vercel MCP is not connected in this container, so `LINEAR_WEBHOOK_SIGNING_SECRET` could not be
inspected in the Production environment. Per the routine, the swarm never sets env vars itself.

**No new P0 ticket filed — this is already tracked three times over:**
- **VGC-213** [INFRA] Verify Linear webhook delivery + re-enable in Linear settings after handler fix
- **VGC-222** [INFRA] Linear webhook handler header bug fixed — re-enable in Linear settings
- **VGC-236** [INFRA] Standardise on `LINEAR_WEBHOOK_SIGNING_SECRET`, drop the legacy fallback

Filing a fourth would add noise to a board this run is meant to drain.

## Human action still outstanding
1. Re-enable the webhook in Linear settings (it may have been auto-disabled before the fix landed).
2. Confirm Vercel Production has `LINEAR_WEBHOOK_SIGNING_SECRET` set and matching Linear's config.
3. Only after (2): VGC-236 removes the legacy `LINEAR_WEBHOOK_SECRET` fallback. **Deliberately NOT
   done this run** — dropping the fallback before confirming the canonical var exists in Vercel
   would break the webhook in production. That ordering is stated in the ticket itself.
