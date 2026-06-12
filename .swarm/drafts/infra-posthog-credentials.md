# [INFRA] Add PostHog read-only API key to swarm environment

**Priority:** Medium
**Labels:** infra, auto-research, swarm-blocker

## Why

The nightly swarm has been unable to pull PostHog insights on 20+ consecutive runs because `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` are not present in the execution environment. This blocks data-driven prioritisation (top error events, rage-clicks, funnel drop-offs, most-visited routes) which would otherwise raise the leverage of every Wave 1 subagent.

## What to do

1. In PostHog → Project Settings → Personal API Keys, create a key with **read-only** scope for `events`, `insights`, and `persons`.
2. Add to the swarm environment (Vercel/CI/wherever the swarm runs):
   - `POSTHOG_API_KEY=<key>`
   - `POSTHOG_PROJECT_ID=<numeric project id>`
3. (Optional) Restrict the key to specific IPs.

## Verify

On the next swarm run, `.swarm/posthog-insights.md` should contain real event rows, not the "credentials not available" stub.
