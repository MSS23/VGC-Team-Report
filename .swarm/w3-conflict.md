# W3 — Conflict Report

## Status
- **My 5 changes succeeded** and pass `tsc --noEmit` in isolation.
- **Build (`npm run build`) currently fails**, but the failures are in files NOT touched by W3.

## Build/tsc errors found AFTER W3 edits

```
src/components/ui/NotificationBell.tsx(78,13): error TS7030: Not all code paths return a value.
src/hooks/useShareUrl.ts(147,13): error TS7030: Not all code paths return a value.
src/lib/linear.ts(135,55): error TS18046: 'labelsData' is of type 'unknown'.
src/lib/linear.ts(151,21): error TS18046: 'createLabel' is of type 'unknown'.
src/lib/linear.ts(179,15): error TS18046: 'teamData' is of type 'unknown'.
src/lib/linear.ts(183,17): error TS18046: 'teamData' is of type 'unknown'.
src/lib/linear.ts(219,10): error TS18046: 'result' is of type 'unknown'.
```

## Verification: errors are NOT caused by W3
I temporarily stashed my five edits, reinstalled `jspdf`, and ran `npm run build`.
Result: `NotificationBell.tsx:78:13` failed in exactly the same way — **the error exists in the workdir even without W3's changes**.

`src/lib/linear.ts` errors are introduced by another agent's diff that casts `await res.json()` to `unknown` (visible via `git diff HEAD -- src/lib/linear.ts`).

`tsconfig.json` is also modified by another agent — probably the trigger for the new `TS7030` strictness errors in `NotificationBell.tsx` / `useShareUrl.ts`.

## W3's own changes (clean)
- Deleted `src/components/display/DisplayTogglePill.tsx` (+ empty dir)
- Deleted `src/lib/hooks/useGlobalDisplayPrefs.ts` (+ empty dir)
- Removed `exportAsPdf` + `getJsPDF` from `src/lib/utils/export-report.ts`
- Removed `jspdf` from `package.json` and `package-lock.json` (15 packages removed)
- Zero remaining references to `DisplayTogglePill`, `useGlobalDisplayPrefs`, `getJsPDF`, or `jspdf` in `src/` (orphaned i18n key `exportAsPdf:` in 7 translation files is unused but out of scope — string literal coincidentally shares the name).
