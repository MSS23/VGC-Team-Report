# Swarm Research Synthesis — 18-05-26

## Board State
- In Progress: VGC-64 (no-claude — skip)
- All prior big tickets (VGC-190, VGC-152, VGC-116) DONE from 17-05-26 run

## CRITICAL BUG FIXED THIS RUN
**VGC-195**: share/route.ts INSERT column mismatch — owner_id received `false` on all new shares since 17-05-26.
- Fixed: added `is_unlisted` to column list, removed duplicate extractSpecies
- DB repair still needed: rows between 17-05-26 push and tonight's fix have owner_id='false'
- DB repair script drafted in .swarm/drafts/

## Wave 1 Findings

### C5 Code Review (18-05-26)
1. ✅ FIXED: share INSERT column mismatch (VGC-195)
2. ✅ FIXED: Duplicate extractSpecies → canonical import used
3. ⏳ Newsletter silently drops signups when RESEND_API_KEY unset (returns 200, writes nothing)
4. ⏳ Cypress types missing (pre-existing tsconfig gap)
5. ⏳ TeamCardExport has no error handling for failed sprite loads

### i18n Audit
- 290+ keys already extracted in en.ts
- 26 components already use useTranslation hook
- ShareModal.tsx (817 lines) = zero translations — biggest gap
- ExploreFilters.tsx has 4 hardcoded array labels

### Notifications Design
- NotificationBell already exists ✓
- /dashboard/notifications page exists (preferences only, localStorage) ✓
- Missing: actual notifications FEED page (list of who reacted/commented/followed)
- Missing: PATCH schema uses uuid[] but IDs are integers → silent failure
- Missing: collab_invite icon in TYPE_ICONS

### Clerk Webhook (Welcome Email)
- No new packages needed — @clerk/nextjs v7 includes verifyWebhook
- CLERK_WEBHOOK_SIGNING_SECRET needed
- Middleware already has /api/webhooks/* public

### Weekly Digest Architecture  
- New cron: POST /api/cron/weekly-digest (0 9 * * 1)
- Clerk API to resolve user emails per share.owner_id
- Per-user engagement SQL: reactions/comments/follows past 7 days
- Fallback: top 5 trending teams for 0-activity users

## Top 5 Opportunities Tonight
1. Notifications feed page (/notifications) + PATCH fix
2. Clerk welcome email webhook (Day 0 activation email)
3. Weekly digest cron
4. ShareModal i18n extraction
5. Newsletter DB fallback fix

## PostHog: Unavailable (no .env.local — 4th consecutive run)
