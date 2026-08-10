# Linear Webhook Health Check — 2026-08-10

## Verdict: handler code is CORRECT and the fix is already on `main`. No code change needed this run.

`git diff origin/main -- src/app/api/webhooks/linear/route.ts` is empty, so the
handler on main is the audited version below. This is the same conclusion as
previous runs — the code fix landed; what remains is env/config verification,
which requires human action in Vercel + Linear settings.

## Step 0C audit checklist vs `src/app/api/webhooks/linear/route.ts`

| Check | Result |
|---|---|
| Reads secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | PASS (line 33; legacy `LINEAR_WEBHOOK_SECRET` accepted as fallback, line 34) |
| No literal secret in source | PASS — no hardcoded secret anywhere in repo |
| Raw body read via `await request.text()` before JSON parse | PASS (line 25; `JSON.parse` only at line 61, after HMAC) |
| HMAC-SHA256 over raw bytes | PASS (lines 49-51) |
| `linear-signature` header | PASS (line 40; `x-linear-signature` also accepted) |
| Constant-time compare via `timingSafeEqual` | PASS (lines 52-57, with a length guard so it cannot throw) |
| 200 on valid signature | PASS (line 67) |
| 401 on invalid signature | PASS (line 58) |
| 400 on missing header | PASS (lines 42-47) |
| 200 (not 500) on unknown event types | PASS — falls through to `{ ok: true }` at line 67 |
| Setup-time verification ping / empty body handled | PASS (lines 27-30) and `url_verification` challenge echoed (lines 63-65) |
| No secret / signature / PII logged | PASS — route logs nothing at all |
| App Router `POST` export + `force-dynamic` | PASS (lines 4, 23) |

One deliberate design note: the `catch` returns 200 rather than 500 so a
transient error cannot cause Linear to auto-disable the webhook. That is
intentional and documented in the route's own docblock.

## What could NOT be verified this run

- **Vercel env vars** — no `VERCEL_TOKEN` in the container and no Vercel MCP
  server connected. Cannot confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists in
  the Production environment or that its value matches Linear's webhook config.
- **Recent invocation logs** — same reason (no Vercel access).
- **Live probe of the endpoint** — the container's egress proxy blocks
  `pokemonvgcteamreport.com` (`EGRESS_BLOCKED`). See VGC-255.
- **PostHog cross-reference** — `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` are not
  set in this container. See VGC-220.

## Existing tickets already covering the remaining work — no duplicates filed

- **VGC-213** (P2) `[INFRA] Verify Linear webhook delivery + re-enable in Linear settings after handler fix`
- **VGC-222** (P2) `[INFRA] Linear webhook handler header bug fixed — re-enable in Linear settings`
- **VGC-236** (P2) `[INFRA] Standardise on LINEAR_WEBHOOK_SIGNING_SECRET, drop the legacy LINEAR_WEBHOOK_SECRET`

## Deliberately NOT actioned: VGC-236

VGC-236 asks to drop the legacy `LINEAR_WEBHOOK_SECRET` fallback. The swarm is
NOT doing that this run. The ticket's own description gates it on "once the user
has confirmed via Vercel that the env var is set under the SIGNING_SECRET name".
Since Vercel is unreachable from this container, removing the fallback could
silently break a currently-working webhook if Production is still configured
under the legacy name. Left for a run (or a human) that can read Vercel env.

## Human action required

1. In Vercel → Production env, confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists and
   matches the signing secret shown in Linear's webhook settings.
2. In Linear → Settings → API → Webhooks, re-enable the webhook if Linear has
   auto-disabled it, then trigger any issue event and confirm a 200.
3. Then close VGC-213 / VGC-222, and VGC-236 becomes safe to action.
