# Board reconciliation — In Review tickets vs. git reality (21-09-26)

VGC-265 recon. **Read-only**: no commits, no pushes, no Linear mutations.

Linear query: team `06531926-0387-4a3e-8325-8b7be754ced5`, state `In Review`
(`89e58e68-05e3-4dc9-a0e8-20344f1b1a00`) → **32 issues**.

## Key structural finding

`bdbbfac` on `origin/main` — *"swarm: nightly improvements 10-08-26 (#73)"* — is a
**squash merge** (single parent `a70d924`) of the `swarm-nightly-2026-08-10` branch.
The branch is therefore **not** an ancestor of main, so `git merge-base --is-ancestor`
and `git branch -r --contains` both report "not on main" for all 23 of its commits —
but **the code is on main**. Every ticket in that batch was verified at file level on
`origin/main`, not by commit graph. This is the single biggest source of the
"swarm re-fixes already-fixed bugs" problem in VGC-265.

Second source: **three tickets were fixed on main under commit subjects that never
name the ticket id** (VGC-271, VGC-245, VGC-242), so an id-grep finds nothing on main
and the bug looks open.

Third source: two nightly commits carry **swapped ticket ids** — `6d32c475`
("VGC-243: stop Manage Access panel from flashing") actually implements **VGC-242**,
and `886119a9` ("VGC-242: speed tiers now reflect Mega base stats") actually
implements **VGC-243**.

## Branch → PR map used

| Branch | PR | Tip |
|---|---|---|
| `claude/loving-sagan-8ryraw` | #78 | 2026-09-14 |
| `claude/loving-sagan-12996k` | #77 | 2026-09-07 |
| `claude/loving-sagan-ib785e` | #76 | 2026-08-31 |
| `claude/loving-sagan-zs6xpl` | #75 | 2026-08-24 |
| `claude/loving-sagan-853anq` | #74 | 2026-08-17 |
| `claude/loving-sagan-t7immy` | #72 | 2026-08-03 |

`origin/claude/loving-sagan-sp9n85` is fully merged into main (0 ahead). All 23
`swarm-nightly-*` branches, `claude-dev`, `claude/gallant-bohr-nycyuh`,
`claude/optimistic-cerf-jmez32`, `claude/VGC-229…`, `claude/VGC-234…`,
`claude/VGC-235…` and `claude/cleanup-dead-exports-dock-selectors` are unmerged and
have no open PR — but **no In Review ticket depends solely on any of them**.

## Findings

| Ticket | Title (short) | Bucket | Evidence (sha / branch / PR) |
|---|---|---|---|
| VGC-275 | /s/[id] serves a client redirect, thin content | B | `b7000d7d` on `claude/loving-sagan-zs6xpl` = **PR #75**. main still has `src/app/s/[id]/redirect.tsx` + `ShareRedirectClient` |
| VGC-274 | CORS Allow-Credentials + webhook replay protection | A | `a099f97` on main |
| VGC-273 | Grouped cleanup (lint ratchet, linearQuery dup, zod) | B | `5c72239c` on `853anq` = **PR #74**. main still has a private `linearQuery` in `api/discord/route.ts:23` and `ci.yml` lint `continue-on-error: true` |
| VGC-272 | robots.txt per-bot groups; /compare noindex+sitemapped | A | `164fb87` on main |
| VGC-271 | Lazy-load the dex-subset fallback | A | **`415a281`** on main, "perf: homepage no longer ships the Pokemon data tables on first paint" — body names `dex-subset.json` and the three eager paths; tripwire `src/lib/__tests__/homepage-eager-imports.test.ts` asserts the homepage entry cannot reach `@/lib/data/dex-subset`. (Duplicate unmerged impl: `9b67a902`, PR #74) |
| VGC-270 | Edit-mode slide 0 renders no h1 | B | `1048ba49` on `ib785e` = **PR #76**, and `29fb8c4f` on `853anq` = **PR #74**. main `TeamOverview.tsx:419/432` still gates both h1s on `isReadOnly` |
| VGC-269 | No bundle-size visibility since Next 16 + Turbopack | B | `1eb5a353` on `853anq` = **PR #74**. No bundle/budget script in main `package.json` |
| VGC-268 | motion eager on 7 routes, move-names eager on / | B | `1640c653` on `853anq` = **PR #74**. main still has 12 static `import { motion } from "motion/react"` sites |
| VGC-267 | keepalive:true on all draft saves | A | `9897389` on main |
| VGC-266 | llms.txt wrong SP definition | A | `1db8419` on main. (Follow-up for `llms-full.txt`: `a7f1fd61`, PR #78 — separate gap, not this ticket) |
| VGC-264 | Three API routes parse x-forwarded-for left-most | A | `b865fa2` (regression test) + `d44b93a` on main |
| VGC-262 | Standalone EV→SP converter page | A | squash `bdbbfac`; `src/app/tools/ev-to-sp/page.tsx` + `EvToSpConverter.tsx` on main |
| VGC-261 | Enable 4 strict TS flags | A | squash `bdbbfac`; main `tsconfig.json` has all five: noImplicitOverride, noFallthroughCasesInSwitch, noUncheckedSideEffectImports, allowUnreachableCode:false, allowUnusedLabels:false |
| VGC-260 | version-diff emits pokemon:\<index\> | A | squash `bdbbfac`; `encodeSectionKey`/`parseSectionKey` in `src/lib/utils/version-diff.ts` + 2 UI call sites on main |
| VGC-259 | No \<h1\> on any slide except the first | A | squash `bdbbfac`; sr-only h1 at `src/app/page.tsx:1170`, guarded on `(tournamentMode \|\| physicalSlide !== 0)` |
| VGC-258 | /champions grid missing the 14 Reg M-B megas | A | squash `bdbbfac`; `getRegMBMegas` used in `champions/page.tsx`, `champions/[pokemon]/page.tsx`, `ChampionsContent.tsx`, `sitemap.ts` on main |
| VGC-257 | dex-subset.json eagerly bundled into homepage | A | squash `bdbbfac`; schemaVersion-2 positional re-encode on main. Shipped *partial* by design (acceptance criterion 2 was deferred to VGC-271 — which is also now on main) |
| VGC-256 | Lazy-load zod out of the client bundle | A | squash `bdbbfac`; `src/lib/sharing/url-codec.schemas.ts` on main |
| VGC-254 | Privacy policy doesn't disclose Microsoft Clarity | A | squash `bdbbfac`; `ClarityProvider.tsx` imports `hasAnalyticsConsent`/`onConsentChange`, `privacy/page.tsx` names Clarity. (Flagged for human legal review in the original commit) |
| VGC-251 | Champions Paste Not Working | A | squash `bdbbfac`; `stat-calculator.ts:227` "There is deliberately NO padding step" + largest-remainder trim. (Duplicate unmerged impl: `7f5ed7c7`, PR #72) |
| VGC-247 | Update PostHog SDKs | **D** | Zero commits mention it on any ref. `posthog-js ^1.392.0` / `posthog-node ^5.38.2` identical on main and all six PR branches |
| VGC-246 | Enforce true private reports + visibility hardening | B | `033ddbba` on `zs6xpl` = **PR #75** (team-graphic rendered Private reports as PNGs). main `api/team-graphic/route.ts` still has **no** visibility predicate and no `redactPasteFields` — the bypass is live |
| VGC-245 | Modes section not saving | A | **`44f780c`** on main, "fix: allowComments and commonModes.combinations were silently dropped on every save"; `api/share/route.ts:26` now carries `commonModes`. (Duplicate unmerged impl: `83e7b16a`, PR #72) |
| VGC-243 | Speed tiers not adapting to Mega selection | A | `cfcbd2f` on main. (Duplicate unmerged impl, mislabelled VGC-242: `886119a9` on `swarm-nightly-2026-06-22`/`-06-29`) |
| VGC-242 | Manage Access panel visual flashes | A | **`0825946`** on main (2026-07-04): `CollaboratorPanel.tsx:37/70-74` has the fetch-once-per-open `fetchedRef` guard and `collaboratorsRef` decoupling of the debounced search timer — exactly the two defects described. (Duplicate unmerged impl, mislabelled VGC-243: `6d32c475` on `swarm-nightly-2026-06-22`/`-06-29`.) *Softest call in this table — verified at file level, not by commit subject.* |
| VGC-232 | Sprite-fallback CDN proxy | B | `203cf986` on `853anq` = **PR #74**. No `src/lib/utils/sprite-fallback.ts` on main |
| VGC-228 | Server-render /s/[id] without app shell | B | `b7000d7d` on `zs6xpl` = **PR #75** — body says "Closes VGC-228 too". Same blocker as VGC-275 |
| VGC-225 | PokePaste URL import | B | `ed63bd44` on `853anq` = **PR #74**. No `src/lib/utils/pokepaste-url.ts` on main (only the ~60% pre-existing proxy) |
| VGC-224 | Cypress: fix types or delete the tree | B | `2ceaa9ed` on `t7immy` = **PR #72**. main `tsconfig.json` still has `"exclude": ["node_modules", "cypress"]` |
| VGC-219 | Remaining a11y findings | A | `d706f71` on main; the 10-08-26 R8 audit (in `bdbbfac`) explicitly **REFUTED** the ticket — both parts already shipped |
| VGC-181 | Indianapolis Regionals top-cut table | B | `68a3d552` on `t7immy` = **PR #72**. main `src/data/indy-top-cut.ts` still ships `player: "TBD"` placeholder rows |
| VGC-64 | Google Search Console + sitemap optimization | A | `fe70914` on main |

## Summary

| Bucket | Count | Meaning |
|---|---|---|
| **A — merged to main** | **20** | Stale tickets. Human can close; swarm must NOT touch these. |
| **B — in an open draft PR** | **11** | Done, blocked on review/merge. Swarm must NOT re-implement — merge instead. |
| **C — orphan branch, no PR** | **0** | Nothing is stranded on a PR-less branch alone. |
| **D — no implementation found** | **1** | Genuinely open work. |
| **UNKNOWN** | **0** | |

### Bucket A (20) — close these
VGC-274, VGC-272, VGC-271, VGC-267, VGC-266, VGC-264, VGC-262, VGC-261, VGC-260,
VGC-259, VGC-258, VGC-257, VGC-256, VGC-254, VGC-251, VGC-245, VGC-243, VGC-242,
VGC-219, VGC-64

### Bucket B (11) — merge the PR, don't rebuild
- **PR #72** (`claude/loving-sagan-t7immy`): VGC-224, VGC-181
- **PR #74** (`claude/loving-sagan-853anq`): VGC-273, VGC-269, VGC-268, VGC-232, VGC-225, VGC-270*
- **PR #75** (`claude/loving-sagan-zs6xpl`): VGC-275, VGC-228, VGC-246
- **PR #76** (`claude/loving-sagan-ib785e`): VGC-270*

\* VGC-270 is implemented twice, in #74 and #76.

### Bucket D (1) — the ONLY genuinely unimplemented In Review ticket
- **VGC-247** — Update PostHog SDKs (clear Critical outdated-version alerts)

### Recommendation for tonight's swarm
The only In Review ticket safe to implement is **VGC-247**. Everything else is either
already on main (20) or sitting finished in an open draft PR (11). The highest-value
non-coding action is merging PRs #72/#74/#75/#76 — note **VGC-246's private-report
bypass in `api/team-graphic/route.ts` is a live security hole on production** whose fix
has been sitting unmerged since July (the `033ddbba` body records variants on
`swarm-nightly-2026-07-13`, `-07-27` and PR #72 as well).
