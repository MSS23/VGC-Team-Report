# R8 — Accessibility Audit (WCAG 2.1 AA) — 2026-11-02

**Method:** static source analysis only. Container egress is blocked (403 CONNECT on every external host, including production), so there was no live page, no browser and no axe run. Every ratio below was computed from resolved token values with the WCAG relative-luminance formula; Tailwind v4.2.1 palette colours were converted from the `oklch()` definitions in `node_modules/tailwindcss/theme.css`.

**Scripts (reproducible):**
- `/tmp/claude-0/-home-user-VGC-Team-Report/3a1c285d-2112-5da3-b291-c756b4fd0de8/scratchpad/contrast.js` — ratio + alpha compositing
- `/tmp/claude-0/-home-user-VGC-Team-Report/3a1c285d-2112-5da3-b291-c756b4fd0de8/scratchpad/oklch.js` — oklch → sRGB
- `run.js` / `run2.js` / `run3.js` / `run4.js` / `run5.js` — the ratio tables below
- `scan3.js`, `forms2.js`, `iconbtn.js`, `img.js`, `touch.js`, `touch2.js` — the instance counts below

**Scope:** public marketing/content pages (`/`, `/faq`, `/champions`, `/champions/[pokemon]`, `/tools/ev-to-sp`, `/privacy`, `/terms`, `/support`, `/changelog`, `/explore`) and the report viewer (`src/components/report/*`, `src/app/s/[id]`, host `src/components/home/HomePageClient.tsx`), plus the shared chrome and tokens they all depend on.

---

## Resolved token reference

**Light** — `:root`, `src/app/globals.css:6–47`
`--background #FAF9F6` · `--surface #FFFFFF` · `--surface-alt #F2F0EB` · `--border #E0DDD5` · `--border-subtle #F0EDE6` · `--text-primary #1A1A2E` · `--text-secondary #4A4A68` · `--text-tertiary #5E5E7A` · `--accent #E11D48` · `--accent-surface #FFF1F2` · `--success #16A34A` · `--warning #D97706` · `--danger #DC2626`

**Dark** — `[data-dark-mode]`, `src/app/globals.css:263–299`
`--background #0B0B1A` · `--surface #141428` · `--surface-alt #1C1C38` · `--border #2A2A52` · `--border-subtle #222244` · `--text-primary #F0EDE6` · `--text-secondary #C0C0D8` · `--text-tertiary #9898B8` · `--accent #FB7185` · `--accent-surface #3B1525` · `--success #4ADE80` · `--warning #FBBF24` · `--danger #F87171`

**`--accent` is never actually the CSS value at runtime.** Two code paths write it as an *inline* style on `<html>`, which outranks every selector:
- `src/app/layout.tsx:97` — blocking bootstrap script, picks `p.ad` (dark) or `p.a` (light) from the nine gen presets
- `src/hooks/useTheme.ts:153–157` (`applyTheme`) — same, re-fires on every `data-dark-mode` mutation via the observer at `useTheme.ts:188–190`
- `src/lib/utils/random-accent.ts:84–101` — a third source: eight `--random-accent-*` palettes mapped by `globals.css:309–320`

So the effective accent is one of **9 gen presets × 2 modes + 8 random palettes × 2 modes = 34 distinct accent values**, and each needs its own ratio.

**Core text tokens are healthy in both modes** (`run.js`):

| token | light: bg / surface / alt | dark: bg / surface / alt |
|---|---|---|
| text-primary | 16.20 / 17.06 / 14.98 | 16.68 / 15.48 / 14.11 |
| text-secondary | 8.07 / 8.50 / 7.46 | 10.93 / 10.14 / 9.25 |
| text-tertiary | 5.94 / 6.25 / 5.49 | 6.98 / 6.48 / 5.91 |

Every failure in this report is in **accent**, **semantic status**, **hardcoded Tailwind palette** or **focus-indicator** colours.

---

## VGC-315 verdict (computed ratios + instance count)

### Verdict: **TRUE** — and worse than the ticket states.

**WCAG 1.4.3 Contrast (Minimum), AA.**

The ticket's ratio range is correct; its instance count is low, and it misses that light mode fails too.

**Dark mode — `#FFFFFF` on the effective `--accent` (`run.js`):**

| theme | `accentDark` (useTheme.ts) | white-on-accent |
|---|---|---|
| gen3 Ruby/Sapphire | `#86efac` | **1.40 : 1** |
| gen2 Gold/Silver | `#fcd34d` | **1.44 : 1** |
| gen8 Sword/Shield | `#67e8f9` | **1.45 : 1** |
| gen5 Black/White | `#7dd3fc` | **1.67 : 1** |
| gen7 Sun/Moon | `#fdba74` | **1.69 : 1** |
| gen4 Diamond/Pearl | `#93c5fd` | **1.80 : 1** |
| gen1 Red/Blue | `#c4b5fd` | **1.85 : 1** |
| gen9 Scarlet/Violet (default) | `#fda4af` | **1.89 : 1** |
| gen6 X/Y | `#fca5a5` | **1.90 : 1** |

**Plus the eight random-accent dark palettes the ticket does not cover** (`src/lib/utils/random-accent.ts:3–10`): amber `#FBBF24` **1.67**, cyan `#22D3EE` **1.81**, emerald `#34D399` **1.92**, orange `#FB923C` **2.26**, blue `#60A5FA` **2.54**, pink `#F472B6` **2.65**, rose `#FB7185` **2.69**, violet `#A78BFA` **2.72**.

**And the stylesheet's own dark fallback** `--accent: #FB7185` (`globals.css:283`) is **2.69 : 1**.

So the real dark-mode range is **1.40 – 2.72 : 1** across all 17 possible dark accents. Worst case `bg-accent text-white` in dark mode is **white text on a pastel mint green at 1.40 : 1** — effectively invisible.

**Light mode fails as well, for 7 of the 9 gen themes** (the ticket does not mention this):
gen5 **2.77**, gen2 **3.19**, gen3 **3.30**, gen7 **3.56**, gen4 **3.68**, gen8 **3.68**, gen1 **4.23**. Only gen6 (**4.83**) and gen9 (**4.70**) clear 4.5:1. Random palettes: amber **3.19**, orange **3.56**, cyan **3.68**, emerald **3.77** also fail; rose 4.70, pink 4.60, blue 5.17, violet 5.70 pass.

There is **no mitigation anywhere**: no `dark:text-*` override on any of these buttons, no `--accent-foreground` token, and nothing in `globals.css` that changes the foreground when the accent changes.

### Real instance count: **73**, not 67 (41 files)

`grep -rn --include=*.tsx --include=*.ts --exclude-dir=__tests__ -E '(^|[" `])bg-accent([" `]|$)' src | grep text-white` → **73 lines across 41 files**. (Total opaque `bg-accent` class-token lines: **90**. The ticket's "67" matches a count of *literals containing `bg-accent`* when a naive string scanner mis-pairs quotes — it is an undercount of the pairs.)

Highest-density files:

| n | file |
|---|---|
| 7 | `src/components/home/HomePageClient.tsx` (`:1050`, `:1458`, `:1466`, `:1767`, …) — **CONFLICT-RISK** |
| 6 | `src/app/dashboard/DashboardContent.tsx` (`:126`, `:270`, `:285`, `:293`, `:302`, `:1123`) — **CONFLICT-RISK** |
| 4 | `src/components/explore/ExploreFilters.tsx` (`:272`, `:345`, `:454`, `:509`) |
| 4 | `src/app/changelog/ChangelogContent.tsx` (`:219`, `:280`, `:307`, `:383`) |
| 3 | `src/components/layout/Navbar.tsx` (`:580`, `:603`, `:656`) — **CONFLICT-RISK** |
| 3 | `src/components/input/PasteInput.tsx` (`:392`, `:435`) — **CONFLICT-RISK** |
| 2 each | `ShareModal.tsx` (`:484`, `:700`) **CR**, `TeamOverview.tsx` (`:207`, `:645`), `SpeedTierChart.tsx` (`:142`, `:516`) **CR**, `SlideNavControls.tsx` (`:202`, `:311`), `CalcInput.tsx` (`:301`, `:377`), `MatchTracker.tsx` (`:220`, `:351`), `FeedbackContent.tsx` (`:139`, `:166`), `dashboard/profile/page.tsx` (`:229`, `:496`), `dashboard/privacy/page.tsx` (`:85`, `:111`), `MegaLandingContent.tsx` (`:258`), `ChampionsContent.tsx` (`:142`, `:533`) |
| 1 each | `WhatsNewModal.tsx:197` **CR**, `WalkthroughOverlay.tsx:343`, `ShareViewCTA.tsx:29` **CR**, `ServiceWorkerRegistration.tsx:117`, `OTSSheetModal.tsx:437` **CR**, `InstallPrompt.tsx:179` **CR**, `EditFab.tsx:21`, `Button.tsx:16`, `CreatorProfile.tsx:90` **CR**, `CommentSection.tsx:241`, `CollaboratorPanel.tsx:266`, `TeamCardCTA.tsx:67`, `PageNavbar.tsx:150`, `SpotlightCard.tsx:45`, `ExploreEmpty.tsx:88`, `ExploreContent.tsx:237`, `CompareContent.tsx:446` **CR**, `TournamentsContent.tsx:301`, `tools/ev-to-sp/page.tsx:350`, `support/page.tsx:77`, `NotificationsContent.tsx:298`, `not-found.tsx:35`, `faq/page.tsx:192`, `error.tsx:45` |

Add **one more** in the chrome: `src/app/layout.tsx:100` — the skip link is `focus:bg-accent focus:text-white`, so the very first keyboard stop on every page is also 1.40–1.90 : 1 in dark mode.

A further 17 `bg-accent` sites are decorative (progress bars, dots, toggle knobs — `ThemePicker.tsx:74,90`, `Toggle.tsx:16`, `ShareModal.tsx:608,880`, `SlideNavControls.tsx:461,520`, `NotificationBell.tsx:174`, `MetaSnapshot.tsx:70`, `PageNavbar.tsx:202`, `VersionHistoryPanel.tsx:261`, `WalkthroughOverlay.tsx:310`, `FeedbackContent.tsx:341`, `NotificationsContent.tsx:110`, `EvToSpConverter.tsx:242`, `DashboardContent.tsx:950`, `dashboard/profile/page.tsx:442`). They carry no text so 1.4.3 does not apply, but they are UI components under **1.4.11 (3:1)** — the pastel dark accents against `--surface #141428` sit at 9.5–12.9:1, so those are fine.

---

## VGC-316 verdict (variant declared? `dark:` usage count?)

### Verdict: **TRUE.** The variant is **not declared**. `dark:` utilities are **live but wired to the wrong signal**.

**Is `@custom-variant dark` declared? No.**

`src/app/globals.css` declares exactly two custom variants, at lines 3–4:
```css
@custom-variant creator (&:where([data-creator-mode] *));
@custom-variant presenting (&:where([data-presentation-mode] *));
```
`grep -rn "@custom-variant\|@variant\|darkMode" src` returns **only those two lines**. There is no `tailwind.config.js`/`.ts` anywhere (`ls tailwind.config*` → nothing); `postcss.config.mjs` loads `@tailwindcss/postcss` with no options. Tailwind is **4.2.1** (`node_modules/tailwindcss/package.json`).

**Consequence — important nuance the ticket gets right in substance:** the utilities are not *dead*. Tailwind v4 ships a built-in `dark` variant that falls back to `@media (prefers-color-scheme: dark)`. So every `dark:` utility compiles and fires — **off the operating system's colour-scheme preference, not off the app's dark mode.**

**How the app actually toggles dark mode:** a `data-dark-mode` **attribute on `<html>`**.
- `src/hooks/useDarkMode.ts:37–43` — `applyDarkMode()` does `setAttribute("data-dark-mode","")` / `removeAttribute(...)`
- `src/hooks/useDarkMode.ts:12–23` — the stored preference in `localStorage["vgc-dark-mode"]` wins; OS preference is only the first-run default
- `src/app/layout.tsx:97` — the blocking bootstrap sets the same attribute
- `src/app/globals.css:263` — all dark tokens hang off `[data-dark-mode]`

Because the stored preference overrides the OS, **`data-dark-mode` and `prefers-color-scheme` desync the moment a user touches the theme toggle** — which is the whole point of having one.

### Real `dark:` usage count: **142**, not 132

`grep -rhoE 'dark:[-a-zA-Z0-9_./]+' src --include=*.tsx --include=*.ts --include=*.css | wc -l` → **142**, in **28 files**, **0 of them tests**, **0 in CSS**. 141 are colour/ring/bg/border/opacity overrides; 1 is `dark:opacity-[0.22]` (`ChangelogContent.tsx:114`).

Top files: `MatchTracker.tsx` 17, `DashboardContent.tsx` 14, `ChangelogContent.tsx` 10, `ShareModal.tsx` 8, `HomePageClient.tsx` 8, `TeamOverview.tsx` 7, `OffensiveCoverageChart.tsx` 7, `DefensiveCoverageChart.tsx` 6, `CommonModesSlide.tsx` 6, `ReportCard.tsx` 6, `StatsPanel.tsx` 5.

### The desync, quantified (`run2.js`)

122 of the 142 are `text-<palette>-<n> dark:text-<palette>-<m>` pairs. Both halves of the desync produce real AA failures:

**Case A — app dark mode ON, OS light (user toggled dark; the common case).** `dark:` does **not** apply, so the *light* base colour renders on `--surface #141428`:

| base | hex | on #0B0B1A | on #141428 | on #1C1C38 | n |
|---|---|---|---|---|---|
| `text-blue-800` | `#193CB8` | 2.21 | 2.05 | **1.87** | 1 |
| `text-red-800` | `#9F0712` | 2.33 | 2.17 | **1.97** | 2 |
| `text-slate-600` | `#45556C` | 2.57 | 2.39 | **2.18** | 1 |
| `text-amber-800` | `#973C00` | 2.75 | 2.55 | **2.33** | 2 |
| `text-blue-700` | `#1447E6` | 2.85 | 2.65 | **2.42** | 1 |
| `text-red-700` | `#C10007` | 3.04 | 2.82 | **2.57** | 4 |
| `text-sky-700` | `#0069A8` | 3.33 | 3.09 | **2.82** | 1 |
| `text-purple-600` | `#9810FA` | 3.52 | 3.27 | **2.98** | 4 |
| `text-emerald-700` | `#007A55` | 3.64 | 3.37 | **3.08** | 5 |
| `text-blue-600` | `#155DFC` | 3.72 | 3.45 | **3.15** | 6 |
| `text-amber-700` | `#BB4D00` | 3.88 | 3.60 | **3.28** | 4 |
| `text-red-600` | `#E7000B` | 4.09 | 3.79 | **3.46** | 6 |
| `text-rose-600` | `#EC003F` | 4.31 | 4.00 | **3.64** | 3 |

**40 of 122 instances fail AA on `--surface`; worst 1.87 : 1.** (The other 82 happen to survive because their light base is bright enough.)

**Case B — app LIGHT mode, OS dark.** `dark:` **does** apply, so the pale dark-mode colour renders on `--background #FAF9F6`:

| override | hex | on #FAF9F6 | on #FFFFFF | n |
|---|---|---|---|---|
| `dark:text-blue-200` | `#BEDBFF` | **1.35** | 1.42 | 1 |
| `dark:text-amber-300` | `#FFD230` | **1.37** | 1.45 | 4 |
| `dark:text-slate-300` | `#CAD5E2` | **1.41** | 1.49 | 1 |
| `dark:text-sky-300` | `#74D4FF` | **1.58** | 1.67 | 1 |
| `dark:text-amber-400` | `#FFB900` | **1.64** | 1.72 | 39 |
| `dark:text-blue-300` | `#8EC5FF` | **1.72** | 1.81 | 1 |
| `dark:text-red-300` | `#FFA2A2` | **1.82** | 1.92 | 2 |
| `dark:text-emerald-400` | `#00D492` | **1.84** | 1.94 | 35 |
| `dark:text-orange-400` | `#FF8904` | **2.26** | 2.38 | 1 |
| `dark:text-blue-400` | `#51A2FF` | **2.51** | 2.64 | 8 |
| `dark:text-purple-400` | `#C27AFF` | **2.65** | 2.79 | 4 |
| `dark:text-rose-400` | `#FF637E` | **2.72** | 2.86 | 5 |
| `dark:text-red-400` | `#FF6467` | **2.74** | 2.89 | 20 |

**122 of 122 fail AA on a light background; worst 1.25 : 1 on `--surface-alt`.** `dark:text-amber-400` alone is 39 instances at 1.64 : 1.

### Three more artefacts of the same bug

1. **Three `.dark` class selectors in `globals.css` are fully dead.** `globals.css:630` (`.dark .walkthrough-spotlight`), `:921` (`:is(.dark) .version-diff-border`), `:957` (`:is(.dark) .version-diff-highlight::before`). Nothing anywhere adds a `dark` class to any element — `grep -rn 'classList.add' src` finds no such call. The walkthrough spotlight ring and the version-diff highlight therefore never get their dark-mode treatment.
2. **`src/lib/utils/export-report.ts:20`** — `const isDark = document.documentElement.classList.contains("dark");` is **always `false`**. It is the final fallback in `resolveBackground()`, so a PNG/JPEG export that reaches that branch is captured on `#FAF9F6` white even in dark mode.
3. The `creator` and `presenting` variants prove the team knows the `@custom-variant` mechanism — `dark` was simply never added when the project moved to v4.

---

## Blocking WCAG AA failures

**Count: 6.**

### B1 — Dark-mode primary CTA: white on accent at 1.40–2.72 : 1 × 73 instances (+ skip link)
`conflict_risk: true` (most host files are on the `main`-changed list)
**1.4.3 AA.** Full detail and per-theme table in the VGC-315 section. This is the single worst defect in the codebase: the primary call-to-action on every public page, in every modal and across the report viewer is unreadable for every user in dark mode. Default theme (gen9) is 1.89 : 1.

### B2 — Light-mode primary CTA: white on accent below 4.5:1 for 7 of 9 themes
`conflict_risk: true` — same 73 sites.
**1.4.3 AA.** gen5 2.77, gen2 3.19, gen3 3.30, gen7 3.56, gen4 3.68, gen8 3.68, gen1 4.23. Four of the eight random palettes also fail (amber 3.19, orange 3.56, cyan 3.68, emerald 3.77). Not mentioned in either ticket.

### B3 — `dark:` utilities desynced from the dark-mode strategy: 142 utilities, up to 122 failing at once
`conflict_risk: true` — `src/app/globals.css`
**1.4.3 AA.** Full detail in the VGC-316 section. 40/122 fail when the app is dark and the OS is light; 122/122 fail when the app is light and the OS is dark. Worst 1.25 : 1.

### B4 — `focus:outline-none` + a translucent ring: focus indicator at 1.49–3.05 : 1 on 49 controls
**1.4.11 AA (Non-text Contrast), and effectively 2.4.7.**
`globals.css:858–863` provides a correct global fallback:
```css
@layer base { *:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; } }
```
…but it lives in the **base** layer, and Tailwind's `focus:outline-none` lives in the **utilities** layer, which cascades later. Layer order beats specificity, so `focus:outline-none` wins and removes the ring for keyboard users too. 68 `outline-none` occurrences across 30 `.tsx` files; **49 of them pair it with only `ring-accent/20…/50`**, and only 2 of those 49 add a `ring-offset`.

Computed ring contrast against the surface it sits on (`run4.js`), accent at 40% alpha:

| theme | light on #FFFFFF | light on #FAF9F6 | dark on #141428 | dark on #0B0B1A |
|---|---|---|---|---|
| gen5 | **1.51** | **1.49** | 2.74 | 2.71 |
| gen2 | **1.55** | **1.53** | 2.96 | 2.94 |
| gen3 | **1.59** | **1.55** | 3.05 | 2.99 |
| gen4 | **1.62** | **1.60** | 2.64 | 2.58 |
| gen8 | **1.64** | **1.62** | 2.98 | 2.93 |
| gen7 | **1.66** | **1.63** | 2.69 | 2.68 |
| gen1 | **1.68** | **1.67** | 2.58 | 2.56 |
| gen6 | **1.93** | **1.89** | 2.53 | 2.51 |
| gen9 | **1.93** | **1.91** | 2.55 | 2.51 |

Every value is under the 3:1 required for a focus indicator; light mode is roughly half the bar. Affected files include the whole input surface: `PasteInput.tsx`, `CalcInput.tsx`, `TeamOverview.tsx`, `CommonModesSlide.tsx`, `MatchupPlanSlide.tsx`, `InlinePokemonEditor.tsx`, `PokemonDropdown.tsx`, `AddOpponentInput.tsx`, `InlineDamageCalculator.tsx`, `pokemon-detail/{CalcsPanel,CalcEntryGroup,NotesPanel}.tsx`, `CompareContent.tsx`, `ExploreFilters.tsx`, `MatchTracker.tsx`, `DashboardContent.tsx`, `dashboard/{profile,privacy}/page.tsx`, `ChangelogContent.tsx`, `ChampionsContent.tsx`, `tools/ev-to-sp/{page,EvToSpConverter}.tsx`, `FeedbackContent.tsx`, `CommentSection.tsx`, `CollaboratorPanel.tsx`, `CreatorProfile.tsx`, `NotificationBell.tsx`, `Button.tsx`, `PokemonCard.tsx`, `HomePageClient.tsx`.

Two controls kill the outline with **no replacement at all**: `src/components/explore/ExploreFilters.tsx:675` (a text input — the only focus cue is the parent container's, which has none) and `src/components/ui/NotificationBell.tsx:129` (a popover container; harmless, it is not a tab stop).

### B5 — Light-mode `--success` and `--warning` fail 4.5:1 everywhere
`conflict_risk: true` — `src/app/globals.css`, `src/components/layout/Navbar.tsx`
**1.4.3 AA.**

| token | light value | on #FAF9F6 | on #FFFFFF | on #F2F0EB |
|---|---|---|---|---|
| `--success` | `#16A34A` | **3.13** | **3.30** | **2.89** |
| `--warning` | `#D97706` | **3.03** | **3.19** | **2.80** |
| `--danger` | `#DC2626` | 4.59 | 4.83 | **4.24** |

Commit `72bb956` fixed exactly this for *dark* mode (dark now 11.19 / 11.68 / 7.05 on background) and documented the maths in a comment at `globals.css:286–296` — but left the light values untouched. `text-warning` is used 4× (`Navbar.tsx:157` is a 12px-bold offline-banner link at **3.03 : 1**, and `Navbar.tsx:166`, `CommentSection.tsx:304`), `text-danger` 12×, which fails on `--surface-alt` at 4.24. `text-success` is unused (0 hits) but `--success` still feeds `bg-success/15` cells.

### B6 — Hardcoded Tailwind palette colours used unconditionally fail in the mode they were not tuned for
`conflict_risk: true` — `src/components/report/SpeedTierChart.tsx`
**1.4.3 AA.** These are not `dark:`-guarded at all, so they fail in one mode outright:

| class | hex | on #FAF9F6 | on #141428 | site |
|---|---|---|---|---|
| `text-purple-400` | `#C27AFF` | **2.65** | 6.48 | `SpeedTierChart.tsx:499` (Mega-forms toggle, active) |
| `text-amber-500` | `#FE9A00` | **2.03** | 8.48 | `SlideNavControls.tsx:345`, `:514` |
| `text-blue-500` | `#2B7FFF` | **3.57** | 4.81 | `SpeedTierChart.tsx:533` (meta-threats toggle, active) |
| `text-purple-500` | `#AD46FF` | **3.91** | 4.39 | SpeedTierChart Mega rows |

The purple and blue values were clearly chosen against the dark canvas; in light mode the *active* state of the speed-tier toggles is the least readable text on the slide.

---

## Serious issues

### S1 — Report-viewer slide-options sheet: `role="dialog"` with no focus management, rendered before its trigger
`src/components/report/SlideNavControls.tsx:425–442` — *not* on the `main`-changed list, so safe to touch.
**2.4.3 Focus Order, 4.1.2 Name/Role/Value.** Unchanged since 26-10-26. The dialog has:
- no `aria-modal`
- no focus move on open, no focus trap, no focus return on close
- no `inert`/`aria-hidden` on the rest of the page
- and it is rendered **before** the `role="navigation"` bar that contains its own trigger (`:444`), so Tab order reaches the dialog before the button that opened it

Escape *is* handled (`:164–170`), which is the one piece that works. It matters more than a typical dialog because on mobile this sheet is the only route to the slide-visibility and Base/Mega controls. A correct trap already exists at `HomePageClient.tsx:381–422` — extract it rather than write a second one. See `.swarm/unfiled-ticket-bodies/5-a11y-slidenav-focus-trap.md`.

Other `role="dialog"` holders and their state: `WhatsNewModal.tsx` complete (aria-modal, Escape, focus, inert); `OTSSheetModal.tsx` and `ShareModal.tsx` have aria-modal + Escape + focus moves but no `inert`/trap; `ShortcutHintOverlay.tsx` has aria-modal + Escape but no focus move; `WalkthroughOverlay.tsx`, `VersionHistoryPanel.tsx`, `InlinePokemonEditor.tsx`, `NotificationBell.tsx` all lack `aria-modal`.

### S2 — Two tablists implement the ARIA tab pattern without arrow-key navigation
**4.1.2, 2.1.1.** Declaring `role="tablist"`/`role="tab"` promises arrow-key traversal and a single tab stop; both of these give neither (Tab still reaches each button, so this is a broken-pattern failure rather than a keyboard trap).
- `src/components/report/SlideNavControls.tsx:183–209` — the **section tablist** ("Report sections"). No `onKeyDown`, no roving `tabIndex`, no `aria-controls`, and no matching `role="tabpanel"`. Unavailable tabs use `disabled` + `pointer-events-none` + `opacity-40`, which puts the label at **1.93 : 1** light / **2.63 : 1** dark.
- `src/components/report/MatchupPlanSlide.tsx:357–375` — the game-plan tablist. Has `aria-controls`, no arrow keys. **CONFLICT-RISK**

For contrast, `src/app/changelog/ChangelogContent.tsx:198–215` does it correctly (roving focus via `tabListRef.current?.querySelectorAll('[role="tab"]')`), and the desktop slide-dot tablist at `SlideNavControls.tsx:491–510` has `handleSlideTabKeyDown` (`:404–420`). Copy either.

### S3 — Framer Motion animations ignore `prefers-reduced-motion` in 9 files / ~55 elements
**2.3.3 (AAA) but an explicit project standard.** The CSS guard at `globals.css:845–852` zeroes `animation-duration` and `transition-duration`, which cannot stop Motion — it drives inline transforms through the Web Animations API, outside CSS animation/transition timing. Files importing `motion/react` with **no** `useReducedMotion()`:

`src/app/feedback/FeedbackContent.tsx` (19 motion elements), `src/app/changelog/ChangelogContent.tsx` (12), `src/components/ui/WhatsNewModal.tsx` (6), `src/app/champions/[pokemon]/MegaLandingContent.tsx` (6), `src/app/dashboard/profile/page.tsx` (4), `src/components/explore/ExploreContent.tsx` (3), `src/components/explore/ExploreEmpty.tsx` (3), `src/components/social/CreatorProfile.tsx` (1) **CR**, `src/components/explore/ReportCard.tsx` (1).

`src/components/explore/ExploreFilters.tsx:6,130` already does it right (`useReducedMotion` from `motion/react`), as does `src/components/social/DoubleTapLikeOverlay.tsx:153–160` with a cached media query. The marketing pages (`/feedback`, `/changelog`, `/champions/[pokemon]`) are the worst offenders and the most likely to be a first impression.

### S4 — Three `<select>` controls have no accessible name
**1.3.1, 4.1.2.** Of 75 form controls, 72 are named (`<label htmlFor>`, a wrapping `<label>`, or `aria-label`). These three are not — no `id`, no `aria-label`, not inside a `<label>`:
- `src/app/dashboard/DashboardContent.tsx:206` — report sort order ("Newest/Oldest/Views/Name") **CONFLICT-RISK**
- `src/components/social/CreatorProfile.tsx:303` — profile sort order **CONFLICT-RISK**
- `src/components/compare/CompareContent.tsx:82` — "pick a saved report" picker, the primary control of `/compare` **CONFLICT-RISK**

A screen reader announces these as an unlabelled combobox.

### S5 — Two of four SpeedTierChart toggles still expose no pressed state
`src/components/report/SpeedTierChart.tsx` — **CONFLICT-RISK**
**4.1.2.** Partially fixed since 26-10-26 (commit `1fa2e4a`): `:139` (`onToggle`) and `:512` (`trickRoom`) now carry `aria-pressed`. Still missing on `:495` (`showMegaTiers`) and `:527` (`showMetaThreats`) — both convey state through colour alone (`bg-purple-500/15 text-purple-400` / `bg-blue-500/15 text-blue-500`), which is also **1.4.1 Use of Colour**. Both of those active colours are the ones failing in B6, so a screen-reader user gets nothing and a sighted light-mode user gets 2.65 : 1.

### S6 — Ten form controls use `placeholder` as their only label
**1.3.1, 3.3.2.** A placeholder vanishes on first keystroke, so the field loses its name mid-entry; it is also the lowest-contrast text in the control (`placeholder:text-text-tertiary`).
`src/components/compare/CompareContent.tsx:411`, `:430` (the two paste boxes on `/compare`) **CR** · `src/components/input/PasteInput.tsx:358` (the app's primary input) **CR** · `src/components/report/CalcInput.tsx:361` · `src/components/report/InlinePokemonEditor.tsx:160` **CR** · `src/components/report/pokemon-detail/NotesPanel.tsx:19` · `src/components/match-tracker/MatchTracker.tsx:238`, `:316`, `:329` · `src/app/dashboard/privacy/page.tsx:142` (the "Type DELETE to confirm" field) · `src/app/dashboard/profile/page.tsx:296`.

### S7 — Component and field boundaries at 1.34–1.36 : 1
**1.4.11 AA (3:1 for UI component boundaries).**
`--border #E0DDD5` on `--surface #FFFFFF` = **1.36**, on `--background #FAF9F6` = **1.29**; `--border-subtle #F0EDE6` on surface = **1.17**. Dark: `--border #2A2A52` on `--surface #141428` = **1.34**, on background = **1.44**; `--border-subtle` on surface = **1.19**.
These are the borders on every text input, select, textarea and card. Where a border is the *only* thing marking a control's extent (the inputs in B4/S6), it fails 1.4.11.

---

## Minor issues

### N1 — Skip-link target is a non-focusable `<div>`
`src/app/layout.tsx:100` links to `#main-content`, which is `<div id="main-content">` at `:137` — not a `<main>` landmark and with no `tabIndex={-1}`. Browsers vary on whether focus actually moves to a non-focusable fragment target; in several it does not, so the skip link scrolls but leaves focus in the header. Each page then supplies its own `<main>` inside that div, so the landmark itself is fine. Add `tabIndex={-1}` to the div, or point the link at the page's own `<main>`.

### N2 — Entrance animations run on non-compositable properties
`globals.css` `fade-in` / `fade-in-up` / `fade-in-scale` / `slide-in` / `sheet-up` animate `transform` + `opacity` correctly, but `.card-hover` (`:721–729`) transitions `box-shadow`, and `.version-diff-border` (`:915–920`, `:928–946`) animates `box-shadow` on a **2.5s infinite** loop. Infinite non-essential motion is a **2.2.2 Pause, Stop, Hide** concern; it is also the most expensive thing to paint in the viewer.

### N3 — Light-mode `text-accent` body copy below 4.5:1 for 8 of 9 themes
`run.js`: gen5 **2.63**, gen2 **3.03**, gen3 **3.13**, gen7 **3.38**, gen4 **3.49**, gen8 **3.50**, gen1 **4.02**, gen9 **4.46**; only gen6 (4.59) passes on `--background`. Fixed as a side effect of the B2 remediation below (all nine reach ≥4.51). Dark mode is fine (9.53–12.89).

### N4 — `text-accent` on `bg-accent-surface` stays marginal even after the fix
Light mode currently 2.60–4.41; with the darkened accents in the remediation section it reaches 4.33–4.59, so **gen1 4.33, gen9 4.34, gen4 4.37 and gen6 4.41 are still a hair under 4.5**. Dark mode is fine (5.06–6.49). Either nudge `--accent-surface` lighter for those four or use `text-text-primary` on accent-surface chips.

### N5 — One sub-44px interactive box, and 45 sized only by padding
`src/app/dashboard/profile/page.tsx:437` is the only control with an explicit box under 44px (`h-6 w-11` = 44×24 toggle switch). A further 45 buttons are sized by padding alone and land at an estimated 26–42px (12 at ≈26px, 12 at ≈30px, 9 at ≈34px, 6 at ≈38px, 6 at ≈42px) — concentrated in `DashboardContent.tsx` (20) and `HomePageClient.tsx` (11).
**This is not a WCAG 2.1 AA failure** — 2.5.5 Target Size is AAA, and 2.5.8 (24px, AA) arrives in WCAG 2.2; every one of these clears 24px. It *is* a violation of the project's own 44×44 standard. The codebase is otherwise disciplined here: `min-h-11` / `min-h-[44px]` appears throughout.

### Verified clean
- **Images:** 24 `<img>` elements, **0 missing `alt`** (`img.js`). 0 `<Image>` without alt.
- **Icon-only buttons:** 276 buttons scanned; **0** lacking an accessible name. Commit `babe700` ("a11y: mark the 31 shared icons decorative") landed since the last run, and `src/components/ui/__tests__/icons.a11y.test.tsx` guards it.
- **`<div onClick>`:** no interactive non-interactive elements. The one candidate, `src/components/report/TeamOverview.tsx:112`, has a paired `onKeyDown` handling Enter and Space.
- **Heading order:** single `h1` and no skipped levels on `/faq`, `/champions`, `/champions/[pokemon]`, `/tools/ev-to-sp`, `/privacy`, `/terms`, `/support`, `/changelog`. Landmarks (`<main>`, `<nav>`, `<header>`, `<footer>`) present.
- **Tables:** `ThreatMatrix.tsx:120` and `SpreadBuilder.tsx:52` both use `<caption>` plus `scope="col"`/`scope="row"`.
- **Dark semantic tokens:** `--success` 11.19 / `--warning` 11.68 / `--danger` 7.05 on `--background`. Fixed by `72bb956`; previously the top finding S1.
- **Reduced motion for CSS animation:** `globals.css:845–852` is present and correct for everything CSS-driven.

---

## Exact remediation for the dark-mode findings

Three edits to `src/app/globals.css` (**CONFLICT-RISK** — it is on the `main`-changed list) plus a mechanical class swap carry B1, B2, B3, B5 and N3.

### Step 1 — declare the dark variant (fixes B3, 142 utilities, one line)

Add beside the existing two at `src/app/globals.css:3–4`:

```css
@custom-variant dark (&:where([data-dark-mode], [data-dark-mode] *));
```

This re-points all 142 `dark:` utilities from `prefers-color-scheme` to the attribute the app actually sets, so both desync cases disappear at once. The `:where()` keeps specificity at zero, exactly as the `creator` and `presenting` variants do. Verify with `grep -c "data-dark-mode" .next/static/css/*.css` after a build — the compiled `dark:` rules should carry the attribute selector, not `@media (prefers-color-scheme: dark)`.

Three companion fixes for the same root cause:
- `src/app/globals.css:630` — `.dark .walkthrough-spotlight` → `[data-dark-mode] .walkthrough-spotlight`
- `src/app/globals.css:921`, `:957` — `:is(.dark)` → `:is([data-dark-mode])`
- `src/lib/utils/export-report.ts:20` — `document.documentElement.classList.contains("dark")` → `document.documentElement.hasAttribute("data-dark-mode")`

### Step 2 — add an `--accent-foreground` token (fixes B1, all 73 instances)

In `:root` (`globals.css:6–47`):
```css
--accent-foreground: #FFFFFF;
```

In `[data-dark-mode]` (`globals.css:263–299`):
```css
--accent-foreground: #0B0B1A;   /* the dark --background, used as ink on the pastel accent */
```

In `@theme inline` (`globals.css:49–68`):
```css
--color-accent-foreground: var(--accent-foreground);
```

Then replace `text-white` with `text-accent-foreground` on the 73 sites listed in the VGC-315 section, and on `src/app/layout.tsx:100` (the skip link).

**Ratios `#0B0B1A` achieves on every dark accent** (`run3.js`) — all AAA:

| accent | value | ratio | | accent | value | ratio |
|---|---|---|---|---|---|---|
| gen3 | `#86efac` | **13.89** | | rand-amber | `#FBBF24` | **11.68** |
| gen2 | `#fcd34d` | **13.52** | | rand-cyan | `#22D3EE` | **10.79** |
| gen8 | `#67e8f9` | **13.45** | | rand-emerald | `#34D399` | **10.14** |
| gen5 | `#7dd3fc` | **11.69** | | rand-orange | `#FB923C` | **8.62** |
| gen7 | `#fdba74` | **11.56** | | rand-blue | `#60A5FA` | **7.67** |
| gen4 | `#93c5fd` | **10.81** | | rand-pink | `#F472B6` | **7.36** |
| gen1 | `#c4b5fd` | **10.56** | | rand-rose `#FB7185` (= CSS fallback at `globals.css:283`) | | **7.24** |
| gen9 | `#fda4af` | **10.31** | | rand-violet | `#A78BFA` | **7.16** |
| gen6 | `#fca5a5` | **10.27** | | | | |

**Worst case 7.16 : 1, best 13.89 : 1.** Every one of the 17 dark accents clears AAA (7:1) for normal text. `#1A1A2E` (`--text-primary`) also works and is 6.27–12.15, but `#0B0B1A` is strictly better and is already the dark background, so it reads as the brand's ink.

### Step 3 — darken the light-mode accents (fixes B2 and N3)

Light mode cannot be fixed with a foreground swap: for gen6 (`#dc2626`) and gen9 (`#e11d48`) a dark ink only reaches 3.53 and 3.63, so there is no single light-mode foreground that works. The accents themselves have to move. These values satisfy **both** `white-on-accent ≥ 4.5` (for `bg-accent text-accent-foreground`) **and** `accent-as-text-on-#FAF9F6 ≥ 4.5` (for `text-accent`), which is the stricter of the two (`run5.js`):

`GEN_PRESETS.accent` in `src/hooks/useTheme.ts:17–96` **and** the mirrored `p.a` values in the bootstrap script at `src/app/layout.tsx:97` — both must change together or the first paint will differ from the hydrated one:

| theme | current | → new | white-on-new | new-as-text on #FAF9F6 | on #FFFFFF | on #F2F0EB |
|---|---|---|---|---|---|---|
| gen1 | `#8b5cf6` | **`#8256E6`** | 4.75 | 4.51 | 4.75 | 4.17 |
| gen2 | `#d97706` | **`#AD5F05`** | 4.76 | 4.52 | 4.76 | 4.18 |
| gen3 | `#16a34a` | **`#12843C`** | 4.78 | 4.54 | 4.78 | 4.20 |
| gen4 | `#3b82f6` | **`#3370D5`** | 4.75 | 4.51 | 4.75 | 4.17 |
| gen5 | `#0ea5e9` | **`#0A7AAC`** | 4.78 | 4.54 | 4.78 | 4.20 |
| gen6 | `#dc2626` | *unchanged* | 4.83 | 4.59 | 4.83 | 4.24 |
| gen7 | `#ea580c` | **`#C64B0A`** | 4.76 | 4.52 | 4.76 | 4.18 |
| gen8 | `#0891b2` | **`#077D9A`** | 4.76 | 4.52 | 4.76 | 4.18 |
| gen9 | `#e11d48` | **`#DF1D47`** | 4.77 | 4.53 | 4.77 | 4.19 |

`PALETTES[].accent` in `src/lib/utils/random-accent.ts:3–10` (**CONFLICT-RISK**):

| palette | current | → new | white-on-new | as-text on #FAF9F6 |
|---|---|---|---|---|
| rose | `#E11D48` | **`#DF1D47`** | 4.77 | 4.53 |
| violet | `#7C3AED` | *unchanged* | 5.70 | 5.41 |
| blue | `#2563EB` | *unchanged* | 5.17 | 4.91 |
| emerald | `#059669` | **`#04835C`** | 4.77 | 4.53 |
| amber | `#D97706` | **`#AD5F05`** | 4.76 | 4.52 |
| pink | `#DB2777` | **`#D72675`** | 4.75 | 4.51 |
| cyan | `#0891B2` | **`#077D9A`** | 4.76 | 4.52 |
| orange | `#EA580C` | **`#C64B0A`** | 4.75 | 4.52 |

Also update the light CSS fallback `--accent: #E11D48` → `#DF1D47` (`globals.css:22`) and the `[data-export-theme="light"]` block (`globals.css:340`, `:352`), which hardcodes `#E11D48` four times, plus the print override at `globals.css:803` (`.text-accent, [class*="text-accent"] { color: #E11D48 !important }`). The `[data-export-theme="dark"]` block hardcodes `#FB7185` and needs the matching `--accent-foreground: #0B0B1A` so exported dark PDFs inherit the fix.

Caveat (N4): with these accents, `text-accent` on `bg-accent-surface` reaches 4.33–4.59, so gen1 (4.33), gen9 (4.34), gen4 (4.37) and gen6 (4.41) are still marginally under 4.5. Either lighten `--accent-surface` for those four or use `text-text-primary` on accent-surface chips.

### Step 4 — light semantic tokens (fixes B5)

In `:root`, matching the comment style `72bb956` already established in the `[data-dark-mode]` block:

| token | current | → new | on #FAF9F6 | on #FFFFFF | on #F2F0EB |
|---|---|---|---|---|---|
| `--success` | `#16A34A` (3.13) | **`#0F7A37`** | **5.17** | **5.44** | **4.78** |
| `--warning` | `#D97706` (3.03) | **`#A45800`** | **5.02** | **5.28** | **4.64** |
| `--danger` | `#DC2626` (4.24 on alt) | **`#C81E1E`** | **5.45** | **5.74** | **5.04** |

The weaker candidates `#12883E` (success) and `#B36205` (warning) clear 4.5 on `#FFFFFF` (4.55 / 4.50) but **not** on `--surface-alt #F2F0EB` (3.99 / 3.95), where these tokens are in fact used — so take the darker pair. Also update the matching `#print-container` token overrides at `globals.css:745–784`.

### Step 5 — focus indicators (fixes B4)

The cheapest correct fix is to stop fighting the global ring: delete `focus:outline-none` from the 49 affected class strings and let `globals.css:858–863` do its job. With the Step 3 accents the global `outline: 2px solid var(--accent)` measures:

| | light (on #FFFFFF) | dark (on #141428) |
|---|---|---|
| gen1 | 4.75 | 9.80 |
| gen2 | 4.76 | 12.55 |
| gen3 | 4.78 | 12.89 |
| gen4 | 4.75 | 10.04 |
| gen5 | 4.78 | 10.85 |
| gen6 | 4.83 | 9.53 |
| gen7 | 4.76 | 10.73 |
| gen8 | 4.76 | 12.48 |
| gen9 | 4.77 | 9.57 |

All ≥ 4.75 : 1, comfortably over the 3:1 of 1.4.11. If a ring is wanted for design reasons, it must be **solid** — `focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface` — because any alpha below ~70% drops under 3:1 (40% alpha measures 1.49–1.93 in light mode). Note the 58 existing `focus-visible:ring-accent` uses are already solid and correct; only the 49 `ring-accent/NN` ones need changing. And prefer `focus-visible:` over `focus:` so the ring does not appear on mouse clicks.

Give `src/components/explore/ExploreFilters.tsx:675` and `src/components/ui/NotificationBell.tsx:129` the same treatment (the latter is a container, not a tab stop, so removing `focus:outline-none` there is cosmetic).

### Suggested order tonight
1. **Step 1** — one line, fixes 142 utilities, zero visual risk in dark mode. Highest value per character in the codebase.
2. **Step 2** — token + 74 mechanical `text-white` → `text-accent-foreground` swaps. Clears B1 entirely.
3. **Step 5** — delete 49 `focus:outline-none`. Mechanical, clears B4.
4. **Step 4** — three token values. Clears B5.
5. **Step 3** — 15 hex values across three files that must stay in sync. Clears B2 and N3 but is the one that changes the brand's appearance, so it wants a visual check; `src/lib/utils/__tests__/random-accent.test.ts` already exists and will need its expectations updated.

Add a vitest guard beside the tokens (per CLAUDE.md: new logic in `src/lib/` gets a test, regressions get a test that names the bug) — a test that parses `globals.css` plus `GEN_PRESETS` plus `PALETTES` and asserts `contrast(accentForeground, accent) >= 4.5` for all 34 accent/mode combinations. That is the only thing that stops this regressing the next time a theme is added, and it would have caught both tickets.

### CONFLICT-RISK summary
Files I recommend changing that appear in `.swarm/main-changed-files.md`:
`src/app/globals.css` · `src/lib/utils/random-accent.ts` · `src/components/home/HomePageClient.tsx` · `src/app/dashboard/DashboardContent.tsx` · `src/components/layout/Navbar.tsx` · `src/components/input/PasteInput.tsx` · `src/components/ui/ShareModal.tsx` · `src/components/ui/OTSSheetModal.tsx` · `src/components/ui/WhatsNewModal.tsx` · `src/components/ui/InstallPrompt.tsx` · `src/components/ui/ShareViewCTA.tsx` · `src/components/compare/CompareContent.tsx` · `src/components/social/CreatorProfile.tsx` · `src/components/report/SpeedTierChart.tsx` · `src/components/report/MatchupPlanSlide.tsx` · `src/components/report/InlinePokemonEditor.tsx` · `src/components/report/TeamReport.tsx`

Clear (not on the list): `src/hooks/useTheme.ts` · `src/app/layout.tsx` · `src/components/report/SlideNavControls.tsx` · `src/lib/utils/export-report.ts` · `src/components/explore/ExploreFilters.tsx` · `src/app/changelog/ChangelogContent.tsx` · `src/app/champions/[pokemon]/MegaLandingContent.tsx` · `src/components/report/CalcInput.tsx` · `src/components/match-tracker/MatchTracker.tsx` · `src/app/feedback/FeedbackContent.tsx`.

---

## Changed since 26-10-26

39 commits landed. Three a11y-relevant changes, both tickets still fully live.

**Fixed**
- **Dark-mode `--danger` / `--success` / `--warning`** — previously SERIOUS S1. Commit `72bb956` ("fix: stop the random accent shadowing dark mode's accent tokens") added `--success: #4ADE80`, `--warning: #FBBF24`, `--danger: #F87171` to the `[data-dark-mode]` block with the ratio maths documented in a comment at `globals.css:286–296`. Verified: 11.19 / 11.68 / 7.05 on `--background`. **ALREADY FIXED.**
  Note the same commit left the *light* values untouched, and they fail — now B5.
- **`aria-label` on elements that cannot carry a name** — previously MINOR N3. Commit `babe700` ("a11y: mark the 31 shared icons decorative") marked the shared icon set `aria-hidden`, and `src/components/ui/__tests__/icons.a11y.test.tsx` now guards it. **ALREADY FIXED.**

**Partially fixed**
- **SpeedTierChart toggles exposing no pressed state** — previously SERIOUS S5 ("11 toggles and zero `aria-pressed`"). Commit `1fa2e4a` added `aria-pressed` at `:139` and `:512`. Two of four remain (`:495` `showMegaTiers`, `:527` `showMetaThreats`). Now S5, downgraded in scope.

**Unchanged**
- **VGC-315** — still TRUE. `git log --since=2026-10-25 -- src/hooks/useTheme.ts` is empty; no `--accent-foreground` token exists. Instance count has grown slightly: the prior run recorded 67, a correct pair count today is **73**.
- **VGC-316** — still TRUE. `globals.css` was touched by `72bb956`, but only to rework the random-accent mapping; no `@custom-variant dark` was added. Count is **142**, not the 132 on the ticket.
- **S1 slide-nav focus trap** — `src/components/report/SlideNavControls.tsx` has no commits since 2026-10-25. `.swarm/unfiled-ticket-bodies/5-a11y-slidenav-focus-trap.md` was never filed as a Linear issue.
- **B4 focus rings**, **S2 tablists**, **S3 Motion/reduced-motion**, **S6 placeholder labels**, **S7 border contrast**, **N1 skip link** — all unchanged.

**New this run (not in the 26-10-26 report)**
- **B2** — light-mode `bg-accent text-white` fails for 7 of 9 gen themes and 4 of 8 random palettes. The prior run noted the light-mode numbers inside the B1 write-up but did not call it out as a separate blocker; it needs its own fix (the accent values), not the same one as B1 (the foreground token).
- **B5** — light-mode `--success` 3.13 and `--warning` 3.03, exposed by `72bb956` fixing only the dark half.
- **B6** — `text-purple-400` (2.65) and `text-blue-500` (3.57) used unconditionally for the *active* state of the SpeedTierChart toggles added by `1fa2e4a`. This is a **regression introduced since the last run**.
- **The three dead `.dark` CSS selectors** (`globals.css:630`, `:921`, `:957`) and **`export-report.ts:20`'s dead `classList.contains("dark")`** — concrete, independently verifiable evidence for VGC-316 that the prior report did not surface.
- **The eight random-accent dark palettes** (1.67–2.72 : 1 with white) as additional VGC-315 surface, introduced by the random-accent rework in `72bb956`.
