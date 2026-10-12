# Step 1 — PostHog data pull, 12 Oct 2026

## Result: NOT AVAILABLE. No PostHog data informed this run.

Neither credential is present in the swarm container:

```
POSTHOG_API_KEY     MISSING
POSTHOG_PROJECT_ID  MISSING
```

No request was attempted — without a project id and a personal API key there is no
endpoint to call. All four PostHog-dependent instructions in the routine were therefore
unmet this run:

- Top 10 `$exception` events (14d) — unavailable
- Top 10 `$rageclick` / dead-click events — unavailable
- Top 5 funnel drop-off points — unavailable
- Top 10 routes by session count, and user-feedback/survey events — unavailable

Downstream consequences, so the gap is visible rather than silently absorbed:

- **No `posthog-signal` Bug tickets** could be filed this run (Step 6 asks for one per
  error/rage-click pattern). Zero filed — because zero data, not because zero problems.
- **No PostHog cross-reference** for the webhook investigation (Step 0C.4), the security
  audit, or the commit review.
- **No PostHog signal** fed ticket prioritisation in Wave 2. Tonight's selection was
  driven by Linear priority and the 05 Oct audit findings instead.

The app does ship PostHog (`posthog-js` and `posthog-node` are both dependencies, and
there is a `src/app/api/webhooks/posthog/route.ts`), so the data almost certainly exists
server-side — it is only the swarm's read access that is missing.

## Already tracked — no duplicate filed

**VGC-220** (P3, Backlog): "[INFRA] Populate POSTHOG_API_KEY + DISCORD_WEBHOOK_URL in
swarm container". This is the fourth consecutive run blocked on it. A comment was added
to VGC-220 noting the repeat rather than opening a new ticket.

Worth noting for whoever picks VGC-220 up: `DISCORD_WEBHOOK_URL` is also still missing,
but that half is a non-issue in practice — `.claude/scripts/linear.sh` resolves
`DISCORD_BUILDS_WEBHOOK`, which IS present, and that is what this run used to post to
#builds. The ticket could be narrowed to the PostHog half.
