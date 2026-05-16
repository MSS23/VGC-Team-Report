-- Add materialised species array column for O(1) Champions meta aggregation
ALTER TABLE shares ADD COLUMN IF NOT EXISTS species text[] DEFAULT NULL;

-- Backfill index on the new column (can run async after deploy)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shares_species ON shares USING GIN(species);
