import { CHAMPIONS_SAMPLE_TEAMS } from "@/data/champions-sample-teams";

/**
 * Returns true if the given paste matches any built-in sample team.
 * Compares the first two non-blank lines (species + ability) — robust against
 * trailing-whitespace edits.
 *
 * Used by the share and draft save routes so users can't accidentally publish
 * a freshly-picked sample team (Kangaskhan, Groudon, Kyogre, etc.) before
 * making it their own.
 */
export function isSampleTeamPaste(paste: string): boolean {
  const trimmed = paste.trimStart();
  return CHAMPIONS_SAMPLE_TEAMS.some((team) => {
    const sampleHead = team.paste.trimStart().split("\n").slice(0, 2).join("\n");
    return trimmed.startsWith(sampleHead);
  });
}
