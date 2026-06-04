# Competitor Teardown — Pikalytics & PokePaste

Date: 2026-06-04
Scope: Two direct competitors for VGC Team Report. Pick 1-2 features to copy/counter tonight.

Note on methodology: Both pikalytics.com and pokepast.es returned 403 to WebFetch (Cloudflare bot blocking — itself a UX/SEO data point worth noting). Findings synthesized from WebSearch result snippets (Apple App Store, search summaries, third-party blog comparisons, the public pokepast.es/syntax.html reference). 6/6 calls used.

---

## 1. Pikalytics — https://www.pikalytics.com/

### Core differentiator
Data-driven team-building backed by tournament usage stats. The team builder isn't just a sheet — it *recommends* moves, items, abilities, natures, and EV spreads based on actual top-cut tournament data ("last updated May 2026"). They own the "what is the meta running right now" question.

### Best UX feature we likely don't have
**Top Teams Gallery with copy-to-builder.** Browse winning team comps from recent high-level events, see win/loss records and event placement, then one-click copy into the builder. It collapses "find a meta team → understand it → use it" into a single page. Also notable: **Teammate Analytics** (which Pokémon are most paired with X — a graph-style suggestion that drops directly into the builder).

### Worst UX failure
The website is a dense, ad-supported stats wall designed for desktop power users. From third-party reviews and the app store copy ("100% ad-free" is the iOS app's selling point — implying the website *is* ad-heavy), the web experience pushes you toward the app. Navigation is a tab soup of `/team`, `/champions`, `/[format]` etc. No social/identity layer — no profiles, no follows, no "this team belongs to player X." Teams are stats, not stories.

### Monetization
- **Web:** Ad-supported (display ads on stat pages; the iOS app explicitly markets "ad-free" as a paid upgrade differentiator).
- **iOS/Android app:** Paid app (~$3-5 IAP/one-time per App Store listings), offline access, ad-free.
- No SaaS subscription on web that we could verify. Search results hint at "premium features" but no clear paywall surfaced.

### Mobile experience
Web is responsive but stat-tables-on-phone is rough — the strategy is "if you're on mobile, buy the app." Native iOS + Android apps exist with offline mode, quiz mode (type matchups), speed tiers reference. App is the polished mobile experience; web mobile is an afterthought.

### SEO posture
**Strong and format-targeted.** They rank #1 for "VGC team builder" and own the "[format] team builder" long-tail (e.g. "Pokemon Champions VGC 2026 team builder"). URL structure is clean: `/team`, `/champions`, `/[pokemon-name]`. They publish per-Pokémon stat pages that pull in tail traffic ("best moves for [mon] 2026"). They also expose an `llms-full.txt` — actively courting AI/LLM citation traffic.

### Sharing flow
Weak. Pikalytics is a *reference and builder* tool, not a sharing tool. There's no first-class "share this team" URL with a viewer-friendly page that a teammate opens. You build → export to Showdown text → paste somewhere else (usually PokePaste or Discord). This is a clear gap we should exploit.

---

## 2. PokePaste — https://pokepast.es/

### Core differentiator
The dead-simple, zero-friction text bin for competitive teams. Paste → URL → done. It is the *de facto* sharing standard for VGC and Smogon. Universal in tournaments, Discord, Reddit, Smogon forums.

### Best UX feature we likely don't have
**Friction approaching zero on both ends.** No login, no account, no onboarding — paste Showdown text, get a permanent URL, share. The viewer experience is just-as-fast: a clean read-only render of the team in plain text format, with a one-click copy-back-to-Showdown box. The whole loop is < 5 seconds creator-side and < 2 seconds viewer-side. Their `/syntax.html` doc is a single page, which doubles as both an API contract and a marketing piece for power users.

### Worst UX failure
**No sprites, no images, no analysis, no context.** It's a wall of monospace text. No team preview, no defensive type chart, no item icons, no Tera-type visualization, no damage calc, no notes section beyond the comment lines in the paste itself. No editing after publish (you create a new paste). No search — you cannot discover other people's teams; you must already have the URL. No analytics on who viewed your paste. A whole alternative tool (crob.at/pokepaste) exists *purely* to add sprites to PokePaste links, which tells you exactly what the market wants.

### Monetization
**None visible.** No ads, no subs, no Patreon link, no premium tier. Likely run as a passion project / loss leader. This is an asset (trust, neutrality) but also their ceiling — no revenue means no roadmap.

### Mobile experience
Responsive in the sense that "a single text column works fine on any screen," but the monospace blob is hard to scan on a phone. No mobile-tuned rendering, no swipeable team carousel, no tap-to-expand on a Pokémon. It works on mobile by accident, not design.

### SEO posture
**Surprisingly weak for its market share.** Individual pastes are unique URLs with thin, non-indexable content (just a team text export — Google doesn't reward this). The homepage ranks for "pokepaste" branded terms only. They do not rank for "VGC team builder" or comparable queries. They've ceded SEO entirely to Pikalytics et al. — they survive on direct links from Discord/Reddit/Twitter and word-of-mouth.

### Sharing flow
The gold standard for friction:
1. Creator copies team from Showdown teambuilder (Showdown has a one-click export button).
2. Pastes into pokepast.es textarea.
3. Clicks Create → gets a permanent URL like `pokepast.es/abc123`.
4. Pastes URL anywhere (Discord, Twitter, Reddit).
5. Viewer clicks → sees the team text → can copy back into Showdown's "Import from Text or URL" box.

Total time, end-to-end, < 10 seconds. **This is the bar we have to match.**

---

## Synthesis — Top 3 to Copy, Top 2 to Avoid

### Copy (high-leverage, low-build-cost)

1. **PokePaste-grade share flow with sprites + structure.** A no-login "paste Showdown text → instant viewer URL" path, but the viewer is a rich, sprite-rendered, mobile-tuned team page (everything PokePaste should be in 2026). This is our wedge — PokePaste itself proves the market wants the simple URL, and crob.at proves the market wants sprites.
2. **Pikalytics' Top Teams Gallery + one-click import.** A "trending teams this week" page that pulls public team reports (or curated tournament results), with a one-click "fork this team into my builder." This is a flywheel: discovery → fork → publish → more discovery.
3. **Per-Pokémon and per-format SEO landing pages.** Pikalytics owns the long-tail. We mirror the pattern: SSG a page per Pokémon per format with usage data, *and* embed our team reports that include that Pokémon. Each page becomes both an SEO funnel and a discovery surface for our content. Bonus: ship an `llms-full.txt` like they did.

### Anti-patterns to avoid

1. **Pikalytics' ad-heavy web + paid-app split.** Pushing web users into a paid app is a strategy from 2018. We're a web-first product; double down on the web being the canonical experience, not the consolation prize. If we monetize, do it with a Pro tier on the *web* (private teams, advanced analytics, custom domains), not by gating mobile.
2. **PokePaste's "static text wall" minimalism taken too far.** It's tempting to copy the no-login simplicity wholesale, but their refusal to add sprites, search, editing, or analytics is *why* a market exists for us. Keep the friction low at the creation step, then earn upgrade behavior (account, edits, analytics) at the *value* step, after the user has seen the rich viewer page and wants to claim/edit/track it.

---

## One-line strategic read

PokePaste owns the *share verb* but ships a 2014-era viewer. Pikalytics owns the *data* but doesn't ship a sharing product. Our shot is to be the rich, mobile-first viewer that PokePaste users defect to, with enough Pikalytics-style meta data baked in to win the SEO long-tail neither has fully claimed.
