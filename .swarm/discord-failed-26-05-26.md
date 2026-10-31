# Discord Notification — FAILED (no credentials)

Neither `DISCORD_BUILDS_WEBHOOK` nor `DISCORD_BOT_TOKEN` are available in this execution environment.

## Payload to post manually to channel 1487202217298493493 (#builds)

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 26 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-26", "inline": true },
      { "name": "Commits pushed", "value": "10", "inline": true },
      { "name": "Build status", "value": "✅ tsc passing (build OOM in sandbox)", "inline": true },
      { "name": "Linear webhook", "value": "🔧 Fixed — env var, header name, force-dynamic corrected. Human must verify Vercel env var + re-enable webhook in Linear.", "inline": false },
      { "name": "Linear tickets closed", "value": "None (no Linear API access)", "inline": false },
      { "name": "PostHog signals", "value": "None (no credentials)", "inline": false },
      { "name": "Updates page", "value": "8 entries added to May 2026 section (v5.20)", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/47", "inline": false },
      { "name": "What was pushed", "value": "• Linear webhook handler fixed (env var, header, force-dynamic)\n• PostHog webhook hardened (200 on errors, force-dynamic)\n• Clerk webhook 200 on internal errors\n• BreadcrumbList JSON-LD on FAQ/Changelog/Tournaments\n• /compare added to sitemap + noindex\n• Error/404/global-error accessibility (role=alert, aria-hidden)\n• Webhook routes return 405 on GET\n• Changelog v5.20 with 8 entries\n• Removed unused ConsentGate import", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```
