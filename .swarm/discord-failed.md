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
