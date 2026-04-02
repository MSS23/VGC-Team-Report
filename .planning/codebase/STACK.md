# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript ^5 - All application code (strict mode enabled)

**Secondary:**
- CSS (Tailwind v4) - Styling via `@tailwindcss/postcss`
- SQL - Inline via `@neondatabase/serverless` tagged templates

## Runtime

**Environment:**
- Node.js (no `.nvmrc` - version not pinned)
- Vercel serverless functions (edge + Node runtimes)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 16.1.6 - Full-stack React framework (App Router)
- React 19.2.3 - UI library
- React DOM 19.2.3 - DOM rendering

**Testing:**
- Vitest ^4.1.1 - Unit tests (`vitest.config.ts`)
- Cypress ^15.11.0 - E2E tests (`cypress.config.ts`)
- start-server-and-test ^2.1.5 - E2E test orchestration

**Build/Dev:**
- PostCSS with `@tailwindcss/postcss` ^4 (`postcss.config.mjs`)
- ESLint ^9 with `eslint-config-next` 16.1.6 (`eslint.config.mjs`)
- TypeScript ^5 (`tsconfig.json`)

## Key Dependencies

**Critical:**
- `@clerk/nextjs` ^7.0.6 - Authentication (OAuth: Google, Discord, Twitch)
- `@neondatabase/serverless` ^1.0.2 - PostgreSQL database client (Neon)
- `@sentry/nextjs` ^10.45.0 - Error tracking and performance monitoring
- `zod` ^4.3.6 - Runtime schema validation for API inputs

**Infrastructure:**
- `@upstash/redis` ^1.37.0 - Redis caching layer (Upstash REST API)
- `@vercel/analytics` ^1.6.1 - Web analytics
- `@vercel/speed-insights` ^2.0.0 - Performance monitoring (Web Vitals)

**Feature-specific:**
- `motion` ^12.35.2 - Animation library (Framer Motion successor)
- `html2canvas-pro` ^2.0.2 - Client-side screenshot/graphic generation
- `jspdf` ^4.2.1 - PDF generation for team reports
- `qrcode` ^1.5.4 - QR code generation for sharing
- `tweetnacl` ^1.0.3 - Cryptographic operations

## Configuration

**TypeScript (`tsconfig.json`):**
- Target: ES2017
- Module: ESNext with bundler resolution
- Strict mode: enabled
- Path alias: `@/*` maps to `./src/*`
- JSX: react-jsx (automatic runtime)
- Incremental compilation: enabled

**Next.js (`next.config.ts`):**
- Experimental: `optimizePackageImports` for `motion/react`
- Comprehensive security headers (CSP, HSTS, X-Frame-Options, etc.)
- CORS headers set via middleware

**PostCSS (`postcss.config.mjs`):**
- Single plugin: `@tailwindcss/postcss` (Tailwind v4 setup)

**Vitest (`vitest.config.ts`):**
- Globals: enabled
- Path alias: `@` -> `./src`

**Cypress (`cypress.config.ts`):**
- Base URL: `http://localhost:3000`
- Viewport: 1280x800
- Default timeout: 10000ms
- Video: disabled, screenshots on failure: enabled

**Environment:**
- `.env.local` - Local secrets (exists, not committed)
- `.env.example` - Template with required variable names

## NPM Scripts

```bash
npm run dev          # next dev
npm run build        # next build
npm start            # next start
npm run lint         # eslint
npm test             # vitest run
npm run test:watch   # vitest (watch mode)
npm run cy:open      # cypress open
npm run cy:run       # cypress run
npm run test:e2e     # start-server-and-test + cypress run
npm run test:e2e:open # start-server-and-test + cypress open
```

## Fonts

- **Sora** - Primary font (Google Fonts, variable `--font-sora`)
- **JetBrains Mono** - Monospace font (Google Fonts, variable `--font-mono`)

## PWA Support

- Service worker: `public/sw.js`
- Web manifest: `public/manifest.json`
- Install prompt component: `src/components/ui/InstallPrompt.tsx`
- Connectivity status: `src/components/ui/ConnectivityStatus.tsx`

## Platform Requirements

**Development:**
- Node.js (ES2017+ target)
- npm for package management
- Git for version control

**Production:**
- Vercel (auto-deploy from `main` branch)
- Neon PostgreSQL database
- Upstash Redis (optional, graceful fallback)
- Clerk authentication
- Sentry error tracking (production only)

---

*Stack analysis: 2026-04-02*
