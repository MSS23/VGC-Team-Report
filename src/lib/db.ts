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
}
