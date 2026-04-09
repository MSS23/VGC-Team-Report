# Phase 10: Account Deletion API - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a DELETE /api/user/delete endpoint that permanently erases all user data across 12+ DB tables, calls Clerk deleteUser(), and flushes Redis cache. Must follow correct cascade order to avoid orphaned data.

</domain>

<decisions>
## Implementation Decisions

### API Design
- Endpoint: DELETE /api/user/delete
- Auth: Clerk auth required (401 if unauthenticated)
- Response: 200 on success with { deleted: true }
- Single transaction where possible; ordered cascade otherwise

### Deletion Cascade Order (FK-safe)
Must delete in this order to avoid FK constraint violations:

1. collection_items (via user's collection IDs)
2. collections (user_id)
3. collaborators (user_id)
4. edit_changelog (editor_id)
5. share_versions (editor_id)
6. comments on user's shares (share_id IN user's share IDs)
7. reactions on user's shares (share_id IN user's share IDs)
8. saved_reports (user_id)
9. follows (user_id)
10. notifications (user_id)
11. feedback — ANONYMIZE only (set submitter_id=NULL, submitter_name=NULL) — preserve bug reports
12. shares (owner_id) — includes soft-deleted ones
13. creator_profiles (by creator name from user's shares)
14. Clerk: clerkClient.users.deleteUser(userId) — AFTER all DB steps
15. Redis: flush user-scoped cache keys — FINAL step

### Key Constraints
- Clerk deletion MUST be last DB-external call — if it fails after DB delete, data is already gone
- Feedback rows anonymized not deleted — preserves bug report content
- Include soft-deleted shares (deleted_at IS NOT NULL) in the purge
- Redis flush covers explore cache keys that might reference deleted shares

### Claude's Discretion
- Whether to wrap DB steps in a single SQL transaction or sequential queries
- Redis key pattern for user-scoped cache flush
- Error handling and partial failure recovery

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/app/api/user/analytics/route.ts — Clerk auth pattern
- src/lib/db.ts — getDb() and full schema
- src/app/api/cleanup/route.ts — existing cleanup patterns (if any)

### Established Patterns
- API routes use auth() from @clerk/nextjs/server
- DB queries use neon() tagged template literals
- Clerk backend: @clerk/nextjs/server has clerkClient for user management

### Integration Points
- New route at src/app/api/user/delete/route.ts
- Must import clerkClient from @clerk/nextjs/server
- Redis client from src/lib/cache.ts for cache flush

</code_context>

<specifics>
## Specific Ideas

- The existing analytics route (src/app/api/user/analytics/route.ts) shows the exact pattern for querying multiple tables with the same userId
- Research noted: Clerk's deleteUser() is the irreversible external call — order matters

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
