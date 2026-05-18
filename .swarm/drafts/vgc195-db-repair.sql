-- =============================================================================
-- VGC-195: DB Repair Script — owner_id corruption from bad deploy 2026-05-17
-- =============================================================================
-- STATUS: DRAFT — for human review only. Do NOT run without review.
--
-- BACKGROUND:
--   A broken INSERT (deployed ~2026-05-17) swapped two column values:
--     - owner_id  received the boolean `is_unlisted` cast to text → stored as 'false'
--     - search_vector received the Clerk user ID string instead of a tsvector
--   The fix was deployed 2026-05-18 (commit 303e6fc).
--   All shares created between those two deploys may be corrupted.
--
-- RECOVERY STRATEGY:
--   The edit_changelog table was NOT affected — its INSERT used a separate code
--   path. The editor_id column on the first changelog entry (version = 1) holds
--   the real Clerk user ID that should have gone into shares.owner_id.
--   The search_vector must be rebuilt from the JSONB data column.
--
-- SAFETY NOTES:
--   1. Run STEP 1 (SELECT) first to understand scope before touching any data.
--   2. Adjust the timestamp window using actual deploy times from the Vercel
--      dashboard — the window below is intentionally conservative/wide.
--   3. Always run the UPDATE inside an explicit transaction (BEGIN … COMMIT).
--      Verify the row count and a sample of values before committing.
--      Use ROLLBACK if anything looks wrong.
--   4. Shares with owner_id = NULL are legitimate anonymous shares — this
--      script only touches rows where owner_id = 'false' (a string).
--   5. Run STEP 3 after the UPDATE to check for rows that could not be
--      recovered (no matching edit_changelog entry). Handle those manually.
-- =============================================================================


-- =============================================================================
-- STEP 1: Identify affected rows (read-only — safe to run anytime)
-- =============================================================================
-- Run this first to see how many rows are in the corruption window.
-- Adjust the BETWEEN timestamps if you have more precise deploy times.

SELECT
    id,
    edit_token,
    created_at,
    owner_id,          -- should show 'false' for corrupted rows
    is_unlisted        -- should show false (boolean) — these values were swapped
FROM shares
WHERE owner_id = 'false'
  AND created_at BETWEEN '2026-05-17 00:00:00+00' AND '2026-05-18 06:00:00+00'
ORDER BY created_at;

-- Also preview what the recovered values would look like (without changing anything):
SELECT
    s.id,
    s.created_at,
    s.owner_id          AS current_owner_id,   -- 'false' (corrupted)
    ec.editor_id        AS recovered_owner_id,  -- real Clerk user ID
    s.data->>'creatorName'    AS creator_name,
    s.data->>'tournamentName' AS tournament_name
FROM shares s
JOIN edit_changelog ec
  ON s.id = ec.share_id AND ec.version = 1
WHERE s.owner_id = 'false'
  AND s.created_at BETWEEN '2026-05-17 00:00:00+00' AND '2026-05-18 06:00:00+00'
ORDER BY s.created_at;


-- =============================================================================
-- STEP 2: Repair — run inside a transaction for safety
-- =============================================================================
-- Review the output of STEP 1 before proceeding.
-- Uncomment the block below when ready to execute.

/*

BEGIN;

UPDATE shares s
SET
    owner_id = ec.editor_id,
    search_vector = (
        setweight(to_tsvector('english', COALESCE((s.data->>'creatorName')::text, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE((s.data->>'tournamentName')::text, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(s.data->>'paste', '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(s.data->>'teamSummary', '')), 'C')
    )
FROM edit_changelog ec
WHERE s.id = ec.share_id
  AND ec.version = 1
  AND s.owner_id = 'false'
  AND s.created_at BETWEEN '2026-05-17 00:00:00+00' AND '2026-05-18 06:00:00+00';

-- Verify: check how many rows were updated and that owner_id now looks like
-- a Clerk user ID (e.g. starts with 'user_') rather than 'false'.
SELECT id, created_at, owner_id, is_unlisted
FROM shares
WHERE created_at BETWEEN '2026-05-17 00:00:00+00' AND '2026-05-18 06:00:00+00'
  AND owner_id != 'false'   -- updated rows should now have a real user ID
ORDER BY created_at;

-- If the output looks correct: COMMIT
-- If anything looks wrong:    ROLLBACK

COMMIT;
-- ROLLBACK;

*/


-- =============================================================================
-- STEP 3: Check for unrecoverable rows (run after STEP 2 commits)
-- =============================================================================
-- Any rows still showing owner_id = 'false' after the UPDATE have no matching
-- edit_changelog entry (e.g. created by an anonymous session, or changelog row
-- was deleted). These require manual investigation.

SELECT
    id,
    edit_token,
    created_at,
    owner_id,
    data->>'creatorName'    AS creator_name,
    data->>'tournamentName' AS tournament_name
FROM shares
WHERE owner_id = 'false'
  AND created_at BETWEEN '2026-05-17 00:00:00+00' AND '2026-05-18 06:00:00+00'
ORDER BY created_at;

-- If rows appear here, options are:
--   a) Set owner_id = NULL (treat as anonymous — legitimate fallback)
--   b) Leave as-is and track manually via the edit_token / share URL
--   c) Check application logs / Clerk dashboard for the user who created them

-- To bulk-null unrecoverable rows (only if acceptable per product decision):
/*
BEGIN;
UPDATE shares
SET owner_id = NULL
WHERE owner_id = 'false'
  AND created_at BETWEEN '2026-05-17 00:00:00+00' AND '2026-05-18 06:00:00+00';
COMMIT;
*/


-- =============================================================================
-- STEP 4: Final verification (after all updates are committed)
-- =============================================================================
-- Confirm zero corrupted rows remain in the window.

SELECT COUNT(*) AS remaining_corrupted
FROM shares
WHERE owner_id = 'false'
  AND created_at BETWEEN '2026-05-17 00:00:00+00' AND '2026-05-18 06:00:00+00';
-- Expected result: 0

-- Spot-check a few repaired rows to confirm search_vector was rebuilt:
SELECT
    id,
    created_at,
    owner_id,
    is_unlisted,
    length(search_vector::text) AS sv_length   -- should be > 0 for non-empty teams
FROM shares
WHERE created_at BETWEEN '2026-05-17 00:00:00+00' AND '2026-05-18 06:00:00+00'
  AND owner_id IS DISTINCT FROM 'false'
ORDER BY created_at
LIMIT 20;
