# R6 — SEO Draft Copy & Metadata, 3 August 2026

> **DRAFTS ONLY. NOTHING HERE HAS BEEN PUBLISHED, POSTED, OR COMMITTED.**
> Reference material for a human to review, edit, and ship deliberately.
> Companion report: `.swarm/r6-seo-03-08-26.md`

Every factual claim below is grounded in first-party repo data (`mega-pokemon.ts`, `champions-dex.ts`, `stat-calculator.ts`) or a verified public source. No invented usage percentages, no fabricated "best spread" claims — inventing those would be structured-data spam and a manual-action risk.

---

## 1. Reg M-B Mega pages — metadata parameterisation

The existing `generateMetadata` in `src/app/champions/[pokemon]/page.tsx` hardcodes "Regulation M-A". Proposed replacement pattern:

```ts
const isMBOnly = CHAMPIONS_REG_MB_ONLY_MEGAS.has(mega.dataKey);
const regLabel = isMBOnly ? "Regulation M-B" : "Regulation M-A & M-B";
```

**Title (M-B-only Mega), ≤60 chars target:**
```
{DisplayName} VGC Guide — Reg M-B SP Spreads & Teams
```

**Title (M-A Mega, still M-B legal):**
```
{DisplayName} VGC Guide — SP Spreads, Movesets & Teams
```
*(unchanged — it already performs and avoids churning 58 established URLs' titles)*

**Description (M-B-only):**
```
Complete {DisplayName} VGC guide for Pokemon Champions Regulation M-B: SP spreads,
movesets, damage calcs, and top competitive teams. {Ability} with {MegaStone}.
Newly legal in Reg M-B, the 2026 World Championships format.
```

**Description (M-A, revised to stop reading stale):**
```
Complete {DisplayName} VGC guide for Pokemon Champions: best SP spreads, movesets,
damage calcs, and top competitive teams. {Ability} with {MegaStone}. Legal in
Regulation M-A and M-B.
```

**Revised FAQ JSON-LD legality answer** (replaces the M-A-only assertion at `page.tsx:218`):

- M-A Mega:
  > **Q:** Is {DisplayName} legal in VGC 2026?
  > **A:** Yes — {DisplayName} is legal in both Pokemon Champions Regulation M-A and Regulation M-B. Regulation M-B is the official format from 17 June to 2 September 2026, including the 2026 World Championships.
- M-B-only Mega:
  > **Q:** Is {DisplayName} legal in VGC 2026?
  > **A:** {DisplayName} is legal in Pokemon Champions Regulation M-B, but not in Regulation M-A. Regulation M-B is the official format from 17 June to 2 September 2026, including the 2026 World Championships.

**New FAQ entry for M-B-only Megas:**
> **Q:** When did {DisplayName} become legal in VGC?
> **A:** {DisplayName} was added in Pokemon Champions Regulation M-B, which became the official format on 17 June 2026. It was not legal in Regulation M-A.

**The 14 sprited Reg M-B-only Megas that would gain pages** (from `CHAMPIONS_REG_MB_ONLY_MEGAS` ∩ `MEGAS_WITH_SPRITES`):
Sceptile, Blaziken, Swampert, Mawile, Metagross, Staraptor, Scolipede, Scrafty, Eelektross, Pyroar, Malamar, Barbaracle, Dragalge, Falinks.
*Excluded (no Showdown sprite as of the June 2026 probe): Raichu-Mega-X, Raichu-Mega-Y.*

---

## 2. `/tournaments` — Worlds 2026 event correction

**Current (incorrect) entry in `UPCOMING_TOURNAMENTS`:**
```
name: "2026 Pokemon World Championships"
startDate: "2026-08-14"
location: "San Francisco, California, USA"
description: "...held August 14-17 in San Francisco..."
```

**Corrected draft** — verify against victoryroad.pro/2026-worlds and pokemon.com before shipping:
```
name: "2026 Pokemon World Championships"
startDate: "2026-08-28"
endDate: "2026-08-30"
location: "Moscone Center, San Francisco, California, USA"
url: "https://pokemonvgcteamreport.com/tournaments/worlds-2026"
description: "The 2026 Pokemon World Championships, held August 28-30 at the Moscone
  Center in San Francisco, with finals at Chase Center. Played under Pokemon Champions
  Regulation M-B."
```
Also add `endDate: "2026-05-31"` to the Indianapolis Regionals entry (currently start-only).

---

## 3. `/tournaments/worlds-2026` — draft metadata

```
title:       "Pokemon Worlds 2026 VGC Teams — Reg M-B Team Reports"
description: "Team reports from the 2026 Pokemon World Championships in San Francisco,
              August 28-30. Browse Regulation M-B teams with full SP spreads, damage
              calcs, matchup plans, and placements."
canonical:   https://pokemonvgcteamreport.com/tournaments/worlds-2026
```

**H1:** `Pokemon Worlds 2026 — VGC Team Reports`

**Intro (~70 words):**
> The 2026 Pokemon World Championships run 28–30 August at the Moscone Center in San Francisco, with the finals at Chase Center. Worlds 2026 is played under Pokemon Champions Regulation M-B — the Mega Evolution format that succeeded Regulation M-A on 17 June. Every team report below was published by its creator with the full SP spread, item, moveset, and matchup reasoning behind it. New reports appear here as they are shared.

**Schema:** `SportsEvent` (corrected dates) + `ItemList` of listed reports + `BreadcrumbList` (Home → Tournaments → Worlds 2026).

---

## 4. `/champions/replica-teams` — draft metadata & copy

```
title:       "Pokemon Champions Replica Teams — Team ID Codes 2026"
description: "Browse Pokemon Champions replica team codes shared by competitive players.
              Every Team ID comes attached to a full team report with SP spreads,
              movesets, and the reasoning behind the build. Regulation M-B."
canonical:   https://pokemonvgcteamreport.com/champions/replica-teams
```

**H1:** `Pokemon Champions Replica Teams & Team ID Codes`

**Intro (~90 words):**
> Pokemon Champions uses Replica Teams rather than the rental teams of Scarlet & Violet. A Replica Team is a 10-character Team ID that stamps a full configuration — Stat Point spread, moveset, nature, held item — onto Pokemon you already own. Every code listed here is attached to a published team report, so you can read *why* a team was built the way it was before you copy it. Codes are shared by the community and refresh as new reports are published.

**"How to use a Team ID" section (verify redemption steps in-game before shipping):**
> 1. Open Pokemon Champions and go to the main menu.
> 2. Select **Training**, then **Replica Teams**.
> 3. Choose **Build Teams using Team IDs** and pick an empty team slot.
> 4. Enter the 10-character code.
>
> Replica Teams only apply to Pokemon you already own, and the required held items must be in your inventory. Missing Pokemon must be recruited in-game or transferred from Pokemon HOME.

**Draft FAQ (for `FAQPage` schema):**
- *Are replica teams the same as rental teams?* — No. Scarlet & Violet used rental teams, which lent you the Pokemon directly. Pokemon Champions uses Replica Teams: a Team ID applies a configuration to Pokemon you already own.
- *How long is a Pokemon Champions team code?* — Team IDs are 10 characters.
- *Do I need to own the Pokemon to use a code?* — Yes. The Team ID only configures Pokemon already in your box, and the held items must be in your inventory.

**UI copy note:** the app currently labels this field "Rental code" (`version-diff.ts:270`, explore filter pill, card badge). Recommend relabelling the user-facing string to "Replica code (Team ID)" for terminology accuracy — but that is a product decision, not an SEO one, and would touch all 7 locale files.

---

## 5. `/champions/sp-calculator` — draft metadata & copy

```
title:       "Pokemon Champions SP Calculator — EV to Stat Points Converter"
description: "Convert Pokemon EV spreads to Champions Stat Points. 66 SP total, 32 max
              per stat. Paste a Showdown export to convert a whole team, or set SP per
              stat and see level 50 results instantly."
canonical:   https://pokemonvgcteamreport.com/champions/sp-calculator
```

**H1:** `Pokemon Champions SP Calculator — EV to Stat Points`

**Explainer copy (~140 words) — matches `stat-calculator.ts` and `champions-legality.ts`:**
> Pokemon Champions replaces Effort Values with **Stat Points (SP)**. You get **66 SP** to spend across the six stats, with a maximum of **32 SP in any single stat**. At level 50 each Stat Point adds one point to the final stat, so a spread is easier to read than the old EV numbers: 32 SP in Speed is the Champions equivalent of the 252-EV ceiling.
>
> Converting an existing EV spread follows the official Pokemon HOME transfer rule: **the first Stat Point in a stat costs 4 EVs, and every additional Stat Point costs 8**. That mapping is what makes a transferred Pokemon land on the same final stats it had under the EV system. It also means a maxed 32 SP corresponds to 252–256 EVs, and the 66 SP budget maps to slightly more total investment than the old 508 EV cap — because Champions lets you spread that investment across fewer maxed stats.
>
> Champions also locks IVs to 31 and removes Tera types, so a build is fully described by its SP spread, nature, ability, item, and four moves.

**Draft FAQ (for `FAQPage` schema):**
- *How many Stat Points do you get in Pokemon Champions?* — 66 in total, with a maximum of 32 in any one stat.
- *How many EVs is one Stat Point?* — The first Stat Point in a stat costs 4 EVs; each additional Stat Point costs 8. So 32 SP is equivalent to 252 EVs.
- *Does Pokemon Champions have IVs?* — No. IVs are locked at 31 for every Pokemon, so builds are described entirely by their Stat Point spread.
- *Is 32 SP the same as 252 EVs?* — Yes at level 50. Both produce the same final stat.

---

## 6. `/champions/speed-tiers` — draft metadata

```
title:       "Pokemon Champions Speed Tiers — Reg M-B Speed Chart 2026"
description: "Complete Pokemon Champions speed tier chart for Regulation M-B. Base and
              max Speed at level 50, neutral and positive natures, Choice Scarf, Tailwind,
              and Trick Room thresholds for every legal Pokemon and Mega."
canonical:   https://pokemonvgcteamreport.com/champions/speed-tiers
```

**H1:** `Pokemon Champions Speed Tiers — Regulation M-B`

**Intro (~60 words):**
> Every Pokemon and Mega Evolution legal in Pokemon Champions Regulation M-B, sorted by Speed at level 50. The chart shows base Speed, neutral-nature max, positive-nature max with 32 SP invested, and the Choice Scarf and Tailwind multipliers. Trick Room players can sort ascending to find the slowest legal picks. Speed values are calculated with IVs locked at 31, as Champions requires.

*Do not publish a "fastest Pokemon" claim without deriving it from `CHAMPIONS_MB_DEX` + base-stat data at build time — the numbers must come from the repo, not from a search result.*

---

## 7. `/format/[reg]` hubs — title/description templates

```
title:       "VGC {RegLabel} Teams — Top {RegShort} Team Reports & Builds"
description: "Browse competitive VGC {RegLabel} teams. Full team reports with EV spreads,
              damage calcs, speed tiers, and matchup plans, shared by players who used
              them. {RegNote}"
canonical:   https://pokemonvgcteamreport.com/format/{slug}
```

| Reg | Slug | `RegLabel` | `RegNote` draft |
|---|---|---|---|
| Reg M-B | `reg-m-b` | Regulation M-B | The current Pokemon Champions format, official from 17 June to 2 September 2026 and used at the 2026 World Championships. |
| Reg M-A | `reg-m-a` | Regulation M-A | The first Pokemon Champions format, official from 8 April to 17 June 2026. |
| Reg I | `reg-i` | Regulation I | Scarlet & Violet format allowing up to two Restricted Legendary Pokemon. |
| Reg H | `reg-h` | Regulation H | Scarlet & Violet format with no Legendary, Mythical, or Paradox Pokemon. |
| Reg G | `reg-g` | Regulation G | Scarlet & Violet format allowing up to two Restricted Legendary Pokemon. |

*Regulation date/rule claims must be verified against victoryroad.pro before shipping. Reg A–F entries can reuse the template with a generic `RegNote` or be omitted if report volume is too thin to justify a page.*

**H1 pattern:** `VGC {RegLabel} Teams`

---

## 8. `/ots-generator` — draft metadata

```
title:       "VGC Open Team Sheet Generator — Free OTS Maker"
description: "Generate a clean VGC open team sheet from a Pokemon Showdown paste. Sprites,
              items, abilities, moves, and Tera types laid out for tournament use.
              Free, no account needed."
canonical:   https://pokemonvgcteamreport.com/ots-generator
```

**H1:** `Pokemon VGC Open Team Sheet Generator`

**Intro (~55 words):**
> Paste your Pokemon Showdown export and get a clean open team sheet you can screenshot, print, or share. An open team sheet lists every Pokemon's item, ability, moves, and Tera type, and is required at most VGC events from Day 1 onward. No account required, and nothing you paste is stored unless you choose to publish a report.

*Verify the "required at most VGC events" claim against the current Play! Pokemon rules document before shipping.*

---

## 9. `public/llms.txt` — corrected SP section

**Current text (factually wrong on both counts — replace):**
> **SP (Standard Points) vs EVs:** SP is an alternative stat-expression system used in some reporting contexts. 1 SP = 1 EV (effort value). Both refer to the same underlying game mechanic.

**Draft replacement:**
> **SP (Stat Points) vs EVs:** Pokemon Champions replaces Effort Values with Stat Points. A Pokemon has **66 SP total, with a maximum of 32 SP in any single stat**. At level 50, one Stat Point adds one point to the final stat. Converting an EV spread follows the official Pokemon HOME transfer rule: the first SP in a stat costs 4 EVs and each additional SP costs 8, so 32 SP corresponds to 252 EVs. Champions also locks IVs to 31 and has no Tera types. VGC Team Report converts EV spreads to SP automatically for Champions-format reports and validates the 66/32 budget.

**Also update in `llms.txt`:**
- `Updated:` date → current.
- Format list: add Regulation M-B alongside M-A, noting M-B is the current format (17 June – 2 September 2026) and a superset of M-A.
- Main URLs: add `/champions/{mega-slug}` guide pages and any new routes from this audit once they exist. *(Do not list routes before they ship.)*

---

## 10. Homepage H1 — draft alternatives

Current: `appTitle: "VGC Team"` + `appTitleAccent: "Report"` → renders `VGC Team Report`. Brand-only, no keyword, on the site's highest-authority page.

Options (each keeps "Report" as the accent-coloured word so the visual treatment survives):

- **A (safest):** `appTitle: "VGC Team"` / `appTitleAccent: "Report"` unchanged, but strengthen `appSubtitle` to `"Build, share, and discover competitive Pokemon VGC team reports — free, no account needed"` and promote it to an `<h2>`.
- **B (keyword in H1):** `appTitle: "Build & Share Your VGC Team"` / `appTitleAccent: "Report"`
- **C (tool framing):** `appTitle: "The Free VGC Team"` / `appTitleAccent: "Report Builder"`

**B** is the best balance of keyword coverage and brand retention. All three require parallel edits across the 7 locale files in `src/lib/i18n/translations/` — check that the longer strings don't wrap badly at 320px, and re-run `ui-checklist-reviewer` since this touches rendered UI.

---

## 11. `public/robots.txt` — corrected draft

The named user-agent groups currently override the wildcard group entirely, so `Disallow: /api/` does not apply to Googlebot, Bingbot, or any of the AI crawlers. Each named group needs its own `Disallow` lines:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /embed/

# Explicitly allow major search engine bots
User-agent: Googlebot
Allow: /
Disallow: /api/
Disallow: /embed/

User-agent: Bingbot
Allow: /
Disallow: /api/
Disallow: /embed/

# Explicitly allow AI crawlers
User-agent: GPTBot
Allow: /
Disallow: /api/
Disallow: /embed/

User-agent: ClaudeBot
Allow: /
Disallow: /api/
Disallow: /embed/

User-agent: PerplexityBot
Allow: /
Disallow: /api/
Disallow: /embed/

User-agent: OAI-SearchBot
Allow: /
Disallow: /api/
Disallow: /embed/

Sitemap: https://pokemonvgcteamreport.com/sitemap.xml
```

Simpler alternative: **delete the named groups entirely.** The wildcard group already allows all crawling and disallows `/api/`; the named groups add nothing except the override bug. Keeping them is only worth it if their presence is considered a signal to AI-crawler operators.

---

*End of drafts. Nothing in this file has been published or committed.*
