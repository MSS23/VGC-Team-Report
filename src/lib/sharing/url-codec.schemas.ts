/**
 * Zod schemas for the shareable report state.
 *
 * These live in their own module (split out of `url-codec.ts` for VGC-256) so
 * that `zod` never enters the eager client bundle. `url-codec.ts` is reachable
 * from the homepage client graph via
 * `page.tsx → useHomePage → useShareFlow → useShareUrl`, and a static
 * `import { z } from "zod"` there cost ~265 kB raw / ~63 kB gzip on `/`.
 *
 * Rules for this file:
 * - Client code must reach it ONLY through `await import()` (see
 *   `decodeShareState` in `url-codec.ts`). Never add a static import of this
 *   module to anything in the client graph.
 * - Server code (API routes) may import it statically — the server bundle
 *   already ships zod and pays nothing extra.
 */
import { z } from "zod";

/**
 * Calc entries (VGC-343).
 *
 * This used to be `z.unknown()`, which let anything through: a `#data=` link
 * carrying `calcs: { Garchomp: [null] }` validated clean, got cast to
 * `CalcEntry[]`, and then `calcs.filter((c) => c.category === "offensive")`
 * threw inside the render pass — a white screen instead of a degraded report.
 *
 * The stored-report path already normalises instead of trusting: see
 * `migrateCalcs` in `src/hooks/useDamageCalcs.ts`. This schema is the URL
 * path's equivalent choke point, so both entry points now hand consumers the
 * same guaranteed shape: `{ text: string; category: CalcCategory }`.
 *
 * The three category literals are duplicated here on purpose. The source of
 * truth is `CalcCategory` in `src/hooks/useDamageCalcs.ts`, but that module is
 * a `"use client"` hook: importing it would drag React and the hook's graph
 * into this module, which exists precisely to keep zod (and anything else)
 * out of the eager client bundle — see the rules block at the top of the file.
 * Three string literals are a cheaper duplication than that import.
 */
const CALC_CATEGORIES = ["offensive", "defensive", "speed"] as const;
type CalcCategoryLiteral = (typeof CALC_CATEGORIES)[number];

interface NormalizedCalcEntry {
  text: string;
  category: CalcCategoryLiteral;
}

function normalizeCalcCategory(value: unknown): CalcCategoryLiteral {
  return (CALC_CATEGORIES as readonly string[]).includes(value as string)
    ? (value as CalcCategoryLiteral)
    : "offensive";
}

/**
 * Normalise one entry, or return `null` for one that cannot be rendered.
 *
 * Deliberate divergence from `migrateCalcs`: it ends with a
 * `String(entry)` fallback, so `null` becomes the calc `"null"`, `{}` becomes
 * `"[object Object]"`, and `42` becomes `"42"`. That is reasonable for
 * localStorage, where the data is the user's own and a visible oddity is a
 * clue. A share link is attacker-controllable and arrives from someone else,
 * so printing `null` as a "notable calc" in a stranger's report is worse than
 * simply not showing it. Unusable entries (no text, or text that is blank once
 * trimmed) are therefore dropped here rather than turned into placeholders.
 * Everything that *does* carry text is migrated exactly as `migrateCalcs`
 * migrates it, so a legitimate legacy link loses nothing.
 */
function normalizeCalcEntry(entry: unknown): NormalizedCalcEntry | null {
  if (typeof entry === "string") {
    return entry.trim() ? { text: entry, category: "offensive" } : null;
  }
  if (entry && typeof entry === "object" && "text" in entry) {
    const e = entry as Record<string, unknown>;
    const text = String(e.text ?? "");
    if (!text.trim()) return null;
    return { text, category: normalizeCalcCategory(e.category) };
  }
  // null / undefined / numbers / booleans / {} / arrays — nothing renderable.
  return null;
}

/**
 * A species' calc list. Anything that is not an array (`calcs: { X: "oops" }`)
 * becomes an empty list rather than failing the whole parse: `migrateCalcs`
 * skips such a key, and one corrupt species must not cost the viewer an
 * otherwise valid report. A non-object `calcs` is still a structural mismatch
 * and still fails closed, like every other field in this schema.
 */
const CalcEntryListSchema = z
  .unknown()
  .transform((list) =>
    Array.isArray(list)
      ? list
          .map(normalizeCalcEntry)
          .filter((entry): entry is NormalizedCalcEntry => entry !== null)
      : [],
  );

const NullableIndex = z.number().int().nullable();

// NOTE: `replays` was removed from the schema (feature deleted). z.object()
// strips unknown keys by default, so old shared links that still carry a
// `replays` array decode fine — the leftover key is silently dropped during
// validation rather than failing. Do NOT switch this to `.strict()`.
export const SerializedGamePlanSchema = z.object({
  bring: z.tuple([NullableIndex, NullableIndex, NullableIndex, NullableIndex]),
  notes: z.string(),
  result: z.enum(["W", "L", "T"]).nullable().optional(),
});

export const SerializedMatchupPlanSchema = z.object({
  opponentPaste: z.string(),
  opponentLabel: z.string(),
  showSlide: z.boolean().optional(),
  gamePlans: z.array(SerializedGamePlanSchema).optional(),
  notes: z.string().optional(),
  selectedIndices: z.array(z.number()).optional(),
  planA: z
    .object({
      lead: z.tuple([NullableIndex, NullableIndex]),
      back: z.tuple([NullableIndex, NullableIndex]),
    })
    .optional(),
  planB: z
    .object({
      lead: z.tuple([NullableIndex, NullableIndex]),
      back: z.tuple([NullableIndex, NullableIndex]),
    })
    .optional(),
});

export const ShareableStateSchema = z.object({
  paste: z.string(),
  notes: z.record(z.string(), z.string()),
  calcs: z.record(z.string(), CalcEntryListSchema).optional(),
  roles: z.record(z.string(), z.string()).optional(),
  teamSummary: z.string().optional(),
  commonModes: z
    .object({
      // Structured bring combinations (leads/back = roster indices, max 2 each).
      combinations: z
        .array(
          z.object({
            id: z.string(),
            leads: z.array(z.number().int()),
            back: z.array(z.number().int()),
            strategy: z.string(),
          }),
        )
        .optional(),
      // Legacy free-text fields — retained so 119 existing shared reports keep
      // their leads/modes text. Never dropped.
      leads: z.string().optional(),
      modes: z.string().optional(),
      strengths: z.string().optional(),
      weaknesses: z.string().optional(),
      gameplan: z.string().optional(),
    })
    .optional(),
  teamName: z.string().optional(),
  tournamentName: z.string().optional(),
  placement: z.string().optional(),
  record: z.string().optional(),
  mvpIndex: z.number().int().nullable().optional(),
  rentalCode: z.string().optional(),
  creatorName: z.string().optional(),
  matchupPlans: z.array(SerializedMatchupPlanSchema),
  spriteSettings: z
    .record(
      z.string(),
      z.object({
        shiny: z.boolean().optional(),
        animated: z.boolean().optional(),
      }),
    )
    .optional(),
  hiddenSlides: z.array(z.string()).optional(),
  allowComments: z.boolean().optional(),
  tags: z
    .object({
      tournamentUrl: z.string().regex(/^https:\/\/limitlessvgc\.com\/tournaments\/\d+$/).optional(),
      tournamentDate: z.string().max(100).optional(),
      tournamentPlayers: z.number().int().positive().optional(),
      tournamentRegion: z.string().max(100).optional(),
      archetype: z.array(z.string()).optional(),
      regulation: z.string().optional(),
      eventType: z.string().optional(),
      regulationAutoDetected: z.boolean().optional(),
    })
    .optional(),
  templateId: z.string().optional(),
  /**
   * Per-field visibility flags for tiered publishing (VGC-142). When present,
   * fields marked `false` are hidden from public viewers (rendered redacted)
   * and visible only to the owner. Keys are dotted paths like
   * `pokemon.0.evs` or `pokemon.0.nature`.
   */
  privateFields: z.array(z.string()).optional(),
  genTheme: z.string().optional(),
});
