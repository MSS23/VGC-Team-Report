"use client";

import { MOVE_NAMES } from "@/lib/data/move-names";

/**
 * Translate a move name from English to the target language.
 * Returns the English name if no translation is available.
 */
export function translateMove(englishName: string, lang: string): string {
  if (lang === "en") return englishName;
  return MOVE_NAMES[englishName]?.[lang] ?? englishName;
}
