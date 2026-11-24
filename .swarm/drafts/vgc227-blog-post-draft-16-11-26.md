# VGC-227 — Blog post draft (NOT PUBLISHED)

**Status:** DRAFT ONLY. Nothing in this file is in `src/`. The `/blog` route and
`/blog/[slug]` shipped this run contain only the factual starter post
(`welcome-to-the-vgc-team-report-blog`).

**Why this is a draft:** the ticket asks for a "Reg M-A meta snapshot" built on
tournament usage data. This run has no verified source for usage shares, top
cut composition, lead frequencies or damage numbers, and the project's content
guard (`src/lib/data/__tests__/blog-posts.test.ts`) deliberately fails the build
if unsourced percentages, placements or an EV→SP conversion number appear in
published prose. Publishing invented numbers into prerendered, AEO-targeted HTML
is the worst possible failure mode for this surface, so the copy below stops at
every point where a real number is required.

**Also note:** the brief in `.swarm/drafts/r7-content-brief-champions-meta-2026.md`
is dated for May 2026 and anchors on Indianapolis Regional (29–31 May 2026) and
Regulation M-A. As of 16 Nov 2026 the current format is **Regulation M-C**
(9 Sep – 2 Dec 2026). A meta post published now should target M-C, not M-A, and
the brief needs re-scoping before anyone writes against it.

---

## Proposed post

**Slug:** `pokemon-champions-regulation-m-c-meta-snapshot-november-2026`
**metaTitle (must be ≤ 46 chars):** `Reg M-C Meta Snapshot — November 2026`
**Title:** Pokémon Champions Regulation M-C Meta Snapshot — November 2026
**Author:** Manraj Sidhu
**datePublished / dateModified:** on publish day; bump `dateModified` monthly.

### BLUF (first two sentences)

> `[VERDICT — needs a cited source]` leads Regulation M-C at
> `[USAGE % — needs a cited source]` of `[SAMPLE — e.g. "Day 2 entries at <event>"]`.
> `[One sentence on what that means for team building.]`

### Required structure

1. **At-a-glance table** — top 15 Pokémon: usage share, change vs last month,
   most common item, most common Tera. Every cell needs a source.
2. **Three archetype breakdowns** — each 40–80 words, each linking a real
   `/s/[id]` report already published on this site (do not invent share IDs).
3. **Lead matrix** — top 5 leads vs top 5 leads, recommended response per cell.
4. **"What changed this month"** — bullets, diffed against the previous post.
5. **Counter guide** — for each top-5 Pokémon, three answers with damage calcs
   produced by this site's own calculator (reproducible, so citable).
6. **Sources & methodology** — primary-source links plus sample size.

### Facts that are safe to state without an external source

These come from the project's own domain knowledge and are already asserted
elsewhere in the app:

- VGC is played at level 50; the app ignores pasted `Level` lines.
- Regulations M-A, M-B and M-C are nested supersets. M-C is current,
  9 Sep – 2 Dec 2026. A Pokémon or Mega is legal from the rotation that
  introduced it onward.
- Pokémon Champions uses **SP (Stat Points)**: 66 total, maximum 32 per stat.
- VGC Team Report accepts SP-form and EV-form pastes and renders both.

### Facts that must NOT be stated

- Any EV→SP conversion number or boundary. VGC-330 is open and disputed; link
  `/tools/ev-to-sp` instead.
- Any usage percentage, tier placement, top-cut composition, tournament result
  or player quote without a primary-source link and a stated sample size.

### Blockers before this can ship

1. Pick and wire a usage data source (Limitless VGC / pokedata.ovh / official
   results) and record the sample size.
2. Re-scope the May/M-A brief to November/M-C.
3. Decide the author byline's public profile URL (the `BlogAuthor.url` field is
   already supported and currently unset).
4. Resolve VGC-330 if the post needs to discuss SP conversion at all.

### Writing notes for whoever picks this up

Add the post as a new entry in `src/lib/data/blog-posts.ts` with
`status: "draft"` first — draft posts are intentionally unreachable by URL and
excluded from the sitemap, so the copy can be reviewed in-repo before it goes
live. Flip `status` to `"published"` only once every number has a source.
