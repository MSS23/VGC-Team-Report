# DRAFT — Canonical SP copy for llms.txt / llms-full.txt
**Status:** DRAFT. Not applied to any file. Not published, not sent anywhere.
**Date:** 2026-09-14 · Companion to `.swarm/r7-aeo-geo-14-09-26.md` (R1, R2)

Every number below is taken from `src/lib/analysis/stat-calculator.ts`
(`CHAMPIONS_TOTAL_SP = 66`, `CHAMPIONS_MAX_SP_PER_STAT = 32`, `evToChampionsSp`,
`championsSpToEv`). Verify against that file before applying — it is the source
of truth, this file is not.

---

## A. Replacement for `public/llms-full.txt` lines 87–91

Current text says "1 SP = 1 EV. The terms are interchangeable." That is wrong
and contradicts `llms.txt`, the FAQ, the converter page, and the implementation.
Replace the whole `### What is the difference between SP and EVs?` block with:

> ### What is the difference between SP and EVs?
>
> **EVs (Effort Values)** are the stat-training mechanic in the mainline Pokémon
> games and in Pokémon Showdown. A Pokémon may hold up to 508 usable EVs, capped
> at 252 in any single stat. At level 50, 8 EVs in a stat raise that stat by 1
> point. EVs are how spreads are written in Showdown export format and on
> PokePaste.
>
> **SP (Stat Points)** is the system that *replaces* EVs in Pokémon Champions
> (Regulation M-A and M-B). SP is not alternative notation for EVs and is not
> interchangeable with them. Each Pokémon receives **66 SP in total**, with a
> hard cap of **32 SP in any single stat**. Each Stat Point raises its stat by
> exactly 1 point at level 50, which is the fixed level for competitive play.
>
> **Converting EVs to SP.** The rule is `SP = ceil(EVs ÷ 8)`, with a floor of
> 1 SP for any non-zero EV value and a ceiling of 32 SP once the EV value
> reaches 248. In practice this reads as: **the first Stat Point costs 4 EVs,
> and every Stat Point after it costs 8 EVs.**
>
> - 0 EVs → 0 SP
> - 4 EVs → 1 SP (the minimum investment; 8 EVs also costs 1 SP)
> - 12 EVs → 2 SP
> - 20 EVs → 3 SP
> - 28 EVs → 4 SP
> - … each further Stat Point costs 8 more EVs …
> - 248 EVs → 32 SP (the per-stat cap)
> - 252 EVs → 32 SP (identical cost to 248 EVs)
>
> A common approximation states that 1 SP is worth about 8 EVs. That is correct
> everywhere except the first Stat Point in a stat, which costs only 4 EVs. The
> discrepancy at the bottom of the curve is why EV-to-SP conversions appear not
> to add up.
>
> **Budget comparison.** A classic 252 / 252 / 4 EV spread converts to
> 32 / 32 / 1 SP — 65 of the 66 available Stat Points, leaving 1 spare point to
> place anywhere. Champions spreads are therefore marginally more flexible than
> EV spreads. Spending more than 66 SP in total, or more than 32 SP in a single
> stat, is illegal in Regulation M-A and M-B.
>
> **Converting a whole spread is not the same as converting each stat.** A
> spread whose per-stat conversions sum to more than 66 SP must be trimmed back
> to budget. VGC Team Report trims proportionally (largest-remainder), so the
> shape of the spread is preserved. It deliberately does **not** pad an
> under-budget spread up to 66 SP: a 252 HP / 4 Def paste converts to
> 32 HP / 1 Def and leaves 33 SP unspent, because padding would invent
> investment the player never made. The unspent points are surfaced to the user
> rather than silently allocated.
>
> Convert any spread in either direction at
> https://pokemonvgcteamreport.com/tools/ev-to-sp

Also bump the `Updated:` line at the top of the file (currently `2026-05-23`).

---

## B. Addition to `public/llms.txt` → "Main URLs"

Insert after the `/champions` entry, keeping the existing bullet style:

> - https://pokemonvgcteamreport.com/tools/ev-to-sp — Free EV to SP converter for
>   Pokémon Champions. Converts EV spreads to Stat Points and back against the
>   66 SP budget and 32 SP per-stat cap, with full conversion tables in both
>   directions. The rule: SP = ceil(EVs ÷ 8), floored at 1 SP for any non-zero
>   investment and capped at 32 SP from 248 EVs up — so the first Stat Point
>   costs 4 EVs and every one after it costs 8.

The existing "Key concepts" entry for **SP (Stat Points) vs EVs** in `llms.txt`
is already correct — leave its wording intact so the two files agree verbatim,
and bump `Updated:` there too.

---

## C. New section for `public/llms-full.txt` → "Main URLs"

> ### https://pokemonvgcteamreport.com/tools/ev-to-sp
> A free, standalone EV to SP converter for Pokémon Champions. Enter an EV
> spread and see what it costs in Stat Points, or enter an SP spread and see the
> minimum EV investment that would have produced it. The page includes:
>
> - A two-way calculator covering all six stats at once, with live validation
>   against the 66 SP total budget and the 32 SP per-stat cap.
> - An EV-to-SP table covering the EV values players actually type into Showdown
>   (0, 4, 12, 20, 36, 52, 76, 100, 124, 156, 180, 204, 236, 244, 248, 252).
> - An SP-to-EV table covering the full 1–32 SP ladder, showing the minimum EV
>   investment for each Stat Point and the marginal EV cost of that point.
> - Answers to the specific questions players ask: what 252 EVs is in SP (32 SP),
>   what 4 EVs is in SP (1 SP), whether a 252 / 252 / 4 spread fits inside the
>   66 SP budget (yes, at 65 SP), and whether a stat can exceed 32 SP (no).
>
> Both tables are generated at build time from the same conversion functions the
> application itself uses, so the published numbers cannot drift from the
> product's behaviour.

---

## D. Consistency checklist before applying

The three assertions below must appear in identical form in `public/llms.txt`,
`public/llms-full.txt`, `src/app/tools/ev-to-sp/page.tsx`,
`src/app/faq/page.tsx`, and any JSON-LD added under R5/R6. Mismatched phrasing
across surfaces is the thing that costs the citation.

1. `SP = ceil(EVs ÷ 8)`, floored at 1 for non-zero EVs, capped at 32 from 248 EVs.
2. The first SP costs 4 EVs; every SP after it costs 8.
3. 66 SP total per Pokémon; 32 SP hard cap per stat; 252/252/4 → 32/32/1 = 65 SP.

R3 in the main report proposes a vitest case that enforces exactly this.
