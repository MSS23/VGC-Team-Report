"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import React from "react";
import en from "./translations/en";
import type { TranslationKeys } from "./translations/en";

// Supported languages — the 7 official Pokemon game languages
export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Francais", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "es", label: "Espanol", flag: "🇪🇸" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "vgc-report-lang";

// Lazy-load translation modules to avoid bundling all languages upfront
const translationLoaders: Record<LanguageCode, () => Promise<{ default: TranslationKeys }>> = {
  en: () => import("./translations/en"),
  fr: () => import("./translations/fr"),
  it: () => import("./translations/it"),
  es: () => import("./translations/es"),
  ja: () => import("./translations/ja"),
  ko: () => import("./translations/ko"),
  zh: () => import("./translations/zh"),
};

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: TranslationKeys;
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => {},
  t: en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [translations, setTranslations] = useState<TranslationKeys>(en);

  // Load saved language on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
    if (saved && translationLoaders[saved]) {
      setLanguageState(saved);
      if (saved !== "en") {
        translationLoaders[saved]().then((mod) => setTranslations(mod.default));
      }
    }
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
    if (code === "en") {
      setTranslations(en);
    } else {
      translationLoaders[code]().then((mod) => setTranslations(mod.default));
    }
    // Update html lang attribute
    document.documentElement.lang = code;
  }, []);

  const value = React.useMemo(
    () => ({ language, setLanguage, t: translations }),
    [language, setLanguage, translations]
  );

  return React.createElement(I18nContext.Provider, { value }, children);
}

export function useTranslation() {
  return useContext(I18nContext);
}
