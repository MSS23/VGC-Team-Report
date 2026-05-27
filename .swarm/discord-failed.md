# Discord Notification — UNSENT (27-05-26)

Neither `DISCORD_BUILDS_WEBHOOK` nor `DISCORD_BOT_TOKEN` are available in this remote environment.

**Target channel:** 1487202217298493493 (#builds)

**Payload (copy-paste ready for manual post):**

```json
{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 27 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-27", "inline": true },
      { "name": "Commits pushed", "value": "8", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "Linear webhook", "value": "🔧 Fixed (commit 24d052e) — human must verify Vercel env var + re-enable in Linear", "inline": false },
      { "name": "Linear tickets closed", "value": "None (no Linear API access)", "inline": false },
      { "name": "PostHog signals acted on", "value": "None (no credentials)", "inline": false },
      { "name": "Updates page", "value": "12 entries added to May 2026 section (v5.21)", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/48", "inline": false },
      { "name": "What was pushed", "value": "• Linear webhook handler fix (header + env var + resilience)\n• Email XSS fix (HTML-escape all user fields)\n• Timing-safe bearer comparisons on admin routes\n• GraphQL injection fix in cron routes\n• Webhook resilience (200 on errors for PostHog + Clerk)\n• A11y: 44px touch targets on Navbar + PokemonCard\n• SEO: SportsApplication + /explore keyword targeting\n• Dead code: removed useScrollHide, ReactionBar, axios", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
```
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

---

# Discord Notification — UNSENT (no .env.local)

**Run:** 14-05-26 (Wave 2 overnight swarm)
**Target channel:** #builds (ID: 1487202217298493493)
**Reason:** DISCORD_BUILDS_WEBHOOK and DISCORD_BOT_TOKEN not set (no .env.local in swarm environment)

## Payload that should be sent

```
🌙 Swarm 14-05-26 (Wave 2) landed — claude-dev → PR #28

♿ A11y: WCAG AA contrast fix cascading ~470 usages; Toggle/ReactionBar/Navbar aria fixes; invalid label→div fix
🔒 Security: timingSafeEqual for CRON_SECRET + PostHog webhook token; AbortController on bot/route.ts
📈 SEO: noindex on dashboard+embed; EV→SP in Champions (6 locations); FAQ anchor IDs + SP/Champions entries
🏷️ TypeScript: any→proper types in diff-state, useShareFlow, useSlideSystem; removed DocumentWithViewTransition interface
⚡ Perf: fetchpriority="high" on first LCP sprite via PokemonSprite priority prop
🔗 UX: Damage calc deep-link button on PokemonCard
🧹 Dead code: postBuildNotification, postToFeedbackChannel, sanitizeInput, containsInjection removed

Tickets → In Review: VGC-176, VGC-177, VGC-178, VGC-179, VGC-180
New backlog: VGC-181, VGC-182, VGC-183, VGC-184, VGC-185

PR: https://github.com/MSS23/VGC-Team-Report/pull/28
```

## To send manually after adding DISCORD_BUILDS_WEBHOOK to .env.local

source .claude/scripts/linear.sh && discord_notify_build "swarm-14-05-26" "Swarm 14-05-26 Wave 2: A11y + Security + SEO + TypeScript + Perf + Dead Code"

---

# Discord Notification — UNSENT (no .env.local)

**Run:** 16-05-26 (Wave 2 overnight swarm)
**Target channel:** #builds (ID: 1487202217298493493)
**Reason:** DISCORD_BUILDS_WEBHOOK and DISCORD_BOT_TOKEN not set (no .env.local in swarm environment)

## Payload that should be sent

```
🌙 Swarm 16-05-26 landed — 8 commits → claude-dev → PR #29

🎯 UX: 3-card archetype sample picker on homepage (VGC-188)
🗄️ DB: species[] materialised column + GIN index migration (VGC-189)
🔒 Security: isCronAuthorized on keep-alive; Linear webhook fail-closed; Zod on notifications PATCH
📈 SEO/AEO: llms.txt + llms-full.txt; SportsEvent JSON-LD on /tournaments
♿ A11y: aria-pressed on Win/Loss/Tie; 44px touch targets on ShareDock + MatchTracker; role=alert + aria-label on paste input
🐛 Bugs: totalReports denominator fix (inflated % fixed); /?sample broken link; posthog?.capture TS error
✅ VGC-174 closed as already Done (Web Share API already shipped)

Tickets → Done: VGC-188, VGC-189, VGC-174
New backlog: VGC-190 (unlisted tier), VGC-191 (Next.js upgrade URGENT), VGC-192 (dead code), VGC-193 (iOS PWA), VGC-194 (MatchTracker a11y)

PR: https://github.com/MSS23/VGC-Team-Report/pull/29
```

## To send manually after adding DISCORD_BUILDS_WEBHOOK to .env.local

source .claude/scripts/linear.sh && discord_notify_build "swarm-16-05-26" "Swarm 16-05-26: Sample Picker + species[] column + Security + SEO/AEO + A11y + Bug Fixes"
