# C4 Security Audit — 2026-07-27

Subagent could not write directly (read-only tools). Findings recorded here.

## Findings

### 1. HIGH — `/api/team-graphic` leaks private teams as PNG
- **File:** `src/app/api/team-graphic/route.tsx` line 96
- **Snippet:** `const rows = await sql\`SELECT data FROM shares WHERE id = ${shareId} AND deleted_at IS NULL\`;`
- **Exploit:** Anyone with a share id can render its full team paste (species, item, ability, Tera type, tournament name, creator name) as a PNG — every sibling endpoint (/api/embed, /api/oembed, /s/[id] anon path) enforces `AND is_public = TRUE`, this one does not.
- **Fix:** Add `AND (is_public = TRUE OR is_unlisted = TRUE)` to the WHERE clause, matching the anon-view rules in `src/app/api/share/[id]/route.ts` line 200.

### 2. MEDIUM — CSRF token compared with `===`
- **File:** `src/lib/security/csrf.ts` line 44
- **Snippet:** `return cookieToken === headerToken;`
- **Exploit:** Non-timing-safe string equality on a per-session secret; theoretical timing side-channel.
- **Fix:** `crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))` after existing length check (mirrors `src/lib/cron-auth.ts` line 14-17).

### 3. MEDIUM — `/api/team-graphic` shareId not validated with regex
- **File:** `src/app/api/team-graphic/route.tsx` line 88
- **Fix:** Reuse `IdSchema = z.string().regex(/^[A-Za-z0-9]{8}$/)` pattern from `src/app/api/share/[id]/route.ts:32` and safeParse before SQL.

### 4. LOW — `/api/user/saved` shareId only min(1)
- **File:** `src/app/api/user/saved/route.ts` line 61
- **Fix:** Tighten to `z.string().regex(/^[A-Za-z0-9]{8}$/)` matching CollectionIdSchema pattern.

### 5. LOW — Discord public key hardcoded (safe but scanner noise)
- **File:** `src/app/api/discord/route.ts` line 7
- **Not exploitable** (Ed25519 public key is safe to expose) but should move to `process.env.DISCORD_PUBLIC_KEY` for rotation-without-redeploy consistency.

## Summary

Codebase is security-conscious overall. Neon `sql` parameterisation is used throughout, dangerouslySetInnerHTML uses are safe, cron/webhook/migrate secret compares already use `timingSafeEqual`. Priority fix: #1 (private team leak via team-graphic). #2 and #3 are quick follow-ups.
