# R8 — Accessibility Audit (WCAG 2.1 AA), 14-09-26

**Scope:** public landing / paste screen (`src/components/input/PasteInput.tsx`, `src/app/page.tsx`), marketing routes (`/champions`, `/faq`, `/explore`), global shell (`src/app/layout.tsx`, `src/app/globals.css`), and the report viewer (`src/components/report/**`, `src/components/layout/Navbar.tsx`, `src/components/ui/**`).

**Method:** static source analysis only (live site blocked by network policy — no axe/Lighthouse run). All contrast ratios were computed from the literal token values in `globals.css`, `src/lib/utils/type-colors.ts`, and Tailwind palette constants, using the WCAG 2.x relative-luminance formula.

**Headline:** the app's a11y *scaffolding* is genuinely good — skip link, `prefers-reduced-motion` block, `:focus-visible` ring, 44px targets on most icon buttons, real focus traps in `ShareModal` / `OTSSheetModal` / `WhatsNewModal`. The failures cluster in two places: **colour contrast** (the type-colour system and the gen-theme accent system were never contrast-checked) and **custom ARIA widgets** (listbox/menu/tab patterns declared but not implemented).

"**Quick win**" marks findings that are small, safe, self-contained edits suitable for an unattended implementation pass tonight.

---

## Critical

### C1. Tailwind `dark:` variant is not wired to the app's dark-mode toggle — 133 usages silently mis-colour
- **Where:** `src/app/globals.css:1-4` (no `@custom-variant dark` declared); `src/app/layout.tsx:100` (dark mode is applied as `data-dark-mode` on `<html>`); `globals.css:263` (`[data-dark-mode] { … }` token overrides).
- **WCAG:** 1.4.3 Contrast (Minimum) — Level AA.
- **Problem:** Tailwind v4 defaults the `dark:` variant to `@media (prefers-color-scheme: dark)`. The app instead switches themes by setting the `data-dark-mode` attribute. The CSS *tokens* follow the attribute; the 133 `dark:*` utility classes follow the OS. The two desynchronise whenever the user's in-app choice differs from their OS setting:
  - OS light + app dark → `dark:text-emerald-400` never applies, so `text-emerald-600` (#059669) renders on `--surface` #141428. `text-rose-600` (#E11D48) on that surface = **3.85:1**, `text-red-600` (#DC2626) = **3.75:1** — both fail.
  - OS dark + app light → `dark:text-emerald-400` (#34D399) renders on #FFFFFF = **1.92:1**; `dark:text-amber-400` (#FBBF24) on white = **1.67:1**. Severe.
- **Affected code includes:** `src/app/page.tsx:995,1229,1232,1350,1352`; `PokemonCard.tsx:515,516,533`; `PokemonDetailSlide.tsx:755,756,779`; `TeamOverview.tsx:243,270-273`.
- **Fix:** add one line to `src/app/globals.css` immediately after line 4:
  ```css
  @custom-variant dark (&:where([data-dark-mode], [data-dark-mode] *));
  ```
  Then re-check the handful of `dark:` pairs that were authored against the OS assumption. This is a one-line change that repairs all 133 usages at once. **Quick win** (one line), but re-run the visual diff — it changes rendering in both themes.

### C2. `TypeBadge` text fails contrast for 11 of 18 Pokémon types
- **Where:** `src/components/report/TypeBadge.tsx:12-24`, colours from `src/lib/utils/type-colors.ts:4-21`. Rendered on every Pokémon card (`PokemonCard.tsx:337,342`), detail slide, and the coverage-chart column headers (`DefensiveCoverageChart.tsx:141`, `OffensiveCoverageChart.tsx:229`).
- **WCAG:** 1.4.3 Contrast (Minimum) — Level AA.
- **Problem:** the badge is `text-[9px]`/`sm:text-[11px]` — unambiguously *normal* text, so the 4.5:1 threshold applies (the 3:1 large-text exemption needs ≥18.66px bold). Measured `bg` vs `text`:

  | Type | Ratio | | Type | Ratio |
  |---|---|---|---|---|
  | Grass | **2.08** | | Fire | **2.69** |
  | Bug | **2.19** | | Fairy | **2.69** |
  | Normal | **2.48** | | Water | **3.10** |
  | Rock | **2.58** | | Psychic | **3.15** |
  | Flying | **2.67** | | Fighting | 5.65 ✓ |

  The `textShadow` on line 21 does not count toward contrast.
- **Fix:** darken the `bg` values for the failing types, or (lower-risk, preserves the recognisable type palette) keep `bg` and switch those nine types to a dark `text` value. Concretely, in `type-colors.ts` set `text: "#1A1A2E"` for `Normal, Grass, Bug, Rock, Flying, Fairy, Water, Psychic, Fire` and drop them from the white-text `textShadow` branch. Verify each pair reaches ≥4.5:1 after the change (e.g. `#7AC74C` vs `#1A1A2E` = 7.6:1 ✓). Add a vitest in `src/lib/utils/__tests__/type-colors.test.ts` asserting every entry ≥4.5:1 so this cannot regress.

### C3. Move-type pills fail contrast in one or both themes for 16 of 18 types
- **Where:** `src/lib/utils/move-type-style.ts:30-44`, consumed at `src/components/report/PokemonCard.tsx:396-408` and in the detail slide's move grid.
- **WCAG:** 1.4.3 Contrast (Minimum) — Level AA.
- **Problem:** the pill paints `backgroundColor: ${bg}1A` (10% tint) and sets `color` to the *full-strength same hue*. A 10%-tinted background is nearly the page surface, so text and background are effectively the same hue at very different alphas — which only accidentally passes. Computed text-vs-pill:
  - Light theme failures: Grass **1.94**, Bug **2.04**, Rock **2.38**, Flying **2.45**, Fairy **2.46**, Fire **2.44**, Water **2.81**, Psychic **2.81**, Electric 3.35, Ice 3.52, Ground 3.83, Steel 4.15.
  - Dark theme failures: Dark **2.52**, Ghost **2.81**, Dragon **2.89**, Normal **2.92**, Poison **3.01**, Fighting **3.02**, Steel 3.44, Ground 3.72, Ice 4.00, Electric 4.21.
- **Fix:** stop deriving the text colour from the background hue. Compute a theme-aware text colour: in light mode mix the type hue 45–55% toward `#1A1A2E`; in dark mode mix 40% toward `#FFFFFF`. The existing `darken()` helper (line 13) already does half of this — extend it to a `toContrast(hex, isDark)` that loops until the ratio against the resolved pill background is ≥4.5:1. Keep the border tint as-is.

### C4. Gen-theme accents make primary CTAs and focus rings fail contrast
- **Where:** palette in `src/app/layout.tsx:100` (inline theme bootstrap, `p` map); focus ring at `src/app/globals.css:825-830`; CTA pattern `bg-accent text-white` used at `page.tsx:828,862,1014,1067,1467,1747`, `Button.tsx:19`, `PasteInput.tsx:466,485`, `Navbar.tsx:150,577,599`, `layout.tsx:103` (skip link).
- **WCAG:** 1.4.3 Contrast (Minimum, AA) and 1.4.11 Non-text Contrast (AA).
- **Problem:** the theme picker lets the user set any of nine gen accents, and `--accent` drives both the primary-button fill and the global focus ring. White-on-accent, light theme: gen5 `#0ea5e9` = **2.77**, gen2 `#d97706` = **3.19**, gen3 `#16a34a` = **3.30**, gen7 `#ea580c` = **3.56**, gen4 `#3b82f6` = **3.68**, gen8 `#0891b2` = **3.68**, gen1 `#8b5cf6` = 4.23, gen9 (default) `#e11d48` = 4.70 ✓ (marginal). Accent-as-text on `--background` #FAF9F6: gen5 **2.63**, gen2 **3.03**, gen3 **3.13**, gen7 **3.38**, gen4 **3.49**, gen8 **3.50**, gen9 **4.46** (fails). The focus ring needs only 3:1 but gen5 (2.63) and gen2 (3.03, borderline) fail even that.
  - Dark theme is worse for buttons: `--accent` resolves to `#FB7185` (`globals.css:283`), and **white on `#FB7185` = 2.69:1** — every primary CTA in dark mode fails, including the default theme.
- **Fix (two parts):**
  1. Add a paired `--accent-on` token per theme (the text colour to use *on* the accent fill) to the bootstrap map in `layout.tsx:100` and to `globals.css`: `#FFFFFF` where the accent is dark enough, `#1A1A2E` where it is not. Replace `text-white` with `text-[color:var(--accent-on)]` in the CTA classes listed above. For dark mode set `--accent-on: #1A1A2E` (`#1A1A2E` on `#FB7185` = 7.8:1 ✓).
  2. Darken the light-theme gen accents until accent-as-text clears 4.5:1 on `#FAF9F6` (e.g. gen5 → `#0369a1`, gen3 → `#15803d`, gen4 → `#1d4ed8`, gen8 → `#0e7490`, gen7 → `#c2410c`, gen2 → `#b45309`, gen9 → `#be123c`), keeping `--accent-light` for decorative fills. This also repairs the focus ring under 1.4.11.
- Add a vitest asserting every gen accent meets 4.5:1 as text and 3:1 as a ring.

### C5. Calc entries are edited via a click-only `<span>` — unreachable by keyboard
- **Where:** `src/components/report/PokemonDetailSlide.tsx:164-176`.
- **WCAG:** 2.1.1 Keyboard (Level A), 4.1.2 Name, Role, Value (Level A).
- **Problem:** the only way to enter edit mode on an existing damage-calc entry is `onClick` on a bare `<span>` with no `role`, no `tabIndex`, and no key handler. Keyboard and switch users cannot edit or correct any calc they have entered. (The `<textarea>` that replaces it *is* keyboard-correct — it is only the entry point that is inaccessible.)
- **Fix:** when `!isReadOnly && onEdit`, render the element as a real control:
  ```tsx
  <button
    type="button"
    onClick={() => { setEditText(entry.text); setEditing(true); }}
    aria-label={`Edit calc: ${entry.text}`}
    className="flex-1 text-left text-sm sm:text-base text-text-primary leading-relaxed cursor-text bg-transparent border-0 p-0"
  >
    {entry.text}
  </button>
  ```
  Keep the plain `<span>` for the read-only branch. **Quick win.**

---

## Serious

### S1. Broken Tailwind class concatenation kills 44px targets and font sizes on the speed-tier controls
- **Where:** `src/components/report/SpeedTierChart.tsx:132` (`min-h-11text-[10px]`), `:482` (`min-h-11text-xs`), `:500` (`min-h-11text-xs`).
- **WCAG:** 2.5.5 Target Size (AAA) + the project's own 44×44 standard; 1.4.4 Resize Text is also implicated because the intended font size never applies.
- **Problem:** a missing space fuses two utilities into one nonexistent class, so **neither** applies. The six per-side speed-modifier pills (Tailwind / Paralysis / Icy Wind × your team / opponent) and the "Mega Forms" and "Meta Threats" toggles all lose their `min-height: 44px` and fall back to `py-1`/`py-1.5` — roughly 26–30px tall on mobile.
- **Fix:** insert the missing space in all three places — `min-h-11 text-[10px]`, `min-h-11 text-xs`, `min-h-11 text-xs`. **Quick win — highest value-per-character fix in this report.**

### S2. `role="listbox"` containers whose children are `<button>`, not `role="option"`
- **Where:** `src/components/report/PokemonDropdown.tsx:108-160` (container `role="listbox"` at :109, trigger declares `aria-haspopup="listbox"` at :84; children are `<button>` at :116 and :132).
- **WCAG:** 4.1.2 Name, Role, Value (Level A); 1.3.1 Info and Relationships (Level A).
- **Problem:** ARIA requires a `listbox` to own `option` children. Screen readers announce "listbox, 0 items" and the `aria-expanded`/`aria-haspopup` contract is broken. There is also no Escape handler and no arrow-key navigation (the popup closes only on outside `mousedown`, `:39-48`).
- **Fix (lowest-risk):** drop the widget-role claim rather than half-implementing it — change `:84` to `aria-haspopup="true"`, remove `role="listbox"` from `:109` (keep the `aria-label`), and add an Escape handler mirroring `PageNavbar.tsx:40-48`. The children are already real buttons, so keyboard operation works once Escape closes the popup. If the full pattern is wanted instead, convert children to `role="option"` + `aria-selected` and add `aria-activedescendant` roving focus. **Quick win** for the low-risk variant.
- **Related:** `src/components/report/InlinePokemonEditor.tsx:180-220` gets this *right* (`<li role="option" aria-selected>`), so use it as the in-repo reference.

### S3. Settings menu: `role="menu"` without `menuitem` children, and no Escape
- **Where:** `src/components/layout/Navbar.tsx:631` (`<div role="menu">`), children are plain `<button>`s at `:651,666,713,744,761,787,803,818,833,850,865,874,890,902,910,925`; close handler `:264-273` binds `mousedown` only.
- **WCAG:** 4.1.2 (Level A); 2.1.1 Keyboard (Level A).
- **Problem:** same containment violation as S2, plus the menu cannot be dismissed from the keyboard and focus is never returned to the trigger on close.
- **Fix:** change `:631` to `role="menu"` → remove it (and change `aria-haspopup="menu"` at `:615` to `"true"`), then add an Escape listener in the `:264` effect that calls `setMenuOpen(false)` and restores focus to the trigger button. `PageNavbar.tsx:36-49` already implements exactly this pattern for its "More" menu — copy it. **Quick win.**

### S4. Champions banner: a `<button>` nested inside an `<a>`
- **Where:** `src/components/input/PasteInput.tsx:289-322` — `motion.a href="/champions"` wraps the dismiss `<button>` at `:312-321`.
- **WCAG:** 4.1.1 Parsing / 4.1.2 Name, Role, Value (Level A).
- **Problem:** interactive controls may not nest. Browsers and ATs disagree on the resulting accessibility tree; the dismiss button's activation is also fighting the anchor via `preventDefault`/`stopPropagation`.
- **Fix:** restructure to siblings — wrap both in a `relative` `<div>`, keep the anchor covering the content area, and move the dismiss `<button>` out of the anchor as a following sibling positioned `absolute top-2 right-2`. The existing `preventDefault`/`stopPropagation` can then be removed.

### S5. Dismiss button on the Champions banner is ~20×20px
- **Where:** `src/components/input/PasteInput.tsx:312-321` — `className="absolute top-2 right-2 p-1 …"` around a 12×12 SVG.
- **WCAG:** 2.5.5 Target Size (AAA) + the project's 44×44 standard.
- **Fix:** replace `p-1` with `min-w-[44px] min-h-[44px] flex items-center justify-center` (the pattern already used at `page.tsx:1030`). Because the button is absolutely positioned, also nudge to `top-0 right-0` so the larger hit area does not overhang the card. **Quick win.**

### S6. Framer Motion entrance animations ignore `prefers-reduced-motion`
- **Where:** `src/components/input/PasteInput.tsx:254-261` (sprite row), `:268-274` (title block), `:289-294` (banner), `:325-330`, `:380-383`, `:425`, `:445`, `:456`, `:466-469`, `:485-489`, `:513-522`.
- **WCAG:** 2.3.3 Animation from Interactions (AAA) and the project's "reduced-motion respected" standard; 2.2.2 is not implicated (all are finite).
- **Problem:** the `@media (prefers-reduced-motion: reduce)` block at `globals.css:812-819` only neutralises **CSS** animations and transitions. Framer Motion drives `transform`/`opacity` from JavaScript via inline styles, so every landing-page entrance (translate + scale, including a staggered 6-sprite cascade) still plays at full amplitude for users who asked for reduced motion. Note the `<source media="… prefers-reduced-motion: reduce">` at `:251` correctly swaps the animated GIFs — so the intent exists; only the JS layer was missed.
- **Fix:** at the top of `PasteInput`, `const reduce = useReducedMotion();` (exported by `framer-motion`), then gate each `initial`/`animate`/`transition`, e.g. `initial={reduce ? false : { opacity: 0, y: 12, scale: 0.9 }}` and `transition={reduce ? { duration: 0 } : { … }}`. Apply the same to `whileTap={reduce ? undefined : { scale: 0.97 }}` at `:468,487,518`. **Quick win** (mechanical, one hook + guards).

### S7. Report-viewer textareas have no accessible name
- **Where:** `src/components/report/PokemonDetailSlide.tsx:862-868` (per-Pokémon notes) and `:150-161` (calc inline-edit textarea); `src/components/report/CalcInput.tsx:361-371` (add-calc input — placeholder only).
- **WCAG:** 1.3.1 Info and Relationships (A), 3.3.2 Labels or Instructions (A), 4.1.2 (A).
- **Problem:** each has a `placeholder` but no `aria-label`, `aria-labelledby`, or associated `<label>`. Placeholders vanish on input and are not a substitute for a label. The visible `<h3>` above the notes box (`:854`) is not programmatically associated. Contrast with `PokemonCard.tsx:376`, which does this correctly.
- **Fix:**
  - `PokemonDetailSlide.tsx:862` → add `aria-label={`Notes for ${parsed.species}`}`.
  - `PokemonDetailSlide.tsx:150` → add `aria-label="Edit calc text"`.
  - `CalcInput.tsx:361` → add `aria-label={`Add a ${calcCategory} calc`}`.
  **Quick win** (three attributes).

### S8. `InlinePokemonEditor` dialog is missing `aria-modal` and a focus trap
- **Where:** `src/components/report/InlinePokemonEditor.tsx:129-134`.
- **WCAG:** 4.1.2 (A); 2.4.3 Focus Order (A).
- **Problem:** `role="dialog"` + `aria-label` are present and Escape is handled (`:102-118`), and the search input is auto-focused (`:96`) — but there is no `aria-modal="true"` and no Tab containment, so a keyboard user tabs straight out of the dialog into the report behind it while the backdrop still blocks the mouse. Every other modal in the repo (`ShareModal.tsx:154-200`, `OTSSheetModal.tsx:136-182`, `WhatsNewModal.tsx:62-110`) implements the full trap.
- **Fix:** add `aria-modal="true"` to `:129`, and copy the focus-trap effect from `OTSSheetModal.tsx:136-182` (it is self-contained: capture `previouslyFocused`, cycle Tab between first/last focusable, restore focus on unmount). Also add an `aria-live="polite"` result count near `:180` so typing announces "12 Pokémon match".

---

## Moderate

### M1. Coverage-chart tables have no header scope and use `<td>` for row headers
- **Where:** `src/components/report/DefensiveCoverageChart.tsx:125,131,154,181`; `src/components/report/OffensiveCoverageChart.tsx:223,229` (and its row-label cells).
- **WCAG:** 1.3.1 Info and Relationships (Level A).
- **Problem:** the column `<th>`s carry no `scope="col"`, and the per-Pokémon row labels are `<td>` rather than `<th scope="row">`. In a 6×18 matrix, screen-reader table navigation cannot announce "Incineroar, Fighting, 2×" — the user hears a bare "2×". (`ChampionsContent.tsx:347-356` gets this right and is the in-repo reference.)
- **Fix:** add `scope="col"` to the `<th>`s at `DefensiveCoverageChart.tsx:125,131` and `OffensiveCoverageChart.tsx:223,229`; change the sticky row-label `<td>`s (`DefensiveCoverageChart.tsx:154,181`, and the equivalents in `OffensiveCoverageChart.tsx`) to `<th scope="row">` keeping the same classes. Also add a `<caption className="sr-only">` naming each table. **Quick win.**

### M2. Mobile tab bar on the Pokémon detail slide declares no tab semantics
- **Where:** `src/components/report/PokemonDetailSlide.tsx:927-944` (tab strip) and `:945-950` (panel container).
- **WCAG:** 4.1.2 Name, Role, Value (Level A).
- **Problem:** four `<button>`s switch between Set / Stats / Notes / Calcs with only a visual active state — no `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, or `role="tabpanel"`. Screen-reader users get four unrelated buttons and no signal about which view is showing. `SlideNavControls.tsx:185-210` implements this correctly and should be the model.
- **Fix:** add `role="tablist"` to `:927`; on each button add `role="tab"`, `aria-selected={mobileTab === tab}`, `id={`tab-${tab}`}`, `aria-controls={`panel-${tab}`}`; wrap the rendered panel at `:945` in `role="tabpanel"` with the matching `id` and `aria-labelledby`, plus `tabIndex={0}`.

### M3. `SlideNavControls` tabs do not point at the slide they control
- **Where:** `src/components/report/SlideNavControls.tsx:185-210` (`role="tablist"`/`role="tab"`) vs. the slide container at `src/app/page.tsx:1148-1161` (`role="region"`).
- **WCAG:** 4.1.2 (Level A).
- **Problem:** tabs exist without `aria-controls`, and the content they switch has `role="region"` rather than `role="tabpanel"`. The relationship is invisible to AT.
- **Fix:** give the slide container at `page.tsx:1150` a stable `id` (e.g. `id="report-slide-panel"`) and `role="tabpanel"` (keep `aria-roledescription` and `aria-label`), then add `aria-controls="report-slide-panel"` to each `role="tab"` button at `SlideNavControls.tsx:195`.

### M4. `aria-label` applied to generic `<div>`/`<span>` elements — silently dropped
- **Where:** `PokemonCard.tsx:441-443` (SP budget chip), `:513` (stat row), `:515,516` (nature arrows); `PokemonDetailSlide.tsx:700` (SP chip), `:753` (stat row), `:755,756` (arrows), `:811` (Mega delta strip), `:827` (delta row); `SpeedTierChart.tsx:643-646` (speed-tie marker).
- **WCAG:** 4.1.2 Name, Role, Value (Level A) — ARIA in HTML forbids `aria-label` on elements with no role and no implicit semantics.
- **Problem:** these labels carry meaningful content ("Atk: 182, boosted by nature, 32 SP"), but most screen readers ignore `aria-label` on a bare `div`/`span`, so the effort is wasted — and worse, where the label *is* honoured it replaces the visible text rather than supplementing it.
- **Fix:** give each labelled wrapper a role that accepts a name. For the stat rows (`PokemonCard.tsx:513`, `PokemonDetailSlide.tsx:753`) `role="listitem"` is already present on the card version — mirror it on the detail slide and wrap in `role="list"`. For the SP chips (`:441`, `:700`) and the tie marker, replace `aria-label` with a visually-hidden `<span className="sr-only">` sibling holding the same sentence, and mark the visual content `aria-hidden="true"`. For the nature arrows (`:515,516`, `:755,756`), drop the `aria-label` entirely — the parent row label already says "boosted by nature".

### M5. No `h1` on the report overview in creator/edit mode
- **Where:** `src/app/page.tsx:1169-1173` renders the `sr-only` `<h1>` only when `physicalSlide !== 0`; `src/components/report/TeamOverview.tsx:418-422` renders its `<h1>` only when `isReadOnly`.
- **WCAG:** 1.3.1 Info and Relationships (A); 2.4.6 Headings and Labels (AA).
- **Problem:** in the intersection — slide 0 while editing your own report — the document has no `h1` at all; the first heading is the `<h3>` at `TeamOverview.tsx:531`. That is both a missing top-level heading and a level skip.
- **Fix:** change the condition at `page.tsx:1169` to also cover slide 0 when the overview will not render one, or simplest: in `TeamOverview.tsx:418`, drop the `isReadOnly` guard on the `sr-only` `<h1>` so it always renders when no visible `teamName` `<h1>` is present.

### M6. Loading skeleton for shared reports announces nothing
- **Where:** `src/app/page.tsx:867-911` (skeleton grid), `:909` (the "loading shared team" paragraph).
- **WCAG:** 4.1.3 Status Messages — Level AA.
- **Problem:** a shared-report load replaces the screen with a purely visual skeleton. Nothing is in a live region, so a screen-reader user hears silence until the report appears, then gets no completion cue either.
- **Fix:** add `role="status" aria-live="polite"` to the wrapper at `:868` and mark the decorative skeleton grid `aria-hidden="true"` so only the `:909` text is announced. **Quick win.**

### M7. Legality badge disclosures: no `aria-expanded`, no popup role, ~20px tall
- **Where:** `src/components/report/TeamOverview.tsx:240-246` ("✓ Legal") and `:266-280` ("⚠ N issues"), with popups at `:248` and `:279`.
- **WCAG:** 4.1.2 (A); 2.5.5 Target Size (AAA) + project 44px standard.
- **Problem:** both are disclosure buttons with no `aria-expanded`, the popups have no role, and `px-2 py-0.5 text-[11px]` gives roughly a 20px-tall target. The popups also close only on outside click.
- **Fix:** add `aria-expanded={open}` and `aria-controls` to both buttons; give the popup divs `role="region"` with `aria-label="Legality details"`; bump the trigger to `min-h-11 inline-flex items-center px-2`. **Quick win** for the `aria-expanded` + sizing half.

### M8. Stat bars fail non-text contrast against their track in light mode
- **Where:** `src/components/report/PokemonCard.tsx:519-527` (track `bg-surface-alt`, fill `STAT_COLORS[stat]`); `src/components/report/PokemonDetailSlide.tsx:760-770`; palette at `globals.css:42-47`.
- **WCAG:** 1.4.11 Non-text Contrast — Level AA (3:1 required).
- **Problem:** fill vs `--surface-alt` (#F2F0EB), light theme: Def **1.15**, Spd **1.40**, Atk **1.67**, SpA **1.75**, item-boost amber **1.89**, Spe **1.88**, HP **2.70**. Dark theme is fine (5.4–12.6). Mitigation: the numeric value is rendered beside every bar (`PokemonCard.tsx:532-536`), so no information is lost — this is a perceivability rather than a comprehension failure, which is why it sits at Moderate.
- **Fix:** darken `--surface-alt` only where it is used as a progress track, or add a 1px `--border`-coloured inset ring to the track (`ring-1 ring-inset ring-border`) so the filled region is delimited regardless of hue. The second option is a one-class change and preserves the recognisable Showdown stat palette.

### M9. `--accent`, `--success` and `--warning` fail 4.5:1 as text on the default background
- **Where:** `src/app/globals.css:22,25,26`; used as text at e.g. `PokemonCard.tsx:381,538`, `SpeedTierChart.tsx:522`, `PasteInput.tsx:538,540`, `page.tsx:1198`.
- **WCAG:** 1.4.3 Contrast (Minimum) — Level AA.
- **Problem:** on `--background` #FAF9F6 — `--accent` #E11D48 = **4.46** (just under), `--success` #16A34A = **3.30**, `--warning` #D97706 = **3.19**. The amber-on-amber-tint combination used for warning banners (`page.tsx:1089`, `PokemonCard.tsx:461,478`) measures **2.97**.
- **Fix:** `--success: #15803D` (5.0:1 ✓), `--warning: #B45309` (4.9:1 ✓), and `--accent: #BE123C` (5.6:1 ✓ — see also C4, which requires darkening the accent anyway). Keep the current brighter values as `--success-bright` / `--warning-bright` for icon and border fills, where 3:1 is the applicable threshold.

### M10. Backdrop click-to-close has no keyboard equivalent on the export-theme modal
- **Where:** `src/app/page.tsx:1673-1680` (eslint rule suppressed at `:1673`).
- **WCAG:** 2.1.1 Keyboard (Level A) — technically satisfied, flagged for robustness.
- **Note:** the `onKeyDown` on `:1677` never fires because the backdrop `<div>` is not focusable. Escape *is* handled correctly, but from the dialog-scoped listener at `:422-427` — so the feature works and this is not a true failure. **Fix:** delete the dead `onKeyDown` at `:1677-1679` and add `aria-hidden="true"` to the backdrop, so the suppressed lint rule is no longer needed.

---

## Minor

### N1. Decorative SVG icons missing `aria-hidden="true"`
- **Where:** `src/app/page.tsx:852,995,1051,1115,1407,1428,1714,1736`; `PokemonCard.tsx:215,308,327`; `PasteInput.tsx:294,317,338`; `Navbar.tsx:332,344,366,619,624,749,792,855,895,930,947`.
- **WCAG:** 1.1.1 Non-text Content (A) — best practice.
- **Fix:** add `aria-hidden="true"` (and `focusable="false"` for IE-era safety) to each. Where the icon sits inside a button that already has `aria-label`, this prevents duplicate/garbage announcements. **Quick win** (mechanical; a codemod over `<svg` lacking `aria-hidden` inside labelled buttons is safe).

### N2. Redundant sprite `alt` text duplicates the adjacent accessible name
- **Where:** `src/components/report/PokemonSprite.tsx:64` (`alt={species}`) as used in `PokemonCard.tsx:225-240` (next to the `<h3>` species name at `:244`) and `PokemonDropdown.tsx:92` (inside a button that already carries `aria-label` at `:83`); `PasteInput.tsx:109-111` (`PopularCardSprite`, six per sample-team button whose `aria-label` is set at `:523`).
- **WCAG:** 1.1.1 (A) — best practice.
- **Fix:** add an optional `decorative?: boolean` prop to `PokemonSprite` that emits `alt=""`, and pass it at the call sites above. For `PasteInput.tsx:111`, change `alt={species}` to `alt=""` directly — a sample-team button currently announces its name plus six species names. **Quick win.**

### N3. Information conveyed only via `title` tooltips
- **Where:** `SpeedTierChart.tsx:137,481,516,594,605,616,645,681,718`; `PokemonDetailSlide.tsx:784`; `DefensiveCoverageChart.tsx:142,170`; `page.tsx:1355-1363,1391,1405`.
- **WCAG:** 1.3.1 (A), 3.3.2 (A) — `title` is not exposed on touch, is unreliable on keyboard focus, and is not translatable in-place.
- **Fix:** for the two that carry *unique* information — the Mega Forms explanation (`SpeedTierChart.tsx:481`) and the visibility-cycle button state (`page.tsx:1355-1363`) — move the text into visible helper copy or an `sr-only` span. The rest duplicate adjacent visible text and can keep `title` as a convenience.

### N4. `.dark` CSS selectors never match — dark variants of the walkthrough ring and diff highlight are dead
- **Where:** `src/app/globals.css:597` (`.dark .walkthrough-spotlight`), `:888` (`:is(.dark) .version-diff-border`), `:924` (`:is(.dark) .version-diff-highlight::before`).
- **WCAG:** 1.4.11 Non-text Contrast (AA) — the intended dark-mode ring colours never apply.
- **Problem:** no `.dark` class is ever set on any element; dark mode uses `[data-dark-mode]` (`layout.tsx:100`). These three rules are dead, so the light-mode `#3b82f6` border and the accent-coloured spotlight ring render unchanged on the dark `#0B0B1A` background.
- **Fix:** change the selectors to `[data-dark-mode]` (matching `globals.css:263,288`). Note this is fixed *automatically* by C1 only for utility classes, not for these hand-written rules — they need the separate edit. **Quick win.**

### N5. Stat-bar and diff animations exceed the project's 150–300ms budget
- **Where:** `globals.css:440` (`.animate-fade-in` 500ms), `:444` (`.animate-fade-in-up` 600ms), `:471` (`.animate-bar-fill` 800ms), `:526` (`.skeleton` shimmer 1.5s infinite), `:885` (`.version-diff-border` 2.5s infinite pulse).
- **WCAG:** no AA criterion (2.2.2 does not apply — the infinite ones are ambient, not content-obscuring); this is a project-standard deviation only.
- **Fix:** trim `animate-bar-fill` to 300ms and `animate-fade-in`/`-up` to 250ms. The reduced-motion block at `:812` already neutralises all of them, so this is polish.

### N6. Heading level skips on marketing pages
- **Where:** `src/components/explore/ExploreEmpty.tsx:42` (`<h3>` with no preceding `<h2>` on the empty-state page); `src/components/explore/SpotlightCard.tsx:118` (`<h3>`) rendered above `:190` (`<h2>` "Featured Team Report").
- **WCAG:** 1.3.1 (A); 2.4.6 Headings and Labels (AA) — best practice.
- **Fix:** promote `ExploreEmpty.tsx:42` to `<h2>`; in `SpotlightCard.tsx`, either move the `:190` "Featured Team Report" label above the card title or demote it to a non-heading `<p>` since it functions as an eyebrow label, not a section heading. **Quick win.**

### N7. `text-red-400` on light surfaces
- **Where:** `src/components/report/PokemonDropdown.tsx:122` ("Clear selection"), `src/app/page.tsx:852` (error icon stroke).
- **WCAG:** 1.4.3 (AA) — `#F87171` on `--surface` #FFFFFF = **2.77:1**.
- **Fix:** use the semantic token `text-danger` (#DC2626, 4.83:1 ✓) instead of `text-red-400`. **Quick win.**

### N8. Calc submit button is 40px tall
- **Where:** `src/components/report/CalcInput.tsx:374-378` (`min-h-[40px]`); also `SlideNavControls.tsx:395` (`min-h-[40px]`).
- **WCAG:** 2.5.5 (AAA) + project 44px standard.
- **Fix:** change both to `min-h-[44px]`. **Quick win.**

### N9. `role="button"` card contains focusable descendants
- **Where:** `src/components/report/TeamOverview.tsx:87-120` (wrapper gets `role="button"` + `tabIndex={0}` at `:89-91`) wrapping a `PokemonCard` that contains real buttons (`PokemonCard.tsx:251,273,301,316`).
- **WCAG:** 4.1.2 (A) — best practice.
- **Problem:** nesting focusable controls inside a `role="button"` produces an ambiguous accessibility tree; the runtime `closest(...)` guards at `:80` and `:112` handle the *pointer* case correctly but the *semantic* nesting remains.
- **Fix:** rather than making the whole card a button, add a dedicated "Open {species} details" button inside the card (visually a chevron or the sprite itself) and drop `role="button"`/`tabIndex` from the wrapper, keeping the tap/long-press handlers for touch affordance only.

---

## Suggested Linear tickets

| # | Title | Priority | Notes |
|---|---|---|---|
| 1 | `a11y: wire Tailwind dark: variant to data-dark-mode (@custom-variant)` | Urgent (P0) | C1 — one line; currently mis-colours 133 usages whenever OS theme ≠ app theme |
| 2 | `a11y: fix broken min-h-11text-* class concatenation in SpeedTierChart` | Urgent (P0) | S1 — **quick win**, 3 missing spaces, restores 44px targets on 8 controls |
| 3 | `a11y: make TypeBadge + move-pill colours meet 4.5:1 in both themes` | High (P1) | C2 + C3 — 11/18 and 16/18 types fail; ship with a contrast vitest |
| 4 | `a11y: add --accent-on token and darken gen-theme accents for CTA + focus contrast` | High (P1) | C4 — white-on-accent fails in dark mode for *every* theme (2.69:1) |
| 5 | `a11y: calc entries must be editable by keyboard (span → button)` | High (P1) | C5 — **quick win**, Level A keyboard failure in the report viewer |
| 6 | `a11y: quick-win pass — labels, aria-hidden icons, 44px targets, table scope` | High (P1) | S5, S7, M1, M6, N1, N2, N7, N8 — batch of mechanical, low-risk edits |
| 7 | `a11y: fix ARIA widget roles (listbox/menu/tablist) in dropdown, navbar, detail slide` | Medium (P2) | S2, S3, M2, M3 — prefer removing unimplemented roles over half-implementing |
| 8 | `a11y: respect prefers-reduced-motion in Framer Motion landing animations` | Medium (P2) | S6 — **quick win**, `useReducedMotion()` hook + guards |
| 9 | `a11y: un-nest dismiss button from Champions banner anchor` | Medium (P2) | S4 — invalid interactive nesting |
| 10 | `a11y: focus trap + aria-modal for InlinePokemonEditor` | Medium (P2) | S8 — copy the existing OTSSheetModal trap |
| 11 | `a11y: darken --success/--warning/--accent semantic tokens to 4.5:1` | Medium (P2) | M9 — overlaps ticket 4, can be merged |
| 12 | `a11y: heading structure — h1 on overview in edit mode, explore level skips` | Low (P3) | M5, N6 |

### Quick-win shortlist for tonight (safe, self-contained)
1. **S1** `SpeedTierChart.tsx:132,482,500` — insert three missing spaces.
2. **C5** `PokemonDetailSlide.tsx:164-176` — `<span onClick>` → `<button>`.
3. **S7** `PokemonDetailSlide.tsx:862,150` + `CalcInput.tsx:361` — add three `aria-label`s.
4. **S5** `PasteInput.tsx:315` — `p-1` → `min-w-[44px] min-h-[44px] flex items-center justify-center`.
5. **M1** `DefensiveCoverageChart.tsx:125,131,154,181` + `OffensiveCoverageChart.tsx:223,229` — `scope="col"` / `<th scope="row">`.
6. **M6** `page.tsx:868` — `role="status" aria-live="polite"` on the loading skeleton.
7. **N7** `PokemonDropdown.tsx:122` — `text-red-400` → `text-danger`.
8. **N8** `CalcInput.tsx:374`, `SlideNavControls.tsx:395` — `min-h-[40px]` → `min-h-[44px]`.
9. **N4** `globals.css:597,888,924` — `.dark` → `[data-dark-mode]`.
10. **S3** `Navbar.tsx:264-273` — add the Escape handler (copy `PageNavbar.tsx:36-49`).

C1 is a one-line change but is deliberately **not** on the quick-win list: it changes rendering across the whole app in both themes and wants a visual pass before it ships.
