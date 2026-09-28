# Linear webhook investigation — 28 Sep 2026

Endpoint: `https://pokemonvgcteamreport.com/api/webhooks/linear`
Handler: `src/app/api/webhooks/linear/route.ts`

## Step 0C audit checklist — handler code is otherwise CORRECT

| Check | Result |
|---|---|
| Secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | PASS (legacy `LINEAR_WEBHOOK_SECRET` accepted as fallback) |
| No hardcoded secret in source | PASS — no literal secret anywhere in repo |
| Raw body read before JSON parse (`await request.text()`) | PASS — HMAC computed over raw string |
| `linear-signature` verified, HMAC-SHA256 hex | PASS |
| Constant-time compare (`timingSafeEqual`) | PASS — with a length guard first (required; timingSafeEqual throws on length mismatch) |
| 200 valid / 401 invalid / 400 missing header | PASS |
| 200 (not 500) for unknown event types | PASS — falls through to `{ok:true}` |
| Setup-time verification ping tolerated | PASS — empty body returns 200 early |
| No secret/signature/PII logged | PASS — handler does not log at all |
| App Router: exports POST, `dynamic = 'force-dynamic'` | PASS — also pins `runtime = "nodejs"` (needed for node:crypto) |

## ROOT CAUSE FOUND — in code, not env config

Commit `a099f97` (VGC-274, 13 Aug 2026) is the ONLY change to this route since
July. It added replay protection:

```ts
if (typeof body.webhookTimestamp === "number") {
  const ageMs = Math.abs(Date.now() - body.webhookTimestamp);
  if (ageMs > 60_000) {
    return NextResponse.json({ error: "Stale webhook" }, { status: 401 });
  }
}
```

The freshness check itself is reasonable. Returning **401** for it is the defect,
and it creates a self-sustaining failure loop:

1. A delivery fails once for any transient reason (cold start, deploy, blip).
2. Linear retries with **backoff** — minutes later.
3. The retry carries the ORIGINAL `webhookTimestamp`, so it is now far outside
   the 60s window -> 401.
4. Linear counts 401 as another delivery failure and retries again, staler still.
5. Every subsequent retry is guaranteed to fail. Failure count climbs
   monotonically -> Linear warns, then auto-disables the webhook.

So a single transient blip becomes permanent failure. This matches the reported
symptom exactly: "repeated delivery failures" plus an auto-disable warning.

Note the handler already returns 200 from its catch block *specifically* to avoid
auto-disable — the stale branch bypasses that intent.

## Fix applied

Return **200** for a stale payload while still refusing to process it. The
security intent of replay protection is the early return (don't act on the
payload); the HTTP status only tells Linear whether to retry, and a replayed
payload can never become fresh, so retrying is pointless. This handler mutates no
state, so acknowledging and dropping is strictly safe. If it ever does mutate
state, the early return still blocks the replay — the status code is orthogonal.

Regression test added at
`src/app/api/webhooks/linear/__tests__/route.test.ts`, naming the bug.

## Could NOT verify (no access this run)
- `LINEAR_WEBHOOK_SIGNING_SECRET` presence/value in Vercel Production:
  **no VERCEL_TOKEN and no Vercel MCP in this session.** Not attempted — env-var
  changes are human-only by guardrail.
- Recent invocation logs / status-code distribution: same reason.
- PostHog exception cross-reference: POSTHOG_API_KEY + POSTHOG_PROJECT_ID absent.

If failures persist AFTER this fix ships, the secret mismatch is the next
hypothesis — a wrong secret yields a uniform 401 wall on first delivery, which
the fix above does not address. Verification ticket filed for the human.
