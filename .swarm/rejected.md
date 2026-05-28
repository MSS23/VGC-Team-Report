# Rejected Changes — swarm-nightly-2026-05-28

1. **Changelog data extraction (W2-PERF)** — Agent attempted to extract ENTRIES array from ChangelogContent.tsx to a separate data.ts file with server-side prop passing. Left the file in a broken state (import from non-existent module). Changes reverted. The idea is sound but requires more careful implementation.

All other changes passed tsc + next build.
