# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

**Pokemon Showdown (Sprites):**
- Used for all Pokemon sprite images (animated GIFs and static PNGs)
- Base URL: `https://play.pokemonshowdown.com/sprites`
- Client: Direct fetch with slug resolution (`src/lib/utils/sprite-url.ts`)
- Auth: None (public CDN)
- Supports gen-themed sprites (gen1 through gen9 visual styles)

**PokePaste (Team Import):**
- Proxy endpoint fetches team pastes from `https://pokepast.es`
- Route: `src/app/api/pokepaste/route.ts`
- Fetches both raw paste text and HTML page (for title extraction)
- User-Agent: `VGC-Team-Report/1.0`
- Auth: None (public API)

**Linear (Project Management):**
- GraphQL API at `https://api.linear.app/graphql`
- Client: `src/lib/linear.ts` (direct fetch, no SDK)
- Used for: Auto-creating issues from user feedback, triage with priority escalation
- Incoming webhook: `src/app/api/webhooks/linear/route.ts`
- Auth: `LINEAR_API_KEY` env var (personal API key)
- Also requires: `LINEAR_TEAM_ID` env var

**Discord (Notifications & Bot):**
- **Webhooks** (`src/lib/discord-webhook.ts`):
  - `DISCORD_BUILDS_WEBHOOK` - Build/deploy notifications to #builds channel
  - `DISCORD_FEEDBACK_WEBHOOK` - User feedback alerts to #feedback channel
- **Bot** (`src/lib/discord-bot.ts`):
  - REST API v10 at `https://discord.com/api/v10` (no gateway/websocket)
  - Posts rich embeds, creates threads, adds reactions for voting
  - Build notifications for CI/CD status
  - Auth: `DISCORD_BOT_TOKEN` env var
  - Channel: `DISCORD_FEEDBACK_CHANNEL_ID` env var
- **Discord OAuth**: Handled via Clerk (sign-in provider)

**Resend (Transactional Email):**
- REST API at `https://api.resend.com`
- Client: `src/lib/email.ts` (direct fetch, no SDK)
- Used for: Comment notification emails, weekly feedback summaries
- Auth: `RESEND_API_KEY` env var
- From address: `RESEND_FROM_EMAIL` env var (default: `onboarding@resend.dev`)

## Data Storage

**Neon PostgreSQL (Primary Database):**
- Client: `@neondatabase/serverless` via `src/lib/db.ts`
- Connection: `DATABASE_URL` env var
- Schema managed via code-first migrations in `ensureTable()` (`src/lib/db.ts`)
- Tables:
  - `shares` - Team reports (JSONB data, versioning, full-text search via `tsvector`)
  - `reactions` - Report reactions (emoji-style, session-based)
  - `comments` - Report comments with display names
  - `comment_flags` - Comment moderation flags
  - `feedback` - User feedback/bug reports
  - `verified_creators` - Verified creator names
  - `creator_profiles` - Creator profile metadata (bio, socials, accent theme)
  - `saved_reports` - User bookmarks (Clerk user_id -> share_id)
  - `follows` - Creator follow relationships
  - `notifications` - In-app notification system
  - `collections` / `collection_items` - Team archive folders
  - `collaborators` - Report co-editors with invite/accept flow
  - `edit_changelog` - Collaborative edit history
  - `share_versions` - Version snapshots for revert capability

**Upstash Redis (Caching):**
- Client: `@upstash/redis` via `src/lib/cache.ts`
- Connection: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env vars
- Graceful fallback: Returns null when not configured (non-fatal)
- Cache keys defined in `CacheKeys` object (`src/lib/cache.ts`):
  - `explore:{params}` - Explore page results (TTL: 60s)
  - `share:{id}` - Individual public shares (TTL: 300s)
  - `spotlight` - Featured/spotlight content (TTL: 300s)
  - `top-pokemon` - Usage statistics (TTL: 600s)

**File Storage:**
- Local filesystem only (public assets in `public/`)
- No cloud file storage integration

## Authentication & Identity

**Clerk (Auth Provider):**
- SDK: `@clerk/nextjs` ^7.0.6
- Middleware: `src/middleware.ts` (uses `clerkMiddleware`)
- Provider: `<ClerkProvider>` wraps app in `src/app/layout.tsx`
- Auth methods: OAuth (Google, Discord, Twitch - per CSP config)
- Server-side: `auth()` and `currentUser()` from `@clerk/nextjs/server`
- Custom domain: `clerk.pokemonvgcteamreport.com`

**Additional Security Layers:**
- CSRF protection: Double-submit cookie pattern (`src/lib/security/csrf.ts`)
- Rate limiting: In-memory sliding window (`src/lib/rate-limit.ts`)
- API guard: Consolidated security checks (`src/lib/security/api-guard.ts`)
- CORS: Origin validation (`src/lib/security/cors.ts`)
- Input validation: Content-type, body size, IP extraction (`src/lib/security/input-validation.ts`)
- Passcode hashing: SHA-256 via Web Crypto (`src/lib/sharing/passcode.ts`)

## Monitoring & Observability

**Sentry (Error Tracking & APM):**
- SDK: `@sentry/nextjs` ^10.45.0
- Config files:
  - `sentry.client.config.ts` - Client-side (traces 10%, replay on error 100%)
  - `sentry.server.config.ts` - Server-side (traces 10%)
  - `sentry.edge.config.ts` - Edge runtime (traces 10%)
- DSN: `NEXT_PUBLIC_SENTRY_DSN` env var
- Production only: `enabled: process.env.NODE_ENV === "production"`

**Vercel Analytics:**
- SDK: `@vercel/analytics` ^1.6.1
- Component: `<Analytics />` in root layout (`src/app/layout.tsx`)

**Vercel Speed Insights:**
- SDK: `@vercel/speed-insights` ^2.0.0
- Component: `<SpeedInsights />` in root layout (`src/app/layout.tsx`)

**UptimeRobot:**
- External service for 5-minute ping monitoring (not in codebase)

## CI/CD & Deployment

**Vercel (Hosting & CI):**
- Auto-deploy from `main` branch (trunk-based development)
- Config: `vercel.json` for cron schedules
- Config: `.vercel/` directory for project settings

**Vercel Cron Jobs (`vercel.json`):**
- `/api/keep-alive` - Daily at 12:00 UTC (database warm-up)
- `/api/cleanup` - Daily at 03:00 UTC (stale data cleanup)
- `/api/cron/daily-ops` - Daily at 09:00 UTC (health check, stale tickets, SEO audit, DB health)
- `/api/cron/weekly-report` - Fridays at 17:00 UTC (Linear digest, growth report, dependency updates)

**Cron Authentication (`src/lib/cron-auth.ts`):**
- Validates Vercel cron user-agent OR `CRON_SECRET` bearer token

## API Routes (Provided)

**Team Reports:**
- `POST /api/share` - Create/save a team report
- `GET/PUT/DELETE /api/share/[id]` - Read/update/delete a report
- `GET/POST /api/share/[id]/versions` - Version history
- `PUT /api/share/[id]/versions/[version]` - Revert to version
- `GET/POST /api/share/[id]/collaborators` - Manage collaborators
- `GET /api/sync/[id]` - Sync report data

**Social Features:**
- `GET/POST /api/comments/[shareId]` - Report comments
- `DELETE /api/comments/[shareId]/[commentId]` - Delete comment
- `POST /api/comments/flag` - Flag inappropriate comment
- `GET/POST /api/reactions/[shareId]` - Report reactions
- `GET/POST /api/views/[shareId]` - View count tracking

**Discovery:**
- `GET /api/explore` - Browse public reports (search, filter, sort)
- `GET /api/spotlight` - Featured/spotlight reports

**User Features:**
- `GET/PUT /api/user/profile` - User profile management
- `GET /api/user/reports` - User's owned reports
- `DELETE /api/user/reports/[shareId]` - Delete own report
- `GET/POST/DELETE /api/user/saved` - Saved/bookmarked reports
- `GET/POST /api/user/follow` - Follow creators
- `GET /api/user/feed` - Activity feed
- `GET /api/user/notifications` - Notification inbox
- `GET/POST /api/user/collections` - Team collections
- `PUT/DELETE /api/user/collections/[id]` - Manage collection
- `GET /api/user/collaborations` - Reports user collaborates on
- `POST /api/user/claim` - Claim anonymous reports
- `GET /api/user/analytics` - User analytics
- `GET /api/user/search` - Search users

**Creator Profiles:**
- `GET /api/creator/[name]` - Public creator profile

**External Integrations:**
- `GET /api/pokepaste` - Proxy fetch from pokepast.es
- `POST /api/feedback` - Submit feedback (creates Linear issue + Discord notification)
- `POST /api/discord` - Discord bot interactions endpoint
- `POST /api/webhooks/linear` - Linear webhook receiver

**Utility:**
- `GET /api/keep-alive` - Database warm-up endpoint
- `POST /api/cleanup` - Stale data cleanup
- `GET /api/cron/daily-ops` - Combined daily operations
- `GET /api/cron/weekly-report` - Weekly summary generation
- `GET /api/oembed` - oEmbed metadata for rich embeds
- `GET /api/print-outline` - Print-friendly report outline
- `GET /api/changelog/[shareId]` - Edit changelog for a report
- `GET /api/bot` - Discord bot actions (summary, popular, bugs, weekly-email)
- `POST /api/setup` - Database table setup/migration
- `POST /api/migrate` - Data migrations
- `GET /api/team-graphic` - Team graphic generation

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk frontend key (inferred from Clerk usage)
- `CLERK_SECRET_KEY` - Clerk backend key (inferred from Clerk usage)

**Optional env vars (graceful degradation):**
- `CRON_SECRET` - Cron route authentication
- `CLEANUP_SECRET` - Cleanup endpoint authentication
- `LINEAR_API_KEY` - Linear API access
- `LINEAR_TEAM_ID` - Linear team identifier
- `DISCORD_BUILDS_WEBHOOK` - Discord #builds webhook URL
- `DISCORD_FEEDBACK_WEBHOOK` - Discord #feedback webhook URL
- `DISCORD_BOT_TOKEN` - Discord bot token (REST API)
- `DISCORD_FEEDBACK_CHANNEL_ID` - Discord channel for bot posts
- `UPSTASH_REDIS_REST_URL` - Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis auth token
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN
- `RESEND_API_KEY` - Resend email API key
- `RESEND_FROM_EMAIL` - Sender email address

**Secrets location:**
- `.env.local` (local development, git-ignored)
- Vercel environment variables (production)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/webhooks/linear` - Linear issue update webhooks
- `POST /api/discord` - Discord interaction endpoint (slash commands)

**Outgoing:**
- Discord webhook embeds (builds, feedback)
- Linear GraphQL mutations (issue creation)
- Resend email sends (comment notifications, weekly summaries)

## Internationalization

- i18n module: `src/lib/i18n/index.ts`
- Translations: `src/lib/i18n/translations/` (en, fr, es, it, ja, ko, zh)

---

*Integration audit: 2026-04-02*
