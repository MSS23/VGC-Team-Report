# Code Review — claude-dev, last 20 commits
**Date:** 2026-05-14  
**Reviewer:** C5 (code-review agent)  
**Branch:** claude-dev  

---

## Commits Reviewed

| SHA | Message |
|-----|---------|
| 65b5e3a | swarm: discord notification payload (unsent) |
| 51e3682 | swarm: research notes + triage for 13-05-26 run |
| 472f5d2 | swarm: update Updates page for May 2026 |
| 017ae1a | VGC-156: fix missing og:image/twitter:image on 4 pages |
| b45fc1f | swarm: SEO title/description improvements |
| d0c86ad | VGC-171: Champions Pokédex drift guard CI tests |
| 3571d8b | VGC-172: unit tests for paste redaction (33 tests) |
| f0baef0 | swarm: share modal Copy Paste button |
| 379945e | VGC-175: match tracker delete + error state |
| 919f48c | swarm: cap champions meta snapshot query at 500 rows |
| b4a1940 | VGC-170: AbortController timeouts on all external fetches |
| 58b5c7a | VGC-174: security — timing-safe bot auth + XSS-safe JSON-LD |
| 92a5fe4 | fix(champions): mega landing pages no longer cross-show X/Y variants |
| eeea5ec | feat(share-actions): hide floating dock + reaction bar on scroll-down |
| 06411bc | fix(speed-tiers): only mark TIE when the tie involves a team Pokemon |
| 626f709 | fix(share): keep shared view alive after URL cleanup on /s/{id} |
| b074a8f | swarm: nightly improvements 12-05-26 (#26) |
| 1e3d3cb | feat(changelog): restore full version history + polish the page |
| 4061d5b | perf(vercel-cost): apply cost optimizations |
| d12e5c9 | Claude dev (#25) |

---

## Issue Index

### CRITICAL

---

#### C-01 — VGC-170 (b4a1940): Linear fetch uses `finally` without `catch` — AbortError propagates uncaught

**File:** `src/app/api/webhooks/posthog/route.ts:214–241`  
**Severity:** CRITICAL  

The Linear GraphQL fetch was restructured to use:
```ts
let result: Response;
try {
  result = await fetch(..., { signal: linearController.signal });
} finally {
  clearTimeout(linearTimeoutId);
}
const linearRes = await result.json();
```

There is **no `catch` block**. If the AbortController fires (5 s timeout) the `AbortError` is not caught here — it propagates up to the outer `try/catch` at line 287. However, because `result` is declared as `let result: Response` (not `let result: Response | undefined`), TypeScript does not flag the potential uninitialized read at line 243. If the outer catch ever handles the error differently in future, or if TypeScript strict null checks tighten, this is a silent data-loss path. The Linear issue creation failure path (abort) currently swallows the error without notifying Discord and returns 500 with no retry. This is inconsistent with the posthog-Discord notification pattern for other errors in the same file.

**Fix:** Add a `catch` block inside the Linear fetch block to explicitly rethrow with a typed error, or return a structured 504. Document that the outer catch is the intended catch site.

---

#### C-02 — VGC-175 (379945e): Delete error is silently discarded — user gets no feedback

**File:** `src/components/match-tracker/MatchTracker.tsx:95–105`  
**Severity:** HIGH  

```ts
const handleDelete = useCallback(async (id: string) => {
  if (!window.confirm("Delete this match entry?")) return;
  try {
    const res = await fetch(`/api/match-log?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      await fetchStats();
    }
    // If !res.ok — silent failure, no user notification
  } catch {
    // best-effort — user can refresh manually
  }
}, [fetchStats]);
```

When the DELETE call returns a non-OK status (e.g., 404, 500, rate-limited 429) the UI shows nothing — no toast, no error banner, no retry. The row visually remains (fetchStats is not called), but the user receives no confirmation the delete was attempted. This is inconsistent with the `fetchError` banner that was added in the same commit for the GET path. The delete silent-failure contradicts the ticket's stated goal of adding an "error state."

**Fix:** On `!res.ok`, set a transient error state (or reuse `fetchError`) to surface a message such as "Could not delete — tap to retry."

---

#### C-03 — VGC-174 (58b5c7a): `timingSafeEqual` padding leaks string length via padded content

**File:** `src/app/api/bot/route.ts:44–46`  
**Severity:** HIGH  

```ts
const aLen = Math.max(authHeader.length, expected.length);
if (!timingSafeEqual(Buffer.from(authHeader.padEnd(aLen)), Buffer.from(expected.padEnd(aLen)))
    || authHeader.length !== expected.length) {
```

`padEnd` pads with spaces. Both buffers are always equal length (correct for `timingSafeEqual` which requires equal-length inputs), but space-padded content means the comparison is done on character content including padding, not the raw bytes that an attacker would vary. The correct idiom is to HMAC both sides with a fixed key and compare the MACs (both constant-length), or use a fixed-length representation. The current implementation is better than a plain `===` but still leaks whether `authHeader.length > expected.length` through the short-circuit `|| authHeader.length !== expected.length` guard — a dedicated timing attacker can binary-search the correct secret length first, then brute-force character-by-character. For a cron secret this is low risk, but the intent was timing safety.

Additionally, `await import("crypto")` on every request in an auth hot-path is wasteful. Should be a static top-level import.

**Fix:** Use `import { timingSafeEqual } from "crypto"` at top of file. Compare HMAC-SHA256 digests or accept the limitation and document it.

---

### HIGH

---

#### H-01 — VGC-170 (b4a1940): `discordFetch` in `api/bot/route.ts` has no timeout

**File:** `src/app/api/bot/route.ts:7–18`  
**Severity:** HIGH  

VGC-170 added AbortController timeouts to `posthog/route.ts` and `pokepaste/route.ts` and `sprite/route.ts`, but the `discordFetch` helper in `api/bot/route.ts` — which is called by the scheduled bot summary actions — has no timeout. A stalled Discord API call will hang the entire Lambda until the platform kills it (10–30 s depending on route config).

**Fix:** Add a 5 s AbortController inside `discordFetch`, consistent with the pattern from the same commit.

---

#### H-02 — VGC-175 (379945e): `window.confirm` — browser native dialog blocked on mobile and in iframe

**File:** `src/components/match-tracker/MatchTracker.tsx:96`  
**Severity:** HIGH  

`window.confirm` is synchronous and blocks the event loop. Modern mobile browsers (iOS Safari in PWA mode, some Android WebViews) suppress `window.confirm` dialogs entirely and return `false` without showing anything, making deletes impossible for mobile users. This also fails in any iframe embedding context and is visually inconsistent with the rest of the app's UI patterns (which use custom modals).

**Fix:** Replace with a custom in-UI confirmation — e.g., a two-tap pattern (first click reveals a "Confirm delete?" prompt in the row, second click commits), or a small inline modal, consistent with other destructive actions.

---

#### H-03 — b074a8f (VGC-168): INDY_TOP_CUT ships with fictional placeholder data in production

**File:** `src/data/indy-top-cut.ts`, `src/app/champions/ChampionsContent.tsx:225–249`  
**Severity:** HIGH (UX/trust risk)  

The INDY_TOP_CUT data contains all `player: "TBD"` entries with fully fabricated `species` arrays and `limitlessUrl` pointing to the generic Limitless homepage. A "Sample — May 29-31, 2026" badge and disclaimer are present, but:

1. The table renders with real-looking placement badges ("1st", "2nd", etc.) alongside placeholder archetypes that may never match actual results.
2. The tournament date (May 29–31) has now passed relative to review date (2026-05-14). There is no automated mechanism to replace or hide the table post-tournament.
3. The Limitless links all point to `https://play.limitlesstcg.com/tournaments` rather than a specific event URL, so users who click them after the real data is published cannot find the right page.

**Fix:** Either replace with real data immediately post-tournament, or add a conditional render that hides the top-cut section when all players are "TBD" and replaces it with a "Check back after May 31" message. File a Linear ticket to update with real Limitless links.

---

### MEDIUM

---

#### M-01 — f0baef0: Copy Paste button — no fallback when `navigator.clipboard` is unavailable

**File:** `src/components/ui/ShareModal.tsx:224–233`  
**Severity:** MEDIUM  

```ts
const handleCopyPaste = async () => {
  if (!showdownPaste) return;
  try {
    await navigator.clipboard.writeText(showdownPaste);
    ...
  } catch {
    // Clipboard unavailable (non-HTTPS or permission denied) — no-op.
  }
};
```

Silent failure with no fallback. On non-HTTPS origins or when clipboard permission is denied the user clicks "Copy Paste" and nothing happens — no feedback, no alternative. Other copy buttons in the same component have the same pattern (it's an existing codebase pattern), but the new "Copy Paste" button was the most user-visible new action in this commit.

**Fix:** On catch, render a short-lived inline textarea with the paste text selected, or show a toast "Copy failed — select text below" with a `<pre>` block.

---

#### M-02 — 919f48c: Champions meta query LIMIT is an application-layer cap, not pagination

**File:** `src/app/api/champions/meta/route.ts:38–57`  
**Severity:** MEDIUM  

The 500-row LIMIT is applied in SQL, then species counting happens in JavaScript. This means: (a) the top-20 result is computed over only the 500 most-recent reports, biasing toward recency rather than true popularity, and (b) the `console.warn` at line ~68 is the only signal that data was truncated — it does not surface to the API consumer or the MetaSnapshot component. As the dataset grows past 500, the snapshot will silently degrade in accuracy without any operator alert.

**Fix:** Push the aggregation into SQL with `COUNT(*) GROUP BY species` so the limit is irrelevant to accuracy, or document the recency bias and add a metric/alert when the limit is hit.

---

#### M-03 — eeea5ec: `useScrollHide` — `containerRef` typed as `RefObject<HTMLElement | null>` but `FloatingReactionDock` passes `useRef<HTMLDivElement>` — minor type mismatch

**File:** `src/hooks/useScrollHide.ts:32`, `src/components/social/FloatingReactionDock.tsx:37`  
**Severity:** MEDIUM  

The hook accepts `React.RefObject<HTMLElement | null>` but `useRef<HTMLDivElement>(null)` is typed as `React.RefObject<HTMLDivElement>`. This compiles due to covariance but the hook's type definition should be `React.RefObject<HTMLElement | null>` or better `React.RefObject<Element | null>`. The hook also declares `containerRef` in the `useEffect` dependency array (via options), but `options.containerRef` is a ref object — ref objects are stable by identity and should not be in the dep array (or should be noted as intentional).

---

#### M-04 — VGC-171 (d0c86ad): Drift guard test relies on `salamence` not being in CHAMPIONS_DEX — fragile

**File:** `src/lib/data/__tests__/champions-dex.test.ts:67–69`  
**Severity:** MEDIUM  

```ts
it("salamence is NOT in CHAMPIONS_DEX (not Reg M-A legal)", () => {
  expect(CHAMPIONS_DEX.has("salamence")).toBe(false);
});
```

If Salamence is ever added (e.g., format change), this test fails unexpectedly. The test title should document the specific regulation rationale ("Mega Salamence is banned in Reg M-A; base Salamence therefore excluded") and the test should be updated as part of any format data update ticket. The "known illegal absent" concept should be driven by a shared `BANNED_IN_REG_MA` constant, not hardcoded in the test.

---

### LOW

---

#### L-01 — VGC-172 (3571d8b): Nickname-with-@ test documents broken behavior as intentional

**File:** `src/lib/sharing/__tests__/redact-paste.test.ts:330–345`  
**Severity:** LOW  

The test explicitly documents that `"Chomp@Speed (Garchomp) @ Life Orb"` with `item` redaction strips from the first `@`, leaving `"Chomp"`. This is a known parsing defect — the item-stripping regex uses `indexOf("@")` which is not @ marker-aware for Showdown format (the real item separator is the last `@ <word>` on the header line). The behavior is documented but not fixed. If any real user has a nicknamed Pokemon with an `@` in the nickname, their paste will silently corrupt on share.

**Fix:** Change item strip to find the last `@` preceded by a space, e.g., `/\s@\s[^@]+$/` or use a proper Showdown header parser.

---

#### L-02 — VGC-174 (58b5c7a): `JsonLd` XSS escape is incomplete — only covers `</script>`

**File:** `src/components/seo/JsonLd.tsx:4`  
**Severity:** LOW  

```ts
const safe = JSON.stringify(data).replace(/<\/script>/gi, "<\\/script>");
```

This guards against the most obvious `</script>` injection but leaves `<script` (opening tag) unescaped. A crafted value of `<script>alert(1)//` would need an external closing tag but `<!--` comment sequences can also interact with HTML parsers in edge cases. The standard defense is to additionally escape `<` as `<` (which is JSON-valid and transparent to JSON parsers):

```ts
JSON.stringify(data).replace(/</g, "\\u003c");
```

---

## Regression Check: Specific Tickets

### VGC-175 (379945e) — Match Tracker Delete
- API DELETE route: **correct**. Auth-guarded, ownership-validated via `WHERE id = ? AND user_id = ?`, rate-limited, returns 404 on miss.
- UI: **incomplete** (see C-02). Silent failure on non-OK HTTP response; `window.confirm` blocked on mobile (see H-02).
- No AbortController timeout on the DELETE fetch itself (low risk — it's against own API, not external).

### VGC-170 (b4a1940) — AbortController Timeouts
- pokepaste GET: **correct** — shared controller across parallel fetches, finally clears timeout.
- pokepaste POST: **correct**.
- sprite proxy: **correct**.
- posthog webhook (Linear): **partially broken** — finally-only block means AbortError propagates unhandled to outer catch (see C-01).
- posthog webhook (Discord): **correct** — proper try/catch/finally, non-critical swallowed.
- `api/bot/route.ts` `discordFetch`: **missed** — no timeout added (see H-01).

### VGC-172 (3571d8b) — Paste Redaction Tests
- 33 tests: all passing at time of commit.
- Coverage is good across all 4 fields and CRLF edge cases.
- Nickname-with-@ behavior documented but underlying bug not fixed (see L-01).
- No regression introduced.

### f0baef0 — Share Modal Copy Paste Button
- Feature works correctly when clipboard is available.
- Silent failure when clipboard unavailable (see M-01).
- No regression in existing copy-link/discord/embed buttons.
- PostHog event fires correctly.
- `showdownPaste` is computed at call site via `teamToShowdown(analysis.pokemon.map(p => p.parsed))` — correct transformation.

---

## Top 3 Follow-Up Linear Tickets

### Ticket 1 (HIGH): Replace `window.confirm` in MatchTracker with custom inline confirmation UI
**Rationale:** `window.confirm` is suppressed on iOS PWA / Android WebViews and is visually inconsistent. Affects all mobile users who try to delete a match log entry. Pair with fixing silent-failure on delete error (C-02 + H-02).
**Files:** `src/components/match-tracker/MatchTracker.tsx`
**Suggested work:** Two-tap confirm pattern (first tap: show "Delete?" + "Cancel" inline buttons; second tap: commits delete). On non-OK response, show inline error chip.

---

### Ticket 2 (HIGH): Update Indy Regionals Top-Cut table with real tournament data (or gate on data availability)
**Rationale:** Tournament is May 29–31. All players are currently "TBD" with fictional archetypes. Users clicking Limitless links hit the generic tournament list, not the actual event. Table ships in production on the Champions page with misleading "1st, 2nd" placement badges.
**Files:** `src/data/indy-top-cut.ts`, `src/app/champions/ChampionsContent.tsx`
**Suggested work:** Post-tournament: replace with real Limitless data. Pre-tournament: add a conditional hide when all players are "TBD" and show a "Results pending" placeholder instead of fake standings.

---

### Ticket 3 (MEDIUM): Push species aggregation into SQL for Champions meta snapshot — fix recency bias
**Rationale:** The 500-row LIMIT is applied before JS-side species counting, so the "meta" leaderboard reflects only the 500 most-recent reports, not true popularity. As the dataset grows this silently degrades. No alerting beyond a single `console.warn`.
**Files:** `src/app/api/champions/meta/route.ts`
**Suggested work:** Replace row-fetch + JS-count with a SQL `GROUP BY` + `COUNT(*)` aggregation query. Remove the LIMIT or apply it only to the final top-N result. Add a structured log metric (not just console.warn) when the query returns MAX_LIMIT rows.

---

## Summary Statistics

| Severity | Count |
|----------|-------|
| CRITICAL | 1 (C-01: Linear fetch has no catch — AbortError propagates unhandled) |
| HIGH | 4 (C-02, C-03, H-01, H-02, H-03) |
| MEDIUM | 4 (M-01, M-02, M-03, M-04) |
| LOW | 2 (L-01, L-02) |

**Clean commits (no issues):** 92a5fe4 (champions Mega X/Y fix), 06411bc (speed-tiers TIE fix), 626f709 (share URL cleanup fix), eeea5ec (scroll-hide hook — minor type issue only), d0c86ad (drift guard tests — fragile assertion only), 3571d8b (redaction tests — bug documented not fixed), 017ae1a (OG images), b45fc1f (SEO), 4061d5b (cost opts).
