# R1 — Competitor + Community Pass (28-09-26)

Read-only research. No outbound posting, sending, or form submission occurred.

## 0. METHOD + EVIDENCE LIMITS (read first)

**WebFetch was unusable for this entire task.** Every domain attempted returned
`EGRESS_BLOCKED` from the container's egress proxy: pokemon.com, victoryroad.pro,
bulbapedia, serebii.net, pokemon-zone.com, metavgc.com, pikalytics.com, pokepast.es,
game8.co, pokecommunity.com, en.wikipedia.org. Reddit additionally refuses
Anthropic's crawler at the search layer (`400 ... domains are not accessible to our
user agent: ['reddit.com']`), so r/VGC and r/stunfisk were unreachable by *both*
channels.

Consequence: findings below are grounded in **WebSearch result titles, URLs, and
search-engine summaries of real indexed pages**. I could not open pages to verify
wording or pull verbatim user quotes.

Per the task's hard rule, I have **not invented any user quotes**. Section 2 reports
"no evidence found" where that is the truth. No outreach draft was written, because
writing marketing copy off unverified sentiment would be the same failure mode.

Claims are tagged:
- **[VERIFIED-LOCAL]** — checked directly in this repo.
- **[SEARCH]** — from a search summary of a real indexed URL; page not openable.

---

## 1. REGULATION ANSWER — the headline finding

**Current Pokémon Champions regulation as of 28 Sep 2026 is Regulation Set M-C.**
This repo supports only M-A/M-B, so it is a full regulation behind. **[SEARCH]**

| Fact | Value | Source |
|---|---|---|
| Active set | **M-C** | https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions |
| Window | 8 Sep 2026 19:00 PDT → 1 Dec 2026 17:59 PST (also cited as 9 Sep → 2 Dec) | https://www.serebii.net/pokemonchampions/rankedbattle/regulationm-c.shtml |
| Ranked seasons | Season 3 / seasons M-6, M-7, M-8 | https://victoryroad.pro/champions-regulations/ |
| New Pokémon | ~36 added (regional forms, gender variants, Galar starters) | https://www.pokemon-zone.com/champions/regulations/m-c/ |
| New Megas | **Mega Salamence, Mega Golisopod, Mega Baxcalibur** + **Z Megas: Mega Absol Z, Mega Garchomp Z, Mega Lucario Z** | https://bulbapedia.bulbagarden.net/wiki/Regulation_Set_M-C |
| Item clause | 166 unique legal held items, no two Pokémon share an item | https://metavgc.com/regulations/regulationm-c |
| Mega limit | One Mega Evolution per battle | https://game8.co/games/Pokemon-Champions/archives/618064 |
| Next set | **No evidence found** of any announced post-M-C set | — |

Note: SP budget (66 total / 32 per stat) was **not** contradicted by any M-C source, but
I also could not positively confirm it is unchanged in M-C, because every rules page was
egress-blocked. **Treat "66/32 still valid in M-C" as unverified.**

### 1a. Repo gap, verified locally **[VERIFIED-LOCAL]**

- `src/lib/analysis/detect-regulation.ts` knows only `M-A` and `M-B`. No `M-C` branch.
  Current-format teams will mis-detect.
- `src/lib/data/mega-pokemon.ts` contains **zero** occurrences of `Salamence`,
  `Golisopod`, `Baxcalibur`. Absol/Garchomp/Lucario appear only as base Megas —
  **no Z-Mega variants exist anywhere in the file.** All six M-C Megas are missing.
- `src/lib/analysis/stat-calculator.ts` still hardcodes
  `CHAMPIONS_MAX_SP_PER_STAT = 32`, `CHAMPIONS_TOTAL_SP = 66`.
- Already present and fine: `OTSSheetModal.tsx` (team sheets),
  `src/app/s/[id]/opengraph-image.tsx` + `api/team-graphic/route.tsx` (social embeds).

### 1b. How fast competitors adopted M-C — they were faster than us **[SEARCH]**

- **Pikalytics**: already serving M-C on live format slugs
  (`/pokedex/gen9championsvgc2026regmc`), and keeps M-A (`regma`) and M-B
  (`battledataregmbs3`) archives. https://www.pikalytics.com/
- **VGCPastes**: M-C repository live with **68 teams and 59 replica codes**, self-described
  as publishing "so fast". Repository refreshes every 12h. https://x.com/vgcpastes
- **MetaVGC, Pokémon Zone, ChampsDex, showdowntier.com**: all have dedicated M-C pages.
  https://metavgc.com/teams/featured/regulation-mc · https://www.pokemon-zone.com/champions/teams/

**Read:** regulation turnaround in this niche is days-to-weeks, not months. Being a
regulation behind is not a minor backlog item — it is the difference between being a
current tool and a stale one. This is the single highest-priority finding in this report.

---

## 2. COMMUNITY SENTIMENT — largely NO EVIDENCE FOUND

**r/VGC and r/stunfisk: no evidence obtainable.** Reddit is blocked at both the crawler
and egress layers (see §0). I retrieved **zero** Reddit threads and therefore report
**no Reddit sentiment at all** rather than paraphrasing plausible-sounding grievances.

**X/Twitter: no relevant evidence found.** Searches for VGC complaints about team
builders / outdated tools surfaced no on-topic posts. The one real VGC tweet returned
was about community toxicity generally, unrelated to tooling:
https://x.com/PokeReplaysVGC/status/2096334683885682735 — **not usable as tooling sentiment.**

**What I did find is product-page and guide-page framing of pain points, not user voice.**
These are vendor/editorial claims, useful as hypotheses only — they are *not* community quotes:

- **PokePaste limitations**, per a competitor's comparison page: "text only, no sprites,
  no item icons, no visual team preview, and **no social embeds** — pasting a pokepast.es
  link on Discord or Twitter shows no preview image"; also cannot share a multi-team
  export. Source is a rival marketing page, so treat as adversarial:
  https://crob.at/pokepaste-alternative
- **Replica-code friction**, per guide sites: using a Replica Team requires already owning
  the Pokémon and items; 20–30s to import; juggling up to ten Team IDs; default **3 team
  slots** with expansion behind a **$4.99/mo or $49.99/yr** membership; code expiry
  "no confirmed information". https://www.thegamer.com/pokemon-champions-replica-rental-teams-guide/
  · https://games.gg/pokemon-champions/guides/pokemon-champions-how-to-get-more-free-team-slots/
- **SP/EV conversion confusion**, per an editorial guide: players find the EV→SP
  conversion confusing, with rounding discrepancies ("65 total that actually gives 66").
  https://genpkm.com/blog/pokemon-champions-no-ivs-stat-points-competitive-guide-2026

**Recommendation:** treat §2 as unresolved. Re-run sentiment from a host with
unrestricted egress, or read r/VGC manually. Do not cite anything in §2 as "users say".

---

## 3. COMPETITOR TEARDOWN

### 3a. Correction to the brief: **Trainer Hill is not a VGC competitor**

`trainerhill.com` is a **Pokémon TCG** analytics site ("Trainer Hill — Pokémon TCG
Analytics", meta trends, decklists, matchup stats). https://www.trainerhill.com/about
It should be dropped from the VGC competitive set. The brief likely conflated it with
**Trainer Tower** (https://www.trainertower.com/), a VGC site.

### 3b. The real competitive set

| Competitor | What it does | Share/view UX | Monetization | Does BETTER than paste-to-report |
|---|---|---|---|---|
| **Pikalytics** (pikalytics.com) | Usage stats, pokedex per format, tournaments, **team builder**, **AI team builder** (`/ai/team`), **Champions speed tiers**, top-teams gallery | Save team, **share via link**, **export team image** | iOS/Android apps; ads/premium not confirmable (page blocked) | Ladder+tournament usage data at scale; already on M-C; **has speed tiers and image export — direct overlap with our differentiators**; mobile apps |
| **PokePaste** (pokepast.es) | Minimal Showdown pastebin, Go rewrite, open source | URL, no account, syntax highlight, sprite previews | None (free, OSS) | Ubiquity + trust + permanence. It is the *default verb* for sharing a team. Zero friction, no signup |
| **VGCPastes** (x.com/vgcpastes) | Curated tournament team repository in a spreadsheet | Google Sheet + Twitter threads + Discord; **includes replica codes** | Community/free | Human curation and provenance ("this won Bologna"); 12h refresh; **68 M-C teams + 59 replica codes**; enormous social distribution |
| **Limitless VGC** (limitlessvgc.com, play.limitlesstcg.com?game=VGC) | Tournament database + **tournament-running software** with team-list submission | Tournament/player/team pages; public API | TCG-side business | **Owns the event workflow** — organizers run events on it, so team lists originate there. Authoritative results |
| **crob.at** (crob.at/teams/champions) | Explicitly markets as "**Best PokePaste Alternative: Visual Team Sharing**" | Visual team pages, social embeds | Unknown | **Most direct competitor to our positioning** — already attacking the exact "paste → pretty shareable page" wedge |
| **PokeReplicas** (pokereplicas.com, iOS + Android) | Replica-team browser; **paste a Showdown team or pokepast.es URL → replica code, and export back to Showdown one tap** | Native apps + web | App stores | **Bidirectional Showdown ↔ replica-code bridge — the thing Champions players actually need, which we do not do at all** |
| **SP converters**: RotomLabs (rotomlabs.net/champions/stat-converter), ChampCalc (champ-calc.vercel.app) | Dedicated EV↔SP converters | Single-purpose web tools | None apparent | Single-purpose clarity on the exact mechanic we treat as an internal helper |
| **Team-sheet tools**: teamsheet.gg/generator, thefrontiervgc.com/teamsheet, draftcentral.gg, retreatcost.com | Fill the **official Play! Pokémon team list PDF** from a paste | PDF download/print | Mostly free | Fill the *unmodified official PDF* — legally usable at events. Our `OTSSheetModal` competes in a crowded, commoditised space |
| Also live on M-C | MetaVGC, Pokémon Zone, ChampsDex, MunchStats (munchstats.com/teams), showdowntier.com, PokeSynergy, PikaChampions | | | Field is crowded and fast |

### 3c. Gaps none of them appear to fill **[SEARCH-derived hypotheses]**

1. **Replica-code ⇄ report round trip.** PokeReplicas converts codes but gives no
   analysis. Pikalytics analyses but (no evidence found of) replica-code ingest. A tool
   that takes a **replica code** and returns a full report is unclaimed.
2. **Legality/validation as a product.** Everyone lists what is legal; nothing found that
   *audits your paste* against item clause (166 items), species clause, restricted count,
   and SP budget and tells you what is illegal before you show up at an event. This repo
   already has `champions-legality.ts` — that is a genuine moat.
3. **"Is my team still legal in the new regulation?"** With M-A→M-B→M-C churn every ~3
   months, nothing found offers a *diff*: which of your six became illegal, which new Mega
   threatens you.
4. **OCR/screenshot ingest** is barely served — one unpolished GitHub project
   (https://github.com/emermelada/champions2paste). Console players' teams live as
   screenshots, not text.

---

## 4. TOP 5 ACTIONABLE OPPORTUNITIES

1. **Ship Reg M-C (P0).** Add the M-C branch to `detect-regulation.ts` and the six missing
   Megas to `mega-pokemon.ts`; confirm SP budget for M-C from a reachable source first.
   Competitors shipped it in days; we are a full regulation stale.
2. **Regulation-diff feature.** "This team was legal in M-B; under M-C X is illegal and
   Mega Salamence is a new threat." Built on `champions-legality.ts`. Nothing found does this.
3. **Replica-code ingest/export.** The native Champions share primitive. PokeReplicas owns
   the conversion but not the analysis; we own analysis but not the codes.
4. **Lean into legality auditing as the headline**, not speed tiers or image export —
   Pikalytics already has both, plus more data and mobile apps.
5. **Re-run community sentiment from an unblocked host** before any positioning or
   outreach work. §2 is currently unevidenced, and the brief's Trainer Hill premise was
   already wrong — assumptions here need checking, not amplifying.

---

## 5. HYGIENE

- Repo files modified: **this file only.** No other repo file touched. No git command run.
- No outreach draft written (see §0 rationale). `.swarm/drafts/` left as-is.
- Nothing was posted, sent, submitted, or signed up for.
