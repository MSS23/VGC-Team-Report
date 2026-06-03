# Conflicts log — 2026-06-03

Branch cut fresh from `origin/main` @ `1a30839`. No working-tree changes at start. No rebase needed.

Conflict-risk files for this run (changed on main in the last 7 days OR touched by open PRs #50–#53):

- `src/app/changelog/data.ts` — touched by every recent swarm PR; will be touched again at end of this run for Updates page entry
- `src/app/layout.tsx` — touched by PR #52 (SEO metadata rewrite)
- `src/app/sitemap.ts` — touched by PR #52
- `src/components/ui/ShareModal.tsx` — touched by PR #52 a11y
- `src/components/providers/ClarityProvider.tsx` — touched by PR #52
- `src/components/providers/ConsentGate.tsx` — deleted in PR #53 (do not reference)
- `src/lib/data/dex-subset.ts` — flagged as conflict-risk in PR #53 (skipped there); skip again unless ticket demands it
- `src/lib/i18n/index.ts` — flagged as conflict-risk in PR #53; skip again
- `sentry.client.config.ts` — touched by PR #52

Subagents this run must avoid touching the above unless the change is unambiguously additive.
