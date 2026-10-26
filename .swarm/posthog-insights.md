# PostHog insights — swarm 26-10-26

**NOT PULLED — credentials absent from the container.**

- `POSTHOG_API_KEY`: unset (length 0)
- `POSTHOG_PROJECT_ID`: unset (length 0)

Per the run guardrail ("If credentials are missing or the API returns errors, log the
failure and continue"), no PostHog request was attempted and the run continued.

## Consequence for this run
Every PostHog-dependent instruction is a no-op this run:

- R3 / R5 could not cross-reference rage-click or funnel drop-off data.
- C4 / C5 could not cross-reference exception events against audit findings.
- L0 could not elevate tickets by PostHog signal; `posthog_signal` is `false` for all.
- No `[PostHog]` bug tickets were filed, since there is no telemetry to file them from.
- The `posthog-signal` label does not exist on the team and was not created.

This is the fifth consecutive run blocked the same way. Already tracked by
**VGC-220** ("[INFRA] Populate POSTHOG_API_KEY + DISCORD_WEBHOOK_URL in swarm
container"). Note the repo *does* ship `src/app/api/cron/posthog-errors/route.ts`,
so the application side of this telemetry exists — only the swarm's read path is missing.
