import type { ShareableState, SerializedMatchupPlan, SerializedGamePlan } from "@/lib/sharing/url-codec";

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
  /** Name of the user who saved this version (null if unknown) */
  editorName: string | null;
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
  plansCount: number,
  editorName?: string | null
): VersionDiff {
  const changedFields = new Set<string>();
  const changedSlides = new Set<number>();

  // --- Overview slide (slide 0) ---

  if ((current.teamSummary ?? "") !== (old.teamSummary ?? "")) {
    changedFields.add("teamSummary");
    changedSlides.add(0);
  }
  if ((current.teamName ?? "") !== (old.teamName ?? "")) {
    changedFields.add("teamName");
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
  // Compare only user-editable content (opponent label, paste, game plan notes/brings/results)
  // Ignore structural/layout fields that may change from code updates
  const currentPlans = current.matchupPlans ?? [];
  const oldPlans = old.matchupPlans ?? [];

  const normalizePlan = (p: SerializedMatchupPlan) => ({
    opponentLabel: p.opponentLabel ?? "",
    opponentPaste: p.opponentPaste ?? "",
    gamePlans: Array.isArray(p.gamePlans)
      ? p.gamePlans.map((gp: SerializedGamePlan) => ({
          notes: gp.notes ?? "",
          bring: gp.bring ?? [],
          result: gp.result ?? null,
          replays: gp.replays ?? [],
        }))
      : [],
  });

  const currentNorm = currentPlans.map((p) => JSON.stringify(normalizePlan(p)));
  const oldNorm = oldPlans.map((p) => JSON.stringify(normalizePlan(p)));

  const plansChanged = currentNorm.length !== oldNorm.length ||
    currentNorm.some((p: string, i: number) => p !== oldNorm[i]);

  if (plansChanged) {
    changedFields.add("matchupPlans");
    for (let i = 0; i < plansCount; i++) {
      changedSlides.add(pokemonCount + 2 + i);
    }
    changedSlides.add(pokemonCount + 2 + plansCount);
  }

  return {
    version: oldVersion,
    changedFields,
    changedSlides,
    oldData: old,
    editorName: editorName ?? null,
  };
}

/** A single navigable change for the diff navigator UI */
export interface DiffChange {
  /** The field key (e.g. "teamSummary", "notes:pikachu") */
  field: string;
  /** Human-readable label */
  label: string;
  /** Which slide this change lives on */
  slide: number;
}

/**
 * Build an ordered list of navigable changes from a VersionDiff.
 * Sorted by slide order so navigation feels natural (overview → pokemon → speed → matchups).
 */
export function getNavigableChanges(
  diff: VersionDiff,
  pokemonCount: number,
  speciesKeys: string[],
  plansCount: number
): DiffChange[] {
  const changes: DiffChange[] = [];

  for (const field of diff.changedFields) {
    if (field.startsWith("slide:")) continue;

    let label = FIELD_LABELS[field];
    let slide = 0;

    if (label) {
      // Overview fields are all on slide 0, except matchupPlans
      if (field === "matchupPlans") {
        slide = pokemonCount + 2 + plansCount; // matchup sheet
      }
    } else {
      const match = field.match(/^(pokemon|notes|calcs|roles):(.+)$/);
      if (!match) continue;
      const [, type, key] = match;
      const name = key.replace(/^./, (c) => c.toUpperCase());
      const typeLabel =
        type === "pokemon" ? "Set" :
        type === "notes" ? "Notes" :
        type === "calcs" ? "Calcs" :
        type === "roles" ? "Role" : type;
      label = `${typeLabel} (${name})`;

      // Find which pokemon index this key belongs to
      const pokemonIndex = speciesKeys.indexOf(key);
      // pokemon paste changes show on the pokemon detail slide
      // roles show on overview but we navigate to the pokemon slide for detail
      slide = pokemonIndex >= 0 ? pokemonIndex + 1 : 0;
    }

    if (label) {
      changes.push({ field, label, slide });
    }
  }

  // Sort by slide order for natural navigation
  changes.sort((a, b) => a.slide - b.slide);
  return changes;
}

/** Field key labels for human-readable summaries */
const FIELD_LABELS: Record<string, string> = {
  teamSummary: "Team summary",
  teamName: "Team name",
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
    const match = field.match(/^(pokemon|notes|calcs|roles):(.+)$/);
    if (match) {
      const [, type, key] = match;
      const name = key.replace(/^./, (c) => c.toUpperCase());
      const typeLabel =
        type === "pokemon" ? "Set" :
        type === "notes" ? "Notes" :
        type === "calcs" ? "Calcs" :
        type === "roles" ? "Role" : type;
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
