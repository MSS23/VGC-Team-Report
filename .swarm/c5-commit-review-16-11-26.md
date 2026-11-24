# C5 — Commit review of the last 20 commits on `origin/main`

- **Date:** 2026-11-16
- **Window:** `git log origin/main -20` → `10dfd74` (31 Oct 2026) back to `83fc12f` (26 Oct 2026). Shallow clone; every finding is read off `git show` plus the current tree at HEAD.
- **Mode:** strictly read-only. No source edits, no git state changes, no external sends (so **no Linear API calls** — ticket status below is inferred from local evidence: `.swarm/run-meta.md`, `.swarm/unfiled-tickets-26-10-26.md`, `.swarm/late-findings-26-10-26.md`, and the ticket ids cited inside the commits themselves).
- **One verification run:** `vitest run src/lib/analysis/__tests__/stat-calculator.test.ts` → 61 passed. Nothing else executed.
- Prior report skimmed: `.swarm/c5-commit-review-26-10-26.md`. Its findings are **not** repeated here unless this window made them worse (F7 below).

## Commits reviewed

```
10dfd74 Merge claude-dev: VGC-230 webhook idempotency, VGC-231 List-Unsubscribe, VGC-233 OTS PDF, VGC-235 share test (#90)
e4d9354 feat: pre-render the shared-report og:image card to Vercel Blob (#89)
2886c78 fix: /champions/[species] redirects to the Mega guide instead of 404ing (#88)
d8aba62 chore: clear the 36 lint errors and make lint blocking in CI (#87)
1fa2e4a feat: speed tiers model +1/+2 stages, doubling abilities and Trick Room order (#86)
f223d3e test: keep the 248-EV SP cap assertions and let the share fetch validation settle
b14c717 fix: Champions SP maths — the 32nd Stat Point, over-budget spreads, and lowercase natures
282dbed fix: validate the fetched share payload, and stop handing out an undefined type
c8fae06 fix: Mega Evolutions show their real type chart, and the column filters work by keyboard
0c6f94e fix: visibility is owner-only, and fork lineage respects the source's privacy
060a095 fix: anonymous flags could hard-delete any comment via IPv6 rotation
66854cf fix: account deletion could destroy another creator's profile
13dcffc VGC-WEBHOOK: acknowledge stale Linear payloads with 200 so retries stop failing
7b85e8f test: fail the build if a real credential reaches the tracked tree
babe700 a11y: mark the 31 shared icons decorative
544d02a fix: honour analytics opt-out that arrives mid-import
46018fc fix: remove swarm-internal plea from the public changelog
e147d8d swarm: add v5.29 to the changelog for tonight's fixes
d539c6a swarm: run notes, unfiled tickets, and the Linear free-cap blocker
83fc12f feat: give signed-out mobile viewers a no-auth path off a shared report
```

**Verdict in one line:** 4 of 20 commits look rushed (`10dfd74`, `e4d9354`, `1fa2e4a`, `f223d3e`); the Sept/Oct cherry-pick batch (`0c6f94e`, `060a095`, `66854cf`, `13dcffc`, `544d02a`, `c8fae06`, `282dbed` in part) is genuinely high-quality, well-commented, test-backed work.

---

# Findings — worst first

## F1 — HIGH — `10dfd74` is a squash merge whose message claims four tickets that are **not in the diff**

| | |
|---|---|
| **Commit** | `10dfd74` |
| **Files** | the merge itself (6 files); absent: `src/lib/email-html.ts`, `src/components/seo/ArticleJsonLd*`, the Clerk-`publicMetadata` half of VGC-231, the Export-Theme focus trap in `src/components/home/HomePageClient.tsx` |
| **Severity** | HIGH (process / board integrity) |
| **Ticketed?** | **No** |

`10dfd74` has a single parent (`e4d9354`) — it is a squash, not a true merge — and its full diff is 6 files / +464 lines. The message advertises seven tickets. Verified against HEAD:

| Claim in the message | Reality at HEAD |
|---|---|
| VGC-230 svix-id idempotency | **landed** (`src/app/api/webhooks/clerk/route.ts:38,50-56`) |
| VGC-233 OTS PDF via jspdf | **landed** (`src/components/ui/OTSSheetModal.tsx:22-180`) |
| VGC-235 shares INSERT/UPDATE/dedup test | **landed** (`src/app/api/share/__tests__/share-flow.test.ts`) |
| VGC-231 "POST/GET /api/user/preferences endpoint to write `digestUnsubscribed` to Clerk publicMetadata" | **not landed.** `src/app/api/user/preferences/route.ts` exists but predates this merge and writes Postgres `user_preferences`, never `publicMetadata`. `grep -rn digestUnsubscribed src/` → **one** hit, the reader at `weekly-digest/route.ts:305`. Nothing ever sets it. |
| VGC-231 "`List-Unsubscribe` **and `List-Unsubscribe-Post`** headers" | **half landed.** Only `List-Unsubscribe` is sent (`weekly-digest/route.ts:361`). Without `List-Unsubscribe-Post: List-Unsubscribe=One-Click` and a POST endpoint this is **not** the one-click unsubscribe Gmail/Yahoo bulk-sender rules require, and the URL it points at (`/dashboard/notifications`) is behind Clerk auth. The commit is titled a "CAN-SPAM fix" and does not close it. |
| VGC-234 `src/lib/email-html.ts` html`` escaping helper, migrate 4 builders, drop ad-hoc `escapeHtml` | **not landed.** File does not exist; `weekly-digest/route.ts:3` still imports `escapeHtml` from `@/lib/email`. |
| VGC-229 `ArticleJsonLd` + `SportsTeamJsonLd` wired into `/s/[id]` | **not landed.** No such components anywhere in `src/`. |
| VGC-223 focus trap for the Export Theme modal + aria-labels | **not landed.** The merge's only change to `HomePageClient.tsx` is the 2-line `regulation`/`eventType` prop pass-through. |

So four ticket-sized pieces of work were announced by a commit on `main` and never shipped. Per `.swarm/run-meta.md` the board already has **61 issues in "In Review" against 2 unmerged PRs**; a squash message like this is exactly how VGC-229/223/234/231 end up closed with no code. The real unsubscribe gap is a live compliance exposure, not just bookkeeping.

**Follow-up:** reconcile VGC-229, VGC-223, VGC-234 and VGC-231 back to In Progress with a one-line note that the squash message overstated the diff; land `List-Unsubscribe-Post` + an unauthenticated one-click POST route before the next digest send; prefer real merges (or `--no-squash`) for multi-ticket branches so the diff and the message cannot diverge.

---

## F2 — HIGH — A report un-published from the dashboard leaves its team graphic readable at a public Blob URL forever

| | |
|---|---|
| **Commit** | `e4d9354` |
| **Files** | `src/lib/sharing/og-image.ts:60-73,86-113` · `src/app/api/user/reports/[shareId]/route.ts:52-103` (PATCH, no removal call) vs `:137-141` (DELETE, has one) |
| **Severity** | HIGH (privacy) |
| **Ticketed?** | **No** |

`e4d9354`'s own message promises: *"Private reports have their card deleted (the Blob URL is public)."* That holds only for the two call sites it wired up — `POST /api/share` (which re-publishes with the current visibility, so a private save removes the card) and `DELETE /api/user/reports/[shareId]`.

The dashboard visibility toggle is **`PATCH /api/user/reports/[shareId]`** (`:52` `isPublic`/`isUnlisted` → `:84-85` `UPDATE shares SET is_public = …, is_unlisted = …`). That handler invalidates the share cache and the explore prefix and **never calls `removeShareOgImage`**. Combined with `put(blobPath(shareId), …, { addRandomSuffix: false })` — a deterministic path, `og/<shareId>.png` — the rendered team graphic of a report the user has just made Private stays publicly fetchable for anyone who knows the share id (i.e. anyone who ever held the link), with no expiry; the Redis entry expires after 90 days but the blob does not.

This directly contradicts the v5.29 changelog entry shipped four days earlier in `e147d8d`: *"A Private report's graphic could previously be pulled by anyone holding the link … Private graphics are now owner-and-collaborator only."* `/api/team-graphic/route.tsx:51-93` still enforces that gate correctly; the new pre-render path bypasses it by design, and the un-publish path does not clean up.

Also inside the same commit: the card is published for **unlisted** reports too, which undoes the "an unlisted report's graphic is no longer held in a shared cache" half of that changelog claim — an unlisted report now has a permanent public PNG.

**Follow-up:** call `removeShareOgImage(shareId)` from the PATCH visibility branch whenever the new state is neither public nor unlisted (and re-publish when it becomes public); add a test in `src/lib/sharing/__tests__/og-image.test.ts` that pins "unpublish via PATCH removes the blob". Consider auditing the blob store for orphaned `og/*.png` belonging to now-private reports.

---

## F3 — HIGH (risk; needs one SQL count to confirm) — the new fail-closed share validation can turn legacy reports into the "corrupt link" screen

| | |
|---|---|
| **Commit** | `282dbed` |
| **Files** | `src/hooks/useShareUrl.ts:61-115` (`LEGACY_TOLERANT_KEYS`, `parseFetchedShareState`), `:283-295` · `src/lib/sharing/url-codec.schemas.ts:30-110` · `src/lib/utils/normalize-report.ts:29-120` |
| **Severity** | HIGH if any rows are affected, otherwise latent |
| **Ticketed?** | **No** (the related `.swarm/unfiled-tickets-26-10-26.md` item about `ShareableStateSchema` being *unbounded* is a different concern) |

Validating the fetch path is right. The problem is the stated premise: *"the write schema is looser than the read schema for two keys"* — `hiddenSlides` and `spriteSettings`, the only two in `LEGACY_TOLERANT_KEYS`. It is looser in more places, and everything else **fails closed into the corrupt-link screen for the whole report**:

| Key | Write (`api/share/route.ts` `ShareBodySchema`) | Read (`ShareableStateSchema`) | After `normalizeReportData` |
|---|---|---|---|
| `notes` | `record(string, **unknown**)`, optional | `record(string, string)`, **required** | key always present, **values not coerced** → a numeric/object note still fails |
| `roles` | `record(string, **unknown**)` | `record(string, string)` | `data.roles ?? {}`, **values not coerced** → fails |
| `matchupPlans[].gamePlans[].bring` | `array(unknown)` | `tuple([int\|null × 4])` | `Array.isArray(gp.bring) ? gp.bring : [null×4]` — **a legacy 2- or 3-element `bring`, or string indices, passes through and then fails** |
| `…gamePlans[].result` | unchecked | `enum(["W","L","T"])` | `gp.result ?? undefined` — a legacy `"win"` fails |
| `tags.tournamentUrl` | regex `^https://limitlessvgc\.com/tournaments/\d+$` (added later than many rows) | same regex | passed through untouched → an older/other-host URL fails |
| `mvpIndex` | `number().nullable()` | `number().int()` | passthrough |

`normalizeReportData` (applied in `api/share/[id]/route.ts:172,236`) mitigates the common cases — absent `notes`/`matchupPlans`, legacy `planA`/`planB`, string calc entries — which is why this has not obviously exploded. But each row above is a path where a report that rendered fine before `282dbed` now shows "corrupt link" and the owner loses access to their own report, including the edit session.

**Follow-up:** before anything else, one read-only count against Neon (`shares` rows where `jsonb_typeof` of a `notes`/`roles` value ≠ `string`, where any `gamePlans[].bring` has `jsonb_array_length <> 4`, where `result` is outside W/L/T, or where `tags->>'tournamentUrl'` fails the regex). Then fix forward in `normalizeReportData` — coerce `notes`/`roles` values with `String()`, pad/clamp `bring` to 4 nullable ints, drop an unknown `result`, drop a non-matching `tournamentUrl` — rather than widening `LEGACY_TOLERANT_KEYS`, which would re-open the hole the commit closed. Add a fixture test that pipes a legacy row through `normalizeReportData` → `parseFetchedShareState` and asserts non-null.

Smaller, same commit: `versionRef.current` and `baselineRef.current` are still assigned from the **unvalidated** payload (`useShareUrl.ts:282`) before `parseFetchedShareState` runs, which the message says is not the case for session state; and the handler became `async` without re-checking `controller.signal` after the dynamic `await import()`, so a slow first response can settle after a newer one (small race, same hook).

---

## F4 — MEDIUM-HIGH — Trick Room reports a fake "moved N positions" badge on every row

| | |
|---|---|
| **Commit** | `1fa2e4a` |
| **Files** | `src/components/report/SpeedTierChart.tsx:171` (`hasAnyModifiers` now includes `trickRoom`), `:361` (list sorted by `compareTurnOrder(..., trickRoom)`), `:368-400` (`positionChanges`, unmodified order still `b.speed - a.speed`), `:713-722` (render) |
| **Severity** | MEDIUM-HIGH (user-visible, wrong competitive information) |
| **Ticketed?** | **No** |

`positionChanges` diffs the **unmodified** order — always hardcoded fastest-first at `:385` — against `allEntries`, which under Trick Room is sorted **slowest-first**. `hasAnyModifiers` was widened to include `trickRoom`, so the memo now runs when Trick Room alone is on. Every row therefore gets a non-zero `posChange` and renders a green/red arrow with `title="Moved N positions up/down"` (`:713-722`), on a toggle whose own tooltip says *"Speed values stay the same; only the turn order flips."* On a 6-mon team plus meta threats that is a full column of invented movement.

`1fa2e4a` shipped 5 tests, all for the pure helpers (`calcBattleSpeed`, `hasSpeedDoublingAbility`, `compareTurnOrder`) — none for the component, so nothing caught it.

**Follow-up:** sort the unmodified baseline with the same `compareTurnOrder(a, b, trickRoom)` (or skip `positionChanges` entirely when `trickRoom` is the only active modifier). One component test: Trick Room on, no other modifier ⇒ `positionChanges.size === 0`.

Two smaller notes on the same commit:
- The three new modifier toggles use **emoji** icons (`:68-70`, `⬆️`, `⏫`, `🌧️`), against the "SVG icons only" UI standard — the same file the previous audit already flagged for emoji (proposed ticket #7 there, unfiled). The new Trick Room button next to them *is* an inline SVG, so the file is now inconsistent with itself. `ui-checklist-reviewer` does not appear to have been run on this `.tsx` change.
- `calcSpeed` hardcodes the Unburden special case by string compare (`:81` `ability?.trim().toLowerCase() === "unburden"`) inside the chart rather than beside `SPEED_DOUBLING_ABILITIES` in `stat-calculator.ts`, so the item-boost rule lives apart from the ability list it depends on. The math is correct; the placement will drift.

---

## F5 — MEDIUM — `b14c717` is a cherry-pick whose message describes a fix that is **not in its diff**, and which shipped with failing tests

| | |
|---|---|
| **Commit** | `b14c717` (then `f223d3e`) |
| **Files** | `src/lib/analysis/stat-calculator.ts:139-142` (`if (ev >= 248) return CHAMPIONS_MAX_SP_PER_STAT`) · `src/lib/analysis/__tests__/stat-calculator.test.ts:321-334,357-362` |
| **Severity** | MEDIUM (gate integrity; the numbers at HEAD are self-consistent) |
| **Ticketed?** | **Partly — VGC-330** covers the assertion flip-flop; the *cherry-pick dropped half its own fix* aspect is not recorded anywhere |

`b14c717`'s message leads with *"Deleting the guard is the whole fix"* and ends with *"Also corrects the one stale ladder figure in llms.txt"*. Neither is in the diff: `stat-calculator.ts` is changed only for `isSpFormSpread`/`convertToChampionsSp`, the `ev >= 248` guard is still at HEAD, and `public/llms.txt` is not in the commit's file list at all. What *was* cherry-picked is the **test half** — assertions rewritten to `evToChampionsSp(248) === 31` and `championsSpToEv(32) === 252`, which cannot pass against the code that shipped in the same commit. So `b14c717` landed red, and `f223d3e` (test-only) restored the two assertions to match the code.

Confirming the task's question: **`f223d3e` is the only commit in this window that changes test assertions without touching the code they describe.** `e4d9354` rewrote one assertion in `src/app/s/[id]/__tests__/metadata.test.ts` and `d8aba62` reworked `src/hooks/__tests__/render-hook.ts`, but both accompany the real code change that made them necessary, and both add coverage rather than remove it. `7b85e8f` and the VGC-235 suite are new tests only.

Deliberately **not** proposing any assertion change (VGC-330, three flips already). For whoever makes that ruling, the state to rule on, measured at HEAD: 248 EVs = 32 SP is consistent across **all five** places — `stat-calculator.ts:141`, `src/lib/analysis/__tests__/sp-docs-drift.test.ts` (derives `CAP_EV_COST = championsSpToEv(32)` and asserts the docs say `32 SP = 248+ EVs`), `public/llms.txt:29`, `public/llms-full.txt`, and `src/app/tools/ev-to-sp/page.tsx`. `vitest run src/lib/analysis/__tests__/stat-calculator.test.ts` → 61 passed. Ruling for 252 therefore means a 5-file change, not a 2-assertion change; ruling for 248 means deleting the "252" prose from `b14c717`'s message trail and closing VGC-330.

**Follow-up:** add to VGC-330 that the cherry-pick dropped the code half of its own change, so the message on `main` documents a fix the tree does not have; and ask why the pre-commit gate passed for `b14c717` (per CLAUDE.md, `verification-gate` must run vitest on every commit — these assertions could not have been green).

---

## F6 — MEDIUM — Clerk webhook: "email not configured" is now reported as a 500, and a Redis blip silently drops the welcome email

| | |
|---|---|
| **Commit** | `10dfd74` (VGC-230) |
| **Files** | `src/app/api/webhooks/clerk/route.ts:49-56,74-83` · `src/lib/email.ts:38-42,187-199` · `src/lib/cache.ts:68-77` |
| **Severity** | MEDIUM |
| **Ticketed?** | **No** |

Two failure modes, both introduced by making this route fail loudly:

1. **Misconfiguration looks like a transient failure.** `sendEmail` returns `null` *both* when the send fails *and* when `RESEND_API_KEY` is simply unset (`email.ts:39-42`, a `console.warn` + `return null`). The new `if (!result) … return 500` cannot tell the two apart, so on any deployment without the key (preview environments, or a rotated/dropped prod key) **every** `user.created` webhook answers 500 and Clerk retries it with backoff until it gives up — exactly the escalating-failure shape `13dcffc` fixed for the Linear webhook three commits earlier, re-introduced here. Distinguish "not configured" (log + 200) from "send failed" (500).
2. **Fail-closed dedupe loses the email.** `cacheSetIfAbsent` returns `true` when Redis is absent (`cache.ts:71`) but `false` from its `catch` (`:74-76`). On a transient Upstash error the route reads `isNew === false`, logs "duplicate detected", returns `{ ok: true, deduped: true }` and **never sends the welcome email** — Clerk sees 200 and never retries. A cache error should fail open (treat as new) on a path whose only side effect is an at-least-once email.

No test accompanies either (the merge's only new test file is the VGC-235 shares suite).

---

## F7 — LOW-MEDIUM — 209 internal swarm reports are committed to the tracked tree, and this window adds 9 more

| | |
|---|---|
| **Commit** | `d539c6a` |
| **Files** | `.gitignore:44-50` (ignores `.claude/`, `.agents/`, `.codex/` — **not** `.swarm/`) · `git ls-tree -r origin/main` → 209 paths under `.swarm/` |
| **Severity** | LOW-MEDIUM (information disclosure, if the GitHub repo is public — `src/lib/email.ts:26` ships `https://github.com/MSS23/VGC-Team-Report` to users) |
| **Ticketed?** | **No** |

`.swarm/` holds the security audits (`c4-security-*.md`), the unfixed-vulnerability lists, the unfiled-ticket bodies and the run notes — including, right now, `.swarm/unfiled-tickets-26-10-26.md` describing **live unfixed bugs** and `.swarm/c4-security-26-10-26.md`. `.gitignore` deliberately excludes the three sibling agent directories and misses this one. `46018fc`, in this same window, exists solely because swarm-internal prose leaked into the public changelog; this is the same class of leak with a much larger surface.

**Follow-up:** add `.swarm/` to `.gitignore` and decide (human call) whether to `git rm --cached` the existing 209 files. Note the Vercel Ignored Build Step already skips `*.md`, so a `.swarm`-only commit cannot be the tip of a push (CLAUDE.md gotcha) — `d539c6a` was correctly ordered before code commits.

---

## F8 — LOW — OTS PDF: no error path, and silent truncation at 6 rows

| | |
|---|---|
| **Commit** | `10dfd74` (VGC-233) |
| **Files** | `src/components/ui/OTSSheetModal.tsx:297-304` (`try`/`finally`, no `catch`) · `:63-66` (`NUM_ROWS = 6`) · `:28-30,60-61` (magic layout constants) |
| **Severity** | LOW |
| **Ticketed?** | No |

`handleDownloadPdf` has `try { await generateOtsPdf(…) } finally { setDownloading(false) }` and no `catch`: a failed `await import("jspdf")` (offline, stale chunk) rejects unhandled, the spinner clears and the user gets no feedback. This copies the pre-existing shape of `handleDownloadPng` (`:277-295`), so it is consistent rather than novel — but it is now two silent failures on a tournament-day export path. `NUM_ROWS = 6` silently drops any 7th+ Pokemon in the paste, and the layout is a wall of bare millimetre literals with the column widths kept in sync only by a comment (`// 7+32+9+27+26+17+18+18+18+18 = 190`); an assertion (`COLS.reduce(sum) === PW`) would be cheap.

---

# Verified clean — checked and *not* problems

Recorded so the next audit does not re-spend the effort.

- **`0c6f94e`, `060a095`, `66854cf`, `13dcffc`, `544d02a`, `c8fae06`** are the strongest work in the window: each names the bug, explains the wrong reasoning it replaces, ships a regression test that names it, and narrows its own scope explicitly. `060a095`'s `COUNT(*) FILTER (WHERE session_id LIKE 'user:%')` is the right fix for the IPv6 flag abuse; `66854cf`'s `NOT EXISTS` guard plus DISTINCT-name collection is correct and its residual is marked `ponytail:` **and** tied to an existing ticket (VGC-253).
- **`2886c78`** is correct end-to-end: `megaSlugForSpecies` returns null for already-Mega slugs and for multi-Mega species (`charizard`), `generateMetadata` returns `{}` for an unknown slug rather than calling `notFound()`, so the `permanentRedirect` in the page is actually reachable, and the test covers all four branches.
- **`d8aba62`** is a genuine lint cleanup, not a suppression sweep: `InlinePokemonEditor`'s `activeIndex`, `ShareModal`'s `showTagError`/`showCreatorError` and `DoubleTapLikeOverlay`'s spawn-time reduced-motion capture are real fixes to derive-in-render. Every `eslint-disable` carries a `--` reason. Dropping `continue-on-error` closes the previous audit's proposed ticket #5 and unfiled ticket #6.
- **`b14c717`'s `isSpFormSpread`** is the right discriminator (units by per-stat magnitude, never budget compliance), `champions-legality.ts:275-300` now shares it so display and validation cannot drift, and the residual (`33 HP / 10 Atk`) is both documented and pinned by a test. The over-budget warning path is genuinely reachable again.
- **`e4d9354`'s privacy-field handling is correct**: the moved renderer honours `privateFields` via `redactPasteFields` (`team-graphic-image.tsx:85-94`), and `ogCardFingerprint` includes `privateFields`, so redaction changes re-render the card. `/api/team-graphic/route.tsx` keeps its owner/collaborator gate. F2 is the *lifecycle* gap, not a redaction gap.
- **`share-flow.test.ts` (VGC-235) cannot touch prod data unasked**: `describe.skipIf(!process.env.DATABASE_URL)`, its own `vitest-share-flow-owner`, and an `afterAll` cleanup. It is skipped in CI (no `DATABASE_URL`) — worth knowing that it therefore guards nothing there, but it is not a Neon-storage risk.
- **`7b85e8f`** (secret scanner) and **`babe700`** (31 icons `aria-hidden`) are additive, well-scoped and need no follow-up.
- **`83fc12f`**'s oEmbed `alternates.types` is correctly gated on `isPublic` to match `/api/oembed`'s `is_public = TRUE` filter, and its mobile CTA respects the one-primary-CTA rule. Only irony worth noting: it added a test pinning *"The OG and Twitter images: [] suppression is untouched"*, which `e4d9354` reversed three days later — the third attempt at OG cards for `/s/[id]`. If `BLOB_READ_WRITE_TOKEN` is unset in prod the whole feature no-ops silently with no alert, so someone should confirm the env var exists (per `.swarm/run-meta.md`, Vercel access is missing this run, so it could not be checked here).

---

# Follow-up table

| # | Finding | Suggested follow-up | Ticketed? |
|---|---|---|---|
| 1 | F1 | Reopen VGC-229 / VGC-223 / VGC-234 / VGC-231; ship `List-Unsubscribe-Post` + unauthenticated one-click POST; stop squash-merging multi-ticket branches | No |
| 2 | F2 | `removeShareOgImage` from the PATCH visibility branch + test; audit orphaned `og/*.png` | No |
| 3 | F3 | Count affected `shares` rows, then coerce/pad in `normalizeReportData` (not in `LEGACY_TOLERANT_KEYS`); legacy-row fixture test | No |
| 4 | F4 | Sort the `positionChanges` baseline with `compareTurnOrder`; component test for Trick-Room-only | No |
| 5 | F4b | Finish the emoji→SVG sweep in `SpeedTierChart` (now inconsistent inside one file) | Proposed in the 26-10 report, unfiled |
| 6 | F5 | Note on VGC-330 that `b14c717` dropped the code half of its own change; ask how it passed the gate | VGC-330 (partly) |
| 7 | F6 | Clerk webhook: distinguish unconfigured from failed; make `cacheSetIfAbsent` fail open on its `catch` | No |
| 8 | F7 | `.gitignore` `.swarm/`; human call on un-tracking the 209 existing files | No |
| 9 | F8 | `catch` + user-visible error on both OTS exports; assert `COLS` widths sum to `PW` | No |

Linear could not be queried under this run's read-only rule, and per `.swarm/unfiled-tickets-26-10-26.md` the workspace is at its **free issue cap** — so items 1–5 and 7–9 most likely need to go into the unfiled-ticket holding file rather than Linear.
