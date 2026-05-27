# Swarm Research Synthesis — 27-05-26

Synthesised from 13 Wave 1 agent reports (R1–R8, C1–C5).

---

## Top 5 Highest-Leverage Opportunities

### 1. SEO: Add default OG image + "Pokemon Champions 2026" to homepage title
**Confidence: Very High | Impact: High**
R6 found Twitter card is `summary_large_image` but NO default image set — every homepage share is a blank link. Root title still missing "Pokemon Champions 2026". Six new competitor tools launched in 2026. Fix is pure metadata, ~30 min. Also: /explore and /creator title templates need year+format keywords.

### 2. Accessibility: ShareModal missing dialog semantics + focus trap
**Confidence: Very High | Impact: High**
R8 found ShareModal has no `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, or focus trap. Keyboard users Tab behind the overlay. ~20 line fix in ShareModal.tsx. Also affects ExportThemePicker modal. Touch targets sub-44px on undo/redo and modal close buttons.

### 3. Security: HogQL injection + missing fetch timeouts
**Confidence: High | Impact: High**
C4 found HogQL query injection in `/api/webhooks/posthog/route.ts:33-34` — string interpolation with naive quote-stripping. Plus CSP `unsafe-eval` in next.config.ts. Multiple API routes call external services with no AbortController/timeout.

### 4. Performance: posthog-js statically imported at root
**Confidence: High | Impact: Medium**
C3 found posthog-js (~100-266KB) imported statically in root, landing in every visitor's bundle. Should defer to first user interaction via usePostHog() hook. Also: root page.tsx is `'use client'` — forces full-page hydration.

### 5. AEO/GEO: Add Organization + FAQPage JSON-LD to homepage (code change)
**Confidence: High | Impact: Medium-High**
R7 confirmed VGC Team Report absent from all community resource pages that AI citation engines use as anchors. Adding `Organization` + `FAQPage` schema is a purely technical code change (no outreach) and has documented 3.2× AI citation lift.

---

## Top 5 Quick-Win Bugs / Code Issues

1. **SEO meta tags**: Missing OG image, wrong title template (no "2026"/"Pokemon Champions")
2. **ShareModal accessibility**: No role="dialog", no focus trap — WCAG A failure
3. **HogQL injection**: naive quote-strip in posthog webhook, should use parameterized queries
4. **CSP unsafe-eval**: Defeats XSS protection; should be removed from next.config.ts
5. **Touch targets**: Undo/redo buttons 28×28px, modal close 24×24px — below 44px min

---

## Tonight's Implementable Ticket List

From Linear Backlog (no `no-claude`, no external service deps, scoped for swarm):

| Ticket | Title | Priority | Scope |
|--------|-------|----------|-------|
| VGC-112 | Embeddable team report widget | High | Embed snippet in ShareModal + docs |
| VGC-77 | Pre-built Champions sample teams | Urgent | Data seed + UI on champions page |
| VGC-128 | Notification preferences page | High | New /dashboard/notifications page (UI) |
| VGC-91 | Tournament results archive | High | New /tournaments page |
| VGC-84 | Import from rental code UX | Low | UX addition to import flow |

**Skipped (too large/risky):** VGC-120 (i18n scaffold — touches 50+ files), VGC-5 (Stripe), VGC-48 (real-time collab), VGC-79 (@smogon/calc dep needed).
**Outreach tickets (drafts only):** VGC-67, VGC-70, VGC-85, VGC-86, VGC-88, VGC-113.

---

## Wave 2 Blockers
- None for code fixes (F1–F4) or ticket implementations
- VGC-77 sample teams: need valid PokePaste data — agent will generate synthetic valid data
- VGC-91 tournament archive: new page with static data initially, no external data source needed

---

## New Linear Backlog Tickets to File (from Research)

1. **Add default OG fallback image** — R6, technical, urgent
2. **FAQPage + Organization JSON-LD AEO/GEO improvements** — R7, technical, documented 3.2× citation lift
3. **Lazy-load posthog-js + defer analytics init** — C3, performance, ~100KB saved
4. **Decompose PokemonDetailSlide (962 lines)** — C5, architecture, maintainability
5. **Champions dex drift CI guard** — C5, data integrity, prevent regression
6. **Add fetch AbortController timeouts to API routes** — C4 security, medium severity
7. **Add unit tests for redact-paste.ts regex** — C5, test coverage
8. **Root page.tsx Server Component refactor** — C3, ~200KB JS reduction
