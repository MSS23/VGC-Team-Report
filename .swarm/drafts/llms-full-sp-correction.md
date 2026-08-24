# DRAFT — correction text for `public/llms-full.txt`

Not applied. R7 is read-only; this is proposed replacement copy for a human to apply.

Context: commit `1db8419` ("VGC-266: correct SP definition in llms.txt and FAQ") fixed
`public/llms.txt` and `src/app/faq/page.tsx` but missed `public/llms-full.txt`, which still
carries the pre-VGC-266 wrong definition.

---

## 1. REPLACE the "What is the difference between SP and EVs?" section

**Current (WRONG — remove entirely):**

> **EVs (Effort Values)** are the underlying game mechanic in Pokémon. Each Pokémon can hold a
> maximum of 508 total EVs, with a cap of 252 in any single stat. 4 EVs = 1 stat point at level 50
> (for most stats). EVs are the standard way to describe a Pokémon's training in Showdown format
> and PokePaste.
>
> **SP (Stat Points or Standard Points)** is an alternative notation sometimes used in team reports
> and competitive coaching content — particularly in some international communities — where
> 1 SP = 1 EV. The terms are interchangeable. If you see a Pokémon listed with "252 SP Atk" it means
> the same thing as "252 EVs in Attack" (i.e., 252 Attack EVs).
>
> VGC Team Report accepts both notations when importing and displays EVs in the standard Showdown
> format on all report pages.

Errors: (a) SP is not alternative notation for EVs; it is the Champions stat system.
(b) 1 SP ≠ 1 EV. (c) The terms are not interchangeable. (d) "252 SP Atk" is not a legal value —
the per-stat cap is 32 SP. (e) The EV total is 510, not 508.

**Proposed replacement:**

```markdown
### What is the difference between SP and EVs?

**EVs (Effort Values)** are the stat-investment mechanic in the mainline Pokémon games and in
Pokémon Showdown. Each Pokémon has 510 EVs to spend, with a cap of 252 in any single stat, and
4 EVs buy 1 point of a stat at level 50. This is the system used by every standard VGC regulation
(Reg G, Reg H, and earlier).

**SP (Stat Points)** is the system that *replaces* EVs in Pokémon Champions (Regulation M-A and
M-B). It is not alternative notation for EVs — it is a different budget with different maths:

- **66 SP** total per Pokémon (versus 510 EVs).
- **32 SP** maximum in any one stat (versus 252 EVs).
- 1 SP adds 1 point to the final stat at level 50.

The conversion is **not** 1:1. The first Stat Point in a stat costs 4 EVs, and every Stat Point
after that costs 8 EVs — so `SP = ceil(EVs / 8)`, with a floor of 1 SP for any non-zero EV value
and a ceiling of 32 SP. Worked examples:

| EVs | SP |
|-----|----|
| 0   | 0  |
| 4   | 1  |
| 12  | 2  |
| 20  | 3  |
| 100 | 13 |
| 248 | 32 |
| 252 | 32 |

Because 248 and 252 EVs both convert to the 32 SP cap, the classic "248 HP" bulk-optimising trick
costs exactly the same in Champions as a full 252 investment. A classic 252 / 252 / 4 spread
converts to 32 / 32 / 1 = 65 SP, leaving 1 spare point — Champions spreads are marginally more
flexible than EV spreads for this reason.

VGC Team Report auto-detects Champions-format teams and converts EV-form pastes to SP on import
(SP-form pastes pass through unchanged), so you can paste a Showdown team written either way.
A standalone converter is available at
https://pokemonvgcteamreport.com/tools/ev-to-sp
```

## 2. ADD to the "Main URLs" section of `llms-full.txt`

```markdown
### https://pokemonvgcteamreport.com/tools/ev-to-sp
Free EV ⇄ SP converter for Pokémon Champions (Regulation M-A and M-B). Converts an EV spread to
Stat Points and back, validates against the 66 SP total budget and the 32 SP per-stat cap, and
includes full conversion tables in both directions plus answers to the common conversion questions
("what is 252 EVs in SP?", "why doesn't the maths add up?"). Static page, no account needed.
```

## 3. ADD to the "Main URLs" list in `public/llms.txt`

```markdown
- https://pokemonvgcteamreport.com/tools/ev-to-sp — EV to SP converter for Pokémon Champions.
  Convert EV spreads to Stat Points and back against the 66 SP budget and 32 SP per-stat cap.
```

Also missing from that list and worth adding:

```markdown
- https://pokemonvgcteamreport.com/creator/[name] — Per-creator pages collecting every public
  team report by one author.
- https://pokemonvgcteamreport.com/embed/[id] — Embeddable read-only widget version of any
  public report.
```

## 4. Regulation refresh (both files)

`llms-full.txt` mentions Reg M-B zero times and calls M-A "the 2026 format". `src/app/sitemap.ts`
states M-B is the current Champions regulation and a superset of M-A. Update both files so M-B is
described as current and M-A as the earlier ruleset it extends.

## 5. Freshness header (both files)

Both declare `Updated: 2026-05-23`. `llms.txt` was actually last edited 2026-08-13. Set both to the
date the correction ships, and treat this header as something to bump whenever either file changes.

---

## Suggested commit

```
VGC-XX: correct SP definition in llms-full.txt (missed by VGC-266)

VGC-266 fixed llms.txt and the FAQ but left llms-full.txt asserting
"1 SP = 1 EV, the terms are interchangeable" and a 508 EV cap. Replace with
the Champions 66 SP / 32 per-stat budget and the 4-then-8 EV conversion,
matching stat-calculator.ts. Also list /tools/ev-to-sp in both files, promote
Reg M-B to current, and bump the Updated: headers.
```
