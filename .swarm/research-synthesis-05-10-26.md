# Research synthesis — nightly swarm, 05 Oct 2026

Wave 1 ran 8 read-only audits. PostHog was unavailable (`POSTHOG_API_KEY` unset), so every
agent that would have cross-referenced analytics worked from code and the Linear board only.
No analytics figures appear anywhere in this run — nothing was invented to fill the gap.

## Top 5 highest-leverage opportunities

### 1. `GET /api/team-graphic` served private reports to anyone with an id — P0, fixed tonight
No auth, no `is_public` check, no tiered-publishing redaction: one `SELECT data FROM shares
WHERE id = $1` and the route rendered every Pokémon's species, item, ability and Tera type
plus tournament name, placement and creator into a downloadable PNG. It also defeated the
VGC-142 "hide fields from public viewers" feature, since redaction was never applied.
This is the **third** instance of the same bug class (PR #79 fixed a private-report image
leak; W4 found a fork-lineage variant tonight). The pattern — a secondary read path that
forgets the visibility ladder `src/app/api/share/[id]/route.ts` implements — is the single
most productive thing to audit in this codebase.

### 2. Mega Evolutions showed the wrong type chart — fixed tonight
`SpeedTierChart` was Mega-aware; both coverage charts were not. With the Mega toggle on,
Gengar @ Gengarite was shown **immune to Ground** (the paste carries Levitate, but Mega
Gengar has Shadow Tag and takes 2x), and Charizard @ Charizardite X carried a red **4x Rock**
weakness it loses on becoming Fire/Dragon. A phantom immunity is the worst possible error in
a tool players use to plan around — they will make a read that loses them the game.
Root cause is structural: three components derived the same thing independently.

### 3. Visibility decisions were not actually owner-only — fixed tonight
A collaborator could flip `isUnlisted` (only `isPublic` was guarded), and a fork's
`_forkedFrom` metadata kept disclosing a source report's creator, event and full team after
the owner unpublished it — on `/s/{id}` and, in the same pattern, on public explore cards.
The changelog's claim that "fork is restricted to public reports only" holds at fork time
but was never re-checked at read time.

### 4. The board's constraint is merge throughput, not implementation
32 tickets sit In Review, 8 draft swarm PRs (#72–#80) are open and unmerged, 24 abandoned
`swarm-nightly-*` branches remain on origin, and `origin/main`'s last commit is 24 Aug 2026 —
six weeks before this run. P1 **VGC-265** already says this. Three of tonight's "tickets" turned
out to describe work that has already shipped (see `.swarm/l0-triage.md`), which is what a board
looks like when research output accumulates faster than anyone can act on it. **Merging the
existing PRs is worth more than anything a further swarm run can add.**

### 5. Reg M-C is live and entirely unsupported — deliberately NOT guessed
Regulation M-C has been the active format since 9 Sep 2026. `REGULATIONS` in `tags.ts` stops at
M-B, and `getRegMBMegasWithSprites()` caps `generateStaticParams` and the sitemap, so roughly 24
M-C Megas never prerender. Competitors already title pages "Reg M-C". The swarm did not implement
it: the authoritative M-C legal-Mega list is not in the repo, and shipping a guessed dex would put
**wrong legality information** in front of players — worse than shipping nothing. Filed as a ticket.

## Top 5 quick-win issues

1. **`min-h-11text-xs`** — a missing space in `SpeedTierChart.tsx` (3 sites) voided *both* Tailwind
   classes, so commit `0024679`'s 44px touch-target fix never actually shipped; 12 toggles rendered
   at ~26px. Found independently by both C5 and R8. Fixed tonight.
2. **36 keyboard-inoperable column filters** — `<th onClick>` with no role, tabIndex or key handler
   in both coverage charts (WCAG 2.1.1). Fixed tonight.
3. **Game-plan deletion was keyboard-impossible** — a `<span onClick>` Delete nested *inside* a
   `<button onClick={onToggle}>` in `MatchupPlanSlide.tsx`, which also mangled the toggle's
   accessible name to "Game 1 Delete". Fixed tonight.
4. **Unvalidated share response** — `useShareUrl.ts` cast the `/api/share/{id}` body straight to
   `ShareableState`. The repo already fixed exactly this for the URL path with `ShareableStateSchema`
   + `safeParse` (changelog v5.8); the fetch path was half-shipped.
5. **Hidden structured data on 72 pages** — `FAQPage`/`HowTo` JSON-LD whose visible content had been
   removed, which risks a Google manual action across every Mega landing page.

## Blockers that stopped otherwise-ready work

- **No Vercel access** (no MCP, no `VERCEL_TOKEN`) → VGC-236 left unimplemented. Dropping the legacy
  `LINEAR_WEBHOOK_SECRET` fallback is a 2-line change, but without confirming which name Vercel
  Production holds it could cause the very webhook outage the ticket exists to prevent.
- **No database** → VGC-200 (notification preferences persist to localStorage only, so unchecking an
  email preference does not stop the email) and the account-deletion purge gap are both specified but
  unverifiable here. Shipping an untested `DELETE` against a user-deletion path is not worth the risk.
- **No PostHog** → no error-frequency or rage-click prioritisation; VGC-220 already tracks this.
- **No prod secrets** → VGC-187's PWA screenshots would have been empty-state shots, failing the
  ticket's own "polished, representative content" bar. Chromium and Playwright *are* installed, so
  this unblocks the moment a read-only `DATABASE_URL` exists.
- **Egress policy** blocked Reddit and crob.at, so community sentiment (R3/R5 part B) returned nothing
  usable. Reported as "no data" rather than padded with invention. VGC-255 already tracks this.

## High-conflict-risk files (changed tonight AND high-churn on main)

Read against `.swarm/main-changed-files.md`. These carry real conflict risk when the 8 open PRs merge:

| File | Touches in last 30 commits on main | Changed tonight by |
|---|---|---|
| `src/app/page.tsx` | 4 | SEO (JSON-LD) |
| `src/hooks/useHomePage.ts` | 4 | draft-clearing fix |
| `src/components/report/PokemonDetailSlide.tsx` | 3 | a11y |
| `src/app/changelog/data.ts` | 3 | this run's entry |
| `src/components/report/SpeedTierChart.tsx` | 2 | Tailwind typo fix |
| `src/components/report/DefensiveCoverageChart.tsx` | 2 | Mega typing + a11y |
| `src/app/api/share/route.ts` | 2 | visibility guard |
| `src/app/api/explore/route.ts` | 2 | fork-lineage visibility |

`src/app/page.tsx` and `useHomePage.ts` are the two to watch: they are the most-churned files in the
repo and several of the open PRs almost certainly touch them too.

## Audits that found little — worth recording as a clean bill

- **C1 (dead code)**: 0 orphaned components, 0 dead routes, 0 unused dependencies. All 52 API and 22
  page routes resolve to a real caller. Earlier runs genuinely cleaned this up; only five
  `create-next-app` leftover SVGs and one dead cast helper remained, both removed tonight.
- **C2 (TypeScript)**: **zero** explicit `any`, zero `@ts-ignore`, and all 6 non-null assertions
  correctly guarded. The real unsoundness is implicit, from library generics (`JSON.parse`,
  `Response.json()`, Neon's `Record<string, any>[]`) — not from sloppy annotations.
- **C4**: no hardcoded secrets anywhere; all SQL parameterised; cron, webhook, migrate, setup and
  cleanup routes all correctly locked down.
- **C5**: zero `TODO`/`FIXME`/`HACK`/`XXX` markers. (Though 4 `ponytail:` markers do TODO's job while
  being invisible to a grep for TODO — worth knowing.)
