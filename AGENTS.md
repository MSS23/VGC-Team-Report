# VGC Team Report — Agent Instructions

All project rules live in **[CLAUDE.md](./CLAUDE.md)**. Read it in full and follow it exactly; where it says "Claude", it applies to you (Codex or any other coding agent).

The non-negotiables, restated for skimmers:

- **Never push without an explicit user signal** ("push"/"deploy"/"ship"). Commit locally and stop.
- Pushing builds a Vercel **preview**; production goes live only via a separate Promote step.
- Pre-commit gate: `tsc --noEmit` + `vitest run` + `next build` must pass. The project path contains `&`, which breaks npx — invoke binaries directly with node (see CLAUDE.md "Environment quirks").
- Linear tickets: bugs first; `no-claude` label means hands off (except bugs); commit as `VGC-XX: description`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
