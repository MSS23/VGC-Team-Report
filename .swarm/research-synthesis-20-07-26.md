# Research Synthesis — 20-07-26

## Wave 1 dispatched (6 subagents, all Wave 1)
C1 dead-code, C2 TypeScript, C3 performance, C4 security, C5 recent-commits, R8 accessibility. All returned in-context findings (they run read-only and couldn't Write to their `.swarm/*` files — I archived their output on their behalf).

Wave 1 subagents R1–R5 (competitor teardowns, community sentiment, mobile UX) and R7 (AI citations) were skipped this run — they would produce marketing/community drafts that we couldn't file as Linear tickets (Linear API not reachable this session).

## Top 5 highest-leverage opportunities

1. **HIGH — `/api/team-graphic` private-share leak** — fixed this run (commit `afee946`).
2. **Anon comment DELETE trusts client `sessionId`** — CONFLICT-RISK on main-changed file. Not fixed this run. Requires HMAC-of-sessionId + schema migration. Filable as Linear ticket next run.
3. **`0269462` silently flipped new-report defaults from Public to Unlisted** — user-facing change with no changelog entry. Not filable via API this run; surface manually.
4. **Lazy-load `MOVE_NAMES` for non-EN users** — est. −80 to −120 KB gzip on `/`. Not implemented this run (deferred — larger refactor, worth a dedicated ticket).
5. **`dynamic()` TournamentMode + MatchTracker splits** — est. −50 to −80 KB gzip combined. CONFLICT-RISK on hot page.tsx / DashboardContent.tsx. Defer to a settled window.

## Top 5 quick-win bugs / cleanups (all landed this run)

1. Sitemap `lastModified` regression on static entries.
2. Weekly-report cron parallelisation.
3. Bot summary parallelisation.
4. NotificationBell 44×44.
5. Dead code deletion (~412 LoC).

## Blockers to Wave 2

- Linear API unreachable (no `.env.local`) — no L0 triage, no ticket implementation, no ticket filing.
- PostHog API unreachable — no error/rage-click cross-referencing.
- Discord webhook URL unreachable — build notification will fall back to `.swarm/discord-failed-20-07-26.md`.

## High-conflict-risk overlaps

C1 findings — none touch `main-changed-files.md`.
C2 quick wins #1–#8 — none touch changed files (only #9, #10 on i18n do; skipped).
C3 quick wins #1–#3, #7 — CONFLICT-RISK (deferred).
C4 findings #1, #2 — CONFLICT-RISK. #1 (team-graphic) still fixed because it's a real HIGH security issue; #2 (comment sessionId) deferred because it requires migration coordination.
R8 CRITICAL #2–#5, HIGH #7, #10, #11, #13 — CONFLICT-RISK (deferred).
