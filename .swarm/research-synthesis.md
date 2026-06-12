# Research Synthesis — Nightly Swarm 12-06-2026

## Wave 1 agents completed
- C1 dead code scan ✓ — 3 confirmed-dead files + 2 internal-exports + 1 dead helper
- C2 TypeScript strictness ✓ — codebase is exceptional; only 6 trivial polish items left
- C3 perf bundle ✓ — Zod 4 now the #1 client bloat at 114KB gz on /
- C4 security ✓ — npm audit clean of P0/P1; 2 new P2 (flag-route abuse, latent avatar SSRF); `tmp` dev-only high
- C5 last-20-commits ✓ — Explore reactions bug (MAX_IDS=60 drop), migration-runner gap, minor i18n + magic-number polish
- R6 SEO delta ✓ — sitemap /compare dup, contradictory /compare noindex, /privacy /terms missing OG, /creator missing breadcrumb, Indianapolis Regional landing-page opportunity
- R8 a11y delta ✓ — 11 gaps remaining, 9 new; 3 modals fixed tonight; 8 deferred to tickets
- L0 triage ✓ — most May-26 backlog now shipped; 10 candidates produced for tonight

## Top 5 highest-leverage opportunities surfaced

1. **Zod 4 client bundle bloat (C3 — PERFORMANCE)**
   `src/lib/sharing/url-codec.ts` pulls Zod into every / page load. Hand-rolled type guards would save ~110KB gz. See `.swarm/drafts/perf-zod-bundle.md`.

2. **No migration runner (C5 — RELIABILITY)**
   `ensureTable` band-aid pattern keeps reproducing prod 500 outages on every new column. Real migration system needed. See `.swarm/drafts/c5-migrations-runner.md`.

3. **Linear webhook signing-secret env mismatch (Step 0C — P0 INFRA)**
   Handler code is healthy; the failure is almost certainly env-var mismatch in Vercel Production. Human action required. See `.swarm/drafts/p0-webhook-env-mismatch.md`.

4. **Indianapolis Regional landing-page opportunity (R6 — SEO)**
   1,013-player Reg M-A regional just ran. Programmatic per-tournament landing pages could capture significant search traffic.

5. **PostHog credentials missing from swarm env (recurring — INFRA)**
   20+ consecutive runs unable to pull live event data. Adding a read-only PostHog API key would dramatically raise Wave 1 leverage. See `.swarm/drafts/infra-posthog-credentials.md`.

## Top 5 quick-win bugs

1. **Explore reactions drop past position 60** (C5) — FIXED THIS RUN ✓
2. **/api/comments/flag unauth abuse** (C4) — FIXED THIS RUN ✓
3. **`/compare` duplicate in sitemap + contradictory noindex** (R6) — FIXED THIS RUN ✓
4. **3 modals missing dialog semantics** (R8) — FIXED THIS RUN ✓
5. **light-mode text-tertiary 4.1:1 contrast** (R8) — FIXED THIS RUN ✓

## PostHog data
Not available — no credentials in execution environment. Recurring gap; draft Backlog ticket attached.

## Conflict-risk files
Branch was cut fresh from main tonight at commit 06ef1f5. No subagent's recommended files overlapped with the recent main-changed-files list. Zero conflict risk on integration.

## Deferred to future runs (ticket drafts filed)
- A11y: Dashboard 8-tab roving tabindex
- A11y: LanguageSelector listbox/combobox semantics
- A11y: VersionHistoryPanel dialog completeness
- A11y: CollaboratorPanel + CreatorProfile + Dashboard select labelling
- Perf: dex-subset.json duplicate emit
- Perf: motion/react lazy
- Perf: move-names.ts per-locale split
- SEO: per-regulation landing pages (Reg H, I, G, MA)
- SEO: /ots-generator landing page
- SEO: /vgc-team-builder + /vgc-speed-tiers landing pages
- Data: Indianapolis Regional top-cut population
- UI: CommentSection 401 follow-up after this run's auth tightening
- Tech-debt: real migration runner
- Security: avatar URL host allowlist refine; `npm update tmp` for dev-only high
