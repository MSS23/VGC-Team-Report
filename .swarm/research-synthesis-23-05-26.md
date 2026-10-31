# Research Synthesis — Swarm Run 23 May 2026

## Wave 1 reports
- R1 — `.swarm/r1-competitor-pikalytics-pokepaste.md`
- R2 — `.swarm/r2-competitor-vgcpastes-limitless-trainerhill.md`
- R3 — `.swarm/r3-reddit-sentiment.md` + drafts
- R5 — `.swarm/r5-mobile-share-ux.md`
- R6 — `.swarm/r6-seo-audit.md` + `.swarm/drafts/r6-seo-drafts.md`
- R7 — `.swarm/r7-aeo-citations.md` + 3 content briefs in `.swarm/drafts/`
- R8 — `.swarm/r8-accessibility-audit.md`
- C1 — `.swarm/c1-dead-code-23-05-26.md`
- C3 — `.swarm/c3-perf-23-05-26.md`
- C5 — `.swarm/c5-commit-review-23-05-26.md`

## Top 5 highest-leverage opportunities
1. **Move @pkmn/dex off client (VGC-214)** — ~350 KB gzip win on every page load; biggest single perf lever. Both C3 and the existing Linear ticket confirm. Ship tonight.
2. **Editorial content + dated llms.txt (R7)** — biggest AEO gap. Add `Updated:` header to `llms.txt`/`llms-full.txt`, wire up unused FAQPageJsonLd + HowToSchema on `/faq`.
3. **BreadcrumbList + Article schema sitewide (R6)** — quick SEO wins. Ship BreadcrumbList helper tonight.
4. **PokePaste import + rental-code field (R1+R3)** — community asks for both. File as tickets for next run.
5. **Server-render /s/[id] (R5)** — strip app shell, improves recipient flow. Larger; file as ticket.

## Top 5 quick-win bugs/issues (from C5 + R8)
1. **CRITICAL XSS** in `buildWelcomeEmailHtml` + `buildCommentNotificationHtml` (C5 #1). Implement tonight.
2. **POST /api/user/saved missing access check** (C5 #3) — auth bypass.
3. **Fire-and-forget SQL in /api/share/route.ts** (C5 #2) — silent failures.
4. **InstallPrompt Android missing pageIsShort rescue** (C5 #4).
5. **NotificationBell missing Escape / focus restore + sitewide :focus-visible** (R8 #1 + #10).

## Conflict-risk files
- `src/app/api/share/route.ts` — VGC-218 + C5#2 → combine into one subagent.
- `src/components/ui/InstallPrompt.tsx` — C5 #4 + R8 #6 → bundle.
- `src/app/page.tsx` Export Theme focus trap (VGC-219 sub-task 2) → defer (1881 LOC).
- `src/components/ui/ShareModal.tsx` — R5 #3 → defer (cross-subagent conflict warning).

## New Linear tickets to file post-run
- [BUG/SEC P0] XSS in welcome + comment notification email templates (C5 #1)
- [BUG/SEC P1] /api/user/saved POST lacks ownership validation (C5 #3)
- [BUG P2] Fire-and-forget SQL in /api/share/route.ts (C5 #2)
- [BUG P3] InstallPrompt Android pageIsShort rescue (C5 #4)
- [TECH-DEBT P3] Decide Cypress: install + re-include or delete (C5 #5)
- [CONTENT/AEO P2] Build /blog/[slug] route + first Reg M-A meta post (R7)
- [FEATURE P3] Server-render /s/[id] without app shell (R5)
- [FEATURE P2] PokePaste URL import (R1)
- [FEATURE P2] Rental-code field on report editor + copy button (R3)
- [FEATURE P3] Article + SportsTeam JSON-LD on /s/[id] (R6)
- [FEATURE P3] OTS one-click PDF export (R3)
- [FEATURE P3] Anonymous "Helpful" reaction on share-view page (R5)

## Wave 2 plan (12 subagents, total cap 22/25 + 3 reserve)
**Ticket implementations (6):**
- W2-1: VGC-219 (sub-tasks 1, 3, 4 only — defer 2 + 5)
- W2-2: VGC-216 (verifyBearer helper)
- W2-3: VGC-218 + C5 #2 combined (share/route.ts cleanup)
- W2-4: VGC-214 (@pkmn/dex client extract)
- W2-5: C5 #1 (XSS fix in email.ts)
- W2-6: C5 #3 (saved access check)

**Feature/quality (6):**
- W2-7: BreadcrumbList JSON-LD helper + wire to top pages (R6)
- W2-8: AEO activation — Updated: header + FAQPageJsonLd + HowToSchema on /faq (R7)
- W2-9: Dead-code cleanup (C1)
- W2-10: html2canvas-pro dedupe via existing helper (C3 #4)
- W2-11: NotificationBell a11y + sitewide :focus-visible (R8 #1 + #10)
- W2-12: InstallPrompt Android pageIsShort rescue (C5 #4)
