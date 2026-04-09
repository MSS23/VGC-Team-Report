# Phase 9: Data Export API - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a GET /api/user/export endpoint that returns a JSON file containing all data associated with the authenticated user across all DB tables. Rate-limited to 1 request per 24 hours.

</domain>

<decisions>
## Implementation Decisions

### API Design
- Endpoint: GET /api/user/export
- Auth: Clerk auth required (401 if unauthenticated)
- Rate limit: 1 export per 24 hours per user (429 if exceeded)
- Response: JSON file download with Content-Disposition: attachment header
- Use Promise.all for parallel queries (Vercel 10s timeout constraint)

### Data Tables to Export (user_id = Clerk userId)
1. shares (owner_id = userId) — team reports
2. saved_reports (user_id) — bookmarks
3. follows (user_id) — creator follows
4. notifications (user_id) — notifications
5. collections (user_id) — folders
6. collection_items (via collection_id from user's collections)
7. collaborators (user_id) — collaboration records
8. edit_changelog (editor_id = userId) — edit history
9. share_versions (editor_id = userId) — version snapshots
10. feedback (submitter_id = userId) — feedback submissions
11. comments (where share_id IN user's shares) — comments on user's reports
12. reactions (where share_id IN user's shares) — reactions on user's reports

### Rate Limiting
- Use Upstash Redis to track last export timestamp per user
- Key: `export:${userId}`, TTL: 86400 seconds (24h)
- If key exists, return 429

### Claude's Discretion
- JSON structure and field naming
- Whether to include LIMIT per table (research suggests 1000 rows + truncated flag)
- Error handling for individual table query failures

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- src/app/api/user/analytics/route.ts — pattern for authenticated API routes with Clerk auth
- src/lib/db.ts — getDb() for Neon queries
- src/lib/cache.ts — Upstash Redis client (if rate limiting needed)

### Established Patterns
- API routes use `auth()` from @clerk/nextjs/server for authentication
- Return NextResponse.json() for data, NextResponse with status for errors
- Parallel DB queries via Promise.all pattern (see analytics route)

### Integration Points
- New route at src/app/api/user/export/route.ts
- Uses same Clerk auth pattern as other /api/user/* routes

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard GDPR Art 20 data portability endpoint.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
