# PostHog insights — 09-11-26

## STATUS: SKIPPED (credentials absent)

`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are both unset in this container. There is
no `.env.local` in the clone (it is gitignored and not provisioned), so there is no
fallback source.

Per the CLAUDE.md swarm rule — "If the preflight reports an integration missing, skip
it for the whole run and say so in the report — do not retry it" — PostHog was skipped
for the entire run. No API calls were attempted.

## Consequences for this run

- No error-event, rage-click, dead-click, funnel drop-off, or route-popularity data.
- Wave 1 agents that were specified to cross-reference PostHog (C4, C5, and the UX
  research agents) ran without it.
- No `posthog-signal` Bug tickets could be filed, and no PostHog-based priority
  elevation was applied.
- `posthog_signal` is therefore `false` for every ticket considered tonight — absence
  of evidence, not evidence of absence.

## Already ticketed

VGC-220 (P3, Backlog) — "[INFRA] Populate POSTHOG_API_KEY + DISCORD_WEBHOOK_URL in
swarm container". This is the third consecutive run to hit it. A comment was added to
that ticket tonight confirming it is still unresolved.

Note: `DISCORD_BUILDS_WEBHOOK` *is* present this run, so the Discord half of VGC-220
is satisfied under that variable name; only the PostHog half remains.
