# Swarm Research Synthesis — 16-05-26

Synthesised from 8 Wave 1 agent reports (R1, R3, R6, R8, C1-C2, C4, C5, R-indy).

---

## Top 5 Highest-Leverage Opportunities

### 1. AEO/GEO: llms.txt + AI citation infrastructure
**Confidence: Very High | Impact: High**
R6 confirmed the site has zero llms.txt — the #1 AEO gap. Perplexity/ChatGPT use site-structure signals and `llms.txt` to index tools. **SHIPPED tonight** as `public/llms.txt` + `public/llms-full.txt`.

### 2. Unlisted Privacy Tier
**Confidence: High | Impact: High**
R1 found vgc.tools as a new competitor (Champions-era). #1 feature gap vs all competitors: no competitor offers a proper "unlisted" visibility tier (draft → unlisted → public). High-level players don't publish before tournaments. Filed as new Linear Backlog ticket.

### 3. Indianapolis Regionals window (May 29–31)
**Confidence: Very High | Impact: High**
R3 found VGCPastes has only 63 Champions-era teams vs 1,150+ for SV. Community archiving habits are unformed. The Indy Regionals window is the highest-leverage outreach moment in the next 2 weeks. Filed content strategy ticket.

### 4. Security: Next.js upgrade 16.2.2 → 16.2.6
**Confidence: Very High | Impact: High**
C4 found 8 high/critical CVEs in next@16.2.2 including SSRF (CVSS 8.6) and auth bypass (CVSS 8.1). `npm audit fix` resolves. Filed as urgent bug ticket.

### 5. Dead code removal
**Confidence: High | Impact: Medium**
C1-C2 found 14 dead exports across `src/lib/` — `evSpreadToSp`, `spToEvSpread`, `formatSpSpread`, `isChampionsOptimized`, `importTeam`, `isLinearConfigured`, `getBaseFormName`, `getMegaDataKey`, plus 2 unused imports. Filed as cleanup ticket.

---

## Top 5 Quick-Win Bugs / Code Issues (from C5)

1. **totalReports regression** in champions/meta — **SHIPPED** (total FROM filtered, not per_team)
2. **/?sample=1 broken link** in ExploreEmpty — **SHIPPED** (fixed to sample-groudon-sun)
3. **posthog.capture TS error** in page.tsx — **SHIPPED** (optional chain)
4. **iOS PWA prompt never fires on non-scrolling pages** — InstallPrompt missing fallback for full-viewport iPads. Filed as bug ticket.
5. **MatchTracker delete missing Escape + focus management** — filed as a11y improvement ticket.

---

## Wave 2 Implemented Tonight

| Ticket/Task | Status | Notes |
|-------------|--------|-------|
| VGC-188 | ✅ Shipped | 3-card homepage sample picker |
| A11Y-PASS | ✅ Shipped | aria-label, aria-pressed, 44px targets |
| VGC-189 | ✅ Shipped | species[] column migration + extractor |
| SECURITY-FIXES | ✅ Shipped | 3 API auth issues |
| SEO-LLMS | ✅ Shipped | llms.txt + SportsEvent JSON-LD |
| BUG-FIXES | ✅ Shipped | 3 quick bug fixes |
| VGC-181 (Indy data) | ⏳ Deferred | Event not until May 29-31 |
| VGC-187 (PWA screenshots) | ⏳ Deferred | Requires real browser screenshots |
| VGC-174 (Web Share API) | ✅ Already done | Code was already shipped |

---

## New Linear Backlog Tickets to File (from Research)

1. **Unlisted privacy tier** — R1, high impact, 1-2 day scope
2. **Next.js upgrade 16.2.2 → 16.2.6** — C4, urgent security
3. **Dead code cleanup** — C1-C2, 14 exports, quick win
4. **iOS PWA prompt fallback for non-scrolling pages** — C5, bug
5. **MatchTracker delete: Escape key + focus management** — C5/R8, a11y
6. **Content/outreach: Indy Regionals window strategy** — R3, outreach plan (no-claude)
