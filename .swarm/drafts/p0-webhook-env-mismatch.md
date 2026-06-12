# [INFRA-P0] Linear webhook signing secret mismatch — verify Vercel env var

**Priority:** Urgent (P0)
**Labels:** infra, auto-research

## Context

Linear has reported repeated webhook delivery failures to `https://pokemonvgcteamreport.com/api/webhooks/linear` and warned the webhook will be auto-disabled. The swarm investigated the handler code (`src/app/api/webhooks/linear/route.ts`) and confirmed it is correct: raw-body HMAC-SHA256, timing-safe compare, `LINEAR_WEBHOOK_SIGNING_SECRET` env var, proper error handling.

## Required human action

1. In **Vercel → Project Settings → Environment Variables** (Production env), confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists and is non-empty.
2. In **Linear → Settings → API → Webhooks**, copy the signing secret for the webhook pointed at `https://pokemonvgcteamreport.com/api/webhooks/linear`.
3. Ensure the two values match **exactly** (no trailing whitespace, no quotes).
4. Trigger a redeploy on Vercel (env-var changes don't apply until next deploy).
5. In Linear's webhook UI, re-enable the webhook and click "Test" to verify a 200 is returned.

## Verification

After updating, watch the Vercel function logs for `/api/webhooks/linear`. A healthy delivery returns 200. A bad secret returns 401.

## Background

Handler code passed Step 0C audit on 12-06-2026 — see `.swarm/webhook-investigation.md` for the full review.
