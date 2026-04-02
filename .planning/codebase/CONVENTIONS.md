# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- Components: PascalCase (`PokemonCard.tsx`, `ShareModal.tsx`, `ExploreContent.tsx`)
- Hooks: camelCase with `use` prefix (`useTeamReport.ts`, `useDarkMode.ts`, `useSlideSystem.ts`)
- Utilities: kebab-case (`sprite-slug.ts`, `word-filter.ts`, `move-type-style.ts`)
- Types: kebab-case (`pokemon.ts`, `analysis.ts`, `sprites.ts`)
- Data files: kebab-case (`type-chart.ts`, `champions-dex.ts`, `mega-pokemon.ts`)
- API routes: `route.ts` inside Next.js App Router directory structure
- Test files: `{module-name}.test.ts` inside `__tests__/` directories

**Functions:**
- Use camelCase: `parseShowdownPaste`, `calculateStat`, `resolveSlug`, `isRateLimited`
- Boolean functions: prefix with `is`, `has`, `contains` (`isRateLimited`, `containsBlockedWords`, `containsInjection`)
- Generator functions: prefix with `generate` (`generateId`, `generateEditToken`)
- React components: PascalCase function declarations (`export function Button()`, `export function PokemonCard()`)

**Variables:**
- camelCase for local variables and state: `parsedTeam`, `creatorMode`, `darkMode`
- SCREAMING_SNAKE_CASE for constants: `STAT_COLORS`, `MAX_BODY_SIZE`, `STORAGE_KEY`, `SAMPLE_PASTE`
- Record/map constants: SCREAMING_SNAKE_CASE (`TYPE_EMOJI`, `TYPE_COLOR`)

**Types:**
- PascalCase for interfaces and types: `AnalyzedPokemon`, `ParsedPokemon`, `StatSpread`, `PokemonType`
- Interface props: `{ComponentName}Props` pattern (`ButtonProps`, `PokemonCardProps`, `CardProps`)
- Prefer `interface` for component props, `type` for unions and aliases

## Code Style

**Formatting:**
- No Prettier config detected; relies on ESLint formatting rules
- Double quotes for strings (consistent across all files)
- Semicolons required
- 2-space indentation
- Trailing commas in multi-line structures

**Linting:**
- ESLint 9 flat config at `eslint.config.mjs`
- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- No custom rules added beyond Next.js defaults
- Uses `// eslint-disable-next-line` sparingly (e.g., `react-hooks/exhaustive-deps` in `useHomePage.ts`)

## TypeScript Patterns

**Strictness:**
- `strict: true` in `tsconfig.json`
- Non-null assertions used for env vars: `process.env.DATABASE_URL!`
- Nullish coalescing (`??`) and optional chaining (`?.`) used consistently
- Zod for runtime validation at API boundaries

**Type Organization:**
- Shared types in `src/lib/types/` (3 files: `pokemon.ts`, `analysis.ts`, `sprites.ts`)
- Component props defined inline in same file as component
- API request bodies validated with Zod schemas defined in-file

**Type Patterns:**
```typescript
// Union types for enums
type PokemonType = "Normal" | "Fire" | "Water" | ...;
type StatName = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

// Interface for data shapes
interface StatSpread { hp: number; atk: number; ... }

// Component props extend HTML attributes when appropriate
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

// Zod schemas for API validation
const ShareBodySchema = z.object({
  state: z.object({ paste: z.string() }).passthrough(),
  existingId: z.string().optional(),
});
```

## Component Patterns

**Server vs Client Components:**
- Server components: page-level files (`src/app/explore/page.tsx`, `src/app/changelog/page.tsx`) for metadata export and SEO
- Client components: all interactive components marked with `"use client"` at line 1 (62 client components)
- Pure presentational components omit the directive: `Button.tsx`, `Card.tsx`, `Badge.tsx`, `Toggle.tsx`, `TypeBadge.tsx`, `JsonLd.tsx`, `OpponentPokemonCard.tsx`
- Pattern: server page imports a client content component (`ExplorePage` imports `ExploreContent`)

**Component Structure:**
```typescript
// 1. "use client" directive (if needed)
"use client";

// 2. Imports
import { ... } from "react";
import { ... } from "@/lib/...";
import { ... } from "@/components/...";

// 3. Props interface (inline, not exported unless shared)
interface PokemonCardProps {
  pokemon: AnalyzedPokemon;
  creatorMode: boolean;
}

// 4. Constants (SCREAMING_SNAKE_CASE)
const STAT_COLORS: Record<string, string> = { ... };

// 5. Named export function (not default, except pages)
export function PokemonCard({ pokemon, creatorMode }: PokemonCardProps) { ... }
```

**Dynamic Imports:**
- Heavy/conditional components lazy-loaded with `next/dynamic`: `ShareModal`, `CommentSection`, `PrintableReport`, `CollaboratorPanel`, `DiffNavigator`
- Pattern: `const ShareModal = dynamic(() => import("@/components/ui/ShareModal").then(m => ({ default: m.ShareModal })));`
- Loading skeletons provided for visible lazy components

**Custom Hooks:**
- 23 hooks in `src/hooks/` encapsulating all business logic
- Hooks compose other hooks freely (`useHomePage` composes 15+ hooks)
- Hooks return objects (not arrays) for named destructuring
- State persisted to localStorage where appropriate (`useTeamReport`, `useDarkMode`, `useTheme`)

## Import Organization

**Order:**
1. React/Next.js imports (`react`, `next/dynamic`, `next/font/google`)
2. Third-party packages (`@clerk/nextjs`, `@vercel/analytics`, `zod`)
3. Internal lib imports (`@/lib/...`)
4. Component imports (`@/components/...`)
5. Hook imports (`@/hooks/...`)
6. Type-only imports (`import type { ... }`)
7. CSS imports (`./globals.css`)

**Path Aliases:**
- `@/*` maps to `./src/*` (configured in `tsconfig.json`)
- Always use `@/` for cross-directory imports; relative imports (`./`, `../`) only for same-directory siblings

## Error Handling

**API Routes:**
- Try/catch wrapping entire handler body
- Zod `.safeParse()` for input validation with structured error responses
- Rate limiting checked before processing
- Consistent JSON error responses: `NextResponse.json({ error: "message" }, { status: 4xx })`
- Body size checks via `content-length` header

**Pattern:**
```typescript
export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    if (isRateLimited(`share:${ip}`, 20, 60_000)) {
      return NextResponse.json({ error: "Too many requests." }, { status: 429 });
    }
    const raw = await request.json();
    const parsed = ShareBodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    // ... business logic
  } catch (err) {
    console.error("Share error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Client-Side:**
- `try/catch` around localStorage operations (quota may exceed)
- Empty `catch` blocks used for non-critical failures (cache writes, analytics)
- Null checks via optional chaining for data lookups (`data?.types ?? []`)

**Cache/Infrastructure:**
- Graceful degradation: cache (`src/lib/cache.ts`) returns null when Redis unavailable
- Database helper wraps migrations in independent try/catch so one failure does not block others

## CSS/Styling Patterns

**Framework:** Tailwind CSS v4 with `@tailwindcss/postcss`

**Approach:**
- Utility-first Tailwind classes directly in JSX
- No CSS modules or styled-components
- Custom CSS variables for theming in `src/app/globals.css`
- Semantic color tokens: `--background`, `--surface`, `--accent`, `--text-primary`, etc.
- Tailwind `@theme inline` block maps CSS vars to Tailwind colors

**Custom Variants:**
```css
@custom-variant creator (&:where([data-creator-mode] *));
@custom-variant presenting (&:where([data-presentation-mode] *));
```
Used as: `creator:p-7`, `creator:gap-5` in component classes.

**Responsive Pattern:**
- Mobile-first: base styles for mobile, `sm:` / `lg:` for larger screens
- Example: `p-2.5 sm:p-6 creator:p-7`
- `100dvh` for dynamic viewport height on mobile
- Safe area insets for notched devices

**Color System:**
- Light mode default with CSS variable theming
- Dark mode support via `[data-dark]` attribute (managed by `useDarkMode` hook)
- Accent color: `#E11D48` (rose-600) with configurable accent themes (`src/lib/accent-themes.ts`)
- Stat colors as CSS variables: `--stat-hp`, `--stat-atk`, etc.

**Component Styling Pattern (no className merging library):**
```typescript
// String concatenation for conditional classes
const base = "inline-flex items-center ...";
const variants = { primary: "bg-accent ...", secondary: "bg-surface ..." };
<button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} />
```

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- `console.error()` for caught errors in API routes
- `console.warn()` for non-critical migration failures
- No client-side logging beyond error boundaries
- Sentry integration for production error tracking (`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)
- Vercel Analytics for usage tracking (`track()` from `@vercel/analytics`)

## Comments

**When to Comment:**
- Section dividers in large files using decorated comments: `// ── Core team data ───────────────`
- Inline comments for non-obvious logic (stat calculations, encoding algorithms)
- JSDoc `/** */` for utility functions explaining behavior (`@returns`, purpose)
- No TSDoc/JSDoc on component props (interface definitions serve as documentation)

**Examples from codebase:**
```typescript
/** Simple in-memory rate limiter. Returns true if the request should be BLOCKED. */
export function isRateLimited(...) { ... }

/** Strip null bytes and other control characters that could cause issues */
export function sanitizeInput(str: string): string { ... }

// Non-default IVs (not 31)
const nonDefaultIvs = ...;
```

## Function Design

**Size:** Utility functions are small and focused (5-30 lines). Hooks can be large (100+ lines) as orchestration layers.

**Parameters:** Prefer explicit parameters over options objects for <4 params. Use options objects for API guard (`ApiGuardOptions`).

**Return Values:** Functions return concrete types, not `any`. Nullable returns use `T | null`. Boolean helpers return `boolean`.

## Module Design

**Exports:** Named exports everywhere. Default exports only for Next.js pages (`export default function Home()`).

**Barrel Files:** Not used. Import directly from specific files (`@/lib/utils/sanitize`, not `@/lib/utils`).

**Singleton Pattern:** Used for Redis client (`src/lib/cache.ts`) and DB connection (`src/lib/db.ts`) via module-level variables.

## Security Patterns

**API Security Utilities:**
- `src/lib/security/api-guard.ts` — consolidated guard for rate limiting, content-type, body size
- `src/lib/security/input-validation.ts` — XSS sanitization, injection detection, IP validation
- `src/lib/security/cors.ts` — CORS headers
- `src/lib/security/csrf.ts` / `csrf-client.ts` — CSRF protection
- `src/lib/utils/word-filter.ts` — profanity filter for user-generated content
- `src/lib/utils/sanitize.ts` — HTML entity escaping

**Auth Pattern:**
- Clerk for user authentication (`@clerk/nextjs`)
- Cron routes use `user-agent` or `CRON_SECRET` bearer token (`src/lib/cron-auth.ts`)
- Edit tokens for anonymous share editing (crypto random, stored in DB)

## Internationalization

- Custom i18n system in `src/lib/i18n/` (not next-intl or i18next)
- 7 languages supported (EN, FR, IT, ES, JA, KO, ZH)
- Translation files lazy-loaded to reduce bundle size
- React context + `useTranslation()` hook pattern
- Translation keys typed via `TranslationKeys` interface

---

*Convention analysis: 2026-04-02*
