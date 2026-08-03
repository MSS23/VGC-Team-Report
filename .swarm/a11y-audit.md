# Accessibility Audit — WCAG 2.1 AA

**Repo:** `/home/user/VGC-Team-Report` · Next.js 16 / React 19 / Tailwind v4
**Date:** 2026-08-02
**Method:** static analysis of `.tsx` source only (no `node_modules`, no live DOM, no axe run). Contrast ratios computed from the hex values resolved out of `src/app/globals.css` and the Tailwind default palette.
**Scope (highest traffic first):** `src/app/page.tsx`, `src/components/report/**`, `src/app/s/**`, `src/app/explore/**` + `src/components/explore/**`, with `src/components/input/PasteInput.tsx` (the landing screen) and `src/components/ui/**` pulled in where the report surfaces mount them.

---

## Executive summary

The codebase is in materially better shape than most React apps of this size. `globals.css` already ships a global `*:focus-visible` ring (L826) **and** a `prefers-reduced-motion` reset (L811); `ShareModal`, `OTSSheetModal`, and the export-theme modal in `page.tsx` all implement real focus traps with Escape + focus restore; `SlideNavControls` has a proper `role="tablist"`, an `aria-live` slide announcer, and 44×44 targets throughout; every `<img>` in scope has an `alt`; every `<input>`/`<select>`/`<textarea>` in scope has a label or `aria-label`.

The failures that remain cluster into four themes:

| Theme | Severity | Reach |
|---|---|---|
| **Light-mode colour contrast** — `-400` Tailwind shades used unpaired | Critical | ~50 call sites, every report slide |
| **Non-interactive elements carrying `onClick`** | Critical | 2 controls are entirely unreachable by keyboard |
| **Heading structure** — no `<h1>` on 90% of report views; `h1 → h3` skips | Serious | Every slide except the overview |
| **JS-driven animation not gated on `useReducedMotion`** | Serious | `/explore` and the landing page |

Nothing here is a blocker for sighted mouse users; almost everything here is a blocker for someone using a keyboard, a screen reader, or light mode with low vision.

---

## Top 12, ranked by user impact

---

### 1. Light-mode contrast failures across the entire report viewer — `text-*-400` used without a `dark:` pair

**WCAG 1.4.3 Contrast (Minimum) — Level AA**
**Severity: Critical · Reach: every report slide, both `/` and `/s/*`**

Light mode is the default (`:root` in `globals.css:13` sets `--background: #FAF9F6`). Tailwind's `-400` shades were clearly picked against a dark canvas and then never paired. The tinted chip backgrounds (`bg-blue-500/20`, `bg-red-500/10`, …) are ~90% transparent over white, so they do not rescue the ratio.

Measured against `#FFFFFF` (`--surface`):

| Class | Hex | Ratio | Needs |
|---|---|---:|---:|
| `text-amber-400` | `#FBBF24` | **1.67:1** | 4.5:1 |
| `text-emerald-400` | `#34D399` | **1.92:1** | 4.5:1 |
| `text-blue-400` | `#60A5FA` | **2.54:1** | 4.5:1 |
| `text-purple-400` | `#C084FC` | **2.64:1** | 4.5:1 |
| `text-red-400` | `#F87171` | **2.77:1** | 4.5:1 |

None of these is "large text" — the call sites are `text-xs`/`text-[10px]` bold, well under the 18.66px-bold threshold.

**Highest-traffic call sites:**

| File:line | Class | Content |
|---|---|---|
| `src/components/report/MatchupPlanSlide.tsx:571,574` | `text-blue-400` | "LEAD" section label + icon |
| `src/components/report/MatchupPlanSlide.tsx:629,632` | `text-amber-400` | "BACK" section label + icon |
| `src/components/report/MatchupPlanSlide.tsx:528,540` | `text-blue-400/70`, `text-amber-400/70` | collapsed L/B markers |
| `src/components/report/CommonModesSlide.tsx:516,519,541,544` | `text-blue-400`, `text-amber-400` | same Lead/Back pattern |
| `src/components/report/DefensiveCoverageChart.tsx:90,97` | `text-red-400`, `text-red-400/70` | "— N weak" weakness chips |
| `src/components/report/DefensiveCoverageChart.tsx:106,113` | `text-emerald-400` | "— N resist" chips |
| `src/components/report/OffensiveCoverageChart.tsx:188,195,204,211` | `text-red-400`, `text-emerald-400` | coverage summary chips |
| `src/components/report/SpeedTierChart.tsx:480,578,585,596,649` | `text-purple-400`, `text-blue-400` | Mega-tier rows + "MEGA" badge |
| `src/components/report/PokemonDetailSlide.tsx:72,73,84,85,96,97` | `text-red-400`, `text-emerald-400`, `text-amber-400` | calc-category icon + bullet colours |
| `src/components/report/PokemonDetailSlide.tsx:811` | `text-purple-400/70` | Tera-type section heading |
| `src/components/report/MatchupSheetRow.tsx:84,96` | `text-blue-400/70`, `text-amber-400/70` | L/B row markers |
| `src/components/report/AddOpponentInput.tsx:125` · `TeamOverview.tsx:200` | `text-red-400` | **error messages** |

**Fix — apply the rule `text-<hue>-700 dark:text-<hue>-400` everywhere.** Verified light-mode ratios on `#FFFFFF`: `blue-700` 7.0:1, `amber-700` 5.0:1, `red-600` 4.8:1, `purple-700` 7.1:1, `emerald-800` 7.7:1 (`emerald-700` is only 4.35:1 — do not use it for `text-xs`).

```jsx
// src/components/report/MatchupPlanSlide.tsx:569-575
<div className="flex-1 bg-surface-alt/50 rounded-xl p-3 sm:p-4 border border-border-subtle">
  <div className="flex items-center gap-2 mb-2.5">
    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /></svg>
    </span>
    <span className="text-xs font-bold uppercase tracking-widest text-blue-700 dark:text-blue-400">{t.lead}</span>
  </div>
```

```jsx
// src/components/report/DefensiveCoverageChart.tsx:88-98
<span
  key={`blind-${type}`}
  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs font-bold text-red-600 dark:text-red-400"
>
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: tc.bg }} />
  {type}
  <span className="text-red-600/80 dark:text-red-400/70">&mdash; {weakCount} weak</span>
</span>
```

```jsx
// src/components/report/PokemonDetailSlide.tsx:72-73 (CATEGORY_CONFIG)
iconColor: "text-red-600 dark:text-red-400",
bulletColor: "text-red-600/80 dark:text-red-400/70",
// …and the emerald (84-85) / amber (96-97) entries likewise:
//   "text-emerald-800 dark:text-emerald-400" / "text-emerald-800/80 dark:text-emerald-400/70"
//   "text-amber-700  dark:text-amber-400"    / "text-amber-700/80  dark:text-amber-400/70"
```

> Regression guard: add an ESLint `no-restricted-syntax` rule (or a vitest source scan) that rejects `text-(red|amber|emerald|blue|purple|…)-(300|400)` in a className that does not also contain `dark:`.

---

### 2. Game-plan delete is a `<span onClick>` nested inside a `<button>`

**WCAG 2.1.1 Keyboard (A) + 4.1.2 Name, Role, Value (A)**
`src/components/report/MatchupPlanSlide.tsx:552-560`
**Severity: Critical**

```jsx
<button type="button" onClick={onToggle} className="w-full flex …">   {/* :500 */}
  …
  {!isReadOnly && canDelete && (
    <span onClick={(e) => { e.stopPropagation(); onDelete(); }} …>    {/* :553 */}
      {t.delete}
    </span>
  )}
</button>                                                              {/* :560 */}
```

Two failures at once. (a) The delete control is a bare `<span>` — no `role`, no `tabIndex`, no key handler — so a keyboard or switch user **can never delete a game plan**. (b) It is interactive content nested inside a `<button>`, which is invalid HTML; the parent's computed accessible name becomes `"Game 1 Delete"`, so a screen reader announces a collapse toggle called "Delete".

**Fix — hoist the delete out of the button and make it a real sibling button.** Wrap both in a flex row so the layout is unchanged.

```jsx
{/* src/components/report/MatchupPlanSlide.tsx — replace lines 500-560 */}
<div className="w-full flex items-center rounded-t-2xl hover:bg-surface-alt/30 transition-colors">
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={!isCollapsed}
    aria-controls={`game-plan-panel-${plan.id}-${index}`}
    className="flex-1 min-w-0 flex items-center justify-between px-4 sm:px-5 py-3.5 text-left"
  >
    <div className="flex items-center gap-3">
      {/* …chevron, badge, "Game N", collapsed sprites — unchanged… */}
    </div>
  </button>

  {!isReadOnly && canDelete && (
    <button
      type="button"
      onClick={onDelete}
      aria-label={`${t.delete} ${t.gameN} ${index + 1}`}
      className="flex-shrink-0 inline-flex items-center justify-center min-w-[44px] min-h-[44px] mr-2 text-text-tertiary hover:text-red-600 dark:hover:text-red-400 text-xs rounded-md hover:bg-red-500/10 transition-colors"
    >
      {t.delete}
    </button>
  )}
</div>
```

Then give the collapsible body the matching id:

```jsx
{!isCollapsed && (
  <div id={`game-plan-panel-${plan.id}-${index}`} className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1">
```

---

### 3. Editing a damage calc is mouse-only — `<span onClick>` with no keyboard path

**WCAG 2.1.1 Keyboard (A)**
`src/components/report/PokemonDetailSlide.tsx:163-173`
**Severity: Critical**

```jsx
<span
  className={`flex-1 … ${!isReadOnly ? "cursor-text" : ""}`}
  onClick={() => { if (!isReadOnly && onEdit) { setEditText(entry.text); setEditing(true); } }}
>
  {entry.text}
</span>
```

Click-to-edit is the *only* way to change a calc's text. There is no `role`, no `tabIndex`, no key handler — keyboard users can change the calc's *category* (the segmented buttons at :189 are correct) and delete it (:216), but cannot edit the text.

**Fix — render it as a real button when editable, and keep it a plain `<span>` when read-only** (so viewers of a shared report don't get a phantom tab stop):

```jsx
) : !isReadOnly && onEdit ? (
  <button
    type="button"
    onClick={() => { setEditText(entry.text); setEditing(true); }}
    aria-label={`${t.edit ?? "Edit"}: ${entry.text}`}
    className="flex-1 min-h-11 text-left text-sm sm:text-base text-text-primary leading-relaxed cursor-text rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
  >
    {entry.text}
  </button>
) : (
  <span className="flex-1 text-sm sm:text-base text-text-primary leading-relaxed">
    {entry.text}
  </span>
)}
```

---

### 4. Mobile tab bar on the Pokémon detail slide has no tab semantics

**WCAG 4.1.2 Name, Role, Value (A) + 1.4.1 Use of Colour (A)**
`src/components/report/PokemonDetailSlide.tsx:926-942`
**Severity: Serious · Reach: every mobile view of every Pokémon slide**

```jsx
<div className="flex gap-1 bg-surface-alt/60 rounded-xl p-1" style={{ touchAction: "pan-x" }}>
  {MOBILE_TABS.map((tab) => (
    <button key={tab} type="button" onClick={() => handleTabChange(tab)}
      className={`… ${mobileTab === tab ? "bg-surface text-accent shadow-sm" : "text-text-tertiary …"}`}>
```

Four generic buttons. The selected tab is signalled **only** by background + text colour, with no `aria-selected`/`aria-pressed` — a screen-reader user has no way to know which panel they are in, and a user who cannot distinguish the accent colour gets no non-colour cue either. `SlideNavControls.tsx:181-207` already implements the correct pattern in this same repo; mirror it.

```jsx
{/* src/components/report/PokemonDetailSlide.tsx:926-942 */}
<div
  role="tablist"
  aria-label="Pokemon detail sections"
  className="flex gap-1 bg-surface-alt/60 rounded-xl p-1"
  style={{ touchAction: "pan-x" }}
>
  {MOBILE_TABS.map((tab) => (
    <button
      key={tab}
      type="button"
      role="tab"
      id={`pkmn-tab-${tab}`}
      aria-selected={mobileTab === tab}
      aria-controls={`pkmn-panel-${tab}`}
      tabIndex={mobileTab === tab ? 0 : -1}
      onClick={() => handleTabChange(tab)}
      className={`flex-1 flex items-center justify-center gap-1.5 min-h-11 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
        mobileTab === tab
          ? "bg-surface text-accent shadow-sm ring-1 ring-accent/40"
          : "text-text-tertiary hover:text-text-secondary"
      }`}
    >
      <span aria-hidden="true">{mobileTabIcons[tab]}</span>
      <span>{mobileTabLabels[tab]}</span>
    </button>
  ))}
</div>

<div
  role="tabpanel"
  id={`pkmn-panel-${mobileTab}`}
  aria-labelledby={`pkmn-tab-${mobileTab}`}
  tabIndex={0}
  className="min-h-[200px]"
>
  {/* …existing conditional panel bodies, unchanged… */}
</div>
```

The added `ring-1 ring-accent/40` supplies the non-colour cue for 1.4.1.

---

### 5. No `<h1>` on any report slide except the overview, and an `h1 → h3` skip on the overview itself

**WCAG 1.3.1 Info and Relationships (A) + 2.4.6 Headings and Labels (AA)**
**Severity: Serious · Reach: every report view**

`TeamReport.tsx` renders exactly one slide at a time (`if (currentSlide === 0) …` at :236, `=== 1` at :280, `>= 2` at :296, …). Only `currentSlide === 0` mounts `TeamOverview`, which is the only component with an `<h1>` (`TeamOverview.tsx:418` sr-only, `:431` visible). Consequence: on a 6-Pokémon report, **10 of 11 slides have no `<h1>` at all** — the document's top-level heading simply disappears. Screen-reader "jump to heading 1" lands nowhere; the highest heading is an `<h2>` (`PokemonDetailSlide.tsx:582`, `SpeedTierChart.tsx:431`, `MatchupSheet.tsx:67`) or, worse, an `<h3>` (`DefensiveCoverageChart.tsx:72`, `OffensiveCoverageChart.tsx:168`).

Separately, on the overview: `TeamOverview` `<h1>` (:418) → `PokemonCard` `<h3>` (:244) with no intervening `<h2>` — a level skip.

**Fix A — put a persistent sr-only `<h1>` on the report shell**, so it survives every slide swap. In `src/app/page.tsx`, inside the slide container that starts at :1128:

```jsx
<div
  ref={swipeRef}
  role="region"
  aria-roledescription="report slide"
  aria-label={`${slideLabels[currentSlide] ?? "Team report"}, slide ${currentSlide + 1} of ${totalSlides}`}
  aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown Home End"
  className={/* …unchanged… */}
  key={tournamentMode ? "tournament" : physicalSlide}
  style={tournamentMode ? undefined : { viewTransitionName: "slide" }}
>
  <h1 className="sr-only">
    {teamName || tournamentName || teamSpecies.join(" / ") || "VGC Team Report"}
    {" — "}
    {slideLabels[currentSlide] ?? `Slide ${currentSlide + 1}`}
  </h1>
  {/* …existing slide content… */}
```

Then demote `TeamOverview.tsx:418` from `<h1 className="sr-only">` to `<h2 className="sr-only">` and `:431` from `<h1>` to `<h2>` so there is exactly one `<h1>` per view.

**Fix B — close the overview's level skip.** `PokemonCard.tsx:244`:

```jsx
{/* src/components/report/PokemonCard.tsx:244 — h3 → h2 (now that the page h1 lives on the shell) */}
<h2 className="text-sm sm:text-lg font-extrabold text-text-primary creator:text-xl truncate leading-tight tracking-tight">
  {displaySpecies}
</h2>
```

…and bump its children at `:391` and `:428` from `<h4>` to `<h3>`.

**Fix C — the slide-top headings on the coverage charts should be `<h2>`, not `<h3>`:** `DefensiveCoverageChart.tsx:72` and `OffensiveCoverageChart.tsx:168`.

---

### 6. `InlinePokemonEditor` dialog has no `aria-modal`, no focus trap, and no focus restore

**WCAG 2.4.3 Focus Order (A) + 4.1.2 Name, Role, Value (A)**
`src/components/report/InlinePokemonEditor.tsx:129-134`
**Severity: Serious**

```jsx
<div
  className="fixed inset-0 z-[100] flex items-start … bg-black/50 backdrop-blur-sm …"
  onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  role="dialog"
  aria-label="Replace Pokemon"
>
```

Escape *is* handled (:104) and the input *is* autofocused (:94) — but there is no `aria-modal="true"`, so a screen reader's virtual cursor walks straight into the report behind the overlay; Tab escapes the dialog into the page underneath; and on close, focus is dropped to `<body>` instead of returning to the pencil button that opened it (`PokemonCard.tsx:308`). Compare `ShareModal.tsx:154-199`, which does all three correctly — reuse that shape.

```jsx
{/* src/components/report/InlinePokemonEditor.tsx */}
const dialogRef = useRef<HTMLDivElement>(null);

// Focus trap + focus restore (Escape is already handled at :104)
useEffect(() => {
  if (!mounted) return;
  const dialog = dialogRef.current;
  if (!dialog) return;
  const previouslyFocused = document.activeElement as HTMLElement | null;
  const SEL = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const items = Array.from(dialog.querySelectorAll<HTMLElement>(SEL));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  dialog.addEventListener("keydown", onKeyDown);
  return () => {
    dialog.removeEventListener("keydown", onKeyDown);
    previouslyFocused?.focus();
  };
}, [mounted]);
```

```jsx
return createPortal(
  <div
    className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center bg-black/50 backdrop-blur-sm pt-16 sm:pt-0"
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inline-pokemon-editor-title"
      className="bg-surface border border-border rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-fade-in"
    >
      {/* …and give the existing h3 at :138 the matching id… */}
      <h3 id="inline-pokemon-editor-title" className="text-base font-extrabold text-text-primary tracking-tight">
        Replace Pokemon
      </h3>
```

Note the `role="dialog"` moves off the backdrop and onto the panel — a `role="dialog"` that covers the whole viewport (including the backdrop) also mis-reports the dialog's bounds.

---

### 7. `/explore` cards nest `<button>`s inside an `<a>`

**WCAG 4.1.2 Name, Role, Value (A)**
`src/components/explore/ReportCard.tsx:152` (the `<motion.a>`) wrapping `:305`, `:320`, `:337`, `:350` (like / save buttons)
**Severity: Serious · Reach: the busiest list page**

`<a href={`/s/${report.id}`}>` at :152 contains four `<button>` elements and three nested `<a href="/creator/…">` links (`:222`, `:246`, `:270`). Interactive content inside an anchor is invalid; nested anchors in particular are re-parented by the HTML parser, so the creator links can end up as siblings of the card rather than children — the DOM the browser builds is not the DOM React wrote. Screen readers announce a single enormous link whose name concatenates six sprite `alt`s, the title, the creator, and the counts.

**Fix — invert the nesting: make the card a plain container and overlay a single stretched link.** The buttons then sit above it on the z-axis and stay real siblings.

```jsx
{/* src/components/explore/ReportCard.tsx:152 */}
<motion.div
  className="relative bg-surface rounded-xl border border-border shadow-sm hover:shadow-md hover:border-accent/30 overflow-hidden group card-hover focus-within:ring-2 focus-within:ring-accent/50"
  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
>
  {/* …sprites, badges, meta — unchanged… */}

  {/* The card title carries the one link; ::after stretches it over the card. */}
  <h3 className="text-xs sm:text-sm font-bold text-text-primary leading-tight group-hover:text-accent transition-colors line-clamp-2 sm:line-clamp-1">
    <a
      href={`/s/${report.id}`}
      className="after:absolute after:inset-0 after:content-[''] focus:outline-none"
    >
      {report.tournamentName || report.species.join(" / ")}
    </a>
  </h3>

  {/* …like / save / creator links need to sit above the stretched hit area… */}
  <div className="relative z-10 flex items-center gap-2.5">
    {/* existing like + bookmark buttons, unchanged */}
  </div>
</motion.div>
```

Also mark the six sprites decorative so the link name is the title alone, not a species list — `CardSprite` at `:47-60`:

```jsx
<img
  src={urls[Math.min(idx, urls.length - 1)]}
  alt=""
  aria-hidden="true"
  width={48}
  height={48}
  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
  loading="lazy"
  onError={() => setIdx((i) => Math.min(i + 1, urls.length - 1))}
/>
```

(The species are already in the `<h3>` text when there is no tournament name; when there is one, add a visually-hidden species list so the information is not lost.)

---

### 8. Framer-Motion entrance animations bypass `prefers-reduced-motion`

**WCAG 2.3.3 Animation from Interactions (AAA) — and a hard requirement of the project's own UI standard**
**Severity: Serious · Reach: `/explore` and the landing page**

`globals.css:811-818` neutralises CSS animations and transitions — but Motion writes `transform`/`opacity` as **inline styles via rAF**, which that media query cannot touch. Every staggered card slide-in still plays at full amplitude for a user who has asked the OS for reduced motion.

| File:line | Animation |
|---|---|
| `src/components/explore/ExploreContent.tsx:262-270` | `staggerChildren: 0.05` over the whole card grid |
| `src/components/explore/ReportCard.tsx:152-158` | `y: 12 → 0` per card (× up to 24 cards) |
| `src/components/explore/SpotlightCard.tsx:36-41` | `y: 16 → 0` |
| `src/components/explore/SpotlightCard.tsx:98-104` | per-sprite `y: 10 → 0`, delay `0.1 + i * 0.07` |
| `src/components/explore/ExploreEmpty.tsx:28-32` | `y: 12 → 0` |
| `src/components/input/PasteInput.tsx:253-261, 269-273, 289-294, 377-381, 549-553, 567-571, 613-617, 641-645` | 8 staggered blocks on the landing screen |

`ExploreFilters.tsx:130` already does this correctly (`const shouldReduceMotion = useReducedMotion()` → `:386-389`). The cheapest global fix is to wrap the tree in Motion's `MotionConfig`, which turns every transform/layout animation into an instant state change:

```jsx
{/* src/components/explore/ExploreContent.tsx — near the top of the component tree */}
import { MotionConfig } from "motion/react";

return (
  <MotionConfig reducedMotion="user">
    {/* …existing ExploreContent tree… */}
  </MotionConfig>
);
```

Do the same in `PasteInput.tsx`. `reducedMotion="user"` makes Motion honour the OS setting for every descendant, so no per-component `useReducedMotion()` plumbing is needed.

---

### 9. Landing-page textarea: unreadable placeholder + a focus indicator that fails 3:1

**WCAG 1.4.3 Contrast (AA), 2.4.7 Focus Visible (AA), 1.4.11 Non-text Contrast (AA)**
`src/components/input/PasteInput.tsx:417`
**Severity: Serious · Reach: the first thing every new user sees**

```jsx
className="relative w-full h-40 sm:h-56 p-4 sm:p-5 bg-surface border-2 border-border rounded-xl text-sm font-[family-name:var(--font-mono)] text-text-primary placeholder:text-text-tertiary/40 resize-none focus:outline-none focus:border-accent/50 transition-all duration-300"
```

Two problems in one class string:

- `placeholder:text-text-tertiary/40` — `--text-tertiary` is `#5E5E7A`; at 40% over `--surface` `#FFFFFF` it resolves to ≈`#CFCFD6`, **≈1.8:1**. The placeholder is not decorative: it is the worked example of Showdown paste format, i.e. the only in-product documentation of what to paste.
- `focus:outline-none` + `focus:border-accent/50` — Tailwind v4 emits utilities in `@layer utilities`, which outranks the `@layer base` `*:focus-visible` ring in `globals.css:826`. So the global ring is *cancelled here*, and the replacement is a 2px border at 50% accent (`#E11D48` @ 50% on white ≈ `#F08EA4`, **≈2.4:1** against the adjacent white) — under the 3:1 that 1.4.11 requires of a focus indicator.

```jsx
{/* src/components/input/PasteInput.tsx:417 */}
className="relative w-full h-40 sm:h-56 p-4 sm:p-5 bg-surface border-2 border-border rounded-xl text-sm font-[family-name:var(--font-mono)] text-text-primary placeholder:text-text-tertiary resize-none transition-all duration-300 focus:outline-none focus:border-accent focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
```

`text-text-tertiary` at full strength is `#5E5E7A` on `#FFFFFF` = **7.3:1**, comfortably clear.

---

### 10. Walkthrough overlay: a full-screen `role="button"` is the first tab stop; the tooltip never receives focus

**WCAG 2.4.3 Focus Order (A) + 4.1.2 (A)**
`src/components/ui/WalkthroughOverlay.tsx:225-237` (backdrop) and `:257-262` (tooltip)
**Severity: Serious**

```jsx
<div role="button" tabIndex={0} aria-label="Close walkthrough"
     style={{ position: "fixed", inset: 0, zIndex: 9998 }}
     onClick={onSkip} onKeyDown={…} />
```

A viewport-filling `role="button"` inserted at `tabIndex={0}` becomes a tab stop that a screen reader also reports as a giant button covering the screen. Meanwhile the actual tooltip (`role="dialog"` at :259) has no `aria-modal`, is never focused on mount, and does not trap Tab — so a keyboard user who starts the tour tabs through the *page behind the tour* while the spotlight sits on an unrelated element.

```jsx
{/* Backdrop — presentational only; Escape (already wired at :68) is the keyboard path. */}
<div
  aria-hidden="true"
  style={{ position: "fixed", inset: 0, zIndex: 9998 }}
  onClick={onSkip}
/>
```

```jsx
{/* Tooltip — real modal semantics + focus on mount */}
<div
  ref={tooltipRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="walkthrough-title"
  tabIndex={-1}
  style={{ /* …unchanged… */ }}
  className="bg-surface rounded-2xl border border-border shadow-xl"
  onClick={(e) => e.stopPropagation()}
>
```

```jsx
// Move focus into the tooltip whenever the step changes.
useEffect(() => {
  tooltipRef.current?.focus();
}, [stepIndex]);
```

Give the step's heading `id="walkthrough-title"` so `aria-labelledby` resolves, and restore focus to the element that started the tour on unmount.

---

### 11. Active filter pills on `/explore` announce as the filter value, not as a remove action

**WCAG 2.4.6 Headings and Labels (AA) + 4.1.2 Name, Role, Value (A)**
`src/components/explore/ExploreFilters.tsx:352-365`
**Severity: Moderate**

```jsx
{pills.map((pill, i) => (
  <button key={`${pill.label}-${i}`} type="button" onClick={pill.onClear} className="…">
    {pill.label}
    <CloseIcon width="8" height="8" strokeWidth="3" />
  </button>
))}
```

The accessible name is just `"Rain"` (plus a decorative `×` that has no `aria-hidden`, so on some engines it contributes nothing and on others adds noise). A screen-reader user hears "Rain, button" and has no way to know that pressing it *removes* the Rain filter. The chip input in this very file gets it right at `:644` (`aria-label={`Remove ${chip}`}`).

```jsx
{pills.map((pill, i) => (
  <button
    key={`${pill.label}-${i}`}
    type="button"
    onClick={pill.onClear}
    aria-label={`Remove filter: ${pill.label}`}
    className={`inline-flex min-h-11 items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg flex-shrink-0 transition-all active:scale-[0.95] cursor-pointer ${
      pill.color === "red" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-accent/10 text-accent"
    }`}
  >
    <span aria-hidden="true">{pill.label}</span>
    <CloseIcon width="8" height="8" strokeWidth="3" aria-hidden="true" />
  </button>
))}
```

(The `text-red-500` → `text-red-600 dark:text-red-400` swap also clears finding #1 at `ExploreFilters.tsx:569`.)

---

### 12. Overview grid: `role="button"` wraps a card full of controls, and drag-reorder has no keyboard equivalent

**WCAG 4.1.2 Name, Role, Value (A) + 2.1.1 Keyboard (A)**
`src/components/report/TeamOverview.tsx:86-124` (`LongPressWrapper`) and `:781-776` (drag handlers)
**Severity: Moderate**

`LongPressWrapper` is otherwise exemplary — it has `role="button"`, `tabIndex={0}`, `aria-label`, and an Enter/Space handler that correctly checks `e.target !== e.currentTarget`. The problem is what it wraps: a full `PokemonCard` containing an `<h3>`, an editable role `<input>` (`PokemonCard.tsx:371`), the Mega toggle, the MVP star, the replace pencil, and an external calculator link. Interactive and heading content inside a `role="button"` is not reliably exposed — several screen readers flatten a `button` subtree to its accessible name, hiding the nested controls from browse mode entirely.

Second: reordering the team on this grid is drag-and-drop only (`:781-776`, `draggable={canDrag}`). The Move Up / Move Down buttons in `SlideNavControls` (`page.tsx:1487-1490`) reorder the *current slide*, which is not reachable from the overview grid — so there is no keyboard route to reorder from here.

**Fix A — drop `role="button"` from the wrapper and put the navigation affordance on a real, small control inside the card**, leaving the wrapper as a plain drag container:

```jsx
{/* src/components/report/TeamOverview.tsx:86-94 — wrapper becomes non-interactive */}
<div
  data-slide-navigation-ignore={onTap ? "true" : undefined}
  className={`${className ?? ""} ${pressed ? "scale-[0.97] opacity-80" : ""} transition-transform duration-100`}
  draggable={draggable}
  /* …drag + touch handlers unchanged; keep the onClick fallback for pointer users… */
>
  {children}
</div>
```

…and inside `PokemonCard`, next to the existing icon buttons, add the keyboard-reachable entry point:

```jsx
{onOpenDetail && (
  <button
    type="button"
    onClick={onOpenDetail}
    aria-label={`Open ${displaySpecies} details`}
    className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-text-tertiary hover:text-accent hover:bg-accent-surface/40 transition-all"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  </button>
)}
```

**Fix B — add keyboard reorder to the grid.** With the wrapper no longer a button, bind Alt+Arrow on the card container:

```jsx
onKeyDown={(e) => {
  if (!onReorderPokemon || !e.altKey) return;
  if (e.key === "ArrowLeft"  && i > 0)                        { e.preventDefault(); onReorderPokemon(i, i - 1); }
  if (e.key === "ArrowRight" && i < analysis.pokemon.length-1) { e.preventDefault(); onReorderPokemon(i, i + 1); }
}}
```

…and surface the shortcut in the existing `aria-keyshortcuts` contract plus the shortcut-hint overlay.

---

## Secondary findings (below the top 12)

| # | File:line | Criterion | Issue |
|---|---|---|---|
| 13 | `src/components/report/SlideNavControls.tsx:433-437` | 4.1.2 (A) | Overflow sheet is `role="dialog"` without `aria-modal`; focus is never moved into it. Escape *is* handled (:167). The backdrop at :428 has `aria-hidden` + `onClick` and no keyboard path — acceptable only because Escape works. |
| 14 | `src/app/page.tsx:1128-1141` | 2.4.3 (A) | `key={tournamentMode ? "tournament" : physicalSlide}` force-remounts the slide subtree on every navigation. If focus was inside the old slide it lands on `<body>`, so the next Tab restarts from the top of the document. Move focus to the new slide container (`tabIndex={-1}` + `.focus()`) after each change. |
| 15 | `src/components/social/VersionHistoryPanel.tsx:167` | 4.1.2 (A) | `role="dialog"` with no `aria-modal` and no focus management. |
| 16 | `src/components/ui/NotificationBell.tsx:126,129` | 2.4.7 (AA) | `role="dialog"` popover carries `focus:outline-none` with **no** replacement ring — the only such case in the codebase where the global ring is cancelled outright. |
| 17 | `src/components/report/TournamentMode.tsx:52,112,159` · `PokemonCard.tsx:322,463` · `DefensiveCoverageChart.tsx:196` | 1.4.3 (AA) | `text-text-tertiary/25` … `/50`. At 25–50% over `--surface` these land between 1.4:1 and 2.6:1. `/60` and above is fine; anything at or below `/50` that carries meaning (EV totals, arrows between stat values) needs full-strength `text-text-tertiary`. |
| 18 | `src/components/report/ItemIcon.tsx:34-38` | 1.1.1 (A) | `alt={item}` **and** `title={item}` on the same `<img>` — several screen readers announce both, producing "Sitrus Berry Sitrus Berry". Drop the `title`, or set `alt=""` and keep the item name in adjacent text. |
| 19 | `src/components/report/SlideNavControls.tsx:181-207` | 4.1.2 (A) | `role="tab"` buttons have `aria-selected` but no `aria-controls`, and there is no `role="tabpanel"` on the slide container. Add `aria-controls` pointing at the slide region in `page.tsx:1128`. |
| 20 | `src/components/explore/ExploreEmpty.tsx:42` | 1.3.1 (A) | `<h3>` used as the empty-state heading with no `<h2>` above it (page `<h1>` is `ExploreHero.tsx:10`). Should be `<h2>`. |
| 21 | `src/components/explore/SpotlightCard.tsx:118,190` | 1.3.1 (A) | The card's `<h3>` (:118) appears *before* the section's `<h2>` (:190) in DOM order, inverting the outline. |
| 22 | `src/components/explore/ExploreFilters.tsx:675` | 2.4.7 (AA) | `focus:outline-none` with no ring on the chip input — mitigated (not fixed) by `focus-within:ring-2` on the wrapper at :637. Acceptable, but the ring appears on the group rather than the focused control. |
| 23 | `src/app/page.tsx:1642-1648` | 4.1.2 (A) | The export-theme backdrop takes `onClick` + `onKeyDown` on a bare `<div>` with an eslint-disable. The inner dialog is exemplary (`:1649-1656`, plus a full trap at `:396-437`); the backdrop should simply be `aria-hidden="true"` with the click handler and no key handler, matching the fix in #10. |

---

## What is already correct (do not regress)

- **Global focus ring** — `globals.css:826` `*:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`, with `:focus:not(:focus-visible)` suppression at :833. Accent is `#E11D48` light / `#FB7185` dark, both ≥3:1 against their canvases.
- **Global reduced-motion reset** — `globals.css:811-818` covers every CSS animation/transition. (Only Motion's JS-driven animations escape it — finding #8.)
- **Semantic colour tokens all pass.** `--text-tertiary` `#5E5E7A` on `#FAF9F6` = **7.3:1**; dark `#9898B8` on `#0B0B1A` = **8.0:1**. The contrast failures are exclusively in hardcoded Tailwind palette shades, never in the design tokens.
- **Every `<img>` in scope has an `alt`.** `PokemonSprite.tsx:64` (`alt={species}`), `ItemIcon.tsx:36`, `ReportCard.tsx:53`, `TeamOverview.tsx:471`, `OTSSheetModal.tsx:30,233`, `TeamCardExport.tsx:152,294`, `PasteInput.tsx:109`, `Navbar.tsx:725`. Sprites are *not* invisible to screen readers.
- **Every form control in scope is labelled** — either `htmlFor`/`id` (`ExploreFilters.tsx:627`) or `aria-label` (`ExploreFilters.tsx:214,243,670`; `PasteInput.tsx:414`; `TeamOverview.tsx:537-583`; `CalcInput.tsx:215`).
- **Three modals implement the full pattern** — `ShareModal.tsx:154-199`, `OTSSheetModal.tsx`, and `page.tsx:396-437`: `aria-modal`, `aria-labelledby`, Escape, Tab cycling, and focus restore to the opener.
- **44×44 touch targets are pervasive** — `min-w-[44px] min-h-[44px]` / `min-h-11` appears on essentially every icon button (`PokemonCard.tsx:278,304,318`; `ReportCard.tsx:305,320`; `SlideNavControls.tsx:220,247,283`; `page.tsx:1010,1117,1452`).
- **Screen-reader status plumbing exists** — slide announcer at `SlideNavControls.tsx:546`, copy confirmations at `ShareModal.tsx:334`, save status at `Navbar.tsx:396,401`, comparison status at `page.tsx:1089`.
- **`ExploreFilters.tsx:130,386-389`** is the in-repo reference implementation for `useReducedMotion` — findings #8 should be brought up to it.
- **`SlideNavControls.tsx:181-207`** is the in-repo reference implementation for tab semantics — finding #4 should be brought up to it.

---

## Suggested remediation order

1. **#1 (contrast)** — mechanical, ~50 one-line edits, largest reach. Land the ESLint guard in the same commit.
2. **#2, #3** — two controls currently unreachable by keyboard. Small, self-contained diffs.
3. **#5 (headings)** — one `<h1>` on the shell plus three demotions.
4. **#4, #6, #7** — semantics and modal behaviour.
5. **#8 (`MotionConfig`)** — two-line change per tree.
6. **#9–#12**, then the secondary table.

Findings #2, #3, #4, #6, #9, #11 are each small enough to carry a vitest regression test that names the bug, per the project's `src/lib/` testing convention extended to components.
