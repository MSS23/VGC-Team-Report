/**
 * Shared report data normalization.
 * Used by both the share GET route and the batch migration route
 * to ensure consistent data format across all access paths.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

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
function migratePlan(plan: AnyRecord) {
  // Already has gamePlans array — ensure each game plan has all fields
  if (Array.isArray(plan.gamePlans) && plan.gamePlans.length > 0) {
    return {
      opponentPaste: plan.opponentPaste ?? "",
      opponentLabel: plan.opponentLabel ?? "",
      showSlide: plan.showSlide,
      gamePlans: plan.gamePlans.map((gp: AnyRecord) => ({
        bring: Array.isArray(gp.bring) ? gp.bring : [null, null, null, null],
        notes: gp.notes ?? "",
        replays: Array.isArray(gp.replays) ? gp.replays : [],
        result: gp.result ?? undefined,
      })),
    };
  }

  // Legacy: migrate planA/planB or selectedIndices → gamePlans[0]
  let bring: [number | null, number | null, number | null, number | null] = [null, null, null, null];
  if (plan.planA) {
    bring = [
      plan.planA.lead?.[0] ?? null, plan.planA.lead?.[1] ?? null,
      plan.planA.back?.[0] ?? null, plan.planA.back?.[1] ?? null,
    ];
  } else if (Array.isArray(plan.selectedIndices)) {
    bring = [
      plan.selectedIndices[0] ?? null, plan.selectedIndices[1] ?? null,
      plan.selectedIndices[2] ?? null, plan.selectedIndices[3] ?? null,
    ];
  }

  return {
    opponentPaste: plan.opponentPaste ?? "",
    opponentLabel: plan.opponentLabel ?? "",
    showSlide: plan.showSlide,
    gamePlans: [{
      bring,
      notes: plan.notes ?? "",
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
export function normalizeReportData(data: AnyRecord): AnyRecord {
  const rawPlans = Array.isArray(data.matchupPlans) ? data.matchupPlans : [];
  const matchupPlans = rawPlans.map((plan: AnyRecord) => migratePlan(plan));

  // Merge legacy spreadNotes into notes
  const notes: Record<string, string> = { ...(data.notes ?? {}) };
  const spreadNotes = data.spreadNotes ?? {};
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
    paste: data.paste ?? "",
    notes,
    calcs: migrateCalcEntries(data.calcs),
    roles: data.roles ?? {},
    teamSummary: data.teamSummary ?? "",
    teamName: data.teamName ?? undefined,
    tournamentName: data.tournamentName ?? undefined,
    placement: data.placement ?? undefined,
    record: data.record ?? undefined,
    mvpIndex: data.mvpIndex ?? null,
    rentalCode: data.rentalCode ?? undefined,
    creatorName: data.creatorName ?? undefined,
    matchupPlans,
    spriteSettings: data.spriteSettings ?? undefined,
    hiddenSlides: Array.isArray(data.hiddenSlides) ? data.hiddenSlides : [],
    allowComments: data.allowComments ?? false,
    tags: data.tags ?? undefined,
    templateId: data.templateId ?? undefined,
  };
}
