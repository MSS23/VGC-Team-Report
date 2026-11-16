# R6 — SEO copy drafts (16 Nov 2026)

DRAFT ONLY. Nothing here has been applied to source. Nothing has been published,
submitted or posted anywhere. Companion to `.swarm/r6-seo-16-11-26.md`.

Char counts are of the **final** `<title>` including the root layout's
`%s | VGC Team Report` template (+19 chars). Budget: ≤60.

---

## 1. Title fixes (over-budget today)

### `src/app/champions/[pokemon]/page.tsx` — ×81 pages

Today: `` `${mega.displayName} VGC Guide — SP Spreads, Movesets & Teams` ``
→ final 76–78 chars (`Mega Crabominable …` = 78).

Option A (keep the brand suffix, shorten the page title):

```
`${mega.displayName} VGC Guide — SP Spreads & Sets`
```
- `Mega Garchomp VGC Guide — SP Spreads & Sets | VGC Team Report` = 60
- `Mega Crabominable VGC Guide — SP Spreads & Sets | VGC Team Report` = 64 ← still over

Option B (recommended — `title: { absolute }`, drops the suffix, full control):

```
title: { absolute: `${mega.displayName} VGC Guide — SP Spreads, Sets & Teams` }
```
- `Mega Garchomp VGC Guide — SP Spreads, Sets & Teams` = 49
- `Mega Crabominable VGC Guide — SP Spreads, Sets & Teams` = 53
- Longest display name in `MEGA_POKEMON_LIST` must be checked before shipping;
  budget allows a 42-char display name.

### `src/app/champions/page.tsx`

Today: `Pokemon Champions Format | Reg M-C Mega Teams & Z Megas` → final 77.

```
title: { absolute: "Pokemon Champions Format — Reg M-C Megas & Teams" }   // 48
```

### `src/app/tournaments/page.tsx`

Today: `VGC Tournament Results Archive | Team Reports 2026` → final 68.

```
title: "VGC Tournament Results & Team Reports"   // 37 + 19 = 56
```

### `src/app/explore/page.tsx`

Today: `Best VGC Teams 2026 — Explore Top Team Reports` → final 66.

```
title: "Best VGC Teams 2026 — Top Team Reports"   // 38 + 19 = 57
```

### `src/app/support/page.tsx` — self-duplicating title

Today: `Support VGC Team Report | VGC Team Report`.

```
title: { absolute: "Support VGC Team Report" }
```

---

## 2. `/tools/ev-to-sp` de-staling (M-A → M-A/M-B/M-C)

The page is the site's strongest tool-shaped ranking asset and currently
self-excludes from every current-format query. Three strings:

`DESCRIPTION` (keep ≤160 chars of payload up front):

```
"Free EV to SP converter for Pokémon Champions Regulation M-A, M-B and M-C. Convert EV spreads to Stat Points and back against the 66 SP budget and 32 SP per-stat cap."
```
(166 chars — trim `and back` to land at 157 if you want it inside Google's cut.)

`keywords` — replace `"Regulation M-A SP spread"` with:

```
"Regulation M-C SP spread",
"Regulation M-B SP spread",
"Regulation M-A SP spread",
"how do Stat Points work",
"SP vs EVs Pokemon Champions",
"66 SP budget",
```

Body copy: the page body contains 2 occurrences of the literal
`Regulation M-A` (verified in `.next/server/app/tools/ev-to-sp.html`). Both
should read `Regulation M-A, M-B and M-C` or `every Champions regulation`.

**Content opportunity on the same page** (see report §4, gap 1): the SERP
currently carries two conflicting conversion rules — ChampDex states the
repo's rule (first SP = 4 EVs, each later SP = 8 EVs, 252 EVs → 32 SP) while
several other sites state a flat 8 EVs per SP and a 528-EV pool. Add a short
"Why you'll see two different answers" block stating the repo's rule and the
cap arithmetic. **Do not assert which is official** — the brief's rule stands:
verify against the official rules text before publishing an authority claim.

---

## 3. New page: `/champions/mega-stones` (gap 2)

Zero new data — every field below already exists on each
`MEGA_POKEMON_LIST` entry (`megaStone`, `ability`, `types`, `displayName`,
`baseName`, `slug`, regulation via `getMegaRegulation`).

```
title:       { absolute: "Every Mega Stone in Pokémon Champions" }        // 37
description: "Every Mega Stone in Pokémon Champions Regulation M-C: which Pokémon it Mega Evolves, the resulting typing, the Mega ability, and the regulation it became legal in."
canonical:   https://pokemonvgcteamreport.com/champions/mega-stones
```

H1: `Every Mega Stone in Pokémon Champions`

Intro (2 sentences, no invented facts):

> Pokémon Champions gives each Mega Evolution its own held Mega Stone. This
> table lists every stone legal in Regulation M-C, the Pokémon it Mega Evolves,
> the form's typing and ability, and the regulation the Mega was introduced in.

Table columns: `Mega Stone` · `Holder` · `Mega Form` (link to
`/champions/<slug>`) · `Typing` · `Ability` · `Legal from`.

Suggested JSON-LD: a single `ItemList` of `itemListElement` →
`ListItem { position, name: megaStone, url: /champions/<slug> }`.
Do **not** add a second `FAQPage` — the site already emits four and two of
them duplicate entities (report §2).

Internal linking: add to `PageFooter.NAV_LINKS` as `Mega Stones`, and link it
from the `/champions` hub under the "Every Legal Mega Evolution" H2. That makes
it a second crawlable entrance into the 81-page cluster.

---

## 4. New page: `/guides/vgc-team-report-template` (gap 3)

The site's exact product category, and no competitor owns the how-to. Victory
Road owns the *index* of player-written reports; MetaVGC publishes
auto-generated "tactical overviews". Nobody publishes the template.

```
title:       { absolute: "VGC Team Report Template — What to Include" }   // 43
description: "A free VGC team report template: the sections top players actually write, what belongs in each one, and how to turn a Showdown paste into a shareable report."
canonical:   https://pokemonvgcteamreport.com/guides/vgc-team-report-template
```

H1: `VGC Team Report Template`

H2 outline (each section = one part of the app's own report editor, so the
page is self-documenting and every claim is first-party):

1. `Event, placement and record` — the header a reader scans first.
2. `The six builds` — species, item, ability, nature, moves, and the spread
   (EVs for standard regs, SP for Champions M-A/M-B/M-C).
3. `Why this spread` — the benchmark each number buys. Link `/tools/ev-to-sp`.
4. `Team overview and win conditions`
5. `Per-Pokémon roles`
6. `Key damage calcs`
7. `Speed tiers and speed control`
8. `Matchup plans and leads`
9. `What you'd change`

Closing CTA (one primary CTA per screen, per the UI standards): "Paste your
Showdown export to start a report with these sections pre-built."

This page is also the natural first post for VGC-227's `/blog/[slug]`.

---

## 5. New page: `/tools/ots-generator` (gap 4, = VGC-217 item ③)

The feature already exists — `teamToOpenSheet()` in
`src/lib/utils/export-paste.ts`, `OTSSheetModal.tsx`, and the VGC-233 OTS PDF
work merged in `10dfd74` — but it is reachable only from inside an existing
report and has **no landing page**, so it cannot rank for anything. A fresh
search (16 Nov) still finds no purpose-built OTS generator on the web: only a
DocHub fillable PDF and team builders that export plain pastes.

```
title:       { absolute: "Open Team Sheet Generator for VGC" }            // 33
description: "Paste your Showdown export and get a printable VGC open team sheet. Species, items, abilities, Tera types and moves laid out in the order judges read them."
canonical:   https://pokemonvgcteamreport.com/tools/ots-generator
```

H1: `Open Team Sheet Generator`
H2s: `Paste your team` · `What goes on an open team sheet` ·
`Open team sheet vs. a team report` · `Printing and PDF export`

Must be `export const dynamic = "force-static"` like `/tools/ev-to-sp` — that
is also the only reason `/tools/ev-to-sp` is the one prerendered page on the
site whose navbar renders (report §5).

---

## 6. New page: `/tools/team-legality-check` (gap 5)

```
title:       { absolute: "Reg M-C Team Legality Checker" }                // 29
description: "Paste a VGC team and check it against Pokémon Champions Regulation M-C: legal species, Mega Stones, the two-restricted limit, item and species clauses, and the 66 SP budget."
canonical:   https://pokemonvgcteamreport.com/tools/team-legality-check
```

H1: `Reg M-C Team Legality Checker`
H2s: `Check a paste` · `What Regulation M-C allows` · `Item and species clauses`
· `The 66 SP / 32-per-stat budget` · `Regulation M-A and M-B`

All logic exists in `src/lib/validation/champions-legality.ts`
(`getChampionsDex(reg)`, per-reg Mega Stones, restricted max 2, item clause,
species clause, SP/EV budgets). **Render the rules from that module, never
hardcode them** — the same discipline `regulationCopy()` already enforces on
the mega pages.

---

## 7. Own descriptions for `/privacy` and `/terms`

Both currently inherit the root `description`, `og:title`, `og:description`
and `twitter:*` (verified in `.next/server/app/privacy.html`, `terms.html`).

`/privacy`:
```
description: "How VGC Team Report handles your team data, accounts, analytics and cookies, and how to export or delete everything we hold."
```

`/terms`:
```
description: "The terms of use for VGC Team Report: acceptable use, ownership of the team reports you publish, and the limits of the service."
```

`/support` also needs a `twitter` block — it sets `openGraph` but no
`twitter`, so its Twitter card currently advertises the homepage title.

---

## 8. `public/llms.txt` — two edits

1. `Updated: 2026-05-23` → the real date. The body was corrected in `e19fcc3`
   (SP maths, M-C) but the stamp was not moved, so the file advertises itself
   as six months stale to the AI crawlers it is written for.
2. `## Main URLs` is missing `/tools/ev-to-sp`. Add, plus any new route from
   §3–§6 above as it ships:

```
- https://pokemonvgcteamreport.com/tools/ev-to-sp — EV ↔ SP converter for Pokémon Champions. Converts Showdown EV spreads to Stat Points against the 66 SP budget and 32 SP per-stat cap, with a full conversion table.
```
