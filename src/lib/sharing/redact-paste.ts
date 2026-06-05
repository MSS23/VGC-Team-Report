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

type PrivateField = "evs" | "ivs" | "nature" | "item";

const VALID_FIELDS: ReadonlySet<string> = new Set(["evs", "ivs", "nature", "item"]);

/** Filter user input to known fields and dedupe — defends against URL-injected garbage. */
export function normalizePrivateFields(input: readonly string[] | undefined): PrivateField[] {
  if (!input || input.length === 0) return [];
  const out = new Set<PrivateField>();
  for (const f of input) {
    if (VALID_FIELDS.has(f)) out.add(f as PrivateField);
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
