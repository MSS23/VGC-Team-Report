import { neon } from "@neondatabase/serverless";

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}

/** Run once to create tables and indexes. Each statement is independent so one failure doesn't block others. */
export async function ensureTable() {
  const sql = getDb();
  const run = async (query: ReturnType<typeof sql>) => {
    try { await query; } catch (e) { console.warn("Migration statement skipped:", e); }
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

  // User-owned reports: links Clerk user ID to share edit tokens
  await run(sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS owner_id TEXT`);
  await run(sql`CREATE INDEX IF NOT EXISTS idx_shares_owner ON shares(owner_id) WHERE owner_id IS NOT NULL`);

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

  // Edit changelog for collaborative editing
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

  // Version snapshots for revert capability
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
}
