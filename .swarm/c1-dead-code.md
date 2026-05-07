# Dead Code Scan — VGC Team Report
**Date:** 2026-05-07
**Scope:** src/ (app, components, hooks, lib)

---

## 1. Unused Components (never imported anywhere in the codebase)

### 1a. Fully dead — zero imports outside own file

| File | Lines | Notes |
|------|-------|-------|
| `src/components/report/OpponentPokemonCard.tsx` | 131 | Exports `OpponentPokemonCard`. No import found anywhere. |
| `src/components/report/TeamComparisonSlide.tsx` | 264 | Exports `TeamComparisonSlide`. No import found anywhere. |
| `src/components/report/TeamCoverageSlide.tsx` | 69 | Exports `TeamCoverageSlide`. No import found anywhere. |
| `src/components/report/TypeCoverageMatrix.tsx` | ~100 | Exports `TypeCoverageMatrix`. Only mention is a comment-label in `en.ts:201`. Never rendered. |

All four are self-contained components with their own props interfaces and no call sites in the app. 464 lines of dead code total.

---

## 2. Dead Hooks (exported but never called from app code)

### 2a. Fully unused hooks

| File | Export | Notes |
|------|--------|-------|
| `src/hooks/useExportActions.ts` | `useExportActions` | Only referenced in a changelog *text string* (`ChangelogContent.tsx:460`). Never imported or called in production code. |
| `src/hooks/useIsMobile.ts` | `useIsMobile` | Only referenced in a changelog *text string* (`ChangelogContent.tsx:177`). Never imported or called in production code. |

Both hooks were mentioned in the changelog as part of a past refactor note but were never wired into the component tree.

---

## 3. Dead Library Files

### 3a. `src/lib/sharing/passcode.ts`
- Exports: `hashPasscode`, `verifyPasscode`
- **Zero imports** anywhere in the codebase. The `PasscodeModal` UI component (`src/components/ui/PasscodeModal.tsx`) exists and references passcode *strings* (i18n keys), but the actual crypto hashing utilities are never called.
- File: `src/lib/sharing/passcode.ts` (15 lines)

### 3b. `src/lib/data/abilities.ts`
- Exports: `ABILITIES` (Record), `lookupAbility` (function), `AbilityData` (type), `AbilityCategory` (type)
- **Zero imports** outside the file itself. No call to `lookupAbility` or `ABILITIES` exists anywhere in the codebase.
- File: `src/lib/data/abilities.ts` (86 lines)

### 3c. `src/lib/data/items.ts`
- Exports: `ITEMS` (Record), `lookupItem` (function), `ItemData` (type), `ItemCategory` (type)
- **Zero imports** outside the file itself. No call to `lookupItem` or `ITEMS` exists in the codebase.
- File: `src/lib/data/items.ts` (61 lines)

Note: `src/lib/analysis/item-boosts.ts` has its own internal `BOOSTER_ABILITIES` constant and does NOT import from either file.

---

## 4. Dead / Unreachable API Routes

### 4a. `/api/print-outline` — `src/app/api/print-outline/route.ts`
- Generates a printable blank tournament notes sheet (HTML).
- **No frontend call found** anywhere in `src/`. Not linked from any page, button, or hook.
- Not registered in `vercel.json` crons.
- Only exists in its own route file. 135 lines of server-side dead code.

### 4b. `/api/migrate` — `src/app/api/migrate/route.ts`
- One-off DB migration runner, protected by `MIGRATE_SECRET`.
- **No frontend call found**. Not in crons. Intended to be triggered manually via `curl` / Postman.
- Likely safe to keep but should be documented or moved to a script. 107 lines.

### 4c. `/api/cleanup` — `src/app/api/cleanup/route.ts`
- Registered in `vercel.json` as a daily cron (`0 3 * * *`), so it IS called.
- However, it is a `DELETE` method while Vercel cron always uses `GET`. Vercel cron will silently fail to invoke it.
- `src/app/api/cron/daily-ops/route.ts:17` pings `/api/keep-alive` (GET) for health, but no route calls `/api/cleanup`.
- **Effectively dead until the HTTP method is corrected or a GET handler is added.**

### 4d. `/api/team-graphic` — `src/app/api/team-graphic/route.tsx`
- Used by `/api/oembed` as `thumbnail_url`, but the page (`src/app/s/[id]/page.tsx:87-91`) explicitly suppresses OG images due to CDN timeout issues noted in the changelog.
- `/api/oembed` itself is externally callable but the thumbnail URL it emits (`/api/team-graphic`) is broken in third-party unfurlers (documented in changelog).
- No frontend button or link calls `/api/team-graphic` directly.
- **Functionally dead for its original purpose** (OG image generation). May still serve direct downloads but no UI exposes that.

### 4e. `/api/bot` — `src/app/api/bot/route.ts`
- Provides Discord slash-command style actions (`summary`, `popular`, `bugs`, `weekly-email`).
- **No frontend call**. Protected by `CRON_SECRET`. Intended for external Discord bot triggers.
- Uses deprecated `sendWeeklySummary` alias (see §5a). Not wired into any cron in `vercel.json`.

---

## 5. Dead / Deprecated Exports in Active Files

### 5a. `sendWeeklySummary` alias — `src/lib/email.ts:60`
```ts
/** @deprecated Use sendEmail instead */
export const sendWeeklySummary = sendEmail;
```
- Still imported by `src/app/api/bot/route.ts:2,137`.
- Since `/api/bot` itself is effectively dead (§4e), this is doubly dead.
- Should be removed once `/api/bot` is cleaned up.

### 5b. `getSpriteUrl` and `getSpriteFallbackUrl` — `src/lib/utils/sprite-url.ts:115,122`
- Exported but **never imported** anywhere in the codebase.
- The codebase uses `getSpriteUrls` (plural) from `sprite-slug.ts` instead.
- `getGenThemedSpriteUrls` and `isGenThemePixelated` from the same file ARE used by `PokemonSprite.tsx`.
- Dead exports in an otherwise active file.

---

## 6. Large Commented-Out Code Blocks (>5 lines)

Most comment blocks found are explanatory prose, not dead code. The one structural item worth noting:

### 6a. `src/app/api/webhooks/posthog/route.ts:3-8`
```
// ── Session timeline enrichment ──────────────────────────────────────────────
// On every webhook, query PostHog for ...
```
A 6-line block describing a feature that was planned but never implemented (session timeline enrichment). Not executable code, but signals a feature stub.

---

## 7. TODO/FIXME Comments with Issue References

**None found.** The codebase has no `TODO:`, `FIXME:`, or `HACK:` comments referencing Linear tickets or GitHub issues. The only `@deprecated` annotation is on `sendWeeklySummary` (§5a).

---

## 8. Cron Misconfiguration

`vercel.json` registers 4 cron routes:
```json
/api/cleanup       → DELETE handler   ← Vercel cron uses GET — will never trigger
/api/cron/daily-ops → GET handler     ← OK
/api/cron/weekly-report → GET handler ← OK
/api/cron/posthog-errors → GET handler ← OK (runs every 4h despite "weekly" JSDoc comment)
```

The `/api/cleanup` cron is silently broken because Vercel cron jobs invoke routes via `GET` but the route only exports a `DELETE` handler. Trash purge and stale-share cleanup are never running automatically.

---

## Summary Table

| Category | Item | File | Approx Lines |
|----------|------|------|-------------|
| Dead component | `OpponentPokemonCard` | `src/components/report/OpponentPokemonCard.tsx` | 131 |
| Dead component | `TeamComparisonSlide` | `src/components/report/TeamComparisonSlide.tsx` | 264 |
| Dead component | `TeamCoverageSlide` | `src/components/report/TeamCoverageSlide.tsx` | 69 |
| Dead component | `TypeCoverageMatrix` | `src/components/report/TypeCoverageMatrix.tsx` | ~100 |
| Dead hook | `useExportActions` | `src/hooks/useExportActions.ts` | ~60 |
| Dead hook | `useIsMobile` | `src/hooks/useIsMobile.ts` | ~30 |
| Dead lib | `passcode.ts` | `src/lib/sharing/passcode.ts` | 15 |
| Dead lib | `abilities.ts` | `src/lib/data/abilities.ts` | 86 |
| Dead lib | `items.ts` | `src/lib/data/items.ts` | 61 |
| Dead API route | `/api/print-outline` | `src/app/api/print-outline/route.ts` | 135 |
| Broken cron | `/api/cleanup` (DELETE not GET) | `src/app/api/cleanup/route.ts` | 83 |
| Dead export | `getSpriteUrl`, `getSpriteFallbackUrl` | `src/lib/utils/sprite-url.ts:115,122` | 2 fns |
| Deprecated alias | `sendWeeklySummary` | `src/lib/email.ts:60` | 1 |
