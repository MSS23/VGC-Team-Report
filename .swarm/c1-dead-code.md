# Dead Code Analysis — VGC Team Report

Generated: 2026-05-08

---

## 1. Orphaned Components (no imports anywhere)

### HIGH PRIORITY — Clearly unused slide components

| File | Exports | Notes |
|------|---------|-------|
| `src/components/report/TeamCoverageSlide.tsx` | `TeamCoverageSlide` | Was a combined coverage slide. Now TeamReport uses `OffensiveCoverageChart` and `DefensiveCoverageChart` directly. This wrapper was superseded but never deleted. |
| `src/components/report/TeamComparisonSlide.tsx` | `TeamComparisonSlide` | Full slide component, 100+ LOC, zero imports. Built but never wired into the slide system. |
| `src/components/report/OpponentPokemonCard.tsx` | `OpponentPokemonCard` | Card component for opponent team display, zero imports. Likely prototype work. |
| `src/components/report/BringSelector.tsx` | `BringSelector` | Referenced only as a comment in `en.ts` translation file (no functional import). Bring-4 logic lives in `MatchupPlanSlide.tsx` instead. |
| `src/components/report/TypeCoverageMatrix.tsx` | `TypeCoverageMatrix` | Referenced only as a comment in `en.ts` translation file (no functional import). Coverage is handled by `OffensiveCoverageChart`/`DefensiveCoverageChart`. |

---

## 2. Orphaned Utility Library

### `src/lib/sharing/passcode.ts`
- **Exports:** `hashPasscode`, `verifyPasscode`
- **Status:** Zero imports anywhere in the codebase. The passcode UI (`PasscodeModal.tsx`) exists and is wired into `page.tsx`, but no API route or hook ever calls `hashPasscode` or `verifyPasscode`. Passcode hashing/verification is not actually implemented in the backend — the library is a dead stub.

### `src/lib/security/csrf-client.ts`
- **Exports:** `secureFetch`
- **Status:** Zero imports anywhere. A fetch wrapper that auto-attaches CSRF tokens to state-changing requests, but no component or hook imports or uses it. All API calls use bare `fetch()`.

---

## 3. API Routes with No Frontend Callers

| Route | File | Notes |
|-------|------|-------|
| `/api/print-outline` | `src/app/api/print-outline/route.ts` | No frontend code calls this endpoint. Not in vercel.json crons. May be intended for external linking but has no discovery path. |
| `/api/oembed` | `src/app/api/oembed/route.ts` | No `<link rel="alternate" type="application/json+oembed">` in any page head. The oEmbed endpoint exists but is never advertised to oEmbed consumers (e.g., Twitter/Slack). |
| `/api/migrate` | `src/app/api/migrate/route.ts` | One-shot migration utility (idempotent, POST-only). Protected by `MIGRATE_SECRET`. Not in crons. Intentionally manual-only, but could be documented or deleted post-migration. |
| `/api/bot` | `src/app/api/bot/route.ts` | No cron schedule in `vercel.json`. Manually triggered only. The route comment says it handles `?action=summary\|popular\|bugs\|weekly-email` but no automated caller exists. |
| `/api/keep-alive` | `src/app/api/keep-alive/route.ts` | Route comment says "every 5 minutes" but `vercel.json` has no schedule for it (Vercel Pro only allows minimum 1-min crons). Not scheduled anywhere. May be called by UptimeRobot but no configuration file confirms this. |

---

## 4. Stale Cron Schedule Mismatch

| File | Issue |
|------|-------|
| `src/app/api/cron/posthog-errors/route.ts` | `vercel.json` runs this every 4 hours (`0 */4 * * *`), but `CLAUDE.md` policy states all crons should run once daily or weekly max. This runs 6×/day and may be over-consuming cron quota. |

---

## 5. i18n Translation Keys for Removed Components

In `src/lib/i18n/translations/en.ts`:
- Line 170: `// BringSelector` comment section — translations for a component that no longer exists in the slide system
- Line 201: `// TypeCoverageMatrix` comment section — translations for a component that is not imported anywhere

These orphaned keys exist in all 7 language files (`en`, `es`, `fr`, `it`, `ja`, `ko`, `zh`).

---

## 6. TODO / FIXME Comments

No `TODO`, `FIXME`, `HACK`, or `XXX` comments were found in any `.ts` or `.tsx` file.

---

## Summary Table

| Category | File(s) | Severity |
|----------|---------|----------|
| Orphaned slide component | `TeamCoverageSlide.tsx` | High — delete |
| Orphaned slide component | `TeamComparisonSlide.tsx` | High — delete |
| Orphaned card component | `OpponentPokemonCard.tsx` | High — delete |
| Orphaned component | `BringSelector.tsx` | High — delete |
| Orphaned component | `TypeCoverageMatrix.tsx` | High — delete |
| Dead utility | `src/lib/sharing/passcode.ts` | High — implement or delete |
| Dead utility | `src/lib/security/csrf-client.ts` | Medium — wire up or delete |
| No-caller API route | `/api/print-outline` | Medium |
| No-caller API route | `/api/oembed` | Low (protocol endpoint) |
| Unscheduled API route | `/api/keep-alive` | Medium — confirm UptimeRobot or add cron |
| Unscheduled API route | `/api/bot` | Low — manual-only, document intent |
| One-shot migration | `/api/migrate` | Low — delete if migration complete |
| Orphaned i18n keys | `en.ts` lines 170, 201 + 6 other locale files | Low |
| Cron overuse | `posthog-errors` running 6×/day | Medium — align with daily policy |
