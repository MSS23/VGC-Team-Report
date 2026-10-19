# Tickets that could NOT be filed — Linear free-tier limit reached

## What happened

Nine of the ten tickets this run tried to create were rejected by the Linear API:

```
USAGE_LIMIT_EXCEEDED — "You've exceeded the free issue limit for this
workspace. Please upgrade or contact sales@linear.app for a free trial."
metric: activeIssueCount
```

`VGC-305` (the P0 webhook-token rotation) was created just before the cap was
hit. Everything after it failed. The workspace currently holds **125 active
issues**.

**This is not a swarm failure and retrying will not help** — the board is
physically full. It also means GOAL B (compound the board with research
findings) is blocked by quota, not by effort, and will stay blocked every run
until capacity is freed.

## Two ways to unblock it

1. **Free capacity by closing stale tickets.** The reconciliation this run
   verified **9 tickets already satisfied on `main`** — VGC-289, 266, 262, 219,
   260, 267, 247, 256, 272 — each with file:line evidence (see
   `board-reconciliation-19-10-26.md`). Closing those nine frees nine slots,
   which is exactly enough for the backlog below. Merging the ten open PRs would
   let ~52 more In-Review tickets be closed.
2. Upgrade the Linear workspace.

The full ticket bodies are preserved below so nothing is lost. They can be
pasted in directly, or left for the next run to file once slots exist.

---

## 1. [a11y] The `dark:` Tailwind variant is never registered, so all 132 dark: utilities ignore the dark-mode toggle
**Priority: Urgent · Labels: Accessibility, auto-research, Bug**

`src/app/globals.css` declares `@custom-variant` for `creator` and `presenting`
— but **not for `dark`**. Dark mode is applied by flipping a `data-dark-mode`
attribute (`layout.tsx:97`).

With Tailwind v4 and no registered `dark` variant, every one of the **132
`dark:` utilities** in the codebase falls back to default
`prefers-color-scheme` behaviour — so they follow the **operating system**, not
the in-app toggle.

**Impact.** The toggle and the OS can disagree, and when they do contrast fails
in both directions: light classes on a dark surface compute to **2.39–3.85:1**,
dark classes on white to **1.44–2.77:1**. Both fail WCAG 1.4.3 (AA). A user on
a light OS who enables dark mode in the app gets a half-themed page.

**Fix.** One line: register the `dark` variant against `[data-dark-mode]`
alongside the two existing `@custom-variant` declarations.

**Why the swarm did not just do it.** The fix is one line; its blast radius is
132 utilities changing appearance at once, and there is no browser in the swarm
container to check the result. That wants a human with the page open. It also
**blocks** ticket 2 below, which should only be judged once this is correct.

---

## 2. [a11y] 9 of 19 type badges and every primary button fail 4.5:1 contrast
**Priority: High · Labels: Accessibility, auto-research**

Computed from token definitions, not estimated.

Type badges (`src/lib/utils/type-colors.ts:7-25`), white text at 9–11px:

| Type | Ratio | | Type | Ratio |
|---|---|---|---|---|
| Grass | 2.08 | | Fire | 2.69 |
| Bug | 2.19 | | Fairy | 2.69 |
| Normal | 2.48 | | Water | 3.10 |
| Rock | 2.58 | | Psychic | 3.15 |
| Flying | 2.67 | | | |

Switching those nine to `#1A1A2E` text yields **5.4–8.2:1** with brand hues
intact — the treatment `Steel` already uses.

Primary buttons: `bg-accent text-white` (74 occurrences, `Button.tsx:16`)
computes to **2.69:1** in dark mode, where `--accent` is `#FB7185`.

Wider than first scoped: `--success` 3.30, `--warning` 3.19, `--accent` 4.12 on
`--surface-alt` (VGC-297's territory).

Judge **after** ticket 1 — the dark-mode numbers depend on which theme actually
applies. This is a brand/design call, which is why the swarm filed it rather
than picking colours itself.

---

## 3. [Perf] Denormalise reaction counts so Explore's default `popular` sort can be indexed
**Priority: High · Labels: Performance, auto-research**

Surfaced while implementing VGC-302. `/api/explore`'s **default** sort is
`popular` (`route.ts:26-27`) — not `newest`, as VGC-302 assumed.

`popular` orders by `COALESCE(rc.like_count, 0)` from a
`LEFT JOIN (SELECT share_id, COUNT(*) FROM reactions GROUP BY share_id)`. The
planner must materialise that aggregate over the whole `reactions` table and
hash-join it before ordering, so **no index on `shares` alone can help** —
VGC-302's indexes deliberately claim nothing for it. The most-used Explore view
is therefore still the slowest, and it also pulls `s.data` (large JSONB) from
the heap for every candidate row.

**Fix.** Denormalise: a `shares.like_count` column maintained on reaction
insert/delete, then a partial index `(like_count DESC, created_at DESC) WHERE
is_public = TRUE AND deleted_at IS NULL`, mirroring VGC-302's two. A cached
counts table is the alternative. Check storage against the 512MB Neon tier
first — one integer per share is negligible, but confirm.

---

## 4. [Chore] One file per changelog release — the Updates page is the repo's biggest merge-conflict generator
**Priority: Medium · Labels: auto-research**

`src/app/changelog/data.ts` is modified by **all ten** open PRs, each
prepending an entry at the same position in the same array. It is by a wide
margin the most conflict-prone file in the repo — and the conflict is created
entirely by the nightly process, not by any feature.

Worse than conflicting: four of those PRs (#72/#74/#75/#76) **auto-merge it
cleanly and corrupt it** — duplicate `5.27`/`5.26` entries out of order, and a
second `5.28` on the public Updates page. A clean auto-merge is not safety here.

**Fix.** Split into one module per release (`changelog/entries/5.30.ts`) with an
index that imports and sorts them. Two runs then never touch the same lines, and
a new release is a new file. Until then this file needs manual inspection on
every merge regardless of what git reports.

---

## 5. [Security] /api/sprite has no rate limit and its cache key is defeatable
**Priority: Medium · Labels: Infrastructure, auto-research**

`/api/sprite` has **no rate limit**, and the inner URL's query string survives
into the cache key — so `?u=<sprite>.png?cb=1`, `?cb=2`, … each miss the
`immutable` edge cache and force a fresh origin fetch.

**Impact.** Cost amplification: unbounded egress through the endpoint, hammering
Showdown's CDN from your domain with your Vercel bandwidth paying for it. No
data is exposed — this is a billing and third-party-reputation risk.

**Fix.** Normalise the inner URL before using it as a cache key (strip the query
string), and apply the existing `apiGuard` rate limiter as other public routes do.

---

## 6. [SEO] CSP frame-ancestors 'none' blocks the /embed iframes the product advertises
**Priority: High · Labels: SEO, auto-research**

`next.config.ts:147` sets `frame-ancestors 'none'` **and**
`X-Frame-Options: DENY` on the `/(.*)` catch-all — i.e. every route, including
`/embed/[id]`.

But embedding is a promoted feature: `ShareModal` offers embed codes,
`/api/oembed` exists and serves discovery, and both the FAQ and
`public/llms.txt` tell users and AI crawlers that reports can be embedded
anywhere. The advertised embed path is structurally blocked by the site's own
headers — every embed attempt is refused by the browser.

**Fix.** Scope the frame-blocking headers to exclude `/embed/*` and let that
route send its own permissive `frame-ancestors`. Verify with a real
cross-origin iframe and re-check `/api/oembed`'s advertised URL end to end.
**Needs browser verification** — the swarm has no browser and no outbound HTTP.

---

## 7. [SEO] /tools/ev-to-sp metadata still says Regulation M-A, and the homepage emits schema for content it never renders
**Priority: Medium · Labels: SEO, auto-research**

1. **`src/app/tools/ev-to-sp/page.tsx` metadata still says "Regulation M-A"** —
   M-C has been live since 9 Sep. This is the one page tonight's research could
   confirm actually ranks, so the stale regulation costs real impressions on the
   product's strongest differentiator.
2. **Structured data describes absent content**: the homepage emits five
   `FAQPage` Q&As rendered nowhere, and both `/` and `/faq` emit `HowTo` steps
   with no visible equivalent. Google treats schema for absent content as a
   violation and may discount the markup or the page.

**Fix.** Update the converter's metadata to M-C, keyed to the active regulation
rather than a literal. Then either render the FAQ/HowTo content the schema
claims, or remove the markup. (VGC-298 covers the `/faq` half.)

---

## 8. [TS] Enable noImplicitReturns — 2 errors, the last free strict flag
**Priority: Medium · Labels: auto-research**

Measured this run against clean `main` (`534a59b`), one `tsc` run per flag:

| Flag | Errors |
|---|---:|
| `noImplicitReturns` | **2** |
| `exactOptionalPropertyTypes` | 74 |
| `noUncheckedIndexedAccess` | 392 |
| `noPropertyAccessFromIndexSignature` | 681 |

`noImplicitOverride`, `noFallthroughCasesInSwitch` and
`useUnknownInCatchVariables` are already on.

The two `TS7030`s are `NotificationBell.tsx:78` and `useShareUrl.ts:159`, both
conditional-cleanup `useEffect`s. **Neither is a bug**; the value is the forward
guarantee, which matters most around the SP/EV domain switches where a missing
return silently means `undefined`.

Also worth knowing: the tree has **zero** `any` (the one grep hit is the English
word in a docblock), zero `@ts-ignore`/`@ts-expect-error`, and **zero orphaned
non-test modules** — the import graph reaches 321/381 and all 60 unreached are
tests. `exactOptionalPropertyTypes` is stageable: 9 of its 74 errors are in
`src/lib`, and the `regulation?: string` cluster among them is a real SP/EV
domain question worth answering deliberately.

---

## 9. [Process] Make the nightly swarm's output mergeable: smaller PRs, and stop re-finding fixed bugs
**Priority: High · Labels: auto-research, Infrastructure**

VGC-265 already says this. Tonight produced three fresh, concrete proofs of its
cost:

1. **Two tickets were unimplementable** — VGC-293 and VGC-301 both build on code
   (`effective-typing.ts`, `statForm`) existing only on unmerged #81/#82. Their
   stated fixes are false against `main`.
2. **A private-data leak stayed open 11 weeks.** `/api/team-graphic` had no
   visibility check at all. **Four separate PRs each fixed it independently**
   (#72, #76, #79, #81) and none landed, so it was still live tonight.
3. **A critical RCE stayed live 8 days.** `next@16.3.0`'s `next/og` RCE was
   patched on #82 on 12 Oct; production was still on 16.3.0 tonight.

Meanwhile **9 Backlog/In-Review tickets were already fixed on `main`** and
nobody had closed them — and the board is now so full that Linear refuses new
issues, which is how this very file came to exist.

**Concrete changes worth making**

- **Merge order matters more than merge speed.**
  `pr-merge-order-19-10-26.md` has a costed plan: **#82 merges cleanly today and
  only today**; oldest-first instead turns that free merge into a 23-conflict job
  and costs +8 conflicts overall. Close #72 (superseded).
- **Cap the generated markdown.** PR #72 is 100 files, ~85 of them `.swarm/`
  notes; `.swarm/` already holds 8 copies of the SEO audit and 8 of the a11y
  audit. That review burden is itself a cause of the stall.
- **Reconcile the board before implementing.** A cheap board-vs-`main` pass
  (as run tonight) stops tickets being re-investigated from scratch each run.
- **Split `changelog/data.ts`** (ticket 4) — the mechanical blocker on every merge.
