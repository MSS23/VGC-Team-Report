"use client";

import { MOVE_NAMES } from "@/lib/data/move-names";
import type { LanguageCode } from "@/lib/i18n";

function normalizeMoveName(moveName: string): string {
  return moveName
    .trim()
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const MOVE_NAMES_BY_NORMALIZED_NAME = new Map(
  Object.entries(MOVE_NAMES).map(([name, translations]) => [
    normalizeMoveName(name),
    { name, translations },
  ]),
);

/**
 * Translate a move name from English to the target language.
 * Returns the English name if no translation is available.
 */
export function translateMove(englishName: string, lang: LanguageCode): string {
  if (lang === "en") return englishName.trim();

  const match = MOVE_NAMES_BY_NORMALIZED_NAME.get(normalizeMoveName(englishName));
  return match?.translations[lang] ?? match?.name ?? englishName.trim();
}
