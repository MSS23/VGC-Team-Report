# Deliberately NOT implemented this run — 16 Nov 2026

Nothing here failed a build. These were real, verified findings that were skipped on purpose,
each with the reason. Every one becomes a Linear ticket or is already one.

## A. Already fixed on an unmerged branch — skipping avoids a duplicate conflict

| Finding | Source | Already on |
|---|---|---|
| Un-publishing never revokes the public og:image card (privacy) | C5 | #91 `d0b0ac9` |
| `/compare` ships the dex via a transitive `effective-form` import (88.3 KB gz) | C3 | #91 `b90cc48` |
| `CookieBanner` render-blocking stylesheet on 97/98 pages | C3 | #91 `5859aff` |
| No `@custom-variant dark` in `globals.css` — 142 `dark:` utilities follow the OS (worst pair 1.45:1) | R8 (B2) | #91 `2d0806e` |

Four of the night's strongest findings were already-completed work awaiting review. No ticket needed
for any of them — merging #91 ships all four.

## B. Blocked by file ownership (files owned by #91/#92) — ticket these

1. **`calcs:[null]` in a `#data=` share link white-screens the report.** `url-codec.ts:140` casts to
   `ShareableState`, hiding verified drift: the schema infers `calcs?: Record<string, unknown[]>`
   while the type declares `CalcEntry[]`. The URL-decode path has no normaliser, so a malformed
   link reaches `CalcsPanel.tsx:20` and throws mid-render. (C2 #1 — files: `src/lib/sharing/url-codec.ts`,
   `src/hooks/useShareUrl.ts`, both owned by #91/#92.) **Highest-severity deferred item.**
2. **Type-colour contrast duplicated in `MegaLandingContent.tsx:15-21`**, worse than the original
   (Electric 1.49:1) and shipped across 75 SEO pages. Fixing `type-colors.ts` alone does not reach it.
   The duplicate should be deleted and `<TypeBadge>` used. (R8 B4.)
3. **Four over-budget `<title>`s**: 81 mega pages run 76–78 chars because the template adds 19
   invisibly; `/champions` is 77. Needs `title: { absolute }`. (R6 #2.)
4. **`/tools/ev-to-sp` is stale**: says Reg M-A when the live format is M-A/M-B/M-C. (R6 #3.)
5. **`aria-current` appears nowhere in the codebase** — active navigation is colour-only on every
   public page. Both navbars are owned by #91/#92. (R8 S8.)
6. **The rest of R8's batch**: S6, S7, S9, M4, M9, M12, M13, N4 mostly land in owned files
   (`SlideNavControls`, `CalcInput`, `{Defensive,Offensive}CoverageChart`, `PageNavbar`,
   `ExploreFilters`, `tools/ev-to-sp`).

## C. Dropped as a category: dead-code deletion

C1 found 20 high-confidence dead items, ~558 LOC — dominated by **73 orphaned i18n keys × 7 locale
files = 511 LOC**, clustering around removed features (passcode sharing, comments, coverage charts,
superseded explore sort). `TranslationKeys` type-locks all 7 locales at 314 keys, so deletion is
self-checking.

**Not done tonight**, because #91 and #92 *both* already delete dead code from the same files
(`dex-subset.ts`, `tags.ts`, `discord-bot.ts`, `damage-calculator.ts`). A third deletion of
overlapping lines is a guaranteed three-way conflict for no added value. Worth doing in its own PR
**after** #91 and #92 land. C1 also flagged two items a naive tool would wrongly delete:
- `parseMetricCursor`/`serializeMetricCursor`/`MetricCursor` in `src/lib/explore/chronological-cursor.ts`
  — deliberate scaffolding for open ticket VGC-295; the file header says so.
- `_removed` in `normalize-report.ts:97` — the rest-omit idiom; deleting it changes behaviour.

Also noted by C1: `syncStatus` is wired end-to-end into `Navbar.tsx:186` and never rendered, while
its sibling `collaborators` is. That reads as missing UI, not dead code — worth a ticket.

## D. Blocked on a human decision — left untouched on purpose

- **VGC-330** — is 248 EVs worth 31 or 32 SP? Needs a product ruling against the official ruleset.
  Three runs have flipped these assertions back and forth; a fourth flip is the documented failure
  mode, so this run did not touch them. C5 reports that at HEAD the answer is now *internally
  consistent* (248 EV = 32 SP across the calculator, `sp-docs-drift`, both llms files and
  `/tools/ev-to-sp`, 61 tests passing) — so the contradiction the ticket describes appears resolved,
  but the underlying ruling is still unconfirmed. **Worth re-reading before closing.**
- **VGC-290** — do Champions M-A/M-B actually allow restricted Pokémon? Wrong legality rulings are
  user-visible and damage trust more than a missing feature.
- **VGC-301** — needs VGC-291 (`statForm` on `ParsedPokemon`) on main first. It is on #92.
  Independently confirmed twice tonight: `parseShowdownPaste` takes no options parameter on main.
- **VGC-236** — needs the Vercel env var verified before the legacy name can be dropped.
- **VGC-305** — needs a human to rotate the Discord webhook in Discord's UI. ~5 minutes, and three
  separate runs have now rediscovered it. **The single highest-value human action on the board.**
- **VGC-289** — stale; M-C is fully supported on main (confirmed three ways, including 81 M-C Megas
  at `mega-pokemon.ts:786`).

## E. Scope notes

- **VGC-227** shipped the `/blog` route but **no sitewide link to it** — `Navbar.tsx` and
  `PageFooter.tsx` ownership. `/blog` is in the sitemap but has no internal link, which limits its
  crawlability. Needs a one-line nav/footer addition once #91 lands.
- **VGC-227's editorial brief is stale**: it targets a Reg M-A meta post, but M-C is the live format.
  Needs re-scoping before any real post is written. Draft copy is in
  `.swarm/drafts/vgc227-blog-post-draft-16-11-26.md`, unpublished.
- **VGC-217** deferred "sample threats the spread targets, auto-computed from the speed tier" —
  needs the speed-tier engine, a second ticket's worth of work.
- **VGC-226** is shipped but its **`rental_code` column and 6-char validation were never built**,
  and `TeamOverview.tsx:411` calls `clipboard.writeText` with no `try`/`catch` (it throws on
  insecure origins and when permission is denied). Small follow-up, worth a ticket.
- **npm audit has got worse, not better**: 23 advisories (7 high + 16 moderate) now via
  `@vercel/blob`, `follow-redirects` and `joi`. C4 judged **none prod-reachable**. VGC-248 should be
  re-scoped to accept/document; **VGC-221 is stale** (Clerk is already 7.3.2 and js-cookie is gone).
- **The hardcoded-secret guard test misses `VAPID_PRIVATE_KEY` entirely** (C4). Small, worth fixing.
