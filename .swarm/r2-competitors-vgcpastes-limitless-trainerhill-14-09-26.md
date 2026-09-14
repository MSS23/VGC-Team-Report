# R2 — Competitor Teardown: VGCPastes · Limitless · Trainer Hill

**Date:** 2026-09-14 · **Scope:** read-only research · **Repo:** `/home/user/VGC-Team-Report`

**Method / caveats.** The container's egress policy blocks direct HTTPS to `limitlessvgc.com`,
`play.limitlesstcg.com`, `docs.limitlesstcg.com`, `trainerhill.com`, `vgcpastes`-adjacent hosts and
`reddit.com` (403 on CONNECT), and also blocks `pokemonvgcteamreport.com` /
`vgc-team-report.vercel.app` — **our live site was unreachable from here, which is a network-policy
artifact, not an outage**. Findings below are grounded in (a) WebSearch result text, (b) GitHub —
which *is* reachable — where ~20 independent third-party projects document these sites' exact
endpoints and schemas, and (c) a locally-installed `limitless-tournament` skill that wraps the
official Limitless API. PostHog was unavailable; no analytics numbers are asserted anywhere below.

---

## 1. Features

### VGCPastes (`@VGCPastes`)
Not a web app — a **community-curated Google Sheet** plus a distribution layer.

- Sheet ID `1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw`, one tab per regulation
  (`Champions M-C`, `Champions M-B`, `Champions M-A`, `SV Regulation I`, plus SV/SwSh archives).
- Per-row columns: team ID, description, owner/creator, **PokéPaste URL**, an **EVs-present flag**,
  extraction/replica status, tournament + event + rank + date metadata, in-game **rental/replica
  code**, and a "Pokémon Text for Copypasta" species list.
- Volume is meaningful and cadence is event-driven: ~193 teams + 112 rentals for Reg G from 93
  creators; +195 teams in one Reg H/J drop; 65+ teams after Worlds with replica codes.
- A third-party **mobile app (by "heitec")** wraps the sheet with a Rentals tab plus player and
  tournament tabs.

**Honest read:** VGCPastes has *no analysis product at all*. It is a distribution and curation
layer over PokéPaste. It is our closest competitor for *discovery*, and no competitor at all for
*reporting*.

### Limitless — two separate products, frequently conflated
1. **`play.limitlesstcg.com`** — tournament-organizer software (Swiss + single-elim, teamlist
   submission) hosting **grassroots/online** VGC events (VGC Academy, Pokémon VGC League,
   ProfessorKai's). Has a **documented public API** (§3).
2. **`limitlessvgc.com`** — a read-only **tournament database** for **official** events (Regionals,
   Internationals, Worlds): results, `/teams/<id>` teamlists, `/players/<id>` profiles, per-event
   `/tournaments/<id>/statistics` usage, and a `/pokemon` usage-ranking view. Plus
   `standings.limitlessvgc.com` for live standings, usage %, win rates and conversion rates.

Critically: **official events are not on the grassroots platform and vice versa.** Any "import from
Limitless" feature has to decide which of the two it means.

### Trainer Hill
**TCG-only. There is no VGC product.** Its GitHub org (`badge-leaderboard`, `ptcg-calendar-sync`,
`uptime-to-discord`) and its whole tool surface are Pokémon TCG / TCG Pocket. Tools:
Deck Diff Venn Diagram, Deck Diff Table Compare, Tier List Builder, Badge Maker, decklist analysis
(`/decklist`), meta rankings with win rates and matchup spreads (`beta.trainerhill.com/meta`),
a dashboard (`tools.trainerhill.com`), and **Battle Journal / Battle Journal +**
(`plus.trainerhill.com`) for match logging and per-deck win rates.

Treat Trainer Hill as a **product-model reference, not a rival**: it is the clearest proof that
"free tools funnel → Patreon-gated personal analytics" works in competitive Pokémon.

---

## 2. Share, import & export UX

| | VGCPastes | Limitless | Trainer Hill | **Us** |
|---|---|---|---|---|
| Canonical share unit | PokéPaste URL + rental code | `/teams/<id>` page | deck ID | `/s/<id>` report (`src/app/s/[id]/page.tsx`) |
| Import | n/a (human submits via Twitter) | teamlist form at event registration | decklist paste | Showdown paste **or** PokéPaste URL |
| Export | copy paste / rental code | copy teamlist | — | PokéPaste create, rental code copy, OG image, oEmbed, iframe embed |
| Rich analysis attached | none | usage stats only | deck diff, win rates | full report: speed tiers, coverage, matchup plans, modes |

**We already win the round-trip.** `src/app/api/pokepaste/route.ts` implements *both* directions:
`GET` proxies `pokepast.es/<id>/raw` + scrapes the `<h1>` for a team name, and `POST` creates a new
paste (with a well-documented CRLF normalization fix — bare `\n` collapses the whole paste into one
Pokémon block on their parser). The client helpers are `src/lib/utils/pokepaste.ts`
(`isPokePasteUrl` / `fetchPokePaste` / `createPokePaste`), detection lives in
`src/lib/utils/multi-import.ts`, and the UI wires it in `src/components/input/PasteInput.tsx` —
a URL flips the textarea into a "PokéPaste" badge state with a dedicated fetch button and
Ctrl/Cmd+Enter handling.

> ### ⚠️ VGC-225 "PokePaste URL import" appears **already shipped**
> API, client util, source detection and full UI affordance all exist and are wired end to end.
> Before doing any work on VGC-225, the ticket should be re-read against `PasteInput.tsx:202-237`
> and `src/app/api/pokepaste/route.ts` — it is likely either stale/closable, or its real remaining
> scope is narrower than the title (see Opportunity O-4 for what genuinely is missing).

Distribution surface we have that they don't: `src/app/api/oembed/route.ts`,
`src/app/embed/[id]/page.tsx`, `src/app/api/team-graphic/route.tsx`, plus a social layer
(`src/components/social/` — comments, follows, collaborators, version history, view counts) and
`src/app/explore` with species include/exclude, tournament mode, placement, event type and
"rental available" filters (`src/components/explore/ExploreFilters.tsx`).

---

## 3. Tournament data & APIs — the decisive section for VGC-40

### `play.limitlesstcg.com/api` — real, public, documented ✅
- Base `https://play.limitlesstcg.com/api`; docs at `docs.limitlesstcg.com/developer`.
- **No API key needed** for `tournaments`, `tournament standings`, and `games`. A key exists only
  for *higher rate limits* and the *deck rules* endpoint, and is granted to public-facing projects
  on application — so our use case is squarely in scope.
- `tournaments` is filterable by **game, format and organizer** — i.e. `game=VGC`, `format=M-A`
  maps straight onto our Champions work.
- `standings` returns every player with **final placing, score, and their decklist when available**.
- **Webhooks**: you can register a URL called whenever a tournament ends. This is a perfect fit for
  our existing cron/Discord plumbing in `src/app/api/cron/` and avoids polling entirely — and it
  respects the CLAUDE.md "crons daily/weekly max" guardrail because it is push, not pull.
- Confirmed field set per team member: **species + item + ability + 4 moves + tera type**.
  **No EVs, no IVs, no nature, no level.**

### `limitlessvgc.com` — no API, but trivially parseable ❌/⚠️
Third-party docs are consistent: *"No documented API"*, but the site is **server-rendered and every
page is a plain HTTP GET with fields on `data-` attributes — no browser automation needed.**
- `/tournaments?time=all` → one `<tr>` per event with `data-date`, `data-country`, `data-name`,
  `data-format`, `data-players`, `data-winner`.
- `/tournaments/<id>` → standings rows with `data-rank`, `data-name`, `data-country`, links to
  `/players/<id>` and `/teams/<id>`, and the RK9 event ID for cross-referencing.
- `/teams/<id>` → six `div.pkmn[data-id]` blocks carrying **item, ability, nature and moveset**.
- **Two hard limits:** teamlists are **day-2 / top-cut only** (one report measured 156 of 1,096
  players at NAIC 2026), and **no EV or IV data exists on Limitless or RK9** — official team sheets
  simply don't carry it. Any EV spread published anywhere is community-reconstructed.

### Adjacent sources worth knowing
- **RK9.gg** — official tournament software, HTML only, no public API; `/pairings/{event}` gives
  round-by-round results.
- **pokedata.ovh** `/standingsVGC/` — **JSON**, aggregates RK9; described by multiple independent
  projects as the best-structured source for official-event standings and team sheets.
- **VGCPastes sheet** — reachable with no auth via
  `…/gviz/tq?tqx=out:csv&sheet=<tab>` or `…/export?format=csv&gid=<gid>`.
  **This is the only one of the three that carries EV spreads** (filter on the EVs flag column).

### Feasibility verdict
| Ticket | Verdict |
|---|---|
| **VGC-40 (Limitless import)** | **Feasible and high-value, but the ticket is under-specified.** The grassroots API is clean and keyless; the official DB (which is what users mean by "Regionals results") is HTML-scrape-only and top-cut-only. Split the ticket. |
| **VGC-225 (PokePaste import)** | **Likely already done** — see §2. Re-scope or close. |

The single biggest strategic point: **Limitless gives you a team's skeleton but never its EVs. Our
entire product is the EV/SP layer** (`src/lib/analysis/stat-calculator.ts`,
`convertToChampionsSp`, `src/lib/validation/champions-legality.ts`). An imported Limitless team
lands in our app as a *half-finished* report — which is a feature, not a bug: it is a natural
"finish this team" funnel, and nobody else can fill that gap.

---

## 4. Monetization

| | Model |
|---|---|
| **VGCPastes** | None visible. Volunteer curation (named contributors like `@CastorbrownVGC`), value captured by X follower growth. Third-party mobile app is separate. |
| **Limitless** | **Ads + Patreon from $2/mo to remove ads**, funding site and video content across their network. API is free; keys gated by review, not payment. |
| **Trainer Hill** | **Freemium → Patreon.** Free: deck diff, tier list builder, badge maker, meta pages, basic Battle Journal. Paid: **Battle Journal +** (match history, per-deck win rates, opponent matchup data, custom insights, multi-game). |

Pattern across all three: **free public data, paid personal data.** Nobody charges for meta or
tournament results; the paid tier is always *your own* record and *your own* analytics. We have the
raw material for exactly this already — `src/components/match-tracker/MatchTracker.tsx`,
`src/app/api/match-log/route.ts`, `src/app/api/user/analytics/route.ts` — with the caveat that
Neon is on the 512MB free tier, so any match-history expansion needs a storage plan up front.

---

## 5. What each does better than us

**VGCPastes**
1. **Distribution beats product.** They reach players where players already are (X, Discord bots,
   a third-party app) instead of requiring a site visit.
2. **Rental/replica codes as a first-class column.** Their teams are *playable in-game in 30
   seconds*. We store `rentalCode` (`src/app/api/share/route.ts:53`) and filter on it, but we don't
   organise the catalogue around it the way they do.
3. **Event-driven publishing cadence.** Every major event produces a dated, announced, linkable
   drop. We have `src/app/tournaments/TournamentsContent.tsx` but its `TOURNAMENTS` array is a
   **hardcoded constant** — no drop moment, no freshness signal.
4. **Trusted curation.** A named human vouches for each batch.

**Limitless**
1. **Authoritative, complete tournament coverage** with stable per-event and per-team URLs.
2. **A genuine public API with webhooks** — they are the platform others build on, which
   compounds their position for free.
3. **Usage / win-rate / conversion-rate statistics** computed over real events. Our
   `src/app/api/champions/meta/route.ts` derives meta from *our own uploaded reports* with a
   `MIN_REPORTS = 5` floor — honest, but a much smaller and self-selected sample.
4. **Owns the top of the funnel**: people go to Limitless the moment an event ends.

**Trainer Hill**
1. **Comparison as a headline tool.** Deck Diff (Venn + table) is a marquee feature; our
   `src/app/compare/page.tsx` exists but isn't positioned as a flagship.
2. **Match-log analytics productised and monetised** — Battle Journal + is a paid tier, not a
   side feature.
3. **Multi-surface architecture** (`www` / `tools` / `beta` / `plus`) letting them ship
   experiments without destabilising the main site.
4. **Operational maturity in the open** — public uptime monitoring and calendar-sync repos.

**Where we are genuinely ahead of all three:** nobody else produces a *narrative team report*
(matchup plans, common modes, pilot notes — `src/components/report/MatchupPlanSlide.tsx`,
`CommonModesSlide.tsx`), nobody has our **Champions SP** support (`convertToChampionsSp`,
`champions-legality.ts`, `src/app/tools/ev-to-sp`), nobody does EV/spread analysis at all, and
nobody has a social/collaboration layer (`src/components/social/`, `src/app/api/share/[id]/fork`).

---

## 6. Concrete opportunities

> No implementation performed. Each item is a proposed Linear ticket.

**O-1 — `VGC-40a: Import grassroots VGC teams via the public Limitless tournament API` · P1**
Rationale: The API is public, keyless for tournaments/standings/games, filterable by `game=VGC` and
`format=M-A`, and returns species/item/ability/moves/tera per player with placing. This is the
low-risk half of VGC-40 and it should be built first. It feeds our thinnest surface — the hardcoded
`TOURNAMENTS` array in `src/app/tournaments/TournamentsContent.tsx` — with real data, and slots into
the existing `fetchWithTimeout` + `apiGuard` + rate-limit conventions already proven by
`src/app/api/pokepaste/route.ts`.

**O-2 — `VGC-40b: Ingest official event results (limitlessvgc.com / pokedata.ovh) as a separate source` · P2**
Rationale: What users actually mean by "Regionals results" is *not* on the API. `limitlessvgc.com`
is server-rendered with `data-` attributes (no headless browser needed) but is top-cut-only and
HTML-fragile; `pokedata.ovh/standingsVGC/` offers JSON over the same RK9 lineage and should be
evaluated as the primary before committing to a scraper. Keeping this separate from O-1 stops one
brittle parser from taking down the whole feature.

**O-3 — `VGC-40c: Subscribe to Limitless tournament-end webhooks instead of polling` · P3**
Rationale: Limitless can POST us when an event ends. Push beats a cron, respects the
"crons daily/weekly max" guardrail in CLAUDE.md, and reuses the verified-webhook pattern already in
`src/app/api/webhooks/` (clerk/linear/posthog). Do it after O-1 proves the data shape.

**O-4 — `VGC-225: Re-scope — PokéPaste import is shipped; audit and close or narrow` · P1 (triage)**
Rationale: `src/app/api/pokepaste/route.ts` (GET + POST), `src/lib/utils/pokepaste.ts`,
`src/lib/utils/multi-import.ts` and `src/components/input/PasteInput.tsx:202-237` already deliver
the titled behaviour. Genuine residual gaps worth keeping, if any: `isPokePasteUrl` rejects URLs
with query strings or trailing path segments, `multi-import.ts` declares an `ImportSource` union
that the main input path doesn't consume, and there's no bare-ID (`pokepast.es` sans scheme) or
paste-on-blur handling. Cheap to verify, and closing a done ticket is worth more than re-building it.

**O-5 — `Finish-this-team: land an imported tournament team as a report with EVs missing` · P1**
Rationale: **The highest-leverage insight in this teardown.** Limitless and RK9 structurally
*never* publish EVs/IVs/natures. Every imported team is therefore incomplete precisely where our
product is strongest (`stat-calculator.ts`, `convertToChampionsSp`, `champions-legality.ts`,
`SpeedTierChart`). Importing a top-cut team into a report that visibly says "spreads unknown —
fill them in" turns a competitor's dead end into our activation funnel, and is the only durable
reason to import at all rather than just linking out.

**O-6 — `Ingest the VGCPastes sheet as a browsable, EV-complete team catalogue` · P2**
Rationale: It is the **only** one of the three sources carrying EV spreads, plus rental codes and
per-regulation Champions M-A/M-B/M-C tabs that match our format focus exactly. Reachable via
unauthenticated CSV (`gviz/tq?tqx=out:csv&sheet=<tab>`). Two blockers to settle in the ticket
before any code: (a) an explicit **attribution/credit** commitment — the community norm is a
visible "Team data from the VGCPastes Repository" line — and (b) a **rate-limit plan**, since each
row means a separate `pokepast.es` fetch and bulk ingestion is a different policy question from our
current user-triggered import. Filter to rows where the EVs flag is set; normalise species like
`Salamence-Mega` against `src/lib/data/mega-pokemon.ts`.

**O-7 — `Make /tournaments a live, event-driven landing surface` · P2**
Rationale: `TOURNAMENTS` is currently a hardcoded array; the page is SEO-targeted
("VGC Tournament Results Archive") but has no freshness signal. VGCPastes' entire growth engine is
the post-event drop moment. Backed by O-1/O-2 this page becomes the recurring reason to return,
and it already links into `/explore?searchType=tournament`.

**O-8 — `Canonicalise tournament metadata now entered as free text` · P2**
Rationale: `tournamentName`, `placement`, `eventType` and `rentalCode` are optional free-text
strings in `ShareBodySchema` (`src/app/api/share/route.ts:49-60`), and `/explore` filters on them.
Free text means typo-fragmented filters and a meta snapshot that can't be trusted. Importing
canonical event IDs from O-1/O-2 gives us an autocomplete-backed vocabulary — this is quiet
plumbing that quietly raises the ceiling on every discovery feature we ship afterwards.

**O-9 — `Promote team comparison to a flagship tool` · P3**
Rationale: Trainer Hill's Deck Diff is a headline acquisition tool; our `src/app/compare/page.tsx`
is functionally similar but unpositioned. A VGC-native version — shared species, speed-tier overlap,
coverage deltas — is largely composable from existing components (`SpeedTierChart`,
`OffensiveCoverageChart`, `DefensiveCoverageChart`) and is highly shareable.

**O-10 — `Evaluate a supporter tier around match-log analytics` · P3**
Rationale: All three competitors converge on "free public data, paid personal data" (Limitless
$2/mo ad-removal Patreon; Trainer Hill's Battle Journal +). We already have
`MatchTracker.tsx`, `api/match-log`, and `api/user/analytics`. Flagged P3 deliberately: Neon is on
the 512MB free tier and `share_versions` snapshots already cost 447MB once, so this is a
storage-and-cost investigation before it is a feature.

---

## Sources

- [Limitless Developer Guides](https://docs.limitlesstcg.com/developer.html) · [Tournaments endpoint](https://docs.limitlesstcg.com/developer/tournaments) · [Webhooks](https://docs.limitlesstcg.com/developer/webhooks)
- [Limitless VGC database](https://limitlessvgc.com/) · [Standings](https://standings.limitlessvgc.com/) · [play.limitlesstcg.com VGC tournaments](https://play.limitlesstcg.com/tournaments/?game=VGC)
- [limitless-python wrapper](https://github.com/jpbullalayao/limitless-python) · [limitlesstcg-mcp](https://github.com/jpbullalayao/limitlesstcg-mcp) · [CartmanDavis/vgc-data-scrapers](https://github.com/CartmanDavis/vgc-data-scrapers)
- [lancettlim/pokemon-agent data-sources.md](https://github.com/lancettlim/pokemon-agent) · [CourTeous33/Trainer-Assist vgc-competition-data.md](https://github.com/CourTeous33/Trainer-Assist) · [vanwheels/ChoiceBuds vgcpastes-sourcing-feasibility.md](https://github.com/vanwheels/ChoiceBuds)
- [VGCPastes on X](https://twitter.com/VGCPastes) · [VGCPastes Repository sheet](https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw)
- [Trainer Hill](https://www.trainerhill.com/) · [Tools](https://www.trainerhill.com/tools) · [Battle Journal +](https://plus.trainerhill.com/) · [Trainer Hill Patreon](https://www.patreon.com/trainerhill/about) · [Trainer Hill GitHub](https://github.com/Trainer-Hill)
- [Limitless TCG Patreon](https://www.patreon.com/limitlesstcg) · [Patreon launch post](https://limitlesstcg.com/limitless-patreon-launch)
- [RK9.gg](https://rk9.gg) · [pokedata.ovh VGC standings](https://www.pokedata.ovh/standingsVGC/)
