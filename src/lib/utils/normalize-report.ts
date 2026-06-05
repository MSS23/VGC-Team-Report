/**
 * Shared report data normalization.
 * Used by both the share GET route and the batch migration route
 * to ensure consistent data format across all access paths.
 */

/**
 * Raw report data as it arrives from the share row's JSONB column. Field
 * shapes are best-effort; the normalizer defends against missing or legacy
 * variants. Extends `Record<string, unknown>` so callers can keep passing
 * arbitrary persisted blobs without losing index access.
 */
export interface RawReportData extends Record<string, unknown> {
  paste?: unknown;
  notes?: unknown;
  spreadNotes?: unknown;
  calcs?: unknown;
  roles?: unknown;
  teamSummary?: unknown;
  teamName?: unknown;
  tournamentName?: unknown;
  placement?: unknown;
  record?: unknown;
  mvpIndex?: unknown;
  rentalCode?: unknown;
  creatorName?: unknown;
  matchupPlans?: unknown;
  spriteSettings?: unknown;
  hiddenSlides?: unknown;
  allowComments?: unknown;
  tags?: unknown;
  templateId?: unknown;
}

/** A single normalized matchup plan (current `gamePlans[]` format). */
export interface NormalizedMatchupPlan {
  opponentPaste: string;
  opponentLabel: string;
  showSlide?: unknown;
  gamePlans: Array<{
    bring: Array<number | null>;
    notes: string;
    replays: string[];
    result?: unknown;
  }>;
}

/**
 * Report data after normalization. All client-required fields are guaranteed
 * to exist with sensible defaults; legacy fields (e.g. `spreadNotes`,
 * `planA`/`planB`) have been migrated. Extends `Record<string, unknown>` so
 * existing callers that index by string key (e.g. for redaction or
 * search-vector backfill) continue to type-check.
 */
export interface NormalizedReportData extends Record<string, unknown> {
  paste: string;
  notes: Record<string, string>;
  calcs: Record<string, Array<{ text: string; category: string }>>;
  roles: Record<string, unknown>;
  teamSummary: string;
  teamName: unknown;
  tournamentName: unknown;
  placement: unknown;
  record: unknown;
  mvpIndex: unknown;
  rentalCode: unknown;
  creatorName: unknown;
  matchupPlans: NormalizedMatchupPlan[];
  spriteSettings: unknown;
  hiddenSlides: string[];
  allowComments: unknown;
  tags: unknown;
  templateId: unknown;
}

type AnyRecord = Record<string, unknown>;

/** Migrate old calc entries that may be stored as plain strings to {text, category} objects */
export function migrateCalcEntries(rawCalcs: unknown): Record<string, Array<{ text: string; category: string }>> {
  if (!rawCalcs || typeof rawCalcs !== "object") return {};
  const result: Record<string, Array<{ text: string; category: string }>> = {};
  for (const [key, entries] of Object.entries(rawCalcs as AnyRecord)) {
    if (!Array.isArray(entries)) continue;
    result[key] = entries.map((entry: unknown) => {
      if (typeof entry === "string") return { text: entry, category: "offensive" };
      if (entry && typeof entry === "object" && "text" in entry) {
        const e = entry as { text?: string; category?: string };
        return { text: e.text ?? "", category: e.category ?? "offensive" };
      }
      return { text: String(entry), category: "offensive" };
    });
  }
  return result;
}

/** Migrate a single matchup plan from legacy format to current gamePlans[] format */
function migratePlan(plan: AnyRecord): NormalizedMatchupPlan {
  // Already has gamePlans array — ensure each game plan has all fields
  if (Array.isArray(plan.gamePlans) && plan.gamePlans.length > 0) {
    return {
      opponentPaste: (plan.opponentPaste as string) ?? "",
      opponentLabel: (plan.opponentLabel as string) ?? "",
      showSlide: plan.showSlide,
      gamePlans: plan.gamePlans.map((gp: AnyRecord) => ({
        bring: Array.isArray(gp.bring) ? (gp.bring as Array<number | null>) : [null, null, null, null],
        notes: (gp.notes as string) ?? "",
        replays: Array.isArray(gp.replays) ? (gp.replays as string[]) : [],
        result: gp.result ?? undefined,
      })),
    };
  }

  // Legacy: migrate planA/planB or selectedIndices → gamePlans[0]
  let bring: [number | null, number | null, number | null, number | null] = [null, null, null, null];
  if (plan.planA) {
    const planA = plan.planA as { lead?: (number | null)[]; back?: (number | null)[] };
    bring = [
      planA.lead?.[0] ?? null, planA.lead?.[1] ?? null,
      planA.back?.[0] ?? null, planA.back?.[1] ?? null,
    ];
  } else if (Array.isArray(plan.selectedIndices)) {
    bring = [
      (plan.selectedIndices[0] as number | null) ?? null,
      (plan.selectedIndices[1] as number | null) ?? null,
      (plan.selectedIndices[2] as number | null) ?? null,
      (plan.selectedIndices[3] as number | null) ?? null,
    ];
  }

  return {
    opponentPaste: (plan.opponentPaste as string) ?? "",
    opponentLabel: (plan.opponentLabel as string) ?? "",
    showSlide: plan.showSlide,
    gamePlans: [{
      bring,
      notes: (plan.notes as string) ?? "",
      replays: [],
    }],
  };
}

/**
 * Normalize report data to the current format.
 * Ensures all fields expected by the client exist with sensible defaults,
 * migrates legacy matchup plan structures, and normalizes calc entries.
 * Preserves all existing user data — only adds missing defaults.
 */
export function normalizeReportData(data: RawReportData): NormalizedReportData {
  const rawPlans = Array.isArray(data.matchupPlans) ? data.matchupPlans : [];
  const matchupPlans = rawPlans.map((plan: AnyRecord) => migratePlan(plan));

  // Merge legacy spreadNotes into notes
  const notes: Record<string, string> = { ...((data.notes as Record<string, string> | undefined) ?? {}) };
  const spreadNotes = (data.spreadNotes as Record<string, unknown> | undefined) ?? {};
  for (const [species, spreadNote] of Object.entries(spreadNotes)) {
    if (typeof spreadNote === "string" && spreadNote.trim()) {
      const existing = notes[species] ?? "";
      if (existing && !existing.includes(spreadNote)) {
        notes[species] = `${existing}\n\n${spreadNote}`;
      } else if (!existing) {
        notes[species] = spreadNote;
      }
    }
  }

  // Remove spreadNotes from output — it's been merged into notes
  const { spreadNotes: _removed, ...rest } = data;

  return {
    ...rest,
    paste: (data.paste as string) ?? "",
    notes,
    calcs: migrateCalcEntries(data.calcs),
    roles: (data.roles as Record<string, unknown>) ?? {},
    teamSummary: (data.teamSummary as string) ?? "",
    teamName: data.teamName ?? undefined,
    tournamentName: data.tournamentName ?? undefined,
    placement: data.placement ?? undefined,
    record: data.record ?? undefined,
    mvpIndex: data.mvpIndex ?? null,
    rentalCode: data.rentalCode ?? undefined,
    creatorName: data.creatorName ?? undefined,
    matchupPlans,
    spriteSettings: data.spriteSettings ?? undefined,
    hiddenSlides: Array.isArray(data.hiddenSlides) ? (data.hiddenSlides as string[]) : [],
    allowComments: data.allowComments ?? false,
    tags: data.tags ?? undefined,
    templateId: data.templateId ?? undefined,
  };
}
