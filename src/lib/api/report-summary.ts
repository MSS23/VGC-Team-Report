import { extractSpecies } from "@/lib/utils/extract-species";

/**
 * The leading report-card keys the user/* list routes derive from a `shares`
 * row's `id` and `data`. Spread it first: key order is part of each route's JSON.
 */
export function reportSummaryFields(row: Record<string, unknown>) {
  const data = row.data as Record<string, unknown>;
  const paste = (data.paste as string) ?? "";
  return {
    id: row.id as string,
    species: extractSpecies(paste),
    tournamentName: (data.tournamentName as string) || undefined,
    creatorName: (data.creatorName as string) || undefined,
    placement: (data.placement as string) || undefined,
  };
}
