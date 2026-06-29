# Discord notification — NOT SENT 29-06-26

**Reason:** This swarm session had no `DISCORD_BUILDS_WEBHOOK`, `DISCORD_WEBHOOK_URL`, or `DISCORD_BOT_TOKEN` available in the environment (no `.env.local` file present).

**Action required:** A human should send the payload in `.swarm/discord-payload-29-06-26.json` to Discord channel `1487202217298493493` (#builds).

One-liner using a project-local webhook env var:

```bash
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H 'Content-Type: application/json' \
  -d @.swarm/discord-payload-29-06-26.json
```

Or via bot token:

```bash
curl -s -X POST "https://discord.com/api/v10/channels/1487202217298493493/messages" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d @.swarm/discord-payload-29-06-26.json
```
