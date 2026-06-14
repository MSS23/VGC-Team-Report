# Discord notification — UNDELIVERED 2026-06-14

## Cause
No Discord credentials available in this overnight environment:
- `DISCORD_BUILDS_WEBHOOK` not set in env and `.env.local` does not exist
- `DISCORD_BOT_TOKEN` not set
- Cannot POST to channel 1487202217298493493 from this environment

## Payload that would have been sent

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 14 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-14", "inline": true },
      { "name": "Commits pushed", "value": "3", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build green)", "inline": true },
      { "name": "Linear webhook", "value": "✅ handler code healthy — if production webhook still failing, the cause is a Vercel env-var mismatch (see PR body)", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear API unreachable from this overnight env (no .env.local, no OAuth)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — PostHog credentials not available", "inline": false },
      { "name": "Updates page", "value": "1 entry added to June 2026 section (v6.01)", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch cut fresh from main", "inline": false },
      { "name": "Rejected changes", "value": "0 build failures. 3 audit findings deferred due to file overlap with recent main churn (see PR body)", "inline": false },
      { "name": "PR", "value": "<see PR URL in run summary>", "inline": false },
      { "name": "What was pushed", "value": "• NotificationBell: WCAG 2.5.8 44x44 touch target\n• useTranslation: explicit return type\n• ConsentGate: deleted (37 lines dead code)\n• Changelog: June 2026 entry", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Action for the human

When you wake up:
1. Either set `DISCORD_BUILDS_WEBHOOK` in this environment's secrets for future runs,
2. Or paste the payload above into Discord manually if you want it logged.

The PR contains the same information.
