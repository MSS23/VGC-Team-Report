# Research synthesis — 2026-06-29

## Top opportunities (high-leverage, shippable tonight)

1. **C1 dead code + jspdf dep removal** — ~342 lines + a 300KB dep gone. DisplayTogglePill (267) + useGlobalDisplayPrefs (51) + exportAsPdf (21) + uninstall jspdf.
2. **R6 SEO quick wins** — duplicate `/compare` sitemap entry; robots.txt hardening; og:locale + twitter:site; consolidate duplicate Breadcrumb helpers; BreadcrumbList on /compare.
3. **R7 ItemList JSON-LD on `/explore`** — converts the page metadata's "best VGC teams 2026" promise from empty CollectionPage into populated ItemList. Per-AI-citation lift.
4. **R3 Reg M-B Legality Badge** — timely (Champions Reg M-B launched June 17). All data already in code, just needs surfacing on TeamOverview / ReportCard / a `/api/legality` endpoint.
5. **C2 TypeScript hardening** — 8 quick wins, ~16 lines total, zero conflict risk.

## Quick-win bugs/issues

1. **C5 #1 — Dashboard bulk PATCH error handling** (privacy regression risk if any single fetch fails).
2. **C4 #2 — IdSchema missing on `/api/user/reports/[shareId]`** PATCH/DELETE.
3. **C4 #3+#4 — ILIKE wildcard passthrough** on `/api/creator/[name]` + `/api/explore` short-query.
4. **R6 #1 — duplicate `/compare` sitemap entry**.

## Conflict-risk overlaps with `main-changed-files.md`

- `src/components/report/TeamOverview.tsx` — R1 + R3 propose edits; main changed it recently.
- `src/app/dashboard/DashboardContent.tsx` — C5 #1 must edit; main changed it recently.
- `src/app/changelog/data.ts` — Step 4 will append to it; main just touched it.
- `src/app/s/[id]/page.tsx` — R3 proposes edit; main changed it recently.
- `src/hooks/useShareFlow.ts` — recent; no Wave-2 agent edits it.

## Blocked / skipped

- L0 Linear triage skipped — no Linear API key. Wave 2 work derived directly from research findings.
- PostHog data not pulled — no API key. All findings are code/web-sourced.
- Linear webhook handler code is CORRECT — the failure is env-var-side. Filed for human action in `.swarm/linear-pending.md`.
