/**
 * Detects which sections changed between two report states.
 * Returns a list of human-readable section names that were modified.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyState = Record<string, any>;

export function detectChangedSections(oldState: AnyState | null, newState: AnyState): string[] {
  if (!oldState) return ["Created report"];

  const sections: string[] = [];

  // Team paste (Pokemon changed)
  if ((oldState.paste ?? "") !== (newState.paste ?? "")) {
    sections.push("Team paste");
  }

  // Team summary
  if ((oldState.teamSummary ?? "") !== (newState.teamSummary ?? "")) {
    sections.push("Team summary");
  }

  // Tournament metadata
  if ((oldState.tournamentName ?? "") !== (newState.tournamentName ?? "")) {
    sections.push("Tournament name");
  }
  if ((oldState.placement ?? "") !== (newState.placement ?? "")) {
    sections.push("Placement");
  }
  if ((oldState.record ?? "") !== (newState.record ?? "")) {
    sections.push("Record");
  }
  if ((oldState.creatorName ?? "") !== (newState.creatorName ?? "")) {
    sections.push("Creator name");
  }
  if ((oldState.rentalCode ?? "") !== (newState.rentalCode ?? "")) {
    sections.push("Rental code");
  }

  // MVP
  if ((oldState.mvpIndex ?? null) !== (newState.mvpIndex ?? null)) {
    sections.push("MVP selection");
  }

  // Per-Pokemon notes
  const changedNotes = diffRecordKeys(oldState.notes, newState.notes);
  if (changedNotes.length > 0) {
    sections.push(`Notes (${changedNotes.join(", ")})`);
  }

  // Per-Pokemon calcs
  const changedCalcs = diffRecordKeys(oldState.calcs, newState.calcs);
  if (changedCalcs.length > 0) {
    sections.push(`Damage calcs (${changedCalcs.join(", ")})`);
  }

  // Roles
  const changedRoles = diffRecordKeys(oldState.roles, newState.roles);
  if (changedRoles.length > 0) {
    sections.push(`Roles (${changedRoles.join(", ")})`);
  }



  // Matchup plans — only compare user-editable content, not structural fields
  if (matchupPlansChanged(oldState.matchupPlans ?? [], newState.matchupPlans ?? [])) {
    sections.push("Matchup plans");
  }

  // Tags
  if (JSON.stringify(oldState.tags ?? {}) !== JSON.stringify(newState.tags ?? {})) {
    sections.push("Tags");
  }

  // Note: hiddenSlides and allowComments are UI preferences, not report content.
  // They don't create version snapshots.

  return sections;
}

/** Compare matchup plans by user-editable content only (ignores structural fields like IDs, showSlide) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchupPlansChanged(oldPlans: any[], newPlans: any[]): boolean {
  if (oldPlans.length !== newPlans.length) return true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalize = (p: any) => JSON.stringify({
    opponentLabel: p.opponentLabel ?? "",
    opponentPaste: p.opponentPaste ?? "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gamePlans: (p.gamePlans ?? []).map((gp: any) => ({
      notes: gp.notes ?? "",
      bring: gp.bring ?? [],
      result: gp.result ?? null,
      replays: gp.replays ?? [],
    })),
  });
  return oldPlans.some((p, i) => normalize(p) !== normalize(newPlans[i]));
}

/** Returns keys where the value changed between two Record<string, unknown> objects */
function diffRecordKeys(
  oldRec: Record<string, unknown> | undefined,
  newRec: Record<string, unknown> | undefined,
): string[] {
  const old = oldRec ?? {};
  const next = newRec ?? {};
  const allKeys = new Set([...Object.keys(old), ...Object.keys(next)]);
  const changed: string[] = [];
  for (const key of allKeys) {
    if (JSON.stringify(old[key] ?? "") !== JSON.stringify(next[key] ?? "")) {
      changed.push(key);
    }
  }
  return changed;
}
