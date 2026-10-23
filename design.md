# Design: VGC Team Report

The locked system. Every Hallmark run reads this first and pages share it. Change it on purpose; the file is the rule.

## System
- Genre: modern-minimal
- Shape of the first page: Workbench (the paste box is the hero, Counter posture); every other public page is a Banner over its list, form or converter; dashboard and notifications are app screens
- Theme: brand (the project's rose accent with its gen-theme and random-accent pickers, Sora, JetBrains Mono)
- Axes: light/grotesk-sans/warm · posture: restrained

## Tokens
`src/app/tokens.css` is the source of truth. The roles alias the project's runtime tokens so dark mode and the accent pickers keep working:
```css
@theme inline {
  --color-paper: var(--background);  --color-paper-2: var(--surface);  --color-paper-3: var(--surface-alt);
  --color-ink: var(--text-primary);  --color-ink-2: var(--text-secondary);  --color-muted: var(--text-tertiary);  --color-rule: var(--border);
  --color-accent-ink: var(--accent-ink);  --color-focus: var(--accent);
  --font-display: var(--font-sora), ui-sans-serif, system-ui, sans-serif;  --font-body: var(--font-sora), ui-sans-serif, system-ui, sans-serif;  --font-outlier: var(--font-mono), ui-monospace, monospace;
  --radius-card: 10px;  --radius-pill: 999px;  --rule-hair: 1px;  --shadow-card: none;
}
```
The accent values live in `globals.css` (`:root`, `[data-dark-mode]`), `layout.tsx` and `useTheme.ts` (the gen palette) and `random-accent.ts`; every light-mode accent clears 4.5:1 on paper. Accent as text goes through `--accent-text`. The spacing scale, the type scale (`text-display`, `text-display-s`, `text-section`, `text-title`, `text-lead`), the easings and the durations are the scaffold's and live in `tokens.css`.

## Controls
- Primary: accent fill · `rounded-card` · 48px (`min-h-12`), `text-accent-ink`, one per page
- Secondary: ink outline (`border-text-primary`) · same radius and height; quiet links underline in `--border` and turn the underline accent on hover
- Fields: `border-text-tertiary` edge, accent outline on focus, 44px or taller; inputs that still carry `border-border` are lifted to the muted edge by a rule in `globals.css`

## Type
- Page head `h1`: `font-display text-display-s font-bold tracking-display` (the home hero and the Champions hero take `text-display`)
- Section head `h2`: `font-display text-section font-bold tracking-display`; row and card titles `text-title`
- Weights in use: 400, 600, 700. Labels are the body face a step smaller, sentence case, untracked; never an eyebrow above a heading

## Chrome
- Nav: edge-aligned, the wordmark and the destinations at the left, account and switches at the right, one hairline under, no blur; the phone keeps the bottom tab bar
- Footer: a mast, the wordmark large over one row of the site's links

## Motion
- Character: still; `transition` on colour, border and transform only, `--dur-short`; no reveals; reduced motion ends everything at once

## Exports
`tokens.css` in this project. Tailwind, DTCG or shadcn blocks are added here on request, per `export-formats.md`.
