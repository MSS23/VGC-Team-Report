# Swarm Research Synthesis — 19-05-26

## Board State
- In Progress: VGC-127 (DONE 18-05-26), VGC-195 (DONE 18-05-26), VGC-64 (no-claude, skip)
- Already Done but not moved in Linear: VGC-191, VGC-197, VGC-196, VGC-194, VGC-192
- Indianapolis Regionals (VGC-181): tournament is 29-31 May 2026, 10 days away — data still TBD

## P0 BUG TONIGHT — Must fix before anything else
**HTML/XSS injection in weekly digest email template** (src/app/api/cron/weekly-digest/route.ts):
- Lines 128, 173: `${title}` and `${name}` from DB/Clerk embedded directly in HTML strings
- title = COALESCE(data->>'tournamentName', data->>'creatorName') — user-controlled input
- name = firstName from Clerk — user-settable  
- Fix: Add escapeHtml() helper, apply to all user-controlled strings in template

## Top 5 Highest-Leverage Opportunities Tonight
1. **P0 Security**: HTML escape weekly digest email templates
2. **VGC-198**: TeamCardExport error handling for failed sprite loads
3. **VGC-199**: i18n ExploreFilters (CATEGORIES, SORT_OPTIONS, PLACEMENTS)
4. **Feature SEO**: noindex for /notifications + canonical for /feedback
5. **Feature A11y**: NotificationsContent semantic list + aria-live; NotificationBell aria-expanded

## C4 Security Additional Findings
- Email header injection via RESEND_FROM_EMAIL (no CRLF protection)
- Cron missing rate-limiting guard (could be triggered rapidly by valid CRON_SECRET)
- Both are minor compared to the HTML injection P0

## C5 Also Found
- Newsletter route inserts to non-existent table and returns 200 OK (already noted in 18-05-26 synthesis)
- These need manual investigation with DB access

## PostHog: Unavailable (no .env.local — 5th consecutive run)

## Conflict-Risk Files for Tonight
- src/app/api/cron/weekly-digest/route.ts (NEW in 18-05-26 — touching for security fix)
- src/components/ui/NotificationBell.tsx (MODIFIED 18-05-26 — touching for a11y)
- src/app/notifications/NotificationsContent.tsx (NEW 18-05-26 — touching for a11y)
