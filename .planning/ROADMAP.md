# Roadmap — v5.0 Smart Explore Experience

## Milestone: v5.0

**Goal:** Make the Explore page a powerful, intuitive discovery tool with better filters, richer report cards, shareable searches, and a cleaner mobile UX.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Follow Creators** - End-to-end creator follow system
- [ ] **Phase 2: Advanced Filter Drawer** - Collapsible drawer that organizes complex filters, cleans up primary bar
- [ ] **Phase 3: Shareable Filter URLs** - Every filter combination generates a copyable link
- [ ] **Phase 4: Pokemon Exclude Filter** - Users can find teams WITHOUT specific Pokemon
- [ ] **Phase 5: Tournament Results Mode** - Preset browsing mode for tournament-placed teams
- [ ] **Phase 6: Enhanced Report Cards** - Richer explore cards with sprites, badges, placement, and creator info

## Phase Details

### Phase 1: Follow Creators
**Goal:** Build end-to-end creator follow system — DB schema, API routes, follow/unfollow button on creator profiles, follow counts, and "Following" filter on explore page.
**Requirements**: Follows table, follow/unfollow API (Clerk auth required), follow button UI, follower/following counts on creator pages, explore "Following" filter
**Depends on:** None (standalone feature)
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Verify existing follow system + add single-creator check to follow API
- [ ] 01-02-PLAN.md — Add "Following" filter to explore page (API + UI + state wiring)

---

### Phase 2: Advanced Filter Drawer
**Goal:** Users can access complex filters through a clean, organized interface that works well on mobile and keeps the primary bar uncluttered.
**Depends on:** Phase 1
**Requirements:** UX-01, UX-02, UX-03, UX-04, UX-05
**Success Criteria** (what must be TRUE):
  1. User can open an advanced filter drawer by clicking a single "More filters" button on the primary bar
  2. The drawer displays complex filters (placement tier, event type, exclude) in a full-width sheet on mobile
  3. A count badge on the "More filters" button shows how many advanced filters are currently active
  4. The primary filter bar retains regulation, search, species include, archetype, and sort — no other controls
  5. All drawer interactions work with keyboard and screen reader (accessible)
**Plans:** 2 plans
**UI hint**: yes

Plans:
- [ ] 02-01-PLAN.md — Create AdvancedFilterDrawer component + refactor ExploreFilters to integrate drawer
- [ ] 02-02-PLAN.md — Smoke test spec compliance + visual verification checkpoint

---

### Phase 3: Shareable Filter URLs
**Goal:** Every explore filter state is encoded in the URL so users can copy and share exact searches.
**Depends on:** Phase 2
**Requirements:** URL-01, URL-02, URL-03, URL-04, UX-06
**Success Criteria** (what must be TRUE):
  1. User sees a "Copy link" button near the filter bar whenever any filter is active
  2. Clicking "Copy link" copies a URL to clipboard that encodes all active filters
  3. Opening a copied URL in a new tab restores all filters exactly (regulation, species include/exclude, archetype, placement, event type, sort, search query)
  4. Every filter change updates the browser URL immediately without a page reload
**Plans:** TBD
**UI hint**: yes

---

### Phase 4: Pokemon Exclude Filter
**Goal:** Users can discover teams by excluding specific Pokemon, enabling searches like "teams WITH Incineroar but WITHOUT Flutter Mane."
**Depends on:** Phase 2
**Requirements:** FILT-01, FILT-02, FILT-03, FILT-04
**Success Criteria** (what must be TRUE):
  1. User can add one or more Pokemon to an exclude list and results show only teams that do not contain any of those Pokemon
  2. User can combine Pokemon exclusions with existing include filters simultaneously
  3. The exclude filter is accessible from both the primary bar and the advanced drawer
  4. Excluded Pokemon are visually distinct from included Pokemon in the active filter display
**Plans:** TBD
**UI hint**: yes

---

### Phase 5: Tournament Results Mode
**Goal:** Users can browse tournament-placed teams with dedicated filters for event type and placement tier.
**Depends on:** Phase 2
**Requirements:** TOUR-01, TOUR-02, TOUR-03, TOUR-04, TOUR-05
**Success Criteria** (what must be TRUE):
  1. User can activate a "Tournament Results" mode that scopes results to teams with recorded tournament placements
  2. User can filter tournament results by event type (Regionals, Internationals, Worlds, Online)
  3. User can filter tournament results by placement tier (Top 4, Top 8, Top 16, etc.)
  4. Tournament mode filters can be combined with regulation and species include/exclude filters
  5. Report cards in tournament mode display placement prominently with visual distinction for Top 4 and Top 8
**Plans:** TBD
**UI hint**: yes

---

### Phase 6: Enhanced Report Cards
**Goal:** Explore report cards surface key team information at a glance — top Pokemon, archetype, placement, regulation, and creator — without degrading page performance.
**Depends on:** Phase 5
**Requirements:** CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, CARD-06
**Success Criteria** (what must be TRUE):
  1. Each report card shows the team's top Pokemon species as sprite icons in a prominent position
  2. Each report card displays archetype badge(s) (Rain, Trick Room, etc.) inline below the team name
  3. Tournament placement is displayed with visual distinction for Top 4 and Top 8 (e.g., gold/silver highlight)
  4. Creator name links to their creator profile page from the card
  5. Regulation tag is visible on every card without requiring hover or expansion
  6. The explore page CLS score is unchanged and median load time does not regress after the card changes
**Plans:** TBD
**UI hint**: yes

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Follow Creators | 0/2 | In progress | - |
| 2. Advanced Filter Drawer | 0/2 | Not started | - |
| 3. Shareable Filter URLs | 0/TBD | Not started | - |
| 4. Pokemon Exclude Filter | 0/TBD | Not started | - |
| 5. Tournament Results Mode | 0/TBD | Not started | - |
| 6. Enhanced Report Cards | 0/TBD | Not started | - |
