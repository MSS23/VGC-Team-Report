# Claimed-files manifest — run of 05 Oct 2026

Union of `files_changed` from every Wave 2 agent that reported, plus the orchestrator's
own inline edits. Anything modified in the tree and NOT listed here is unclaimed and was
stashed (see `.swarm/conflicts.md`).

## W2 — team-graphic private-report leak (P0)
- src/app/api/team-graphic/route.tsx
- src/app/api/team-graphic/__tests__/route.test.ts

## W4 — share visibility authz
- src/app/api/share/route.ts
- src/app/api/share/[id]/route.ts
- src/app/api/share/__tests__/route.test.ts
- src/app/api/share/__tests__/fork-lineage.test.ts

## W1 — Mega-aware effective typing
- src/lib/utils/effective-typing.ts
- src/lib/utils/__tests__/effective-typing.test.ts
- src/components/report/TeamReport.tsx
- src/components/report/DefensiveCoverageChart.tsx
- src/components/report/OffensiveCoverageChart.tsx

## W3 — three shipped-bug fixes
- src/components/report/SpeedTierChart.tsx
- src/hooks/useHomePage.ts
- src/lib/analysis/__tests__/detect-archetype.test.ts

## W5 — SEO
- src/app/page.tsx
- src/components/seo/JsonLd.tsx
- src/app/champions/[pokemon]/page.tsx
- src/app/champions/[pokemon]/MegaLandingContent.tsx
- src/app/sitemap.ts
- src/app/tools/ev-to-sp/page.tsx
- public/llms.txt

## W6 — keyboard accessibility (agent had not returned its report at commit time;
## files confirmed present in the tree and covered by the green gate)
- src/components/report/MatchupPlanSlide.tsx
- src/components/report/SlideNavControls.tsx
- src/components/report/PokemonDetailSlide.tsx
- src/components/report/DefensiveCoverageChart.tsx (shared with W1)
- src/components/report/OffensiveCoverageChart.tsx (shared with W1)

## W7 — runtime validation gaps
- src/hooks/useShareUrl.ts
- src/lib/data/pkmn-dex-fallback.ts
- src/lib/sharing/__tests__/fetched-share-state.test.ts
- src/lib/data/__tests__/pkmn-dex-fallback.test.ts

## W8 — VGC domain-logic correctness (in flight at the time of the first commits)
- src/lib/analysis/stat-calculator.ts
- src/lib/validation/champions-legality.ts
- src/lib/data/natures.ts
- src/lib/utils/extract-species.ts
- src/app/tools/ev-to-sp/page.tsx (shared with W5)
- their adjacent `__tests__/`

## Orchestrator, inline
- public/file.svg, public/globe.svg, public/next.svg, public/vercel.svg, public/window.svg (deleted)
- src/lib/data/dex-subset.ts (dead `asPokemonTypes` + its now-unused import removed)
- src/app/api/explore/route.ts (fork-lineage `src.is_public` filter)
- src/hooks/__tests__/useTeamReport.test.ts (explicit `vi.waitFor` timeouts)
- src/app/changelog/data.ts (this run's changelog entry)
- .swarm/** (reports, drafts, logs)
