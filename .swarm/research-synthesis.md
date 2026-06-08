# Research Synthesis — 2026-06-08

## Top 5 highest-leverage opportunities (mostly NOT implemented tonight — file as backlog)

1. **C3 perf — switch `motion.*` → `m.*` + LazyMotion** (~100 KB gzipped saved). Codebase uses only `motion.div / .p / .button`, no `useScroll`/`useTransform`. Single largest available client-bundle win.

2. **C3 perf — lazy-load `@microsoft/clarity` and `vanilla-cookieconsent`** in useEffect bodies (~20 KB gzipped). Both currently static-imported in root layout.

3. **C3 perf — trim Sentry replay** (drop `replaysOnErrorSampleRate`, pass `integrations: []`). PostHog already captures exceptions. ~80 KB gzipped.

4. **C5 BL1 — Linear webhook: implement an actual handler or delete the route.** Eight nightly swarms in a row have "fixed" the env var / header name / status codes. The handler still echoes ok on every event. Either wire a dispatch or remove the route + revoke the webhook in Linear. Until this lands every C5-style audit will rediscover this as a "needs fixing" item.

5. **R6 SEO — `/explore` filter combination landing pages.** Filtered URLs now in the sitemap, but they lack distinct metadata. A per-filter `generateMetadata` route handler would let `/explore?species=Incineroar` rank for "Incineroar VGC team" — currently it inherits the generic Explore metadata.

## Top 5 quick wins implemented tonight

1. Sample-team save guard widened to cover Groudon + Kyogre samples (CT2)
2. Rate limits on `/api/discord` + `/api/share/[id]/collaborators` PATCH (C4 M5/M6)
3. InstallPrompt becomes a real accessible modal (R8 #1)
4. Crawlable footer + BreadcrumbList JSON-LD on `/s/[id]` — biggest SEO leverage move (R6 #5, #6)
5. SEO metadata trim + privacy/terms social embeds (R6 #1, #2)

## Backlog tickets to file (when Linear creds become available)

1. **[PERF] Switch motion.* → LazyMotion + m.*** (C3) — High prio
2. **[PERF] Lazy-load Clarity + cookieconsent in useEffect** (C3) — High
3. **[PERF] Trim Sentry replay integration list** (C3) — Medium
4. **[INFRA] Linear webhook — implement dispatch or delete the route** (C5 BL1) — Medium, but tracks the rediscover-fix-loop problem
5. **[REFACTOR] Extract `searchVectorSql` helper to dedupe the 28× tsvector blocks** (C5 BL2) — Medium
6. **[REFACTOR] Replace "fetch all saved reports" Navbar lookup with single-share endpoint** (C5 BL3) — Medium
7. **[INFRA] Standardise the Linear webhook env var name in Vercel; drop the dual-read** (C5 BL5) — Low
8. **[REFACTOR] Replace JSONB `Record<string, unknown>` casts in API routes with a typed `ShareData` interface** (C2) — Medium (~30 cast sites across share + drafts + comments + reactions routes)
9. **[A11Y] Pass — remaining R8 findings (modal patterns, contrast nits, focus rings)** — Low, see `.swarm/r8-a11y-08-06-26.md`
10. **[PERF] Adopt `next/image` for sprite renders + add `loading="lazy"`** (R6 #10, C6 oversized files) — Medium-High; biggest LCP lever for mobile
11. **[SEO] Per-filter `generateMetadata` for `/explore` filter combinations** — Medium
12. **[REFACTOR] Split DashboardContent (1219 LOC), PokemonDetailSlide (963), ShareModal (933), Navbar (890), TeamOverview (850), MatchupPlanSlide (779), ExploreFilters (719)** (C6) — chronic source of merge conflicts
13. **[INFRA] Add pre-PR `tsc --noEmit` check to swarm-nightly workflow to prevent the May 26 corruption-repair scenario** (C5 BL6) — High

## Blockers
- **Linear API + Discord webhooks + PostHog credentials unavailable in container.** The swarm spec describes a "drain the Linear board" goal that requires Linear access; without it we cannot triage, comment on, or move tickets. All tonight's work is code-driven from prior research synthesis + Wave 1 audits.
- **Cypress binary download blocked** (HTTP 403) — installed with `CYPRESS_INSTALL_BINARY=0`. Local cypress runs would fail but build does not need it.

## Files at high conflict-risk (flagged by C1–C6, on `.swarm/main-changed-files.md`)
None of tonight's commits touched any file in the conflict-risk list (`public/sw.js`, `src/app/globals.css`, `src/app/page.tsx`, `src/components/report/SlideNavControls.tsx`, `src/components/ui/SwipeHint.tsx`, `src/hooks/useHomePage.ts`). All Wave 2 subagents respected the no-touch list.
