# Phase 11: Data Rights Hub UI - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a self-service data rights section at /dashboard/privacy with "Download My Data" and "Delete My Account" buttons. Deletion requires typing "DELETE" in a confirmation modal.

</domain>

<decisions>
## Implementation Decisions

### Page Location
- Route: /dashboard/privacy (new page in existing dashboard)
- Must be accessible from dashboard navigation

### Download My Data
- Triggers GET /api/user/export (Phase 9)
- Initiates file download without leaving the page
- Show loading state while export is being prepared
- Handle 429 (rate limit) with user-friendly message

### Delete My Account
- Opens a confirmation modal requiring user to type "DELETE"
- Button only enables when typed text matches exactly
- Calls DELETE /api/user/delete (Phase 10)
- On success: sign out user and redirect to home page
- Destructive action — use red/danger styling for the button

### Claude's Discretion
- Dashboard page layout and component structure
- Loading and error states
- Whether to add a link in the dashboard sidebar/nav

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/app/dashboard/ — existing dashboard pages for layout patterns
- src/app/dashboard/DashboardContent.tsx — dashboard layout structure
- Existing modal patterns in the codebase

### Established Patterns
- Dashboard pages use client components with useAuth/useUser
- Modals use state-controlled visibility
- Buttons follow existing design token classes

### Integration Points
- New route at src/app/dashboard/privacy/page.tsx
- Calls /api/user/export and /api/user/delete endpoints from Phases 9-10
- Uses Clerk's useClerk() for signOut after deletion

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard data rights self-service UI.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
