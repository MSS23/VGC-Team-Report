# Research Synthesis — Swarm Run 26-05-26

## Wave 1 Agent Results Summary

### Agents Completed
- R1: Competitor teardown (Pikalytics + PokePaste) ✓
- R2: Competitor teardown (VGCpastes + Limitless + Trainer Hill) ✓
- R3: Reddit/community sentiment ✓
- R4: Twitter/X VGC creator sentiment ✓
- R5: Mobile UX sharing patterns ✓
- R6: SEO audit vs competitors ✓
- R7: AI citation strategy (AEO/GEO) ✓
- R8: Accessibility audit (WCAG 2.1 AA) ✓
- C1: Dead code scan ✓
- C2: TypeScript strictness audit ✓
- C3: Performance bundle analysis ✓
- C4: Security audit ✓
- C5: Code review (last 20 commits) ✓

---

## Top 5 Highest-Leverage Opportunities

### 1. Fix Google indexation (R6 — CRITICAL)
Google shows only ~2 pages indexed despite a sitemap with thousands of entries. This is the single biggest blocker — without fixing indexation, all other SEO work is wasted. Must verify Google Search Console coverage and ensure champion/share pages render for Googlebot.

### 2. Dynamic OG images for shared reports (R1, R3, R5)
Every competitor and community member confirms: blank link previews kill shareability. PokePaste links show no preview. crob.at exists solely to fill this gap. Satori-based OG image generation is partially built but suppressed. Estimated 2-4x click-through improvement.

### 3. HTML injection in email templates (C4, C5 — SECURITY P0)
`src/lib/email.ts` has stored XSS in `buildCommentNotificationHtml()` — user-controlled fields (`commenterName`, `commentBody`, `reportTitle`) interpolated raw into HTML. The weekly-digest cron has its own `escapeHtml()` but the main email module was never patched.

### 4. @pkmn/dex ships ~6.7 MB to clients (C3 — PERFORMANCE)
`InlinePokemonEditor.tsx` and `pkmn-dex-fallback.ts` import the entire Showdown database for all 9 generations into client bundles. Should be moved to a server action or API route.

### 5. Pokemon Champions format timing window (R4)
The Champions launch has created a tool-evaluation reset. Old tools (VGC Helper stale 12+ months, Pikalytics slow) are losing trust. Indianapolis Regionals (May 29-31) is the best moment to capture mindshare. VGC Team Report already supports Champions + Mega Evolution.

---

## Top 5 Quick-Win Bugs / Issues

1. **Webhook handler fixes** — FIXED THIS RUN ✓ (Linear env var, header name, force-dynamic; PostHog 500→200; Clerk 500→200)
2. **HTML injection in email.ts** — needs `escapeHtml()` on user fields in comment notification + welcome email
3. **useScrollHide.ts** — 125 lines, zero imports, safe to delete (C1)
4. **axios dependency** — zero imports, can be uninstalled (C1)
5. **text-tertiary contrast** — #5E5E7A fails 4.5:1 AA on #FAF9F6, needs darkening to ~#4E4E62 (R8)

---

## High-Conflict Risk Files
From `.swarm/main-changed-files.md`: most changed files are .swarm/ notes. Source files with recent changes:
- src/app/page.tsx (1,881 lines — merge conflict magnet)
- src/components/ui/ShareModal.tsx
- src/components/layout/Navbar.tsx
- src/lib/email.ts

None of tonight's committed changes touch these files, so conflict risk is minimal.

---

## Wave 2 Implementation Summary

8 feature agents dispatched. All changes committed:
- F1: Remove unused ConsentGate import + add /compare to sitemap ✓
- F2: Error/not-found page accessibility (role=alert, aria-hidden) ✓
- F3: PostHog webhook hardening (force-dynamic, 200 on errors) ✓
- F4: Compare page robots noindex ✓
- F5: Clerk webhook 200 on internal errors ✓
- F6: BreadcrumbList JSON-LD on FAQ/Changelog/Tournaments ✓
- F7: Global error page accessibility ✓
- F8: Webhook GET handlers returning 405 ✓

---

## New Linear Backlog Tickets to File (from Research)

1. [SECURITY P0] HTML escape user fields in email templates (C4/C5)
2. [PERFORMANCE] Move @pkmn/dex to server action — 6.7MB client savings (C3)
3. [PERFORMANCE] Externalize changelog data from client bundle — 96KB (C3)
4. [SEO] Fix Google indexation — verify GSC coverage (R6)
5. [SEO] Create standalone landing pages for damage calc + speed tiers (R6)
6. [SEO] Add visible H1 to homepage (R6)
7. [FEATURE] Dynamic OG images for shared reports (R1/R3/R5)
8. [FEATURE] Tiered visibility — public shell + paywalled spreads (R4)
9. [A11Y] Fix text-tertiary contrast ratio to meet 4.5:1 (R8)
10. [A11Y] InstallPrompt + OTSSheetModal missing dialog semantics (R8)
11. [CLEANUP] Remove useScrollHide.ts — zero imports (C1)
12. [CLEANUP] Uninstall axios — zero imports (C1)
13. [AEO] Get listed on Victory Road and VGCpedia directories (R7)
14. [AEO] Create /how-to-write-a-vgc-team-report guide page (R7)
15. [COMPETITIVE] Monitor PokéBase and VGenC.net as emerging threats (R2/R4)
