# Discord Notification — FAILED (no credentials)

Neither `DISCORD_BUILDS_WEBHOOK` nor `DISCORD_BOT_TOKEN` are available in this
execution environment. The notification below could not be sent. The human should
either (a) paste the JSON payload into a Discord webhook tester manually, or (b)
make these env vars available to the next overnight runner so notification fires
automatically.

Channel ID (fixed): `1487202217298493493` (#builds)

## Payload to post to channel 1487202217298493493 (#builds)

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 01 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-01", "inline": true },
      { "name": "Commits pushed", "value": "10", "inline": true },
      { "name": "Build status", "value": "✅ tsc + next build passing", "inline": true },
      { "name": "Linear webhook", "value": "⚠️ env-var mismatch suspected — Vercel update required. Code already correct (8th audit-pass run). New P0 ticket draft in PR.", "inline": false },
      { "name": "Linear tickets closed", "value": "None (Linear MCP needs OAuth; cannot complete unattended)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (POSTHOG_API_KEY not in env)", "inline": false },
      { "name": "Updates page", "value": "11 entries added to a new June 2026 section (v5.23)", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None — all 10 wave-2 changes built green", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/52", "inline": false },
      { "name": "What was pushed", "value": "• /speed-tiers SEO landing page\n• /guides/how-to-write-a-vgc-team-report (7-step guide + HowTo schema)\n• Sentry session-replay removed (~97KB/route)\n• Microsoft Clarity lazy-loaded behind consent (~30-60KB)\n• Root metadata: 'Free VGC Team Builder, Damage Calcs & Speed Tiers (2026)' + PokePaste alternative\n• Sitemap: /compare deduped, Mega champion lastModified added\n• ShareModal a11y: role=alert errors + disambiguated visibility radio labels\n• Feedback type buttons: visible text labels (WCAG 1.4.1)\n• /api/share/[id]/collaborators GET: apiGuard rate-limit added\n• Webhook console.error on catch (linear/posthog/clerk observability)\n• Dead code: ConsentGate.tsx deleted", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## How to send manually

```bash
# If DISCORD_BUILDS_WEBHOOK is available locally:
curl -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d @.swarm/discord-failed-01-06-26.json   # extract the payload first

# Or via bot token:
curl -X POST "https://discord.com/api/v10/channels/1487202217298493493/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @payload.json
```
