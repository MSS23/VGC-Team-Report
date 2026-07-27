# Discord Notification Failed — 2026-07-27

Latest failure — overwriting the prior stale entry (was 2026-05-28).

Reason: neither `DISCORD_WEBHOOK_URL`, `DISCORD_BUILDS_WEBHOOK`, nor `DISCORD_BOT_TOKEN` was set in this session's environment (no `.env.local` in the container). Both webhook and bot-token fallbacks unavailable.

Target channel: `1487202217298493493` (#builds).

## Payload that would have been sent

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 27 Jul 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-07-27", "inline": true },
      { "name": "Commits pushed", "value": "7", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "✅ handler code healthy — any delivery failure is env-var config (Vercel), requires human action", "inline": false },
      { "name": "Linear tickets closed", "value": "None (Linear MCP not authenticated this run)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (POSTHOG_API_KEY not in env)", "inline": false },
      { "name": "Updates page", "value": "1 entry added (v5.25) under July 2026", "inline": false },
      { "name": "Merge conflicts", "value": "None — cut fresh from main tonight", "inline": false },
      { "name": "Rejected changes", "value": "None — every commit passed tsc + next build", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/70", "inline": false },
      { "name": "What was pushed", "value": "• Security HIGH: /api/team-graphic no longer leaks private teams as PNG\n• Security MED: CSRF timing-safe comparison\n• Security LOW: /api/user/saved shareId regex validation\n• A11y: aria-expanded on 4 disclosures, aria-pressed on dark toggle\n• A11y: aria-hidden on 4 decorative SVGs inside labelled buttons\n• A11y: Champions type-badge contrast fix (Electric/Ice/Ground/Steel → text-black)\n• Dead code: removed DisplayTogglePill, useGlobalDisplayPrefs, asPokemonTypes, getRegMBMegas\n• console.log → console.info in weekly-digest cron", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Manual send

If a human wants to post this manually:

1. Set `DISCORD_BUILDS_WEBHOOK` and run: `curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" -H "Content-Type: application/json" -d @<payload-file.json>`.
2. Or paste the JSON block above into a Discord webhook tester or the `#builds` channel directly.
