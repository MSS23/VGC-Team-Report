-- VGC-302: index shares.created_at (and view_count) for the Explore feed.
--
-- /api/explore ends every listing query with an ORDER BY + LIMIT over the
-- public, non-deleted shares. Before this migration `shares.created_at` had
-- no index at all, so sort=newest (and sort=views) did a Seq Scan over every
-- public share plus a full Sort on each uncached request. VGC-295 already made
-- the keyset cursor a tuple comparison, so a matching btree can now be used.
--
-- Index shape mirrors the real queries exactly -- same expressions, same
-- column order, same sort direction -- otherwise the planner ignores them:
--   sort=newest : ORDER BY s.created_at DESC, s.id DESC
--   sort=views  : ORDER BY COALESCE(s.view_count, 0) DESC, s.created_at DESC
-- Both are partial on the shared WHERE clause (is_public = TRUE AND
-- deleted_at IS NULL) to keep them small on the Neon free tier.
--
-- sort=updated is already covered by idx_shares_public_updated /
-- idx_shares_updated_at. sort=popular orders by a joined aggregate over
-- `reactions`, so no index on `shares` alone can supply that ordering --
-- nothing is added for it here.
--
-- APPLYING TO LIVE PRODUCTION: use CREATE INDEX CONCURRENTLY (as written
-- below) so the build does not take an ACCESS EXCLUSIVE lock on shares.
-- CONCURRENTLY cannot run inside a transaction block -- run these statements
-- one at a time, outside any BEGIN/COMMIT (e.g. psql -f, no --single-transaction).
-- src/lib/db.ts declares the same two indexes in the non-concurrent idempotent
-- form, which is correct for fresh/init setup on an empty table.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shares_public_created_id
  ON shares (created_at DESC, id DESC)
  WHERE is_public = TRUE AND deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shares_public_views_created
  ON shares ((COALESCE(view_count, 0)) DESC, created_at DESC)
  WHERE is_public = TRUE AND deleted_at IS NULL;
