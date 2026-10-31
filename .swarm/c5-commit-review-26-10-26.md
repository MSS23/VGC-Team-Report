# C5 — Code review of recent history (last 20 commits)

- **Date:** 2026-10-26
- **Branch:** `swarm-nightly-2026-10-26` (identical to `main` @ `68796c5`)
- **Scope:** `git log --oneline -20` → `68796c5` back to `d031232`
- **Mode:** strictly read-only. No source edits, no commits. The only write is this file.
- **PostHog:** credentials are absent from this container, so **no error-event cross-referencing was possible**. Nothing below is inferred from production telemetry; every finding is read off the diff and the current tree. Where I say "users see X" it is derived from code, not from observed events.
- **Verification run:** `vitest run src/lib/utils/__tests__/sprite-url.test.ts` → 16 passed. No full typecheck/build run (read-only audit, and not required for these findings).
- `conflict_risk: true` marks files listed in `.swarm/main-changed-files.md`.

## Commits reviewed

```
68796c5 feat(sprites): progressive sprite loading - static preview, then animated GIF
2231019 Merge branch 'hermes/oct-2026-security-bumps'
79787c0 fix: UI/UX touch-ups on the restored layout
c4938de revert: restore the pre-Hallmark layout and theme (back to 534a59b)
6f1007d fix: Oct 2026 security bumps (next 16.4.3, sharp 0.35.5, npm audit fix)
3d42fc6 fix: no generation highlighted in the theme picker until the visitor picks one
bc21729 Merge remote-tracking branch 'origin/main' into codex/linear-board-completion
42eb053 design: restyle in the Hallmark Coral theme
d37bd9f fix: mobile layout cleanup after hallmark redesign
b041618 design: hallmark full redesign of the public pages, chrome and system
534a59b fix: speed tiers chain Scarf/Booster with Tailwind and apply paralysis last
99faa10 fix: SEO — drop site-wide homepage canonical/robots; missing /s/<id> is a real 404
55d5510 docs: replace create-next-app README; add 2026-10-10 review
62ab016 fix: phone/tablet/desktop UX audit P0 + P1 issues
b71707a feat: support Pokemon Champions Regulation M-C
759bcb6 test: give the cold-import draft persistence test a 5s wait
8f7a266 VGC-48: add editing presence, section threads and conflict-safe sync
38b2cd1 VGC-187: add real desktop and mobile PWA screenshots
ee56868 VGC-162: render static homepage sections on the server
d031232 VGC-158: split Pokemon detail slide into focused panels
```

---

# Findings — worst first

## F1 — HIGH — The revert threw away a known dark-mode fix; random accents now render the light-mode colour on 12 dark pages

- **Commit:** `c4938de` (revert)
- **Files:** `src/lib/utils/random-accent.ts:17-24` · `src/app/globals.css:263,283-285`
- `conflict_risk: true` (both files are in `main-changed-files.md`)

This is the clearest case of the revert destroying real work rather than just restoring an old look.

The Hallmark version of `applyRandomAccent` carried an explicit comment recording the CSS-cascade constraint, and branched on dark mode:

```js
// Inline custom properties outrank the [data-dark-mode] rule, so the dark variant is chosen here
const isDark = root.hasAttribute("data-dark-mode");
root.style.setProperty("--accent", isDark ? palette.darkAccent : palette.accent);
root.style.setProperty("--accent-surface", isDark ? palette.darkSurface : palette.surface);
```

The revert replaced it with the older, broken form (`src/lib/utils/random-accent.ts:17-24`):

```js
root.style.setProperty("--accent", palette.accent);           // light value, unconditionally
root.style.setProperty("--accent-light", palette.light);
root.style.setProperty("--accent-surface", palette.surface);
// Store dark variants as custom props for the dark mode selector to pick up
root.style.setProperty("--accent-dark", palette.darkAccent);
root.style.setProperty("--accent-surface-dark", palette.darkSurface);
```

That trailing comment is wrong, and the restored code cannot work. The "dark mode selector" is `[data-dark-mode]` at `globals.css:263`, which sets `--accent: var(--accent-dark, #FB7185)` at `globals.css:283`. Both the inline style and that rule target the **same element** (`document.documentElement`), and an inline custom property always beats an attribute-selector rule without `!important`. So `--accent` stays pinned at the light value and `--accent-dark` / `--accent-surface-dark` are written but never read — dead properties.

**What a user actually sees:** in dark mode, on any page that calls `applyRandomAccent()`, buttons/links/badges render the saturated light-mode accent against the `#0B0B1A` dark background — e.g. `emerald #059669` or `blue #2563EB` on near-black, instead of the intended `#34D399` / `#60A5FA`. That is a contrast failure against the 4.5:1 bar in the UI standards, and it is a coin-flip per page load because the palette is random. `--accent-surface` is worse: the light surface (`#ECFDF5`, near-white) is used as a *surface* colour in dark mode, so accent-surface chips render near-white with `text-accent` on top.

**Blast radius — 12 user-facing pages** call `applyRandomAccent()`: `PasteInput` (the main paste entry point), `ExploreContent`, `ChampionsContent`, `MegaLandingContent` (SEO-critical), `TournamentsContent`, `DashboardContent`, `dashboard/profile`, `dashboard/notifications`, `dashboard/privacy`, `ChangelogContent`, `FeedbackContent`, `CreatorProfile`.

This is not a style opinion — the previous author had already diagnosed and fixed it, left the reasoning in a comment, and the revert silently undid both the fix and the knowledge.

**Secondary, same area:** `clearRandomAccent()` + `reapplyCurrentTheme()` is only called from `src/components/home/HomePageClient.tsx:618`. On the other 11 pages the random accent permanently overrides the gen theme the visitor explicitly chose in the navbar picker, with no path back until they land on the home page. Pre-existing to the revert, but the revert re-cemented it.

---

## F2 — MEDIUM-HIGH — Progressive sprites doubled every sprite request; ~30 of 32 call sites opt in by default, including 18-30px icons

- **Commit:** `68796c5`
- **Files:** `src/components/report/PokemonSprite.tsx:27,57-88` · `src/lib/utils/sprite-url.ts:133-160`
- `conflict_risk: true` (`PokemonSprite.tsx`, `sprite-url.ts`)

`getProgressiveSpriteUrls` is clean and tested. The problem is the interaction with the component's default.

`PokemonSprite.tsx:27` declares `animated = true` as the **default**. Of 32 `<PokemonSprite>` call sites in `src/`, only **2** pass `animated={false}`. Before this commit each of those ~30 sites issued **one** request (the GIF). Now each issues **two**: the HOME PNG preview in the `<img>`, plus a background `new Image()` preload of the full animated GIF at `PokemonSprite.tsx:66-76`. The GIF is still downloaded in full — nothing was saved, a PNG was added.

The commit message justifies this as fixing "a blank card while GIFs download" on team import, which is a real six-sprite case. But the default applies it everywhere, and the worst offenders are sprites where an animated GIF has no value at all:

- `src/components/report/MatchupSheetRow.tsx` — sprites at `size={18}`, `size={20}`, `size={26}`, `size={30}`, rendered **per matchup row**. Every one of these now pulls a full-resolution animated GIF to display in an 18px box.
- `src/components/report/MatchupPlanSlide.tsx` — `size={18}`, `size={20}`, `size={28}` likewise.
- `src/components/report/PokemonDropdown.tsx` — `size={32}`, `size={44}` per dropdown entry.

**What a user actually sees:** on the matchup sheet / threat matrix, sprite request count roughly doubles and total bytes go up, which is felt most on mobile data — the exact surface the recent UX-audit commits were tightening. There is no `size` threshold gating the GIF phase.

Additionally, `PokemonSprite.tsx:71` sets `candidate.fetchPriority = priority ? "high" : "auto"` on the **background** preload. For a `priority` sprite (the LCP element) that puts a background GIF fetch at high priority, competing with the LCP image it is supposed to be deferring to.

---

## F3 — MEDIUM — Sprite `onError` can swallow a preview failure and permanently stall the fallback chain

- **Commit:** `68796c5`
- **File:** `src/components/report/PokemonSprite.tsx:99-130`
- `conflict_risk: true`

The guard in `onError` tests the raw state, while the rendered `src` is chosen from the *filtered* value:

```js
const liveAnimatedSrc =
  animatedSrc && progressiveUrls.animated.includes(animatedSrc) ? animatedSrc : null;
const src = isPrint ? `/api/sprite?u=${encodeURIComponent(rawSrc)}` : (liveAnimatedSrc ?? rawSrc);
...
onError={() => {
  if (animatedSrc) {          // <-- raw, not liveAnimatedSrc
    setAnimatedSrc(null);
    return;                   // <-- consumes the error, urlIndex not advanced
  }
  setUrlIndex((prev) => Math.min(prev + 1, urls.length - 1));
}}
```

When `animatedSrc` holds a URL from the *previous* species/theme, `liveAnimatedSrc` is `null`, so the element is showing a **preview** URL. If that preview 404s in that window, the handler attributes the failure to the animated sprite, clears `animatedSrc`, and returns **without advancing `urlIndex`**. `src` is unchanged, so the browser fires no further `error` event and the fallback chain is stuck: the user gets a broken-image icon instead of falling through to the gen5 PNG and ultimately `gen5/substitute.png`.

The window is the render between a `species`/`genTheme` change and the reset effect committing — reachable by swapping a Pokémon in `InlinePokemonEditor` or switching gen theme while a sprite is mid-load. The fix is to test `liveAnimatedSrc` in the guard, not `animatedSrc`. Narrow, but it is in the exact code path the commit's own "Review fixes on top of the original change" notes were patching, which suggests this area was iterated on under time pressure.

**Not a bug (checked):** `urls[Math.min(urlIndex, urls.length - 1)]` cannot produce a negative index — `getGenThemedSpriteUrls` always pushes `gen5/substitute.png`, so the list is never empty.

---

## F4 — LOW-MEDIUM — `getProgressiveSpriteUrls().preview` is documented as static but contains an animated GIF

- **Commit:** `68796c5`
- **File:** `src/lib/utils/sprite-url.ts:135,151-157` (and `sprite-url.ts:110-123`, the non-animated branch it delegates to)
- `conflict_risk: true`

`preview` is built as `getGenThemedSpriteUrls(species, genTheme, false, shiny)` and its doc comment says *"Lightweight static sprites shown while an animation downloads."* But the non-animated branch of `getGenThemedSpriteUrls` pushes an animated fallback at step 4 for any species not in `STATIC_ONLY_SLUGS`:

```js
} else {
  // 4. Animated fallback
  urls.push(`${BASE_URL}/${shiny ? "ani-shiny" : "ani"}/${slug}.gif`);
}
```

So for a gen9 theme the preview list is `[home/x.png, gen5/x.png, ani/x.gif, gen5/substitute.png]` — a GIF at index 2. If the HOME PNG 404s (newly released species, unusual forms), the "lightweight preview" falls through to the **full animated GIF**, defeating the feature's entire purpose, and `pixelated` flips off mid-load because `isGif` becomes true.

The new test asserts `urls.animated.every(url => url.endsWith(".gif"))` but makes no assertion that `preview` is GIF-free, so this is uncovered. A one-line `.filter(url => url.endsWith(".png"))` on `preview` plus an assertion would close it.

---

## F5 — LOW-MEDIUM — `79787c0` claims an emoji sweep it did not finish

- **Commit:** `79787c0`
- **Files:** `src/components/report/SpeedTierChart.tsx:64-67` · `src/components/report/AddOpponentInput.tsx:12-21`
- `conflict_risk: true` (both)

The commit message says *"Emoji icons replaced with inline SVG (calc category tabs, remove-calc button, tera marker)"*, and the UI standards in CLAUDE.md say **SVG icons only**. The sweep converted `CalcInput.tsx` correctly but left two emoji icon tables behind:

```js
// SpeedTierChart.tsx:64-67
const MODIFIER_CONFIG: Record<SpeedModifier, { label: string; icon: string; ... }> = {
  tailwind:  { label: "Tailwind",  icon: "\u{1F4A8}", description: "×2 speed" },
  paralysis: { label: "Paralysis", icon: "\u{26A1}",  description: "×0.5 speed" },
  icywind:   { label: "Icy Wind",  icon: "\u{2744}\u{FE0F}", description: "-1 stage" },
};
```

plus `AddOpponentInput.tsx:12-21` (`Sun`, `Snow`, `Hyper Offense`, `Balance`, `Goodstuffs`). These render at `SpeedTierChart.tsx:133`. Emoji render inconsistently across platforms and do not inherit `currentColor`, which is why the standard exists.

**Verified complete, to the commit's credit:** the `9px → 10px` half of the same commit *was* site-wide — `grep -rn 'text-\[9px\]' src/` returns **0**.

---

## F6 — LOW — No test exists for `random-accent.ts`, which is why F1 regressed silently

- **Commit:** `c4938de` (and `42eb053`, `b041618` before it)
- **File needing a test:** `src/lib/utils/__tests__/random-accent.test.ts` — **does not exist**

CLAUDE.md: *"New logic in `src/lib/` gets a vitest test beside it (`__tests__/`); regressions get a test that names the bug."*

I scanned all 20 commits for `src/lib/**` changes without a test in the same commit. Test discipline is **generally good** — `68796c5`, `534a59b`, `b71707a` and `8f7a266` all shipped tests alongside. The single systematic gap is the theming utilities, and it is the gap F1 fell through:

| Commit | `src/lib` files changed | Test in same commit |
|---|---|---|
| `c4938de` | `accent-themes.ts`, `utils/random-accent.ts`, `utils/type-colors.ts` | **none** |
| `42eb053` | `accent-themes.ts`, `utils/random-accent.ts` | **none** |
| `b041618` | `utils/random-accent.ts`, `utils/type-colors.ts` | **none** |

Across 60 test files in `src/`, there is **no** test for `random-accent.ts`, `accent-themes.ts`, `type-colors.ts`, or `mega-detect.ts`. A single test asserting that `applyRandomAccent()` sets `--accent` to the palette's `darkAccent` when `data-dark-mode` is present on `documentElement` would have gone red the moment `c4938de` landed.

Lower-priority gap: `src/lib/utils/mega-detect.ts` was changed by `b71707a` with no test file of its own (legality and sprite-slug were both covered). Given Megas change **types, abilities and base stats**, item→Mega detection is worth direct coverage.

---

## F7 — `// ponytail:` markers — 3 in `src/`, 4 repo-wide

Each is a self-declared unfinished edge. All four are honest and well-written — none is a disguised bug — but all four are open ends.

| # | Location | Admission | Assessment |
|---|---|---|---|
| 1 | `src/hooks/useTeamReport.ts:25` | 30-day draft TTL is the *only* bound on a stale draft resurfacing; a publish from another device/browser cannot flip this device's marker. "Server-side check if this ever hurts." | Real, user-visible: publish on desktop, and mobile keeps offering the same team as a local-only "draft" for up to 30 days. Needs the server-side check. |
| 2 | `src/app/api/webhooks/linear/route.ts:66` | No delivery-id dedupe — within the 60s window a replay is possible. "Add a seen-id cache if this webhook ever mutates state." | Correctly scoped and currently harmless: the handler only answers `url_verification` and returns `{ok:true}`; it mutates nothing. The condition attached to it is the thing to watch — **this becomes a security bug the moment anyone adds a side effect to this route.** Signature verification and the timestamp window are both correct (`timingSafeEqual`, length-checked). |
| 3 | `src/lib/data/type-chart.ts:189` | Dry Skin's extra Fire weakness is not modelled — `ABILITY_IMMUNITIES` handles immunities only. | Real correctness gap in the defensive chart: a Dry Skin mon shows its Water immunity but *not* its ×1.25 Fire weakness, so `DefensiveCoverageChart` understates a genuine Fire threat. Narrow (Dry Skin is rare in VGC) but it is a wrong number shown to a user as fact. |
| 4 | `.github/workflows/ci.yml:22` | 35 pre-existing lint errors; `npm run lint` runs with `continue-on-error: true`. "remove continue-on-error" once cleared. | Outside `src/` but the most consequential: **lint is not a gate.** New lint errors, including `react-hooks` violations, land green. Note `package.json:63-65` pins `overrides: { "eslint-plugin-react-hooks": "7.0.1" }` because 7.1.1 adds 52 more errors (`6f1007d`) — so the debt is now *frozen in place* by a version pin on top of a non-blocking step. |

No `TODO`/`FIXME`/`HACK` markers were introduced by these 20 commits beyond the above.

---

# Verified clean — things I checked that are NOT problems

Recording these so the next audit does not re-spend effort, and because "the revert was sloppy" turned out to be mostly false.

**The revert's file cleanup was thorough.** `c4938de` deleted `src/app/tokens.css`, `src/app/base.css`, `design.md`, `.hallmark/.gitignore`, `.hallmark/log.json`. I checked for every class of leftover:

- No reference anywhere in `src/`, root `*.ts`, `*.json`, `*.md` or `.github/` to `tokens.css`, `base.css`, `hallmark` or `Hallmark`.
- `.hallmark/` is gone from disk, and its `.gitignore` entries were removed in the same commit — no orphaned ignore rules, no untracked junk.
- `src/app/globals.css` opens with `@import "tailwindcss";` and does **not** import the deleted stylesheets.
- The Coral design system left **no** stale tokens: `grep -c oklch src/` → **0**; `--signal` / `--signal-dark` (which `applyRandomAccent` stopped setting) have **zero** remaining references in `src/`.
- `AGENTS.md` survived correctly as a pointer, with the auto-generated `nextjs-agent-rules` block removed. Consistent with CLAUDE.md's "don't duplicate content there".
- The `next.config.ts` CSP revert is **coherent**: it dropped `api.fontshare.com` (style-src) and `cdn.fontshare.com` (font-src), and `grep -rn fontshare src/` → **0**. The restored `layout.tsx:3` uses `next/font/google` (`Sora`, `JetBrains_Mono`), already covered by the retained `fonts.googleapis.com` / `fonts.gstatic.com` entries. No CSP-blocked font.

**`3d42fc6` being reverted was intentional and is correct.** The revert message explicitly lists it, and I confirmed `hasGenTheme` / `hasStoredTheme` are entirely absent from `src/` at HEAD, with `Navbar.tsx:711` back to `const isActive = genTheme === theme.id` and `useHomePage.ts:281` back to `genTheme: genTheme || undefined`. I initially flagged this as a lost bugfix, but it is **not** a regression: `3d42fc6` only mattered under the Hallmark *Coral* default, where highlighting gen9/SV was wrong because the page was not in a gen theme. Post-revert `gen9` is the genuine default (`getServerSnapshot()` returns `"gen9"`, `GEN_PRESETS` is the live accent source), so highlighting SV reflects reality and pinning `gen9` into the share payload matches the documented intent of keeping a shared report's appearance stable. No action needed.

**The merge `2231019` is clean.** `git show --stat` shows only `package.json` + `package-lock.json`, the security bumps all survived (`package.json:35` `"next": "^16.4.3"`, `:63-65` the `react-hooks` override), and there are **no conflict markers** anywhere in `src/` or `package.json`. The revert touched `next.config.ts` and the security branch did not, so there was no real overlap to mis-resolve.

**`534a59b` (speed tiers) is high-quality work** and worth calling out as the counter-example to F1/F2. It correctly identified that separately flooring each modifier is off by one on odd speeds, moved the maths into `src/lib/analysis/stat-calculator.ts:77-95` as `calcBattleSpeed`, chained boost × Tailwind into one multiply, implemented `pokeRound` properly (`Math.ceil(s * chained - 0.5)`, .5 rounds down), applied paralysis last per Gen 7+, and shipped 5 regression tests that name the bug (`101 Spe -> 303, not 302`). Domain assumptions check out; the level-50 convention is respected.

**`b71707a` (Reg M-C) domain constants are correct:** `CHAMPIONS_MAX_SP_PER_STAT = 32` and `CHAMPIONS_TOTAL_SP = 66`, matching CLAUDE.md. It shipped 5 test files including `champions-legality.test.ts` and `detect-regulation.test.ts`.

**One pre-existing duplicate, *not* a revert leftover.** Both `src/app/notifications/` and `src/app/dashboard/notifications/` exist as live routes with substantially different implementations (428 diff lines), and they are linked from different places — `NotificationBell.tsx:183` → `/notifications`, `DashboardContent.tsx:154` → `/dashboard/notifications`. I suspected the revert had resurrected a moved directory, but `git log` shows both paths were touched together by `53395ca`, i.e. they have coexisted since **before** the Hallmark work. Real duplication worth a ticket, but do not attribute it to `c4938de`.

---

# Proposed follow-up Linear tickets

| # | Proposed title | Priority | Rationale |
|---|---|---|---|
| 1 | `fix: random accent ignores dark mode — restore the dark-variant branch lost in the revert` | **P1 (bug)** | `random-accent.ts:17-24` sets the light accent unconditionally; the inline property outranks `[data-dark-mode]`, so 12 pages render saturated light accents (and near-white accent surfaces) on `#0B0B1A` in dark mode, failing the 4.5:1 standard. Fix is the branch `c4938de` deleted. |
| 2 | `test: add random-accent / accent-themes dark-mode regression tests` | **P2** | No test exists for `src/lib/utils/random-accent.ts`; a test naming ticket 1's bug is what would have caught the revert. Covers `accent-themes.ts` and `type-colors.ts` in the same pass. |
| 3 | `perf: gate the animated-GIF phase on sprite size and opt-in` | **P2** | `PokemonSprite` defaults `animated = true`, so ~30 of 32 call sites now fetch a PNG *and* a full GIF — including 18–30px icons in `MatchupSheetRow` / `MatchupPlanSlide`, rendered per row. Doubles sprite requests for no visual gain on mobile data. |
| 4 | `fix: PokemonSprite onError swallows a preview failure and stalls the fallback chain` | **P2 (bug)** | `PokemonSprite.tsx:124` guards on `animatedSrc` instead of `liveAnimatedSrc`; a stale value makes a failing preview consume its own error without advancing `urlIndex`, leaving a permanent broken-image icon instead of the substitute sprite. |
| 5 | `chore: clear the 35 lint errors and make CI lint blocking` | **P2** | `ci.yml:22` runs lint with `continue-on-error: true` and `package.json:63-65` pins `eslint-plugin-react-hooks` to 7.0.1 to hide 52 more. Lint is not a gate, so new `react-hooks` violations land green — the frozen-debt shape makes this worse over time. |
| 6 | `fix: model Dry Skin's Fire weakness in the defensive type chart` | **P3** | `type-chart.ts:189` admits `ABILITY_IMMUNITIES` handles immunities only, so a Dry Skin mon's ×1.25 Fire weakness is absent and `DefensiveCoverageChart` understates a real threat. |
| 7 | `fix: finish the emoji→SVG sweep (SpeedTierChart, AddOpponentInput)` | **P3** | `79787c0` claimed the sweep but left `SpeedTierChart.tsx:64-67` and `AddOpponentInput.tsx:12-21` on emoji, against the "SVG icons only" standard; emoji don't inherit `currentColor`. |
| 8 | `fix: preview sprite list should contain no GIFs` | **P3** | `getProgressiveSpriteUrls().preview` is documented as static but inherits an `ani/*.gif` fallback at index 2, so a missing HOME PNG makes the "lightweight preview" the heavy GIF. One-line filter plus an assertion. |
| 9 | `chore: de-duplicate /notifications and /dashboard/notifications` | **P3** | Two live routes with 428 lines of divergence, linked from `NotificationBell.tsx:183` and `DashboardContent.tsx:154` respectively — two notification UIs that can drift. Pre-existing, not from the revert. |
| 10 | `fix: server-side draft check so a publish on one device clears drafts on others` | **P3** | `useTeamReport.ts:25` admits the 30-day TTL is the only bound; a team published on desktop keeps resurfacing on mobile as a local-only draft for up to 30 days. |
| 11 | `chore: add delivery-id dedupe to the Linear webhook before it mutates state` | **P4** | `webhooks/linear/route.ts:66` is correctly scoped today (the handler mutates nothing), so this is a tripwire, not a live bug — but it must be done before any side effect is added to that route. |
