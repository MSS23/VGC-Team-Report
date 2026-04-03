# Phase 3: Shareable Filter URLs - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via autonomous workflow)

<domain>
## Phase Boundary

Every explore filter state is encoded in the URL so users can copy and share exact searches. Filter changes update the browser URL immediately. A "Copy link" button appears when filters are active.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key guidance from success criteria:
- User sees a "Copy link" button near the filter bar whenever any filter is active
- Clicking "Copy link" copies a URL to clipboard that encodes all active filters
- Opening a copied URL in a new tab restores all filters exactly (regulation, species include/exclude, archetype, placement, event type, sort, search query)
- Every filter change updates the browser URL immediately without a page reload

</decisions>

<code_context>
## Existing Code Insights

Codebase context will be gathered during plan-phase research.

</code_context>

<specifics>
## Specific Ideas

Use Next.js searchParams / URLSearchParams to encode filter state. The existing `fetchReports` callback in ExploreContent.tsx already builds URLSearchParams for the API call — mirror this for the browser URL.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
