# New Linear tickets to file from this run's research

## From R6 (SEO audit, `.swarm/r6-seo-10-08-26.md`)

1. **[SEO] `public/llms.txt` teaches AI crawlers the wrong SP definition** — P1/Urgent.
   `llms.txt` defines SP as "Standard Points, 1 SP = 1 EV". Both halves are wrong: it is
   **Stat Points**, and the real cost curve is 4 EVs for the first SP then 8 EVs thereafter,
   against a 66-total / 32-per-stat budget. This file is served specifically to allowlisted AI
   crawlers, so it is actively mis-teaching the exact query VGC-262's converter page targets.
   NOTE: VGC-262's description claims the 03-08 run already fixed this — that fix is sitting on an
   unmerged branch, so `main` is still wrong. Evidence that unmerged branches are causing the same
   defect to be rediscovered run after run.

2. **[SEO] `robots.txt` per-bot groups override the wildcard, un-blocking `/api/` for six named crawlers** — P2.
   In robots.txt semantics a named user-agent group fully replaces the `*` group rather than
   inheriting from it. Six named crawlers therefore do not inherit the `Disallow: /api/` rule.

3. **[SEO] `/compare` is `noindex` but is still emitted in the sitemap** — P3.
   Contradictory signals; either drop it from the sitemap or make it indexable.

## From the orchestrator (board-level, not code)

4. **[PROCESS] ~30 unmerged `swarm-nightly-*` branches and 10 tickets stuck In Review** — P1.
   PR #72 has been open since 03 Aug. `src/app/changelog/data.ts:70` reads "8th consecutive fix
   proposal — please merge!". Nightly runs keep rediscovering and re-fixing defects that were
   already fixed on branches that never landed (the llms.txt SP definition above is a concrete
   instance). The bottleneck is review/merge throughput, not implementation. Worth deciding either
   to merge the backlog or to stop the nightly runs until it is drained.

(Further entries appended as Wave 1 agents report.)

## From C1 (dead-code scan, `.swarm/c1-dead-code-10-08-26.md`)

5. **[Security] Stale `/api/builder/` CORS exemption in `proxy.ts:87` for a route that no longer exists** — P2.
   A pre-authorised CORS hole pointing at a deleted route. Nothing legitimate uses it, so it is
   pure attack surface. (Held tonight pending C4's independent security review of the same file to
   avoid two agents editing `proxy.ts` in parallel.)

6. **[Chore] `isRateLimited` is production-dead but is the only coverage of the in-memory window logic** — P3.
   All callers use the async variant. C1 explicitly recommends retargeting the test onto the async
   path BEFORE deleting the sync function, rather than deleting both and losing the coverage.

7. **[Chore] `@pkmn/dex` sits in `dependencies` with no runtime import in `src/`** — P3.
   Build-script only (~1.8MB). Likely belongs in `devDependencies`. Needs a human to confirm the
   build scripts still resolve it in Vercel's install before moving it.

### C1 findings actioned tonight
Three files are dead with verified zero import sites (~355 lines): `DisplayTogglePill.tsx`,
`useGlobalDisplayPrefs.ts`, `ConsentGate.tsx`.

**Sequencing hazard noted:** `ConsentGate.tsx` cannot be deleted until the VGC-254 privacy agent
reports. VGC-254's ticket explicitly floats "wrapping `<PostHogProvider>` in `<ConsentGate>`" as a
possible change — so that component may be about to become live again. Deleting it in parallel
would break that agent's work. Deletion is therefore gated on VGC-254's returned file list.

### C1 findings deliberately NOT actioned
De-exporting the 39 internally-used-but-exported symbols. Zero bytes saved, and it is exactly the
drive-by refactor CLAUDE.md forbids. C1 recommended against it too.

## From C5 (commit review, `.swarm/c5-commit-review-10-08-26.md`) — HIGHEST-VALUE FINDING OF THE RUN

8. **[Bug] `convertToChampionsSp` still fabricates SP and the over-budget trim always sacrifices HP first** — P1/Urgent.
   Commit `b5712a6` ("stop fabricating 32 HP / 32 Atk SP") fixed only half the bug. C5 simulated the
   SHIPPED function:
   - `252 HP / 4 Def` still yields **32 HP / 32 Def**
   - `252 / 252 / 252` yields **2 HP / 32 Atk / 32 Def**, because the over-budget trim is biased by
     the hardcoded stat-array order, so HP is always the stat sacrificed first.

   Worse, **the regression tests added alongside that commit pass on every one of those wrong
   outputs**: the key test picks the one input where padding is structurally impossible, and asserts
   `spd >= 1` where the true value is 2. So the suite is green and the behaviour is wrong — the tests
   are not merely absent, they are actively misleading.

   Blast radius: SP is derived at RENDER time, so this retroactively changes what already-shared
   reports and speed tiers display. It shipped with no changelog entry. This is the exact class of
   change CLAUDE.md's conventions single out as needing care, on the exact module they name as most
   correctness-sensitive (66 total / 32 per stat).

9. **[Bug] `keepalive: true` applied to ALL draft saves, not just the exit flush** — P2.
   The browser caps `keepalive` request bodies at 64 KiB. Large reports can therefore silently fail
   to autosave. It should be scoped to the exit/unload flush only.

10. **[Chore] CI lint made non-blocking with 35 outstanding errors and no tracking ticket** — P2.
    `.github/workflows/ci.yml`. Also carries a stray `# ponytail:` token in the comment. Non-blocking
    lint with no ticket is how 35 errors becomes 200.

11. **[Bug] `fe70914` silently reverted `83d195a`'s sitemap `lastModified` work** — P3.
    A revert with no explanation; the sitemap lost its per-route `lastModified` values.

### Sequencing
The SP fix (#8) CANNOT be dispatched yet — the VGC-262 converter-page agent is editing
`src/lib/analysis/stat-calculator.ts` and its test file right now. A dedicated fix agent goes out the
moment VGC-262 returns. This also makes VGC-262 a good thing to have run first: the converter page is
UI over exactly this function, so it must not ship on top of a broken conversion.

## From R8 (accessibility audit, `.swarm/r8-a11y-10-08-26.md`)

12. **[a11y] Edit-mode `TeamOverview` (`:527-656`) has no `<h1>`** — P3.
    The one item genuinely still open from the VGC-219 family. Not fixed tonight because
    `TeamOverview.tsx` was owned by the VGC-260 agent under the file-overlap rule.

13. **[a11y] Five further High findings** — P2, worth one ticket each or one grouped ticket:
    mobile tab bar semantics, gen-theme accent contrast, tertiary-opacity text below 4.5:1,
    and a button nested inside an anchor. All touch files owned by other agents tonight.

### VGC-219 should be CLOSED, not re-implemented
R8 REFUTED both parts of VGC-219 (currently sitting In Review):
- The no-name `h1` fallback already exists at `TeamOverview.tsx:417-421` (commit `595f2eb`), plus
  `s/[id]/redirect.tsx:18`. R8 checked the `hasTournamentInfo` guard at `:380` and found no gap.
- The Export Theme modal already has a full focus trap, Escape handling, and focus restore
  (`page.tsx:396-437`), with `aria-modal`/`aria-labelledby` at `:1651-1653` (commit `d706f71`).
A comment recording this goes on the ticket; the human can close it after merging.

## From C2 (TypeScript audit, `.swarm/c2-typescript-10-08-26.md`)

14. **[Chore] `linearQuery` is duplicated in `lib/linear.ts` and `api/discord/route.ts`** — P3.
    Both return `any` across 11 call sites. Deferred tonight purely on file-overlap risk
    (`api/discord/route.ts` is security-adjacent and near another agent's work).

15. **[Chore] Implicit `any` from 40 `.json()` call sites** — P2.
    There is ZERO explicit `any` and zero `@ts-ignore` in `src/` — the real exposure is untyped
    `.json()`. Four are unvalidated INBOUND parses, worst being the PostHog webhook. Eleven are
    outbound `return res.json()`. Worth a zod boundary on the four inbound ones.

16. **[Chore] Two exported `src/lib` functions infer `Promise<any>`** — P3.
    `email.ts:32` and `discord-bot.ts:60`. Ten exported lib functions lack explicit return types,
    but only these two actually degrade to `any`.

### VGC-261 was CONSERVATIVE, not wrong
C2 measured every flag by extending the real tsconfig from /tmp (baseline 0 errors). SIX flags are
clean, not four: the ticket's four plus `noUncheckedSideEffectImports` and `verbatimModuleSyntax`.
`verbatimModuleSyntax` is deliberately NOT being enabled — it changes EMIT, which is a different
risk class from a pure type-check flag and must not ride along in a "free wins" commit.
Also: the ticket lists `useUnknownInCatchVariables` and `strictFunctionTypes` as near-misses, but
`strict: true` already enables both — they are not separate wins.

17. **[a11y] Edit-mode slide 0 still renders zero `<h1>`** — P3. (Supersedes item 12 with the exact cause.)
    `TeamOverview.tsx` gates BOTH its h1s on `isReadOnly` (`:418` and the `:424` ternary), so in
    creator/edit mode there is no h1 at all on slide 0. VGC-259's fix guards on `physicalSlide !== 0`
    and so deliberately skips it. Fix is to drop the `isReadOnly` guard on the `:418` fallback.
    Not done tonight because `TeamOverview.tsx` was owned by the VGC-260 agent.

## From C3 (bundle audit, `.swarm/c3-perf-10-08-26.md`)

18. **[Perf] `motion` is eagerly bundled on 7 routes (37.8 kB gzip)** — P2, UNTICKETED.
19. **[Perf] `move-names.ts` is eagerly bundled on `/` (45.8 kB gzip)** — P2, UNTICKETED.
    (A previous run's changelog claims a move-names win already shipped — another instance of a fix
    sitting on an unmerged branch while `main` still carries the cost.)

20. **[Tooling] Next 16 + Turbopack no longer prints a First Load JS size table** — P3.
    The build output shows only Route/Revalidate/Expire. C3 had to derive every size by parsing
    `<script src>` out of prerendered HTML and sizing chunks, then confirm causes with differential
    builds from clean `git archive HEAD` trees. Worth a scripted bundle-size check in CI, otherwise
    bundle regressions are now invisible.

### Both perf tickets are CONFIRMED and UNDERSTATED

**VGC-256** — measured **−264.9 kB raw / −62.8 kB gzip**, vs the ticket's 223.9 / 50.4.
Exactly ONE load-bearing edge: `useShareUrl.ts:9` imports the VALUE `decodeShareState`; all seven
other client importers are `import type` and erase. C3 warns explicitly NOT to estimate this with
rolldown — rolldown said 64 kB, but Turbopack tree-shakes zod v4 roughly 4× worse.

**VGC-257** — the 330.3 kB figure matches exactly, but there are **TWO copies** (`/` and `/compare`)
reached by **two independent eager chains**:
- `page.tsx:61 → mega-detect → pkmn-dex-fallback → dex-subset.json`
- `page.tsx:11 → TeamReport → PokemonCard → lib/data/pokemon → same`
Both must be fixed or the win is halved. Measured **−323.7 kB raw / −43.7 kB gzip on `/`, plus the
same again on `/compare`**.
C3's lowest-risk fix: re-emit as array-of-arrays (323.7 → 137.9 kB raw, no API change), with full
lazy-loading as a follow-up. **Explicit warning: do NOT prune by `isNonstandard` — 49 of 98 Megas
are `Future`** and would be silently dropped.

Combined, the homepage goes 598.9 → 492.4 kB gzip (−17.8%).

Confirmed already correct, no action: `@pkmn/dex`, `jspdf`, `html2canvas-pro`, `posthog-js`,
`qrcode` are all lazy or server-only.

21. **[Security] Three routes still parse `x-forwarded-for` left-most directly** — P1/High.
    `src/app/api/share/route.ts:86`, `src/app/api/share/[id]/fork/route.ts:138`,
    `src/app/api/explore/route.ts:20`. Tonight's SWARM-SEC fix hardened the shared `getClientIp`
    helper, but these three bypass it with their own `.split(',')[0]`, so they remain spoofable.
    **The security fix is not complete until these are switched to `getClientIp`.**

22. **[Security] `Access-Control-Allow-Credentials: true` on the CORS config** — P3.
    Left as-is tonight (out of scope). Worth a deliberate decision now that the origin allowlist is
    tight: with credentials enabled, any future widening of the allowlist is far more dangerous.
