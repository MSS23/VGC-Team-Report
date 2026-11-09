# Container egress check — 09-11-26

Run before dispatching Wave 1, to decide whether web research was viable.
Command: `curl -s -o /dev/null -w "%{http_code}" -m 20 -A "Mozilla/5.0" <url>`

| Host | HTTP code | Verdict |
|------|-----------|---------|
| https://www.pikalytics.com/ | 000 | BLOCKED |
| https://pokepast.es/ | 000 | BLOCKED |
| https://www.reddit.com/r/VGC/top.json | 000 | BLOCKED |
| https://play.limitlesstcg.com/ | 000 | BLOCKED |
| https://victoryroadvgc.com/ | 000 | BLOCKED |
| https://pokemonvgcteamreport.com/ (own prod site) | 000 | BLOCKED |
| https://api.github.com/ | 200 | reachable |

Also reachable: `registry.npmjs.org` (npm install succeeded through the proxy) and
`api.linear.app` (board queries succeeded).

## Decision taken

`000` is a connection-level failure, not an HTTP error — nothing was returned at all.
Every external data source the Wave 1 research agents needed is unreachable, including
the project's own production site.

Wave 1 research agents **R1, R2, R3, R4, R5 and R7 were therefore NOT dispatched**:

- R1/R2 competitor teardowns (Pikalytics, PokePaste, VGCpastes, Limitless, Trainer Hill)
- R3 Reddit sentiment (r/VGC, r/stunfisk)
- R4 Twitter/X creator sentiment
- R5 mobile UX pattern research (Strava, Pinterest, Behance, Figma)
- R7 AEO/GEO AI-citation scan

Dispatching them would have consumed 6 of the 25 subagent slots and returned reports
with no reachable sources. Prior runs recorded exactly that outcome (see VGC-255, which
notes R1's "community-sentiment half is low-confidence as a result"), and the risk is
worse than waste: unsourced competitor or sentiment claims filed as Linear tickets
would pollute the board with fabricated findings.

The budget was redirected to offline-capable work: static audits (C1-C5, R8, and a
repository-only R6 SEO audit) and ticket implementation, which is GOAL A anyway.

## Already ticketed

VGC-255 (P1, Backlog) — "[INFRA] Swarm container egress policy blocks every external
data source". Confirmed still fully unresolved tonight; a comment was added.

Note this run's result differs from VGC-255's description in one detail: VGC-255 records
`403 on CONNECT`, whereas tonight every blocked host returned `000` (no response at
all). Same practical outcome, slightly different policy behaviour.
