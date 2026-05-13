# Discord Notification — UNSENT (no .env.local)

**Run:** 13-05-26
**Target channel:** #builds (ID: 1487202217298493493)
**Reason:** DISCORD_BUILDS_WEBHOOK not set (no .env.local in environment)

## Payload that should be sent

```
🤖 Swarm 13-05-26 landed — 11 commits → claude-dev

🔒 Security: JSON-LD XSS fix + timing-safe CRON_SECRET auth
⚡ Reliability: AbortController on all external fetches; champions meta capped
🎯 UX: Match Tracker delete entries + Share modal Copy Paste button
📈 SEO: Homepage/Champions/Explore titles + og:image on 4 pages (VGC-156)
🧪 Tests: 43 new tests (33 redact-paste + 10 dex drift guard)

PR: https://github.com/MSS23/VGC-Team-Report/pull/27
```

## To send manually after adding DISCORD_BUILDS_WEBHOOK to .env.local

source .claude/scripts/linear.sh && discord_notify_build "swarm-13-05-26" "Swarm 13-05-26: Security + Match Tracker + SEO + Tests"
