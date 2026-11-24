# PostHog data pull — 16 Nov 2026: NOT POSSIBLE

Step 1 of the routine requires pulling error events, rage/dead clicks, funnel drop-off, top routes
and feedback events from PostHog.

**Both required credentials are absent from the container environment:**

- `POSTHOG_API_KEY` — not set
- `POSTHOG_PROJECT_ID` — not set

No API call was attempted, because without a project id and a personal API key there is no request
to make. Per the routine's own instruction ("If credentials are missing or the API returns errors,
log the failure and continue — do not abort the run"), and per `CLAUDE.md` ("If the preflight reports
an integration missing, skip it for the whole run and say so in the report — do not retry it"),
PostHog was skipped for the whole run and not retried.

## Consequences for this run

- No PostHog-sourced Linear tickets were filed (the routine's Step 6 "[PostHog] <event>" bug tickets).
- No ticket was elevated in priority on a PostHog signal, so every implementation agent's
  `posthog_signal` is `false`.
- Steps 0C.4's cross-reference of webhook failures against PostHog exception data could not be done.

## Already ticketed — not re-filed

**VGC-220** — "[INFRA] Populate POSTHOG_API_KEY + DISCORD_WEBHOOK_URL in swarm container so future
runs can use them" (Backlog, P3, filed 22 May 2026). This is the same gap, already on the board, and
it has now blocked at least four nightly runs. Commented on rather than duplicated.

Note the app itself ships `posthog-js` and `posthog-node` and has a cron route at
`src/app/api/cron/posthog-errors/route.ts`, so production telemetry is presumably flowing — it is only
the *swarm container* that cannot read it.
