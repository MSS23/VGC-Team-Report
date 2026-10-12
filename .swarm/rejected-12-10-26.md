# Rejected changes — 12 Oct 2026

**None.** Every change dispatched this run passed the gate and was committed.

No subagent returned `verified_passing: false`, no file carried conflict markers,
and nothing had to be reverted with `git checkout --`.

The authoritative gate was run by the orchestrator sequentially on the fully
integrated tree, not by the subagents: seven agents each running `npm run build`
concurrently in one working directory contend over the same `.next` output, so
their self-reported build results are advisory only. Several agents said as much
(repeated retries while a sibling held the build lock, and transient type errors
from other agents' in-flight edits that cleared on a rerun). Two of them —
VGC-297 and VGC-295 — were asked to stop retrying and hand back on tsc + vitest
alone; their reports say so explicitly.

Integrated-tree gate, re-run after every commit batch:

| Gate | Result |
|---|---|
| `npm run typecheck` (cold, `--incremental false`) | ✅ clean |
| `vitest run` | ✅ 65 files / **572 tests** (baseline was 60 / 501 — **+71 tests**) |
| `npm run build` | ✅ compiled successfully |

The `No database connection string was provided to neon()` lines during the
champions SSG pass are pre-existing container noise (no `DATABASE_URL`), handled
gracefully by the code, and present identically in the pre-change baseline run.
