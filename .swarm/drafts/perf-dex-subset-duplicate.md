# [PERF] dex-subset.json emitted twice — hoist to shared chunk for ~48KB gz savings

**Priority:** Low
**Labels:** performance, auto-research

## Context

C3 perf audit (12-06-2026): `dex-subset.json` (331KB raw) is bundled into both the `/` and `/compare` page chunks as two different chunk IDs with identical content. A user navigating from / to /compare downloads the same 331KB twice.

## Fix

1. Move the import to a shared module that webpack/turbopack will deduplicate into a common chunk.
2. OR: lazy-load it on demand from a `/api/dex-subset` endpoint and cache aggressively.

Option 1 is simpler. May require explicit `next.config.ts` chunk grouping.

## Source

`.swarm/c3-perf-12-06-26.md` — finding #2.
