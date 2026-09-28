# DRAFT COPY ONLY — r6 SEO, 28-09-2026

> **NOT IMPLEMENTED. NOT PUBLISHED. NOTHING SUBMITTED TO ANY SEARCH ENGINE.**
> Every string below is a proposal for human review. Legality claims must be re-verified against
> Victory Road / Serebii / pokemon.com before any of this ships — do not trust this file as a data source.

## Verify-first checklist (before any of this copy is used)
- [ ] Exact M-C legal Mega list (this draft assumes M-C = M-B superset + Salamence, Golisopod, Baxcalibur, Absol-Z, Garchomp-Z, Lucario-Z = **81**). **Count is unconfirmed — verify.**
- [ ] Whether Z Megas consume the Mega slot, use a distinct item class, or follow separate team-construction rules.
- [ ] Whether SP budget (66 total / 32 per stat) is unchanged in M-C.
- [ ] The 24 newly-legal non-Mega species.

---

## 1. `/champions` hub — replacement metadata (D1)

```
title:       "Pokemon Champions Format | Reg M-C, M-B & M-A Mega Teams"
description: "Explore Pokemon Champions team reports for Regulation M-C, M-B and M-A. Every legal
              Mega Evolution including the new Z Mega Evolutions, plus matchup analysis, SP spreads,
              and team breakdowns from the competitive community."
keywords:    ["Pokemon Champions", "Regulation M-C", "Reg M-C", "Reg M-C Megas",
              "Z Mega Evolution", "Regulation M-B", "Regulation M-A",
              "Pokemon Champions team builder", "Mega Evolution VGC",
              "Pokemon Champions competitive", "VGC 2026", "VGC team report"]
```

ItemList JSON-LD `name` / `description`:
```
name:        "VGC Champions Format Pokémon — Regulation M-C"
description: "Every Mega Evolution legal in the Pokemon Champions Regulation M-C competitive format
              (VGC 2026). Reg M-C is a superset of Reg M-B and Reg M-A."
```

## 2. Mega guide pages — `regulationCopy()` prose (D7)

Proposed shape (needs an `M-C` arm added to the `"M-A" | "M-B"` union):

| Earliest legal reg | `legalIn` prose | `keywords` |
|---|---|---|
| M-A | "Regulation M-A, M-B and M-C" | `["Regulation M-A","Regulation M-B","Regulation M-C"]` |
| M-B | "Regulation M-B and M-C" | `["Regulation M-B","Regulation M-C"]` |
| M-C | "Regulation M-C" | `["Regulation M-C"]` |

## 3. New M-C Mega entries — description drafts (D2)

Mechanics claims here are **especially** unverified. Confirm abilities and stones first.

```
Mega Salamence   — "Mega Salamence pairs Aerilate-boosted Hyper Voice with a huge 145 base Attack,
                    making it one of the most threatening spread attackers in Regulation M-C."
Mega Golisopod   — "Mega Golisopod brings Bug/Water bulk and First Impression pressure to
                    Regulation M-C, newly legal in the Champions format."
Mega Baxcalibur  — "Mega Baxcalibur is a Dragon/Ice physical breaker, newly legal in Pokemon
                    Champions Regulation M-C."
Mega Absol Z     — "Mega Absol Z is one of three new Z Mega Evolutions introduced in Regulation M-C."
Mega Garchomp Z  — "Mega Garchomp Z is one of three new Z Mega Evolutions introduced in Regulation M-C."
Mega Lucario Z   — "Mega Lucario Z is one of three new Z Mega Evolutions introduced in Regulation M-C."
```

## 4. New page: `/champions/reg-m-c` format hub (K1)

```
title:       "Pokemon Champions Reg M-C — Legal Pokemon, Megas & Team Rules"
description: "Complete Pokemon Champions Regulation M-C guide: every legal Mega Evolution, the new
              Z Mega Evolutions, newly added species, SP budget rules, and team-construction
              restrictions. Active September 8 to December 1, 2026."
h1:          "Pokemon Champions Regulation M-C"
canonical:   https://pokemonvgcteamreport.com/champions/reg-m-c
```
Suggested sections: what changed from M-B · new Megas · Z Mega Evolution explainer · new species ·
SP budget (66 / 32) · restricted rules · legality checker deep link · M-A vs M-B vs M-C table.
Schema: `Article` + `FAQPage` + `BreadcrumbList`.

## 5. New page: `/tools/speed-tiers` (K9)

```
title:       "VGC Speed Tiers — Pokemon Champions Reg M-C"
description: "Interactive Reg M-C speed tier chart. Compare your Pokemon's Speed against the
              Champions metagame at every SP investment, nature, and Tailwind or Trick Room state."
```

## 6. New page: `/champions/meta` (K5)

```
title:       "Reg M-C Usage Stats & Metagame Report"
description: "Pokemon Champions Regulation M-C usage statistics and metagame breakdown: most-used
              Pokemon, common two- and three-Pokemon cores, and the team archetypes to prepare for."
```
Do **not** copy Pikalytics' numbers. Derive from this site's own `/api/champions/meta` and label the
sample size and date range explicitly on the page.

## 7. `llms.txt` / `llms-full.txt` regulation lines (both files, 2 and 4 open PRs — high conflict)

Replace M-A-only phrasings. Current `Updated: 2026-05-23` is four months stale in both files.
```
- **Champions format support.** Full support for Pokemon Champions Regulation M-C (current), M-B and
  M-A — Mega Evolutions, Z Mega Evolutions, and restricted legendaries — plus all standard Scarlet &
  Violet regulation sets.
- **Regulation / Format:** VGC rotates formats seasonally. Champions Regulation M-C is the current
  format (September 8 – December 1, 2026); M-B and M-A preceded it. Reg G and Reg H are recent
  standard Scarlet & Violet formats.
```

## 8. Root FAQ JSON-LD — `DEFAULT_FAQ_ITEMS` in `src/components/seo/JsonLd.tsx` (1 open PR)

The entry "What is Pokemon Champions Regulation M-A?" is the site's most-syndicated answer and is now
two regulations stale. Proposed replacement question + answer:
```
Q: What is Pokemon Champions Regulation M-C?
A: Pokemon Champions Regulation M-C is the current competitive VGC format, running from September 8 to
   December 1, 2026. It keeps every Pokemon legal in the earlier M-A and M-B regulation sets and adds
   six new Mega Evolutions — including the first Z Mega Evolutions — plus 24 additional species.
   Champions formats use SP (Stat Points, 66 total with a maximum of 32 per stat) instead of EVs.
   VGC Team Report supports building and sharing team reports in this format.
```
