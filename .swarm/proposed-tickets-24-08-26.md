# Tickets this run would have filed — blocked by the Linear plan cap

**Why this file exists.** GOAL B (turn research findings into Backlog tickets)
could not run. The Linear workspace is on the free plan
(`organization.subscription` is `null`) with **275 active issues against a 250
cap**, so `issueCreate` returns:

```
USAGE_LIMIT_EXCEEDED — "You've exceeded the free issue limit for this
workspace. Please upgrade or contact sales@linear.app for a free trial."
```

That was confirmed by an actual creation attempt, not inferred. The 17-08-26
run hit the same wall and recorded 10 unfiled tickets.

**To unblock:** upgrade the plan, or archive completed issues to free slots.
Archiving is a judgement call about the user's own history, so the swarm does
not do it. Once unblocked, these can be bulk-created. Each entry cites the
source report so the evidence survives.

Ordered by proposed priority. Nothing here duplicates an existing ticket — the
board was checked first, and where an existing ticket already covers a finding
it is named instead.

---

## P0 / Urgent

**1. [INFRA] Linear workspace is over the free-plan issue cap**
275 active issues vs a 250 cap; every swarm run's Goal B is blocked until
resolved. Meta-ticket for this file. Source: this run.

## P1 / High

**2. [SEO] `/creator/[name]` and `/explore` are client-rendered and unindexable**
The same defect as VGC-275, on two more sitemapped routes:
`CreatorProfile.tsx:51` and `ExploreContent.tsx:106` fetch content browser-side
from `/api/*`, which `robots.txt:7` disallows, so Googlebot's renderer is
refused the request. VGC-275 covers `/s/[id]` only. Source:
`.swarm/r6-seo-audit-24-08-26.md`.

**3. [Perf] Clerk ships ~78 kB gz on all 89 pages, including `/terms` and 74 SEO pages**
`layout.tsx:106`. Bigger lever than the motion and `/compare` regressions
combined. Static legal pages measure a 216.6 kB gz baseline. Needs the auth
provider scoped to routes that actually need it. Source:
`.swarm/c3-performance-24-08-26.md`.

**4. [Bug] `detectArchetypes` infers EV-vs-SP scale from EV magnitudes, not regulation**
Misclassifies lightly-invested classic teams as Champions SP spreads. The
regulation is known — it should be passed in rather than guessed. Commit
`1b14f3b`. Source: `.swarm/c5-commit-review-24-08-26.md`.

**5. [Growth] Get listed in the third-party roundups that decide AI citations**
R7 showed the site wins queries with no roundup and loses every query decided
by one — notably DevonCorp's "Up-to-date VGC Resources". This is off-site work,
not more schema. Related to existing VGC-147/VGC-148/VGC-184; file only if
those are judged distinct. Draft outreach (unsent) in `.swarm/drafts/`.
Source: `.swarm/r7-aeo-citation-24-08-26.md`.

**6. [Infra] Sanctioned Reddit access for UX research**
Reddit is blocked to both WebSearch and WebFetch; R3 has now been commissioned
twice and returned no Reddit data either time. Either provision API access or
stop commissioning R3. Source: `.swarm/r3-reddit-sentiment-24-08-26.md`.

## P2 / Medium

**7. [Share] `/api/oembed` is fully built but undiscoverable**
No `<link rel="alternate" type="application/json+oembed">` tag anywhere, so
unfurlers never find it. Found independently by R5 and C1. Small fix, deferred
tonight only because it touches `s/[id]/page.tsx`, which another agent owned.

**8. [Growth] Logged-out visitors get no Save affordance**
`Navbar.tsx:217` gates Save on `isSignedIn`; the only verb offered is
high-commitment "Duplicate". Fork intent is then explicitly dropped across the
Clerk auth boundary (`page.tsx:772-778`), so a visitor who does sign in loses
what they were doing. Source: `.swarm/r5-mobile-share-ux-24-08-26.md`.

**9. [Creator] Per-creator branding on exported artifacts**
`TeamCardExport.tsx` and `team-graphic/route.tsx` both hardcode
`pokemonvgcteamreport.com` while the creator is 9px grey caption text. R4 notes
this should ship *behind* verified profiles — `creator_profiles` currently
joins on free-text `LOWER(name)`, an impersonation vector (see VGC-253).
Source: `.swarm/r4-creator-sentiment-24-08-26.md`.

**10. [Security] `creator_profiles` is keyed on Clerk display name**
Anyone can overwrite a named creator's public profile
(`user/profile/route.ts:71-95`). Overlaps VGC-253 (no `user_id` column) — fold
into that ticket rather than duplicating. Source:
`.swarm/c4-security-24-08-26.md`.

**11. [Data integrity] `purgeSatellites` runs 8 deletes with no transaction, and no FK cascade**
A partial failure orphans rows. `comment_flags` purge was added in two places
but missed in `user/delete/route.ts:65`. Root cause is missing FK cascades.
Commit `fd0aa6f`. Source: `.swarm/c5-commit-review-24-08-26.md`.

**12. [Bug] Explore keyset pagination filters on `date_trunc(created_at)` but orders on the raw column**
`popular`/`views` sorts still skip rows, and the predicate is non-sargable.
Commit `82f9210`. Source: `.swarm/c5-commit-review-24-08-26.md`.

**13. [Reliability] Every lazy `import()` lacks `.catch()`, and `ChunkErrorReloader` is itself lazy**
The chunk-failure recovery mechanism is deferred behind the same dynamic
boundary it exists to recover from. Commits `415a281`/`6cec919`. Source:
`.swarm/c5-commit-review-24-08-26.md`.

**14. [Tooling] Lint guard for fused Tailwind classes**
`min-h-11text-xs` reached production and neither tsc, vitest nor the build
caught it — only a human reading the diff. A cheap lint rule or a test that
scans `className` strings for a digit immediately followed by a letter would
have. Source: `.swarm/c5-commit-review-24-08-26.md` + tonight's fix.

**15. [Chore] `next` pin loosened from `16.2.6` to `^16.3.0` during a CVE bump**
Caret range on the framework means unattended minor upgrades. Commit `d44b93a`.
Source: `.swarm/c5-commit-review-24-08-26.md`.

**16. [a11y] 17 remaining findings from the 24-08 audit**
Tonight fixed the HIGH ones. Still open: `/compare` unlabelled textareas and
selects, four dialogs without focus traps, drag-only reorder with no keyboard
path, accent-on-tinted-surface at 4.1–4.3:1, warning 3.19:1 / success 3.30:1,
focusable full-viewport scrims, `focus:outline-none` with no replacement ring,
walkthrough eating Enter/Space. Full list with file:line and WCAG criteria in
`.swarm/r8-a11y-audit-24-08-26.md`.

**17. [Types] 7 line-fixes unlock two more strict flags**
`NotificationBell.tsx:78`, `useShareUrl.ts:137`, plus five `_`-prefixes, would
make `noImplicitReturns` (2 errors) and `noUnusedParameters` (5) clean. Also
**correct VGC-261**, which claims 4 clean flags — the measured number is 2.
Source: `.swarm/c2-typescript-24-08-26.md`.

**18. [Competitive] Watch crob.at, teamsheet.gg and reportworm.com**
Three direct competitors named across R1–R4 that appear nowhere on the board.
crob.at occupies the "visual PokePaste alternative" slot outright;
teamsheet.gg has collaborative reports on its roadmap. Sources:
`.swarm/r1-*`, `.swarm/r2-*`, `.swarm/r3-*`, `.swarm/r4-*`.

**19. [Feature] Ingest the Limitless public API for real tournament pages**
Free, key-less (`play.limitlesstcg.com/api`) with a tournament-finished
webhook; Indy Regional alone published 1,012 teamlists. It exposes
Pokémon/item/ability/Tera but **never EVs, IVs or nature** — the gap is our
moat, and "finish the teamsheet" is a natural import wedge. Large. Source:
`.swarm/r2-competitors-vgcpastes-limitless-trainerhill-24-08-26.md`.

**20. [Growth] X now penalises link posts ~30–50% reach**
The exported *image* is now the primary creator artifact, not the link. Argues
for an image-first share kit and `navigator.share({files})`. Sources:
`.swarm/r4-*`, `.swarm/r5-*`.

## P3 / Low

**21. [Chore] Duplicated zod schema in the share route**
`commonModes` hand-mirrors `ShareableStateSchema` — the same duplication that
caused the VGC-244 silent-drop bug. Commit `44f780c`.

**22. [Chore] Dead game-result chain (~24 LOC) and 57 orphan i18n keys × 7 locales**
C1's MEDIUM items — need an owner decision on whether the i18n keys are
deliberate pre-translation. Source: `.swarm/c1-dead-code-24-08-26.md`.

**23. [Chore] Two `ponytail:` markers still in the tree**
Linear webhook (delivery-id dedupe) and type-chart Dry Skin.

**24. [Tests] Four `src/lib/` modules shipped without tests**
Against the CLAUDE.md convention. Also: `type-chart.ts` was corrected twice in
three days for two separate data-completeness gaps — a canonical-matrix test
would end that class of bug.

## Existing tickets to correct rather than duplicate

- **VGC-261** — "4 strict flags clean" is wrong; the measured number is 2.
- **VGC-255** — "egress blocks every external data source" is now half true:
  general web egress works, the project's own domain is blocked.
- **VGC-187** — premise is stale. It says `manifest.json` references screenshot
  paths that need PNGs; `public/manifest.json` has **no `screenshots` key at
  all**, so the manifest entries must be added too. Deferred tonight: capturing
  them from a seedless local dev server would misrepresent the product.
- **VGC-236** — "drop the legacy `LINEAR_WEBHOOK_SECRET` fallback" is **unsafe
  to action right now**. The webhook is already failing, and no one can see
  which env var name Vercel actually holds (no Vercel access this run).
  Removing the fallback could be the thing that finally kills it. Blocked on
  the VGC-222/VGC-213 verification.
- **VGC-181** — the fabricated Indy "TBD" top-cut data is still live on `main`;
  the fix sits unmerged on PR #72.
