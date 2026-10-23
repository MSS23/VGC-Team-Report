# Design: VGC Team Report

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: Workbench (the paste box is the hero, Counter posture); every other public page is a Banner over its list, form or converter; dashboard and notifications are app screens
- Theme: Coral (dealt 2/3, seed vgc-team-report-web-f538·d02091a4·2026-10-23·r0), applied as a restyle on 2026-10-23: warm grey paper, cotton sheets lit from the left with a cast falling right, the ink board as the one primary, coral as the signal (links, focus, pressed states), General Sans with Geist Mono figures
- Axes: light/grotesk-sans/warm · posture: restrained · modes: light and dark (dark re-derived per dark-mode.md: paper 15%, cards lighter than canvas, shadows off, the primary a light stock card)

## Tokens
`src/app/tokens.css` holds the roles and the scale; the runtime values (`--light-*` and `--dark-*` in `globals.css`) are Coral's. The roles alias the runtime tokens so dark mode and the gen-theme picker keep working. `--accent` is the fill (the ink board by default), `--signal` the accent as text, underline and focus (deep coral by default); a picked gen theme sets both inline. `--edge-stock`, `--cast-stock`, `--cast-stock-lift` and `--tex-cotton` / `--tex-felt` are Coral's surfaces; the home hero sits on `.desk`.
```css
@theme inline {
  --color-paper: var(--background);  --color-paper-2: var(--surface);  --color-paper-3: var(--surface-alt);
  --color-ink: var(--text-primary);  --color-ink-2: var(--text-secondary);  --color-muted: var(--text-tertiary);  --color-rule: var(--border);
  --color-accent-ink: var(--accent-ink);  --color-focus: var(--accent);
  --font-display: var(--font-sora), ui-sans-serif, system-ui, sans-serif;  --font-body: var(--font-sora), ui-sans-serif, system-ui, sans-serif;  --font-outlier: var(--font-mono), ui-monospace, monospace;
  --radius-card: 10px;  --radius-pill: 999px;  --rule-hair: 1px;  --shadow-card: none;
}
```
The gen palette lives in `useTheme.ts` and the blocking script in `layout.tsx`; it applies only after a visitor picks a generation (nothing stored means Coral). `random-accent.ts` now holds the one Coral set. Accent as text goes through `--accent-text`, which is `--signal`. The spacing scale, the type scale (`text-display`, `text-display-s`, `text-section`, `text-title`, `text-lead`), the easings and the durations are the scaffold's and live in `tokens.css`.

## Controls
- Primary: the ink board (`bg-accent text-accent-ink`, label pressed with `--press-shadow`, cast falling right) · `rounded-card` 8px · 48px (`min-h-12`), one per page; hover lifts 1px into `--cast-stock-lift`, active presses 1px
- Secondary: the cotton card (`border-text-primary` is restyled by `globals.css` into cotton stock with `--edge-stock` and `--cast-stock`) · same radius and height; quiet links underline in `--border` and turn the underline coral on hover
- Cards: rounded cotton objects (`bg-surface` with a rounded utility) take `--edge-stock` and `--cast-stock` from one shared rule; inputs stay flat with a muted edge and a coral focus ring
- Fields: `border-text-tertiary` edge, accent outline on focus, 44px or taller; inputs that still carry `border-border` are lifted to the muted edge by a rule in `globals.css`

## Type
- Page head `h1`: `font-display text-display-s font-bold tracking-display` (the home hero and the Champions hero take `text-display`)
- Section head `h2`: `font-display text-section font-bold tracking-display`; row and card titles `text-title`
- Faces: General Sans (Fontshare CSS, weights 400, 500, 600, 700) for display and body; Geist Mono (next/font) for pastes and figures in columns
- Heads render at `--display-weight` 600 through one base rule; `font-bold` stays 700 on labels and controls. Labels are the body face a step smaller, sentence case, untracked; never an eyebrow above a heading

## Chrome
- Nav: edge-aligned, the wordmark and the destinations at the left, account and switches at the right, one hairline under, no blur; the phone keeps the bottom tab bar
- Footer: a mast, the wordmark large over one row of the site's links

## Motion
- Character: still; `transition` on colour, border and transform only, `--dur-short`; the two controls lift 1px on hover and press 1px on active; no reveals; reduced motion ends everything at once

## Exports
`tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request, per `export-formats.md`.
