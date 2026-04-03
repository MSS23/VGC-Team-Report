# Requirements: VGC Team Report

**Defined:** 2026-04-03
**Core Value:** Players can build, document, share, and discover competitive VGC teams in one place

## v5.0 Requirements

Requirements for Smart Explore Experience milestone. Each maps to roadmap phases.

### Filtering

- [x] **FILT-01**: User can exclude specific Pokemon from explore results (e.g., "teams WITHOUT Flutter Mane")
- [x] **FILT-02**: User can apply multiple Pokemon exclusions simultaneously
- [x] **FILT-03**: User can combine Pokemon exclusion with existing include filters (e.g., "teams WITH Incineroar but WITHOUT Flutter Mane")
- [x] **FILT-04**: Exclude filter is accessible from both primary filter bar and advanced drawer

### Tournament Browsing

- [x] **TOUR-01**: User can enter a "Tournament Results" browsing mode that presets filters for tournament-placed teams
- [x] **TOUR-02**: User can filter tournament results by event type (Regionals, Internationals, Worlds, Online)
- [x] **TOUR-03**: User can filter tournament results by placement tier (Top 4, Top 8, Top 16, etc.)
- [x] **TOUR-04**: User can combine tournament filters with regulation and species filters
- [x] **TOUR-05**: Tournament mode displays placement prominently on report cards

### Report Cards

- [ ] **CARD-01**: Report card displays the team's top Pokemon species with sprites prominently
- [ ] **CARD-02**: Report card shows archetype badge(s) (Rain, Trick Room, etc.) inline
- [ ] **CARD-03**: Report card displays tournament placement with visual distinction for high placements (Top 4, Top 8)
- [ ] **CARD-04**: Report card shows creator name with link to creator profile
- [ ] **CARD-05**: Report card shows regulation tag visually
- [ ] **CARD-06**: Enhanced cards load without increasing explore page CLS or degrading load time

### Shareable URLs

- [x] **URL-01**: User can copy a shareable URL that encodes the current explore filter state
- [x] **URL-02**: Opening a shared filter URL restores all active filters exactly
- [x] **URL-03**: Shareable URL includes regulation, species (include/exclude), archetype, placement, event type, sort, and search query
- [ ] **URL-04**: User sees a "Copy link" button near the filter bar when any filters are active

### Filter UX

- [x] **UX-01**: Complex filters (exclude, event type, placement tier) are organized in a collapsible advanced filter drawer
- [x] **UX-02**: Advanced drawer is accessible via a single "More filters" button on the primary bar
- [x] **UX-03**: Active advanced filters show a count badge on the "More filters" button
- [x] **UX-04**: Advanced drawer works well on mobile with full-width sheet behavior
- [x] **UX-05**: Primary filter bar retains the most-used filters (regulation, search, species include, archetype, sort)
- [x] **UX-06**: All filter changes are reflected in the URL immediately (for URL-01)

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Meta Intelligence

- **META-01**: User can see top Pokemon by usage for the current regulation
- **META-02**: User can see archetype distribution percentages
- **META-03**: User can see rising/falling trend indicators on Pokemon
- **META-04**: User can find teams that counter a specific archetype
- **META-05**: User can discover novel/creative builds via diversity scoring

### Analytics

- **ANLYT-01**: User can track personal win/loss trends over time
- **ANLYT-02**: User can see which Pokemon they bring most frequently

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Meta aggregation pipeline (snapshots table, cron) | Overkill for current data volume; revisit when report count grows |
| Trend badges on cards | Requires meta aggregation engine |
| Counter-archetype discovery filter | Requires meta data pipeline |
| Popular cores display | Needs weeks of snapshot data to be meaningful |
| Separate /meta page | All discovery surfaces within /explore |
| External API integration | No external dependencies; app's own data only |
| AI-generated team recommendations | Hallucination risk; ground in community data instead |
| Tier lists | No battle outcome data to support rankings |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FILT-01 | Phase 4 | Complete |
| FILT-02 | Phase 4 | Complete |
| FILT-03 | Phase 4 | Complete |
| FILT-04 | Phase 4 | Complete |
| TOUR-01 | Phase 5 | Complete |
| TOUR-02 | Phase 5 | Complete |
| TOUR-03 | Phase 5 | Complete |
| TOUR-04 | Phase 5 | Complete |
| TOUR-05 | Phase 5 | Complete |
| CARD-01 | Phase 6 | Pending |
| CARD-02 | Phase 6 | Pending |
| CARD-03 | Phase 6 | Pending |
| CARD-04 | Phase 6 | Pending |
| CARD-05 | Phase 6 | Pending |
| CARD-06 | Phase 6 | Pending |
| URL-01 | Phase 3 | Complete |
| URL-02 | Phase 3 | Complete |
| URL-03 | Phase 3 | Complete |
| URL-04 | Phase 3 | Pending |
| UX-01 | Phase 2 | Complete |
| UX-02 | Phase 2 | Complete |
| UX-03 | Phase 2 | Complete |
| UX-04 | Phase 2 | Complete |
| UX-05 | Phase 2 | Complete |
| UX-06 | Phase 3 | Complete |

**Coverage:**
- v5.0 requirements: 25 total
- Mapped to phases: 25
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 — traceability mapped after roadmap creation*
