import { neon } from "@neondatabase/serverless";

export function getDb() {
  const sql = neon(process.env.DATABASE_URL!);
  return sql;
}

/** Run once to create the shares table and indexes. Idempotent. */
export async function ensureTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS shares (
      id TEXT PRIMARY KEY,
      edit_token TEXT NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_shares_updated_at ON shares(updated_at)`;
  // Add version column for collaborative editing (safe to run multiple times)
  await sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`;
  // Add public listing flag for explore gallery
  await sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE`;
  await sql`CREATE INDEX IF NOT EXISTS idx_shares_public_updated ON shares(updated_at DESC) WHERE is_public = TRUE`;
  // View count for public reports
  await sql`ALTER TABLE shares ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0`;
  // Reactions table
  await sql`
    CREATE TABLE IF NOT EXISTS reactions (
      id SERIAL PRIMARY KEY,
      share_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(share_id, reaction_type, session_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_reactions_share ON reactions(share_id)`;
  // Comments table
  await sql`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      share_id TEXT NOT NULL,
      display_name TEXT NOT NULL DEFAULT 'Anonymous',
      body TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_comments_share ON comments(share_id, created_at)`;
  // Verified creators table (admin-managed)
  await sql`
    CREATE TABLE IF NOT EXISTS verified_creators (
      name TEXT PRIMARY KEY,
      verified_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // Comment flags table
  await sql`
    CREATE TABLE IF NOT EXISTS comment_flags (
      id SERIAL PRIMARY KEY,
      comment_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(comment_id, session_id)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_comment_flags_comment ON comment_flags(comment_id)`;
  // Creator profiles table (optional bio + social links)
  await sql`
    CREATE TABLE IF NOT EXISTS creator_profiles (
      name TEXT PRIMARY KEY,
      bio TEXT,
      twitter TEXT,
      discord TEXT,
      youtube TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
