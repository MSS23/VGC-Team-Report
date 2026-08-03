# PostHog data pull — 03 Aug 2026

## Status: ❌ SKIPPED — credentials not present in this container.

`POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are both unset. The container injects only
`LINEAR_API_KEY` and `DISCORD_BUILDS_WEBHOOK` (confirmed by `linear_preflight`, which passed
for both). Per CLAUDE.md: *"If the preflight reports an integration missing, skip it for the
whole run and say so in the report — do not retry it."* No retries were attempted.

## Consequence for this run
- No error-event, rage-click, funnel-drop-off, top-route or survey data was available.
- Wave 1 agents R6/R8/C4/C5 ran WITHOUT PostHog cross-referencing (they were briefed on static
  analysis only, so their findings stand on their own).
- No `posthog-signal` bug tickets could be filed. Ticket prioritisation fell back to Linear
  priority + age + user-reported severity.

## Already tracked
**VGC-220** — "[INFRA] Populate POSTHOG_API_KEY + DISCORD_WEBHOOK_URL in swarm container so
future runs can pull product analytics". This run is the third consecutive one blocked on it.
Recommend raising its priority: it silently removes an entire input from every nightly run.
