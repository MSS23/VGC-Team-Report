/**
 * Strip private fields from a Showdown paste so non-owner viewers of a
 * shared report see only what the creator marked public (VGC-142).
 *
 * Each Pokemon block in a paste is a sequence of lines. We rewrite the
 * lines that match a known private field and leave everything else alone:
 *
 *   `Garchomp @ Life Orb`     → `Garchomp` when "item" is private
 *   `EVs: 252 Atk / 4 SpD ...` → drop the line entirely when "evs" is private
 *   `IVs: 0 Spe`              → drop the line entirely when "ivs" is private
 *   `Adamant Nature`          → drop the line entirely when "nature" is private
 *
 * Moves, ability, tera type, level, shiny, and all other lines are
 * preserved — those are the "public shell" the ticket calls for.
 *
 * Pokemon names are detected as paste-block headers — the first line of
 * each block. We also drop trailing-empty-line cruft to keep the output
 * tidy.
 */

export type PrivateField = "evs" | "ivs" | "nature" | "item";

const ALL_PRIVATE_FIELDS: readonly PrivateField[] = ["evs", "ivs", "nature", "item"];

const VALID_FIELDS: ReadonlySet<string> = new Set(ALL_PRIVATE_FIELDS);

/**
 * Filter user input to known fields and dedupe — defends against URL-injected
 * garbage.
 *
 * `input` is typed `unknown` on purpose: it arrives from a JSONB column and
 * from URL state, so it can be anything. Absent/empty means "nothing private".
 * A present-but-malformed value (a string, a number, an object) must NOT
 * degrade to "nothing is private" — that silently disabled redaction for the
 * whole report, leaking exactly what the creator chose to hide. We fail closed
 * instead and treat every redactable field as private.
 */
export function normalizePrivateFields(input: unknown): PrivateField[] {
  if (input === undefined || input === null) return [];
  if (!Array.isArray(input)) return [...ALL_PRIVATE_FIELDS];
  if (input.length === 0) return [];
  const out = new Set<PrivateField>();
  for (const f of input) {
    if (typeof f === "string" && VALID_FIELDS.has(f)) out.add(f as PrivateField);
  }
  return Array.from(out);
}

const NATURE_LINE_RE = /\s+Nature\s*$/i;
const EV_LINE_RE = /^\s*EVs\s*:/i;
const IV_LINE_RE = /^\s*IVs\s*:/i;

export function redactPasteFields(paste: string, fields: readonly PrivateField[]): string {
  if (!paste || fields.length === 0) return paste;
  const fieldSet = new Set(fields);

  // We split on \n and rebuild line-by-line. Showdown pastes use \n
  // canonically; \r\n round-trips fine because we don't insert \r anywhere.
  const lines = paste.split("\n");
  const out: string[] = [];

  // The header line of a Pokemon block is the line after a blank line (or
  // the very first non-empty line). Items live on that header line, after
  // the @ separator. We need to track block boundaries to know which line
  // is a header.
  let atBlockStart = true;

  for (const line of lines) {
    if (line.trim() === "") {
      out.push(line);
      atBlockStart = true;
      continue;
    }

    if (atBlockStart) {
      // Header line. Strip "@ Item" suffix when item is private.
      if (fieldSet.has("item")) {
        const atIdx = line.indexOf("@");
        if (atIdx >= 0) {
          out.push(line.slice(0, atIdx).trimEnd());
        } else {
          out.push(line);
        }
      } else {
        out.push(line);
      }
      atBlockStart = false;
      continue;
    }

    // Body lines.
    if (fieldSet.has("evs") && EV_LINE_RE.test(line)) continue;
    if (fieldSet.has("ivs") && IV_LINE_RE.test(line)) continue;
    if (fieldSet.has("nature") && NATURE_LINE_RE.test(line)) continue;

    out.push(line);
  }

  return out.join("\n");
}

/**
 * Apply tiered-publishing redaction (VGC-142) to a report's data object.
 * If the data declares `privateFields`, strip those fields from the paste so
 * callers who are not entitled to the full report never see hidden spreads or
 * items. Returns the (copied, never mutated) data plus the list of fields that
 * were redacted, so the caller can show a "Some fields hidden by creator"
 * banner.
 *
 * This lives here rather than in a route so every reader of a report goes
 * through one call shape — the share GET, the team graphic and the fork route
 * each have to honour the same promise.
 */
export function applyPrivateFieldRedaction(data: Record<string, unknown>): {
  data: Record<string, unknown>;
  redactedFields: PrivateField[];
} {
  const fields = normalizePrivateFields(data.privateFields);
  if (fields.length === 0) return { data, redactedFields: [] };
  const paste = (data.paste as string) ?? "";
  const redacted = redactPasteFields(paste, fields);
  return {
    data: { ...data, paste: redacted },
    redactedFields: fields,
  };
}
