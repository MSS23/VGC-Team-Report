"use client";

import Link from "next/link";
import { I18nProvider, useTranslation } from "@/lib/i18n";

export default function NotFound() {
  return (
    <I18nProvider>
      <NotFoundContent />
    </I18nProvider>
  );
}

function NotFoundContent() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{t.pageNotFound}</h1>
        <p className="text-text-secondary text-sm max-w-xs">
          {t.pageNotFoundDesc}
        </p>
        <Link
          href="/"
          className="mt-2 px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors"
        >
          {t.goHome}
        </Link>
      </div>
    </main>
  );
}
