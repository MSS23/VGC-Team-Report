# R1 — Competitor Teardown: Pikalytics & PokePaste

**Date:** 2026-09-07
**Agent:** R1 (read-only competitor research)
**Method:** `WebSearch` only. **`WebFetch` is egress-blocked for `www.pikalytics.com` and `pokepast.es`** in this container (`EGRESS_BLOCKED` from the proxy), so no page was fetched directly — every competitor claim below comes from indexed search results, App Store/GitHub listings, and third-party comparison pages. Repo claims are first-hand (read-only inspection of `src/`).
**Prior art read:** `.swarm/r1-competitors-pikalytics-pokepaste.md` (2026-05-28) and `.swarm/r1-r2-competitor-teardown-20-05-26.md`. Those two cover the feature inventories thoroughly and are still broadly accurate; this report deliberately does **not** restate them. Everything here is tagged **NEW** or **KNOWN** so the orchestrator can skip duplicates.

---

## 0. Executive delta since the May teardown

Three things changed that matter:

1. **The repo shipped nearly all of the May report's P0/P1 list.** PokePaste import (`src/app/api/pokepaste/route.ts`), OG social cards (`src/app/s/[id]/opengraph-image.tsx`), embed widget + oEmbed (`src/app/embed/[id]/page.tsx`, `src/app/api/oembed/route.ts`), creator profiles + follow (`src/app/creator/[name]/`, `src/components/social/`), anonymous no-account sharing, PWA with `share_target`. **Do not re-file those tickets.** The May report's "Feature Priority Matrix" is now mostly historical.
2. **Pikalytics has fragmented its Pokédex into per-datasource URL namespaces** and added event landing pages — a bigger SEO surface than in May.
3. **A second wave of Champions-era competitors appeared** (PokeSynergy, ChampTeams.gg, PikaChampions, crob.at) and at least one of them is attacking VGC Team Report's *exact* positioning ("usage data → reasons, not tables") while running comparison-page SEO.

---

## 1. Pikalytics — September 2026 state

### 1.1 What is confirmed unchanged (KNOWN — see May teardown for detail)
Per-Pokémon usage/winrate/moves/items/abilities/spreads/teammates; team builder with meta-suggested sets; standalone `/calc`; `/speed-tiers`; Top Teams; quizzes (Speed/Calc/Type); articles; 8 languages; Ko-fi membership monetisation; no display ads; no accounts, no community layer.

### 1.2 NEW findings

| Finding | Detail | Why it matters |
|---|---|---|
| **Pokédex split by data source** (NEW) | Distinct indexed namespaces observed: `/pokedex/battledataregmbs3/<Pokemon>` (ladder battle data, season 3), `/pokedex/championstournaments/<Pokemon>` (tournament-sourced), `/pokedex/homebsd` (HOME BSS). Each is a full Pokémon × format matrix. | They now rank for *both* "ladder usage" and "tournament usage" long-tails per species. Their indexed page count is roughly species × datasource, i.e. thousands. |
| **Event landing pages** (NEW) | `/worlds-2026` ("Best VGC Teams, Builds & Tournament Results") and `/champions-mobile` ("Pokemon Champions Mobile — Release Date, Best Teams & Builds"). | `/champions-mobile` is pure keyword land-grab on a *game release* query, not a stats query. They are farming intent well outside their data product. |
| **`/tournaments` hub with completed-event data** (NEW) | Lists completed tournament winners, winning teams, player counts, and published team lists ordered by placement, each event page showing usage %, moves, items, abilities, teammates. | This is a direct overlap with our `/tournaments` and `/explore`, and theirs is data-backed and current. Ours is not (see §3.2). |
| **`cdn.pikalytics.com` mirror is indexed** (NEW) | `cdn.pikalytics.com/pokedex` and `cdn.pikalytics.com/team/` appear in results alongside the apex domain. | Minor: they are leaking duplicate-content surface. Not exploitable by us, but confirms their SEO is volume-driven, not hygiene-driven. |
| **Android app has been dead since 2024-08-27** (NEW / corrects prior report) | The Play Store listing was unpublished 2024-08-27. iOS `Pikalytics: Battle Strategy` (id1511370166, $0.99 one-time, dev Griffin Ledingham) is still live. The May report and the 2026-05-28 report both described a live "iOS/Android offline app" — that is wrong for Android. | **Their offline/tournament-floor story only covers iOS, and only for paying users.** Our PWA (`public/manifest.json`, `public/sw.js` with `SHARE_CACHE`/`API_CACHE`) already installs free on Android. This is a positioning wedge nobody has used. |
| **SP terminology is in their copy** (NEW) | Their Champions pages describe "66 SP total, cap 32 per stat" and label spreads as "EV stat point spreads" (a hedge phrase mixing both vocabularies). | They are semantically muddy on SP vs EV. Our `/tools/ev-to-sp` converter and `convertToChampionsSp` are precise. A precision-first content angle is defensible. |

### 1.3 Share / team-sharing UX
Unchanged from May: copy Showdown export, share Pikalytics URL, share image, import from Showdown, export to Showdown, **generate a pokepast.es link**. Note the last one — Pikalytics treats PokePaste as the terminal share format. Any tool that wants to be in that chain must be paste-compatible in both directions (we are, inbound; we do not create pokepastes outbound — see §4.5).

### 1.4 Mobile
Web is responsive and dense; iOS app is paid and reviewers note it lags the website; Android is gone. No PWA. **Their mobile weakness is now structural, not cosmetic.**

### 1.5 Monetisation
Ko-fi memberships + $0.99 iOS app + a footer "advertise on Pikalytics" link implying partner deals. No paywalled web feature. Unchanged (KNOWN).

### 1.6 What Pikalytics genuinely does better than a paste-to-report tool
1. **Aggregated authority.** Usage % and winrate per species per format, from real ladder + tournament volume. We have `src/app/api/champions/meta/route.ts`, but it aggregates *only our own public shares* with `MIN_REPORTS = 5` and `TOP_N = 20` — a self-referential sample, not a meta.
2. **The closed loop.** Pokédex → team builder → inline calc → adjust → re-check, without leaving the site. Our equivalent (`src/components/report/CalcInput.tsx`) is a **manual text field**: the user pastes calc lines they computed elsewhere. There is no calc engine in the tree (`@smogon/calc` is not in `package.json`).
3. **Indexed breadth.** Thousands of species × format × datasource pages vs our 72 Mega landing pages (`getRegMBMegasWithSprites()` in `src/app/sitemap.ts`).
4. **Daily-return loops.** Streak-based quizzes. We have no habit surface at all.
5. **Multilingual reach.** 8 languages indexed. We have `src/lib/i18n/` but the SEO surface is English-only.

---

## 2. PokePaste — September 2026 state

### 2.1 KNOWN (unchanged)
Go v3 rewrite; cryptographic URL mapping so pastes are private-by-link; syntax highlighting by type; sprites + item art; title/author/notes; no accounts; no expiry; no browse/search; no ads, no donations; VGC-correct level-50 default; ~155 open issues and maintenance in visible decline.

### 2.2 NEW findings

| Finding | Detail | Why it matters |
|---|---|---|
| **A PokePaste MCP server exists** (NEW) | Third-party MCP server exposing a single `create_pokepaste` tool that takes structured set data (title, author, notes, sets) and returns a live `pokepast.es` URL. Documented and listed in MCP directories with 2026 guides. | **AI agents can now produce a pokepaste but cannot produce a VGC Team Report.** When a player asks an assistant to "build me a Reg M-B team and give me a link", the default output format becomes a pokepaste. This is a distribution channel we are absent from, and it is cheap to enter — `POST /api/share` already exists. |
| **Sprite bugs are being patched by a third party, not upstream** (NEW) | The `pokepastefix` Chrome extension shipped v1.2.0 in May 2026, switching the image API from `chiy.uk` to `pokeapi.co` to restore broken sprites and enable shiny/gen-specific art. | Upstream still has not fixed its own images; the community is routing around it. "Every sprite renders, including Megas and regional forms" is a demonstrable quality wedge for us — we already have `src/app/api/sprite/route.ts` and `src/lib/utils/sprite-slug.ts`. |
| **crob.at is positioning explicitly as the PokePaste replacement** (NEW-ish; crob.at was named in May but not as a *substitute*) | Runs `/pokepaste` and `/pokepaste-alternative` landing pages selling: sprites, social preview images, multi-team support, a public gallery, Reg M-B support, and explicitly "a backup for when pokepast.es is slow or unavailable". | This is the same wedge we hold (pretty + previews + discovery), executed as dedicated SEO landing pages. They are winning the comparison query. |
| **PokePaste's privacy model is a *feature* for pre-tournament secrecy** (NEW framing) | URL-only discovery is deliberate — no author browse, no search. Players share teams pre-event without exposing them. | Our `/explore` + creator profiles + sitemap of `/s/[id]` is the opposite default. We do have unlisted visibility (`isUnlisted` in `ShareModal.tsx`) — but the *messaging* around it does not claim the operational-security benefit PokePaste is trusted for. |

### 2.3 Share UX
Still the fastest in the ecosystem: paste → optional title/notes → submit → permanent URL, ~10 seconds, no account, no decisions. **This remains the benchmark our time-to-share must be measured against.** Weaknesses persist: no rich preview card on Discord/Twitter, notes URLs not clickable, emoji-in-nickname errors.

### 2.4 Mobile
Standards-compliant, mobile-friendly HTML, no app, no offline. Fast because it is nearly nothing. There is no mobile *experience* to beat — only a speed number.

### 2.5 Monetisation
None. No ads, no donations, no subscription. Pure hobby infrastructure with a real sustainability risk.

### 2.6 What PokePaste genuinely does better
1. **Time-to-share.** ~10s, zero decisions. Any friction we add (naming, tags, visibility choice, account nudge) is measured against this.
2. **Format hegemony.** "Send me a pokepaste" is the language. Pikalytics, Showdown, Limitless, and tournament staff all speak it.
3. **Trust through absence.** No accounts, no tracking, open source, permanent links, private-by-link.
4. **Being in the chain.** Other tools *emit* pokepastes. Nobody emits a VGC Team Report.

---

## 3. Repo grounding (read-only; verified this session)

### 3.1 Already built — do not re-file
- PokePaste URL import + proxy: `src/app/api/pokepaste/route.ts`, `src/lib/utils/pokepaste.ts`, wired into `src/components/input/PasteInput.tsx` (also accepts rental codes and replay URLs).
- Rich OG cards with team sprites: `src/app/s/[id]/opengraph-image.tsx` (+ `/explore`, `/champions`, `/champions/[pokemon]`).
- Embed widget + oEmbed discovery: `src/app/embed/[id]/page.tsx`, `src/app/api/oembed/route.ts`.
- Social/creator layer: comments, reactions, follows, notifications, collaborators, version history, fork, changelog (`src/components/social/`, `src/app/api/*`).
- PWA: `public/manifest.json` with five shortcuts and a **`share_target`** (`/?paste=`), `public/sw.js` (`vgc-team-report-v25`, share + API caches, offline HTML).
- Export surfaces: `TeamCardExport.tsx`, `PdfExport.tsx`, `api/team-graphic/route.tsx`, `OTSSheetModal.tsx`, QR (`qrcode` dep).
- `/tools/ev-to-sp` converter, `/compare` (deliberately noindex), `/champions/[pokemon]` × 72 Megas, `llms.txt` / `llms-full.txt`.

### 3.2 Verified gaps that map to competitor strengths
| Gap | Evidence in repo |
|---|---|
| **No damage-calc engine.** | `src/components/report/CalcInput.tsx` + `src/hooks/useDamageCalcs.ts` store user-typed calc strings and auto-classify them by regex into offensive/defensive/speed. No `@smogon/calc` in `package.json`. |
| **Species filtering is SEO-invisible.** | `/explore` filters species client-side via `src/hooks/useExploreUrlSync.ts`; `src/app/explore/page.tsx` pins `alternates.canonical` to bare `/explore`. So `?species=Incineroar` never ranks. Meanwhile Pikalytics has an indexed page per species per datasource. |
| **`/tournaments` is a hardcoded, now-stale array.** | `src/app/tournaments/TournamentsContent.tsx` `TOURNAMENTS[]` is all **2025** events with hand-typed `reportCount` values. `src/app/tournaments/page.tsx` `UPCOMING_TOURNAMENTS[]` still advertises Indianapolis Regionals (2026-05-29) and Worlds (2026-08-14) as upcoming — **both are in the past as of today, 2026-09-07**, and they are emitted as `SportsEventJsonLd`. Stale structured data on an indexed, sitemapped page. |
| **`llms.txt` is stale.** | `public/llms.txt` header reads `Updated: 2026-05-23` and describes Champions support as "Regulation M-A" only; the live format is M-B. (The separate SP-definition error in this file is already ticketed — see `.swarm/new-tickets-10-08-26.md` item 1.) |
| **No `/vs/*` comparison pages.** | No such route exists. PokeSynergy ships `pokesynergy.app/vs/pikalytics`; crob.at ships `/pokepaste-alternative`. |
| **No machine-facing creation surface.** | `POST /api/share` exists but is undocumented for third parties; no MCP server, no public API docs page. `llms.txt` documents URLs, not a write API. |
| **Slug logic duplicated.** | `src/app/s/[id]/opengraph-image.tsx` inlines its own `SLUG_MAP` + `toSpriteSlug`, while `src/lib/utils/sprite-slug.ts` is the stated single source of truth (used by `embed/[id]/page.tsx`). Divergence risk on exactly the sprite-correctness wedge we would market. |

### 3.3 New third-wave competitors worth watching (NEW)
- **PokeSynergy** (`pokesynergy.app`) — runs `/vs/pikalytics`; pitch is "turns usage data into reasons, threats, team checks and guides instead of only showing tables". **That is our positioning, stated better, on a comparison page that ranks.** Highest-signal competitive threat in this report.
- **ChampTeams.gg** — Reg M-B team builder + damage calculator.
- **PikaChampions** (`pikachampions.com`) — free Champions doubles planner.
- **crob.at** — visual paste sharing, gallery, social previews, explicit PokePaste-downtime backup.
- **VGC Helper** (`vgchelper.com`), **My Pokemon Team** (`mypokemonteam.com`) — adjacent builders.

---

## 4. Opportunities — concrete, sized, surface-bound

Sizing: **S** = one surface, hours. **M** = new route or data path, ~1 day. **L** = new subsystem or ongoing data pipeline.

### 4.1 Refresh `/tournaments` and stop shipping past events as upcoming — **S** — NEW
**Surface:** `src/app/tournaments/page.tsx` (`UPCOMING_TOURNAMENTS`), `src/app/tournaments/TournamentsContent.tsx` (`TOURNAMENTS`).
Both arrays are hand-maintained and expired. Minimum fix: drop past events from `UPCOMING_TOURNAMENTS` (or filter by `startDate >= today` at render), add the 2026-27 season events, and add 2026 entries to `TOURNAMENTS`. Better fix (**M**): derive `reportCount` and `topPokemon` from the `shares` table by `tags.tournamentName`, the way `api/champions/meta` already aggregates — so the page can never go stale again. This is a credibility bug on an indexed page that also emits `SportsEventJsonLd` for events that already happened.

### 4.2 `/vs/pokepaste` and `/vs/pikalytics` comparison pages — **S** — NEW
**Surface:** new static routes under `src/app/vs/[competitor]/page.tsx` + `sitemap.ts` entries.
PokeSynergy and crob.at are both winning "X alternative" queries today. These are the highest-intent queries in the category and we currently rank for none of them. Content writes itself from §1.6/§2.6 and is honest: we import pokepastes, we render sprites that PokePaste breaks, we add matchup plans Pikalytics does not have. Two static pages, existing page shell, no new data.

### 4.3 Indexable species pages `/teams/[species]` — **L** (or **M** scoped to top ~40) — KNOWN (re-affirmed, now much cheaper)
**Surface:** new `src/app/teams/[species]/page.tsx`, reusing the `/champions/[pokemon]` template and the `api/explore` query; add to `src/app/sitemap.ts`.
Prior reports filed this as "usage stats on Pokemon pages" (P2). Two things changed: (a) the `/champions/[pokemon]` SSG template + `opengraph-image` already exist to copy, and (b) `api/champions/meta` already does in-DB species aggregation, so the data layer is largely written. Content per page: reports featuring this species, its common spreads *as authored by real players with justifications*, speed tier context. Do **not** try to match Pikalytics' usage-percentage claim — we do not have the sample. Match on "reports that explain this Pokémon", which they structurally cannot produce.

### 4.4 In-report damage calculator — **M/L** — KNOWN
**Surface:** `src/components/report/CalcInput.tsx`, `src/hooks/useDamageCalcs.ts`, `src/lib/analysis/`.
Prior teardowns already named Pikalytics' inline Meta Calcs as their #1 advantage. What is new is the verified shape of the gap: we have no engine at all, only a text box with regex classification. The minimum-viable version is **M**: a "compute this" affordance that takes the team's *own* parsed spreads (`stat-calculator.ts` already produces final stats, SP-aware) against a small set of meta defenders, and writes a formatted calc string into the existing `CalcEntry` store — no UI rebuild, no new persistence, and it degrades to today's manual entry. Full `@smogon/calc` integration with field conditions is **L** and needs a bundle-size decision (see prior C3 perf reports).

### 4.5 Be emittable by machines: documented `POST /api/share` + an MCP server — **S** (docs) / **M** (MCP) — NEW
**Surface:** `src/app/api/share/route.ts` (exists), a new `/docs/api` page, `public/llms.txt`.
A `create_pokepaste` MCP tool already exists and is being written up in 2026 AI-tooling guides; PokePaste is becoming the default machine-generated share format. We should be the richer alternative: document the create endpoint, then ship a thin MCP wrapper (`create_team_report` → returns `/s/[id]`). Also worth adding an outbound "Create a PokePaste from this report" action in `ShareModal.tsx` — Pikalytics does this, and being *in* the pokepaste chain costs us nothing while making us the upstream authoring tool.

### 4.6 Own "free, installable, works offline at the venue" — **S** — NEW positioning on existing tech
**Surface:** `public/manifest.json`, `public/sw.js`, `src/components/ui/InstallPrompt.tsx`, `OTSSheetModal.tsx`, plus a marketing line on `/` and `/faq`.
Pikalytics' Android app has been unpublished since 2024-08-27 and its iOS app is a paid $0.99 download that reviewers say lags the website. PokePaste has no app. **We already ship a free installable PWA with a share target and share/API caches.** The gap is that nothing says so. Concretely: precache the signed-in user's own saved reports (`api/user/reports`) so a report and its OTS sheet open between rounds with no signal, and say "install free, works offline" where competitors say "$0.99" or nothing.

### 4.7 Sprite-correctness as a marketed wedge + de-duplicate the slug map — **S** — NEW
**Surface:** `src/app/s/[id]/opengraph-image.tsx` (inline `SLUG_MAP`), `src/lib/utils/sprite-slug.ts`, `src/app/api/sprite/route.ts`.
PokePaste's sprite bugs are severe enough that a Chrome extension (`pokepastefix` v1.2.0, May 2026) exists purely to repoint its images at `pokeapi.co`. Correct Mega/regional/paradox sprites is a visible quality difference. Prerequisite: collapse the duplicated `SLUG_MAP` in the OG route onto the canonical `resolveSlug` so the claim stays true across surfaces. (Flagged as a correctness risk, not a refactor request — the OG route is the one surface where a wrong slug is what people see on Discord.)

### 4.8 Message unlisted mode as pre-tournament operational security — **S** — NEW
**Surface:** `src/components/ui/ShareModal.tsx` (`isUnlisted` copy), `/faq`.
PokePaste is trusted for pre-event secrecy because it has no browse or author search. We support unlisted but frame it as a lesser public. Reframing it ("share with your testing group; not in Explore, not in the sitemap, not on your creator page") removes a real objection from serious players who currently default to PokePaste before an event and never come back.

### 4.9 A daily habit surface — **L** — KNOWN (deprioritise)
Pikalytics' Speed/Calc/Type quizzes create daily returns. Prior reports rated this P3. Nothing has changed to raise it; it is the largest build here with the least defensibility. Listed for completeness — recommend **not** filing this run.

---

## 5. Positioning summary

Unchanged and still correct: PokePaste is *"here is my team"*, Pikalytics is *"here is the meta"*, we are *"here is my team and why it works"*.

The new risk is that **PokeSynergy has started saying that sentence out loud on a comparison page that ranks**, while our own differentiators (sprites, offline PWA, unlisted sharing, embeds) are shipped but unmarketed, and two of our indexed pages (`/tournaments`, `/llms.txt`) advertise 2025 and Reg M-A in September 2026. The cheapest wins in this report are not features — they are §4.1, §4.2, §4.6 and §4.8, all **S**, all on surfaces that already exist.

---

## 6. NEW vs KNOWN index (for ticket triage)

| # | Item | Size | Status |
|---|---|---|---|
| 4.1 | `/tournaments` stale hardcoded data; past events in `UPCOMING_TOURNAMENTS` + JSON-LD | S (M for DB-driven) | **NEW** |
| 4.2 | `/vs/pokepaste`, `/vs/pikalytics` comparison pages | S | **NEW** |
| 4.3 | Indexable `/teams/[species]` pages | L (M scoped) | KNOWN (re-affirmed, cheaper now) |
| 4.4 | In-report damage calculator | M/L | KNOWN |
| 4.5 | Documented create API + MCP server; outbound PokePaste export | S/M | **NEW** |
| 4.6 | Market the free offline PWA; precache own reports | S | **NEW** (Android-app-dead fact is new) |
| 4.7 | Sprite wedge + de-dupe `SLUG_MAP` in OG route | S | **NEW** |
| 4.8 | Unlisted-mode = pre-event opsec messaging | S | **NEW** |
| 4.9 | Quizzes / habit loop | L | KNOWN — recommend not filing |
| — | `llms.txt` stale (`Updated: 2026-05-23`, Reg M-A only) | S | KNOWN (SP-definition ticket already filed 10-08); **M-B staleness is NEW** |
| — | PokeSynergy / ChampTeams / PikaChampions as new entrants | — | **NEW** (intel only) |
| — | Pikalytics feature inventory, monetisation, PokePaste core behaviour | — | KNOWN (see May teardown) |

---

## Sources

- [Pikalytics](https://www.pikalytics.com/) · [Team Builder](https://www.pikalytics.com/team) · [Tournaments](https://www.pikalytics.com/tournaments) · [Worlds 2026](https://www.pikalytics.com/worlds-2026) · [Champions Mobile](https://www.pikalytics.com/champions-mobile)
- [Pikalytics Pokédex — Champions tournaments](https://www.pikalytics.com/pokedex/championstournaments) · [Reg M-B battle data](https://www.pikalytics.com/pokedex/battledataregmbs3/Pikachu) · [HOME BSS](https://www.pikalytics.com/pokedex/homebsd)
- [Pikalytics: Battle Strategy — App Store](https://apps.apple.com/us/app/pikalytics-battle-strategy/id1511370166) · [AppBrain listing (Android unpublished 2024-08-27)](https://www.appbrain.com/app/pikalytics-battle-strategy/com.pikalytics) · [Ko-fi](https://ko-fi.com/pikalytics)
- [PokePaste](https://pokepast.es/) · [felixphew/pokepaste on GitHub](https://github.com/felixphew/pokepaste) · [Smogon announcement thread](https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/)
- [pokepastefix Chrome extension](https://chromewebstore.google.com/detail/pokepastefix/ekceaboabpgkgbpigacngnjagcdhdkmn) · [chrome-stats v1.2.0 changelog](https://chrome-stats.com/d/ekceaboabpgkgbpigacngnjagcdhdkmn)
- [PokePaste MCP server](https://mcp.directory/servers/pokepaste) · [PokePaste MCP guide (2026)](https://mcp.directory/blog/pokepaste-mcp-complete-guide-2026) · [create_pokepaste tool](https://glama.ai/mcp/servers/jpbullalayao/pokemon-paste-mcp/tools/create_pokepaste)
- [crob.at](https://crob.at/) · [crob.at PokePaste importer](https://crob.at/pokepaste) · [crob.at PokePaste alternative](https://crob.at/pokepaste-alternative)
- [PokeSynergy vs Pikalytics](https://pokesynergy.app/vs/pikalytics) · [ChampTeams.gg](https://champteams.gg/landing) · [PikaChampions](https://pikachampions.com/) · [VGC Helper](https://vgchelper.com/) · [My Pokemon Team](https://mypokemonteam.com/)
