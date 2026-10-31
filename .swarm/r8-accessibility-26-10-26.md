# R8 — Accessibility Audit (WCAG 2.1 AA) — 2026-10-26

**Branch:** `swarm-nightly-2026-10-26` · **Method:** static analysis only (no live site, no browser).
**Scope:** public marketing/content pages (`/`, `/faq`, `/champions`, `/champions/[pokemon]`, `/tools/ev-to-sp`, `/privacy`, `/terms`, `/support`, `/changelog`) + the report viewer (`src/components/report/*`, `src/app/s/[id]`, and its host `src/components/home/HomePageClient.tsx`).

Contrast ratios below were computed from resolved token values (WCAG relative-luminance formula, alpha composited over the stated backdrop). Tailwind v4.2.1 palette colors were converted from their `oklch()` definitions in `node_modules/tailwindcss/theme.css`. Calculator: `/tmp/claude-0/-home-user-VGC-Team-Report/473a9bf0-444e-52e0-8050-a09b0aa51c8b/scratchpad/contrast.py`.

**Nearly every file cited is on the `main`-changed list, so almost all findings carry `conflict_risk: true`.**

---

## Severity counts

| Severity | Count |
|---|---|
| BLOCKER | 2 |
| SERIOUS | 5 |
| MODERATE | 6 |
| MINOR | 4 |
| **Total** | **17** |

---

## Resolved token reference

**Light** (`:root`, globals.css:6–48) — bg `#FAF9F6`, surface `#FFFFFF`, surface-alt `#F2F0EB`, border `#E0DDD5`, text-primary `#1A1A2E`, text-secondary `#4A4A68`, text-tertiary `#5E5E7A`, success `#16A34A`, warning `#D97706`, danger `#DC2626`.

**Dark** (`[data-dark-mode]`, globals.css:263–286) — bg `#0B0B1A`, surface `#141428`, surface-alt `#1C1C38`, border `#2A2A52`, text-primary `#F0EDE6`, text-secondary `#C0C0D8`, text-tertiary `#9898B8`.

**`--accent` is theme-dependent.** `src/app/layout.tsx:97` (blocking bootstrap) and `src/hooks/useTheme.ts:153–157` write `--accent` as an inline style on `:root`, choosing `preset.accent` in light mode and `preset.accentDark` in dark mode. All nine `accentDark` values are pale pastels (`#fda4af`, `#fcd34d`, `#86efac`, `#93c5fd`, `#7dd3fc`, `#fca5a5`, `#fdba74`, `#67e8f9`, `#c4b5fd`).

The core text tokens are all healthy (text-primary 16.2:1 / 16.7:1, text-secondary 8.1:1 / 10.9:1, text-tertiary 5.9:1 / 7.0:1 on their respective backgrounds). The failures below are all in accent, semantic, and hardcoded-palette colors.

---

## BLOCKER

### B1 — Dark mode: every `bg-accent text-white` button is 1.40–1.89:1 (unreadable)
`conflict_risk: true`

**WCAG 1.4.3 Contrast (Minimum) — AA.**

In dark mode `--accent` resolves to the pastel `accentDark` value, but the paired foreground stays `text-white`. There is no `dark:` override and no CSS mitigation anywhere in `globals.css`.

White on dark-mode accent:

| Theme | accentDark | white-on-accent |
|---|---|---|
| gen9 (default) | `#fda4af` | **1.89:1** |
| gen1 | `#c4b5fd` | **1.85:1** |
| gen5 | `#7dd3fc` | **1.67:1** |
| gen8 | `#67e8f9` | **1.45:1** |
| gen2 | `#fcd34d` | **1.44:1** |
| gen3 | `#86efac` | **1.40:1** |
| (globals.css:283 fallback `#FB7185`) | | **2.69:1** |

Light mode fails too for 7 of 9 themes: gen5 2.77, gen2 3.19, gen3 3.30, gen7 3.56, gen8 3.68, gen4 3.68, gen1 4.23. Only gen6 (4.83) and gen9 (4.70) pass.

`bg-accent text-white` appears **67 times in `src/`**, including:

- `src/components/input/PasteInput.tsx:435` — the primary "build report" CTA on `/` (the whole conversion path)
- `src/components/report/SlideNavControls.tsx:202` (and `:311` for the Base/Mega radios) — the **active** section tab in the report viewer's bottom nav (the only indication of which section you are in)
- `src/app/layout.tsx:100` — the skip-to-content link (`focus:bg-accent focus:text-white`)
- `src/app/faq/page.tsx:192`, `src/app/tools/ev-to-sp/page.tsx:350`, `src/app/champions/ChampionsContent.tsx:142,533`, `src/app/champions/[pokemon]/MegaLandingContent.tsx:197,258`, `src/app/changelog/ChangelogContent.tsx:219,280,383` — page CTAs and filter pills
- `src/components/report/SpeedTierChart.tsx:128` — active speed-modifier chips
- `src/components/report/CalcInput.tsx:301,377`, `src/components/report/TeamOverview.tsx:207,645`, `src/components/home/HomePageClient.tsx:802,836,996,1049,1456,1464,1763`

**Fix.** Introduce a paired foreground token instead of hardcoding white.

In `src/app/globals.css`:
```css
:root           { --accent-contrast: #FFFFFF; }
[data-dark-mode]{ --accent-contrast: #0B0B1A; }   /* 10.31:1 on #fda4af */
@theme inline   { --color-accent-contrast: var(--accent-contrast); }
```
Then replace `text-white` with `text-accent-contrast` on every `bg-accent` surface (sed-able: `bg-accent text-white` → `bg-accent text-accent-contrast`). Also darken the light-mode presets in `src/hooks/useTheme.ts` and the duplicated map in `src/app/layout.tsx:97` so white reaches 4.5:1 — e.g. gen5 `#0ea5e9` → `#0369a1`, gen3 `#16a34a` → `#15803d`, gen2 `#d97706` → `#a16207`, gen4 `#3b82f6` → `#1d4ed8`, gen7 `#ea580c` → `#c2410c`, gen8 `#0891b2` → `#0e7490`, gen1 `#8b5cf6` → `#6d28d9`.

---

### B2 — `dark:` utilities are wired to the OS, not to the app's theme toggle
`conflict_risk: true`

**WCAG 1.4.3 Contrast (Minimum) — AA.**

`src/app/globals.css:3–4` declares `@custom-variant creator` and `@custom-variant presenting` but **no `@custom-variant dark`**. With Tailwind v4.2.1 (confirmed from `node_modules/tailwindcss/package.json`) the `dark:` variant therefore defaults to `@media (prefers-color-scheme: dark)`.

The app's real theme is the `data-dark-mode` attribute on `<html>`, set from `localStorage["vgc-dark-mode"]` (`src/hooks/useDarkMode.ts:40–42`, bootstrapped at `src/app/layout.tsx:97`), with `prefers-color-scheme` used only as the first-visit default. The moment a user toggles the theme, the two diverge. **132 `dark:` utilities** across 28 files are affected.

**Scenario B — dark-OS user switches the app to light mode** (`dark:` applies over light surfaces). This is the severe case:

| Class | Color | on `#FFFFFF` |
|---|---|---|
| `dark:text-amber-300` | `#FFD230` | **1.45:1** |
| `dark:text-emerald-300` | `#5EE9B5` | **1.52:1** |
| `dark:text-sky-300` | `#74D4FF` | **1.67:1** |
| `dark:text-amber-400` | `#FFB900` | **1.72:1** |
| `dark:text-emerald-400` | `#00D492` | **1.94:1** |
| `dark:text-blue-400` | `#51A2FF` | **2.64:1** |
| `dark:text-rose-400` | `#FF637E` | **2.86:1** |
| `dark:text-red-400` | `#FF6467` | **2.89:1** |

**Scenario A — light-OS user switches the app to dark mode** (`dark:` never applies, light colors over dark surfaces):

| Class | Color | on `#141428` |
|---|---|---|
| `text-sky-700` | `#0069A8` | **3.09:1** |
| `text-emerald-700` | `#007A55` | **3.37:1** |
| `text-amber-700` | `#BB4D00` | **3.60:1** |
| `text-rose-600` | `#EC003F` | **4.00:1** |

Representative sites (all in scope):
- `src/app/changelog/ChangelogContent.tsx:25,32,39` and `:411,413,414` — the "New / Improved / Fixed" badges, the page's primary scanning affordance
- `src/components/report/pokemon-detail/StatsPanel.tsx:99,100,117,168,169` — nature-boost/nerf arrows and stat values
- `src/components/report/PokemonCard.tsx:515,516,533` — same, on every team card
- `src/components/report/TeamReport.tsx:221` — `text-amber-700 dark:text-amber-300` on the "some fields hidden by the creator" privacy notice
- `src/components/report/CommonModesSlide.tsx:85,86,393,396,419,432`, `src/components/report/TeamOverview.tsx:243,271,272,491,514,872,892`, `src/components/report/SlideNavControls.tsx:380`, `src/components/home/HomePageClient.tsx:977,1071,1211,1214,1215,1220,1339,1341`, `src/app/champions/ChampionsContent.tsx:257,334`

**Fix.** One line in `src/app/globals.css`, next to the two existing custom variants:
```css
@custom-variant dark (&:where([data-dark-mode], [data-dark-mode] *));
```
This makes all 132 existing `dark:` utilities track the real theme. Also note `.dark .walkthrough-spotlight` (globals.css:833) and `:is(.dark) .version-diff-border` / `::before` (globals.css:884, 950) target a `.dark` class that is **never added anywhere** — those rules are dead; retarget them to `[data-dark-mode]` in the same pass.

---

## SERIOUS

### S1 — `--danger` is not redefined for dark mode; error text fails AA
`conflict_risk: true`

**WCAG 1.4.3 — AA.** `--success`, `--warning`, `--danger` are defined only at `:root` (globals.css:25–27) and inside `#print-container` (globals.css:725–727). The `[data-dark-mode]` block (globals.css:263–286) redefines background/surface/border/text/accent but **omits all three**.

`--danger` `#DC2626` in dark mode: **4.04:1** on bg, **3.75:1** on surface, **3.42:1** on surface-alt. Used as body text at:
- `src/app/tools/ev-to-sp/EvToSpConverter.tsx:196, 222, 247` — the over-budget error message and the SP total; this is the tool's only error channel
- `src/components/report/PokemonCard.tsx:459, 473` — the "over 508 EVs" warning
- `src/components/report/pokemon-detail/StatsPanel.tsx:58`

(`--success` and `--warning` pass in dark, but fail in **light**: `#16A34A` 3.13:1 and `#D97706` 3.03:1 on `#FAF9F6`.)

**Fix.** Add to the `[data-dark-mode]` block (globals.css:285):
```css
--success: #4ADE80;   /* ~9.6:1 on #141428 */
--warning: #FBBF24;   /* ~10.3:1 */
--danger:  #F87171;   /* ~6.3:1 */
```
and darken the light values at globals.css:25–27 to `#15803D` / `#B45309` / keep `#DC2626`.

---

### S2 — Hardcoded dark-tuned palette colors in `SpeedTierChart` fail in light mode
`conflict_risk: true`

**WCAG 1.4.3 — AA.** These have no light/dark variant at all; they were picked for dark surfaces and are applied unconditionally.

| Line | Class | Color | on `#FFFFFF` |
|---|---|---|---|
| `SpeedTierChart.tsx:662` | `text-amber-500/60` (speed-boost label) | `rgba(254,154,0,.6)` | **1.59:1** |
| `SpeedTierChart.tsx:656, 641` | `text-amber-500` (boosted speed value, TIE badge) | `#FE9A00` | **2.13:1** |
| `SpeedTierChart.tsx:669, 677` | `text-emerald-500` (speed delta `+N`, rank change) | `#00BC7D` | **2.47:1** |
| `SpeedTierChart.tsx:583, 590, 654` | `text-purple-400` (Mega speed value / badge) | `#C27AFF` | **2.79:1** |
| `SpeedTierChart.tsx:601` | `text-blue-400` (Meta badge) | `#51A2FF` | **2.64:1** |
| `SpeedTierChart.tsx:669, 677` | `text-red-400` (negative delta / rank drop) | `#FF6467` | **2.89:1** |
| `SpeedTierChart.tsx:495` | `text-blue-500` (Meta Threats, active) | `#2B7FFF` | **3.76:1** |
| `PokemonCard.tsx:218, 461, 478` | `text-amber-500` (MVP label, EV total, badge) | `#FE9A00` | **2.13:1** |

The deltas and speed values are the chart's actual data — a light-mode user cannot read the numbers the slide exists to show. Same pattern at `src/components/report/PokemonCard.tsx:218` (`text-amber-500` MVP label, **2.03:1** on `#FAF9F6`), `:461`, `:478`, `:533` and `src/components/report/pokemon-detail/StatsPanel.tsx:58`.

**Fix.** Move each to the semantic token pair once B2 lands: `text-amber-500` → `text-warning`, `text-emerald-500`/`text-emerald-600 dark:text-emerald-400` → `text-success`, `text-red-400`/`text-rose-*` → `text-danger`, and for purple/blue use `text-purple-700 dark:text-purple-400` / `text-blue-700 dark:text-blue-400`.

---

### S3 — `focus:outline-none` replaced by a sub-3:1 translucent ring on ~25 form controls
`conflict_risk: true`

**WCAG 1.4.11 Non-text Contrast — AA** (and 2.4.7 in practice).

`globals.css:826–829` provides a good base ring (`*:focus-visible { outline: 2px solid var(--accent) }`), but it sits in `@layer base`. Tailwind's `focus:outline-none` utility lives in `@layer utilities`, which wins the cascade-layer ordering, so on these elements the base ring is removed and the only replacement is a 30–40% alpha accent ring:

| Ring | Composited | vs surface |
|---|---|---|
| `focus:ring-accent/40`, light, gen9 | `rgba(225,29,72,.4)` on `#FFFFFF` | **1.94:1** |
| `focus:ring-accent/40`, light, gen5 | `rgba(14,165,233,.4)` on `#FFFFFF` | **1.51:1** |
| `focus:ring-accent/40`, dark (gen9 `#fda4af`) | on `#141428` | **2.54:1** |
| `focus:ring-accent/30`, light, gen9 | on `#FFFFFF` | **1.63:1** |

Sites include `src/app/tools/ev-to-sp/EvToSpConverter.tsx:167,187` (every number input in the tool), `src/app/tools/ev-to-sp/page.tsx:350,356`, `src/app/changelog/ChangelogContent.tsx:193` (changelog search, `/30`), `src/app/champions/ChampionsContent.tsx:484`, `src/components/report/pokemon-detail/NotesPanel.tsx:23`, `src/components/report/CalcInput.tsx:226,372`, `src/components/report/AddOpponentInput.tsx:91,115`, `src/components/report/CommonModesSlide.tsx:238,574`, `src/components/report/MatchupPlanSlide.tsx:680`, `src/components/report/TeamOverview.tsx:197,545`, `src/components/report/PokemonCard.tsx:378`, `src/components/report/InlinePokemonEditor.tsx:168`.

**Fix.** Drop the alpha and switch to the `focus-visible` variant so mouse users are unaffected: replace `focus:outline-none focus:ring-2 focus:ring-accent/40` with `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface` and **delete the `focus:outline-none`** so the base `*:focus-visible` outline survives as a fallback. (`src/components/report/InlineDamageCalculator.tsx:17` and `src/components/report/pokemon-detail/CalcEntryGroup.tsx:142` already do roughly this — use them as the pattern.)

---

### S4 — Report-viewer slide-options sheet is a `role="dialog"` with no focus management
`conflict_risk: true`

**WCAG 2.4.3 Focus Order — A; 2.1.1 Keyboard — A.**

`src/components/report/SlideNavControls.tsx:426–442`. The sheet is announced as a dialog (`role="dialog" aria-label="Slide options"`) and its trigger declares `aria-haspopup="dialog" aria-expanded` (`:251–256`), but:

- no `aria-modal="true"`
- focus is never moved into the sheet when it opens
- no focus trap — the rest of the page stays in the tab order behind the (`aria-hidden`) backdrop
- focus is not returned to the trigger on close
- the sheet markup is rendered **before** the nav bar in DOM order (`:426` vs `:444`), so from the trigger a forward `Tab` skips past the whole sheet; a keyboard user must `Shift+Tab` backwards to reach its contents

On a phone this sheet is the *only* route to the Base/Mega form toggle (`:294–333`) and to the creator slide tools (`:335–384`), so keyboard and switch users are effectively locked out of those controls.

Escape *is* handled (`:165–172`) — that part is fine.

**Fix.** Port the already-correct implementation from `src/components/home/HomePageClient.tsx:381–422` (rAF focus-first-child, Tab-cycle trap, Escape, focus return in the effect cleanup) into `SlideNavControls`, add `aria-modal="true"` at `:434`, and move the sheet JSX after the nav `<div>` so DOM order matches visual/tab order.

---

### S5 — Speed-tier toggle buttons expose no pressed state
`conflict_risk: true`

**WCAG 4.1.2 Name, Role, Value — A.**

`src/components/report/SpeedTierChart.tsx` has eleven stateful toggles and **zero `aria-pressed`** (confirmed: the only `aria-*` in the file are two `aria-hidden` and one `aria-label`):

- `:122–135` — the per-side speed-modifier chips (Tailwind Scarf, Trick Room, etc.), rendered twice (your team + opponent)
- `:471–485` — "Mega Forms"
- `:487–502` — "Meta Threats"

State is conveyed **only** by `bg-accent text-white` vs `bg-surface-alt/50 text-text-secondary`. A screen-reader user cannot tell which modifiers are applied, which makes the resulting speed numbers meaningless. This also compounds B1: the "on" state is the 1.89:1 pastel-and-white combination.

**Fix.** Add `aria-pressed={active}` at `:124`, `aria-pressed={showMegaTiers}` at `:473`, `aria-pressed={showMetaThreats}` at `:489`. Move the explanatory `title` text at `:131`, `:474`, `:506`, `:509` into `aria-describedby` targets or visible helper text — `title` is not exposed on touch and is not keyboard-reachable.

---

## MODERATE

### M1 — Section tablist in the bottom nav has no arrow-key navigation and is actively blocked from it
`conflict_risk: true`

**WCAG 2.1.1 Keyboard — A / ARIA APG tabs pattern.**

`src/components/report/SlideNavControls.tsx:183–210` renders `role="tablist"` with four `role="tab"` buttons. Unlike the dot tablist in the same file (`:499–530`, which correctly does roving `tabIndex` + `handleSlideTabKeyDown` defined at `:406–421`), the section tablist has:

- no roving `tabIndex` (all four tabs are in the tab order)
- no `onKeyDown`
- no `aria-controls` and no `role="tabpanel"` anywhere in the app

Worse, `src/hooks/useSlideNavigation.ts:115` explicitly bails out when focus is on `role="tab"`:
```ts
if (!bypassFocusGuardRef.current && role === "tab") return;
```
So when a keyboard user focuses a section tab, arrow keys do **nothing at all** — neither tab navigation nor slide navigation. `src/app/changelog/ChangelogContent.tsx:196–218` already implements this pattern correctly.

**Fix.** Give the tabs (`:193–207`) `tabIndex={active ? 0 : -1}` and an `onKeyDown` modeled on `ChangelogContent.tsx:208–215`; or, simpler and more honest about what they are, drop `role="tablist"`/`role="tab"`/`aria-selected` and use plain buttons with `aria-current="true"` on the active one — which also removes the dead `role="tab"` guard in `useSlideNavigation.ts:115`.

### M2 — Form-field boundaries are 1.1–1.4:1 in both themes
`conflict_risk: true`

**WCAG 1.4.11 Non-text Contrast — AA.** `--border` is far too light to delimit a control:

| | ratio |
|---|---|
| light: `#E0DDD5` border vs its own `#FFFFFF` fill | **1.36:1** |
| light: `#E0DDD5` border vs `#F2F0EB` row backdrop | **1.19:1** |
| light: `#FFFFFF` fill vs `#F2F0EB` row backdrop | **1.14:1** |
| dark: `#2A2A52` border vs `#141428` fill | **1.34:1** |
| dark: `#2A2A52` border vs `#1C1C38` row backdrop | **1.22:1** |

Worst case is `src/app/tools/ev-to-sp/EvToSpConverter.tsx:146–187`: twelve number inputs, `bg-surface border border-border`, sitting inside `bg-surface-alt border border-border` rows — nothing in that stack reaches 1.5:1, so the input boundaries are invisible. Same combination at `src/components/report/InlinePokemonEditor.tsx:168`, `src/components/report/TeamOverview.tsx:197`, `src/components/report/PokemonCard.tsx:378`.

**Fix.** Add a dedicated control-boundary token — `:root { --border-control: #9A968C }` (3.0:1 on `#FFFFFF`), `[data-dark-mode] { --border-control: #585890 }` (3.1:1 on `#141428`) — expose it via `@theme inline`, and use `border-border-control` on inputs/textareas/selects while leaving `border-border` for decorative card edges.

### M3 — `text-accent` is used for body copy; fails 4.5:1 in light mode for 8 of 9 themes
`conflict_risk: true`

**WCAG 1.4.3 — AA.** Light-mode `--accent` on `#FAF9F6`: gen5 **2.63**, gen2 **3.03**, gen3 **3.13**, gen7 **3.38**, gen4 **3.49**, gen8 **3.50**, gen1 **4.02**, gen9 **4.46** (only gen6 passes at 4.59). On `--accent-surface` it is worse still (gen5 **2.60**, gen9 **4.28**).

Not decorative — these are small, information-bearing strings:
- `src/app/champions/ChampionsContent.tsx:127, 133, 228, 313, 380, 418, 443, 510`
- `src/app/champions/[pokemon]/MegaLandingContent.tsx:137` (the Mega's ability — the page's key fact), `:173`
- `src/app/tools/ev-to-sp/page.tsx:229` (glossary terms), `EvToSpConverter.tsx:222` (the SP total)
- `src/components/report/SpeedTierChart.tsx:514`, `src/components/report/PokemonDropdown.tsx:150,155`, `src/components/report/AddOpponentInput.tsx:119`

The same values also feed the base focus ring at `globals.css:827`, so gen5's ring is **2.63:1** — under the 3:1 required by 1.4.11.

**Fix.** Darken the nine light-mode `accent` presets as listed under B1 (`src/hooks/useTheme.ts:17–100` and the duplicated map in `src/app/layout.tsx:97` — keep them in sync). Reserve the existing lighter values for `--accent-light` / decorative borders.

### M4 — Nature-modifier arrows below 3:1 in light mode
`conflict_risk: true`

**WCAG 1.4.11 — AA.** The ▲/▼ glyphs that mark nature-boosted and nature-reduced stats:
- `src/components/report/pokemon-detail/StatsPanel.tsx:99` / `src/components/report/PokemonCard.tsx:515` — `text-emerald-500` `#00BC7D` on `#FFFFFF` = **2.47:1**
- `:100` / `:516` — `text-rose-500` `#FF2056` on `#FFFFFF` = **3.75:1** (passes 3:1 as non-text, fails 4.5:1 as the text glyph it actually is)

Gender symbols at `src/components/report/PokemonCard.tsx:267` are the same story: `text-blue-500` **3.76:1**, `text-pink-500` **3.58:1**.

They do carry `aria-label`s, so screen-reader users are covered; this is a low-vision issue only.

**Fix.** `text-emerald-700 dark:text-emerald-400` and `text-rose-700 dark:text-rose-400` (and `text-blue-700 dark:text-blue-400` / `text-pink-700 dark:text-pink-400`) — correct only once B2 has landed, otherwise the dark half never applies.

### M5 — Heading structure: skipped level on the overview slide, no `h1` in the editor
`conflict_risk: true`

**WCAG 1.3.1 Info and Relationships — A** (level skip is 2.4.10 AAA / axe `heading-order`).

The v5.26 claim **holds for the Pokémon detail slides**: `src/components/home/HomePageClient.tsx:1152` renders exactly one `sr-only` `h1` for every slide except physical slide 0, `src/components/report/pokemon-detail/PokemonSlideHeader.tsx:38` is `h2`, and its panels are `h3` (`MovesPanel.tsx:10`, `StatsPanel.tsx:29`, `NotesPanel.tsx:11`, `CalcsPanel.tsx:59`). `SpeedTierChart.tsx:428→439` is likewise a clean `h2`→`h3`. No duplicate `h1` exists — `TeamOverview.tsx:419` (`isReadOnly && !teamName`) and `:432` (`isReadOnly && teamName`) are mutually exclusive, and `HomePageClient.tsx:1152` is suppressed on slide 0.

Two real gaps remain:

1. **Skipped level on the shared read-only overview slide.** `TeamOverview.tsx` contains no `h2` at all. The flow is `h1` (`:432`) → `h3` "Team Details" (`:531`) / `h3` team summary (`:668`) → `h4` Tags (`:604`), and each `PokemonCard` starts at `h3` (`PokemonCard.tsx:244`) → `h4` (`:391`, `:428`). Level 2 is never used.
2. **No `h1` in the editor.** On physical slide 0 with `isReadOnly === false`, `HomePageClient.tsx:1152` is suppressed *and* both `TeamOverview` `h1` branches require `isReadOnly` — so the builder's overview view has no `h1` and its first heading is `h3`.

**Fix.** Promote `TeamOverview.tsx:531` and `:668` to `h2` and `PokemonCard.tsx:244` to `h2` (with `:391`/`:428` → `h3`); change the condition at `HomePageClient.tsx:1152` from `physicalSlide !== 0` to `(physicalSlide !== 0 || !isReadOnly)`.

### M6 — Touch targets under 44×44px in report-viewer controls
`conflict_risk: true`

Project standard (CLAUDE.md UI standards) is 44×44; WCAG 2.1 AA has no target-size SC, so these are standards violations rather than AA failures, but they are concentrated in the viewer's controls.

- `src/components/report/CalcInput.tsx:327, 342` — `min-h-[32px]` category chips and the "paste calc" button
- `src/components/report/CalcInput.tsx:377` — `min-h-[40px]` submit
- `src/components/report/SlideNavControls.tsx:511` — slide dots are `w-5 h-5` (20×20) on fine pointers and `pointer-coarse:w-7 pointer-coarse:h-11` (**28×44**) on touch; width is short
- `src/components/home/HomePageClient.tsx:1200, 1308, 1342, 1373, 1391` and `:1057` — `px-3 py-1.5 text-xs` / `text-[11px]` share, privacy and fork controls compute to roughly **28px** tall
- `src/components/report/SlideNavControls.tsx:395` — `min-h-[40px]` (desktop-only, low impact)

**Fix.** `min-h-[32px]` → `min-h-11`; `pointer-coarse:w-7` → `pointer-coarse:w-11` at `SlideNavControls.tsx:511`; add `min-h-11` to the `HomePageClient` action pills (several siblings at `:1393`, `:1456` already have it).

---

## MINOR

### N1 — No "previous slide" control on mobile
`conflict_risk: true`
`src/components/report/SlideNavControls.tsx:462–481` deliberately omits `prevButton` on phones ("swipe covers it"). Keyboard users are fine (the window listener at `useSlideNavigation.ts:130` handles ArrowLeft), but a VoiceOver/TalkBack user who navigates by control cannot step back one slide — the section tabs only jump to a section's first slide. **Fix:** render `prevButton` in the mobile row at `:479` (next to `{nextButton}`), or add an `sr-only` previous button.

### N2 — Reduced motion not honoured by Framer Motion
`conflict_risk: true`
`motion@12` animations run with the library default `reducedMotion: "never"`, and the CSS rule at `globals.css:812–819` cannot reach JS-driven animations. In scope: `src/app/changelog/ChangelogContent.tsx:123–126, 165–168, 267–272, 374–377` and `src/app/champions/[pokemon]/MegaLandingContent.tsx:38–43, 180–183`. Only `src/components/explore/ExploreFilters.tsx:130` calls `useReducedMotion()`. Also `MegaLandingContent.tsx:41–43` animates **`width`** over **600ms** — both a layout-thrashing property and well past the 150–300ms transform/opacity standard; `ChangelogContent.tsx:126` is 450ms. **Fix:** wrap each page in `<MotionConfig reducedMotion="user">`, and change the stat bar to `initial={{scaleX:0}} animate={{scaleX:1}}` with `transformOrigin:"left"` at 250ms.

### N3 — `aria-label` on elements that cannot carry a name
`conflict_risk: true`
`aria-label` is prohibited on `role="generic"`, so these names are dropped: `src/components/report/SlideNavControls.tsx:229–236` (`<span aria-label="End of report">` wrapping the final check icon) and `src/components/report/SpeedTierChart.tsx:640–644` (`<div ... aria-label="Speed tie at …">` for the TIE badge — the visible text is only "TIE"). **Fix:** add `role="img"` (SpeedTierChart) or move the string into an `sr-only` span (SlideNavControls).

### N4 — Animations on non-transform/opacity properties; skip-link target is a `div`
`conflict_risk: true`
`globals.css:508–516` `.skeleton` animates `background-position`; `SlideNavControls.tsx:459–462` uses `transition-[width]`; `globals.css:884–899` `version-diff-pulse` animates `box-shadow` (its `infinite` loop *is* capped by the reduced-motion rule). Separately, `src/app/layout.tsx:100` targets `#main-content`, which is a plain `<div>` at `:137`; most browsers set the sequential-focus starting point correctly, but adding `tabIndex={-1}` to that div makes it deterministic.

---

## Verified clean

Worth recording so the next run does not re-litigate these:

- **Images.** Every `<img>` in scope has `alt`: `PokemonSprite.tsx:111` (`alt={species}`), `ItemIcon.tsx:35`, `MegaLandingContent.tsx:56`, `ChampionsContent.tsx:399`, `TeamOverview.tsx:472`; `HomePageServer.tsx:54` correctly uses `alt=""` for the decorative hero sprites.
- **No `onClick` on an unkeyed `div`/`span`** anywhere in scope. `TeamOverview.tsx:87–125` (the long-press/tap card wrapper) has `role="button"`, `tabIndex={0}`, `aria-label`, and Enter/Space in `onKeyDown`.
- **Slide changes are announced.** `SlideNavControls.tsx:547–549` is a persistent `sr-only aria-live="polite" aria-atomic="true"` region carrying "Slide N of M: label".
- **Arrow/Home/End/digit slide navigation** works from the document (`useSlideNavigation.ts:127–181`) and correctly declines to steal keys from editable fields and `role=radio|slider|listbox|menu` (`:108–114`).
- **`/tools/ev-to-sp` form semantics are exemplary** — `htmlFor`/`id` pairs, `aria-label`, `aria-describedby` to a `role="status" aria-live="polite"` budget panel, `aria-invalid`, and a labelled `role="progressbar"` with min/max/now (`EvToSpConverter.tsx:155–246`).
- **The export-theme modal is a correct dialog** — focus move, Tab trap, Escape, focus return (`HomePageClient.tsx:381–422`).
- **The changelog filter tablist is a correct ARIA tabs implementation** (`ChangelogContent.tsx:196–218`).
- **Landmarks and skip link.** A skip link exists (`layout.tsx:100`); `/faq`, `/privacy`, `/terms`, `/support`, `/champions`, `/champions/[pokemon]`, `/tools/ev-to-sp`, `/changelog` and every `HomePageClient` branch render `<main>`; breadcrumbs carry `aria-label="Breadcrumb"`.
- **Core text tokens pass comfortably** in both themes (5.5:1 minimum for `text-tertiary` on `surface-alt`).
- **`prefers-reduced-motion`** is handled globally for CSS animations (`globals.css:812–819`).
- **`ThreatMatrix.tsx:119–122`** is a model data table: scrollable `role="region"` with `tabIndex={0}`, `sr-only` `<caption>`, `scope="col"`/`scope="row"`, per-cell `aria-label`, and a `role="status"` detail line.

---

## Recommended order of work

1. **B2** — one line (`@custom-variant dark`). Nothing else is safe to fix until `dark:` means what it looks like it means.
2. **B1** — `--accent-contrast` token + mechanical `text-white` → `text-accent-contrast`. Highest user impact.
3. **S1** — three lines in the dark token block.
4. **S3** — strip `focus:outline-none` + de-alpha the rings.
5. **S4, S5, M1** — report-viewer keyboard/ARIA; all three are in `SlideNavControls.tsx` / `SpeedTierChart.tsx`.
6. **M3, S2, M4, M2** — palette and token sweep.
7. **M5, M6, N1–N4.**

Note for whoever picks these up: `src/app/globals.css`, `src/components/report/SlideNavControls.tsx`, `src/components/report/SpeedTierChart.tsx`, `src/components/report/PokemonCard.tsx`, `src/components/home/HomePageClient.tsx`, `src/app/changelog/ChangelogContent.tsx`, `src/app/tools/ev-to-sp/*` and `src/hooks/useTheme.ts` are all on `.swarm/main-changed-files.md` — rebase before editing.
