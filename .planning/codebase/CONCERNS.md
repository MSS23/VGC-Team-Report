# Codebase Concerns

**Analysis Date:** 2026-04-02

## Security Concerns

**Unprotected `/api/setup` Route (CRITICAL):**
- Issue: `src/app/api/setup/route.ts` exposes a GET endpoint that runs `ensureTable()` (all database migrations) with zero authentication. Anyone can trigger schema changes.
- Files: `src/app/api/setup/route.ts`
- Impact: An attacker could trigger database migrations at will, potentially causing downtime or performance degradation under load.
- Fix approach: Add `CRON_SECRET` or `MIGRATE_SECRET` bearer token check, or remove the route entirely (migrations run via `ensureTable()` elsewhere).

**npm Dependency Vulnerabilities (HIGH):**
- Issue: `npm audit` reports 6 vulnerabilities including HIGH severity in `@clerk/backend` (SSRF, secret key leakage via `clerkFrontendApiProxy`), `flatted`, `lodash`, and `picomatch`. Also a moderate vulnerability in `next@16.1.6` itself.
- Files: `package.json`, `package-lock.json`
- Impact: The `@clerk/backend` SSRF vulnerability (GHSA-gjxx-92w9-8v8f, CVSS 7.4) could leak secret keys to unintended hosts. All have fixes available.
- Fix approach: Run `npm audit fix` or manually bump `@clerk/nextjs` and other affected transitive dependencies.

**Cron Auth Spoofable via User-Agent (MEDIUM):**
- Issue: `src/lib/cron-auth.ts` accepts any request with `vercel-cron` in the User-Agent string. This is trivially spoofable by any HTTP client.
- Files: `src/lib/cron-auth.ts`, `src/app/api/keep-alive/route.ts`, `src/app/api/cron/daily-ops/route.ts`, `src/app/api/cron/weekly-report/route.ts`
- Impact: Anyone can trigger cron jobs (health checks, weekly reports, cleanup) by setting the User-Agent header. The `CRON_SECRET` fallback exists but the User-Agent bypass makes it moot.
- Fix approach: Remove the User-Agent check. Rely solely on `CRON_SECRET` bearer token. Vercel cron sets the `Authorization` header automatically.

**Bot Route Fallback Auth (MEDIUM):**
- Issue: `src/app/api/bot/route.ts` line 39 falls back to `LINEAR_API_KEY` if `CRON_SECRET` is not set: `process.env.CRON_SECRET ?? process.env.LINEAR_API_KEY`. This mixes authentication domains.
- Files: `src/app/api/bot/route.ts`
- Impact: If `CRON_SECRET` is unset, the Linear API key becomes the bot endpoint's password, which is a credential scope violation.
- Fix approach: Require `CRON_SECRET` explicitly. Do not fall back to unrelated secrets.

**`dangerouslySetInnerHTML` with Translation Strings (LOW):**
- Issue: `src/app/page.tsx` line 662 uses `dangerouslySetInnerHTML` to render `t.hiddenSlideDescription` which contains `<strong>` HTML tags from translation files.
- Files: `src/app/page.tsx`, `src/lib/i18n/translations/*.ts`
- Impact: Low risk since translation strings are developer-controlled (not user input), but the pattern could become dangerous if translations are ever externalized or user-contributed.
- Fix approach: Use React components instead of raw HTML in translations (e.g., render `<strong>` as a React element).

## Code Quality Issues

**Duplicated `normalizeReportData` / `normalizeForMigration` Logic (HIGH):**
- Issue: Report data normalization is implemented twice with nearly identical logic in two separate files. Both handle matchup plan migration, calc entry migration, and field defaults independently.
- Files: `src/app/api/share/[id]/route.ts` (`normalizeReportData`), `src/app/api/migrate/route.ts` (`normalizeForMigration`)
- Impact: Bug fixes or schema changes must be applied in two places. Divergence between the two will cause inconsistent data depending on access path.
- Fix approach: Extract into a shared utility in `src/lib/utils/normalize-report.ts` and import from both routes.

**Unused `apiGuard` Utility (HIGH):**
- Issue: `src/lib/security/api-guard.ts` provides a consolidated security guard (rate limiting, content-type validation, body size checks) but is not imported by any API route. All 42 routes manually inline their own rate limiting and validation logic.
- Files: `src/lib/security/api-guard.ts`, all files in `src/app/api/`
- Impact: Inconsistent security enforcement across routes. Some routes may miss rate limiting or validation that the guard would have provided.
- Fix approach: Adopt `apiGuard()` in all API routes. Standardize the security pattern instead of hand-rolling each route.

**God Component: `DashboardContent.tsx` at 1,240 Lines (HIGH):**
- Issue: `src/app/dashboard/DashboardContent.tsx` handles 7 tabs (my, saved, feed, collab, collections, analytics, trash), report management, claiming, sorting, deletion, restoration, collection management, and analytics display in a single component.
- Files: `src/app/dashboard/DashboardContent.tsx`
- Impact: Extremely difficult to maintain, test, or modify. Changes to one tab risk breaking others. No tests exist for this component.
- Fix approach: Extract each tab into its own component (e.g., `MyReportsTab.tsx`, `AnalyticsTab.tsx`, `CollectionsTab.tsx`). Share state via context or lifted state.

**God Component: `page.tsx` (Home) at 945 Lines (MEDIUM):**
- Issue: The home page component manages team input, report display, sharing, presentation mode, walkthrough, comments, reactions, and version diffing all in one file.
- Files: `src/app/page.tsx`
- Impact: Complex prop threading and many `useEffect` hooks (5 total). Hard to reason about rendering behavior.
- Fix approach: Extract logical sections into sub-components. The dynamic imports are a good start but the orchestration logic should also be separated.

**Excessive `eslint-disable` Comments (MEDIUM):**
- Issue: 25+ `eslint-disable` comments across the codebase, with 13 being `@typescript-eslint/no-explicit-any` suppressions concentrated in `src/app/api/migrate/route.ts`, `src/lib/utils/diff-state.ts`, `src/lib/utils/version-diff.ts`, and `src/app/api/share/[id]/route.ts`.
- Files: See grep results above
- Impact: Type safety erosion. `any` types bypass TypeScript's protection and can mask runtime errors.
- Fix approach: Define proper types for report data structures (especially matchup plans, calcs, and version diff payloads). Replace `any` with specific interfaces.

**Zod Schema Uses `.passthrough()` (LOW):**
- Issue: `src/app/api/share/route.ts` line 16 uses `.passthrough()` on the state schema, allowing arbitrary unknown fields to be stored in the database.
- Files: `src/app/api/share/route.ts`
- Impact: Any data a client sends gets persisted to the database, including potentially large or unexpected payloads. Combined with the 500KB body limit this is bounded but not ideal.
- Fix approach: Define the complete state schema explicitly or use `.strip()` to remove unknown fields.

## Performance Concerns

**7,832-Line Static Data Files in Bundle (MEDIUM):**
- Issue: `src/lib/data/moves.ts` (4,183 lines), `src/lib/data/pokemon.ts` (3,292 lines), and `src/lib/data/mega-pokemon.ts` (357 lines) are large static data arrays that ship in the client bundle.
- Files: `src/lib/data/moves.ts`, `src/lib/data/pokemon.ts`, `src/lib/data/mega-pokemon.ts`
- Impact: Adds significant weight to the JavaScript bundle. These files contain every move and Pokemon in the game as static arrays.
- Fix approach: Consider moving to JSON files loaded on-demand, or use dynamic imports that only load when the damage calculator or autocomplete features are active.

**In-Memory Rate Limiter Does Not Work Across Serverless Instances (MEDIUM):**
- Issue: `src/lib/rate-limit.ts` uses an in-memory `Map` for rate limiting. In Vercel's serverless environment, each function invocation may run in a different container, so the rate limit state is not shared.
- Files: `src/lib/rate-limit.ts`
- Impact: Rate limiting is effectively per-instance, not per-user. Under load, an attacker could bypass rate limits entirely by hitting different instances. The `setInterval` cleanup at the module level may also cause issues with cold starts.
- Fix approach: Use Upstash Redis (already in the stack via `src/lib/cache.ts`) for rate limit state, or use Vercel's built-in rate limiting. The in-memory approach only works for sustained attacks hitting the same warm instance.

**`ensureTable()` Runs Full Migration Set (LOW):**
- Issue: `src/lib/db.ts` `ensureTable()` runs 30+ sequential SQL statements every time it's called. It's used by the `/api/setup` endpoint and potentially on cold starts.
- Files: `src/lib/db.ts`
- Impact: Each call issues 30+ database queries sequentially, adding latency. Most are `IF NOT EXISTS` guards but they still hit the database.
- Fix approach: Track migration version in a metadata table and only run new migrations. Or use a proper migration tool.

**Explore Route Complex Query Building (LOW):**
- Issue: `src/app/api/explore/route.ts` builds complex dynamic SQL queries with many conditional fragments (FTS, ILIKE, species filters, placement, archetype, tag filters). At 211 lines, this single GET handler handles all explore page queries.
- Files: `src/app/api/explore/route.ts`
- Impact: Difficult to optimize or debug query performance. Some filter combinations may produce slow queries without proper indexing.
- Fix approach: Consider breaking into separate query builders or using a query builder library. Add database query timing logs.

## Test Coverage Gaps

**No API Route Tests (CRITICAL):**
- Issue: Zero test files exist for any of the 42 API routes. All business logic in API routes (sharing, comments, reactions, collaborators, user management, explore, feedback) is untested.
- Files: All 42 routes in `src/app/api/`
- Impact: Any change to API logic could break core functionality (sharing, editing, commenting) with no automated safety net. The only tests are 12 unit tests for utility functions and 6 Cypress E2E tests.
- Risk: HIGH -- API routes contain the most critical business logic.
- Priority: High

**No Tests for Custom Hooks (HIGH):**
- Issue: 23 custom hooks in `src/hooks/` have zero test coverage. These hooks manage core state: team parsing, sharing, undo/redo, collaborative sync, walkthrough, matchup plans, etc.
- Files: All 23 files in `src/hooks/`
- Impact: State management bugs (especially in `useShareUrl.ts`, `useCollaborativeSync.ts`, `useUndoRedo.ts`) could cause data loss without detection.
- Priority: High

**No Tests for Components (MEDIUM):**
- Issue: No component tests exist for any of the 30+ components. The only UI testing is via 6 Cypress E2E tests.
- Files: All files in `src/components/`
- Impact: UI regressions can only be caught by manual testing or E2E tests, which are slow and brittle.
- Priority: Medium

**12 Unit Tests for 241 Source Files (MEDIUM):**
- Issue: Test-to-source ratio is ~5%. Tests exist only for: `item-boosts`, `stat-calculator`, `showdown-parser`, `url-codec`, `export-paste`, `extract-species`, `relative-time`, `sanitize`, `sprite-slug`, `word-filter`, `cron-auth`, `rate-limit`.
- Files: `src/lib/**/__tests__/*.test.ts`
- Impact: Large majority of the codebase has no automated testing. Parser and sharing codec tests are good but they cover only the utility layer.
- Priority: Medium

## Architecture Concerns

**Inline Migrations in Application Code (HIGH):**
- Issue: Database schema is defined as inline SQL in `src/lib/db.ts` `ensureTable()`. Schema evolution is handled by sequential `ALTER TABLE ADD COLUMN IF NOT EXISTS` statements mixed with `CREATE TABLE IF NOT EXISTS`. No migration versioning or rollback capability.
- Files: `src/lib/db.ts` (237 lines of migration code)
- Impact: No way to roll back schema changes. No migration history. Adding new columns requires appending to an ever-growing function. Schema state depends on execution order.
- Fix approach: Adopt a migration framework (e.g., Drizzle ORM migrations, or even a simple versioned SQL file approach).

**No Structured Logging (MEDIUM):**
- Issue: All error handling uses `console.error` and `console.warn` (56 occurrences across API routes). No structured logging, no request IDs, no log levels, no correlation between related operations.
- Files: All API routes (56 `console.error`/`console.warn` calls)
- Impact: Debugging production issues requires searching through unstructured Vercel logs. No way to trace a request across multiple database calls or external service calls.
- Fix approach: Consider a structured logger (e.g., Pino) that outputs JSON with request IDs, timestamps, and log levels. Sentry is already integrated for error tracking but not for operational logging.

**Fire-and-Forget Database Writes (MEDIUM):**
- Issue: Multiple API routes use `.catch(() => {})` on database write operations marked as "non-critical" (changelog entries, version snapshots, notification creation). Failures are silently swallowed.
- Files: `src/app/api/share/route.ts` (lines 101, 108, 138), `src/lib/notifications.ts`, `src/app/api/comments/[shareId]/route.ts`
- Impact: Data loss in auxiliary tables (changelogs, notifications, version snapshots) goes undetected. No alerts when these systems fail.
- Fix approach: At minimum, log failures. Consider batching non-critical writes or using a queue.

## Dependencies at Risk

**`html2canvas-pro` (LOW):**
- Issue: `html2canvas-pro` is a community fork of the abandoned `html2canvas` project. Used for PDF export / team graphic generation.
- Files: `package.json`, `src/lib/utils/export-report.ts`
- Impact: Limited maintenance and potential compatibility issues with future browser updates.
- Migration plan: Monitor the fork's activity. Alternative: use server-side rendering for image generation (already partially done via `src/app/api/team-graphic/route.tsx`).

**`tweetnacl` (LOW):**
- Issue: `tweetnacl` is stable but hasn't had a release since 2019. Used solely for Discord interaction signature verification.
- Files: `package.json`, `src/app/api/discord/route.ts`
- Impact: Low risk since the API is stable and the use case is narrow (Ed25519 verification). No known vulnerabilities.
- Migration plan: Could migrate to Web Crypto API's `subtle.verify()` which supports Ed25519 natively in modern runtimes.

## Missing Infrastructure

**No Error Boundary Components (MEDIUM):**
- Issue: No React error boundaries exist in the component tree. If any component throws during rendering, the entire page crashes with an unhandled error.
- Files: `src/app/layout.tsx` (no error boundary wrapping `{children}`)
- Impact: A single rendering error in any component crashes the entire application for the user.
- Fix approach: Add error boundaries around major sections (report view, dashboard, explore page). Next.js `error.tsx` files can serve this purpose.

**No Request/Response Logging Middleware (LOW):**
- Issue: No centralized request logging. Individual routes log errors but there's no middleware that logs request method, path, status code, and duration for all API calls.
- Files: `src/middleware.ts` (handles security but no logging)
- Impact: No visibility into API usage patterns, error rates, or response times outside of Vercel's built-in analytics.
- Fix approach: Add timing and logging to the middleware, or use Vercel's observability features.

---

*Concerns audit: 2026-04-02*
