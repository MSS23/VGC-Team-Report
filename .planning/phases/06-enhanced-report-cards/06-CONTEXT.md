# Phase 6: Enhanced Report Cards - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning
**Mode:** Auto-generated (discuss skipped via autonomous workflow)

<domain>
## Phase Boundary

Explore report cards surface key team information at a glance — top Pokemon, archetype, placement, regulation, and creator — without degrading page performance.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key guidance from success criteria:
- Each report card shows the team's top Pokemon species as sprite icons in a prominent position
- Each report card displays archetype badge(s) (Rain, Trick Room, etc.) inline below the team name
- Tournament placement is displayed with visual distinction for Top 4 and Top 8 (e.g., gold/silver highlight)
- Creator name links to their creator profile page from the card
- Regulation tag is visible on every card without requiring hover or expansion
- The explore page CLS score is unchanged and median load time does not regress after the card changes

</decisions>

<code_context>
## Existing Code Insights

- ReportCard.tsx already shows sprites, placement badge, creator name, tags (regulation, event type, archetype)
- Enhancement is about making these MORE prominent and visually distinct, not adding new data
- Sprites are already lazy-loaded with fallback
- Performance constraint: no CLS regression, no load time increase

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
