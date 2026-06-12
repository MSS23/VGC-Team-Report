# [PERF] Replace Zod 4 with hand-rolled type guards in url-codec to shed ~110KB gz from /

**Priority:** Medium
**Labels:** performance, auto-research

## Context

C3 perf audit (12-06-2026) identified that `/` ships a 470KB raw / **114KB gz** chunk dominated by Zod 4. Root cause: `src/lib/sharing/url-codec.ts` imports Zod and is reachable from `page.tsx` + client hooks, so the entire Zod runtime ships to every visitor.

Zod is used in this file for ~3-4 fields. A hand-rolled type-guard module would be a few hundred bytes.

## Fix

1. Read `src/lib/sharing/url-codec.ts` — identify which schemas are actually used.
2. Replace each `z.object({ ... })` / `z.parse` with a small custom validator (e.g. `function isShareUrlPayload(x: unknown): x is ShareUrlPayload { ... }`).
3. Keep Zod for server-only validation (it's already in API routes — that won't ship to the client).
4. Run `npm run build` and confirm the / chunk shrinks. Target: ≥80KB gz saved.

## Note

Other client-imported files may also pull Zod indirectly — verify via the build output. If multiple, do this PR carefully (one file at a time, measuring each).

## Source

`.swarm/c3-perf-12-06-26.md` — finding #1.
