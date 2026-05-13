# Code Review: Last 20 Commits on main
**Date:** 2026-05-13
**Reviewer:** Claude Code (Sonnet 4.6)
**Scope:** Commits `a2a8cc2` through `92a5fe4` (last 20 on main)

---

## Executive Summary

The last 20 commits show a strong velocity of feature additions and targeted bug fixes, with solid security practices throughout. Five src/ files with the heaviest recent churn were audited in depth: `src/app/api/match-log/route.ts`, `src/components/match-tracker/MatchTracker.tsx`, `src/app/api/champions/meta/route.ts`, `src/hooks/useShareUrl.ts`, and `src/app/api/explore/route.ts`. No critical bugs found. Key concerns: silent error suppression in MatchTracker's fetch, a stats calculation bug that under-counts the match log (win-rate uses `logs.length` instead of total game count), the explore route's unbounded query complexity under heavy filter combinations, and `useShareUrl`'s growing surface area (474 lines, 21 exported values) which is a maintenance hazard.

**Overall Assessment:** YELLOW — ship-ready, but three issues warrant follow-up tickets before the tracker becomes widely used.

---

## Files Reviewed

### 1. `src/app/api/match-log/route.ts`

| # | Issue Type | Severity | Description | Suggested Fix |
|---|-----------|----------|-------------|---------------|
| 1.1 | Logic Bug | **HIGH** | `overallWinRate` in GET is calculated as `Math.round((totalWins / totalGames) * 100)` where `totalGames = logs.length` — i.e., number of *match entries*, not actual *games played*. A 3-game series logged as one entry with `gameCount=3` counts the same as a 1-game entry. The `gameCount` column is stored but never summed in the win-rate denominator. This means a user who plays lots of Bo3 will see an inflated win-rate relative to their actual game-level performance, and the dashboard `overallWinRate` is semantically misleading unless clearly labelled "per-match". | Either sum `game_count` (`SELECT SUM(game_count)`) and use that as the denominator, or clearly rename the metric to `matchWinRate` and add a `gameWinRate` that accounts for game_count. |
| 1.2 | Missing Validation | LOW | `ensureTable()` is called on every POST and GET, adding a no-op DB round-trip per request in the happy path. The table is created once; after that, `IF NOT EXISTS` is a cheap but still-present DDL statement that bypasses connection pool optimisation. | Move `ensureTable()` to an app-startup hook or lazy-init pattern with a module-scope boolean guard. |
| 1.3 | Missing Feature / UX | LOW | No DELETE endpoint. Users who accidentally log a match (wrong archetype, wrong result) have no way to remove it. Over time, garbage entries will distort win-rate stats. | Add `DELETE /api/match-log?id=<uuid>` with user ownership verification. |

---

### 2. `src/components/match-tracker/MatchTracker.tsx`

| # | Issue Type | Severity | Description | Suggested Fix |
|---|-----------|----------|-------------|---------------|
| 2.1 | Error Handling | **MEDIUM** | `fetchStats` has a silent catch block (`catch { /* silent */ }`). If the API is down or returns a non-200 (e.g. rate-limit 429, DB connection failure 500), the loading spinner clears and the user sees the empty-state "No matches logged yet" message — even if they have 50 logged matches. There is no error UI path from `fetchStats`. | Add a `fetchError` state. On catch (or `!res.ok`), set `fetchError = true` and render an error banner with a retry button. |
| 2.2 | Logic Bug (mirrors 1.1) | **HIGH** | The stats displayed in the UI (from the GET response) inherit the server-side win-rate bug (1.1 above). Additionally, the component's local "Recent Matches" section shows `logs.slice(0, 5)` — this is fine — but the "My Record" displays `summary.totalGames` labelled as "N games" while it actually means "N match entries". If the word "games" is surfaced to the user it is factually wrong for multi-game series. | Fix server-side calculation (1.1) and update label to "matches" until game-count denominator is implemented. |
| 2.3 | UX / Accessibility | LOW | The autocomplete dropdown (`filteredSuggestions`) has no keyboard navigation. Tab moves focus away from the input; arrow-key navigation between suggestions is expected by keyboard users per WCAG 1.3.1 and common autocomplete pattern. The `onBlur` `setTimeout(150)` trick is fragile across screen-readers. | Use `role="listbox"` + `role="option"` + `aria-activedescendant` pattern, or a library like Downshift. |
| 2.4 | Stale Timer | LOW | `setTimeout(() => setSubmitSuccess(false), 2000)` on line 126 is not cleared on unmount. If the user closes the form or navigates away within 2 seconds of a successful submit, the callback fires on an unmounted component. While React 18 suppresses the warning, it is still a logical stale-closure risk. | Return a cleanup from `useEffect`, or capture the timer ref and clear it in an `useEffect` cleanup. |

---

### 3. `src/app/api/champions/meta/route.ts`

| # | Issue Type | Severity | Description | Suggested Fix |
|---|-----------|----------|-------------|---------------|
| 3.1 | Performance | **MEDIUM** | The query `SELECT data->>'paste' FROM shares WHERE …` has no LIMIT. If Champions-format reports grow to thousands, this will SELECT and transfer every paste to the Node.js process for in-memory aggregation. SQL-side aggregation (e.g. `unnest(string_to_array(paste, '\n'))` or a materialized view) would be dramatically cheaper. | Add `LIMIT 2000` as a safety ceiling for now; file a follow-up to move species aggregation to a DB function or nightly materialized view. |
| 3.2 | Type Duplication | LOW | `MetaEntry` and `ChampionsMetaResult` interfaces are defined both in this route file and re-defined identically in `MetaSnapshot.tsx`. They diverge silently if either side is updated. | Move interfaces to a shared `src/types/champions-meta.ts` and import in both files. |
| 3.3 | Regex / Filter Fragility | LOW | The WHERE clause matches `data->>'regulation' ILIKE '%champion%'` and `ILIKE '%reg-m%'`. A team tagged `regulation = "regm-special-event"` would match. The filter is intentionally broad but could pull in noise as new regulation slugs are added. | Document the accepted slugs as a typed union in the data model and use `= ANY(…)` with an allowlist rather than ILIKE wildcards. |

---

### 4. `src/hooks/useShareUrl.ts`

| # | Issue Type | Severity | Description | Suggested Fix |
|---|-----------|----------|-------------|---------------|
| 4.1 | Complexity | **MEDIUM** | At 474 lines with 21 returned values, `useShareUrl` violates the single-responsibility principle. It manages: (a) URL parsing, (b) share creation/update, (c) auto-save, (d) fork, (e) session persistence in `localStorage`, (f) owner/collaborator state, and (g) forkedFrom metadata. Any change to one concern requires understanding all 474 lines. Tested in isolation this would require mocking 7+ dependencies. | Split into: `useShareSession` (active token/id refs, localStorage), `useShareActions` (copyShareUrl, freshShare, autoSave, forkReport), `useSharedViewLoader` (fetch on shareId, populate sharedState). Compose from a thin `useShareUrl` coordinator. |
| 4.2 | Missing Error State | LOW | `copyShareUrl` has two nested try/catch blocks. The inner one sets `shareStatus="error"` and returns early; the outer one also sets `shareStatus="error"`. If `navigator.clipboard.writeText` throws (e.g. on HTTP-only origins or permissions denied), the user sees the error state but no message explaining it was a clipboard issue vs a server issue. | Distinguish clipboard errors from API errors in the error message. |
| 4.3 | Regex Brittleness | LOW | `detectPathnameShareId` uses `/^\/s\/([A-Za-z0-9]{8})(?:\/|$)/` — exactly 8 alphanumeric characters. If the share ID scheme ever changes length (e.g. 12 chars), this silently stops matching and triggers the "bounced back to home" bug that this code was written to fix. | Store the share ID length as a named constant (e.g. `SHARE_ID_LENGTH = 8`) used in both generation and detection, so a length change propagates automatically. |

---

### 5. `src/app/api/explore/route.ts`

| # | Issue Type | Severity | Description | Suggested Fix |
|---|-----------|----------|-------------|---------------|
| 5.1 | Performance | **MEDIUM** | When `sort=popular` (the default), the query does a full `LEFT JOIN (SELECT share_id, COUNT(*) FROM reactions GROUP BY share_id)` subquery on every non-cached request. With cursor pagination and many reactions rows, this scales as O(reactions) even for page 2+. The cursor condition `AND (COALESCE(rc.like_count, 0), s.created_at) < (…)` can't use an index because the `rc` subquery is recalculated. | Materialize reaction counts into a `like_count` column on `shares` updated via DB trigger or background job. The views column already follows this pattern (`COALESCE(s.view_count, 0)`). |
| 5.2 | Cache Bypass Risk | LOW | The cache key includes every filter combination as a colon-delimited string (line 37). Any new filter parameter added to the route will silently bypass caching if not added to the cache key string. There is no automated guard. | Build the cache key from a typed params object serialized via `JSON.stringify(sortedEntries)` so new params are included automatically. |
| 5.3 | Inconsistent Error Handling | LOW | The `forked_from_id` join (lines 276–289) silently swallows errors with `catch { }`. All other DB errors in this route are caught at the outer try/catch and return a 500. The inconsistency means a structural DB error inside the fork join (e.g. table lock) will produce a partial response with `forkedFromCreator` missing for all items rather than a proper 500. | Log the error at minimum (`console.error("Fork lineage join failed:", e)`) so it appears in Vercel function logs. |
| 5.4 | Potential ReDoS | LOW | `tsQuery` is built by splitting `q` on whitespace and calling `.replace(/[^\w]/g, "")`. The `\w` character class in JS regexes does not include Unicode word chars, so a user searching "Chien-Pao" has the hyphen stripped and gets `"chien:* & Pao:*"` — which matches correctly via GIN prefix. But a query of only special chars (e.g. `"---"`) reduces to an empty `tsQuery`, and the condition `(useFts && tsQuery)` guards against this. | This is handled correctly; no action needed. (Noted for completeness.) |

---

### 6. `src/app/champions/[pokemon]/page.tsx`

| # | Issue Type | Severity | Description | Suggested Fix |
|---|-----------|----------|-------------|---------------|
| 6.1 | Missing Error Handling | LOW | `getTeamsForPokemon` wraps the entire body in `try/catch` and returns `[]` on any error — including DB connection failures. The page silently renders with an empty "Featured Teams" section. Since this is an ISR page, a DB failure during revalidation would persist the "no teams" render until the next revalidation cycle (1 hour). | Distinguish `null` (DB error, skip the section and show a retry message) from `[]` (genuinely no teams). Pass an error flag through the return type. |
| 6.2 | N+1 Pattern | LOW | `getTeamsForPokemon` makes 2 sequential DB queries: one for shares, then one for likes. This is already a micro-optimisation compared to a true N+1, and the second query uses `ANY(${shareIds})`, so it's acceptable. | No action required; noted for awareness. |

---

### 7. `src/hooks/useScrollHide.ts`

| # | Issue Type | Severity | Description | Suggested Fix |
|---|-----------|----------|-------------|---------------|
| 7.1 | MediaQuery Listener Leak | LOW | `mq.addEventListener("change", onMotionChange)` is registered, but if `mq.matches` is `true` on mount (reduced-motion user), the hook returns early after `setHidden` — without ever attaching the listener to clean it up. In practice the early return means the listener is never registered in this path, so there is no leak. However the `onMotionChange` function is defined before the early return, making the control flow confusing and hard to audit. | Move `onMotionChange` definition and `mq.addEventListener` calls after the `if (mq.matches) return` guard to make the intent unambiguous. |
| 7.2 | No HACK/TODO comments | INFO | Well-documented, clean implementation. The `reducedMotionRef` pattern correctly avoids a React state closure in the scroll handler. No issues. | — |

---

## Pattern-Level Findings

### P1 — Stats Calculated Client-Side Instead of DB-Side (MEDIUM)
Both `/api/match-log` GET and `/api/champions/meta` GET pull raw data rows to Node.js and aggregate in JavaScript. For small datasets this is fine, but both are unbounded. The match-log GET fetches up to 200 rows then groups by archetype in JS; the champions meta fetches ALL qualifying rows. Moving aggregation to SQL (`COUNT`, `GROUP BY`) would cut memory usage and latency.

### P2 — Duplicated Interface Definitions (LOW)
`MetaEntry`/`ChampionsMetaResult` appear in both the route and the component. `MatchLog`/`ArchetypeStat`/`Summary` are defined in `MatchTracker.tsx` but nowhere else — if the API response shape changes, the component's types drift silently (TypeScript won't catch this without a shared type import). File a ticket to move API response types to `src/types/`.

### P3 — No Delete/Edit on Match Logs (LOW)
The match tracker has no mechanism to correct or delete an erroneously logged match. Once the feature is in users' hands, this will become a pain point immediately. Prioritise before wide promotion.

---

## TODO / FIXME Scan
No `TODO`, `FIXME`, or `HACK` comments found in any of the five primary files reviewed.

---

## Recommended Follow-up Tickets

| Priority | Ticket | Description |
|----------|--------|-------------|
| P1 | VGC-MATCH-WINRATE | Fix win-rate denominator to use sum of game_count instead of match count; or relabel "matches" vs "games" clearly in UI |
| P1 | VGC-MATCH-FETCHERROR | Surface fetch error state in MatchTracker (silent catch → error banner + retry) |
| P2 | VGC-MATCH-DELETE | Add DELETE /api/match-log?id= with user ownership check |
| P2 | VGC-META-LIMIT | Add LIMIT 2000 safety ceiling to champions meta query; file follow-up for SQL aggregation |
| P2 | VGC-SHARE-SPLIT | Decompose useShareUrl (474 lines, 21 exports) into 3 focused hooks |
| P3 | VGC-SHARED-TYPES | Move API response interfaces to src/types/ (MetaEntry, MatchLog, etc.) |
| P3 | VGC-SHARE-ID-CONST | Extract SHARE_ID_LENGTH constant to guard detectPathnameShareId against future length changes |

---

## Test Status at HEAD
- No new tests introduced with the MatchTracker or MetaSnapshot additions.
- The win-rate bug (finding 1.1 / 2.2) is not caught by any existing test.
- `useScrollHide` has no unit test; the hook logic is straightforward but the RAF + MediaQuery combination is hard to reason about without one.
