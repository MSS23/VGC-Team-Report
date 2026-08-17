import { NextRequest, NextResponse } from "next/server";
import {
  buildChainForPrimaryUrl,
  buildSpriteFallbackChain,
  isAllowedSpriteUrl,
  SHOWDOWN_SUBSTITUTE_URL,
} from "@/lib/utils/sprite-fallback";

export const runtime = "edge";

/**
 * Same-origin sprite proxy with an ordered fallback chain.
 *
 * Two jobs:
 *
 * 1. CORS. Showdown's sprite CDN responds to GET with an Allow-Methods
 *    header but no `Access-Control-Allow-Origin`. That's fine for normal
 *    <img> rendering (where no crossorigin attribute is set) but it breaks
 *    html2canvas PNG capture — html2canvas uses `useCORS: true`, which
 *    forces `crossorigin="anonymous"` on every image, and without the
 *    Allow-Origin response header the image fails to decode. Exports end up
 *    with blank sprite slots. Re-serving the bytes from our own origin makes
 *    the image same-origin to our pages so CORS doesn't apply.
 *
 * 2. VGC-232 — missing DLC formes. PokePaste, the dominant share format,
 *    never patched its sprite URLs, so Zygarde-10%, Zygarde-Complete,
 *    Sirfetch'd and Ash-Greninja render as broken images. Rather than trust
 *    one upstream, this route walks an ordered, finite chain (Showdown
 *    animated -> Showdown HOME -> PokemonDB HOME -> Showdown gen5 ->
 *    substitute) and serves the first upstream that returns real image
 *    bytes. If every link fails it emits an inline SVG placeholder, so the
 *    response is ALWAYS a renderable image — a broken <img> is the exact bug
 *    being fixed, and returning an upstream error status would just recreate
 *    it.
 *
 * SSRF: hosts, path prefixes and filenames are allowlisted in
 * `sprite-fallback.ts`. Species text is normalised to `[a-z0-9-]` and only
 * ever lands in a path segment — never in the host, scheme, port or query.
 * Every candidate is re-checked with `isAllowedSpriteUrl` immediately before
 * it is fetched, so nothing reaches `fetch()` that the allowlist didn't
 * produce.
 *
 * GET /api/sprite?u=https://play.pokemonshowdown.com/sprites/home/incineroar.png
 * GET /api/sprite?species=Zygarde-10%25&animated=1&shiny=1
 */

/** Per-upstream-attempt timeout. */
const ATTEMPT_TIMEOUT_MS = 3000;
/** Whole-request budget across all attempts — bounds worst-case latency. */
const TOTAL_BUDGET_MS = 8000;
/** Hard cap on upstream body size. Sprites are ~10-60KB; 2MB is absurdly generous. */
const MAX_BYTES = 2_000_000;
/** Longest species string we'll even look at. */
const MAX_SPECIES_LEN = 64;

/** Sprites are effectively immutable once they exist. */
const HIT_CACHE_CONTROL = "public, max-age=86400, s-maxage=31536000, immutable";
/**
 * Negative result (nothing in the chain had the sprite). Cached briefly so a
 * missing forme doesn't cost a full chain of upstream round-trips on every
 * render, but short enough that a newly-published sprite appears the same
 * day rather than being pinned for a year by `immutable`.
 */
const MISS_CACHE_CONTROL = "public, max-age=300, s-maxage=300";

/**
 * In-isolate negative cache of URLs that recently 404'd, so a chain whose
 * first two links are missing doesn't re-request them for every sprite on
 * the page. Plain Map, no timers — a module-scope `setInterval` here would
 * keep the function warm and defeat scale-to-zero (see VGC changelog v5.11).
 * Entries are evicted lazily on read and by size on write.
 */
const MISS_TTL_MS = 5 * 60_000;
const MISS_CACHE_MAX = 500;
const missCache = new Map<string, number>();

function isKnownMiss(url: string): boolean {
  const expiry = missCache.get(url);
  if (expiry === undefined) return false;
  if (expiry <= Date.now()) {
    missCache.delete(url);
    return false;
  }
  return true;
}

function rememberMiss(url: string): void {
  if (missCache.size >= MISS_CACHE_MAX) {
    // Cheapest possible eviction: drop the oldest insertion.
    const oldest = missCache.keys().next();
    if (!oldest.done) missCache.delete(oldest.value);
  }
  missCache.set(url, Date.now() + MISS_TTL_MS);
}

/**
 * Network-free terminal. Every upstream can be down, rate-limiting us, or
 * simply missing the forme — this still renders.
 */
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="Sprite unavailable"><rect width="96" height="96" rx="12" fill="#9ca3af" fill-opacity="0.18"/><circle cx="48" cy="40" r="17" fill="none" stroke="#6b7280" stroke-width="4"/><path d="M31 40h34" stroke="#6b7280" stroke-width="4" stroke-linecap="round"/><circle cx="48" cy="40" r="6" fill="#6b7280"/><path d="M30 70h36" stroke="#6b7280" stroke-width="4" stroke-linecap="round" stroke-opacity="0.6"/></svg>`;

function placeholderResponse(): NextResponse {
  return new NextResponse(PLACEHOLDER_SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": MISS_CACHE_CONTROL,
      "Access-Control-Allow-Origin": "*",
      "X-Sprite-Source": "placeholder",
    },
  });
}

/**
 * Reads an upstream body with a hard byte cap, aborting mid-stream rather
 * than buffering an unbounded response into memory.
 */
async function readCapped(res: Response, max: number): Promise<Uint8Array | null> {
  const declared = res.headers.get("content-length");
  if (declared && Number(declared) > max) return null;

  const body = res.body;
  if (!body) return null;

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > max) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

interface SpriteBytes {
  bytes: Uint8Array;
  contentType: string;
}

/** One upstream attempt. Returns null for any failure — never throws. */
async function tryFetch(url: string, budgetLeftMs: number): Promise<SpriteBytes | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    Math.max(1, Math.min(ATTEMPT_TIMEOUT_MS, budgetLeftMs)),
  );

  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "VGC-Team-Report/1.0" },
      // Hint Vercel's edge cache — sprites are effectively immutable so a
      // day of freshness at the origin is fine; we add a long Cache-Control
      // below for the client + CDN.
      next: { revalidate: 86400 },
      signal: controller.signal,
      redirect: "follow",
    });

    if (!upstream.ok) return null;

    // Never re-serve an upstream that hands back HTML (a soft-404 error page
    // is the classic way a "200" is really a miss).
    const contentType = upstream.headers.get("content-type") ?? "image/png";
    if (!contentType.startsWith("image/")) return null;

    const bytes = await readCapped(upstream, MAX_BYTES);
    if (!bytes || bytes.byteLength === 0) return null;

    return { bytes, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const rawUrl = params.get("u");
  const rawSpecies = params.get("species");
  const animated = params.get("animated") === "1" || params.get("animated") === "true";
  const shiny = params.get("shiny") === "1" || params.get("shiny") === "true";

  const species =
    rawSpecies && rawSpecies.length <= MAX_SPECIES_LEN ? rawSpecies : null;

  if (!rawUrl && !species) {
    return new NextResponse("Missing u or species", { status: 400 });
  }

  let chain: string[];

  if (rawUrl) {
    // Host + path allowlist — never fetch arbitrary URLs on behalf of a
    // client, that's an SSRF on a silver platter.
    if (!isAllowedSpriteUrl(rawUrl)) {
      return new NextResponse("Url not allowed", { status: 400 });
    }
    chain = buildChainForPrimaryUrl(rawUrl, species, { animated, shiny });
  } else {
    // `species` is non-null here — the guard above rejects the both-missing
    // case, and `rawUrl` is falsy in this branch.
    chain = buildSpriteFallbackChain(species ?? "", { animated, shiny });
  }

  const startedAt = Date.now();
  const deferred: string[] = [];

  for (const candidate of chain) {
    // Defence in depth: the chain is built from an allowlist, but re-check
    // every candidate at the point of use so no future edit can smuggle an
    // unvalidated URL into `fetch()`.
    if (!isAllowedSpriteUrl(candidate)) continue;

    // Known-missing links are skipped on this pass and retried only if every
    // other link also fails — that way a stale negative entry can never turn
    // into a permanently blank sprite.
    if (isKnownMiss(candidate)) {
      deferred.push(candidate);
      continue;
    }

    const budgetLeft = TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (budgetLeft <= 0) break;

    const result = await tryFetch(candidate, budgetLeft);
    if (result) return spriteResponse(result, candidate);
    rememberMiss(candidate);
  }

  for (const candidate of deferred) {
    const budgetLeft = TOTAL_BUDGET_MS - (Date.now() - startedAt);
    if (budgetLeft <= 0) break;

    const result = await tryFetch(candidate, budgetLeft);
    if (result) {
      missCache.delete(candidate);
      return spriteResponse(result, candidate);
    }
  }

  // Every upstream failed — still return something that renders.
  return placeholderResponse();
}

function spriteResponse({ bytes, contentType }: SpriteBytes, source: string): NextResponse {
  const isNegative = source === SHOWDOWN_SUBSTITUTE_URL;
  // `bytes` is exact-sized (allocated in readCapped), so its buffer is the
  // whole payload with no slicing needed.
  return new NextResponse(bytes.buffer as ArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      // A resolved sprite is immutable; the substitute means "we found
      // nothing", which is a negative result and must expire quickly.
      "Cache-Control": isNegative ? MISS_CACHE_CONTROL : HIT_CACHE_CONTROL,
      "Access-Control-Allow-Origin": "*",
      "X-Sprite-Source": new URL(source).hostname,
    },
  });
}
