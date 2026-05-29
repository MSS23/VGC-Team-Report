# Discord Notification — NOT SENT — 22 May 2026

**Reason:** Neither `DISCORD_WEBHOOK_URL` nor `DISCORD_BOT_TOKEN` is present in the swarm container environment. The container is a fresh clone without a populated `.env.local`. Per the orchestrator spec ("If both methods fail: Save the full payload to `.swarm/discord-failed.md`. Do NOT silently skip."), the payload is preserved below for a manual send by the user.

**Channel:** `1487202217298493493` (#builds)

**Payload (Discord webhook JSON):**

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 22 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-22", "inline": true },
      { "name": "Commits pushed", "value": "13", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "🔧 fixed in commit f2121c3 — human must verify delivery + re-enable in Linear settings if auto-disabled", "inline": false },
      { "name": "Linear tickets implemented", "value": "VGC-208 (rental code in ShareModal), VGC-211 (Pikalytics dead code), VGC-WEBHOOK (signature handler). VGC-210 + VGC-212 were already implemented in 5.19 but never closed — will be closed via Linear MCP.", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — POSTHOG_API_KEY not set in container", "inline": false },
      { "name": "Updates page", "value": "10 entries added to May 2026 section as v5.20", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch was 0/0 vs main at start and push", "inline": false },
      { "name": "Rejected changes", "value": "None — all 12 code commits passed tsc + build", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/36", "inline": false },
      { "name": "What was pushed", "value": "Webhook signature fix; rental code copy block in ShareModal (VGC-208); Pikalytics dead code cleanup (VGC-211); weekly-digest cross-product stats fix; Save-toggle dedup + race fix; noindex collab ?key= URLs; 44x44 px touch targets; aria-labels on damage-calc + Explore controls; GraphQL teamId bound via variables; type-soundness on 7 helpers; 311 lines of dead exports removed.", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

**To send manually after the next deploy populates `.env.local` (or in any env that has the secrets):**

```bash
# Either via webhook (preferred):
curl -s -X POST "$DISCORD_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  --data-binary @.swarm/discord-failed.json   # extract the JSON block above

# Or via bot token:
curl -s -X POST "https://discord.com/api/v10/channels/1487202217298493493/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @.swarm/discord-failed.json
```
