# Competitor Teardown — Pikalytics & PokePaste

**Researcher:** R1 (Trend Researcher) · **Date:** 2026-09-14 · **Scope:** read-only, no outbound sending.

**Method note:** `pokemonvgcteamreport.com` and `vgc-team-report.vercel.app` were unreachable from this container (egress policy) — no conclusion about site health should be drawn. `pikalytics.com`, `pokepast.es`, `apps.apple.com` and `smogon.com` are likewise egress-blocked, so competitor detail comes from WebSearch result summaries, the open-source PokePaste repo (`felixphew/pokepaste`, fetchable), and third-party write-ups. PostHog was unavailable; no analytics figures are asserted here.

---

## 0. Format-currency gap (flag — verified)

Regulation Set **M-C** went live in Pokémon Champions on **Tuesday 8 Sept 2026** (runs to 1 Dec 2026), per pokemon.com's own announcement, Bulbapedia, Victory Road and MetaVGC. It is purely additive over M-B: ~36 new Pokémon plus six new Megas — **Mega Salamence, Mega Golisopod, Mega Baxcalibur**, and the first-ever **Z-Megas (Absol, Garchomp, Lucario)**.

We are six days into M-C and the repo has no concept of it:

| Evidence | File |
|---|---|
| `REGULATIONS` list ends at `"Reg M-B"` — M-C is untaggable, users must pick `"Custom"` | `src/lib/data/tags.ts:8-11` |
| `isChampionsFormat()` returns `false` for `"Reg M-C"` ⇒ a M-C report silently loses SP budgets, Mega handling, IV-lock and Tera-suppression and is rendered as a legacy EV team | `src/lib/data/tags.ts:23` |
| Legality engine only knows two Champions regs | `src/lib/validation/champions-legality.ts:138-145` |
| Speed-tier meta list branches on `"Reg M-B"` vs M-A only | `src/components/report/SpeedTierChart.tsx:156` |
| Sitemap comment asserts "Reg M-B is the current Champions regulation" | `src/app/sitemap.ts:31-33` |
| No Salamence / Golisopod / Baxcalibur / Z-Mega entries; `CHAMPIONS_REG_MB_ONLY_MEGAS` is the newest tier | `src/lib/data/mega-pokemon.ts:828-833` |
| Dex header comment still explicitly lists Salamence, Metagross, Mawile as *not* legal (true in M-A, wrong twice over by M-C) | `src/lib/data/champions-dex.ts:15` |
| `CLAUDE.md` product line claims "Reg M-A/M-B" support | `CLAUDE.md` |
| The only M-C string anywhere is a test comment anticipating the rotation | `src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts:25` |

Pikalytics, by contrast, ships M-C in its site title (`Pokemon Champions VGC 2026 Reg M-C…`) **and** has already pushed an app update covering the new Pokémon "including Mega Salamence, Mega Golisopod, Mega Baxcalibur, and new Z Megas for Absol, Garchomp, and Lucario." They were current on day one; we are not. For a format-dated product this is the single most damaging gap in this report — every M-C paste a user drops in today is mis-rendered, not merely unlabelled.

---

## 1. Features

### Pikalytics (pikalytics.com)
A data company that grew a builder, not a builder that bolted on data.

- **Usage stats / Pokédex** — per-Pokémon pages segmented by format: `/pokedex/{format}/{Pokemon}` (e.g. `/pokedex/championstournaments/Pikachu`, `/pokedex/homebsd/Vikavolt`). Usage %, win rate, top moves, abilities, items, natures, EV/SP spreads, and **teammate co-occurrence** ("who is paired with whom"), sourced from thousands of ranked ladder battles *and* tournament results.
- **Team Builder** (`/team`, plus `/team/{format}` for VGC Reg Sets, BSS, Smogon OU/Ubers, National Dex, BDSP, Isle) — drafts a team with usage-derived suggested moves/items/abilities/natures/spreads inline.
- **Damage calculator** (`/calc`) — Champions-aware: Stat-Point investment, weather, terrain, Intimidate, spread reduction, Mega options.
- **Speed tiers** — compare your team against current meta benchmarks.
- **Top Teams gallery** — real tournament teams ordered by placement, with records and event rankings, copyable.
- **Native apps** (iOS + Android, one-time paid, ~$0.99) — an **offline** ranking Pokédex with favourites; explicitly ad-free.

### PokePaste (pokepast.es)
Deliberately one feature, executed perfectly: a Showdown-syntax pastebin.

- Paste in, get a URL out. No account, no expiry, no ads.
- Syntax highlighting keyed to typing — species by primary type, moves by move type, items by association — plus sprite/item art previews.
- Optional metadata: `title`, `author`, `notes` (that's the entire schema).
- Machine-readable: `/{id}/raw` and `/{id}/json`, both served with `Access-Control-Allow-Origin: *` — which is *why* it became the ecosystem's interchange format. Every tool (including ours) can read it from the browser with no proxy.
- Go + MySQL, BSD-3, ~124★ / 27 forks; v3 branch. IDs are 16 hex chars derived cryptographically (legacy numeric IDs still resolve).
- **Immutable by design** — `server.go` exposes only `GET /:id`, `/:id/raw`, `/:id/json`, `POST /create`. No edit, no delete. Anonymity is intentional.

### Us (for grounding)
We are neither of those: we are a *narrative report* layer. `src/components/report/` gives matchup plans, common modes, per-mon notes, calcs, speed tiers, defensive/offensive coverage, tournament mode, OTS sheets, PDF/team-card export — plus a social layer (`src/components/social/`: comments, reactions, follows, collaborators, version history) that neither competitor attempts. Our differentiation is real; our *data* and *format currency* are the soft spots.

---

## 2. Share UX / view flow

### Pikalytics
The builder toolbar is the whole story: **Copy Team · Share Link · Share Image · New Team · My Teams · Import Showdown · Export Showdown · Share Pokepaste**. Notable choices:

- Teams save to **browser local storage** by default ("My Teams") — zero-friction, no account, nothing to sign up for.
- **Share Image** is first-class, sitting beside Share Link. VGC discourse happens as images in Discord and on X; Pikalytics treats the PNG as a primary output, not an afterthought.
- They **export to PokePaste** rather than fighting it — deliberately feeding the ecosystem's lingua franca.

### PokePaste
Create → immutable URL → recipient sees a fully server-rendered page. That's it. Because the page is static HTML with no client hydration step, it renders instantly on a phone on venue wifi, previews correctly in Discord/X unfurls, and is trivially scrapeable by every downstream tool. Immutability is a *feature* for teamsheet integrity: the link you sent is the team you brought.

### Us — where the flow leaks
- Share creation itself is good: anonymous shares are allowed (`auth()` is optional in `src/app/api/share/route.ts:119`), and `ShareModal` (`src/components/ui/ShareModal.tsx`) already covers copy-link, Discord-formatted message, X/Twitter intent with `#PokemonChampions #VGC2026`, iframe embed snippet, copy-paste, and rental code — a richer share surface than either competitor.
- **But the view flow is the weak link.** `/s/[id]` server-renders only `<head>` (metadata + JSON-LD) and then hands off to `ShareRedirectClient`, which `router.replace()`s to `/?s=<id>` — the body is a spinner and an `sr-only` `<h1>` (`src/app/s/[id]/redirect.tsx:9-24`, `src/app/s/[id]/page.tsx` tail). Consequences: (a) a viewer on a slow phone sees "Loading shared team…" where PokePaste would already be readable; (b) the URL they land on and might re-copy is a homepage query-param variant, not the clean `/s/<id>`; (c) the actual report content is never in the initial HTML.
- We have **no share-image export in `ShareModal`**. `TeamCardExport.tsx` and `PdfExport.tsx` exist elsewhere in `src/components/ui/`, but the modal a user opens when they press Share offers no PNG. Pikalytics puts it one click from the builder.
- We proxy PokePaste in (`src/app/api/pokepaste/route.ts`, both fetch and create) — good — but we expose no `/raw` or `/json` of our own, so nothing in the ecosystem can consume a VGC Team Report the way everything consumes a PokePaste.

---

## 3. Monetization

| | Pikalytics | PokePaste | Us |
|---|---|---|---|
| Web ads | None — explicitly ad-free | None | None |
| Paywall | None; builder, usage data and suggested sets are all free | None | None |
| Voluntary | **Ko-fi** (ko-fi.com/pikalytics), framed as server/dev costs | — | Stripe donations (`src/app/support/page.tsx:79-119`), explicitly "does not unlock product access" |
| Paid product | **Paid native app** (~$0.99 one-time, iOS + Android, offline, ad-free) | — | — |
| Scale | ~231–247K monthly visits; ~11:43 avg session (SEMrush/HypeStat, late-2025 snapshots) | Not measured here; ubiquitous by convention | — |

Read: neither competitor monetizes the web product. Pikalytics' only real revenue is a $0.99 app whose value prop is *offline + ad-free*, and the ~11-minute average session says the data pages are a workbench, not a drive-by. There is no pricing pressure on us — but also no evidence anyone in this niche pays for web tooling. Our `support/page.tsx` already gestures at "future paid reports with creator payouts," which is a differentiated angle neither competitor occupies.

---

## 4. What each does better than us

**Pikalytics**

1. **Real data.** Their numbers come from thousands of ladder battles plus tournament results. Ours come from *our own users*: `src/app/api/champions/meta/route.ts` aggregates species out of `shares` rows with `MIN_REPORTS = 5` and `TOP_N = 20`. That is a self-referential popularity contest, not a metagame. Any user who has seen Pikalytics will read our meta as decorative.
2. **Day-one format currency** (see §0). Their title tag says Reg M-C; ours says M-B.
3. **Programmatic SEO at a scale we don't approach.** Two indexed dimensions — format × Pokémon (`/pokedex/{format}/{mon}`) and format × builder (`/team/{format}`) — across VGC reg sets, BSS, OU, Ubers, National Dex, BDSP, Isle. Our equivalent, `src/app/champions/[pokemon]/page.tsx`, is one dimension and ~72 Mega pages (`getRegMBMegasWithSprites()`, per `src/app/sitemap.ts`).
4. **Suggestions at build time.** Their builder tells you what to run while you're choosing. Our report analyses a team you already finished.
5. **Offline + native.** A paid offline Pokédex is exactly right for a tournament venue with bad wifi. We have a PWA (`manifest.json`, `public/sw.js`, `InstallPrompt.tsx`, `ConnectivityStatus.tsx`) — solid, but it's not a store listing and doesn't ship the dex offline.
6. **Teammate/core analytics.** "These four appear together" is a genuinely distinct insight; nothing in `src/components/report/` produces it.

**PokePaste**

1. **Time-to-shared-link.** Paste → URL, no account, no modal, no decisions.
2. **Server-rendered view.** Content is in the HTML. Our `/s/[id]` body is a spinner (`src/app/s/[id]/redirect.tsx`).
3. **Open read API.** `/raw` + `/json` with permissive CORS made them the ecosystem's substrate. We consume that API; we don't offer one.
4. **Immutability as trust.** A teamsheet link that provably can't change post-hoc. Our shares are versioned and editable (`src/app/api/share/[id]/versions/`) — better for iteration, worse for "this is what I registered."
5. **Cost and durability.** Go + MySQL + BSD-3 + no accounts means it will outlive most of the tools built on it. We carry Clerk, Neon (512MB free tier), PostHog, Clarity and a cron fleet.
6. **Ubiquity as a moat.** "Drop the paste" means pokepast.es. That's a naming-level default we should route *through*, never around.

---

## 5. Concrete opportunities

Each item: suggested Linear ticket title, priority, rationale. No implementation performed.

### P0

**`VGC-XX: Add Reg M-C — regulation tag, dex, Megas (incl. Z-Megas), legality`**
The format rotated six days ago and we don't render it. Touches `src/lib/data/tags.ts` (`REGULATIONS`, `isChampionsFormat`), `src/lib/data/champions-dex.ts`, `src/lib/data/mega-pokemon.ts` (add Salamence/Golisopod/Baxcalibur + the Absol/Garchomp/Lucario Z-Megas, plus a `CHAMPIONS_REG_MC_ONLY_MEGAS` tier), `src/lib/validation/champions-legality.ts`, `src/lib/analysis/detect-regulation.ts`, `src/components/report/SpeedTierChart.tsx:156`, `src/app/sitemap.ts`, and the `CLAUDE.md` product line. The `isChampionsFormat()` miss is the sharp edge: an M-C report currently degrades to EV-mode silently. Note Z-Megas are a genuinely new *mechanic*, not just six more rows — worth scoping before estimating.

**`VGC-XX: Make the rotation data-driven so the next reg set is a data change, not a code change`**
M-A → M-B → M-C in one year, with M-D due around Dec 2026. Today `"Reg M-B"` is hard-coded as a branch condition in at least `SpeedTierChart.tsx:156` and `TeamOverview.tsx:389`. A single ordered Champions-regulation table (id, label, dex superset, mega set, active window) turns the December rotation into one file edit and one test. This is the ticket that stops §0 recurring.

### P1

**`VGC-XX: Server-render /s/[id] instead of client-redirecting to /?s=<id>`**
Our 5,000-strong sitemap of share pages currently serves crawlers and slow phones a spinner. Rendering the report at its own canonical `/s/<id>` closes the single biggest gap against PokePaste's view flow *and* unlocks the SEO value the metadata/JSON-LD work in `src/app/s/[id]/page.tsx` is already paying for. Keep the editor at `/?s=` if needed; the read path should be the clean URL.

**`VGC-XX: Add "Share Image" to ShareModal as a primary action`**
`TeamCardExport.tsx` and the `/api/team-graphic` route already exist — the capability is built, it's just not where the user presses Share (`src/components/ui/ShareModal.tsx`). Pikalytics puts Share Image adjacent to Share Link because VGC conversation is image-shaped. Cheapest distribution win on this list.

**`VGC-XX: Replace self-sourced champions meta with external usage data (or label it honestly)`**
`src/app/api/champions/meta/route.ts` presents our own users' 20 most-pasted species as "meta." Either ingest a real source, or relabel it as "most-reported on VGC Team Report," which is defensible and even interesting. Shipping it as metagame data invites an unflattering comparison the moment a user opens Pikalytics.

### P2

**`VGC-XX: Publish a public read API for shares (/s/[id]/raw and /s/[id]/json, CORS *)`**
PokePaste's `/raw` + `/json` is *the* reason it became infrastructure. We already read theirs (`src/app/api/pokepaste/route.ts`); offering ours — respecting `is_public`, never `is_unlisted`/private — lets other tools, Discord bots and LLM agents surface VGC Team Report links as a source. Low effort, compounding.

**`VGC-XX: Expand programmatic SEO beyond 72 Mega pages`**
`src/app/champions/[pokemon]/page.tsx` covers one dimension. Pikalytics indexes format × Pokémon. Candidates that fit our narrative angle rather than duplicating theirs: `/champions/[pokemon]` extended to all M-C-legal species, and format-scoped landing pages (`/reports/reg-m-c`) aggregating public reports. Pair with the `/s/[id]` SSR ticket — thin share pages will not rank on their own.

**`VGC-XX: Teammate / core co-occurrence analysis in the report`**
Pikalytics' most distinctive analytic is "who appears alongside whom." We hold full six-mon pastes for every public share, so we can compute cores over our own corpus — and unlike raw usage %, a core-frequency stat is *genuinely* interesting even on a smaller, report-shaped dataset. Fits beside `TeamOverview.tsx`.

**`VGC-XX: Immutable teamsheet snapshot link for registered teams`**
Our version history is a strength for iteration and a liability for "this is the team I registered." A frozen, permalinked snapshot of a report at a point in time gives us PokePaste's trust property without giving up editing. Note the Neon 512MB constraint — snapshot on explicit user action only, never autosave (per `CLAUDE.md`, `share_versions` already cost 447MB once).

---

## Sources

- [Pikalytics](https://www.pikalytics.com/) · [Champions hub](https://www.pikalytics.com/champions) · [Team builder](https://www.pikalytics.com/team) · [Damage calc](https://pikalytics.com/calc) · [Pokédex by format](https://www.pikalytics.com/pokedex/homebsd)
- [Support Pikalytics (Ko-fi)](https://ko-fi.com/pikalytics) · [Pikalytics on the App Store](https://apps.apple.com/us/app/pikalytics/id1511370166) · [HypeStat](https://hypestat.com/info/pikalytics.com) · [SEMrush](https://www.semrush.com/website/pikalytics.com/overview/)
- [felixphew/pokepaste (GitHub)](https://github.com/felixphew/pokepaste) · [server.go (v3)](https://github.com/felixphew/pokepaste/blob/v3/server.go) · [PokePaste syntax HOWTO](https://pokepast.es/syntax.html) · [Smogon announcement thread](https://www.smogon.com/forums/threads/pokepaste-a-pokemon-pastebin.3601073/) · [crob.at PokePaste importer](https://crob.at/pokepaste)
- [Get Ready for Regulation Set M-C (pokemon.com)](https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions) · [Bulbapedia — Regulation Sets in Pokémon Champions](https://bulbapedia.bulbagarden.net/wiki/Regulation_Sets_in_Pok%C3%A9mon_Champions) · [Victory Road](https://victoryroad.pro/champions-regulations/) · [MetaVGC Reg M-C](https://metavgc.com/regulations/regulationm-c)
