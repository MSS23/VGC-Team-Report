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
