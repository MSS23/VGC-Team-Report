# VGC-169 PostHog Event Audit — 2026-05-15

All `posthog.capture()` / `posthog?.capture()` calls across `src/`. Every event name and property key evaluated against the snake_case standard.

---

## Full Capture() Inventory

| # | File | Line | Event Name | Status | Properties | Property Issues |
|---|------|------|-----------|--------|------------|-----------------|
| 1 | `src/components/social/SaveButton.tsx` | 70 | `report_unsaved` | OK | `share_id` | None |
| 2 | `src/components/social/SaveButton.tsx` | 80 | `report_saved` | OK | `share_id` | None |
| 3 | `src/components/ui/ShareDock.tsx` | 74 | `share_dock_action` | OK | `action` | None |
| 4 | `src/components/ui/ShareDock.tsx` | 85 | `share_dock_action` | OK | `action` | None |
| 5 | `src/components/ui/ShareDock.tsx` | 96 | `share_dock_action` | OK | `action` | None |
| 6 | `src/components/social/ReactionBar.tsx` | 67 | `report_reacted` | OK | `share_id`, `action` | None |
| 7 | `src/components/social/FollowButton.tsx` | 43 | `creator_unfollowed` / `creator_followed` | OK | `creator_name` | None |
| 8 | `src/components/ui/ShareModal.tsx` | 173 | `share_embed_copied` | OK | `has_tournament` | None |
| 9 | `src/components/ui/ShareModal.tsx` | 209 | `share_link_copied` | OK | `is_short_url` | None |
| 10 | `src/components/ui/ShareModal.tsx` | 221 | `share_discord_copied` | OK | `has_tournament` | None |
| 11 | `src/components/ui/ShareModal.tsx` | 233 | `share_paste_copied` | OK | `has_tournament` | None |
| 12 | `src/components/ui/ShareModal.tsx` | 245 | `share_native_used` | OK | `has_tournament` | None |
| 13 | `src/components/ui/ShareModal.tsx` | 371 | `share_twitter_clicked` | OK | `has_tournament`, `has_placement` | None |
| 14 | `src/components/ui/ShareModal.tsx` | 400 | `share_reddit_clicked` | OK | `has_tournament` | None |
| 15 | `src/components/providers/PostHogProvider.tsx` | 30 | `$pageview` | OK (PostHog reserved) | `$current_url` | None — PostHog internal names use `$` prefix by convention |
| 16 | `src/components/social/CreatorProfile.tsx` | 44 | `creator_profile_visited` | OK | `creator_name` | None |
| 17 | `src/components/report/PokemonCard.tsx` | 271 | `calc_opened` | OK | `pokemon_name` | None |
| 18 | `src/components/report/TeamCardCTA.tsx` | 25 | `team_card_download_clicked` | OK | `share_id` | None |
| 19 | `src/components/explore/ExploreContent.tsx` | 29 | `explore_visited` | OK | none | None |
| 20 | `src/hooks/useHomePage.ts` | 685 | `team_created` | OK | `has_mega`, `pokemon_count` | None |
| 21 | `src/hooks/useShareFlow.ts` | 57–62 | `report_shared` | OK | `regulation`, `has_mega`, `is_public`, `pokemon_count` | None |
| 22 | `src/app/page.tsx` | 626 | `report_viewed` | OK | `share_id` | None |
| 23 | `src/app/page.tsx` | 710 | `fork_attempted_signed_out` | OK | `source_id` | None |
| 24 | `src/app/page.tsx` | 714 | `report_fork_clicked` | OK | `source_id` | None |
| 25 | `src/app/page.tsx` | 1591 | `share_view_duplicate_anonymous` | OK | `source_id` | None |
| 26 | `src/app/champions/ChampionsContent.tsx` | 36 | `champions_page_visited` | OK | none | None |
| 27 | `src/app/tournaments/TournamentsContent.tsx` | 208 | `tournaments_page_visited` | OK | none | None |

**Total capture() calls: 27** (across 13 files)

---

## Inconsistency Analysis

### Event Names — Naming Violations: 0

All 27 event names use snake_case correctly. No camelCase or kebab-case event names found.

Examples of compliant names:
- `team_created`, `report_viewed`, `calc_opened`, `report_shared`
- `share_dock_action`, `creator_profile_visited`, `explore_visited`
- `fork_attempted_signed_out`, `share_view_duplicate_anonymous`

### Property Keys — Naming Violations: 0

All property keys use snake_case correctly across all 27 calls. Examples:
- `share_id`, `creator_name`, `pokemon_name`, `has_mega`
- `pokemon_count`, `has_tournament`, `is_short_url`, `is_public`
- `source_id`, `has_placement`, `regulation`

### Special Cases (Acceptable)

- `$pageview` / `$current_url` in `PostHogProvider.tsx:30` — PostHog's own reserved event system uses `$` prefix. This is correct and must not be changed.
- `action` (single-word) in `ShareDock.tsx` and `ReactionBar.tsx` — single-word keys are inherently neither camel nor snake; consistent and fine.

---

## Files Inventory

| File | Call Count | Issues |
|------|-----------|--------|
| `src/components/ui/ShareModal.tsx` | 8 | None |
| `src/app/page.tsx` | 4 | None |
| `src/components/ui/ShareDock.tsx` | 3 | None |
| `src/components/social/SaveButton.tsx` | 2 | None |
| `src/hooks/useShareFlow.ts` | 1 | None |
| `src/hooks/useHomePage.ts` | 1 | None |
| `src/components/social/ReactionBar.tsx` | 1 | None |
| `src/components/social/FollowButton.tsx` | 1 | None |
| `src/components/social/CreatorProfile.tsx` | 1 | None |
| `src/components/report/PokemonCard.tsx` | 1 | None |
| `src/components/report/TeamCardCTA.tsx` | 1 | None |
| `src/components/explore/ExploreContent.tsx` | 1 | None |
| `src/components/providers/PostHogProvider.tsx` | 1 | None |

---

## Priority Events (High Business Value)

These events are the most critical for analytics and should be verified first in PostHog dashboards:

| Priority | Event | File | Why Important |
|----------|-------|------|---------------|
| P0 | `team_created` | `useHomePage.ts:685` | Core conversion — main user action |
| P0 | `report_viewed` | `page.tsx:626` | Primary engagement metric |
| P0 | `report_shared` | `useShareFlow.ts:57` | Virality / growth metric |
| P1 | `report_fork_clicked` | `page.tsx:714` | Retention / re-engagement |
| P1 | `calc_opened` | `PokemonCard.tsx:271` | Feature engagement depth |
| P1 | `creator_followed` | `FollowButton.tsx:43` | Social graph growth |
| P2 | `share_*` events | `ShareModal.tsx` | Share channel attribution |
| P2 | `*_page_visited` events | Multiple | Page-level funnel |

---

## Verdict

**0 inconsistencies found.** The VGC Team Report PostHog instrumentation is already fully compliant with snake_case conventions for both event names and property keys. No changes required.

The codebase appears to have adopted consistent naming from the start — all 27 capture() calls across 13 files follow snake_case for events and properties without exception.

---

*Audit performed: 2026-05-15 | Scope: src/**/*.ts, src/**/*.tsx | Tool: grep -rn "posthog.*capture"*
