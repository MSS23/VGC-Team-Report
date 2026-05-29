# Discord Notification — FAILED (no credentials)
Date: 2026-05-28
Channel: 1487202217298493493

Neither DISCORD_BUILDS_WEBHOOK nor DISCORD_BOT_TOKEN are available in this execution environment.

## Payload that would have been sent:

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 28 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-28", "inline": true },
      { "name": "Commits pushed", "value": "11", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "🔧 fixed in commit 6e48080 — human must verify Vercel env var", "inline": false },
      { "name": "Linear tickets closed", "value": "None (no Linear API access)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (credentials unavailable)", "inline": false },
      { "name": "Updates page", "value": "12 entries added to May 2026 section (v5.22)", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "1 — changelog data extraction (build broke, reverted)", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/49", "inline": false },
      { "name": "What was pushed", "value": "• Linear webhook handler fix (8th run)\n• Email XSS + GraphQL injection + timing-safe auth\n• AI crawlers unblocked in bot detection\n• PostHog + Clerk webhook resilience\n• OTSSheetModal a11y + touch targets\n• Explore page SEO keywords\n• PWA manifest screenshot fix\n• Views shareId validation\n• Dead code removal\n• Changelog v5.22", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```
