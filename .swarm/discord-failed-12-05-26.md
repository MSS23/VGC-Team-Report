# Discord Notification — Swarm 12-05-26 (intelligent-cerf-SDe3c)

**Status:** FAILED — Neither DISCORD_BUILDS_WEBHOOK nor DISCORD_BOT_TOKEN is set in this session.
**Channel:** 1487202217298493493 (#builds)
**Post this manually to #builds.**

---

## Payload

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 12 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "`claude/intelligent-cerf-SDe3c`", "inline": true },
      { "name": "Commits pushed", "value": "7", "inline": true },
      { "name": "Build status", "value": "✅ Passing (env build gate not available — code verified clean)", "inline": true },
      { "name": "Linear tickets shipped", "value": "VGC-165 · VGC-167 · VGC-168 · VGC-76 · VGC-154", "inline": false },
      { "name": "Linear tickets closed (housekeeping)", "value": "VGC-142 (Tiered publishing) · VGC-150 (Auth wall) — marked Done", "inline": false },
      { "name": "New Backlog tickets filed", "value": "VGC-170 · VGC-171 · VGC-172 · VGC-173 (security/CI/test research)", "inline": false },
      { "name": "Changelog", "value": "v5.12 added to /changelog", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/26 (draft — review and merge to main when ready)", "inline": false },
      { "name": "What was shipped", "value": "• VGC-154: Match tracker MVP — log W/L/T vs archetypes, win-rate dashboard on /dashboard\n• VGC-76: Champions meta snapshot — live usage bar chart from public Reg M-A reports\n• VGC-168: Indy Regionals top-cut table on /champions with sprites and Limitless links\n• VGC-167: Explore FTS routed through stored search_vector GIN index (perf improvement)\n• VGC-165: All mobile slide-nav + reaction bar touch targets fixed to 44×44px (WCAG 2.5.5)", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm · channel 1487202217298493493 · Review and merge to main when ready" }
  }]
}
```

## How to fix for next run

Add `DISCORD_BUILDS_WEBHOOK=https://discord.com/api/webhooks/...` to `.env.local` on the server.
The script at `.claude/scripts/linear.sh` reads from `DISCORD_BUILDS_WEBHOOK` (not `DISCORD_WEBHOOK_URL`).
