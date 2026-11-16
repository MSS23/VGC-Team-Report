/**
 * species-spreads.ts — aggregate the most common stat spreads for one species
 * across every public report that uses it. Backs `/explore/spreads/[species]`
 * (VGC-217), the per-species "EV spread" landing pages.
 *
 * ── Why the paste and not `shares.species[]` ────────────────────────────────
 * The ticket says to read `shares.species[]` (GIN-indexed). That column no
 * longer exists: `src/lib/db/migrations/drop-species-column.sql` (VGC-218)
 * dropped both the column and `idx_shares_species` because it was write-only —
 * every read path still parses species out of `data->>'paste'`. So this module
 * does the same thing every other consumer does: prefilter in SQL with an
 * ILIKE on the paste text, then confirm (and read the spread) by actually
 * parsing the paste with `parseShowdownPaste`. The ILIKE is only a prefilter —
 * a paste that merely *mentions* the species in a nickname is dropped by the
 * parse step, so the denominator is always "reports that really field it".
 *
 * ── Units: EVs vs Champions SP ──────────────────────────────────────────────
 * Champions (Reg M-A/M-B/M-C) spends Stat Points, not EVs, and the report UI
 * renders those reports through `convertToChampionsSp`. Pooling a `32 HP /
 * 32 Atk` SP spread into the same bucket as a `252 HP / 252 Atk` EV spread
 * would produce a number that is true of neither, so the unit is part of the
 * grouping key and every row is labelled with it. Nothing is converted across
 * units and nothing is invented: a group's numbers are exactly what the
 * contributing reports show on their own report pages.
 *
 * ── No-database behaviour ───────────────────────────────────────────────────
 * `getSpeciesSpreads` never throws and never rejects. Production builds run
 * without `DATABASE_URL`, so a build-time or outage-time call returns an empty
 * aggregate with `unavailable: true` and the page renders an honest empty
 * state. Fabricating placeholder percentages here would put invented
 * competitive data into prerendered HTML and into `Dataset` JSON-LD, so the
 * empty path deliberately has no fallback numbers at all.
 */

import type { NeonQueryFunction } from "@neondatabase/serverless";

import { convertToChampionsSp } from "@/lib/analysis/stat-calculator";
import { POKEMON_DATA } from "@/lib/data/pokemon";
import { isChampionsFormat } from "@/lib/data/tags";
import { getDb } from "@/lib/db";
import { parseShowdownPaste } from "@/lib/parser/showdown-parser";
import type { StatName, StatSpread } from "@/lib/types/pokemon";
import { extractSpecies } from "@/lib/utils/extract-species";

type SqlClient = NeonQueryFunction<false, false>;

/** How many public reports we pull per species before aggregating. */
export const SPREAD_CANDIDATE_LIMIT = 400;
/** How many spread groups a page shows. The ticket asks for "top ~5". */
export const TOP_SPREAD_COUNT = 5;
/** Example report links shown per spread. The ticket asks for 1–2. */
export const EXAMPLES_PER_SPREAD = 2;
/**
 * A species needs this many reports before it earns a sitemap entry and an
 * indexable page. Below it the page is real but too thin to be worth
 * crawling, so it is served `noindex` rather than published as a stub.
 */
export const MIN_INDEXABLE_REPORTS = 3;

/** Which unit a spread's numbers are in. */
export type SpreadUnit = "ev" | "sp";

export interface SpreadExampleReport {
  /** Share id — links to `/s/{id}`. */
  id: string;
  creatorName?: string;
  tournamentName?: string;
  placement?: string;
}

export interface CommonSpread {
  /** Showdown-style stat line, e.g. `252 HP / 252 Atk / 4 Spe`. */
  label: string;
  spread: StatSpread;
  unit: SpreadUnit;
  /** Most common nature among the reports in this group. */
  nature: string | null;
  /** Most common held item among the reports in this group. */
  item: string | null;
  /** Reports using exactly this spread, in this unit. */
  count: number;
  /** `count` as a percentage of `totalReports`, to one decimal place. */
  percentage: number;
  examples: SpreadExampleReport[];
}

export interface SpeciesSpreadAggregate {
  /** Canonical display name, e.g. `Calyrex-Shadow`. */
  species: string;
  /** URL slug, e.g. `calyrex-shadow`. */
  slug: string;
  /** Public reports that actually field this species. The percentage base. */
  totalReports: number;
  /** Top groups, most used first. At most `TOP_SPREAD_COUNT`. */
  spreads: CommonSpread[];
  /** True when the database could not be reached. Distinct from "no data". */
  unavailable: boolean;
}

/** Row shape the aggregator needs: a share id plus its JSONB blob. */
export interface SpreadShareRow {
  id: string;
  data: Record<string, unknown>;
}

const STAT_ORDER: { key: StatName; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "atk", label: "Atk" },
  { key: "def", label: "Def" },
  { key: "spa", label: "SpA" },
  { key: "spd", label: "SpD" },
  { key: "spe", label: "Spe" },
];

/**
 * Normalise a species name to its `POKEMON_DATA` key / URL slug.
 *
 * Mirrors the key derivation inside `lookupPokemon` (src/lib/data/pokemon.ts)
 * so a slug that resolves here resolves there too. `__tests__` pins the
 * round-trip for every entry in the catalogue.
 */
export function speciesSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * The allowlist. A `/explore/spreads/[species]` segment is untrusted input, so
 * it must be an exact key of the hand-maintained species catalogue before it
 * is allowed anywhere near a query. Anything else 404s.
 */
export function isKnownSpeciesSlug(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(POKEMON_DATA, slug);
}

/** Canonical display name for a slug, or null when the slug is unknown. */
export function speciesDisplayName(slug: string): string | null {
  return isKnownSpeciesSlug(slug) ? POKEMON_DATA[slug].name : null;
}

/** `252 HP / 252 Atk / 4 Spe`, or `No investment` for an all-zero spread. */
export function formatSpread(spread: StatSpread): string {
  const parts = STAT_ORDER.filter(({ key }) => spread[key] > 0).map(
    ({ key, label }) => `${spread[key]} ${label}`,
  );
  return parts.length > 0 ? parts.join(" / ") : "No investment";
}

/** Stable grouping key: the unit plus the six values in canonical order. */
function spreadKey(unit: SpreadUnit, spread: StatSpread): string {
  return `${unit}:${STAT_ORDER.map(({ key }) => spread[key]).join("/")}`;
}

/**
 * The regulation tag a share was saved with. Older rows wrote it at the top
 * level of the blob, newer ones nest it under `tags` — the Champions meta
 * query reads both, so this does too.
 */
function regulationOf(data: Record<string, unknown>): string | null {
  const tags = data.tags;
  if (tags && typeof tags === "object") {
    const nested = (tags as Record<string, unknown>).regulation;
    if (typeof nested === "string" && nested) return nested;
  }
  const top = data.regulation;
  return typeof top === "string" && top ? top : null;
}

function optionalString(data: Record<string, unknown>, field: string): string | undefined {
  const value = data[field];
  return typeof value === "string" && value.trim() ? value : undefined;
}

/** Most frequent entry, ties broken alphabetically so output is deterministic. */
function mostCommon(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

interface SpreadGroup {
  unit: SpreadUnit;
  spread: StatSpread;
  count: number;
  natures: Map<string, number>;
  items: Map<string, number>;
  examples: SpreadExampleReport[];
}

/**
 * Pure aggregation over already-fetched rows. Separated from the query so the
 * grouping and percentage maths are testable against fixtures with no database
 * anywhere in the picture.
 *
 * Rows are expected in display order (most recently updated first); the
 * examples attached to each group are the first rows that landed in it.
 */
export function aggregateSpeciesSpreads(
  slug: string,
  rows: SpreadShareRow[],
): SpeciesSpreadAggregate {
  const species = speciesDisplayName(slug);
  if (!species) {
    return { species: slug, slug, totalReports: 0, spreads: [], unavailable: false };
  }

  const groups = new Map<string, SpreadGroup>();
  let totalReports = 0;

  for (const row of rows) {
    const paste = row.data?.paste;
    if (typeof paste !== "string" || !paste.trim()) continue;

    // Cheap reject before the full parse: `extractSpecies` already resolves
    // `Nickname (Species)` headers, so a paste that only name-drops the
    // species inside a nickname never reaches `parseShowdownPaste`.
    if (!extractSpecies(paste).some((name) => speciesSlug(name) === slug)) continue;

    const team = parseShowdownPaste(paste);
    const mon = team.pokemon.find((p) => speciesSlug(p.species) === slug);
    if (!mon) continue;

    totalReports++;

    const champions = isChampionsFormat(regulationOf(row.data));
    const unit: SpreadUnit = champions ? "sp" : "ev";
    // Champions reports are read in SP, exactly as the report page renders
    // them. Non-Champions reports keep the paste's own EV numbers verbatim.
    const spread = champions ? convertToChampionsSp(mon.evs) : { ...mon.evs };

    const key = spreadKey(unit, spread);
    let group = groups.get(key);
    if (!group) {
      group = { unit, spread, count: 0, natures: new Map(), items: new Map(), examples: [] };
      groups.set(key, group);
    }
    group.count++;
    group.natures.set(mon.nature, (group.natures.get(mon.nature) ?? 0) + 1);
    if (mon.item) group.items.set(mon.item, (group.items.get(mon.item) ?? 0) + 1);
    if (group.examples.length < EXAMPLES_PER_SPREAD) {
      group.examples.push({
        id: row.id,
        creatorName: optionalString(row.data, "creatorName"),
        tournamentName: optionalString(row.data, "tournamentName"),
        placement: optionalString(row.data, "placement"),
      });
    }
  }

  const spreads: CommonSpread[] = [...groups.values()]
    .map((group) => ({
      label: formatSpread(group.spread),
      spread: group.spread,
      unit: group.unit,
      nature: mostCommon(group.natures),
      item: mostCommon(group.items),
      count: group.count,
      // One decimal place. `totalReports` is >0 whenever a group exists.
      percentage: Math.round((group.count / totalReports) * 1000) / 10,
      examples: group.examples,
    }))
    // Count desc, then label/unit asc so equal counts never reorder between
    // revalidations (the page is cached HTML — a flapping order is a diff).
    .sort(
      (a, b) =>
        b.count - a.count || a.label.localeCompare(b.label) || a.unit.localeCompare(b.unit),
    )
    .slice(0, TOP_SPREAD_COUNT);

  return { species, slug, totalReports, spreads, unavailable: false };
}

/** Empty aggregate for a species we could not load data for. */
function emptyAggregate(slug: string, unavailable: boolean): SpeciesSpreadAggregate {
  return {
    species: speciesDisplayName(slug) ?? slug,
    slug,
    totalReports: 0,
    spreads: [],
    unavailable,
  };
}

/**
 * The candidate query. Parameterised throughout — `speciesName` is only ever
 * bound as a value, never interpolated, and callers must have validated the
 * slug with `isKnownSpeciesSlug` first. Catalogue names contain no `%` or `_`,
 * so there is no LIKE metacharacter to escape.
 *
 * Exported so tests can assert the SQL and its bound parameters without a
 * database (same approach as `src/lib/db/purge-satellites.ts`).
 */
export function buildSpeciesSpreadQuery(
  sql: SqlClient,
  speciesName: string,
  limit: number = SPREAD_CANDIDATE_LIMIT,
) {
  return sql`
    SELECT s.id, s.data
    FROM shares s
    WHERE s.is_public = TRUE
      AND s.deleted_at IS NULL
      AND s.data->>'paste' ILIKE ${`%${speciesName}%`}
    ORDER BY s.updated_at DESC
    LIMIT ${limit}
  `;
}

/**
 * Fetch and aggregate in one call. Never rejects.
 *
 * An unknown slug resolves to an empty aggregate with `unavailable: false`
 * (there is nothing wrong — that species simply is not in the catalogue). Any
 * database failure — no `DATABASE_URL` at build time, Neon unreachable, query
 * error — resolves to an empty aggregate with `unavailable: true`, which the
 * page renders as an honest "stats are temporarily unavailable" state.
 */
export async function getSpeciesSpreads(slug: string): Promise<SpeciesSpreadAggregate> {
  if (!isKnownSpeciesSlug(slug)) return emptyAggregate(slug, false);
  const species = speciesDisplayName(slug)!;

  try {
    const rows = (await buildSpeciesSpreadQuery(getDb(), species)) as unknown as Array<
      Record<string, unknown>
    >;
    return aggregateSpeciesSpreads(
      slug,
      rows.map((row) => ({
        id: row.id as string,
        data: (row.data ?? {}) as Record<string, unknown>,
      })),
    );
  } catch (e) {
    console.error("Spread aggregation unavailable for", slug, e);
    return emptyAggregate(slug, true);
  }
}

/**
 * Species that have enough public reports to be worth sitemapping.
 *
 * Used by `src/app/sitemap.ts`. Deliberately does NOT list all ~1,300
 * catalogue species: a sitemap full of empty spread pages is thin content that
 * costs crawl budget. Returns `[]` on any database failure, so the sitemap
 * degrades to its static entries exactly as its existing `catch` does.
 *
 * Cost note: this pulls paste text for up to `limit` recent public reports and
 * counts species in JS with `extractSpecies` (no full parse). The sitemap
 * revalidates hourly, so that is one bounded read per hour. Keep `limit`
 * modest — pastes are the largest column in `shares`.
 */
export async function getSpeciesWithSpreadData(
  { limit = 1000, minReports = MIN_INDEXABLE_REPORTS }: { limit?: number; minReports?: number } = {},
): Promise<string[]> {
  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT s.data->>'paste' AS paste
      FROM shares s
      WHERE s.is_public = TRUE
        AND s.deleted_at IS NULL
        AND s.data->>'paste' IS NOT NULL
      ORDER BY s.updated_at DESC
      LIMIT ${limit}
    `) as unknown as Array<Record<string, unknown>>;

    const counts = new Map<string, number>();
    for (const row of rows) {
      const paste = row.paste;
      if (typeof paste !== "string") continue;
      // De-dup within a team: a doubles team cannot field the same species
      // twice, and species clause aside, counting it twice would skew usage.
      const slugs = new Set(extractSpecies(paste).map(speciesSlug));
      for (const slug of slugs) {
        if (!isKnownSpeciesSlug(slug)) continue;
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }

    return [...counts.entries()]
      .filter(([, count]) => count >= minReports)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([slug]) => slug);
  } catch (e) {
    console.error("Spread sitemap species unavailable:", e);
    return [];
  }
}
