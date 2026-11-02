# [Perf] og:image fingerprint cannot survive a jsonb key reorder, so every tagged report re-renders and re-uploads on every save

- **Priority:** High
- **Labels:** auto-research, Performance
- **Target state:** Backlog
- **Status:** NOT FILED — Linear workspace is at its free-plan active-issue limit

## Source

`.swarm/c5-commit-review-02-11-26.md`, follow-up finding on commit `e4d9354` (*"pre-render the shared-report og:image card to Vercel Blob"*, PR #89).

## Finding

The og:image pipeline fingerprints report state to decide whether the card needs re-rendering. That fingerprint **cannot survive a Postgres `jsonb` key reorder** — and `jsonb` does not preserve key order.

So for every report that carries tags, the fingerprint comparison never matches, and the card is **re-rendered and re-uploaded to Vercel Blob on every single save, forever**.

## Cost

* Vercel Blob write operations and bandwidth on every save, indefinitely.
* A full card render (`html2canvas`/satori-class work) per save rather than per meaningful change.
* Scales with editing activity, so the most engaged users cost the most.

## Fix direction

Fingerprint over a **canonicalised** form — sort object keys recursively before hashing — so the hash depends on content, not on whatever order `jsonb` returns. Check whether the same assumption is made anywhere else state is hashed or compared (the share-baseline fingerprint is a likely sibling).

Worth a vitest test that pins: same content, different key order, same fingerprint.
