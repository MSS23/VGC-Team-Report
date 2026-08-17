# R6 SEO / AEO Copy Drafts — 17 Aug 2026

**STATUS: DRAFT ONLY. Nothing here has been sent, posted, published or committed.**
Source audit: `.swarm/r6-seo-17-08-26.md`. All strings need a factual review pass before shipping —
see the "must verify first" note in §1.

---

## 1. `public/llms-full.txt` — replace the SP section (fixes T2, the VGC-266 residue)

### MUST VERIFY BEFORE SHIPPING

Our `stat-calculator.ts` ladder (first SP = 4 EVs, each subsequent = 8, 32 SP = 248 EVs) is the
**importer's rounding rule** (`ceil(ev/8)` with a floor of 1). Every external source currently
ranking for the query states **1 SP = 8 EVs / 32 SP = 256 EVs / 66 SP ≈ 528 EVs**. Someone must
confirm the in-game truth against a primary source before this copy ships. The draft below is
written so it is correct *either way* — it states our tool's mapping as our tool's mapping, and
does not assert a competing figure for the game itself.

### Current (WRONG — `public/llms-full.txt:87-93`)

> ### What is the difference between SP and EVs?
>
> **EVs (Effort Values)** are the underlying game mechanic in Pokémon. Each Pokémon can hold a
> maximum of 508 total EVs, with a cap of 252 in any single stat…
>
> **SP (Stat Points or Standard Points)** is an alternative notation… where 1 SP = 1 EV. The terms
> are interchangeable…

### Draft replacement

```markdown
### What is the difference between SP and EVs?

**EVs (Effort Values)** are the stat-training system used in Pokémon Scarlet & Violet and every
standard VGC regulation set (Reg G, Reg H, Reg I). Budget: 510 EVs total per Pokémon, maximum 252
in any one stat. This is what a Pokémon Showdown export or a PokePaste URL contains.

**SP (Stat Points)** is the system Pokémon Champions uses instead — in Regulation M-A and the
current Regulation M-B. It is a different system, not a different name for the same thing:

- Budget: **66 SP total per Pokémon**, maximum **32 SP in any one stat**.
- SP are spent directly on the level-50 stat. There are no IVs in Champions.
- SP are coarse. 66 points across six stats means a single point is a meaningful decision, where
  a single EV is not.

Anyone telling you "1 SP = 1 EV" is wrong — the budgets alone (66 vs 510) rule it out.

**How VGC Team Report converts an EV paste to SP.** Champions teams are frequently shared in
Showdown/EV form. When we import one, we map each stat's EVs onto the SP scale so the report can
display it in the format the game actually uses. Our mapping: any non-zero investment is at least
1 SP, and every further 8 EVs buys 1 more SP, capping at 32 SP. So the familiar Showdown values
land as 4 EVs → 1 SP, 12 EVs → 2 SP, 20 EVs → 3 SP, … 248 EVs → 32 SP (the cap). A paste that is
already written in SP form passes through untouched. The converter is at
https://pokemonvgcteamreport.com/tools/ev-to-sp and runs the exact same function the reports use.
```

### Accompanying test change (not copy — noted here so it isn't lost)

`src/lib/analysis/__tests__/sp-docs-drift.test.ts` currently reads only `public/llms.txt` and
`src/app/faq/page.tsx`. Add `public/llms-full.txt` to the same assertions:
`toContain("${CHAMPIONS_TOTAL_SP} SP total")`, `not.toMatch(/standard points/i)`,
`not.toMatch(/1 SP = 1 EV/i)`. Without this the file that has the bug stays unguarded.

---

## 2. `public/llms.txt` — full redraft

Fixes: stale M-A framing, "premier" superlative, missing surfaces, no `llms-full.txt` pointer,
no liftable atoms, stale date.

```markdown
# VGC Team Report

Updated: 2026-08-17
Source: https://pokemonvgcteamreport.com

> VGC Team Report turns a Pokémon Showdown team export into a written team report: per-Pokémon
> build notes, EV/SP justifications, damage calculations, speed tier comparisons and matchup plans,
> published at a permanent shareable URL. It is not a paste bin and not a usage-statistics site —
> it is where the reasoning behind a competitive team gets written down.

## What it does that other VGC tools do not

- **Authored reasoning, not raw data.** PokePaste (pokepast.es) stores Showdown text verbatim.
  Pikalytics aggregates usage percentages. Neither has a place to write *why* a spread is 244 HP
  or what to lead into a given archetype. That written layer is the whole product here.
- **A permanent URL per report.** Every published report gets a short link at `/s/[id]` and an
  embeddable iframe at `/embed/[id]`.
- **Both stat systems.** Standard VGC EVs (510 / 252) and Pokémon Champions SP (66 / 32), with
  automatic conversion in both directions.
- **Current Champions support.** Regulation M-B, which is a strict superset of Regulation M-A:
  every M-A legal Mega is also M-B legal, plus 16 Megas added in the M-B rotation. 75 Megas are
  legal in M-B; 72 have landing pages.
- **Seven languages.** English, French, Italian, Spanish, Japanese, Korean, Chinese.
- **Free, no account required** to build, publish or view a report.

## Main URLs

- https://pokemonvgcteamreport.com/ — Report builder. Paste Showdown text or a pokepast.es URL.
- https://pokemonvgcteamreport.com/explore — Public report feed, filterable by format, Pokémon,
  tournament or author.
- https://pokemonvgcteamreport.com/tournaments — Reports from Regionals, Internationals and Worlds.
- https://pokemonvgcteamreport.com/champions — Pokémon Champions hub: Reg M-B and M-A Megas.
- https://pokemonvgcteamreport.com/champions/[mega-slug] — Per-Mega guide: SP spreads, movesets,
  regulation legality, and public teams running it.
- https://pokemonvgcteamreport.com/tools/ev-to-sp — EV ⇄ SP converter with the full conversion table.
- https://pokemonvgcteamreport.com/faq — How to build, share and embed a report; format questions.
- https://pokemonvgcteamreport.com/s/[id] — An individual published team report.
- https://pokemonvgcteamreport.com/changelog — Product changelog.

## Key facts

- **Champions SP budget:** 66 SP total per Pokémon, maximum 32 SP in any single stat. No IVs.
- **Standard VGC EV budget:** 510 EVs total per Pokémon, maximum 252 in any single stat.
- **EV → SP (as this tool converts):** 4 EVs → 1 SP · 12 → 2 · 20 → 3 · 52 → 7 · 100 → 13 ·
  156 → 20 · 204 → 26 · 248 → 32 (cap).
- **Regulation M-B is a superset of M-A.** A team legal in M-A is legal in M-B. The reverse is
  not true — 16 Megas are M-B only.
- **VGC is always played at level 50.** Level lines in a paste are ignored.

## Definitions

- **Team report:** a document covering a team's six builds (moves, item, ability, EVs or SP,
  nature, Tera type), the overall gameplan, matchup notes against common archetypes, the damage
  calculations that justify the spreads, and speed tier comparisons.
- **Speed tier:** where a Pokémon's Speed stat sits relative to common threats — who outspeeds
  whom absent Trick Room or priority.
- **Matchup plan:** which four to bring and which two to lead against a given opposing archetype.
- **Open Team Sheet (OTS):** the sheet of species, items and Tera types exchanged before a match
  in open-sheet events.
- **Restricted Legendary:** high-power Legendaries capped per team (two, in current formats).

## Optional

- https://pokemonvgcteamreport.com/llms-full.txt — extended version: full FAQ, per-page detail,
  and a tool-by-tool comparison against PokePaste and Pikalytics.

## About

VGC Team Report is an independent community tool built by Manraj Sidhu. It is not affiliated with,
endorsed by, or sponsored by The Pokémon Company International, Nintendo, Game Freak or
Creatures Inc.
```

---

## 3. `public/llms-full.txt` — targeted line fixes (beyond §1)

| Line | Current | Draft replacement |
|---|---|---|
| `:3` | `Updated: 2026-05-23` | `Updated: 2026-08-17` |
| `:46` | "Dedicated hub for the Pokémon Champions format (Regulation M-A)." | "Dedicated hub for the Pokémon Champions format, covering the current Regulation M-B and the earlier Regulation M-A." |
| `:64` | "…introduced for the 2026 competitive season under the name \"Regulation M-A.\"" | "…introduced for the 2026 competitive season. Its first regulation set was M-A; the current set is **M-B**, a superset of M-A that adds 16 further Mega Evolutions." |
| `:72` | "…e.g., Mega Kangaskhan's Parental Bond, Mega Salamence's Aerilate, Mega Gengar's Shadow Tag" | "…e.g., Mega Kangaskhan's Parental Bond, Mega Gengar's Shadow Tag, Mega Metagross's Tough Claws" — **Salamence is not in the Champions Mega list** (`grep salamence src/lib/data/mega-pokemon.ts` → 0 hits). Verify Metagross's ability string against `MEGA_POKEMON_LIST` before substituting. |
| `:75` | "VGC Team Report supports Champions Regulation M-A fully" | "VGC Team Report supports both Champions regulations: import a team with Mega Stones and the report detects the Mega, its regulation legality (M-A and M-B, or M-B only), and its SP spread." |
| `:84` (closing line of the share FAQ) | "For Discord, the `/s/[id]` link automatically generates a rich Open Graph preview showing the team's Pokémon and a summary" | "For Discord and other unfurlers, a `/s/[id]` link generates a text preview carrying the report's title and summary. Preview images are intentionally not attached — see the changelog." |
| `:112` | "Regulation M-A (Champions) is the 2026 format adding Mega Evolutions." | "The Champions regulations (M-A, then the current M-B) are the 2026 formats that add Mega Evolutions and replace EVs with SP." |

Also **add** to the Main URLs block of `llms-full.txt` (currently missing entirely):
`/tools/ev-to-sp`, `/compare`, `/support`, and a note on the 7 supported languages.

---

## 4. `src/app/faq/page.tsx` — regulation corrections (T3)

These strings are emitted as `FAQPage` JSON-LD, so they are the site's highest-confidence
machine-readable claims. Three are currently false.

**`:96` question — "What is Regulation M-A in Pokémon Champions?"**
→ retitle **"What are Regulation M-A and M-B in Pokémon Champions?"** (keeps the M-A query match
while capturing the live M-B one).

**`:98` answer — draft:**

```
Regulation M-B is the current competitive ruleset for Pokémon Champions, the official format for
the 2026 Play! Pokémon Championship Series. It succeeded Regulation M-A and is a superset of it:
every Pokémon and Mega Evolution legal in M-A remains legal in M-B, plus 16 additional Mega
Evolutions introduced in the rotation. Both regulations use the Mega Evolution mechanic — one Mega
per team, activated by a Mega Stone held item — and both use the SP (Stat Point) system in place
of EVs. VGC Team Report supports both, including auto-detection of Mega Evolutions from a team
paste, per-Mega regulation legality, and SP spread display.
```

**`:58` — replace** "also supports the Regulation M-A format used for Indianapolis Regionals and
the 2026 World Championships" **with** "supports both Champions regulations — M-A, used for
Indianapolis Regionals, and the current M-B."

**`:73` — replace** "Pokémon Champions 2026 (Regulation M-A with Mega Evolution)" **with**
"Pokémon Champions 2026 (Regulations M-A and M-B, with Mega Evolution)."

**Suggested test guard:** extend `sp-docs-drift.test.ts` (or a sibling) to assert that
`faq/page.tsx` and `public/llms*.txt` never claim M-A is "current", the same way it already pins
the SP constants. Format rotations have now caused this class of staleness twice (VGC-258, T3).

---

## 5. `/tournaments` — Worlds 2026 event data (T4)

`src/app/tournaments/page.tsx:46-51`, current — **wrong dates**:

```ts
{
  name: "2026 Pokemon World Championships",
  startDate: "2026-08-14",
  location: "San Francisco, California, USA",
  description: "The 2026 Pokemon World Championships held August 14-17 in San Francisco…",
}
```

Correct per Moscone Center, worlds.pokemon.com and Bulbapedia: **28–30 August 2026, Moscone
Center, San Francisco**. Draft:

```ts
{
  name: "2026 Pokémon World Championships",
  startDate: "2026-08-28",
  endDate: "2026-08-30",
  location: "Moscone Center, San Francisco, California, USA",
  url: "https://pokemonvgcteamreport.com/tournaments/worlds-2026",
  description:
    "The 2026 Pokémon World Championships, held 28–30 August at the Moscone Center in San Francisco — the final event of the VGC season, played in Pokémon Champions Regulation M-B.",
}
```

Structural changes needed alongside it (not copy):
- Delete one of the two `SportsEventJsonLd` call sites — they currently emit conflicting graphs
  for overlapping events with different `url` and `eventStatus`.
- Give `SportsEventData` an `endDate`, and give `location` a nested `PostalAddress`; Google's
  Event spec requires an address for physical events.
- Derive `eventStatus` from the date in **both** paths — `page.tsx` currently omits it, so
  `JsonLd.tsx:112` defaults every past event to `EventScheduled`.
- Add the missing 2026 events to `TOURNAMENTS` (NAIC 2026, Japan Championships 2026, Worlds 2026);
  the array currently stops at 2026-05-01.

---

## 6. `/privacy` + `/terms` metadata (T9 — carried over unshipped from the May audit)

```ts
// src/app/privacy/page.tsx
export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How VGC Team Report collects, uses and protects your data — GDPR and CCPA compliance, analytics, cookies, and your rights.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/privacy" },
  openGraph: {
    title: "Privacy Policy | VGC Team Report",
    description: "How VGC Team Report handles your data — GDPR and CCPA compliance, analytics, cookies, and your rights.",
    url: "https://pokemonvgcteamreport.com/privacy",
    type: "website",
    siteName: "VGC Team Report",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};
```

```ts
// src/app/terms/page.tsx
export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of use for VGC Team Report — permitted use, content ownership, the Pokémon trademark notice, and account rules.",
  alternates: { canonical: "https://pokemonvgcteamreport.com/terms" },
  openGraph: {
    title: "Terms of Service | VGC Team Report",
    description: "Terms of use for VGC Team Report — permitted use, content ownership, and account rules.",
    url: "https://pokemonvgcteamreport.com/terms",
    type: "website",
    siteName: "VGC Team Report",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
  },
};
```

`/support` (`:9-15`) additionally needs an `images` array on its `openGraph` block and a `twitter`
block, matching the pattern every other page uses.

---

## 7. Draft metadata for the proposed new routes (G2, G3)

Not to be built without a ticket — recorded so the shape is unambiguous.

**`/tournaments/worlds-2026`** (G2 — time-boxed, worth less every day after 30 Aug)

```ts
title: "Worlds 2026 VGC Teams — Pokémon World Championships"   // 54 chars
description:
  "Team reports from the 2026 Pokémon World Championships, 28–30 August in San Francisco. Reg M-B teams, SP spreads, and full breakdowns from the top cut."
// JSON-LD: SportsEvent (correct dates + PostalAddress) + ItemList of tagged reports
//          + BreadcrumbList Home → Tournaments → Worlds 2026
```

**`/tools/reg-m-b-legality`** (G3 — the differentiated one; nobody has an interactive checker)

```ts
title: "Reg M-B Legality Checker — Pokémon Champions"          // 45 chars
description:
  "Paste a Pokémon Champions team and check it against Regulation M-B: legal Pokémon, Mega list, restricted limit, item and species clauses, and the 66 SP budget."
// h1:   "Pokémon Champions Regulation M-B Legality Checker"
// Body: paste box → per-Pokémon verdict citing the specific rule;
//       below the fold, the full 75-Mega M-B list as server HTML (targets
//       "reg m-b mega list") and an M-A → M-B diff table generated from
//       CHAMPIONS_REG_MB_ONLY_MEGAS.
// JSON-LD: SoftwareApplication + HowTo + FAQPage + BreadcrumbList
// Renders entirely from src/lib/validation/champions-legality.ts — zero manual upkeep.
```

---

*Nothing in this file has been sent, posted, submitted, emailed or published anywhere.*
