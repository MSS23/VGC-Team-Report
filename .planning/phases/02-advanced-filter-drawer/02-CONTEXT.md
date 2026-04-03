# Phase 2: Advanced Filter Drawer - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a collapsible advanced filter drawer that reorganizes the explore filter bar. Move less-frequently-used filters (placement, event type, Following toggle) into an expandable drawer while keeping the most-used filters (regulation, search, species include, archetype chips, sort) on the primary bar. The drawer must work as a full-width bottom sheet on mobile and a dropdown panel on desktop.

</domain>

<decisions>
## Implementation Decisions

### Drawer Behavior
- Drawer slides up from bottom on mobile (bottom sheet), appears as dropdown panel on desktop
- "More filters" button sits at the end of the primary filter bar, after the archetype chips
- Filters in drawer apply instantly as each filter changes (no "Apply" button) — matches existing behavior
- Drawer closes via click outside, swipe down (mobile), Escape key, or X button

### Filter Redistribution
- Move to drawer: placement dropdown, event type dropdown, Following toggle
- Stay on primary bar: search categories (All/Pokemon/Tournament/Creator), search input, sort dropdown, species input, regulation dropdown, archetype chips
- Archetype chips stay visible on desktop, remain in a scrollable row on mobile
- Species filter stays on primary bar (high-frequency use)

### Visual Design & Accessibility
- Count badge: small numeric badge (e.g., "2") in accent color on the "More filters" button
- Drawer background: same surface color as filter bar with subtle border (consistent styling)
- Active filter indicators: filled accent styling matching existing archetype chip pattern
- "Clear filters" text button at bottom of drawer to reset all advanced filters
- All drawer interactions work with keyboard (Tab, Escape) and screen reader (aria-expanded, aria-controls, role="dialog")

### Claude's Discretion
- Animation timing and easing for drawer open/close
- Exact breakpoint for mobile vs desktop drawer behavior (likely sm: or md:)
- Internal layout of filters within the drawer (stacking, spacing)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ExploreFilters.tsx` — Current filter bar component with 15 props, all filter state managed by parent `ExploreContent.tsx`
- `ExploreContent.tsx` — Parent component managing all filter state as individual `useState` hooks
- Existing `motion` library for animations (already imported in explore components)
- Tailwind custom variants: `@custom-variant` for context-specific styling
- CSS variables for theming: `--background`, `--surface`, `--accent`, `--border`, etc.

### Established Patterns
- All filter state lives in `ExploreContent` and is passed down as props
- Filter changes trigger `fetchReports` via `useCallback` + `useEffect` dependency array
- Sticky filter bar: `sticky top-14 z-30` with backdrop blur
- Select dropdowns use consistent styling: `bg-surface border border-border rounded-lg text-xs font-semibold`
- Archetype chips use toggle pattern with accent styling when active

### Integration Points
- `ExploreFilters` component will be refactored to split primary bar vs drawer
- No new state needed in `ExploreContent` — drawer open/close is local to `ExploreFilters`
- Filter callbacks (`onPlacementChange`, `onEventTypeChange`, `onFollowingOnlyChange`) stay unchanged
- The `fetchReports` function already includes all filter params — no API changes needed

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for drawer implementation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
