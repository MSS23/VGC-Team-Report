# Board reconciliation — "In Review" → where the code actually lives (16-11-26)

**Scope:** all 61 Linear issues in team VGC state **In Review** (verified live against the
Linear GraphQL API on 16 Nov 2026 — 61 nodes, `hasNextPage: false`, identical to
`.swarm/.../board.json`).

**Read-only run.** No Linear writes, no git state changes. The only git operation beyond
`log`/`show`/`diff`/`grep`/`cat-file` was `git fetch --unshallow origin`, which deepened
`origin/main` from 60 to **811** commits. This mattered: the clone's shallow boundary was
`069e49b`, so every commit before it was invisible and 14 tickets would have looked
unattributable. (`git fetch --unshallow` also revealed a branch not previously fetched —
see *Other branches* below.)

## Method, and why it is not commit-message matching

`origin/main` is an **ancestor of both open PR branches** (`git merge-base origin/main
origin/swarm-nightly-2026-11-02` = `git merge-base origin/main
origin/swarm-nightly-2026-11-09` = `10dfd74`, which is main's tip). So "on main" is a
clean subset test, and PR #91 / #92 contain main plus their own commits — nothing has
diverged and no merge conflict analysis is needed.

For every ticket, the **concrete claim in the description** (a file, a function, a
specific wrong behaviour, an acceptance criterion) was grepped against the tree at
`origin/main`. A ticket is marked LANDED only where the described change is present in
the code. Commit SHAs are given as corroboration, not as the primary evidence. Where a
description's claim was still true on main, the same claim was re-tested against each PR
branch's tree and diff.

Two systemic hazards were found and worked around:

1. **Commit subjects cross-label two tickets.** `886119a "VGC-242: speed tiers now
   reflect Mega base stats"` is the **VGC-243** fix, and `6d32c47 "VGC-243: stop Manage
   Access panel from flashing"` is the **VGC-242** fix. Subject-matching alone would
   mis-bucket both. Both fixes are on main; the code was read to confirm it.
2. **Many ticket descriptions and the prior reconciliation cite SHAs that do not exist
   in this repository** — `70c86e3`, `24dbf5d`, `c127942`, `4a97caf` (all attributed to
   "PR #82") resolve to nothing across all 811 commits. Any ticket resting on a PR #82
   citation was treated as unevidenced and re-tested from the code. This is how VGC-296
   win 2 and VGC-303's "win 2 landed" claim turn out to be **lost work**: the de-motion
   of `ReportCard`/`MegaLandingContent` is on no branch, and `motion/react` is still
   statically imported in both files on main.

The prior reconciliation inside PR #92 (`.swarm/linear-pending-09-11-26.md`) was read as
input. Its headline (38 of 61 already merged) is directionally right but has at least
five concrete errors, corrected here: VGC-181 and VGC-251 were credited to `dcb6c3d`, and
VGC-300 to `637989f`, which are **swarm report commits that merely mention the ticket**;
VGC-242/VGC-243 are the cross-labelling above; and VGC-253's `66854cf` is the 409
mitigation the ticket itself says is *not* the fix.

---

## The table

| Identifier | Title | Bucket | Evidence (on `origin/main` unless stated) | Recommended human action |
|---|---|---|---|---|
| VGC-38 | Inline damage calculator in reports | **LANDED** | `src/components/report/InlineDamageCalculator.tsx:26` default export, mounted from `pokemon-detail/CalcsPanel.tsx`; `a360b38` | Move to Done |
| VGC-40 | Import tournament results from Limitless VGC | **LANDED** | `src/app/api/import/limitless/route.ts`, `src/components/input/LimitlessImport.tsx`, `src/lib/import/limitless.ts` + `__tests__/limitless.test.ts`; `32016af` | Move to Done |
| VGC-41 | Full Pokemon Champions format support | **LANDED** | `src/lib/validation/champions-legality.ts:140` types the regulation as `"Reg M-A" \| "Reg M-B" \| "Reg M-C"`, `:145` `getChampionsDex(regulation)`; `980da2b`, `b71707a` | Move to Done |
| VGC-43 | 6v6 threat analysis and coverage matrix | **LANDED** | `src/lib/analysis/threat-matrix.ts` + tests, `src/components/report/ThreatMatrix.tsx` rendered by `TeamReport.tsx`; `be4d395` | Move to Done |
| VGC-48 | Real-time collaborative team building | **LANDED** | `src/hooks/useCollaborativeSync.ts`, `src/app/api/sync/[id]/route.ts` (SSE); `8f7a266` | Move to Done |
| VGC-50 | EV spread builder with survival and speed benchmarks | **LANDED** | `src/components/report/SpreadBuilder.tsx`, consumed by `PokemonDetailSlide.tsx` and `pokemon-detail/CalcsPanel.tsx`; `61ebd24` | Move to Done |
| VGC-64 | Google Search Console setup + sitemap optimization | **UNCLEAR** | Only the code half is testable and it is present (`src/app/sitemap.ts:9` `revalidate = 3600`, `fe70914`). Verifying GSC ownership, crawl errors, Core Web Vitals and query reports are **console actions with no repository footprint**; ticket also carries `no-claude`. | Human decision: close the code half and convert the monitoring half into a recurring task, or move out of In Review. Evidence needed: a GSC screenshot/export |
| VGC-129 | Retention: Browser push notifications via service worker | **LANDED** | `src/components/ui/BrowserPushSettings.tsx:64` `pushManager.subscribe({ applicationServerKey })`, `src/app/api/user/push/` + VAPID test; `7ce05d2` | Move to Done |
| VGC-158 | Decompose PokemonDetailSlide (962 lines) | **LANDED** | `PokemonDetailSlide.tsx` is now **30 lines** (ticket's bar was <150) and `src/components/report/pokemon-detail/` holds 9 focused modules incl. `StatsPanel.tsx`, `MovesPanel.tsx`, `PokemonSlideHeader.tsx`; `d031232` | Move to Done |
| VGC-162 | Root page.tsx Server Component refactor | **LANDED** | `src/app/page.tsx` is **10 lines** with **no** `'use client'` — it imports `HomePageServer`; `ee56868` | Move to Done |
| VGC-181 | Update Indianapolis Regionals top-cut with real data | **NOT-FOUND** | `src/data/indy-top-cut.ts` lines **18, 25, 32, 39, 46, 53, 60, 67** all still `player: "TBD"`. File last touched `b074a8f` (12 May). Neither PR branch touches it. PR #92 credited this to `dcb6c3d`, a swarm *report* commit. | Send back to Backlog. Still live production content with visibly fake data — re-prioritise, don't close |
| VGC-187 | PWA: capture real screenshots | **LANDED** | All four PNGs present: `public/screenshots/{desktop,mobile}-{team-report,explore}.png`; `38b2cd1` | Move to Done |
| VGC-200 | Notification preferences: persist to DB | **LANDED** | `src/app/api/user/preferences/route.ts` + tests; `dashboard/notifications/NotificationsContent.tsx:52-61` reads the legacy localStorage key once then deletes it, account prefs authoritative; `4bef246` | Move to Done |
| VGC-207 | Anonymous quick-share: paste-to-URL without login | **LANDED** | `src/app/q/[id]/page.tsx` + `ClaimQuickShare.tsx`; `069e49b` | Move to Done |
| VGC-219 | Remaining a11y findings (4 sub-items) | **LANDED** | All four: (1) `src/app/s/[id]/redirect.tsx:18` `<h1 className="sr-only">{heading ?? …}</h1>` with the server-derived heading; (2) focus trap at `HomePageClient.tsx:387-421` (Tab/Shift-Tab wrap + focus restore) around the Export Theme dialog; (3) `SlideNavControls.tsx:508` `onKeyDown={handleSlideTabKeyDown}` (the bare `role="slider"` no longer exists anywhere in `src/`); (4) `ReportCard.tsx:321-363` like/save now `min-h-[44px] min-w-[44px]` (`76b0c97`). `d706f71` | Move to Done |
| VGC-224 | Decide Cypress: types + tsconfig, or delete the tree | **NOT-FOUND** | The half-state the ticket calls "worst of both worlds" is intact: `cypress/` still holds 10 files, `tsconfig.json` still ends `"exclude": ["node_modules", "cypress"]`, and `package.json:12-15,55` still carries `cy:open`/`cy:run`/`test:e2e*` and `cypress ^15.11.0`. No decision on any branch. | Send back to Backlog — it is a product decision (Option A or B), not implementation work |
| VGC-225 | PokePaste URL import | **LANDED** | `src/components/input/PasteInput.tsx:6` `import { isPokePasteUrl, fetchPokePaste }`, UI copy at `:407`; `src/lib/utils/pokepaste.ts` + `src/app/api/pokepaste/route.ts` (host-allowlisted). Present since the initial commit `2f3bf69` — the ticket was stale when filed. | Move to Done |
| VGC-228 | Server-render /s/[id] without app shell | **NOT-FOUND** | `src/app/s/[id]/page.tsx` still renders `ShareRedirectClient` (`./redirect`) and builds `?s=<id>`; the app shell still loads. Neither PR branch touches `src/app/s/` at all. | Send back to Backlog, and **merge with VGC-275** (same file, same change, VGC-275 has the stronger framing) |
| VGC-232 | Sprite-fallback: substitute HOME/Showdown sprite on 404 | **LANDED** *(with caveat)* | The user-facing half is done: `src/lib/utils/sprite-url.ts:58-110` `getGenThemedSpriteUrls` returns an ordered multi-source chain ending on broad-coverage gen5/home statics, and `PokemonSprite.tsx:25-52` `nextSpriteFallbackState` walks it on `onError` (`6abb665`). **Caveat:** the "route every sprite through `/api/sprite`" half is not done — `src/app/api/sprite/route.ts` is still an html2canvas-only CORS proxy with no fallback chain. | Move to Done, or re-scope the proxy half as a new ticket if it is still wanted. Confirm the caveat first |
| VGC-242 | Manage Access: several "visual flashes" | **LANDED** | `src/components/social/CollaboratorPanel.tsx:65-74` — the re-fetch loop that "flipped `loading` repeatedly and flashed the spinner ↔ content swap" is replaced by a `fetchedRef` fetch-once-per-open guard. Commit is `6d32c47`, **mislabelled `VGC-243:`** | Move to Done |
| VGC-243 | Speed-Tiers not adapting to "Mega" selection | **LANDED** | `src/components/report/SpeedTierChart.tsx:30` takes `megaStates`, `:190` `resolveSpeedTierForm(mon, speciesKeys[i], megaStates?.[i] === true)`, `:227-230` recomputes Speed from the Mega's base stat. Commits `cfcbd2f` and `886119a` (the latter **mislabelled `VGC-242:`**). **Also re-touched on PR #91** — see duplication list | Move to Done. The PR #91 refinement is a separate (real) bug — give it its own ticket |
| VGC-245 | Modes section seems not to be saving | **LANDED** | `src/lib/sharing/url-codec.schemas.ts:62-82` keeps the legacy free-text `commonModes` fields (`leads`/`modes`/`strengths`/`weaknesses`/`gameplan`) with the comment *"retained so 119 existing shared reports keep their leads/modes text. Never dropped"*; `src/app/api/share/route.ts:28` mirrors it, `:80` references the stripping bug as fixed; covered by `api/share/__tests__/route.test.ts:38-44` and `sharing/__tests__/fetched-share-state.test.ts:98-106`. `bdbbfac` | Move to Done |
| VGC-246 | Enforce true private reports + visibility-toggle hardening | **LANDED** | `src/app/s/[id]/page.tsx` `notFound()` on unknown + `robots: {index:false,follow:false}` and no title/description for non-public/non-unlisted; `api/user/reports/[shareId]/route.ts:85` `is_unlisted = COALESCE(…, is_unlisted)` so a PATCH of `isPublic` alone preserves the flag; `useShareUrl.ts:242` 15 000 ms. `97dc8bb` | Move to Done. (PR #91 `d0b0ac9` closes a **new** gap — og:image Blob not revoked on private — created later by `e4d9354`; that wants its own P0 ticket) |
| VGC-247 | Update PostHog SDKs | **LANDED** | `package.json:37-38` → `posthog-js ^1.392.0`, `posthog-node ^5.38.2`, exactly the ticket's targets; `abd9872` | Move to Done |
| VGC-251 | Champions Paste Not Working (everyone 32hp/32atk) | **LANDED** | `b5712a6 "fix: stop fabricating 32 HP / 32 Atk SP for uninvested spreads"` — the reported symptom verbatim — plus `b14c717`; regression test `src/lib/analysis/__tests__/stat-calculator.test.ts:138` *"returns all zeros for a zero-EV spread (regression: was fabricating 32 HP / 32 Atk / 2 Def)"* and `:143`. **Also re-touched on PR #91** | Move to Done |
| VGC-253 | creator_profiles has no user_id column | **ON-PR-91** | Still absent on main — `src/lib/db.ts` has no `user_id` on `creator_profiles`; main's `66854cf` is only the 409 `findNameConflict` guard the ticket itself calls "a mitigation, not a fix". PR #91 `16f89e1` adds `ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS user_id TEXT`, `src/lib/db/migrations/add-creator-profile-user-id.sql` and `api/user/profile/__tests__/creator-profile-ownership.test.ts` | Keep In Review until #91 merges. **Review the migration against the 512 MB Neon tier before merging** |
| VGC-254 | Privacy policy doesn't disclose Microsoft Clarity | **LANDED** | `src/app/privacy/page.tsx:186` *"Microsoft Clarity — Session recording and heatmap analytics"*, plus `:76,78,126,288-292`; zero occurrences of "Vercel Analytics" in the file; `bdbbfac` | Move to Done |
| VGC-256 | Lazy-load zod out of the client bundle | **LANDED** | `src/lib/sharing/url-codec.ts:7` records the removal, `:134` fetches the schemas on demand; `src/hooks/useShareUrl.ts:94` `await import("@/lib/sharing/url-codec.schemas")`, `:88` names VGC-256. `bdbbfac` | Move to Done |
| VGC-257 | dex-subset.json eagerly bundled into the homepage | **LANDED** | `src/lib/__tests__/homepage-eager-imports.test.ts` is a committed tripwire: `@/lib/data/dex-subset`, `@/lib/data/pkmn-dex-fallback` and `@/lib/utils/mega-detect` are in `FORBIDDEN_STATIC_IMPORTS` and asserted absent from all five eager homepage files. `415a281` | Move to Done. Acceptance criterion 2 for `/compare` is tracked by VGC-271 |
| VGC-258 | /champions index grid still built from Reg M-A megas | **LANDED** | `src/app/champions/ChampionsContent.tsx:65,74` build the grid from `getRegMCMegas()` (M-A kept as a third group at `:83`), with a comment at `:50` naming the old bug; `src/app/champions/page.tsx:47` likewise. `b71707a` | Move to Done |
| VGC-259 | Report viewer renders no h1 on any slide except the first | **LANDED** | `src/components/home/HomePageClient.tsx:1146-1156` — comment *"VGC-259: every slide needs an `<h1>`"* and `{(tournamentMode \|\| physicalSlide !== 0) && <h1 className="sr-only">…}`. `bdbbfac` | Move to Done. The deliberate slide-0 exclusion is VGC-270 |
| VGC-260 | version-diff emits pokemon:\<index\> but parses it as a species | **LANDED** | `src/lib/utils/version-diff.ts:25` records the fix, `:64` `encodeSectionKey` → `pokemon:${key.index}`, `:116`/`:395` resolve it via `speciesKeys`; the module now has `src/lib/utils/__tests__/version-diff.test.ts`. `bdbbfac` | Move to Done |
| VGC-261 | Enable 4 strict flags that are already clean | **LANDED** | `tsconfig.json` has `noImplicitOverride`, `noFallthroughCasesInSwitch`, `allowUnreachableCode: false`, `allowUnusedLabels: false` **and** a fifth the ticket undercounts (`noUncheckedSideEffectImports`), with a comment dated 2026-08-10. `bdbbfac`. PR #92 `cc6f207` is a **comment-only re-measurement**, no flag change | Move to Done |
| VGC-262 | Standalone EV→SP converter page | **LANDED** | `src/app/tools/ev-to-sp/page.tsx` + `EvToSpConverter.tsx`, added in `bdbbfac`; referenced from `public/llms-full.txt:96` | Move to Done |
| VGC-264 | Three API routes parse x-forwarded-for left-most | **LANDED** | All three now use the hardened helper: `api/share/route.ts:4,114`, `api/share/[id]/fork/route.ts:3,139`, `api/explore/route.ts:3,21`; and the ticket's requested guard exists — `src/lib/security/__tests__/no-raw-forwarded-for.test.ts`. `b865fa2` | Move to Done |
| VGC-266 | llms.txt teaches the wrong SP definition | **LANDED** | `public/llms.txt:29` now reads *"SP (Stat Points) … the first SP in a stat costs 4 EVs and every SP after that costs 8 … 66 SP total … maximum of 32 SP per stat"*; drift guard `src/lib/analysis/__tests__/sp-docs-drift.test.ts` exists. `1db8419` | Move to Done |
| VGC-267 | keepalive:true on ALL draft saves | **LANDED** | `src/hooks/useAutoDraft.ts:91-96` `keepalive: opts?.exitFlush === true`; tests at `src/hooks/__tests__/useAutoDraft.test.ts:50-53` (in-session `keepalive:false`) and `:93-108` (exit flush `true`). `9897389` | Move to Done |
| VGC-268 | motion eager on 7 routes; move-names eager on / | **NOT-FOUND** | `from "motion/react"` is still a **static** import in 10 files (`ReportCard.tsx:4`, `MegaLandingContent.tsx:5`, `ExploreContent/Filters/Empty`, `ChangelogContent`, `FeedbackContent`, `dashboard/profile`, `CreatorProfile`, `WhatsNewModal`); `src/lib/utils/translate-move.ts:3` still statically imports `MOVE_NAMES`, and the homepage tripwire does not cover it. Neither PR branch lazies either | Send back to Backlog (measurement in the ticket still holds) |
| VGC-269 | No bundle-size visibility since Next 16 + Turbopack | **NOT-FOUND** | `.github/workflows/ci.yml` runs only typecheck, `npm run lint` (`:22`) and vitest — zero bundle/size step. Nothing on either PR branch | Send back to Backlog. Note PR #91/#92 both had to hand-measure preload sets, which is the cost this ticket prices |
| VGC-270 | Edit-mode slide 0 renders no h1 | **NOT-FOUND** | Exactly as described: `src/components/report/TeamOverview.tsx:418` `{isReadOnly && !teamName && (<h1 className="sr-only">…)}` and `:424` `{isReadOnly ? …}` — both h1s still gated on `isReadOnly`. PR #91 touches this file but only swaps `text-white`→`text-accent-foreground` | Send back to Todo — it is a one-line fix and the last open item of the VGC-219 family |
| VGC-271 | Lazy-load the dex-subset fallback (VGC-257 follow-up) | **ON-PR-91** | Still eager on main: `src/lib/data/pkmn-dex-fallback.ts:30-35` statically imports `@/lib/data/dex-subset`. PR #91 `b90cc48` breaks the `/compare` chain with a module-scope memoised dynamic import and converts the guard test to a real BFS import-graph walk; measured 1179.8→813.4 KB raw (−76.5 KB gz attributable) | Keep In Review until #91 merges. Note the server/SSG path (`champions/[pokemon]/page.tsx`, `instrumentation.ts`) deliberately keeps the static import — confirm that satisfies the ticket |
| VGC-272 | robots.txt per-bot groups; /compare noindex yet sitemapped | **LANDED** | `public/robots.txt` is now a single `User-agent: *` group with `Disallow: /api/` and a comment naming VGC-272; `src/app/sitemap.ts:20` comments the deliberate exclusion and `src/app/compare/page.tsx:10` keeps `robots: { index: false }`. `164fb87` | Move to Done |
| VGC-273 | Grouped cleanup (7 items) | **UNCLEAR** | Mixed, and the ticket cannot be resolved as one unit. **Done on main:** item 1 — `src/app/sitemap.ts:52,66` carry per-route `lastModified` again; item 2 — `ci.yml:22` runs `npm run lint` with no `continue-on-error` (`d8aba62` cleared the 36 errors). **On PR #91:** item 7 — `@pkmn/dex` moved to devDependencies (`b49e0c6`, 52 MB); still in `dependencies` on main. **Still open:** item 3 — `linearQuery` duplicated at `src/lib/linear.ts:14` and `src/app/api/discord/route.ts:23` across 11 call sites; items 4 and 5 — untyped `.json()` boundaries; item 6 — `isRateLimited` still exported with its test as the only coverage of the in-memory window | **Split this ticket.** Close items 1, 2, 7 (7 on #91 merge); re-file items 3–6 individually and send them to Backlog |
| VGC-274 | CORS Allow-Credentials decision + webhook replay protection | **LANDED** | Both halves: `src/lib/security/cors.ts:53` *"Deliberately NO Access-Control-Allow-Credentials (VGC-274)"* with assertion `cors.test.ts:80-82`; `api/webhooks/linear/route.ts` rejects payloads outside a 60 000 ms `webhookTimestamp` window (`:19`, `:73-79`). `a099f97` | Move to Done. The route's own note *"no delivery-id dedupe"* is a deliberate residual — file it separately if wanted |
| VGC-275 | /s/[id] serves a client redirect, not the report | **NOT-FOUND** | Acceptance criterion 1 fails on main: `src/app/s/[id]/page.tsx` renders `ShareRedirectClient` and hands it `?s=<id>`. Canonical and JSON-LD **are** fixed (canonical `/s/<id>`, JSON-LD gated on visibility), but the body is still a redirect. Neither PR branch touches `src/app/s/`; PR #91 explicitly declined it (sized Large, needs a browser) and logged it as VGC-318 | Send back to Todo as the **highest-value open SEO work** — it is P1/Urgent, affects ~5 000 sitemapped URLs, and should absorb VGC-228 |
| VGC-288 | Account deletion leaves the user's rows behind | **LANDED** | `src/app/api/user/delete/route.ts:70-80` now runs the shared satellite purge — `comment_flags` → comments → reactions → collaborators → notifications, plus `match_logs` by `user_id` — with a note on ordering. `f0b621d` | Move to Done. The ticket asked for a DB-backed test; if that still matters, re-file it |
| VGC-291 | Carry the stat unit explicitly (statForm) | **ON-PR-92** | Confirmed absent on main: `statForm` appears only inside **comments** (`stat-calculator.ts:268`, `stat-calculator.test.ts:493`). PR #92 `75dbf32` adds `statForm?: "ev" \| "sp"` to `src/lib/types/pokemon.ts` and the optional `parseShowdownPaste(paste, { regulation })` arg, deliberately behaviour-neutral | Keep In Review until #92 merges. **This is the only net-new implementation on #92** |
| VGC-292 | Three components compute Champions stats with the EV formula | **LANDED** | All three route through the SP-aware path: `TeamStats.tsx:22-25`, `TournamentMode.tsx`, `MatchupPlanSlide.tsx:71-73` — each calls `displayStats(p.parsed, p.data.baseStats, regulation)` and carries a comment that `calculatedStats` is EV-formula and is bypassed. `995d3cb` | Move to Done |
| VGC-293 | Compare page shows the base-form ability for Mega Evolutions | **LANDED** | `de242c3 "VGC-293: use a Mega's own ability for the compare page's defensive profile"`; `src/lib/utils/effective-typing.ts` is the single resolver | Move to Done. *Caveat:* PR #91 `b90cc48` states the **perf** half of an earlier VGC-293 attempt was cosmetic — that is a bundle issue (VGC-303 win 1), not the ability bug, which is genuinely fixed |
| VGC-294 | Parser drops Tera Type: Stellar | **LANDED** | `21fb0db "VGC-294: keep Tera Type: Stellar instead of silently dropping it"`, with `418be74` hardening the dex type boundary | Move to Done |
| VGC-295 | Explore keyset pagination can skip/duplicate rows | **LANDED** | `bab6c59 "VGC-295: carry (timestamp, id) in every Explore cursor"`; `src/lib/explore/chronological-cursor.ts` holds the cursor codec. **Also completed again on PR #91** (`f2a570b`, + `api/explore/__tests__/pagination-ties.test.ts`) | Move to Done **only if** the #91 completion is judged non-essential; otherwise keep In Review until #91 merges. Worth 10 minutes of a human's time — see duplication list |
| VGC-296 | Three measured bundle wins (~154 KB gz) | **ON-PR-91** | Win 1 only (`b90cc48`, `/compare` −76.5 KB gz). **Win 2 is lost work:** the ticket and VGC-303 both claim the de-motion landed in `70c86e3`/PR #82, which **does not exist** in 811 commits — `motion/react` is still statically imported at `ReportCard.tsx:4` and `MegaLandingContent.tsx:5`, and no `motion-free-imports.test.ts` exists on any branch. Win 3 (gate `MOVE_NAMES`) is not implemented anywhere | After #91 merges, **re-open as wins 2 + 3** rather than closing. Correct the ticket's "win 2 landed" claim |
| VGC-297 | Accessibility backlog + light-mode contrast design call | **NOT-FOUND** | Every named item still open: no `MotionConfig` anywhere in `src/` (`layout.tsx` has none — the ticket's "best value left" one-liner); `SpeedTierChart.tsx` has 2 `aria-pressed` against 12 toggles; `Navbar.tsx:635` is still `role="menu"` with no `menuitem`, no Escape; `PasteInput.tsx` has no `aria-describedby`/`aria-invalid`/focus ring. PR #91 touches `PasteInput.tsx` and `Navbar.tsx` but **only** swaps `text-white`→`text-accent-foreground` | Send back to Backlog. **Split out the `MotionConfig` one-liner as its own Quick-Win ticket** — it is the cheapest a11y win on the board |
| VGC-298 | Hidden structured data on /faq; llms-full.txt staleness | **UNCLEAR** | Item 2 is **done on main** (`public/llms-full.txt` now says M-A/M-B/M-C with M-C current, `:92` carries the correct 4-then-8 ladder and 66/32 budget, `:96` links `/tools/ev-to-sp`; `e19fcc3`). Item 1 is **still open**: `src/app/faq/page.tsx:3,109,142` emits `HowToSchema steps={SHARE_VGC_TEAM_HOW_TO_STEPS}` and that array is used nowhere in the rendered page (the page renders `FAQ_ITEMS` only) — the exact violation class VGC-317 removes from the homepage. Item 3 still open: `src/app/creator/[name]/page.tsx:3,57` still uses the deprecated `BreadcrumbJsonLd` alias. PR #91 `32c3dac` makes `items` required on `FAQPageJsonLd` but does **not** touch `/faq`'s HowTo | **Split.** Close item 2; keep items 1 + 3 as one small ticket in Todo. Item 1 carries the same Google manual-action risk VGC-317 was raised for |
| VGC-299 | Webhook catch-all hides crashes; detect-archetype mixed-scale | **NOT-FOUND** | Item 1: `api/webhooks/linear/route.ts` still ends `} catch { return NextResponse.json({ ok: true }); }` with **no** `console.error`. Item 2: `src/lib/analysis/detect-archetype.ts:87` still `pokemon.every((p) => …)` with the `evScale` switch at `:92`. Nothing on either branch | Send back to Backlog (P4). Item 2's real fix is VGC-291 + VGC-301, so sequence it behind them |
| VGC-300 | Clear 4 high-severity prod-reachable npm advisories | **ON-PR-91** | Partially pre-empted on main (`e291267` bumped zod to 4.6.6 and bounded one array) but the ticket's goal is unmet there, and the four named packages (axios/sharp/undici/joi) appear in **neither** `dependencies` nor `devDependencies` — they are transitive, and the ticket's premise is partly wrong. PR #91 `b49e0c6` + `e6a60cb` instead find the real exposure (one zod advisory fanned across 4 nested `@vercel/cli-config` nodes), add a `"zod": "^4.6.6"` override, bound four more share-schema arrays, and report `npm audit --omit=dev` production HIGHs **4 → 0**. PR #92 adds nothing here. Main's `637989f` (credited by the prior reconciliation) is a swarm *report* | Keep In Review until #91 merges, then **re-verify with `npm audit --omit=dev` yourself** — the fix does not match the ticket's named packages |
| VGC-302 | shares.created_at has no index | **NOT-FOUND** | Confirmed by reading every index on main: `src/lib/db.ts:40,44,126,130,202,229,262` — there is `idx_shares_updated_at` and `idx_shares_public_updated`, and **nothing on `created_at`**. PR #91's only `db.ts` change is the `creator_profiles.user_id` column | Send back to Todo. Needs a `DATABASE_URL` and `EXPLAIN (ANALYZE, BUFFERS)` — genuinely blocked on a human, and check `pg_total_relation_size` first (512 MB Neon tier) |
| VGC-303 | Bundle wins 1 and 3 from VGC-296 | **ON-PR-91** | Win 1 is `b90cc48` on #91 (`/compare` dynamic import + BFS guard test). Win 3 (gate `MOVE_NAMES` on non-English) is on no branch — `src/lib/utils/translate-move.ts:3` still statically imports it | Keep In Review until #91 merges, then **re-scope to win 3 only** |
| VGC-315 | Dark mode primary CTA fails WCAG AA (67 instances) | **ON-PR-91** | Absent on main: `--accent-contrast` appears only inside the audit report `.swarm/r8-accessibility-26-10-26.md`, never in `src/`; `bg-accent … text-white` still across ~30 files. PR #91 `2d0806e` introduces the token (as `--accent-foreground`) and swaps the call sites | Keep In Review until #91 merges. The ticket says this needs **one human pass over the rendered pages** — do that during review, not after |
| VGC-316 | globals.css declares no @custom-variant dark | **ON-PR-91** | Absent on main: `src/app/globals.css:3-4` declares only `creator` and `presenting` variants — no `dark`. PR #91 `2d0806e` wires it to `[data-dark-mode]` | Keep In Review until #91 merges. **Blast radius is 132 utilities across 28 files** — this is the change most needing eyes on a browser before merge |
| VGC-317 | Homepage/navbar server-render nothing; invalid FAQPage JSON-LD | **ON-PR-91** | Still present on main: `src/components/home/HomePageServer.tsx:36-37` emits `FAQPageJsonLd` + `HowToSchema` while `:38` wraps the body in `<Suspense fallback="Loading team builder...">`, and `PersistentNavbar.tsx:1` is `"use client"`. PR #91 `32c3dac` removes both schemas from the homepage and all 81 mega pages (schema now only on `/faq` + `/tools/ev-to-sp`), makes `items` a required prop, and noindexes `/feedback` | Keep In Review until #91 merges. Note #91 shipped only the **schema-removal half** — the "server-render the homepage prose and the navbar" half is **not done**, so re-open that part after merge |

---

## Move to Done now — LANDED (39)

Verified present in the code on `origin/main`. Nothing blocks closing these.

VGC-38, VGC-40, VGC-41, VGC-43, VGC-48, VGC-50, VGC-129, VGC-158, VGC-162, VGC-187,
VGC-200, VGC-207, VGC-219, VGC-225, VGC-232, VGC-242, VGC-243, VGC-245, VGC-246,
VGC-247, VGC-251, VGC-254, VGC-256, VGC-257, VGC-258, VGC-259, VGC-260, VGC-261,
VGC-262, VGC-264, VGC-266, VGC-267, VGC-272, VGC-274, VGC-288, VGC-292, VGC-293,
VGC-294, VGC-295

Three carry a caveat worth 10 minutes before closing: **VGC-232** (sprite substitution
done, `/api/sprite` routing not), **VGC-295** (main's fix is completed again on #91), and
**VGC-246** (a *new* og:image privacy gap, fixed only on #91, deserves its own P0).

## Unblocked by merging PR #91 (`swarm-nightly-2026-11-02`, 21 commits)

| Ticket | What #91 delivers | Caveat |
|---|---|---|
| VGC-253 | `creator_profiles.user_id` + migration + ownership test | Migration — check Neon storage before merging |
| VGC-271 | `/compare` dex chain made dynamic; guard test becomes a real import-graph walk | Server/SSG path keeps the static import by design |
| VGC-296 | Win 1 only | Re-open for wins 2 + 3 (win 2 is lost work) |
| VGC-300 | zod override hoists the nested pinned copy; prod HIGHs 4→0; `@pkmn/dex` → devDeps | Fix does not match the ticket's named packages — re-verify |
| VGC-303 | Win 1 only | Re-scope to win 3 after merge |
| VGC-315 | `--accent-foreground` token + `text-white` swap across the call sites | Needs a human browser pass during review |
| VGC-316 | `@custom-variant dark (&:where([data-dark-mode], …))` | 132 utilities in 28 files start applying at once |
| VGC-317 | Invalid FAQPage/HowTo removed from 82 URLs; `items` required; `/feedback` noindex | Only the schema half — homepage/navbar SSR still open |

#91 also carries five fixes with **no ticket at all**: the og:image privacy revoke
(`d0b0ac9`, a P0 by its own description), the share-baseline phantom conflict
(`fc173e2`), SSE sync normalisation (`004a8be`), the Redis-blip welcome email
(`5a201e3`), and coverage-chart memoisation (`e2c4f90`). **These are the strongest
argument for merging #91** and they are invisible on the board.

## Unblocked by merging PR #92 (`swarm-nightly-2026-11-09`, 5 commits)

| Ticket | What #92 delivers |
|---|---|
| VGC-291 | `statForm?: "ev" \| "sp"` on `ParsedPokemon` + optional `parseShowdownPaste(paste, { regulation })`, behaviour-neutral (`75dbf32`) |

That is the **entire** functional payload of #92. Its other four commits are a
comment-only tsconfig re-measurement (VGC-261, already landed in August), a dead-export
deletion, `.swarm/` notes, and a changelog entry. **#92 is almost all documentation and
should merge in minutes**; VGC-291 is the only thing gated behind it.

## Status is wrong — send back to Backlog/Todo (10 NOT-FOUND)

No implementation on `origin/main`, on PR #91, on PR #92, or on any other `origin/*`
branch. These have been sitting in In Review with nothing behind them.

| Ticket | Priority | Where to send it |
|---|---|---|
| VGC-275 | Urgent | **Todo** — highest-value open SEO work; absorb VGC-228 into it |
| VGC-181 | High | **Backlog** — live prod content still reading "TBD" ×8; re-prioritise, don't close |
| VGC-302 | High | **Todo** — blocked on a human with `DATABASE_URL` + `EXPLAIN` |
| VGC-268 | High | **Backlog** — measurements still valid |
| VGC-269 | High | **Backlog** — would have caught VGC-256 and VGC-257 before they shipped |
| VGC-270 | Medium | **Todo** — one-line fix, last open item of the VGC-219 family |
| VGC-297 | Medium | **Backlog** — split the `MotionConfig` one-liner out as a Quick-Win |
| VGC-228 | Medium | **Backlog** or merge into VGC-275 |
| VGC-224 | Medium | **Backlog** — product decision (Option A or B), not implementation |
| VGC-299 | Low | **Backlog** — sequence item 2 behind VGC-291/VGC-301 |

## Needs a human call — UNCLEAR (3)

| Ticket | Why | Evidence that would settle it |
|---|---|---|
| VGC-64 | Only the sitemap half has a repository footprint (present). GSC verification, crawl errors, Core Web Vitals and query monitoring are console actions; `no-claude` label | A Search Console screenshot or export. Then close the code half and make the monitoring half recurring |
| VGC-273 | 7-item grouped chore: items 1 + 2 landed on main, item 7 on #91, items 3–6 open | Nothing — **split the ticket**. It cannot be in one state |
| VGC-298 | 3-item ticket: item 2 landed on main, items 1 + 3 open | Nothing — **split it**. Item 1 carries real manual-action risk |

## Duplicated work: described fix on `main` AND re-implemented on an open PR (5)

| Ticket | On `main` | Re-done on | Is it genuinely redundant? |
|---|---|---|---|
| VGC-295 | `bab6c59` (cursor carries `(timestamp, id)`) | #91 `f2a570b` + `pagination-ties.test.ts` | **Partly.** #91 calls main's version incomplete for tied rows. Needs a human read of both diffs |
| VGC-251 | `b5712a6`, `b14c717` | #91 `8ea894b` | **No** — #91 narrows `isSpFormSpread` to fix a *mirror* bug main's fix introduced. Deserves its own ticket |
| VGC-243 | `cfcbd2f`, `886119a` | #91 `87503db` | **No** — different bug (Mega's own *ability* vs base stats). Deserves its own ticket |
| VGC-261 | `bdbbfac` (flags on since August) | #92 `cc6f207` | **Yes, fully.** #92 changes only a comment. A third audit re-measured a ticket complete for 3 months |
| VGC-300 | `e291267` (zod 4.6.6 + 1 array bound) | #91 `b49e0c6`, `e6a60cb` | **Partly** — #91 finds a different, real exposure (nested pinned zod) main's bump missed |

Two further cases are **follow-ups, not duplicates**, and should become new tickets rather
than be folded into the originals: VGC-253 (main's `66854cf` is the 409 guard the ticket
itself calls a mitigation; #91 has the schema fix) and VGC-246 (#91's `d0b0ac9` closes a
privacy gap *created* by `e4d9354`, after the ticket shipped).

## Other branches

`git fetch --unshallow` surfaced one branch not previously fetched:
**`origin/ccr-643ddaf1-yj2dyf`** — a single commit ahead of main,
`2f4ec31 "fix: harden Discord webhook handling after a compromised webhook"`. It maps to
no In Review ticket (closest is VGC-305, which is in Backlog), so no ticket is bucketed
ON-OTHER-BRANCH. **Worth a look on its own merits** — it is security work sitting on an
unreferenced branch with no PR. `origin/claude/loving-sagan-35mnyp` and
`origin/swarm-nightly-2026-11-16` are both identical to `origin/main`
(`git log origin/main..<branch>` is empty).

## The bottleneck

**Merge throughput, decisively — but the board's own bookkeeping is the larger problem.**

Of 61 In Review tickets, **39 (64%) are already live on `main`** and could be closed
today without touching a line of code. Only **9** are actually gated on an unmerged
branch, and 8 of those on a single PR. Meanwhile **10 (16%) have no implementation
anywhere** and have been masquerading as finished work.

VGC-265's diagnosis ("the constraint is merge throughput, not implementation capacity")
is right in direction and stale in magnitude: there are **two** unmerged branches, not
~30, and one of them (#92) is almost entirely documentation. The real cost is not the
queue depth — it is that **In Review has stopped carrying information**. Three successive
nightly runs re-audited and re-filed work that was already on `main` (VGC-261 is the
clearest case: complete since August, re-measured in November), and at least one genuine
fix was **lost** rather than duplicated (VGC-296 win 2 claims a commit, `70c86e3`, that
exists in no branch of this repository).

The highest-leverage action is not merging — it is the 39-ticket close, which restores the
signal, frees the Linear free-plan `activeIssueCount` cap that PR #91 reported hitting,
and stops the next run paying for a fourth re-audit. Merge #92 immediately (five minutes,
unblocks VGC-291, almost no risk surface). Merge #91 next, but review it properly: it
carries two wide visual changes (VGC-315/316, 132 utilities across 28 files) that its own
author says need a human with a browser, a DB migration against a 512 MB tier, and five
real fixes that no ticket on the board describes.

---

*Note on concurrency:* during this analysis a sibling agent committed two `.swarm/`-only
commits to the local `swarm-nightly-2026-11-16` branch (`f0ab1cc`, `95fa4c6`) and left
uncommitted edits to ~10 `src/` files in the shared working tree. Neither affects any
bucket here: every bucket is defined by the tree at an `origin/*` ref, and `origin/main`
was `10dfd74` at both the start and the end of the run. Uncommitted work in progress is
not "where the code lives" for board purposes.

*Produced read-only by agent B1, 16 Nov 2026. No Linear issue was modified. Buckets rest
on code present in the tree at `origin/main`, `origin/swarm-nightly-2026-11-02` and
`origin/swarm-nightly-2026-11-09`; commit SHAs are corroboration only. Where this report
disagrees with a ticket description or with
`.swarm/linear-pending-09-11-26.md`, the disagreement is stated and the code evidence is
cited.*

---

# ORCHESTRATOR CORRECTION — 16 Nov 2026

I spot-checked the LANDED bucket rather than relaying it as given. One entry is **wrong**, and it
matters because the recommended action was "close it".

## VGC-295 is NOT landed — remove it from the close-immediately list

`src/lib/explore/chronological-cursor.ts` opens with, in capitals:

> **VGC-295 IS ONLY HALF-FIXED. DO NOT ASSUME THE BUG IS GONE.**

and goes on to explain that `src/app/api/explore/route.ts` still compares a millisecond-truncated
timestamp in its `WHERE` clause while `ORDER BY` sorts the raw column, so filter order and sort
order disagree on ties — with the `popular` and `views` branches worse still.

Independently confirmed: `parseMetricCursor` and `serializeMetricCursor` have **zero callers**
outside their own module on main. The cursor codec exists but nothing uses it. C1's dead-code scan
found the same thing from the opposite direction and correctly flagged the module as deliberate
scaffolding for an **open** ticket.

So `bab6c59` landed the codec, not the fix. PR #91's `f2a570b` is the actual completion, with a
`pagination-ties.test.ts` regression test. **VGC-295 should stay open until #91 merges.**

## Revised count

**38 In Review tickets are closeable on sight, not 39.** Remove VGC-295; it belongs in ON-PR-91,
which becomes 9.

## Treat the rest of the list as high-confidence but not audited

VGC-295 was caught because its own source file shouts the warning. The other 38 rows carry
file:line evidence that I sampled (VGC-262, VGC-288, VGC-292 verified sound), but I did not verify
all 38 individually. Three rows already carry explicit caveats from B1 and should be read before
closing:

- **VGC-232** — the user-facing sprite-fallback half is done; the "route every sprite through
  `/api/sprite`" half is not.
- **VGC-273, VGC-298** — grouped tickets, only partly landed. They need splitting, not closing.
- **VGC-243, VGC-251** — landed on main AND re-touched on #91, where the #91 change is a
  *genuinely different* bug. Closing the ticket would lose that follow-up; each needs its own.

## Also worth the human's attention

B1 ran `git fetch --unshallow` (60 → 811 commits) and found that several SHAs cited in ticket
descriptions (`70c86e3`, `24dbf5d`, and PR #82) **exist in no branch at all**. That makes
**VGC-296's second acceptance criterion lost work, not landed work** — it was implemented, cited,
and then the commit disappeared. Worth understanding how, because it means at least one past
"done" claim on this board was never real.

And #91 carries **5 fixes with no ticket**, including the P0 og:image privacy revoke (`d0b0ac9`).
Those should get tickets before #91 merges, or the work becomes invisible to the board the moment
it lands.
