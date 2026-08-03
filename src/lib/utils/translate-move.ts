"use client";

import { getLoadedMoveNames, loadMoveNames } from "@/lib/data/move-names";
import type { LanguageCode } from "@/lib/i18n";

function normalizeMoveName(moveName: string): string {
  return moveName
    .trim()
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Translate a move name from English to the target language.
 * Returns the English name if no translation is available.
 *
 * The locale tables are code-split (see `@/lib/data/move-names`). `I18nProvider`
 * loads the active language's table before it commits a language change, so by
 * the time a component renders in a non-English locale the table is present. If
 * a caller gets here first, the English name is rendered and the load is kicked
 * off so the next render is localised.
 */
export function translateMove(englishName: string, lang: LanguageCode): string {
  const trimmed = englishName.trim();
  if (lang === "en") return trimmed;

  const table = getLoadedMoveNames(lang);
  if (!table) {
    void loadMoveNames(lang);
    return trimmed;
  }

  return table.get(normalizeMoveName(trimmed)) ?? trimmed;
}
