# Tickets that could NOT be filed — Linear free-plan limit reached (run 17-08-26)

## What happened

Ticket filing stopped after **VGC-275**. Every subsequent `issueCreate` returns:

```
"message": "usage limit exceeded"
"code": "USAGE_LIMIT_EXCEEDED"
"userPresentableMessage": "You've exceeded the free issue limit for this workspace.
                           Please upgrade or contact sales@linear.app for a free trial."
"meta": { "usageMetric": "activeIssueCount" }
```

**The board is full.** A team query returns the API page cap of 250 issues:

| State type | Count |
|---|---|
| completed | **143** |
| backlog | 58 |
| started | 30 |
| unstarted | 13 |
| canceled | 6 |

**143 of the 250 are already completed and are still consuming the quota.** Linear counts
non-archived issues, so closing an issue does not free a slot — only archiving does.

### Human action — pick one

1. **Archive the completed issues** (Linear → team → filter `Status: Done` → select all → Archive).
   That alone would free ~143 slots and is almost certainly the right move.
2. Upgrade the workspace, or start the free trial Linear offers in that error.

Until then **no automated ticket filing can succeed**, and Goal B of the nightly routine is
blocked at the source. This also means the 10 tickets below — several of them P1 security
and SEO defects — exist nowhere on the board.

---

## Filed successfully before the limit hit

- **VGC-275** (P1) — [SEO] `/s/[id]` serves a client redirect, not the report — ~5,000 sitemapped share URLs are thin content

---

## NOT FILED — paste these in once capacity exists

Ordered by priority. Each is self-contained and ready to paste as a Linear description.

---

### 1. P1 — `[SEO] llms-full.txt still teaches AI crawlers "1 SP = 1 EV" — VGC-266 fixed only two of the three files`
Labels: `auto-research`, `SEO`

**Source:** run 17-08-26, R6 SEO audit (`.swarm/r6-seo-17-08-26.md`).

**VGC-266 is only half-fixed.** It corrected `public/llms.txt` and the FAQ. But
`public/llms-full.txt:87-93` still says "Standard Points" (it is **Stat Points**),
"1 SP = 1 EV" (really **4 EVs for the first SP, 8 thereafter**), and a 508-EV figure
(really **66 SP total / 32 per stat**).

**Why the guard missed it:** VGC-266 shipped a drift test to keep these docs locked to the
calculator — but that test reads `llms.txt` and the FAQ, the exact two files that were fixed.
It never opens `llms-full.txt`.

`llms-full.txt` is served to allowlisted AI crawlers, so we are actively mis-teaching the exact
query the `/tools/ev-to-sp` page (VGC-262) targets.

**Action:** fix `llms-full.txt:87-93`, and extend the drift guard to enumerate every file that
documents SP rather than listing two by hand. That is the real bug.

---

### 2. P1 — `[Security] Creator-profile takeover via Clerk display-name collision`
Labels: `auto-research`, `Infrastructure`

**Source:** run 17-08-26, C4 finding **S-1**. **STILL PRESENT** — unfixed since the 10-08-26 run (was F2).

`src/app/api/user/profile/route.ts:71-95` upserts `creator_profiles` keyed on the Clerk
**display name**, with no ownership column. Any authenticated user who sets their display name
to match an existing creator's can **overwrite that creator's public profile**.

Same root cause as VGC-253, which is filed as a schema/INFRA note. This records the
**security** consequence, which is more severe than the schema framing implies: it is an
authorization defect, not a data-modelling wart.

**Action:** add a `user_id` ownership column; key the upsert on it; reject writes where the
authenticated user does not own the row.

**Two consecutive security audits have flagged this. It is the highest-severity open finding in the codebase.**

---

### 3. P1 — `[Security] Unauthenticated creatorName enables follower-notification spoofing`
Labels: `auto-research`, `Infrastructure`

**Source:** run 17-08-26, C4 finding **S-2**. **STILL PRESENT** since 10-08-26 (was F4).

`src/app/api/share/route.ts:531` accepts a client-supplied `creatorName` and never verifies it
against the authenticated user. That value drives **follower notifications** and **creator-page
attribution**, so an attacker can send notifications to another creator's followers appearing to
come from that creator, and inject attributed content onto a creator page they do not own.

**Action:** derive `creatorName` server-side from the session. Never accept it from the body.

---

### 4. P1 — `[Process] Board status is unreliable — 3 tickets In Review with no shipped code, 10 of last 12 swarm PRs closed unmerged`
Labels: `auto-research`

**Source:** run 17-08-26 board reconciliation (`.swarm/board-reconciliation-17-08-26.md`). Extends VGC-265 with the per-ticket trace.

**16 In Review tickets are already live on `main`** and only need moving to Done:
`VGC-64` `VGC-219` `VGC-243` `VGC-254` `VGC-256` `VGC-257` `VGC-258` `VGC-259` `VGC-260`
`VGC-261` `VGC-262` `VGC-264` `VGC-266` `VGC-267` `VGC-272` `VGC-274`

**Why prior runs missed it:** PR #73 was **squash-merged**, so its eight tickets are invisible to
`git log | grep VGC-`. Content checks (e.g. `src/app/tools/ev-to-sp/` exists on main) prove they
shipped. Prior runs concluded "nothing gets merged" and re-fixed already-fixed defects.

**Three genuinely wrong statuses:**
- **VGC-242** — implemented as `886119a`, but only on `swarm-nightly-2026-06-22`/`-06-29`, whose
  PRs (#65, #66) were **closed unmerged**. Orphaned; nothing shipped.
- **VGC-246** — "Enforce true private reports" — **no commit anywhere**. A *privacy* ticket parked
  in a state implying it is done.
- **VGC-247** — "Update PostHog SDKs" — **no commit anywhere**.

**Systemic cause:** of the last 12 swarm PRs exactly one (#73) merged, #72 is open since 3 Aug,
and the other ten were closed unmerged — discarding real fixes with nothing on the board recording it.

**Action:** move the 16 to Done; move VGC-242/246/247 to Todo; adopt one long-lived swarm branch
merged weekly instead of a nightly orphan; and when a swarm PR is closed unmerged, move its tickets
back to Todo in the same action.

---

### 5. P2 — `[Security] apiGuard body-size cap trusts the client's content-length header`
Labels: `auto-research`, `Infrastructure`

**Source:** run 17-08-26, C4 finding **S-5**. **NEW.**

`apiGuard`'s body-size cap reads the client-supplied `content-length`. A request that **omits** or
understates the header bypasses the cap entirely — nothing measures the bytes actually read.

**Action:** enforce the cap while reading, via a counting/streaming reader that aborts on overflow.
`/api/sprite` and `/api/pokepaste` now do exactly this after run 17-08-26 (VGC-232, VGC-225) —
use them as the in-repo reference.

---

### 6. P2 — `[Security] /embed/[id] is dead under frame-ancestors 'none' while /api/oembed advertises an iframe`
Labels: `auto-research`, `Infrastructure`

**Source:** run 17-08-26, C4 finding **S-6**. **NEW.**

`/embed/[id]` cannot be embedded anywhere — global CSP `frame-ancestors 'none'` plus
`X-Frame-Options: DENY` — yet `/api/oembed` advertises an iframe embed pointing at it.

**Filed as security, not a bug, deliberately:** the intuitive fix (relaxing `frame-ancestors`
globally) would make **the whole app clickjackable**. Flagged so nobody reaches for it.

**Action:** either drop the oEmbed iframe advertisement, or scope a route-specific CSP with an
explicit `frame-ancestors` allowlist, leaving the global `'none'` intact.

---

### 7. P2 — `[a11y] Five High WCAG findings with measured ratios`
Labels: `auto-research`, `Accessibility`

**Source:** run 17-08-26, R8 (`.swarm/r8-a11y-17-08-26.md`). The five items named but never ticketed in VGC-270's description, now pinned to file:line with measured ratios.

1. **Mobile tab bar** — `PokemonDetailSlide.tsx:927`, `:929-941`, `:945-950`: approx **30px** targets
   (2.5.5 wants 44x44) and no `role="tablist"`/`role="tab"`/`aria-selected`.
2. **Generation accent colours** fail 1.4.3 on white: measured **2.77–4.23** vs 4.5; **gen5 worst**.
3. **Default gen9 chip** `TeamOverview.tsx:442` = **4.28** (needs 4.5); focus rings **2.43–3.30**
   vs 1.4.11's 3.0 — some pass, some do not.
4. **Tertiary-text alpha ladder**, 9 sites: `/70` = **3.21**, `/50` = **2.19**, `/25` = **1.43**.
5. **Interactive nested in interactive** — `<button>` inside `<a>` at `ReportCard.tsx:163` and
   `PasteInput.tsx:289`. Invalid HTML; undefined keyboard/AT behaviour.

Clean: no positive `tabindex`, no `onClick` on non-interactive elements, all `<img>` have `alt`.

**Note:** items 2–4 are all **theme-token** problems — likely one coordinated palette change, not nine edits.

---

### 8. P2 — `[Perf] POKEMON_DATA (39.2 kB gz) and a 39.5 kB gz polyfill chunk are eager on every route`
Labels: `auto-research`, `Performance`

**Source:** run 17-08-26, C3 (`.swarm/c3-perf-17-08-26.md`). Both **NEW** and unticketed.

- **`POKEMON_DATA` = 39.2 kB gz, eager** — now **larger than dex-subset** (36.3 kB gz), which had
  two tickets of its own (VGC-257, VGC-271).
- **A 39.5 kB gz polyfill chunk ships on all 89 pages**, including `/terms` and `/privacy`.
- `2reak9ew8mz9t.js` (127.3 kB raw, positional dex-subset) is in `build-manifest` `rootMainFiles`,
  i.e. eager on **every** route.

~79 kB gz on every route — comparable to the two wins that got dedicated tickets.

**Action:** narrow the polyfill chunk via browserslist targets; assess whether `POKEMON_DATA` can
take the same server/client split VGC-271 applied to the dex fallback. Verify with
`npm run check:bundle`, which now has committed baselines.

---

### 9. P3 — `[Tooling] Wire npm run check:bundle into CI as its own job (VGC-269 follow-up)`
Labels: `auto-research`, `Performance`

VGC-269 shipped the script, baselines and `npm run check:bundle`, but **it is not wired into CI**.
Deliberately not added to the existing `ci` job, which intentionally skips `next build`. Confirmed
`next build` needs **no env vars**, so this job needs no secrets.

```yaml
  bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm }
      - run: npm ci
      - run: npm run build
      - run: npm run check:bundle    # add ` -- --warn` to phase in non-blocking
```

VGC-256 (zod) and VGC-257 (dex-subset) both shipped unnoticed. This closes that gap permanently.

---

### 10. P3 — `[Chore] Three stray "ponytail:" authoring markers in shipped code`
Labels: `auto-research`

**Source:** run 17-08-26, C5 review and C4 finding S-12. **Two are NEW** since 10-08, so this is growing.

- `.github/workflows/ci.yml:22` — **already removed** by this run's VGC-273 commit `5c72239`
- `src/lib/data/type-chart.ts:189` (NEW, from `80d232a`)
- `src/app/api/webhooks/linear/route.ts:66` (NEW, from `a099f97`, inside a security comment)

**Action:** remove the two remaining. Consider a cheap CI grep — it has now appeared in three commits.

---

## Existing tickets that should be RE-SCOPED or CLOSED (no new issue needed)

These need no quota, just an edit — and closing them frees capacity:

| Ticket | Action | Evidence |
|---|---|---|
| **VGC-221** | **CLOSE — obsolete** | C4: Clerk is 7.5.9, js-cookie 3.0.7, no advisory remains |
| **VGC-261** | **CLOSE — already on main** | C2: `git diff origin/main -- tsconfig.json` is empty |
| **VGC-248** | **RE-SCOPE** | C4: 8 moderate vulns, not 12; all OpenTelemetry, **one** root cause (`@opentelemetry/core` GHSA-8988-4f7v-96qf). Fix is one bump: `sdk-logs` + `exporter-logs-otlp-http` 0.214 → 0.221 |
| **VGC-213** / **VGC-222** | **MERGE — duplicates** | Both are "re-enable the Linear webhook after the handler fix". Confirmed this run as the only remaining blocker |
| **VGC-228** | **RAISE PRIORITY / merge with VGC-275** | Framed as perf, but R6 shows it is an *indexability* defect |
| **VGC-269** | Duplicate-chunk premise **does not reproduce** | C3: zero byte-identical pairs across 84 chunks; Turbopack shares them |
