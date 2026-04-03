# Phase 1: Follow Creators - Research

**Researched:** 2026-04-03
**Domain:** Social follow system (DB, API, UI, explore filter) — Next.js 16 / Neon Postgres / Upstash Redis / Clerk auth
**Confidence:** HIGH

---

## Summary

Phase 1 is largely already implemented in the codebase. The `follows` table exists with correct schema and indexes. The `/api/user/follow` route (GET/POST/DELETE) is complete. The `FollowButton` component exists and works. The `CreatorProfile` page already surfaces `followerCount` from the API, and the `FollowButton` is embedded in the creator profile header.

The one genuinely missing piece is the **"Following" filter on the explore page** — neither `ExploreFilters`, `ExploreContent`, nor the `/api/explore` route have any concept of a following-based filter. Adding it requires: (1) a new `following` boolean filter param on the explore API that JOINs `follows` against the Clerk `userId`, (2) new filter UI in `ExploreFilters`, and (3) wiring state in `ExploreContent`.

There is also a subtle FollowButton UX issue worth addressing: it fetches ALL followed creators on every page load to check if the current creator is followed. This is an N+1-style smell — as the follow list grows it wastes bandwidth. A targeted `GET /api/user/follow?creator=X` endpoint would be preferable.

**Primary recommendation:** Treat Phase 1 as a gap-fill and polish pass. The DB and most API/UI already exist. Focus effort on: (1) Following filter in explore (new work), (2) optional FollowButton efficiency fix, (3) verify the `ensureTable` migration for `follows` has been applied to the live Neon database.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| Follows table | `follows(user_id, creator_name, created_at)` with PK and indexes | Already defined in `src/lib/db.ts` `ensureTable()` — no code change needed; verify live DB has table |
| Follow/unfollow API (Clerk auth required) | POST/DELETE `/api/user/follow` with `creatorName` body, GET to list followed | Already implemented at `src/app/api/user/follow/route.ts` — functional and correct |
| Follow button UI | Button on creator profile pages, toggles follow state | Already implemented as `src/components/social/FollowButton.tsx` and embedded in `CreatorProfile.tsx` |
| Follower/following counts on creator pages | `followerCount` stat on creator profile | Already returned by `/api/creator/[name]` and rendered in `CreatorProfile.tsx` stats row |
| Explore "Following" filter | Filter explore results to only show reports by creators the logged-in user follows | NOT YET IMPLEMENTED — requires API + UI + state changes |
</phase_requirements>

---

## Standard Stack

All stack choices are locked by the existing codebase — no library selection needed.

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Neon Postgres (`@neondatabase/serverless`) | Existing | Stores `follows` table | Already the project DB |
| Clerk (`@clerk/nextjs`) | Existing | `auth()` server-side for `userId` | Already the auth system |
| Upstash Redis (`@upstash/redis`) | Existing | Cache explore results | Already the caching layer |
| Next.js App Router | 16.x | API routes and pages | Project stack |
| Zod | Existing | Input validation on API routes | Already used in follow route |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useUser` (Clerk) | Existing | Client-side user check for FollowButton | Already used — render button only when logged in |
| `@vercel/analytics` (`track`) | Existing | Track follow/unfollow events | Already called in FollowButton |

---

## Architecture Patterns

### Existing Project Structure (relevant paths)
```
src/
├── app/
│   ├── api/
│   │   ├── user/follow/route.ts      # GET/POST/DELETE — DONE
│   │   └── explore/route.ts          # Needs followingFilter param added
│   └── creator/[name]/page.tsx       # Uses CreatorProfileWrapper
├── components/
│   ├── social/
│   │   ├── FollowButton.tsx          # DONE
│   │   └── CreatorProfile.tsx        # DONE — embeds FollowButton, shows followerCount
│   └── explore/
│       ├── ExploreContent.tsx        # Needs followingFilter state
│       └── ExploreFilters.tsx        # Needs Following toggle UI
└── lib/
    ├── db.ts                          # ensureTable — follows table DONE
    └── cache.ts                       # CacheKeys.explore — needs followingFilter in key
```

### Pattern 1: Following Filter in Explore API
**What:** When `?following=1` param is sent AND user is authenticated, JOIN `follows` to restrict results to creators the user follows.
**When to use:** Only when user is logged in and filter is toggled on.
**Key consideration:** The explore route currently uses Redis caching keyed by params. A `following` filter is user-specific — it MUST NOT be cached in the shared Redis cache (or must be bypassed for authenticated, following-filtered requests to avoid serving one user's following list to another).

```typescript
// In /api/explore/route.ts — add near the top of GET:
const filterFollowing = url.searchParams.get("following") === "1";
let followingCreators: string[] = [];

if (filterFollowing) {
  // Require auth — no cache for this path
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sql = getDb();
  const followRows = await sql`SELECT creator_name FROM follows WHERE user_id = ${userId}`;
  followingCreators = followRows.map((r) => r.creator_name as string);
  if (followingCreators.length === 0) {
    return NextResponse.json({ reports: [], nextCursor: null });
  }
}
```

Then add the condition to all three query branches (popular/views/newest):
```typescript
// Add to WHERE clause in each sort branch:
${filterFollowing ? sql`AND LOWER(s.data->>'creatorName') = ANY(${followingCreators.map(n => n.toLowerCase())})` : sql``}
```

And skip cache when `filterFollowing` is true:
```typescript
// Skip cache check and cache set for user-specific queries
if (!filterFollowing) {
  const cacheKey = CacheKeys.explore(/* ... */);
  const cached = await cacheGet(cacheKey);
  if (cached) return NextResponse.json(cached);
}
// ... after building result:
if (!filterFollowing) {
  await cacheSet(cacheKey, result, CacheTTL.EXPLORE_LIST);
}
```

### Pattern 2: Following Filter UI in ExploreFilters
**What:** A toggle button (similar to existing search category tabs style) that enables/disables the Following filter. Only visible when user is signed in.
**When to use:** Logged-in users who follow at least one creator.

```typescript
// In ExploreFilters.tsx — add prop:
followingOnly: boolean;
onFollowingOnlyChange: (v: boolean) => void;

// Render a toggle near the search category row:
{user && (
  <button
    type="button"
    onClick={() => onFollowingOnlyChange(!followingOnly)}
    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer active:scale-[0.97] ${
      followingOnly
        ? "bg-accent text-white shadow-sm shadow-accent/20 ring-2 ring-accent/30 ring-offset-1 ring-offset-background"
        : "bg-surface-alt/50 text-text-secondary hover:text-text-primary hover:bg-surface-alt"
    }`}
    aria-pressed={followingOnly}
  >
    {/* person-check SVG icon */}
    Following
  </button>
)}
```

### Pattern 3: FollowButton Efficiency (optional improvement)
**Current:** FollowButton fetches `/api/user/follow` (returns ALL followed creators) just to check if the current creator is in the list. This scales poorly.
**Better:** Add a `?creator=X` query param to GET to return a single boolean check:

```typescript
// In /api/user/follow/route.ts GET:
const creatorParam = url.searchParams.get("creator");
if (creatorParam) {
  const row = await sql`SELECT 1 FROM follows WHERE user_id = ${userId} AND LOWER(creator_name) = ${creatorParam.toLowerCase()} LIMIT 1`;
  return NextResponse.json({ following: row.length > 0 });
}
// else: return full list (existing behavior)
```

### Anti-Patterns to Avoid
- **Caching following-filtered explore results in shared Redis:** User A and User B follow different creators — a shared cache key would return wrong results. Skip cache for `following=1` requests.
- **Blocking explore render on auth check:** The Following filter is additive. If user is not logged in, simply hide the toggle — don't gate the entire explore page.
- **Case-sensitivity mismatch:** `follows.creator_name` is stored as submitted (mixed case). The existing `creator API` uses `LOWER()` comparisons. The follow API uses `.toLowerCase()` in the FollowButton component check. Keep using `LOWER()` in SQL for the Following filter JOIN.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth on follow API | Custom session/cookie auth | `auth()` from `@clerk/nextjs/server` | Already in place, type-safe, handles all OAuth providers |
| Input validation | Manual string checks | `zod` `safeParse` | Already used in the follow route — consistent pattern |
| DB connection | Raw `pg` / connection pooling | `neon()` from `@neondatabase/serverless` | Already project standard; handles Vercel serverless correctly |
| Cache invalidation | Manual Redis key tracking | Skip cache for user-specific queries | Simpler and correct — don't try to invalidate per-user keys |

---

## Common Pitfalls

### Pitfall 1: Shared Cache Poisoning for User-Specific Queries
**What goes wrong:** The explore route caches results by param string. If `following=1` is included in the cache key, user A's following list gets served to user B who makes the same request at the same time.
**Why it happens:** The existing cache is designed for public, anonymous queries.
**How to avoid:** Never cache `following=1` responses. Add `if (!filterFollowing)` guard around both `cacheGet` and `cacheSet`.
**Warning signs:** Users see each other's following feeds in explore.

### Pitfall 2: Empty Following List Returns All Reports
**What goes wrong:** If the SQL condition is `AND creator_name = ANY([])`, some Postgres drivers/SQL builders return all rows rather than zero rows for an empty array.
**Why it happens:** `= ANY('')` or `= ANY(ARRAY[]::text[])` can behave unexpectedly.
**How to avoid:** Short-circuit early — if `followingCreators.length === 0`, return `{ reports: [], nextCursor: null }` before executing the query.
**Warning signs:** Following filter shows all reports instead of empty state.

### Pitfall 3: FollowButton Shows for Own Profile
**What goes wrong:** A creator visits their own profile and sees a Follow button for themselves.
**Why it happens:** The button renders for any logged-in user without checking if `user.username === creatorName`.
**How to avoid:** In `FollowButton`, compare `user.username` (or appropriate Clerk field) with `creatorName` and return null if they match.
**Warning signs:** Creators can follow themselves; the follow count inflates.

### Pitfall 4: Case-Sensitivity in Follow Checks
**What goes wrong:** User follows "Manraj" but the explore filter queries for "manraj" — no match.
**Why it happens:** `creator_name` is stored with original case, comparisons must normalize.
**How to avoid:** Always use `LOWER()` on both sides in SQL, and `.toLowerCase()` in JS comparisons. This is already done in the existing `creator API` and `FollowButton` — maintain the pattern.
**Warning signs:** Follow button shows "Follow" even though the creator is already followed.

---

## Code Examples

### Existing: Follow API Route (DONE — no changes needed)
```typescript
// Source: src/app/api/user/follow/route.ts
// POST: INSERT INTO follows (user_id, creator_name) VALUES ($1, $2) ON CONFLICT DO NOTHING
// DELETE: DELETE FROM follows WHERE user_id = $1 AND creator_name = $2
// GET: SELECT creator_name FROM follows WHERE user_id = $1 ORDER BY created_at DESC
```

### Existing: DB Schema (DONE — verify applied to live DB)
```typescript
// Source: src/lib/db.ts ensureTable()
// CREATE TABLE IF NOT EXISTS follows (
//   user_id TEXT NOT NULL,
//   creator_name TEXT NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT NOW(),
//   PRIMARY KEY (user_id, creator_name)
// )
// CREATE INDEX IF NOT EXISTS idx_follows_user ON follows(user_id)
// CREATE INDEX IF NOT EXISTS idx_follows_creator ON follows(creator_name)
```

### Existing: followerCount in Creator API (DONE)
```typescript
// Source: src/app/api/creator/[name]/route.ts
const followerCheck = await sql`SELECT COUNT(*)::int as count FROM follows WHERE LOWER(creator_name) = ${creatorName.toLowerCase()}`;
const followerCount = Number(followerCheck[0]?.count ?? 0);
```

### Existing: FollowButton placement in CreatorProfile (DONE)
```typescript
// Source: src/components/social/CreatorProfile.tsx line 100
<FollowButton creatorName={data.creator} />
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N/A — greenfield feature | — | — | — |

**What already exists (confirmed by codebase audit):**
- `follows` table: defined in `ensureTable()` — assume applied (check live DB to confirm)
- `GET/POST/DELETE /api/user/follow`: fully implemented
- `FollowButton` component: fully implemented
- `followerCount` on creator profile: fully implemented
- Following filter on explore: NOT implemented — this is the primary new work

---

## Open Questions

1. **Is the `follows` table present in the live Neon database?**
   - What we know: `ensureTable()` defines it and is called from `/api/setup`
   - What's unclear: Was `/api/setup` ever called after the `follows` table was added? Or was it applied via another migration?
   - Recommendation: The plan's Wave 0 should include a verification step — call `/api/setup` (which is idempotent due to `CREATE TABLE IF NOT EXISTS`) or query `information_schema.tables` to confirm the table exists.

2. **Should the Following filter work for unauthenticated users?**
   - What we know: The follow system requires Clerk auth; unauthenticated users can't follow
   - What's unclear: Should the Following filter button be hidden entirely for logged-out users, or shown but disabled with a sign-in prompt?
   - Recommendation: Hide the toggle entirely for logged-out users — simplest UX, no confusing disabled states.

3. **Should following count be shown on the FollowButton itself (e.g., "Following · 142")?**
   - What we know: `followerCount` is shown in the stats row on the creator profile page
   - What's unclear: Phase scope does not call this out explicitly
   - Recommendation: Out of scope for Phase 1 — existing stats row already shows the count.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build + dev | ✓ | v22.17.0 | — |
| TypeScript | Build gate | ✓ | 5.9.3 | — |
| Neon Postgres | follows table, API | ✓ (via env) | — | — |
| Upstash Redis | Explore caching | ✓ (via env) | — | graceful no-op if missing |
| Clerk | Auth on follow routes | ✓ (via env) | — | — |

Step 2.6: No new external dependencies introduced by this phase.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (no jest.config, vitest.config, or test files found) |
| Config file | none |
| Quick run command | `npx tsc --noEmit` (type-check only) |
| Full suite command | `npx tsc --noEmit && npm run build` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| Follows table | `follows` table present in live DB | smoke (manual verify) | Query `information_schema.tables` | ❌ manual |
| Follow/unfollow API | POST creates row; DELETE removes row; GET returns list | integration | Manual curl or Postman | ❌ no test file |
| Follow button UI | Renders when logged in, toggles on click | visual/manual | Manual browser test | ❌ no test file |
| Follower count | `followerCount` increments after follow | integration | Manual via API | ❌ no test file |
| Explore following filter | `?following=1` returns only creator reports the user follows | integration | Manual browser/curl test | ❌ no test file |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (catches type regressions)
- **Per wave merge:** `npx tsc --noEmit && npm run build`
- **Phase gate:** Full build green before `/gsd:verify-work`

### Wave 0 Gaps
- No automated test infrastructure exists for this project — all validation is manual + TypeScript build gate
- The plan should include a manual smoke-test checklist as the phase gate criterion

---

## Sources

### Primary (HIGH confidence)
- `src/lib/db.ts` — `follows` table schema, all indexes, `ensureTable` function (direct code read)
- `src/app/api/user/follow/route.ts` — full GET/POST/DELETE implementation (direct code read)
- `src/components/social/FollowButton.tsx` — complete component (direct code read)
- `src/components/social/CreatorProfile.tsx` — followerCount rendering, FollowButton integration (direct code read)
- `src/app/api/explore/route.ts` — full explore query logic, cache usage (direct code read)
- `src/components/explore/ExploreFilters.tsx` — all current filter props and UI (direct code read)
- `src/components/explore/ExploreContent.tsx` — state management, fetch logic (direct code read)
- `src/lib/cache.ts` — CacheKeys, CacheTTL, cache patterns (direct code read)

### Secondary (MEDIUM confidence)
- `src/app/api/creator/[name]/route.ts` — followerCount query pattern (direct code read)

---

## Metadata

**Confidence breakdown:**
- Existing implementation status: HIGH — read every relevant file directly
- Following filter implementation plan: HIGH — follows established patterns in the codebase
- Live DB state (follows table applied): MEDIUM — schema code exists but live DB not verified

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable stack, no rapidly-moving dependencies)
