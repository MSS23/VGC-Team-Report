# Wave 1 Research Synthesis — swarm/08-05-26

_Synthesized by orchestrator after all 13 Wave 1 agents completed._

---

## Top 5 Highest-Leverage Opportunities

### 1. Restore OG images on `/s/[id]` shared reports (HIGH IMPACT — viral growth)
Every shared report link shows a blank embed on Discord/Twitter/Reddit. Prior sprite-based approach failed due to CDN timeouts. A **text-only `ImageResponse`** (species names, tournament name, creator — zero external image fetches) is stable on edge runtime and would instantly make every share link a visual ad. R5 data: rich previews drive 3–5× more clicks. This is likely the single biggest unimplemented growth lever in the codebase. Sources: R5, R6, R1.

### 2. Schema / AEO stack (medium effort, compounding ROI)
Four schema additions would materially lift AI-citation and SEO performance:
- `WebSite` + `SearchAction` → Google Sitelinks Searchbox eligibility (15 min)
- `Organization` with `sameAs` social links → AI entity resolution (30 min)
- `FAQPage` on homepage → AI snippet targeting (45 min)
- `robots.txt` explicit AI crawler allow (`GPTBot`, `ClaudeBot`, `PerplexityBot`) (5 min)
VGC Team Report partially appears in AI citations; these changes close the entity-resolution gap. Sources: R6, R7, VGC-155.

### 3. Web Share API + viewer conversion CTA (high virality ROI)
Mobile users share via Discord DMs, iMessage, WhatsApp — none reachable from current platform buttons. Adding `navigator.share()` to `ShareDock.tsx` opens the OS share sheet (2–3× conversion on messaging destinations). Non-auth viewers arrive via shared links with zero signup prompts today. A "Make your own — free" sticky banner after content consumption could convert 5–15% of engaged viewers. Sources: R5, R4, VGC-151.

### 4. Security: unvalidated inputs and Clerk vulnerability (CRITICAL)
- `@clerk/nextjs` 7.0.0–7.2.3 has a confirmed auth-bypass (CVSS 9.1). Fix: `npm install @clerk/nextjs@latest`.
- `shareId` in `/api/reactions/[shareId]` and `/api/comments/[shareId]` passes raw path param to DB with no validation. The share GET route shows the correct pattern (8-char alphanumeric regex).
- Explore API cursor: `parseInt(cursor, 10)` on a tampered string → `NaN` → 500 error.
- Linear webhook: no HMAC-SHA256 signature check.
Sources: C4, C5.

### 5. Dead code + cron policy violation (quick cleanup, compliance)
- 5 orphaned report components (100+ LOC each) safe to delete.
- 2 dead utility files (`passcode.ts`, `csrf-client.ts`) — imports severed.
- `posthog-errors` cron runs every 4 hours (6×/day) — violates CLAUDE.md daily-max policy and burns Vercel cron quota.
Sources: C1.

---

## Top 5 Quick-Win Bugs/Issues

| # | Issue | File(s) | Effort |
|---|-------|---------|--------|
| 1 | Cursor `NaN` → 500 in explore API | `src/app/api/explore/route.ts:154,167` | 10 min |
| 2 | `InlinePokemonEditor` search breaks at 16 prefix matches, drops all contains matches | `src/components/report/InlinePokemonEditor.tsx:60` | 15 min |
| 3 | `Toggle.tsx` `role="switch"` button has no accessible name | `src/components/ui/Toggle.tsx:10` | 5 min |
| 4 | 3 modals lack `role="dialog"` + `aria-modal` + focus trap | `ShareModal.tsx:144`, `PasscodeModal.tsx:50`, `WhatsNewModal.tsx:92` | 45 min |
| 5 | `CHAMPIONS_DEX` Mega section is a manual mirror of `CHAMPIONS_REG_MA_MEGAS` — already caused production bug | Likely `src/lib/data/` | 20 min |

---

## Blockers for Wave 2

- **Clerk upgrade risk**: `@clerk/nextjs@latest` may require config changes alongside the package bump. Agent must test auth flows after upgrade.
- **OG image on edge**: The route must use zero external image fetches (sprite CDN was the prior failure mode). Text-only `ImageResponse` only.
- **VGC-150 auth wall**: Need to investigate whether public share pages (`/s/[id]`) actually gate non-authed users or if the ticket is based on anecdote. Read the page and middleware before making changes.
- **vitest (VGC-149)**: `vitest` binary may not be in `node_modules` — agent may need to run `npm install` first.

---

## Wave 2 Allocation Plan (12 remaining slots)

| Slot | Type | Description | Ticket |
|------|------|-------------|--------|
| W2-1 | Ticket | Fix vitest configuration (install + stale test assertions) | VGC-149 |
| W2-2 | Ticket | Web Share API in ShareDock + viewer sticky CTA | VGC-151 |
| W2-3 | Ticket | HowTo+Article+Organization+FAQPage+WebSite schema + robots.txt | VGC-155 |
| W2-4 | Ticket | Remove/investigate auth wall on public share views | VGC-150 |
| W2-5 | Security | Clerk @latest upgrade | — |
| W2-6 | Security | Validate shareId in reactions/comments + cursor NaN fix + Linear HMAC | — |
| W2-7 | Bug | InlinePokemonEditor search early-break + CHAMPIONS_DEX derivation | — |
| W2-8 | Bug/Clean | Share API duplicate extraction + remove redundant auth() calls | — |
| W2-9 | Feature | Restore OG images on /s/[id] text-only card | — |
| W2-10 | SEO | Home page description + keywords metadata + ItemList schema on /champions | — |
| W2-11 | A11y | Toggle aria-label + modals focus trap + aria-expanded + form labels | — |
| W2-12 | Clean | Delete 5 orphaned components + 2 dead files + fix cron policy | — |
