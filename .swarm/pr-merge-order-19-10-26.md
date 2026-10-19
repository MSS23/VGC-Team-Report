# Swarm PR backlog — merge order analysis (19-10-26)

Addresses **VGC-265 (P1)**. Ten draft PRs open (oldest 3 Aug 2026), 52 Linear tickets
stuck "In Review" behind them.

**Method.** All trial merges ran in a throwaway detached worktree off `origin/main`
(tip `534a59b`), every merge aborted afterwards. The main working tree was never
touched (a sibling agent is building what will become PR #83 on
`claude/loving-sagan-tv9kmf` — the pile is still growing). PR metadata via GitHub
REST (`/pulls/<n>`, `/files`, `/commits`); GraphQL is blocked here.

---

## 1. Per-PR inventory

Counts exclude `package-lock.json`. "code" = non-`.md`, non-`.swarm/` files.

| PR | Date | Branch (`claude/loving-sagan-…`) | Commits | code files | `.swarm/` files | code +/− | REST `mergeable_state` |
|----|------|------|---------|-----------|-----------------|----------|------------------------|
| #72 | 03-08 | `t7immy` | 28 | 108 | 23 | +7820 / −1405 | `dirty` |
| #74 | 17-08 | `853anq` | 13 | 52 | 12 | +3876 / −408 | `dirty` |
| #75 | 24-08 | `zs6xpl` | 16 | 54 | 23 | +2509 / −647 | `dirty` |
| #76 | 31-08 | `ib785e` | 10 | 20 | 14 | +710 / −72 | `dirty` |
| #77 | 07-09 | `12996k` | 6 | 11 | 16 | +543 / −62 | `dirty` |
| #78 | 14-09 | `8ryraw` | 11 | 45 | 18 | +1385 / −181 | `dirty` |
| #79 | 21-09 | `sp9n85` | 7 | 6 | 7 | +119 / −8 | `dirty` |
| #80 | 28-09 | `c7sclx` | 10 | 13 | 17 | +695 / −45 | `dirty` |
| #81 | 05-10 | `fxmby5` | 12 | 46 | 18 | +2266 / −374 | `dirty` |
| #82 | 12-10 | `7q3dvw` | 12 | 45 | 10 | +1877 / −280 | **`clean`** |

**Review-burden ratio.** The generated-markdown load is real but it is *not* the
dominant cost in the big PRs. In #77 (16 notes vs 11 code files) and #80 (17 vs 13)
the notes outnumber the code; in #72 (23 vs 108) and #82 (10 vs 45) the code
dominates. `.swarm/` files are append-only run logs — safe to resolve by taking both
sides, or to drop entirely.

**Linear tickets claimed** (from `VGC-NNN:` commit prefixes):

| PR | Tickets |
|----|---------|
| #72 | VGC-181, 224, 245, 251 |
| #74 | VGC-225, 232, 257, 268, 269, 270, 271, 273 |
| #75 | VGC-257, 275 |
| #76 | VGC-270 |
| #77 | *(none — conventional-commit messages only)* |
| #78 | VGC-41, 266 |
| #79 | VGC-246, 247, 266 |
| #80 | VGC-274 (+ an unprefixed `VGC-WEBHOOK` commit) |
| #81 | *(none — conventional-commit messages only)* |
| #82 | VGC-288, 291, 292, 295, 296, 297, 298, 299 |

Note VGC-257 is claimed by both #74 and #75; VGC-266 by both #78 and #79; VGC-270 by
both #74 and #76. #77 and #81 carry no ticket prefixes at all, so the "52 In Review"
figure cannot be reconciled to these PRs from commit messages alone.

---

## 2. Does it still conflict with `main` today?

Trial-merged each branch into `origin/main`. Actual conflicted file lists:

| PR | Conflicts | Files |
|----|-----------|-------|
| **#82** | **0** | — merges cleanly; merge-base *is* main's tip (`behind=0`) |
| #79 | 1 | `src/app/changelog/data.ts` |
| #80 | 1 | `src/app/changelog/data.ts` |
| #76 | 2 | `src/app/page.tsx`, `src/components/report/PokemonDetailSlide.tsx` |
| #74 | 6 | `src/app/api/pokepaste/route.ts`, `src/app/champions/[pokemon]/page.tsx`, `src/components/explore/SpotlightCard.tsx`, `src/hooks/useTeamReport.ts`, `src/lib/utils/pokepaste.ts`, `src/lib/validation/champions-legality.ts` |
| #75 | 6 | `src/app/page.tsx`, `src/app/s/[id]/page.tsx`, `src/components/explore/SpotlightCard.tsx`, `src/components/input/PasteInput.tsx`, `src/components/report/PokemonDetailSlide.tsx`, `src/hooks/__tests__/useTeamReport.test.ts` |
| #77 | 7 | `changelog/data.ts`, `src/app/tools/ev-to-sp/page.tsx`, `SpeedTierChart.tsx`, `TeamOverview.tsx`, `src/hooks/__tests__/useTeamReport.test.ts`, `src/lib/data/tags.ts`, `src/lib/validation/champions-legality.ts` |
| #81 | 9 | `public/llms.txt`, `changelog/data.ts`, `src/app/page.tsx`, `src/app/sitemap.ts`, `PokemonDetailSlide.tsx`, `TeamReport.tsx`, `src/components/seo/JsonLd.tsx`, `useTeamReport.test.ts`, `stat-calculator.test.ts` |
| #78 | 13 | `public/llms.txt`, `public/llms-full.txt`, `changelog/data.ts`, `src/app/page.tsx`, `PasteInput.tsx`, `PokemonDetailSlide.tsx`, `SpeedTierChart.tsx`, `TeamOverview.tsx`, `detect-regulation.ts` (+test), `stat-calculator.test.ts`, `tags.ts`, `champions-legality.ts` |
| #72 | 26 | incl. `package.json`, `package-lock.json`, `src/proxy.ts`, `src/lib/security/cors.ts` (+test), `stat-calculator.ts` (+test), `showdown-parser.ts`, `src/app/layout.tsx`, `sitemap.ts`, `faq/page.tsx`, `public/robots.txt`, `llms.txt`, `llms-full.txt`, `ClarityProvider.tsx`, `ConsentGate.tsx`, `CookieBanner.tsx`, `api/share/route.ts`, `api/creator/[name]/route.ts`, … |

Divergence: #82 is `12 ahead / 0 behind`. Everything else is 18–41 commits behind
main; #72 is `28 ahead / 41 behind`.

---

## 3. The `changelog/data.ts` landmark — the brief's premise is wrong, and the
## non-conflicting case is the dangerous one

All ten PRs touch `src/app/changelog/data.ts`, but **only #77–#82 conflict there.
#72, #74, #75 and #76 auto-merge it silently — and the silent result is corrupt.**

Main currently has entries 5.28 / 5.27 / 5.26 / 5.25 / …. #72 prepends its own 5.27
and 5.26. Git resolves this without a conflict, and the merged file contains:

```
version: "5.28"   (main)
version: "5.27"   (main — "Sounder Saves, Honest Drafts & a Security Sweep")
version: "5.26"   (main — "Corrected Champions Stat Points, Reg M-B Megas …")
version: "5.27"   (#72  — "Modes That Actually Save, Consent Before Tracking …")  ← duplicate
version: "5.26"   (#72  — "Privacy Fix, Cleaner Imports & Honest SP Spreads")     ← duplicate
version: "5.25"   …
```

Two duplicated version numbers, out of order, shipped to the user-facing Updates
page. #76 likewise adds a v5.28 ("swarm: add August 2026 changelog entry (v5.28)")
that collides with main's existing 5.28.

So the guidance needs inverting:

- Where `changelog/data.ts` **does** conflict (#77–#82): mechanical and low-risk, as
  expected — keep all entries, order by date, renumber. **Not a reason to delay.**
- Where it **does not** conflict (#72, #74, #75, #76): **check the file by hand
  anyway.** A clean merge here means duplicate version numbers, not success.

Also note #79's and #76's lead commits are literally `fix: changelog no longer shows
users an internal "please merge!" note` / `fix: remove swarm-internal plea from the
public changelog` — the swarm has already shipped internal text to the public
changelog once.

---

## 4. Pairwise code-file overlap

Shared code files, excluding `.swarm/`, `*.md`, `package-lock.json` **and
`changelog/data.ts`** (which all ten share):

```
      #72  #74  #75  #76  #77  #78  #79  #80  #81  #82
#72     .   19   22   12    3   16    3    1   20   19
#74    19    .    9    4    2    3    1    0    5    7
#75    22    9    .   12    3   16    3    2   17    9
#76    12    4   12    .    1    5    1    4    8    4
#77     3    2    3    1    .    4    0    1    4    4
#78    16    3   16    5    4    .    2    1   20   15
#79     3    1    3    1    0    2    .    0    1    3
#80     1    0    2    4    1    1    0    .    3    3
#81    20    5   17    8    4   20    1    3    .   16
#82    19    7    9    4    4   15    3    3   16    .
```

**Hot cluster: #72 / #75 / #78 / #81 / #82** (15–22 shared files each). The shared
hot files are `stat-calculator.ts` (+tests), `champions-legality.ts`,
`PokemonDetailSlide.tsx`, `SpeedTierChart.tsx`, `TeamOverview.tsx`, `PasteInput.tsx`,
`src/app/page.tsx`, `api/team-graphic/route.tsx`, `public/llms.txt` /
`llms-full.txt`, `useTeamReport.test.ts`.

**Genuinely same-hunk vs merely same-file.** Same-file-only (resolvable by taking
both sides): the `.swarm/` logs, `public/llms*.txt` (append-structured), and
`changelog/data.ts`. Genuinely same-hunk, i.e. competing rewrites of the same lines:

- `api/team-graphic/route.tsx` — **four** PRs rewrite the same visibility gate
  (#72, #76, #79, #81).
- `stat-calculator.ts` + `champions-legality.ts` — #72, #78, #81, #82 all rewrite the
  SP conversion/validation path.
- `package.json` / `package-lock.json` — #72, #79, #82 each bump Next.js to a
  different patch for the same advisory.

**Isolated: #79 (max overlap 3), #80 (max 4), #77 (max 4).** These are near-free to
land and are the natural front of the queue.

---

## 5. Already-landed detection — the VGC-265 cost, quantified

`git cherry origin/main origin/<branch>` reports **0 patch-equivalent commits for all
ten branches**, and no branch has a code file byte-identical to main. Patch-id
equivalence is therefore useless here: the work was **re-implemented** on main, not
cherry-picked. Checking semantically instead:

**#72 is substantially superseded.** Main independently shipped, as 5.26/5.27:

| #72 claims | Already on `main` |
|---|---|
| Champions SP correctness (4-EV filler, proportional trim) | yes — `stat-calculator.ts` has `CHAMPIONS_TOTAL_SP = 66`, `CHAMPIONS_MAX_SP_PER_STAT = 32`, the corrected `convertToChampionsSp` with the exact `252 HP / 4 Def → 32 HP / 1 Def` fix documented at lines 214–249 |
| Clarity consent gating | yes — `src/lib/consent.ts` exists; `ClarityProvider.tsx` imports `hasAnalyticsConsent` / `onConsentChange` and defers init |
| Reg M-B Mega guide pages | yes — main 5.26 ships all 16 M-B Megas |
| FAQ Stat-Points correction | yes — main's FAQ reads "66 total SP to distribute across the six stats" |
| CORS / header-forgery hardening | yes — `src/lib/security/cors.ts` + `cors.test.ts` + `no-raw-forwarded-for.test.ts` |
| Next.js security bump | yes — main is on `next ^16.3.0` |
| EV→SP converter tool | yes — `src/app/tools/ev-to-sp/` |
| Indianapolis placeholder removal | yes — `src/data/indy-top-cut.ts` reworked |

Only unique residue in #72: the **per-language move-names split**
(`src/lib/data/move-names/{es,fr,it,ja,ko,zh}.ts` + `index.ts`) for lazy i18n
loading — main still has the monolithic `src/lib/data/move-names.ts`. Main achieved
its "260 KB lighter homepage" by a different route.

**#77 is mostly superseded.** Its headline commit is `feat: recognise Pokemon
Champions Reg M-C as a Champions format`, but main already has M-C throughout:
`detect-regulation.ts` line 59 `const CHAMPIONS_REGS = ["Reg M-A", "Reg M-B", "Reg
M-C"]`, `champions-legality.ts` line 140, `tags.ts` line 9. Residual diff across its
five real files is only +55/−26 — refinements plus a credential-scan test and a
draft-persistence flake fix.

**#78's Champions work is largely superseded** — its residual against main across
`detect-regulation.ts`, `stat-calculator.ts`, `champions-legality.ts`, `tags.ts` is
150 insertions / 25 deletions, against main's already-corrected implementations.

**#79's Next.js patch (VGC-247) is superseded by #82**, which bumps for the same
advisory; after #82 lands, #79 conflicts on `package.json` / `package-lock.json` /
`sp-docs-drift.test.ts` purely as duplicate work.

### Still-live security hole — do not close this one

**`src/app/api/team-graphic/route.tsx` on `main` has no visibility check at all.**
The only 404 on main is the id-validation guard at line 98; there is no `is_public` /
`is_unlisted` read. Any 8-character share id still renders a **private** report as a
PNG (team, items, event, placement, creator name). Four PRs fix it independently:

- **#79** (VGC-246) — minimal gate: `SELECT data, is_public, is_unlisted … ` then
  404 unless `isPublic || isUnlisted`.
- **#76** — gate plus redaction.
- **#81** — the superset: also selects `owner_id`, applies
  `normalizePrivateFields(data.privateFields)` so creator-hidden fields (item, EVs,
  IVs, nature) are stripped, and 404s for outsiders so the endpoint never confirms
  the id exists.
- #72 — its own variant of the same gate.

This has been sitting unmerged since **3 Aug**. It is the single strongest argument
for draining this queue now, and it is a candidate for cherry-picking #81's
`fix: team graphic no longer renders private reports…` commit as a standalone hotfix
ahead of any merge work.

---

## 6. Order simulation

Four orders simulated by sequential merge. Conflicts counted on code files only
(`.swarm/` and `*.md` excluded). **Resolution policy in the simulation was crude —
conflicts were resolved by taking the branch side — so counts after step 1 are
indicative upper bounds, not a real review.** #72 excluded (recommended for closure).

| Order | Total | Per step |
|---|---|---|
| **A** isolated-first: 82,79,80,77,76,74,75,78,81 | **81** | 0, 5, 2, 7, 6, 8, 12, 21, 20 |
| B reverse-chrono: 82,81,80,79,78,77,76,75,74 | 81 | 0, 16, 2, 6, 18, 8, 6, 13, 12 |
| **C** small-first: 82,79,80,76,77,74,75,81,78 | **80** | 0, 5, 2, 6, 7, 8, 12, 19, 21 |
| D oldest-first: 74,75,76,77,78,79,80,81,82 | 88 | 6, 9, 4, 6, 13, 4, 3, 20, 23 |

Totals are close, but **the distribution is what matters**. C and A let the human bank
five merges for ~20 conflicts before touching anything hard. **Order D — the
chronological instinct, and the one a human would default to — is the worst**: it is
+8 conflicts overall *and* it destroys #82's free merge, turning the most valuable PR
in the set into a 23-conflict job. Do not merge oldest-first.

Order C is adopted below. By the time #81 and #78 are reached, much of their content
is either already on main or landed by an earlier PR, so their conflicts should
resolve largely as "already have this" rather than as genuine three-way reconciliation
— cheaper in practice than the raw counts suggest.

---

## Recommended merge order

Review effort is code files only. **Mark each PR ready (undraft) only when its turn
comes** — leaving the rest in draft keeps CI spend down. Per CLAUDE.md, merging to
`main` only triggers a Vercel **preview**; production still needs the Promote step.

**0. (Optional, strongly advised first) Cherry-pick the `team-graphic` visibility fix
from #81 as a standalone hotfix.** ~1 file + test. Closes a live private-data leak
that has been open since 3 Aug and that four PRs are queued to fix. Doing it first
also removes the hottest same-hunk collision in the set from steps 2, 4 and 8.

**1. #82 — MERGE FIRST. `clean`, zero conflicts, today only.**
Why here: the only PR that merges with no conflicts (`12 ahead / 0 behind` — its
merge-base is main's tip). It also carries the most valuable payload (Next.js
critical RCEs, GDPR delete gap VGC-288, Champions SP consistency, 8 tickets).
Conflict exposure: **none now**; any other merge first costs it ~23 conflicts.
Verdict: **merge**. Review effort: moderate — 45 code files, +1877/−280, but it is
the newest and most reviewed. ⚠️ This free merge is perishable — it expires the
moment anything else lands.

**2. #79 — MERGE. Smallest PR in the set and it carries the security fix.**
Why here: 6 code files, +119/−8, maximum overlap with any other PR is 3 files. One
conflict today (`changelog/data.ts`, mechanical). After #82 it also conflicts on
`package.json` / `package-lock.json` / `sp-docs-drift.test.ts` — **take main's side
on all three**, as #82 already bumped Next.js for the same advisory (VGC-247 is
redundant post-#82). Keep only the `api/team-graphic` gate (VGC-246) and the
`llms-full.txt` SP-definition fix. Verdict: **merge** (effectively a partial — drop
the dependency bump). Review effort: trivial, ~30 min.

**3. #80 — MERGE. Isolated, and nothing else fixes its bugs.**
Why here: 13 code files, +695/−45, overlap ≤4 with anything. One conflict today
(`changelog/data.ts`); 2 in sequence (adds `SpeedTierChart.tsx`). Unique content not
found elsewhere: account deletion destroying another creator's profile, anonymous
comment hard-delete via IPv6 rotation, backup-format paste dropping its first Pokémon,
the Linear webhook 200-ack, and a `min-h-11 text-xs` class-gluing bug. Verdict:
**merge**. Review effort: low, ~1 h — but two of these are real cross-tenant security
bugs, so review them properly.

**4. #76 — MERGE. Small, and the cheapest of the overlapping group.**
Why here: 20 code files, +710/−72. Two conflicts today (`src/app/page.tsx`,
`PokemonDetailSlide.tsx`), ~6 in sequence. Its `team-graphic` hunk will be redundant
if step 0 or #79 landed — take the already-merged side. ⚠️ Its `changelog/data.ts`
change **auto-merges without conflict** and adds a second **v5.28**; fix the version
numbering by hand. Verdict: **merge**. Review effort: low, ~1 h (WCAG AA fixes,
paste-header handling, VGC-270 h1).

**5. #77 — SPLIT, or merge as a thin slice.**
Why here: 11 code files but its headline feature (Reg M-C recognition) is **already on
main** — residual is only +55/−26 across five files. 7 conflicts today, which is a
poor ratio for ~55 lines of real change. Recommend salvaging just the
credential-scan test (`test: fail the build if a real credential reaches the tracked
tree`) and the draft-persistence flake fix, then closing the rest as superseded. Note
it carries **16 `.swarm/` notes against 11 code files** — mostly generated noise.
Verdict: **split** (salvage 2 commits, close remainder). Review effort: low, ~45 min.

**6. #74 — MERGE. Last of the mid-size PRs before the hot cluster.**
Why here: 52 code files, +3876/−408, 6 conflicts today and ~8 in sequence. Overlaps
#72 heavily (19 files) but #72 is being closed, which removes that cost entirely.
Carries the most tickets of the older PRs (8) plus CI infrastructure
(`lint-ratchet.mjs`, `check-bundle-size.mjs`, bundle budgets). Verdict: **merge**.
Review effort: moderate, ~2–3 h.

**7. #75 — MERGE, with scrutiny.**
Why here: 54 code files, +2509/−647, 6 conflicts today but **12 in sequence** — it
sits inside the hot cluster (22 shared files with #72, 17 with #81, 16 with #78).
Deliberately placed after the cheap PRs so its collisions in `SpotlightCard.tsx`,
`PasteInput.tsx`, `PokemonDetailSlide.tsx`, `s/[id]/page.tsx` and
`team-graphic/route.tsx` resolve once against an already-updated main. ⚠️ Its
`changelog/data.ts` also auto-merges silently — check it by hand. Verdict: **merge**.
Review effort: high, ~3–4 h.

**8. #81 — MERGE LAST-BUT-ONE. Highest conflict exposure, but real unique content.**
Why here: 46 code files, +2266/−374. 9 conflicts today, ~19 in sequence — it shares
20 files with #78 and 20 with the closed #72. Keep it despite the cost: it has the
**best** `team-graphic` implementation (owner-only visibility + `normalizePrivateFields`
redaction + non-confirming 404), plus owner-only visibility on fork lineage, Mega type
charts, keyboard-accessible column filters, and share-payload validation. If step 0
was done, its lead commit is already in — skip that hunk. Verdict: **merge**. Review
effort: high, ~4 h.

**9. #78 — MERGE LAST, as a reduced slice.**
Why here: 45 code files but the most superseded of the hot cluster — its Reg M-C and
SP work reduces to +150/−25 against main's already-corrected
`detect-regulation.ts` / `stat-calculator.ts` / `champions-legality.ts` / `tags.ts`.
13 conflicts today, ~21 in sequence (20 shared files with #81). Going last means its
Champions hunks are resolved almost entirely in favour of main/#82/#81. Salvage the
genuinely unique parts (explore pagination, a11y work, VGC-41). Verdict: **merge as a
reduced slice** — or close and re-file the residue as a fresh ticket if the conflict
load is not worth +150 lines. Review effort: high as a full merge (~4 h), low as a
slice (~1 h).

**— #72 — CLOSE AS SUPERSEDED. The cheapest win in the whole exercise.**
108 code files, +7820/−1405, 28 commits, 26 conflicts, 41 commits behind main, open
since 3 Aug. Section 5 shows main independently re-shipped essentially all of it
(SP maths, consent gating, M-B Megas, FAQ SP text, CORS hardening, Next bump,
ev-to-sp tool, Indy placeholder). Merging it would be the single largest review in
the set for almost no new value, and its silent `changelog/data.ts` merge actively
corrupts the Updates page with duplicate 5.26/5.27 entries. **Close it.** Before
closing, re-file one item: the per-language `move-names/{es,fr,it,ja,ko,zh}.ts` split
for lazy i18n loading is the only unique content left and is not on main. Its
`team-graphic` gate is covered better by #81.

### Summary

Close **#72** outright. Reduce **#77** and **#78** to slices. Merge the remaining
seven in the order **82 → 79 → 80 → 76 → (77 slice) → 74 → 75 → 81 → (78 slice)**.
Merge #82 **today, before anything else** — it is the only free merge available and
it stops being free the moment another PR lands.

### Caveats

- Conflict counts for steps 2+ come from a simulation whose conflicts were resolved
  crudely (branch side taken). Step 1 (#82 = 0) and the "today vs main" column in
  §2 are exact; the sequenced numbers are indicative upper bounds.
- No build, typecheck or test suite was run against any trial merge, so nothing here
  certifies that a merged state is green. Per CLAUDE.md each merge still needs the
  cold `npm run typecheck`, vitest and `next build` gate.
- Nothing in this analysis was pushed, merged, commented on, or marked ready; the
  trial-merge worktree has been removed.
