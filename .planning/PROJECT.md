# VGC Team Report

## What This Is

A web platform for competitive Pokemon VGC players to build detailed team reports with strategic documentation (notes, damage calcs, matchup plans, speed tiers), share them via short URLs, and discover community-shared teams. Supports presentation mode for tournaments, collaborative editing, creator profiles, and 8-language internationalization.

## Core Value

Players can build, document, share, and discover competitive VGC teams in one place — replacing the fragmented workflow of spreadsheets, Discord pastes, and scattered notes.

## Current Milestone: v5.0 Smart Explore Experience

**Goal:** Make the Explore page a powerful, intuitive discovery tool with better filters, richer report cards, shareable searches, and a cleaner mobile UX.

**Target features:**
- Pokemon exclude filter ("teams WITHOUT Flutter Mane")
- Tournament results mode (preset filter combos for browsing tournament placements)
- Enhanced report cards (key Pokemon highlighted, archetype badges, placement prominence, creator info)
- Shareable filter URLs (every filter combination generates a copyable link)
- Advanced filter drawer (collapsible drawer for complex filters, clean mobile UX)

## Requirements

### Validated

<!-- Shipped and confirmed valuable — inferred from existing codebase. -->

- ✓ Team import from PokePaste, Pikalytics, Showdown format — v1
- ✓ Full Pokemon configuration (EVs, IVs, natures, moves, items, abilities, tera) — v1
- ✓ Per-Pokemon notes, damage calcs, role labels — v1
- ✓ Matchup plans with bring/lead strategy, replay tracking, win/loss — v1
- ✓ Speed tier visualization and type coverage charts — v1
- ✓ Share via short URL with edit tokens, public/private toggle — v1
- ✓ Explore page with search, filter (regulation, archetype, species, placement), sort — v2
- ✓ Creator profiles, follow system, activity feed — v2
- ✓ Collaborative editing with invitations, changelog, version history — v3
- ✓ Collections/folders for organizing teams — v3
- ✓ Comments, reactions, bookmarks on shared reports — v3
- ✓ Presentation mode with slide navigation — v1
- ✓ PDF export with printable report — v2
- ✓ PWA with service worker, install prompt, offline detection — v3
- ✓ 8-language internationalization (EN, ES, FR, IT, JA, KO, ZH) — v3
- ✓ Clerk authentication (Google, Discord, Twitch OAuth) — v1
- ✓ Notification system (comments, collaborations, new versions) — v3
- ✓ Tournament metadata (name, placement, record, rental codes) — v2
- ✓ Archetype auto-detection (Rain, Sun, Sand, Trick Room, Tailwind, etc.) — v2
- ✓ Embed view for external sites — v3
- ✓ Feedback submission system with auto-triage — v4

### Active

<!-- Current scope for v5.0. -->

- [ ] Pokemon exclude filter for explore search
- [ ] Tournament results browsing mode with preset filter combos
- [ ] Enhanced report cards with richer previews
- [ ] Shareable filter URLs for explore searches
- [ ] Advanced filter drawer for mobile-friendly UX

### Out of Scope

<!-- Explicit boundaries for v5.0. -->

- Meta aggregation engine (meta_snapshots table, daily cron pipeline) — Overkill for current data volume; deferred
- Trend indicators (rising/falling badges) — Requires meta aggregation engine; deferred
- Counter-archetype discovery filter — Depends on meta data; deferred
- Popular cores display — Needs weeks of snapshot data; deferred
- Inspiration/novelty feed — Needs data volume calibration; deferred
- External data APIs (Pikalytics, Smogon) — No external dependencies
- Separate /meta page — All discovery surfaces within /explore
- Leaderboards and community tier lists — Future milestone
- Practice mode / ladder tracking — Different focus area
- Tournament lifecycle (round-by-round tracking) — Future milestone
- Personal analytics (win/loss trends, most-brought stats) — Future milestone

## Context

- **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Neon Postgres, Upstash Redis, Clerk auth
- **Deployment:** Vercel (auto-deploy from main), trunk-based development
- **Database:** 15+ tables with full-text search (tsvector), JSONB team data storage
- **Existing explore:** Basic search + filter by regulation/archetype/species/placement, sort by newest/popular/views, cursor pagination, Redis-cached results
- **Public reports:** All meta intelligence will aggregate from the `shares` table where `is_public = true`
- **Caching:** Upstash Redis with TTL-based invalidation already in place for explore queries

## Constraints

- **Performance:** Explore page must remain fast (<1s load) even with richer cards and filters
- **Vercel Hobby:** Serverless function limits (10s timeout, 1MB response)
- **Incremental:** Must not break existing explore functionality; enhance progressively
- **Mobile-first:** Filter drawer and enhanced cards must work well on mobile screens

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Defer meta aggregation pipeline | Overkill for current data volume; focus on UX improvements first | ✓ Good |
| Enhance /explore vs separate pages | Users already navigate to /explore; avoid splitting attention | ✓ Good |
| Advanced filter drawer pattern | Existing filter bar at 8 params; adding more inline breaks mobile UX | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after milestone v5.0 scope revision*
