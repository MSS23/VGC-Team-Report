# Linear webhook investigation — run 17-08-26

## VERDICT: handler code is CORRECT. The webhook is DISABLED IN LINEAR.
## Required action is a human clicking "enable" in Linear settings — not a code fix.

---

## 1. Decisive evidence — Linear's own API

Queried `{ webhooks { nodes { ... } } }` with `LINEAR_API_KEY`:

| Field | Value |
|---|---|
| id | `0a3db4d1-8592-4a16-afc8-c61acc4a3696` |
| label | Claude Code Builder Trigger |
| url | `https://pokemonvgcteamreport.com/api/webhooks/linear` |
| **enabled** | **`false`** |
| createdAt | 2026-03-27 |
| **updatedAt** | **2026-05-23T01:02:12Z** |

Linear already carried out the auto-disable it warned about — **on 23 May 2026, ~3 months ago.**
It has been off ever since. No amount of handler fixing changes anything until it is switched
back on, because Linear is not delivering to it at all.

This reframes the P0 in the routine prompt. The premise ("handler is currently failing,
Linear warns it will be auto-disabled") is out of date: the disable already happened, and
the handler defects that caused it were fixed and merged months ago.

## 2. Handler audit — `src/app/api/webhooks/linear/route.ts` — ALL CHECKS PASS

| Required check | Result |
|---|---|
| Secret from `process.env.LINEAR_WEBHOOK_SIGNING_SECRET` | PASS (`:33`), legacy `LINEAR_WEBHOOK_SECRET` fallback `:34` |
| No hardcoded secret anywhere in repo | PASS — grep over all tracked files found only env-var reads and doc mentions |
| Raw body read before JSON parse | PASS — `await request.text()` `:25`, `JSON.parse(rawBody)` only at `:60` |
| HMAC-SHA256 over raw bytes | PASS `:49-51` |
| `linear-signature` header | PASS `:40`, plus `x-linear-signature` alias |
| Constant-time compare | PASS — length check then `timingSafeEqual` `:52-57` |
| 200 valid / 401 invalid / 400 missing header | PASS |
| 200 on unknown event types | PASS — falls through to `{ok:true}` `:78` |
| Setup ping / empty body tolerated | PASS `:27-29` |
| No secret or PII logged | PASS — no logging at all in the route |
| App Router: exports POST, `force-dynamic` | PASS `:4`, plus `runtime = "nodejs"` |
| Replay protection | PASS — 60s `webhookTimestamp` window `:66-72` (VGC-274, merged to main) |

Handler is in good shape. **No code fix was required this run**, so there is no
`VGC-WEBHOOK:` commit — correctly, rather than for lack of trying.

## 3. What could NOT be checked, and why

- **Vercel env var `LINEAR_WEBHOOK_SIGNING_SECRET`** — no `VERCEL_TOKEN` and no Vercel MCP
  server in this container. Cannot confirm it exists in Production or matches Linear's config.
- **Vercel invocation logs for the route** — same reason.
- **Live probe of the deployed endpoint** — container egress policy blocks the domain:
  `curl https://pokemonvgcteamreport.com/... -> CONNECT tunnel failed, response 403`.
  Same for `vgc-team-report.vercel.app`. The Linear API host IS allowlisted; the product
  domain is not. **This is exactly VGC-255** ("Swarm container egress policy blocks every
  external data source") — now confirmed to also block verifying our own production site.
- **PostHog cross-reference** — `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` unset (VGC-220).

## 4. Why the swarm did NOT re-enable the webhook itself

`webhookUpdate(id:, input:{enabled:true})` would have flipped it via the API. Deliberately
not done: it is an outward-facing state change to an external service, and the routine
assigns re-enabling to a human. It also should not be re-enabled blind — step 2 below has
to be confirmed first, or Linear will simply auto-disable it a second time.

## 5. Human action required (in order)

1. **Vercel -> Settings -> Environment Variables (Production):** confirm
   `LINEAR_WEBHOOK_SIGNING_SECRET` exists and its value matches the signing secret shown on
   the Linear webhook config page. This is the one thing still unverified, and the most
   likely cause of the original failures.
2. **Linear -> Settings -> API -> Webhooks -> "Claude Code Builder Trigger":** set
   **enabled = true**. Nothing is delivered until this happens.
3. Save a test issue and confirm a 200 in Vercel logs.
4. Only then action **VGC-236** (drop the legacy `LINEAR_WEBHOOK_SECRET` fallback) — see below.

## 6. Existing tickets this closes out or informs

- **VGC-213** / **VGC-222** — both are "re-enable the webhook in Linear settings after the
  handler fix". Both are still open, and this run confirms they are the ONLY remaining
  blocker. They are duplicates of each other; recommend merging into one.
- **VGC-236** — drop the legacy env-var fallback. **Deliberately NOT implemented tonight.**
  The one-line change is trivial, but removing the fallback while it is unconfirmed which
  env-var name Production actually uses would break the webhook the moment it is re-enabled.
  This ticket is gated on step 1 above, exactly as its own description states. Implementing
  it blind would have been a net negative.
- **VGC-255** — egress policy. Confirmed again, and now with a second concrete cost:
  the swarm cannot verify its own production deployment.
