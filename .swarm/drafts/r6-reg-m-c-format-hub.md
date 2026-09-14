# DRAFT — `/formats/reg-m-c` content

**Status: UNPUBLISHED DRAFT. Not implemented, not reviewed, not fact-checked against a primary source.**

Companion to `.swarm/r6-seo-audit-14-09-26.md` (QW8 / gap 4 / gap 9).
Target route: `src/app/formats/reg-m-c/page.tsx`, with `/formats` as the cluster index and
`/formats/reg-m-a`, `/formats/reg-m-b` as archived siblings.

> **Blocking caveat.** Every M-C fact below came from search-result summaries — `victoryroad.pro`,
> `pokemon.com`, `metavgc.com` and `stratadex.net` were all blocked by the container egress proxy, so
> nothing here was read first-hand. Sources disagreed on the new-species count (23 vs 29 vs 34 vs 36) and
> on Mega Baxcalibur's ability. **Verify against Serebii's Regulation M-C page before shipping any of this**,
> matching the sourcing discipline already used in `src/lib/data/champions-dex.ts:4-5`. Do not ship an
> unverified count into prerendered HTML or JSON-LD.

---

## Metadata

- **Title:** `Pokemon Champions Reg M-C — Legal Pokemon, Megas & Items`
  (fits under ~60 chars once `layout.tsx:38` appends ` | VGC Team Report`)
- **Description:** `Everything new in Pokemon Champions Regulation M-C (9 Sept – 2 Dec 2026): 6 new Mega Evolutions, the new legal Pokemon, 12 new held items, and the full ruleset. Build your Reg M-C team report free.`
- **Canonical:** `https://pokemonvgcteamreport.com/formats/reg-m-c`
- **Keywords:** Reg M-C, Regulation M-C, Pokemon Champions Reg M-C, Reg M-C legal Pokemon, Reg M-C Megas, Reg M-C banlist, Reg M-C items, what's new in Reg M-C, VGC 2026, Pokemon Champions format
- **JSON-LD:** `BreadcrumbList` (Home → Formats → Reg M-C) + `FAQPage` + `ItemList` of the 6 new Megas.
  Reuse `BreadcrumbListJsonLd`, `FAQPageJsonLd` and `JsonLd` from `src/components/seo/JsonLd.tsx` — do not
  hand-roll new emitters.
- **Sitemap:** `src/app/sitemap.ts`, priority 0.9, `changeFrequency: "weekly"`.
- **Footer:** add to `NAV_LINKS` in `src/components/layout/PageFooter.tsx`.

---

## H1

Pokémon Champions Regulation M-C

## Intro

Regulation M-C is the official Pokémon Champions format from **9 September to 2 December 2026**, replacing
Regulation M-B in Ranked Battles and at Play! Pokémon events — most notably the 2027 Latin America
International Championships.

M-C is **purely additive**. Nothing that was legal in M-B was removed, so every Mega Evolution, Pokémon and
item you were already running is still legal. What changed is what got *added*: six new Mega Evolutions —
including the first "Z" Megas, second Mega forms for Pokémon that already had one — plus a batch of new
species and twelve newly legal held items.

*(Internal link: "Coming from the previous format? See [Regulation M-B](/formats/reg-m-b)." Keeps the M-B
page alive and passes equity down — see gap 10 in the audit.)*

## H2 — The ruleset at a glance

Unchanged from M-A and M-B:

- Doubles, bring 6 / pick 4, Level 50 flat
- **One Mega Evolution per battle**
- No Restricted Legendaries
- **No Terastallization**
- Species Clause and Item Clause
- **Stat Points (SP), not EVs** — 66 SP total per Pokémon, maximum 32 SP in any one stat

New in M-C: 6 Mega Evolutions, new base species, 12 held items.

*(Internal link → `/tools/ev-to-sp`: "Converting a Showdown EV spread? Use the free EV → SP converter.")*

## H2 — The 6 new Mega Evolutions

One `<h3>` per Mega, each linking to its `/champions/{slug}` guide page once QW7 lands.

| Mega | Ability | Mega Stone |
|---|---|---|
| Mega Absol Z | Sharpness | Absolite Z |
| Mega Garchomp Z | Levitate | Garchompite Z |
| Mega Lucario Z | Aura Guard | Lucarionite Z |
| Mega Salamence | Aerilate | Salamencite |
| Mega Golisopod | Tough Claws | Golisopite |
| Mega Baxcalibur | Thermal Exchange | Baxcalibrite |

**The Z Megas are the structurally new thing.** Absol, Garchomp and Lucario already had Mega forms legal since
M-A; the Z variants are *second* Mega forms with different abilities and stat spreads, so "Mega Garchomp" and
"Mega Garchomp Z" are now two distinct, separately-buildable Pokémon. Worth calling out explicitly — it's the
detail readers will search for, and it's the one our data model has to represent correctly
(`mega-pokemon.ts` already handles the two-form case for Charizard X/Y, Mewtwo X/Y and Raichu X/Y).

Per-Mega copy should stay **factual only** — typing, ability, stone, base stats, BST. Do **not** draft
"best SP spread" claims here; `src/app/champions/[pokemon]/page.tsx:245-250` documents exactly why invented
spread claims in structured data are a manual-action risk, and that rule applies to body copy too. Let the
community reports on `/explore` supply the spreads.

## H2 — New Pokémon in Reg M-C

**Count unverified — confirm before writing.** Names seen across sources: Rillaboom, Cinderace, Inteleon,
Indeedee (both forms), Squawkabilly, Toxtricity, Pincurchin, Alolan Persian, Galarian Farfetch'd, and the
rest of the Galar starters line.

Rillaboom is worth its own callout — early M-C usage puts it around 37.6%, the most-used Pokémon in the
format. That's the single highest-intent query in this whole section.

## H2 — 12 new held items

Air Balloon · Binding Band · Eject Button · Electric Seed · Grassy Seed · Misty Seed · Psychic Seed · Leek ·
Normal Gem · Red Card · Rocky Helmet · Terrain Extender

Plus the 6 new Mega Stones listed above. One line of competitive context each (Terrain Extender + the Seeds
arriving together with Rillaboom is the obvious narrative), no invented usage numbers.

## H2 — FAQ *(feeds the `FAQPage` JSON-LD)*

Every answer must be derivable from first-party data or a cited primary source, matching the discipline in
`champions/[pokemon]/page.tsx:236-275`.

1. **When does Regulation M-C start and end?** 9 September – 2 December 2026.
2. **Is Regulation M-C different from Regulation M-B?** M-C is a superset — everything M-B-legal is still legal,
   plus new Megas, Pokémon and items.
3. **What are the new Mega Evolutions in Reg M-C?** The six above.
4. **What is a Z Mega Evolution?** A second Mega form for a Pokémon that already had one — Absol, Garchomp and
   Lucario each gain a Z variant with a different ability and stat spread.
5. **Are Restricted Legendaries allowed in Reg M-C?** No.
6. **Does Reg M-C use EVs or SP?** SP — 66 total, 32 max per stat. *(link → `/tools/ev-to-sp`)*
7. **Can I still use my Reg M-B team in Reg M-C?** Yes; M-C is additive.
8. **Where can I find Reg M-C team reports?** *(link → `/explore?regulation=Reg+M-C`)*

## H2 — Build your Reg M-C team report

Single CTA to `/` (the paste box). One primary CTA per screen, per the UI standards in
`.claude/skills/ui-ux-pro-max/SKILL.md`.

---

## Internal linking plan

**Inbound:** `PageFooter.tsx` (sitewide) · `/champions` hub · all 78 `/champions/{slug}` pages via a
"Legal in Regulation M-C" badge linking here · `/tools/ev-to-sp` · `/faq`.

**Outbound:** 6 new `/champions/{slug}` pages · `/formats/reg-m-b` · `/tools/ev-to-sp` ·
`/explore?regulation=Reg+M-C` · `/tournaments` · `/` .

This makes `/formats/reg-m-c` the cluster hub for the rotation and gives the 6 new Mega pages inbound links
from day one, instead of leaving them reachable only from the `/champions` grid — the exact failure mode
recorded as VGC-258 in `champions/[pokemon]/page.tsx:20-30`.
