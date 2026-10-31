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
 * Every section key the diff can emit, as a discriminated union.
 *
 * The wire format is a flat string (it doubles as the `data-diff-field`
 * attribute in the DOM), so emit and parse used to be two hand-written string
 * templates that drifted: `pokemon:<index>` was emitted with a numeric INDEX
 * but read back as if the payload were a species name, which rendered the
 * label "Set (0)" and navigated to the wrong slide (VGC-260).
 *
 * Both directions now go through `encodeSectionKey` / `parseSectionKey`, so
 * the payload of each variant is fixed by the type and cannot drift again.
 */
export type SectionKey =
  /** A whole-report field with a fixed label (see FIELD_LABELS) */
  | { kind: "field"; field: GlobalFieldKey }
  /** A Pokemon's paste block — payload is the team INDEX, not a species name */
  | { kind: "pokemon"; index: number }
  | { kind: "notes"; speciesKey: string }
  | { kind: "calcs"; speciesKey: string }
  | { kind: "roles"; speciesKey: string }
  /** Internal marker that a slide contains at least one change */
  | { kind: "slide"; slide: number };

/** Keys of the fixed whole-report fields. */
export type GlobalFieldKey = keyof typeof FIELD_LABELS;

/** The per-Pokemon section kinds, in the order they read in the UI. */
const PER_POKEMON_LABELS = {
  pokemon: "Set",
  notes: "Notes",
  calcs: "Calcs",
  roles: "Role",
} as const;

function isGlobalFieldKey(value: string): value is GlobalFieldKey {
  return Object.prototype.hasOwnProperty.call(FIELD_LABELS, value);
}

/** Serialize a section key to its wire/DOM string form. */
export function encodeSectionKey(key: SectionKey): string {
  switch (key.kind) {
    case "field":
      return key.field;
    case "pokemon":
      return `pokemon:${key.index}`;
    case "notes":
      return `notes:${key.speciesKey}`;
    case "calcs":
      return `calcs:${key.speciesKey}`;
    case "roles":
      return `roles:${key.speciesKey}`;
    case "slide":
      return `slide:${key.slide}`;
  }
}

/**
 * Parse a wire/DOM string back into a section key.
 * Returns null for anything unrecognised (callers skip those).
 *
 * Splits on the FIRST colon only, so species keys that themselves contain a
 * colon (e.g. "Type: Null") survive the round trip.
 */
export function parseSectionKey(raw: string): SectionKey | null {
  const sep = raw.indexOf(":");
  if (sep === -1) {
    return isGlobalFieldKey(raw) ? { kind: "field", field: raw } : null;
  }

  const prefix = raw.slice(0, sep);
  const payload = raw.slice(sep + 1);

  switch (prefix) {
    case "pokemon": {
      // Numeric team index — 0 is a real Pokemon, not a missing one.
      if (!/^\d+$/.test(payload)) return null;
      return { kind: "pokemon", index: Number(payload) };
    }
    case "notes":
    case "calcs":
    case "roles":
      return payload ? { kind: prefix, speciesKey: payload } : null;
    case "slide": {
      if (!/^\d+$/.test(payload)) return null;
      return { kind: "slide", slide: Number(payload) };
    }
    default:
      return null;
  }
}

const capitalize = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/**
 * Human-readable label for a section key.
 * Per-Pokemon keys resolve to the Pokemon's actual species name — a
 * `pokemon:<index>` key looks its species up in `speciesKeys` rather than
 * printing the raw index (VGC-260).
 */
export function sectionKeyLabel(key: SectionKey, speciesKeys: string[] = []): string | null {
  switch (key.kind) {
    case "field":
      return FIELD_LABELS[key.field];
    case "pokemon": {
      const name = speciesKeys[key.index] ?? `Pokemon ${key.index + 1}`;
      return `${PER_POKEMON_LABELS.pokemon} (${capitalize(name)})`;
    }
    case "notes":
    case "calcs":
    case "roles":
      return `${PER_POKEMON_LABELS[key.kind]} (${capitalize(key.speciesKey)})`;
    case "slide":
      return null; // internal marker, never shown
  }
}

/** Context needed to map a section key onto a slide index. */
interface SlideLayout {
  pokemonCount: number;
  speciesKeys: string[];
  plansCount: number;
}

/**
 * Which slide a section key lives on.
 * Logical layout: 0 overview · 1 common modes · 2.. Pokemon detail slides,
 * so Pokemon #index sits at index + 2.
 */
export function sectionKeySlide(key: SectionKey, layout: SlideLayout): number {
  switch (key.kind) {
    case "field":
      if (key.field === "commonModes") return 1;
      if (key.field === "matchupPlans") return layout.pokemonCount + 5 + layout.plansCount;
      return 0;
    case "pokemon":
      // Out-of-range index falls back to the overview rather than a dead slide.
      return key.index >= 0 && key.index < layout.speciesKeys.length ? key.index + 2 : 0;
    case "notes":
    case "calcs":
    case "roles": {
      const index = layout.speciesKeys.indexOf(key.speciesKey);
      return index >= 0 ? index + 2 : 0;
    }
    case "slide":
      return key.slide;
  }
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

  /** Record a change. Every emitted key goes through the SectionKey union. */
  const addChange = (key: SectionKey, ...slides: number[]) => {
    changedFields.add(encodeSectionKey(key));
    for (const slide of slides) changedSlides.add(slide);
  };

  // --- Overview slide (slide 0) ---

  if ((current.teamSummary ?? "") !== (old.teamSummary ?? "")) {
    addChange({ kind: "field", field: "teamSummary" }, 0);
  }
  // Common Modes lives on its own slide (physical index 1), inserted after the overview.
  if (JSON.stringify(current.commonModes ?? {}) !== JSON.stringify(old.commonModes ?? {})) {
    addChange({ kind: "field", field: "commonModes" }, 1);
  }
  if ((current.teamName ?? "") !== (old.teamName ?? "")) {
    addChange({ kind: "field", field: "teamName" }, 0);
  }
  if ((current.tournamentName ?? "") !== (old.tournamentName ?? "")) {
    addChange({ kind: "field", field: "tournamentName" }, 0);
  }
  if ((current.placement ?? "") !== (old.placement ?? "")) {
    addChange({ kind: "field", field: "placement" }, 0);
  }
  if ((current.record ?? "") !== (old.record ?? "")) {
    addChange({ kind: "field", field: "record" }, 0);
  }
  if ((current.creatorName ?? "") !== (old.creatorName ?? "")) {
    addChange({ kind: "field", field: "creatorName" }, 0);
  }
  if ((current.mvpIndex ?? null) !== (old.mvpIndex ?? null)) {
    addChange({ kind: "field", field: "mvpIndex" }, 0);
  }
  if ((current.rentalCode ?? "") !== (old.rentalCode ?? "")) {
    addChange({ kind: "field", field: "rentalCode" }, 0);
  }
  if (JSON.stringify(current.tags ?? {}) !== JSON.stringify(old.tags ?? {})) {
    addChange({ kind: "field", field: "tags" }, 0);
  }

  // --- Per-Pokemon changes ---

  // Check if paste (team composition) changed
  const currentBlocks = parsePasteBlocks(current.paste);
  const oldBlocks = parsePasteBlocks(old.paste);

  for (let i = 0; i < pokemonCount; i++) {
    const key = speciesKeys[i];
    if (!key) continue;
    // +2: overview (0) and common-modes (1) precede the first Pokemon slide.
    const slideIndex = i + 2;
    let hasChange = false;

    // Pokemon paste block changed (stats, moves, item, ability, etc.)
    if ((currentBlocks[i] ?? "") !== (oldBlocks[i] ?? "")) {
      // Overview (0) shows pokemon cards; pokemonCount + 2 is the speed chart.
      addChange({ kind: "pokemon", index: i }, 0, slideIndex, pokemonCount + 2);
      hasChange = true;
    }

    // Notes
    if ((current.notes?.[key] ?? "") !== (old.notes?.[key] ?? "")) {
      addChange({ kind: "notes", speciesKey: key }, slideIndex);
      hasChange = true;
    }

    // Calcs
    if (JSON.stringify(current.calcs?.[key] ?? []) !== JSON.stringify(old.calcs?.[key] ?? [])) {
      addChange({ kind: "calcs", speciesKey: key }, slideIndex);
      hasChange = true;
    }

    // Roles
    if ((current.roles?.[key] ?? "") !== (old.roles?.[key] ?? "")) {
      // Roles show on the overview as well as the detail slide.
      addChange({ kind: "roles", speciesKey: key }, 0, slideIndex);
      hasChange = true;
    }

    if (hasChange) {
      addChange({ kind: "slide", slide: slideIndex });
    }
  }

  // Team composition size changed
  if (currentBlocks.length !== oldBlocks.length) {
    addChange({ kind: "field", field: "teamComposition" }, 0, pokemonCount + 2); // Speed chart
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
        }))
      : [],
  });

  const currentNorm = currentPlans.map((p) => JSON.stringify(normalizePlan(p)));
  const oldNorm = oldPlans.map((p) => JSON.stringify(normalizePlan(p)));

  const plansChanged = currentNorm.length !== oldNorm.length ||
    currentNorm.some((p: string, i: number) => p !== oldNorm[i]);

  if (plansChanged) {
    addChange({ kind: "field", field: "matchupPlans" });
    // Matchup plan slides start at pokemonCount + 5 (overview, common-modes,
    // N Pokemon, speed, offensive, defensive precede them).
    for (let i = 0; i < plansCount; i++) {
      changedSlides.add(pokemonCount + 5 + i);
    }
    changedSlides.add(pokemonCount + 5 + plansCount); // matchup sheet
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
  const layout = { pokemonCount, speciesKeys, plansCount };

  for (const field of diff.changedFields) {
    const key = parseSectionKey(field);
    if (!key || key.kind === "slide") continue; // slide: is an internal marker

    const label = sectionKeyLabel(key, speciesKeys);
    if (!label) continue;

    changes.push({ field, label, slide: sectionKeySlide(key, layout) });
  }

  // Sort by slide order for natural navigation
  changes.sort((a, b) => a.slide - b.slide);
  return changes;
}

/**
 * Field key labels for human-readable summaries.
 * `as const` keeps the key literals — `GlobalFieldKey` is derived from them,
 * so a field can't be emitted without also having a label.
 */
const FIELD_LABELS = {
  teamSummary: "Team summary",
  commonModes: "How to play",
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
} as const satisfies Record<string, string>;

/**
 * Turn a set of changed field keys into a human-readable summary string.
 * e.g. "Team summary, Notes (Pikachu), Calcs (Urshifu) — highlighted in blue"
 *
 * `speciesKeys` lets `pokemon:<index>` keys resolve to the real species name;
 * without it they fall back to "Pokemon N" (never the bare index).
 */
export function summarizeChangedFields(fields: Set<string>, speciesKeys: string[] = []): string {
  const labels: string[] = [];

  for (const field of fields) {
    const key = parseSectionKey(field);
    if (!key || key.kind === "slide") continue; // skip internal slide markers

    const label = sectionKeyLabel(key, speciesKeys);
    if (label) labels.push(label);
  }

  if (labels.length === 0) return "No differences found";

  const MAX_SHOW = 4;
  const shown = labels.slice(0, MAX_SHOW);
  const rest = labels.length - MAX_SHOW;
  const summary = shown.join(", ") + (rest > 0 ? ` +${rest} more` : "");
  return `${summary} — highlighted in blue`;
}
