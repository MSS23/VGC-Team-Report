/**
 * check-bundle-size.mjs — bundle-size regression gate.
 *
 * Next 16 + Turbopack no longer prints the "First Load JS" table (build output
 * is just Route / Revalidate / Expire), so a heavy dependency slipping into the
 * client graph is completely invisible. That is exactly how VGC-256 (zod,
 * 50.4 kB gz) and VGC-257 (dex-subset, 330 kB) shipped and sat unnoticed.
 *
 * Run AFTER `next build`:
 *
 *     node scripts/check-bundle-size.mjs            # check against budgets
 *     node scripts/check-bundle-size.mjs --update   # re-baseline, deliberately
 *     node scripts/check-bundle-size.mjs --warn     # report, never fail the run
 *     node scripts/check-bundle-size.mjs --json     # machine-readable output
 *     node scripts/check-bundle-size.mjs --dist=/tmp/x/.next
 *
 * Budgets live in scripts/bundle-budgets.json (committed).
 *
 * ── What is measured ──────────────────────────────────────────────────────
 * The EAGER script set for a route: every `<script src>` the prerendered HTML
 * ships, i.e. what the browser must download before hydration. That is the
 * closest equivalent to the old "First Load JS" number. Lazily `import()`ed
 * chunks are NOT counted — they are not part of first load.
 *
 * Two resolution modes, in order:
 *
 *   1. HTML   — read `.next/server/app/<route>.html` and collect
 *               `<script src="/_next/static/...">`. Used for every prerendered
 *               (○ Static / ● SSG) route.
 *   2. MANIFEST — dynamic routes (ƒ, e.g. the share route /s/[id]) are never
 *               prerendered, so there is no HTML to read. Instead the eager set
 *               is reconstructed from
 *                 build-manifest.json  → rootMainFiles + polyfillFiles
 *                 <route>/page_client-reference-manifest.js
 *                                      → clientModules[*].chunks + entryJSFiles
 *               This reconstruction was verified against the HTML of every
 *               prerendered route in this app (/, /compare, /champions/*, /faq
 *               …) and produced a byte-identical chunk set each time, so the
 *               two modes are directly comparable.
 *
 * ── Duplicate chunks ──────────────────────────────────────────────────────
 * Turbopack does not guarantee that a module shared by two entrypoints becomes
 * one shared chunk — it can emit two byte-identical copies under different
 * hashed names. Convention chosen here: WIRE COST. Each route's total is the
 * sum over the distinct chunk URLs that route loads, and a chunk is counted
 * again for every distinct URL even if some other chunk has identical bytes,
 * because the browser issues one request per URL and pays for each one.
 * Consequences of that convention, both deliberate:
 *   · a chunk shared by two routes under the SAME url is counted in full in
 *     both routes' totals (each route is a standalone cold-load cost, so the
 *     per-route numbers are not additive into a site total), and
 *   · byte-identical chunks under DIFFERENT urls are counted twice, and are
 *     also listed under "duplicate chunk content" below the table — so a real
 *     double-ship shows up as both a bigger number and an explicit warning
 *     rather than being smoothed away by dedupe-by-content accounting.
 *
 * Exit codes: 0 ok · 1 over budget · 2 could not measure (missing build, etc).
 */

import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { readFileSync, existsSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BUDGETS_URL = new URL("./bundle-budgets.json", import.meta.url);
const DEFAULT_DIST_URL = new URL("../.next/", import.meta.url);

// Level 9 so the number is stable and reproducible across machines; CDNs
// typically serve ~level 6, so this is a mild under-estimate of the real wire
// size. What matters for a regression gate is that it is measured identically
// every time.
const GZIP_LEVEL = 9;

const EXIT_OVER_BUDGET = 1;
const EXIT_CANNOT_MEASURE = 2;

/* ── args ─────────────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const options = { update: false, warn: false, json: false, dist: null };

  for (const arg of argv) {
    if (arg === "--update") options.update = true;
    else if (arg === "--warn" || arg === "--warn-only") options.warn = true;
    else if (arg === "--json") options.json = true;
    else if (arg.startsWith("--dist=")) options.dist = arg.slice("--dist=".length);
    else if (arg === "--help" || arg === "-h") options.help = true;
    else fail(`Unknown argument: ${arg}\nRun with --help for usage.`);
  }

  return options;
}

const HELP = `check-bundle-size.mjs — eager first-load JS budget check

Usage: node scripts/check-bundle-size.mjs [options]

  --update        rewrite scripts/bundle-budgets.json from this build
  --warn          report regressions but always exit 0
  --json          emit machine-readable JSON instead of a table
  --dist=<path>   measure a .next directory other than ./.next
  --help          show this message

Requires a completed \`next build\`. Exits 2 if it cannot measure.`;

/* ── failure ──────────────────────────────────────────────────────────── */

function fail(message) {
  // Loud on purpose: a bundle check that silently "passes" because it measured
  // nothing is worse than having no check at all.
  console.error("");
  console.error("  ✖ BUNDLE SIZE CHECK COULD NOT RUN");
  console.error("");
  for (const line of String(message).split("\n")) console.error(`    ${line}`);
  console.error("");
  process.exit(EXIT_CANNOT_MEASURE);
}

/* ── formatting ───────────────────────────────────────────────────────── */

// Base-1000, matching the units Next's old First Load JS table used.
function formatBytes(bytes) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
  return `${bytes} B`;
}

function formatDelta(bytes) {
  if (bytes === 0) return "—";
  const sign = bytes > 0 ? "+" : "−";
  return `${sign}${formatBytes(Math.abs(bytes))}`;
}

function pad(value, width) {
  const text = String(value);
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

function padStart(value, width) {
  const text = String(value);
  return text.length >= width ? text : " ".repeat(width - text.length) + text;
}

/* ── chunk-set resolution ─────────────────────────────────────────────── */

function stripNextPrefix(assetPath) {
  let path = assetPath.replace(/^\/+/, "");
  if (path.startsWith("_next/")) path = path.slice("_next/".length);
  return path;
}

function readClientReferenceManifest(path) {
  const source = readFileSync(path, "utf8");
  // The file is `globalThis.__RSC_MANIFEST["<route>"] = { … }` — grab the JSON
  // object literal rather than eval'ing the module.
  const start = source.indexOf('= {"moduleLoading"');
  if (start === -1) {
    fail(
      `Could not parse client reference manifest:\n  ${path}\n` +
        `Expected a \`__RSC_MANIFEST[...] = {"moduleLoading"…}\` assignment.\n` +
        `The Next.js output format probably changed — this script needs updating.`,
    );
  }
  const json = source.slice(start + 1).trim().replace(/;$/, "");
  try {
    return JSON.parse(json);
  } catch (error) {
    fail(`Could not parse client reference manifest JSON:\n  ${path}\n  ${error.message}`);
  }
}

/** Rebuild a route's eager chunk set from the manifests. null if absent. */
function manifestChunksFor(distDir, pattern, rootChunks) {
  const relative =
    pattern === "/"
      ? "server/app/page_client-reference-manifest.js"
      : `server/app${pattern}/page_client-reference-manifest.js`;
  const path = new URL(relative, distDir);
  if (!existsSync(path)) return null;

  const manifest = readClientReferenceManifest(fileURLToPath(path));
  const chunks = new Set(rootChunks);
  for (const entry of Object.values(manifest.clientModules ?? {})) {
    for (const chunk of entry.chunks ?? []) chunks.add(stripNextPrefix(chunk));
  }
  for (const files of Object.values(manifest.entryJSFiles ?? {})) {
    for (const chunk of files) chunks.add(stripNextPrefix(chunk));
  }
  return { source: relative, chunks: [...chunks] };
}

/**
 * Resolve the eager JS chunk set for one route.
 * Returns { mode, source, chunks: string[] } with chunks relative to .next/.
 */
function resolveRouteChunks(distDir, route, rootChunks) {
  const pattern = route.route;
  const samplePath = route.sample ?? pattern;

  // 1. Prerendered HTML.
  const htmlRelative =
    samplePath === "/" ? "server/app/index.html" : `server/app${samplePath}.html`;
  const htmlPath = new URL(htmlRelative, distDir);

  if (existsSync(htmlPath)) {
    const html = readFileSync(htmlPath, "utf8");
    const chunks = new Set();
    for (const match of html.matchAll(/<script[^>]+src="([^"]+)"/g)) {
      const src = match[1];
      if (!src.startsWith("/_next/static/")) continue; // third-party / inline
      chunks.add(stripNextPrefix(src));
    }
    if (chunks.size === 0) {
      fail(
        `Found ${htmlRelative} but it contains no /_next/static scripts.\n` +
          `Refusing to report a 0-byte bundle for ${pattern}.`,
      );
    }
    return { mode: "html", source: htmlRelative, chunks: [...chunks] };
  }

  // 2. Dynamic route — reconstruct from the client reference manifest.
  const fromManifest = manifestChunksFor(distDir, pattern, rootChunks);
  if (fromManifest) {
    return { mode: "manifest", source: fromManifest.source, chunks: fromManifest.chunks };
  }

  fail(
    `Cannot measure route ${pattern}.\n` +
      `Neither of these exists under ${fileURLToPath(distDir)}:\n` +
      `  ${htmlRelative}\n` +
      `  server/app${pattern === "/" ? "" : pattern}/page_client-reference-manifest.js\n` +
      `Either the build is incomplete, or the route was renamed/removed and\n` +
      `scripts/bundle-budgets.json needs updating.`,
  );
}

/* ── measurement ──────────────────────────────────────────────────────── */

// Chunks are read, gzipped and hashed once, however many routes load them.
const chunkCache = new Map();

function statChunk(distDir, chunk) {
  const cached = chunkCache.get(chunk);
  if (cached) return cached;

  const chunkPath = new URL(chunk, distDir);
  if (!existsSync(chunkPath)) {
    fail(
      `Chunk referenced by the build is missing from disk:\n  ${chunk}\n` +
        `The .next directory looks incomplete or partially cleaned.`,
    );
  }
  const bytes = readFileSync(chunkPath);
  const entry = {
    chunk,
    rawBytes: bytes.byteLength,
    gzipBytes: gzipSync(bytes, { level: GZIP_LEVEL }).byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  chunkCache.set(chunk, entry);
  return entry;
}

function measureChunks(distDir, chunks) {
  const entries = chunks
    .slice()
    .sort()
    .map((chunk) => statChunk(distDir, chunk));

  return {
    rawBytes: entries.reduce((total, entry) => total + entry.rawBytes, 0),
    gzipBytes: entries.reduce((total, entry) => total + entry.gzipBytes, 0),
    chunkCount: entries.length,
    largestChunks: entries
      .slice()
      .sort((a, b) => b.rawBytes - a.rawBytes)
      .slice(0, 3)
      .map((entry) => ({ chunk: entry.chunk, rawBytes: entry.rawBytes })),
  };
}

/**
 * Groups of ≥2 distinct chunk URLs with byte-identical content, anywhere across
 * the measured routes. Same content under two URLs = the browser downloads it
 * twice and caches it twice; that is a real regression worth naming.
 */
function findDuplicateContent(results) {
  const byHash = new Map();
  for (const [chunk, entry] of chunkCache) {
    if (!byHash.has(entry.sha256)) byHash.set(entry.sha256, []);
    byHash.get(entry.sha256).push(chunk);
  }

  const duplicates = [];
  for (const chunks of byHash.values()) {
    if (chunks.length < 2) continue;
    const eachBytes = chunkCache.get(chunks[0]).rawBytes;
    duplicates.push({
      copies: chunks.length,
      eachBytes,
      wastedBytes: eachBytes * (chunks.length - 1),
      chunks: chunks.sort(),
      routes: results
        .filter((result) => chunks.some((chunk) => result.chunks.includes(chunk)))
        .map((result) => result.label),
      sameRoute: results.some(
        (result) => chunks.filter((chunk) => result.chunks.includes(chunk)).length > 1,
      ),
    });
  }
  return duplicates.sort((a, b) => b.wastedBytes - a.wastedBytes);
}

/* ── main ─────────────────────────────────────────────────────────────── */

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  console.log(HELP);
  process.exit(0);
}

if (!existsSync(BUDGETS_URL)) {
  fail(
    `Budget file missing: ${fileURLToPath(BUDGETS_URL)}\n` +
      `Run \`node scripts/check-bundle-size.mjs --update\` after a build to create it.`,
  );
}

let budgets;
try {
  budgets = JSON.parse(readFileSync(BUDGETS_URL, "utf8"));
} catch (error) {
  fail(`Budget file is not valid JSON:\n  ${fileURLToPath(BUDGETS_URL)}\n  ${error.message}`);
}

if (!Array.isArray(budgets.routes) || budgets.routes.length === 0) {
  fail(`Budget file has no "routes" array: ${fileURLToPath(BUDGETS_URL)}`);
}

const distDir = options.dist
  ? new URL(`${options.dist.replace(/\/?$/, "/")}`, `file://${process.cwd()}/`)
  : DEFAULT_DIST_URL;
const distPath = fileURLToPath(distDir);

if (!existsSync(distDir) || !statSync(distPath).isDirectory()) {
  fail(
    `No build output found at:\n  ${distPath}\n\n` +
      `Run \`npm run build\` first, then re-run this check.\n` +
      `(Nothing was measured — this is a failure, not a pass.)`,
  );
}

const buildManifestPath = new URL("build-manifest.json", distDir);
if (!existsSync(buildManifestPath)) {
  fail(
    `${distPath} exists but has no build-manifest.json.\n` +
      `The build is incomplete or was interrupted — re-run \`npm run build\`.`,
  );
}
const buildManifest = JSON.parse(readFileSync(buildManifestPath, "utf8"));
const rootChunks = [
  ...(buildManifest.rootMainFiles ?? []),
  ...(buildManifest.polyfillFiles ?? []),
].map(stripNextPrefix);

const tolerancePercent = Number(budgets.tolerancePercent ?? 5);
const results = [];

for (const route of budgets.routes) {
  if (!route || typeof route.route !== "string") {
    fail(`Budget file has a route entry without a "route" string.`);
  }
  const resolved = resolveRouteChunks(distDir, route, rootChunks);
  const measured = measureChunks(distDir, resolved.chunks);

  const baselineRaw = route.rawBytes ?? null;
  const baselineGzip = route.gzipBytes ?? null;
  const ceilingRaw =
    baselineRaw === null ? null : Math.round(baselineRaw * (1 + tolerancePercent / 100));
  const ceilingGzip =
    baselineGzip === null ? null : Math.round(baselineGzip * (1 + tolerancePercent / 100));

  results.push({
    route: route.route,
    label: route.label ?? route.route,
    sample: route.sample ?? null,
    mode: resolved.mode,
    source: resolved.source,
    chunks: resolved.chunks,
    ...measured,
    baselineRaw,
    baselineGzip,
    ceilingRaw,
    ceilingGzip,
    deltaRaw: baselineRaw === null ? null : measured.rawBytes - baselineRaw,
    deltaGzip: baselineGzip === null ? null : measured.gzipBytes - baselineGzip,
    overBudget:
      (ceilingRaw !== null && measured.rawBytes > ceilingRaw) ||
      (ceilingGzip !== null && measured.gzipBytes > ceilingGzip),
    unbudgeted: baselineRaw === null || baselineGzip === null,
  });
}

/* ── self-check ───────────────────────────────────────────────────────── */

/**
 * The manifest reconstruction used for dynamic routes is only trustworthy while
 * it reproduces the HTML script set exactly. Verify that against a route we can
 * measure both ways, so a Next.js output-format change surfaces here instead of
 * silently skewing the /s/[id] number.
 */
const selfCheckWarnings = [];
for (const result of results) {
  if (result.mode !== "html") continue;
  const rebuilt = manifestChunksFor(distDir, result.route, rootChunks);
  if (!rebuilt) continue;
  const fromHtml = new Set(result.chunks);
  const fromManifest = new Set(rebuilt.chunks);
  const missing = [...fromHtml].filter((chunk) => !fromManifest.has(chunk));
  const extra = [...fromManifest].filter((chunk) => !fromHtml.has(chunk));
  if (missing.length || extra.length) {
    selfCheckWarnings.push(
      `${result.label}: manifest reconstruction differs from HTML ` +
        `(${missing.length} missing, ${extra.length} extra)`,
    );
  }
}

/* ── --update ─────────────────────────────────────────────────────────── */

if (options.update) {
  const next = {
    ...budgets,
    generatedAt: new Date().toISOString().slice(0, 10),
    routes: budgets.routes.map((route) => {
      const result = results.find((entry) => entry.route === route.route);
      return { ...route, rawBytes: result.rawBytes, gzipBytes: result.gzipBytes };
    }),
  };
  writeFileSync(BUDGETS_URL, `${JSON.stringify(next, null, 2)}\n`);
  console.log("");
  console.log(`  Re-baselined ${results.length} route(s) → scripts/bundle-budgets.json`);
  for (const result of results) {
    console.log(
      `    ${pad(result.route, 24)} ${padStart(formatBytes(result.rawBytes), 10)} raw` +
        `  ${padStart(formatBytes(result.gzipBytes), 10)} gzip` +
        (result.deltaRaw === null ? "  (new)" : `  (was ${formatBytes(result.baselineRaw)} raw)`),
    );
  }
  console.log("");
  console.log("  Review the diff before committing — this is the deliberate re-baseline.");
  console.log("");
  process.exit(0);
}

/* ── --json ───────────────────────────────────────────────────────────── */

if (options.json) {
  const failed = results.some((result) => result.overBudget || result.unbudgeted);
  console.log(
    JSON.stringify(
      {
        tolerancePercent,
        distDir: distPath,
        selfCheckWarnings,
        duplicateContent: findDuplicateContent(results),
        routes: results,
      },
      null,
      2,
    ),
  );
  process.exit(failed && !options.warn ? EXIT_OVER_BUDGET : 0);
}

/* ── human-readable report ────────────────────────────────────────────── */

const NAME_WIDTH = Math.max(24, ...results.map((result) => result.label.length + 1));

const buildIdPath = new URL("BUILD_ID", distDir);
const buildId = existsSync(buildIdPath) ? readFileSync(buildIdPath, "utf8").trim() : "unknown";

console.log("");
console.log(`  First Load JS (eager <script> set)  ·  build ${buildId}`);
console.log(`  ${distPath}`);
console.log("");
console.log(
  `  ${pad("Route", NAME_WIDTH)}${padStart("raw", 10)}${padStart("gzip", 11)}` +
    `${padStart("Δ gzip", 12)}${padStart("budget gz", 12)}   Status`,
);
console.log(`  ${"─".repeat(NAME_WIDTH + 45 + 10)}`);

let overBudgetCount = 0;
let unbudgetedCount = 0;

for (const result of results) {
  let status;
  if (result.unbudgeted) {
    status = "NO BUDGET";
    unbudgetedCount += 1;
  } else if (result.overBudget) {
    status = "OVER BUDGET";
    overBudgetCount += 1;
  } else if (result.deltaGzip > 0) {
    status = "ok (grew)";
  } else if (result.deltaGzip < 0) {
    status = "ok (shrank)";
  } else {
    status = "ok";
  }

  console.log(
    `  ${pad(result.label, NAME_WIDTH)}` +
      `${padStart(formatBytes(result.rawBytes), 10)}` +
      `${padStart(formatBytes(result.gzipBytes), 11)}` +
      `${padStart(result.deltaGzip === null ? "—" : formatDelta(result.deltaGzip), 12)}` +
      `${padStart(result.ceilingGzip === null ? "—" : formatBytes(result.ceilingGzip), 12)}` +
      `   ${status}`,
  );
}

console.log("");
console.log(
  `  Budget = baseline + ${tolerancePercent}% headroom. ` +
    `Chunks counted per distinct URL (wire cost).`,
);

for (const result of results) {
  const suffix = result.mode === "manifest" ? "  [dynamic route — via client manifest]" : "";
  console.log(
    `    ${pad(result.label, NAME_WIDTH)} ${padStart(result.chunkCount, 3)} chunks` +
      `${result.sample ? `  sample ${result.sample}` : ""}${suffix}`,
  );
}

const duplicates = findDuplicateContent(results);
if (duplicates.length > 0) {
  console.log("");
  console.log("  Duplicate chunk content (byte-identical bytes under >1 url):");
  for (const duplicate of duplicates) {
    console.log(
      `    ${duplicate.copies}× ${formatBytes(duplicate.eachBytes)}` +
        ` (${formatBytes(duplicate.wastedBytes)} redundant)` +
        `${duplicate.sameRoute ? "  ⚠ both loaded by the same route" : ""}`,
    );
    console.log(`      ${duplicate.chunks.join("  ")}`);
    console.log(`      seen on: ${duplicate.routes.join(", ")}`);
  }
}

if (selfCheckWarnings.length > 0) {
  console.log("");
  console.log("  ⚠ Self-check failed — the dynamic-route reconstruction no longer matches");
  console.log("    the prerendered HTML, so manifest-mode routes may be inaccurate:");
  for (const warning of selfCheckWarnings) console.log(`      ${warning}`);
  console.log("    Next.js output format likely changed; update check-bundle-size.mjs.");
}

console.log("");

if (unbudgetedCount > 0) {
  console.log(`  ${unbudgetedCount} route(s) have no committed budget.`);
  console.log("  Run `npm run check:bundle -- --update` to baseline them.");
  console.log("");
}

if (overBudgetCount > 0) {
  console.log(`  ✖ ${overBudgetCount} route(s) over budget.`);
  console.log("");
  console.log("  Something got heavier. Before re-baselining, check what entered the");
  console.log("  client graph — a stray `import` of a server-only module, a new");
  console.log("  dependency pulled into a Client Component, or a data file that should");
  console.log("  be fetched instead of bundled (see VGC-256 / VGC-257).");
  console.log("");
  console.log("  If the growth is intended: npm run check:bundle -- --update");
  console.log("");
  if (!options.warn) process.exit(EXIT_OVER_BUDGET);
} else if (unbudgetedCount > 0) {
  if (!options.warn) process.exit(EXIT_OVER_BUDGET);
} else {
  console.log("  ✔ All routes within budget.");
  console.log("");
}
