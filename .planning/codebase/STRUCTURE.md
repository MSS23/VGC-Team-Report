# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
VGC Team Report/
├── .claude/              # Claude Code config, commands, scripts, skills
├── .github/              # GitHub config
├── .planning/            # Planning and codebase analysis docs
├── cypress/              # E2E test suite
│   ├── e2e/              # Test specs
│   ├── fixtures/         # Test data
│   └── support/          # Cypress helpers
├── public/               # Static assets (icons, manifest, SW, robots.txt)
├── scripts/              # Utility scripts (Discord bot registration)
├── src/                  # Application source code
│   ├── app/              # Next.js App Router (pages + API routes)
│   ├── components/       # React components organized by domain
│   ├── hooks/            # Custom React hooks (23 hooks)
│   └── lib/              # Shared libraries, utilities, data
├── CLAUDE.md             # Project instructions for Claude
├── cypress.config.ts     # Cypress configuration
├── eslint.config.mjs     # ESLint flat config
├── next.config.ts        # Next.js configuration (CSP headers, optimizations)
├── package.json          # Dependencies and scripts
├── postcss.config.mjs    # PostCSS config (Tailwind v4)
├── sentry.client.config.ts  # Sentry browser config
├── sentry.server.config.ts  # Sentry server config
├── sentry.edge.config.ts    # Sentry edge runtime config
├── tsconfig.json         # TypeScript configuration
├── vercel.json           # Vercel cron schedules
└── vitest.config.ts      # Vitest unit test configuration
```

## Directory Purposes

**`src/app/` -- Next.js App Router:**
- Purpose: Pages and API route handlers
- Contains: `page.tsx`, `layout.tsx`, `route.ts` files following App Router conventions
- Key files:
  - `src/app/page.tsx`: Home page (main team builder/viewer, ~500 lines)
  - `src/app/layout.tsx`: Root layout with ClerkProvider, analytics, PWA components
  - `src/app/error.tsx`: Client error boundary
  - `src/app/global-error.tsx`: Global error boundary
  - `src/app/not-found.tsx`: 404 page
  - `src/app/sitemap.ts`: Dynamic sitemap generation
  - `src/app/opengraph-image.tsx`: Default OG image generation
  - `src/app/globals.css`: Tailwind v4 CSS with custom theme tokens

**`src/app/api/` -- API Routes (30+ endpoints):**
- Purpose: Serverless backend for all data operations
- Key route groups:
  - `src/app/api/share/` -- CRUD for team reports (create, read, update with versions)
  - `src/app/api/share/[id]/` -- Single report operations
  - `src/app/api/share/[id]/collaborators/` -- Collaborator management
  - `src/app/api/share/[id]/versions/` -- Version history and revert
  - `src/app/api/explore/` -- Browse/search public reports
  - `src/app/api/comments/` -- Comment CRUD and flagging
  - `src/app/api/reactions/` -- Emoji reactions on reports
  - `src/app/api/views/` -- View count tracking
  - `src/app/api/user/` -- User-specific endpoints (profile, saved, collections, follow, notifications, analytics, search)
  - `src/app/api/creator/` -- Public creator profiles
  - `src/app/api/pokepaste/` -- Proxy for pokepast.es imports
  - `src/app/api/bot/` -- Discord bot interaction handler
  - `src/app/api/discord/` -- Discord integration
  - `src/app/api/feedback/` -- User feedback submission
  - `src/app/api/spotlight/` -- Featured/spotlight reports
  - `src/app/api/team-graphic/` -- Team image generation
  - `src/app/api/print-outline/` -- PDF export outline data
  - `src/app/api/oembed/` -- oEmbed endpoint for embeds
  - `src/app/api/sync/` -- Real-time collaborative sync
  - `src/app/api/changelog/` -- Report edit changelog
  - `src/app/api/cron/daily-ops/` -- Daily health check cron
  - `src/app/api/cron/weekly-report/` -- Weekly summary cron
  - `src/app/api/keep-alive/` -- Database keep-alive cron
  - `src/app/api/cleanup/` -- Stale data cleanup cron
  - `src/app/api/setup/` -- Database migration endpoint
  - `src/app/api/migrate/` -- Data migration utilities
  - `src/app/api/webhooks/linear/` -- Linear webhook handler

**`src/app/` -- Page Routes:**
- `src/app/explore/page.tsx`: Browse public team reports
- `src/app/dashboard/page.tsx`: User dashboard (auth required)
- `src/app/dashboard/profile/`: User profile settings
- `src/app/champions/page.tsx`: Pokemon Champions game support
- `src/app/champions/[pokemon]/page.tsx`: Per-Pokemon Champions pages
- `src/app/changelog/page.tsx`: App version changelog
- `src/app/compare/page.tsx`: Side-by-side team comparison
- `src/app/creator/[name]/page.tsx`: Public creator profile
- `src/app/embed/[id]/page.tsx`: Embeddable team view
- `src/app/feedback/page.tsx`: Feedback submission form
- `src/app/privacy/page.tsx`: Privacy policy
- `src/app/s/[id]/page.tsx`: Share redirect (SSR metadata -> client redirect)

**`src/components/` -- React Components (organized by domain):**
- `src/components/report/` -- Core team report rendering (24 files)
  - `TeamReport.tsx`: Main report container with slide system
  - `TeamOverview.tsx`: Team grid overview slide
  - `PokemonCard.tsx`: Individual Pokemon card in overview
  - `PokemonDetailSlide.tsx`: Detailed per-Pokemon slide
  - `TournamentMode.tsx`: Tournament presentation mode
  - `MatchupPlanSlide.tsx`: Matchup planning slide
  - `MatchupSheet.tsx` / `MatchupSheetRow.tsx`: Matchup grid
  - `TeamCoverageSlide.tsx` / `DefensiveCoverageChart.tsx` / `OffensiveCoverageChart.tsx`: Type coverage
  - `SpeedTierChart.tsx`: Speed comparison chart
  - `TypeBadge.tsx` / `TypeCoverageMatrix.tsx`: Type display components
  - `PokemonSprite.tsx`: Pokemon sprite rendering
  - `ItemIcon.tsx`: Item icon display
  - `CalcInput.tsx`: Damage calculation input
  - `BringSelector.tsx`: Team bring selector for matchups
  - `SlideNavControls.tsx`: Slide navigation controls
  - `TeamStats.tsx`: Team statistics
  - `TeamComparisonSlide.tsx`: Team comparison view
- `src/components/ui/` -- Generic UI components (21 files)
  - `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Toggle.tsx`: Base UI primitives
  - `ShareModal.tsx`: Share/export dialog
  - `PdfExport.tsx`: PDF/image export (uses html2canvas-pro + jspdf)
  - `WalkthroughOverlay.tsx`: First-time user tutorial
  - `ShortcutHintOverlay.tsx`: Keyboard shortcuts display
  - `DiffNavigator.tsx`: Version diff navigation
  - `ThemePicker.tsx`: Theme/accent color selector
  - `LanguageSelector.tsx`: i18n language picker
  - `NotificationBell.tsx`: Notification dropdown
  - `PasscodeModal.tsx`: Passcode-protected share dialog
  - `InstallPrompt.tsx`, `ServiceWorkerRegistration.tsx`, `ConnectivityStatus.tsx`: PWA components
  - `EditFab.tsx`: Floating edit button
  - `PullToRefresh.tsx`, `SwipeHint.tsx`: Mobile gesture components
  - `WhatsNewModal.tsx`: Changelog popup
  - `ShareViewCTA.tsx`: Call-to-action for sharing
- `src/components/social/` -- Social features (12 files)
  - `CommentSection.tsx`: Comments on shared reports
  - `ReactionBar.tsx`: Emoji reactions
  - `ViewCount.tsx`: View counter
  - `SaveButton.tsx`: Bookmark/save report
  - `FollowButton.tsx`: Follow creator
  - `CreatorLink.tsx`: Link to creator profile
  - `CreatorProfile.tsx`: Creator profile card
  - `ClaimButton.tsx`: Claim report ownership
  - `CollaboratorPanel.tsx`: Manage collaborators
  - `EditChangelog.tsx`: Edit history display
  - `VersionHistory.tsx` / `VersionHistoryPanel.tsx`: Version comparison
- `src/components/input/` -- Input components (1 file)
  - `PasteInput.tsx`: Team paste input with PokePaste import, sample team
- `src/components/layout/` -- Layout components (3 files)
  - `Navbar.tsx`: Main navigation bar (used on home page)
  - `PageNavbar.tsx`: Navigation bar for sub-pages
  - `PageFooter.tsx`: Footer component
- `src/components/explore/` -- Explore page components (6 files)
  - `ExploreContent.tsx`: Main explore page client component
  - `ExploreHero.tsx`: Hero section with search
  - `ExploreFilters.tsx`: Filter controls
  - `ExploreEmpty.tsx`: Empty state
  - `ReportCard.tsx`: Report card in listing
  - `SpotlightCard.tsx`: Featured report card
- `src/components/compare/` -- Team comparison (1 file)
  - `CompareContent.tsx`: Side-by-side team comparison
- `src/components/seo/` -- SEO components (1 file)
  - `JsonLd.tsx`: JSON-LD structured data helper

**`src/hooks/` -- Custom React Hooks (23 files):**
- Purpose: All client-side state management and business logic
- Master hook: `useHomePage.ts` composes all others
- Team data: `useTeamReport.ts`, `usePokemonNotes.ts`, `useDamageCalcs.ts`, `useMatchupPlans.ts`, `useTeamMeta.ts`, `useHiddenSlides.ts`
- UI state: `useCreatorMode.ts`, `usePresentationMode.ts`, `useDarkMode.ts`, `useTheme.ts`, `useIsMobile.ts`
- Navigation: `useSlideNavigation.ts`, `useSlideSystem.ts`, `useSwipeNavigation.ts`
- Sharing: `useShareFlow.ts`, `useShareUrl.ts`, `useCollaborativeSync.ts`
- Features: `useWalkthrough.ts`, `useUndoRedo.ts`, `useExportActions.ts`, `useNotifications.ts`, `useSessionId.ts`

**`src/lib/` -- Shared Libraries:**
- `src/lib/types/` -- TypeScript type definitions
  - `pokemon.ts`: `ParsedPokemon`, `ParsedTeam`, `PokemonData`, `PokemonType`, `StatSpread`
  - `analysis.ts`: `AnalyzedPokemon`, `TeamAnalysis`
  - `sprites.ts`: Sprite configuration types
- `src/lib/parser/` -- Team text parsing
  - `showdown-parser.ts`: Pokemon Showdown format parser
- `src/lib/analysis/` -- Team analysis logic
  - `stat-calculator.ts`: EV/IV/Nature -> actual stat calculation
  - `item-boosts.ts`: Stat-modifying item effects
  - `detect-archetype.ts`: Team archetype detection (e.g., "rain", "trick room")
- `src/lib/sharing/` -- Share/persistence
  - `url-codec.ts`: `ShareableState` type + compress/decompress for URL encoding
  - `passcode.ts`: Passcode hashing/verification for private shares
- `src/lib/data/` -- Static Pokemon game data (8 files)
  - `pokemon.ts`: Pokemon base stats and type data
  - `champions-dex.ts`: Pokemon Champions Pokedex
  - `mega-pokemon.ts`: Mega Evolution data
  - `moves.ts` / `move-names.ts`: Move data and names
  - `items.ts`: Item names
  - `abilities.ts`: Ability names
  - `natures.ts`: Nature stat modifiers
  - `type-chart.ts`: Type effectiveness chart
  - `tags.ts`: Team tag/archetype definitions
- `src/lib/utils/` -- Utility functions (18 files)
  - `version-diff.ts`: Compute diffs between report versions
  - `diff-state.ts`: Detect changed sections for changelog
  - `export-paste.ts`: Export team back to Showdown format
  - `export-report.ts`: Generate text report
  - `extract-species.ts`: Extract Pokemon names from paste
  - `multi-import.ts`: Multi-team import handling
  - `pokepaste.ts`: PokePaste URL handling
  - `sanitize.ts`: HTML/input sanitization
  - `session-id.ts`: Anonymous session ID management
  - `sprite-slug.ts` / `sprite-url.ts`: Sprite URL generation
  - `stat-relevance.ts`: Determine relevant stats for display
  - `type-colors.ts`: Type -> color mapping
  - `move-type-style.ts`: Move type styling
  - `word-filter.ts`: Profanity filter
  - `random-accent.ts`: Random accent color generation
  - `relative-time.ts`: Time ago formatting
  - `haptics.ts`: Mobile haptic feedback
  - `game-plan-helpers.tsx`: Game plan component helpers
  - `translate-move.ts`: Move name translation
- `src/lib/security/` -- Security utilities (5 files)
  - `api-guard.ts`: Composable API route guard (rate limit + validation)
  - `cors.ts`: CORS header helpers
  - `csrf.ts` / `csrf-client.ts`: CSRF token generation and validation
  - `input-validation.ts`: Input sanitization and validation helpers
- `src/lib/contexts/` -- React contexts (1 file)
  - `VersionDiffContext.tsx`: Version diff comparison state
- `src/lib/i18n/` -- Internationalization
  - `index.ts`: I18nProvider, useTranslation hook, language definitions
  - `translations/`: 7 language files (en, fr, it, es, ja, ko, zh)
- Root-level lib files:
  - `src/lib/db.ts`: Neon Postgres connection + schema migrations (`ensureTable()`)
  - `src/lib/cache.ts`: Upstash Redis cache abstraction
  - `src/lib/rate-limit.ts`: In-memory rate limiter
  - `src/lib/discord-webhook.ts`: Discord notification helpers
  - `src/lib/discord-bot.ts`: Discord bot interaction handler
  - `src/lib/notifications.ts`: In-app notification creation
  - `src/lib/linear.ts`: Linear API integration
  - `src/lib/email.ts`: Email utilities
  - `src/lib/cron-auth.ts`: Cron route authentication
  - `src/lib/templates.ts`: Report template definitions
  - `src/lib/accent-themes.ts`: Accent color theme definitions

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root layout (auth, fonts, analytics, PWA)
- `src/app/page.tsx`: Home page (main app surface)
- `src/app/globals.css`: Global styles and Tailwind theme

**Configuration:**
- `next.config.ts`: Next.js config with CSP headers
- `tsconfig.json`: TypeScript config with `@/*` path alias -> `./src/*`
- `vercel.json`: Cron job schedules (4 crons)
- `eslint.config.mjs`: ESLint flat config
- `postcss.config.mjs`: PostCSS with Tailwind v4
- `vitest.config.ts`: Vitest test runner config
- `cypress.config.ts`: Cypress E2E config

**Core Logic:**
- `src/lib/parser/showdown-parser.ts`: Pokemon Showdown paste parser
- `src/lib/analysis/stat-calculator.ts`: Stat calculation engine
- `src/lib/sharing/url-codec.ts`: ShareableState type + serialization
- `src/lib/db.ts`: Database connection + full schema definition
- `src/hooks/useHomePage.ts`: Master hook composing all client state

**Database:**
- `src/lib/db.ts`: Schema defined in `ensureTable()` -- 10 tables: `shares`, `reactions`, `comments`, `verified_creators`, `comment_flags`, `creator_profiles`, `feedback`, `saved_reports`, `follows`, `notifications`, `collections`, `collection_items`, `collaborators`, `edit_changelog`, `share_versions`

## Naming Conventions

**Files:**
- Components: PascalCase (`TeamReport.tsx`, `PokemonCard.tsx`)
- Hooks: camelCase with `use` prefix (`useTeamReport.ts`, `useDarkMode.ts`)
- Utilities/lib: kebab-case (`stat-calculator.ts`, `url-codec.ts`, `rate-limit.ts`)
- Data files: kebab-case (`type-chart.ts`, `mega-pokemon.ts`)
- API routes: always `route.ts` inside descriptive directories
- Pages: always `page.tsx` inside route directories
- Types: kebab-case (`pokemon.ts`, `analysis.ts`)

**Directories:**
- Components: kebab-case domain groups (`report/`, `social/`, `ui/`)
- App routes: kebab-case matching URL segments (`dashboard/`, `champions/`)
- Dynamic routes: brackets (`[id]/`, `[name]/`, `[pokemon]/`)

**Exports:**
- Components: Named exports (not default), PascalCase
- Hooks: Named exports, camelCase with `use` prefix
- Utils: Named function exports, camelCase
- Types: Named type/interface exports, PascalCase
- Exception: Page components use `export default function`

## Where to Add New Code

**New Page:**
- Create directory: `src/app/{route-name}/page.tsx`
- Add server component wrapper with `Metadata` export for SEO
- Add client component in same directory or `src/components/{domain}/`
- Use `PageNavbar` and `PageFooter` from `src/components/layout/`

**New API Route:**
- Create: `src/app/api/{resource}/route.ts`
- Export async functions for HTTP methods: `GET`, `POST`, `PUT`, `DELETE`
- Use `apiGuard()` from `src/lib/security/api-guard.ts` for rate limiting
- Use `getDb()` from `src/lib/db.ts` for database access
- Validate input with Zod schemas
- Follow pattern from existing routes (e.g., `src/app/api/share/route.ts`)

**New Component:**
- Place in appropriate domain directory under `src/components/`
- `report/` for team report rendering components
- `ui/` for generic/reusable UI components
- `social/` for social interaction features
- `explore/` for explore page components
- `layout/` for page layout components
- Use named exports, PascalCase filename

**New Hook:**
- Create: `src/hooks/use{Feature}.ts`
- Follow existing pattern: named export, `"use client"` if needed
- If it manages state for the home page, wire it into `useHomePage.ts`

**New Utility:**
- Place in `src/lib/utils/{feature-name}.ts` for general utilities
- Place in `src/lib/analysis/{feature-name}.ts` for Pokemon analysis logic
- Place in `src/lib/security/{feature-name}.ts` for security utilities

**New Static Data:**
- Add to `src/lib/data/{data-name}.ts`
- Export as typed constant arrays/maps

**New Database Table:**
- Add migration SQL to `ensureTable()` in `src/lib/db.ts`
- Use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` pattern for safe migrations
- Add indexes for query patterns

**New Tests:**
- Unit tests: co-located in `__tests__/` directory next to source (e.g., `src/lib/parser/__tests__/`)
- E2E tests: `cypress/e2e/`
- Name: `{module}.test.ts` for unit, `{feature}.cy.ts` for E2E

## Special Directories

**`.claude/`:**
- Purpose: Claude Code configuration, commands, agents, skills
- Generated: No (manually maintained)
- Committed: Yes

**`.planning/`:**
- Purpose: Planning documents and codebase analysis
- Generated: By planning tools
- Committed: Yes

**`public/`:**
- Purpose: Static assets served at root URL (icons, manifest, service worker, robots.txt)
- Generated: No
- Committed: Yes

**`cypress/screenshots/`:**
- Purpose: Cypress test failure screenshots
- Generated: Yes (by test runs)
- Committed: Partial (gitignore may vary)

---

*Structure analysis: 2026-04-02*
