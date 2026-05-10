# C3 — Performance & Bundle Analysis

**Date:** 2026-05-10

## Heaviest Dependencies

| Dependency | Est. Size | Impact | Notes |
|---|---|---|---|
| jspdf 4.2.1 | ~350KB | HIGH | PDF generation on-demand |
| html2canvas-pro 2.0.2 | ~200KB | HIGH | Screenshot rendering |
| posthog-js 1.364.7 | ~266KB gzipped | MEDIUM-HIGH | Analytics, loads at root |
| motion 12.35.2 | ~34KB gzipped | MEDIUM | Animation library |
| axios 1.16.0 | ~15KB gzipped | LOW | API calls |

**Estimated total: ~850KB+ minified front-loaded.**

## Client Components
- **109 `'use client'` directives** across codebase
- Root `app/page.tsx` marked `"use client"` → forces full client hydration
- Largest clusters: `/components/ui/` (37), `/components/report/` (16), `/hooks/` (13)

## Dynamic Imports (Good)
8 strategic dynamic imports defer ~500KB from initial load:
- `ShareModal`, `ShareDock`, `CommentSection`, `PrintableReport`, `OTSSheetModal`, `EditChangelog`, `CollaboratorPanel`, `DiffNavigator`

## Concerns
- `WalkthroughOverlay.tsx`: 5+ stacked useEffect hooks — could batch
- `ShareDock.tsx`: useEffect measures scroll on every render cycle
- 153 useEffect hooks total across codebase

## Top 5 Optimizations (by impact)

1. **Move root page.tsx to Server Component** — ~200KB JS reduction (30%)
2. **Lazy-load PostHog** — ~100KB; defer to first user interaction
3. **Code-split PDF/export** — jspdf+html2canvas-pro, ~550KB; already partial with dynamic import, finish the job
4. **Batch WalkthroughOverlay useEffect** — 5+ hooks → 2-3
5. **Add @next/bundle-analyzer + size budgets** — governance; prevent future bloat

## Estimated Savings
300–400KB reduction (30–40% of total JS) = faster loads on 3G and low-end devices.
