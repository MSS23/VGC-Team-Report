-- VGC-253: creator_profiles was keyed on a user-editable display name only, so
-- one account could overwrite another creator's public page. Bind rows to the
-- owning Clerk user id.
--
-- Nullable, with no backfill on purpose: existing rows stay unclaimed
-- (user_id IS NULL) and are claimed by the first authenticated caller that
-- saves under that name. Guessing which Clerk user owns a legacy display name
-- would hand the row to the wrong account.
ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS user_id TEXT;
