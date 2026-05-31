# Merge Conflict Log — swarm-nightly-2026-05-31

## Branch creation
- Cut fresh from `main` at `1a30839`. No divergence at start.
- 0/0 ahead/behind.

## Mid-run incident
- The W1 weekly-digest agent ran a `git stash push` (it appears to have re-executed the Step 0B pre-run-stash block as part of its own setup). This stashed my uncommitted working-tree changes — qrcode singleton wrapper for OTSSheetModal + TeamOverview, Navbar dynamic-import for NotificationBell/VersionHistoryPanel, and the updated `.swarm/run-meta.md` / `webhook-investigation.md`.
- After the agent reported done (and only modified `weekly-digest/route.ts`), I `git stash pop`'d cleanly. No conflicts. Working tree restored.
- Lesson for future runs: implementation-agent prompts should explicitly forbid stash/checkout commands.

## Push-time
- Single rebase against `origin/main` before push: clean (main has not moved tonight).
