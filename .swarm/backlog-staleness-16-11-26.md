# Backlog staleness audit — 16 Nov 2026

**Scope:** all 68 Linear issues in `Backlog` (67) + `Todo` (1) for team `06531926-0387-4a3e-8325-8b7be754ced5`.
**Verified against:** `origin/main` @ `10dfd74` — every claim checked with `git grep <pat> origin/main` / `git show origin/main:<path>`, **not** the working tree.

> **Working-tree caveat (important):** sibling swarm agents are concurrently writing into this shared checkout —
> `src/app/blog/**` + `src/lib/data/blog-posts.ts` (VGC-227) and `src/app/explore/spreads/**` + `src/lib/spreads/**`
> (VGC-217). Those files are **untracked** and **not on main**. An early grep of the working tree made VGC-227
> look shipped; it is not. Every verdict below was therefore re-verified against the committed `origin/main` tree.
> Anyone reading this table tomorrow should re-check VGC-217 and VGC-227 against whatever landed overnight.

## Counts

| Bucket | Count |
|---|---|
| ALREADY DONE | 12 |
| PARTIALLY DONE | 9 |
| STILL OPEN | 18 |
| BLOCKED-ON-HUMAN | 11 |
| OUTREACH (no code check) | 15 |
| NOT-A-TASK | 3 |
| **Total** | **68** |

**Closeable tomorrow (ALREADY DONE):** VGC-79, VGC-84, VGC-122, VGC-136, VGC-221, VGC-226, VGC-239, VGC-240, VGC-249, VGC-252, VGC-263, VGC-289

---

## ALREADY DONE (12)

| ID | Title | Verdict | Evidence (file:line on origin/main) | Recommended action |
|---|---|---|---|---|
| VGC-79 | Inline damage calculator on Pokemon detail slides | ALREADY DONE | `src/components/report/InlineDamageCalculator.tsx`; dynamically imported + rendered at `src/components/report/pokemon-detail/CalcsPanel.tsx:13`; engine `src/lib/analysis/damage-calculator.ts:34` (`calculateReportDamage`) on `@smogon/calc` (`src/lib/analysis/spread-builder.ts:1`) | Close as Done |
| VGC-84 | Import from rental code | ALREADY DONE — ticket asks only for a "dedicated rental code UX" (store the code, paste the team alongside), not auto-resolve | Editor input `src/components/report/TeamOverview.tsx:576`; display + copy + QR `TeamOverview.tsx:457-474`; share card `src/components/ui/ShareModal.tsx:444-476`; persisted `src/app/api/share/route.ts:62`; Explore filter `src/app/api/explore/route.ts:143-146` | Close as Done (duplicate of VGC-226) |
| VGC-122 | i18n: Japanese (ja) translation pass | ALREADY DONE — `ja.ts` carries all 309 keys, same count as `en.ts` | `src/lib/i18n/translations/ja.ts`; loader `src/lib/i18n/index.ts:25` | Close as Done; file a separate ticket if native review is still wanted |
| VGC-136 | Home button accessible from every subcategory | ALREADY DONE — persistent section tab bar, "Overview" reachable from every slide incl. Pokémon detail | `src/components/report/SlideNavControls.tsx:151` (`{ key: "overview", label: t.overview, … }`), rendered for the whole report at `src/components/home/HomePageClient.tsx:1491` | Close as Done; reply to the reporter (Joshua Kalejaiye) |
| VGC-221 | Clerk major bump to clear js-cookie advisories | ALREADY DONE — ticket says "currently 4.x"; main is on `^7.3.2`, and `js-cookie` no longer appears in `npm audit` at all | `package.json` → `@clerk/nextjs: ^7.3.2`; `npm audit --json` → no `js-cookie` entry | Close as Done |
| VGC-226 | Rental-code field on report editor + copy-to-clipboard | ALREADY DONE | Editor `TeamOverview.tsx:576`; handler `TeamOverview.tsx:410-411`; monospace display + QR `TeamOverview.tsx:457-474`; share flow `ShareModal.tsx:286-296`; plumbing `TeamReport.tsx:63,155,259`, `useHomePage.ts:263,462`, `useTeamMeta.ts:181`, `PdfExport.tsx:35`, `api/share/route.ts:62` | Close as Done. See *Residual gaps* below — two sub-items were never built |
| VGC-239 | "Team Modes" section for general game plans | ALREADY DONE | `src/components/report/CommonModesSlide.tsx:27-28` (structured `combinations: TeamCombination[]` with leads/back), `:113-140`; persisted `api/share/route.ts` `commonModes` block; "Modes" nav tab `SlideNavControls.tsx:152` | Close as Done — VGC-244 is the same reporter thanking us for it |
| VGC-240 | Better team onboarding & usability (3 items) | ALREADY DONE — all three resolved | (1) tournament info demoted to metadata: `TeamOverview.tsx:425-445` + the explicit comment "The TEAM is the subject. teamName leads as H1 … we never promote a tournament name into the headline slot"; (2) Common Modes near top: `CommonModesSlide.tsx`, 2nd nav tab; (3) replay uploads: `git grep -i replay origin/main -- src/` returns **nothing** — the feature does not exist, so the ask is moot | Close as Done |
| VGC-249 | Stat bar colours + mega speed tier button | ALREADY DONE — both halves | (1) `src/components/report/StatColorNote.tsx:47` "Bar color = stat type, not quality", used by `pokemon-detail/StatsPanel.tsx:138` and `PokemonCard.tsx:548`; (2) mega speed tiers wired: `SpeedTierChart.tsx:190` (`resolveSpeedTierForm(mon, key, megaStates?.[i] === true)`), `:239`, `:266` | Close as Done |
| VGC-252 | Setting to hide the bar-colour note | ALREADY DONE — dismiss button, persisted per browser | `StatColorNote.tsx:12` (`vgc.display.hideStatColorNote`), `:30-39` dismiss + cross-instance sync event, `:39` `if (dismissed) return null` | Close as Done; reply to the reporter (Poke Peak) |
| VGC-263 | Levitate should show a ground immunity on the type chart | ALREADY DONE | `src/lib/data/type-chart.ts:190-202` `ABILITY_IMMUNITIES` (`levitate: "Ground"`, plus 10 more), applied `:230-231`; ability threaded through from `src/components/report/DefensiveCoverageChart.tsx:49-57` via `resolveEffectiveTyping` | Close as Done; reply to the reporter (Poke Peak) |
| VGC-289 | Reg M-C is the live format and is entirely unsupported | ALREADY DONE — the human-supplied M-C dex landed | `src/lib/data/tags.ts:9` includes `"Reg M-C"`; `:14-17` documents the M-A ⊂ M-B ⊂ M-C superset; prerender `src/app/champions/[pokemon]/page.tsx:28` (`getRegMCMegasWithSprites()`), `:226`; sitemap `src/app/sitemap.ts:3,35-36`; regression test `src/app/champions/[pokemon]/__tests__/generate-static-params.test.ts:40,74` | Close as Done |

---

## PARTIALLY DONE (9)

| ID | Title | What exists | What is missing | Recommended action |
|---|---|---|---|---|
| VGC-49 | Meta snapshot page with usage trends | `src/components/champions/MetaSnapshot.tsx` (top species + usage %), API `src/app/api/champions/meta/route.ts`, rendered at `src/app/champions/ChampionsContent.tsx:326` | No dedicated page; no rising/falling trend, no archetype distribution %, no winning-vs-popular split, no example-report links per archetype | Rescope to "extend MetaSnapshot into a /meta page" |
| VGC-72 | Discord bot for instant report previews | `src/lib/discord-bot.ts` (REST embeds/threads), `src/app/api/bot/route.ts`, `src/app/api/discord/route.ts` — but these serve the **feedback** system | No `/teamreport` slash command, no PokePaste-URL → preview-card flow, no slash-command registration | Rescope: the transport exists, only the command is missing |
| VGC-120 | i18n: next-intl + locale routing scaffold | Full custom i18n: `src/lib/i18n/index.ts:10-63` (`LANGUAGES`, lazy `translationLoaders`, `setLanguage` + localStorage), `src/components/ui/LanguageSelector.tsx`, 7 locales live, `useTranslation` consumed by ~20 components | No `next-intl`, no `/[locale]` routing, no middleware, no `/messages/*.json`. The **user-visible goal is met by other means**; the named implementation is not | Decide: close as "solved differently", or keep only if SSR/SEO per-locale URLs are actually wanted |
| VGC-123 | i18n: Spanish + French + German | `es.ts` (309 keys), `fr.ts` (309 keys) — plus unasked-for `it.ts`, `ko.ts`, `zh.ts` | **`de.ts` does not exist** (`git ls-tree origin/main src/lib/i18n/translations/`) | Rescope to "German only" — 2/3 done |
| VGC-124 | Localize Pokemon names + move names per locale | Move names done: `src/lib/data/move-names.ts` + `src/lib/utils/translate-move.ts:28` (`translateMove`) | Pokémon **species** names are not translated — no `POKEMON_NAMES` / `translateSpecies` anywhere on main | Rescope to "species names only" — half done |
| VGC-153 | Tiered publishing: public overview, private spreads | Shipped as VGC-142: owner toggles `src/components/report/TeamOverview.tsx:340-341,727`, public-shell explainer `:879`; **server-side** redaction `src/app/api/share/[id]/route.ts:12` + `src/lib/sharing/redact-paste.ts:21-39` (`evs`/`ivs`/`nature`/`item`); tests `src/lib/sharing/__tests__/redact-integration.test.ts` | The ticket's monetization hook: no "Get full spreads" CTA linking to the creator's Patreon / newsletter / profile. Viewers get an explanatory banner only | Rescope to just the creator-link CTA |
| VGC-248 | Clear remaining 12 moderate npm vulns | Stretch item **done**: CORS preview-origin regex already scope-slug-bound, `src/lib/security/cors.ts:20-28` documents the exact `vgc-team-report-evil.vercel.app` attack it blocks. `@sentry/nextjs` is **no longer a dependency** (checkbox moot). `postcss` advisory gone; `next` is `^16.4.3` | Ticket numbers are stale **and the situation is worse**: `npm audit` now reports **7 high + 16 moderate (23 total)** from a different chain — `@vercel/blob` → `zod`/`@vercel/oidc`/`@vercel/cli-config` (major bump), plus `follow-redirects`, `joi`, `systeminformation` (all non-major fixes available) | Rewrite the ticket against today's audit; the 3 non-major fixes are cheap wins |
| VGC-250 | Visual refinement of the Common Modes / leads | Free-text leads replaced by structured bring combinations — `CommonModesSlide.tsx:27-28` "Structured bring combinations (replaces the old free-text leads/modes)", reusing the Match-Ups lead/back slot model the reporter pointed at | Cannot verify the CybertronVGC slide-style visual treatment, nor the explicit "mode is superior to lead" nesting (modes containing several leads) | Needs a human eyeball against the reporter's reference video |
| VGC-318 | /s/[id] is a client-redirect shell | Substantial SEO work landed: server `generateMetadata` with DB read `src/app/s/[id]/page.tsx:26-41`, **self-canonical** `:143` (no longer canonicals to `/`), CreativeWork JSON-LD `:224-236`, hard `notFound()` on deleted/unknown `:198`, private reports forced `noindex` `:36-40`, and a meaningful sr-only `<h1>` derived server-side `:211-217` | The core ask is **not** done: the body is still a JS redirect shell — `:184` `const qs = \`?s=\${…}\`` handed to `ShareRedirectClient`. No crawlable report content; the cold-connection spinner remains | Rescope to "render report content server-side"; the metadata half is finished. Keep the ticket's OG-image exclusion |

---

## STILL OPEN (18)

| ID | Title | Verdict | Evidence of absence | Recommended action |
|---|---|---|---|---|
| VGC-5 | Pro subscription tier (Stripe) | STILL OPEN | No Stripe integration on main; only donation copy at `src/app/support/page.tsx:90` | Keep |
| VGC-6 | Tournament organizer plan | STILL OPEN (`no-claude`) | — | Keep |
| VGC-7 | Creator tier for streamers | STILL OPEN (`no-claude`) | Embeddable widget half-exists (`src/app/embed/[id]/`); the tier does not | Keep; note the embed route |
| VGC-8 | Native mobile app (Capacitor) | STILL OPEN | `git grep -i capacitor origin/main` → nothing | Keep |
| VGC-16 | VGC coaching marketplace | STILL OPEN (`no-claude`) | — | Keep |
| VGC-21 | Public API for developers | STILL OPEN (`no-claude`) | No API-key management; `src/lib/security/api-guard.ts` rate-limits by IP only | Keep |
| VGC-45 | Usage stats sidebar in report editor | STILL OPEN | No external usage-data source on main; `src/lib/cache.ts:119,128` `top-pokemon` is derived from our own reports only | Keep — blocked in practice by VGC-255 egress |
| VGC-51 | Battle log analysis from replays | STILL OPEN — **premise is false**: the ticket opens "We already support Showdown replay import". `git grep -i replay origin/main -- src/` returns nothing | — | Rewrite: replay import itself must be built first |
| VGC-55 | Creator articles | STILL OPEN | No articles table/route/component | Keep; overlaps VGC-227 |
| VGC-62 | Archetype guide pages (/guides/rain …) | STILL OPEN | No `/guides` route (`ls src/app/*/`) | Keep |
| VGC-63 | Weekly tournament recap blog posts | STILL OPEN | Needs a blog surface; none on main | Keep — gated on VGC-227 |
| VGC-81 | Suggested EV spreads from community usage | STILL OPEN | `SpreadBuilder.tsx` is a calculator, not an aggregation over Explore reports | Keep; shares SQL work with VGC-217 |
| VGC-82 | Team builder wizard for new players | STILL OPEN | `git grep -i wizard origin/main` → nothing. A first-run `WalkthroughOverlay` exists but tours the UI, it does not build a team | Keep |
| VGC-90 | Blog: how to build a VGC team report | STILL OPEN | No blog surface on main | Keep — gated on VGC-227 |
| VGC-131 | A11y: RTL layout support | STILL OPEN | No `dir`/`rtl` handling in `src/app/layout.tsx`; no logical-property migration | Keep |
| VGC-217 | Per-species EV-spread landing pages | STILL OPEN on `origin/main` | `git ls-files src/app/explore/spreads` → empty. The prerequisite **does** exist: `shares.species[]` + GIN index (`src/lib/db/migrations/add-species-column.sql`). **In progress tonight** on a sibling swarm branch (untracked `src/app/explore/spreads/`, `src/lib/spreads/`) | Do not re-assign — check the sibling branch first |
| VGC-227 | Build /blog/[slug] + first Reg M-A meta post | STILL OPEN on `origin/main` | `git ls-files src/app/blog` → empty. **In progress tonight** on a sibling swarm branch (untracked `src/app/blog/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/lib/data/blog-posts.ts` in this shared checkout) | Do not re-assign — check the sibling branch before anyone picks this up |
| VGC-241 | Add a short intro / mission statement | STILL OPEN | No mission copy in `src/app/page.tsx` or `src/components/home/`; the tagline alone ships | Keep — cheap win, reporter asked nicely |

---

## BLOCKED-ON-HUMAN (11)

| ID | Title | Why blocked | Code status on main | Recommended action |
|---|---|---|---|---|
| VGC-213 | Verify Linear webhook delivery + re-enable | Linear dashboard action | **Code fix is on main**: `src/app/api/webhooks/linear/route.ts:41` reads `linear-signature` (with `x-` fallback), `:34-35` accepts both env names | Re-enable + "Send test" in Linear, then close. Duplicate of VGC-222 — merge the two |
| VGC-215 | Run vgc195-db-repair.sql against production | Production Neon write | `.swarm/drafts/vgc195-db-repair.sql` prepared, never executed | Human runs the dry-run SELECT then the UPDATE |
| VGC-220 | Populate POSTHOG_API_KEY + DISCORD_WEBHOOK_URL in swarm container | Environment secrets | n/a | Set in the cloud environment config |
| VGC-222 | Linear webhook header bug fixed — re-enable | Same as VGC-213 | Same evidence as VGC-213 | **Close as duplicate of VGC-213** |
| VGC-236 | Standardise on LINEAR_WEBHOOK_SIGNING_SECRET | Needs Vercel dashboard verification before the 1-line removal | Both names accepted, `route.ts:34-35` | Human verifies the env var, then the fallback removal is a trivial follow-up |
| VGC-255 | Swarm container egress policy blocks every external data source | Infra policy | n/a | Decide: allowlist, or route data tickets to a human. **Gates VGC-45, VGC-81, VGC-289-class data work** |
| VGC-265 | ~30 unmerged nightly branches / review throughput | Process decision | Still true — 2 unmerged swarm branches (`swarm-nightly-2026-11-02`, `-11-09`) touch 117 source files as of tonight | Drain or close the branches; enable branch protection on `main` |
| VGC-290 | [Ruling needed] Does Reg M-A/M-B allow restricted Pokémon? | Needs an official-ruleset ruling | `src/lib/validation/champions-legality.ts` enforces max-2 restricted | Human ruling, then one code change |
| VGC-301 | Pass the regulation into parseShowdownPaste | Ticket itself asks for a product decision (changes displayed numbers on existing Champions reports) | **Ticket premise is partly wrong**: on main `parseShowdownPaste(paste: string)` (`src/lib/parser/showdown-parser.ts:171`) takes **no options param**, and `statForm` appears only in comments (`src/lib/analysis/stat-calculator.ts:268`) and a test. VGC-291's groundwork is **not on main** — probably on an unmerged branch (see VGC-265). Zero of the 13 call sites pass a regulation | Land VGC-291 first (or re-do it), then take the ruling |
| VGC-305 | [P0] Rotate the Discord webhook token in public git history | Discord UI action, ~5 min | Secret removed from the tree, still in pushed history | **Highest-value human action on this board.** Rotate the webhook |
| VGC-330 | [Ruling needed] Is 248 EVs worth 31 or 32 SP? | Needs an official-ruleset ruling; 3 runs have flipped the assertions | `public/llms-full.txt:92` still asserts both answers | Human ruling, then one change across calculator + tests + llms-full.txt |

---

## OUTREACH — no code check (15)

VGC-56, VGC-57, VGC-58, VGC-59, VGC-60, VGC-66, VGC-67, VGC-71, VGC-85, VGC-88, VGC-107, VGC-113, VGC-147, VGC-148, VGC-184.

VGC-147 / VGC-148 / VGC-184 are **three tickets for the same job** (get listed on Victory Road / VGCpedia / Smogon / DevonCorp). Recommend merging into one.

## NOT-A-TASK (3)

| ID | Title | Recommended action |
|---|---|---|
| VGC-164 | Claude Autonomous Queue Operator — Session Ledger | Leave open — the ticket says "Do not close this ticket" |
| VGC-238 | "Please do not let this die out… this tool is amazing!" | Praise, not a request. Reply and close |
| VGC-244 | "Thank you for implementing the modes section" | Praise, not a request. Reply and close (confirms VGC-239) |

---

## Residual gaps worth filing (small, concrete)

Found while checking VGC-226. Not filed — no Linear writes were made.

1. **Rental-code validation does not exist.** The ticket's "6 chars alphanumeric (per current Switch limits)" was never implemented: the editor input accepts `maxLength={20}` and any characters (`TeamOverview.tsx:576-580`), and the API stores it as a bare `z.string().optional()` (`api/share/route.ts:62`). No `src/lib/validation/rental-code.ts`.
2. **No `rental_code` column.** The ticket's DB migration was never written — the code lives only in the `shares.data` JSONB blob, which is why the Explore filter has to string-cast it (`api/explore/route.ts:143-146`). Works fine; the column is optional.
3. **The report-view copy button is less accessible than the ShareModal one.** `TeamOverview.tsx:458-470` has only a `title` — no `aria-label`, no `aria-live` success announcement, and `px-3 py-1.5` is under the 44×44px target. `ShareModal.tsx:463-465` does it correctly (`aria-label` that flips to "Rental code copied", `min-w-[44px] min-h-[44px]`, plus the shared live region at `ShareModal.tsx:331`). Also `TeamOverview.tsx:411` calls `navigator.clipboard.writeText` with **no `try`/`catch`**, which throws unhandled on non-HTTPS or permission-denied — the exact bug that was already fixed once in ShareModal (see changelog v5.10).
4. The two sub-items VGC-226 deferred — rental code in the OG image, and in Discord embed metadata — were never filed as their own tickets.
