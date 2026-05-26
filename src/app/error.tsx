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
    <main className="min-h-dvh min-h-screen flex items-center justify-center p-6 safe-bottom safe-top">
      <div role="alert" className="flex flex-col items-center gap-5 text-center animate-fade-in max-w-xs">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <svg aria-hidden="true" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary">{t.somethingWentWrong}</h1>
        <p className="text-text-secondary text-sm leading-relaxed">
          {t.unexpectedError}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={reset}
            className="px-6 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:brightness-110 active:scale-[0.97] transition-all shadow-sm shadow-accent/20"
          >
            {t.tryAgain}
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-surface border border-border text-text-primary rounded-2xl font-bold text-sm hover:bg-surface-alt active:scale-[0.97] transition-all"
          >
            {t.goHome}
          </a>
        </div>
      </div>
    </main>
  );
}
