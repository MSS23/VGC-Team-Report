# Linear webhook health check — 14 Sep 2026

Endpoint: https://pokemonvgcteamreport.com/api/webhooks/linear
Handler:  src/app/api/webhooks/linear/route.ts

## Verdict: handler CODE IS CORRECT. Root cause NOT confirmable this run.

## 1. Code audit — every Step 0C criterion PASSES
| Check | Result | Evidence |
|---|---|---|
| Secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | PASS | route.ts:32-34 (legacy `LINEAR_WEBHOOK_SECRET` accepted as fallback) |
| No hardcoded secret in source | PASS | only `process.env` reads |
| Raw body read before JSON.parse | PASS | `await request.text()` route.ts:25; `JSON.parse(rawBody)` not until :61 |
| HMAC-SHA256 over raw bytes | PASS | route.ts:49-51 |
| Constant-time comparison | PASS | `timingSafeEqual` + length guard, route.ts:52-57 |
| 200 valid / 401 invalid / 400 missing header | PASS | :29 / :58 / :43 |
| 200 for unknown event types | PASS | falls through to `{ok:true}` :79 |
| Setup-time verification ping tolerated | PASS | empty-body short-circuit :28 |
| No secret/PII logging | PASS | no log statements at all |
| App Router: exports POST + force-dynamic | PASS | :4, :23 |

## 2. Live verification — IMPOSSIBLE THIS RUN
GET/POST probes to the endpoint returned `http=000`:
  curl: (56) CONNECT tunnel failed, response 403
Agent-proxy status confirms `connect_rejected ... policy denial` for
`pokemonvgcteamreport.com:443`. Same for vgc-team-report.vercel.app.

This is the CONTAINER'S EGRESS POLICY, not a site outage. Do not read it as
"production is down" — this run has no evidence either way.
(Already tracked as VGC-255 "[INFRA] Swarm container egress policy blocks
every external data source", P1, filed 03-08-26 and still open.)

## 3. Vercel env var — UNVERIFIABLE
No VERCEL_TOKEN and no Vercel MCP in this session. Cannot confirm whether
`LINEAR_WEBHOOK_SIGNING_SECRET` exists in Production, nor read invocation logs.

## 4. PostHog cross-reference — UNAVAILABLE
POSTHOG_API_KEY / POSTHOG_PROJECT_ID absent. (Tracked as VGC-220.)

## 5. Leading hypothesis (UNCONFIRMED — do not treat as diagnosis)
Commit a099f97 "VGC-274: Linear webhook replay window" added a 60s
`webhookTimestamp` staleness check (route.ts:68-73) that returns 401.

Linear RETRIES failed deliveries carrying the ORIGINAL signed payload — so the
original `webhookTimestamp` is replayed. Any retry arriving >60s after the first
attempt is therefore guaranteed to 401 on staleness, regardless of whether the
signature is valid. That converts a single transient failure into a permanent
failure loop, which is consistent with "repeated delivery failures ->
Linear threatens auto-disable".

NOT changed tonight, deliberately:
- The window is a legitimate security control (VGC-274 added it on purpose).
- Without log access the hypothesis is unverified; a speculative loosening of a
  security check on an unattended run is the wrong trade.
- The fix, if confirmed, is narrow: exempt retries, or widen the window, or
  dedupe on delivery id instead of timestamp.

## 6. Why VGC-236 was NOT implemented tonight
VGC-236 asks to "standardise on LINEAR_WEBHOOK_SIGNING_SECRET, drop the legacy
LINEAR_WEBHOOK_SECRET". Dropping the fallback while we CANNOT read the Vercel
env config risks removing the only env var name production actually sets —
which would take the webhook from intermittently failing to failing 100%
(401 at route.ts:35-37). Blocked on human confirmation of the Vercel value.

## 7. Recommended human actions (in order)
1. Confirm `LINEAR_WEBHOOK_SIGNING_SECRET` exists in Vercel Production and
   matches the secret in Linear's webhook settings.
2. Pull the last 50 invocations of /api/webhooks/linear and check the status
   mix: all-401 => secret mismatch OR the staleness hypothesis in §5;
   all-500 => handler crash; all-400 => header name.
3. If 401s correlate with retries, fix the replay window per §5.
4. Then re-enable the webhook in Linear (tracked by VGC-213 / VGC-222).

## 8. No new ticket filed
VGC-213, VGC-222, VGC-236 and VGC-255 already cover this area. Filing another
would add noise to a backlog that already carries 46 auto-research tickets.
Existing tickets were updated with these findings instead.
