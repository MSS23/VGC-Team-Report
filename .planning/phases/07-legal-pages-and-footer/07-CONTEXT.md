# Phase 7: Legal Pages and Footer - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver GDPR/CCPA-compliant privacy policy, terms of service, and footer links on every page. The privacy policy URL must exist before Phase 8 (cookie consent banner references it). This phase is pure content + minimal component work.

</domain>

<decisions>
## Implementation Decisions

### Privacy Policy Content
- Contact method: email address (privacy@pokemonvgcteamreport.com) for data rights requests — simple, no infrastructure
- Data retention: indefinite for shared reports until user deletes; deleted accounts purge all data immediately
- Legal bases: legitimate interest (Art 6(1)(f)) for analytics, contract performance (Art 6(1)(b)) for account features, consent (Art 6(1)(a)) for cookies
- Tone: plain English, no legalese — accessible to gamers; section headers as questions ("What data do we collect?")

### Terms of Service
- Liability: "As-is" disclaimer + maximum liability capped at $0 (free service)
- User content: users retain ownership; grant platform a license to display/host
- Termination: accounts can be terminated for TOS violations with notice
- Pokemon IP: prominent standalone section — clear for Nintendo/TPC

### Footer & Site Integration
- Add "Terms" and "Cookie Settings" to existing NAV_LINKS array in PageFooter.tsx
- Cookie Settings link dispatches a custom event (`open-cookie-settings`) that Phase 8's banner will listen for — placeholder until then
- Terms page reuses PrivacyNavbar pattern (TermsNavbar) + same page structure as /privacy

### Claude's Discretion
- Exact section ordering in privacy policy and terms of service
- CCPA paragraph wording within privacy policy
- Third-party processor descriptions and DPA link formatting

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/privacy/page.tsx` — existing privacy page structure (needs content rewrite)
- `src/app/privacy/PrivacyNavbar.tsx` — navbar component pattern to clone for terms
- `src/components/layout/PageFooter.tsx` — footer with NAV_LINKS array to extend
- `src/components/layout/PageNavbar.tsx` — shared navbar component

### Established Patterns
- Legal pages use server components with `Metadata` export for SEO
- Navbar wrapper pattern: client component wrapping PageNavbar with dark mode + i18n
- Footer uses `NAV_LINKS` const array for link generation
- Page structure: min-h-screen bg-background, max-w-5xl container, space-y-8 sections

### Integration Points
- PageFooter is used across the site — adding links there propagates everywhere
- Privacy page already exists at /privacy with metadata and canonical URL
- Terms page needs new route at /terms

</code_context>

<specifics>
## Specific Ideas

- Privacy policy must name all 4 third-party processors with DPA links: Clerk, Vercel, Neon, Upstash
- CCPA "Do Not Sell" section is a single paragraph affirming no data is sold — not a separate page
- Pokemon trademark section already exists in current privacy page — carry forward and also include in terms

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
