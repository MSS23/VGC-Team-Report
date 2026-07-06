# R6 — SEO Audit

## Top 7 quick metadata wins (candidates for Wave 2)
1. Add OG + Twitter images to `/champions` (`src/app/champions/page.tsx:12-25`) — currently omits `openGraph.images` and `twitter.images`. Copy the pattern from other pages that use `/opengraph-image`.
2. Add OG/Twitter blocks to `/privacy` (`src/app/privacy/page.tsx:797-800`) and `/terms` (`src/app/terms/page.tsx:878-881`). Both only export `title` + canonical.
3. Resolve `/compare` noindex vs sitemap contradiction. Page `src/app/compare/page.tsx:198` has `robots:{index:false}` but is listed in `src/app/sitemap.ts:16`. Recommended: DROP the noindex (public tool with keyword potential).
4. Give `src/app/page.tsx` server-level metadata. It's `"use client"` and inherits root defaults. Would need HomeClient split.
5. Add minimal JSON-LD `WebApplication` node to `/compare` (only public metadata page without structured data).
6. `public/manifest.json` — add `screenshots[]` array for richer PWA install banner. (Prior changelog notes 4 broken references were removed in v5.22 — need to add valid ones.)
7. Bump `/s/[id]` twitter card to `summary_large_image` (currently `summary` at `src/app/s/[id]/page.tsx:137`) — but only after a static OG fallback ships. Skip for tonight.

## Keyword gaps (research-only, not implementable tonight without new pages)
- No dedicated landing for "vgc regulation h" / "reg h teams" / "reg i teams".
- No `/speed-tiers` or `/damage-calc` landing pages.
- Long-tail miss: `/champions/[pokemon]` only covers Megas — non-Mega staples (Incineroar, Amoonguss, Urshifu, Rillaboom) have no dedicated pages.
- No `/tournaments/worlds-2026` slug page.

## Sitemap coverage
- Solid overall. Only issue: `/compare` in sitemap but noindex on page (see #3).
- Minor future concern: `LIMIT 5000` on shares — need to paginate sitemap files before hitting cap.
