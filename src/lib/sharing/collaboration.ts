/** Stable content comparison across Postgres JSON key ordering and empty editor defaults. */
export function reportFingerprint(value: unknown): string {
  function normalize(input: unknown): unknown {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === "object") return Object.fromEntries(Object.entries(input)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, normalize(val)])
      .filter(([key, val]) => val !== undefined && val !== null && val !== "" && !(key === "allowComments" && val === false) && JSON.stringify(val) !== "{}" && JSON.stringify(val) !== "[]"));
    return input;
  }
  return JSON.stringify(normalize(value));
}

/** Appearance is supplied by separate browser theme/sprite stores, not the report editor. */
export function editorFingerprint(state: import("./url-codec").ShareableState): string {
  // These can legitimately differ on hydration of a legacy report without a pinned theme.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { genTheme, spriteSettings, ...content } = state;
  return reportFingerprint(content);
}

export interface EditingPresence {
  userId: string;
  name: string;
  section: string;
  field: string;
  caret: number | null;
}

/** Stable across plan reordering and strategy edits; only replacing the opponent starts a new thread. */
export function matchupSectionKey(paste: string): string {
  let hash = BigInt("0xcbf29ce484222325");
  for (const char of paste.replace(/\r/g, "").trim()) hash = BigInt.asUintN(64, (hash ^ BigInt(char.codePointAt(0)!)) * BigInt("0x100000001b3"));
  return `matchup:${hash.toString(16)}`;
}
