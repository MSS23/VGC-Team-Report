# Roadmap — VGC Team Report

## Milestones

- **v5.0 Smart Explore Experience** — Phases 1-6 (in progress)
- **v5.1 Legal Compliance & Data Protection** — Phases 7-11 (planned)
- **v5.2 UX Feedback Polish** — Phases 12-14 (planned)

---

<details>
<summary>v5.0 Smart Explore Experience (Phases 1-6)</summary>

**Milestone Goal:** Make the Explore page a powerful, intuitive discovery tool with better filters, richer report cards, shareable searches, and a cleaner mobile UX.

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
**Plans:** 2/2 plans executed
**UI hint**: yes

Plans:
- [x] 02-01-PLAN.md — Create AdvancedFilterDrawer component + refactor ExploreFilters to integrate drawer
- [x] 02-02-PLAN.md — Smoke test spec compliance + visual verification checkpoint

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
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Create useExploreUrlSync hook + integrate into ExploreContent for bidirectional URL sync
- [x] 03-02-PLAN.md — Add Copy link button to ExploreFilters + visual verification checkpoint

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
**Plans:** 1/1 plans complete

Plans:
- [x] 04-01-PLAN.md — Add excludeSpecies end-to-end: API filtering, URL sync, primary bar + drawer UI with visual distinction

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
**Plans:** 2/2 plans complete
**UI hint**: yes

Plans:
- [x] 05-01-PLAN.md — Tournament mode toggle + filter presets (URL sync, ExploreFilters button, preset behavior)
- [x] 05-02-PLAN.md — Enhanced placement badge styling on ReportCard (tiered gold/silver/bronze)

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
**Plans:** 2 plans
**UI hint**: yes

Plans:
- [x] 06-01-PLAN.md — Enhance ReportCard visual hierarchy: larger sprites, archetype badges below title, regulation corner pill, creator link styling
- [x] 06-02-PLAN.md — Visual + performance verification checkpoint (Lighthouse CLS check)

</details>

---

<details>
<summary>v5.1 Legal Compliance & Data Protection (Phases 7-11)</summary>

**Milestone Goal:** Make VGC Team Report legally compliant with GDPR and CCPA — privacy policy, terms of service, cookie consent, user data rights, and proper data handling.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (7.1, 7.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 7: Legal Pages and Footer** - GDPR/CCPA-compliant privacy policy, terms of service, and footer links on every page
- [ ] **Phase 8: Cookie Consent and Analytics Gating** - Cookie consent banner with one-click reject and full Vercel Analytics gating
- [ ] **Phase 9: Data Export API** - Authenticated users can download all their data as structured JSON
- [ ] **Phase 10: Account Deletion API** - Authenticated users can permanently erase their account and all associated data
- [ ] **Phase 11: Data Rights Hub UI** - Self-service dashboard section surfaces export and deletion as visible user controls

## Phase Details

### Phase 7: Legal Pages and Footer
**Goal:** Users can read compliant legal pages and the site footer links to them from every page — unblocking all other compliance phases.
**Depends on:** Nothing (first phase of v5.1)
**Requirements:** LEGAL-01, LEGAL-02, LEGAL-03, SITE-01, SITE-02
**Success Criteria** (what must be TRUE):
  1. User can navigate to `/privacy` and read a full GDPR Article 13-compliant privacy policy that names specific legal bases, retention periods, and all third-party processors (Clerk, Vercel, Neon, Upstash) with DPA links
  2. User can navigate to `/terms` and read terms of service covering acceptable use, Pokemon trademark notice, IP disclaimers, and liability limits
  3. The privacy policy contains an explicit CCPA "Do Not Sell My Personal Information" section affirming no data is sold
  4. Every page on the site shows a footer with working links to Privacy Policy, Terms of Service, and Cookie Settings
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md — Rewrite /privacy (GDPR Art. 13 compliance, DPA links, CCPA disclosure) + add Terms and Cookie Settings to PageFooter
- [x] 07-02-PLAN.md — Create /terms page with Terms of Service content and TermsNavbar component
**UI hint**: yes

---

### Phase 8: Cookie Consent and Analytics Gating
**Goal:** Users are asked for cookie consent on first visit with a legally compliant banner, and Vercel Analytics does not fire until consent is granted.
**Depends on:** Phase 7
**Requirements:** COOKIE-01, COOKIE-02, COOKIE-03, COOKIE-04
**Success Criteria** (what must be TRUE):
  1. A new visitor sees a cookie consent banner that offers "Accept All" and "Reject All" buttons with equal visual prominence — rejection requires exactly one click
  2. Opening DevTools Network in a fresh incognito tab shows zero Vercel Analytics requests before the user interacts with the banner
  3. After accepting, Vercel Analytics loads normally; after rejecting, it remains blocked for the entire session
  4. Returning to the site in a new browser session preserves the user's previous consent choice without showing the banner again
  5. User can re-open cookie preferences at any time by clicking "Cookie Settings" in the site footer
**Plans:** 2 plans

Plans:
- [ ] 08-01-PLAN.md — Install vanilla-cookieconsent, create consent utility, CookieBanner, ConsentGate
- [ ] 08-02-PLAN.md — Gate PostHog init + wire layout.tsx + human verify checkpoint
**UI hint**: yes

---

### Phase 9: Data Export API
**Goal:** An authenticated user can request and download all their personal data as a structured JSON file covering all 13 database tables.
**Depends on:** Phase 7
**Requirements:** DATA-01
**Success Criteria** (what must be TRUE):
  1. An authenticated user can trigger a data export via `GET /api/user/export` and receive a downloadable JSON file
  2. The exported JSON contains data from all 13 user-linked tables (teams, shares, notes, collections, collaborations, follows, bookmarks, reactions, comments, notifications, matchup plans, feedback, edit changelog)
  3. The export endpoint returns HTTP 429 if the same user requests a second export within 24 hours
  4. An unauthenticated request to the export endpoint returns HTTP 401
**Plans:** TBD

---

### Phase 10: Account Deletion API
**Goal:** An authenticated user can permanently erase their account — all data across 13 database tables, their Clerk identity, and any Redis cache entries — in the correct cascade order.
**Depends on:** Phase 9
**Requirements:** DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. An authenticated user can trigger account deletion via `DELETE /api/user/delete` and their data is removed from all 13 database tables
  2. After deletion completes, querying every affected table for the deleted user ID returns zero rows (no ghost records)
  3. The Clerk user record is deleted only after all database cascade steps succeed — not before
  4. All Redis cache keys associated with the deleted user are flushed as the final step
  5. An unauthenticated request to the delete endpoint returns HTTP 401
**Plans:** TBD

---

### Phase 11: Data Rights Hub UI
**Goal:** Users can access self-service data export and account deletion from a dedicated section in their dashboard, with appropriate confirmation flows to prevent accidents.
**Depends on:** Phase 10
**Requirements:** DATA-04
**Success Criteria** (what must be TRUE):
  1. An authenticated user can navigate to `/dashboard/privacy` and see both a "Download My Data" button and a "Delete My Account" button
  2. Clicking "Download My Data" triggers the export API and initiates a file download without leaving the page
  3. Clicking "Delete My Account" opens a confirmation modal that requires the user to type "DELETE" before the action is enabled
  4. After successful deletion the user is signed out and redirected, and attempting to sign back in with the same credentials shows no account
**Plans:** TBD
**UI hint**: yes

</details>

---

## v5.2 UX Feedback Polish (Phases 12-14)

**Milestone Goal:** Address 6 user-reported UX issues from real testing — improve first-visit onboarding, mobile interactions, and navigation discoverability. All fixes target existing features; no new infrastructure.

## Phases

- [ ] **Phase 12: Tour Discovery & First-Visit Onboarding** - Tour auto-shows on first visit and is accessible from the hamburger menu at any time
- [ ] **Phase 13: Progress Bar Improvements** - Progress bar ? tooltip explains the bar itself, and the bar framing no longer implies task completion
- [ ] **Phase 14: Mobile Interaction Fixes** - Pokemon tile tap navigates directly on mobile, and pages render without layout shift in all mobile contexts including Discord in-app browser

## Phase Details

### Phase 12: Tour Discovery & First-Visit Onboarding
**Goal:** New users encounter the tour automatically, and returning users can always find it again without hunting.
**Depends on:** Nothing (standalone UX fix)
**Requirements:** TOUR-01, TOUR-02
**Success Criteria** (what must be TRUE):
  1. A first-time visitor lands on the app and the site tour starts automatically — no button needed to trigger it
  2. The auto-tour only fires once per browser; returning visits do not re-trigger it
  3. A user on mobile can open the hamburger menu and tap a clearly labelled "Tour" or "Take the tour" option to start the tour at any time
  4. The tour option in the hamburger menu is visible whether or not the user has previously completed the tour
**Plans:** TBD
**UI hint**: yes

---

### Phase 13: Progress Bar Improvements
**Goal:** The progress bar and its help affordance communicate navigation state accurately — the ? explains the bar, and the bar framing does not suggest task completion.
**Depends on:** Phase 12
**Requirements:** TOUR-03, NAV-01
**Success Criteria** (what must be TRUE):
  1. Clicking or tapping the ? icon on the progress bar opens a tooltip or popover that explains what the progress bar represents — it does not launch the full site tour
  2. The progress bar displays current position without using M/N numeric framing (e.g., "3/6") that implies a checklist or task sequence
  3. A user who has never seen the site can look at the progress bar and understand it as a navigation indicator, not a to-do list
**Plans:** TBD
**UI hint**: yes

---

### Phase 14: Mobile Interaction Fixes
**Goal:** Mobile users can interact with Pokemon tiles by tapping normally, and pages load without visible layout shift or re-render flash on any mobile context.
**Depends on:** Nothing (independent bug fixes)
**Requirements:** MOBILE-01, MOBILE-02
**Success Criteria** (what must be TRUE):
  1. Tapping a Pokemon tile on a touch device navigates to that Pokemon's detail view — no long-press or second interaction required
  2. The app loads without a visible flash or layout shift on iOS Safari and Android Chrome
  3. The app loads without a visible flash or layout shift when opened from a Discord in-app browser link
  4. No existing desktop Pokemon tile interaction is changed by the mobile tap fix
**Plans:** TBD
**UI hint**: yes

---

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Follow Creators | v5.0 | 0/2 | In progress | - |
| 2. Advanced Filter Drawer | v5.0 | 2/2 | In Progress | - |
| 3. Shareable Filter URLs | v5.0 | 0/2 | Not started | - |
| 4. Pokemon Exclude Filter | v5.0 | 1/1 | Complete | 2026-04-03 |
| 5. Tournament Results Mode | v5.0 | 2/2 | Complete | 2026-04-03 |
| 6. Enhanced Report Cards | v5.0 | 0/2 | Not started | - |
| 7. Legal Pages and Footer | v5.1 | 2/2 | Complete   | 2026-04-05 |
| 8. Cookie Consent and Analytics Gating | v5.1 | 0/? | Not started | - |
| 9. Data Export API | v5.1 | 0/? | Not started | - |
| 10. Account Deletion API | v5.1 | 0/? | Not started | - |
| 11. Data Rights Hub UI | v5.1 | 0/? | Not started | - |
| 12. Tour Discovery & First-Visit Onboarding | v5.2 | 0/? | Not started | - |
| 13. Progress Bar Improvements | v5.2 | 0/? | Not started | - |
| 14. Mobile Interaction Fixes | v5.2 | 0/? | Not started | - |
