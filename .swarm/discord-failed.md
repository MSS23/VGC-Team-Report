# Discord Notification — FAILED (no credentials in remote env)
Date: 06-06-26 (UK time)
Channel ID: 1487202217298493493 (#builds)

Neither `DISCORD_BUILDS_WEBHOOK` nor `DISCORD_BOT_TOKEN` are exposed in this
remote execution environment (no `.env.local` mounted). Per the swarm
mandatory-Discord guardrail, the payload that should have been sent is
preserved here so a human can replay it.

## Payload (post to channel 1487202217298493493)

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 06 Jun 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-06-06", "inline": true },
      { "name": "Commits pushed", "value": "9 (+1 for swarm notes)", "inline": true },
      { "name": "Build status", "value": "✅ Passing (tsc + next build green)", "inline": true },
      { "name": "Linear webhook", "value": "⚠️ Handler code verified correct — issue is env-var mismatch in Vercel Production. Human action required (see investigation in PR body).", "inline": false },
      { "name": "Linear tickets closed", "value": "None — Linear MCP requires interactive OAuth and could not be authenticated unattended. Pending updates saved to .swarm/linear-pending.md.", "inline": false },
      { "name": "PostHog signals acted on", "value": "None — POSTHOG_API_KEY not exposed in remote env.", "inline": false },
      { "name": "Updates page", "value": "11 entries added to a new June 2026 (v6.1) changelog section", "inline": false },
      { "name": "Merge conflicts", "value": "None — branch was cut fresh from main tonight and stayed 0 behind throughout the run.", "inline": false },
      { "name": "Rejected changes", "value": "None — every commit passed tsc + next build.", "inline": false },
      { "name": "PR", "value": "<URL to be set after gh pr create>", "inline": false },
      { "name": "What was pushed", "value": "• Security: comments/flag mass-deletion vuln fixed (Clerk auth required)\n• Security: Linear webhook catch now logs error message\n• Security: verifyBearer gained 9 vitest cases\n• A11y: InstallPrompt full focus trap + aria + Escape\n• A11y: CalcInput + CollaboratorPanel aria-labels\n• Perf: CookieBanner now lazy-loaded (~15KB gzip off layout)\n• SEO: sitemap /compare dedup + mega pages get lastModified\n• SEO: robots.txt disallows /embed/, /dashboard/, /notifications, /*?key=\n• Dead code: DisplayTogglePill + useGlobalDisplayPrefs + asPokemonTypes\n• TS: explicit return types on 3 async exports\n• Docs: .env.example backfilled with all 17 referenced vars", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```

## How to send

Once `DISCORD_BUILDS_WEBHOOK` is available locally:

```bash
source .claude/scripts/linear.sh
curl -s -X POST "$DISCORD_BUILDS_WEBHOOK" -H "Content-Type: application/json" -d @.swarm/discord-failed.md
```

(Strip everything before the first `{` of the payload first — the markdown
prose above is for humans, not Discord.)
