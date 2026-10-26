# R6 — DRAFT metadata & copy

**STATUS: DRAFTS ONLY. Nothing here is implemented, committed, or published anywhere.**
Produced 2026-10-26 by R6 (SEO audit) on `swarm-nightly-2026-10-26`. Companion to `/home/user/VGC-Team-Report/.swarm/r6-seo-26-10-26.md`.

Facts stated in this copy are drawn from the repo's own data files (`src/lib/data/mega-pokemon.ts`, `champions-dex.ts`, `src/lib/analysis/stat-calculator.ts`, `src/lib/validation/champions-legality.ts`). The Reg M-C window (Sep 9 – Dec 2 2026) and the "6 new Megas including 3 Z Megas" claim were cross-checked against a WebSearch result citing The Pokémon Company's own press release — **but re-verify every legality claim against the official rules before publishing.** The repo's existing `regulationCopy()` helper derives legality per Mega; new pages should use it rather than restating anything by hand.

All title lengths below are the **final rendered `<title>`**, i.e. the string plus the root layout's `" | VGC Team Report"` (19 chars). Target ≤ 60.

---

## 1. Title rewrites — fit the template (report §7 item 2)

### `src/app/champions/[pokemon]/page.tsx` — 81 pages, currently 74–77 chars

Current: `` `${mega.displayName} VGC Guide — SP Spreads, Movesets & Teams` `` → 76 with suffix.

**Option A (preferred — keeps the brand suffix, drops the weakest keyword):**
```
`${mega.displayName} VGC Guide — SP Spreads & Movesets`
```
Worst case: `Mega Crabominable VGC Guide — SP Spreads & Movesets | VGC Team Report` = **69.** Still over. Use Option B.

**Option B (preferred — absolute title, no suffix, full keyword set kept):**
```ts
title: { absolute: `${mega.displayName} VGC Guide — SP Spreads, Movesets & Teams` }
```
Worst case **58**, longest typical 57. No copy loss at all. This is the recommendation: the brand name is already in the URL, the OG `siteName`, and the Organization schema, so the suffix buys nothing on these 81 pages.

**Option C (shortest, if "Teams" must stay and absolute titles are unwanted):**
```
`${mega.displayName} VGC — SP Spreads & Teams`   →  worst case 61
```

### `src/app/champions/page.tsx` — currently 73

Current: `Pokemon Champions Format | Reg M-C Mega Teams & Z Megas`

Drafts:
- `Pokemon Champions Reg M-C — Every Legal Mega` → **63**
- `Pokemon Champions Reg M-C Megas` → **50** ✅
- absolute: `Pokemon Champions Format — Every Reg M-C Mega | VGC Team Report` → **63**

Recommended: `title: "Pokemon Champions Reg M-C Megas"` (50). Keeps "Pokemon Champions", the current reg, and "Megas"; the Z Megas belong in the description, not a truncated title.

### `src/app/tournaments/page.tsx` — currently 68

Current: `VGC Tournament Results Archive | Team Reports 2026`
Draft: `VGC Tournament Team Reports` → **47** ✅
Alt: `VGC Regionals & Worlds Team Reports` → **55**

(Note: do not ship a "2026" title until the event list is refreshed — see report F6. The newest hardcoded event is dated 2026-05-01.)

### `src/app/explore/page.tsx` — currently 64

Current: `Best VGC Teams 2026 — Explore Top Team Reports`
Draft: `Best VGC Teams 2026 — Top Team Reports` → **57** ✅

### `src/app/support/page.tsx` — self-duplicating

Current renders `Support VGC Team Report | VGC Team Report`.
Draft: `title: { absolute: "Support VGC Team Report" }` → **23** ✅

---

## 2. De-stale `/tools/ev-to-sp` (report §7 item 6)

`src/app/tools/ev-to-sp/page.tsx` — three stale "Regulation M-A" references. The page body already says "Regulation M-A, M-B and M-C" at line 214 and in the FAQ at line 107, so only these are out of step:

**`DESCRIPTION` (line 19–20)** — current opens "…for Pokémon Champions Regulation M-A." Draft (155 chars, so the whole thing survives truncation):
```
Free EV to SP converter for Pokémon Champions Reg M-A, M-B and M-C. Convert EV spreads to Stat Points and back against the 66 SP budget and 32 SP cap.
```
(The "full conversion table" clause moves into the on-page H2 — it was past the 155-char cut anyway.)

**`keywords` (line 34)** — replace `"Regulation M-A SP spread"` with:
```
"Regulation M-C SP spread", "Regulation M-B SP spread", "Regulation M-A SP spread",
```

**Body, line ~345** — `Regulation M-A legality.` → `Regulation M-A, M-B and M-C legality.`
(Better still: derive it, the way `regulationCopy()` does in the mega template, so the next rotation doesn't re-stale it.)

---

## 3. Footer link for `/tournaments` (report §7 item 5)

`src/components/layout/PageFooter.tsx`, `NAV_LINKS` — insert after the `/champions` entry:
```ts
{ href: "/tournaments", label: "Tournaments" },
```
This is the only internal inbound link `/tournaments` would have anywhere in the HTML. Consider also adding it to `PageNavbar`'s `NAV_LINKS` — but note (report F2) that array currently renders nothing server-side, so the footer is the load-bearing one.

---

## 4. `/privacy`, `/terms`, `/support` — own metadata (report §7 item 10)

These inherit the root description and OG, so three URLs currently advertise the homepage. Drafts:

**`src/app/privacy/page.tsx`**
```
description: "How VGC Team Report handles your data: what we store for shared team reports, the analytics and session tools we use, cookie consent, and how to delete your account."
```
(167 chars — trim to ~155 if you want zero truncation.)

**`src/app/terms/page.tsx`**
```
description: "Terms of service for VGC Team Report — acceptable use, ownership of the team reports you publish, content moderation, and liability."
```
(134 chars.)

**`src/app/support/page.tsx`** — add a `twitter` block mirroring its existing `openGraph`, so the Twitter card stops showing the homepage title:
```ts
twitter: {
  card: "summary_large_image",
  title: "Support VGC Team Report",
  description: "Help keep this independent competitive Pokémon resource reliable and available.",
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VGC Team Report" }],
},
```

---

## 5. New page: `/champions/mega-stones` (report §7 item 7, keyword gap 6)

Built entirely from `MEGA_POKEMON_LIST` — `megaStone`, `ability`, `types`, `displayName`, `baseName`, `slug` are all already present for all 81 entries. Use `getRegMCMegasWithSprites()` for the link targets and `regulationCopy()` for the per-row legality label; do not restate legality by hand.

**Metadata draft:**
```ts
title: { absolute: "Every Mega Stone in Pokemon Champions (Reg M-C)" },   // 46
description: "Every Mega Stone legal in Pokemon Champions Reg M-C: which Pokemon each one Mega Evolves, the ability it grants, and the resulting typing. Links to all 81 guides.",
alternates: { canonical: "https://pokemonvgcteamreport.com/champions/mega-stones" },
keywords: ["Mega Stone list", "Pokemon Champions Mega Stones", "all Mega Stones",
           "Reg M-C Mega Stones", "Mega Evolution items", "Garchompite Z",
           "Mega Stone abilities", "VGC 2026"],
```
Description is 161 chars — trim "Links to all 81 guides." to fit 155 if desired.

**H1 draft:** `Every Mega Stone in Pokémon Champions`

**Intro draft (2 sentences, no invented facts):**
> Every Mega Evolution in Pokémon Champions is unlocked by a held Mega Stone, and you may Mega Evolve once per battle. The table below lists every stone legal in Regulation M-C — the current rotation, and a superset of M-A and M-B — with the Pokémon it transforms, the ability the Mega form gains, and its resulting typing.

**Structured data:** `ItemList` of the stones (not of the Pokémon — `/champions` already owns that `ItemList`, and two competing `ItemList`s for the same 81 entities would be self-cannibalising). Plus a `BreadcrumbList`: Home → Champions → Mega Stones.

**Internal linking:** this page's whole point is to be a second hub into the 81-page cluster. Link every row to `/champions/<slug>`, and add a reciprocal link from `ChampionsContent.tsx` and from `MegaLandingContent.tsx`.

---

## 6. New section on the 81 mega pages: type matchups (report §7 item 8, keyword gap 7)

No new route, no new data — `src/lib/data/type-chart.ts` plus `mega.types`, which the template already has in scope.

**H2 draft:** `{mega.displayName} weaknesses and resistances`

**Copy pattern (derived, never hardcoded):**
> As a {typeLine}-type, {displayName} takes {4×/2×} damage from {types} and resists {types}. It is immune to {types}.

**Two FAQ items to append to the existing `faqItems` array** (keeps them grounded in first-party data, matching that file's existing rule against unverifiable claims):
```
q: `What is ${mega.displayName} weak to?`
a: `${mega.displayName} is a ${typeLine}-type, so it takes super-effective damage from
    ${weaknesses.join(", ")}${quad.length ? ` — and 4× damage from ${quad.join(", ")}` : ""}.`

q: `What does ${mega.displayName} resist?`
a: `${mega.displayName} resists ${resistances.join(", ")}${immunities.length
      ? ` and is immune to ${immunities.join(", ")}` : ""}.`
```

Do **not** extend the `keywords` array for this — it is already 17 entries deep per page, and `keywords` has carried no ranking weight at Google for over a decade. Put "weakness" in the H2 and the FAQ instead, where it is actually read.

---

## 7. `public/llms.txt` refresh (report §7 item 12)

Current header says `Updated: 2026-05-23`. Two changes:

**Bump the date**, and **add the missing tool to "Main URLs"** (it shipped in v5.26, August 2026):
```
- https://pokemonvgcteamreport.com/tools/ev-to-sp — Free EV ⇄ SP converter for Pokémon Champions. Converts an EV spread into Stat Points (and back) against the 66 SP / 32-per-stat budget, with a full cost table.
```
Also consider adding `/creator/[name]` alongside the existing `/s/[id]` entry, since creator pages are sitemapped and indexable but undocumented here.

The "Key concepts" SP paragraph is already correct and already locked to the calculator by the v5.27 automated check — **do not retouch it.** (Note the live disagreement flagged in report §4: at least one competitor tool states a 1 SP = 1 stat point model. If this repo's model is the correct one, this paragraph is the site's most defensible piece of content.)

---

## 8. Homepage: what the server-rendered shell should contain (report §7 item 1)

Not metadata — but the fix in item 1 needs an `<h1>` and some crawlable body copy to put in the static shell, so here is a draft. It restates only what `HomePageServer.tsx`'s existing `HOW_TO_STEPS` and the root description already claim.

**H1 draft:** `Build and share a VGC team report`

**Sub-paragraph draft:**
> Paste a Pokémon Showdown export or a PokéPaste link and get a shareable team report: full spreads, damage calcs, speed tiers and matchup plans. Supports every Scarlet & Violet regulation plus Pokémon Champions Reg M-A, M-B and M-C with Stat Points and Mega legality checks. Free, no account needed.

**Crawlable links the static shell should carry** (currently: zero) — at minimum the footer, by rendering `<PageFooter />` on the homepage as every other page does. That alone restores `/`→`/champions`→`/champions/<slug>` as a 2-hop HTML path.

**Removal, same file:** drop `<FAQPageJsonLd />` from `HomePageServer.tsx` (report F4 — it markup-claims 5 Q&A that appear nowhere on the homepage, and duplicates `/faq`'s "What is a VGC team report?"). If the FAQ is wanted on the homepage, render the questions visibly and keep the schema; otherwise `/faq` should own that entity alone. The second `HowToSchema` can go too — Google retired HowTo rich results in Sept 2023 — though it is inert rather than risky, so it is optional.
