# Swarm Research Synthesis — 17-05-26

## Summary
Second consecutive overnight swarm. Prior research (16-05-26) was comprehensive —
tonight focused 70% of budget on implementations vs 30% research.

## Tickets Targeted Tonight

| Ticket | Status | Notes |
|--------|--------|-------|
| VGC-191 (Security: Next.js upgrade) | ✅ Implemented | package.json pinned to 16.2.6 |
| VGC-194 (A11y: MatchTracker delete) | ✅ Implemented | Escape key, focus mgmt, error feedback |
| VGC-193 (Bug: iOS PWA prompt) | ✅ Implemented | pageIsShort fallback added |
| VGC-192 (Dead code cleanup) | ✅ Implemented | 14 dead exports removed |
| VGC-190 (Unlisted privacy tier) | ⏳ In Progress | API + DB done; ShareModal UI pending |
| VGC-152 (Team card image) | ⏳ In Progress | TeamCardExport.tsx pending |
| SEO wins x3 | ✅ Implemented | OrganizationJsonLd logo, SportsEvent, ItemList |

## C5 Finding: Species UPDATE path bug
share/route.ts UPDATE paths omit `species = ...` (VGC-189 regression).
Needs one-line fix after VGC-190 agent lands.

## Remaining Budget
- Wave 1: 7 agents
- Wave 2: 6 agents dispatched (13 total)
- Remaining slots: 12
- VGC-116 (email newsletter, Urgent) — to dispatch after VGC-190+152 lands

## Top Opportunities Not Addressed Tonight
1. VGC-116: Email newsletter signup (Urgent, ~3hr scope)
2. VGC-166: i18n string audit (Low, ~2hr scope)
3. VGC-152 TeamCard: depends on VGC-190+152 agent completing

## PostHog
Unavailable (no .env.local). No signals. Third consecutive run.

## Discord
Will fail (no .env.local). Payload saved to .swarm/discord-failed-17-05-26.md.
