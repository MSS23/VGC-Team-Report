# R1 — Competitor Teardown + Community Sentiment

**Produced:** 2026-08-03
**Agent:** R1 (overnight research swarm)
**Scope:** Part A — Pikalytics, PokePaste, VGCPastes, Trainer Hill, Victory Road, Limitless (plus newly-surfaced entrants). Part B — public community sentiment on team sharing, pokepaste alternatives, team reports, team-building tools. Then synthesis of 5 NEW product opportunities.
**Constraint:** READ-ONLY. Nothing was posted, submitted, commented, or published. No source file was edited. No commit was made.

---

## 0. Method + evidence quality (read this before trusting anything below)

**What worked:** `WebSearch` (first-party, US index). Local codebase inspection. Prior swarm reports in `.swarm/` from the May 2026 runs.

**What did not work — and why it matters:**

| Channel | Status | Effect on this report |
|---|---|---|
| `WebFetch` on competitor domains (pokepast.es, crob.at, vgctrainer.com, vgc.tools, vgenc.net, metavgc.com, victoryroad.pro, limitlessvgc.com, smogon.com) | **HTTP 403 at the egress proxy** | Could not read pages directly. All Part A detail is from search-index summaries + the sites' own marketing copy surfaced in SERPs. |
| `curl` to the same hosts | **`CONNECT tunnel failed, response 403`** | Same. Per `/root/.ccr/README.md`: "The destination host is not allowed by your organization's egress policy… Do not retry or route around it — report the blocked host." Not retried. |
| `reddit.com` via WebSearch `allowed_domains` | **API 400: "domains are not accessible to our user agent"** | **r/VGC and r/stunfisk could not be read at all this run.** |
| GitHub MCP on third-party repos (`felixphew/pokepaste`, `smogon/pokemon-showdown`) | **Access denied — session scoped to `mss23/vgc-team-report`** | Could not pull issue threads as primary complaint evidence. |

**Consequence:** Part B is weaker than Part A. Direct Reddit/X quotes are unavailable. What I *can* do honestly is (a) use Smogon forum threads, which **are** indexed and searchable, (b) use tool-authors' own problem statements (a tool that exists is proof someone felt the pain hard enough to build), (c) use guide/news sites summarising community reaction, and (d) cross-check against the May 2026 swarm reports (`r3-community-sentiment-20-05-26.md`, `r4-twitter-vgc-sentiment.md`) which did capture Reddit/X material. Where a claim rests only on May data, I say so.

**Confidence key used throughout:** `[HIGH]` multiple independent current sources · `[MED]` one current source or inference from an artefact · `[LOW]` single/indirect, or carried over from May and not re-verified.

---

# PART A — COMPETITORS

## A0. The landscape moved materially since May 2026

The single most important Part A finding is **not** about any one competitor. It is that the VGC tooling space has fragmented hard in the ~10 weeks since the last teardown, and two of the six named targets are no longer what the brief assumes.

**Named targets that changed:**

- **Trainer Hill has left VGC.** `trainerhill.com` now self-describes as "your competitive **Pokémon TCG** and Pokémon TCG Pocket analytics hub." Its tools page ships a TCG tier-list builder, deck-diff table, and badge maker. Multiple searches for VGC tooling on that domain return only TCG surfaces. `[HIGH]` — Treat Trainer Hill as a **lapsed competitor**, not an active one. Its abandoned VGC surface area (meta trends + matchup stats presented as an analytics *hub* rather than a stats *dump*) is uncontested territory.
- **Victory Road has shipped its own paste tool.** `vrpastes.com` — "VR Pastes" — is now Victory Road's official team-sharing tool, updated for Pokémon Champions. This is new and it is aimed squarely at the same job VGC Team Report does. Details in A5. `[HIGH]`

**New entrants found this run (none of these were in the May teardown, or were only flagged as "emerging"):**

| Tool | Positioning | Note |
|---|---|---|
| `crob.at` | "Visual Pokémon Showdown team sharing" — explicit PokePaste-alternative play | The most direct competitor. See A7. |
| `vgctrainer.com` | Team builder on live Smogon 1760+ stats; usage, calc, speed tiers, threat analysis, image-card export | Free, no account, mobile+desktop |
| `vgc.tools/builder` | Team builder, VGC + Champions | |
| `vgenc.net` | "AI VGC team builder", `/top-teams` claims **2,386** Reg M-A tournament pastes | Scale claim is the pitch |
| `metavgc.com` | "Best Pokémon Champions teams, VGC stats & pastes" | |
| `pokestats.cc` | Guides + speed tier charts, Reg I | SEO-content-shaped |
| `pokesynergy.app` | Speed tiers, updated 2026-07-27 | |
| `champsdex.com`, `champdex.com`, `genpkm.com`, `switchbladegaming.com`, `gamecards.gg`, `game8.co` | Champions SP/EV explainer content farms | See B3 — this is an opportunity, not just noise |
| `metahaunter.pages.dev` | "Handmade VGC teambuilder, Reg M-A, FREE, **no simulated data**" | See B2 — the positioning is the signal |
| `pokemonbuilder.com`, `vgcguide.com`, `vgcmulticalc.com`, `nuztools.net` | Builder / guide / multi-calc | |

**Strategic read:** the *builder* and *stats* categories are now commoditised and crowded, largely by low-differentiation SEO plays. The *report* category — a shareable artefact that explains a team — has exactly two credible occupants: VGC Team Report, and Victory Road's editorial Team Reports (human-written, gatekept). That is where the defensible ground is. `[MED]`

---

## A1. Pikalytics (pikalytics.com)

**Core feature set** `[HIGH]`
Per-Pokémon usage pages (usage %, abilities, items, moves, EV/SP spread clusters, teammates, counters, Tera); a Pokémon Champions hub covering Reg M-A and M-B; `/team` team builder that drafts tournament-ready teams from real tournament usage; `/topteams` gallery of winning comps with win/loss records and event placement; `/speed-tiers` including a dedicated Champions chart (base speed, max investment, neutral nature, Choice Scarf, Mega forms); `/calc`; tournament results; quizzes (speed/calc/type); editorial beginner articles; eight languages; a paid iOS app.

**Share/view flow — "I have a team" → "someone else is looking at it": ~3–4 clicks, weak artefact.** `[MED]`
Build/import in `/team` → share via URL or screenshot image. The URL carries the team but no narrative and no analysis context; the screenshot carries visuals but is not a live link. Pikalytics is not really trying to win the share; it is trying to win the *build*. Sharing is an exit, not a loop.

**Mobile.** Website is dense and data-heavy; the paid iOS app ($0.99, ad-free, offline) is the real mobile story. Android was unpublished in Aug 2024 and has not returned. `[HIGH]`

**Monetization.** Ko-fi membership as primary; $0.99 one-time iOS app; no paywalled web features; no intrusive display ads. `[MED — the Ko-fi specifics are carried from May and I could not re-verify this run; the search returned only generic Ko-fi platform articles.]`

**Mobile app is the soft spot.** App Store reviews are consistently blunt about it despite a 4.7 aggregate: *"the app doesn't update to see the newest changes… the website is updated WAY more frequently, 2-3 months since the last update to the app"*; *"information is not as accurate compared to the actual website"*; *"why can't I see EVs, abilities, or personalities on an app I paid for that I can see on the free website."* `[HIGH]` This is a **repeated theme, not a loud minority** — the same three complaints recur across review aggregators.

**The ONE thing Pikalytics does better than a team-report tool:** *aggregated meta authority inside the build loop.* Its Meta Calcs — a live damage calculator embedded in the team builder, auto-populated with format-relevant threats — closes build→verify→adjust without a context switch. A report tool describes one team; Pikalytics describes the whole format, and does it with data nobody else has at that volume.

---

## A2. PokePaste (pokepast.es)

**Core feature set** `[HIGH]`
A pastebin for Showdown export format. Syntax highlighting (species tinted by primary type, moves by type, items), image previews of mons/items using Pokémon Global Link art, permanent URLs, no account, no expiry, no ads, open source (Go, `felixphew/pokepaste`).

**Share/view flow: 2 clicks. This is the number to beat.** `[HIGH]`
Paste text → Create → copy URL. That is it. No login, no wait, no decisions. Every other tool in this space, including VGC Team Report, is competing against a 2-click baseline that has been muscle memory for the VGC community for years. Any flow that costs more than 2 clicks must visibly repay the difference *before* the user pays it.

**Mobile.** Renders as plain monospaced text. Legible, not designed. No mobile affordances.

**Monetization.** None. Free, open source, no ads.

**Known, long-lived defects** `[HIGH]` — and note these are *externalised*, i.e. the community built patches rather than the maintainer fixing them:
- **Missing sprites for newer/awkward species.** A Chrome extension, **Pokepastefix**, exists solely to walk each paste and swap broken image URLs for working ones. Documented long-standing failures: Zygarde-10%, Zygarde-Complete, Ash-Greninja, and Sirfetch'd — the last because Showdown and PokePaste disagree on apostrophe style. Discussed at `smogon.com/forums/threads/pokepaste-image-fix.3733096/`.
- **No link previews.** A bare pokepast.es URL unfurls to nothing on Discord or X. This is the single most-cited complaint and the entire reason crob.at exists.
- **Chat-flow friction.** A second extension, **Three Island** (`PartMan7/Three-Island`, Chrome + Firefox + userscript), exists to hover-preview and one-click-import paste URLs *without leaving Showdown chat*. Thread: `smogon.com/forums/threads/three-island-an-extension-for-a-seamless-pokepaste-experience.3692887/`. Notably it explicitly supports **crob.at URLs alongside pokepast.es** — third-party tooling has already accepted crob.at as a peer format.

**The ONE thing PokePaste does better:** *frictionlessness as a moat.* Two clicks, zero accounts, zero decisions, a URL that has never broken. It is the format everyone else imports *from*. Its ubiquity is worth more than any feature.

---

## A3. VGCPastes (@VGCPastes on X + Google Sheet + Discord)

**Core feature set** `[HIGH]`
A community curation project: "collect all VGC teams shared online and put them neatly in one place." A public Google Sheets Team Depository/Library, an X account posting batched drops, and a Discord (**~14,784 members**) running **Sandshrew Bot**.

**Sandshrew Bot** — the interesting bit. Slash commands for `search`, `get rental`, and `random team`, with auto-complete on team search, paginated scrolling, and reroll-in-place. A 2026 update explicitly removed the old "annoying txt files" flow in favour of paging through results on a single message, and added Reg M-A support. `[HIGH]`

**Share/view flow: not a share tool — a *discovery* tool.** You do not publish to VGCPastes; you get curated into it. The consumption flow is ~2 clicks (Discord slash command → rental code or paste link) and is genuinely excellent.

**Mobile.** The Google Sheet is bad on mobile and they know it — a 2026 post pushes an "alternate link to view Champions teams [that] works better on mobile than the full sheet." `[MED]` Discord/Sandshrew is the de facto mobile path, and it is good.

**Monetization.** None visible. Volunteer-run; posts thank named contributors for filling in the spreadsheet and maintaining the bot.

**The ONE thing VGCPastes does better:** *it lives where the conversation is.* 14.7k people do not visit a website; they type `/search` in a Discord they are already in. Distribution beats product surface. VGC Team Report's Discord integration (`src/lib/discord-bot.ts`, `src/app/api/bot/route.ts`) is an **internal feedback/ops bot** — token, feedback channel, weekly summary emails — not a community-facing one. That asymmetry is opportunity #4 below.

---

## A4. Trainer Hill (trainerhill.com) — LAPSED

**Status: no longer a VGC competitor.** `[HIGH]` The site is "your competitive Pokémon TCG and Pokémon TCG Pocket analytics hub for meta trends, decklists, matchup stats, and tools." Tools shipped: TCG tier-list builder (arrange archetypes, track meta percentages, annotate matchups, publish rankings for upcoming events), deck-diff table, game notes, badge maker. `tools.trainerhill.com` is a TCG dashboard. Repeated VGC-scoped searches against the domain surface nothing VGC.

**Share/view flow, mobile, monetization:** not assessed — out of scope now that it is TCG.

**The ONE thing Trainer Hill does better — and it is worth stealing:** *publishable, annotatable analysis artefacts.* Its tier-list builder is not a data dump; it is a tool for producing a **shareable point of view** — you arrange, you annotate matchups, you *publish rankings for an upcoming event*. That is structurally the same product shape as a team report, executed for TCG. It also confirms the pattern: the money/attention in Pokémon tooling is drifting from "here are the numbers" to "here is my read, shareable."

---

## A5. Victory Road (victoryroad.pro) + VR Pastes (vrpastes.com)

**Core feature set** `[HIGH]`
Editorial VGC hub. Curated rental-team pages per regulation set (`/sv-rental-teams`, `/sv-rental-teams-reg-set-h`, etc.); a **Team Reports** article category (`/category/articles/reports/`) plus Warstories; a resources hub; Champions Replica Teams; and a live grassroots tournament circuit (VR Challenges, The Champions Arena I/II, "Victory Road to San Francisco", 15–16 Aug 2026, free entry).

**Team Reports are the direct category analogue.** Victory Road's own framing: reports are written by tournament winners and high placers to explain *why* their team did well, surfacing "innovative ideas and subtle details that make the difference between average and high-performing teams." Players **submit** reports for publication. `[HIGH]`

**VR Pastes — new, and the most strategically relevant competitor artefact found this run.** `[HIGH]` Paste in Showdown format → shareable link. Its differentiators:
- **Dual-link visibility model.** The main link is a **Closed Team List** — full team with EVs/IVs. A separate public **Open Team List** link hides EVs/IVs, exposing composition without spreads.
- **Password-protected pastes**, encrypted at rest.
- **Champions-native:** compatible with the new stat system, shows actual stat values, and lets you swap between base and Mega forms in the paste.
- **It is the tournament submission format.** Victory Road tournament rules require entrants to supply a team list "shared in a link such as VRPastes Open Team List," carrying form, ability, held item, moves, and **Stat Alignment**.

That last point is the one to internalise. Victory Road did not just ship a paste tool — it made its own paste tool **the required input to its own tournaments**. That is a recurring, mandatory, high-intent touchpoint every single event.

**Share/view flow.** Victory Road editorial: very high friction (pitch → editorial acceptance → publication; days). VR Pastes: ~2–3 clicks, PokePaste-class.

**Mobile.** Standard WordPress-class responsive editorial. Not a differentiator either way. `[LOW]`

**Monetization.** No visible paywall. Runs free tournaments. `[LOW]`

**The ONE thing Victory Road does better:** *editorial legitimacy plus format ownership.* A Victory Road team report is a credential — people cite it, players want to be in it. And by owning the required submission format for its own circuit, VR Pastes gets recurring mandatory usage that no purely voluntary sharing tool can buy.

---

## A6. Limitless VGC (limitlessvgc.com + play.limitlesstcg.com?game=VGC)

**Core feature set** `[HIGH]`
Tournament database and online tournament platform: results, player profiles, usage statistics, a `/teams` surface of top-placing teams from major events, and Swiss tournament software with team-list submission. Team lists are submitted **as pokepastes**, kept private until the tournament starts, and the TO toggles open lists on/off. When open lists are enabled, Limitless **auto-generates a tournament metagame overview** — tracking archetypes via restricted-Pokémon duos, with per-duo records updated each round, yielding usage *and* win rates.

**Share/view flow.** Not a personal share tool. Teams surface as a byproduct of competing: register → submit paste → play → your teamlist becomes a public URL (`/tournament/{id}/player/{handle}/teamlist`). Zero clicks to publish, but zero control and zero narrative.

**Mobile.** Functional tournament UI. Teamlist pages are readable but plain. `[LOW]`

**Monetization.** Nothing found. The stated goal is supporting TOs and helping players find events — infrastructure play, not a revenue play. `[MED]`

**The ONE thing Limitless does better:** *result-linked provenance, computed automatically.* Every team on Limitless is welded to a real placement in a real event with a real record, and the metagame overview is derived, not curated — no human has to type anything. A self-published report can claim anything; a Limitless teamlist is evidence. Prior sentiment work (May) flagged the flip side: Limitless gives you tournament data with **no context** — you see what won, never why. That gap is precisely the report category.

---

## A7. crob.at — the closest competitor, and it was not in the brief

Worth its own section. `[HIGH]`

**Positioning:** "Visual Pokémon Showdown team sharing." It runs explicit conquest pages — `/pokepaste-alternative` and `/pokepaste` — that argue the case in the site's own words: PokePaste "only displays team data as plain text: there are no sprites, no visual preview, and no social embed support," and "a plain PokePaste URL tells viewers nothing at a glance."

**Feature set:** free, no login, Showdown import, **pokepast.es URL import**, sprites + item icons, **generated social preview images so Discord/X unfurl properly**, multi-team support, and a public team gallery. Champions Reg M-B supported alongside historical regulations.

**The part that should worry us most is the SEO architecture.** crob.at ships a programmatic gallery:
- `/teams` — all Showdown teams
- `/teams/vgc` — "Pokémon Champions VGC 2026 Reg M-B Teams to Copy & Paste", **588+ teams**
- `/teams/champions`, `/teams/gen9ou`
- **`/teams/vgc/{pokemon}`** — one indexable page per species. Confirmed live and ranking: `/teams/vgc/kommo-o`, `/teams/vgc/tornadus`. Also `/teams/pokemon/{species}` (e.g. `/vaporeon`).

Each page "collects public teams with sprites, moves, items, abilities, stat spreads, and authorship when available." So: user-submitted teams → per-species landing pages → long-tail search traffic → more users submitting teams. A compounding loop, and it is already indexed.

**Share flow:** 2 clicks, PokePaste-equal, with a real link preview at the end. **Monetization:** none found. **Third-party validation:** the Three Island extension treats crob.at URLs as first-class alongside pokepast.es.

**The ONE thing crob.at does better:** it took PokePaste's exact 2-click flow, added the one missing thing everyone complains about (the unfurl), and then monetised the resulting corpus as programmatic SEO. It is the strategy VGC Team Report is best positioned to beat on depth — because crob.at's per-species pages contain *pastes*, and ours could contain *analysis*.

---

## A8. Part A comparison

| | Clicks to shared view | Login | Link preview | Analysis/narrative | Per-species SEO pages | Mobile | Money |
|---|---|---|---|---|---|---|---|
| **PokePaste** | 2 | No | **No** | No | No | Plain text | None |
| **crob.at** | 2 | No | **Yes** | No | **Yes** (`/teams/vgc/{mon}`) | Visual | None |
| **VR Pastes** | 2–3 | No | Unknown | No | No | Standard | None |
| **Pikalytics** | 3–4 | No | Weak | Meta stats, not per-team | Per-mon *usage* pages | Paid iOS app; site dense | Ko-fi + $0.99 app |
| **VGCPastes** | ~2 (Discord cmd) | Discord | n/a | Curation only | No | Sheet bad, bot good | None |
| **Limitless** | 0 (byproduct) | Tournament reg | Plain | Auto meta overview | No | Functional | None |
| **Victory Road** | Days (editorial) | Pitch | Yes | **Yes — human prose** | Per-regulation pages | Standard | None |
| **Trainer Hill** | — | — | — | TCG only | — | — | — |
| **VGC Team Report** | Paste → report → Share modal (link/paste/Discord/embed/rental/native/PNG) | Optional | **Yes** (`/s/[id]` OG image live) | **Yes — structured, automatic** | **Only `/champions/{mega}`** | PWA, install prompt, pull-to-refresh, swipe | TBD |

**Three honest reads from this table:**
1. Our share *artefact* is already best-in-class. `ShareModal` covers copy-link, copy-paste, copy-Discord-message, embed code, rental code, native `navigator.share`, and PNG download; `/s/[id]/opengraph-image.tsx` renders a real edge OG card. The May "blank previews" gap is **closed**.
2. Our share *flow* is longer than 2 clicks, and the field's baseline is 2. (VGC-207 anonymous quick-share targets this — already ticketed.)
3. Our **discovery surface is the weakest column**. `/explore` is one canonical page with client-side filters (`species`, `archetype`, `placement`, `hasRental`, `tournamentMode`, `regulation`); `/champions/[pokemon]` is SSG but `generateStaticParams` returns only Reg M-A **Megas that have confirmed Showdown sprites**. crob.at has hundreds of indexable species pages. We have a few dozen Mega pages.

---

# PART B — COMMUNITY SENTIMENT

**Caveat restated:** r/VGC and r/stunfisk were unreachable this run (crawler blocked). X/Twitter content was reachable only as search-surfaced post text. What follows leans on Smogon forums (indexed and searchable), tool-authors' own problem statements, explainer sites summarising community reaction, and the May swarm's Reddit/X work. I flag confidence per theme and separate repeated themes from single voices.

## B1. REPEATED THEME — "A bare paste link tells you nothing"

**Strength: strongest signal in the dataset.** `[HIGH]`

Not one complaint but a pattern of *artefacts built to fix it*:
- **crob.at** exists as a product whose entire homepage argument is that PokePaste has "no sprites, no visual preview, and no social embed support."
- **Three Island** (browser extension, Chrome + Firefox + userscript) exists to hover-preview and one-click-import paste URLs so you "never need to leave chat." Someone shipped and maintains a cross-browser extension because clicking a paste link mid-conversation is annoying enough to warrant it.
- **Pokepastefix** (Chrome extension) exists because sprites silently break.
- **VGCPastes' own Discord bot** was rebuilt in 2026 to page results inline "No more annoying txt files" — same instinct: keep the content where the person already is.

Four independent builders solved four facets of one problem: *a link to a team should show you the team, in place, immediately.*

**Where we stand:** OG images ship. Embed code ships. `/api/oembed` exists. The remaining unserved facet is **inside Discord chat**, where the community actually talks — see opportunity #4.

## B2. REPEATED THEME — "I don't understand *why* the spread is that"

**Strength: high, and it is the deepest theme in the set.** `[HIGH]`

- vgcguide.com states it plainly: *"one of the most common frustrations from people trying to learn the game is understanding how people come up with complicated EV spreads."*
- The same source: the skill "is not taught in the mainline games, there's no one-size-fits-all answer for each Pokémon, and ultimately it's challenging to know without experience whether your spreads are helpful or detrimental, making crafting EV spreads an opaque and seemingly complex process."
- Aaron Traylor's widely-circulated "A Beginner's Guide to Stress-free EV Spreads" exists for the same reason.
- **MetaHaunter** (Smogon Technical Projects, April 2026) is positioned *entirely* on this: "handmade… **no simulated data**… nothing is simulated, nothing is generated. The scorer is written from VGC first principles," built "for newer players who can build a team with **reasoning they can actually read and follow**."
- Smogon's VGC subforum is full of "please help me review this VGC team", "Questions, VGC team building help/feedback", "First time teambuilding! I have a million doubts."
- Smogon's **VGC Team Bazaar** rules require "a Poképaste **and a description on how your team works**" — the community's own norm is that a paste alone is insufficient.
- Victory Road's Team Reports category exists precisely to publish the *why*.

**Two sub-signals worth separating:**
- *"Reasoning I can read"* is being asked for explicitly, and MetaHaunter's "no simulated data" framing implies a live distrust of AI-generated/fabricated analysis. Any generated prose we ship must be **derived and checkable**, not vibes. `[MED]`
- Speed is universally called the highest-leverage stat ("move order dictates the game more than any other factor"), and the standard beginner advice is literally "take a guess with Speed… you can always adjust later." People are guessing at the most important number. `[HIGH]`

## B3. REPEATED THEME — Champions SP conversion is actively confusing people

**Strength: high, current, and time-boxed.** `[HIGH]`

Direct: *"The confusion is particularly evident in the community, where players are overthinking how SP can be directly applied to their Pokémon when converting from traditional EV spreads. Some players know that 32 SP equals 252 EVs, but when trying to convert other numbers, **the math doesn't seem to add up**."*

The mechanic itself: EVs and IVs are gone; 66 SP per Pokémon, max 32 per stat; ~1 SP ≈ 8 EVs, except the **first** SP in a stat costs 4 EVs and each additional costs 8 (the HOME transfer rule). That off-by-one first step is exactly the thing that makes hand-conversion "not add up."

**The market response is telling:** at least six sites are farming this query with *prose* — champsdex.com, champdex.com, genpkm.com, switchbladegaming.com, gamecards.gg, game8.co, plus screenrant. Every one of them explains the rule in words. **None of them is a calculator.** Meanwhile `convertToChampionsSp` in `src/lib/analysis/stat-calculator.ts` already implements it correctly, with tests, and is used across `PokemonCard`, `PokemonDetailSlide`, `SpeedTierChart`, `CompareContent`, and `champions-legality.ts` — but is only reachable *inside a report*.

This window closes. Conversion confusion is a transition-period phenomenon.

## B4. REPEATED THEME — Discovery is fragmented and getting worse

`[MED-HIGH]`

To find a team in Aug 2026 a player checks: VGCPastes' Google Sheet, VGCPastes' Discord bot, Victory Road's rental pages, Limitless teamlists, Pikalytics Top Teams, crob.at's gallery, plus a dozen new builder sites. VGCPastes themselves publish a two-path "here are the two ways to find a team" explainer — which is an admission that finding one is non-obvious. The May swarm ranked "unified, searchable team report archive" as its #1 unmet need; the entrant list in A0 shows fragmentation has *worsened* since. Nothing in this run contradicts it.

## B5. REPEATED THEME — Tournament submission is a recurring, mandatory chore

`[HIGH]` — under-weighted in prior runs.

- The 2026 season runs **open team list**. Competitors "are required to provide a legible and accurate list of the Pokémon that comprise their team before the deadline."
- Play! Pokémon events submit via **RK9 Labs Team List Creator** (`player.rk9labs.com/teamlist/`). You build each Pokémon, then toggle 4–6 onto the battle team, then submit.
- **Rental codes are required at most higher-level tournaments** — RK9's own docs call this "an extra level of security and integrity," and note "knowing how to create and provide an accurate rental code is crucial."
- Grassroots is separate and equally mandatory: Victory Road requires a **VR Pastes Open Team List link** including form, ability, item, moves, and Stat Alignment.
- Penalty risk is real: the list "will serve as the source of truth… failure to produce a team in-game that matches the submitted team list may result in penalties."

So every competing player, before every event, re-transcribes a team they already have in Showdown format into a *different* system, under threat of penalty, and often has to attach a rental code. I could not find direct player griping about this (Reddit blocked), so I will not claim it is loudly complained about — but structurally it is a repeated, high-stakes, high-friction task, and Victory Road already captured its half of it by making VR Pastes the required format.

## B6. MODERATE THEME — Mobile is where teams get consumed, and most tools are bad at it

`[MED]`

- VGCPastes ships an alternate mobile-friendlier Champions link because "the full sheet" is poor on phones.
- PokePaste on mobile is a wall of monospace.
- Pikalytics' answer is a **paid** app whose reviews complain it lags the free website by months.
- **VGC Helper** — historically the best VGC mobile app (team builder, damage calc, speed ranking calc, **battle assistant for live in-match calcs**, teams list, full Poképaste support, type/speed/coverage summaries) — appears effectively abandoned; searches indicate the last meaningful update was **April 2024**, with the listing otherwise dormant into 2026. `[MED]` The best mobile VGC tool in the category has been unmaintained for over two years and nobody has replaced it.

## B7. MODERATE THEME — OTS reveals composition but hides the numbers

`[MED]`

Open Team Sheets were "a patch job solution because there was not a functioning spectator mode" — the Switch has no split screen, so moves and items get revealed on stream anyway. Crucially: *"Stats of Pokémon are still hidden and can be discovered through play, with **speed tiers, bulk and attack investment all findable** through attention to how much damage is dealt and received."* An example given is a player learning an opponent's Flutter Mane outsped theirs, "indicating at least 196 speed — information they shouldn't have had going into that game."

There is a `VGC OTS` Chrome extension whose only job is pinning the OTS panel above Showdown's chat log so it stays visible. Again: someone built a tool because reading the sheet at the right moment is annoying.

Note this cuts both ways for us: it validates match-time tooling (`MatchTracker`, `AddOpponentInput`, `OTSSheetModal` already exist), *and* it is an argument that people will want to publish composition without spreads.

## B8. Signals I judge to be a LOUD MINORITY — do not build on these

- **"Pikalytics data is stale/inaccurate."** Real and repeated *for the iOS app*; much weaker for the website. Do not build a "fresher stats" play on it.
- **Broken sprite complaints** (Sirfetch'd apostrophes, Zygarde forms). Genuinely annoying, genuinely small, and already **VGC-232**.
- **AI-slop backlash.** MetaHaunter's "no simulated data" and vgenc.net's "AI VGC team builder" are two data points pointing opposite ways. Not enough to call a trend. Treat as a *constraint on how we present generated content* (show the derivation), not as a market position.
- **Anti-rental-team sentiment** (rentals enabling copy-then-tweak). Longstanding, unresolvable, not actionable.

---

# PART C — SYNTHESIS: 5 NEW HIGHEST-LEVERAGE OPPORTUNITIES

## Screened out as ALREADY-TICKETED

Everything below was surfaced by the research and matches an existing ticket. Not counted.

| Finding | Ticket |
|---|---|
| Rental code required at higher-level tournaments (RK9); VGCPastes' `get rental`; `hasRental` filter already in explore | **VGC-226** ALREADY-TICKETED |
| crob.at imports pokepast.es URLs; PokePaste is the corpus everyone starts from | **VGC-225** ALREADY-TICKETED |
| PokePaste's 2-click no-login baseline is what we're measured against | **VGC-207** ALREADY-TICKETED |
| VR Pastes' Closed vs Open Team List dual-link; password-protected pastes; creators using Patreon to gate spreads | **VGC-153** ALREADY-TICKETED (see #5 — I carve out a distinct non-overlapping piece) |
| Pokepastefix; Sirfetch'd/Zygarde sprite breakage | **VGC-232** ALREADY-TICKETED |
| Share pages must render for crawlers/unfurlers | **VGC-228** ALREADY-TICKETED |
| Pikalytics' embedded Meta Calcs as the retention loop | **VGC-38 / VGC-79** ALREADY-TICKETED |
| Limitless teamlist provenance | **VGC-40** ALREADY-TICKETED |

---

## NEW #1 — Programmatic per-species team index pages (`/teams/[species]`)

**What.** SSG/ISR one page per relevant species, listing public reports featuring that Pokémon, with the analysis we already compute (common spreads, item/ability/tera splits across our own corpus, speed placement, typical teammates) — then link into full reports. Effectively `/champions/[pokemon]`'s treatment, generalised beyond Megas-with-sprites, and fed by `/explore`'s existing species query.

**Evidence.**
- crob.at ships exactly this and it is indexed: `/teams/vgc/kommo-o`, `/teams/vgc/tornadus`, `/teams/pokemon/vaporeon`, with `/teams/vgc` claiming **588+** Champions teams. `[HIGH]`
- Pikalytics' most-trafficked surface is per-Pokémon pages (`/pokedex/{format}/{Pokemon}`). Per-species is the proven URL shape in this niche. `[HIGH]`
- Our own gap is verified in code: `src/app/champions/[pokemon]/page.tsx` → `generateStaticParams` returns `getRegMAMegasWithSprites()` only; `src/app/sitemap.ts` emits static pages + `/s/{id}` + `/creator/{name}` + Mega pages, and nothing per-species; `/explore` is a single canonical (`alternates: { canonical: ".../explore" }`) with species/archetype/placement/rental filters held in client state. Filter combinations generate **zero** indexable pages.
- Discovery fragmentation (B4) means the entry point is search, and our corpus is invisible to it.

**Why it's ours to win.** crob.at's species pages hold *pastes*. Ours would hold *analysis* — speed tiers, coverage, spread distribution, matchup notes. Same query, strictly better answer, and it compounds: every published report enriches the species pages, which pull traffic, which produces reports.

**Effort: M (~2–4 days).** Reuse the `/champions/[pokemon]` page shape and the `/api/explore` query. Needs: a species allow-list (gate on a minimum report count — `/api/champions/meta` already uses `MIN_REPORTS = 5`, reuse that idea to avoid thin pages), `generateStaticParams`, `revalidate: 3600` (matching the Mega pages' cost reasoning), sitemap entries, `CollectionPage` JSON-LD, sprite fallback (coordinate with VGC-232). Watch the Neon free-tier guardrail: aggregate queries per species must be cached (`cacheGet`/`cacheSet` already exist).

**Risk.** Thin-content penalties if pages ship with 1–2 reports. The minimum-count gate is not optional.

---

## NEW #2 — Standalone EV ⇄ SP converter tool page

**What.** A public `/tools/ev-to-sp` (and inverse) page: paste a Showdown EV spread or a full team → get the exact Champions SP allocation, with the 66-total / 32-per-stat budget check, the "first SP costs 4 EVs, subsequent cost 8" rule shown as a worked step, resulting level-50 stats, and a copy-out. Plus a "convert my whole team" CTA that drops the user into the real report.

**Evidence.**
- Documented, current, specific confusion: *"players are overthinking how SP can be directly applied… when trying to convert other numbers, the math doesn't seem to add up."* `[HIGH]`
- The rule that causes it — first SP = 4 EVs, then 8 — is exactly the kind of off-by-one that hand-math gets wrong. `[HIGH]`
- **At least six sites are ranking on this query with prose and none of them is a calculator**: champsdex.com, champdex.com, genpkm.com, switchbladegaming.com, gamecards.gg, game8.co (+ screenrant). A working tool beats six explainer articles on this intent. `[HIGH]`
- Cheapest possible build: `convertToChampionsSp` already exists in `src/lib/analysis/stat-calculator.ts` with budget constants, tests in `__tests__/stat-calculator.test.ts`, and is already trusted by five call-sites including `champions-legality.ts`. This is a UI wrapper over shipped, tested logic.
- Aligns with B2 — it makes an opaque number legible.

**Effort: S (~1 day).** Route + SSG page + thin client form + `HowTo`/`FAQPage` JSON-LD + sitemap. Zero new domain logic. Note `IMPROVEMENTS.md`/prior SEO runs already recommend standalone tool landing pages; this is the highest-demand instance of that pattern.

**Time sensitivity: HIGH.** Conversion confusion is a transition artefact. This is worth substantially less in six months.

---

## NEW #3 — Derived spread rationale ("why this spread") on every Pokémon

**What.** For each Pokémon in a report, auto-derive and display the benchmarks its spread actually hits, against a curated list of format threats: *"252 HP / 156 Def — survives Choice Specs {Threat} {Move} at full"*, *"Speed 156 — outspeeds max-Speed {Threat} by 1"*, *"Attack 236 — OHKOs 4 HP {Threat} after {condition}"*. Plus an honest **"no benchmark detected — this spread appears unoptimised"** where nothing lands, and a one-line surplus note ("12 SP unallocated"). Every line must show its derivation on tap.

**Evidence.**
- The single deepest community frustration is that spreads are opaque and unteachable (B2, `[HIGH]`, multiple independent sources).
- **MetaHaunter's entire market position** is "reasoning you can actually read and follow" + "no simulated data" — proof both that the demand exists and that generated-feeling output is distrusted. `[HIGH]`
- Speed is universally named the highest-leverage stat and beginners are told to *guess* at it. `[HIGH]`
- Smogon's own Team Bazaar rules mandate "a Poképaste **and a description on how your team works**" — the community norm already demands the why. `[HIGH]`
- OTS reasoning (B7) is the same skill in reverse — players infer investment from damage taken. This teaches it.
- Verified gap in code: no benchmark/survival/OHKO logic exists in `src/lib/analysis/` (only `detect-archetype`, `detect-regulation`, `item-boosts`, `stat-calculator`); no prose/notes field exists on the report types (`src/lib/types/analysis.ts`, `pokemon.ts`).

**Why this is the strategic one.** The product is called *Team Report*. Right now it reports **data** — stats, coverage charts, speed tiers, matchup sheets — and leaves the reader to infer meaning. Victory Road's reports carry meaning but need a human writer and editorial approval. This is the only opportunity on the list that no competitor can copy cheaply, and it is the one that makes the name true.

**NOT the same as VGC-38/79.** Those are an interactive damage calculator — the user asks a question and gets an answer. This is passive, automatic annotation of a spread the user already has, with no input. They **share a damage engine**, so sequence this after the calculator lands and reuse it; do not build the maths twice.

**Effort: L (~1–2 weeks).** Needs a damage formula (shared with VGC-38/79), a maintained per-regulation threat list, benchmark search + ranking (surface the 2–3 most meaningful, not fifty), Champions SP handling via `convertToChampionsSp`, i18n across the 8 existing locales, and vitest coverage per `CLAUDE.md` conventions.

**Constraint from B2/B8:** never present a benchmark you cannot show the derivation for. Tap-to-expand the calc. The distrust of "generated" analysis is real.

---

## NEW #4 — Community-facing Discord bot + rich in-chat unfurl

**What.** A public slash command — `/report <showdown paste | pokepaste url | crob.at url>` — that creates a report and replies with a rich embed (sprites, archetype, speed line, key threats) plus the link. Optionally: auto-embed when a `pokemonvgcteamreport.com/s/{id}` link is posted in a server the bot is in.

**Evidence.**
- **VGCPastes' Discord: ~14,784 members**, and Sandshrew Bot (`search` / `get rental` / `random team`, auto-complete, paginated, reroll-in-place) is how that community actually finds teams. `[HIGH]`
- The 2026 Sandshrew rewrite explicitly killed "annoying txt files" in favour of inline paging — the community's revealed preference is *stay in chat*. `[HIGH]`
- **Three Island** exists solely to preview and import paste links "without ever needing to leave chat," and supports crob.at as well as pokepast.es. `[HIGH]`
- `ShareModal` already has a dedicated **"Copy Discord message"** action (`handleCopyDiscord`) — we already know Discord is the destination; we're just handing users a string to paste manually instead of being in the room.
- Infrastructure is largely present: `src/lib/discord-bot.ts` is REST-only ("no gateway/websocket — works in serverless"), `src/app/api/bot/route.ts` exists, `DISCORD_BOT_TOKEN` is wired. Today it is **internal feedback ops only** — feedback embeds, threads, weekly summary. The community-facing half is unbuilt.

**Why it's leverage, not just a feature.** Every other opportunity here improves the product for people who already arrived. This one goes where the people are. It also sidesteps the 2-click problem entirely: in Discord, creating a report becomes *one* command.

**Effort: M (~3–5 days).** Interactions endpoint with Ed25519 signature verification, slash-command registration, deferred responses (report generation exceeds Discord's 3s window), embed builder, rate limiting (`src/lib/rate-limit.ts` exists), and an OAuth install flow. Serverless-compatible since it is REST + interactions, not gateway.

**Sequencing note:** pairs naturally with VGC-207 (anonymous quick-share) — a bot-created report has no logged-in user, so it needs the anonymous path to exist first.

---

## NEW #5 — Tournament submission pack (RK9-ordered checklist + TO-ready open list)

**What.** From an existing report, one action produces everything a player needs to register for an event:
1. an **RK9-ordered transcription view** — fields in RK9 Team List Creator's own order, one Pokémon at a time, large type, copy-per-field, tick-as-you-go, phone-first (you do this standing up, on a phone, at a deadline);
2. a **TO-ready open list artefact** — composition + form, ability, item, moves, and **Stat Alignment**, with spreads suppressed, matching what Victory Road-class organisers ask for;
3. a **pre-submission validation pass** — legality against `champions-legality.ts` (dex, ≤2 restricted, item/species clause, SP/EV budget), 4–6 selected, rental code present.

**Evidence.**
- 2026 season is **open team list**; entrants "are required to provide a legible and accurate list… before the deadline." `[HIGH]`
- Play! events submit through **RK9 Labs Team List Creator**; the flow is build-each-Pokémon then toggle 4–6 onto the battle team then submit. `[HIGH]`
- **Rental codes are required at most higher-level tournaments** — RK9 frames this as security/integrity and calls accurate rental provision "crucial." `[HIGH]`
- Penalty exposure: the list is "the source of truth… failure to produce a team in-game that matches… may result in penalties." `[HIGH]`
- Grassroots demands a parallel artefact: Victory Road requires a **VR Pastes Open Team List link** carrying form/ability/item/moves/Stat Alignment. `[HIGH]`
- Verified gap in code: `OTSSheetModal` renders a sheet and its only export is **`Save as PNG`** (`canvas.toDataURL` → `link.download = "ots-sheet…png"`). No RK9-ordered view, no spread-suppressed shareable link, no pre-submission legality check surfaced at that moment.

**Overlap disclosure — read carefully.** The *visibility mechanism* (public shell / hidden spreads) is **VGC-153, ALREADY-TICKETED**, and VR Pastes' dual-link model is the reference implementation. What I am proposing as NEW is the **TO-facing artefact and the transcription workflow on top of it** — RK9 field ordering, per-field copy, phone-first checklist ergonomics, rental-code slot, and legality validation at submission time. If VGC-153 is built, this is the feature that gives it a recurring reason to exist. If it is not, this still stands on the checklist alone.

**Why it matters.** Victory Road made its paste tool *mandatory input to its own circuit* and thereby bought guaranteed recurring usage. We cannot mandate anything — but we can be the thing players open **the night before every regional**, which is the same retention shape by other means. It is also the only opportunity here with a natural recurring trigger baked into the competitive calendar.

**Effort: M (~3–5 days).** Mostly UI + a print/PDF path (`PdfExport.tsx` exists) + reuse of `champions-legality.ts` and `OTSSheetModal`. Zero new analysis logic.

**Risk.** RK9 field ordering must be verified against the live tool before build — I could not open `player.rk9labs.com` (proxy-blocked), so ordering here is from support-doc summaries, not first-hand. **Verify before implementing.**

---

## Ranking (leverage = impact ÷ effort, and sequencing)

| # | Opportunity | Effort | Impact | Time-sensitive | Depends on |
|---|---|---|---|---|---|
| 1 | Per-species `/teams/[species]` SSG pages | M | Very high (compounding discovery) | No | VGC-232 (sprites) helps |
| 2 | Standalone EV⇄SP converter page | **S** | High (unowned query, zero new logic) | **Yes — decays** | none |
| 3 | Derived spread rationale | L | Very high (category-defining) | No | VGC-38/79 damage engine |
| 4 | Community Discord bot | M | High (distribution) | No | VGC-207 (anon share) |
| 5 | Tournament submission pack | M | Medium-high (recurring trigger) | Seasonal | partial VGC-153; verify RK9 |

**Suggested order:** #2 first (one day, decaying value, ships standalone). Then #1 (compounding, and the sooner it is indexed the sooner it compounds). Then #4 once VGC-207 lands. Then #5 before the next regional cluster. #3 last but treat it as the strategic north star — it is what makes "Team Report" mean something no competitor can copy.

---

## Appendix — verified gaps in our codebase (evidence for the above)

- `src/app/champions/[pokemon]/page.tsx` — `generateStaticParams()` returns `getRegMAMegasWithSprites()`. Per-species coverage is limited to Reg M-A Megas with confirmed Showdown sprites.
- `src/app/sitemap.ts` — static pages + Mega pages + `/s/{id}` (LIMIT 5000) + `/creator/{name}` (LIMIT 5000). No per-species URLs.
- `src/app/explore/page.tsx` — single `canonical: .../explore`; filters (`species`, `archetype`, `placement`, `hasRental`, `tournamentMode`, `regulation`, `excludeSpecies`, `followingOnly`) live in `ExploreFilters.tsx` client state → no indexable filter URLs.
- `src/lib/analysis/` — `detect-archetype.ts`, `detect-regulation.ts`, `item-boosts.ts`, `stat-calculator.ts`. **No damage/benchmark/survival logic.**
- `src/lib/types/analysis.ts`, `pokemon.ts` — no free-text notes/rationale field on the report model.
- `src/lib/analysis/stat-calculator.ts` — `convertToChampionsSp` present, tested, used by `PokemonCard`, `PokemonDetailSlide`, `SpeedTierChart`, `CompareContent`, `champions-legality.ts`. **Not exposed as a standalone tool.**
- `src/lib/discord-bot.ts` + `src/app/api/bot/route.ts` — REST-only, serverless-safe, but scoped to internal feedback/ops (`DISCORD_FEEDBACK_CHANNEL_ID`, weekly summary email). No public slash commands.
- `src/components/ui/OTSSheetModal.tsx` — sheet render + `Save as PNG` only. No RK9-ordered view, no spread-suppressed link.
- `src/components/ui/ShareModal.tsx` — already covers copy-link, copy-paste, **copy-Discord-message**, embed, rental code, `navigator.share`, PNG download, with `aria-live` copy announcements. Strong; the gap is upstream (clicks-to-first-share) and downstream (in-chat rendering), not here.
- `src/app/s/[id]/opengraph-image.tsx` — edge runtime, 1200×630, species→sprite slug map, fallback card. **The May "no link preview" gap is closed.**

---

## Sources

Competitors / tools
- [Pikalytics](https://www.pikalytics.com/) · [Champions hub](https://pikalytics.com/champions) · [Team Builder](https://www.pikalytics.com/team) · [Speed Tiers](https://www.pikalytics.com/speed-tiers) · [Top Teams](https://www.pikalytics.com/topteams) · [iOS reviews](https://apps.apple.com/us/app/pikalytics/id1511370166?see-all=reviews&platform=iphone)
- [PokePaste](https://pokepast.es/) · [felixphew/pokepaste](https://github.com/felixphew/pokepaste) · [Smogon: PokePaste thread](https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/) · [Smogon: Pokepaste image fix](https://www.smogon.com/forums/threads/pokepaste-image-fix.3733096/) · [Pokepastefix](https://chrome-stats.com/d/pokepastefix)
- [Three Island (Smogon)](https://www.smogon.com/forums/threads/three-island-an-extension-for-a-seamless-pokepaste-experience.3692887/) · [PartMan7/Three-Island](https://github.com/PartMan7/Three-Island)
- [crob.at](https://crob.at/) · [PokePaste alternative](https://crob.at/pokepaste-alternative) · [/pokepaste](https://crob.at/pokepaste) · [/teams](https://crob.at/teams) · [/teams/vgc](https://crob.at/teams/vgc) · [/teams/vgc/kommo-o](https://crob.at/teams/vgc/kommo-o) · [/teams/vgc/tornadus](https://crob.at/teams/vgc/tornadus) · [/teams/champions](https://crob.at/teams/champions)
- [VGCPastes on X](https://x.com/vgcpastes) · [Sandshrew Bot 2026 update](https://x.com/VGCPastes/status/2046352261128040528) · [Sandshrew Bot directory](https://discord.com/application-directory/964203274695745636) · [VGCPastes Discord](https://discord.com/invite/DkhP2HDJE7)
- [Trainer Hill](https://www.trainerhill.com/) · [Tools](https://www.trainerhill.com/tools) · [Tier List Builder](https://www.trainerhill.com/tools/tier-list) · [About](https://www.trainerhill.com/about)
- [Victory Road](https://victoryroad.pro/) · [Team Reports](https://victoryroad.pro/category/articles/reports/) · [SV Reports](https://victoryroad.pro/sv-reports/) · [SV Rental Teams](https://victoryroad.pro/sv-rental-teams/) · [Resources](https://victoryroad.pro/resources/) · [VR Pastes](https://www.vrpastes.com/) · [VR Pastes Champions update](https://x.com/VGCVictoryRoad/status/2044491201387122714)
- [Limitless VGC](https://limitlessvgc.com/) · [Teams](https://limitlessvgc.com/teams) · [VGC tournaments](https://play.limitlesstcg.com/tournaments/?game=VGC)
- New entrants: [VGC Trainer](https://vgctrainer.com/) · [VGC.tools builder](https://vgc.tools/builder) · [VGenC](https://www.vgenc.net/) · [VGenC top teams](https://vgenc.net/top-teams) · [MetaVGC](https://metavgc.com/) · [PokeStats](https://pokestats.cc/guides) · [PokeSynergy speed tiers](https://pokesynergy.app/speed-tiers) · [MetaHaunter (Smogon)](https://www.smogon.com/forums/threads/metahaunter-%E2%80%94-handmade-vgc-teambuilder-reg-m-a-free-no-simulated-data.3781357/) · [VGC Helper](https://vgchelper.com/) · [VGC Helper (App Store)](https://apps.apple.com/us/app/vgc-helper/id1598784937) · [PokeSuite (Smogon)](https://www.smogon.com/forums/threads/tool-pokesuite-a-team-generator-with-smogon-tiers-vgc-filters.3774427/)

Community sentiment
- [Smogon: VGC Team Bazaar](https://www.smogon.com/forums/threads/vgc-team-bazaar.3678459/) · [VGC Reg I Sample Teams](https://www.smogon.com/forums/threads/vgc-regulation-i-sample-teams.3766729/) · [Please help me review this VGC team](https://www.smogon.com/forums/threads/please-help-me-review-this-vgc-team.3713503/) · [Questions, VGC team building help/feedback](https://www.smogon.com/forums/threads/questions-vgc-team-building-help-feedback-and-stuff.3732546/) · [First time teambuilding](https://www.smogon.com/forums/threads/first-time-teambuilding-i-have-a-million-doubts-and-ideas-lol.3750919/)
- [VGC guide — How To Make Simple EV Spreads](https://www.vgcguide.com/eving-1-how-to-make-simple-ev-spreads) · [Complex EV Spreads](https://www.vgcguide.com/eving-3) · [Checking Everything](https://www.vgcguide.com/checking-everything) · [Aaron Traylor — Stress-free EV Spreads](https://attraylor.medium.com/a-beginners-guide-to-stress-free-ev-spreads-8493186f651) · [SI — What is Speed Control](https://www.si.com/esports/pokemon/what-is-speed-control-vgc)
- Champions SP: [ScreenRant](https://screenrant.com/pokemon-champions-ev-iv-explanation-info/) · [genpkm](https://genpkm.com/blog/pokemon-champions-no-ivs-stat-points-competitive-guide-2026) · [Switchblade](https://www.switchbladegaming.com/pokemon-champions/sp-system-explained/) · [ChampsDex](https://champsdex.com/posts/pokemon-champions-ev-iv-stats-guide-2026/) · [ChampDex](https://champdex.com/guides/stat-points) · [GameCards](https://www.gamecards.gg/guides/pokemon-champions-stat-points-ranked-battles-guide) · [Game8](https://game8.co/games/Pokemon-Champions/archives/538683)
- OTS: [Pokémon Forums — Open vs Closed teamsheets](https://community.pokemon.com/en-us/discussion/15575/do-you-prefer-open-or-closed-teamsheets) · [VGC OTS extension](https://chromewebstore.google.com/detail/vgc-ots/codeajknmgnkbobmhjeenehcmfhmegkf)
- Tournament submission: [Play! Pokémon VGC Tournament Handbook (PDF)](https://www.pokemon.com/static-assets/content-assets/cms2/pdf/play-pokemon/rules/play-pokemon-vgc-tournament-handbook-en.pdf) · [RK9 Team List Creator](https://player.rk9labs.com/teamlist/) · [RK9 support — Submitting your VGC Team List](https://support.rk9labs.com/support/solutions/articles/43000630334-creating-saving-and-submitting-your-vgc-team-list)
- Rentals context: [ESPN — rental teams make competitive Pokémon more accessible](https://www.espn.com/esports/story/_/id/28372771/rental-teams-make-competitive-pokemon-sword-shield-play-more-accessible-ever)

Internal (prior swarm runs, May 2026)
- `.swarm/r3-community-sentiment-20-05-26.md` · `.swarm/r4-twitter-vgc-sentiment.md` · `.swarm/r1-r2-competitor-teardown-20-05-26.md` · `.swarm/research-synthesis-26-05-26.md`
