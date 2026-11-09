# R8 — WCAG 2.1 AA audit: marketing/landing pages + report viewer

Branch: `swarm-nightly-2026-11-09` · Date: 2026-11-09 · Method: static analysis only (egress blocked, live site unreachable).
Contrast ratios below are computed from the actual token values in `src/app/globals.css`, the inline accent values written by the blocking script in `src/app/layout.tsx:97`, and Tailwind v4's default palette — not estimated.

**Scope audited**
Marketing/landing: `src/app/page.tsx` → `src/components/home/HomePageServer.tsx` → `src/components/input/PasteInput.tsx`; `/champions`, `/champions/[pokemon]`, `/faq`, `/terms`, `/privacy`, `/support`, `/tools/ev-to-sp`, `/changelog`, `/tournaments`, `/explore`.
Report viewer: `src/components/home/HomePageClient.tsx` (slide shell), `src/components/report/**`, `src/components/report/pokemon-detail/**`, `src/components/ui/{ShareModal,OTSSheetModal,ShortcutHintOverlay,WalkthroughOverlay,Toggle,Button}.tsx`, `src/app/s/[id]/**`.

**Totals: 35 findings — 2 critical, 9 high, 14 medium, 10 low. 25 are mechanically fixable tonight.**

---

## Ticket verification (asked for explicitly)

| Ticket | Claim | Status on THIS branch |
|---|---|---|
| **VGC-259** | report viewer renders no `h1` on any slide except the first | **Half fixed.** `src/components/home/HomePageClient.tsx:1152-1156` now renders an `sr-only` `<h1>` for every slide where `physicalSlide !== 0`, plus tournament mode. Read-only slide 0 is covered by `src/components/report/TeamOverview.tsx:419` / `:432` (mutually exclusive, so exactly one `h1`). **Still broken:** slide 0 in owner/edit mode has **no `h1` at all** — `TeamOverview`'s `h1`s are both gated on `isReadOnly`, so the first heading on the editor's overview slide is `<h3>Team Details</h3>` at `TeamOverview.tsx:531`. See H6. |
| **VGC-315** | dark-mode primary CTA fails AA | **CONFIRMED PRESENT, and worse than the ticket says.** `src/components/ui/Button.tsx:16` is `bg-accent text-white`; in dark mode the effective `--accent` is the gen theme's `accentDark` written inline by `layout.tsx:97`, so white-on-accent is **1.40:1 – 1.90:1 across all 9 themes**. 7 of 9 themes also fail in light mode. 72 call sites in 37 files. See C1. |
| **VGC-316** | `globals.css` declares no `@custom-variant dark`, so `dark:` utilities desync | **CONFIRMED PRESENT.** `src/app/globals.css:3-4` declares only `creator` and `presenting`. `git show origin/swarm-nightly-2026-11-02:src/app/globals.css` line 14 has the fix (`@custom-variant dark (&:where([data-dark-mode], [data-dark-mode] *))`) — that branch is **unmerged**, so this branch still has the bug. 142 `dark:` utilities across 28 files. See C2. |

---

# Fix tonight, no design decision needed

25 mechanical fixes. Replacement code is exact and copy-pasteable.

## 1. Restore the `dark:` variant binding — one line (fixes ~142 utilities at once)

`src/app/globals.css:4` — insert after line 4:

```css
@custom-variant presenting (&:where([data-presentation-mode] *));
@custom-variant dark (&:where([data-dark-mode], [data-dark-mode] *));
```

Dark mode is an attribute (`src/hooks/useDarkMode.ts:40`, `src/app/layout.tsx:97`), never a class or a media query, so Tailwind v4's default `dark:` = `prefers-color-scheme` is simply wrong here. Worst current outcomes are in the table under **C2**. Lift this verbatim from `origin/swarm-nightly-2026-11-02`.

## 2. Type badge text colours — 10 entries, all pass after the swap

`src/lib/utils/type-colors.ts:4-23`. Change `text:` from `"#FFFFFF"` to `"#1A1A2E"` for these 10 (the same ink the file already uses for Electric/Ice/Ground/Steel):

| line | type | now | after |
|---|---|---|---|
| 4 | `Normal` | 2.48:1 | `#1A1A2E` → 6.88:1 |
| 5 | `Fire` | 2.69:1 | `#1A1A2E` → 6.35:1 |
| 6 | `Water` | 3.10:1 | `#1A1A2E` → 5.51:1 |
| 8 | `Grass` | 2.08:1 | `#1A1A2E` → 8.20:1 |
| 13 | `Flying` | 2.67:1 | `#1A1A2E` → 6.40:1 |
| 14 | `Psychic` | 3.15:1 | `#1A1A2E` → 5.42:1 |
| 15 | `Bug` | 2.19:1 | `#1A1A2E` → 7.78:1 |
| 16 | `Rock` | 2.58:1 | `#1A1A2E` → 6.61:1 |
| 21 | `Fairy` | 2.69:1 | `#1A1A2E` → 6.35:1 |
| 24 | `Stellar` | 2.84:1 | `#1A1A2E` → 6.02:1 |

Then at `src/components/report/TypeBadge.tsx:27` the `textShadow` branch stops firing for these — leave it, it's harmless (and never counted toward contrast anyway).

## 3. Champions landing type chips — reuse the shared badge

`src/app/champions/ChampionsContent.tsx:236-242` and `:264-269` hardcode `text-white` / `text-white/70` on the local `TYPE_COLORS` string map (lines 89-95). 13/18 types fail at `text-white` (Electric **1.49:1**), **18/18** fail at `text-white/70`. Delete the local map and use the shared component:

```tsx
// top of file
import { TypeBadge } from "@/components/report/TypeBadge";
import type { TeraType } from "@/lib/types/pokemon";

// replace both <span style={{ backgroundColor: TYPE_COLORS[t] ?? "#888" }}>{t}</span> blocks with:
<TypeBadge key={t} type={t as TeraType} />
```

## 4. Landing textarea placeholder contrast

`src/components/input/PasteInput.tsx:385` — `placeholder:text-text-tertiary/40` = **1.81:1**. This is the primary input on the home page.

```diff
- placeholder:text-text-tertiary/40
+ placeholder:text-text-tertiary
```
(`text-text-tertiary` at full opacity = 5.94:1 light / 6.98:1 dark.)

## 5. `(nature)` label contrast in the report viewer

`text-text-tertiary/70` = 3.12:1 light / 3.78:1 dark. Both carry real content.

- `src/components/report/pokemon-detail/StatsPanel.tsx:30` — `text-text-tertiary/70` → `text-text-secondary`
- `src/components/report/PokemonCard.tsx:429` — `text-text-tertiary/70` → `text-text-secondary`

## 6. Icon-only "Replace this Pokemon" affordance

`src/components/report/PokemonCard.tsx:304` — the chevron is the only visual affordance at `text-text-tertiary/50` = **2.13:1**, below the 3:1 floor for non-text UI.

```diff
- text-text-tertiary/50 hover:text-accent
+ text-text-tertiary hover:text-accent
```

## 7. Coverage tables: row headers, captions, keyboard scrolling

`src/components/report/DefensiveCoverageChart.tsx` and `src/components/report/OffensiveCoverageChart.tsx` are identical in shape.

**(a) Row header cells are `<td>`** — screen readers lose the species↔type association.
- `DefensiveCoverageChart.tsx:170` and `:197`: `<td className="sticky left-0 …">` → `<th scope="row" className="sticky left-0 …">`
- `OffensiveCoverageChart.tsx:277` and `:310`: same change.

**(b) No `<caption>`.** Insert immediately after `<table …>`:

```tsx
// DefensiveCoverageChart.tsx:131
<caption className="sr-only">
  Defensive profile. Rows are your Pokémon, columns are attacking types; each cell is the damage multiplier.
</caption>
// OffensiveCoverageChart.tsx:238
<caption className="sr-only">
  Offensive profile. Rows are your Pokémon, columns are defending types; each cell is the best multiplier its moves reach.
</caption>
```

**(c) The `min-w-[40rem]` table sits in a scroll container with no focusable descendants**, so on a narrow viewport a keyboard-only user can never reach the right-hand types (WCAG 2.1.1).
- `DefensiveCoverageChart.tsx:130`:
```diff
- <div className="overflow-x-auto -mx-2 px-2 scrollbar-none" style={{ touchAction: "pan-x" }}>
+ <div role="region" aria-label="Defensive profile table, scrollable" tabIndex={0} className="overflow-x-auto -mx-2 px-2 scrollbar-none focus-visible:outline-2 focus-visible:outline-accent" style={{ touchAction: "pan-x" }}>
```
- `OffensiveCoverageChart.tsx:237`: same, `aria-label="Offensive profile table, scrollable"`.

## 8. VGC-259 remainder: give edit-mode slide 0 an `h1`

`src/components/home/HomePageClient.tsx:1152` currently excludes `physicalSlide === 0` outright, but `TeamOverview` only emits an `h1` when `isReadOnly`.

```diff
- {(tournamentMode || physicalSlide !== 0) && (
+ {(tournamentMode || physicalSlide !== 0 || !isReadOnly) && (
    <h1 className="sr-only">
```
With `!isReadOnly`, the editor's slide 0 gets the `sr-only` `h1` and the read-only view still gets exactly one (from `TeamOverview`). `isReadOnly` is already destructured at `HomePageClient.tsx:86`.

## 9. Heading-level skips: `h1 → h3` on 6 report surfaces

Each of these is the top heading of its slide and should be `h2`. No other heading in the subtree is at `h2`, so there is nothing to renumber below.

| file:line | change |
|---|---|
| `src/components/report/CommonModesSlide.tsx:181` / closing `:186` | `<h3` → `<h2`, `</h3>` → `</h2>` |
| `src/components/report/DefensiveCoverageChart.tsx:81` / `:83` | `<h3 …>Defensive Profile</h3>` → `<h2 …>Defensive Profile</h2>` |
| `src/components/report/OffensiveCoverageChart.tsx:186` / `:188` | `<h3 …>Offensive Profile</h3>` → `<h2 …>Offensive Profile</h2>` |
| `src/components/report/ThreatMatrix.tsx:105` | `<h3 className="text-lg font-bold">Six versus six threat analysis</h3>` → `<h2 …>` (its `h4` at `:124` then needs to become `h3`) |
| `src/components/report/TeamOverview.tsx:668` / `:670` | `<h3 … data-walkthrough="team-summary">` → `<h2 …>` (keep the attribute) |
| `src/components/report/TournamentMode.tsx:242-244` | the slide title is a `<span>`; promote it: `<span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Tournament Mode</span>` → `<h2 className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Tournament Mode</h2>`. The per-Pokémon `h3`s at `:110`/`:157` then nest correctly. |

## 10. Two shell states render `h2` as the top heading

- `src/components/home/HomePageClient.tsx:796` — "Sign in to continue": `<h2 className="text-lg font-bold text-text-primary">` → `<h1 className="text-lg font-bold text-text-primary">`.
- The shared-view loading/error block starting at `src/components/home/HomePageClient.tsx:821` has no heading at all; add `<h1 className="sr-only">Loading shared team report</h1>` as its first child.

## 11. Form controls with placeholder-as-label (no accessible name)

| file:line | fix |
|---|---|
| `src/components/report/pokemon-detail/NotesPanel.tsx:19` | add `aria-label={isReadOnly ? t.aboutThisPokemon : t.yourExplanation}` to the `<textarea>` |
| `src/components/report/CalcInput.tsx:361` | add `aria-label="Add a damage calculation or speed benchmark"` |
| `src/components/report/pokemon-detail/CalcEntryGroup.tsx:93` | add `aria-label="Edit this calculation"` |
| `src/components/report/InlinePokemonEditor.tsx:160` | add `aria-label="Search for a replacement Pokémon"` |
| `src/components/report/InlinePokemonEditor.tsx:173` | add `aria-label="Matching Pokémon"` to the `<ul role="listbox">` |

## 12. Missing `aria-expanded` on disclosure triggers

- `src/components/input/PasteInput.tsx:320-329` — "How it works" toggle. Add `aria-expanded={howItWorksOpen}` and `aria-controls="how-it-works"`, and `id="how-it-works"` on the wrapper at `:331`.
- `src/components/report/TeamOverview.tsx:240` and `:266` (`LegalityBadge`) — both toggle a popover. Add `aria-expanded={open}` and, since the label is glyph-prefixed, `aria-label` (`"Legality: legal, show details"` / `` `Legality: ${issueCount} issue(s), show details` ``).

## 13. Segmented toggle with no state in the accessibility tree

`src/components/report/TournamentMode.tsx:248` and `:258` — "EVs"/"Stats". Selection is conveyed by colour alone.

```diff
  <button
+   type="button"
+   aria-pressed={statView === "evs"}
    onClick={() => setStatView("evs")}
```
(and `aria-pressed={statView === "stats"}` on the second), plus `role="group" aria-label="Stat display"` on the wrapper `<div>` at `:247`.

## 14. Icon-only button named only by `title`

`src/components/report/MatchupPlanSlide.tsx:616-632` — "Swap lead and back".

```diff
    title="Swap lead and back"
+   aria-label="Swap lead and back"
  >
-   <svg width="14" height="14" viewBox="0 0 24 24" …>
+   <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" focusable="false" …>
```

## 15. `prefers-reduced-motion`: three unguarded smooth scrolls

`globals.css:850`'s `scroll-behavior: auto !important` does **not** affect the JS `behavior: "smooth"` option. Replace in all three:

```ts
const reduce = typeof window !== "undefined"
  && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
```
- `src/components/ui/WalkthroughOverlay.tsx:167`
- `src/components/ui/DiffNavigator.tsx:35`
- `src/components/report/MatchupPlanSlide.tsx:167` (uses `block: "start"`)

## 16. `prefers-reduced-motion`: Motion (framer-motion) is unguarded everywhere

There is **no `MotionConfig`** in the tree, and `useReducedMotion` is used in exactly one file (`src/components/explore/ExploreFilters.tsx:130`). Motion animations are JS/WAAPI-driven, so `globals.css:845-852` does not reach them. Affected: `src/app/champions/[pokemon]/MegaLandingContent.tsx:38,180`; `src/app/changelog/ChangelogContent.tsx:123,165,267,374`; `src/app/feedback/FeedbackContent.tsx:124,145,151,178,199`; `src/components/explore/{ExploreEmpty.tsx:28, ReportCard.tsx:163, ExploreContent.tsx:262}`; `src/components/social/CreatorProfile.tsx:101`; `src/components/ui/WhatsNewModal.tsx:127,140`; `src/app/dashboard/profile/page.tsx:240,470`.

One-point fix — wrap the app body in `src/app/layout.tsx`:

```tsx
// src/app/layout.tsx — new client component, e.g. src/components/providers/MotionProvider.tsx
"use client";
import { MotionConfig } from "motion/react";
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
```
then at `src/app/layout.tsx:137`: `<div id="main-content"><MotionProvider>{children}</MotionProvider></div>`.

## 17. `prefers-reduced-motion`: view transitions are not covered

`src/app/globals.css:568-573` — the `*, *::before, *::after` reset at `:845-852` does not match `::view-transition-*` pseudo-elements, so the slide transition still animates. Append:

```css
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(slide),
  ::view-transition-new(slide) {
    animation: none !important;
  }
}
```

## 18. Dead `.dark` selectors (silently broken styling)

Dark mode is `[data-dark-mode]`, so these three rules never match:
- `src/app/globals.css:630` — `.dark .walkthrough-spotlight` → `[data-dark-mode] .walkthrough-spotlight`
- `src/app/globals.css:921` — `:is(.dark) .version-diff-border` → `[data-dark-mode] .version-diff-border`
- `src/app/globals.css:957` — `:is(.dark) .version-diff-highlight::before` → `[data-dark-mode] .version-diff-highlight::before`

## 19. `--cell-immune-text` fails AA in light mode

`src/app/globals.css:31` — `#71717A` on `--cell-immune` `#E4E4E7` = **3.81:1**.

```diff
- --cell-immune-text: #71717A;
+ --cell-immune-text: #52525B;   /* 6.09:1 on #E4E4E7 */
```

## 20. Skip-link target is not focusable

`src/app/layout.tsx:137` — `<div id="main-content">`. Add `tabIndex={-1}` so `#main-content` reliably receives focus in Safari/Firefox:

```diff
- <div id="main-content">{children}</div>
+ <div id="main-content" tabIndex={-1}>{children}</div>
```

## 21. Decorative inline SVGs missing `aria-hidden`

78 inline `<svg>` literals in the audited scope have no `aria-hidden`, no `aria-label` and no `role`. The shared set in `src/components/ui/icons.tsx` is already correct and locked by `src/components/ui/__tests__/icons.a11y.test.tsx` — these are hand-rolled one-offs that bypass it. Highest counts: `src/components/layout/Navbar.tsx` (12), `src/components/home/HomePageClient.tsx` (8), `src/components/explore/SpotlightCard.tsx` (8), `src/components/input/PasteInput.tsx` (5), `src/components/report/MatchupPlanSlide.tsx` (4), `src/components/report/pokemon-detail/PokemonDetailLayout.tsx` (4), `src/components/report/{InlinePokemonEditor,TeamStats,PokemonCard,TeamOverview}.tsx` (3 each), `src/components/home/HomePageServer.tsx:79,103,113` (3), `src/components/layout/PageNavbar.tsx` (3). Fix: add `aria-hidden="true" focusable="false"` to each root `<svg>`, or swap to the shared icon components. Consider extending the existing vitest guard to grep `src/**/*.tsx` for inline `<svg` without `aria-hidden`.

## 22. Redundant alt text

`src/app/champions/ChampionsContent.tsx:397-406` — the sprite's `alt={name}` is immediately followed by the visible text `{name}`, so the name is announced twice.

```diff
-  alt={name}
+  alt=""
```

## 23. Small ARIA nits

- `src/components/explore/ExploreFilters.tsx:261` and `:325` — `aria-label` on a plain `<div>` is ignored. Add `role="group"` (or move the label onto a heading).
- `src/app/champions/ChampionsContent.tsx:253` — `aria-disabled="true"` on a non-interactive `<div>` card. Remove it; the "Coming Soon" chip already carries the meaning.
- `src/components/ui/ThemePicker.tsx:18` — `<label>` with no `htmlFor` and no wrapped control. Use `<p>` or make it the group's `aria-labelledby` target.
- `src/app/s/[id]/redirect.tsx:19-22` — the spinner `<div>` plus "Loading shared team..." `<p>`: add `role="status"` to the wrapper so the state is announced.

---

# Needs a design decision

## C1 — CRITICAL · `bg-accent text-white` fails AA in dark mode on every theme, and in light mode on 7 of 9
WCAG **1.4.3 Contrast (Minimum)** · `src/components/ui/Button.tsx:16` + **72 call sites across 37 files** (`src/app/layout.tsx:100` skip link, `src/components/input/PasteInput.tsx:435`, `src/components/report/{SpeedTierChart.tsx:516, TeamCardCTA.tsx:67, CalcInput.tsx:377, SlideNavControls, TeamOverview.tsx:207}`, `src/components/home/HomePageClient.tsx` ×7, `src/app/dashboard/DashboardContent.tsx` ×6, `src/app/changelog/ChangelogContent.tsx` ×4, `src/components/explore/ExploreFilters.tsx` ×4, …). Also `src/app/globals.css:251-254` (`::selection`).

The effective `--accent` is written inline by `src/app/layout.tsx:97` and `src/hooks/useTheme.ts:154`, which picks the theme's `accentDark` in dark mode. White on that:

| theme | dark `--accent` | white | light `--accent` | white |
|---|---|---|---|---|
| gen1 | `#c4b5fd` | **1.85** | `#8b5cf6` | **4.23** |
| gen2 | `#fcd34d` | **1.44** | `#d97706` | **3.19** |
| gen3 | `#86efac` | **1.40** | `#16a34a` | **3.30** |
| gen4 | `#93c5fd` | **1.80** | `#3b82f6` | **3.68** |
| gen5 | `#7dd3fc` | **1.67** | `#0ea5e9` | **2.77** |
| gen6 | `#fca5a5` | **1.90** | `#dc2626` | 4.83 ✓ |
| gen7 | `#fdba74` | **1.69** | `#ea580c` | **3.56** |
| gen8 | `#67e8f9` | **1.45** | `#0891b2` | **3.68** |
| gen9 (default) | `#fda4af` | **1.89** | `#e11d48` | 4.70 ✓ |

`origin/swarm-nightly-2026-11-02` introduced `--accent-foreground` (`globals.css:45` = `#FFFFFF`, `:308` = `#0B0B1A` under `[data-dark-mode]`) and `text-accent-foreground` in `Button.tsx:16`. **That fixes dark mode completely** (`#0B0B1A` scores 10.27–13.89:1 on all nine dark accents) **but leaves light mode failing for the other seven themes** — `#FFFFFF` only clears 4.5:1 on gen6 and gen9.

Decision needed: whether `--accent-foreground` becomes **per-theme** in light mode too. `#0B0B1A` passes light-mode for gen1 (4.60), gen2 (6.12), gen3 (5.92), gen4 (5.30), gen5 (7.04), gen7 (5.48), gen8 (5.30) — and *fails* for gen6 (4.04) and gen9 (4.15). So the clean answer is: ship `--accent-foreground` as a third field in `GEN_PRESETS` / the blocking script (`white` for gen6+gen9, `#0B0B1A` for the rest) rather than a single global value. Separately, `origin/swarm-nightly-2026-11-02` also nudged the gen9 light accent to `#DF1D47`; worth adopting in the same pass.

## H2 — HIGH · Move-name pills fail AA for 12/18 types (light) and 10/18 (dark)
WCAG **1.4.3** · `src/lib/utils/move-type-style.ts:34` · rendered in `src/components/report/pokemon-detail/MovesPanel.tsx:15`, `src/components/report/PokemonCard.tsx:396`, `src/components/report/TournamentMode.tsx:142,183` — i.e. move names, core report content.

`getMoveTypeStyle` paints `color: type colour` on `backgroundColor: type colour @ 10%`, darkening only five `LIGHT_TYPES` by 35%. The darkening is mode-blind, which is why each mode fails on a different half:

- **Light** (pill over `#FFFFFF`) fails: Fire 2.44, Water 2.81, Electric 3.34, **Grass 1.93**, Ice 3.51, Ground 3.81, Flying 2.45, Psychic 2.81, **Bug 2.04**, Rock 2.37, Steel 4.15, Fairy 2.46.
- **Dark** (pill over `#141428`) fails: Normal 2.92, Electric 4.21, Ice 3.99, Fighting 3.01, Poison 3.00, Ground 3.72, Ghost 2.81, Dragon 2.89, **Dark 2.52**, Steel 3.40.

Design call: add a second, mode-specific ink per type (two token sets switched by `[data-dark-mode]`, or a `text` + `textDark` pair alongside `bg` in `src/lib/utils/type-colors.ts`) instead of a single `darken()` factor. Once `@custom-variant dark` (fix #1) lands this can be driven by CSS classes rather than inline style, which also removes the inline-style override problem.

## M3 — MEDIUM · Replace-Pokémon combobox has an invalid ARIA pattern
WCAG **4.1.2 Name, Role, Value** · `src/components/report/InlinePokemonEditor.tsx:160-205`. The input has no `role="combobox"`, no `aria-expanded`, no `aria-controls`, no `aria-activedescendant`; the `<ul role="listbox">` has `role="option"` `<li>`s that each **contain a focusable `<button>`**, which the ARIA spec forbids (an `option` must have no interactive descendants). Keyboard users get a listbox whose options are reached by Tab, not by arrow keys. This needs a rebuild to the APG combobox pattern (roving `aria-activedescendant`, options as plain non-focusable `<li>`, Enter to commit) — not a one-line change.

## M4 — MEDIUM · Six `role="dialog"` surfaces with no focus trap
WCAG **2.4.3 Focus Order** / **4.1.2**. `src/components/ui/{ShareModal.tsx:151-196, OTSSheetModal.tsx:310-355, WhatsNewModal.tsx:86-106}` and `src/components/home/HomePageClient.tsx:390-421` all implement a correct trap + Escape + focus restore. These six do not:

| file:line | has | missing |
|---|---|---|
| `src/components/report/SlideNavControls.tsx:433-440` | Escape (`:168`), `aria-label` | `aria-modal`, focus trap, initial focus, focus restore |
| `src/components/report/InlinePokemonEditor.tsx:127-132` | Escape (`:107`), input autofocus, `aria-label` | `aria-modal`, focus trap, focus restore |
| `src/components/social/VersionHistoryPanel.tsx:164-169` | Escape (`:64`), `aria-label` | `aria-modal`, focus trap, initial focus |
| `src/components/ui/WalkthroughOverlay.tsx:257-273` | Escape (`:68`), `aria-label` | `aria-modal`, focus trap |
| `src/components/ui/ShortcutHintOverlay.tsx:66-68` | Escape (`:40`), `aria-modal`, `aria-labelledby` | focus trap, initial focus |
| `src/components/ui/NotificationBell.tsx:126-129` | Escape + focus return (`:67`,`:94`), `aria-label` | `aria-modal` |

Design/architecture call: extract the trap already written three times into one `useFocusTrap(ref, { onClose })` hook and apply it, rather than six copies.

## M7 — MEDIUM · Touch targets below the project's 44×44 standard
Project UI standard; the two 20px ones also fail **WCAG 2.5.8 Target Size (Minimum, 24×24)**.

| file:line | control | est. size |
|---|---|---|
| `src/components/input/PasteInput.tsx:299-308` | Champions-banner dismiss (`p-1` + 12px svg) | **20×20** ❌ 2.5.8 |
| `src/components/report/TeamOverview.tsx:240` / `:266` | legality badge popover triggers (`px-2 py-0.5 text-[11px]`) | **~20** high ❌ 2.5.8 |
| `src/components/report/TournamentMode.tsx:248` / `:258` | EVs / Stats toggle (`px-2.5 py-1 text-[10px]`) | **~22** high ❌ 2.5.8 |
| `src/components/report/MatchupPlanSlide.tsx:616` | swap lead/back (`p-1.5` + 14px svg) | ~26 |
| `src/components/report/AddOpponentInput.tsx:97` | archetype chips | ~25 |
| `src/components/report/CommonModesSlide.tsx:500` | remove combination | ~25 |
| `src/components/home/HomePageClient.tsx:991,1001,1048,1056` | banner CTAs (`px-3 py-1.5 text-[11px]`) | ~28 |
| `src/components/report/CalcInput.tsx:377` | Add-calc submit (`min-h-[40px]`) | 40 |
| `src/components/ui/Toggle.tsx:15` | `role="switch"` track (`h-[24px] w-[42px]`) | 24×42 |

Mechanical in isolation (`min-h-11`, `min-w-11`), but these sit in dense banners, chip rows and inline badge strips where growing them changes the layout — hence a design pass rather than a blind find-and-replace. The four at ≤22px should be raised tonight regardless, since they breach WCAG 2.5.8's hard 24×24 floor.

## M9 — MEDIUM · Focus-ring colour fails 1.4.11 on one theme
`src/app/globals.css:858-863` — `*:focus-visible { outline: 2px solid var(--accent) }`. Against light `--background` `#FAF9F6`: gen5 `#0ea5e9` = **2.77:1**, below the 3:1 floor for **1.4.11 Non-text Contrast**. gen2 (3.19), gen3 (3.30), gen7 (3.56), gen8 (3.68) clear it only barely. Dark mode is fine (10.3–13.9:1). Options: a second outline ring in `--foreground` (a two-tone indicator, which also survives arbitrary accents), or pinning the focus outline to `--text-primary` rather than `--accent`.

## M11 — MEDIUM · Opponent-team strip is a swipe-only carousel
WCAG **2.1.1 Keyboard** · `src/components/report/MatchupPlanSlide.tsx:231-234` — `flex overflow-x-auto snap-x snap-mandatory` with `touchAction: "pan-x"`. On phone width this shows ~2 of 6 opponent Pokémon and the children (sprite cards) are not focusable, so there is no keyboard route to the rest. Needs either `tabIndex={0}` + `role="region"` (mechanical, but then the snap points fight arrow keys) or real prev/next controls — a design call. Same shape, lower impact: `src/components/input/PasteInput.tsx:483,552`, `src/components/report/MatchupSheetRow.tsx:67`, `src/components/report/CommonModesSlide.tsx:389`, `src/app/champions/ChampionsContent.tsx:353` (those do contain focusable children, so they are reachable).

## H7 — HIGH · "Coming Soon" Mega card text is 1.86:1
WCAG **1.4.3** · `src/app/champions/ChampionsContent.tsx:251-262` — an SEO-indexed marketing page. The card carries `opacity-60`, and the ability line at `:261` adds `text-text-tertiary/70` on top of that. Composited: the `h4` name at `#9c9cac` = **2.57:1** light / **3.20:1** dark; the ability line at `#b9b8c2` = **1.86:1** light / **2.13:1** dark. The 1.4.3 "inactive component" exemption does not apply — this is informational content (the Mega's name and ability), not a disabled control. Decision: either drop `opacity-60` and signal unavailability with the existing "Coming Soon" chip alone, or lift the text to `text-text-secondary` at full opacity.

## L2 — LOW · `role="tablist"` without arrow-key navigation
`src/components/report/MatchupPlanSlide.tsx:357-384` — `role="tablist"` / `role="tab"` / `role="tabpanel"` with no roving `tabindex` and no arrow-key handler, so the APG contract is only half met (Tab works; arrows don't). `src/components/report/SlideNavControls.tsx:185,491` does implement arrow keys (`:408-409`), so copy that handler across. `role="tabpanel"` at `MatchupPlanSlide.tsx:396` also wants `tabIndex={0}` and `aria-labelledby` pointing at its tab.

---

# Confirmed clean (checked, no findings)

- **Icon-only controls**: all 37 icon-only `<button>`/`<a>` in `src/components` and `src/app` have `aria-label` or `aria-labelledby`. The single exception (`MatchupPlanSlide.tsx:616`, `title` only) is in fix #14.
- **No `div`/`span`-as-button** anywhere in the audited scope — every click handler is on a real `<button>` or `<a>`.
- **`focus:outline-none` without a replacement ring**: none. The three grep hits (`ExploreFilters.tsx:637,675`, `NotificationBell.tsx:129`) are a `focus-within:ring` container, an input inside it, and a `tabIndex={-1}` dialog.
- **Images**: every `<img>` has an `alt`; decorative ones correctly use `alt=""` (`src/components/home/HomePageServer.tsx:54`, `src/components/explore/ExploreEmpty.tsx:36`). `src/components/report/TeamOverview.tsx:474` has a genuinely descriptive QR alt. Only `ChampionsContent.tsx:399` is redundant (fix #22).
- **Landing-page hero animation** already serves a static PNG under `prefers-reduced-motion` via `<source media>` (`src/components/home/HomePageServer.tsx:49`) — good pattern, worth reusing.
- **Slide navigation keyboard support**: `src/hooks/useSlideNavigation.ts:129-186` (arrows/Home/End with a focus guard), `src/components/report/SlideNavControls.tsx:408-420` (roving focus across slide dots), `aria-keyshortcuts` on both the region (`HomePageClient.tsx:1136`) and the nav (`SlideNavControls.tsx:447`), and an `aria-live="polite"` slide announcer at `SlideNavControls.tsx:547`. This is better than most.
- **Marketing heading hierarchy**: `/faq`, `/terms`, `/privacy`, `/support`, `/changelog`, `/tournaments`, `/tools/ev-to-sp`, `/champions`, `/champions/[pokemon]`, `/explore` each render exactly one `h1` with no skipped levels.
- **Zoom**: `src/app/layout.tsx:23-28` — `userScalable: true`, `maximumScale: 5`. Passes 1.4.4.
- **`<html lang>`** is kept in sync with the i18n locale (`src/lib/i18n/index.ts:55,72`). No 3.1.1/3.1.2 issue.
- **Skip link** present at `src/app/layout.tsx:100-102` (only the target needs `tabIndex={-1}`, fix #20).
- **Coverage-chart / threat-matrix cells are not colour-only** — every cell carries a text multiplier and there is a visible legend (`DefensiveCoverageChart.tsx:223-230`), plus colourblind-safe stripe patterns for boosted bars (`globals.css:870-891`).
- **Coverage cell tokens**: 9 of 10 light/dark pairs clear 4.5:1 (`--cell-nve` 5.30, `--cell-se` 6.78, `--cell-dse` 7.30, `--def-4x` 5.74; all five dark variants 5.81–10.48). Only `--cell-immune` fails (fix #19).
- **Core text tokens all pass, both modes**: `text-primary` 14.98–17.06 light / 14.11–16.68 dark; `text-secondary` 7.46–8.50 / 9.25–10.93; `text-tertiary` 5.49–6.25 / 5.91–6.98. The dark `--success`/`--warning`/`--danger` overrides at `globals.css:294-296` are correct (5.97–11.68:1) and the comment block there documents why.
- **`prefers-reduced-motion` CSS reset** at `globals.css:845-852` covers all 20 keyframe animations and every CSS transition, including inline-style transitions (the `!important` beats inline). Only view transitions, JS smooth scrolls and Motion escape it (fixes #15–17).
- **`src/components/ui/icons.tsx`** is decorative-by-default and locked by `src/components/ui/__tests__/icons.a11y.test.tsx` — the right pattern; the gap is hand-rolled inline SVGs (fix #21).
- **`src/components/report/ThreatMatrix.tsx:120`** is the best table in the codebase: `sr-only` caption, `th scope="col"`/`scope="row"`, per-cell `aria-label` with the full calc, `role="status"` result line. Use it as the model for fix #7.

---

# Appendix: `dark:` desync contrast (evidence for C2)

With no `@custom-variant dark`, `dark:` tracks the OS and the base utility tracks nothing, so **both** mismatch states ship broken text.

**State A — app dark ON, OS light** (base class renders on dark surfaces). Worst of each pair, on `--surface` `#141428`:

| utility pair | renders | ratio |
|---|---|---|
| `text-blue-800 dark:text-blue-200` (`VersionHistoryPanel.tsx:218`) | `#1e40af` | **2.07** |
| `text-red-800 dark:text-red-300` (`DefensiveCoverageChart.tsx:207`, `OffensiveCoverageChart.tsx:320`) | `#991b1b` | **2.18** |
| `text-emerald-800 dark:text-emerald-300` (`OffensiveCoverageChart.tsx:324`) | `#065f46` | **2.36** |
| `text-amber-800 dark:text-amber-400` (`DefensiveCoverageChart.tsx:209`, `OffensiveCoverageChart.tsx:322`) | `#92400e` | **2.55** |
| `text-red-700 dark:text-red-400` (`DefensiveCoverageChart.tsx:99,106`) | `#b91c1c` | **2.80** |
| `text-sky-700 dark:text-sky-300` (`ChangelogContent.tsx:32,413,430`) | `#0369a1` | **3.05** |
| `text-blue-600 dark:text-blue-400` (`TeamOverview.tsx:491`, `DashboardContent.tsx:632`, …) | `#2563eb` | **3.50** |
| `text-red-600 dark:text-red-400` (`ShareModal.tsx:829,839,850`, `CollaboratorPanel.tsx:369`) | `#dc2626` | **3.75** |

**State B — app light, OS dark** (the `dark:` class wins on white). Every pair fails, 1.35–2.77:1. Worst: `dark:text-blue-200` on `#FFFFFF` = **1.42**, `dark:text-amber-300` = **1.44**, `dark:text-emerald-300` = **1.52**, `dark:text-amber-400` = **1.67**, `dark:text-sky-300` = **1.67**, `dark:text-emerald-400` = **1.92**.

Report-viewer files carrying these pairs: `src/components/report/{OffensiveCoverageChart.tsx (7), DefensiveCoverageChart.tsx (6), TeamOverview.tsx (7), CommonModesSlide.tsx (6), pokemon-detail/StatsPanel.tsx (5), PokemonCard.tsx (3), pokemon-detail/CalcEntryGroup.tsx (3), pokemon-detail/CalcsPanel.tsx (3), CalcInput.tsx (2), TournamentMode.tsx (2), SlideNavControls.tsx (1), TeamReport.tsx (1)}`. Marketing/other: `src/components/match-tracker/MatchTracker.tsx (17)`, `src/app/dashboard/DashboardContent.tsx (14)`, `src/app/changelog/ChangelogContent.tsx (10)`, `src/components/ui/ShareModal.tsx (8)`, `src/components/home/HomePageClient.tsx (8)`, `src/components/explore/{ReportCard.tsx (6), ExploreFilters.tsx (3)}`, `src/components/layout/Navbar.tsx (4)`, `src/components/social/VersionHistoryPanel.tsx (4)`, `src/components/ui/LanguageSelector.tsx (3)`, `src/app/champions/ChampionsContent.tsx (2)`, `src/app/tournaments/TournamentsContent.tsx (2)`, `src/components/social/{CollaboratorPanel.tsx (2), CreatorProfile.tsx (1), CommentSection.tsx (1)}`, `src/app/dashboard/profile/page.tsx (1)`.

Note the ordering dependency: **fix #1 must land before the contrast of any `dark:` pair can be trusted**, and a few pairs that look fine today only look fine because the wrong half is rendering.
