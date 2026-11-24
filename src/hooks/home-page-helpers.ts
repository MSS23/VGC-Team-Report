// Pure helpers moved verbatim out of useHomePage.ts. No React here: the
// hook keeps every useMemo/useEffect/useCallback in its original order.
import type { TeamAnalysis } from "@/lib/types/analysis";
import type { ShareableState } from "@/lib/sharing/url-codec";

/**
 * One stable key per team slot: the species name, suffixed `-2`, `-3`, … for
 * repeats, so per-Pokémon notes/calcs/meta survive reorder.
 */
export function buildSpeciesKeys(pokemon: TeamAnalysis["pokemon"]): string[] {
  const counts: Record<string, number> = {};
  return pokemon.map((mon) => {
    const species = mon.parsed.species;
    counts[species] = (counts[species] ?? 0) + 1;
    return counts[species] > 1 ? `${species}-${counts[species]}` : species;
  });
}

/** The team-meta fields of a shared/remote/draft state, in the shape `setMetaFull` takes. */
export function shareStateToMeta(state: ShareableState) {
  return {
    roles: state.roles ?? {},
    summary: state.teamSummary ?? "",
    commonModes: state.commonModes ?? undefined,
    teamName: state.teamName ?? undefined,
    tournamentName: state.tournamentName ?? undefined,
    placement: state.placement ?? undefined,
    record: state.record ?? undefined,
    mvpIndex: state.mvpIndex ?? null,
    rentalCode: state.rentalCode ?? undefined,
    creatorName: state.creatorName ?? undefined,
    tags: state.tags ?? undefined,
    templateId: state.templateId ?? undefined,
    privateFields: state.privateFields ?? undefined,
  };
}

/**
 * Pre-v2 team-content storage key prefixes, evicted on mount after the
 * 2026-04-10 leak incident (see the eviction effect in useHomePage).
 */
export const LEGACY_PREFIXES = [
  "vgc-team-paste",          // exact match: vgc-team-paste, vgc-team-paste-source
  "vgc-notes-",              // species-keyed notes
  "vgc-calcs-",              // species-keyed damage calcs
  "vgc-meta-",               // species-keyed team meta
  "vgc-matchup-plans-",      // species-keyed matchup plans
  "vgc-hidden-slides-",      // species-keyed hidden slides
];
