# R8 — WCAG 2.1 AA Accessibility Audit (static, read-only)

Date: 2026-10-05 · Agent R8 · **No repo file modified except this report.** No dev server, no browser, no network. Every finding is quoted from source at `file:line`.

Scope as briefed: public marketing/landing surface (`src/app/page.tsx` paste screen → `src/components/input/PasteInput.tsx`, `/champions`, `/explore`, `/faq`, `/tools/ev-to-sp`) and the report viewer (`src/components/report/**`, `src/components/layout/Navbar.tsx`, `src/components/ui/ShareModal.tsx`).

> **Line-number caveat.** `DefensiveCoverageChart.tsx` and `OffensiveCoverageChart.tsx` were being edited by another agent while this audit ran (an `effective-typing` change). Citations for those two files were re-verified against the working tree at the end of the run and shifted by ~9–18 lines from first read; if they drift again, grep the quoted code rather than trusting the number.

## Counts

| Severity | Count | QUICK-FIX | LARGER |
|---|---|---|---|
| High | 5 | 5 | 0 |
| Medium | 12 | 10 | 2 |
| Low | 9 | 7 | 2 |
| **Total** | **26** | **22** | **4** |

## Verified already fixed — NOT re-flagged

Checked before writing, per the accuracy rules:

* **Per-slide `<h1>` (old VGC-259)** — now present. `src/app/page.tsx:1169-1173` renders `<h1 className="sr-only">` gated on `(tournamentMode || physicalSlide !== 0)`, fed by `slideLabels`, with `TeamOverview.tsx:419`/`:432` owning slide 0. No slide is h1-less. **Fixed.**
* **Slide-change live region** — `SlideNavControls.tsx:547` `<span className="sr-only" aria-live="polite" aria-atomic="true">`. **Present.**
* **Export Theme modal focus management** — `page.tsx:405-440` has rAF initial focus, Tab/Shift-Tab trap, Escape, focus restore; markup `page.tsx:1683-1686` has `role="dialog" aria-modal="true" aria-labelledby`. **Fixed.**
* **ShareModal** — full focus trap + Escape + focus restore (`ShareModal.tsx:154-200`), `role="dialog" aria-modal="true" aria-labelledby` (`:327-329`), copy-confirmation live region (`:336`), 44×44 close button with `aria-label` (`:342-350`). **Good. Only one minor item below (#26).**
* **Skip-to-content link** — `src/app/layout.tsx:103-105`, `sr-only focus:not-sr-only`. **Present** (one nit, #21).
* **`LongPressWrapper` keyboard activation** — `TeamOverview.tsx:115-122` does have an `onKeyDown` for Enter/Space. **Not a finding** (only the nesting nit, #19).
* **Global reduced-motion rule** — `globals.css:811-818` zeroes CSS `animation-duration`/`transition-duration`. Covers CSS only; see #16 for the JS gap.
* **Global focus-visible ring** — `globals.css:821-828` `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`. This is why most `focus:outline-none` hits are safe; only #13 defeats it.
* **`<img>` alt** — all 20 `<img>` sites carry `alt`; decorative ones correctly use `alt=""` (`ExploreEmpty.tsx:36`, `PasteInput.tsx:258`). **No finding.**
* **Semantic color tokens** — computed below; `--text-tertiary` passes at full opacity in both themes. The failures are opacity modifiers and raw palette values.
* **`/tools/ev-to-sp` form** — exemplary: `<label htmlFor>` (`EvToSpConverter.tsx:153,172`), `aria-describedby="ev-sp-budget-status"` (`:166,186`), `aria-invalid` (`:185`), `role="status"` (`:213`), `role="progressbar"` (`:235`). **No finding** — cited below as the in-repo pattern to copy.
* **`<table>` semantics on the marketing pages** — `ChampionsContent.tsx:342-356` and `tools/ev-to-sp/page.tsx:244-257` both use `<caption className="sr-only">` + `scope="col"`/`scope="row"`. **No finding** — the report-viewer charts are the outlier (#11).

---

# Contrast baseline — the arithmetic

Relative luminance `L = 0.2126R + 0.7152G + 0.0722B` with `c ≤ 0.03928 → c/12.92`, else `((c+0.055)/1.055)^2.4`. Ratio `= (L_light+0.05)/(L_dark+0.05)`.

## Semantic tokens PASS (both themes) — do not "fix" these

Light (`globals.css:13-21`): `--background #FAF9F6` (L=0.9473), `--surface #FFFFFF` (L=1.0), `--text-tertiary #5E5E7A` (L=0.1179).
Dark (`globals.css:274-282`): `--background #0B0B1A` (L=0.00386), `--surface #141428` (L=0.00802), `--text-tertiary #9898B8` (L=0.3259).

| Pair | Ratio | Verdict |
|---|---|---|
| `text-text-tertiary` on `bg-surface` (light) | (1.05)/(0.1679) = **6.25:1** | PASS |
| `text-text-tertiary` on `bg-background` (light) | (0.9973)/(0.1679) = **5.94:1** | PASS |
| `text-text-tertiary` on `bg-background` (dark) | (0.3759)/(0.0539) = **6.98:1** | PASS |
| `text-text-tertiary` on `bg-surface` (dark) | (0.3759)/(0.0580) = **6.48:1** | PASS |

So `text-text-tertiary` at full strength is fine. The `/NN` opacity modifiers are not.

## `text-text-tertiary/NN` composited over light `--surface #FFFFFF` — ALL FAIL

`#5E5E7A` blended `α` over white; e.g. `α=0.5` → `rgb(174.5,174.5,188.5)`.

| Class | Effective color | L | Ratio vs white | AA 4.5:1 |
|---|---|---|---|---|
| `/80` | `#7E7E95` | 0.2158 | **3.95:1** | FAIL |
| `/70` | `#8E8EA2` | 0.2782 | **3.20:1** | FAIL |
| `/60` | `#9E9EAE` | 0.3500 | **2.68:1** | FAIL |
| `/50` | `#AFAFBD` | 0.4318 | **2.18:1** | FAIL |
| `/40` | `#BFBFCA` | 0.5236 | **1.83:1** | FAIL |
| `/30` | `#CFCFD7` | 0.6254 | **1.55:1** | FAIL |
| `/25` | `#D7D7DC` | 0.6800 | **1.44:1** | FAIL |

Dark mode is slightly better but `/50` and below still fail. **No opacity modifier on `text-text-tertiary` can reach 4.5:1 in light mode.** 31 call sites (see #5).

## Raw Tailwind `-400`/`-300` text with no `dark:` pair — FAIL in light mode

These are dark-mode-intended values applied in **both** themes. Background used: `bg-surface-alt/50` over `--background` ≈ `#F6F4F0` (L=0.9059); for page-level text, `--background #FAF9F6` (L=0.9473).

| Class | Hex | L | On `#F6F4F0` | On its own tinted bg | AA |
|---|---|---|---|---|---|
| `text-amber-400` | `#FBBF24` | 0.5790 | **1.52:1** | on `bg-amber-500/20` ≈ **1.35:1** | FAIL |
| `text-emerald-400` | `#34D399` | 0.4962 | 1.75:1 | on `bg-emerald-500/10` **1.67:1** | FAIL |
| `text-blue-400` | `#60A5FA` | 0.3630 | **2.31:1** | on `bg-blue-500/20` ≈ 2.2:1 | FAIL |
| `text-purple-400` | `#C084FC` | 0.3474 | 2.38:1 | on `bg-purple-500/10` ≈ 2.4:1 | FAIL |
| `text-red-400` | `#F87171` | 0.3296 | 2.44:1 | on `bg-red-500/10` **2.31:1** | FAIL |
| `text-red-300` | `#FCA5A5` | 0.5080 | 1.70:1 | on `bg-red-500/30` ≈ 1.6:1 | FAIL |

Worked example (worst case, `text-amber-400` on `bg-surface-alt/50`):
`#FBBF24` → R 251/255=0.9843 → ((1.0393)/1.055)^2.4 = 0.9647; G 191/255=0.7490 → 0.5211; B 36/255=0.1412 → 0.0176.
`L = 0.2126(0.9647) + 0.7152(0.5211) + 0.0722(0.0176) = 0.2051 + 0.3727 + 0.0013 = 0.5790`.
bg `#F6F4F0` → `L = 0.2126(0.9216) + 0.7152(0.9047) + 0.0722(0.8714) = 0.9059`.
Ratio `= (0.9059+0.05)/(0.5790+0.05) = 0.9559/0.6290 = **1.52:1**` — against a 4.5:1 requirement. In dark mode the same pair lands near 6:1, which is why it was never noticed.

---

# Findings, ranked by (user impact × certainty)

## HIGH

### 1. Coverage-chart column filters are `<th onClick>` — keyboard users cannot filter · QUICK-FIX
`src/components/report/DefensiveCoverageChart.tsx:139-160`
```tsx
<th
  key={type}
  className="px-0.5 py-2 cursor-pointer select-none"
  onClick={() => {
    hapticLight();
    setHighlightedType((prev) => (prev === type ? null : type));
  }}
>
  <span className={`inline-block w-full ... ${highlightedType && highlightedType !== type ? "opacity-50" : ""}`}
```
Identical at `src/components/report/OffensiveCoverageChart.tsx:246-262`.

A `<th>` with `onClick`, no `role`, no `tabIndex`, no key handler: the 18 type-column highlight filters — the only way to read a 19-column heatmap on a phone — are mouse/touch only. **WCAG 2.1.1 Keyboard (A)**, **4.1.2 Name/Role/Value (A)**. Also 36 instances of a 44×44 target failure, since the `<th>` is ~20px wide.

Fix: keep the `<th>` and wrap the existing `<span>` in a real button, which also fixes the target size and the state announcement:
```tsx
<th key={type} scope="col" className="px-0.5 py-2">
  <button type="button" aria-pressed={highlightedType === type}
          aria-label={`Highlight ${type} column`}
          onClick={() => { hapticLight(); setHighlightedType(p => p === type ? null : type); }}
          className="w-full min-h-11 sm:min-h-0">
    <span …>{type.slice(0,3)}</span>
  </button>
</th>
```

### 2. Light-mode text contrast: `-400`/`-300` palette values with no `dark:` pair · QUICK-FIX (top offenders) / LARGER (full sweep)
Arithmetic above. ~50 call sites; the user-visible worst, all in the report viewer:

* `src/components/report/MatchupPlanSlide.tsx:574` — `<span className="text-xs font-bold uppercase tracking-widest text-blue-400">{t.lead}</span>` → **2.31:1**. The "LEAD" section label.
* `src/components/report/MatchupPlanSlide.tsx:632` — same for `text-amber-400` "BACK" → **1.52:1**.
* `src/components/report/MatchupPlanSlide.tsx:528` / `:540` — collapsed-card `text-blue-400/70` "L" and `text-amber-400/70` "B" → worse than the above.
* `src/components/report/DefensiveCoverageChart.tsx:99` + `:106` — blindspot badge `text-red-400` and `text-red-400/70` on `bg-red-500/10` → **2.31:1**.
* `src/components/report/DefensiveCoverageChart.tsx:115` + `:122` — strength badge `text-emerald-400` / `text-emerald-400/70` on `bg-emerald-500/10` → **1.67:1**.
* `src/components/report/DefensiveCoverageChart.tsx:200` + `:202` — team-weak row `text-red-300` on `bg-red-500/30`, `text-amber-400` on `bg-amber-500/20` → **≤1.7:1**. Mirrored at `OffensiveCoverageChart.tsx:313-317`.
* `src/components/report/SpeedTierChart.tsx:586` + `:593` — Mega species name and "MEGA" badge `text-purple-400` → **2.38:1**; `:604` "META" badge `text-blue-400` → **2.31:1**; `:672`/`:680` delta + position-change `text-red-400` → **2.44:1**.
* `src/components/report/CommonModesSlide.tsx:516,519,541,544` — `text-blue-400` / `text-amber-400` lead/back labels, same as MatchupPlanSlide.
* `src/components/report/PokemonDetailSlide.tsx:73-98` (config table) and `:812` `text-purple-400/70` "Mega boosts".

Fix: these are all **already written correctly elsewhere in the same repo** — `PokemonDetailSlide.tsx:824-826` uses `text-emerald-600 dark:text-emerald-400` / `text-rose-600 dark:text-rose-400`, and `page.tsx:1230` uses `text-amber-600 dark:text-amber-400`. Apply the same shape: `text-<c>-400` → `text-<c>-600 dark:text-<c>-400`, `text-<c>-300` → `text-<c>-700 dark:text-<c>-300`. Ship the 20 report-viewer sites tonight; the rest (`ExploreContent.tsx:225`, `ExploreFilters.tsx:569`, `AddOpponentInput.tsx:125`, `PokemonDropdown.tsx:122`, `CalcInput.tsx:13,20`, `TeamOverview.tsx:201`, `page.tsx:852`) as a follow-up sweep.

### 3. `min-h-11text-xs` typo silently drops the 44px target on 12 Speed-tier toggles · QUICK-FIX
`src/components/report/SpeedTierChart.tsx:132`
```tsx
className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 min-h-11text-[10px] sm:text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
```
and `:482`, `:500`:
```tsx
className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-11text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
```
Missing space. `min-h-11text-xs` is not a Tailwind class, so **both** `min-h-11` and `text-xs` are discarded. Rendered height is `py-1.5` + ~14px line box ≈ **26px**, well under the project's 44×44 standard and **WCAG 2.5.8 Target Size (Minimum, AA)**. Affects the 5 modifier chips × 2 sides (`:129-140`) plus "Mega Forms" (`:479`) and "Meta Threats" (`:495`) — the entire Speed-tier control strip, on the slide most used on a phone at a tournament.

Fix: insert the space — `min-h-11 text-[10px]`, `min-h-11 text-xs`, `min-h-11 text-xs`. I confirmed the only other `-11h-7`-style grep hits are SVG path data (`WhatsNewModal.tsx:27`, `PasteInput.tsx:298`, `PageNavbar.tsx:17`, `FeedbackContent.tsx:17`), not class typos.

### 4. "Delete" is a `<span onClick>` nested inside a `<button>` · QUICK-FIX
`src/components/report/MatchupPlanSlide.tsx:500-559`
```tsx
<button type="button" onClick={onToggle} className="w-full flex items-center justify-between …">
  …
  {!isReadOnly && canDelete && (
    <span
      onClick={(e) => { e.stopPropagation(); onDelete(); }}
      className="text-text-tertiary hover:text-red-400 text-xs px-2 py-1 rounded-md hover:bg-red-400/10 transition-colors"
    >
      {t.delete}
    </span>
  )}
</button>
```
Three failures at once:
1. A destructive action on a `<span>` with no `role`, `tabIndex` or key handler — **keyboard users cannot delete a game plan at all**. Pressing Enter while focused on the row toggles collapse instead. **WCAG 2.1.1 (A)**.
2. The span's text is folded into the toggle button's accessible name, so screen readers announce the collapse control as *"Game 1 Delete, button"*. **WCAG 4.1.2 (A)**, **2.4.6 (AA)**.
3. Target is `px-2 py-1` ≈ 20px — under 44×44.

Fix: lift it out of the `<button>` into a sibling, and shrink the toggle to the label row:
```tsx
<div className="w-full flex items-center justify-between">
  <button type="button" onClick={onToggle} aria-expanded={!isCollapsed} className="flex-1 flex items-center …">…</button>
  {!isReadOnly && canDelete && (
    <button type="button" onClick={onDelete}
            aria-label={`${t.delete} ${t.gameN} ${index + 1}`}
            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center …">{t.delete}</button>
  )}
</div>
```

### 5. `text-text-tertiary/NN` — 31 sites, none can reach 4.5:1 · QUICK-FIX
Arithmetic above (1.44:1 → 3.95:1). Highest-impact sites:

* `src/components/report/TournamentMode.tsx:52` — `value > 0 ? "text-text-primary" : "text-text-tertiary/40"` → **1.83:1**. Zero-EV stat values on the tournament open-team-sheet view, i.e. the screen read under time pressure at an event.
* `src/components/report/TournamentMode.tsx:112` and `:159` — `<span className="text-text-tertiary/30 mx-0.5 text-[8px]">{"→"}</span>` → **1.55:1 at 8px**. This arrow carries meaning (base → mega transition).
* `src/components/report/PokemonCard.tsx:463` — `text-text-tertiary/50` on the `{totalEvs}/508` budget readout → **2.18:1**.
* `src/components/report/PokemonDetailSlide.tsx:714` — `totalEvs === 508 ? "text-text-tertiary/50"` → **2.18:1** (the "spread is legal" state is the least legible one).
* `src/components/report/DefensiveCoverageChart.tsx:205` / `OffensiveCoverageChart.tsx:313` — `text-text-tertiary/25` → **1.44:1**.
* `src/components/report/PokemonCard.tsx:278`, `:304`, `:322` — icon-only action buttons at `text-text-tertiary/50` and `/40` → **1.83–2.18:1** for the glyph (non-text contrast, 1.4.11, needs 3:1).
* `src/components/report/MatchupSheetRow.tsx:53`, `MatchupPlanSlide.tsx:511`, `SlideNavControls.tsx:536`, `TeamStats.tsx:43-68`, `TeamOverview.tsx:816`/`:822`, `MatchupSheet.tsx:77`, `PokemonDetailSlide.tsx:686` — `/60`–`/80`, **2.68–3.95:1**.

Fix: drop the modifier (`text-text-tertiary` is already 5.94:1 and is the dimmest token by design). Where a genuinely dimmer step is wanted, add one real token rather than an alpha, e.g. in `globals.css` beside `--text-tertiary`:
`--text-quaternary: #6E6E8A;` (light) / `#8080A0;` (dark) — both ≥4.5:1 — and use `text-text-quaternary`. `TeamOverview.tsx:197` and `PokemonCard.tsx:378` are `placeholder:text-text-tertiary/50`/`/60`; placeholders are exempt from 1.4.3 only if a real label exists, which it does here (`aria-label`), so those two can stay.

---

## MEDIUM

### 6. Slide-options sheet: `role="dialog"` with no focus move, no trap, no restore — and it renders *before* its trigger, so forward-Tab never reaches it · QUICK-FIX
`src/components/report/SlideNavControls.tsx:423-443`
```tsx
return (
  <>
    {/* Overflow sheet (mobile) / popover (desktop) */}
    {sheetOpen && showOverflow && (
      <>
        <div aria-hidden onClick={() => setSheetOpen(false)} className="fixed inset-0 z-[55] …" />
        <div
          role="dialog"
          aria-label="Slide options"
          className="fixed z-[60] bottom-0 left-0 right-0 …"
        >
          {overflowBody}
```
Escape *is* handled (`:164-172`) but nothing else is: no `aria-modal`, focus is never moved into the sheet, there is no trap, and focus is not returned to the trigger on close. Worse, the sheet is the **first** child of the fragment while its trigger (`:251-257`, `aria-haspopup="dialog" aria-expanded`) sits inside the nav rendered *after* it — so a keyboard user who opens the sheet must Shift-Tab backwards past the whole page to reach the controls inside it. The sheet holds the creator hide/show-slide tool and the Base/Mega display toggle (`:300-330`), so those are effectively keyboard-unreachable. **WCAG 2.4.3 Focus Order (A)**, **4.1.2 (A)**.

Fix: copy the block already working in `ShareModal.tsx:154-200` verbatim, or at minimum (8 lines) move focus in on open and restore on close:
```tsx
const sheetRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);
useEffect(() => {
  if (!sheetOpen) return;
  const frame = requestAnimationFrame(() =>
    sheetRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus());
  return () => { cancelAnimationFrame(frame); triggerRef.current?.focus(); };
}, [sheetOpen]);
```
and add `aria-modal="true"` + `ref={sheetRef}` to `:434`, `ref={triggerRef}` to `:251`.

### 7. Navbar settings `role="menu"` has zero `menuitem`s, no Escape, no focus return · QUICK-FIX
`src/components/layout/Navbar.tsx:611-631`
```tsx
onClick={() => setMenuOpen(!menuOpen)}
…
aria-label="Settings"
aria-expanded={menuOpen}
aria-haspopup="menu"
…
{menuOpen && (
  <div role="menu" className="absolute right-0 top-full mt-1.5 bg-surface border border-border rounded-xl shadow-2xl py-2 min-w-[240px] z-50 animate-fade-in">
```
`grep -c menuitem src/components/layout/Navbar.tsx` → **0**. A `role="menu"` has `menuitem`/`menuitemradio`/`menuitemcheckbox` as required owned elements; with plain `<a>`/`<button>` children (e.g. `:638`, `:670`, `:765`, `:869`) screen readers announce an empty menu and the items may be skipped entirely. No arrow-key navigation either, which `role="menu"` promises. And the only dismissal is an outside **mousedown** (`:264-273`) — no Escape, no focus return to the trigger. **WCAG 4.1.2 (A)**, **2.1.1 (A)**.

Fix (smallest correct change — this is a disclosure, not a menu): delete `role="menu"` at `:631`, change `aria-haspopup="menu"` → `aria-haspopup="true"` at `:615`, and extend the `:264-273` effect:
```tsx
const onKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") { setMenuOpen(false); menuButtonRef.current?.focus(); }
};
document.addEventListener("keydown", onKey);
```

### 8. Speed-tier toggle buttons never expose on/off state · QUICK-FIX
`src/components/report/SpeedTierChart.tsx:126-140`
```tsx
const active = modifiers.has(key);
return (
  <button key={key} type="button" onClick={() => onToggle(side, key)}
    className={`… ${active ? "bg-accent text-white border-accent …" : "bg-surface-alt/50 text-text-secondary border-border …"}`}
    title={`${cfg.label} on ${label}: ${cfg.description}`}>
```
and `:479-487` ("Mega Forms"), `:495-509` ("Meta Threats"). State is conveyed by background colour alone — no `aria-pressed`. 12 buttons that change what the whole chart means, and a screen-reader user cannot tell whether Tailwind, Choice Scarf, Mega Forms or Meta Threats is on. **WCAG 4.1.2 (A)**, and **1.4.1 Use of Color (A)** for sighted-but-colour-blind users.

This is a gap, not a house style: `aria-pressed` is used correctly at `PokemonDetailSlide.tsx:197`/`:600`, `PokemonCard.tsx:261`, `CalcInput.tsx:266`/`:326`, `TeamOverview.tsx:883`, `ExploreFilters.tsx:269`/`:470`/`:485`/`:505`, `ReportCard.tsx:321`.

Fix: add `aria-pressed={active}` (`:131`), `aria-pressed={showMegaTiers}` (`:481`), `aria-pressed={showMetaThreats}` (`:497`). Also move the `title` text into `aria-label` or a visible hint — `title` is not exposed on touch and is unreliable on desktop AT.

### 9. `aria-label` on role-less `<div>`/`<span>` is silently dropped · QUICK-FIX
`src/components/report/PokemonDetailSlide.tsx:753`
```tsx
<div key={stat} className="flex items-center gap-2" aria-label={`${statLabels[stat]}: ${displayValue}${natureUp ? ", boosted by nature" : ""}${natureDown ? ", reduced by nature" : ""}${isBoosted ? ", boosted by item" : ""}`}>
```
`:755-756`
```tsx
{natureUp && <span className="text-[12px] text-emerald-500 dark:text-emerald-400 leading-none" aria-label="boosted by nature">{"▲"}</span>}
{natureDown && <span className="text-[12px] text-rose-500 dark:text-rose-400 leading-none" aria-label="reduced by nature">{"▼"}</span>}
```
Also `:698-700` (SP budget pill) and `:811`, `:827` (Mega boosts).

Per ARIA 1.2 / HTML-AAM, `aria-label` is **not supported** on elements whose computed role is `generic` (a bare `div`/`span`); browsers discard it. Net effect: the nature-boost and item-boost information on the per-Pokémon stat spread — the whole point of the detail slide — reaches a screen reader only as the bare glyphs ▲/▼, which VoiceOver reads as "black up-pointing triangle" or skips.

Again, a local gap and not the house pattern: the **same** stat row is done correctly in `PokemonCard.tsx:513` (`role="listitem" aria-label={…}`) inside `PokemonCard.tsx:485` (`role="list"`), with the bar at `:519` carrying `role="progressbar" aria-valuenow/min/max`. `MatchupPlanSlide.tsx:275-286` matches.

Fix: mirror `PokemonCard`. Wrap the rows in `role="list"`, give each row `role="listitem"`, add `role="progressbar" aria-valuenow/min/max` to the bar, and replace the ▲/▼ `aria-label`s with `<span className="sr-only">boosted by nature</span>` plus `aria-hidden` on the glyph. Add `role="group"` to `:699` and `:811`.

### 10. Entering note-edit mode is mouse-only · QUICK-FIX
`src/components/report/PokemonDetailSlide.tsx:163-174`
```tsx
<span
  className={`flex-1 text-sm sm:text-base text-text-primary leading-relaxed ${!isReadOnly ? "cursor-text" : ""}`}
  onClick={() => {
    if (!isReadOnly && onEdit) {
      setEditText(entry.text);
      setEditing(true);
    }
  }}
>
  {entry.text}
</span>
```
No `role`, no `tabIndex`, no key handler. The sibling control cluster (`:196-226`) holds only the category toggles and remove — there is no "edit" button — so a keyboard-only creator can delete and re-categorise a note but can never edit its text. **WCAG 2.1.1 (A)**. (The editing `<textarea>` at `:155-161` *is* correctly keyboarded, Enter to commit / Escape to cancel — the gap is only getting into it.)

Fix:
```tsx
<button type="button"
  className={`flex-1 text-left text-sm sm:text-base text-text-primary leading-relaxed ${!isReadOnly ? "cursor-text" : ""}`}
  aria-label={`Edit note: ${entry.text}`}
  onClick={…same…}>
  {entry.text}
</button>
```
(and render a plain `<span>` when `isReadOnly`, so viewers don't get a no-op button).

### 11. Coverage heatmaps: no `scope`, no `<caption>`, species cells are `<td>` not `<th scope="row">` · QUICK-FIX
`src/components/report/DefensiveCoverageChart.tsx:131-140`
```tsx
<table className="w-full table-fixed sm:table-auto border-collapse text-center min-w-[40rem]">
  <thead>
    <tr>
      <th className="sticky left-0 z-10 bg-background px-1.5 sm:px-2 py-2 text-left text-[9px] sm:text-xs font-bold text-text-tertiary uppercase tracking-wider w-14 sm:w-32">
        Pok&eacute;mon
      </th>
```
`:163-165`
```tsx
<td className="sticky left-0 z-10 bg-background px-1.5 sm:px-2 py-2 text-left text-[10px] sm:text-sm font-bold text-text-primary truncate max-w-[3.5rem] sm:max-w-[8rem]">
  {p.species}
</td>
```
Mirrored in `OffensiveCoverageChart.tsx:238-245` and `:270-272`.

Good news for the brief's question 8: this chart **is** a real `<table>`, so its data is not purely visual. But with no `scope` on the column headers and the row header emitted as a `<td>`, a screen reader reading cell 7 of row 3 announces `"½"` with no "Fire" and no "Incineroar" — 19 columns × 6 rows of unattributable values. **WCAG 1.3.1 (A)**. The cell `title` at `:179` is not a substitute (not exposed on touch, unreliable on desktop AT).

Fix, and the exact pattern already shipped at `ChampionsContent.tsx:342-356`:
```tsx
<caption className="sr-only">Type effectiveness of each incoming attack type against each team member</caption>
…
<th scope="col" …>  {/* each type column */}
<th scope="row" …>{p.species}</th>  {/* was <td> */}
```

### 12. Landing-page paste error is announced but not linked to the field · QUICK-FIX
`src/components/input/PasteInput.tsx:404-419` (textarea) and `:441-450` (error)
```tsx
aria-label="Paste your Showdown team export, PokéPaste URL, or replay URL"
className="relative w-full h-40 sm:h-56 … focus:outline-none focus:border-accent/50 transition-all duration-300"
```
```tsx
{(fetchError || validationError) && (
  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert"
    className="text-sm text-danger font-semibold mt-3 px-1">
    {fetchError || validationError}
  </motion.p>
)}
```
`role="alert"` fires once on appearance, but the textarea has no `aria-describedby` and no `aria-invalid`, so a user who tabs back to the field — or arrives after the alert has been spoken — gets no indication that it is in an error state or why. **WCAG 3.3.1 Error Identification (A)**, **1.3.1 (A)**.

Fix (the repo already does this correctly at `EvToSpConverter.tsx:166,185`):
```tsx
const errorId = "paste-error";
const hasError = !!(fetchError || validationError);
// textarea:
aria-invalid={hasError || undefined}
aria-describedby={hasError ? errorId : undefined}
// error <p>:
id={errorId}
```

### 13. The landing page's main input has no focus ring · QUICK-FIX
`src/components/input/PasteInput.tsx:417`
```tsx
className="relative w-full h-40 sm:h-56 p-4 sm:p-5 bg-surface border-2 border-border rounded-xl text-sm font-[family-name:var(--font-mono)] text-text-primary placeholder:text-text-tertiary/40 resize-none focus:outline-none focus:border-accent/50 transition-all duration-300"
```
`focus:outline-none` defeats the global `*:focus-visible` ring (`globals.css:822-825`) and the only replacement is a border recolour from `--border #E0DDD5` to `accent/50`. `#E11D48` at 50% over `#FFFFFF` is `#F08EA4` (L≈0.44) against the adjacent `bg-surface` white — about **2.1:1**, under the 3:1 non-text minimum, and it replaces an existing border rather than adding anything, so there is no change in *shape*. The sibling glow `div` at `:390-396` sits behind a `relative` textarea and renders as a soft 1px halo. Every other input in the repo pairs `focus:outline-none` with `focus:ring-2 focus:ring-accent/40` (e.g. `TeamOverview.tsx:545`, `CalcInput.tsx:226`, `ExploreFilters.tsx:225`) — this one is the outlier, on the single most important control on the marketing page. **WCAG 2.4.7 Focus Visible (AA)**, **1.4.11 (AA)**.

Fix: `focus:outline-none` → `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background`, keeping `focus:border-accent/50`.

### 14. Keyboard-shortcut hint on the primary CTA is 2.42:1 · QUICK-FIX
`src/components/input/PasteInput.tsx:473` and `:492`
```tsx
<kbd className="text-[10px] opacity-60 hidden sm:inline font-[family-name:var(--font-mono)]">Ctrl+Enter</kbd>
```
inside `className="… bg-accent text-white rounded-xl text-sm font-bold …"`.
White at 60% over the default accent `#E11D48` composites to `rgb(243,165,182)`, L=0.4919; accent L=0.1735. Ratio `= (0.5419)/(0.2235) = **2.42:1**` at 10px. **WCAG 1.4.3 (AA)**.

Fix: `opacity-60` → `opacity-90` (→ ~4.9:1) or drop the opacity and use `text-white/90`; bump `text-[10px]` → `text-[11px]`.

### 15. Drag-and-drop reordering has no keyboard alternative · LARGER
`src/components/report/TeamOverview.tsx:739-783`
```tsx
<LongPressWrapper
  …
  draggable={canDrag}
  onDragStart={(e: React.DragEvent) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
  …
  onDrop={(e) => { … onReorderPokemon?.(from, i); … }}
```
with `const canDrag = !isReadOnly && !!onReorderPokemon;` (`:397`). Same pattern at `MatchupPlanSlide.tsx:595` and `:653` (Bring-Four lead/back slots), `MatchupSheet.tsx:88`, `PokemonDropdown.tsx:81`. HTML5 drag events fire only from pointer input; there is no Move-up/Move-down affordance anywhere for Pokémon (the `onMoveUp`/`onMoveDown` in `SlideNavControls` reorder *slides*, not team members), and `LongPressWrapper`'s `onKeyDown` (`:115-122`) maps Enter/Space to `onTap` → open details, not reorder. **WCAG 2.1.1 Keyboard (A)**. Creator-mode only, which is why it is Medium and not High.

Fix: add a small Move-up / Move-down button pair per card behind `canDrag`, calling the existing `onReorderPokemon(i, i-1)` / `(i, i+1)` — no new state, and it doubles as the touch-accessible path. Announce the result through a `aria-live="polite"` region ("Incineroar moved to position 2 of 6").

### 16. `motion/react` entrance animations ignore `prefers-reduced-motion` · QUICK-FIX
`globals.css:811-818` zeroes only CSS `animation-duration`/`transition-duration`. `motion/react` animates inline styles on a rAF loop, so that rule does not touch it. Across the landing page alone: `PasteInput.tsx:254-266` (6 staggered sprite entrances), `:269-274` (title), `:289-294` (banner slide-in), `:325-329`, `:376-382`, `:439-444`, `:452-456`, `:461-465`. The static-sprite `<source media="… (prefers-reduced-motion: reduce)">` at `:249-252` correctly handles the animated GIFs — so the intent is clearly there, the JS layer just was not covered.

`useReducedMotion` is imported in exactly one file (`ExploreFilters.tsx:6,130`); nowhere else. Violates the project's own "reduced-motion respected" standard; WCAG-wise these are short non-looping entrances so 2.3.3 (AAA) rather than an AA failure.

Fix — one line, covers every `motion.*` in the tree. In `src/app/layout.tsx` beside the other providers:
```tsx
import { MotionConfig } from "motion/react";
…
<MotionConfig reducedMotion="user">{/* existing tree */}</MotionConfig>
```

### 17. Tab pattern is half-built: `role="tab"` with no `aria-controls`, no `role="tabpanel"`, and the section tablist has no arrow keys · LARGER
`src/components/report/SlideNavControls.tsx:184-208`
```tsx
<div role="tablist" aria-label="Report sections" …>
  …
    <button key={tab.key} type="button" role="tab" aria-selected={active} aria-disabled={!tab.avail} disabled={!tab.avail}
      onClick={() => jumpToPhysical(tab.target)}
```
and `:491-510` for the per-slide dots. The slide content it controls is declared as a region, not a panel — `src/app/page.tsx:1147-1151`:
```tsx
role="region"
aria-roledescription="report slide"
aria-label={`${slideLabels[currentSlide] ?? "Team report"}, slide ${currentSlide + 1} of ${totalSlides}`}
```
No tab carries `aria-controls`, nothing carries `role="tabpanel"`, so the relationship is invisible to AT and "tab" is a promise the widget does not keep. The **dot** tablist does implement the pattern properly (roving `tabIndex={isCurrent ? 0 : -1}` at `:505`, `onKeyDown={handleSlideTabKeyDown}` at `:508`); the **section** tablist at `:184` has neither, so all four section tabs sit in the tab order and arrow keys do nothing. Inconsistent keyboard behaviour between two tablists in the same toolbar. **WCAG 4.1.2 (A)**, **1.3.1 (A)**.

Fix (pick one, do not half-do it): simplest is to **drop the tab semantics** from `:184-197` — it is a set of jump links, so `role="toolbar"` + plain buttons describes it honestly and costs nothing. If the tab pattern is wanted, give `page.tsx:1148` `role="tabpanel"` + `id="slide-panel"` + `aria-labelledby={activeTabId}`, add `aria-controls="slide-panel"` to every tab, and copy `handleSlideTabKeyDown` + roving `tabIndex` from `:505-508` to the section tabs.

---

## LOW

### 18. ~305 decorative SVGs are exposed to assistive tech · QUICK-FIX
`src/components/ui/icons.tsx:1-16` sets the house rule in a comment —
```
 * Accessibility note (§5.7): these icons carry no label of their own. When an
 * icon is the only content of an interactive control, put the `aria-label` on
 * the button/link/span wrapper, not here.
```
— and the rule is followed for naming (`ShareModal.tsx:342-350`, `page.tsx:1133-1141`), but nothing marks the graphics as decorative. Counts: 89 `<XIcon …>` call sites, 5 with `aria-hidden`; 257 inline `<svg>`, 36 with `aria-hidden`. Not a naming failure — the buttons are named — but it is a lot of "graphic"/"image" noise in the SR output, and it is explicitly in the project standard ("SVG icons only" + aria-labels).

Fix: one edit covers 84 of them — bake the default into the icon components so call sites can still override:
```tsx
function Svg(props: SVGProps<SVGSVGElement>) {
  return <svg aria-hidden="true" focusable="false" {…props} />;
}
```
and have each icon render `<Svg …>`. Then add `aria-hidden="true"` to the inline `<svg>`s in the hot files: `Navbar.tsx` (12, none), `PasteInput.tsx` (8, none), `MatchupPlanSlide.tsx` (4, none), `PokemonDetailSlide.tsx` (6, none), `DefensiveCoverageChart.tsx` (2, none).

### 19. `role="button"` wrapper contains buttons and a text input · LARGER
`src/components/report/TeamOverview.tsx:85-131` renders
```tsx
<div
  data-slide-navigation-ignore={onTap ? "true" : undefined}
  role={onTap ? "button" : undefined}
  tabIndex={onTap ? 0 : undefined}
  aria-label={onTap ? ariaLabel : undefined}
```
and is used at `:739-748` with `onTap` always supplied (`page.tsx:1292` `onPokemonLongPress={handlePokemonLongPress}`), wrapping a `<PokemonCard>` that itself contains the MVP toggle (`PokemonCard.tsx:304`), the Mega toggle (`:261`), the sprite-replace control and the role-note `<input>` (`:371-378`). `role="button"` must not have interactive descendants; some screen readers flatten the subtree, making the card's own controls unreachable in browse mode. The click/key handlers are carefully guarded (`e.target !== e.currentTarget` at `:117`, plus the `closest('button, input, textarea, a, …')` check at `:112`), so this is a semantics problem rather than a broken interaction — hence Low.

Fix: change the wrapper to `role="group" aria-label={ariaLabel}` and give the card an explicit "Open details" affordance (it can be the existing species heading, promoted to a `<button>`), keeping the div's pointer handlers for the touch gesture.

### 20. `/explore` skips from `<h1>` to `<h3>` · QUICK-FIX
`src/components/explore/ExploreHero.tsx:10`
```tsx
<h1 className="text-lg sm:text-2xl font-extrabold tracking-tight">
```
then the next heading in the document is `src/components/explore/ReportCard.tsx:207`
```tsx
<h3 className="text-xs sm:text-sm font-bold text-text-primary leading-tight group-hover:text-accent transition-colors line-clamp-2 sm:line-clamp-1">
```
`grep '<h2' src/components/explore/ExploreContent.tsx` → none. One level skipped, and the results grid has no heading of its own, so heading-rotor navigation jumps straight from the page title into individual cards. **WCAG 1.3.1 (A)**.

Fix: add `<h2 className="sr-only">Team reports</h2>` above the grid in `ExploreContent.tsx` (around `:230`), or demote `ReportCard`'s title to `<h3>` under a real `<h2>`.

### 21. Skip-link target is not focusable · QUICK-FIX
`src/app/layout.tsx:103` → `:140`
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:fixed …">
…
<div id="main-content">{children}</div>
```
Jumping to a non-focusable element only sets the sequential-focus starting point; several AT/browser combinations keep virtual-cursor focus at the top, so the skip silently does nothing.

Fix: `<div id="main-content" tabIndex={-1} className="focus:outline-none">{children}</div>`.

### 22. `SpeedTierChart` has no row semantics and no summary · LARGER
Answering the brief's question 8 for the second chart: unlike `DefensiveCoverageChart`, `SpeedTierChart` is not a table — rows are nested `<div>`s (`:560-690`). The data is *not* purely visual (species name at `:585-589`, speed value at `:655-662` and the Mega/Meta badges are all real text, read in order), but there is no grouping, so a screen reader hears one long run of "Flutter Mane 205 Incineroar Mega 110 …" with no row boundaries, and the bars themselves have no `role="progressbar"` (contrast `PokemonCard.tsx:519`, which does). `grep 'role=' SpeedTierChart.tsx` returns nothing. There is also no summary of the chart's conclusion (who outspeeds whom).

Fix: wrap the list in `role="list"`, each row in `role="listitem" aria-label={`${entry.species}, Speed ${entry.displaySpeed}${entry.isYours ? ", your team" : ", meta benchmark"}${entry.isMega ? ", Mega form" : ""}`}` (the data is already computed), and add one `<p className="sr-only">` summary above it, e.g. "N of your 6 Pokémon outspeed the fastest common meta threat at X Speed."

### 23. Shared-report loading and error states have no `<h1>` · QUICK-FIX
`src/app/page.tsx:816-823`
```tsx
<main className="min-h-screen flex items-center justify-center p-6">
  …
    <h2 className="text-lg font-bold text-text-primary">Sign in to continue</h2>
```
and the decode-failure branch, `:848-870`, whose only text is a `<p className="text-text-primary font-semibold">{t.failedToLoadShared}</p>` — no heading at all. Both are full-page states a visitor can land on directly from a shared link. **WCAG 1.3.1 (A)**; mild, because the content is two sentences.

Fix: promote `:823` to `<h1>` and add `<h1 className="text-text-primary font-semibold">{t.failedToLoadShared}</h1>` in place of the `<p>` at `:857`.

### 24. Sprite `alt` duplicates the adjacent visible species name · QUICK-FIX
`src/components/report/SpeedTierChart.tsx:570-589` renders two `<PokemonSprite>`s (mobile + desktop, one pruned by `hidden sm:block`) immediately followed by `<span …>{entry.species}</span>`. `PokemonSprite.tsx:62-64` emits `alt={species}`, so each row is announced "Flutter Mane, image. Flutter Mane." Same shape in `MatchupPlanSlide.tsx:530-537`.

Fix: `PokemonSprite` already takes props — pass `alt=""` where a visible species label sits beside the sprite, keeping `alt={species}` where the sprite stands alone (e.g. the Bring-Four slots).

### 25. Landing page has one `<h1>` and no `<h2>` · QUICK-FIX
`src/components/input/PasteInput.tsx:275` is the page's only heading. The "How it works" three-step block (`:325-367`) titles its cards with `<p className="text-xs font-bold text-text-primary">{item.title}</p>` (`:358`), and "Try a sample team:" is `<p className="text-xs font-bold text-text-tertiary uppercase …">` (`:487`). Also `:334` — the collapsed-state "How it works" trigger is a `<button>` with no `aria-expanded`, so its disclosure state is unannounced.

Fix: make "How it works" and "Try a sample team" real `<h2>`s (keep the existing classes, they are visually fine), the step titles `<h3>`, and add `aria-expanded={howItWorksOpen}` to the `:333-340` button.

### 26. ShareModal's scrollable body is not keyboard-scrollable · QUICK-FIX
`src/components/ui/ShareModal.tsx:326-332`
```tsx
className="bg-surface border border-border rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full sm:mx-4 animate-[sheet-up_0.3s_ease-out] sm:animate-fade-in overflow-hidden max-h-[90vh] overflow-y-auto"
```
A scroll container with no `tabIndex`, so it cannot be scrolled with arrow keys unless focus happens to be on a control inside it. In practice the focus trap keeps focus on controls that scroll into view, so impact is small. **WCAG 2.1.1 (A)**, edge case.

Fix: `tabIndex={-1}` is already implied by the dialog; add `tabIndex={0}` plus `role="document"`, or simply leave it — the trap mitigates it. Lowest priority item in this report.

---

# Suggested order for a one-evening batch

All QUICK-FIX, roughly ascending in diff size, each independently shippable:

1. #3 — three missing spaces, `SpeedTierChart.tsx:132,482,500`. Biggest win per character in the whole report.
2. #8 — three `aria-pressed` attributes, same file.
3. #1 — wrap two `<th>` spans in buttons (`Defensive`/`OffensiveCoverageChart`), which also delivers #11's `scope="col"`.
4. #11 — `scope`/`caption`/`<th scope="row">` on both heatmaps.
5. #4 — lift Delete out of the toggle `<button>`, `MatchupPlanSlide.tsx:500-559`.
6. #12 + #13 + #14 — `PasteInput.tsx`: error linkage, focus ring, kbd opacity.
7. #16 — one `<MotionConfig reducedMotion="user">` in `layout.tsx`.
8. #7 — drop `role="menu"`, add Escape + focus return, `Navbar.tsx`.
9. #6 — focus in/out for the slide-options sheet, `SlideNavControls.tsx`.
10. #9 + #10 — `PokemonDetailSlide.tsx` roles and the edit affordance.
11. #5 + #2 — the contrast sweep. Mechanical but touches many files; do it as its own commit so it can be reviewed by diff rather than by eye.
12. #18, #20, #21, #23, #24, #25, #26 — the low-severity tail.

Deferred (#15, #17, #19, #22) each need a design decision, not just a patch: a keyboard reorder affordance, whether the slide nav is tabs or a toolbar, how a Pokémon card exposes "open details", and what a screen-reader summary of the speed chart should say.
