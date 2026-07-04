/**
 * Detects which sections changed between two report states.
 * Returns a list of human-readable section names that were modified.
 */

import type { SerializedMatchupPlan, SerializedGamePlan } from "@/lib/sharing/url-codec";

type StateRecord = Record<string, unknown>;

export function detectChangedSections(oldState: StateRecord | null, newState: StateRecord): string[] {
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
  if ((oldState.teamName ?? "") !== (newState.teamName ?? "")) {
    sections.push("Team name");
  }
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
  const changedNotes = diffRecordKeys(asRecord(oldState.notes), asRecord(newState.notes));
  if (changedNotes.length > 0) {
    sections.push(`Notes (${changedNotes.join(", ")})`);
  }

  // Per-Pokemon calcs
  const changedCalcs = diffRecordKeys(asRecord(oldState.calcs), asRecord(newState.calcs));
  if (changedCalcs.length > 0) {
    sections.push(`Damage calcs (${changedCalcs.join(", ")})`);
  }

  // Roles
  const changedRoles = diffRecordKeys(asRecord(oldState.roles), asRecord(newState.roles));
  if (changedRoles.length > 0) {
    sections.push(`Roles (${changedRoles.join(", ")})`);
  }

  // "How to pilot this team" — combinations table + strengths/weaknesses/
  // gameplan + retained legacy leads/modes. Whole-object compare so changes to
  // the new `combinations` array (and any of the free-text blocks) still fire a
  // version snapshot. JSON.stringify handles the nested array without crashing.
  if (JSON.stringify(oldState.commonModes ?? {}) !== JSON.stringify(newState.commonModes ?? {})) {
    sections.push("How to play");
  }

  // Matchup plans — only compare user-editable content, not structural fields
  if (matchupPlansChanged(asArray(oldState.matchupPlans), asArray(newState.matchupPlans))) {
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

/** Safely coerce an unknown value to Record<string, unknown> or undefined */
function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

/** Safely coerce an unknown value to an array or empty array */
function asArray(value: unknown): SerializedMatchupPlan[] {
  return Array.isArray(value) ? (value as SerializedMatchupPlan[]) : [];
}

/** Compare matchup plans by user-editable content only (ignores structural fields like IDs, showSlide) */
function matchupPlansChanged(oldPlans: SerializedMatchupPlan[], newPlans: SerializedMatchupPlan[]): boolean {
  if (oldPlans.length !== newPlans.length) return true;
  const normalize = (p: SerializedMatchupPlan) => JSON.stringify({
    opponentLabel: p.opponentLabel ?? "",
    opponentPaste: p.opponentPaste ?? "",
    gamePlans: (p.gamePlans ?? []).map((gp: SerializedGamePlan) => ({
      notes: gp.notes ?? "",
      bring: gp.bring ?? [],
      result: gp.result ?? null,
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
