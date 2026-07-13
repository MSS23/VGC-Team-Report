# C5 Commit Review — 2026-07-13

Review of last 20 commits on `origin/main` (`83d195a` → `2f928ab`).

Overall the tree is in solid shape — most commits are the July "Reliability + Security" pass and are careful. The rushed-work signal is concentrated in the July 4 UI feedback commit (`fbfc877`) and in a couple of loose ends left behind by the reliability push. Ten concrete follow-ups below, roughly ordered by value.

---

## 1. SpeedTierChart renders literal `—` in the UI (BUG · high)

- Commit: `fbfc877` (Address user feedback: Common Combinations, clearer speed tiers, stat legend)
- Files:
  - `src/components/report/SpeedTierChart.tsx:500` (JSX `title` attribute)
  - `src/components/report/SpeedTierChart.tsx:520` (JSX text child)
- Category: **bug** (visible UI regression)
- Severity: **HIGH**

Both call sites embed the string literal `—` inside a JSX **attribute** value / **text child**. JSX does **not** process JS escape sequences in either context (unlike JS string literals in `{...}`) — so the user sees the seven characters `—` on screen instead of an em-dash. Verified by `od -c`: the file bytes are `\`, `u`, `2`, `0`, `1`, `4`.

The nearby WhatsNewModal (`—` inside `desc: "..."`) and line 524 (JS string in a ternary) are fine because those *are* JS string literals.

**Fix:** replace the four broken sites (line 500 title attr, line 520 JSX child; the same file also has harmless copies inside `{/* comments */}` on 495/514 you may want to normalize) with an actual `—` character (or `{"—"}` if you must keep the escape).

---

## 2. Stale "Mega Evolution is only legal in Reg M-A" copy (BUG · medium)

- Commits: `fbfc877` shipped the copy; `2f928ab` (Add Pokémon Champions Regulation M-B support) made it wrong two days earlier
- Files:
  - `src/components/report/SpeedTierChart.tsx:521` — user-visible line: `" Mega Evolution is only legal in Reg M-A."`
  - `src/components/report/SpeedTierChart.tsx:463` — code comment
  - `src/components/report/SpeedTierChart.tsx:418` — `metaSourceLabel` falls back to `"Reg M-A meta"` when `isChampions && !regulation`
  - `src/components/report/SpeedTierChart.tsx:500` — the same title attr says "Champions formats use the Reg M-A meta"
- Category: **bug** (misleading UX)
- Severity: **MEDIUM**

`isChampionsFormat(regulation)` was updated to accept M-A **or** M-B, and Megas are legal in both — but three user-visible strings still name M-A explicitly. If the user has a Reg M-B team with no Mega Stone, the empty-state line reads: "…Mega Evolution is only legal in Reg M-A." That is now false.

**Fix:** replace with "…in Champions formats (Reg M-A / Reg M-B)" (or feed the label off `isChampionsFormat`), and either extend `META_THREATS_CHAMPIONS` with M-B threats or relabel the meta source as "Champions meta".

---

## 3. `metaSourceLabel` label vs. actual data mismatch (BUG · medium)

- Commit: `fbfc877`
- File: `src/components/report/SpeedTierChart.tsx:414-418`
- Category: **bug** (data provenance display)
- Severity: **MEDIUM**

```
const metaSourceLabel = regulation
    ? `${regulation} meta`
    : isChampions ? "Reg M-A meta" : "Standard meta";
```

For a Reg M-B team, this renders "Reg M-B meta" — but the meta threats list actually served is `META_THREATS_CHAMPIONS`, which per surrounding comments is the M-A list. The user is being told the benchmarks are M-B when they are not.

**Fix:** derive the label from what the code actually reads (e.g. return the source enum from the same helper that picks `META_THREATS_CHAMPIONS` vs. standard), or split the M-B list out.

---

## 4. Ref mutation during render in useHomePage (CLEANUP · medium)

- Commit: `0db0370` (Fix autosave echo loop + frontend races, undo, memoization)
- File: `src/hooks/useHomePage.ts` — near the `useCollaborativeSync(...)` call, `syncControlsRef.current = { markSaving, updateVersion };`
- Category: **cleanup** (React anti-pattern; StrictMode double-invoke risk)
- Severity: **MEDIUM**

Assigning to a ref during render violates React's "renders are pure" rule. It happens to be safe today because `markSaving` / `updateVersion` are stable (empty-deps `useCallback`), so the assignment is idempotent — but StrictMode will do it twice on mount, and if either callback ever gains a dep, this becomes a subtle bug.

**Fix:** move into a `useEffect` (deps `[markSaving, updateVersion]`), or expose `syncControlsRef` from `useCollaborativeSync` directly and skip the bridge.

---

## 5. Undocumented magic timing constants around the echo suppression (CLEANUP · low)

- Commit: `0db0370`
- File: `src/hooks/useCollaborativeSync.ts` — `suppressEchoUntil.current = Date.now() + 8000;` and `setTimeout(..., 3000)` for `syncStatus`
- Related: `src/hooks/useShareFlow.ts` — autosave debounce `3000`; `src/hooks/useHomePage.ts:65` — undo-snapshot debounce `500`; `src/hooks/useShareUrl.ts` — 15000 ms share fetch timeout (from `97dc8bb`)
- Category: **cleanup**
- Severity: **LOW**

The 8000 ms in `updateVersion` is picked to outlast the 5000 ms SSE poll interval, but the poll interval lives in `src/app/api/sync/[id]/route.ts` (a different file) — comment says "one poll interval" while the literal is 1.6× the interval. If the poll ever moves to 10s, this silently starts re-applying self-echoes again.

**Fix:** hoist these to named constants (`ECHO_SUPPRESSION_MS`, `SSE_POLL_INTERVAL_MS`) and reference the poll constant from both files.

---

## 6. Fire-and-forget `.catch(() => {})` on edit_changelog insert (CLEANUP · low)

- Commit: `0635b74` (Reliability: transactions, bulk inserts, analytics flush, fetch timeouts)
- File: `src/app/api/share/[id]/versions/route.ts:181` — the revert-changelog INSERT is still `sql\`…\`.catch(() => {})`
- Category: **cleanup** (swallowed error)
- Severity: **LOW**

The main revert (snapshot + UPDATE) was correctly wrapped in `sql.transaction([...])`. The trailing changelog insert intentionally stays fire-and-forget and swallows errors silently — no `console.warn`, unlike the sibling `share_versions snapshot failed` calls in `src/app/api/share/route.ts` which do log. Loses forensic visibility for reverts that don't get a changelog row.

**Fix:** wrap in `try/catch` with a `console.warn("changelog revert insert failed:", e)` to match the sibling pattern.

---

## 7. Discord admin allowlist fails closed without any operator-facing signal (CLEANUP · medium)

- Commit: `1ccfc21` (Security: close access-control gaps and add missing rate limits)
- File: `src/app/api/discord/route.ts` — `isAuthorizedInvoker` returns `false` when `DISCORD_ADMIN_USER_IDS` and `DISCORD_ADMIN_ROLE_IDS` are both empty; user sees "You are not authorized to run this command."
- Category: **cleanup** (ops footgun)
- Severity: **MEDIUM**

Failing closed is the right default, but if a future env change or new deployment forgets to set both envs, `approve`/`reject` silently rejects **every** invoker with a message that reads like a permission error against the specific user — not "the bot isn't configured." No log or Discord ping to the operator.

**Fix:** on the "no allowlist configured" branch, `console.warn("Discord admin allowlist unset — mutating commands disabled")` at request time, and consider a distinct message ("This action isn't configured on this deployment") so the maintainer isn't chasing a phantom Discord-side permission bug.

---

## 8. `fetchWithTimeout` silently discards caller `signal` (CLEANUP · low)

- Commit: `0635b74`
- File: `src/lib/fetch-with-timeout.ts`
- Category: **cleanup**
- Severity: **LOW**

JSDoc notes it, but any caller composing their own `AbortController` (e.g. for user cancellation) will find their signal replaced by the timeout signal. Currently only called from `discord/route.ts` so no live regression, but the helper is exported and will surprise the next user.

**Fix:** if `options.signal` is provided, chain both via `AbortSignal.any([options.signal, controller.signal])` (Node ≥ 20 / modern edge runtime).

---

## 9. Notification poll on visibility-change fires unbounded per-tab (CLEANUP · low)

- Commit: `0825946` (Reduce Neon DB load…)
- File: `src/hooks/useNotifications.ts` — the `visibilitychange` handler calls `fetchCount()` every time the tab becomes visible, independent of the 60s interval
- Category: **cleanup** (cost)
- Severity: **LOW**

A user rapidly Alt-Tabbing can trigger many count-only fetches in seconds. Neon load is small (a single indexed COUNT), but on a hobby plan every request has fixed cost. Cheap fix: guard on "last fetch was > N seconds ago".

**Fix:** track a `lastCountAt` ref and skip if `Date.now() - lastCountAt < 15_000`.

---

## 10. Comment `isOwn` still relies on `===` on the delete credential (CLEANUP · low)

- Commit: `1ccfc21`
- File: `src/app/api/comments/[shareId]/route.ts:67` — `(row.session_id as string) === callerSessionId`
- Category: **cleanup** (consistency with rest of security surface)
- Severity: **LOW**

The rest of the auth stack (verify-bearer, tested in `c51a9e1`) uses constant-time comparison. This route now derives `isOwn` server-side (good), but still does a raw `===` on the raw session_id. Timing signal is negligible for anonymous comment session IDs, but if these ever become a longer-lived credential, this is the wrong shape to leave in place.

**Fix:** use `crypto.timingSafeEqual` over Buffer-wrapped strings for consistency, or note in the schema why plain `===` is fine here.

---

## Also worth noting (not in the top 10)

- **`sitemap` push-tip padding** — `83d195a` explicitly exists to bypass Vercel's Ignored Build Step (docs-only push). Fine as one-off, but if the same trick is repeated it becomes hard to spot which commits are "just to force a build". Consider a repeatable convention (touch a version bumper, empty commit with tag) so this isn't a per-swarm surprise.
- **`.catch(() => {}) on forkQuery` in explore route** — `0825946`, `src/app/api/explore/route.ts` — deliberate degrade path when `forked_from_id` column doesn't exist. Now that the migration is presumably deployed, this fallback is dead weight worth cleaning up.
- **179+ new inline icons in `icons.tsx`** — `cba0832` — clean refactor but adds a component per glyph; if bundlesize matters, revisit whether one `<Icon name="…" />` dispatch would tree-shake as well or better.

