# Linear webhook health check — 09-11-26 (Step 0C)

Run **inline** by the orchestrator (not delegated), so it cost 0 of the 25 subagent slots.

## Verdict: handler code is HEALTHY. No code fix needed, no new ticket filed.

CLAUDE.md states plainly: *"The Linear-webhook-fix P0 is stale: it has been merged on
main since May; don't re-verify it."* The audit below confirms that, so no commit was
made for it and the Wave 2 ticket work was not displaced.

## Audit of `src/app/api/webhooks/linear/route.ts`

Every Step 0C check passes:

| Check | Result |
|---|---|
| Secret read from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | PASS (line 34) |
| No literal secret in source | PASS — nothing hardcoded |
| Raw body read via `await request.text()` before `JSON.parse` | PASS (line 26) |
| HMAC-SHA256 over the raw body | PASS (line 51) |
| `linear-signature` header verified | PASS (line 43, with `x-linear-signature` fallback) |
| Constant-time compare via `timingSafeEqual` | PASS (line 58), with a length guard first — `timingSafeEqual` throws on unequal lengths, so the guard is required and present |
| 200 valid / 401 invalid signature / 400 missing header | PASS |
| 200 (not 500) for unknown event types | PASS — falls through to `{ ok: true }` |
| Setup-time verification ping / empty body handled | PASS (line 29) and `url_verification` challenge echoed (line 88) |
| No secret, signature or PII logged | PASS — the handler logs nothing at all |
| App Router: exports `POST`, `dynamic = "force-dynamic"` | PASS (lines 4, 24) and `runtime = "nodejs"` for `node:crypto` |

`GET` correctly returns 405 with an `Allow: POST` header. Unit tests exist at
`src/app/api/webhooks/linear/__tests__/route.test.ts` and pass (part of tonight's green
784-test baseline).

## Vercel-side checks: NOT POSSIBLE this run

`VERCEL_TOKEN` is unset and no Vercel MCP server is attached to this session, so the
Step 0C requirements to confirm the Production env var and pull the last 50 invocations
could not be performed. Not retried, per the CLAUDE.md preflight rule. Env-var changes
are human-only from the swarm regardless.

## No new P0 ticket — three already exist

Step 0C says to file a P0 if the root cause is env configuration. **Deliberately not
done**, because that would be a fourth duplicate of work already on the board:

- **VGC-213** (P2) — "[INFRA] Verify Linear webhook delivery + re-enable in Linear settings after handler fix"
- **VGC-222** (P2) — "[INFRA] Linear webhook handler header bug fixed — re-enable in Linear settings after deploy"
- **VGC-236** (P2) — "[INFRA] Standardise on LINEAR_WEBHOOK_SIGNING_SECRET, drop the legacy LINEAR_WEBHOOK_SECRET fallback"

Comments were added to these instead. Filing more tickets about an already-fixed
handler is the exact re-discovery loop VGC-265 describes.

## Why VGC-236 was NOT implemented tonight

It looks like a one-line deletion (`?? process.env.LINEAR_WEBHOOK_SECRET`, lines 34-35),
but the ticket's own body gates it on a human step:

> **Human action required.** In Vercel -> Settings -> Environment Variables (Production):
> confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists and matches the secret on Linear's
> webhook config. ... *Then* open a PR removing the fallback.

With no Vercel visibility, removing the fallback blind would break signature
verification outright if production currently only sets the legacy `LINEAR_WEBHOOK_SECRET`
name — turning a working webhook into a 401 on every delivery. The ticket stays in
Backlog awaiting the human's env-var check.

## One observation for the human (not changed tonight)

The replay guard at lines 82-87 drops any payload whose `webhookTimestamp` is more than
60s from `Date.now()`, answering **200 + `{ignored: "stale"}`**. The 200 is deliberate
and well-reasoned in the comment (a 401 on retries is what previously drove Linear to
auto-disable the webhook).

The side effect worth knowing: if the *serverless clock skews* or Linear's delivery is
slow, events are silently discarded while Linear's dashboard shows delivery succeeding.
So "webhook looks healthy but nothing happens" is a reachable state that this endpoint
cannot distinguish from working.

That is a security-relevant trade-off (loosening the window weakens replay protection),
so the swarm did not touch it. If webhook-driven behaviour appears to do nothing despite
200s, this is the first place to look. Not ticketed to avoid adding a fourth webhook
ticket; raised here and in the PR body.
