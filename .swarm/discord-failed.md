# Discord Notification — Fallback Payload

**Reason:** `DISCORD_BUILDS_WEBHOOK` env var not available in this swarm session (no `.env.local`).

**Target channel:** `1487202217298493493` (#builds)

**To send manually:**

```bash
source .claude/scripts/linear.sh   # provides $DISCORD_BUILDS_WEBHOOK
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d @.swarm/discord-payload.json
```

**Payload:** (see `.swarm/discord-payload.json`)
