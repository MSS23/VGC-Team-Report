# Tickets that could not be filed — 28 Sep 2026

**Why this file exists:** the Linear workspace has hit its free-plan issue limit.
Every `issueCreate` returns:

```
USAGE_LIMIT_EXCEEDED — "You've exceeded the free issue limit for this workspace.
Please upgrade or contact sales@linear.app for a free trial."
```

Commenting and status transitions still work; **creation does not**. With 107 open
issues the board cannot compound further until issues are closed/archived or the
workspace is upgraded — which makes draining the 32 In Review tickets urgent for a
second, independent reason (see `merge-plan-28-09-26.md`).

The 11 tickets below are ready to create verbatim once the limit is lifted. All
would go to **Backlog** with the **`auto-research`** label plus the labels listed.

Findings that already have a ticket were NOT duplicated — they were added as
comments instead: **VGC-213** (webhook root cause), **VGC-253** (creator identity,
3 exploits), **VGC-265** (the PR merge backlog).

---

## 1. [SEO] Reg M-C surfaces stay M-B-bound even after PR #78 — 6 M-C Megas have no page, Mega Salamence 404s

- **Priority:** High
- **State:** Backlog
- **Labels:** SEO, auto-research

## Source
`.swarm/r6-seo-28-09-26.md` (R6) + `.swarm/r1-competitors-community-28-09-26.md` (R1), swarm 28-09-26.

## Finding
Reg M-C went live **8 Sep 2026** (runs to 1 Dec). PR #78 commit `72e482b` makes M-C a first-class Champions regulation in the parser/validation layer — but it **deliberately** adds no M-C dex or Mega data, and never touches `mega-pokemon.ts`, `sitemap.ts` or either champions page. Its own commit message marks this with a `ponytail:`.

So even after #78 merges, every SEO and content surface stays M-B-bound:

1. `src/app/champions/page.tsx` — title, description, keywords and the ItemList JSON-LD are all M-B-only. Live indexed title is still "Reg M-B & M-A Mega Teams".
2. Six M-C Megas have no guide page: **Salamence** (deleted, currently 404s), Golisopod, Baxcalibur, and three new **Z Megas** (Absol-Z, Garchomp-Z, Lucario-Z). First-mover keyword gap.
3. The ItemList JSON-LD advertises 75 URLs while only 72 are built and sitemapped — 3 advertised pages are broken.

Competitors shipped M-C within days: Pikalytics has live `regmc` slugs, VGCPastes has 145+ M-C teams.

## Blocked on
Merge **PR #78** first — this is the data/SEO layer on top of its plumbing.

## Verify before coding
R1 could not confirm offline whether the 66 SP / 32-per-stat budget is unchanged in M-C. Check that against a primary source before touching `champions-legality.ts`. Do **not** invent dex data — an invented dex that flags legal picks as illegal is worse than #78's current false negative.

---

## 2. [Security] creator_profiles is keyed on an unbound display name — profile overwrite via Clerk rename, plus verified-badge hijack

- **Priority:** High
- **State:** Backlog
- **Labels:** Infrastructure, auto-research

## Source
`.swarm/c4-security-28-09-26.md` findings F2 and F3, swarm 28-09-26.

## Root cause
`creator_profiles.name` is the PRIMARY KEY with no owner column, and `creatorName` on a share payload is unbound free text (`api/share/route.ts:54` = `z.string().optional()`, no ownership check). **VGC-253** tracks the schema fix; this ticket tracks the two exploits still open on top of it.

A third exploit from the same root cause — account deletion wiping another creator's profile — **was fixed** in PR #80 (`f1ee4bd`), with a `ponytail:` noting the residual case a schema change is needed to close.

## F2 — profile overwrite (HIGH)
`src/app/api/user/profile/route.ts:71-95` upserts with `ON CONFLICT (name) DO UPDATE`. Change your Clerk display name to a target creator's name, save your profile, and you overwrite their bio, socials and avatar. No ownership check is possible today because there is no owner column.

## F3 — verified-badge hijack (MEDIUM)
`src/app/api/explore/route.ts:270,323` derives the verified badge from a bare `verified_creators` name match, so publishing under a verified creator's name inherits their badge. The same bare match also drives `notifyFollowers`, so it hijacks their followers' notifications.

## Recommended fix
Do **VGC-253** (add the owner column) first and key both paths on it. Point patches here will not hold while identity is a display-name string — that is what produced three separate exploits.

---

## 3. [Perf] jspdf drags in a duplicate html2canvas 1.4.1 + canvg + dompurify — 383 KB raw / 104 KB gz for one addImage call

- **Priority:** Medium
- **State:** Backlog
- **Labels:** Performance, auto-research

## Source
`.swarm/c3-perf-28-09-26.md` finding F1, swarm 28-09-26. Numbers measured from `.next/diagnostics/route-bundle-stats.json` + `gzip -9`, not estimated.

## Finding
`jspdf@4.2.1` optional dependencies emit **383,473 B raw / 104,545 B gz**:
- `html2canvas` **1.4.1** — 198,037 B, a second rasteriser sitting beside the `html2canvas-pro` the app actually uses
- `canvg` — 157,244 B
- `dompurify` — 28,192 B

The app only calls jsPDF's `addImage`. None of the three is reachable.

## Fix
`turbopack.resolveAlias` stubs in `next.config.ts`, ~10 lines.

## Expected result
~104 KB gz off the deploy. This is lazy-behind-lazy, so it is a deploy-size and cold-start win, **not** a Core Web Vitals win — worth setting expectations.

## Related (separate, bigger)
F2: one PDF export pulls 646,653 B raw / ~183 KB gz, of which jsPDF alone is 418,428 B / 128,979 B gz just to wrap a PNG. A hand-rolled single-page PDF writer or a server-side render would remove nearly all of it. `html2canvas-pro` was verified as a correct singleton — not duplicated.

**Zero conflict risk** — `next.config.ts` is untouched by all 7 open PRs.

---

## 4. [Perf] Clerk ships on all 22 routes (58 KB gz) but 8 need no auth — split with an (app) route group

- **Priority:** Medium
- **State:** Backlog
- **Labels:** Performance, auto-research

## Source
`.swarm/c3-perf-28-09-26.md` finding F3, swarm 28-09-26. Measured, not estimated.

## Finding
`@clerk` contributes **199,045 B raw / 57,988 B gz** to every one of the 22 routes. Eight need no authentication at all — including `/champions/[pokemon]`, which is **74 SSG pages** and the main organic-search entry point.

Shared floor across every route is 695 KB raw / 173 KB gz. Worst offenders: `/compare` 1068 KB, `/` 1015 KB, `/dashboard` 971 KB, `/champions/[pokemon]` 833 KB.

## Fix
Move authenticated routes under an `(app)` route group so `ClerkProvider` is not in the root layout. Measured effect on `/champions/[pokemon]`: **-24%**.

## CONFLICT RISK: yes
Touches `src/app/layout.tsx` and `PageNavbar`, both in the open-PR set. Do this **after** the 7 open PRs land (see `.swarm/merge-plan-28-09-26.md`), or it will conflict with several of them.

## Also noted
F5: cookieconsent JS + CSS loads on all 88 pages (~20 KB gz) including purely static ones.

---

## 5. [a11y] globals.css declares no @custom-variant dark, so 123 dark: classes misfire whenever the toggle disagrees with the OS

- **Priority:** High
- **State:** Backlog
- **Labels:** Accessibility, auto-research

## Source
`.swarm/r8-a11y-28-09-26.md` finding C1, swarm 28-09-26. All ratios computed from the real token values.

## Finding
The app themes via a `[data-dark-mode]` attribute, but `src/app/globals.css` never declares `@custom-variant dark`. Tailwind v4 therefore leaves `dark:` bound to the `prefers-color-scheme` media query, so **123 `dark:` classes** apply based on OS preference rather than the in-app toggle.

When the two disagree the result is unreadable, not merely wrong: `dark:text-amber-300` computes to **1.44:1** on white, against a 4.5:1 AA floor.

## Fix
One line in `globals.css` binding the `dark` variant to `[data-dark-mode]`.

## Why this is not a swarm commit
One line, but it changes appearance across 123 sites at once and needs a human eye in a browser to confirm nothing regresses. The swarm container has no dev server. Please eyeball it with the toggle and OS preference deliberately mismatched.

## CONFLICT RISK: yes — `globals.css` is in the open-PR set.

## Related theme-wide contrast failures in the same report
- C2: `bg-accent text-white` CTAs (including the skip link) fail in 7 of 9 light themes (2.77-4.23) and **all 8** dark accents (1.67-2.72)
- C3: `text-accent` body text = 4.46 on `--background` even in the default theme
- C4: `--danger` / `--success` / `--warning` have no dark overrides (danger 3.42-4.04 dark; success 3.30, warning 3.19 light)
- C5: `focus:outline-none focus:ring-accent/40` replaces the compliant base outline with a 1.93:1 ring across **60 sites** (1.4.11 AA)
- C7: `/champions` and the mega pages duplicate the type palette with all-white text — 13 of 18 fail, Electric at 1.49

The type-badge palette itself (9 of 18 failing) **was fixed** in PR #80 (`120f6ae`); C7 is a second copy of that palette that still needs the same treatment.

---

## 6. [a11y] Zero-conflict batch: editor modal has no focus trap, matchup reorder is drag-only, two h1->h3 jumps, 6 contrast sites

- **Priority:** Medium
- **State:** Backlog
- **Labels:** Accessibility, auto-research

## Source
`.swarm/r8-a11y-28-09-26.md` findings Z2-Z8, swarm 28-09-26. All in files **no open PR touches** — safe to do now, unlike the theme-wide items.

Not covered by VGC-259, VGC-270 or VGC-219.

## Z2/Z3 — `src/components/input/InlinePokemonEditor.tsx:128-134, 175-219` (~40 lines)
Modal has no `aria-modal`, no focus trap and no focus restore on close (**2.4.3 Level A**). Separately, `role="option"` wraps a `<button>` and the input is not a `combobox`, so the arrow-key highlight is never announced (**4.1.2 Level A**) — keyboard users get no feedback at all.

## Z4 — `src/components/report/MatchupSheet.tsx:86-99` (~20 lines)
Reordering is drag-only with no keyboard path (**2.1.1 Level A**). Needs move-up/move-down buttons or arrow-key handling.

## Z5 — `CommonModesSlide.tsx:181`, `TournamentMode.tsx:280,369` (6 lines)
h1 -> h3 with no h2 (**1.3.1 Level A**).

## Z6-Z8 — contrast, computed from real token values
- `AddOpponentInput.tsx:125` — 2.77:1
- `TournamentMode.tsx:45,46,54` — 3.76 / 3.68 / **1.80**
- `MatchupSheetRow.tsx:200,212,169` — 1.89 / **1.44** / 2.64

## Verified compliant (no action)
Alt text, icon-button labels, ev-to-sp form labels, table scope/caption, touch targets, skip link, reduced-motion, marketing-page heading order.

---

## 7. [Bug] Comment auto-removal hard-DELETEs at 3 flags — should soft-hide (needs a hidden_at column)

- **Priority:** Medium
- **State:** Backlog
- **Labels:** Bug, auto-research

## Source
Follow-up to the fix in PR #80 (`d018030`), swarm 28-09-26.

## Context
`FLAG_THRESHOLD` in `src/app/api/comments/flag/route.ts` was commented "Auto-hide after this many unique flags" while the code has always issued a hard `DELETE FROM comments`. PR #80 corrected the comment and closed the exploitable half — auto-removal now requires 3 distinct **signed-in** flaggers, because anonymous flags were keyed on IP and a /64 IPv6 allocation made three of them free.

## What is still wrong
Removal is still **irreversible**. Three signed-in accounts permanently destroy a comment with no moderation review and no way back. There is no audit trail of what was removed.

## Fix
1. Add `hidden_at TIMESTAMPTZ NULL` to `comments` in `src/lib/db.ts`.
2. Set it instead of deleting; filter hidden rows out of the read paths.
3. Give the report owner (and an admin) a way to see and restore hidden comments.

Deliberately not bundled into PR #80 — it needs a schema migration, and CLAUDE.md requires checking storage impact against the Neon 512 MB free tier first. `comments` rows are small, so the column itself is cheap; keeping the rows rather than deleting them is the part worth sizing.

---

## 8. [Bug] champions/meta SQL replicates extractSpecies in query text and inherits the backup-header bug just fixed in TS

- **Priority:** Medium
- **State:** Backlog
- **Labels:** Bug, auto-research

## Source
Noted while fixing `extract-species.ts` in PR #80 (`74f8ff5`), swarm 28-09-26.

## Finding
`src/app/api/champions/meta/route.ts:42` carries a comment saying it "replicates extractSpecies() logic" and reimplements species extraction **in SQL** using `WITH ORDINALITY` for block ordering.

PR #80 fixed a real bug in the TypeScript original: a Showdown backup header (`=== [format] Name ===`) not followed by a blank line caused the whole block to be skipped, silently dropping the team's first Pokemon. The SQL copy is very likely to have the same defect, and it is not covered by any test.

## Why it was not fixed in PR #80
Hand-editing untested query text on an inference about its behaviour is how you introduce a worse bug. This needs someone to run the query against real rows and confirm the behaviour first.

## Action
1. Run the `champions/meta` query against production-shaped data containing a backup-format paste with no blank line after the header.
2. If it drops the first species, fix it — and ideally stop duplicating the logic: three copies of species extraction existed before PR #80 removed one (the OG-image route). This SQL is the third.
3. Add a test pinning whichever behaviour is correct.

---

## 9. [Bug] Explore cursor pagination truncates to ms in WHERE but not ORDER BY — same-millisecond rows become unreachable

- **Priority:** Medium
- **State:** Backlog
- **Labels:** Bug, auto-research

## Source
`.swarm/c5-commit-review-28-09-26.md` finding 3 (commit `82f9210`), swarm 28-09-26.

## Finding
In `src/app/api/explore/route.ts:193,207,222` the keyset-pagination `WHERE` clause truncates the cursor timestamp to milliseconds while the `ORDER BY` does not. For rows sharing a millisecond, any row whose `id` sorts after the cursor `id` is skipped entirely — it can never appear on any page.

The `popular` and `views` sort tuples additionally have no `id` tiebreak, so their ordering is unstable across pages: a row can be shown twice or not at all.

## Impact
Silent omission from Explore. Most likely on bulk-imported or scripted inserts, where many rows genuinely share a millisecond.

## Fix
Make truncation consistent between `WHERE` and `ORDER BY`, and add `id` as a final tiebreak to every sort tuple.

## CONFLICT RISK: yes — `api/explore/route.ts` is in the open-PR set. Sequence this after the merge plan in `.swarm/merge-plan-28-09-26.md`.

---

## 10. [Bug] Restoring a draft rewrites saved-at, so the 30-day draft TTL renews itself and never evicts

- **Priority:** Medium
- **State:** Backlog
- **Labels:** Bug, auto-research

## Source
`.swarm/c5-commit-review-28-09-26.md` finding 4 (commit `70c4633`), swarm 28-09-26.

## Finding
`src/hooks/useTeamReport.ts:96` rewrites the `saved-at` timestamp on **restore**, not just on save. Any draft that is opened resets its own 30-day expiry, so the TTL never fires for a draft the user keeps revisiting and localStorage grows without bound.

## Fix
Only write `saved-at` on an actual save. Restore should read it and leave it alone.

## CONFLICT RISK: yes — `useTeamReport.ts` is changed by PR #74 (`claude/loving-sagan-853anq`), which also has 3 real-code conflicts of its own. Do this after that PR lands.

---

## 11. [Chore] /api/bot duplicates /api/discord (~453 lines dead) — needs one maintainer yes/no on ?action=weekly-email

- **Priority:** Low
- **State:** Backlog
- **Labels:** auto-research

## Source
`.swarm/c1-dead-code-28-09-26.md` finding 1, swarm 28-09-26.

## Finding
`src/app/api/bot/route.ts` (242 lines) implements the same `summary` / `popular` / `bugs` slash commands that `/api/discord` already implements at `:125`, `:158` and `:182`. `scripts/register-commands.json` registers the commands against **`/api/discord`**, not this route. There is no in-repo caller and it is not in `vercel.json` crons.

Deleting it cascades to `src/lib/email.ts:73` and `:321-529` — **~453 lines total**.

## Blocked on a decision, not on work
`/api/bot` exposes `?action=weekly-email`, which nothing in the repo calls. If an external scheduler, Zapier job or manual bookmark hits it, deleting this breaks a live workflow silently. **Please confirm nothing external calls it**, then this is a clean ~453-line deletion.

The swarm did not delete it for exactly this reason — a judgement call about external callers is not something a code scan can settle.

## Also from the same report (smaller, safe)
- 25 redundant `export` keywords across 21 files where nothing imports them (`csrf.ts:17`, `paste-edit.ts:59`, `normalize-report.ts:10`, `useWalkthrough.ts:16`, plus 21 internal-only types) — one-word edits, zero risk
- 3 orphan `.sql` migrations in `src/lib/db/migrations/` that nothing reads (`add-species` / `drop-species` is a closed pair)
- `/api/oembed` is 49 lines of unreachable code, but the right fix is to **activate** it: add a `json+oembed` discovery link in `s/[id]/page.tsx` (+4 lines)
- Biggest single win is 57 dead i18n keys x 7 locales (~399 lines), but all 7 files are conflict-touched and it must be one atomic commit

**No dead files and no unused npm dependencies remain** — the import graph reaches every `.ts`/`.tsx`.

---
