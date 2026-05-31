# Discord notification — failed (no webhook URL or bot token available)

`DISCORD_BUILDS_WEBHOOK` and `DISCORD_BOT_TOKEN` are both unset in this container — `.env.local` is absent and no Discord secrets are in env. Per the playbook fallback, the embed payload is saved here for the human to either post manually to channel `1487202217298493493` or to re-fire once the env var is provisioned.

## How to post manually

```bash
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H 'Content-Type: application/json' \
  --data @.swarm/discord-payload-31-05-26.json
```

Or via bot token:

```bash
curl -s -X POST 'https://discord.com/api/v10/channels/1487202217298493493/messages' \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H 'Content-Type: application/json' \
  --data @.swarm/discord-payload-31-05-26.json
```

## Payload

The full JSON body is in `.swarm/discord-payload-31-05-26.json`. Reproduced inline below for inspection:

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 31 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-31", "inline": true },
      { "name": "Commits pushed", "value": "12", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build green)", "inline": true },
      { "name": "Linear webhook", "value": "✅ handler code clean — ⚠️ env-var mismatch suspected; ticket #1 filed for human action via Vercel", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear API key not available in this container", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — PostHog API key not available in this container", "inline": false },
      { "name": "Updates page", "value": "12 entries added under v5.23 in the May 2026 section of /changelog", "inline": false },
      { "name": "Merge conflicts", "value": "Mid-run agent stash incident — recovered cleanly via stash pop. See .swarm/conflicts.md.", "inline": false },
      { "name": "Rejected changes", "value": "None at the build gate. 5 items deliberately deferred (see .swarm/rejected.md).", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/50", "inline": false },
      { "name": "What was pushed", "value": "• Linear webhook catch-path error logging\n• InstallPrompt localStorage guard (Safari private mode)\n• Changelog v5.22 text cleanup\n• De-export internal helpers\n• Bot-detection empty-UA + indexing-file exemption\n• Sitemap 1h ISR + duplicate /compare removal\n• /champions and /changelog title double-suffix fix\n• tsc + next build CI gate\n• Weekly digest N+1 → single GROUP BY query\n• qrcode dynamic-import singleton\n• NotificationBell + VersionHistoryPanel via next/dynamic", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```
