# DRAFT — NOT PUBLISHED

**Status: DRAFT — NOT PUBLISHED.** Nothing in this file has been committed to the repo, deployed, posted, or submitted anywhere. It is page copy drafted for human review by R7 on 2026-10-26, paired with the audit at `/home/user/VGC-Team-Report/.swarm/r7-aeo-26-10-26.md`. No source file was edited. A human decides what, if anything, ships.

Two things in here need a human ruling **before** the copy can be used, both flagged inline:
- **the Reg M-C restricted-legendary rule** — our four surfaces currently disagree (audit §4.2b). Every draft below deliberately avoids stating it.
- **whether `/embed/[id]` actually works** — sitewide CSP `frame-ancestors 'none'` appears to block it (audit §4.2c). The A5 draft marks the embed step as HOLD.

---

## A1 — Homepage server-rendered answer block

**File:** `src/components/home/HomePageServer.tsx`
**Placement:** outside the existing `<Suspense>`, so it lands in the static HTML. The builder stays exactly where it is; this is prose added above and below it, not a redesign.
**Why:** the prerendered `/` currently serves 91 characters of body text, no `<h1>` and no `<h2>` (audit §1.1, §5.1).

### H1

> Build and share a Pokémon VGC team report

### Lead paragraph — place directly under the H1, above the paste box

> VGC Team Report is a free tool that turns a Pokémon Showdown paste into a shareable team report. Paste your team, add your matchup plans, damage calcs and speed tiers, and publish it as a permanent link anyone can read — no account needed. It supports every Scarlet &amp; Violet regulation and Pokémon Champions Regulation M-A, M-B and M-C, including Stat Points and Mega Evolution legality checks.

*(Three sentences, states what it is in the first clause, names the input and the output, and carries the format keywords. This is the paragraph an engine lifts for "what is VGC Team Report".)*

### Three steps — promote the existing 10px captions to real headings and prose

Currently `LandingSteps()` renders these as `<p className="text-[10px]">`. Same content, real `<h2>` + `<p>`:

**H2:** Paste your team
> Import a PokéPaste URL, a Pokémon Showdown export, or a rental code. The parser reads all six Pokémon — species, moves, item, ability, nature, EVs or Stat Points, IVs and Tera type — and builds the report skeleton for you.

**H2:** Add your notes
> Write the team overview, per-Pokémon role notes, key damage calculations and the matchup plans that explain your lead choices. This is the part a raw paste can never show: not what the team is, but why it was built that way.

**H2:** Share with anyone
> Publish to get a permanent link at `/s/[id]`, or keep it unlisted and copy the link directly. Reports are read-only for viewers, render a rich preview when pasted into Discord, and can be exported as a PDF or presented in tournament mode.

### Visible FAQ block — place below the builder

These are **already** emitted as FAQPage JSON-LD on the homepage via `DEFAULT_FAQ_ITEMS` in `src/components/seo/JsonLd.tsx`, with no visible counterpart. Rendering them as `<h2>` + `<p>` costs nothing new and legitimises schema we already ship. Use the existing `DEFAULT_FAQ_ITEMS` text verbatim so the two can never drift, **except** the Reg M-C item below.

1. **What is a VGC team report?** — use `DEFAULT_FAQ_ITEMS[0]` verbatim.
2. **How do I share a VGC team report?** — use `DEFAULT_FAQ_ITEMS[1]` verbatim.
3. **What is Pokémon Champions Regulation M-C?** — ⚠️ **HOLD.** The shipped text asserts "Restricted legendaries are banned", `public/llms-full.txt` asserts two are allowed, and `src/lib/validation/champions-legality.ts` permits up to 2. Do not render this one until a human settles the rule; see audit §4.2b and A3. Interim replacement that states only what the code verifiably does:
   > Regulation M-C (September 9 – December 2, 2026) is the current Pokémon Champions format. It is a superset of Regulation M-B and M-A — nothing was removed — and it adds Pokémon such as Rillaboom, Cinderace, Inteleon, Indeedee, Salamence and Baxcalibur plus six new Mega Evolutions: Mega Garchomp Z, Mega Lucario Z, Mega Absol Z, Mega Salamence, Mega Baxcalibur and Mega Golisopod. Paste a team and VGC Team Report detects the right Champions regulation automatically, then checks every Pokémon, Mega Stone, item and Stat Point spread against it.
4. **How do I import a PokéPaste?** — use `DEFAULT_FAQ_ITEMS[3]` verbatim.
5. **Is VGC Team Report free?** — use `DEFAULT_FAQ_ITEMS[4]` verbatim.

### Regression guard to add alongside it

Assert in vitest (or Cypress against the build) that the prerendered `/` contains exactly one `<h1>` and more than 1,500 characters of text outside `<script>`. Without this, the next refactor that moves content back inside `<Suspense>` silently restores the 91-character homepage.

---

## A5 — New page: `/guides/how-to-share-a-vgc-team`

**Target queries:** "how do I share my VGC team", "PokePaste alternative", "how to share a Pokémon team link", "share VGC team Discord".
**Why this page:** audit §2.1 found **no site owns any of these queries** — the results were a Firefox extension, "use Showdown's export text", and "self-host PokePaste". The most winnable space in the audit.
**Structure to copy:** `src/app/tools/ev-to-sp/page.tsx` exactly — `force-static`, `h1` = the question, direct answer in the first two sentences, one `<h2 id="…">` per sub-question, a comparison table, visible FAQ matching the FAQPage JSON-LD, BreadcrumbList, sitemap entry at priority 0.8, and a line added to `public/llms.txt`.

### Metadata

- **Title:** `How to Share a Pokémon VGC Team` *(the layout template appends `| VGC Team Report`, keeping it inside the ~60-char SERP budget)*
- **Description:** `How to share a Pokémon VGC team as a link: export from Showdown, paste into VGC Team Report, and publish a permanent read-only report with your matchup plans, damage calcs and speed tiers. Free, no account needed.`
- **Canonical:** `https://pokemonvgcteamreport.com/guides/how-to-share-a-vgc-team`

### H1

> How to share a Pokémon VGC team

### Direct answer — first paragraph, no preamble

> To share a Pokémon VGC team, export it from Pokémon Showdown's team builder (Teambuilder → your team → Export), then paste that text into a sharing tool to get a link you can send. The simplest option is PokéPaste, which hosts the raw paste as plain text. If you also want to explain the team — matchup plans, damage calcs, speed tiers, EV or Stat Point reasoning — paste it into VGC Team Report instead and publish a full team report at a permanent link. Both are free and neither requires an account.

*(Note for review: this answer names the competitor first and honestly. That is deliberate — comparison answers that concede the simpler tool's strength are more citable than ones that don't, and the engine is going to surface PokéPaste anyway.)*

### H2 — Export your team from Pokémon Showdown

> Open Pokémon Showdown, go to Teambuilder, select the team, and click **Export**. You get a block of plain text — one Pokémon per paragraph, with its item, ability, nature, EVs or Stat Points, IVs, Tera type and four moves. This Showdown export format is the universal interchange format for competitive Pokémon teams: every sharing tool, damage calculator and team builder reads it.

### H2 — Paste it somewhere that gives you a link

> Paste the export into any team-sharing tool to turn it into a URL. PokéPaste (`pokepast.es`) stores it as-is and gives you a short link — it is the pastebin of competitive Pokémon. VGC Team Report parses the same paste into a structured report: sprites, stat spreads, speed tiers, type coverage and legality checks, with editable sections for your own notes. You can also paste a `pokepast.es` URL straight into VGC Team Report to import a team you already shared.

### H2 — Publish and get a permanent link

> In VGC Team Report, click **Share**. **Publish** lists the report on the Explore page and gives it a permanent URL at `pokemonvgcteamreport.com/s/[id]`. **Copy Link** gives you the same permanent URL without listing it publicly. Either way the link is read-only for viewers, keeps working as you keep editing, and always shows the latest saved version.

### H2 — Share it in Discord, on Reddit, or at an event

> Pasting a `/s/[id]` link into Discord produces a rich preview with the team's title and summary, so the link reads as a report rather than a bare URL. For Reddit — r/VGC, r/VGCRateMyTeam, r/stunfisk — post the link with the tournament and placement in the title; each subreddit has its own self-promotion rules, so check them first. At an in-person event, open the report in tournament mode, or generate a Visual OTS Sheet with all six sprites and a QR code back to the full report.

⚠️ **HOLD — embed step.** A sixth step on embedding was drafted and is withheld: the sitewide CSP (`frame-ancestors 'none'` plus `X-Frame-Options: DENY` on `source: "/(.*)"` in `next.config.ts`) appears to block `/embed/[id]` in every browser, with no route exception and no middleware. Do not publish embed instructions until a human confirms the embed works, or the header exception ships. See audit §4.2c and A10.

### H2 — PokéPaste, Pikalytics or a team report: which one?

> | Tool | What it is best for | What it does not do |
> |---|---|---|
> | **PokéPaste** | Sharing the raw paste fast. Plain text, no account, no frills. | No strategy notes, no calcs, no matchup plans, no browsing. |
> | **Pikalytics** | Usage statistics and meta research — what the field is actually running. | It is a meta-analysis tool; it does not document *your* reasoning. |
> | **Pokémon Showdown export text** | Pasting a team into a forum post or a Discord message directly. | No link, no persistence, no formatting. |
> | **VGC Team Report** | The write-up you publish after piloting a team: strategy, matchup plans, damage calcs, speed tiers, at a permanent link. | It is not a from-scratch team builder — bring a finished team. |
>
> Think of PokéPaste as the pastebin of Pokémon teams, and a team report as the article you publish about one.

*(Adapted from the `/faq` answer quoted in audit §5.5, which is already our most citable paragraph. The "what it does not do" column is the part that makes a comparison table citable — tables of pure upside read as marketing and get skipped.)*

### FAQ section — render visibly AND as FAQPage JSON-LD, same text

**Can I share a VGC team without making an account?**
> Yes. Both PokéPaste and VGC Team Report let you paste a team and get a shareable link with no account at all. On VGC Team Report, a free account adds saving multiple reports across sessions, version history and collaboration — but it is never required to build, publish or view a report.

**Does the link keep working after I edit the team?**
> Yes. The `/s/[id]` link is permanent and always resolves to the latest saved version of the report, so you can publish first and keep refining the notes afterwards.

**Can I share a Pokémon Champions team with Stat Points?**
> Yes. Paste a Champions team and VGC Team Report detects the regulation, converts the spread to Stat Points, and checks it against the 66 SP budget and the 32 SP per-stat cap. Teams written in EV notation are converted automatically — the first Stat Point in a stat costs 4 EVs and every one after it costs 8.

**How do I share a team at an in-person tournament?**
> Use the Visual OTS Sheet: it generates an Open Team Sheet image with all six Pokémon, their items, abilities, moves and Tera types, plus a QR code linking to the full report. You can download the image or copy an OTS-formatted text paste that Pokémon Showdown accepts.

**Is there a PokéPaste alternative that shows more than plain text?**
> That is the gap VGC Team Report fills. It reads the same Showdown paste PokéPaste does, then renders sprites, computed stats, speed tiers, type coverage and format legality, with editable sections for matchup plans and damage calcs — and gives you a permanent link to the finished report.

### JSON-LD to emit

`BreadcrumbListJsonLd` (Home → Guides → How to share a VGC team), `FAQPageJsonLd` with the five items above **verbatim**, `HowToSchema` with the step names/text above — reuse `SHARE_VGC_TEAM_HOW_TO_STEPS`, already written in `src/app/faq/page.tsx`, minus the embed step while it is on HOLD.

---

## A6 — New page: `/guides/what-is-a-vgc-team-report`

**Target queries:** "what is a VGC team report", "how to write a VGC team report", "how do I explain my VGC team to someone", "VGC team report template".
**Why this page:** audit §2.1 — currently answered by Discord forum posting rules, a Smogon template that labels its own format outdated, and junk PDFs. Nobody owns the definitional query for the format we are named after.

### H1

> What is a VGC team report?

### Direct answer

> A VGC team report is a structured write-up that explains not just what a competitive Pokémon team is, but why it was built that way. It covers the six Pokémon and their movesets, items, natures and EV or Stat Point spreads; the team's core strategy and win conditions; matchup plans against the top meta threats; the key damage calculations that justify the spreads; and speed tier comparisons showing who outspeeds whom. Team reports are a long-standing tradition in competitive Pokémon, popularised on Smogon and on sites like Victory Road, and they are how most players learn a new format.

*(Promoted from the `/faq` answer, which is already good — it just has no URL of its own.)*

### H2 — What goes in a VGC team report

Six subsections, each two or three sentences, each with its own `<h3>` so an engine can lift one in isolation:

**H3 — The six builds.** Species, item, ability, nature, moves, and the EV or Stat Point spread for every Pokémon. This is the part a bare paste already gives you; the report's job is everything around it.

**H3 — Team overview and win conditions.** What the team is trying to do, which Pokémon is the win condition, and what has to happen for it to get there. Two or three sentences is enough.

**H3 — Role notes per Pokémon.** Why each slot exists, what it answers, and which teammates it needs. Name the non-obvious move choices and say what they are for.

**H3 — Matchup plans.** For each common opposing archetype: what you lead, what you bring, and what you are afraid of. This is the single most useful section for anyone picking the team up, and the one most reports skip.

**H3 — Damage calculations.** The calcs that justify the spreads — what you survive, what you OHKO, and the benchmark each number is aimed at. A spread without a calc is an assertion; a spread with one is an argument.

**H3 — Speed tiers.** Your Speed stats next to the threats that matter, including what changes under Tailwind and Trick Room. In VGC, moving first decides games, so the report should say explicitly who you beat and who beats you.

### H2 — How to explain your team to someone else

> Lead with the win condition, not the roster. Someone reading your report wants to know what the team is trying to do before they care which Pokémon do it. Then justify the two or three spreads that are not obvious — the bulk benchmark, the Speed creep, the odd Tera type — and say what each number is aimed at. Finish with the matchups you lose, honestly: a report that names its own bad matchups is far more useful than one that claims there are none, and it is the part a coach or teammate will actually act on.

### H2 — Team report vs. Rate My Team vs. a paste

> A **paste** is the data: six Pokémon, no reasoning. A **Rate My Team** post asks the community to improve an unfinished team. A **team report** documents a finished team you have already piloted, usually after an event, so other players can understand and adapt it. Reddit's r/VGC uses a Team Report flair for both of the latter, so say in your title which one you are posting.

### FAQ section

**How long should a VGC team report be?**
> Long enough to cover the win condition, the non-obvious spreads and the main matchups — usually 500 to 1,500 words plus the paste. The community posting guides are consistent that brief reasoning beats a full essay; what matters is that every unusual decision has a sentence explaining it.

**Do I need damage calcs in a team report?**
> Not strictly, but they are what turns a spread into an explanation. A calc shows the benchmark a number was chosen to hit — surviving a specific attack, or guaranteeing a specific KO — which lets a reader verify your logic and adapt the spread to their own build.

**Where do people post VGC team reports?**
> Historically on Smogon and in subreddit threads, and more recently on dedicated sites. VGC Team Report publishes each report at a permanent link and lists public ones on its Explore page, filterable by format, Pokémon, tournament and player.

**What is the difference between a team report and an Open Team Sheet?**
> An Open Team Sheet reveals your six Pokémon with their items, abilities, moves and Tera types before a match, and deliberately omits EV and IV spreads — it is a tournament document. A team report is the opposite: written after the event, with the spreads and the reasoning included.

### JSON-LD

`BreadcrumbListJsonLd` (Home → Guides → What is a VGC team report), `FAQPageJsonLd` with the four items verbatim. No `HowTo` — this is definitional, not procedural; the HowTo belongs on A5.

---

## A2 — Replacement text for the broken section of `public/llms-full.txt`

**Delete** the existing "### What is the difference between SP and EVs?" section in full. It currently reads *"SP (Stat Points or Standard Points) … where 1 SP = 1 EV. The terms are interchangeable"* — every sentence is wrong, and it is the exact myth VGC-266 was filed to remove from `llms.txt` (audit §4.2a).

**Replace with** (consistent with `llms.txt`, with `src/lib/analysis/stat-calculator.ts`, and with `/tools/ev-to-sp`):

> ### What is the difference between SP and EVs?
>
> **EVs (Effort Values)** are the stat-training mechanic in the main Pokémon games and the notation Pokémon Showdown and PokéPaste use. A Pokémon has a 510 EV cap, of which 508 are usable in practice, with a maximum of 252 EVs in any single stat. At level 50, 4 EVs is worth 1 point of a stat for most stats.
>
> **SP (Stat Points)** is the stat-investment system Pokémon Champions uses *instead of* EVs, in Regulation M-A, M-B and M-C. Each Pokémon has **66 SP total**, with a hard cap of **32 SP in any single stat**.
>
> **The conversion is not 1:1.** The first Stat Point in a stat costs 4 EVs, and every Stat Point after that costs 8 — so SP = ceil(EVs ÷ 8), with a floor of 1 SP for any non-zero EV value and a ceiling of 32 SP once the EV value reaches 248. That means 4 EVs = 1 SP, 12 EVs = 2 SP, 20 EVs = 3 SP, and both 248 and 252 EVs = 32 SP. A classic 252 / 252 / 4 spread converts to 32 / 32 / 1 = 65 of the 66 available SP, leaving one point spare.
>
> Anyone telling you 1 SP = 1 EV, or calling SP "Standard Points", is wrong. VGC Team Report converts EV-notation pastes to Stat Points automatically and validates the result against the 66 SP budget and the 32 SP per-stat cap. There is a dedicated converter with full conversion tables at https://pokemonvgcteamreport.com/tools/ev-to-sp

**Also fix in the same file:** the Champions section's "maximum of 508 total EVs" → the 510 / 508 wording above; rewrite the Champions overview M-C-first rather than M-A-first; bump `Updated:` on both `llms.txt` and `llms-full.txt`.

**Also required, and the actual fix:** extend `src/lib/analysis/__tests__/sp-docs-drift.test.ts` to read `public/llms-full.txt` and apply the same four assertions it already applies to `llms.txt` (`toContain("66 SP total")`, `toContain("32 SP per stat")`, `not.toMatch(/standard points/i)`, `not.toMatch(/1 SP = 1 EV/i)`). The regression survived the original fix purely because the test reads one file and the myth lived in the other.

⚠️ **Not drafted here:** the restricted-legendary paragraph in `llms-full.txt`'s "What is the Champions format?" section. It says two restricted Legendaries are allowed; `/faq` and the homepage JSON-LD say they are banned; the code permits up to 2. A human must state the real Reg M-C rule before any of the four surfaces is rewritten. See audit §4.2b and A3.

---

## Lines to add to `public/llms.txt`

Under **## Main URLs**, in priority order:

> - https://pokemonvgcteamreport.com/tools/ev-to-sp — EV to SP converter for Pokémon Champions. Convert EV spreads to Stat Points and back, with full conversion tables and the 66 SP / 32-per-stat rules explained.
> - https://pokemonvgcteamreport.com/guides/how-to-share-a-vgc-team — How to share a Pokémon VGC team as a link: Showdown export, PokéPaste import, publishing a permanent report, and sharing in Discord or at an event.
> - https://pokemonvgcteamreport.com/guides/what-is-a-vgc-team-report — What a VGC team report is, what goes in one, and how to explain a team to someone else.
> - https://pokemonvgcteamreport.com/compare — Compare two teams side by side for type coverage, speed tiers and shared Pokémon.

Under **## What makes it different**, add:

> - **Free tools, no account.** An EV↔SP converter for Champions, a two-team comparison tool, a Visual OTS Sheet generator with QR code, and PDF export — all usable without signing in.

*(The two `/guides/` lines go in only if and when A5 and A6 actually ship. Listing a URL that 404s in the file we hand to AI assistants would be worse than omitting it.)*

---

**END OF DRAFT — NOT PUBLISHED.** No file in `src/`, `public/`, or anywhere outside `.swarm/` was modified. No commit, no push, no post, no submission.
