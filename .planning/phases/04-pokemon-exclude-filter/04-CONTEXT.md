# Phase 4: Pokemon Exclude Filter - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via autonomous workflow)

<domain>
## Phase Boundary

Users can discover teams by excluding specific Pokemon, enabling searches like "teams WITH Incineroar but WITHOUT Flutter Mane." The exclude filter is accessible from both the primary bar and the advanced drawer.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key guidance from success criteria:
- User can add one or more Pokemon to an exclude list and results show only teams that do not contain any of those Pokemon
- User can combine Pokemon exclusions with existing include filters simultaneously
- The exclude filter is accessible from both the primary bar and the advanced drawer
- Excluded Pokemon are visually distinct from included Pokemon in the active filter display

</decisions>

<code_context>
## Existing Code Insights

- Existing species include filter in ExploreFilters.tsx uses a text input with comma-separated values
- API route `/api/explore` uses `ILIKE` on `data->>'paste'` for species filtering
- Exclude will need a `NOT (data->>'paste' ILIKE '%Species%')` SQL extension
- New `excludeSpecies` param on the API + new state in ExploreContent

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
