# Swarm Research Synthesis — 07-05-26

Synthesised from 13 Wave 1 agent reports (R1–R8, C1–C5).

---

## Top 5 Highest-Leverage Opportunities

### 1. Dynamic OG Images per shared team (VGC-68)
**Confidence: High | Impact: High**
R5 found that static/blank OG images are "dead weight" — Discord/Twitter previews with 6 sprites + team name + regulation are compelling enough to click without any copy. R1 confirmed PokePaste's broken sprites are the single most-complained-about issue in the VGC tooling space. We already have `src/app/opengraph-image.tsx` and a `/api/team-graphic` route. A per-share `opengraph-image.tsx` using Next.js image response + sprite URLs would close this gap completely and make every shared link a billboard.

### 2. Remove the login wall from shared team views (R5)
**Confidence: High | Impact: High**
R5's #1 finding: every friction step between "click link" and "see content" breaks the viral loop. Notion's model (full public viewing, account required only to duplicate/edit, persistent bottom-banner CTA) is the standard. R3 confirmed PokePaste wins on zero-friction sharing. VGC Team Report's reports are behind auth — this may be killing viral spread.

### 3. GraphQL injection in /api/discord/route.ts (C4 — Security P1)
**Confidence: Very High | Impact: High**
Line 268 interpolates user-supplied `reason` directly into a GraphQL mutation string. The `replace(/"/g, '\\"')` mitigation is insufficient — newlines and GraphQL directives bypass it. Use variables instead (`$body: String!` pattern). Fix is 10 lines.

### 4. /api/cleanup cron silently broken — DELETE handler, Vercel calls GET (C1)
**Confidence: Very High | Impact: High**
The `/api/cleanup` route exports only a `DELETE` handler. Vercel cron invokes routes via `GET`. This means the trash-purge and stale-share cleanup jobs have **never run automatically**. Database bloat is accumulating silently. Fix: add or rename to `GET` handler.

### 5. VGC Team Report invisible to AI citations + missing from community resource lists (R7)
**Confidence: High | Impact: Medium-High**
When users ask ChatGPT/Perplexity "best VGC team builder," Pikalytics and Limitless are cited; we are not. Root cause: not listed on Victory Road /resources, VGCpedia, or Smogon threads — the same pages AI engines use as citation anchors. Adding `Organization` + `FAQPage` schema to the homepage has documented 3.2× citation lift.

---

## Top 5 Quick-Win Bugs and Code Issues

### 1. InlinePokemonEditor search bug (C5 — confirmed code bug)
`prefix.length >= 16` check in search loop breaks before collecting `contains` results. Players searching for Pokemon with longer names get incomplete dropdown results. Fix is a one-line condition change.

### 2. SEO meta description too long + creator pages missing "VGC" keyword (R6)
Root meta description is 190 chars (Google truncates at ~155). Creator pages use `"${name}'s Teams"` with zero VGC keyword. Fix: trim description, update creator/explore page title templates.

### 3. ShareModal missing role="dialog" + focus trap (R8 — WCAG 4.1.2 + 2.1.2)
The share modal renders as a plain `<div>` with no `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, or focus trap. Keyboard and screen-reader users can Tab behind the modal. Fix: ~20 lines of changes to ShareModal.tsx.

### 4. Sub-44px touch targets on undo/redo and modal-close buttons (R8)
Undo/redo buttons are 28×28px, modal close buttons 24×24px — both below the 44×44px CLAUDE.md minimum. Fix: add `min-w-[44px] min-h-[44px]` Tailwind classes.

### 5. posthog-js statically imported in main bundle (C3 — ~100KB impact)
`posthog-js` is imported at the top of `page.tsx` and `useHomePage.ts`. It lands in every visitor's initial bundle. The PostHog provider already exposes a singleton via `usePostHog()`. Replacing direct imports with the hook removes ~80–120KB from the critical path.

---

## Wave 2 Blocker Analysis

**Proceed — no blockers for these implementations:**
- VGC-99: manifest.json screenshots update (trivial)
- GraphQL injection fix (10 lines, no external deps)
- /api/cleanup GET fix (trivial)
- InlinePokemonEditor search fix (one-line)
- SEO meta description + title fixes (metadata config)
- ShareModal accessibility (20-line component change)
- OG image per share (Next.js image response, pattern exists)
- posthog-js lazy import (replace static import with hook)

**Needs human review before implementing:**
- VGC-120 (i18n scaffold): touches routing, layout, 50+ components — too risky for swarm
- VGC-5 (Stripe): external payment system setup required
- Login-wall removal: product decision (see R5 recommendation) — needs human sign-off on auth flow change

**Outreach/marketing tickets (drafts only per guardrail):**
- VGC-67, VGC-70, VGC-85, VGC-86, VGC-88, VGC-107, VGC-113, VGC-125, VGC-126: all involve sending emails/posts/publishing — saved to .swarm/drafts/, listed in PR, new Linear tickets filed

---

## Research → New Backlog Tickets (Target: 8 tickets)

1. **Remove auth wall from public shared report views** — R5 finding, high conversion impact
2. **Add `Organization` + `FAQPage` JSON-LD schema to homepage** — R7, documented 3.2× AI citation lift
3. **Tiered team publishing: public shell, private spreads** — R4 creator pain point (Wolfey's Patreon model)
4. **Downloadable "team card" Spotify-Wrapped style image** — R5 highest virality ceiling
5. **Rental code + paste unified sharing format** — R3 top unmet need
6. **CHAMPIONS_DEX / CHAMPIONS_REG_MA_MEGAS divergence guard** — C5, add CI check or merge into one source of truth
7. **Delete 4 dead components + 3 dead library files** — C1, 464+ lines of dead code
8. **Harden url-codec.ts JSON.parse with Zod schema validation** — C2 security gap
