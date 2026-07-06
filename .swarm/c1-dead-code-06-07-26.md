# C1 — Dead Code Scan (2026-07-06)

## High confidence (safe to delete) — ~363 LOC total

### 1. `src/components/display/DisplayTogglePill.tsx` (267 LOC, ORPHAN)
Zero importers. Sole file in `src/components/display/`.

### 2. `src/lib/hooks/useGlobalDisplayPrefs.ts` (51 LOC, ORPHAN)
Only referenced by DisplayTogglePill (also orphan). Sole file in `src/lib/hooks/`.

### 3. `src/components/providers/ConsentGate.tsx` (37 LOC, ORPHAN)
Zero importers. `PostHogProvider` self-gates via `hasAnalyticsConsent()` / `onConsentChange()`.

### 4. `isRateLimited` sync function (~8 LOC)
Only its own test file imports it. JSDoc admits "prefer `isRateLimitedAsync`."

## npm deps with zero imports: NONE
## Wave 2 candidate: HIGH confidence — delete #1, #2, #3 (3 files, ~355 LOC).
