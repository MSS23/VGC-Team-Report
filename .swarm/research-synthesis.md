# Research Synthesis — Swarm Run 25-05-26

## Wave 1 Agent Results Summary

### Agents Completed (13/13)
- R1: Pikalytics + PokePaste competitor teardown ✓
- R2: VGCpastes + Limitless + Trainer Hill teardown ✓
- R3: Reddit/community sentiment ✓
- R4: Twitter/X VGC creator sentiment ✓
- R5: Mobile UX sharing patterns ✓
- R6: SEO audit ✓
- R7: AI citation / AEO strategy ✓
- R8: Accessibility audit ✓
- C1: Dead code scan ✓
- C2: TypeScript strictness audit ✓
- C3: Performance/bundle analysis ✓
- C4: Security audit ✓
- C5: Code review (last 20 commits) ✓

---

## Top 5 Highest-Leverage Opportunities

1. **@pkmn/dex lazy-loading (C3)** — The entire 6.9 MB Pokemon Showdown dataset ships to EVERY client because `pkmn-dex-fallback.ts` is statically imported. 95%+ of lookups hit the static `POKEMON_DATA` map. Dynamic import on cache miss would cut 67% of client JS.

2. **Anonymous quick-share / zero-friction entry (R1/R2/R3)** — PokePaste's biggest moat is zero-login sharing but it's dying (155+ issues, broken sprites). Adding a guest quick-share (paste → URL, no login, auth upsell post-share) directly attacks this weakness at highest intent.

3. **Programmatic /teams page for SEO (R6)** — 3,000-5,000 monthly searches for "best VGC teams 2026" with no competitor dominating. Site already has 5,000+ public shares — aggregate most-viewed into a ranked page.

4. **Auto-generated visual share cards (R4/R5)** — Strava's entire viral loop is built on auto-generated cards. VGC needs image cards for Discord/X embeds. The Satori OG image is built but suppressed — move off edge runtime with CDN caching.

5. **Fix applicationCategory + upgrade /s/[id] schema to Article (R7)** — applicationCategory was "GameApplication" (FIXED this run). Share pages use weak CreativeWork — upgrading to Article schema turns 1000+ public reports into individually-citable AI training documents.

---

## Top 5 Quick-Win Bugs / Issues (Implemented This Run)

1. **Linear webhook handler broken** — wrong env var name, wrong header name, missing force-dynamic. FIXED ✓
2. **applicationCategory mismatch** — layout.tsx "GameApplication" vs JsonLd.tsx "SportsApplication". FIXED ✓
3. **ExploreFilters i18n wiring incomplete** — translation keys existed but constants weren't using them. FIXED ✓
4. **Navbar overflow menu missing ARIA** — no aria-expanded/aria-haspopup. FIXED ✓
5. **Timing-unsafe secret comparison** — cleanup + migrate routes used ===. FIXED ✓

---

## Additional Quick Wins Implemented

- /compare added to XML sitemap
- FAQ page keywords metadata added
- PokemonCard role input aria-label added
- SlideNavControls hide/show aria-label added
- PokemonDetailSlide collapsible calc aria-expanded added
- Dead useScrollHide hook removed
- Unused axios dependency removed
- Broken PWA manifest screenshots references removed

---

## Blockers / Items Requiring Human Action

- LINEAR_WEBHOOK_SIGNING_SECRET — human must verify Vercel env var matches Linear config
- PWA screenshots — need real app screenshots for Chrome enhanced install dialog
- @pkmn/dex lazy-loading — large refactor, needs feature branch
- page.tsx is 1881 lines — needs decomposition (feature branch recommended)

---

## High-Conflict Risk Files
From .swarm/main-changed-files.md: src/app/changelog/ChangelogContent.tsx, src/components/layout/Navbar.tsx, 
src/components/ui/ShareModal.tsx are all conflict-risk. Changes to Navbar.tsx this run were minimal (2 attributes added).

---

## Tickets to File from Research

1. [PERF] Lazy-load @pkmn/dex — dynamic import on cache miss (P1, High impact)
2. [SEO] Create /teams ranked page from existing public shares (P2, Medium)
3. [SEO] Create /speed-tiers standalone reference page (P2, Medium)
4. [SEO] Create /open-team-sheet landing page (P2, Medium)
5. [SEO] "How to Write a VGC Team Report" guide page (P3, Low effort)
6. [SEO] Add BreadcrumbList schema to /explore, /faq, /tournaments (P3, Quick)
7. [UX] Anonymous quick-share flow — paste → URL without login (P1, Large)
8. [UX] Re-enable OG image generation off edge runtime (P2, Medium)
9. [PERF] Lazy-load MatchTracker in dashboard via next/dynamic (P3, Quick)
10. [PERF] Defer ClarityProvider like PostHog (requestIdleCallback) (P3, Quick)
