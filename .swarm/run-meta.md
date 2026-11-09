# Swarm run meta — Mon Nov  9 00:12:00 GMT 2026

- Branch: swarm-nightly-2026-11-09
- REMOTE_EXISTS at start: 0 (fresh branch cut from origin/main @ 10dfd74)
- Mode: fresh branch, never pushed yet (rebase allowed until first push)
- Existing PR for branch: none
- PostHog: credentials ABSENT (POSTHOG_API_KEY/POSTHOG_PROJECT_ID unset) -> integration SKIPPED for whole run per CLAUDE.md preflight rule
- Vercel: VERCEL_TOKEN unset and no Vercel MCP server attached -> Vercel checks SKIPPED for whole run
- Linear: LINEAR_API_KEY present
- Discord: DISCORD_BUILDS_WEBHOOK present

## Run outcome — 09-11-26

- Branch: `swarm-nightly-2026-11-09`, cut fresh from `origin/main` @ `10dfd74`.
- Pushes to `main`: **zero**. Every push used the guarded explicit refspec
  `git push origin "$BRANCH:refs/heads/$BRANCH"`.
- Clone was **shallow** (78 commits) at start; `git fetch --unshallow` brought it to 834.
  This materially changed two conclusions — see `.swarm/conflicts.md`.

### Subagents dispatched: 11 of the 25 cap

Research/audit (7): C1 dead code, C2 TypeScript, C3 bundle/perf, C4 security,
C5 commit review, R8 accessibility, R6 SEO (repository-only).
Implementation (4): VGC-291, VGC-226 (redirected to VGC-260), VGC-261, dead-code apply.

**Not dispatched (6): R1, R2, R3, R4, R5, R7** — all require external web access, and
egress is blocked (`000` on every host). Reasoning in `.swarm/egress-check-09-11-26.md`.
The remaining budget was deliberately left unspent rather than used to generate volume:
three of the four tickets dispatched turned out to be already complete, so more
implementation agents would mostly have added unreviewable work to a queue that already
has 38 finished tickets waiting.

### Commit order note

The `.swarm/` notes commit is placed **before** the changelog commit, not after. CLAUDE.md
warns that Vercel's Ignored Build Step diffs only the push's tip commit and excludes
`*.md`, so a tip carrying only `.swarm/*.md` would cancel the whole preview build. The
changelog (`src/app/changelog/data.ts`) is therefore the tip.

### Integrations

| Integration | State |
|---|---|
| Linear reads | working (GraphQL, 130 open issues pulled) |
| Linear **writes** | **BLOCKED** — see `.swarm/linear-pending-09-11-26.md` §Why |
| Discord | `DISCORD_BUILDS_WEBHOOK` present; send attempted at end of run |
| PostHog | SKIPPED all run — credentials absent (VGC-220) |
| Vercel | SKIPPED all run — no token, no MCP |
| Egress | BLOCKED except api.github.com, api.linear.app, registry.npmjs.org |
