# PostHog data pull — 02-11-26

**Status: ❌ UNAVAILABLE. No data pulled. Run continued as instructed.**

Two independent blockers:

1. **Credentials absent.** Neither `POSTHOG_API_KEY` nor `POSTHOG_PROJECT_ID` is
   present in the container environment. The container injects only
   `LINEAR_API_KEY` and `DISCORD_BUILDS_WEBHOOK`.
2. **Egress blocked.** `app.posthog.com:443` is refused by the agent proxy gateway
   with `403 to CONNECT (policy denial)`. Even with credentials the API would be
   unreachable from this container.

Therefore, for this run:
- No error-event ranking, rage-click list, funnel drop-off, route popularity or
  survey data was available.
- No PostHog context could be passed to R3/R5/C4/C5 (the agents that would have
  consumed it).
- No `posthog-signal` Bug tickets were filed, because filing them would require
  inventing the event names and counts. Zero is the honest number here.
- Wave 2 prioritisation fell back to Linear priority + age + code-level evidence
  from the C1–C5 audits.

Already tracked by existing P3 ticket **VGC-220** ("[INFRA] Populate
POSTHOG_API_KEY + DISCORD_WEBHOOK_URL in swarm container so future runs can
cross-reference analytics").
