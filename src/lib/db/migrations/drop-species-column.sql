-- VGC-218 (Option B): drop the write-only shares.species[] column.
--
-- The column and its GIN index were added in add-species-column.sql to back
-- a planned O(1) Champions meta aggregation, but no read path ever moved to
-- the column — every consumer (champions/meta, user/reports, spotlight, etc.)
-- still parses species out of data->>'paste' via extractSpecies() at request
-- time. That left shares.species[] as pure write amplification on every
-- INSERT/UPDATE to /api/share with an idle GIN index churning on each write.
--
-- Drop the index first (concurrently to avoid blocking writes), then the
-- column. Safe to re-add later if/when Champions meta migrates to the column.
DROP INDEX CONCURRENTLY IF EXISTS idx_shares_species;
ALTER TABLE shares DROP COLUMN IF EXISTS species;
