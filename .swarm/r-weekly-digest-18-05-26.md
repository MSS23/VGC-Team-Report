# VGC-126: Weekly Digest Email — Architecture Design

_Designed: 2026-05-18_

---

## Overview

"Your reports this week" — a personalized Monday 9am digest emailed to every active Clerk user who owns at least one report. Users with zero engagement this week receive a "Top 5 trending teams" fallback instead.

---

## Delivery Location

**Extend `src/app/api/cron/weekly-report/route.ts`** — add a new `runWeeklyDigest()` function alongside the existing `runLinearDigest`, `runGrowthDigest`, `runDependencyCheck`. Call it inside the existing `Promise.all`. This keeps all weekly work in one Vercel cron trigger (already scheduled, already authorized), avoiding an extra cron slot.

No new route needed. The cron is already Friday 5pm per CLAUDE.md — this task should either adjust the schedule to Monday 9am in `vercel.json`, or add a dedicated Monday cron for the digest. Recommendation: add a second entry in `vercel.json`:

```json
{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }
```

This keeps the weekly internal report (Friday) separate from the user-facing digest (Monday).

---

## New File

`src/app/api/cron/weekly-digest/route.ts`

---

## Step 1: Get All Users with Reports

Clerk does not store email in the DB. Pattern used throughout the codebase (see `src/app/api/comments/[shareId]/route.ts`):

```ts
const client = await clerkClient();
const user = await client.users.getUser(ownerId);
const email = user.emailAddresses?.[0]?.emailAddress;
```

For batch delivery, fetch all distinct `owner_id` values from DB, then resolve each via `client.users.getUser(id)`. Clerk's `getUserList` does not support bulk-by-ID, so this requires N sequential/parallel calls. Batch with `Promise.all` (max concurrency ~10 to avoid Clerk rate limits).

```sql
SELECT DISTINCT owner_id FROM shares
WHERE owner_id IS NOT NULL AND deleted_at IS NULL
```

---

## Step 2: Per-User Engagement Query (last 7 days)

Run for each `owner_id`. All data already exists in the DB schema (see `src/lib/db.ts`):

```sql
-- Weekly views on user's reports
SELECT COALESCE(SUM(s.view_count), 0) AS total_views_all_time,
       COUNT(DISTINCT s.id) AS report_count
FROM shares s
WHERE s.owner_id = $userId AND s.deleted_at IS NULL;

-- Weekly reactions (reactions don't have a per-period field — count new ones this week)
SELECT COUNT(*) AS new_reactions
FROM reactions r
JOIN shares s ON s.id = r.share_id
WHERE s.owner_id = $userId AND r.created_at >= NOW() - INTERVAL '7 days';

-- Weekly comments
SELECT COUNT(*) AS new_comments,
       json_agg(json_build_object('body', c.body, 'name', c.display_name, 'share_id', c.share_id)) AS comment_details
FROM comments c
JOIN shares s ON s.id = c.share_id
WHERE s.owner_id = $userId AND c.created_at >= NOW() - INTERVAL '7 days';

-- New followers this week
SELECT COUNT(*) AS new_follows
FROM follows f
WHERE LOWER(f.creator_name) = LOWER(
  (SELECT data->>'creatorName' FROM shares WHERE owner_id = $userId AND deleted_at IS NULL LIMIT 1)
) AND f.created_at >= NOW() - INTERVAL '7 days';

-- Top report this week by view_count (as a proxy — views not time-bucketed)
SELECT id, data->>'tournamentName' AS tournament, data->>'creatorName' AS creator, view_count
FROM shares
WHERE owner_id = $userId AND deleted_at IS NULL
ORDER BY view_count DESC LIMIT 1;
```

**Note:** `view_count` is a running total, not time-bucketed. Week-over-week view delta is not directly available unless we snapshot. For MVP, report the all-time `view_count` on the user's best report. A future migration can add `views_this_week` via a daily-reset counter or a `view_events` table.

**Zero-activity detection:** If `new_reactions + new_comments + new_follows = 0`, send fallback email.

---

## Step 3: Trending Teams Fallback

For users with zero activity:

```sql
SELECT id, data->>'tournamentName' AS tournament, data->>'creatorName' AS creator,
       view_count,
       (SELECT COUNT(*) FROM reactions WHERE share_id = s.id) AS reaction_count
FROM shares s
WHERE is_public = TRUE AND deleted_at IS NULL
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY view_count DESC NULLS LAST
LIMIT 5;
```

---

## Step 4: Email HTML Template

Add two new builder functions to `src/lib/email.ts`:

### `buildWeeklyDigestHtml(data: WeeklyDigestData): string`

Follows the same table-based light-theme pattern as `buildWeeklySummaryHtml` and `buildCommentNotificationHtml`.

```ts
interface WeeklyDigestData {
  userName: string;        // Clerk firstName or username
  weekLabel: string;       // e.g. "12–18 May 2026"
  views: number;           // all-time view count of top report (MVP proxy)
  newReactions: number;
  newComments: number;
  newFollows: number;
  topReport: {
    id: string;
    tournamentName: string;
    viewCount: number;
  } | null;
  recentComments: Array<{ name: string; body: string; shareId: string }>;
}
```

**Layout:**
1. Logo header (matches existing pattern: red #E11D48 square "V" + "VGC Team Report")
2. Greeting: "Hi {userName}, here's your week"
3. Stat row (4 cards): Views | Reactions | Comments | Followers — using same `statCard()` helper pattern
4. Top report card with "View Report" CTA button → `APP_URL/report/{id}`
5. Recent comments section (up to 3, truncated at 100 chars)
6. Footer with unsubscribe link → `APP_URL/settings?tab=notifications`

### `buildTrendingTeamsHtml(data: TrendingTeamsData): string`

```ts
interface TrendingTeamsData {
  userName: string;
  weekLabel: string;
  teams: Array<{ id: string; tournamentName: string; creatorName: string; viewCount: number }>;
}
```

**Layout:** Same header, then a ranked list of 5 teams with "View" links. CTA: "Explore all teams" → `APP_URL/explore`.

---

## Step 5: Send Loop

```ts
for (const userId of ownerIds) {
  const [userData, engagement] = await Promise.all([
    resolveClerkUser(userId),   // clerkClient().users.getUser(userId)
    fetchEngagement(userId, sql)
  ]);
  if (!userData?.email) continue;  // skip users with no email

  const hasActivity = engagement.newReactions + engagement.newComments + engagement.newFollows > 0;
  const html = hasActivity
    ? buildWeeklyDigestHtml({ ...engagement, userName: userData.name, weekLabel })
    : buildTrendingTeamsHtml({ userName: userData.name, weekLabel, teams: trendingTeams });

  await sendEmail({
    to: userData.email,
    subject: hasActivity
      ? `Your week on VGC Team Report — ${weekLabel}`
      : `Top 5 trending teams this week — ${weekLabel}`,
    html,
  });
}
```

Rate-limit sends: `Promise.all` batches of 10, or sequential with no sleep (Resend's free tier: 100 emails/day; Pro: 50k/month).

---

## Step 6: vercel.json Cron Entry

```json
{ "path": "/api/cron/weekly-digest", "schedule": "0 9 * * 1" }
```

Monday 9am UTC. Route protected by `isCronAuthorized()` (existing pattern).

---

## Data Gaps & Future Work

| Gap | Impact | Fix |
|-----|--------|-----|
| `view_count` is all-time, not weekly | Views metric is imprecise | Add `view_events(share_id, viewed_at)` table or daily snapshot |
| No email opt-out stored in DB | Can't honour unsubscribe | Add `user_preferences(user_id, weekly_digest BOOL DEFAULT TRUE)` table |
| Clerk `getUserList` is not bulk-by-ID | N API calls per digest run | Consider storing email in DB at sign-up (webhook) to avoid Clerk calls |
| `follows` stores `creator_name`, not `owner_id` | Follow count join is fragile | Add `owner_id` FK to `follows` or `creator_profiles` |

---

## File Checklist for Implementation

- [ ] `src/app/api/cron/weekly-digest/route.ts` — new cron route
- [ ] `src/lib/email.ts` — add `buildWeeklyDigestHtml()` + `buildTrendingTeamsHtml()`
- [ ] `vercel.json` — add Monday 9am cron entry
- [ ] `src/lib/db.ts` or migration — optional `user_preferences` table for opt-out
