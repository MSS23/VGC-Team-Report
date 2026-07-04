import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export function getDb(): NeonQueryFunction<false, false> {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}

/** Run once to create tables and indexes. Each statement is independent so one failure doesn't block others. */
export async function ensureTable(): Promise<void> {
  const sql = getDb();
  const run = async (query: ReturnType<typeof sql>) => {
    try { await query; } catch (e: unknown) { console.warn("Migration statement skipped:", e); }
  };

  await run(sql`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      edit_token TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_shares_updated_at ON shares(updated_at)`);
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`);
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`);
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS is_unlisted BOOLEAN NOT NULL DEFAULT FALSE`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_shares_public_updated ON shares(updated_at DESC) WHERE is_public = TRUE`);
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`);

  await run(sql`
    CREATE TABLE IF NOT EXISTS reactions (
      id SERIAL PRIMARY KEY,
      share_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(share_id, reaction_type, session_id)
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_reactions_share ON reactions(share_id)`);

  await run(sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      share_id TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT 'Anonymous',
      body TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_comments_share ON comments(share_id, created_at)`);

  await run(sql`
    CREATE TABLE IF NOT EXISTS verified_creators (
      name TEXT PRIMARY KEY,
      verified_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await run(sql`
    CREATE TABLE IF NOT EXISTS comment_flags (
      id SERIAL PRIMARY KEY,
      comment_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(comment_id, session_id)
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_comment_flags_comment ON comment_flags(comment_id)`);

  await run(sql`
    CREATE TABLE IF NOT EXISTS creator_profiles (
      name TEXT PRIMARY KEY,
      bio TEXT,
      twitter TEXT,
      discord TEXT,
      youtube TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run(sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE`);
  await run(sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS accent_theme TEXT`);
  await run(sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT`);

  // Feedback / feature requests table
  await run(sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      device TEXT,
      browser TEXT,
      screen_size TEXT,
      contact TEXT,
      session_id TEXT,
      status TEXT DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Feedback submitter tracking
  await run(sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS submitter_id TEXT`);
  await run(sql`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS submitter_name TEXT`);

  // User-owned reports: links Clerk user ID to share edit tokens
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS owner_id TEXT`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_shares_owner ON shares(owner_id) WHERE owner_id IS NOT NULL`);

  // Fork lineage: points at the original share that this one was forked from
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS forked_from_id TEXT`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_shares_forked_from ON shares(forked_from_id) WHERE forked_from_id IS NOT NULL`);

  // Saved/bookmarked reports
  await run(sql`
    CREATE TABLE IF NOT EXISTS saved_reports (
      user_id TEXT NOT NULL,
      share_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, share_id)
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_reports(user_id)`);

  // Creator follows
  await run(sql`
    CREATE TABLE IF NOT EXISTS follows (
      user_id TEXT NOT NULL,
      creator_name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (user_id, creator_name)
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_follows_user ON follows(user_id)`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_follows_creator ON follows(creator_name)`);

  // Notifications
  await run(sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      source_share_id TEXT,
      source_user_name TEXT,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read, created_at DESC)`);

  // Soft-delete support
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_shares_deleted ON shares(deleted_at) WHERE deleted_at IS NOT NULL`);

  // Collections (team archive / folders)
  await run(sql`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      regulation TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id, created_at DESC)`);
  await run(sql`
    CREATE TABLE IF NOT EXISTS collection_items (
      collection_id TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
      share_id TEXT NOT NULL,
      added_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (collection_id, share_id)
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_collection_items_collection ON collection_items(collection_id)`);

  // Full-text search vector
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS search_vector tsvector`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_shares_search ON shares USING GIN(search_vector) WHERE is_public = TRUE AND deleted_at IS NULL`);

  // Backfill search_vector for existing rows that don't have one
  await run(sql`
    UPDATE shares SET search_vector =
      setweight(to_tsvector('english', COALESCE(data->>'creatorName', '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(data->>'tournamentName', '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(data->>'paste', '')), 'B') ||
      setweight(to_tsvector('english', COALESCE(data->>'teamSummary', '')), 'C')
    WHERE search_vector IS NULL AND is_public = TRUE AND deleted_at IS NULL
  `);

  // Collaborators (co-editors for shared reports)
  await run(sql`
    CREATE TABLE IF NOT EXISTS collaborators (
      share_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      added_by TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY (share_id, user_id)
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_collaborators_user ON collaborators(user_id)`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_collaborators_share ON collaborators(share_id)`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_collaborators_user_name ON collaborators(LOWER(user_name))`);
  // Status: 'pending' (invite sent, no access yet) or 'accepted' (full collab access)
  await run(sql`ALTER TABLE collaborators ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'accepted'`);
  // Default existing rows to 'accepted' (they were added before the consent flow)
  await run(sql`UPDATE collaborators SET status = 'accepted' WHERE status IS NULL`);

  // Draft support — auto-saved reports that haven't been shared yet
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_shares_drafts ON shares(owner_id, updated_at DESC) WHERE is_draft = TRUE AND deleted_at IS NULL`);

  // Edit changelog for collaborative editing.
  // NOTE: intentionally NO `ON DELETE CASCADE` FK to shares — adding one here
  // is risky against existing data and not reliably idempotent. Orphaned rows
  // (share deleted) and per-share retention are handled by /api/cleanup, and
  // the share route trims this table inline on write (§1-B / Finding 5.8).
  await run(sql`
    CREATE TABLE IF NOT EXISTS edit_changelog (
      id SERIAL PRIMARY KEY,
      share_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      editor_id TEXT,
      editor_name TEXT,
      sections JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_edit_changelog_share ON edit_changelog(share_id, version DESC)`);
  await run(sql`ALTER TABLE edit_changelog ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`);

  // Version snapshots for revert capability.
  // NOTE: intentionally NO `ON DELETE CASCADE` FK to shares (same reasoning as
  // edit_changelog above). Snapshot coalescing + inline "keep newest 50"
  // retention live in /api/share; orphan sweep + global retention backstop
  // live in /api/cleanup. This is what keeps the table from regrowing (§1-B).
  await run(sql`
    CREATE TABLE IF NOT EXISTS share_versions (
      id SERIAL PRIMARY KEY,
      share_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      data JSONB NOT NULL,
      editor_id TEXT,
      editor_name TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(share_id, version)
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_share_versions_share ON share_versions(share_id, version DESC)`);

  // Match tracker — log game results vs archetypes
  await run(sql`
    CREATE TABLE IF NOT EXISTS match_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id TEXT NOT NULL,
      share_id TEXT,
      opponent_archetype TEXT NOT NULL,
      result TEXT NOT NULL CHECK (result IN ('win', 'loss', 'tie')),
      game_count INTEGER DEFAULT 2,
      notes TEXT,
      tournament_name TEXT,
      logged_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_match_logs_user ON match_logs(user_id, logged_at DESC)`);
}
