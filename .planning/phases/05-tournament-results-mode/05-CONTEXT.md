# Phase 5: Tournament Results Mode - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via autonomous workflow)

<domain>
## Phase Boundary

Users can browse tournament-placed teams with dedicated filters for event type and placement tier. A "Tournament Results" mode presets filters and displays placement prominently on report cards.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key guidance from success criteria:
- User can activate a "Tournament Results" mode that scopes results to teams with recorded tournament placements
- User can filter tournament results by event type (Regionals, Internationals, Worlds, Online)
- User can filter tournament results by placement tier (Top 4, Top 8, Top 16, etc.)
- Tournament mode filters can be combined with regulation and species include/exclude filters
- Report cards in tournament mode display placement prominently with visual distinction for Top 4 and Top 8

</decisions>

<code_context>
## Existing Code Insights

- Backend already supports `filterPlacement` and `filterEventType` in `/api/explore` route
- These filters are now in the Advanced Filter Drawer (Phase 2)
- Tournament mode is essentially a preset that activates placement + event type filters together
- ReportCard.tsx already shows placement as a small badge — needs visual enhancement for tournament mode

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
