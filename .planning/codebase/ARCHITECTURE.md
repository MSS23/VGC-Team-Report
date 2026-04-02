# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Next.js App Router monolith with serverless API routes, deployed on Vercel

**Key Characteristics:**
- Single-page application feel with client-heavy rendering (`"use client"` on main page)
- Next.js App Router for file-based routing and API routes
- Serverless functions for all backend logic (Neon Postgres, Upstash Redis, Clerk auth)
- No ORM -- raw SQL via `@neondatabase/serverless` tagged template literals
- State managed entirely through React hooks (no Redux, Zustand, or global store)
- PWA-capable with service worker, install prompt, and offline detection

## Layers

**Presentation (Client Components):**
- Purpose: UI rendering, user interaction, client-side state
- Location: `src/components/`, `src/app/page.tsx`
- Contains: React components using `"use client"` directive
- Depends on: Hooks layer, lib/types, lib/data, lib/utils
- Used by: App Router pages

**Hooks (Client State Management):**
- Purpose: Encapsulate all client-side state logic, persistence, and derived data
- Location: `src/hooks/`
- Contains: 23 custom hooks covering team data, UI modes, sharing, navigation
- Depends on: lib/utils, lib/types, lib/sharing, lib/analysis
- Used by: Page components (primarily `src/app/page.tsx` via `useHomePage`)
- Key pattern: `useHomePage` is the master orchestrator hook that composes all other hooks

**API Routes (Serverless Backend):**
- Purpose: CRUD operations, external integrations, cron jobs
- Location: `src/app/api/`
- Contains: ~30 route handlers using Next.js Route Handlers (`route.ts`)
- Depends on: lib/db, lib/cache, lib/rate-limit, lib/security, lib/notifications
- Used by: Client components via `fetch()`

**Domain Logic (Shared Libraries):**
- Purpose: Pokemon parsing, analysis, data lookups, utilities
- Location: `src/lib/`
- Contains: Parser, stat calculator, type chart, sharing codec, security
- Depends on: lib/types, lib/data
- Used by: Both client components and API routes

**Static Data:**
- Purpose: Pokemon game data (types, moves, abilities, natures, items)
- Location: `src/lib/data/`
- Contains: TypeScript modules exporting static lookup maps/arrays
- Depends on: Nothing
- Used by: Parser, analysis, components

## Data Flow

**Team Creation Flow:**
1. User pastes Showdown format text into `PasteInput` component (`src/components/input/PasteInput.tsx`)
2. `useTeamReport` hook (`src/hooks/useTeamReport.ts`) calls `parseShowdownPaste()` from `src/lib/parser/showdown-parser.ts`
3. Parser produces `ParsedTeam` with `ParsedPokemon[]` and warnings
4. Analysis layer (`src/lib/analysis/stat-calculator.ts`, `src/lib/analysis/item-boosts.ts`) enriches into `TeamAnalysis`
5. `useHomePage` (`src/hooks/useHomePage.ts`) orchestrates additional state: notes, calcs, matchup plans, meta
6. Components render the analyzed team as slides (overview, per-Pokemon details, coverage, speed tiers, matchups)

**Share/Save Flow:**
1. User clicks Share in UI, triggering `useShareFlow` hook (`src/hooks/useShareFlow.ts`)
2. State is serialized via `src/lib/sharing/url-codec.ts` (compressed + base64url encoded)
3. POST to `/api/share` (`src/app/api/share/route.ts`) stores in Neon Postgres `shares` table
4. Returns share ID; URL becomes `/s/{id}`
5. Shared report page (`src/app/s/[id]/page.tsx`) loads data server-side for SEO metadata, then redirects to home page with share ID in URL params
6. Home page detects share params, fetches from `/api/share/[id]`, and hydrates all hooks

**Explore/Discovery Flow:**
1. `/explore` page (`src/app/explore/page.tsx`) renders `ExploreContent` component
2. Client fetches `/api/explore` with filter/sort/search params
3. API route queries Postgres with full-text search (`search_vector` tsvector column)
4. Results cached in Upstash Redis (`CacheKeys.explore`, 60s TTL)
5. Cursor-based pagination for infinite scroll

**State Management:**
- All client state lives in hooks, persisted to `localStorage` where appropriate
- No global state store; `useHomePage` is the composition root
- Single React context: `VersionDiffContext` (`src/lib/contexts/VersionDiffContext.tsx`) for version comparison mode
- Auth state managed by Clerk (`@clerk/nextjs`) with `ClerkProvider` at root layout
- I18n via custom context in `src/lib/i18n/index.ts` with lazy-loaded translation modules

## Key Abstractions

**ShareableState:**
- Purpose: The canonical shape of a team report's saveable data
- Definition: `src/lib/sharing/url-codec.ts` (`ShareableState` interface)
- Contains: paste, notes, calcs, roles, matchup plans, meta (tournament, creator, tags)
- Pattern: Serialized to JSON, compressed, stored in Postgres `shares.data` as JSONB

**ParsedPokemon / TeamAnalysis:**
- Purpose: Typed representation of a Pokemon team from Showdown format
- Definition: `src/lib/types/pokemon.ts`, `src/lib/types/analysis.ts`
- Pattern: Parse raw text -> `ParsedTeam` -> enrich with base stats -> `TeamAnalysis`

**API Guard:**
- Purpose: Reusable security middleware for API routes
- Definition: `src/lib/security/api-guard.ts`
- Pattern: Call `apiGuard(request, options)` at top of route handler; returns error response or null

**Cache Layer:**
- Purpose: Upstash Redis abstraction with graceful fallback
- Definition: `src/lib/cache.ts`
- Pattern: `cacheGet`/`cacheSet`/`cacheDel` with typed keys via `CacheKeys` builder and `CacheTTL` constants

## Entry Points

**Home Page (`src/app/page.tsx`):**
- Location: `src/app/page.tsx`
- Triggers: Direct navigation, share URL redirect
- Responsibilities: Team building, editing, viewing shared reports
- Pattern: `Home` -> `I18nProvider` -> `Suspense` -> `HomeContent` (massive client component)
- The `HomeContent` function is the app's primary UI surface

**Root Layout (`src/app/layout.tsx`):**
- Location: `src/app/layout.tsx`
- Triggers: Every page load
- Responsibilities: ClerkProvider, fonts, SEO metadata, PWA components, analytics
- Wraps all pages with: `ClerkProvider`, `JsonLd`, `InstallPrompt`, `ConnectivityStatus`, `Analytics`, `SpeedInsights`, `ServiceWorkerRegistration`

**Share Redirect (`src/app/s/[id]/page.tsx`):**
- Location: `src/app/s/[id]/page.tsx`
- Triggers: Visiting a shared report URL
- Responsibilities: Server-side metadata generation for SEO/OG, client redirect to home with share params

**API Routes (`src/app/api/`):**
- Location: `src/app/api/*/route.ts`
- Triggers: Client `fetch()` calls, Vercel cron, external webhooks
- Pattern: Each route exports HTTP method handlers (GET, POST, PUT, DELETE)

## Error Handling

**Strategy:** Try-catch at route/component boundaries with graceful degradation

**Patterns:**
- API routes: try-catch wrapping entire handler, return `NextResponse.json({ error }, { status })`, log with `console.error`
- Cache/notifications: Silent failure -- never block main operations (`src/lib/cache.ts`, `src/lib/notifications.ts`)
- Rate limiting: In-memory rate limiter (`src/lib/rate-limit.ts`) returns 429 before processing
- Input validation: Zod schemas at API boundaries (`z.object().safeParse()` in route handlers)
- Global error boundary: `src/app/error.tsx` and `src/app/global-error.tsx` for unhandled client errors
- Sentry integration for production error tracking (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)

## Routing Strategy

**App Router (file-based):**
- Pages: `/`, `/explore`, `/dashboard`, `/champions`, `/changelog`, `/compare`, `/creator/[name]`, `/embed/[id]`, `/feedback`, `/privacy`, `/s/[id]`
- Dynamic segments: `[id]`, `[name]`, `[pokemon]`, `[shareId]`, `[commentId]`, `[version]`
- API routes: 30+ endpoints under `/api/`
- Cron routes: `/api/cron/daily-ops`, `/api/cron/weekly-report`, `/api/keep-alive`, `/api/cleanup`

**Server vs Client rendering:**
- Most pages use Server Components for metadata + Client Components for interactivity
- Home page is fully client-rendered (`"use client"`)
- `/explore`, `/dashboard`, `/champions` use server component wrapper for metadata, client component for content
- `/s/[id]` does server-side DB query for OG metadata, then client-redirects

## Cross-Cutting Concerns

**Authentication:** Clerk (`@clerk/nextjs`) -- `ClerkProvider` at root, `auth()` / `currentUser()` in API routes, `useAuth()` in client. Used for report ownership, saved reports, follows, notifications, collaborators.

**Caching:** Two-tier -- Upstash Redis for API response caching (explore, shares, spotlight), browser localStorage for client preferences (dark mode, language, notes).

**Rate Limiting:** In-memory (`src/lib/rate-limit.ts`) per serverless instance. Applied per IP in API routes via `isRateLimited()` or `apiGuard()`.

**Security:** Comprehensive CSP headers in `next.config.ts`. CSRF protection (`src/lib/security/csrf.ts`). Input validation with Zod. API guard pattern (`src/lib/security/api-guard.ts`). Edit token verification for share mutations. Passcode protection for private shares (`src/lib/sharing/passcode.ts`).

**Internationalization:** Custom i18n with 7 languages (en, fr, it, es, ja, ko, zh). Lazy-loaded translation modules. `I18nProvider` context wraps home page. `useTranslation()` hook for access.

**Monitoring:** Sentry for error tracking (client, server, edge configs). Vercel Analytics + Speed Insights. Discord webhook notifications for builds and cron results.

**Logging:** `console.log` / `console.warn` / `console.error` -- no structured logging framework.

**Validation:** Zod schemas at API route boundaries. Input sanitization in `src/lib/security/input-validation.ts`. Word filter in `src/lib/utils/word-filter.ts`.

---

*Architecture analysis: 2026-04-02*
