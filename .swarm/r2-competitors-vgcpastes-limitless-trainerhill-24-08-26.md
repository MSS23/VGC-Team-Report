# R2 — Competitor Teardown: VGCpastes · Limitless TCG/VGC · Trainer Hill

**Date:** 24 August 2026
**Agent:** R2 (read-only trend/competitor research)
**Scope:** Product teardown across core features, share/view UX, monetization, SEO surface, exclusive data sources, and where each beats VGC Team Report.

## Method & limitations (read first)

The egress proxy blocked direct `WebFetch` on almost every target domain:
`limitlessvgc.com`, `play.limitlesstcg.com`, `docs.limitlesstcg.com`,
`www.trainerhill.com`, `www.pikalytics.com`, `www.patreon.com`,
`bulbapedia.bulbagarden.net`. `github.com` **was** fetchable, as was
WebSearch throughout.

Consequently this teardown is built from: (a) WebSearch result snippets, which
returned substantial page-body text for the blocked domains; (b) the fetchable
`github.com/Trainer-Hill` org; (c) a locally-installed skill,
`/root/.claude/skills/synced/limitless-tournament`, whose
`references/api-notes.md` documents the Limitless public API first-hand; and
(d) read-only inspection of this repo.

Where a claim rests on a single snippet it is marked *(single source)*.
Nothing was posted, submitted, or written outside `.swarm/`.

---

## 0. Headline findings

1. **Limitless runs an official, free, key-less public API** (`https://play.limitlesstcg.com/api`)
   with a **tournament-finished webhook**. It covers VGC. This is the single
   largest untapped data source in the teardown and it is documented, sanctioned,
   and free.
2. **The API deliberately omits EVs / IVs / nature / level.** So does every OTS
   (Open Team Sheet) at official events. That omission *is* VGC Team Report's
   moat — every competitor can tell you *what* six Pokémon won; none can tell
   you the spread or the reasoning.
3. **Trainer Hill is a Pokémon TCG product, not a VGC product.** It is not a
   direct competitor. It is valuable instead as the **best-executed analytics
   playbook in the adjacent market**, and as the clearest **monetization proof
   point** ($3/mo Patreon tier on a niche tournament-analytics tool).
4. **Both monetize at the same price band: $2–$3/month via Patreon.** Limitless
   $2/mo (ad removal); Trainer Hill $3/mo (Battle Journal +). VGCpastes: $0,
   pure volunteer.
5. **Two repo-level liabilities surfaced during grounding** (details in §6):
   `src/data/indy-top-cut.ts` publishes **fabricated placeholder top-cut data**
   for a tournament that concluded ~3 months ago, and
   `src/app/tournaments/page.tsx` publishes **the wrong Worlds 2026 dates inside
   `SportsEvent` JSON-LD**.
6. **The Champions-era competitive landscape has exploded.** Beyond the three
   targets, search surfaced at least eight live entrants that did not exist or
   were marginal at the last teardown: `champdex.com` (with a shipped **iOS
   app**), `metavgc.com`, `crob.at`, `champteams.gg`, `pokebase.app`,
   `pokemon-zone.com`, `pokemonchampionsreplicateams.com`, and — most
   directly — **`reportworm.com`**, which markets itself as "VGC Team and
   Replay Analysis" and auto-generates a team report with matchup details,
   usage stats, and damage calcs. Reportworm is arguably a closer competitor
   than any of the three named targets and warrants its own teardown.

---

## 1. VGCpastes

### What it is

A three-layer, all-volunteer community paste repository — still the default
answer to "where do I get a team to play right now."

| Layer | Detail |
|---|---|
| **Google Sheets repository** | Primary data store. `tinyurl.com/vgcpastes2026` for the Champions repo. One sheet per regulation. |
| **Sandshrew Bot (Discord)** | Search/retrieval layer. Official VGCpastes bot; listed in the Discord App Directory (app id `964203274695745636`). |
| **Falinks Teambuilder** | Open-source Next.js web browsing/building layer at `falinks-teambuilder.com/pastes/vgc/`. Repo: `github.com/txfs19260817/falinks-teambuilder`. **A daily automated task synchronises the VGCPastes repository into the Falinks database** — so the Sheet is the source of truth and Falinks is a derived read model. |

### Current state (Aug 2026)

- The X account (`@VGCPastes`) now reads **"VGC Pokepastes • Champions MB"** —
  they have already rolled the repo to **Regulation M-B**, the format running
  17 Jun → 26 Aug 2026. The rebrand cadence (Reg F → Reg H → Champions MA →
  Champions MB) shows they re-cut the repository within days of each format
  change.
- Champions repo trajectory: launched with **47** Replica Teams, hit **135+**
  within roughly three weeks *(single source: @VGCPastes status 2042695109754654984)*.
- Discord membership has grown to **~14,789 members** (up from the ~8,371
  recorded in the May teardown) — a ~76% increase in one quarter. This is the
  fastest-growing distribution asset among all three targets.
- Sandshrew Bot was rebuilt for Reg M-A in April 2026: Search and Random Team
  "improved to be a lot more streamlined! No more annoying txt files… you get
  to scroll through pages and reroll teams on the same message."

### Core features

- `/search` — filter by Pokémon, item, EV status.
- `/get rental` — replica/rental-code teams only.
- `/random team` — paginated, rerollable in-message.
- `/openteam` — converts a paste to Open Team Sheet format.
- Sheet columns: Team ID, Player, Event, Placement, 6 Pokémon, Items, Pokepaste
  URL, EV status, Replica/Rental code, Date, Source link, video/report links.
- Falinks adds: real-time collaborative teambuilding (Yjs + SyncedStore),
  Showdown/PokePaste import-export, filtering, usage aggregation, OTS parsing.

### Share / view UX

- **Share primitive:** a PokePaste URL plus, for Champions, an in-game
  **Replica Code**. That's it — no embed, no OG card, no native share sheet.
- **Submission is a human bottleneck:** DM `@VGCPastes` on X or post in the
  Discord `submit-reg-ma-teams` channel; a maintainer types it into the sheet.
  No self-service form, no API, no upload.
- **Mobile is broken and they know it.** Their own post: *"Some mobile users
  are having trouble opening the sheet, our Discord's 'submit-reg-ma-teams'
  channel has links to the replicas as well."* The documented workaround for a
  broken web experience is "go use Discord instead."

### Monetization

**None.** No ads, no tier, no Patreon. Falinks runs on personal infra.

### SEO surface

**Effectively zero, and this is their structural weakness.** The canonical
artifact is a Google Sheet behind a `tinyurl` redirect — not crawlable, not
indexable, no titles, no schema, no per-team URLs. Falinks provides some
indexable surface at `/pastes/vgc/` but it is a filtered app view, not a
per-team page. VGCpastes owns the community and owns *none* of the search
demand it generates. Search queries like "Pokémon Champions replica teams"
return `crob.at`, `champdex.com`, `victoryroad.pro`, and
`pokemonchampionsreplicateams.com` — not VGCpastes.

### Data they have that we don't

- **Replica / rental codes** — the in-game code that makes a team instantly
  playable without building it. We surface none.
- **Provenance chain per paste** — event, placement, creator credit, source
  link, video/report link, and an explicit **"EV status"** flag (whether the
  spread is known/verified). That last column is a direct analogue of our core
  value and they track it as metadata.
- **Creator relationships.** Teams arrive because creators trust the
  maintainers. That is a social asset, not a technical one.

### What they do better

1. **Raw volume and speed.** A populated repository within days of a format
   change, every format, for years.
2. **Replica codes** — zero-friction playability.
3. **Discord-native distribution.** Sandshrew meets players inside the window
   where they already discuss teams. Sub-30-second retrieval.
4. **Canonical placement.** Linked from Victory Road, VGCpedia, Smogon,
   DevonCorp, "New to VGC" linktrees. We appear on none of these.
5. **Derived-read-model discipline.** The daily Sheet→Falinks sync is a clean,
   cheap pipeline pattern.

### Where they're weak (our openings)

- Spreadsheet UX; hostile on mobile by their own admission.
- **Zero narrative.** A paste says *what*, never *why*. No EV rationale, no
  benchmarks, no matchup plan, no lead logic.
- No player/creator pages, no follows, no history.
- No self-service ingestion — hard scaling ceiling.
- No search visibility whatsoever.

---

## 2. Limitless (limitlessvgc.com / play.limitlesstcg.com / standings.limitlessvgc.com / labs.limitlesstcg.com)

### What it is

The authoritative VGC tournament results database, plus an online tournament
platform, split across four properties:

| Property | Role |
|---|---|
| `limitlessvgc.com` | Primary VGC database — tournaments, teams, player rankings, Pokémon rankings. |
| `standings.limitlessvgc.com` | Deep drill-down: per-round standings, pairings, per-player teamlists, per-event Pokémon usage, **age-division splits**. |
| `play.limitlesstcg.com` | Online tournament management for both VGC and TCG. Swiss pairings, teamlist submission, standings, broadcasts. **The API and webhooks live here.** |
| `labs.limitlesstcg.com` | Experimental in-depth tournament data (TCG-leaning). |

### The public API — the most important finding in this report

From `references/api-notes.md` in the installed `limitless-tournament` skill,
corroborated by search results for `docs.limitlesstcg.com/developer.html`:

- **Base:** `https://play.limitlesstcg.com/api`
- **Docs:** `https://docs.limitlesstcg.com/developer.html`
- **Auth:** *No API key required* for `/tournaments`, `/standings`,
  `/details`, `/pairings`. A key exists only for higher rate limits and the
  `/games/{game}/decks` categorisation endpoint, and is granted to
  "public-facing projects with a legitimate use-case."
- **Endpoints:** `/tournaments` · `/tournaments/{id}/details` ·
  `/tournaments/{id}/standings` · `/tournaments/{id}/pairings`
- **Tournament IDs:** 24-char hex.
- **Rate limits:** enforced, exposed via rate-limit response headers; 429s
  should be backed off exponentially, not looped.
- **Webhooks:** *"You can register a URL that should be called whenever a
  tournament on the site ends"* — push-based freshness, no polling cron needed.
- **Per team member the API returns:** Pokémon, item, ability, 4 moves, Tera
  type. **It does NOT return EVs, IVs, nature, or level.**
- Some players hide teamlists; those rows return without teams and must be
  surfaced as skipped rather than silently dropped.

Third-party wrappers already exist and are open source:
`github.com/jpbullalayao/limitless-python` and
`github.com/jpbullalayao/limitlesstcg-mcp`.

### Data pipeline

`limitlessvgc.com` and `standings.limitlessvgc.com` ingest **automatically from
`rk9.gg` and `playlatam.net`** — the official/registration platforms — for any
event where the data is published. This is why their coverage of in-person
Regionals/Internationals is effectively complete and why nobody can beat them
on results breadth.

### Scale proof point

**Regional Championship Indianapolis (29–31 May 2026)** — the inaugural
Champions Regional — **1,013 players, 1,012 published teamlists, 16 rounds**,
with full per-Pokémon usage (Basculegion led at 50.30%). All of it free and
addressable.

### URL / SEO surface

Limitless has a large, clean, deeply-linked, entity-shaped URL space:

```
limitlessvgc.com/tournaments
limitlessvgc.com/tournaments/{id}            e.g. /tournaments/434  (Indy)
limitlessvgc.com/teams
limitlessvgc.com/players
limitlessvgc.com/pokemon
limitlessvgc.com/pokemon/{slug}              e.g. /pokemon/terapagos
limitlessvgc.com/pokemon/{slug}/players      e.g. /pokemon/okidogi/players
standings.limitlessvgc.com/{event}/standings e.g. /0033/standings
standings.limitlessvgc.com/{event}/pokemon
standings.limitlessvgc.com/{event}/pairings?round=13
standings.limitlessvgc.com/{event}/player/{pid}/teamlist
standings.limitlessvgc.com/{event}/JR/standings   (age divisions)
play.limitlesstcg.com/tournaments?game=VGC
play.limitlesstcg.com/decks?game=VGC              (VGC metagame/archetypes)
```

Note `/pokemon/{slug}/players` — a **cross-entity intersection page**
("who plays Okidogi"). That is a page type we have no analogue for, and it's a
long-tail SEO pattern that scales as `species × facet`.

### Player rankings

Rank by **Points, Earnings, Top-8 finishes, or Tournament wins**, filterable by
zone: Global, Europe, North America, Latin America, Oceania, Asia, and
individual countries. Historical range back to 2011.

### Share / view UX

- **Read-only reference.** No comments, no saves, no follows, no "share this
  team with my commentary." You navigate tournament → standings → player →
  teamlist. There is no share primitive at all beyond copying a URL.
- **No authored content.** Player profiles are performance records, not
  identities. Nobody writes anything on Limitless.

### Monetization

- **Ads**, with a **$2/month Patreon** (`patreon.com/limitlesstcg`) whose
  headline benefit is **ad removal** across the site and the tournament
  platform *(single source; Patreon itself was egress-blocked)*.
- The tournament platform is free to organizers — it is a data-acquisition
  play as much as a product.

### Data they have that we don't

- Complete in-person Regional/International/Worlds results via rk9.gg.
- Round-by-round **pairings** and match-level outcomes.
- **Age-division splits** (JR/SR/MA).
- Player earnings and championship-points ledgers back to 2011.
- Per-event Pokémon usage computed over the full field (not just top cut).
- Online-platform tournaments where they *are* the source of truth.

### What they do better

1. **Authoritative, automated, near-complete results coverage.** Nobody
   competes here — and we shouldn't try.
2. **An entity-graph URL architecture** that generates thousands of legitimate
   long-tail pages (event × player × Pokémon × division × round).
3. **Push-based freshness** via webhooks.
4. **They are the upstream everyone else builds on.** Pikalytics publishes
   `pikalytics.com/tournaments/limitless/{slug}` pages sourced from them.
   Being upstream is the strongest position in this ecosystem — and their API
   means *we can be downstream cheaply*.
5. **Two-sided flywheel:** run the tournaments → own the data → rank the
   players → attract the tournaments.

### Where they're weak (our openings)

- **No spreads.** Structurally, permanently — OTS doesn't include them and the
  API doesn't expose them. Their data stops exactly where ours starts.
- **No "why."** No reasoning, no benchmarks, no matchup plan, no author voice.
- **No social or authoring layer** of any kind.
- **No mobile-first team presentation** — it's a dense results database.
- Adjacent: **Victory Road** (`victoryroad.pro`) is the one filling the
  narrative gap, with player-authored team reports (`/sv-reports/`), VR Pastes
  (open + closed lists, password-protected, 8 languages, Champions stat-system
  support), a replica-teams page, common sets, `calc.victoryroad.pro`, a season
  calendar, and its own tournament series. Victory Road, not Limitless, is the
  competitor for the *team report* itself.

---

## 3. Trainer Hill

### What it is — and the scope correction

**Trainer Hill is a Pokémon TCG / TCG Pocket analytics hub. It does not cover
VGC.** Every search probe for Trainer Hill + VGC/Champions returned either
TCG-only Trainer Hill content or redirected to Pikalytics / Pokémon Zone /
Limitless VGC for the VGC equivalent. Their own card browser is
`trainerhill.com/cards?game=PTCG`.

So it is **not a competitor** to VGC Team Report. It is included here as the
adjacent-market benchmark — and it is the most instructive of the three,
because it is a small independent operator that has built a **complete
analytics + tools + monetization product** on top of exactly the kind of free
tournament data Limitless exposes for VGC.

### Product surface

**Analytics (`trainerhill.com` + `tools.trainerhill.com`):**

| Surface | What it answers |
|---|---|
| Meta Overview (`/meta`) | Archetype rankings, meta share, win rates, top-8 share, movement over time. |
| Archetype Breakdown (`tools.trainerhill.com/dashboards/breakdown/`) | Deck share, player counts, format trends. |
| Matchup Spreads | Deck-vs-deck win rates; favoured pairings and pressure points. |
| Card Analysis | Per-card adoption, time-series behaviour, and **correlation between playing a card and finishing better**. |
| Decklist Analysis (`/analysis/decklists`) | Computes the **"skeleton list"** — the consensus core of an archetype — and which cards are outperforming. |

**Tools (`trainerhill.com/tools`):**

| Tool | URL |
|---|---|
| Deck Diff (Venn) | `/tools/deck-diff` — visual card overlap between two lists |
| Deck Diff Table | `/tools/deck-diff-table` — N-way compare: counts, averages, staples, techs |
| Tier List Builder | `/tools/tier-list` — build from tournament data, annotate matchups, **publish** |
| Battle Journal | `/tools/battle-journal` — log games, history, filtered analysis |
| Prize Checker | `/tools/prize-checker` — skill drill simulator |
| Badge Maker | `/tools/badges` — custom player badge graphics, **downloadable and designed for social sharing** |

Note the dashboards are explicitly **organised by the question you're trying to
answer**, "from metagame share to card-level matchup impact" — an information
architecture choice, not a feature list. That framing is worth stealing
directly.

### Share / view UX

- **Publishable tier lists** — user-generated artifact with a URL, seeded from
  real tournament data. Community-shareable content that Trainer Hill hosts.
- **Badge Maker** produces a downloadable graphic explicitly for social media.
  This is a pure top-of-funnel growth device: cheap to build, gives the user
  something they *want* to post, and every post carries the brand.
- **Deck Diff Venn** is inherently screenshot-able — visual output travels.

The pattern across all three: **the artifact the user creates is the
distribution channel.** That is the same insight our share/report model is
built on, executed with lighter-weight artifacts.

### Monetization — the clearest signal in this teardown

**Battle Journal + (`plus.trainerhill.com`), $3/month, 7-day free trial,
Patreon-exclusive, cancel anytime.**

The free/paid split is instructive:

| Free Battle Journal | Battle Journal + ($3/mo) |
|---|---|
| Data stored **locally in the browser**; never collected; clearing cookies deletes it forever | Saves **to your account**, survives devices |
| Basic log + history + filters | Per-deck win rates, **first/second-turn analysis**, opponent matchup data |
| Pokémon TCG only | Multi-game: Pokémon, One Piece, Riftbound, others |

**The paywall is account-backed persistence plus deeper cuts of the user's own
data.** Not content, not access — durability and insight on data the user
generated. That is a monetization shape that maps almost perfectly onto this
repo's existing server-side match tracker.

### SEO surface

Dense, tool-led, and every tool has its own indexed landing page with a
benefit-shaped title (`/tools/deck-diff`, `/tools/tier-list`,
`/tools/prize-checker`, `/tools/badges`, `/analysis/decklists`, `/meta`,
`/about`, `/cards?game=PTCG`). Plus a subdomain each for tools
(`tools.`) and premium (`plus.`). They also run a YouTube channel, a podcast,
an X account (`@Trainer_Hill`), and a Bluesky profile — and they are notable
enough to have a **Bulbapedia entry**.

### Infrastructure (from the fetchable `github.com/Trainer-Hill` org)

All-Python, all small and operational:

| Repo | Purpose | Last update |
|---|---|---|
| `badge-leaderboard` | Custom badges + leaderboards for competitive communities | Aug 6, 2026 |
| `ptcg-calendar-sync` | Syncs nearby TCG events from `pokedata.ovh` → Google Calendar | Jul 6, 2026 |
| `uptime-to-discord` | Cron health monitor → Discord downtime alerts | Feb 12, 2026 |
| `.github` | Org profile | Dec 17, 2025 |

The web app itself is closed-source. What's public is the **glue**: ingest from
a third-party data source, sync to where users already are (Google Calendar,
Discord). Same pattern as VGCpastes→Falinks: cheap scheduled pipelines around a
free upstream.

### Data they have that we don't

- **User-submitted match logs at scale** — the Battle Journal corpus is
  proprietary, first-party, and impossible to scrape. It powers matchup spreads
  and turn-order analysis nobody else can compute.
- Tournament decklists aggregated across online *and* in-person events.
- Card-level performance correlation over time.

### What they do better

1. **Monetization that actually works** on a niche tournament-analytics tool,
   at a validated $3/mo, with a defensible free/paid line.
2. **Question-led IA** rather than feature-led navigation.
3. **Skeleton lists** — synthesising many lists into "the consensus build" is a
   genuinely hard analytical product and they ship it.
4. **Diff as a first-class tool**, with two output shapes (Venn for two,
   table for N).
5. **Shareable-artifact growth loops** (badges, publishable tier lists).
6. **Multi-game hedging** — One Piece, Riftbound — de-risks the roster from a
   single game's format cycle.

### Where they're weak (irrelevant to us, mostly)

- No VGC presence at all — the whole VGC analytics surface is unclaimed by them.
- Free Battle Journal's localStorage-only storage is a real limitation they
  chose deliberately so the paid tier has a job to do.

---

## 4. Cross-cutting comparison

| Axis | VGCpastes | Limitless | Trainer Hill | **VGC Team Report** |
|---|---|---|---|---|
| Primary artifact | Paste + replica code | Tournament record | Dashboard + tool output | **Authored report** |
| Spreads (EV/SP) | Sometimes, flagged | **Never** (structural) | n/a | **Always, with rationale** |
| "Why" / narrative | None | None | Light | **Core product** |
| Self-service publish | ✗ (human DM) | ✗ | Partial (tier lists) | ✓ |
| Social layer | Discord only | ✗ | Light | ✓ (follows, comments, reactions, forks, collections) |
| Mobile | Broken (admitted) | Dense tables | Good | ✓ (deliberate mobile overhaul) |
| Embeds / oEmbed | ✗ | ✗ | ✗ | ✓ (`/api/oembed`, `/embed/[id]`) |
| Versioning / forks | ✗ | ✗ | ✗ | ✓ |
| SEO surface | ~none | Very large entity graph | Dense tool pages | Moderate (`/champions/{mega}` × 72, `/s/{id}`, `/creator/{name}`) |
| Public API consumed | Falinks←Sheets | **Publishes one** | pokedata.ovh | **None** |
| Monetization | $0 | Ads + $2/mo | $3/mo | None |
| Distribution | Discord 14.8k, X 37k | SEO + being upstream | SEO + YouTube/podcast | Organic only |

**Where we are genuinely ahead:** authored narrative, spreads with reasoning,
self-service publishing, versioning/forking, collaboration, oEmbed/embed,
mobile presentation, and a real social graph. None of the three has more than
one of these.

**Where we are genuinely behind:** we have **no first-party or third-party
tournament data pipeline at all**, and no monetization.

---

## 5. Data sources they have that we don't

| Source | Who has it | Access to us |
|---|---|---|
| rk9.gg / playlatam.net official event feeds | Limitless | Indirect — via Limitless API |
| Full standings, pairings, per-round results | Limitless | **Free, key-less API** |
| Per-event full-field usage stats | Limitless | **Free API** (derivable) |
| Age-division splits | Limitless | Free API |
| Player rankings, points, earnings (2011→) | Limitless | Free API |
| Replica / rental codes | VGCpastes, Victory Road, ChampDex | Community-sourced only |
| "EV status" verification flag per paste | VGCpastes | Community-sourced |
| First-party match-log corpus | Trainer Hill (TCG) | **We already have the pipes** — `/api/match-log` |
| Tournament-finished webhook | Limitless | Free, registerable |

---

## 6. Two repo issues found while grounding this research

Read-only findings; **no files were modified.** Both are competitive-credibility
issues, which is why they belong in this report.

### 6.1 `src/data/indy-top-cut.ts` publishes fabricated top-cut data

The file's own header says: *"Sample top-8 data … These are representative
archetypes … actual results will be published on Limitless TCG once the
tournament concludes."* Every entry has `player: "TBD"` and every
`limitlessUrl` points at the generic index
`https://play.limitlesstcg.com/tournaments`.

This renders publicly on `/champions` (`ChampionsContent.tsx:343`) as an
**"Indianapolis Regionals Top Cut"** table. The tournament concluded **29–31 May
2026** — nearly three months ago. The real results are free and addressable at
`limitlessvgc.com/tournaments/434` and
`standings.limitlessvgc.com/0033/standings` (1,013 players, 1,012 published
teamlists). Publishing invented placements under a real event's name, with the
real event's date, is an E-E-A-T and trust liability in exactly the niche where
Limitless is the recognised authority.

Also: several archetypes listed (Tapu Fini, Tapu Koko, Kangaskhan,
Landorus-Therian) do not match the actual Reg M-A metagame that search reports
for that event (Basculegion 50.3%, Garchomp, Incineroar, Sneasler, Sinistcha,
Mega Floette, Mega Tyranitar).

### 6.2 Wrong Worlds 2026 dates inside `SportsEvent` JSON-LD

`src/app/tournaments/page.tsx` `UPCOMING_TOURNAMENTS` declares
`startDate: "2026-08-14"` with the description *"held August 14-17 in San
Francisco."*

The 2026 Pokémon World Championships run **28–30 August 2026** at Moscone
Center, with finals at Chase Center on the Sunday (corroborated across
Moscone's own events page, KRON4, KQED, ABC7, SFist, CardShopFinder, and
Bulbapedia). Both entries also use `url: "https://pokemonvgcteamreport.com/tournaments"`
as the event URL, which is self-referential rather than the event's page.

Wrong dates in `SportsEvent` structured data are the kind of thing Search
Console flags, and the correction is currently time-critical: **Worlds starts
in four days.**

---

## 7. Five concrete, implementable opportunities

### Opportunity 1 — Ingest the Limitless public API and ship real tournament pages
**Effort: L**

Build a small server-side client for `https://play.limitlesstcg.com/api`
(`/tournaments`, `/tournaments/{id}/details|standings|pairings`), no key needed,
with backoff on 429 and a cache TTL matching the existing pattern (1h for
completed events, ~5min for in-progress). Register the **tournament-finished
webhook** so freshness is push-based — this fits the existing
`src/app/api/webhooks/` layout and avoids adding cron beyond the daily/weekly
cap in `CLAUDE.md`.

Then replace the hardcoded `src/data/indy-top-cut.ts` and the hardcoded
`UPCOMING_TOURNAMENTS` array with generated `/tournaments/[slug]` pages: real
placements, real player names, real teams, deep-linked to
`standings.limitlessvgc.com/{event}/player/{pid}/teamlist` with visible
attribution. Add them to `src/app/sitemap.ts` alongside the existing
`/champions/{mega}` entries.

Why L: new external client, cache layer, webhook handler, a new dynamic route
with SSG/ISR, sitemap wiring, tests in `src/lib/__tests__/`, and Neon storage
review (the 512MB free-tier guardrail — store only tournament metadata and
teamlist references, never a full snapshot per fetch; the `share_versions`
447MB incident is the precedent to avoid).

Why it matters: it closes the single biggest data gap, it's free and sanctioned,
and it converts our thinnest page into our most defensible SEO surface.

---

### Opportunity 2 — "Finish the teamsheet": import a Limitless teamlist into a report skeleton
**Effort: M**

The wedge. Limitless gives you Pokémon + item + ability + 4 moves + Tera and
**stops**. That is precisely a half-built VGC Team Report.

Ship an import path that accepts a `standings.limitlessvgc.com/{event}/player/{pid}/teamlist`
URL (or a `play.limitlesstcg.com/tournament/{id}` URL plus a placement) and
produces a pre-populated draft report — species, items, abilities, moves, Tera,
tournament name, placement, creator name all filled — with the **spread fields
deliberately empty and prompted**: "This teamsheet doesn't include EVs. Add the
spread and tell people why."

This extends the existing "Update Team" re-import flow (which already handles
PokePaste URLs, Pikalytics URLs, and Showdown exports) with one more source,
and it plugs into `src/lib/parser/showdown-parser.ts` — which already produces
an all-zero spread when the EVs line is absent, so the partial-paste case is
already handled correctly.

Hard rule to encode: **never fabricate a spread to "complete" the paste.** The
empty spread is the call to action, and honesty about it is the brand.

Why M: one new URL parser + fetch path, a mapping into `ParsedTeam`, a draft
pre-fill UI state, tests. No schema change.

Why it matters: it turns the market leader's data into our top-of-funnel, gives
every one of the ~1,000 teamlists per Regional a reason to become a report, and
positions us as the layer *above* Limitless rather than a competitor to it.

---

### Opportunity 3 — Skeleton spreads and team diff (the Trainer Hill playbook, applied to VGC)
**Effort: M**

Trainer Hill's two strongest analytical products are **skeleton lists**
(synthesise many lists of one archetype into the consensus core) and **Deck
Diff** (Venn for two, table for N). Neither has a VGC equivalent anywhere — and
the VGC version is *more* valuable, because the interesting variance in VGC
isn't which six Pokémon, it's the spread.

Build:
- **Skeleton spread** — across all public reports sharing an archetype, show the
  consensus EV/SP investment per stat, the modal nature/item/Tera, and flag
  outliers. Reuse `convertToChampionsSp` so SP and EV formats normalise
  correctly.
- **Team diff, promoted** — `/compare` already exists but is `robots: index: false`
  and query-param driven, so it has no indexable surface and no entry point.
  Give archetype comparisons stable, indexable URLs and link them from report
  pages and `/champions/{mega}`.

Why M: the aggregation query and normalisation are the real work; the UI
substantially exists in `src/components/compare/`. Watch the Neon budget —
compute on read with caching, don't materialise a table per comparison.

Why it matters: it is the one analytics product our data supports and nobody
else's does, and it converts our accumulating report corpus into a compounding
asset rather than a pile of isolated pages.

---

### Opportunity 4 — A $3/month supporter tier, gated on match-tracker depth
**Effort: M**

Both benchmarks converge on the same price band — Limitless $2/mo (ad removal),
Trainer Hill $3/mo (Battle Journal +). Trainer Hill's free/paid line is the one
worth copying, and we are already on the *right* side of it by accident: their
free Battle Journal stores data **in localStorage and loses it when you clear
cookies**, while our match tracker (`/api/match-log`) is already server-side and
persistent.

So don't gate persistence — gate **depth**, which is what they actually charge
for:

- Free: log results, overall W/L/T, win rate, top-5 matchups (today's feature).
- Supporter: full matchup matrix, trend over time, per-archetype splits,
  export, private reports, unlimited collections, and a supporter badge on
  `/creator/{name}`.

Their advanced tier also sells **first/second-turn analysis** — the VGC analogue
is lead-pair performance and Terastallisation-timing splits, which is a genuinely
novel cut nobody offers.

Why M: payment integration and entitlement checks across existing gated routes;
the analytics themselves are mostly aggregation over data we already store.
Start with a plain "Support" link if validating demand first (that alone is S).

Why it matters: two independent operators in this exact niche have proven the
price and the shape. It also funds the Vercel/Neon bill that the cost guardrails
in `CLAUDE.md` are currently managing by rationing.

---

### Opportunity 5 — Meet the audience where it already is: Discord distribution + ecosystem attribution
**Effort: S**

Two cheap moves that address our weakest axis — distribution.

**(a) Discord.** VGCpastes' Discord went from ~8.4k to ~14.8k members in one
quarter, and Sandshrew Bot is where team discovery actually happens. This repo
already has `src/app/api/bot/route.ts`, `src/lib/discord-bot.ts`, and
`DISCORD_BOT_TOKEN` handling. Add a minimal read-only slash command —
`/report <url>` returning a rich embed of a report, and `/random` returning a
recent public report — reusing the existing `/api/oembed` and `/embed/[id]`
output. Discord embeds are the share primitive VGCpastes has never had.

**(b) Attribution and links.** Fix the two issues in §6 — real Indy data (or
delete the fabricated table), correct Worlds dates (28–30 Aug 2026), real
deep links instead of `play.limitlesstcg.com/tournaments` placeholders — and
add proper "Data via Limitless" attribution wherever their API is used. Then
get listed on the resource pages that funnel this community: Victory Road
resources, VGCpedia, DevonCorp (`devoncorp.press/resources/up-to-date-vgc-resources`),
Smogon resource threads, "New to VGC" linktrees. VGCpastes is on all of them;
we are on none. These are the highest-authority, lowest-effort backlinks in the
niche, and correct attribution is the price of admission.

Why S: the bot is an incremental command on existing infrastructure; the fixes
are data-file edits; the listings are outreach, not code.

Why it matters: our product quality is already competitive. Our *reach* is not.
This is the cheapest ratio of effort to audience in the entire report — and item
(b) is time-critical given Worlds starts 28 August.

---

## 8. Watch list (out of scope, recommend follow-up)

| Site | Why it matters |
|---|---|
| **reportworm.com** | Closest direct competitor found. "VGC Team and Replay Analysis" — ingests Showdown replays and auto-generates a team report with matchup details, usage stats, and damage calcs. Also runs `standings.reportworm.com` (full standings + teamsheets for VGC majors) and `svstats.reportworm.com`. Open-source stats repo: `github.com/mikewVGC/reportworm-svstats`. **Recommend a dedicated teardown.** |
| **champdex.com** | Champions companion with team builder, damage calc, live usage, replica teams auto-updated from tournament results, guides, dex — **and a shipped iOS app** (App Store id 6761497339). The most complete Champions-native product found. |
| **metavgc.com** | SEO-aggressive rental-team site with editorial collections (`/teams/featured/{slug}`) and titles auto-dated to the current month. Explicitly advertises "win rates, **EV spreads**, and stats" — the one competitor claiming our differentiator. |
| **victoryroad.pro** | The real competitor for the *team report artifact*: player-authored reports, VR Pastes (open+closed lists, password-protected, 8 languages, Champions stat system), replica teams, common sets, damage calc, season calendar, own tournament series. |
| **pokemon-zone.com** | Champions metagame, tier lists, tournament results, team search — well-ranked in Champions queries. |
| **crob.at**, **champteams.gg**, **pokebase.app**, **pokemonchampionsreplicateams.com** | Newer Champions-era entrants ranking on copy-paste-team and replica-code queries. |
| **`github.com/Pocolip/vs-recorder`** | Open-source VGC Showdown replay analyser — same space as Reportworm. |

---

## Sources

- [VGC Pokepastes • Champions MB (@VGCPastes) on X](https://x.com/VGCPastes?lang=en)
- [@VGCPastes — Champions Replica Repository launch](https://x.com/VGCPastes/status/2042106878751338822)
- [@VGCPastes — 135 Replica Teams / mobile sheet issues](https://x.com/VGCPastes/status/2042695109754654984)
- [@VGCPastes — Sandshrew Bot Reg M-A update](https://x.com/VGCPastes/status/2046352261128040528)
- [Sandshrew Bot | Discord App Directory](https://discord.com/application-directory/964203274695745636)
- [VGCPastes Discord](https://discord.com/invite/DkhP2HDJE7)
- [falinks-teambuilder.com/pastes/vgc/](https://www.falinks-teambuilder.com/pastes/vgc/)
- [github.com/txfs19260817/falinks-teambuilder](https://github.com/txfs19260817/falinks-teambuilder)
- [Limitless VGC](https://limitlessvgc.com/)
- [Limitless VGC — Tournaments](https://limitlessvgc.com/tournaments)
- [Limitless VGC — Regional Indianapolis, IN](https://limitlessvgc.com/tournaments/434)
- [Limitless VGC — Teams](https://limitlessvgc.com/teams)
- [Limitless VGC — Player Rankings](https://limitlessvgc.com/players)
- [Limitless VGC — Pokémon Rankings](https://limitlessvgc.com/pokemon)
- [Limitless VGC — Okidogi player ranking](https://limitlessvgc.com/pokemon/okidogi/players)
- [Limitless VGC Standings](https://standings.limitlessvgc.com/)
- [Indianapolis standings](https://standings.limitlessvgc.com/0033/standings) · [Indianapolis Pokémon usage](https://standings.limitlessvgc.com/0033/pokemon) · [Indianapolis pairings R13](https://standings.limitlessvgc.com/0033/pairings?round=13) · [example teamlist](https://standings.limitlessvgc.com/0033/player/0530/teamlist)
- [Limitless Developer Guides](https://docs.limitlesstcg.com/developer.html) · [Limitless Webhooks](https://docs.limitlesstcg.com/developer/webhooks)
- [Limitless Online Tournament Platform — VGC](https://play.limitlesstcg.com/tournaments?game=VGC) · [VGC Metagame](https://play.limitlesstcg.com/decks?game=VGC)
- [Limitless Labs](https://labs.limitlesstcg.com/)
- [github.com/jpbullalayao/limitless-python](https://github.com/jpbullalayao/limitless-python) · [limitlesstcg-mcp](https://github.com/jpbullalayao/limitlesstcg-mcp)
- [Limitless TCG Patreon](https://www.patreon.com/limitlesstcg) · [membership](https://www.patreon.com/limitlesstcg/membership)
- [Trainer Hill](https://www.trainerhill.com/) · [About](https://www.trainerhill.com/about) · [Meta](https://www.trainerhill.com/meta) · [Tools](https://www.trainerhill.com/tools)
- [Decklist Analysis](https://www.trainerhill.com/analysis/decklists) · [Deck Diff](https://www.trainerhill.com/tools/deck-diff) · [Deck Diff Table](https://www.trainerhill.com/tools/deck-diff-table) · [Tier List Builder](https://www.trainerhill.com/tools/tier-list) · [Battle Journal](https://www.trainerhill.com/tools/battle-journal) · [Prize Checker](https://www.trainerhill.com/tools/prize-checker) · [Badge Maker](https://www.trainerhill.com/tools/badges)
- [Deck Archetype Breakdown dashboard](https://tools.trainerhill.com/dashboards/breakdown/) · [Dashboard Overview](https://tools.trainerhill.com/)
- [Battle Journal +](https://plus.trainerhill.com/) · [Trainer Hill Patreon](https://www.patreon.com/trainerhill/about)
- [github.com/Trainer-Hill](https://github.com/Trainer-Hill)
- [Trainer Hill — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Trainer_Hill)
- [Reportworm](https://reportworm.com/) · [Reportworm Standings 2026](https://standings.reportworm.com/2026) · [Reportworm SV Stats](https://svstats.reportworm.com/) · [reportworm-svstats](https://github.com/mikewVGC/reportworm-svstats)
- [github.com/Pocolip/vs-recorder](https://github.com/Pocolip/vs-recorder)
- [ChampDex](https://champdex.com/) · [Builder](https://champdex.com/builder) · [Replicas](https://champdex.com/builder/replicas) · [iOS app](https://apps.apple.com/us/app/champdex/id6761497339)
- [MetaVGC](https://metavgc.com/) · [Worlds 2026](https://metavgc.com/tournaments/worlds-2026) · [Regional Indianapolis teams](https://metavgc.com/teams/featured/regional-indianapolis)
- [Victory Road](https://victoryroad.pro/) · [SV Team Reports](https://victoryroad.pro/sv-reports/) · [Champions Replica](https://victoryroad.pro/champions-replica/) · [2026 Season Calendar](https://victoryroad.pro/2026-season-calendar/)
- [Pokémon Zone — Champions](https://www.pokemon-zone.com/champions/) · [Tournaments](https://www.pokemon-zone.com/champions/tournaments/) · [Regulations](https://www.pokemon-zone.com/champions/regulations/)
- [Pikalytics](https://pikalytics.com/) · [Champions](https://www.pikalytics.com/champions) · [Limitless-sourced tournament page](https://www.pikalytics.com/tournaments/limitless/vgc-uu-champions-regulation-m-a-weekly-7-fd2fdf) · [rk9-sourced Indianapolis page](https://www.pikalytics.com/tournaments/rk9/2026-indianapolis-pok-mon-vgc-regional-championships-v12cgc)
- [crob.at — Champions teams](https://crob.at/teams/champions) · [Reg M-B teams](https://crob.at/teams/vgc)
- [ChampTeams.gg](https://champteams.gg/landing) · [PokéBase Champions Team Builder](https://pokebase.app/pokemon-champions/team-builder)
- [DevonCorp — Up-to-date VGC Resources](https://devoncorp.press/resources/up-to-date-vgc-resources) · [15 More Teams for Reg M-B](https://devoncorp.press/resources/15-more-teams-for-pokemon-champions-regulation-mb-m-b)
- [Smogon — VGC 2026 Regulation M-B](https://www.smogon.com/dex/champions/formats/vgc26-regulation-m-b/) · [Reg M-B Sample Teams](https://www.smogon.com/forums/threads/champions-vgc-regulation-m-b-sample-teams.3785112/) · [Reg M-B Viability Rankings](https://www.smogon.com/forums/threads/vgc-regulation-m-b-viability-rankings.3785289/)
- [Game8 — Regulation M-B roster and schedule](https://game8.co/games/Pokemon-Champions/archives/605482) · [Serebii — Ranked Battle Reg M-B](https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-b.shtml)
- [2026 Pokémon World Championships — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/2026_Pok%C3%A9mon_World_Championships) · [Moscone Center event page](https://www.moscone.com/events/pokemon-world-championships-2026) · [KRON4](https://www.kron4.com/news/bay-area/schedule-released-for-pokemon-world-championships-in-san-francisco/) · [KQED](https://www.kqed.org/news/12095943/san-francisco-pokemon-championships-pokemonxp-badges-tickets-sold-out-giants-street-closures-moscone) · [ABC7](https://abc7news.com/post/pokmon-events-more-50000-fans-expected-san-franciscos-moscone-center-chase-organizers-say/19716882/) · [SFist](https://sfist.com/2026/08/20/pokemon-convention-hits-moscone-ahead-of-championships-next-week-street-closures-already-underway/) · [CardShopFinder](https://thecardshopfinder.com/event/pokemon-world-championships-san-francisco-2026-08/)
- Local: `/root/.claude/skills/synced/limitless-tournament/references/api-notes.md` (Limitless API endpoints, auth, rate limits, exposed fields, cache TTLs)
