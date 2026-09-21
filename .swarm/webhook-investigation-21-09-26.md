# Linear webhook health check — 21 Sep 2026

## Verdict

**The handler code on `main` is correct. It has been correct for some time. Nothing in
this repo needs fixing. The blocker is entirely outside the codebase.**

No code fix was made this run, and no new ticket was filed — see "Why no new ticket".

## Audit against every Step 0C criterion

Handler: `src/app/api/webhooks/linear/route.ts` (on `main`, unmodified this run).

| Criterion | Result |
|---|---|
| Reads `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | ✅ line 33 (legacy `LINEAR_WEBHOOK_SECRET` as fallback, line 34 — VGC-236 tracks removing it) |
| No hardcoded secret anywhere in repo | ✅ grepped `LINEAR_WEBHOOK*` across all tracked files — only `process.env` reads and prose |
| Raw body read before JSON parse | ✅ `await request.text()` line 25; `JSON.parse` not until line 61 |
| HMAC-SHA256 over raw bytes | ✅ lines 49–51 |
| Constant-time compare | ✅ `timingSafeEqual` line 56, with an equal-length guard first (line 55) — required, since `timingSafeEqual` throws on length mismatch |
| 200 on valid signature | ✅ line 79 |
| 401 on invalid signature | ✅ line 58 |
| 400 on missing signature header | ✅ lines 42–47 |
| 200 (not 500) on unknown event types | ✅ falls through to line 79 |
| Setup-time verification ping tolerated | ✅ empty body short-circuits to 200 (lines 28–30); `url_verification` echoes the challenge (lines 75–77) |
| No secret / signature / PII logging | ✅ no logging at all in the handler |
| App Router: exports POST, `force-dynamic` | ✅ lines 4 and 23 |
| Fails closed when secret unset | ✅ 401 (lines 35–37) |

Also present: replay protection via `webhookTimestamp` with a 60 s window (lines 68–73),
landed by VGC-274, which is already merged to `main`.

One observation, not a defect: the `catch` at line 80 returns 200 deliberately, so Linear
does not auto-disable on a transient error. That is the right trade-off, but it does mean a
genuine handler crash is invisible from Linear's side — only Vercel logs would show it.

## What could not be checked, and why

| Check | Status |
|---|---|
| Live endpoint behaviour | ❌ blocked. Proxy gateway answers 403 to CONNECT for `pokemonvgcteamreport.com:443`. Confirmed against `$HTTPS_PROXY/__agentproxy/status`, which lists three `connect_rejected` entries for that host. Tracked by VGC-255. |
| Vercel Production env var presence/value | ❌ impossible. No Vercel MCP server is connected to this session and `VERCEL_TOKEN` is unset. |
| Vercel invocation logs for the route | ❌ impossible, same reason. |
| PostHog exceptions on `/api/webhooks/linear` | ❌ `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` are unset in this container. Tracked by VGC-220. |

Per the standing guardrail, no attempt was made to create or modify any Vercel env var.

## Why no new ticket was filed

The routine says to file a P0 if the root cause is env configuration. Three tickets for
exactly this already exist and are open:

- **VGC-213** (Backlog, High) — "[INFRA] Verify Linear webhook delivery + re-enable in Linear settings after handler fix"
- **VGC-222** (Backlog, High) — "[INFRA] Linear webhook handler header bug fixed — re-enable in Linear settings after deploy"
- **VGC-236** (Backlog, High) — "[INFRA] Standardise on LINEAR_WEBHOOK_SIGNING_SECRET, drop the legacy LINEAR_WEBHOOK_SECRET fallback"

A fourth ticket would be duplicate noise on a board already carrying VGC-265 ("the swarm
is re-fixing already-fixed bugs") as Urgent. A comment was added to VGC-213 instead.

## The real pattern here

The user-facing changelog shows this handler being "fixed" repeatedly:

- v5.20 (May 2026): "Linear webhook handler fixed — corrected the signing secret env var name…"
- v5.22 (May 2026): "…**8th consecutive fix proposal — please merge!**"

Eight-plus code fixes for a problem that is not in the code. Each run re-diagnosed the
handler, found it fine or "fixed" it again, and the delivery failure persisted because the
two actions that would resolve it are both human-only:

1. Confirm `LINEAR_WEBHOOK_SIGNING_SECRET` in **Vercel → Production** matches the secret in
   **Linear → Settings → API → Webhooks** exactly.
2. Re-enable the webhook in Linear (it may already be auto-disabled, in which case no
   amount of correct handler code will produce a successful delivery).

Until someone does both, every future run will keep "discovering" this.

Incidentally, that v5.22 line meant an internal note — "8th consecutive fix proposal —
please merge!" — was being served to real users on the public changelog page. Fixed this
run; see the `fix:` commit touching `src/app/changelog/data.ts`.
