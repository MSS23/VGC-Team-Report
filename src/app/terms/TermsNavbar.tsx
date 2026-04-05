"use client";

import { useDarkMode } from "@/hooks/useDarkMode";
import { PageNavbar } from "@/components/layout/PageNavbar";
import { I18nProvider } from "@/lib/i18n";

export function TermsNavbar() {
  const { darkMode, setDarkMode } = useDarkMode();
  return (
    <I18nProvider>
      <PageNavbar darkMode={darkMode} onToggleDarkMode={() => setDarkMode(!darkMode)} activePage="terms" />
    </I18nProvider>
  );
}
