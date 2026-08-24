# R7 — AI Citation (AEO/GEO) Audit — 24 Aug 2026

Read-only audit. Nothing outside `.swarm/` was modified. Own domain is egress-blocked, so all
live-site evidence is from AI/search result snippets, not direct fetch.

---

## 1. Method

Ran the four target prompts plus two probes through WebSearch (which returns an AI-synthesised
answer plus its source set — the closest available proxy for "who gets cited"). Recorded which
domains the answer named, then read the repo's crawler surface to explain the pattern.

Queries run:

1. `best VGC team builder tool 2026`
2. `how to share a VGC team report online`
3. `VGC team report tool best site for writing team reports`
4. `EV to SP converter Pokemon Champions Regulation M`
5. `reddit VGC best tools team report builder recommendation 2026`
6. `"VGC Team Report" pokemonvgcteamreport review OR alternative OR list of tools`

---

## 2. Who actually gets cited

### Query 1 — "best VGC team builder tool 2026" → **NOT CITED**

Cited set, in order: Pikalytics (`/team`, `/champions`), PokemonBuilder, ChampionsBuilder,
PokeSynergy, ChampTeams.gg, VGCguide, MetaVGC. Seven distinct tools named. `pokemonvgcteamreport.com`
appeared **nowhere**, not even in the link list.

Why they win:

- **Exact-intent landing pages with the noun in the URL.** `pikalytics.com/team`,
  `metavgc.com/team-builder`, `pokemonbuilder.com/pokemon-vgc-builder`. The query noun is
  "team **builder**"; every winner has a page literally titled that. VGC Team Report's homepage
  is titled "Build and Share Pokemon VGC Teams" and it owns "team **report**", a different noun.
- **Quantified proof points.** PokemonBuilder's snippet carries "analyzes 10,295 replays".
  Numbers survive summarisation — LLMs preferentially retain them because they read as evidence.
  VGC Team Report's copy has no comparable number anywhere.
- **Feature-list-shaped copy.** ChampTeams.gg's snippet is literally a comma-delimited feature
  list ("damage calculator, speed tiers, type coverage analysis, Showdown import/export, works on
  mobile"). That is the exact shape a listicle answer needs, so it gets lifted verbatim.

### Query 2 — "how to share a VGC team report online" → **CITED, position 2 of 3**

Cited: Victory Road (`/sv-reports/`) first, then **`pokemonvgcteamreport.com/faq`** and
**`pokemonvgcteamreport.com/`**, then Pikalytics. The answer devoted its longest paragraph to
VGC Team Report and correctly described the paste → annotate → Share flow.

This is the single strongest result and it is directly attributable to on-repo work:
`src/app/faq/page.tsx` emits `FAQPageJsonLd` **plus** `HowToSchema` with
`SHARE_VGC_TEAM_HOW_TO_STEPS`, and the code comment on line 108 says exactly that
("HowTo schema is the highest-yield AEO win per R7 audit"). The prior recommendation shipped and
it is working. The step-by-step answer the AI produced maps 1:1 onto those HowTo steps.

### Query 3 — "VGC team report tool / best site for writing team reports" → **CITED, position 1–2**

Cited: Victory Road, **`/explore`**, **homepage**, Reportworm, teamsheet.gg. The site is
co-leading its owned noun. Two competitors named here (Reportworm, teamsheet.gg) did not appear in
any earlier audit's competitive set — the "team report" category is now contested by at least two
direct competitors, not just adjacent tools.

### Query 4 — "EV to SP converter Pokemon Champions" → **NOT CITED**

Cited: RotomLabs `/champions/stat-converter`, ChampDex `/tools/ev-converter`, ChampCalc,
DexPro `/tools/ev-stats/`, plus a PokeCommunity thread and a Facebook group post.

This is the most damaging miss, because **the site has a genuinely excellent page for this exact
query and it lost anyway.** `src/app/tools/ev-to-sp/page.tsx` is the best-built AEO page in the
repo: `FAQPageJsonLd` with 7 question-shaped headings, `WebApplication` schema,
`BreadcrumbListJsonLd`, `force-static`, two conversion tables generated from the same functions the
app uses, and answers written in direct-answer form ("4 EVs is 1 SP"). It should be winning.

Diagnosis — three compounding reasons:

- **The page is invisible to the site's own AI-discovery files.** `grep -c "ev-to-sp"` returns
  **0** for both `public/llms.txt` and `public/llms-full.txt`. The "Main URLs" list in `llms.txt`
  names seven paths; `/tools/ev-to-sp` is not one of them. An assistant that reads `llms.txt` to
  learn what this site offers is told the site has no converter.
- **Competitors have exact-match URL slugs.** `champdex.com/tools/ev-converter`,
  `rotomlabs.net/champions/stat-converter`, `dexpro-app.com/tools/ev-stats/`. Four separate
  purpose-built domains split the citation pool, and each one's URL restates the query.
- **Zero third-party corroboration.** The two non-tool sources cited (PokeCommunity thread,
  Facebook group) are where the *formula* is discussed. Nobody in those threads links to
  `/tools/ev-to-sp`, so the page has no external signal vouching for it.

### Query 5/6 — brand and listicle probes

Brand queries resolve correctly: searching the tool's name returns its own FAQ, `/explore` and
homepage with an accurate description. Brand-level AEO is healthy.

The revealing result is query 6. The AI answered "Alternative Tools" by pulling from
**DevonCorp's "Up-to-date VGC Resources"** page (`devoncorp.press/short-form-content/up-to-date-vgc-resources`)
and listed: PokePaste, VGC.tools, Pikalytics, Reportworm, PASRS Tool, Marriland Teambuilder.
**VGC Team Report is not on that list** — it was described from its own site, then the "alternatives"
came wholesale from a third-party roundup it is absent from.

That is the central structural finding of this audit.

---

## 3. Why the cited sources get cited — pattern summary

Across all six queries, four traits separate cited from uncited:

| Trait | Who has it | Site status |
|---|---|---|
| Third-party roundup inclusion | Everyone in the DevonCorp list; Pikalytics everywhere | **Absent from every roundup found** |
| Exact-noun URL slug for the query | pikalytics.com/team, champdex.com/tools/ev-converter | Partial — `/tools/ev-to-sp` exists but unlisted |
| Quantified claims in indexable copy | PokemonBuilder ("10,295 replays"), Pikalytics ("tournament usage data") | **No numbers in any public copy** |
| FAQ/HowTo structured data | Few competitors | **Strong — and it is the only place the site wins** |

The correlation is unambiguous: the site is cited on exactly the queries where it has
`FAQPageJsonLd` + `HowToSchema` and no roundup competition, and absent on every query decided by
third-party roundups. Structured data is a solved problem here; **off-site corroboration is not.**

---

## 4. Crawler-surface audit (read-only)

### `public/robots.txt` — healthy, static file (no `robots.ts` route)

```
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://pokemonvgcteamreport.com/sitemap.xml
```

The single-group design is deliberate and correct — the comment cites VGC-272 and explains that a
named user-agent group *replaces* the wildcard group rather than inheriting from it, so per-bot
`Allow: /` blocks had been silently un-blocking `/api/`. **Do not add per-bot groups for GPTBot /
ClaudeBot / PerplexityBot.** They already get `Allow: /` from the wildcard, and adding named groups
would reintroduce the exact bug VGC-272 fixed. This is a case where the correct AEO action is to
change nothing.

One gap: `robots.txt` does not point at `llms.txt`. There is no standardised directive for this, so
this is low-value, but a comment line referencing `/llms.txt` costs nothing.

### `src/lib/security/bot-detection.ts` — AI crawlers correctly allowed

`ALLOWED_BOT_PATTERNS` is checked **first** and short-circuits, so these all pass:
`gptbot`, `oai-searchbot`, `anthropic-ai`, `claude-web`, `claudebot`, `perplexitybot`, `amazonbot`,
`applebot`, plus Google/Bing/DuckDuckGo. `ccbot`, `bytespider` and `petalbot` are blocked with the
comment "AI training-only scrapers (no citation benefit)" — that reasoning is sound.

Two residual risks, both minor:

- **On-demand user-agents are not allowlisted.** `ChatGPT-User` and `Perplexity-User` (the fetchers
  used when a human asks a live question, distinct from the indexing crawlers) match no allow
  pattern. They also match no block pattern, so `isBlockedBot` returns `false` and they pass —
  but they pass by accident, not by design. Adding a block pattern later that happens to match them
  would break live citations silently.
- **`isSuspiciousRequest` blocks any request with no `Accept` header.** Mainstream AI fetchers send
  one, so this is not currently biting, but it is an unguarded chokepoint on the citation path.

Net: the crawler surface is **not** blocking AI citation. This is not where the problem is.

### Structured data — strong, one gap

Present and correctly wired:

- `src/app/layout.tsx` — `Organization`, `WebSite` + `SearchAction`, and a combined
  `["WebApplication","SoftwareApplication"]` node with a six-item `featureList` and a free `Offer`.
- `src/app/page.tsx` — `FAQPageJsonLd` (5 default items) + `HowToSchema`.
- `src/app/faq/page.tsx` — `FAQPageJsonLd` (13 items) + `HowToSchema` + breadcrumbs.
- `src/app/tools/ev-to-sp/page.tsx` — `FAQPageJsonLd` (7 items) + `WebApplication` + breadcrumbs.
- `champions/`, `explore/`, `tournaments/`, `s/[id]`, `creator/[name]`, `changelog` all emit schema.
- `src/app/sitemap.ts` — static pages plus 72 Reg M-B mega pages, up to 5000 shares and 5000
  creator pages, `revalidate = 3600`. `/compare` is correctly excluded as noindex.

Gap: no `aggregateRating` and no `dateModified` on the `SoftwareApplication` node. Listicle-shaped
AI answers lean on ratings and recency when ranking a tool set.

### `public/llms.txt` and `public/llms-full.txt` — **the material defect**

`llms.txt` is accurate. `llms-full.txt` is **factually wrong about the site's flagship
differentiator**, and has been since 13 Aug.

Commit `1db8419` — *"VGC-266: correct SP definition in llms.txt and FAQ (was '1 SP = 1 EV' and
600/200)"* — fixed `llms.txt` and `faq/page.tsx` but **never touched `llms-full.txt`**. The stale,
incorrect text is still live there:

> **SP (Stat Points or Standard Points)** is an alternative notation sometimes used in team reports
> and competitive coaching content — particularly in some international communities — where
> **1 SP = 1 EV. The terms are interchangeable.** If you see a Pokémon listed with "252 SP Atk" it
> means the same thing as "252 EVs in Attack".

Every clause of that is false. SP is the Champions stat system: 66 total, 32 per-stat cap, first SP
costs 4 EVs and each subsequent SP costs 8. "252 SP Atk" is not a legal value. The same paragraph
also states EVs cap at **508** (the real cap is 510).

Consequences, in order of severity:

1. Any assistant that ingests `llms-full.txt` — the *more detailed* of the two files, so the one a
   thorough agent prefers — learns the wrong definition of the concept the site is trying to own,
   and will confidently repeat it.
2. `llms.txt` and `llms-full.txt` now **contradict each other** on the same term. An assistant
   reading both sees the site disagreeing with itself, which is a direct trust penalty on both files.
3. It is a live correctness bug on the exact query (#4) the site is already losing.

Additional `llms*.txt` problems:

- **Stale `Updated:` header.** Both files declare `Updated: 2026-05-23`. `llms.txt` was actually
  edited 13 Aug. The advertised date is three months old, and freshness is a ranking input.
- **No `/tools/ev-to-sp`.** Confirmed 0 occurrences in both files.
- **Regulation drift.** `llms-full.txt` mentions Reg M-B **zero** times and describes M-A as "the
  2026 format"; `llms.txt` mentions M-B once. `sitemap.ts` states plainly that "Reg M-B is the
  current Champions regulation and a superset of M-A". Both files are a regulation behind.
- **No `/creator/[name]` or `/embed/[id]` in `llms.txt`'s URL list**, though both are sitemapped
  and `/embed` is documented in `llms-full.txt`.

---

## 5. Recommendations, ranked by leverage

### 1. Fix the false SP definition in `public/llms-full.txt` — **effort: S**

Delete the "1 SP = 1 EV / terms are interchangeable / 252 SP Atk" paragraph and replace it with the
already-correct wording from `llms.txt` and `faq/page.tsx` (66 SP, 32 cap, first SP = 4 EVs then 8).
Fix "508 total EVs" → 510. Bump both `Updated:` headers to the real date.

Highest leverage in the audit: it is a one-file text edit that removes a live factual error, ends a
self-contradiction between the site's two AI-facing files, and does so on the precise topic the site
is trying to own. Draft replacement text written to
`.swarm/drafts/llms-full-sp-correction.md`. Worth a `VGC-XX` ticket as a follow-up to VGC-266 —
that commit's message claims a completeness it did not have.

### 2. Add `/tools/ev-to-sp` to both `llms*.txt`, and refresh regulation coverage — **effort: S**

Add the converter to the "Main URLs" list in `llms.txt` with a one-line description that states the
numbers ("66 SP budget, 32 SP per-stat cap, first SP costs 4 EVs then 8 each"), and give it its own
`###` section in `llms-full.txt`. While in the files: promote Reg M-B to the current regulation in
both, and add `/creator/[name]` and `/embed/[id]` to the URL list.

The best AEO page in the repo is currently absent from the site's own machine-readable index of
itself. Fixing that is trivial and directly targets the query the site is losing. Bundle with #1 —
same two files, one commit.

### 3. Get listed in third-party VGC resource roundups — **effort: M**

The DevonCorp "Up-to-date VGC Resources" page is demonstrably the source an AI answer reached for
when asked about VGC tools, and the site is not on it. Same applies to Victory Road's resources
surface, which outranked the site on two of its *own* best queries.

This is the only recommendation that addresses the root cause. Structured data is already
best-in-class and it only wins where roundups are absent; every loss traced back to a roundup the
site is missing from. Outreach copy drafted to `.swarm/drafts/roundup-outreach-devoncorp.md` and
`.swarm/drafts/roundup-outreach-victoryroad.md`.

**Nothing was sent, posted, or submitted — these are drafts for human review and human sending.**
Per constraints, no forms were submitted and no forum or directory was posted to.

### 4. Add quantified proof points and `dateModified` to public copy and schema — **effort: M**

Competitors that win carry retainable numbers ("10,295 replays"). The site's copy has none. Surface
real figures already in the system — number of public reports, number of tournaments archived,
Pokémon covered, the 72 Champions mega guide pages — into homepage copy, the `llms*.txt` summary
paragraph, and the `SoftwareApplication` schema node. Add `dateModified` to that node.

Numbers survive LLM summarisation where adjectives do not, and "72 Champions mega guides" is a
concrete differentiator none of the seven builders cited in query 1 can match.

### 5. Build a `/tools/` hub and one exact-noun landing page per competitor slug — **effort: L**

`/tools/ev-to-sp` is the only page under `/tools/`. Competitors win by owning one URL per intent.
Add a `/tools/` index page (sitemapped, `ItemList` schema, linked from `llms.txt`) and consider
sibling pages for the intents where the site has real logic but no landing page — speed tiers and
Champions legality both exist in `src/lib/` and neither has a page.

Ranked last: highest effort, most new surface to maintain, and its value is partly gated on #3
(new pages with no external citations tend to lose to established exact-match domains). Do it after
the roundup listings land.

---

## 6. Explicitly do NOT do

- **Do not add per-bot `User-agent:` groups to `robots.txt`** for GPTBot/ClaudeBot/PerplexityBot.
  A named group replaces the wildcard group entirely; those bots already get `Allow: /`, and named
  groups would un-block `/api/` for them. This is the regression VGC-272 fixed.
- **Do not unblock `ccbot` / `bytespider` / `petalbot`.** Training-only crawlers, no citation return.

---

## 7. Files reviewed (all read-only)

- `/home/user/VGC-Team-Report/public/robots.txt`
- `/home/user/VGC-Team-Report/public/llms.txt`
- `/home/user/VGC-Team-Report/public/llms-full.txt`
- `/home/user/VGC-Team-Report/src/lib/security/bot-detection.ts`
- `/home/user/VGC-Team-Report/src/proxy.ts`
- `/home/user/VGC-Team-Report/src/components/seo/JsonLd.tsx`
- `/home/user/VGC-Team-Report/src/app/sitemap.ts`
- `/home/user/VGC-Team-Report/src/app/layout.tsx`
- `/home/user/VGC-Team-Report/src/app/page.tsx`
- `/home/user/VGC-Team-Report/src/app/faq/page.tsx`
- `/home/user/VGC-Team-Report/src/app/tools/ev-to-sp/page.tsx`
- `/home/user/VGC-Team-Report/next.config.ts`
