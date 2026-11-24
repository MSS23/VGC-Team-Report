# Research synthesis — nightly swarm 16 Nov 2026

Wave 1: 8 read-only audits (C1 dead code, C2 TypeScript, C3 bundle/perf, C4 security,
C5 commit review, R6 SEO, R8 a11y, R-UX share flow). Four research agents from the standard
roster (R1/R2 competitor teardowns, R4 creator sentiment, R7 AEO) were **not dispatched**:
thorough versions exist from 26-10-26, they produce drafts rather than code, and GOAL A
(drain the board) was the stated priority. Budget went to implementation instead.

## Top 5 highest-leverage opportunities

1. **Merge PRs #91 and #92.** Not a code change — the single highest-value action available.
   Two unmerged swarm drafts hold 26 commits and 117 changed source files, including fixes
   that *three separate agents independently rediscovered tonight* (below). Nothing else on
   this list comes close.
2. **Fork-route privacy leak (C4, HIGH).** A signed-in user clicking Fork on a public report
   receives the creator's unredacted paste — the hidden items and EV spreads a player
   deliberately conceals before an event. One click, no tooling. Being fixed this run.
3. **`/s/[id]` serves no crawlable content (R6 + R-UX, independently).** ~5,000 sitemapped
   share URLs resolve to a JS redirect shell; recipients on cold mobile connections wait up to
   15s. R-UX found a cheap path the VGC-318 ticket missed: `SharePage` already holds the row
   and spends it only on JSON-LD. Being implemented this run as a partial.
4. **97 of 98 pages prerender zero navigation links (R6).** `PersistentNavbar`'s top-level
   `useSearchParams()` bails the root-layout Suspense boundary to `null`. `/tools/ev-to-sp`
   proves the component is SSR-safe when not bailed. Internal linking depth is a direct ranking
   factor. Being implemented this run.
5. **Board truth is the cheapest win of all.** 12 Backlog tickets are already shipped on main
   and 61 tickets sit In Review against 2 open PRs. Reconciling the board costs no code and
   visibly moves it. Delivered this run as two reports.

## Top 5 quick-win bugs

1. Fork-route redaction bypass (C4) — in progress.
2. `redact-paste.ts:26` `privateFields as string[]` with no `Array.isArray`: a non-array row
   returns `[]`, silently disabling redaction in both report and PNG (C2 #3) — in progress,
   folded into the fork fix since it is the same module and the same fail-open shape.
3. Trick Room badge (C5): the baseline order sorted fastest-first while the display sorts
   slowest-first under Trick Room, so every row showed a false "moved N positions" badge.
   **Fixed inline this run** — one line, baseline now sorted in the same turn-order frame.
4. `normalize-report.ts:19` unvalidated `category` → saved damage calcs silently vanish, while
   the twin path at `useDamageCalcs.ts:35` validates (C2 #2) — in progress.
5. `url-codec.ts:140` + `useShareUrl.ts:97/115`: `calcs:[null]` in a `#data=` link reaches
   `CalcsPanel.tsx:20` and throws mid-render (white screen) (C2 #1). **Not fixed tonight** —
   both files are owned by PRs #91/#92. Filed as a ticket instead.

## Three findings that were already fixed on an unmerged branch

This is the duplication loop VGC-265 describes, measured rather than asserted:

| Tonight's finding | Already fixed by |
|---|---|
| C5: un-publishing never revokes the public og:image card (privacy) | **#91 `d0b0ac9`** — same diagnosis |
| C3: `/compare` ships the dex via a transitive `effective-form` import, 88.3 KB gz | **#91 `b90cc48`** — same root cause, same 337.1 KB gz figure, same tripwire-test extension |
| C3: `CookieBanner` ships a render-blocking stylesheet on 97/98 pages | **#91 `5859aff`** |

Three of the night's strongest technical findings were work already done and waiting for review.
That is the cost of the review queue, quantified.

## Blockers for implementation

- **117 source files off-limits** (touched by #91/#92) — this excluded the `/compare` perf win,
  the over-budget `<title>` fixes, the `/tools/ev-to-sp` de-staling, C2 finding #1, and most of
  R8's a11y batch targets (`PokemonCard`, `SpeedTierChart`, `Navbar`, `faq`).
- **Dead-code deletion dropped entirely.** C1 found 20 high-confidence items (~558 LOC, mostly
  73 orphaned i18n keys × 7 locales). #91 and #92 *both* already delete dead code from the same
  files, so a third deletion would be a guaranteed three-way conflict for no added value. C1 also
  flagged two items a naive tool would wrongly delete: the `chronological-cursor.ts` scaffolding
  for open ticket VGC-295, and the `_removed` rest-omit idiom in `normalize-report.ts:97`.
- **Six tickets are blocked on a human and were deliberately left alone**: VGC-330 (is 248 EVs
  31 or 32 SP — three runs have flipped these assertions back and forth; adding a fourth flip is
  the documented failure mode), VGC-290 (do Champions regs allow restricteds), VGC-289 (stale —
  M-C shipped), VGC-301 (needs VGC-291, which is on #92 not main), VGC-236 (needs Vercel env
  verification), VGC-305 (needs a Discord webhook rotation in Discord's UI).
- **No PostHog and no Vercel credentials**, so no telemetry-driven prioritisation and no
  env-var/log verification. Tracked by VGC-220.
- **Community sentiment was largely unobtainable**: reddit.com is excluded from the search tool
  and WebFetch had no DNS. R-UX reported this plainly rather than inventing quotes. R6's keyword
  work came through.

## High-conflict-risk files that were changed anyway

- `src/components/report/SpeedTierChart.tsx` — touched by both #91 and #92. Changed regardless
  for the Trick Room badge fix: it is a one-line change in a region neither branch edits, and the
  bug shows wrong information to every user who toggles Trick Room. Flagged in the PR body.
