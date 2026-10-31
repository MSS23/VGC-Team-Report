# VGC Team Report — Agent Instructions

All project rules live in **[CLAUDE.md](./CLAUDE.md)**. Read it in full and follow it exactly; where it says "Claude", it applies to you (Codex or any other coding agent).

The non-negotiables, restated for skimmers:

- **Never push without an explicit user signal** ("push"/"deploy"/"ship"). Commit locally and stop.
- Pushing builds a Vercel **preview**; production goes live only via a separate Promote step.
- Pre-commit gate: `tsc --noEmit` + `vitest run` + `next build` must pass. The project path contains `&`, which breaks npx — invoke binaries directly with node (see CLAUDE.md "Environment quirks").
- Linear tickets: bugs first; `no-claude` label means hands off (except bugs); commit as `VGC-XX: description`.
