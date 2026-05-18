{
  "embeds": [{
    "title": "🤖 Nightly Swarm — 18 May 2026",
    "color": 5763719,
    "fields": [
      { "name": "Branch", "value": "swarm-nightly-2026-05-18", "inline": true },
      { "name": "Commits pushed", "value": "11", "inline": true },
      { "name": "Build status", "value": "✅ Passing", "inline": true },
      { "name": "🚨 Critical bug fixed", "value": "VGC-195: share INSERT column mismatch — owner_id corrupted on all shares since 17-05-26. DB repair script at .swarm/drafts/vgc195-db-repair.sql — run before merging.", "inline": false },
      { "name": "Linear tickets implemented", "value": "VGC-127: /notifications feed page\nVGC-125: Welcome email (Clerk webhook)\nVGC-126: Weekly digest cron\nVGC-121: ShareModal i18n (49 strings)\nVGC-195: Critical bug filed + fixed", "inline": false },
      { "name": "Linear tickets filed (Backlog)", "value": "VGC-196 to VGC-200 — notifications gaps, TeamCardExport errors, i18n, prefs persistence", "inline": false },
      { "name": "Updates page", "value": "7 entries added to May 2026 (v5.17)", "inline": false },
      { "name": "Merge conflicts", "value": "None", "inline": false },
      { "name": "Rejected changes", "value": "None", "inline": false },
      { "name": "PR", "value": "https://github.com/MSS23/VGC-Team-Report/pull/32", "inline": false },
      { "name": "What was pushed", "value": "• Fixed critical share INSERT bug corrupting owner_id\n• Added /notifications feed page (Today/This Week/Older grouping)\n• Clerk webhook sends welcome email on signup\n• Monday weekly digest cron (personalized + trending fallback)\n• ShareModal fully internationalised (49 strings)\n• Newsletter stores signups in DB when Resend unconfigured\n• TypeScript config fixed to exclude Cypress", "inline": false }
    ],
    "footer": { "text": "vgc-overnight-swarm • channel 1487202217298493493 • Review and merge to main when ready" }
  }]
}
