# Discord Notification — FAILED — 15-05-26

## Status
Could not send Discord notification to channel 1487202217298493493 (#builds).

## Reason
No environment credentials available:
- `DISCORD_WEBHOOK_URL`: not set
- `DISCORD_BUILDS_WEBHOOK`: not set  
- `DISCORD_BOT_TOKEN`: not set
- `.env.local`: does not exist in this environment

## Payload that should have been sent
Channel ID: 1487202217298493493

**Embeds:**
- Title: "🤖 Nightly Swarm — 15 May 2026"
- Color: 5763719 (green)
- Branch: `claude-dev`
- Commits pushed: 10
- Build status: ✅ tsc clean (0 new errors)
- Linear tickets closed: VGC-183, VGC-186, VGC-137, VGC-182, VGC-175, VGC-169 → Done, VGC-185 → Done
- PostHog signals: None (no credentials)
- Updates page: 10 entries added to May 2026 (v5.15)
- Rejected: VGC-181 (needs real data), VGC-169/185 already done
- PR: Comment on PR #28 https://github.com/MSS23/VGC-Team-Report/pull/28
- What was pushed:
  • Fixed iOS PWA window.confirm → inline Delete/Cancel
  • Updated calc link to NCP-VGC Damage Calculator
  • Speed tier Yours/Meta badges + Mega matching
  • Champions meta: 6-CTE SQL (5MB → 20 rows)
  • Static OG fallback PNG (1200x630)
  • PWA install prompt: 15s timer → 60s+scroll gate
  • Explore empty state: search shortcuts + demo link
  • PasteInput: new-user format hint
  • Fixed 2 dead exports + 9 implicit-any TS errors
  • Filed 3 new Backlog tickets (VGC-187, VGC-188, VGC-189)

## Resolution
Add DISCORD_BUILDS_WEBHOOK or DISCORD_WEBHOOK_URL to .env.local before next swarm run.
