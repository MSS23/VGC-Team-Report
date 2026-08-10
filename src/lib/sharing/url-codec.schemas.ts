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

// CalcEntry comes from a hook in the bundle; we accept it as `unknown[]` at
// the schema boundary and trust the existing CalcEntry consumers downstream.
// This keeps the schema decoupled from rapidly-evolving damage-calc shapes.
const CalcEntrySchema = z.unknown();

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
  calcs: z.record(z.string(), z.array(CalcEntrySchema)).optional(),
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
