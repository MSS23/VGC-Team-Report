# Linear tickets to file — swarm run 2026-08-02

**Linear could not be reached this run** (MCP needs interactive OAuth; no
`LINEAR_API_KEY` because there is no `.env.local` in the container). These are
written out for a human to file manually. Every item below is a *confirmed*
finding from a Wave 1 audit, with the source report cited.

Suggested label for all: `auto-research`.

---

## P0 / Urgent

### [SECURITY] Creator profile takeover — `creator_profiles` keyed on Clerk display name
- **Priority:** Urgent · **Source:** `.swarm/security-audit.md` (P1-2)
- **Where:** `src/app/api/user/profile/route.ts:71-95`
- **Problem:** the table is keyed on the caller's Clerk **display name**
  (`ON CONFLICT (name) DO UPDATE`) with no ownership column. Any user who sets
  their Clerk first/last name to match a target creator overwrites that
  creator's public bio, socials and avatar — the ones shown next to the
  verified badge on `/creator/[name]` — or sets `isPublic:false` to hide the
  target's page entirely.
- **Fix:** add a `user_id` column, make it the conflict target, and resolve
  public reads via `shares.owner_id`.
- **Why not fixed tonight:** needs a DB migration. CLAUDE.md routes migrations
  to a reviewed feature branch, and Neon is on the 512MB free tier so schema
  changes want a human eye. Deliberately left for review.

---

## High

### [INFRA] Verify Linear webhook env var in Vercel Production
- **Priority:** High · **Source:** `.swarm/run-meta.md` (Step 0C)
- The handler code is **correct and already on `main`** — raw-body HMAC,
  `linear-signature`, `timingSafeEqual`, `force-dynamic`, 200 on unknown events.
  Verified independently by the security audit.
- If Linear delivery is still failing, the only remaining cause is a mismatch
  between Vercel Production `LINEAR_WEBHOOK_SIGNING_SECRET` and the secret in
  Linear's webhook settings. **Human action in the Vercel dashboard** — the
  swarm must never touch env vars, and has no Vercel MCP in this session.
- Re-enable the webhook in Linear settings afterwards if it was auto-disabled.

### [SECURITY] Spoofable rate-limit identity and client-supplied `sessionId`
- **Priority:** High · **Source:** `.swarm/security-audit.md` (P2 group)
- `src/lib/.../input-validation.ts:53-78` derives rate-limit identity from
  spoofable headers; a client-supplied `sessionId` lets like/view counts be
  inflated. Also: `Content-Length`-only body cap, and no replay window on the
  Linear/Discord webhooks.

### [BUG] Order-sensitive `JSON.stringify` gates version snapshots
- **Priority:** High · **Source:** `.swarm/code-review.md` (defect 8)
- **Where:** `src/lib/.../diff-state.ts:72,82,130`
- Postgres `jsonb` does not preserve key order, so a stringify comparison sees
  spurious differences and writes a snapshot when nothing changed. This is the
  **likely root cause of the 447MB `share_versions` incident** (July 2026,
  noted in CLAUDE.md). The module has **zero tests** despite gating DB writes.
- **Fix:** deep-equal or canonical key ordering before comparing. Add tests.

### [A11Y] Light-mode contrast failures across ~50 sites
- **Priority:** High · **Source:** `.swarm/a11y-audit.md` (finding 1)
- `text-amber-400` (1.67:1), `text-emerald-400` (1.92:1), `text-blue-400`
  (2.54:1) used with no `dark:` pair — all far below the 4.5:1 the project's own
  UI standard mandates. Includes **error text**. Affects `MatchupPlanSlide`,
  `CommonModesSlide`, both coverage charts, `SpeedTierChart`,
  `PokemonDetailSlide`.
- **Fix:** `text-<hue>-700 dark:text-<hue>-400`.
- **Why not fixed tonight:** ~50 sites across files other agents were editing
  concurrently; a sweep this wide wants its own reviewed PR.

---

## Medium

### [A11Y] Damage-calc edit and mobile tab bar are mouse-only
- **Source:** `.swarm/a11y-audit.md` (findings 3, 4) — `PokemonDetailSlide.tsx:163-173`
  is a `<span onClick>`; `:926-942` is a tab bar with no `role="tab"` /
  `aria-selected` and colour-only state. Copy the pattern already in
  `SlideNavControls.tsx:181`.

### [A11Y] No `<h1>` on 10 of 11 report slides
- **Source:** `.swarm/a11y-audit.md` (finding 5) — `TeamReport` renders one slide
  at a time; only the overview has an `h1`, and it skips `h1→h3`.

### [A11Y] Framer-Motion animations bypass the reduced-motion reset
- **Source:** `.swarm/a11y-audit.md` — the CSS reset in `globals.css:826` cannot
  reach JS-driven animation. Reference implementation: `ExploreFilters.tsx:130`.

### [BUG] Three different EV caps shown to users
- **Source:** `.swarm/code-review.md` (defect 4) — parser warns >510, validator
  errors >512 with a user-visible "allows 512 total" (wrong), card shows /508.
  Pick 508 and make all three agree.

### [TEST] Untested modules that gate real behaviour
- **Source:** `.swarm/code-review.md`
- `diff-state.ts` (0 tests, gates DB writes), `detect-regulation.ts` (239 LOC,
  0 tests, decides SP-vs-EV for the entire report), `mega-detect.ts`,
  `type-chart.ts`, `normalize-report.ts`.
- CLAUDE.md convention: new `src/lib/` logic gets a vitest test beside it.

### [BUG] Legacy `owner_id IS NULL` shares may be permanently uneditable
- **Source:** `.swarm/code-review.md` (defect 9) — suspected regression from
  `359cdef`. Needs DB verification before it can be actioned.

### [TYPES] Unchecked casts on the main share-read path
- **Source:** `.swarm/ts-strictness.md` — `normalize-report.ts:34,79`
  (`(plan: AnyRecord)` is an assertion, not a check) can 500 the share read on
  legacy JSONB. Three signature-verified webhooks consume `JSON.parse` `any`
  while 19 sibling routes correctly Zod-validate.

### [TYPES] `convertToChampionsSp(evs: StatSpread): StatSpread` conflates EV and SP
- **Source:** `.swarm/ts-strictness.md` — the shared type makes EV and SP spreads
  structurally interchangeable, so passing one where the other is expected type-checks.
  Consider branded types. The SP-detection heuristic is also duplicated verbatim
  between `stat-calculator.ts:99` and `champions-legality.ts:266`.

---

## Low / cleanup

### [CHORE] Remove confirmed dead code
- **Source:** `.swarm/dead-code.md` — verified by import-graph analysis:
  `src/components/display/DisplayTogglePill.tsx` + `src/lib/hooks/useGlobalDisplayPrefs.ts`
  (a paired feature never wired up), `src/components/providers/ConsentGate.tsx`
  (`layout.tsx` imports `CookieBanner`, never `ConsentGate`), `getRegMBMegas`
  (`mega-pokemon.ts:846`), `asPokemonTypes` (`dex-subset.ts:123`), and
  `isRateLimited` (`rate-limit.ts:84`, legacy wrapper — all production callers
  use `isRateLimitedAsync`).
- Note open PR **#51** already proposes some of this cleanup.

### [CHORE] Stop committing `.swarm/` to the repo
- **Source:** `.swarm/run-meta.md`
- `.swarm/` is tracked and now holds **172 files / 1.9MB** — about a quarter of
  the 8MB working tree — of near-duplicate machine-generated notes (8×
  `c1-dead-code*`, 7× `r8-accessibility*`, 5× `r6-seo*`, 10× `discord-failed*`).
- **Fix:** add `.swarm/` to `.gitignore` and prune. Left to the human because it
  is a 172-file deletion of their own workflow artifacts.

### [CHORE] `/api/oembed` emits no discovery `<link>`
- **Source:** `.swarm/dead-code.md` (UNCERTAIN) — the endpoint exists but
  `s/[id]` emits no discovery link, so no consumer can find it. Wire it up
  rather than delete it: it is how Discord/Slack/Notion unfurl shared reports,
  which is squarely on the product's core sharing journey.
