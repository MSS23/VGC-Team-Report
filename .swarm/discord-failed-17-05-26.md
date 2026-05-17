# Discord Notification — UNSENT (no .env.local)

**Run:** 17-05-26
**Target channel:** #builds (ID: 1487202217298493493)
**Reason:** DISCORD_BUILDS_WEBHOOK and DISCORD_BOT_TOKEN not set (no .env.local in swarm environment)
**Method tried:** source .claude/scripts/linear.sh — webhook key empty

## Payload to send manually

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 17 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "`claude-dev`", "inline": true },
      { "name": "Commits pushed", "value": "10", "inline": true },
      { "name": "Build status", "value": "✅ Passing (next build ~24s)", "inline": true },
      { "name": "Linear tickets → Done", "value": "VGC-191 (Next.js CVE), VGC-194 (MatchTracker a11y), VGC-193 (iOS PWA), VGC-192 (dead code), VGC-190 (unlisted tier), VGC-152 (team card PNG), VGC-116 (newsletter)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — no .env.local (5th consecutive run)", "inline": false },
      { "name": "Updates page", "value": "9 entries added to May 2026 section (version 5.17)", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/30 (draft, claude-dev → main)", "inline": false },
      { "name": "What was pushed", "value": "• 🔒 Security: Next.js pinned to 16.2.6 (SSRF CVSS 8.6 + auth bypass CVSS 8.1 patched)\n• 🐛 MatchTracker delete: Escape key, focus management, error feedback\n• 🐛 iOS PWA prompt now fires on non-scrolling pages (iPad fix)\n• ✨ Unlisted privacy tier: Private/Unlisted/Public 3-state toggle in share modal + dashboard\n• ✨ Download Team Card button: branded 600×338px PNG export\n• ✨ Newsletter signup on homepage (Resend-backed, needs RESEND_API_KEY in Vercel)\n• 📈 SEO: OrganizationJsonLd logo, SportsEvent schema, ItemList on /champions\n• 🧹 Removed 14 dead exports across src/lib/ and src/hooks/\n• 🐛 species[] now written on UPDATE paths (regression fix)", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## Manual send command (after adding DISCORD_BUILDS_WEBHOOK to .env.local)
```bash
source .claude/scripts/linear.sh
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '<payload above>'
```
