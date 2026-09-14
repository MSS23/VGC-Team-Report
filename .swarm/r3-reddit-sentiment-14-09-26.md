# R3 — Community Sentiment Scan: team sharing / team reports
**Date:** 2026-09-14 · **Researcher:** R3 (UX Research) · **Mode:** read-only, no outbound sending

---

## 0. READ THIS FIRST — Signal quality disclosure

**I did not obtain a single primary-source Reddit quote. Zero.** r/VGC and r/stunfisk were unreachable through every available path:

| Path attempted | Result |
|---|---|
| `WebFetch` → `reddit.com/r/VGC/search.json` | `Claude Code is unable to fetch from www.reddit.com` |
| `WebSearch` with `allowed_domains: [reddit.com]` | `400 — domains not accessible to our user agent` |
| `curl` → reddit.com (via agent proxy) | `CONNECT tunnel failed, response 403` |
| Reddit mirrors (redlib.catsarch.com, safereddit.com) | `HTTP 000` — egress blocked |
| DuckDuckGo HTML/Lite (to scrape SERP snippets) | `HTTP 000` — egress blocked |
| `WebFetch` → smogon.com (fallback forum) | `EGRESS_BLOCKED by network egress proxy` |
| `WebFetch` → crob.at (competitor) | `EGRESS_BLOCKED` |
| GitHub MCP → `felixphew/pokepaste` issues | `Access denied — session scoped to mss23/vgc-team-report only` |

The **only** working research tool was `WebSearch`, which returns (a) real result titles + URLs from an index, and (b) an LLM-written prose summary of pages **I could not open to verify**.

**Two contamination traps I hit, flagged so nobody downstream mistakes this for community sentiment:**

1. **Competitor marketing copy was returned as if it were user complaints.** The phrasing "PokePaste has real limitations that competitive players run into: text only… no social embeds… single-team only… occasional downtime as a community-run service with no SLA" recurred near-verbatim across four separate searches. It traces to `crob.at/pokepaste-alternative` — a competitor's SEO landing page literally titled *"Best PokePaste Alternative."* **This is a rival's sales pitch, not community sentiment.** It is plausible, and it is not evidence.
2. **Our own site was fed back to me as a finding.** Searches for "is there a website to share VGC team reports" and "VGC team sheet tool" returned `pokemonvgcteamreport.com` and `/faq`, and the summarizer paraphrased **our own FAQ copy** back as the answer. Good SEO signal (see §5); useless as sentiment, and actively misleading if unnoticed.

**PostHog is unavailable this run (no credentials).** No rage-click, funnel, drop-off, or session data was consulted. Any behavioural claim below would be fabricated, so there are none.

**Net honest verdict: this run produced roughly one-quarter of a sentiment study.** What follows is graded A/B/C/D by evidence strength. Only Grade A should be treated as fact. §6 tickets are weighted accordingly — most are marked *validate-first*, not *build*.

---

## 1. Top complaints

### Grade A — verifiable (source exists at a real URL; title/existence confirmed via search index)

These are real artifacts. I could confirm they exist and what they are about; I could **not** open them to quote them.

**A1 — Showdown's own team-sharing interface is an acknowledged usability problem.**
Smogon thread, status-tagged **"In Progress"**: *"Improve interface usability for teams.pokemonshowdown & /view-teams-view"*
→ https://www.smogon.com/forums/threads/improve-interface-usability-for-teams-pokemonshowdown-view-teams-view.3785347/
The most useful find of the run. An "In Progress" tag on Smogon means maintainers accepted it as a genuine defect, not a wishlist item. The pain is upstream of PokePaste: sharing from Showdown itself is clumsy.

**A2 — PokePaste has a recurring class of "paste won't create / won't load" bugs.**
Open issues on the PokePaste repo:
- `No or invalid paste` → https://github.com/felixphew/pokepaste/issues/99
- `Problems when trying to create a pokepaste.` → https://github.com/felixphew/pokepaste/issues/313
Titles confirmed via search index; bodies inaccessible (repo not in MCP scope). Two independently-filed issues describing creation/retrieval failure is a real reliability signal about the incumbent.

**A3 — Showdown↔PokePaste integration is fragile enough to generate upstream bugs.**
- `Trying to Generate Random Team to PokePaste` → https://github.com/smogon/pokemon-showdown/issues/8385
- `Use jQuery for uploading teams to PokePaste` → https://github.com/smogon/pokemon-showdown-client/issues/1580
The export handoff — the exact step our funnel depends on — is a known friction point in Showdown's own tracker.

**A4 — The long-running PokePaste discussion thread.**
→ https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/ (and `/page-2`)
Years of user feedback sitting behind an egress block. **This is the single highest-value unread source in this study** — it should be read manually before any roadmap decision is made off this document.

### Grade B — relayed but unverified (search summarizer attributed these to A4; I could not open A4 to confirm)

Treat as leads to verify, not findings. Do not quote these to anyone.

- **B1 — extended, unexplained inability to load pastes.** Summarizer: *"One user reported being unable to load pokepastes for about a week despite clearing cookies, using different browsers, and restarting."* If real, that is days-long breakage with no status page and no recourse — consistent with A2.
- **B2 — encoding bugs on nicknames.** Summarizer: *"emojis in nicknames causing errors."* A parser-robustness complaint, and directly relevant to our own parser.
- **B3 — PokePaste took feedback from r/stunfisk historically.** Indicates the subreddit is the right venue; I just couldn't reach it.
- **B4 — "searching pokemon is tedious."** Attributed to a Google Play review of a VGC damage-calc app (`io.github.thecano.mobile_vgc_damage_calculator`), **not** to Reddit and **not** about team sharing. Included only because it is the one piece of language in this entire run that sounds like an actual annoyed user. Weak and off-target.

### Grade C — competitor marketing, NOT sentiment

Recorded so it is never re-laundered into a requirements doc. From `crob.at/pokepaste-alternative`: PokePaste is text-only (no sprites/item icons/visual preview); no Discord/Twitter social embeds; single-team only; community-run with no SLA. Self-serving framing by a direct competitor. Plausible as product analysis; **zero** evidentiary weight as community sentiment.

### Grade D — my inference

Nothing here is sourced. The competitive landscape below is real (all URLs verified present in the index); the demand *reasoning* is mine.

Six-plus tools have shipped into this space, which implies unmet demand even without a single quote:

| Tool | URL | Niche |
|---|---|---|
| crob.at | https://crob.at/ | Visual paste rendering, social embeds |
| teamsheet.gg | https://teamsheet.gg/generator | Showdown import → **official Play! Pokémon team list PDF** |
| DraftCentral | https://www.draftcentral.gg/tools/pokemon-team-sheet-generator | Team sheet, broadcast graphic, **7-language OTS** |
| VR Pastes | https://www.vrpastes.com/ | Team sharing |
| Porygon Labs | https://www.porygonlabs.com/ | Champions damage calc + team builder |
| VGC OTS (extension) | https://github.com/robsonbittencourt/vgc-ots | Pins OTS above Showdown chat log |
| VGCPastes | https://x.com/vgcpastes | Curated tournament paste repo + mobile app |

Two clusters keep recurring independently: **(a) make the paste visual/embeddable**, and **(b) get the team onto a tournament-legal sheet**. Convergence across unrelated builders is the strongest demand signal I obtained this run — which says more about how weak the direct signal was than how strong this inference is.

---

## 2. Unmet needs

Ranked by evidence, not by appeal.

1. **Reliability with an owner** (Grade A2/B1). The incumbent is a volunteer project that intermittently fails to create or serve pastes, with no status page. Uptime is a *feature* here.
2. **Escape from Showdown's export UX** (Grade A1/A3). Acknowledged-defective upstream. Anything that shortens or replaces "teambuilder → Export → copy → paste" is aimed at a confirmed sore spot.
3. **Tournament-legal output, not just pretty output** (Grade D). Two separate competitors built *official Play! Pokémon PDF* generation specifically. This is a real, unglamorous job-to-be-done.
4. **Multi-language OTS** (Grade D). DraftCentral ships EN/FR/IT/DE/ES/JP/KO — matching the official form's languages. That's a deliberate, EU/JP-regional-driven choice.
5. **Parser robustness on weird input** (Grade B2). Emoji nicknames, malformed pastes.
6. **Multi-team sharing in one link** (Grade C — competitor claim only, unvalidated).

---

## 3. What we already solve

Grounded in the repo at `/home/user/VGC-Team-Report`. Verified by file inspection.

| Complaint / need | Status | Evidence |
|---|---|---|
| No sprites / item icons / visual preview | **Solved** | `src/components/report/PokemonSprite.tsx`, `ItemIcon.tsx`, `PokemonCard.tsx`, `src/app/api/sprite/route.ts` |
| No Discord/Twitter social embed | **Solved** | `src/app/api/team-graphic/route.tsx`, `src/app/opengraph-image.tsx`, `src/app/api/oembed/route.ts`, `src/app/embed/[id]/page.tsx` |
| No editing after publishing | **Solved** | `src/components/ui/EditFab.tsx`, `src/components/report/InlinePokemonEditor.tsx` |
| No version history / no diffing | **Solved** | `src/app/api/share/[id]/versions/route.ts`, `src/components/social/VersionHistoryPanel.tsx`, `EditChangelog.tsx`, `src/components/ui/DiffNavigator.tsx` |
| No ownership / no account | **Solved** | Clerk; `src/app/dashboard/`, `src/app/creator/[name]/`, `src/app/api/user/*` |
| Reliability / no SLA (A2, B1) | **Solved structurally** | Vercel Pro + Neon vs. a volunteer box. Our main durable advantage over PokePaste. |
| Open Team Sheet generation | **Solved** | `src/components/ui/OTSSheetModal.tsx` — six sprites + QR ("Scan for full report") |
| Damage calcs without tool-switching (B4-adjacent) | **Solved** | `src/components/report/CalcInput.tsx` |
| Speed tiers | **Solved** | `src/components/report/SpeedTierChart.tsx` |
| Matchup notes / prep docs | **Solved** | `MatchupSheet.tsx`, `MatchupSheetRow.tsx`, `MatchupPlanSlide.tsx`, `TournamentMode.tsx` |
| Mobile-hostile plain text | **Likely solved** | `PullToRefresh.tsx`, `SwipeHint.tsx`, `InstallPrompt.tsx` (PWA), `ServiceWorkerRegistration.tsx` — *not* verifiable this run; live site blocked, no PostHog |
| Privacy / spread secrecy pre-tournament | **Partially solved** | `src/lib/sharing/redact-paste.ts`; ShareModal "Private account access" |
| Multi-team browsing | **Partially solved** | `src/app/api/user/collections/` — collections exist; one-link-many-teams not confirmed |

**We already solve most of Grade C — the competitor's own pitch list.** Sprites, embeds, and reliability are shipped. If crob.at's framing is accurate about the market, we are not behind on it.

---

## 4. Gaps

| # | Gap | Evidence grade | Notes |
|---|---|---|---|
| G1 | **No German (`de`) locale** | D (concrete) | `src/lib/i18n/translations/` = en, es, fr, it, ja, ko, zh. DraftCentral ships DE; official Play! Pokémon sheets include DE; Germany hosts EU regionals. Cleanest verified gap in this report. |
| G2 | **No official Play! Pokémon team-list PDF** | D | `src/components/ui/PdfExport.tsx` contains no "official"/"Play! Pokémon"/"teamlist"/A4/Letter markers. teamsheet.gg and DraftCentral both target this deliberately. |
| G3 | **Single-team parse only** | D (likely) | `showdown-parser.ts:174` handles one `=== [format] Team Name ===` header → one `ParsedTeam`. A multi-team teambuilder export likely degrades. Needs a 5-minute test. |
| G4 | **Parser robustness on emoji/unicode nicknames** | B2 | Unverified upstream complaint; cheap to defend against regardless. |
| G5 | **No direct Showdown import path** | A1/A3 | Still copy-paste. The confirmed-defective step is the one we depend on. |
| G6 | **OTS modal may not be localized** | D | Localizing the OTS specifically is what DraftCentral competes on; unclear whether our 7 locales reach `OTSSheetModal.tsx`. |
| G7 | **No validated sentiment data at all** | — | The meta-gap. Everything above rests on inference and blocked sources. |

---

## 5. Incidental finding — SEO

Unprompted, `pokemonvgcteamreport.com` and `/faq` ranked in the index for *"is there a website … share team report speed tiers teambuilder"*, *"VGC open team sheet OTS generator tool"*, and *"VGC damage calc speed tier team prep"* — and the summarizer recommended us by name. The SSG/FAQ/JSON-LD work is landing. (Also why sentiment searches self-contaminate: we are now part of the corpus.)

---

## 6. Suggested Linear tickets

Priorities reflect **evidence strength**, not excitement. Most are validation, because that is what this run actually justifies.

| Priority | Suggested title | Rationale |
|---|---|---|
| **P1** | `Research: manually read Smogon PokePaste thread 3601073 (pp.1–2) + usability thread 3785347 from an unblocked network` | Grade A sources, unread. Converts B-grade guesses into facts and validates or kills G3/G4. Cheapest highest-value action available. |
| **P1** | `Research: re-run r/VGC + r/stunfisk sentiment scan from an unblocked network` | The assigned task could not be performed. Must be explicitly re-scheduled or the gap will be silently inherited as "researched." |
| **P2** | `i18n: add German (de) locale` | G1. Only fully verified gap; matches the official form's language set and EU regional attendance. |
| **P2** | `Spike: validate multi-team Showdown export against showdown-parser` | G3. Timeboxed test; may be a no-op or a silent data-loss bug. |
| **P2** | `Parser: harden against emoji/unicode nicknames + malformed pastes (+ regression test)` | G4. Low cost, aligns with the "regressions get a named test" convention. |
| **P3** | `Spike: official Play! Pokémon team list PDF export` | G2. Two competitors invested here; unvalidated for us. Spike before committing. |
| **P3** | `Audit: confirm OTSSheetModal renders in all 7 supported locales` | G6. Verification, not a build. |
| **P3** | `Research: scope a direct Showdown import (beyond copy-paste)` | G5. Confirmed-defective upstream step; likely expensive — scope first. |
| **P4** | `Instrument + review PostHog funnel for paste → report → share` | Blocked this run. The real answer to "what do users hate" is in our own data, not on Reddit. |

---

## 7. Confidence

| Section | Confidence |
|---|---|
| §1 Grade A complaints | **High** — real, sourced artifacts (titles/URLs only, bodies unread) |
| §1 Grade B complaints | **Low** — unverified relay through a summarizer |
| §1 Grade C | **N/A** — competitor marketing, logged to prevent laundering |
| §2 Unmet needs | **Low–Medium** — items 3–6 are inference from competitor convergence |
| §3 What we solve | **High** — direct file inspection |
| §4 Gaps G1 | **High** · G2/G3/G6 **Medium** · G4/G5 **Low–Medium** |
| §5 SEO | **Medium** — consistent across searches, not measured |

**Bottom line: no primary community sentiment was collected. Do not cite this document as evidence of what r/VGC or r/stunfisk think.** Its usable output is (a) four real unread sources worth opening, (b) a verified competitive landscape, and (c) one confirmed product gap (German locale). The P1 re-runs are the point of this report.

---

*Read-only run. No files in `src/` modified. No commits, no pushes, no outbound posts, no forms submitted. No Reddit draft was written — none was required by the output spec.*
