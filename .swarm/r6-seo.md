# R6: SEO + AEO/GEO Audit

## Overall: 8.5/10 — Production-ready SEO infrastructure with minor polish opportunities

## Sitemap Analysis

Static paths emitted:
- `/`, `/explore`, `/champions`, `/faq`, `/feedback`, `/tournaments`, `/compare`, `/changelog`, `/privacy`, `/terms`
- Dynamic: `/champions/[pokemon]`, `/s/[id]`, `/creator/[name]`

**CRITICAL FLAW:** Sitemap contains a duplicate `/compare` entry at different priorities (lines 16 & 18) — wastes crawl budget. **HIGH-PRIORITY FIX.**

## Metadata Audit — EXCELLENT

All public pages have complete metadata: title, description, canonical, OpenGraph, Twitter.
Intentionally noindex: `/dashboard`, `/notifications`, `/embed/[id]`, `/compare`, `/s/[id]?key=...` (edit tokens).

## JSON-LD / Structured Data Audit — STRONG

In use: WebSite, Organization, HowTo (x2), FAQPage, BreadcrumbList, ItemList, SportsEvent, ProfilePage, CollectionPage.

**Gaps:**
- `/champions/[pokemon]` (Mega Pokémon guides) — No Article/Guide schema despite being guide pages.
- `/s/[id]` (team reports) — Could benefit from Article schema (tournament reports are articles).

## AEO/GEO — EXCELLENT

robots.txt allows GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot ✓
llms.txt + llms-full.txt present and comprehensive ✓
manifest.json complete ✓

## Top 5 SEO Wins

1. **Remove duplicate `/compare` sitemap entry** (HIGH, trivial 1-line fix)
2. **Add Article schema to `/s/[id]`** (HIGH, ~10 lines)
3. **Add Guide schema to `/champions/[pokemon]`** (MEDIUM, ~15 lines)
4. **Expand internal linking in `/explore` and `/tournaments`** (MEDIUM)
5. **Explicit metadata export in `/src/app/page.tsx`** (LOW, defensive)

## Conflict-Risk Check
None of these top 5 are in `.swarm/main-changed-files.md`.
