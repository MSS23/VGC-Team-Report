# Dead Code Scan — VGC Team Report

_Scanned: 2026-05-07. Static analysis only (grep/find). No modifications made._

---

## Top 5 Dead Code Candidates

### 1. `src/components/social/VersionHistory.tsx` — Orphaned Component
`export function VersionHistory` is never imported anywhere. It was superseded by `VersionHistoryPanel` (same directory), which **is** imported by `Navbar.tsx`. The old `VersionHistory` component remains as a full standalone implementation (~130 lines) with its own API calls, state, and JSX — completely unreachable dead code.

### 2. `src/lib/security/csrf-client.ts` — Unused Export
`export function secureFetch(url, init)` is defined but never imported in any `.ts` or `.tsx` file across the entire codebase. The CSRF cookie is set server-side via `middleware.ts`, but the client-side `secureFetch` wrapper that was meant to attach the token to fetch calls is never used. All client-side fetches use the native `fetch` directly.

### 3. `src/app/api/keep-alive/route.ts` — Dead API Route
The route file's JSDoc says _"Called by Vercel cron every 5 minutes"_ but `/api/keep-alive` is **not registered** in `vercel.json` crons (which only lists `daily-ops`, `weekly-report`, `cleanup`, and `posthog-errors`). The route is also not called by any client-side code. It receives no traffic.

### 4. `src/app/api/cron/posthog-errors/route.ts` — Undocumented/Unbounded Cron
Not mentioned in `CLAUDE.md`'s cron table at all, yet registered in `vercel.json` on `schedule: "0 */4 * * *"` (every 4 hours = **6 runs/day**). This contradicts the project's stated "daily max" guardrail and silently consumes build/function minutes. Either the route is undocumented dead infra or it's a cost leak.

### 5. `src/lib/utils/export-report.ts` — Lazy-Only, Potentially Underused
Only referenced via a dynamic `import()` inside a rarely-triggered event handler in `page.tsx` (`const { exportAsImage } = await import("@/lib/utils/export-report")`). Not a hard blocker, but worth confirming the export-as-image feature is still intentional and tested, as lazy dynamic imports of this kind are invisible to tree-shaking analysis.

---

## Additional Findings

| File | Issue |
|------|-------|
| `src/lib/security/csrf-client.ts` | `secureFetch` export — zero importers |
| `src/components/social/VersionHistory.tsx` | Entire file — zero importers (superseded by `VersionHistoryPanel`) |
| `src/app/api/keep-alive/route.ts` | Not in `vercel.json` crons, not called by app code |
| `src/app/api/cron/posthog-errors/route.ts` | Runs 6x/day — undocumented, violates CLAUDE.md cost guardrails |
| `src/lib/utils/export-report.ts` | Dynamic-only import; confirm feature is still live |

---

## TODO / FIXME / HACK Comments

**None found.** The codebase has no `// TODO`, `// FIXME`, or `// HACK` annotations in TypeScript/TSX source files. Two minor inline notes were found but are informational comments, not action items:

- `src/components/layout/Navbar.tsx:40` — `// Warnings / save indicator` (section label)
- `src/lib/utils/diff-state.ts:79` — `// Note: hiddenSlides and allowComments are UI preferences...` (clarifying comment)

---

## Scan Coverage

- **Components checked:** 70 `.tsx` files in `src/components/`
- **Hooks checked:** 22 files in `src/hooks/`
- **Lib utilities checked:** ~45 files in `src/lib/` (utils, analysis, data, security, sharing, types)
- **App routes checked:** All `src/app/` pages and API routes
- **Method:** `grep -r "import.*from.*<path>"` for each file; cross-referenced against all importers
