# R-COMP — Competitive Teardown, 26 Oct 2026

Agent: R-COMP (overnight swarm). Read-only on repo. No outbound sends.
Method: `WebSearch` only (see egress section). Repo read for our own share surface.

---

## Confidence key

| Label | Means |
|---|---|
| **HIGH** | Corroborated across ≥2 independent search queries with consistent specifics, OR read directly from this repo / first-party local tooling docs. |
| **MEDIUM** | Single credible source, or multiple sources that agree only in outline. Directionally trustworthy, do not quote the number. |
| **LOW** | Single promotional/secondary source, or model prior knowledge not verified this run. Do not act on alone. |
| **UNVERIFIED** | Could not establish at all this run. Stated as a gap, not a finding. |
| **CONTRADICTORY** | Sources actively disagreed. Flagged inline. |

Every factual claim below carries a label. Where a label is absent, treat it as LOW.

## Egress: what could not be reached

The briefing predicted HTTP 403 on CONNECT. **Actual behaviour in this container was DNS failure (`ENOTFOUND` / `getent` miss), not 403.** Same practical result: no page was fetched directly. Per instruction, no domain was retried.

Confirmed unreachable (DNS-FAIL, verified by `getent hosts`):

- `pokepast.es`
- `pikalytics.com`, `www.pikalytics.com`
- `play.limitlesstcg.com`, `limitlessvgc.com`, `www.limitlesstcg.com`, `docs.limitlesstcg.com`
- `trainerhill.com`
- `vgcpastes.com`
- `victoryroad.pro`
- `rk9.gg`
- `www.reddit.com`
- `pokebase.app`, `metavgc.com`, `www.mintlify.com`

`WebFetch` returned zero successful page loads this run. **Nothing in this report is from a first-party page read.** It is search-index snapshots (titles, URLs, extracted snippets) plus our own repo. Search snapshots can be stale; competitor pages may have changed.

Two `WebSearch` contradictions encountered, both flagged inline (Pikalytics app team builder; Pikalytics app pricing).

---

## Headline: the brief's competitive set is out of date

The assigned Tier 1 / Tier 2 set (Pikalytics, PokePaste, VGCPastes, Limitless, Trainer Hill) describes the **classic VGC** landscape. Searching for Champions Reg M content surfaced a **crowded cohort of Champions-native tools that the brief does not mention**, several of which are doing precisely the things our roadmap treats as open ground.

Newly identified, not in the brief (HIGH that this cohort exists and is active; MEDIUM on any individual tool's feature detail):

| Tool | What search established |
|---|---|
| **pokemon-zone.com** | Per-species Champions pages, filterable by ruleset / ranked season / data source: `/champions/pokemon/<species>/?reg=m-b`, `?season=6`. Base stats, type chart, **builds sortable by "competitive performance" (placement-weighted) or raw usage**, teammates with usage % *and win rates*, builds attributed to named events with player placement and record. Also `/champions/tournaments/<event>/` pages. **HIGH** (two queries, consistent URL grammar, consistent feature detail). |
| **pokebase.app** | `/pokemon-champions/tournaments/<24-hex-id>` pages: event, date, usage-rate chart, every team with W-L record, Reg M-B tags, paginated to 14+ pages for large events. Sample events: Amyverse VGC Arena #7 (24 Aug 2026, 78 teams), The Drywalls Series #18 (31 Aug 2026, 59 teams), Sitrus-Series #72 (19 Aug 2026, 107 teams). **MEDIUM-HIGH** (two queries; specifics are index snapshots). |
| **pokesynergy.app** | Champions team-building tool. Builder ties each slot to weaknesses, coverage, speed plans, damage assumptions, partner options, notes, imports, saved teams, current-meta threats. Has a "MetaDex" (tournament usage, teams, events, ranking pages, weekly changes, species profiles) and `/teams`. Runs **programmatic `/vs/<competitor>` comparison pages** (`/vs/champteams`, `/vs/op.gg`, `/vs/championslab`). **MEDIUM**. |
| **champdex.com** | Team Builder, Damage Calculator, Tier List, Replica Teams, Speed Tiers, **Spread Solver**, Tournaments. Self-described solo developer. **LOW-MEDIUM** (described by a competitor's comparison page). |
| **poketools.com** | `/champions-team-builder` — imports Showdown pastes, uses Smogon ladder usage to flag threats and suggest cores. **LOW-MEDIUM**. |
| **metavgc.com** | Aggregator. Explicitly lists **VGCPastes** as a source ("shared team pastes and builds from the VGC community"). Has `/pros/<player>` profiles with championship teams and per-team Showdown pastes. **MEDIUM**. |
| **championite**, **championslab**, **champteams.com** | Named repeatedly as Champions tools (damage calc + live battle board + threat matrix; battle simulation; team/core browsing hub respectively). All descriptions come from a rival's marketing pages. **LOW**. |

**Strategic consequence.** Champions Reg M is treated in our docs as a differentiator. On this evidence it is **contested by roughly eight entrants**, at least one of which (`pokemon-zone.com`) already owns per-species Champions landing pages with placement-weighted builds — i.e. the thing the existing EV-spread SEO ticket is aiming at, except built for Champions and already indexed. Meanwhile **none of these tools appear to be report/share-artifact-centric**; they are builders, calculators and dexes. That is still our lane, but the moat is narrower and the SEO land-grab is further along than the ticket assumes.

---

# TIER 1 — Direct

## 1. Pikalytics (pikalytics.com)

### What it does / the one job
Aggregated competitive usage statistics per species per format. Describes itself as aggregating data from millions of ranked battles on official platforms and Smogon (**MEDIUM** — site self-description via snippet). The one job: *"I'm building around species X — what do good players actually run on it?"* A player lands on a species page and leaves with moves, item, ability, spread and teammates. **HIGH.**

Established surface (**HIGH**, seen across 4+ independent queries with consistent URL grammar):
- `/pokedex/<format>/<Species>` — usage %, moves, items, abilities, natures, teammates, **EV spreads**. Formats span `gen9vgc2025regg`, `vgc2018pgl`, `gsc`, `go1500`, `series7`, `vgc2015` — i.e. deep historical archive, not just current.
- Localisation via `?l=` (`en`, `spa`, `ger`, `kor`). Non-trivial international SEO footprint.
- **Glicko rating-cutoff filters** — usage reweighted by ladder rating band.
- `/tournaments/limitless/<event-slug>/<Species>` — ingests Limitless events, **including Champions M-B and M-C** (e.g. `vgc-trainer-school-champions-m-c-3-3bfa5c`). Publishes per-event team lists with player records and ranks. Example captured: M/B #3 top-ranked team `LenVGC — Staraptor-Mega / Tyranitar-Mega / Excadrill / Milotic / Gholdengo / Sinistcha`, 10-1.
- `/tournaments?page=N` — paginated event index (≥9 pages).
- Web tools: team builder, damage calculator, speed tiers.
- **`/ai/...` machine-readable mirror** of the whole site — `/ai/pokedex/<format>/<Species>`, `/ai/tournaments/limitless/<event>/<Species>`, `/ai/damage-calculator`. Titles render as markdown headings (`# Pikachu - VGC 2022 Series 12 Usage Statistics`). **HIGH** — appeared in three separate queries.
- `llms.txt` present, passing existence + structure checks. **MEDIUM** — single third-party audit (Mintlify score page, pikalytics.com scored 71/100 Grade C, 13/29 checks, computed 2026-05-12). The same audit reports **`.md` URL support at 0/100 — 0/15 sampled pages return markdown** — and no in-page directive pointing agents at `llms.txt`.

### Share / view UX — the critical axis
**This is Pikalytics' weakest axis and it is weak by design.** No evidence of any user-generated share artifact: no "share my team" primitive, no per-user links, no embeds, no oEmbed. What gets shared is a **canonical URL to their data** (a species page, an event page) — permanent, sign-in-free, indexed, but **not the user's object**. A Pikalytics link says "here is the meta"; it can never say "here is my team." **HIGH** on absence of a share primitive (nothing surfaced across many queries); **MEDIUM** as a negative claim, since absence of search evidence is weaker than a page read.

Link permanence appears excellent (deep historical format pages still indexed and live). Sign-in not required for data viewing. **HIGH.**

### Monetisation
Ads on the website, plus a **"Support Us"** link and an **"Advertise on Pikalytics"** link — so display ads + direct ad sales + donations. **MEDIUM** (both links observed in a snippet; no rate card or Patreon confirmed — a targeted Patreon query returned nothing about Pikalytics at all). Paid mobile app is a second revenue line (below).

**Sustainability: strong.** Long-lived (format archive back to `vgc2015`), named operator, ads + app + direct sponsorship, and an archive that compounds SEO value. Not a project at risk of disappearing.

### Mobile
Native app, **iOS and Android** — App Store `id1511370166`, "Pikalytics: Battle Strategy", developer **Griffin Ledingham**. **HIGH** on existence/platforms.
- **CONTRADICTORY — team builder:** the App Store listing describes "a new mobile reimagining of our Pikalytics Team Builder" (browse moves/items/spreads, speed tiers, export teams), while a third-party review roundup from Apr 2026 says users "frequently cite a lack of expected features like a team builder and damage calculator compared to the web version." Listing may postdate the reviews. **Do not rely on either.**
- Damage calculator: reviews consistently say it is missing from the app. **MEDIUM.**
- App data **lags the website** ("updated WAY more frequently on the website"). **MEDIUM.**
- **Paid app**, one reviewer cites $0.99; users report buying it specifically to escape website ads. **LOW-MEDIUM** (single reviewer figure — do not quote the price).

### What they do better than a paste-in / report-out tool
1. **Cold-start answer with no input.** Pikalytics is useful before you have a team. We require a paste to say anything.
2. **Longitudinal archive.** Formats back to 2015. Historical authority we cannot retrofit.
3. **Population-level ground truth.** Usage % and rating-band reweighting require a data pipeline, not a parser.
4. **Native app + offline-ish event use.** We are a website.
5. **AEO already shipped.** `/ai/` mirror + `llms.txt` means they are being read by assistants today.
6. **International SEO** via `?l=` locales.
7. **Already ingesting Champions M-B/M-C Limitless events** — our "Champions is ours" assumption does not hold.

### Where they are weak — our gap
1. **No user object.** Nothing a player makes is ever hosted there. The entire "share my build" job is unserved.
2. **Aggregate, not specific.** They tell you the modal spread; they cannot tell you whether *your* spread is coherent, legal, or what it outspeeds.
3. **No SP semantics.** Champions SP (66 total / 32 per stat) is a different budget model from EVs. Their pipeline is EV/usage-shaped; nothing suggests SP-native handling. **MEDIUM** (inferred from absence).
4. **Ads degrade the reading experience** — users paid to escape them. A clean artifact is a felt differentiator.
5. **Markdown/agent surface incomplete** — `/ai/` exists but 0/15 `.md` URLs resolve, and no agent pointer in-page. Partially open lane.

---

## 2. PokePaste (pokepast.es)

### What it does / the one job
A Pokémon-specific pastebin. Submit a team in Showdown export format, get a URL back. **HIGH.** The one job: *"turn the text in my clipboard into a link I can drop in Discord."* It is the incumbent on exactly our axis, and it wins by being nearly frictionless.

Established (**HIGH** — two queries, plus the GitHub repo surfacing twice):
- Showdown export format in, clean URL out.
- **Syntax highlighting** of Showdown paste format — species, moves, items.
- **Sprite / item image previews** (art sourced from Pokémon Global Link).
- **Open source**: `github.com/zuils/pokepaste`, **3-clause BSD**.
- Self-described "simple, standards-compliant and mobile-friendly".
- **Showdown reads PokePaste links natively** — Showdown's Teambuilder fetches the export from a pokepast.es URL and recreates the team. **HIGH.** This is the single most important fact about PokePaste: it is wired into the client our users already use.
- Ecosystem: a Python package (`pokemon-formats`) uploads a team and returns the link; a **PokePaste MCP server** exposes `create_pokepaste` to AI agents; a Chrome extension ("Team Analyzer for Pokemon Showdown") renders a defensive type matrix *on top of* pokepast.es pages. **MEDIUM-HIGH.**

### Share / view UX — the critical axis
**This is the product, and it is the benchmark we are measured against.**
- **No account required.** **MEDIUM** — asserted by a promotional secondary source ("no account, no expiry drama, no ads") and by a how-to guide ("free, requires no account, open source"). A targeted query could not confirm from first-party docs.
- **Permanence: no expiry.** **LOW** — single promotional source. Widely assumed in the community; not verified this run.
- **Editing after creation: no evidence either way.** **UNVERIFIED.** Treat as immutable-by-default.
- **Recipient experience:** highlighted, sprite-illustrated plain paste. Readable, zero chrome, zero load cost. No analysis — no speed tiers, no matchups, no legality, no commentary.
- **OG previews / embeds: UNVERIFIED.** Nothing surfaced. Given the minimalist design ethos, rich unfurls are unlikely but I cannot assert it.

**The asymmetry to understand:** PokePaste's artifact is *lossless and round-trippable* — paste in, link out, and Showdown imports the link straight back into Teambuilder. A report is richer but lossier; if a recipient's next action is "play this team", PokePaste completes that loop and a report must not break it.

### Monetisation
**None evident.** No ads (per the same promotional source, **LOW**), no subscription, no donation flow surfaced. Open-source BSD project.

**Sustainability: structurally fragile but practically durable.** No revenue and apparently volunteer-run — a bus-factor risk — but hosting a text pastebin is cheap, the code is BSD so it can be forked, and it is load-bearing for the whole community. Low risk of disappearing, low risk of improving.

### Mobile
Self-described mobile-friendly; a plain highlighted text page is inherently fine on a phone and cheap on event wifi. **MEDIUM.** No app.

### What they do better than a paste-in / report-out tool
1. **Lower friction than we can currently match.** No account, no author name, no decisions. Paste → link.
2. **Native Showdown round-trip.** Their link is an *input* to the tool players use. Decisive.
3. **Lossless fidelity.** The exact bytes come back out.
4. **Instant, weightless recipient view.** No JS-heavy report to load on venue wifi.
5. **Default community convention.** Discord/forum posting guides tell people to link Poképaste. Habit is the moat.
6. **Agent/API ecosystem already built around it** (MCP server, Python lib) without them building it.

### Where they are weak — our gap
1. **Zero analysis.** No speed tiers, no defensive coverage, no legality check, no SP handling, no "why". Every interpretive job is unserved.
2. **No identity or authorship.** No "by", no creator page, no portfolio.
3. **No commentary layer.** A team without explanation is the common complaint; there is nowhere to put the reasoning.
4. **No versioning or changelog.** Teams evolve; a paste is a dead snapshot.
5. **No social layer** — no reactions, comments, view counts.
6. **No format awareness.** Cannot tell you the team is illegal in M-C. For Champions SP pastes it is a dumb text box.
7. **Static and unlikely to move.** No revenue, no roadmap pressure. The incumbent will not out-build us.

---

# TIER 2 — Adjacent

## 3. VGCPastes

**Weakest-verified entry in this report. Treat with caution.**

- **What search established:** exactly one corroborating reference — `metavgc.com/about` lists VGCPastes among its data sources, describing it as "shared team pastes and builds from the VGC community." **MEDIUM** that it is a community team-paste archive used as a data source by others. That is all three targeted queries produced.
- **Could not establish (UNVERIFIED):** whether it is a Google Sheet, a website, a Twitter/X bot, or a Discord; its curation process; its share UX; its monetisation; its mobile behaviour; its traffic.
- **Model prior knowledge, NOT verified this run (LOW — flagged explicitly):** my pre-existing understanding is that VGCPastes is a community project centred on a curated spreadsheet archive of tournament-performing teams, with an associated X/Twitter account and Discord, whose team links point at pokepast.es. **This was not confirmed by any source this run. Do not build on it without a human checking the site.**

**If the LOW-confidence picture is right**, the strategic read is: VGCPastes is a *curation and distribution* layer that does not host its own artifact — it points at PokePaste. Its strength is editorial trust (someone vetted that this team placed); its weakness is that it owns no viewing experience. A report-centric product is complementary rather than competitive, which makes it a **partnership/distribution target rather than a rival** — the archive needs a better destination for its links than a bare paste.

**Action: flag for human verification.** This is a named Tier 2 competitor we effectively could not research.

## 4. Limitless (play.limitlesstcg.com / limitlessvgc.com)

### What it does / the one job
Online **tournament management** platform with tight integration across many card and video games; Pokémon VGC is a supported game. **HIGH** (organizer docs via snippet, corroborated by the local skill). The one job is for *organizers*: run a Swiss event. The player-facing job is secondary: *"what did people play at this event, and where am I seated?"*

Established (**HIGH**):
- Swiss-system support, round timers, central pairings page for players.
- **Integrated decklist/teamlist submission** — organizers collect and verify lists before the event.
- **Automatic metagame analysis** built from those submissions: archetype performance, matchups, card counts.
- VGC support added around the 2022 season, explicitly to consolidate VG events from various TOs onto one site and track results and metagame development, replacing team collection via online forms (**MEDIUM** — single announcement page).
- **Public API**: base `https://play.limitlesstcg.com/api`, **no key needed** for tournaments / standings / details. Docs at `docs.limitlesstcg.com/developer.html`. Tournament IDs are 24-char hex. Rate-limited (429s, needs backoff). **HIGH** — from the local first-party `limitless-tournament` skill at `/root/.claude/skills/synced/.../limitless-tournament/references/api-notes.md`.
- **The decisive API limitation (HIGH, documented first-party):** per team member the API exposes **Pokémon + item + ability + 4 moves + tera type**. It does **not** expose **EVs, IVs, nature, or level**. Pastes from Limitless are "intentionally partial"; Showdown accepts them with default spreads. Additionally, **some players hide their teamlists**, so those rows return no team at all.
- `limitlessvgc.com` vs `play.limitlesstcg.com`: **UNVERIFIED** whether a separate property or an alias.

### Share / view UX
- Shared object is an **event**, not a team: `play.limitlesstcg.com/tournament/<24-hex>/standings|details`. Permanent, sign-in-free to view, deep-linkable per event and per phase. **HIGH.**
- Players submit a teamlist into the organizer's event; they do not get a shareable artifact of their own back. A player's team is visible only as a row inside someone else's standings table. **HIGH.**
- **Teamlist privacy is a real, respected concept** — players can hide lists. Any feature we build on Limitless data must honour this.
- Embeds / OG previews: **UNVERIFIED.**
- Sign-in required to *organize* or *submit*; not to view. **MEDIUM.**

### Monetisation
**UNVERIFIED.** Nothing surfaced on pricing, organizer fees, ads or sponsorship. No claim made.

**Sustainability:** structurally strong on a non-financial basis — it is infrastructure that tournament organizers depend on, with a public API that third parties (Pikalytics, pokebase.app, our own `/api/import/limitless`) have built against. Switching costs for TOs are high. **MEDIUM.**

### Mobile
**UNVERIFIED** in detail. A pairings page for players at a venue implies mobile use is a core scenario, but I could not confirm quality. No app surfaced.

### What they do better than a paste-in / report-out tool
1. **They are the source of truth.** Teamlists are *verified at submission*, not self-reported. Our data is whatever a user pasted.
2. **Event context we cannot generate** — records, standings, bracket phase, placement.
3. **Own the organizer relationship**, and therefore the data supply.
4. **Public API makes them the upstream** — Pikalytics and pokebase.app are downstream of Limitless, as are we.
5. **Operate at event-scale live** — pairings, timers, in-progress standings.

### Where they are weak — our gap
1. **The spread gap is their structural hole.** No EVs, IVs, nature or level — ever. The data that makes a team *playable* and that VGC players most want is exactly what Limitless cannot give. **This is the highest-value gap in this entire report.**
2. **No per-team artifact.** A top-cut team has no page, no OG preview, no commentary, no shareable identity.
3. **TCG-first platform**; VGC is one supported game among many, so VGC-specific semantics (SP, Reg M nesting, mega legality) get no attention.
4. **Nothing for the non-competing player.** Ladder players and team-builders have no entry point.

## 5. Trainer Hill (trainerhill.com)

### UNVERIFIED — could not establish anything

Three targeted queries (`trainerhill.com` features; `"Trainer Hill" Pokemon VGC`; and the domain alongside its category) returned **zero results from trainerhill.com and zero descriptions of it**. The domain is DNS-blocked here. One query was actively polluted by name collision with Pikalytics' *"VGC Trainer School; champions"* tournament pages, which is likely a recurring search-hygiene problem for anyone researching this competitor.

**I am making no claims about Trainer Hill's features, share UX, monetisation or mobile experience.** Any statement about it in this report's positioning section is absent for that reason.

Adjacent tools that *did* surface while hunting for it, which may be what the brief has in mind or may be substitutes (**LOW-MEDIUM**, all from app-store or extension listings):
- **VGC Stats** (iOS, `id6686406395`) — queries battle stats from Home, Showdown, Limitless and Championships under current VGC rules: usage rates, abilities, natures, tera types, items, moves, team synergy rankings, OTS team data.
- **missingno.run** (iOS) — live standings, pairings, player lists, usage stats for major tournaments.
- **VGCStats** (older web DB) — tracks Pokémon in official tournaments by championship points earned, with standings, each player's team, and VOD links.
- **Replaydex** / **VS Recorder** (Chrome extensions) — analyse *your own* Showdown replays; Replaydex finds common 4-Pokémon cores in opponents' teams and suggests a lead and bring-4 from your historical win rate (self-marked experimental).
- **SV Battle Memories** (iOS) — VGC match tooling.

**Action: flag for human verification**, same as VGCPastes.

---

## Our own share surface, read from the repo (HIGH — source of truth)

Positioning must build past what is already shipped. Verified by reading `/home/user/VGC-Team-Report/src`:

Already built: `/api/oembed`, `/api/quick-share`, `/api/share`, `/api/comments/[shareId]`, `/api/reactions/[shareId]`, `/api/changelog/[shareId]`, `/api/collaboration/[id]`, `/api/import/limitless`, `/api/pokepaste`, `/api/team-graphic`, `/api/match-log`, `/api/explore`, `/api/spotlight`, `/api/creator/[name]`, `/api/champions/meta`, `/api/sync/[id]`, `/api/sprite`.
Pages: `/s/[id]`, `/q/[id]`, `/embed/[id]`, `/champions/[pokemon]`, `/compare`, `/explore`, `/tournaments`, `/tools/ev-to-sp`, `/creator/[name]`, `/changelog`, `/dashboard/*`, `/faq`.
OG images: root, `/champions`, `/champions/[pokemon]`, `/explore`, **and `/s/[id]/opengraph-image.tsx`** — so per-report OG previews exist. `sitemap.ts` present. **No `robots.ts` and no `llms.txt` found.**

oEmbed (`src/app/api/oembed/route.ts`) is genuinely good: `provider_name`, an `/embed/<id>` iframe, and a `thumbnail_url` pointing at `/api/team-graphic?id=…&style=wide` at 1200×400, cached `s-maxage=3600`. It serves only `is_public = TRUE` and non-deleted shares. **We already beat PokePaste on unfurls.**

**Two self-inflicted gaps, both read directly from code:**

1. **`/api/share` requires authentication for every write.** The code comments are explicit: *"Require authentication for ALL writes — both create and update"* and *"sharing is an authenticated action, full stop."* It additionally hard-rejects a missing author: *"Add your name in the \"By\" field before sharing. Every report needs an author."*
2. **`/api/quick-share` is the only anonymous path, and it expires.** `INSERT INTO quick_shares (…) VALUES (…, NOW() + INTERVAL '30 days')`, with an httpOnly owner-token cookie.

So: our frictionless path **self-destructs after 30 days**, and our permanent path **demands a sign-in and a name**. PokePaste asks for neither and (probably) never expires. For a product whose thesis is *we are the share artifact*, this is the most consequential finding about us in this report.

---

# POSITIONING — 5 highest-leverage opportunities

Ranked by leverage = (impact × defensibility) ÷ build size. All five deliberately build **past** the known per-species EV-spread SEO ticket; none restates it. Note that the ticket's premise needs updating — see Opportunity 4.

## 1. Anonymous-permanent reports with claim-later

**(a) User problem.** A player wants to paste a team and get a link *now* — in a Discord thread, mid-conversation, on a phone, at an event. Today they must sign in with Clerk and type an author name, or accept a link that dies in 30 days. The recipient's problem is worse: a report link found in Discord scroll-back six months later is simply gone. PokePaste asks for nothing and keeps the link.

**(b) Why we're placed to win.** This is a self-inflicted wound, not a competitive disadvantage — the artifact, OG image, oEmbed, embed route and team-graphic thumbnail are *already built and already better than PokePaste's*. We are gating and then expiring a superior artifact. Fixing it converts our best existing asset into our acquisition funnel: anonymous report → permanent public link → "claim this report" → account. The owner-token cookie pattern in `quick-share` is already the right primitive for claim-later.

**(c) Build size: S–M.** Lift the 30-day TTL (or extend it sharply) for quick-shares that get viewed; add a claim flow binding an owner-token share to a Clerk user; make the author name optional with a graceful "Anonymous" render; relax the auth gate on *create* while keeping it on *update*. The real work is abuse/moderation and storage, not features — and **storage needs a Neon check**: CLAUDE.md records `share_versions` snapshots consuming 447MB of a 512MB free tier in July 2026, so removing an expiry is exactly the kind of unbounded-growth change that caused that incident. Pair it with a retention rule for never-viewed shares.

**(d) Confidence: HIGH on the gap, MEDIUM on the magnitude.** The gap is read verbatim from our own source. The magnitude rests on PokePaste's no-account/no-expiry properties, which are **LOW-confidence** (promotional source only), and cannot be sized against our funnel this run because **PostHog credentials are missing in this container** (per `run-meta.md`, tracked by VGC-220). Verify PokePaste's actual expiry policy and pull conversion numbers before committing to the storage trade.

## 2. Own the Limitless "partial teamlist → playable team" gap

**(a) User problem.** A player pulls a top-cut team from Limitless and gets Pokémon + item + ability + moves + tera — and **no EVs, no nature, no IVs, no level**. It is not playable, not comparable, and not analysable. Every downstream tool inherits this hole: Pikalytics, pokebase.app and pokemon-zone.com can all tell you *what* was played, and none can tell you *how it was built*. Players fill spreads in by hand or guess.

**(b) Why we're placed to win.** This is the one structural gap in the entire competitive set that sits exactly on our existing assets: `src/lib/parser/showdown-parser.ts`, `src/lib/analysis/stat-calculator.ts` (`convertToChampionsSp`), `src/lib/validation/champions-legality.ts`, and a shipped `/api/import/limitless` route. We can take a partial tournament teamlist and produce a *report* — speed tiers from base stats, defensive profile, legality, mega/restricted checks — that is genuinely useful **without fabricating a spread**. The honest framing is the product: show what is known, show what is derivable, and mark the spread explicitly as **not published by the event**. That last part is a trust feature nobody else offers, and the local skill's own rule ("Never invent EVs/IVs/nature/level") is the right editorial line.

**(c) Build size: M.** The import route exists; the analysis library exists. Work is: a partial-team report mode that degrades gracefully with unknown spreads, clear "unknown / event did not publish" states throughout the UI (`PokemonCard`, `PokemonDetailSlide`, `SpeedTierChart` all currently derive SP via `convertToChampionsSp` and will need an unknown-spread path), and honouring hidden teamlists from the API's `[skipped]` rows.

**(d) Confidence: HIGH.** The API limitation is documented in first-party local tooling docs, not inferred from search. Our capability is read from our own source tree. The only MEDIUM element is demand sizing.

## 3. Agent-readable reports + `llms.txt` — a lane Pikalytics left half-open

**(a) User problem.** Players increasingly ask an assistant "what's a good Gholdengo spread for Reg M-C" rather than searching. Today the assistant gets Pikalytics' `/ai/` pages. Our reports — the richest per-team objects in the ecosystem — are invisible to that channel, and we have **no `llms.txt` and no `robots.ts`** in the repo at all.

**(b) Why we're placed to win.** Pikalytics has proven the channel matters by building `/ai/` and an `llms.txt` — but the same third-party audit scores their markdown surface **0/100 (0/15 sampled pages return `.md`)** with no in-page agent pointer. The lane is open rather than lost. And we have something they structurally cannot cite: a *specific, attributed, commented team report* with an author. "According to this report by <player>" is a far better citation than an aggregate percentage. Our `/champions/[pokemon]` SSG pages and `/s/[id]` reports are both already static-friendly.

**(c) Build size: S.** Add `llms.txt`; add a `.md` (or `/ai/`-style) representation of `/s/[id]` and `/champions/[pokemon]`; add `robots.ts`; ensure the structured content is in the server-rendered HTML rather than client-hydrated. Mostly a serialisation layer over data we already have.

**(d) Confidence: HIGH that Pikalytics runs `/ai/` paths** (three independent queries, consistent URL grammar, markdown-style titles). **MEDIUM on their `llms.txt` and the 0/15 markdown score** — one third-party audit page, computed 2026-05-12, possibly stale. **HIGH that we currently ship neither** (repo read). Prior swarm reports exist on AEO (`r7-*`) — reconcile before building to avoid duplicate work.

## 4. Defend Champions SP authority — the premise of the SEO ticket has changed

**(a) User problem.** Champions Reg M uses **SP (66 total, max 32 per stat)**, not EVs. A player with an SP-form paste wants to know: is this legal in M-C, what does it outspeed, and is my 32-cap allocation wasted? Generic EV-shaped tools answer none of this correctly.

**(b) Why we're placed to win — and why this is now urgent.** We have genuinely differentiated logic: `champions-legality.ts` with per-reg dex, per-reg Mega Stones, restricted-max-2, item/species clauses and SP/EV budgets across the nested M-A/M-B/M-C supersets, plus `convertToChampionsSp` and a shipped `/tools/ev-to-sp`. **But the moat is narrower than our docs assume.** `pokemon-zone.com` already serves per-species Champions pages filtered by `?reg=m-b` and `?season=6`, with builds sortable by placement-weighted "competitive performance", teammates with win rates, and event-attributed builds. `pokebase.app` serves Champions event usage. `champdex.com` reportedly ships a **"Spread Solver"**. The existing EV-spread SEO ticket frames Pikalytics as the rival to beat on per-species pages; **for Champions, the incumbent is pokemon-zone.com, and competing on usage-aggregate species pages means fighting on their ground with worse data.**

The defensible wedge is therefore **not** "our species pages vs theirs" but **validation and explanation**: paste a team, get a verdict — legal/illegal in M-C *with the reason*, SP budget efficiency, 32-cap waste, speed benchmarks. None of the eight Champions entrants is report-centric, and legality reasoning is logic we already own and they would have to rebuild per regulation.

**(c) Build size: S–M.** The legality and SP engines exist; this is surfacing them as a first-class, linkable verdict inside the report and as a standalone entry point, plus programmatic expansion around `/tools/ev-to-sp`.

**(d) Confidence: MEDIUM-HIGH.** Our capabilities: HIGH (repo). The competitive crowding: HIGH that the cohort exists; `pokemon-zone.com`'s feature set: HIGH (two corroborating queries); `champdex.com`'s Spread Solver: **LOW** (described only by a rival's comparison page). The recommendation to *reframe the SEO ticket* rests on the pokemon-zone finding, which is well corroborated — but a human should open the site once before the ticket is rewritten.

## 5. Event × player × team report pages as the long-tail land-grab

**(a) User problem.** "What did <player> play at <event>?" is answered today by a row in a standings table (Limitless), a usage chart (pokebase.app), or an aggregate species page (Pikalytics). Nobody gets a *readable team page* — the artifact a player actually wants to study and send to a friend.

**(b) Why we're placed to win.** This fuses opportunities 2 and 3 into a content engine: Limitless API → partial teamlist → our report renderer → a permanent, OG-previewed, agent-readable page per team. We already have `/api/import/limitless`, `/tournaments`, `/explore`, `/compare`, `/api/team-graphic` and per-report OG images. It is the only SEO play in this report where the *landing page is the product demo*, and it compounds: each page is simultaneously long-tail search inventory, an AEO citation target, and a live advertisement for pasting your own team. Note `pokesynergy.app` validates the programmatic-page tactic with its `/vs/<competitor>` pages — and we already have a `/compare` route to apply it to.

**(c) Build size: M–L**, and the largest-risk item here. Needs: bulk ingestion with the API's rate limits and backoff respected; **hidden teamlists honoured, never backfilled**; unknown-spread rendering (shared with Opportunity 2); thin-content guards so hundreds of near-identical pages do not become an SEO liability; and a Neon storage plan, given the 447MB precedent. Ship one event end-to-end before generating at scale.

**(d) Confidence: MEDIUM.** The data path is HIGH (documented API, our existing route). The SEO upside is **MEDIUM-to-LOW** — programmatic pages built on partial data can underperform or be penalised as thin content, and I have no keyword-volume data for event/player queries this run. Also an **ethical and possibly policy constraint**: republishing players' teams at scale is not the same as a TO publishing standings. Check Limitless' API terms (`docs.limitlesstcg.com/developer.html`, unreachable here) and respect list privacy before building.

---

## What a human should verify before acting

1. **Trainer Hill** — wholly unverified. Open `trainerhill.com`.
2. **VGCPastes** — one corroborating mention. Confirm what it actually is.
3. **pokemon-zone.com** — the finding that most changes our plan. Open one species page.
4. **PokePaste expiry + account policy** — LOW confidence, and Opportunity 1 is sized against it.
5. **Limitless API terms** — gates Opportunity 5.
6. **Neon storage headroom** — gates Opportunities 1 and 5.
7. **PostHog** (VGC-220) — no funnel data available this run; Opportunity 1's magnitude is unquantified without it.

## Confidence summary

Roughly **55% HIGH** (Pikalytics' scope/`/ai/` paths/app; PokePaste's format, open-source status and Showdown round-trip; the Limitless API and its spread limitation; pokemon-zone.com's feature set; everything about our own repo), **~25% MEDIUM** (monetisation specifics, pokebase.app, pokesynergy.app, Pikalytics' `llms.txt`), **~20% LOW or UNVERIFIED** (all of Trainer Hill, nearly all of VGCPastes, PokePaste permanence/embeds, Limitless monetisation and mobile, the smaller Champions tools).

**Zero first-party page reads.** Every external claim is a search-index snapshot.

## Sources

- [Pikalytics species pages](https://www.pikalytics.com/pokedex/gen9vgc2025regg/Pikachu?l=en) · [AI-path mirror](https://www.pikalytics.com/ai/pokedex/ss/Pikachu) · [AI damage calculator](https://www.pikalytics.com/ai/damage-calculator) · [Limitless tournament ingestion](https://www.pikalytics.com/tournaments/limitless/vgc-trainer-school-champions-m-c-3-3bfa5c/Excadrill) · [event index](https://www.pikalytics.com/tournaments?page=3)
- [Pikalytics iOS app](https://apps.apple.com/mx/app/pikalytics/id1511370166) · [third-party review roundup](https://worldsapps.com/reviews-pikalytics-battle-strategy) · [app overview](https://game-solver.com/pikalytics-battle-strategy/) · [AEO audit](https://www.mintlify.com/score/pikalytics.md)
- [PokePaste source (zuils/pokepaste)](https://github.com/zuils/pokepaste) · [PokePaste MCP guide](https://mcp.directory/blog/pokepaste-mcp-complete-guide-2026) · [create_pokepaste tool](https://glama.ai/mcp/servers/jpbullalayao/pokemon-paste-mcp/tools/create_pokepaste) · [pokemon-formats](https://pypi.org/project/pokemon-formats/1.0.1) · [Showdown paste import](https://pokemondb.net/pokebase/204091/how-do-i-import-export-teams-on-pokemon-showdown)
- [Limitless organizer docs](https://docs.limitlesstcg.com/organizer) · [LimitlessVGC kick-off announcement](https://play.limitlesstcg.com/tournament/61deb1a4502dfb13924f4523/details) · [Limitless about](https://www.limitlesstcg.com/about)
- [MetaVGC sources page](https://metavgc.com/about) · [MetaVGC pro profile](https://metavgc.com/pros/vgcorner)
- [pokemon-zone.com species page](https://www.pokemon-zone.com/champions/pokemon/gholdengo/?reg=m-b) · [tournament page](https://www.pokemon-zone.com/champions/tournaments/warwick-online-vgc-tournament/?page=2)
- [pokebase.app Champions tournament](https://pokebase.app/pokemon-champions/tournaments/6a754d282766d7d34eafcf45)
- [pokesynergy.app teams](https://pokesynergy.app/teams) · [comparison page pattern](https://pokesynergy.app/vs/champteams)
- [champdex.com tools](https://champdex.com/tools/battle) · [poketools Champions builder](https://www.poketools.com/champions-team-builder) · [Champions VGC tool thread](https://communityone.io/ru/servers/1457350549216432295/pokemon-champions-vgc/forum/thread-1510910233743200366/)
- [VGC Stats iOS](https://apps.apple.com/app/id6686406395) · [missingno.run](https://mwm.ai/apps/missingnorun/6771875441) · [VGC Replay Analyzer](https://chromewebstore.google.com/detail/ikildimeghigegckdcdjbedfapehdimm) · [VS Recorder](https://chromewebstore.google.com/detail/fhmjjmjdcijeblnkkhckffbehppdbpob) · [VGCStats legacy](https://bool.netlify.com/portfolio/vgcstats/)
- Local first-party: `/root/.claude/skills/synced/.../limitless-tournament/references/api-notes.md` and `SKILL.md`
- Repo: `src/app/api/oembed/route.ts`, `src/app/api/share/route.ts`, `src/app/api/quick-share/route.ts`, `src/app/`, `.swarm/run-meta.md`
