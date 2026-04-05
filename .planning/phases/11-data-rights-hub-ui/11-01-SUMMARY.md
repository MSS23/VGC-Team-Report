---
phase: 11-data-rights-hub-ui
plan: "01"
subsystem: dashboard-privacy
tags: [gdpr, data-rights, privacy, dashboard, ui]
dependency_graph:
  requires: []
  provides: ["/dashboard/privacy page", "data export download UI", "account deletion modal UI"]
  affects: ["DashboardContent.tsx header nav"]
tech_stack:
  added: []
  patterns: ["blob download via anchor click", "confirmation modal with exact text match", "Clerk signOut after deletion"]
key_files:
  created:
    - src/app/dashboard/privacy/page.tsx
  modified:
    - src/app/dashboard/DashboardContent.tsx
decisions:
  - "Used muted text-tertiary styling for Privacy nav link to distinguish from primary Edit Profile CTA"
  - "Exact string match DELETE required for confirmation (locked decision from plan)"
  - "Red/danger styling for all delete-related buttons (locked decision from plan)"
metrics:
  duration: "~2 minutes"
  completed: "2026-04-05"
  tasks_completed: 1
  tasks_total: 1
---

# Phase 11 Plan 01: Data Rights Hub UI Summary

Self-service Data & Privacy page at /dashboard/privacy with blob-based data export download and Clerk-integrated account deletion confirmation modal.

## What Was Built

### src/app/dashboard/privacy/page.tsx (new)
- Full client-side page following the existing dashboard sub-page pattern (I18nProvider wrapper, useDarkMode, applyRandomAccent, PageNavbar/PageFooter)
- **Download My Data** section: accent-styled button that fetches GET /api/user/export, converts response to blob, triggers download via dynamically created anchor element. Handles 429 rate limit with user-friendly message and generic error fallback.
- **Delete My Account** section: red/danger-styled button opening a confirmation modal. Modal requires user to type "DELETE" exactly before the confirm button enables. On successful DELETE /api/user/delete response, calls useClerk().signOut({ redirectUrl: "/" }) to sign out and redirect.
- Signed-out state shows a sign-in prompt matching the profile page pattern.
- Back link at top navigates to /dashboard.

### src/app/dashboard/DashboardContent.tsx (modified)
- Added "Privacy" nav link (shield icon) next to the existing "Edit Profile" link in the dashboard header. Uses muted text-tertiary styling to visually distinguish it as a secondary utility link.

## Patterns Used

| Pattern | Implementation |
|---------|---------------|
| Blob download | fetch -> res.blob() -> URL.createObjectURL -> anchor.click() -> revokeObjectURL |
| Confirmation modal | Fixed backdrop with blur, state-controlled input, exact string match gate |
| Clerk sign-out | useClerk().signOut({ redirectUrl: "/" }) after successful API deletion |
| Dashboard sub-page | I18nProvider wrapper, useDarkMode, applyRandomAccent, Show when="signed-in/out" |

## Deviations from Plan

None -- plan executed exactly as written.

## Known Stubs

None. The page calls /api/user/export and /api/user/delete which were implemented in Phases 9 and 10. The UI correctly handles error responses if those endpoints are unavailable.

## Verification

- `npx tsc --noEmit` passed with zero errors
- `npm run build` passed, /dashboard/privacy listed as static route
- Privacy nav link added to DashboardContent.tsx header

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 365cb6e | feat(11-01): add Data Rights Hub UI at /dashboard/privacy |

## Self-Check: PASSED

- [x] src/app/dashboard/privacy/page.tsx exists
- [x] Commit 365cb6e exists in git log
