# R6 — SEO Audit, 14 Sept 2026

**Scope:** repo-source audit only (live site unreachable from this container — network egress policy, *not* a site outage). All findings are grounded in files at `/home/user/VGC-Team-Report`.
**Read-only wave.** Nothing in this report was implemented. Content drafts live in `.swarm/drafts/`.

---

## 0. Headline finding

**Regulation M-C went live on 9 September 2026 (runs to 2 December 2026). The repo has zero knowledge of it.**

`grep -rn "M-C" src/` returns exactly one hit — a comment in
`src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts:25` that literally predicts this failure
("…so the next rotation (M-C) can't silently repeat it"). The rotation happened; the guard did not fire.

Consequences, all file-grounded:

| Symptom | File |
|---|---|
| `REGULATIONS` array stops at `"Reg M-B"` | `src/lib/data/tags.ts:7-9` |
| `isChampionsFormat()` returns false for `"Reg M-C"` | `src/lib/data/tags.ts:23` |
| No `CHAMPIONS_REG_MC_*` sets exist; `getRegMBMegas()` is the widest accessor | `src/lib/data/mega-pokemon.ts:788-850` |
| The 6 new M-C Megas are absent from `MEGA_POKEMON_LIST` (78 entries, none of them M-C) | `src/lib/data/mega-pokemon.ts` |
| `generateStaticParams()` builds from `getRegMBMegasWithSprites()` → 6 M-C Megas get **no SSG page, no sitemap entry, no internal link** | `src/app/champions/[pokemon]/page.tsx:20-30` |
| Sitemap enumerates M-B Megas only | `src/app/sitemap.ts:32-37` |
| Hub title/description/keywords say "Reg M-B & M-A" | `src/app/champions/page.tsx:11-40` |
| Hub body copy: "Champions has since rotated to **Regulation M-B**" | `src/app/champions/ChampionsContent.tsx:162-173` |
| EV→SP tool pinned to "Regulation M-A" | `src/app/tools/ev-to-sp/page.tsx:20,33` |
| Champions base dex sourced from the Reg M-A Serebii page, cross-ref'd 2026-05-07; explicitly excludes Salamence — which M-C makes legal | `src/lib/data/champions-dex.ts:4-16` |
| `llms.txt` "Updated: 2026-05-23", describes `/champions` as the "Regulation M-A hub" | `public/llms.txt` |
| `detect-regulation.ts` can never emit `"Reg M-C"` | `src/lib/analysis/detect-regulation.ts` |

**The 6 new M-C Megas** (Absolite Z / Garchompite Z / Lucarionite Z / Salamencite / Golisopite / Baxcalibrite):

| Mega | Ability | Note |
|---|---|---|
| Mega Absol Z | Sharpness | first-ever "Z" second-Mega form |
| Mega Garchomp Z | Levitate | second Mega for a mon we already ship (`garchomp-mega`, `mega-pokemon.ts:118`) |
| Mega Lucario Z | Aura Guard | second Mega for `lucario-mega` (`:78`) |
| Mega Salamence | Aerilate | base form not even in `CHAMPIONS_BASE_DEX` |
| Mega Golisopod | Tough Claws | |
| Mega Baxcalibur | Thermal Exchange | |

Also new in M-C: ~23–36 base Pokémon (Rillaboom, Cinderace, Inteleon, Indeedee, Squawkabilly, Toxtricity, Pincurchin, Alolan Persian, Galarian Farfetch'd …) and 12 held items (Air Balloon, Binding Band, Eject Button, the four Seeds, Leek, Normal Gem, Red Card, Rocky Helmet, Terrain Extender). M-C is **purely additive** — nothing from M-B was removed, so the existing superset pattern (`CHAMPIONS_REG_MB_MEGAS = [...MA, ...MB_ONLY]`, `mega-pokemon.ts:836-842`) extends cleanly.

Competitors already index the term. Pikalytics ships `Reg M-C` in **every per-Pokémon title tag** —
`Kingambit VGC 2026 Champions Reg M-C: Best Moves, Builds & Teams | Pikalytics` at
`pikalytics.com/pokedex/championstournaments/Kingambit`, and already has
`/pokedex/gen9championsvgc2026regmc/Salamence-Mega` live. MetaVGC's homepage title is
`Best Pokemon Champions Teams | Regulation M-C`. Our best mega page title is
`Mega Garchomp VGC Guide — SP Spreads, Movesets & Teams` — no regulation token anywhere.

---

## 1. Current posture

### 1.1 What is genuinely good (don't regress these)

- **Canonical coverage is complete.** Every indexable route sets its own `alternates.canonical`:
  `/` (`src/app/layout.tsx:83`), `/champions` (`champions/page.tsx:15`), `/champions/[pokemon]`
  (`champions/[pokemon]/page.tsx:72`), `/explore:7`, `/faq:11`, `/tournaments:9`, `/tools/ev-to-sp:38`,
  `/s/[id]:134`, `/creator/[name]:29`, `/changelog:9`, `/feedback:7`, `/support:8`, `/privacy:7`, `/terms:7`.
- **robots.txt is correct** (`public/robots.txt`) — one wildcard group, `Disallow: /api/`, sitemap declared.
  The comment records the VGC-272 fix where per-bot `Allow:` groups silently un-blocked `/api/`. Leave it alone.
- **Sitemap is dynamic and hygienic** (`src/app/sitemap.ts`): `revalidate = 3600`, DB-backed `/s/[id]` and
  `/creator/[name]` (5000 cap each), try/catch degrading to static pages, and an explicit comment
  (`:20-22`) refusing to sitemap the noindex `/compare`. Correct instinct.
- **noindex hygiene is thorough:** `/dashboard` (`dashboard/page.tsx:7`), `/dashboard/profile`, `/dashboard/privacy`,
  `/dashboard/notifications`, `/notifications:9`, `/compare:10` (index:false / follow:true — right call),
  `/embed/[id]:29`, private-or-unlisted shares and any `?key=` collaborator URL (`s/[id]/page.tsx:19-36,104-108`).
  That last one — noindexing edit-token URLs so Google can't cache the secret in a snippet — is a genuinely
  sharp catch.
- **Structured data is real, not decorative.** `Organization` + `WebSite` (with `SearchAction` sitelinks
  searchbox) + `WebApplication`/`SoftwareApplication` all render in `layout.tsx:118-155`.
  `ItemList` of all 75 Megas on the hub (`champions/page.tsx:47-62`). Per-mega `WebPage` + `BreadcrumbList`
  + `FAQPage` (`champions/[pokemon]/page.tsx:283-330`). `JsonLd` escapes `<` → `<` to block
  `</script>` injection from user-controlled `creatorName` (`components/seo/JsonLd.tsx:4-6`).
- **Mega-page legality claims are derived, never asserted** (`champions/[pokemon]/page.tsx:32-49, 253-275`).
  The FAQ answer for an M-B-only Mega correctly says "not legal in Regulation M-A". Prerendered false
  legality claims are a structured-data manual-action risk and this file already knows it. **The M-C fix
  must preserve this discipline** — do not hardcode "legal in M-C" onto all 78 entries.
- **Internal linking in the mega cluster is thought through.** Related-mega selection rotates by the current
  mega's index rather than `.slice(0, 8)` (`champions/[pokemon]/page.tsx:189-199`), so link equity spreads
  across all 72 pages instead of piling onto 8. `/champions` is in the sitewide footer
  (`components/layout/PageFooter.tsx:12-15`) with a comment explaining the cluster had no footer link before.
- **301 canonical-host redirect** from `*.vercel.app` → `pokemonvgcteamreport.com`, preserving path + query,
  with preview deploys exempt (`src/proxy.ts:59-74`).
- **OG/Twitter cards** present on every public route; dynamic `opengraph-image.tsx` routes at `/`,
  `/champions`, `/champions/[pokemon]`, `/explore`.

### 1.2 Heading hierarchy

One `<h1>` per route, verified across `src/app` and `src/components`. Notable:
- `src/app/page.tsx:1163-1170` — sr-only h1 per slide, with a `VGC-259` comment; `TeamOverview.tsx:419,432`
  owns the visible one. Correct.
- `src/app/champions/[pokemon]/MegaLandingContent.tsx` — h1 at `:134`, h2s at `:155,168,216,248`, h3 at `:226`.
  Clean h1→h2→h3, no skips.
- `src/app/s/[id]/redirect.tsx:18` — sr-only h1.

**No structural heading defects found.** This is the one area needing no work.

### 1.3 Defects found

| # | Defect | File / evidence |
|---|---|---|
| D1 | **Whole-site Reg M-C blindness** | see §0 |
| D2 | Mega-page titles carry **no regulation token** — `${displayName} VGC Guide — SP Spreads, Movesets & Teams` | `champions/[pokemon]/page.tsx:62` |
| D3 | `SportsEventJsonLd` publishes two **past** events as `UPCOMING_TOURNAMENTS` with default `eventStatus: EventScheduled` — Indianapolis (2026-05-29) and Worlds (2026-08-14). It is 14 Sept. LAIC 2027 (the M-C headline event) is absent. | `tournaments/page.tsx:38-52`; `components/seo/JsonLd.tsx` SportsEventJsonLd |
| D4 | `public/llms.txt` stamped `Updated: 2026-05-23`; describes `/champions` as the Reg M-A hub; omits `/tools/ev-to-sp`, `/creator/[name]`, `/compare`. AI-citation surface is ~4 months stale. | `public/llms.txt` |
| D5 | `src/app/s/[id]/opengraph-image.tsx` is **dead code** — `s/[id]/page.tsx:126-131` sets `images: []` on both OG and Twitter deliberately (comment explains two failed attempts), so the route file can never be selected. | both files |
| D6 | Footer omits `/tournaments` — the page is sitemapped at priority 0.7 but has **no sitewide internal link**. | `PageFooter.tsx:9-21` vs `sitemap.ts:16` |
| D7 | Root-layout `alternates.canonical` is the homepage URL, and Next.js **inherits** it into any child route that doesn't override. Coverage is currently complete, so this is latent — but any new indexable route ships silently self-canonicalised to `/`. | `layout.tsx:83` |
| D8 | Stale keyword arrays: `/explore` lists `"Regulation M-A teams"` only (`explore/page.tsx:24`); `/tournaments` lists `"VGC top teams 2025"` (`tournaments/page.tsx:34`). | as cited |
| D9 | `MEGAS_WITH_SPRITES` last probed **2026-04-20** (`mega-pokemon.ts:851-878`). Five months of Showdown sprite releases unaccounted for; Meowstic-Mega still gated to "Coming Soon", and the 6 M-C Megas will need probing before they can get pages. | `mega-pokemon.ts` |
| D10 | No hub page for the head term **"Reg M-C legal Pokémon"** / **"Pokémon Champions regulations"**. `/champions` is a Mega index, not a regulation reference. Victory Road, MetaVGC and Pokémon Zone each own a dedicated `/regulations` URL. | route tree — no `src/app/formats/` or `/regulations/` |
| D11 | `/champions/[pokemon]` emits `WebPage` but not `Product`/`Thing`-level markup and no `ImageObject` for the sprite; competitors' per-mon pages carry richer entity markup. Low-ish priority but cheap. | `champions/[pokemon]/page.tsx:283-305` |
| D12 | `ChampionsContent.tsx:326,343` presents Indianapolis Regionals Top Cut as the featured tournament table — a May 2026 Reg M-A event, on 14 Sept 2026, on the format hub. Freshness signal is four months cold. | `ChampionsContent.tsx` |

---

## 2. Competitor comparison

| Site | URL pattern | Title pattern | What they beat us on |
|---|---|---|---|
| **Pikalytics** | `/pokedex/championstournaments/{Mon}`, `/pokedex/gen9championsvgc2026regmc/{Mon}`, `/pokedex/battledataregmbs3` (archived reg), `/tournaments/limitless/{slug}` | `{Mon} VGC 2026 Champions Reg M-C: Best Moves, Builds & Teams \| Pikalytics` | Regulation token in *every* title; **per-regulation archive URLs** so old-reg pages keep ranking instead of being overwritten; usage %/winrate/teammate data we have no equivalent of; already live on all 6 M-C Megas |
| **MetaVGC** | `/regulations`, `/regulations/regulationm-c` | `Best Pokemon Champions Teams \| Regulation M-C` | A dedicated regulations hub + per-reg child page — the exact D10 gap. Owns "best Pokémon Champions teams" |
| **Limitless VGC** | `limitlessvgc.com/pokemon` (rankings), `play.limitlesstcg.com/tournament/{id}` | `Pokémon Rankings – Limitless VGC` | Canonical tournament-result entity. We *link out* to them (`ChampionsContent.tsx:331,427`) without a reciprocal structured tournament archive of our own |
| **VGCPastes** | X/Twitter + sheet-driven | — | Distribution, not SEO. They feed Pikalytics. Weakest competitor on-page; our `/s/[id]` reports out-structure their pastes — but only if `/explore` ranks |
| **Pokémon Zone** | `/champions/pokemon/{base}-mega-{base}/`, `/champions/regulations/` | `Mega Golisopod - Pokémon Champions & VGC Moveset & Strategy` | Per-mega pages for M-C mons; regulations hub |
| **Long tail** (ChampDex, PikaChampions, Champions Builder, PokéChampions Coach, abitingpokedex, op.gg) | various | e.g. `Pokemon Champions Stat Points & EVs Explained — Complete Guide \| ChampDex` | A crowded new field competing directly with `/tools/ev-to-sp`. **We shipped the SP converter early and it is genuinely correct** (`stat-calculator.ts:78-230`, the 4-then-8 EV cost curve and the 66-point redistribution) — but our title/description still say "Regulation M-A" while theirs say M-C |

**Strategic read:** we cannot beat Pikalytics on usage data — they have the tournament pipeline. Our defensible
wedge is the thing `llms.txt` already names: *authored reports*, plus the **SP system** (where we have the only
implementation I can find that handles the non-linear EV↔SP curve and the 66-point redistribution correctly).
Lean into SP + "why this spread", not usage percentages.

---

## 3. Top 10 keyword gaps — Sept 2026

Ranked by (search intent live right now) × (our ability to actually rank).

| # | Keyword cluster | Why it's a gap | Target page |
|---|---|---|---|
| 1 | **`Reg M-C` / `Regulation M-C` / `Pokemon Champions Reg M-C`** | Live since 9 Sept. Zero occurrences in `src/`. Competitors already ranking. Every other gap below inherits from this one. | new `/formats/reg-m-c`, plus `/champions` |
| 2 | **`Mega Salamence VGC` / `Mega Golisopod` / `Mega Baxcalibur` / `Mega Absol Z` / `Mega Garchomp Z` / `Mega Lucario Z`** (+ ` SP spread`, ` moveset`, ` best set`) | 6 brand-new entities with a demand spike and near-zero incumbent authority — the single best land-grab window of the year. We have no page because they're not in `MEGA_POKEMON_LIST`. | 6 new `/champions/{slug}` SSG pages |
| 3 | **`{Mega} Reg M-C`** (72 existing pages × regulation modifier) | D2. Pikalytics stamps the reg into all ~200 of their titles; our 72 pages omit it entirely. Pure title/description edit — no new content. | `champions/[pokemon]/page.tsx:62` |
| 4 | **`Reg M-C legal Pokemon` / `M-C banlist` / `what's new in Reg M-C`** | Reference intent, high volume during the first 3–4 weeks of a rotation, and it decays. D10 — no hub exists. | new `/formats/reg-m-c` |
| 5 | **`Pokemon Champions stat points` / `SP calculator` / `66 SP budget` / `EV to SP`** | We have the best implementation and a live page, but its metadata says "Regulation M-A" (`tools/ev-to-sp/page.tsx:20,33`). Six competitors launched into this term since May. | `/tools/ev-to-sp` |
| 6 | **`{new M-C Pokemon} VGC`** — Rillaboom (37.6% usage, the #1 mon in the format), Cinderace, Inteleon, Indeedee, Toxtricity, Squawkabilly, Alolan Persian, Galarian Farfetch'd | 20–36 new species, none in `CHAMPIONS_BASE_DEX`. Rillaboom alone is the most-searched mon in the format right now and we have no page for it. | `/champions/[pokemon]` cluster extension to non-Megas, or `/formats/reg-m-c` sections |
| 7 | **`best Pokemon Champions teams` / `best Reg M-C teams`** | MetaVGC's homepage title. Our `/explore` targets `"best VGC teams 2026"` — the generic form, not the Champions-qualified one that's actually converting. | `/explore` |
| 8 | **`LAIC 2027` / `Latin America International Championships teams`** | The headline M-C event. `/tournaments` still advertises Indianapolis (May) and Worlds (Aug) as *upcoming* (D3). | `/tournaments` |
| 9 | **`Reg M-C new items`** — Terrain Extender, Red Card, Rocky Helmet, Electric/Grassy/Misty/Psychic Seed, Air Balloon, Eject Button, Leek, Binding Band, Normal Gem | 12 newly legal items, each a live query, zero coverage anywhere in the repo. Cheap to cover as a section. | `/formats/reg-m-c` |
| 10 | **`Reg M-B` archive** (defensive) | M-B pages will decay as M-C takes over. Pikalytics keeps `/pokedex/battledataregmbs3` as a *separate archived URL*. If we overwrite M-B copy in place we lose the M-B long tail **and** teach Google our pages are ephemeral. | preserve `/formats/reg-m-b` when adding M-C |

---

## 4. Quick wins, ranked by effort ÷ impact

Each is precise enough to hand to an implementer. Nothing below has been applied.

### Tier 1 — highest impact, ≤1 h each

**QW1 · Add the regulation token to all 72 mega-page titles.** `src/app/champions/[pokemon]/page.tsx:62`
Change `const title = \`${mega.displayName} VGC Guide — SP Spreads, Movesets & Teams\`;` to interpolate
the narrowest true regulation label from `regulationCopy()` (`:32-49`), e.g.
`\`${mega.displayName} Reg M-C VGC Guide — SP Spreads & Movesets\``. Keep under ~60 chars — the existing
comment at `:59-61` already flags the SERP truncation budget, and remember `layout.tsx:38` appends
` | VGC Team Report`. Mirror into `description` (`:65`) and the `keywords` array (`:95-112`).
**72 pages re-titled; no new content, no new data.**

**QW2 · Refresh `public/llms.txt`.** Bump `Updated:` to today. Replace every "Regulation M-A" with the
M-A/M-B/M-C progression. Add the missing URLs: `/tools/ev-to-sp`, `/creator/[name]`, `/tournaments` is
present but `/compare` is not (and should stay out — it's noindex). Update the SP paragraph to name M-C.
Do the same for `public/llms-full.txt`. **Single file, directly feeds AI citation.**

**QW3 · Fix the stale `SportsEvent` structured data.** `src/app/tournaments/page.tsx:38-52`
Remove Indianapolis (2026-05-29) and Worlds (2026-08-14) from `UPCOMING_TOURNAMENTS`, or move them to a
past-events array that passes `eventStatus: "https://schema.org/EventScheduled"` only for genuinely future
dates. Add LAIC 2027 and the Reg M-C regional slate. Consider deriving `eventStatus` from
`startDate < Date.now()` inside `SportsEventJsonLd` (`src/components/seo/JsonLd.tsx`) so this can't rot again.

**QW4 · De-stale `/tools/ev-to-sp` metadata.** `src/app/tools/ev-to-sp/page.tsx:20,33`
`DESCRIPTION` → "…for Pokémon Champions Regulation M-C"; replace the `"Regulation M-A SP spread"` keyword
with M-C (keep M-A/M-B as secondary). The calculator logic is regulation-independent (SP budget unchanged
at 66/32, `stat-calculator.ts:78-79`) — **metadata only, zero logic risk.**

**QW5 · Add `/tournaments` to the sitewide footer.** `src/components/layout/PageFooter.tsx:9-21`
Insert `{ href: "/tournaments", label: "Tournaments" }` after Explore. It's sitemapped at 0.7 with zero
internal links. One line.

**QW6 · Delete the dead OG route.** Remove `src/app/s/[id]/opengraph-image.tsx`. `s/[id]/page.tsx:126-131`
sets `images: []` on purpose (the comment documents two failed attempts and why text-only unfurls win).
The route is unreachable and misleads the next reader. **Verify the comment still holds before deleting.**

### Tier 2 — high impact, 2–6 h

**QW7 · Ship Reg M-C data (unblocks gaps 1, 2, 3, 6, 9).**
- `src/lib/data/tags.ts:7-9` — add `"Reg M-C"` to `REGULATIONS`; extend `isChampionsFormat()` (`:23`).
- `src/lib/data/mega-pokemon.ts` — append the 6 M-C Megas to `MEGA_POKEMON_LIST` with `slug` /
  `dataKey` / `ability` / `megaStone` / `types` / `description`; add `CHAMPIONS_REG_MC_ONLY_MEGAS` and
  `CHAMPIONS_REG_MC_MEGAS = new Set([...CHAMPIONS_REG_MB_MEGAS, ...MC_ONLY])` following the exact superset
  pattern at `:836-842`; add `getRegMCMegas()` / `getRegMCMegasWithSprites()`.
- **Probe Showdown sprites first** for all six and update `MEGAS_WITH_SPRITES` (`:851-878`) — an unsprited
  Mega must stay "Coming Soon", not become a broken-image landing page. The `Z` forms are the risky ones.
- `src/lib/data/champions-dex.ts` — add the ~23–36 M-C base species; **delete Salamence from the
  "notable absences" comment at `:15`**, it is now legal.
- `src/lib/analysis/detect-regulation.ts` — emit `"Reg M-C"` on an M-C-only signal, same positive-signal
  discipline as `CHAMPIONS_REG_MB_ONLY_MEGAS`.
- `src/lib/validation/champions-legality.ts` — extend the legality branch.
- `src/app/champions/[pokemon]/page.tsx:20-30` — `generateStaticParams()` → `getRegMCMegasWithSprites()`;
  extend `regulationCopy()` (`:32-49`) to a three-way M-A/M-B/M-C derivation, **keeping legality derived
  rather than asserted** — the M-C FAQ answer must say "not legal in M-A or M-B" for M-C-only Megas.
- `src/app/sitemap.ts:32-37` — `getRegMBMegasWithSprites()` → M-C.
- `src/lib/data/__tests__/` + `src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts` — that
  test file's own comment at `:25` names this rotation; add the regression test it asks for.
**Result: 6 new SSG pages, 6 sitemap entries, 78 pages' worth of correct regulation copy.**

**QW8 · Build `/formats/reg-m-c` (gaps 1, 4, 9).** New route `src/app/formats/reg-m-c/page.tsx`
(+ a `/formats` index so the cluster has a parent). Sections: date range (9 Sept – 2 Dec 2026), what changed
vs M-B, all 6 new Megas (linking to each `/champions/{slug}`), new base species, the 12 new items, ruleset
(one Mega per battle, Restricted ban, 66 SP / 32 per stat, no Tera). Emit `FAQPage` + `BreadcrumbList` +
`ItemList`; set `alternates.canonical`; add to `sitemap.ts` at priority 0.9 and to `PageFooter.tsx`.
**Preserve `/formats/reg-m-b` and `/formats/reg-m-a` as archived siblings** — this is the Pikalytics
`battledataregmbs3` pattern and it's how you keep the M-B long tail (gap 10). Content draft:
`.swarm/drafts/r6-reg-m-c-format-hub.md`.

**QW9 · Refresh `/champions` hub copy + metadata.** `src/app/champions/page.tsx:11-40` (title, `HUB_DESCRIPTION`,
keywords, `ItemList` name/description at `:47-56`) and `src/app/champions/ChampionsContent.tsx:60-71`
(the "New in Regulation M-B" section heading gains an M-C sibling), `:162-173` (the rotation narrative),
`:216` (the `Reg M-B` badge), `:326,343` (replace the Indianapolis Reg M-A table with a Reg M-C event),
`:445` (the "Tag with Reg M-A or Reg M-B" step copy), `:140` (`/explore?regulation=Reg+M-A` deep link → M-C).

### Tier 3 — worthwhile, lower urgency

**QW10 · Champions-qualify `/explore`** (gap 7). `src/app/explore/page.tsx:5-26` — work
"best Pokémon Champions teams" and "Reg M-C teams" into title/description/keywords; replace the stale
`"Regulation M-A teams"` keyword. Also drop `"VGC top teams 2025"` from `tournaments/page.tsx:34`.

**QW11 · Re-probe `MEGAS_WITH_SPRITES`** (D9). `mega-pokemon.ts:851-878`, last run 2026-04-20. Re-run the
4-path probe (ani.gif / gen5ani.gif / home.png / gen5.png) across all 84 Megas. Meowstic-Mega may now be
unblockable — that's a 79th page for free.

**QW12 · Guard the inherited canonical** (D7). `src/app/layout.tsx:83` — leave the value (the homepage needs
it) but add a comment stating that every new indexable route MUST set its own `alternates.canonical` or it
silently self-canonicalises to `/`. Ideally back it with a vitest that walks `src/app/**/page.tsx` and
asserts canonical-or-noindex.

**QW13 · Enrich per-mega structured data** (D11). `champions/[pokemon]/page.tsx:283-305` — add `image`
(`ImageObject` for the sprite), `datePublished`/`dateModified`, and a `mainEntity` `Thing` for the Mega with
`additionalProperty` base stats. Keep every value first-party — the file's `:245-250` comment on
structured-data spam risk applies.

---

## 5. Suggested Linear tickets

| Title | Priority | Covers |
|---|---|---|
| `VGC-XX: Add Regulation M-C data layer (dex, Megas, tags, detection, legality)` | **P0 — Urgent** | QW7 |
| `VGC-XX: Stamp current regulation into all 72 Mega guide page titles` | **P0 — Urgent** | QW1 |
| `VGC-XX: Build /formats/reg-m-c hub and archive M-A/M-B at stable URLs` | **P1 — High** | QW8, gap 10 |
| `VGC-XX: Refresh /champions hub metadata and body copy for Reg M-C` | **P1 — High** | QW9 |
| `VGC-XX: Fix stale SportsEvent JSON-LD — past events marked upcoming on /tournaments` | **P1 — High** | QW3 |
| `VGC-XX: Refresh llms.txt and llms-full.txt for Reg M-C (AI citation surface)` | **P1 — High** | QW2 |
| `VGC-XX: Update /tools/ev-to-sp metadata from Reg M-A to Reg M-C` | **P2 — Medium** | QW4 |
| `VGC-XX: Re-probe Showdown sprite availability for all Champions Megas` | **P2 — Medium** | QW11 |
| `VGC-XX: Champions-qualify /explore keywords; drop stale 2025/Reg M-A terms` | **P2 — Medium** | QW10 |
| `VGC-XX: Add /tournaments to sitewide footer` | **P3 — Low** | QW5 |
| `VGC-XX: Remove dead src/app/s/[id]/opengraph-image.tsx` | **P3 — Low** | QW6 |
| `VGC-XX: Add canonical-coverage regression test for new app routes` | **P3 — Low** | QW12 |
| `VGC-XX: Enrich Mega guide JSON-LD with ImageObject and base-stat properties` | **P3 — Low** | QW13 |

---

## 6. Caveats for the implementing agent

1. **Verify the M-C Mega/species/item lists against a primary source before writing data files.** This audit's
   M-C specifics came from search-result summaries; `victoryroad.pro`, `pokemon.com`, `metavgc.com`,
   `pikalytics.com` and `stratadex.net` were all **blocked by this container's egress proxy**, so nothing was
   read first-hand. `champions-dex.ts:4-5` cites Serebii as the project's source of record — use it, and
   record the cross-reference date in the comment the way `mega-pokemon.ts:788-798` already does.
2. **Do not flatten legality into an assertion.** `champions/[pokemon]/page.tsx:32-49` and `:253-275` derive
   every legality claim. Prerendered false claims across 78 pages is a structured-data manual-action risk the
   file already guards against.
3. **Additive, not destructive.** M-C is a superset of M-B. Keep M-A/M-B copy reachable at their own URLs
   rather than rewriting it in place.
4. **Do not touch `public/robots.txt`.** The VGC-272 comment explains why one wildcard group is both necessary
   and sufficient.
5. Standard gate applies: `npm run typecheck` (cold), vitest, build — via `verification-gate` — before any commit.
