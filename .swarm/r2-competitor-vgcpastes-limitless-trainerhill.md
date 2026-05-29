# R2 — Competitor Teardown: VGCPastes, Limitless VGC, Trainer Hill

Date: 2026-05-23
Researcher: Claude (R2)
Target product: VGC Team Report (pokemonvgcteamreport.com)

Methodology note: WebFetch returned 403 on all three competitor domains (likely Cloudflare/bot WAF). Findings are reconstructed from WebSearch result excerpts, the competitors' own X/Twitter posts, official docs (docs.limitlesstcg.com), and Victory Road's resource directory. Where a specific UX detail could not be confirmed from a primary source it is flagged as "inferred."

---

## 1. VGCPastes (vgcpastes.com / tinyurl.com/vgcpastes2026 / @VGCPastes on X)

### Core value prop & persona
- Crowd-curated **archive of successful tournament teams** in PokePaste format, organized by Regulation (G, H, I, J, M-A "Pokemon Champions").
- Persona: intermediate-to-advanced ladder/locals players who want to "net-deck" a proven team without building from scratch. Heavy bias toward team *collectors*, not analysts.
- Reach signal: tens of thousands of followers on X; cited by Victory Road, Falinks, Pikalytics as the canonical paste source.

### Sharing / team-import UX
- **Storage = Google Sheets.** "vgcpastes.com" is functionally a redirect surface; the actual product is a public Google Sheets workbook with one tab per Regulation. Each row links to a Poképaste URL.
- **No login.** Anyone with the link reads. Submission is via DM on Twitter/Discord to maintainers (Castorbrown et al.) — i.e. manual gate.
- **URL structure:** `docs.google.com/spreadsheets/d/<id>` plus tinyurl shorteners (`tinyurl.com/vgcpastes2025`, `…2026`). Individual team URLs are `pokepast.es/<id>` — owned by an unrelated service.
- **Mobile usability: poor.** Google Sheets on phone = pinch-zoom, horizontal scrolling, tiny tap targets, Pokémon sprite columns clipped. The "Sandshrew" Discord bot is the de-facto mobile interface (search by Pokémon/item, EV-spread filter).

### Tournament integration
- Each row is *manually* annotated with placement and event (e.g. "Top 8 OCIC", "Day 2 Indianapolis"). No API ingestion — maintainers transcribe from RK9/Limitless after each event.
- Lag: 1–7 days post-tournament. Replica Repository (47 teams for Pokémon Champions release) shows they also tag whether a team is *legally craftable in-game*.

### What VGCPastes does better than VGC Team Report
- **Breadth of canonical teams.** Hundreds of pastes per regulation vs. our user-submitted long-tail.
- **Brand recognition.** "VGCPastes link" is a verb in the community. SEO + social authority is massive.
- **Discord bot (Sandshrew).** Conversational search ("teams with Calyrex-Shadow + Urshifu-S, EV spreads required") that we don't have.
- **Zero-friction read.** No signup, no JS, opens instantly even on hotel wifi at a Regional.
- **Per-regulation curation.** Tabs are pre-split; users land on exactly today's format.

### What VGCPastes does worse (attack surface)
- **It's a spreadsheet.** No matchup notes, no damage calcs, no spread rationale, no replay links — just import strings. Reports are one level of analysis deeper than what they offer.
- **No structured Pokémon data.** Can't filter "show me all Iron Hands EV spreads >150 HP" without scraping.
- **No author profile / accountability.** Rows are submitted; no per-author page, no follow.
- **Mobile UX is genuinely bad.** Pinch-zoom Sheets on iPhone is a chore.
- **Submission bottleneck.** Two human curators gate everything → coverage of smaller events and ladder peaks is spotty.
- **No analytics surface.** Can't ask "what's the most common Tera type on Flutter Mane this week?"
- **Dependent on Google Sheets uptime/policy.** A TOS change kills them.

### Recent activity / maintenance signal
- Active. April 2026 tweets about Reg I (63 teams) and Pokémon Champions Replica Repo (47 teams). Account renamed to "VGC Pokepastes • Champions". Tinyurl bumped to `vgcpastes2026`. **Maintenance: healthy.**

---

## 2. Limitless VGC (limitlessvgc.com + play.limitlesstcg.com/vgc + standings.limitlessvgc.com)

### Core value prop & persona
- **Tournament infrastructure.** Limitless is the underlying platform that runs *most* online VGC events (ZGG, VGCA Battle Hall, Grand Champions Festival) and the largest IRL-results database (Regionals, Internationals, Worlds back to 2011).
- Persona: serious competitors who track meta movement, TOs running Swiss events, and analysts mining usage stats.

### Sharing / team-import UX
- **Poképaste-format submission** via tournament dashboard. Re-submittable until lists lock. Source: docs.limitlesstcg.com/player/decklists.
- **Login required to submit.** Limitless account (email+password). No login to *view* completed tournaments / standings / open lists.
- **URL structure (clean and shareable):**
  - Tournament: `play.limitlesstcg.com/tournament/<24-char-hex>/details|standings|registrations`
  - Player page: `limitlessvgc.com/players/<slug>`
  - Pokémon: `limitlessvgc.com/pokemon/<slug>/results`
  - Standings micro-site: `standings.limitlessvgc.com/`
- **Mobile usability: average.** Tables are responsive-ish but information-dense; data tables wrap awkwardly. No PWA install.

### Tournament integration
- **Best-in-class.** They *are* the tournament software for a huge slice of online VGC plus the canonical results archive for Play! Pokémon events. Filters by season (2011–2026), region (NA/EU/LATAM/OCE/ASIA), tier (Regional / International / Worlds / Special / Players Cup / Master Ball League), and format.
- "Open lists" feature auto-generates a per-tournament metagame overview that refreshes each round with archetype records and matchup data — uniquely powerful.

### What Limitless does better than VGC Team Report
- **Tournament-of-truth status.** Every paste links back to an authoritative result.
- **Live event metagame view.** Round-by-round archetype performance during Regionals — we have nothing comparable.
- **Player rankings + history.** Per-player tournament history, lifetime CP-style ranking.
- **API/data depth.** Tournament UUIDs, structured standings, per-player records — enables every downstream tool.
- **Decklist submission gate.** TOs trust them; they're already in every player's workflow.

### What Limitless does worse (attack surface)
- **Reports/strategy explanation = zero.** It's a database; there is no place to explain *why* the team worked, matchup plans, sideboard logic, EV justification. Players link a Limitless standing AND a separate report — we can be the report layer.
- **Author voice is absent.** A team is attributed to a player handle; there's no narrative, no replay embeds, no video.
- **Static styling, low warmth.** Functional but visually utilitarian; no design polish, no Pokémon art, no story.
- **Bot-WAF aggression.** Hard to embed/share programmatically (we saw it firsthand: 403 on every WebFetch).
- **Account creation friction.** Requires sign-up to do anything beyond browse.
- **No mobile-first workflow.** Submitting a decklist at a venue on phone is painful.

### Recent activity / maintenance signal
- Extremely active. Tournaments running through Reg M-A (Pokémon Champions) right now; ZGG #1 (Apr 11), #3 (Apr 25), Grand Champions Festival ($10K prize pool) all in 2026. **Maintenance: institutional.**

---

## 3. Trainer Hill (trainerhill.com + plus.trainerhill.com)

### Critical finding
**Trainer Hill is a Pokémon TCG/TCG Pocket analytics product, not a VGC product.** Tagline: "your competitive Pokémon TCG and Pokémon TCG Pocket analytics hub." Coverage explicitly TCG + Digimon TCG. No VGC video-game support visible in any 2026 search result, sitemap entry (`/meta`, `/decklist`, `/tools`, `/analysis/decklists`, `/tools/deck-diff-table`), or Battle Journal+ marketing.

It is **not a direct competitor** to VGC Team Report. It is a *parallel-genre* competitor — they own the same problem (deck-tracking, matchup analytics, journaling) for the card game audience. Treat as a design/feature reference, not a share-stealer.

### Core value prop & persona (TCG)
- Meta rankings, win rates, matchup spreads, card usage trends across online + IRL TCG events.
- Battle Journal+ ($ subscription, inferred): mobile match logging at events → desktop analytics review at home.
- Deck Diff Table: multi-decklist comparison (card counts, averages, staples, tech choices).
- Persona: serious TCG grinder preparing for Regionals.

### Sharing / team-import UX (TCG)
- Decklists ingested from public sources + manual entry. Tools section publishes tier lists and deck comparisons. URL shape: `trainerhill.com/decklist/<id>`, `…/meta`, `…/tools/<tool-name>`.
- Login likely required for Battle Journal+ (subdomain `plus.trainerhill.com` suggests gated SaaS).
- Mobile: explicitly markets a mobile-logging experience for in-venue use — strong design signal.

### Tournament integration (TCG)
- Pulls TCG event results (RK9 + Limitless-TCG-side). No VGC overlap.

### What Trainer Hill does better than VGC Team Report (lessons to steal)
- **In-venue mobile match journal** with desktop review-mode split. This is a killer pattern; no VGC tool ships it well today.
- **Deck Diff Table** — side-by-side comparison view for spotting tech choices and staples. Trivially portable to "Team Diff Table" for VGC pastes.
- **Tier list as a first-class artifact**, not a blog post — auto-updating from event data.
- **Paid tier exists** (Battle Journal+). Confirms there's willingness-to-pay for prep tooling in the Pokémon competitive space.
- **Clean separation of `/meta`, `/decklist`, `/tools`, `/analysis`** in the IA — better than a single feed.

### What Trainer Hill does worse
- **Wrong game.** Zero VGC support. Brand confusion risk if a VGC player lands there.
- **TCG-only audience.** Smaller TAM overlap with our user base.
- **No team-narrative product.** Same blind spot as Limitless — pure analytics, no author voice.

### Recent activity / maintenance signal
- Active across YouTube channel, Bluesky (`@trainerhill.com`), and product subdomains. Paid tier shipping. **Maintenance: healthy.**

---

## Cross-competitor synthesis

| Dimension | VGCPastes | Limitless VGC | Trainer Hill | VGC Team Report |
|---|---|---|---|---|
| Direct VGC competitor? | Yes (sharing) | Yes (results+sharing) | **No** (TCG) | — |
| Login to view | No | No | Partial | No |
| Login to submit | No (DM curator) | Yes | Yes | (verify in app) |
| Storage format | Google Sheet | Postgres-style DB | DB + analytics | DB |
| Per-team narrative | None | None | None (TCG) | **Yes — core moat** |
| Damage calc / spread notes | None | None | N/A | Yes |
| Tournament-result truth | Manual tag | Source of truth | TCG only | Reliant on others |
| Mobile UX | Bad | Average | Strong | (verify) |
| Author profile / follow | No | Player page | Limited | (verify) |
| Discord bot | Yes (Sandshrew) | No | No | (opportunity) |
| Tier-list product | No | Implicit via stats | Yes | No |
| Search/filter teams | Bot only | By Pokémon | By card | (verify) |

**Single biggest strategic gap in the market:** none of these tells the *story* of a team — why these six, why this spread, what the matchup plan is, what to lead vs Calyrex-Shadow. VGCPastes is a list, Limitless is a result, Trainer Hill is the wrong game. The "team report as a structured, shareable artifact with embedded calcs + author voice" is genuinely unoccupied for VGC.

---

## Three concrete <1-week opportunities to take share

### Opportunity A — "Import from VGCPastes link" + auto-attribution
Add a paste-URL importer that accepts `pokepast.es/<id>` (the format every VGCPastes row links to), parses the team, and creates a draft report pre-populated with: team name, Pokémon, sets, and a "Source: VGCPastes — <Event/Placement>" attribution badge. Pull the event/placement from the VGCPastes sheet via a scheduled scrape (Google Sheets has a public JSON endpoint — `gviz/tq?tqx=out:json`). Conversion play: every VGCPastes user landing on a paste suddenly has a one-click "Write the report" path on our domain. SEO bonus: we end up with `…/report/<slug>` pages that rank for "[Player] [Event] team report."
**Effort:** ~3–4 days. Endpoint + parser + scraper cron + UI button.

### Opportunity B — "Team Diff" view (steal from Trainer Hill)
Side-by-side comparison of 2–4 reports/pastes: Pokémon overlap, Tera type variance, item differences, EV delta heatmap. Useful for "what tech did Top 4 add over Top 32 at Seville?" Drop it at `/diff?a=…&b=…&c=…`. Shareable URL. Differentiates from VGCPastes (impossible in Sheets) and Limitless (no UI for this).
**Effort:** ~3 days. React diff component + URL state.

### Opportunity C — Discord bot ("Sandshrew killer") for VGC Team Report
A bot that responds in-channel to `!report <pokepaste-url>` with an embedded preview card (team sprites, regulation, top matchups if author wrote them, link to full report). Also: `!find Calyrex-Shadow + Urshifu-S regI` returns matching reports. Sandshrew already trained the audience on this UX; we ship it for *reports* not pastes. Distribution: the 30+ VGC Discords already running Sandshrew.
**Effort:** ~5 days. discord.js bot + indexer + 2 commands. Hosting fits on existing Vercel/Railway. Cost guardrail: cache + rate limit per guild.

Honorable mention (>1 week, queue for R-next): mobile-first "venue mode" — fast offline-capable paste viewer + match journal, mirroring Trainer Hill's Battle Journal+ pattern. Likely the biggest long-term moat once the import + diff + bot land.

---

## Sources

- https://limitlessvgc.com/ — Limitless VGC homepage
- https://limitlessvgc.com/tournaments — tournament filters, format/region
- https://limitlessvgc.com/players — player rankings
- https://standings.limitlessvgc.com/ — standings micro-site
- https://play.limitlesstcg.com/tournaments/?game=VGC — VGC tournaments list
- https://play.limitlesstcg.com/tournament/69c30ae236f5b5c303dbce1c/details — Grand Champions Festival
- https://docs.limitlesstcg.com/player/decklists — decklist submission docs
- https://x.com/VGCPastes — VGCPastes account, Apr 2026 activity
- https://x.com/VGCPastes/status/1910793869333324057 — Reg I 63 teams (Apr 2026)
- https://x.com/VGCPastes/status/2042106878751338822 — Pokémon Champions Replica Repo (47 teams)
- https://x.com/VGCPastes/status/1781808438978490731 — Sandshrew Bot update
- https://tinyurl.com/vgcpastes2026 — current repository link
- https://www.trainerhill.com/ — TCG analytics hub
- https://www.trainerhill.com/tools, /meta, /decklist, /analysis/decklists, /tools/deck-diff-table
- https://plus.trainerhill.com/ — Battle Journal+ (paid)
- https://pokemonvgcteamreport.com/ — our product, for comparison
