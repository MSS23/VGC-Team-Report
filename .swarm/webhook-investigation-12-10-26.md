# Step 0C — Linear webhook health check, 12 Oct 2026

Endpoint: `https://pokemonvgcteamreport.com/api/webhooks/linear`
Handler:  `src/app/api/webhooks/linear/route.ts`

## Verdict

**Handler code is HEALTHY.** Every item on the Step 0C audit checklist passes on `main`
as of `534a59b`. No code fix was required or made to the signature path this run.

| Check | Result |
|---|---|
| Secret read from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ (line 33, with legacy `LINEAR_WEBHOOK_SECRET` fallback on line 34) |
| No literal secret anywhere in source | ✅ (verified by grep across `src/` and `public/`) |
| Raw body read before JSON parse (`await request.text()`) | ✅ (line 25) — HMAC is over raw bytes, `JSON.parse` only afterwards (line 61) |
| `linear-signature` header, HMAC-SHA256, hex | ✅ (lines 39-51); also accepts legacy `x-linear-signature` |
| Constant-time compare via `crypto.timingSafeEqual` | ✅ (lines 52-57), with the required length pre-check |
| 200 valid / 401 invalid / 400 missing header | ✅ |
| 200 (not 500) for unknown event types | ✅ (line 79 catch-all `{ ok: true }`) |
| Setup-time verification ping tolerated | ✅ empty body → 200 (lines 27-30); `url_verification` challenge echoed (lines 75-77) |
| No secret / signature / PII logged | ✅ nothing is logged at all — which is itself the VGC-299 finding, below |
| App Router: exports `POST`, `dynamic = "force-dynamic"` | ✅ (lines 4, 23); also `runtime = "nodejs"` (line 6), required for `node:crypto` |

Bonus hardening already present: replay protection rejects payloads whose
`webhookTimestamp` is outside a 60s window (lines 68-73).

## So why were deliveries failing?

The original root cause was **already fixed and is already on `main`**: the handler used
to read only `x-linear-signature` while Linear sends `linear-signature`, so every
legitimate delivery 401'd. Fixed in `f2121c3`, and that fix is present in the current
`main` working tree.

What remains is **not a code problem** — it is the two human steps tracked on
**VGC-213** (P2, Backlog):

1. The webhook was very likely **auto-disabled by Linear** while it was broken. A human
   must re-enable it in Linear → Settings → API → Webhooks and press "Send test".
2. Confirm the Vercel Production env var holding the signing secret matches the secret in
   Linear's webhook config. Either env-var name works (the handler accepts both), so no
   rename is required for correctness.

## What this run could NOT check, and why

- **Vercel env vars** — no Vercel MCP server is connected to this session and no
  `VERCEL_TOKEN` is in the container. `LINEAR_WEBHOOK_SIGNING_SECRET` could not be read,
  so "present / empty / placeholder-shaped" is unverified. Per the guardrail, no attempt
  was made to set or modify any env var.
- **Last 50 invocations / runtime logs** — same reason: Vercel is unreachable.
- **PostHog cross-reference for `/api/webhooks/linear` errors** — `POSTHOG_API_KEY` and
  `POSTHOG_PROJECT_ID` are absent from the container (tracked as VGC-220).

## Tickets — no new ticket filed

Deliberately **no new P0 ticket**. The env-config follow-up is already covered three
times over and a fourth would be noise on a board that VGC-265 already flags as
over-full:

- **VGC-213** (P2) — verify delivery + re-enable in Linear settings after handler fix.
- **VGC-222** (P2) — header bug fixed, re-enable in Linear settings.
- **VGC-236** (P2) — standardise on `LINEAR_WEBHOOK_SIGNING_SECRET`, drop the legacy name.

A comment was added to VGC-213 recording this run's re-verification instead.

## One real code finding, fixed this run

**VGC-299 part 1.** The handler's final `catch { return 200 }` (lines 80-83) discards the
error entirely. Returning 200 is correct and should stay — it stops Linear auto-disabling
the webhook on a transient error — but swallowing the error silently means a genuine
handler crash is indistinguishable from success in both Vercel logs and PostHog. Fixed by
logging the caught error before returning 200.
