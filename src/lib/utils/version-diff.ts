import type { ShareableState } from "@/lib/sharing/url-codec";

/**
 * Represents which parts of the report changed between two versions.
 * Used to highlight differences in the UI when comparing versions.
 */
export interface VersionDiff {
  /** The version number being compared against */
  version: number;
  /** Set of changed field paths (e.g. "teamSummary", "notes:pikachu", "pokemon:2") */
  changedFields: Set<string>;
  /** Set of slide indices that have changes */
  changedSlides: Set<number>;
  /** The old version's data for showing previous values */
  oldData: ShareableState;
}

/**
 * Parse a paste string into individual Pokemon blocks for per-Pokemon comparison.
 */
function parsePasteBlocks(paste: string): string[] {
  return paste
    .split(/\n\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
}

/**
 * Compare two ShareableState snapshots and determine what changed.
 * Returns a VersionDiff with changed fields and affected slide indices.
 *
 * @param current - The current version's state
 * @param old - The old version's state to compare against
 * @param oldVersion - The version number of the old state
 * @param pokemonCount - Number of Pokemon in the current team
 * @param speciesKeys - Species keys for the current team
 * @param plansCount - Number of matchup plans
 */
export function computeVersionDiff(
  current: ShareableState,
  old: ShareableState,
  oldVersion: number,
  pokemonCount: number,
  speciesKeys: string[],
  plansCount: number
): VersionDiff {
  const changedFields = new Set<string>();
  const changedSlides = new Set<number>();

  // --- Overview slide (slide 0) ---

  if ((current.teamSummary ?? "") !== (old.teamSummary ?? "")) {
    changedFields.add("teamSummary");
    changedSlides.add(0);
  }
  if ((current.tournamentName ?? "") !== (old.tournamentName ?? "")) {
    changedFields.add("tournamentName");
    changedSlides.add(0);
  }
  if ((current.placement ?? "") !== (old.placement ?? "")) {
    changedFields.add("placement");
    changedSlides.add(0);
  }
  if ((current.record ?? "") !== (old.record ?? "")) {
    changedFields.add("record");
    changedSlides.add(0);
  }
  if ((current.creatorName ?? "") !== (old.creatorName ?? "")) {
    changedFields.add("creatorName");
    changedSlides.add(0);
  }
  if ((current.mvpIndex ?? null) !== (old.mvpIndex ?? null)) {
    changedFields.add("mvpIndex");
    changedSlides.add(0);
  }
  if ((current.rentalCode ?? "") !== (old.rentalCode ?? "")) {
    changedFields.add("rentalCode");
    changedSlides.add(0);
  }
  if (JSON.stringify(current.tags ?? {}) !== JSON.stringify(old.tags ?? {})) {
    changedFields.add("tags");
    changedSlides.add(0);
  }

  // --- Per-Pokemon changes ---

  // Check if paste (team composition) changed
  const currentBlocks = parsePasteBlocks(current.paste);
  const oldBlocks = parsePasteBlocks(old.paste);

  for (let i = 0; i < pokemonCount; i++) {
    const key = speciesKeys[i];
    if (!key) continue;
    const slideIndex = i + 1;
    let hasChange = false;

    // Pokemon paste block changed (stats, moves, item, ability, etc.)
    if ((currentBlocks[i] ?? "") !== (oldBlocks[i] ?? "")) {
      changedFields.add(`pokemon:${i}`);
      changedSlides.add(0); // Overview shows pokemon cards
      changedSlides.add(slideIndex);
      changedSlides.add(pokemonCount + 1); // Speed chart
      hasChange = true;
    }

    // Notes
    if ((current.notes?.[key] ?? "") !== (old.notes?.[key] ?? "")) {
      changedFields.add(`notes:${key}`);
      changedSlides.add(slideIndex);
      hasChange = true;
    }

    // Calcs
    if (JSON.stringify(current.calcs?.[key] ?? []) !== JSON.stringify(old.calcs?.[key] ?? [])) {
      changedFields.add(`calcs:${key}`);
      changedSlides.add(slideIndex);
      hasChange = true;
    }

    // Roles
    if ((current.roles?.[key] ?? "") !== (old.roles?.[key] ?? "")) {
      changedFields.add(`roles:${key}`);
      changedSlides.add(0); // Roles shown on overview
      changedSlides.add(slideIndex);
      hasChange = true;
    }

    // Spread notes
    if ((current.spreadNotes?.[key] ?? "") !== (old.spreadNotes?.[key] ?? "")) {
      changedFields.add(`spreadNotes:${key}`);
      changedSlides.add(slideIndex);
      hasChange = true;
    }

    if (hasChange) {
      changedFields.add(`slide:${slideIndex}`);
    }
  }

  // Team composition size changed
  if (currentBlocks.length !== oldBlocks.length) {
    changedFields.add("teamComposition");
    changedSlides.add(0);
    changedSlides.add(pokemonCount + 1); // Speed chart
  }

  // --- Matchup plans ---
  const currentPlans = current.matchupPlans ?? [];
  const oldPlans = old.matchupPlans ?? [];

  if (JSON.stringify(currentPlans) !== JSON.stringify(oldPlans)) {
    changedFields.add("matchupPlans");
    // Mark all matchup plan slides as changed
    for (let i = 0; i < plansCount; i++) {
      changedSlides.add(pokemonCount + 2 + i);
    }
    // Matchup sheet (last slide)
    changedSlides.add(pokemonCount + 2 + plansCount);
  }

  return {
    version: oldVersion,
    changedFields,
    changedSlides,
    oldData: old,
  };
}

/** Field key labels for human-readable summaries */
const FIELD_LABELS: Record<string, string> = {
  teamSummary: "Team summary",
  tournamentName: "Tournament name",
  placement: "Placement",
  record: "Record",
  creatorName: "Creator name",
  rentalCode: "Rental code",
  mvpIndex: "MVP",
  tags: "Tags",
  teamComposition: "Team composition",
  matchupPlans: "Matchup plans",
};

/**
 * Turn a set of changed field keys into a human-readable summary string.
 * e.g. "Team summary, Notes (Pikachu), Calcs (Urshifu) — highlighted in blue"
 */
export function summarizeChangedFields(fields: Set<string>): string {
  const labels: string[] = [];

  for (const field of fields) {
    // Skip internal slide markers
    if (field.startsWith("slide:")) continue;

    // Direct labels
    if (FIELD_LABELS[field]) {
      labels.push(FIELD_LABELS[field]);
      continue;
    }

    // Per-pokemon fields: "notes:pikachu" → "Notes (Pikachu)"
    const match = field.match(/^(pokemon|notes|calcs|roles|spreadNotes):(.+)$/);
    if (match) {
      const [, type, key] = match;
      const name = key.replace(/^./, (c) => c.toUpperCase());
      const typeLabel =
        type === "pokemon" ? "Set" :
        type === "notes" ? "Notes" :
        type === "calcs" ? "Calcs" :
        type === "roles" ? "Role" :
        type === "spreadNotes" ? "Spread notes" : type;
      labels.push(`${typeLabel} (${name})`);
    }
  }

  if (labels.length === 0) return "No differences found";

  const MAX_SHOW = 4;
  const shown = labels.slice(0, MAX_SHOW);
  const rest = labels.length - MAX_SHOW;
  const summary = shown.join(", ") + (rest > 0 ? ` +${rest} more` : "");
  return `${summary} — highlighted in blue`;
}
