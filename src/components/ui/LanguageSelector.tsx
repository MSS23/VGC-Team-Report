"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation, LANGUAGES } from "@/lib/i18n";
import type { LanguageCode } from "@/lib/i18n";

export function LanguageSelector() {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentLang = LANGUAGES.find((l) => l.code === language)!;
  const isEnglish = language === "en";

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border-2 border-border text-xs font-bold text-text-secondary hover:text-text-primary hover:border-border bg-surface-alt transition-all cursor-pointer"
        title={t.language}
        aria-label={t.language}
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="hidden sm:inline uppercase tracking-wider">{currentLang.code}</span>
        {!isEnglish && (
          <span className="inline-flex items-center px-1 py-px rounded text-[9px] font-extrabold uppercase tracking-widest bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 leading-none">
            {t.translationBeta}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-surface border border-border rounded-xl shadow-2xl py-1.5 min-w-[200px] animate-fade-in">
          <div className="px-3 py-1.5 mb-1 border-b border-border-subtle">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-text-tertiary">{t.language}</p>
          </div>
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === language;
            const isBeta = lang.code !== "en";
            return (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as LanguageCode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  isActive
                    ? "bg-accent-surface text-accent font-bold"
                    : "text-text-primary hover:bg-surface-alt"
                }`}
              >
                <span className="text-base leading-none">{lang.flag}</span>
                <span className="font-medium flex-1">{lang.label}</span>
                {isBeta && (
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    Beta
                  </span>
                )}
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
          <div className="px-3 py-2 mt-1 border-t border-border-subtle">
            <p className="text-[9px] text-text-tertiary leading-relaxed">
              English is fully supported. Other languages are in <span className="text-amber-600 dark:text-amber-400 font-bold">beta</span> and translations may contain inaccuracies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
