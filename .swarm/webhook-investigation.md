# Linear Webhook Investigation — 2026-06-01

## Handler location

`src/app/api/webhooks/linear/route.ts` (App Router, Node runtime, force-dynamic).

## Code audit — every check PASSES (no fix needed)

| Check | Result |
| --- | --- |
| Reads signing secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ (with legacy `LINEAR_WEBHOOK_SECRET` fallback) |
| Reads raw body via `await request.text()` before parsing JSON | ✅ |
| Computes HMAC-SHA256 over the raw bytes | ✅ |
| Compares via `crypto.timingSafeEqual` (constant-time, not `===`) | ✅ |
| Length-check before timingSafeEqual (prevents RangeError) | ✅ |
| Reads `linear-signature` header (with `x-linear-signature` fallback) | ✅ |
| 400 on missing signature | ✅ |
| 401 on missing secret / invalid signature | ✅ |
| 200 on valid signature (including unknown event types) | ✅ |
| Empty-body setup ping returns 200 without throwing | ✅ |
| Catch-all returns 200 (prevents Linear auto-disable on transient errors) | ✅ |
| `export const dynamic = 'force-dynamic'` set | ✅ |
| `export const runtime = 'nodejs'` (needed for crypto) | ✅ |
| No hardcoded secret in source | ✅ |
| No PII / secret logging | ✅ |

## Root-cause conclusion: env-var configuration, not code

The handler implementation matches every requirement in Step 0C of the orchestrator
prompt and has been re-derived/re-shipped in **eight** previous swarm runs (see
`src/app/changelog/data.ts` versions 5.20 and 5.22). If delivery is still failing,
the residual cause is one of:

1. **`LINEAR_WEBHOOK_SIGNING_SECRET` in Vercel Production does not match the secret
   value Linear shows in the webhook settings UI.** Most likely cause given the
   repeat-fix pattern.
2. **Linear's webhook is configured to send to a stale Vercel preview URL** instead
   of the production alias.
3. **The Vercel deployment that contains the fixed handler is not yet the production
   alias** (the fix was committed but not deployed, or the production alias is
   pinned to a stale deployment that pre-dates the env-var rename).

None of these are fixable from inside the swarm — they require human action in the
Vercel and Linear dashboards.

## What the swarm is doing about it this run

1. NOT applying a ninth no-op code "fix" — the code is correct.
2. Filing a Linear Backlog ticket draft at `.swarm/drafts/linear-tickets-to-file.md`
   tagged `auto-research` + `infra` + P0, with the title:
   `[INFRA] Linear webhook still failing — verify LINEAR_WEBHOOK_SIGNING_SECRET in Vercel matches Linear`.
3. Calling this out at the TOP of the PR body and the Discord-notification draft so
   the human sees it on waking.
4. NOT modifying any env vars from the swarm (out of scope per guardrails).

## Vercel MCP status

The orchestrator prompt mentions a Vercel MCP for log/env inspection. No Vercel MCP
tool is exposed to this run (none surfaced by ToolSearch under vercel/mcp queries).
Vercel verification therefore stays in the human's court.

## Verification checklist for the human (paste into Vercel dashboard tab)

- [ ] Open Vercel → Project → Settings → Environment Variables → Production.
- [ ] Confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists, is not empty, and is not a
      placeholder.
- [ ] In Linear → Settings → API → Webhooks → "pokemonvgcteamreport.com" webhook,
      copy the **Signing secret** field exactly.
- [ ] Compare with the Vercel value byte-for-byte (no leading/trailing whitespace,
      no smart quotes from copy-paste).
- [ ] Redeploy production (env-var changes only apply to the next deployment).
- [ ] Linear → Webhooks → click "Resend" on a recent failed delivery, confirm 200.
- [ ] Re-enable the webhook if Linear has auto-disabled it.

## Webhook health field for PR body + Discord

`⚠️ env-var mismatch — Vercel update required (no code fix this run, see ticket in PR body)`
