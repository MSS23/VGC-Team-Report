# Research Synthesis — Nightly Swarm 2026-05-28

## Top 5 Highest-Leverage Opportunities

1. **AI crawlers were being blocked (FIXED THIS RUN)** — GPTBot, ClaudeBot, PerplexityBot blocked by middleware despite robots.txt allowing them. Zero AI citations as a result. Fix landed in commit 737bb02.

2. **PokePaste is dying — capture window is NOW** — 156 open issues, broken sprites, community-built browser extension needed. Indianapolis Regionals May 29-31 creates peak tool evaluation. Anonymous quick-paste import would be the highest-impact capture mechanism.

3. **@pkmn/dex ships 6.7 MB to every client** — 52% of homepage JS. Dynamic import on cache miss would halve the bundle instantly. Turbopack duplicates the chunk between homepage and /compare.

4. **Only 2 pages indexed by Google** — Despite thousands in sitemap. Homepage entirely "use client" so crawlers see empty shell. Server-rendering or hybrid rendering is the structural fix.

5. **Zero organic community mentions** — Not mentioned in any Reddit/Discord/Twitter thread found by R3/R4. Listed on VGCpedia and DevonCorp but no organic discussion. Getting listed on Victory Road /resources is the highest-leverage free distribution action.

## Top 5 Quick-Win Bugs/Issues

1. Email XSS in comment/welcome emails (FIXED THIS RUN)
2. GraphQL injection in cron routes (FIXED THIS RUN)  
3. Bot detection contradicting robots.txt (FIXED THIS RUN)
4. Timing-unsafe secret comparison in admin routes (FIXED THIS RUN)
5. Views API shareId not validated (FIXED THIS RUN)

## PostHog Data
Not available — no credentials in this execution environment.

## Conflict Risk Files
No files overlapped with main — branch was cut fresh from main tonight.
