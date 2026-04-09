# Phase 8: Cookie Consent and Analytics Gating - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement cookie consent banner with accept/reject buttons and gate ALL analytics (Vercel Analytics, SpeedInsights, PostHog) behind user consent. No analytics scripts fire before consent is granted.

</domain>

<decisions>
## Implementation Decisions

### Cookie Consent Library
- Use vanilla-cookieconsent v3.1.0 (~10KB, ESM, no SaaS fees)
- Store consent state in a cookie (cc_cookie) — library handles this natively
- Banner must have equally prominent Accept All / Reject All buttons (no dark patterns)

### Analytics Gating Architecture
- Create a ConsentGate client component that wraps Analytics, SpeedInsights, and PostHogProvider
- ConsentGate reads consent state and conditionally renders analytics components
- On reject: analytics components are never mounted (zero network requests)
- On accept: analytics components render normally
- PostHog init must also be gated — currently fires in useEffect on mount

### Integration Points
- layout.tsx currently renders: `<PostHogProvider>`, `<Analytics />`, `<SpeedInsights />` unconditionally
- ConsentGate wraps these three, placed inside layout.tsx body
- Cookie banner component sits at the layout level (visible on all pages)
- Footer "Cookie Settings" button dispatches `open-cookie-settings` CustomEvent — banner listens for this

### Claude's Discretion
- Cookie banner visual styling (should match site design tokens)
- Exact vanilla-cookieconsent configuration options
- Whether to use vanilla-cookieconsent's built-in UI or a custom React component

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/layout.tsx` — root layout with Analytics, SpeedInsights, PostHogProvider
- `src/components/providers/PostHogProvider.tsx` — PostHog init + page view tracking
- `src/components/layout/PageFooter.tsx` — already has Cookie Settings button dispatching `open-cookie-settings`

### Established Patterns
- Providers wrap children in layout.tsx
- Client components use "use client" directive
- PostHog inits via useEffect on mount — needs to be made conditional on consent

### Integration Points
- layout.tsx line 117: `<Analytics />` — Vercel Analytics
- layout.tsx line 118: `<SpeedInsights />` — Vercel Speed Insights
- layout.tsx line 120: `</PostHogProvider>` — wraps children
- PageFooter dispatches `open-cookie-settings` CustomEvent

</code_context>

<specifics>
## Specific Ideas

- vanilla-cookieconsent provides its own modal UI — may be simpler than building custom React
- PostHog needs special handling: its init happens in useEffect, needs consent check before posthog.init()
- Consider a consent utility (lib/consent.ts) that reads cookie state and exports hasAnalyticsConsent()

</specifics>

<deferred>
## Deferred Ideas

- Granular per-category toggles (analytics vs functional vs marketing) — future requirement PRIV-03
- Integration with Clerk for consent per-user storage — overkill for current scale

</deferred>
