# R3 — VGC Community Sentiment Scan
**Agent:** R3 (read-only UX research)
**Date:** 2026-09-07
**Themes:** team builder · team report · sharing teams · pokepaste alternative · EV spread sharing · **Pokémon Champions SP confusion (priority)**
**Method:** 12 WebSearch calls + WebFetch attempts. Bash curl/wget blocked as briefed.
**Direct fetch blocked by egress proxy:** reddit.com, smogon.com, victoryroad.pro, champdex.com, genpkm.com. All Reddit/Smogon signal below is triangulated from Google-indexed snippets of those threads plus community guide sites, not from direct page reads. Treat quoted community claims as second-hand.
**Prior reports skimmed:** `r3-community-sentiment-20-05-26.md`, `r3-community-sentiment.md` (24-05-26), `r3-reddit-16-05-26.md`. Findings tagged NEW / KNOWN accordingly.

---

## 0. TIME-CRITICAL — Regulation M-C ships in ~1 day (NEW, P0)

**Regulation Set M-C runs Tue 8 Sep 2026 19:00 PDT → Tue 1 Dec 2026 17:59 PST.** M-B ends end-of-day 8 Sep.

What M-C adds:
- Six new Mega Evolutions incl. **Mega Salamence, Mega Golisopod, Mega Baxcalibur**
- A brand-new mechanic: **Z Mega Evolutions** — **Mega Absol Z** (Dark/Ghost, Sharpness), **Mega Lucario Z** (Fighting/Steel, new ability **Aura Guard** — halves contact-move damage), **Mega Garchomp Z** (Dragon, **Levitate**)
- **24 newly legal Pokémon**, including Rillaboom
- Everything legal in prior M sets stays legal (M-C is a superset of M-B)
- Team may hold more than one Mega Stone; only one Pokémon may Mega Evolve per battle (unchanged)

**Repo impact (verified read-only):**
- `src/lib/data/tags.ts` — the regulation union lists `"Reg M-A", "Reg M-B"` only, and `isChampionsFormat()` is `regulation === "Reg M-A" || regulation === "Reg M-B"`. **A team tagged Reg M-C therefore falls through to the classic-EV path**: SP is not derived, `PokemonCard`/`PokemonDetailSlide`/`SpeedTierChart` render EVs instead of SP, Champions legality never runs, and IVs/Tera are shown again despite Champions having neither.
- `src/lib/validation/champions-legality.ts` dex will reject all 24 new species and the 6 new Megas as illegal.
- `src/app/faq/page.tsx` line ~98 still asserts *"Regulation M-A is the current competitive ruleset"* — that has been false since 17 Jun 2026 and will be two regulations stale on 9 Sep.

Sources: pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions · pokemon-zone.com/champions/regulations/m-c/ · game8.co Regulation M-C roster · pokequery.com (8 Sep 2026)

---

## 1. SP vs EV confusion — the priority theme

### 1.1 The community-canonical conversion rule matches our implementation (KNOWN — no bug, verify only)
Community sources converge on the same rule our code uses:
> "Champions converts EV spreads using the official HOME transfer rule: the first SP in a stat costs 4 EVs, each additional SP costs 8." — surfaced across ChampDex, RotomLabs, ChampCalc
> "Add 4 to numbers from a normal EV spread, then divide by 8. 164 + 4 = 168, 168 / 8 = 21 points."

`evToChampionsSp()` in `src/lib/analysis/stat-calculator.ts` is `ceil(ev/8)` with a floor of 1 and a 248-EV → 32 SP cap. That yields the identical ladder (4→1, 12→2, 20→3 … 248→32). **No discrepancy found.** Our FAQ entry ("the first SP in a stat costs 4 EVs and each SP after that costs 8") is one of the few places on the web that states the rule correctly — this is an AEO asset, not a liability.

### 1.2 "You always spend all 66" is the community norm — our converter leaves users stranded (NEW, high)
Every Champions guide repeats the same line:
> "There's no leftover currency, you spend the full 66 every time." … "You max the damage stat, max Speed … and put the leftover 2 SP into HP. Leaving them unassigned accomplishes nothing."

But `convertToChampionsSp` deliberately does **not** pad (correctly — the padding bug that produced 32 HP/32 Def is documented in the code comments). Consequence, per the code's own comment: a `252 HP / 4 Def` paste converts to `32 HP / 1 Def` and **leaves 33 of 66 SP unspent**. We show an `n/66` counter and a legality shortfall, i.e. we tell the user they are wrong and stop. Every competitor converter (ChampCalc live sliders, ChampDex, RotomLabs) instead hands the player a spendable remainder.

**Gap:** we flag the shortfall; nobody helps the player close it.

### 1.3 A crowded field of SP converters appeared since May (NEW, competitive)
Prior R3 sweeps listed ChampionsMeta.io, ChampTeams.gg, pokebase.app. Since then, at least **five dedicated EV→SP converters** exist:

| Tool | Notes |
|------|-------|
| `champdex.com/tools/ev-converter` | Plus a full `guides/stat-points` explainer **and an iOS app** (App Store id6761497339) |
| `rotomlabs.net/champions/stat-converter` | Angle: "work out the exact EV spread to pre-train in HOME to hit your target SP" — reverse direction, which we also have (`championsSpToEv`) but do not surface |
| `champ-calc.vercel.app` | Live sliders + paste parsing, explicitly "66-point format" |
| `battlewiseai.com/guides/sp-system-guide` | Guide-first, SEO play |
| `champsdex.com` EV-spreads guide | Content play: "Common EV Spreads in Champions — Bulk, Speed & Mixed" |

Our `/tools/ev-to-sp` is no longer differentiated by existing. It **is** differentiated by being attached to a full report — none of the five convert *in the context of a team*.

### 1.4 Two under-served confusion vectors nobody explains well (NEW, medium)
1. **"32 SP is slightly more than 252 EVs."** Multiple sources note Champions raised the effective max — 32 SP ≈ 256 EV-equivalent, "1 extra stat point compared to the main games," which "could matter for a Substitute set sitting on a Leftovers/berry threshold." No tool shows the delta. A converted spread can silently gain a stat point vs. its SV original.
2. **IVs are gone.** Smogon's Champions thread has players working through the knock-on: *"special attackers got nerfed … since they can't do 0 IV Attack"* — no minimising Foul Play / confusion damage. Guides titled "Pokemon Champions Has No IVs" are ranking. **Our code already handles this correctly** (`PokemonCard.tsx` line ~197: *"Champions (Reg M-A / M-B) has no Tera mechanic and forces IVs to 31 — hide both"*) — but it is silent handling; we never *explain* it, so we get no credit and answer none of the search demand. Note the comment's regulation list is the same hard-coded M-A/M-B pair as §0.

### 1.5 The Showdown export format is genuinely ambiguous (KNOWN, confirmed externally)
Search snippets now state flatly: *"EVs represent Stat Points in Pokémon Champions."* Showdown still has no `SP:` line, so Champions spreads ride inside `EVs:`. Our parser's fast-path heuristic (all values ≤32 and total ≤66 ⇒ treat as SP) is the right call and the code comment justifies it well. **Residual risk worth a ticket:** a genuinely low-investment classic EV paste (e.g. `EVs: 20 HP / 12 Def / 30 Spe`, total 62) satisfies both conditions and would be silently misread as SP. Rare, but silent. Competitor builders instead *warn*: "if a paste has more than 510 total EVs or more than 252 in a single stat, the builder caps the values and shows a warning."

---

## 2. Sharing / pokepaste-alternative themes

### 2.1 crob.at has explicitly taken the "PokePaste alternative" SEO position (NEW)
crob.at now runs dedicated landing pages — `/pokepaste-alternative`, `/pokepaste`, `/guide/share-showdown-teams`, `/teams/champions`, `/teams/vgc` (titled "Pokémon Champions VGC 2026 Reg M-B Teams to Copy & Paste"), and per-Pokémon pages (`/teams/pokemon/metagross`). Pitch: *"everything PokePaste does — free, no login, Showdown import — plus visual sprites, social preview images, multi-team support, and a public team gallery."*

In May, R3 called crob.at "a visual layer with no context layer." That is still true — no matchup notes, no calcs, no spread reasoning — **but it has since built the per-Pokémon and per-format landing-page surface that R6/SEO wants and that we were counting on as our discovery moat.** This is the sharpest competitive change since May.

### 2.2 VR Pastes ships the OTS feature we scoped (NEW)
`vrpastes.com` offers password-protected pastes and **public Open Team Lists that hide EVs and IVs**. The May R3 report recommended "OTS PDF export from a report" as a high-priority differentiator. It is now partly claimed — a view-mode OTS, not a printable sheet. The printable/regulation-compliant sheet is still unbuilt anywhere.

### 2.3 Replica codes carry a hidden failure mode nobody surfaces (NEW, high)
Champions replica teams are **10-digit codes**; applying one copies all six Pokémon with items, abilities, natures and movesets — **but "the transfer only works if you already own every Pokémon on the team and have the required held items in your inventory."**

Nobody displays that prerequisite. A player copies a code, it fails, and they have no idea which of the six blocked it. Game8's Team Sharing Board, OP.GG's replica-team pages, TheGamer's guide and several code-list blogs all publish bare codes with no ownership checklist. Also note codes are being farmed into SEO listicles ("Best Replica Team Codes 2026") — the code is the shareable unit of the Champions era, the way the pokepaste URL was for SV.

### 2.4 Context-on-top-of-pastes remains the durable unmet need (KNOWN, reconfirmed)
Search snippets now describe the ideal team report as: six Pokémon with sets, core strategy and win conditions, matchup notes vs. top threats, **key damage calcs explaining why each spread was chosen**, speed tiers, and tournament context. That is our exact product shape, and our own pages are being cited in results for it. The competitive set (Pikalytics calc, Porygon Labs, Nimbasa City Post calc, Reportworm, Stratagem) each own one slice; none own the narrative bundle. **Our position here is still uncontested — the risk is discovery, not product.**

---

## 3. NEW vs KNOWN ledger (for de-duping against existing tickets)

| Finding | Status | Prior report |
|---|---|---|
| Reg M-C ships 8 Sep, adds Z Megas + 24 mons; `tags.ts` hard-codes M-A/M-B | **NEW** | — |
| FAQ says "M-A is the current ruleset" (two regs stale) | **NEW** | — |
| Converted spreads leave SP unspent with no allocation help | **NEW** | — |
| Five competing EV→SP converters, one with an iOS app | **NEW** | partially (May listed 3 different tools) |
| 32 SP ≈ 256 EV, not 252 — silent 1-point delta | **NEW** | — |
| Replica code fails silently without ownership of mons/items | **NEW** | — |
| crob.at now holds the "pokepaste alternative" SEO position | **NEW** | crob.at noted May, without landing pages |
| VR Pastes ships OTS-style hidden-EV view | **NEW** | OTS was an unmet need in May |
| EV→SP formula correctness | **KNOWN — verified correct, no action** | 24-05-26 |
| IVs hidden in Champions reports | **KNOWN — already implemented** | — |
| Showdown `EVs:` line carries SP; heuristic needed | **KNOWN — implemented, edge case open** | — |
| Rental/replica code as first-class report field | **KNOWN** | 20-05 §6.1, 24-05 ticket 1 |
| Searchable report archive by Pokémon + regulation | **KNOWN** | 20-05 §1.1, 24-05 ticket 4 |
| Source / attribution field | **KNOWN** | 24-05 ticket 2 |
| PokePaste sprite + import breakage, 155 open issues | **KNOWN — no change** | 20-05 §3.1 |
| VGCPastes curation bottleneck, Victory Road gatekeeping | **KNOWN — no change** | 20-05 §3.3/3.4 |
| Pikalytics mobile gaps / VGC Helper abandoned | **KNOWN — partly closed by ChampDex iOS** | 20-05 §1.5 |

---

## 4. Recommended tickets (each scoped small; orchestrator to file)

1. **P0 — Add `Reg M-C` end to end.** Extend the regulation union and `isChampionsFormat()` in `src/lib/data/tags.ts`; add the 24 new species, 6 new Megas and the 3 Z-Mega forms to `src/lib/data/` dexes + mega list; confirm `champions-legality.ts` accepts them. Ships before/with 9 Sep or every M-C paste renders as a classic EV team.
2. **P0 — Refresh FAQ regulation copy.** `src/app/faq/page.tsx` — M-C is current from 8 Sep; keep M-A/M-B as historical. Add a "Do Pokémon Champions have IVs?" Q (answer: no, locked at 31 — no 0-Atk-IV Foul Play tech) — that query is ranking and we already implement it.
3. **P1 — "Spend your remaining SP" affordance.** Wherever the `n/66` shortfall is shown (converter + report editor), offer a one-tap suggested allocation for the unspent points (bulk-first, or proportional-to-existing) instead of only flagging the deficit. Directly answers the universal "you spend the full 66 every time" norm.
4. **P1 — Surface the reverse converter (SP → EV) on `/tools/ev-to-sp`.** `championsSpToEv` already exists and is untested against user demand; RotomLabs is monetising exactly this ("pre-train in HOME to hit your target SP"). Cheap: one tab on an existing page.
5. **P1 — Replica-code prerequisite checklist.** If a report carries a replica code, list the six species + held items the viewer must already own, since the code silently fails otherwise. No competitor does this; it is the single most concrete Champions-era sharing complaint.
6. **P2 — Ambiguous-spread warning in the parser fast path.** When a paste's spread is ≤32/stat and ≤66 total but the format is a classic EV regulation (or unset), show a non-blocking "read as SP — switch to EVs?" toggle rather than deciding silently.
7. **P2 — "32 SP vs 252 EV" note in the converter.** One line explaining that Champions' cap is marginally above a 252-EV investment and a converted spread may sit one point richer than its SV original.
8. **P2 — Per-Pokémon / per-regulation landing pages for Champions teams**, mirroring the surface crob.at just built (`/teams/champions`, `/teams/pokemon/<mon>`). Hand to R6/SEO — noting here only because it is a competitive change, not a fresh SEO audit.

---

## 5. Draft community post
A draft Reddit reply/post is at `.swarm/drafts/r3-reddit-draft-07-09-26.md`, clearly labelled **DRAFT — NOT POSTED**. Nothing was submitted anywhere; no forms, no messages, no API writes. This run was read-only on `src/` and made no source edits.

---

## Sources
- https://www.pokemon.com/us/news/get-ready-for-regulation-set-m-c-in-pokemon-champions
- https://www.pokemon-zone.com/champions/regulations/m-c/
- https://pokequery.com/news/2026/09/regulation-set-m-c-arrives-in-pokemon-champions-on-september-8-2026
- https://game8.co/games/Pokemon-Champions/archives/618064
- https://www.smogon.com/forums/threads/pok%C3%A9mon-champions-releasing-april-8-2026.3779617/ (page 14 — via search snippets; direct fetch blocked)
- https://www.smogon.com/dex/champions/formats/vgc26-regulation-m-b/
- https://champdex.com/guides/stat-points · https://champdex.com/tools/ev-converter · https://apps.apple.com/us/app/champdex/id6761497339
- https://rotomlabs.net/champions/stat-converter
- https://champ-calc.vercel.app/
- https://champsdex.com/posts/pokemon-champions-ev-spreads-guide-2026/
- https://www.battlewiseai.com/guides/sp-system-guide
- https://genpkm.com/blog/pokemon-champions-no-ivs-stat-points-competitive-guide-2026
- https://crob.at/pokepaste-alternative · https://crob.at/teams/champions · https://crob.at/teams/vgc
- https://www.vrpastes.com/
- https://www.thegamer.com/pokemon-champions-replica-rental-teams-guide/
- https://game8.co/games/Pokemon-Champions/archives/Team-Share · https://op.gg/pokemon-champions/replica-teams
- https://www.pokecommunity.com/threads/pokemon-champions-question.541985/
- https://www.pikalytics.com/pokedex/battledataregmbs3
