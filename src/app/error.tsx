"use client";

import { I18nProvider, useTranslation } from "@/lib/i18n";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <I18nProvider>
      <ErrorContent error={error} reset={reset} />
    </I18nProvider>
  );
}

function ErrorContent({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">{t.somethingWentWrong}</h1>
        <p className="text-text-secondary text-sm max-w-xs">
          {t.unexpectedError}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 transition-colors"
          >
            {t.tryAgain}
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-surface border border-border text-text-primary rounded-xl font-semibold text-sm hover:bg-surface-alt transition-colors"
          >
            {t.goHome}
          </a>
        </div>
      </div>
    </main>
  );
}
