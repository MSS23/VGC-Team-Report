# PostHog Insights — Swarm Run 18-05-26

## Status: UNAVAILABLE

No `.env.local` file present in this remote execution environment.
Required env vars: `POSTHOG_API_KEY`, `POSTHOG_PROJECT_ID`

PostHog API calls skipped — environment variables not set.

### Attempted endpoints (not executed)
- `GET https://app.posthog.com/api/projects/$POSTHOG_PROJECT_ID/events/?event=$exception&limit=100`
- `GET https://app.posthog.com/api/projects/$POSTHOG_PROJECT_ID/events/?event=$rageclick&limit=100`

## Prior context
PostHog also unavailable on all previous swarm runs (13-05, 14-05, 15-05, 16-05, 17-05).
Pattern: `.env.local` is not included in this execution environment — credentials are gitignored and not injected at swarm startup.

## Recommendation
To enable PostHog analytics in overnight swarm runs, inject `POSTHOG_API_KEY` and `POSTHOG_PROJECT_ID` as environment variables at swarm launch time (e.g. via CI secrets, Vercel env export, or a `.env.swarm` file copied in before the swarm starts).

## Action
No PostHog-sourced error or rage-click data available tonight. Ticket prioritisation for this swarm run driven by Linear priority + prior research synthesis (17-05-26).
