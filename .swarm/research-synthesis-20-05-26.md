# Research Synthesis — Swarm Run 20-05-26

## Wave 1 Agent Results Summary

### Agents Completed
- R1/R2: Competitor teardown ✓
- R3: Reddit/community sentiment ✓
- R5: Mobile UX sharing patterns ✓
- R6: SEO audit ✓
- R8: Accessibility audit ✓
- C1: Dead code scan ✓
- C2: TypeScript audit ✓
- C4: Security audit ✓
- C5: Code review (last 20 commits) ✓
- R-Indy: Indianapolis data research ✓ (deferred — event is May 29-31)

---

## Top 5 Highest-Leverage Opportunities

1. **Re-enable OG image generation (R5)** — Share cards show as text-only in Discord/Twitter.
   The Satori-based OG image generator is fully built but suppressed. Moving it off edge runtime
   to a standard function with CDN caching would restore visual share previews and drive
   estimated 2-4x click-through on Discord-shared reports.

2. **Anonymous quick-share / zero-friction entry (R1/R2 + R3)** — PokePaste's biggest moat is
   zero-login sharing. VGC Team Report requires auth before sharing. Adding a guest quick-share
   (paste → URL, no login, auth upsell post-share) directly attacks PokePaste's weakness
   (broken, unmaintained) at the moment of highest intent.

3. **Rental code field on reports (R3)** — The single most viral sharing mechanic in VGC.
   Community explicitly asks for paste + rental code in one link. Already has a field in the
   data model but needs surfacing prominently in the share modal and report editor.

4. **Pokemon-level search across all published reports (R3)** — Let players search "all Reg I
   teams containing Calyrex-Shadow + Incineroar." This is the searchable archive the entire
   community is missing and would differentiate from Pikalytics/VGCpastes.

5. **Native share CTA as primary mobile action (R5)** — The Web Share API button is buried
   last in ShareModal. On mobile, OS share sheet surfaces WhatsApp/iMessage/Discord Stories —
   move it to the top of the mobile action list.

---

## Top 5 Quick-Win Bugs / Issues

1. **VGC-202**: CRLF injection in email.ts — FIXED this run ✓
2. **VGC-205**: noindex for dashboard/profile, /privacy, /notifications — FIXED this run ✓
3. **VGC-203**: Keyboard nav for changelog filter tabs (WCAG 2.1.1) — FIXED this run ✓
4. **VGC-204**: aria-live for notifications — FIXED this run ✓
5. **VGC-201**: Batch Clerk getUserList in weekly-digest — FIXED this run ✓

---

## High-Conflict Risk Files (from main-changed-files.md)
All changed files are .swarm/ files (no conflict risk with src/).
None of the implementation files (email.ts, ChangelogContent.tsx, etc.) appear in the conflict list.

---

## Blocked Items
- VGC-181: Indianapolis data — event is May 29-31, 2026 (future). Cannot implement until post-event.
- VGC-162: Root page.tsx Server Component refactor — marked risky/large, "feature branch needed"
- VGC-200: Notifications prefs persist to DB — requires DB migration, complex
- VGC-64: In Progress, no-claude, non-bug — skip

---

## Wave 2 Plan (remaining budget: 15 agents)
Already implemented directly (5 implementations done):
- VGC-202: email CRLF fix
- VGC-205: dashboard noindex
- VGC-201: batch Clerk
- VGC-203: changelog keyboard nav
- VGC-204: notifications aria-live

Wave 2 agents to dispatch: feature work + dead code + additional a11y

1. F1: ShareModal mobile UX (native share CTA as primary on mobile)
2. F2: Champions table accessibility (caption + scope="col" on th elements)
3. F3: Dead code removal (C1's safe deletions: parsePikalyticsUrl, evsToSp, spToEv)
4. F4: SEO: add /feedback to sitemap + FAQ sitemap priority boost
5. F5: Explore accessibility: missing aria-labels on filter buttons
