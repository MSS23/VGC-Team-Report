# Wave 1 synthesis — 28 Sep 2026

8 read-only agents (trimmed from the spec's 13 — see run-meta.md for why).
All 8 returned. PostHog cross-referencing was impossible all run: no
POSTHOG_API_KEY / POSTHOG_PROJECT_ID in the container (already tracked by VGC-220).

## Top 5 highest-leverage opportunities

1. **Merge the 7 open PRs — Reg M-C is the prize.** Reg M-C went live 8 Sep 2026.
   Production does not know it exists: `isChampionsFormat()` returns false, so an
   M-C report silently degrades to classic EV mode and loses the 66/32 SP budget,
   Mega handling, the IV lock and Tera suppression. **Silently wrong output, live,
   for three weeks.** The fix already exists on PR #78 and merges with three
   keep-both-sides conflicts. See `merge-plan-28-09-26.md`. Competitors shipped
   M-C in days (Pikalytics `regmc` slugs live; VGCPastes 145+ M-C teams).
2. **M-C SEO surfaces are uncovered even by #78.** #78 fixes the parser/validation
   layer only — it never touches `mega-pokemon.ts`, `sitemap.ts` or either
   champions page. Six M-C Megas have no page (Salamence 404s outright), and
   `/champions` title/description/ItemList schema stay M-B-bound.
3. **Creator identity is an unbound display-name string.** One root cause behind
   three separate exploitable findings (C4 F1/F2/F3): `creator_profiles.name` is
   the primary key with no owner column. F1 is fixed this run; F2 (profile
   overwrite via Clerk rename) and F3 (verified-badge hijack) remain. VGC-253
   tracks the schema fix and is the real remedy.
4. **Clerk on all 22 routes costs 58 KB gz where 8 routes need no auth** (C3 F3).
   An `(app)` route group cuts /champions/[pokemon] — 74 SSG pages — by 24%.
5. **Theme-wide contrast is systematically broken** (R8 C1-C5). `globals.css`
   declares no `@custom-variant dark` while the app themes via `[data-dark-mode]`,
   so 123 `dark:` classes misfire whenever OS preference disagrees with the
   in-app toggle (`dark:text-amber-300` = 1.44:1 on white). One-line fix, but it
   will change appearance broadly, so it wants a human eye — not a swarm commit.

## Top 5 quick-win defects

All five were fixed this run except where noted.

1. FIXED — Linear webhook 401-on-stale made every retry fail permanently.
2. FIXED — account deletion could destroy another creator's profile (C4 F1).
3. FIXED — 3 anonymous IP-keyed flags hard-deleted any comment (C4 F5).
4. FIXED — backup-format paste dropped its first Pokemon (C5 #1).
5. FIXED — 9/18 type badges below AA contrast (R8 Z1); `min-h-11text-xs` typo (C5 #2).

Not taken: `/api/bot/route.ts` (~453 lines, redundant with `/api/discord`) needs a
maintainer yes/no on `?action=weekly-email` first — ticket, not a swarm commit.

## Blockers hit this run

- **POSTHOG_API_KEY / POSTHOG_PROJECT_ID absent** -> every PostHog step skipped.
- **No VERCEL_TOKEN and no Vercel MCP** -> could not read prod env vars or
  webhook invocation logs. Step 0C completed by code audit + git archaeology.
- **Linear MCP needs OAuth** -> all Linear work done via direct GraphQL instead.
- **WebFetch egress-blocked; Reddit refuses Anthropic's crawler** -> R1 and R6
  fell back to SERP snippets. R1 returned ZERO community quotes rather than
  invent any, which is the right call — so "community sentiment" is still
  unevidenced, not confirmed absent. VGC-255 tracks the egress limitation.

## High-conflict-risk findings (worth changing AND in the open-PR set)

Deliberately NOT touched this run, to avoid worsening the 7-PR pileup:
`globals.css` (dark variant), `layout.tsx` + PageNavbar (Clerk route group),
`useTeamReport.ts` (draft TTL self-renewal), `api/explore/route.ts` (cursor
pagination ms truncation), `app/page.tsx` (two h1-less views), the 7 i18n locale
files (57 dead keys, must be one atomic commit), `champions/[pokemon]/page.tsx`.

One exception: `SpeedTierChart.tsx` is in the conflict set but the fix is three
added spaces, so the conflict cost is negligible against a live touch-target bug.
