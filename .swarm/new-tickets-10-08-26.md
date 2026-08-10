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
